"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function loginAction(
  formData: FormData
): Promise<{ error: string } | void> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });
  } catch (error: any) {
    // Auth.js v5 beta throws NEXT_REDIRECT for both success and failure.
    // Inspect the digest to distinguish success (/dashboard) vs failure (/api/auth/error).
    const digest: string = error?.digest ?? "";
    if (digest.startsWith("NEXT_REDIRECT")) {
      const destination = digest.split(";")[2] ?? "";
      if (destination.includes("/api/auth/error")) {
        // Auth.js internally redirected to error page = bad credentials
        return { error: "E-mail ou senha inválidos." };
      }
      // Success redirect (to /dashboard) - let Next.js handle it
      throw error;
    }

    if (error instanceof AuthError) {
      return { error: "E-mail ou senha inválidos." };
    }

    throw error;
  }
}
