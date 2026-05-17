import { createHmac, randomInt, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const OTP_COOKIE = "treasurer_otp";
const SESSION_COOKIE = "treasurer_session";
const OTP_TTL_MS = 5 * 60 * 1000;
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

type OtpPayload = {
  email: string;
  otp: string;
  expiresAt: number;
};

type SessionPayload = {
  email: string;
  name: string;
  expiresAt: number;
};

function secret() {
  const value = process.env.TREASURER_AUTH_SECRET ?? process.env.SECRET_KEY;
  if (!value) {
    throw new Error("TREASURER_AUTH_SECRET or SECRET_KEY is required");
  }
  return value;
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

function seal(payload: object) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

function open<T>(token?: string): T | null {
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = sign(encoded);
  if (
    expected.length !== signature.length ||
    !timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  ) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(encoded, "base64url").toString()) as T;
  } catch {
    return null;
  }
}

export function authorizedEmails() {
  return [process.env.TREASURER_EMAIL, process.env.DEVELOPER_EMAIL]
    .flatMap((value) => value?.split(",") ?? [])
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function createOtpChallenge(email: string) {
  const otp = String(randomInt(100000, 1000000));
  return {
    otp,
    token: seal({
      email,
      otp,
      expiresAt: Date.now() + OTP_TTL_MS,
    } satisfies OtpPayload),
  };
}

export function readOtpChallenge(token?: string) {
  const payload = open<OtpPayload>(token);
  if (!payload || payload.expiresAt < Date.now()) return null;
  return payload;
}

export function createTreasurerSession(email: string) {
  return seal({
    email,
    name: process.env.TREASURER_NAME ?? "Treasurer",
    expiresAt: Date.now() + SESSION_TTL_MS,
  } satisfies SessionPayload);
}

export function readTreasurerSession(token?: string) {
  const payload = open<SessionPayload>(token);
  if (!payload || payload.expiresAt < Date.now()) return null;
  return payload;
}

export async function getTreasurerSession() {
  const store = await cookies();
  return readTreasurerSession(store.get(SESSION_COOKIE)?.value);
}

export const authCookies = {
  otp: OTP_COOKIE,
  session: SESSION_COOKIE,
};
