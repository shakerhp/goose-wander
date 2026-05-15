export const gooseKinds = ["original", "media", "tradesman", "nerd", "paint", "robot"] as const;

export type GooseKind = (typeof gooseKinds)[number];

export const eggCounts = [1, 2, 3, 4, 5] as const;
export type EggCount = (typeof eggCounts)[number];

export type GooseRecord = {
  id: string;
  goose_kind: GooseKind;
  guest_name: string | null;
  egg_count: number | null;
  rating: number | null;
  comment: string | null;
  created_at: string;
};

export type GooseEventPayload = {
  goose: GooseKind;
  guestName: string;
  eggCount?: EggCount | 0;
  rating: number;
  comment?: string | null;
  durationMs?: number;
};

export type GooseDashboardStats = {
  totalEvents: number;
  selections: Record<GooseKind, number>;
  ratings: Record<1 | 2 | 3 | 4 | 5, number>;
  topRating: 1 | 2 | 3 | 4 | 5 | null;
  topRatingCount: number;
};
