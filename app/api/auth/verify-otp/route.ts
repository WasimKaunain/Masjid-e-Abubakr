import { NextResponse } from "next/server";
import {
  authCookies,
  createTreasurerSession,
  readOtpChallenge,
} from "@/lib/auth";

export async function POST(request: Request) {
  const body = (await request.json()) as { otp?: string };
  const token = request.headers
    .get("cookie")
    ?.split("; ")
    .find((cookie) => cookie.startsWith(`${authCookies.otp}=`))
    ?.split("=")
    .slice(1)
    .join("=");
  const challenge = readOtpChallenge(token);

  if (!challenge || body.otp !== challenge.otp) {
    return NextResponse.json({ message: "Invalid or expired OTP" }, { status: 400 });
  }

  const response = NextResponse.json({ message: "OTP verified" });
  response.cookies.delete(authCookies.otp);
  response.cookies.set(authCookies.session, createTreasurerSession(challenge.email), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 12 * 60 * 60,
  });
  return response;
}
