import { NextResponse } from "next/server";
import { getGooseStats } from "@/lib/goose-service";

export async function GET() {
  const stats = await getGooseStats();
  return NextResponse.json(stats);
}
