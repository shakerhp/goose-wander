import { NextResponse } from "next/server";
import { listGooseEvents } from "@/lib/goose-service";

export async function GET() {
  const events = await listGooseEvents(20);
  return NextResponse.json({ events });
}
