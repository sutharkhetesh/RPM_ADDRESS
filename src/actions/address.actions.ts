"use server";
import { requireUser } from "@/lib/auth";
import { database } from "@/lib/prisma";
import { saveForUser, deleteForUser } from "@/lib/address-service";
import { revalidatePath } from "next/cache";
export async function saveAddress(input: unknown, id?: string) {
  const user = await requireUser();
  try {
    await saveForUser(database(), user.id, input, id);
    revalidatePath("/", "layout");
    return { success: true as const };
  } catch {
    return {
      success: false as const,
      error: "Unable to save the address. Check the fields and try again.",
    };
  }
}
export async function deleteAddress(id: string) {
  const user = await requireUser();
  try {
    await deleteForUser(database(), user.id, id);
    revalidatePath("/", "layout");
    return { success: true as const };
  } catch {
    return {
      success: false as const,
      error: "Unable to delete this address. Please try again.",
    };
  }
}
