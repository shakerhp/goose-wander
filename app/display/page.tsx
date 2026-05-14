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

function hashFromId(id: string, salt: number): number {
  let h = (salt + 0xdeadbeef) ^ seedFromId(id);
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const SPONSORS = [
  "baanmaikhow.png",
  "bu.png",
  "h-lab.jpg",
  "pano_Industries.png",
  "tgu.png",
  "tik_screen.jpg"
];

export default function DisplayPage() {
  const [activeGooseEvents, setActiveGooseEvents] = useState<GooseRecord[]>([]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const ably = createAblyRealtimeClient();
    const channel = ably.channels.get("goose-updates");

    channel.subscribe("goose-event", (message) => {
      const newGoose = message.data as GooseRecord;
      setActiveGooseEvents((prev) => {
        const filtered = prev.filter((g) => g.id !== newGoose.id);
        return [...filtered, newGoose];
      });
    });

    const timer = setInterval(() => setNow(Date.now()), 50);
    return () => {
      channel.unsubscribe();
      clearInterval(timer);
    };
  }, []);

  return (
    <main
      className="relative min-h-screen w-full overflow-hidden bg-black bg-center bg-no-repeat text-zinc-100"
      style={{
        backgroundImage: "url('/bg.png')",
        backgroundSize: "100% 100%",
      }}
    >
      <div className="absolute top-0 left-0 z-50 w-full overflow-hidden mt-10">
        <div className="flex animate-marquee-right whitespace-nowrap w-max">
          {[...SPONSORS, ...SPONSORS].map((logo, i) => (
            <div key={`${logo}-${i}`} className="mx-12 flex flex-col items-center gap-2">
              <span className="text-[12px] font-bold tracking-[0.2em] text-black uppercase">
                ผู้สนับสนุน
              </span>
              <img
                src={`/sponser/${logo}`}
                alt="Sponsor"
                className="h-12 md:h-14 w-auto object-contain"
              />
            </div>
          ))}
        </div>
      </div>

      {activeGooseEvents
        .slice()
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .map((goose, index) => {
          const createdAt = new Date(goose.created_at).getTime();
          const elapsed = now - createdAt;
          if (elapsed < 0 || elapsed > WANDER_TOTAL_MS) return null;

          const seed = seedFromId(goose.id);
          const startX = hashFromId(goose.id, 1) < 0.5 ? -10 : 110;
          const endX = startX < 0 ? 110 : -10;
          const wanderX = WANDER_X_MIN + hashFromId(goose.id, 2) * (WANDER_X_MAX - WANDER_X_MIN);
          const wanderY = WANDER_Y_MIN + hashFromId(goose.id, 3) * (WANDER_Y_MAX - WANDER_Y_MIN);

          let position = { x: wanderX, y: wanderY, facingRight: true };

          if (elapsed < ENTRY_MS) {
            const p = elapsed / ENTRY_MS;
            position.x = startX + (wanderX - startX) * p;
            position.facingRight = wanderX > startX;
          } else if (elapsed < ENTRY_MS + WANDER_MS) {
            const wElapsed = elapsed - ENTRY_MS;
            const ampX = 3 + hashFromId(goose.id, 4) * 4;
            const ampY = 2 + hashFromId(goose.id, 5) * 3;
            const freqX = 0.0005 + hashFromId(goose.id, 6) * 0.0005;
            const freqY = 0.0007 + hashFromId(goose.id, 7) * 0.0005;

            position.x = wanderX + Math.sin(wElapsed * freqX + phaseFromSeed(seed) * Math.PI * 2) * ampX;
            position.y = wanderY + Math.cos(wElapsed * freqY + phaseFromSeed(seed + 1) * Math.PI * 2) * ampY;
            position.facingRight = Math.cos(wElapsed * freqX + phaseFromSeed(seed) * Math.PI * 2) > 0;
          } else {
            const p = (elapsed - (ENTRY_MS + WANDER_MS)) / EXIT_MS;
            position.x = wanderX + (endX - wanderX) * p;
            position.facingRight = endX > wanderX;
          }

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