# Goose Wander

โปรเจกต์นี้เป็นระบบโหวต/เลือกคาแรกเตอร์ห่านแบบเรียลไทม์ โดยแบ่งเป็น 3 หน้าหลัก:
- หน้า `"/"` สำหรับกรอกชื่อ ให้คะแนน และเลือกห่าน
- หน้า `"/display"` สำหรับแสดงห่านที่เดินแบบเรียลไทม์บนจอ
- หน้า `"/dashboard"` สำหรับดูสถิติการเลือกและคะแนนความพึงพอใจ

ระบบใช้:
- **Next.js 16 (App Router)** สำหรับ UI และ API
- **Supabase** สำหรับเก็บข้อมูล event
- **Ably** สำหรับส่ง event แบบ realtime ไปยังหน้าจอแสดงผล

## แนวคิดการทำงานหลัก (Architecture)

ลำดับการทำงานของระบบ:
1. ผู้ใช้เข้าหน้า `"/"` กรอกชื่อ + ให้คะแนน + เลือกห่าน
2. ฝั่ง client ส่ง `POST /api/goose`
3. API ตรวจข้อมูล (ชนิดห่าน, ชื่อ, คะแนน 1-5) แล้วเรียก service
4. Service บันทึกข้อมูลลงตาราง `goose_events` ใน Supabase
5. Service publish event `goose:new` ผ่าน Ably channel `goose-wander`
6. หน้า `"/display"` subscribe channel แล้วแสดงห่านใหม่ทันที
7. หน้า `"/dashboard"` ดึงข้อมูลรวมผ่าน `GET /api/dashboard` เป็นระยะเพื่อรีเฟรชสถิติ

## โครงสร้างส่วนสำคัญของโปรเจกต์

- `app/page.tsx`  
  หน้าเริ่มต้นสำหรับรับ input ผู้ใช้ (ชื่อ, คะแนน, ความคิดเห็น) และเลือกห่านก่อนส่งข้อมูล

- `app/display/page.tsx`  
  หน้าจอแสดงผลห่านแบบ animation (entry -> wander -> exit) โดยอิงเวลา `created_at` ของแต่ละ event

- `app/dashboard/page.tsx`  
  หน้า dashboard แสดงผลรวม: จำนวน event, จำนวนการเลือกแต่ละสาย, การกระจายคะแนน และค่าเฉลี่ยคะแนน

- `app/api/goose/route.ts`  
  endpoint สำหรับรับคำตอบจากหน้าแรกและสร้าง event ใหม่

- `app/api/realtime/route.ts`  
  endpoint ส่งรายการ event ล่าสุดให้หน้า display ใช้ hydrate ตอนโหลดหน้า

- `app/api/dashboard/route.ts`  
  endpoint สำหรับคำนวณและส่งข้อมูลสถิติให้ dashboard

- `lib/goose-service.ts`  
  business logic หลัก: insert event, list event ล่าสุด, สรุปสถิติ, และ publish Ably

- `lib/supabase.ts`  
  สร้าง Supabase admin client จาก environment variables

- `lib/ably.ts` และ `lib/ably-client.ts`  
  แยก Ably ฝั่ง server (publish) และฝั่ง client (subscribe)

- `supabase-schema.sql`  
  โครงสร้างฐานข้อมูลตาราง `goose_events` และ index ที่ใช้เพิ่มประสิทธิภาพ query

## หน้าที่ของแต่ละหน้า (Page Responsibilities)

### 1) หน้า `/` (หน้าโหวต/เลือกห่าน)
- รับข้อมูลชื่อผู้ใช้ (บังคับ)
- รับคะแนนความพึงพอใจ 1-5 ดาว (บังคับ)
- รับความคิดเห็นเพิ่มเติม (ไม่บังคับ)
- เลือกคาแรกเตอร์ห่าน 1 แบบจาก 5 แบบ
- ส่งข้อมูลไปที่ API และแสดงสถานะสำเร็จ/ล้มเหลว

### 2) หน้า `/display` (หน้าจอแสดงผลสด)
- โหลด event ล่าสุดตอนเข้าเพจครั้งแรก
- ฟัง event ใหม่แบบ realtime ผ่าน Ably
- คำนวณตำแหน่งห่านตามเวลาเพื่อให้การเคลื่อนไหวต่อเนื่อง
- แสดงชื่อผู้ส่งคู่กับ sprite ของห่าน

### 3) หน้า `/dashboard` (หน้าสถิติ)
- ดึงข้อมูลสรุปจาก API ทุก 4 วินาที
- แสดงจำนวน event ทั้งหมด
- แสดงจำนวนการเลือกแต่ละสายห่าน
- แสดงการกระจายคะแนน 1-5 และค่าเฉลี่ยคะแนน

## ลำดับแนะนำในการพัฒนา (ทำอะไรก่อน-หลัง)

แนะนำพัฒนาตามลำดับนี้เพื่อให้ระบบต่อกันได้ง่าย:

1. **ออกแบบฐานข้อมูลก่อน**  
   สร้างตาราง `goose_events` และ constraint/index ใน `supabase-schema.sql`

2. **ทำชั้น `lib` ฝั่ง backend (ขั้นตอนสำคัญที่สุดก่อนทำ API)**  
   เป้าหมายของชั้น `lib` คือรวบ logic ที่เชื่อมกับระบบภายนอกไว้ที่เดียว (Supabase / Ably) เพื่อให้ API route สั้น อ่านง่าย และแก้ไขง่ายในอนาคต

   สิ่งที่ควรทำในขั้นนี้ (แนะนำตามลำดับ):

   - **2.1 สร้าง type กลางก่อน (`lib/goose.ts`)**  
     กำหนดชนิดข้อมูลที่ทุกส่วนต้องใช้ร่วมกัน เช่น:
     - `GooseKind` (ชนิดห่านที่อนุญาต)
     - `GooseRecord` (shape ข้อมูลที่เก็บใน DB)
     - `GooseEventPayload` (ข้อมูลที่รับเข้ามาเพื่อสร้าง event)
     - `GooseDashboardStats` (โครงสร้างข้อมูลสถิติสำหรับ dashboard)  
     ประโยชน์คือช่วยลดการเขียน type ซ้ำ และกัน bug จาก field ไม่ตรงกันระหว่างหน้า/API/service

   - **2.2 สร้าง Supabase client ฝั่ง server (`lib/supabase.ts`)**  
     รับค่า env (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) แล้วสร้าง `supabaseAdmin`  
     หน้าที่ของไฟล์นี้คือ "จุดเดียว" สำหรับเชื่อม DB ฝั่ง backend

   - **2.3 สร้าง Ably client แยก server/client ให้ชัดเจน**  
     - `lib/ably.ts` = ฝั่ง server ใช้ `ABLY_API_KEY` สำหรับ publish event  
     - `lib/ably-client.ts` = ฝั่ง browser ใช้ `NEXT_PUBLIC_ABLY_PUBLIC_KEY` สำหรับ subscribe  
     การแยกไฟล์แบบนี้ช่วยกันการเผลอนำ key ฝั่ง server ไปใช้ใน client bundle

   - **2.4 รวม business logic ทั้งหมดไว้ใน `lib/goose-service.ts`**  
     ให้ service เป็นคน "ตัดสินใจหลัก" แทน API route โดยอย่างน้อยควรมี 3 ฟังก์ชัน:
     - `createGooseEvent(payload)`  
       ตรวจข้อมูล -> normalize ค่า (เช่น trim ชื่อ/คอมเมนต์) -> insert DB -> publish `goose:new` ไป Ably
     - `listGooseEvents(limit)`  
       ดึง event ล่าสุดไปใช้ในหน้า display ตอนเริ่มโหลด
     - `getGooseStats()`  
       อ่านข้อมูลจาก DB แล้วสรุปเป็นจำนวนเลือกแต่ละสาย + จำนวนคะแนนแต่ละระดับ + ค่าที่ต้องใช้ใน dashboard

   - **2.5 ใส่ fallback/error handling ให้พร้อมใช้งานจริง**  
     เช่นกรณี table ยังไม่ถูกสร้าง, schema คอลัมน์ไม่ตรง, หรือข้อมูลบาง field เป็น null  
     จุดนี้สำคัญมากสำหรับช่วงที่ระบบยังพัฒนาไม่ครบทุก environment

   ทำไมต้องทำชั้นนี้ก่อน API:
   - API route จะเหลือหน้าที่แค่ "รับ request + validate เบื้องต้น + เรียก service"
   - ทดสอบง่ายขึ้น เพราะ business logic อยู่รวมที่เดียว
   - เวลาเปลี่ยน DB schema หรือเปลี่ยนผู้ให้บริการ realtime จะแก้ใน `lib` เป็นหลัก ไม่กระทบหน้า UI มาก

   เกณฑ์ว่า "ชั้น lib พร้อมแล้ว":
   - เรียก `createGooseEvent` แล้วมี row ใหม่ใน `goose_events`
   - มี event `goose:new` ถูก publish ออก Ably
   - `listGooseEvents` คืนข้อมูลล่าสุดได้
   - `getGooseStats` คืนข้อมูลที่ dashboard ใช้ได้ทันที

3. **ทำ API routes (ให้ route บางและโยน logic ไปที่ service)**  
   เป้าหมายของชั้น API คือเป็น "ประตูรับ-ส่งข้อมูล" ไม่ใช่ที่เก็บ business logic หลัก  
   หลักคิดคือ: route รับ request -> validate เบื้องต้น -> เรียก `lib/goose-service.ts` -> ส่ง response กลับ

   สิ่งที่ควรทำในขั้นนี้ (แนะนำตามลำดับ):

   - **3.1 ทำ `app/api/goose/route.ts` ก่อน (endpoint หลักของระบบ)**  
     - **Method:** `POST /api/goose`  
     - **หน้าที่:** รับข้อมูลจากหน้า `/` เพื่อสร้าง event ใหม่
     - **Request body ที่คาดหวัง:**  
       - `goose` (ต้องเป็นค่าใน `GooseKind`)  
       - `guestName` (string และห้ามว่าง)  
       - `rating` (จำนวนเต็ม 1-5)  
       - `comment` (optional / null ได้)
     - **Validation ที่ควรมีใน route:**  
       - เช็ค JSON parse ได้  
       - เช็ค `goose` ถูกต้องด้วย type guard (`isGooseKind`)  
       - เช็ค `guestName` ไม่ว่าง  
       - เช็ค `rating` อยู่ในช่วง 1-5
     - **เมื่อผ่าน validation:** เรียก `createGooseEvent(...)`
     - **Response แนะนำ:**  
       - สำเร็จ: `200` พร้อม `{ event }`  
       - ไม่ผ่าน validation: `400` พร้อม `{ error: "..." }`

   - **3.2 ทำ `app/api/realtime/route.ts` (ใช้ hydrate หน้า display)**  
     - **Method:** `GET /api/realtime`  
     - **หน้าที่:** ส่ง event ล่าสุดให้หน้า `/display` ตอนโหลดครั้งแรก
     - **การทำงาน:** เรียก `listGooseEvents(limit)` แล้วคืน `{ events }`
     - **ข้อดี:**  
       หน้า display จะมีข้อมูลทันทีแม้ยังไม่มี event ใหม่จาก Ably ในวินาทีแรก

   - **3.3 ทำ `app/api/dashboard/route.ts` (รวมสถิติให้หน้า dashboard)**  
     - **Method:** `GET /api/dashboard`  
     - **หน้าที่:** ส่งข้อมูลสรุปสำเร็จรูปให้หน้า `/dashboard`
     - **การทำงาน:** เรียก `getGooseStats()` แล้ว return object สถิติทั้งหมด
     - **หลักคิดสำคัญ:**  
       ให้ route ส่งข้อมูลที่ UI ใช้ได้ทันที เพื่อลดการคำนวณซ้ำบน client

   โครงสร้างโค้ดที่แนะนำต่อไฟล์:
   1) import type/service ที่ต้องใช้  
   2) parse input (เฉพาะ route ที่รับ body)  
   3) validate แบบง่ายและชัดเจน  
   4) เรียก service function  
   5) ส่ง `NextResponse.json(...)`

   แนวทางจัดการ error:
   - **Validation error:** ตอบ `400` พร้อมข้อความที่ frontend เข้าใจได้
   - **Service/DB error:** ควรมี handling ให้ไม่หลุดเป็น stacktrace ดิบถึงผู้ใช้
   - **รูปแบบ error คงที่:** ใช้โครง `{ error: string }` ให้ทุก route

   ทำไม API ต้องบาง:
   - ลดโค้ดซ้ำระหว่าง endpoint
   - เปลี่ยน logic ได้จากจุดเดียวใน service
   - test ง่ายและ maintain ง่ายกว่า route อ้วน

   เกณฑ์ว่า "API routes พร้อมแล้ว":
   - `POST /api/goose` ส่งข้อมูลถูกต้องแล้วสร้าง event ได้จริง
   - `GET /api/realtime` คืนรายการล่าสุดเป็น array ได้
   - `GET /api/dashboard` คืน object สถิติที่หน้า dashboard แสดงได้ทันที
   - เมื่อส่งข้อมูลจาก `/` แล้วเห็นผลทั้งใน `/display` และ `/dashboard`

4. **ทำหน้า `/` (อธิบายฟังก์ชันการทำงานของ `app/page.tsx`)**  
   โฟลว์ฝั่งฟังก์ชัน (ไม่รวม UX/UI):
   - **บรรทัด 5-20:** กำหนดชนิดห่าน (`GooseKind`), ข้อมูลห่านที่เลือกได้ (`geese`), และชนิดข้อมูลคะแนน (`RatingValue`)
   - **บรรทัด 39-47:** ประกาศ state หลักของหน้า เช่น ขั้นตอนปัจจุบัน (`step`), ชื่อผู้ใช้, คะแนน, ความคิดเห็น, สถานะการส่ง, ข้อความสถานะ
   - **บรรทัด 48-60 (`goNextStep`):** ตรวจข้อมูลขั้นต่ำก่อนเปลี่ยนขั้นจากกรอกข้อมูล -> เลือกห่าน (ต้องมีชื่อและคะแนน)
   - **บรรทัด 62-105 (`sendGoose`):** ฟังก์ชันส่งข้อมูลหลัก  
     1) validate ซ้ำก่อนส่ง  
     2) เรียก `POST /api/goose`  
     3) แปลผล response สำเร็จ/ล้มเหลว  
     4) reset state หลังบันทึกสำเร็จ  
     5) จัดการ loading ด้วย `sending`
   - **บรรทัด 107-236:** ผูก event handler กับ logic ข้างต้น (`onClick`, `onChange`, `disabled`) เพื่อให้ฟอร์มและการส่งข้อมูลทำงานครบเส้นทาง

5. **ทำหน้า `/display` (อธิบายฟังก์ชันการทำงานของ `app/display/page.tsx`)**  
   โฟลว์ฝั่งฟังก์ชัน (ไม่รวม UX/UI):
   - **บรรทัด 5-17:** กำหนดค่าคงที่ของระบบแอนิเมชัน เช่นจำนวนเฟรม sprite และช่วงเวลา entry/wander/exit
   - **บรรทัด 18-52 (`seedFromId`, `phaseFromSeed`, `wanderPosition`):** ฟังก์ชันคำนวณพฤติกรรมการเคลื่อนที่แบบ deterministic จาก `id` และเวลา
   - **บรรทัด 54-96 (`wanderStagePosition`):** แบ่งสถานะการเคลื่อนที่เป็น 3 ระยะ (เข้า, เดินวน, ออก) แล้วคืนตำแหน่ง/ทิศทางที่ควรแสดง
   - **บรรทัด 98-110 (`useEffect` แรก):** สร้าง animation ticker ด้วย `requestAnimationFrame` เพื่ออัปเดต `now` ต่อเนื่อง
   - **บรรทัด 112-140 (`useEffect` ที่สอง):** เชื่อม realtime  
     1) hydrate ข้อมูลแรกจาก `GET /api/realtime`  
     2) subscribe Ably channel `goose-wander` event `goose:new`  
     3) merge event ใหม่แบบไม่ซ้ำ `id` และจำกัดจำนวนรายการ
   - **บรรทัด 142-149 (`useMemo`):** คัดเฉพาะ event ที่ยังอยู่ในช่วงเวลาที่ต้องแสดงผล (`WANDER_TOTAL_MS`)
   - **บรรทัด 151-194:** วน render event ที่ active โดยคำนวณตำแหน่งและเฟรมจากเวลาแต่ละตัว

6. **ทำหน้า `/dashboard` (อธิบายฟังก์ชันการทำงานของ `app/dashboard/page.tsx`)**  
   โฟลว์ฝั่งฟังก์ชัน (ไม่รวม UX/UI):
   - **บรรทัด 6-20:** กำหนด mapping ค่าคงที่ที่ใช้แปลผลข้อมูลสถิติ (`labels`, `satisfactionLabels`)
   - **บรรทัด 22-29:** กำหนด state `stats` พร้อมค่าเริ่มต้นที่ตรงกับ type `GooseDashboardStats`
   - **บรรทัด 31-41 (`useEffect`):** ฟังก์ชัน `loadStats` เรียก `GET /api/dashboard` แล้วตั้ง timer refresh ทุก 4 วินาที
   - **บรรทัด 43-49:** คำนวณค่าต่อยอดจากข้อมูลดิบ (จำนวนผู้ให้คะแนนรวม, weighted sum, ค่าเฉลี่ยคะแนน)
   - **บรรทัด 50-110:** นำ `stats` และค่าที่คำนวณได้มาแสดงผลเป็นตัวเลขสรุปแต่ละหมวด

7. **ทดสอบ end-to-end ทั้งระบบ**  
   ทดสอบเส้นทางจริง: ส่งจาก `/` แล้วเห็นผลทันทีใน `/display` และตัวเลขอัปเดตใน `/dashboard`

## Environment Variables ที่ต้องมี

ตัวแอปอ่านค่าจาก environment ดังนี้:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ABLY_API_KEY`
- `NEXT_PUBLIC_ABLY_PUBLIC_KEY`

> หมายเหตุ: ควรสร้างไฟล์ `.env.local` ในเครื่องสำหรับ development และไม่ commit คีย์จริงขึ้น repository สาธารณะ

## การรันโปรเจกต์

```bash
npm install
npm run dev
```

เปิดใช้งานที่ `http://localhost:3000`

หน้าใช้งานหลัก:
- `http://localhost:3000/`
- `http://localhost:3000/display`
- `http://localhost:3000/dashboard`
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
