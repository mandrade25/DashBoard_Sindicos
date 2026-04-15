"use server";

import { signIn } from "@/lib/auth";
import { redirect } from "next/navigation";
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
                redirect: false,
        });
  } catch (error) {
        if (error instanceof AuthError) {
                return { error: "E-mail ou senha inválidos." };
        }
        throw error;
  }

  redirect("/dashboard");
}
