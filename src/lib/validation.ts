// Seller eligibility and listing limits. Shared by client forms and server routes.

export const STUDENT_ID_PATTERN = /^6\d{6}$/; // 7 digits starting with 6, e.g. 6603282, 6403731
export const SCHOOL_EMAIL_DOMAIN = process.env.NEXT_PUBLIC_SCHOOL_EMAIL_DOMAIN ?? "rsu.ac.th";

export const PRICE_MIN = 1;
export const PRICE_MAX = 100_000;
export const IMAGES_MIN = 1;
export const IMAGES_MAX = 8;

export function isValidStudentId(id: string): boolean {
  return STUDENT_ID_PATTERN.test(id.trim());
}

export function isSchoolEmail(email: string): boolean {
  const e = email.trim().toLowerCase();
  const at = e.lastIndexOf("@");
  return at > 0 && e.slice(at + 1) === SCHOOL_EMAIL_DOMAIN;
}

export function validateListing(input: { price: number; imageCount: number }): string | null {
  if (!Number.isFinite(input.price) || input.price < PRICE_MIN || input.price > PRICE_MAX) {
    return `Price must be between ${PRICE_MIN} and ${PRICE_MAX.toLocaleString()} THB.`;
  }
  if (input.imageCount < IMAGES_MIN || input.imageCount > IMAGES_MAX) {
    return `Add between ${IMAGES_MIN} and ${IMAGES_MAX} images.`;
  }
  return null;
}
