"use client";

import { useEffect, useMemo, useState } from "react";

import { createAblyRealtimeClient } from "@/lib/ably-client";
import { type GooseRecord } from "@/lib/goose";

const frameCount = 4;
const gooseKinds = ["original", "media", "tradesman", "nerd", "paint", "robot"] as const;
const spriteFrames = gooseKinds.flatMap((kind) =>
  Array.from({ length: frameCount }, (_, index) => `/goose/${kind}/frame_${index + 1}.svg`),
);

const ENTRY_MS = 6_000;
const WANDER_MS = 5 * 60 * 1_000;
const EXIT_MS = 7_500;
const ENTRY_BLEND_MS = 2_800;
const WANDER_TOTAL_MS = ENTRY_MS + WANDER_MS + EXIT_MS;

const WANDER_X_MIN = 6;
const WANDER_X_MAX = 94;
const WANDER_Y_MIN = 47;
const WANDER_Y_MAX = 96;

function seedFromId(id: string) {
  return id.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
}

function phaseFromSeed(seed: number) {
  return (seed % 997) / 997;
}

/** Deterministic [0, 1) from event id; different salts → uncorrelated streams. */
function hashFromId(id: string, salt: number): number {
  let h = (salt + 0x6eed0e9d) >>> 0;
  for (let i = 0; i < id.length; i++) {
    h = Math.imul(h ^ id.charCodeAt(i), 0x1000193);
  }
  h ^= h >>> 15;
  h = Math.imul(h, 0x735a2d97);
  h ^= h >>> 15;
  return (h >>> 0) / 0xffffffff;
}

function wanderPhaseRad(id: string) {
  const seed = seedFromId(id);
  const h = hashFromId(id, 5);
  return (phaseFromSeed(seed) * 0.35 + h * 0.65) * Math.PI * 2;
}

function wanderPosition(id: string, elapsedMs: number) {
  const h0 = hashFromId(id, 0);
  const h1 = hashFromId(id, 1);
  const h2 = hashFromId(id, 2);
  const h3 = hashFromId(id, 3);
  const h4 = hashFromId(id, 4);

  const phase = wanderPhaseRad(id);
  const phaseY2 = h0 * Math.PI * 2;
  const t = elapsedMs / 1000;

  const travelSpeed = 0.011 + h1 * 0.024;
  const travel = (t * travelSpeed + phase) % 2;
  const sweep = travel < 1 ? travel : 2 - travel;
  const range = WANDER_X_MAX - WANDER_X_MIN;
  const movingRight = travel < 1;
  const dSweepDt = movingRight ? travelSpeed : -travelSpeed;
  let velocityX = range * dSweepDt;

  const wobbleFreq = 0.075 + h3 * 0.16;
  const wobbleAmp = 1.2 + h4 * 4;
  const xWobble = Math.sin(t * wobbleFreq + phaseY2) * wobbleAmp;
  velocityX += Math.cos(t * wobbleFreq + phaseY2) * wobbleAmp * wobbleFreq;

  let x = WANDER_X_MIN + range * sweep + xWobble;
  x = Math.min(WANDER_X_MAX + 6, Math.max(WANDER_X_MIN - 6, x));

  const yFreq1 = 0.34 + h2 * 0.44;
  const yFreq2 = 0.1 + h3 * 0.28;
  const yAmp1 = 6 + h2 * 14;
  const yAmp2 = 2.5 + h4 * 11;
  const yCenter = 58 + (h1 - 0.5) * 18;
  const yWave =
    yCenter +
    Math.sin(t * yFreq1 + phase) * yAmp1 +
    Math.cos(t * yFreq2 + phaseY2 * 1.31) * yAmp2;
  const y = Math.min(WANDER_Y_MAX, Math.max(WANDER_Y_MIN, yWave));

  return { x, y, velocityX, phase };
}

/** Path time (ms) on the wander curve nearest the post-entry point; cached per event id. */
const wanderAnchorTimeCache = new Map<string, number>();
const ANCHOR_SEARCH_STEP_MS = 200;
const ANCHOR_SEARCH_MAX_MS = 120_000;

function wanderAnchorTimeMs(id: string, entryEndX: number, entryEndY: number): number {
  const cached = wanderAnchorTimeCache.get(id);
  if (cached !== undefined) return cached;

  let bestT = 0;
  let bestScore = Infinity;
  for (let t = 0; t <= ANCHOR_SEARCH_MAX_MS; t += ANCHOR_SEARCH_STEP_MS) {
    const p = wanderPosition(id, t);
    const dx = p.x - entryEndX;
    const dy = p.y - entryEndY;
    const score = dx * dx + dy * dy * 0.35;
    if (score < bestScore) {
      bestScore = score;
      bestT = t;
    }
  }
  wanderAnchorTimeCache.set(id, bestT);
  return bestT;
}

function wanderStagePosition(id: string, elapsedMs: number) {
  const phase = wanderPhaseRad(id);

  if (elapsedMs < ENTRY_MS) {
    const progress = Math.max(0, elapsedMs) / ENTRY_MS;
    const startX = -12;
    const endX = 36;
    const x = startX + (endX - startX) * progress;
    const y = 58 + Math.sin(progress * Math.PI * 2 + phase) * 6;
    return { x, y, facingRight: true };
  }

  if (elapsedMs < ENTRY_MS + WANDER_MS) {
    const wanderElapsed = elapsedMs - ENTRY_MS;

    if (wanderElapsed < ENTRY_BLEND_MS) {
      const blendT = wanderElapsed / ENTRY_BLEND_MS;
      const entryEndX = 36;
      const entryEndY = 58 + Math.sin(Math.PI * 2 + phase) * 6;
      const tAnchor = wanderAnchorTimeMs(id, entryEndX, entryEndY);
      const wanderJoin = wanderPosition(id, tAnchor);
      const blendX = entryEndX + (wanderJoin.x - entryEndX) * blendT;
      const blendY = entryEndY + (wanderJoin.y - entryEndY) * blendT;
      const dx = wanderJoin.x - entryEndX;
      const facingRight =
        Math.abs(dx) > 0.35 ? dx >= 0 : wanderJoin.velocityX >= 0;
      return { x: blendX, y: blendY, facingRight };
    }

    const tAnchor = wanderAnchorTimeMs(
      id,
      36,
      58 + Math.sin(Math.PI * 2 + phase) * 6,
    );
    const pathMs = wanderElapsed - ENTRY_BLEND_MS;
    const wandered = wanderPosition(id, tAnchor + pathMs);
    return {
      x: wandered.x,
      y: wandered.y,
      facingRight: wandered.velocityX >= 0,
    };
  }

  const exitElapsed = elapsedMs - (ENTRY_MS + WANDER_MS);
  const progress = Math.min(1, exitElapsed / EXIT_MS);
  const entryEndX = 36;
  const entryEndY = 58 + Math.sin(Math.PI * 2 + phase) * 6;
  const tAnchor = wanderAnchorTimeMs(id, entryEndX, entryEndY);
  const exitStart = wanderPosition(id, tAnchor + WANDER_MS - ENTRY_BLEND_MS);
  const exitX = 112;
  const x = exitStart.x + (exitX - exitStart.x) * progress;
  const y = exitStart.y + Math.cos(progress * Math.PI * 2 + phase * 0.3) * 2;
  return { x, y, facingRight: true };
}

const optimisticChannelName = "goose-wander-optimistic";

export default function DisplayPage() {
  const [gooseEvents, setGooseEvents] = useState<GooseRecord[]>([]);
  const [now, setNow] = useState(0);

  useEffect(() => {
    let frameId = 0;
    const tick = () => {
      setNow(Date.now());
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    const client = createAblyRealtimeClient();
    const channel = client.channels.get("goose-wander");
    let mounted = true;
    let optimisticChannel: BroadcastChannel | null = null;

    async function hydrate() {
      const res = await fetch("/api/realtime", { cache: "no-store" });
      const data = (await res.json()) as { events?: GooseRecord[] };
      if (!mounted) return;
      const recent = Array.isArray(data.events) ? data.events : [];
      setGooseEvents(recent);
    }

    hydrate();

    channel.subscribe("goose:new", (message) => {
      const incoming = message.data as GooseRecord;
      setGooseEvents((current) => {
        const next = [incoming, ...current.filter((item) => item.id !== incoming.id)];
        return next.slice(0, 40);
      });
    });

    if (typeof window !== "undefined") {
      if ("BroadcastChannel" in window) {
        optimisticChannel = new BroadcastChannel(optimisticChannelName);
        optimisticChannel.onmessage = (event) => {
          const incoming = event.data as GooseRecord;
          setGooseEvents((current) => {
            const next = [incoming, ...current.filter((item) => item.id !== incoming.id)];
            return next.slice(0, 40);
          });
        };
      } else {
        const win = window as Window;
        const onStorage = (event: StorageEvent) => {
          if (event.key !== optimisticChannelName || !event.newValue) return;
          const incoming = JSON.parse(event.newValue) as GooseRecord;
          setGooseEvents((current) => {
            const next = [incoming, ...current.filter((item) => item.id !== incoming.id)];
            return next.slice(0, 40);
          });
        };
        win.addEventListener("storage", onStorage);
        optimisticChannel = {
          close() {
            win.removeEventListener("storage", onStorage);
          },
        } as BroadcastChannel;
      }
    }

    return () => {
      mounted = false;
      optimisticChannel?.close();
      channel.unsubscribe();
      client.close();
    };
  }, []);

  const activeGooseEvents = useMemo(
    () =>
      gooseEvents.filter((goose) => {
        const elapsed = now - new Date(goose.created_at).getTime();
        return elapsed >= 0 && elapsed < WANDER_TOTAL_MS;
      }),
    [gooseEvents, now]
  );

  return (
    <main
      className="relative min-h-screen w-full overflow-hidden bg-black bg-center bg-no-repeat text-zinc-100"
      style={{
        backgroundImage: "url('/bg.png')",
        backgroundSize: "100% 100%",
      }}
    >
      {activeGooseEvents
        .slice()
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .map((goose, index) => {
          const elapsed = now - new Date(goose.created_at).getTime();
          const position = wanderStagePosition(goose.id, elapsed);
          const frameIndex = Math.floor((elapsed / 260) % frameCount);
          const frameOffset = gooseKinds.indexOf(goose.goose_kind as (typeof gooseKinds)[number]) * frameCount;
          const frame = spriteFrames[Math.max(0, frameOffset) + frameIndex];

          return (
            <div
              key={`${goose.id}-${index}`}
              className="absolute left-0 top-0 will-change-transform drop-shadow-[0_10px_30px_rgba(255,255,255,0.08)]"
              style={{
                transform: `translate3d(${position.x}vw, ${position.y}vh, 0) translateX(-50%) translateY(-50%)`,
              }}
            >
              <div className="flex flex-col items-center gap-1">
                <div className="rounded-full border border-white/10 bg-blue-400 px-3 py-1 text-center text-sm font-medium text-white shadow-lg shadow-black/30 backdrop-blur">
                  {goose.guest_name?.trim() || "Anonymous"}
                </div>
                <img
                  src={frame}
                  alt=""
                  className="h-36 select-none object-contain image-pixel"
                  style={{ transform: `scaleX(${position.facingRight ? 1 : -1})` }}
                  draggable={false}
                  aria-hidden="true"
                />
              </div>
            </div>
          );
        })}

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(250,204,21,0.06),transparent_55%)]" />
    </main>
  );
}
