import { supabase } from "./client";

export const BUCKETS = {
  avatars: "avatars",
  providerDocuments: "provider-documents",
  riderDocuments: "rider-documents",
  deliveryProof: "delivery-proof",
  disputeEvidence: "dispute-evidence",
} as const;

export type BucketName = (typeof BUCKETS)[keyof typeof BUCKETS];

/** Objects are stored under `<user id>/<file>` — storage RLS enforces that prefix. */
export function userScopedPath(userId: string, fileName: string) {
  const safe = fileName.replace(/[^\w.\-]+/g, "_");
  return `${userId}/${Date.now()}-${safe}`;
}

export async function uploadUserFile(
  bucket: BucketName,
  userId: string,
  file: File,
  upsert = false,
) {
  const path = userScopedPath(userId, file.name);
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert });
  if (error) throw error;
  return path;
}

/** Public buckets (avatars) can use a direct URL. */
export function publicUrl(bucket: BucketName, path: string) {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

/** Private buckets must be read through a short-lived signed URL. */
export async function signedUrl(bucket: BucketName, path: string, expiresInSeconds = 300) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
}
