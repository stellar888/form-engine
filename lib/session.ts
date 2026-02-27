import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "oracle_session";

type SessionPayload = {
  email: string;
  firstName: string;
  subscribedAt: string;
};

function base64url(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function fromBase64url(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("Missing SESSION_SECRET env var.");
  }
  return secret;
}

function signPayload(payloadB64: string): string {
  return createHmac("sha256", getSecret()).update(payloadB64).digest("base64url");
}

export function createSessionToken(payload: SessionPayload): string {
  const payloadB64 = base64url(JSON.stringify(payload));
  const signature = signPayload(payloadB64);
  return `${payloadB64}.${signature}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  const [payloadB64, providedSignature] = token.split(".");
  if (!payloadB64 || !providedSignature) {
    return null;
  }

  const expectedSignature = signPayload(payloadB64);
  const provided = Buffer.from(providedSignature);
  const expected = Buffer.from(expectedSignature);

  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return null;
  }

  try {
    const parsed = JSON.parse(fromBase64url(payloadB64)) as SessionPayload;
    if (!parsed.email || !parsed.firstName || !parsed.subscribedAt) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export type { SessionPayload };
