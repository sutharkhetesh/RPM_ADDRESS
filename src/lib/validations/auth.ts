import { z } from "zod";
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
  password: z.string().min(1, "Enter your password").max(128),
});
export const signupSchema = loginSchema
  .extend({
    password: z.string().min(8, "Use at least 8 characters").max(128),
    fullName: z.string().trim().min(2, "Enter your full name").max(120),
    confirmPassword: z.string().max(128),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });
