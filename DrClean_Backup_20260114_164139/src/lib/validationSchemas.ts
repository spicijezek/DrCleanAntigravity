import { z } from 'zod';

// Client form validation schema
export const clientFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters").or(z.literal('')).nullable().transform(val => val || ''),
  phone: z.string().trim().max(20, "Phone must be less than 20 characters").nullable().optional().transform(val => val || undefined),
  address: z.string().trim().max(200, "Address must be less than 200 characters").nullable().optional().transform(val => val || undefined),
  city: z.string().trim().max(100, "City must be less than 100 characters").nullable().optional().transform(val => val || undefined),
  postal_code: z.string().trim().max(20, "Postal code must be less than 20 characters").nullable().optional().transform(val => val || undefined),
  date_of_birth: z.string().nullable().optional().transform(val => val || undefined),
  notes: z.string().trim().max(1000, "Notes must be less than 1000 characters").nullable().optional().transform(val => val || undefined),
  company_id: z.string().trim().max(50, "Company ID must be less than 50 characters").nullable().optional().transform(val => val || undefined),
  company_legal_name: z.string().trim().max(200, "Company legal name must be less than 200 characters").nullable().optional().transform(val => val || undefined),
  reliable_person: z.string().trim().max(100, "Reliable person must be less than 100 characters").nullable().optional().transform(val => val || undefined),
  client_source: z.string().trim().max(100, "Client source must be less than 100 characters").nullable().optional().transform(val => val || undefined),
  date_added: z.string().min(1, "Date added is required"),
  client_type: z.enum(['person', 'company']),
});

// Team member form validation schema
export const teamMemberFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters").optional().or(z.literal('')),
  phone: z.string().trim().max(20, "Phone must be less than 20 characters").optional(),
  position: z.string().trim().max(100, "Position must be less than 100 characters").optional(),
  hourly_rate: z.coerce.number().min(0, "Hourly rate must be positive").max(10000, "Hourly rate seems unreasonably high").optional(),
  hire_date: z.string().optional(),
  address: z.string().trim().max(200, "Address must be less than 200 characters").optional(),
  date_of_birth: z.string().optional(),
  is_active: z.boolean().optional(),
});

// Protocol form validation schema
export const protocolFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  description: z.string().trim().max(1000, "Description must be less than 1000 characters").optional(),
  tags: z.string().trim().max(200, "Tags must be less than 200 characters").optional(),
});

// Auth form validation schemas
export const signUpSchema = z.object({
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be less than 72 characters")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters").max(100, "Full name must be less than 100 characters"),
});

export const signInSchema = z.object({
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  password: z.string().min(1, "Password is required"),
});

// Settings profile validation schema
export const profileUpdateSchema = z.object({
  full_name: z.string().trim().max(100, "Full name must be less than 100 characters").optional(),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  phone: z.string().trim().max(20, "Phone must be less than 20 characters").optional(),
});

// Password update validation schema
export const passwordUpdateSchema = z.object({
  new: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be less than 72 characters")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirm: z.string(),
}).refine((data) => data.new === data.confirm, {
  message: "Passwords don't match",
  path: ["confirm"],
});

// Booking details validation schema
export const bookingDetailsSchema = z.object({
  service_type: z.string().max(50).optional(),
  service_title: z.string().max(200).optional(),
  notes: z.string().max(2000).optional().nullable(),
  equipment_option: z.enum(['with', 'without', '']).optional(),
  extraServices: z.array(z.string().max(100)).optional(),
  priceEstimate: z.object({
    hoursMin: z.number().min(0).max(1000).optional(),
    hoursMax: z.number().min(0).max(1000).optional(),
    priceMin: z.number().min(0).max(1000000).optional(),
    priceMax: z.number().min(0).max(1000000).optional(),
    discountPercent: z.number().min(0).max(100).optional(),
    baseServiceMin: z.number().min(0).max(1000000).optional(),
    baseServiceMax: z.number().min(0).max(1000000).optional(),
    addOnsMin: z.number().min(0).max(1000000).optional(),
    addOnsMax: z.number().min(0).max(1000000).optional(),
    windowMin: z.number().min(0).max(1000000).optional(),
    windowMax: z.number().min(0).max(1000000).optional(),
    upholsteryMin: z.number().min(0).max(1000000).optional(),
    upholsteryMax: z.number().min(0).max(1000000).optional(),
    equipmentCost: z.number().min(0).max(10000).optional(),
    upholsteryBelowMinimum: z.boolean().optional(),
    upholsteryMinimumOrder: z.number().min(0).max(100000).optional(),
  }).optional(),
  // Home/Office cleaning fields
  cleaning_type: z.enum(['osobni', 'firemni', '']).optional(),
  plocha_m2: z.number().min(0).max(100000).optional(),
  pocet_koupelen: z.number().int().min(0).max(100).optional(),
  pocet_kuchyni: z.number().int().min(0).max(100).optional(),
  znecisteni: z.string().max(50).optional(),
  frekvence: z.string().max(50).optional(),
  doplnky: z.array(z.string().max(100)).optional(),
  // Office specific
  pocet_wc: z.number().int().min(0).max(100).optional(),
  pocet_kuchynek: z.number().int().min(0).max(100).optional(),
  typ_prostoru: z.string().max(50).optional(),
  // Window cleaning fields
  pocet_oken: z.number().int().min(0).max(1000).optional(),
  plocha_oken_m2: z.number().min(0).max(10000).optional(),
  typ_objektu_okna: z.string().max(50).optional(),
  typ_objektu: z.string().max(50).optional(),
  znecisteni_okna: z.string().max(50).optional(),
  // Upholstery cleaning fields
  koberce: z.boolean().optional(),
  typ_koberec: z.string().max(50).optional(),
  plocha_koberec: z.number().min(0).max(10000).optional(),
  znecisteni_koberec: z.string().max(50).optional(),
  sedacka: z.boolean().optional(),
  velikost_sedacka: z.string().max(50).optional(),
  znecisteni_sedacka: z.string().max(50).optional(),
  matrace: z.boolean().optional(),
  velikost_matrace: z.string().max(50).optional(),
  strany_matrace: z.string().max(50).optional(),
  znecisteni_matrace: z.string().max(50).optional(),
  kresla: z.boolean().optional(),
  pocet_kresla: z.number().int().min(0).max(100).optional(),
  znecisteni_kresla: z.string().max(50).optional(),
  zidle: z.boolean().optional(),
  pocet_zidle: z.number().int().min(0).max(500).optional(),
  znecisteni_zidle: z.string().max(50).optional(),
}).passthrough(); // Allow additional fields for backwards compatibility

// Address validation schema for bookings
export const bookingAddressSchema = z.object({
  street: z.string().trim().min(1, "Street is required").max(200, "Street must be less than 200 characters"),
  city: z.string().trim().min(1, "City is required").max(100, "City must be less than 100 characters"),
  postal_code: z.string().trim().max(20, "Postal code must be less than 20 characters"),
});

// Booking form validation schema
export const bookingFormSchema = z.object({
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  street: z.string().trim().min(1, "Street is required").max(200),
  city: z.string().trim().min(1, "City is required").max(100),
  postal_code: z.string().trim().max(20),
  notes: z.string().max(2000).optional(),
  equipment_option: z.enum(['with', 'without', '']),
  cleaning_type: z.enum(['osobni', 'firemni', '']),
});
