import { z } from "zod";

export const studentSchema = z.object({
  full_name: z.string().min(2, "Full name is required"),
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  phone: z.string().optional(),
  application_id: z.string().min(1, "Application ID is required"),
  father_name: z.string().optional(),
  address: z.string().optional(),
  course_id: z.string().optional(),
  batch_id: z.string().optional(),
  enrollment_date: z.string().optional(),
});
export type StudentFormValues = z.infer<typeof studentSchema>;
