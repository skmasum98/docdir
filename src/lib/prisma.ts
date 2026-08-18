import bcrypt from "bcryptjs";
import {
  UserRole,
  DoctorStatus,
  Gender,
  ClaimStatus,
  BlogStatus,
  FacilityType,
} from "./enums";

export namespace Prisma {
  export type DoctorWhereInput = any;
  export type IntNullableFilter = any;
  export type StringFilter = any;
}

// Data Store Types
export interface UserRecord {
  id: number;
  name: string;
  email: string;
  password: string;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SpecialtyRecord {
  id: number;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DivisionRecord {
  id: number;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DistrictRecord {
  id: number;
  name: string;
  slug: string;
  divisionId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpazilaRecord {
  id: number;
  name: string;
  slug: string;
  districtId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FacilityRecord {
  id: number;
  name: string;
  slug: string;
  type: FacilityType;
  address: string | null;
  phone: string | null;
  upazilaId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DoctorRecord {
  id: number;
  userId: number | null;
  fullName: string;
  slug: string;
  profilePhoto: string | null;
  gender: Gender | null;
  bmdcNumber: string | null;
  experienceYears: number | null;
  consultationFee: number | null;
  about: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  facebook: string | null;
  linkedin: string | null;
  hospitalName: string | null;
  chamberAddress: string | null;
  city: string | null;
  area: string | null;
  isVerified: boolean;
  profileClaimed: boolean;
  createdByAdmin: boolean;
  status: DoctorStatus;
  specialtyId: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DoctorFacilityRecord {
  id: number;
  doctorId: number;
  facilityId: number;
  createdAt: Date;
}

export interface ReviewRecord {
  id: number;
  rating: number;
  comment: string | null;
  isApproved: boolean;
  doctorId: number;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DoctorClaimRecord {
  id: number;
  doctorId: number;
  userId: number;
  bmdcNumber: string | null;
  licenseImage: string | null;
  note: string | null;
  status: ClaimStatus;
  reviewedAt: Date | null;
  createdAt: Date;
}

export interface BlogRecord {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featuredImage: string | null;
  status: BlogStatus;
  authorId: number;
  doctorId: number | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Relation Types
export type SpecialtyWithRelations = SpecialtyRecord & {
  doctors?: DoctorWithRelations[];
  _count: { doctors: number };
};

export type UpazilaWithRelations = UpazilaRecord & {
  district: DistrictRecord & { division: DivisionRecord };
};

export type DistrictWithRelations = DistrictRecord & {
  division: DivisionRecord;
  upazilas: UpazilaRecord[];
};

export type DivisionWithRelations = DivisionRecord & {
  districts: (DistrictRecord & { upazilas: UpazilaRecord[] })[];
};

export type FacilityWithRelations = FacilityRecord & {
  upazila: UpazilaRecord & { district: DistrictRecord & { division: DivisionRecord } };
  doctorFacilities: (DoctorFacilityRecord & { doctor: DoctorWithRelations })[];
  _count: { doctorFacilities: number };
};

export type DoctorWithRelations = DoctorRecord & {
  specialty: SpecialtyRecord | null;
  user: UserRecord | null;
  doctorFacilities: (DoctorFacilityRecord & { facility: FacilityWithRelations })[];
  reviews: (ReviewRecord & { user: UserRecord })[];
  claims: DoctorClaimRecord[];
};

export type ReviewWithRelations = ReviewRecord & {
  doctor: DoctorRecord;
  user: UserRecord;
};

export type DoctorClaimWithRelations = DoctorClaimRecord & {
  doctor: DoctorRecord;
  user: UserRecord;
};

export type BlogWithRelations = BlogRecord & {
  author: UserRecord;
  doctor: DoctorRecord | null;
};

export type UserWithRelations = UserRecord & {
  doctor?: DoctorRecord | null;
  claims?: DoctorClaimRecord[];
  reviews?: ReviewRecord[];
  blogs?: BlogRecord[];
};

// Global in-memory storage (survives hot reloads)
interface MemoryStore {
  users: UserRecord[];
  specialties: SpecialtyRecord[];
  divisions: DivisionRecord[];
  districts: DistrictRecord[];
  upazilas: UpazilaRecord[];
  facilities: FacilityRecord[];
  doctors: DoctorRecord[];
  doctorFacilities: DoctorFacilityRecord[];
  reviews: ReviewRecord[];
  doctorClaims: DoctorClaimRecord[];
  blogs: BlogRecord[];
  ids: Record<string, number>;
}

const globalForStore = globalThis as unknown as { __docDirStore?: MemoryStore };

function initStore(): MemoryStore {
  if (globalForStore.__docDirStore) {
    return globalForStore.__docDirStore;
  }

  const now = new Date();
  const hashedPassword = bcrypt.hashSync("Admin123@", 10);

  const users: UserRecord[] = [
    {
      id: 1,
      name: "Super Admin",
      email: "admin@doctordirectory.com",
      password: hashedPassword,
      phone: "01900000000",
      role: UserRole.ADMIN,
      isActive: true,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 2,
      name: "Dr. Asma Rahman",
      email: "asma@neuro.com",
      password: hashedPassword,
      phone: "01912340000",
      role: UserRole.DOCTOR,
      isActive: true,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 3,
      name: "Dr. Arif Khan",
      email: "arif@citygeneral.com",
      password: hashedPassword,
      phone: "01914560000",
      role: UserRole.DOCTOR,
      isActive: true,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 4,
      name: "Dr. Nabila Sultana",
      email: "nabila@futtalahealth.com",
      password: hashedPassword,
      phone: "01918760000",
      role: UserRole.DOCTOR,
      isActive: true,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 5,
      name: "Patient User",
      email: "patient@example.com",
      password: hashedPassword,
      phone: "01812345678",
      role: UserRole.PATIENT,
      isActive: true,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const specialties: SpecialtyRecord[] = [
    { id: 1, name: "Neurology", slug: "neurology", createdAt: now, updatedAt: now },
    { id: 2, name: "Cardiology", slug: "cardiology", createdAt: now, updatedAt: now },
    { id: 3, name: "Orthopedics", slug: "orthopedics", createdAt: now, updatedAt: now },
    { id: 4, name: "Pediatrics", slug: "pediatrics", createdAt: now, updatedAt: now },
    { id: 5, name: "General Medicine", slug: "general-medicine", createdAt: now, updatedAt: now },
  ];

  const divisions: DivisionRecord[] = [
    { id: 1, name: "Dhaka Division", slug: "dhaka", createdAt: now, updatedAt: now },
    { id: 2, name: "Chittagong Division", slug: "chittagong", createdAt: now, updatedAt: now },
  ];

  const districts: DistrictRecord[] = [
    { id: 1, name: "Dhaka District", slug: "dhaka", divisionId: 1, createdAt: now, updatedAt: now },
    { id: 2, name: "Sylhet District", slug: "sylhet", divisionId: 2, createdAt: now, updatedAt: now },
  ];

  const upazilas: UpazilaRecord[] = [
    { id: 1, name: "Mirpur Upazila", slug: "mirpur", districtId: 1, createdAt: now, updatedAt: now },
    { id: 2, name: "Futtala Upazila", slug: "futtala", districtId: 2, createdAt: now, updatedAt: now },
  ];

  const facilities: FacilityRecord[] = [
    {
      id: 1,
      name: "Dhaka Neuro Diagnostic Center",
      slug: "dhaka-neuro-diagnostic",
      type: FacilityType.DIAGNOSTIC,
      address: "12 Green Road, Mirpur",
      phone: "01910000000",
      upazilaId: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 2,
      name: "City General Hospital",
      slug: "city-general-hospital",
      type: FacilityType.HOSPITAL,
      address: "88 City Hospital Road, Mirpur",
      phone: "01920000000",
      upazilaId: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 3,
      name: "Futtala Health Center",
      slug: "futtala-health-center",
      type: FacilityType.HOSPITAL,
      address: "45 Health Avenue, Futtala",
      phone: "01730000000",
      upazilaId: 2,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const doctors: DoctorRecord[] = [
    {
      id: 1,
      userId: 2,
      fullName: "Dr. Asma Rahman",
      slug: "dr-asma-rahman",
      profilePhoto: null,
      gender: Gender.FEMALE,
      bmdcNumber: "A-12345",
      experienceYears: 10,
      consultationFee: 1200,
      about: "Experienced neurologist with an emphasis on stroke care and migraine management. Providing comprehensive neurological assessments.",
      phone: "01912340000",
      email: "asma@neuro.com",
      website: "https://neuro.example.com",
      facebook: null,
      linkedin: null,
      hospitalName: "Dhaka Neuro Diagnostic Center",
      chamberAddress: "12 Green Road, Mirpur",
      city: "Dhaka",
      area: "Mirpur",
      isVerified: true,
      profileClaimed: true,
      createdByAdmin: true,
      status: DoctorStatus.PUBLISHED,
      specialtyId: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 2,
      userId: 3,
      fullName: "Dr. Arif Khan",
      slug: "dr-arif-khan",
      profilePhoto: null,
      gender: Gender.MALE,
      bmdcNumber: "A-67890",
      experienceYears: 12,
      consultationFee: 1500,
      about: "Cardiologist focused on heart health, hypertension, and preventive cardiology. Specialized in non-invasive coronary care.",
      phone: "01914560000",
      email: "arif@citygeneral.com",
      website: null,
      facebook: null,
      linkedin: null,
      hospitalName: "City General Hospital",
      chamberAddress: "88 City Hospital Road, Mirpur",
      city: "Dhaka",
      area: "Mirpur",
      isVerified: true,
      profileClaimed: true,
      createdByAdmin: true,
      status: DoctorStatus.PUBLISHED,
      specialtyId: 2,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 3,
      userId: 4,
      fullName: "Dr. Nabila Sultana",
      slug: "dr-nabila-sultana",
      profilePhoto: null,
      gender: Gender.FEMALE,
      bmdcNumber: "A-54321",
      experienceYears: 8,
      consultationFee: 1100,
      about: "General physician and pediatric clinician serving families in Futtala and surrounding areas with dedicated outpatient care.",
      phone: "01918760000",
      email: "nabila@futtalahealth.com",
      website: null,
      facebook: null,
      linkedin: null,
      hospitalName: "Futtala Health Center",
      chamberAddress: "45 Health Avenue, Futtala",
      city: "Sylhet",
      area: "Futtala",
      isVerified: true,
      profileClaimed: true,
      createdByAdmin: true,
      status: DoctorStatus.PUBLISHED,
      specialtyId: 4,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const doctorFacilities: DoctorFacilityRecord[] = [
    { id: 1, doctorId: 1, facilityId: 1, createdAt: now },
    { id: 2, doctorId: 2, facilityId: 2, createdAt: now },
    { id: 3, doctorId: 3, facilityId: 3, createdAt: now },
  ];

  const reviews: ReviewRecord[] = [
    {
      id: 1,
      rating: 5,
      comment: "Dr. Asma was extremely helpful and listened carefully to all my symptoms.",
      isApproved: true,
      doctorId: 1,
      userId: 5,
      createdAt: new Date(Date.now() - 86400000 * 2),
      updatedAt: now,
    },
    {
      id: 2,
      rating: 5,
      comment: "Great experience with Dr. Arif Khan. Very thorough examination and clear advice.",
      isApproved: true,
      doctorId: 2,
      userId: 5,
      createdAt: new Date(Date.now() - 86400000 * 5),
      updatedAt: now,
    },
  ];

  const doctorClaims: DoctorClaimRecord[] = [];
  const blogs: BlogRecord[] = [];

  const store: MemoryStore = {
    users,
    specialties,
    divisions,
    districts,
    upazilas,
    facilities,
    doctors,
    doctorFacilities,
    reviews,
    doctorClaims,
    blogs,
    ids: {
      users: 10,
      specialties: 10,
      divisions: 10,
      districts: 10,
      upazilas: 10,
      facilities: 10,
      doctors: 10,
      doctorFacilities: 10,
      reviews: 10,
      doctorClaims: 10,
      blogs: 10,
    },
  };

  globalForStore.__docDirStore = store;
  return store;
}

const store = initStore();

function matchesFilter(val: any, filter: any): boolean {
  if (filter === undefined) return true;
  if (filter === null) return val === null;

  if (typeof filter === "object" && filter !== null) {
    if (filter instanceof Date) {
      return val instanceof Date && val.getTime() === filter.getTime();
    }
    if (Array.isArray(filter)) {
      return Array.isArray(val) && JSON.stringify(val) === JSON.stringify(filter);
    }
    let ok = true;
    if ("equals" in filter) {
      ok = ok && val === filter.equals;
    }
    if ("contains" in filter && typeof val === "string") {
      ok = ok && val.toLowerCase().includes(String(filter.contains).toLowerCase());
    }
    if ("gte" in filter && typeof val === "number") {
      ok = ok && val >= filter.gte;
    }
    if ("lte" in filter && typeof val === "number") {
      ok = ok && val <= filter.lte;
    }
    if ("in" in filter && Array.isArray(filter.in)) {
      ok = ok && filter.in.includes(val);
    }
    return ok;
  }

  return val === filter;
}

function matchesWhere(item: any, where: any, modelName?: string): boolean {
  if (!where || Object.keys(where).length === 0) return true;

  if (where.OR && Array.isArray(where.OR)) {
    const orMatches = where.OR.some((subWhere: any) => matchesWhere(item, subWhere, modelName));
    if (!orMatches) return false;
  }

  if (where.AND && Array.isArray(where.AND)) {
    const andMatches = where.AND.every((subWhere: any) => matchesWhere(item, subWhere, modelName));
    if (!andMatches) return false;
  }

  for (const [key, filter] of Object.entries(where)) {
    if (key === "OR" || key === "AND" || key === "NOT") continue;

    // Compound unique keys like doctorId_facilityId
    if (key === "doctorId_facilityId" && typeof filter === "object" && filter !== null) {
      const f = filter as any;
      if (item.doctorId !== f.doctorId || item.facilityId !== f.facilityId) {
        return false;
      }
      continue;
    }

    // Relation filters on Doctor
    if (modelName === "doctor") {
      if (key === "specialty" && typeof filter === "object" && filter !== null) {
        const spec = store.specialties.find((s) => s.id === item.specialtyId);
        if (!spec || !matchesWhere(spec, filter, "specialty")) return false;
        continue;
      }
      if (key === "doctorFacilities" && typeof filter === "object" && filter !== null) {
        const dfList = store.doctorFacilities.filter((df) => df.doctorId === item.id);
        const fAny = filter as any;
        if (fAny.some) {
          const someMatches = dfList.some((df) => {
            const fac = store.facilities.find((f) => f.id === df.facilityId);
            if (!fac) return false;
            if (fAny.some.facility) {
              const facWhere = fAny.some.facility;
              if (facWhere.slug && fac.slug !== facWhere.slug) return false;
              if (facWhere.upazila) {
                const up = store.upazilas.find((u) => u.id === fac.upazilaId);
                if (!up) return false;
                const upWhere = facWhere.upazila;
                if (upWhere.slug && up.slug !== upWhere.slug) return false;
                if (upWhere.district) {
                  const dist = store.districts.find((d) => d.id === up.districtId);
                  if (!dist) return false;
                  const distWhere = upWhere.district;
                  if (distWhere.slug && dist.slug !== distWhere.slug) return false;
                  if (distWhere.division) {
                    const div = store.divisions.find((v) => v.id === dist.divisionId);
                    if (!div) return false;
                    if (distWhere.division.slug && div.slug !== distWhere.division.slug) return false;
                  }
                }
              }
            }
            return true;
          });
          if (!someMatches) return false;
        }
        continue;
      }
    }

    // Relation filters on Upazila / Facility / District
    if (modelName === "facility" && key === "upazila" && typeof filter === "object" && filter !== null) {
      const up = store.upazilas.find((u) => u.id === item.upazilaId);
      if (!up || !matchesWhere(up, filter, "upazila")) return false;
      continue;
    }

    if (modelName === "upazila" && key === "district" && typeof filter === "object" && filter !== null) {
      const dist = store.districts.find((d) => d.id === item.districtId);
      if (!dist || !matchesWhere(dist, filter, "district")) return false;
      continue;
    }

    if (!matchesFilter(item[key], filter)) {
      return false;
    }
  }

  return true;
}

// Hydration helpers for relations
function hydrateDoctor(doc: DoctorRecord, include?: any, select?: any, depth = 0): any {
  if (!doc) return null;
  const result: any = { ...doc };

  const spec = store.specialties.find((s) => s.id === doc.specialtyId) || null;
  result.specialty = spec
    ? select?.specialty?.select
      ? filterSelect(spec, select.specialty.select)
      : spec
    : null;

  const u = store.users.find((user) => user.id === doc.userId) || null;
  result.user = u
    ? select?.user?.select
      ? filterSelect(u, select.user.select)
      : u
    : null;

  const dfList = store.doctorFacilities.filter((df) => df.doctorId === doc.id);
  if (depth < 2) {
    result.doctorFacilities = dfList.map((df) => {
      const dfObj: any = { ...df };
      const fac = store.facilities.find((f) => f.id === df.facilityId);
      dfObj.facility = fac ? hydrateFacility(fac, include?.doctorFacilities?.include?.facility?.include, include?.doctorFacilities?.include?.facility?.select, depth + 1) : null;
      return dfObj;
    });
  } else {
    result.doctorFacilities = dfList.map((df) => ({ ...df, facility: null }));
  }

  let revs = store.reviews.filter((r) => r.doctorId === doc.id);
  if (include?.reviews?.where) {
    revs = revs.filter((r) => matchesWhere(r, include.reviews.where, "review"));
  }
  if (include?.reviews?.orderBy?.createdAt === "desc") {
    revs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  result.reviews = revs.map((r) => hydrateReview(r, include?.reviews?.include));

  result.claims = store.doctorClaims.filter((c) => c.doctorId === doc.id);

  if (select) {
    return filterSelect(result, select);
  }
  return result;
}

function hydrateFacility(fac: FacilityRecord, include?: any, select?: any, depth = 0): any {
  if (!fac) return null;
  const result: any = { ...fac };

  const up = store.upazilas.find((u) => u.id === fac.upazilaId);
  result.upazila = up ? hydrateUpazila(up, include?.upazila?.include) : null;

  const dfList = store.doctorFacilities.filter((df) => df.facilityId === fac.id);
  if (depth < 2) {
    result.doctorFacilities = dfList.map((df) => {
      const dfObj: any = { ...df };
      const doc = store.doctors.find((d) => d.id === df.doctorId);
      dfObj.doctor = doc ? hydrateDoctor(doc, include?.doctorFacilities?.include?.doctor?.include, include?.doctorFacilities?.include?.doctor?.select, depth + 1) : null;
      return dfObj;
    });
  } else {
    result.doctorFacilities = dfList.map((df) => ({ ...df, doctor: null }));
  }

  result._count = {
    doctorFacilities: dfList.length,
  };

  if (select) {
    return filterSelect(result, select);
  }
  return result;
}

function hydrateUpazila(up: UpazilaRecord, include?: any): any {
  if (!up) return null;
  const result: any = { ...up };
  const dist = store.districts.find((d) => d.id === up.districtId);
  result.district = dist ? hydrateDistrict(dist, include?.district?.include) : null;
  return result;
}

function hydrateDistrict(dist: DistrictRecord, include?: any): any {
  if (!dist) return null;
  const result: any = { ...dist };
  result.division = store.divisions.find((d) => d.id === dist.divisionId) || null;
  result.upazilas = store.upazilas
    .filter((u) => u.districtId === dist.id)
    .sort((a, b) => a.name.localeCompare(b.name));
  return result;
}

function hydrateDivision(div: DivisionRecord, include?: any): any {
  if (!div) return null;
  const result: any = { ...div };
  const dists = store.districts.filter((d) => d.divisionId === div.id);
  if (include?.districts?.orderBy?.name === "asc") {
    dists.sort((a, b) => a.name.localeCompare(b.name));
  }
  result.districts = dists.map((d) => hydrateDistrict(d, include?.districts?.include));
  return result;
}

function hydrateReview(rev: ReviewRecord, include?: any): any {
  if (!rev) return null;
  const result: any = { ...rev };
  const doc = store.doctors.find((d) => d.id === rev.doctorId);
  result.doctor = doc
    ? include?.doctor?.select
      ? filterSelect(doc, include.doctor.select)
      : doc
    : null;
  const u = store.users.find((user) => user.id === rev.userId);
  result.user = u
    ? include?.user?.select
      ? filterSelect(u, include.user.select)
      : u
    : null;
  return result;
}

function hydrateDoctorClaim(claim: DoctorClaimRecord, include?: any): any {
  if (!claim) return null;
  const result: any = { ...claim };
  const doc = store.doctors.find((d) => d.id === claim.doctorId);
  result.doctor = doc
    ? include?.doctor?.select
      ? filterSelect(doc, include.doctor.select)
      : doc
    : null;
  const u = store.users.find((user) => user.id === claim.userId);
  result.user = u
    ? include?.user?.select
      ? filterSelect(u, include.user.select)
      : u
    : null;
  return result;
}

function hydrateBlog(blog: BlogRecord, include?: any): any {
  if (!blog) return null;
  const result: any = { ...blog };
  const u = store.users.find((user) => user.id === blog.authorId);
  result.author = u
    ? include?.author?.select
      ? filterSelect(u, include.author.select)
      : u
    : null;
  const d = store.doctors.find((doc) => doc.id === blog.doctorId);
  result.doctor = d
    ? include?.doctor?.select
      ? filterSelect(d, include.doctor.select)
      : d
    : null;
  return result;
}

function filterSelect(item: any, select: Record<string, boolean | object>): any {
  if (!item) return item;
  const result: any = {};
  for (const [k, v] of Object.entries(select)) {
    if (v) {
      result[k] = item[k];
    }
  }
  return result;
}

export interface ModelDelegate<TRecord, TRelations> {
  findUnique(args: { where: any; include?: any; select?: any }): Promise<TRelations | null>;
  findFirst(args?: { where?: any; include?: any; select?: any; orderBy?: any }): Promise<TRelations | null>;
  findMany(args?: { where?: any; include?: any; select?: any; orderBy?: any; skip?: number; take?: number }): Promise<TRelations[]>;
  count(args?: { where?: any }): Promise<number>;
  create(args: { data: any }): Promise<TRelations>;
  createMany(args: { data: any | any[] }): Promise<{ count: number }>;
  update(args: { where: any; data: any }): Promise<TRelations>;
  delete(args: { where: any }): Promise<TRelations>;
  deleteMany(args?: { where?: any }): Promise<{ count: number }>;
  upsert(args: { where: any; update: any; create: any }): Promise<TRelations>;
}

function createModelHandler<TRecord, TRelations>(
  list: any[],
  idKey: string,
  modelName: string,
  hydrator: (item: any, include?: any, select?: any) => TRelations
): ModelDelegate<TRecord, TRelations> {
  return {
    async findUnique({ where, include, select }: any) {
      const item = list.find((i) => matchesWhere(i, where, modelName));
      if (!item) return null;
      return hydrator(item, include, select);
    },

    async findFirst({ where, include, select, orderBy }: any) {
      let filtered = list.filter((i) => matchesWhere(i, where, modelName));
      if (orderBy) {
        filtered = sortItems(filtered, orderBy);
      }
      if (filtered.length === 0) return null;
      return hydrator(filtered[0], include, select);
    },

    async findMany(args?: any) {
      const { where, include, select, orderBy, skip, take } = args || {};
      let filtered = list.filter((i) => matchesWhere(i, where, modelName));

      if (orderBy) {
        filtered = sortItems(filtered, orderBy);
      }

      if (typeof skip === "number") {
        filtered = filtered.slice(skip);
      }
      if (typeof take === "number") {
        filtered = filtered.slice(0, take);
      }

      return filtered.map((item) => {
        let result: any = hydrator(item, include, select);
        if (include?._count?.select?.doctors && modelName === "specialty") {
          result = {
            ...result,
            _count: {
              doctors: store.doctors.filter((d) => d.specialtyId === item.id).length,
            },
          };
        }
        return result;
      });
    },

    async count({ where }: any = {}) {
      if (!where || Object.keys(where).length === 0) return list.length;
      return list.filter((i) => matchesWhere(i, where, modelName)).length;
    },

    async create({ data }: any) {
      store.ids[idKey] = (store.ids[idKey] || 0) + 1;
      const now = new Date();
      const newItem: any = {
        id: store.ids[idKey],
        createdAt: now,
        updatedAt: now,
        ...data,
      };

      if (data.doctorFacilities?.create && Array.isArray(data.doctorFacilities.create)) {
        delete newItem.doctorFacilities;
        data.doctorFacilities.create.forEach((df: any) => {
          store.ids.doctorFacilities = (store.ids.doctorFacilities || 0) + 1;
          store.doctorFacilities.push({
            id: store.ids.doctorFacilities,
            doctorId: newItem.id,
            facilityId: df.facilityId,
            createdAt: now,
          });
        });
      }

      list.push(newItem);
      return hydrator(newItem);
    },

    async createMany({ data }: any) {
      const items = Array.isArray(data) ? data : [data];
      const now = new Date();
      items.forEach((d) => {
        store.ids[idKey] = (store.ids[idKey] || 0) + 1;
        list.push({
          id: store.ids[idKey],
          createdAt: now,
          updatedAt: now,
          ...d,
        });
      });
      return { count: items.length };
    },

    async update({ where, data }: any) {
      const index = list.findIndex((i) => matchesWhere(i, where, modelName));
      if (index === -1) throw new Error(`${modelName} not found for update`);
      const existing = list[index];
      const updated = {
        ...existing,
        ...data,
        updatedAt: new Date(),
      };
      list[index] = updated;
      return hydrator(updated);
    },

    async delete({ where }: any) {
      const index = list.findIndex((i) => matchesWhere(i, where, modelName));
      if (index === -1) throw new Error(`${modelName} not found for delete`);
      const deleted = list.splice(index, 1)[0];
      return hydrator(deleted);
    },

    async deleteMany({ where }: any = {}) {
      const initialLen = list.length;
      if (!where || Object.keys(where).length === 0) {
        list.length = 0;
        return { count: initialLen };
      }
      for (let i = list.length - 1; i >= 0; i--) {
        if (matchesWhere(list[i], where, modelName)) {
          list.splice(i, 1);
        }
      }
      return { count: initialLen - list.length };
    },

    async upsert({ where, update, create }: any) {
      const existing = list.find((i) => matchesWhere(i, where, modelName));
      if (existing) {
        return this.update({ where, data: update });
      }
      return this.create({ data: create });
    },
  };
}

function sortItems(items: any[], orderBy: any): any[] {
  const result = [...items];
  const orderList = Array.isArray(orderBy) ? orderBy : [orderBy];

  result.sort((a, b) => {
    for (const ord of orderList) {
      for (const [key, dir] of Object.entries(ord)) {
        const valA = a[key];
        const valB = b[key];
        if (valA === valB) continue;
        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;
        if (valA instanceof Date && valB instanceof Date) {
          return dir === "desc" ? valB.getTime() - valA.getTime() : valA.getTime() - valB.getTime();
        }
        if (typeof valA === "string" && typeof valB === "string") {
          const cmp = valA.localeCompare(valB);
          return dir === "desc" ? -cmp : cmp;
        }
        if (typeof valA === "number" && typeof valB === "number") {
          return dir === "desc" ? valB - valA : valA - valB;
        }
        if (typeof valA === "boolean" && typeof valB === "boolean") {
          const numA = valA ? 1 : 0;
          const numB = valB ? 1 : 0;
          return dir === "desc" ? numB - numA : numA - numB;
        }
      }
    }
    return 0;
  });

  return result;
}

export const prisma = {
  user: createModelHandler<UserRecord, UserWithRelations>(store.users, "users", "user", (i, inc, sel) => {
    if (!i) return null as any;
    return sel ? filterSelect(i, sel) : i;
  }),
  specialty: createModelHandler<SpecialtyRecord, SpecialtyWithRelations>(store.specialties, "specialties", "specialty", (i, inc, sel) => {
    if (!i) return null as any;
    return sel ? filterSelect(i, sel) : i;
  }),
  division: createModelHandler<DivisionRecord, DivisionWithRelations>(store.divisions, "divisions", "division", (i, inc) => hydrateDivision(i, inc)),
  district: createModelHandler<DistrictRecord, DistrictWithRelations>(store.districts, "districts", "district", (i, inc) => hydrateDistrict(i, inc)),
  upazila: createModelHandler<UpazilaRecord, UpazilaWithRelations>(store.upazilas, "upazilas", "upazila", (i, inc) => hydrateUpazila(i, inc)),
  facility: createModelHandler<FacilityRecord, FacilityWithRelations>(store.facilities, "facilities", "facility", (i, inc, sel) => hydrateFacility(i, inc, sel)),
  doctor: createModelHandler<DoctorRecord, DoctorWithRelations>(store.doctors, "doctors", "doctor", (i, inc, sel) => hydrateDoctor(i, inc, sel)),
  doctorFacility: createModelHandler<DoctorFacilityRecord, DoctorFacilityRecord>(store.doctorFacilities, "doctorFacilities", "doctorFacility", (i) => i),
  review: createModelHandler<ReviewRecord, ReviewWithRelations>(store.reviews, "reviews", "review", (i, inc) => hydrateReview(i, inc)),
  doctorClaim: createModelHandler<DoctorClaimRecord, DoctorClaimWithRelations>(store.doctorClaims, "doctorClaims", "doctorClaim", (i, inc) => hydrateDoctorClaim(i, inc)),
  blog: createModelHandler<BlogRecord, BlogWithRelations>(store.blogs, "blogs", "blog", (i, inc) => hydrateBlog(i, inc)),

  async $transaction<T>(input: ((tx: any) => Promise<T>) | Promise<any>[]): Promise<any> {
    if (typeof input === "function") {
      return input(prisma);
    }
    if (Array.isArray(input)) {
      return Promise.all(input);
    }
    return input;
  },

  async $disconnect() {
    return Promise.resolve();
  },
};
