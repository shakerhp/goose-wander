import Ably from "ably";

export function createAblyRealtimeClient() {
  const key = process.env.NEXT_PUBLIC_ABLY_PUBLIC_KEY;

  if (!key) {
    throw new Error("Missing Ably public key.");
  }

  return new Ably.Realtime(key);
}
