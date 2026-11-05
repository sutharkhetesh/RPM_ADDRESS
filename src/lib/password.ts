import { randomBytes, scrypt, timingSafeEqual, createHash } from "node:crypto";
const options = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
function derive(password: string, salt: string) {
  return new Promise<Buffer>((resolve, reject) =>
    scrypt(password, salt, 64, options, (error, key) =>
      error ? reject(error) : resolve(key),
    ),
  );
}
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `scrypt-v1:${salt}:${(await derive(password, salt)).toString("hex")}`;
}
export async function verifyPassword(password: string, encoded: string | null) {
  const parts = encoded?.split(":");
  const valid =
    parts?.length === 3 &&
    parts[0] === "scrypt-v1" &&
    /^[a-f0-9]{32}$/.test(parts[1]) &&
    /^[a-f0-9]{128}$/.test(parts[2]);
  // Unknown accounts still perform the same expensive derivation.
  const salt = valid ? parts[1] : "0".repeat(32),
    expected = Buffer.from(valid ? parts[2] : "0".repeat(128), "hex");
  const actual = await derive(password, salt);
  return timingSafeEqual(actual, expected) && Boolean(valid);
}
export const digestToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export const newSessionToken = () => randomBytes(32).toString("hex");
