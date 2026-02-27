import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { buildAstroContext } from "@/lib/astrology";
import { generatePersonalizedReading } from "@/lib/openai";
import { getCardById } from "@/lib/oracle";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      cardId?: number;
      timezone?: string;
    };

    const cardId = Number(body.cardId);
    const timezone = body.timezone?.trim() || "UTC";

    if (!Number.isInteger(cardId)) {
      return NextResponse.json({ error: "Missing cardId." }, { status: 400 });
    }

    const card = getCardById(cardId);
    if (!card) {
      return NextResponse.json({ error: "Card not found." }, { status: 404 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;

    if (!token) {
      return NextResponse.json({ error: "Not subscribed in this session." }, { status: 401 });
    }

    const session = verifySessionToken(token);
    if (!session) {
      return NextResponse.json({ error: "Session invalid or expired." }, { status: 401 });
    }

    const astro = buildAstroContext(timezone);
    const reading = await generatePersonalizedReading({
      firstName: session.firstName,
      card,
      astro
    });

    return NextResponse.json({
      ok: true,
      reading,
      astro
    });
  } catch {
    return NextResponse.json({ error: "Unable to generate reading." }, { status: 500 });
  }
}
