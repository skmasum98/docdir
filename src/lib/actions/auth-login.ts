"use server";

import type { FormState } from "../form";

export async function loginAction(
  _prev: FormState | undefined,
  _formData: FormData,
): Promise<FormState> {
  return { ok: true };
}
