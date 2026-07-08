import crypto from "crypto";

/**
 * Loads and validates the 32-byte base64-encoded AES-256-GCM encryption key.
 * Throws ERR_MISSING_ENCRYPTION_KEY if not provided or set in env.
 * Throws ERR_INVALID_ENCRYPTION_KEY if key is not exactly 32 bytes after base64 decode.
 */
export function getPromptEncryptionKey(explicitKeyBase64?: string): Buffer {
  const rawKey = explicitKeyBase64 ?? process.env.PROMPT_ENCRYPTION_KEY;
  if (!rawKey || rawKey.trim() === "") {
    throw new Error("ERR_MISSING_ENCRYPTION_KEY: PROMPT_ENCRYPTION_KEY environment variable is not set.");
  }

  let keyBuffer: Buffer;
  try {
    keyBuffer = Buffer.from(rawKey.trim(), "base64");
  } catch (e) {
    throw new Error("ERR_INVALID_ENCRYPTION_KEY: PROMPT_ENCRYPTION_KEY must be a valid base64 string.");
  }

  if (keyBuffer.length !== 32) {
    throw new Error(`ERR_INVALID_ENCRYPTION_KEY: PROMPT_ENCRYPTION_KEY must decode to exactly 32 bytes for AES-256-GCM (got ${keyBuffer.length} bytes).`);
  }

  return keyBuffer;
}

/**
 * Computes deterministic SHA-256 hex digest of plaintext content.
 */
export function computePromptChecksum(content: string): string {
  return crypto.createHash("sha256").update(content, "utf8").digest("hex");
}

export interface EncryptedPromptResult {
  encryptedContent: string;
  checksum: string;
}

/**
 * Encrypts prompt plaintext using AES-256-GCM.
 * Produces canonical format: v1:<base64(iv)>:<base64(authTag)>:<base64(ciphertext)>
 */
export function encryptPromptContent(
  plainTextContent: string,
  explicitKeyBase64?: string
): EncryptedPromptResult {
  const key = getPromptEncryptionKey(explicitKeyBase64);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plainTextContent, "utf8"),
    cipher.final()
  ]);
  const authTag = cipher.getAuthTag();

  const canonical = `v1:${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted.toString("base64")}`;
  const checksum = computePromptChecksum(plainTextContent);

  return {
    encryptedContent: canonical,
    checksum
  };
}

/**
 * Decrypts canonical prompt ciphertext formatted as:
 * v1:<base64(iv)>:<base64(authTag)>:<base64(ciphertext)>
 */
export function decryptPromptContent(
  canonicalEncryptedContent: string,
  explicitKeyBase64?: string
): string {
  if (!canonicalEncryptedContent || typeof canonicalEncryptedContent !== "string") {
    throw new Error("ERR_INVALID_CIPHERTEXT_FORMAT: Missing canonical ciphertext.");
  }

  const parts = canonicalEncryptedContent.split(":");
  if (parts.length !== 4 || parts[0] !== "v1") {
    throw new Error(
      "ERR_INVALID_CIPHERTEXT_FORMAT: Canonical encrypted prompt must follow v1:<base64(iv)>:<base64(authTag)>:<base64(ciphertext)> format."
    );
  }

  const [, ivB64, authTagB64, ciphertextB64] = parts;
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const ciphertext = Buffer.from(ciphertextB64, "base64");

  const key = getPromptEncryptionKey(explicitKeyBase64);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final()
  ]);

  return decrypted.toString("utf8");
}
