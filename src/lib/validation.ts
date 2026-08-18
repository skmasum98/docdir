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

export const specialtySchema = z.object({
  name: z.string().trim().min(2).max(80),
});

export const doctorCreateSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  gender: z.nativeEnum(Gender).optional(),
  bmdcNumber: z.string().trim().max(60).optional().or(z.literal("")),
  experienceYears: z.coerce.number().int().min(0).max(80).optional(),
  consultationFee: z.coerce.number().int().min(0).max(1_000_000).optional(),
  about: z.string().trim().max(4000).optional().or(z.literal("")),
  phone: phoneSchema,
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
    facilityIds: true,
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
  address: z.string().trim().max(500).optional().or(z.literal("")),
  phone: phoneSchema,
  upazilaId: z.coerce.number().int().positive(),
});

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
