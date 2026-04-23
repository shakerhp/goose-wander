export const gooseKinds = ["original", "media", "tradesman", "nerd", "paint", "robot"] as const;

export type GooseKind = (typeof gooseKinds)[number];

export type GooseRecord = {
  id: string;
  goose_kind: GooseKind;
  guest_name: string | null;
  rating: number | null;
  comment: string | null;
  created_at: string;
};

export type GooseEventPayload = {
  goose: GooseKind;
  guestName: string;
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
