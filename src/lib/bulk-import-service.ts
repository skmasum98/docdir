import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import { DoctorStatus, FacilityType } from "@/lib/enums";

export type BulkDoctorRow = {
  fullName: string;
  degrees?: string | null;
  specialty?: string | null;
  institute?: string | null;
  address?: string | null;
  area?: string | null;
  upazila?: string | null;
  district?: string | null;
  division?: string | null;
  phone?: string | null;
  hotline?: string | null;
  appointmentPhone?: string | null;
  email?: string | null;
  consultationFee?: number | string | null;
  bmdcNumber?: string | null;
  experienceYears?: number | string | null;
  gender?: "MALE" | "FEMALE" | "OTHER" | null;
};

export type BulkImportOptions = {
  duplicateAction: "skip" | "update";
  defaultStatus: "PUBLISHED" | "DRAFT";
  defaultVerified: boolean;
  createMissingSpecialties: boolean;
  createMissingFacilities: boolean;
  createMissingLocations: boolean;
};

export type BulkImportResult = {
  totalReceived: number;
  inserted: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: Array<{ rowNumber: number; doctorName?: string; error: string }>;
  timeTakenMs: number;
};

// Clean and normalize strings for matching
function norm(str?: string | null): string {
  if (!str) return "";
  return str.trim().toLowerCase();
}

function cleanName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

export class BulkImportService {
  /**
   * Process a chunk of doctor rows with in-memory caching to minimize database query overhead
   */
  static async importBatch(
    rows: BulkDoctorRow[],
    options: BulkImportOptions = {
      duplicateAction: "skip",
      defaultStatus: "PUBLISHED",
      defaultVerified: false,
      createMissingSpecialties: true,
      createMissingFacilities: true,
      createMissingLocations: true,
    },
    startRowIndex = 1
  ): Promise<BulkImportResult> {
    const startTime = Date.now();
    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;
    const errors: Array<{ rowNumber: number; doctorName?: string; error: string }> = [];

    if (!rows || rows.length === 0) {
      return {
        totalReceived: 0,
        inserted: 0,
        updated: 0,
        skipped: 0,
        failed: 0,
        errors: [],
        timeTakenMs: 0,
      };
    }

    try {
      // 1. Preload Geographies, Specialties, and Facilities into in-memory maps
      const [divisions, districts, upazilas, specialties, facilities] = await Promise.all([
        prisma.division.findMany({ select: { id: true, name: true, slug: true } }),
        prisma.district.findMany({ select: { id: true, name: true, slug: true, divisionId: true } }),
        prisma.upazila.findMany({ select: { id: true, name: true, slug: true, districtId: true } }),
        prisma.specialty.findMany({ select: { id: true, name: true, slug: true } }),
        prisma.facility.findMany({
          select: { id: true, name: true, slug: true, upazilaId: true, phone: true, hotline: true },
        }),
      ]);

      // Cache Maps
      const divisionMap = new Map<string, { id: number; name: string; slug: string }>();
      for (const d of divisions) {
        divisionMap.set(norm(d.name), d);
        divisionMap.set(norm(d.slug), d);
      }

      const districtMap = new Map<string, { id: number; name: string; slug: string; divisionId: number }>();
      for (const d of districts) {
        districtMap.set(norm(d.name), d);
        districtMap.set(norm(d.slug), d);
      }

      const upazilaMap = new Map<string, { id: number; name: string; slug: string; districtId: number }>();
      for (const u of upazilas) {
        upazilaMap.set(norm(u.name), u);
        upazilaMap.set(norm(u.slug), u);
      }

      const specialtyMap = new Map<string, { id: number; name: string; slug: string }>();
      for (const s of specialties) {
        specialtyMap.set(norm(s.name), s);
        specialtyMap.set(norm(s.slug), s);
      }

      const facilityMap = new Map<
        string,
        { id: number; name: string; slug: string; upazilaId: number; phone: string | null; hotline: string | null }
      >();
      for (const f of facilities) {
        facilityMap.set(norm(f.name), f);
        facilityMap.set(norm(f.slug), f);
      }

      // Default fallback division & district (Dhaka)
      let defaultDivision = divisionMap.get("dhaka") || divisionMap.get("dhaka division");
      if (!defaultDivision && options.createMissingLocations) {
        const created = await prisma.division.create({
          data: { name: "Dhaka Division", slug: "dhaka" },
        });
        defaultDivision = created;
        divisionMap.set("dhaka", created);
        divisionMap.set("dhaka division", created);
      }

      let defaultDistrict = districtMap.get("dhaka") || districtMap.get("dhaka district");
      if (!defaultDistrict && defaultDivision && options.createMissingLocations) {
        const created = await prisma.district.create({
          data: { name: "Dhaka District", slug: "dhaka", divisionId: defaultDivision.id },
        });
        defaultDistrict = created;
        districtMap.set("dhaka", created);
        districtMap.set("dhaka district", created);
      }

      // 2. Process each row sequentially within the chunk for integrity
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const currentRowNum = startRowIndex + i;

        const rawName = cleanName(row.fullName || "");
        if (!rawName) {
          failed++;
          errors.push({
            rowNumber: currentRowNum,
            error: "Missing required Doctor Name",
          });
          continue;
        }

        try {
          // A. Resolve or Create Specialty
          let specialtyId: number | null = null;
          const rawSpecialty = row.specialty?.trim();
          if (rawSpecialty) {
            const specKey = norm(rawSpecialty);
            let matchedSpec = specialtyMap.get(specKey);

            if (!matchedSpec && options.createMissingSpecialties) {
              const specSlug = slugify(rawSpecialty) || `spec-${Date.now()}`;
              // Double check DB in case created in current batch
              const existingInDb = await prisma.specialty.findFirst({
                where: { OR: [{ name: rawSpecialty }, { slug: specSlug }] },
              });
              if (existingInDb) {
                matchedSpec = existingInDb;
              } else {
                matchedSpec = await prisma.specialty.create({
                  data: {
                    name: rawSpecialty,
                    slug: specSlug,
                  },
                });
              }
              specialtyMap.set(specKey, matchedSpec);
              specialtyMap.set(norm(matchedSpec.slug), matchedSpec);
            }

            if (matchedSpec) {
              specialtyId = matchedSpec.id;
            }
          }

          // B. Resolve or Create Location (District -> Upazila)
          let upazilaId: number | null = null;
          const rawDistrict = row.district?.trim();
          const rawUpazila = row.upazila?.trim();

          let targetDistrict = defaultDistrict;
          if (rawDistrict) {
            const distKey = norm(rawDistrict);
            const foundDist = districtMap.get(distKey) || districtMap.get(`${distKey} district`);
            if (foundDist) {
              targetDistrict = foundDist;
            } else if (options.createMissingLocations && defaultDivision) {
              const distSlug = slugify(rawDistrict) || `dist-${Date.now()}`;
              const createdDist = await prisma.district.create({
                data: {
                  name: rawDistrict.includes("District") ? rawDistrict : `${rawDistrict} District`,
                  slug: distSlug,
                  divisionId: defaultDivision.id,
                },
              });
              targetDistrict = createdDist;
              districtMap.set(distKey, createdDist);
              districtMap.set(norm(createdDist.slug), createdDist);
            }
          }

          if (rawUpazila && targetDistrict) {
            const upKey = norm(rawUpazila);
            let matchedUp = upazilaMap.get(upKey) || upazilaMap.get(`${upKey} thana`) || upazilaMap.get(`${upKey} upazila`);

            if (!matchedUp && options.createMissingLocations) {
              const upSlug = slugify(rawUpazila) || `up-${Date.now()}`;
              const existingUp = await prisma.upazila.findFirst({
                where: { OR: [{ name: rawUpazila }, { slug: upSlug }] },
              });
              if (existingUp) {
                matchedUp = existingUp;
              } else {
                matchedUp = await prisma.upazila.create({
                  data: {
                    name: rawUpazila,
                    slug: upSlug,
                    districtId: targetDistrict.id,
                  },
                });
              }
              upazilaMap.set(upKey, matchedUp);
              upazilaMap.set(norm(matchedUp.slug), matchedUp);
            }

            if (matchedUp) {
              upazilaId = matchedUp.id;
            }
          }

          // If no upazila was found, use first available upazila or create a generic one
          if (!upazilaId && targetDistrict && options.createMissingLocations) {
            const fallbackKey = "central";
            let fallbackUp = upazilaMap.get(fallbackKey);
            if (!fallbackUp) {
              fallbackUp = await prisma.upazila.upsert({
                where: { slug: "central-area" },
                update: {},
                create: {
                  name: "Central",
                  slug: "central-area",
                  districtId: targetDistrict.id,
                },
              });
              upazilaMap.set(fallbackKey, fallbackUp);
            }
            upazilaId = fallbackUp.id;
          }

          // C. Resolve or Create Facility / Institute
          let facilityId: number | null = null;
          const rawInstitute = row.institute?.trim();
          const rawPhone = row.phone?.trim() || row.hotline?.trim() || null;

          if (rawInstitute && upazilaId) {
            const instKey = norm(rawInstitute);
            let matchedFac = facilityMap.get(instKey);

            if (!matchedFac && options.createMissingFacilities) {
              const facSlug = slugify(rawInstitute) || `fac-${Date.now()}`;
              const existingFac = await prisma.facility.findFirst({
                where: { OR: [{ name: rawInstitute }, { slug: facSlug }] },
              });

              if (existingFac) {
                matchedFac = existingFac;
                if (rawPhone && (!existingFac.phone || !existingFac.hotline)) {
                  await prisma.facility.update({
                    where: { id: existingFac.id },
                    data: {
                      phone: existingFac.phone || rawPhone,
                      hotline: existingFac.hotline || rawPhone,
                    },
                  });
                }
              } else {
                // Determine facility type from name
                let fType: FacilityType = FacilityType.HOSPITAL;
                const lowerInst = rawInstitute.toLowerCase();
                if (lowerInst.includes("diagnostic") || lowerInst.includes("lab") || lowerInst.includes("imaging")) {
                  fType = FacilityType.DIAGNOSTIC;
                } else if (lowerInst.includes("consultation") || lowerInst.includes("chamber")) {
                  fType = FacilityType.CHAMBER;
                } else if (lowerInst.includes("clinic") || lowerInst.includes("center") || lowerInst.includes("centre")) {
                  fType = FacilityType.CLINIC;
                }

                matchedFac = await prisma.facility.create({
                  data: {
                    name: rawInstitute,
                    slug: facSlug,
                    type: fType,
                    address: row.address?.trim() || null,
                    phone: rawPhone,
                    hotline: rawPhone,
                    upazilaId,
                  },
                });
              }

              facilityMap.set(instKey, matchedFac);
              facilityMap.set(norm(matchedFac.slug), matchedFac);
            } else if (matchedFac && rawPhone) {
              // Update facility phone if not set
              if (!matchedFac.phone || !(matchedFac as any).hotline) {
                await prisma.facility.update({
                  where: { id: matchedFac.id },
                  data: {
                    phone: matchedFac.phone || rawPhone,
                    hotline: (matchedFac as any).hotline || rawPhone,
                  },
                }).catch(() => {});
              }
            }

            if (matchedFac) {
              facilityId = matchedFac.id;
            }
          }

          // D. Check for Existing Doctor by (BMDC Number) or (FullName + degrees/specialty)
          let existingDoctor = null;
          const bmdc = row.bmdcNumber?.trim() || null;
          if (bmdc) {
            existingDoctor = await prisma.doctor.findUnique({
              where: { bmdcNumber: bmdc },
            });
          }

          if (!existingDoctor) {
            // Find by matching full name and specialty
            existingDoctor = await prisma.doctor.findFirst({
              where: {
                fullName: rawName,
                ...(specialtyId ? { specialtyId } : {}),
              },
            });
          }

          // E. Insert or Update
          if (existingDoctor) {
            if (options.duplicateAction === "skip") {
              skipped++;
              // Still ensure DoctorFacility association exists if facility was resolved
              if (facilityId) {
                await prisma.doctorFacility.upsert({
                  where: {
                    doctorId_facilityId: {
                      doctorId: existingDoctor.id,
                      facilityId,
                    },
                  },
                  update: {},
                  create: {
                    doctorId: existingDoctor.id,
                    facilityId,
                  },
                });
              }
              continue;
            } else {
              // Update existing doctor
              await prisma.doctor.update({
                where: { id: existingDoctor.id },
                data: {
                  degrees: row.degrees?.trim() || existingDoctor.degrees,
                  specialtyId: specialtyId || existingDoctor.specialtyId,
                  hospitalName: rawInstitute || existingDoctor.hospitalName,
                  chamberAddress: row.address?.trim() || existingDoctor.chamberAddress,
                  area: row.area?.trim() || existingDoctor.area,
                  city: row.district?.trim() || existingDoctor.city,
                  phone: rawPhone || existingDoctor.phone,
                  appointmentPhone: row.appointmentPhone?.trim() || rawPhone || existingDoctor.appointmentPhone,
                  email: row.email?.trim() || existingDoctor.email,
                  consultationFee:
                    row.consultationFee !== undefined && row.consultationFee !== null && row.consultationFee !== ""
                      ? Number(row.consultationFee)
                      : existingDoctor.consultationFee,
                },
              });

              if (facilityId) {
                await prisma.doctorFacility.upsert({
                  where: {
                    doctorId_facilityId: {
                      doctorId: existingDoctor.id,
                      facilityId,
                    },
                  },
                  update: {},
                  create: {
                    doctorId: existingDoctor.id,
                    facilityId,
                  },
                });
              }
              updated++;
            }
          } else {
            // Create New Doctor with deterministic unique slug
            const baseSlug = slugify(`dr-${rawName}`);
            const areaSlug = row.upazila ? `-${slugify(row.upazila)}` : "";
            let candidateSlug = `${baseSlug}${areaSlug}`;

            // Ensure unique slug
            const slugExists = await prisma.doctor.findUnique({
              where: { slug: candidateSlug },
            });
            if (slugExists) {
              candidateSlug = `${baseSlug}${areaSlug}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`;
            }

            const newDoc = await prisma.doctor.create({
              data: {
                fullName: rawName,
                slug: candidateSlug,
                degrees: row.degrees?.trim() || null,
                specialtyId,
                hospitalName: rawInstitute || null,
                chamberAddress: row.address?.trim() || null,
                area: row.area?.trim() || null,
                city: row.district?.trim() || "Dhaka",
                phone: rawPhone,
                appointmentPhone: row.appointmentPhone?.trim() || rawPhone,
                email: row.email?.trim() || null,
                bmdcNumber: bmdc,
                experienceYears:
                  row.experienceYears ? Number(row.experienceYears) || null : null,
                consultationFee:
                  row.consultationFee ? Number(row.consultationFee) || null : null,
                gender: row.gender || null,
                status: options.defaultStatus === "DRAFT" ? DoctorStatus.DRAFT : DoctorStatus.PUBLISHED,
                isVerified: options.defaultVerified,
                createdByAdmin: true,
              },
            });

            // Connect facility
            if (facilityId) {
              await prisma.doctorFacility.create({
                data: {
                  doctorId: newDoc.id,
                  facilityId,
                },
              });
            }

            inserted++;
          }
        } catch (rowErr: any) {
          failed++;
          errors.push({
            rowNumber: currentRowNum,
            doctorName: rawName,
            error: rowErr?.message || "Unknown error processing row",
          });
        }
      }
    } catch (batchErr: any) {
      return {
        totalReceived: rows.length,
        inserted,
        updated,
        skipped,
        failed: failed + (rows.length - (inserted + updated + skipped)),
        errors: [
          ...errors,
          {
            rowNumber: startRowIndex,
            error: `Critical batch failure: ${batchErr?.message || "Internal error"}`,
          },
        ],
        timeTakenMs: Date.now() - startTime,
      };
    }

    return {
      totalReceived: rows.length,
      inserted,
      updated,
      skipped,
      failed,
      errors,
      timeTakenMs: Date.now() - startTime,
    };
  }
}
