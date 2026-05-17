import { NextResponse } from "next/server";
import { authCookies, authorizedEmails, createOtpChallenge } from "@/lib/auth";
import { sendTreasurerOtp } from "@/lib/mailer";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string };
  const email = body.email?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ message: "Email is required" }, { status: 400 });
  }

  if (!authorizedEmails().includes(email)) {
    return NextResponse.json({ message: "Unauthorized email" }, { status: 403 });
  }

  try {
    const { otp, token } = createOtpChallenge(email);
    await sendTreasurerOtp(email, otp);

    const response = NextResponse.json({ message: "OTP sent" });
    response.cookies.set(authCookies.otp, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 5 * 60,
    });
    return response;
  } catch {
    return NextResponse.json({ message: "Unable to send OTP" }, { status: 500 });
  }
}
