# PRD — Percetakan Digital

## Ringkasan
Aplikasi web untuk percetakan digital: pelanggan menghitung harga otomatis
berdasarkan bahan, finishing, ukuran, dan jumlah; mengunggah file desain;
membuat pesanan; lalu mengikuti alur proof → persetujuan → antrean produksi
per mesin → tracking status. Admin mengelola proof, antrean mesin, dan status
produksi.

## Stack
Next.js 14 (App Router) + TypeScript + Prisma 5.22 + SQLite + Tailwind CSS.
Alias `@/*` ke root. `lib/prisma.ts` singleton PrismaClient. Seed via tsx
(`npm run seed`). File upload disimpan di direktori lokal `uploads/`
(gitignored); metadata tercatat di DB.

## Aturan Bisnis

### Upload file desain
- Multipart `POST /api/upload`, field `file`.
- Tipe yang diterima: PDF, JPG, JPEG, PNG (cek MIME + ekstensi). Selain itu → 400.
- Ukuran maksimal 20 MB; melebihi → 413.
- File disimpan di `uploads/<random>.<ext>`; metadata (nama asli, mime,
  ukuran, waktu) disimpan di tabel `DesainFile`.

### Master harga
- **Bahan**: nama, `tipeHarga` (`per_cm2` | `per_lembar`), `hargaDasar`
  (rupiah per cm² atau per lembar).
- **Finishing**: nama, `tipeBiaya` (`per_cm2` | `per_lembar` | `flat`),
  `biaya` (rupiah; `flat` = biaya tetap per pesanan).
- **TierHarga**: rentang jumlah (`minQty`–`maxQty`, `maxQty` null = tak
  terbatas) dengan `diskonPersen` yang menurunkan harga per unit.
- Data contoh: Art Carton, HVS, Vinyl, Albatros, Stiker (per lembar);
  Laminating Doff, Laminating Glossy, UV Spot, Emboss (flat);
  tier 1–50 (0%), 51–200 (10%), 201+ (20%).

### Kalkulasi harga otomatis
`POST /api/kalkulasi` menerima `{ bahanId, finishingId?, panjangCm, lebarCm, jumlah }`.
- Validasi: semua ID ada (404 bila tidak), angka > 0 (400/422 bila tidak).
- luas = panjangCm × lebarCm (cm²).
- biayaBahan per unit = `hargaDasar × luas` (per_cm2) atau `hargaDasar` (per_lembar).
- biayaFinishing per unit = `biaya × luas` (per_cm2), `biaya` (per_lembar),
  atau `biaya / jumlah` (flat — dibagi rata per unit).
- hargaUnitSebelumDiskon = biayaBahan + biayaFinishing.
- tier dipilih dari `jumlah` → `diskonPersen`.
- hargaUnit = hargaUnitSebelumDiskon × (1 − diskonPersen/100).
- total = round(hargaUnit) × jumlah.
- Respons berisi rincian lengkap (transparan): luas, biaya bahan, biaya
  finishing, tier terpakai, diskon, harga per unit, total.
- Saat pesanan dibuat, `hargaSatuan` dan `total` di-SNAPSH
...[truncated 3587 chars]
