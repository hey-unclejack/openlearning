import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";

function getSecretKey() {
  const secret =
    process.env.AI_CONNECTION_SECRET ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXTAUTH_SECRET ??
    "openlearning-local-development-secret";

  return crypto.createHash("sha256").update(secret).digest();
}

export function maskCredential(value: string) {
  const trimmed = value.trim();

  if (trimmed.length <= 10) {
    return "configured";
  }

  return `${trimmed.slice(0, 4)}...${trimmed.slice(-4)}`;
}

export function encryptCredential(value: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getSecretKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${iv.toString("base64")}.${tag.toString("base64")}.${encrypted.toString("base64")}`;
}

export function decryptCredential(value?: string) {
  if (!value) {
    return null;
  }

  const [ivValue, tagValue, encryptedValue] = value.split(".");

  if (!ivValue || !tagValue || !encryptedValue) {
    return null;
  }

  try {
    const decipher = crypto.createDecipheriv(ALGORITHM, getSecretKey(), Buffer.from(ivValue, "base64"));
    decipher.setAuthTag(Buffer.from(tagValue, "base64"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedValue, "base64")),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  } catch {
    return null;
  }
}
