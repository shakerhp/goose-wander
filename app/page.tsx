"use client";

import { useState } from "react";

type GooseKind = "original" | "media" | "tradesman" | "nerd" | "paint" | "robot";

type GooseInfo = {
  id: GooseKind;
  name: string;
  image: string;
  title: string;
  description: string;
  role: string;
};

const geese: Array<GooseInfo> = [
  {
    id: "media",
    name: "สายออกแบบ",
    image: "/goose/media/frame_1.svg",
    title: "น้องจีด (Jeed) – The Sound & Media Geek",
    description:
      "การออกแบบน้องจืด สายเทคนิค ซาวด์ เท่ลึก เงียบๆ เท่ๆ ชอบเสียง ดนตรี เอฟเฟกต์ จริงจังกับงานโปรดักชัน เป็นคนเบื้องหลัง แต่ขาดไม่ได้",
    role: "ตัวแทน Sound Design / Multimedia Production / Event Tech",
  },
  {
    id: "tradesman",
    name: "สายเทคนิค",
    image: "/goose/tradesman/frame_1.svg",
    title: "น้องจอด (Jod) – The Visionary Engineer",
    description:
      "การออกแบบน้องจ๊อด ผู้นำ / นักคิด / ฝันใหญ่ ฉลาด สุขุม คิดเป็นระบบ ชอบวางแผน ทำงานเป็นหัวหน้าโปรเจค เชื่อในเทคโนโลยีและอนาคต พูดน้อย แต่ทุกคำมีน้ำหนัก",
    role: "ตัวแทน Game / Interactive System / Creative Technology Engineer คนออกแบบระบบ เกม อินเตอร์แอคทีฟ",
  },
  {
    id: "nerd",
    name: "สายสื่อสาร",
    image: "/goose/nerd/frame_1.svg",
    title: "จ๊าด (Jard) – The Entertainer & Influencer",
    description:
      "การออกแบบน้องจ๊าด ตัวฮา นักสื่อสาร performer พูดเก่ง ตลก ชอบถ่ายคลิป ไลฟ์ สตรีม เป็นสะพานเชื่อมคนกับเทคโนโลยี ขี้เล่น แต่จริงใจ",
    role: "ตัวแทน Entertainment Media / Content Creator / Presenter",
  },
  {
    id: "paint",
    name: "สายอาทติส",
    image: "/goose/paint/frame_1.svg",
    title: "จูด (Jood) – The Creative Artist",
    description:
      "การออกแบบน้องจูด ศิลปิน อินดี้ อ่อนไหว ชอบวาดรูป ทำโมชั่น ออกแบบ คิดไอเดียแปลกใหม่ อินกับธรรมชาติ ดอกไม้ แสงแดด โลกส่วนตัวสูง แต่ใจดี",
    role: "ตัวแทน Animation / 3D Artist / Character Designer",
  },
  {
    id: "robot",
    name: "สายหุ่นยนต์",
    image: "/goose/robot/frame_1.svg",
    title: "จอม (Jom) – The Smart Robot",
    description:
      "การออกแบบน้องจอม หุ่นยนต์ผู้ช่วย AI อัจฉริยะ แม่นยำ น่ารักแต่เก่งเกินคาด พูดสั้น ชัด ตรงประเด็น คิดเร็ว ประมวลผลไว ชอบช่วยเพื่อนแก้ปัญหา บางครั้งเข้าใจอารมณ์คนไม่ทัน ทำให้ตลก ภายนอกดูนิ่ง แต่จริงๆ ห่วงทุกคน",
    role: "ตัวแทน AI / Robotics / Automation / Smart Interactive Technology",
  },
  {
    id: "original",
    name: "สายตลอด",
    image: "/goose/original/frame_1.svg",
    title: "เจต (Jet) – Always late",
    description: "การออกแบบน้องเจต ธรรมดา ยังไม่ชัดเจน กำลังค้นหาตัวเอง เติบโตได้เสมอ เป็นมิตร เข้ากับคนง่าย ลองหลายอย่าง แต่ยังไม่เจอสิ่งที่ใช่ บางครั้งไม่มั่นใจ เปรียบเทียบตัวเองกับคนอื่น ชอบตั้งคำถามว่า “เราถนัดอะไรนะ?” แม้สับสน แต่ไม่ยอมแพ้",
    role: "ตัวแทน นักศึกษาที่ยังหาตัวเองไม่เจอ / คนที่ยังไม่รู้ว่าชอบสายไหน / คนธรรมดาที่กำลังเริ่มต้น / ผู้ชมงานที่เข้ามาหาคำตอบ",
  },
];

const starOptions = [1, 2, 3, 4, 5] as const;
type RatingValue = (typeof starOptions)[number] | 0;

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 576 512"
      height="1em"
      xmlns="http://www.w3.org/2000/svg"
      className={filled ? "star-solid text-[#ffd666]" : "star-solid text-zinc-500"}
      aria-hidden="true"
    >
      <path
        d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z"
        fill="currentColor"
      />
    </svg>
  );
}

const optimisticChannelName = "goose-wander-optimistic";

function broadcastOptimisticGoose(event: { id: string; goose_kind: GooseKind; guest_name: string; rating: number; comment: string | null; created_at: string }) {
  if (typeof window === "undefined") return;

  const payload = JSON.stringify(event);

  try {
    if ("BroadcastChannel" in window) {
      const channel = new BroadcastChannel(optimisticChannelName);
      channel.postMessage(event);
      channel.close();
      return;
    }
  } catch {
    // ignore and fall back to localStorage
  }

  try {
    window.localStorage.setItem(optimisticChannelName, payload);
    window.localStorage.removeItem(optimisticChannelName);
  } catch {
    // ignore storage errors
  }
}

export default function Home() {
  const [step, setStep] = useState<"details" | "goose" | "thanks">("details");
  const [selected, setSelected] = useState<GooseKind>("original");
  const [guestName, setGuestName] = useState("");
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState<RatingValue>(0);
  const [sending, setSending] = useState(false);
  const [nameMessage, setNameMessage] = useState("");
  const [ratingMessage, setRatingMessage] = useState("");

  function goNextStep() {
    const nextNameMessage = !guestName.trim() ? "กรุณากรอกชื่อ" : "";
    const nextRatingMessage = rating < 1 ? "กรุณาให้คะแนน" : "";

    setNameMessage(nextNameMessage);
    setRatingMessage(nextRatingMessage);

    if (nextNameMessage || nextRatingMessage) {
      return;
    }

    setStep("goose");
  }

  async function sendGoose(kind: GooseKind) {
    if (!guestName.trim()) {
      setNameMessage("กรุณากรอกชื่อก่อนส่ง");
      setStep("details");
      return;
    }
    if (rating < 1) {
      setRatingMessage("กรุณาให้คะแนนก่อนส่ง");
      setStep("details");
      return;
    }

    setSending(true);
    setNameMessage("");
    setRatingMessage("");
    try {
      const response = await fetch("/api/goose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goose: kind,
          guestName: guestName.trim(),
          rating,
          comment: comment.trim() || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.error ?? "บันทึกไม่สำเร็จ");
      }

      const result = await response.json();
      broadcastOptimisticGoose(result.event);
      setNameMessage(`บันทึกชื่อ ${result.event.guest_name} เรียบร้อยแล้ว`);
      setRatingMessage(`ให้คะแนน ${result.event.rating} ดาวเรียบร้อยแล้ว`);
      setGuestName("");
      setComment("");
      setRating(0);
      setStep("thanks");
      setSelected("original");
    } catch (error) {
      setNameMessage(error instanceof Error ? error.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-zinc-100">
      <section
        className={`mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-10 px-6 lg:px-10 ${step === "details" ? "justify-center py-6" : "py-10"
          }`}
      >
        {step === "thanks" ? (
          <div className="flex min-h-[70vh] w-full items-center justify-center">
            <div className="text-center">
              <p className="text-3xl font-medium text-zinc-100">ขอบคุณที่ร่วมสนุก</p>
            </div>
          </div>
        ) : step === "details" ? (
          <div className="mx-auto w-full max-w-2xl rounded-3xl border border-white/10 bg-zinc-950/80 p-4 shadow-2xl shadow-black/30">
            <div className="space-y-6">
              <div className="flex justify-center">
                <img
                  src="/logo.png"
                  alt="Goose Wander Logo"
                  className="h-52 w-auto object-contain"
                />
              </div>

              <div className="space-y-2 text-left">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-medium text-zinc-200">ชื่อของคุณ</span>
                  {nameMessage ? <p className="text-sm text-red-400">{nameMessage}</p> : null}
                </div>
                <input
                  value={guestName}
                  onChange={(event) => {
                    setGuestName(event.target.value);
                    if (nameMessage) setNameMessage("");
                  }}
                  placeholder="กรอกชื่อที่นี่"
                  className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:border-yellow-400/60 focus:bg-white/10"
                />
              </div>

              <div className="space-y-2 text-left">
                <div className="flex items-center gap-3">
                  <span className="block text-lg font-medium text-zinc-200">ความพึ่งพอใจ</span>
                  {ratingMessage ? <p className="text-sm text-red-400">{ratingMessage}</p> : null}
                </div>
                <div className="rating mt-3 flex items-center justify-center gap-2">
                  {starOptions.map((star) => (
                    <div key={star} className="relative">
                      <input
                        type="radio"
                        id={`star${star}`}
                        name="rate"
                        value={star}
                        checked={rating === star}
                        onChange={() => {
                          setRating(star);
                          if (ratingMessage) setRatingMessage("");
                        }}
                        className="peer absolute h-0 w-0 opacity-0"
                      />
                      <label
                        htmlFor={`star${star}`}
                        className="cursor-pointer p-1.5 text-4xl transition-transform duration-150 hover:scale-110 peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-yellow-400/60 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-black"
                      >
                        <StarIcon filled={rating >= star} />
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <label className="block text-left">
                <span className="text-lg font-medium text-zinc-200">ความคิดเห็น (ไม่บังคับ)</span>
                <textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="พิมพ์ความคิดเห็นเพิ่มเติมได้ที่นี่"
                  rows={3}
                  className="mt-4 w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:border-yellow-400/60 focus:bg-white/10"
                />
              </label>

              <button
                type="button"
                onClick={goNextStep}
                className="w-full rounded-full border border-yellow-400/30 bg-yellow-400/10 px-6 py-3 text-lg font-medium text-yellow-200 transition hover:bg-yellow-400/20"
              >
                ถัดไป
              </button>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
            <div className="mx-auto w-full max-w-3xl p-6 text-center shadow-2xl shadow-black/30">
              <span className="text-3xl font-medium text-zinc-200">เลือกห่านที่ใช่ ในสายที่ชอบ</span>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-3">
                {geese.map((goose, index) => {
                  const isActive = goose.id === selected;
                  const isRightSide = index % 2 === 1;
                  const isBottomRowMobile = index >= geese.length - 2;
                  const isBottomRowDesktop = index >= geese.length - 3;
                  const mobilePosition = isRightSide
                    ? "right-0 left-auto translate-x-0"
                    : "left-0 right-auto translate-x-0";
                  const popupPosition = isBottomRowMobile
                    ? "bottom-full mb-4 top-auto"
                    : "top-full mt-4 bottom-auto";
                  const desktopPosition = isBottomRowDesktop
                    ? "md:bottom-full md:mb-4 md:top-auto"
                    : "md:top-full md:mt-4 md:bottom-auto";
                  const arrowPosition = isBottomRowMobile
                    ? isRightSide
                      ? "-bottom-2 right-6 left-auto md:left-1/2 md:right-auto md:-translate-x-1/2"
                      : "-bottom-2 left-6 right-auto md:left-1/2 md:right-auto md:-translate-x-1/2"
                    : isRightSide
                      ? "-top-2 right-6 left-auto md:left-1/2 md:right-auto md:-translate-x-1/2"
                      : "-top-2 left-6 right-auto md:left-1/2 md:right-auto md:-translate-x-1/2";

                  return (
                    <div key={goose.id} className="relative">
                      <button
                        type="button"
                        onClick={() => setSelected(goose.id)}
                        title={`${goose.name} - ${goose.title}`}
                        aria-describedby={isActive ? `goose-tooltip-${goose.id}` : undefined}
                        className={`group h-full w-full overflow-hidden rounded-3xl border bg-zinc-950/80 text-center transition hover:-translate-y-1 hover:bg-zinc-900 ${isActive ? "border-yellow-400/60" : "border-white/10"}`}
                      >
                        <div className="aspect-square overflow-hidden bg-[radial-gradient(circle_at_top,rgba(250,204,21,0.15),transparent_60%)] p-2 sm:p-3">
                          <div
                            className="mx-auto h-full w-full bg-contain bg-center bg-no-repeat image-pixel"
                            style={{ backgroundImage: `url(${goose.image})` }}
                            aria-hidden="true"
                          />
                        </div>
                        <div className="border-t border-white/10 p-5">
                          <h2 className="text-lg font-medium text-white">{goose.name}</h2>
                        </div>
                      </button>

                      {isActive ? (
                        <div className={`absolute ${popupPosition} z-20 w-[min(320px,calc(100vw-2rem))] ${mobilePosition} ${desktopPosition}`}>
                          <div className="relative origin-top scale-95 rounded-2xl border border-yellow-400/20 bg-black/90 p-4 text-left text-sm text-zinc-200 opacity-0 shadow-2xl shadow-black/50 backdrop-blur-sm motion-safe:animate-[popupIn_220ms_cubic-bezier(0.16,1,0.3,1)_forwards] motion-safe:opacity-100 motion-safe:scale-100 motion-safe:transition motion-safe:duration-200 motion-safe:ease-out">
                            <div className={`absolute h-4 w-4 rotate-45 border-l border-t border-yellow-400/20 bg-black/90 ${arrowPosition}`} />
                            <p className="text-yellow-200">{goose.title}</p>
                            {goose.description ? <p className="mt-2 leading-6 text-zinc-300">{goose.description}</p> : null}
                            {goose.role ? <p className="mt-2 text-zinc-400">{goose.role}</p> : null}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              <div className="mx-auto flex w-full max-w-xl flex-col gap-4 rounded-3xl border border-white/10 bg-zinc-950/80 p-4 shadow-2xl shadow-black/30">
                <button
                  type="button"
                  disabled={sending}
                  onClick={() => sendGoose(selected)}
                  className="w-full rounded-full border border-yellow-400/30 bg-yellow-400/10 px-6 py-3 text-lg font-medium text-yellow-200 transition hover:bg-yellow-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sending ? "กำลังส่ง..." : "ส่งห่าน"}
                </button>

                <button
                  type="button"
                  onClick={() => setStep("details")}
                  className="w-full rounded-full border border-white/10 bg-white/5 px-6 py-3 text-lg font-medium text-zinc-200 transition hover:bg-white/10"
                >
                  ย้อนกลับ
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
