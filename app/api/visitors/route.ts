import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function ipFrom(request: Request) {
  // Prefer proxy headers (Vercel/Cloudflare/Nginx), fall back to unknown
  const header =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip");
  if (!header) return "unknown";
  return header.split(",")[0]?.trim() || "unknown";
}

function originFrom(request: Request) {
  // `referer` might be empty for direct landings
  return request.headers.get("referer") || request.headers.get("origin") || null;
}

// Basic location resolution without external API.
// If you later add Cloudflare/Vercel geolocation headers, we will store them.
function locationFrom(request: Request) {
  const city = request.headers.get("x-vercel-ip-city") || request.headers.get("cf-ipcity");
  const region = request.headers.get("x-vercel-ip-country-region");
  const country = request.headers.get("x-vercel-ip-country") || request.headers.get("cf-ipcountry");

  const parts = [city, region, country].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

export async function POST(request: Request) {
  try {
    const ip = ipFrom(request);
    const origin = originFrom(request);
    const location = locationFrom(request);
    const userAgent = request.headers.get("user-agent");

    const row = await prisma.visitor.upsert({
      where: {
        ip_origin: {
          ip,
          origin: origin ?? "direct",
        },
      },
      create: {
        ip,
        origin: origin ?? "direct",
        location,
        userAgent,
        frequency: 1,
        firstSeen: new Date(),
        lastSeen: new Date(),
      },
      update: {
        location,
        userAgent,
        frequency: { increment: 1 },
        lastSeen: new Date(),
      },
      select: { id: true },
    });

    return NextResponse.json({ success: true, id: row.id });
  } catch {
    // Visitor tracking must never break the page
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
