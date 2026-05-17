import { NextResponse } from "next/server";
import { authCookies } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ message: "Logged out" });
  response.cookies.delete(authCookies.session);
  return response;
}
