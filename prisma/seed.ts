import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const password = await bcrypt.hash("Admin123@", 10);

  await prisma.user.upsert({
    where: {
      email: "admin@doctordirectory.com",
    },
    update: {
      name: "Super Admin",
      password,
      role: "ADMIN",
      phone: "01900000000",
      emailVerified: true,
    },
    create: {
      name: "Super Admin",
      email: "admin@doctordirectory.com",
      password,
      role: "ADMIN",
      phone: "01900000000",
      emailVerified: true,
    },
  });

  const specialties = [
    { name: "Neurology", slug: "neurology" },
    { name: "Cardiology", slug: "cardiology" },
    { name: "Orthopedics", slug: "orthopedics" },
    { name: "Pediatrics", slug: "pediatrics" },
    { name: "General Medicine", slug: "general-medicine" },
  ];

  const specialtyRecords = await Promise.all(
    specialties.map((specialty) =>
      prisma.specialty.upsert({
        where: { slug: specialty.slug },
        update: { name: specialty.name },
        create: specialty,
      })
    )
  );

  const dhakaDivision = await prisma.division.upsert({
    where: { slug: "dhaka" },
    update: { name: "Dhaka Division" },
    create: { name: "Dhaka Division", slug: "dhaka" },
  });

  const chittagongDivision = await prisma.division.upsert({
    where: { slug: "chittagong" },
    update: { name: "Chittagong Division" },
    create: { name: "Chittagong Division", slug: "chittagong" },
  });

  const dhakaDistrict = await prisma.district.upsert({
    where: { slug: "dhaka" },
    update: { name: "Dhaka District", divisionId: dhakaDivision.id },
    create: { name: "Dhaka District", slug: "dhaka", divisionId: dhakaDivision.id },
  });

  const sylhetDistrict = await prisma.district.upsert({
    where: { slug: "sylhet" },
    update: { name: "Sylhet District", divisionId: chittagongDivision.id },
    create: { name: "Sylhet District", slug: "sylhet", divisionId: chittagongDivision.id },
  });

  const mirpurUpazila = await prisma.upazila.upsert({
    where: { slug: "mirpur" },
    update: { name: "Mirpur Upazila", districtId: dhakaDistrict.id },
    create: { name: "Mirpur Upazila", slug: "mirpur", districtId: dhakaDistrict.id },
  });

  const futtalaUpazila = await prisma.upazila.upsert({
    where: { slug: "futtala" },
    update: { name: "Futtala Upazila", districtId: sylhetDistrict.id },
    create: { name: "Futtala Upazila", slug: "futtala", districtId: sylhetDistrict.id },
  });

  const dhakaNeuroCenter = await prisma.facility.upsert({
    where: { slug: "dhaka-neuro-diagnostic" },
    update: {
      name: "Dhaka Neuro Diagnostic Center",
      type: "DIAGNOSTIC",
      address: "12 Green Road, Mirpur",
      phone: "01910000000",
      upazilaId: mirpurUpazila.id,
    },
    create: {
      name: "Dhaka Neuro Diagnostic Center",
      slug: "dhaka-neuro-diagnostic",
      type: "DIAGNOSTIC",
      address: "12 Green Road, Mirpur",
      phone: "01910000000",
      upazilaId: mirpurUpazila.id,
    },
  });

  const cityGeneralHospital = await prisma.facility.upsert({
    where: { slug: "city-general-hospital" },
    update: {
      name: "City General Hospital",
      type: "HOSPITAL",
      address: "88 City Hospital Road, Mirpur",
      phone: "01920000000",
      upazilaId: mirpurUpazila.id,
    },
    create: {
      name: "City General Hospital",
      slug: "city-general-hospital",
      type: "HOSPITAL",
      address: "88 City Hospital Road, Mirpur",
      phone: "01920000000",
      upazilaId: mirpurUpazila.id,
    },
  });

  const futtalaHealthCenter = await prisma.facility.upsert({
    where: { slug: "futtala-health-center" },
    update: {
      name: "Futtala Health Center",
      type: "HOSPITAL",
      address: "45 Health Avenue, Futtala",
      phone: "01730000000",
      upazilaId: futtalaUpazila.id,
    },
    create: {
      name: "Futtala Health Center",
      slug: "futtala-health-center",
      type: "HOSPITAL",
      address: "45 Health Avenue, Futtala",
      phone: "01730000000",
      upazilaId: futtalaUpazila.id,
    },
  });

  const neurologySpecialty = specialtyRecords.find((item) => item.slug === "neurology");
  const cardiologySpecialty = specialtyRecords.find((item) => item.slug === "cardiology");

  if (!neurologySpecialty || !cardiologySpecialty) {
    throw new Error("Specialties must be seeded before doctors.");
  }

  const drAsma = await prisma.doctor.upsert({
    where: { slug: "dr-asma-rahman" },
    update: {
      fullName: "Dr. Asma Rahman",
      specialtyId: neurologySpecialty.id,
      phone: "01912340000",
      email: "asma@neuro.com",
      experienceYears: 10,
      consultationFee: 1200,
      about: "Experienced neurologist with an emphasis on stroke care and migraine management.",
      hospitalName: "Dhaka Neuro Diagnostic Center",
      chamberAddress: "12 Green Road, Mirpur",
      status: "PUBLISHED",
    },
    create: {
      fullName: "Dr. Asma Rahman",
      slug: "dr-asma-rahman",
      specialtyId: neurologySpecialty.id,
      phone: "01912340000",
      email: "asma@neuro.com",
      experienceYears: 10,
      consultationFee: 1200,
      about: "Experienced neurologist with an emphasis on stroke care and migraine management.",
      hospitalName: "Dhaka Neuro Diagnostic Center",
      chamberAddress: "12 Green Road, Mirpur",
      status: "PUBLISHED",
    },
  });

  const drArif = await prisma.doctor.upsert({
    where: { slug: "dr-arif-khan" },
    update: {
      fullName: "Dr. Arif Khan",
      specialtyId: cardiologySpecialty.id,
      phone: "01914560000",
      email: "arif@citygeneral.com",
      experienceYears: 12,
      consultationFee: 1500,
      about: "Cardiologist focused on heart health, hypertension, and preventive cardiology.",
      hospitalName: "City General Hospital",
      chamberAddress: "88 City Hospital Road, Mirpur",
      status: "PUBLISHED",
    },
    create: {
      fullName: "Dr. Arif Khan",
      slug: "dr-arif-khan",
      specialtyId: cardiologySpecialty.id,
      phone: "01914560000",
      email: "arif@citygeneral.com",
      experienceYears: 12,
      consultationFee: 1500,
      about: "Cardiologist focused on heart health, hypertension, and preventive cardiology.",
      hospitalName: "City General Hospital",
      chamberAddress: "88 City Hospital Road, Mirpur",
      status: "PUBLISHED",
    },
  });

  const drNabila = await prisma.doctor.upsert({
    where: { slug: "dr-nabila-sultana" },
    update: {
      fullName: "Dr. Nabila Sultana",
      specialtyId: cardiologySpecialty.id,
      phone: "01918760000",
      email: "nabila@futtalahealth.com",
      experienceYears: 8,
      consultationFee: 1100,
      about: "General physician and pediatric clinician serving families in Futtala.",
      hospitalName: "Futtala Health Center",
      chamberAddress: "45 Health Avenue, Futtala",
      status: "PUBLISHED",
    },
    create: {
      fullName: "Dr. Nabila Sultana",
      slug: "dr-nabila-sultana",
      specialtyId: cardiologySpecialty.id,
      phone: "01918760000",
      email: "nabila@futtalahealth.com",
      experienceYears: 8,
      consultationFee: 1100,
      about: "General physician and pediatric clinician serving families in Futtala.",
      hospitalName: "Futtala Health Center",
      chamberAddress: "45 Health Avenue, Futtala",
      status: "PUBLISHED",
    },
  });

  await prisma.doctorFacility.upsert({
    where: { doctorId_facilityId: { doctorId: drAsma.id, facilityId: dhakaNeuroCenter.id } },
    update: {},
    create: { doctorId: drAsma.id, facilityId: dhakaNeuroCenter.id },
  });

  await prisma.doctorFacility.upsert({
    where: { doctorId_facilityId: { doctorId: drArif.id, facilityId: cityGeneralHospital.id } },
    update: {},
    create: { doctorId: drArif.id, facilityId: cityGeneralHospital.id },
  });

  await prisma.doctorFacility.upsert({
    where: { doctorId_facilityId: { doctorId: drNabila.id, facilityId: futtalaHealthCenter.id } },
    update: {},
    create: { doctorId: drNabila.id, facilityId: futtalaHealthCenter.id },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });