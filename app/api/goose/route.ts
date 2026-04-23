import { NextResponse } from "next/server";
import { createGooseEvent } from "@/lib/goose-service";
import { gooseKinds, type GooseKind } from "@/lib/goose";

function isGooseKind(value: unknown): value is GooseKind {
  return typeof value === "string" && gooseKinds.includes(value as GooseKind);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const goose = body?.goose;
  const guestName = body?.guestName;
  const rating = Number(body?.rating);
  const comment = body?.comment;

  if (!isGooseKind(goose)) {
    return NextResponse.json({ error: "Missing goose" }, { status: 400 });
  }

  if (typeof guestName !== "string" || !guestName.trim()) {
    return NextResponse.json({ error: "Missing guest name" }, { status: 400 });
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
  }

  const event = await createGooseEvent({
    goose,
    guestName,
    rating,
    comment: typeof comment === "string" || comment == null ? comment : null,
  });
  return NextResponse.json({ event });
}
