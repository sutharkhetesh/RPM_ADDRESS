"use server";
import { requireUser } from "@/lib/auth";
import { database } from "@/lib/prisma";
import { completeAddressSetup } from "@/lib/onboarding-service";
import { authenticationFailure } from "@/lib/database-errors";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
export async function finishAddressSetup(input: unknown) {
  const user = await requireUser();
  try {
    await completeAddressSetup(database(), user.id, input);
  } catch (error) {
    return {
      error:
        error instanceof ZodError
          ? "Check your shipping and billing details, then try again."
          : authenticationFailure(error),
    };
  }
  revalidatePath("/", "layout");
  redirect("/dashboard");
}
