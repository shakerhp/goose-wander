import { ablyRest } from "./ably";
import { gooseKinds, type GooseDashboardStats, type GooseEventPayload, type GooseKind, type GooseRecord } from "./goose";
import { supabaseAdmin } from "./supabase";

const channelName = "goose-wander";
const tableName = "goose_events";
type GooseRating = keyof GooseDashboardStats["ratings"];

function isGooseKind(value: string): value is GooseKind {
  return gooseKinds.includes(value as GooseKind);
}

function isValidRating(value: unknown): value is GooseRating {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 5;
}

function normalizeGuestName(name: unknown) {
  return typeof name === "string" ? name.trim() : "";
}

function normalizeComment(comment: unknown) {
  if (typeof comment !== "string") return null;
  const trimmed = comment.trim();
  return trimmed ? trimmed : null;
}

export async function createGooseEvent(payload: GooseEventPayload) {
  if (!isGooseKind(payload.goose)) {
    throw new Error("Invalid goose kind");
  }

  const guestName = normalizeGuestName(payload.guestName);
  if (!guestName) {
    throw new Error("Missing guest name");
  }

  if (!isValidRating(payload.rating)) {
    throw new Error("Invalid rating");
  }

  const columnsWithMetadata = {
    goose_kind: payload.goose,
    guest_name: guestName,
    rating: payload.rating,
    comment: normalizeComment(payload.comment),
  };

  const insertWithColumns = async (values: Record<string, unknown>, selectColumns: string) => {
    return supabaseAdmin.from(tableName).insert(values).select(selectColumns).single<GooseRecord>();
  };

  let result = await insertWithColumns(columnsWithMetadata, "id, goose_kind, guest_name, rating, comment, created_at");

  if (result.error?.message?.includes("comment")) {
    const { comment: _comment, ...withoutComment } = columnsWithMetadata;
    result = await insertWithColumns(withoutComment, "id, goose_kind, guest_name, rating, created_at");
  }

  if (result.error?.message?.includes("guest_name") || result.error?.code === "PGRST204") {
    result = await insertWithColumns({ goose_kind: payload.goose }, "id, goose_kind, created_at");
  }

  const { data, error } = result;

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to insert goose event");
  }

  await ablyRest.channels.get(channelName).publish("goose:new", data);

  return data;
}

export async function listGooseEvents(limit = 24) {
  const { data, error } = await supabaseAdmin
    .from(tableName)
    .select("id, goose_kind, guest_name, rating, comment, created_at")
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<GooseRecord[]>();

  if (error) {
    if (error.message.includes("Could not find the table") || error.code === "42P01") {
      return [];
    }
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getGooseStats(): Promise<GooseDashboardStats> {
  const { data, error } = await supabaseAdmin
    .from(tableName)
    .select("goose_kind, rating")
    .returns<Pick<GooseRecord, "goose_kind" | "rating">[]>();

  if (error) {
    if (error.message.includes("Could not find the table") || error.code === "42P01") {
      return {
        totalEvents: 0,
        selections: gooseKinds.reduce((acc, kind) => {
          acc[kind] = 0;
          return acc;
        }, {} as GooseDashboardStats["selections"]),
        ratings: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        topRating: null,
        topRatingCount: 0,
      };
    }
    throw new Error(error.message);
  }

  const selections = gooseKinds.reduce((acc, kind) => {
    acc[kind] = 0;
    return acc;
  }, {} as GooseDashboardStats["selections"]);
  const ratings: GooseDashboardStats["ratings"] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  for (const row of data ?? []) {
    if (isGooseKind(row.goose_kind)) {
      selections[row.goose_kind] += 1;
    }
    if (isValidRating(row.rating)) {
      ratings[row.rating] += 1;
    }
  }

  let topRating: GooseDashboardStats["topRating"] = null;
  let topRatingCount = 0;
  for (const rate of [1, 2, 3, 4, 5] as const) {
    if (ratings[rate] > topRatingCount) {
      topRating = rate;
      topRatingCount = ratings[rate];
    }
  }

  return {
    totalEvents: data?.length ?? 0,
    selections,
    ratings,
    topRating,
    topRatingCount,
  };
}
