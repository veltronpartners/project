import "server-only";
import * as OTPAuth from "otpauth";
import QRCode from "qrcode";
import { randomBytes, createHash } from "crypto";

const ISSUER = "Veltron Partners";
const BACKUP_CODE_COUNT = 10;

export function generateTotpSecret(label: string) {
  const secret = new OTPAuth.Secret({ size: 20 });
  const totp = new OTPAuth.TOTP({
    issuer: ISSUER,
    label,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret,
  });

  return { secretBase32: secret.base32, uri: totp.toString() };
}

export async function generateQrCodeDataUrl(uri: string): Promise<string> {
  return QRCode.toDataURL(uri);
}

/** Validates a 6-digit TOTP code, allowing one period of clock drift either way. */
export function verifyTotpCode(secretBase32: string, token: string): boolean {
  const totp = new OTPAuth.TOTP({
    issuer: ISSUER,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secretBase32),
  });

  const delta = totp.validate({ token, window: 1 });
  return delta !== null;
}

/** Returns plaintext codes (show once, never store) — store the hashes instead. */
export function generateBackupCodes(): string[] {
  return Array.from({ length: BACKUP_CODE_COUNT }, () =>
    randomBytes(5).toString("hex"),
  );
}

export function hashBackupCode(code: string): string {
  return createHash("sha256").update(code.trim().toLowerCase()).digest("hex");
}

/** Returns the remaining hashed codes with the matched one removed, or null if no match. */
export function consumeBackupCode(
  code: string,
  hashedCodes: string[],
): string[] | null {
  const hash = hashBackupCode(code);
  const index = hashedCodes.indexOf(hash);
  if (index === -1) return null;
  return [...hashedCodes.slice(0, index), ...hashedCodes.slice(index + 1)];
}
