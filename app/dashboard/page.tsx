"use client";

import { useEffect, useState } from "react";
import type { GooseDashboardStats } from "@/lib/goose";

const labels: Record<keyof GooseDashboardStats["selections"], string> = {
  media: "สายออกแบบ",
  tradesman: "สายเทคนิค",
  nerd: "สายสื่อสาร",
  paint: "สายอาทติส",
  robot: "สายหุ่นยนต์",
  original: "สายตลอด",
};

const satisfactionLabels: Record<1 | 2 | 3 | 4 | 5, string> = {
  5: "พึงพอใจมากที่สุด",
  4: "พึงพอใจมาก",
  3: "พึงพอใจปานกลาง",
  2: "พึงพอใจน้อย",
  1: "พึงพอใจน้อยที่สุด / ควรปรับปรุง",
};

export default function DashboardPage() {
  const [stats, setStats] = useState<GooseDashboardStats>({
    totalEvents: 0,
    selections: { original: 0, media: 0, tradesman: 0, nerd: 0, paint: 0, robot: 0 },
    ratings: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    topRating: null,
    topRatingCount: 0,
  });

  useEffect(() => {
    async function loadStats() {
      const res = await fetch("/api/dashboard", { cache: "no-store" });
      const data = (await res.json()) as GooseDashboardStats;
      setStats(data);
    }

    loadStats();
    const timer = window.setInterval(loadStats, 4000);
    return () => window.clearInterval(timer);
  }, []);

  const totalRatedPeople = Object.values(stats.ratings).reduce((sum, count) => sum + count, 0);
  const weightedRatingSum = (Object.entries(stats.ratings) as Array<[`${1 | 2 | 3 | 4 | 5}`, number]>).reduce(
    (sum, [rate, count]) => sum + Number(rate) * count,
    0,
  );
  const averageRating = totalRatedPeople > 0 ? weightedRatingSum / totalRatedPeople : null;

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white lg:px-10">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="border border-white/10 bg-white/5 p-6 backdrop-blur rounded-xl">
          <p className="text-xs uppercase tracking-[0.35em] text-yellow-300/80">/dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold">สถิติห่านทั้งหมด</h1>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="border border-white/10 bg-zinc-950 p-6 rounded-xl">
            <p className="text-sm text-zinc-400">จำนวนห่านที่ถูกส่งเข้ามา</p>
            <p className="mt-3 text-5xl font-semibold text-yellow-300">{stats.totalEvents}</p>
          </div>
          <div className="border border-white/10 bg-zinc-950 p-6 rounded-xl">
            <p className="text-sm text-zinc-400">จำนวนการเลือกคาแรคเตอร์ห่าน</p>
            <p className="mt-3 text-5xl font-semibold text-white">
              {Object.values(stats.selections).reduce((sum, value) => sum + value, 0)}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="border border-white/10 bg-zinc-950 p-6 rounded-xl">
            <p className="text-sm text-zinc-400">คะแนนความพึงพอใจโดยเฉลี่ย</p>
            <p className="mt-3 text-3xl font-semibold text-yellow-300">
              {averageRating !== null ? averageRating.toFixed(2) : "ยังไม่มีข้อมูล"}
            </p>
            <p className="mt-2 text-sm text-zinc-400">
              {averageRating !== null ? `จากผู้ให้คะแนน ${totalRatedPeople} คน` : ""}
            </p>
          </div>
          <div className="border border-white/10 bg-zinc-950 p-6 rounded-xl">
            <p className="text-sm text-zinc-400">จำนวนคนที่เลือกแต่ละระดับความพึงพอใจ</p>
            <div className="mt-4 grid grid-cols-5 gap-3">
              {[1, 2, 3, 4, 5].map((rate) => (
                <div key={rate} className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
                  <p className="text-xs text-zinc-400">{rate} คะแนน</p>
                  <p className="mt-1 text-[11px] leading-snug text-zinc-400">
                    {satisfactionLabels[rate as 1 | 2 | 3 | 4 | 5]}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">{stats.ratings[rate as 1 | 2 | 3 | 4 | 5]}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {Object.entries(labels).map(([key, label]) => (
            <div key={key} className="border border-white/10 bg-zinc-950 p-5 rounded-xl">
              <p className="text-sm text-zinc-400">{label}</p>
              <p className="mt-3 text-3xl font-semibold text-yellow-200">
                {stats.selections[key as keyof GooseDashboardStats["selections"]] ?? 0}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
