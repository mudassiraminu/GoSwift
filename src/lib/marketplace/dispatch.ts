/** Helpers for company-choice + offline quote flow (no company login). */

const COMPANY_PREFIX = "[company:";
const COURIER_PREFIX = "[courier:";

export function encodeCompanyChoice(providerId: string, companyName: string, userNotes?: string) {
  const base = `${COMPANY_PREFIX}${providerId}|${companyName}]`;
  return userNotes?.trim() ? `${base} ${userNotes.trim()}` : base;
}

export function parseCompanyChoice(notes: string | null | undefined): {
  providerId: string | null;
  companyName: string | null;
  userNotes: string;
} {
  if (!notes) return { providerId: null, companyName: null, userNotes: "" };
  const m = notes.match(/\[company:([^|\]]+)\|([^\]]+)\]/);
  if (!m) return { providerId: null, companyName: null, userNotes: notes };
  const userNotes = notes.replace(m[0], "").trim();
  return { providerId: m[1], companyName: m[2], userNotes };
}

/** Store courier contact on delivery via history note after payment. */
export function encodeCourierInfo(name: string, phone: string) {
  return `${COURIER_PREFIX}${name}|${phone}]`;
}

export function parseCourierFromNotes(text: string | null | undefined): {
  name: string | null;
  phone: string | null;
} {
  if (!text) return { name: null, phone: null };
  const m = text.match(/\[courier:([^|\]]+)\|([^\]]+)\]/);
  if (!m) return { name: null, phone: null };
  return { name: m[1], phone: m[2] };
}
