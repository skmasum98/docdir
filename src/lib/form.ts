export type FormState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
};

export const initialFormState: FormState = { ok: false };

export function fieldError(state: FormState | undefined, name: string): string | undefined {
  return state?.fieldErrors?.[name];
}
