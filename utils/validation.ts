export type NumbersInput = { n1: string; n2: string; n3: string };
export type ValidationErrors = {
  n1?: string;
  n2?: string;
  n3?: string;
  question?: string;
};

export function normalizeDigits(value: string, maxLen: number): string {
  const onlyDigits = value.replace(/\D+/g, "");
  return onlyDigits.slice(0, maxLen);
}

export function pad3(value: string): string {
  const v = value.replace(/\D+/g, "");
  return v.padStart(3, "0").slice(0, 3);
}

export function is3Digits(value: string): boolean {
  return /^\d{3}$/.test(value);
}

export function validateForm(values: NumbersInput & { question: string }): ValidationErrors {
  const errs: ValidationErrors = {};
  if (!is3Digits(values.n1)) errs.n1 = "請輸入三位數（000–999）";
  if (!is3Digits(values.n2)) errs.n2 = "請輸入三位數（000–999）";
  if (!is3Digits(values.n3)) errs.n3 = "請輸入三位數（000–999）";
  const trimmed = values.question.trim();
  if (trimmed.length < 5) errs.question = "問題至少需要 5 個字";
  return errs;
}