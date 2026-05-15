import { NextResponse } from "next/server";
import { createGooseEvent, updateGooseEvent } from "@/lib/goose-service";
import { eggCounts, gooseKinds, type EggCount, type GooseKind } from "@/lib/goose";

function isGooseKind(value: unknown): value is GooseKind {
  return typeof value === "string" && gooseKinds.includes(value as GooseKind);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const goose = body?.goose;
  const guestName = body?.guestName;
  const rawEggCount = body?.eggCount;
  const eggCount =
    rawEggCount === undefined || rawEggCount === null ? 0 : Number(rawEggCount);

  if (!isGooseKind(goose)) {
    return NextResponse.json({ error: "Missing goose" }, { status: 400 });
  }

  if (typeof guestName !== "string" || !guestName.trim()) {
    return NextResponse.json({ error: "Missing guest name" }, { status: 400 });
  }

  if (eggCount !== 0 && !eggCounts.includes(eggCount as EggCount)) {
    return NextResponse.json({ error: "Invalid egg count" }, { status: 400 });
  }

  const event = await createGooseEvent({
    goose,
    guestName,
    eggCount: eggCount as 0 | EggCount,
    rating: 0,
    comment: null,
  });
  return NextResponse.json({ event });
}

// Step 3: อัปเดตข้อมูลคะแนนและคอมเมนต์
export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  const id = body?.id;
  const hasRating = body?.rating !== undefined && body?.rating !== null;
  const hasEggCount = body?.eggCount !== undefined && body?.eggCount !== null;
  const rating = hasRating ? Number(body.rating) : undefined;
  const eggCount = hasEggCount ? Number(body.eggCount) : undefined;
  const comment = body?.comment;

  if (!id) {
    return NextResponse.json({ error: "Missing event ID" }, { status: 400 });
  }

  if (!hasRating && !hasEggCount) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  if (hasRating && (!Number.isInteger(rating) || rating! < 1 || rating! > 5)) {
    return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
  }

  if (hasEggCount && !eggCounts.includes(eggCount as EggCount)) {
    return NextResponse.json({ error: "Invalid egg count" }, { status: 400 });
  }

  try {
    const event = await updateGooseEvent(id, {
      ...(hasRating ? { rating: rating!, comment: typeof comment === "string" || comment == null ? comment : null } : {}),
      ...(hasEggCount ? { eggCount: eggCount as EggCount } : {}),
    });
    return NextResponse.json({ event });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}