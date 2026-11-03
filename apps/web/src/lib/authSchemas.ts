import { z } from "@cc/shared";

const email = z.string().trim().toLowerCase().email("Enter a valid email address.");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password."),
});

export const signupSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name.").max(100, "Your name is too long."),
  email,
  // 72 is the most characters the password hashing used by Supabase will read.
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(72, "Password must be at most 72 characters."),
});
