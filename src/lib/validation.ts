import { z } from "zod";
import { Gender, DoctorStatus, FacilityType, BlogStatus, ClaimStatus, UserRole } from "./enums";

export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Invalid email")
  .max(160);

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100);

export const phoneSchema = z
  .string()
  .trim()
  .min(7, "Phone is too short")
  .max(30)
  .optional()
  .or(z.literal(""));

export const nameSchema = z
  .string()
  .trim()
  .min(2, "Name is too short")
  .max(120);

export const registerSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    phone: phoneSchema,
    role: z.enum([UserRole.PATIENT, UserRole.DOCTOR]),
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1, "Password is required"),
  })
  .strict();

export const forgotPasswordSchema = z
  .object({
    identifier: z.string().trim().min(3, "Please enter your email or phone number").max(160),
    method: z.enum(["EMAIL", "WHATSAPP"]).default("EMAIL"),
  })
  .strict();

export const otpSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "OTP must be 6 digits")
  .length(6, "OTP must be exactly 6 digits");

export const resetPasswordSchema = z
  .object({
    identifier: z.string().trim().min(3, "Email or phone is required").max(160),
    otp: otpSchema,
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Booking input validation
export const bookAppointmentSchema = z.object({
  slotId: z.coerce.number().int().positive("Invalid slot"),
  patientName: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .regex(/^[\p{L}\s'.-]+$/u, "Name contains invalid characters"),
  patientPhone: z
    .string()
    .trim()
    .min(10, "Phone number must be at least 10 digits")
    .max(20, "Phone number is too long")
    .regex(/^[+\d\s()-]+$/, "Phone number contains invalid characters"),
  patientEmail: z
    .string()
    .trim()
    .email("Invalid email")
    .max(160, "Email is too long")
    .optional()
    .or(z.literal("")),
  chiefComplaint: z
    .string()
    .trim()
    .max(500, "Description is too long (max 500 characters)")
    .optional()
    .or(z.literal("")),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match",
    path: ["confirmPassword"],
  });

export const specialtySchema = z.object({
  name: z.string().trim().min(2).max(80),
});

export const doctorCreateSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  degrees: z.string().trim().max(500).optional().or(z.literal("")),
  designation: z.string().trim().max(160).optional().or(z.literal("")),
  gender: z.nativeEnum(Gender).optional(),
  bmdcNumber: z.string().trim().max(60).optional().or(z.literal("")),
  experienceYears: z.coerce.number().int().min(0).max(80).optional(),
  consultationFee: z.coerce.number().int().min(0).max(1_000_000).optional(),
  followUpFee: z.coerce.number().int().min(0).max(1_000_000).optional(),
  visitingHours: z.string().trim().max(500).optional().or(z.literal("")),
  services: z.string().trim().max(2000).optional().or(z.literal("")),
  about: z.string().trim().max(4000).optional().or(z.literal("")),
  phone: phoneSchema,
  appointmentPhone: phoneSchema,
  email: z.string().trim().email().max(160).optional().or(z.literal("")),
  website: z.string().trim().url().max(300).optional().or(z.literal("")),
  facebook: z.string().trim().max(300).optional().or(z.literal("")),
  linkedin: z.string().trim().max(300).optional().or(z.literal("")),
  hospitalName: z.string().trim().max(160).optional().or(z.literal("")),
  chamberAddress: z.string().trim().max(500).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  area: z.string().trim().max(80).optional().or(z.literal("")),
  specialtyId: z.coerce.number().int().positive().optional(),
  isVerified: z.coerce.boolean().optional(),
  status: z.nativeEnum(DoctorStatus).optional(),
  facilityIds: z.array(z.coerce.number().int().positive()).optional(),
});

export type DoctorCreateInput = z.infer<typeof doctorCreateSchema>;

export const doctorUpdateSchema = doctorCreateSchema.partial();

export const doctorSelfUpdateSchema = doctorCreateSchema
  .omit({
    isVerified: true,
    status: true,
  })
  .partial();

export type DoctorSelfUpdateInput = z.infer<typeof doctorSelfUpdateSchema>;

export const reviewSchema = z.object({
  doctorId: z.coerce.number().int().positive(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const claimCreateSchema = z.object({
  doctorId: z.coerce.number().int().positive(),
  bmdcNumber: z.string().trim().max(60).optional().or(z.literal("")),
  licenseImage: z.string().trim().max(500).optional().or(z.literal("")),
  note: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const facilityClaimCreateSchema = z.object({
  facilityId: z.coerce.number().int().positive(),
  officialPhone: z.string().trim().min(5, "Official contact number is required").max(50),
  officialEmail: z.string().trim().email("Valid work email is required").max(160).optional().or(z.literal("")),
  designation: z.string().trim().min(2, "Your role / designation is required").max(120),
  tradeLicenseNumber: z.string().trim().max(100).optional().or(z.literal("")),
  tradeLicenseImage: z.string().trim().max(500).optional().or(z.literal("")),
  authorizationLetter: z.string().trim().max(500).optional().or(z.literal("")),
  note: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const facilityClaimDecisionSchema = z.object({
  claimId: z.coerce.number().int().positive(),
  status: z.nativeEnum(ClaimStatus),
});

export const claimDecisionSchema = z.object({
  claimId: z.coerce.number().int().positive(),
  status: z.nativeEnum(ClaimStatus),
});

export const reviewDecisionSchema = z.object({
  reviewId: z.coerce.number().int().positive(),
  isApproved: z.coerce.boolean(),
});

export const facilitySchema = z.object({
  name: z.string().trim().min(2).max(160),
  type: z.nativeEnum(FacilityType).optional(),
  logo: z.string().trim().max(1000).optional().or(z.literal("")),
  address: z.string().trim().max(500).optional().or(z.literal("")),
  phone: phoneSchema,
  hotline: phoneSchema,
  email: z.string().trim().email().max(160).optional().or(z.literal("")),
  website: z.string().trim().max(300).optional().or(z.literal("")),
  emergencyContact: phoneSchema,
  upazilaId: z.coerce.number().int().positive(),
});

export const facilityUpdateSchema = facilitySchema.partial();
export type FacilityInput = z.infer<typeof facilitySchema>;

export const facilitySelfUpdateSchema = z.object({
  name: z.string().trim().min(2).max(160).optional(),
  logo: z.string().trim().max(1000).optional().or(z.literal("")),
  phone: phoneSchema,
  hotline: phoneSchema,
  email: z.string().trim().email().max(160).optional().or(z.literal("")),
  website: z.string().trim().max(300).optional().or(z.literal("")),
  emergencyContact: phoneSchema,
  address: z.string().trim().max(500).optional().or(z.literal("")),
});

export const facilityTestSchema = z.object({
  facilityId: z.coerce.number().int().positive(),
  code: z.string().trim().min(1, "Test code is required").max(50),
  name: z.string().trim().min(2, "Test name is required").max(200),
  category: z.string().trim().min(1, "Category is required").max(100),
  price: z.coerce.number().int().min(0, "Price must be positive"),
  discountPrice: z.coerce.number().int().min(0).optional().or(z.literal("")),
  sampleType: z.string().trim().max(100).optional().or(z.literal("")),
  deliveryTime: z.string().trim().max(150).optional().or(z.literal("")),
  preparation: z.string().trim().max(1000).optional().or(z.literal("")),
  homeSampleAvailable: z.coerce.boolean().optional(),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  isActive: z.coerce.boolean().optional(),
});

export const facilityTestUpdateSchema = facilityTestSchema.partial();
export type FacilityTestInput = z.infer<typeof facilityTestSchema>;

export const divisionSchema = z.object({
  name: z.string().trim().min(2).max(80),
});

export const districtSchema = z.object({
  name: z.string().trim().min(2).max(80),
  divisionId: z.coerce.number().int().positive(),
});

export const upazilaSchema = z.object({
  name: z.string().trim().min(2).max(80),
  districtId: z.coerce.number().int().positive(),
});

export const blogSchema = z.object({
  title: z.string().trim().min(2).max(200),
  excerpt: z.string().trim().max(500).optional().or(z.literal("")),
  content: z.string().trim().min(10),
  status: z.nativeEnum(BlogStatus).optional(),
  doctorId: z.coerce.number().int().positive().optional(),
});

export const userUpdateSchema = z.object({
  name: nameSchema.optional(),
  phone: phoneSchema,
  isActive: z.coerce.boolean().optional(),
  role: z.nativeEnum(UserRole).optional(),
});
