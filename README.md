# Percetakan Digital

Aplikasi web percetakan digital: kalkulasi harga otomatis (bahan × finishing ×
ukuran × tier jumlah), upload file desain (PDF/JPG/PNG, maks 20 MB), alur
pesanan dengan proof & persetujuan pelanggan, antrean produksi per mesin
dengan estimasi selesai, dan tracking status per kode pesanan.

Stack: Next.js 14 (App Router) + TypeScript + Prisma 5.22 + SQLite + Tailwind CSS.

## Cara Menjalankan

```bash
npm install --ignore-scripts
# salin Prisma engine binaries (workaround bila unduhan engine gagal)
cp ~/workspace/ts-convert/prisma-engines/* node_modules/@prisma/engines/
cp .env.example .env
npx prisma generate
npx prisma db push
npm run seed
npm run dev
```

Buka http://localhost:3000.

## Halaman

| Rute | Fungsi |
|---|---|
| `/` | Kalkulator harga otomatis (bahan, finishing, ukuran, jumlah) |
| `/pesanan/baru` | Buat pesanan + upload file desain |
| `/pesanan` | Daftar pesanan pelanggan |
| `/tracking` | Lacak status per kode pesanan |
| `/admin` | Panel admin: master harga, proof, antrean mesin, status produksi |

## API

- `GET/POST /api/bahan`, `GET/POST /api/finishing`, `GET/POST /api/tier`, `GET/POST /api/mesin` — master data.
- `GET/POST /api/upload` — upload file desain (multipart, PDF/JPG/PNG ≤ 20 MB).
- `POST /api/kalkulasi` — hitung harga + rincian transparan.
- `GET/POST /api/pesanan` — daftar & buat pesanan (kalkulasi di-snapshot).
- `GET /api/pesanan/[kode]` — detail pesanan.
- `PATCH /api/pesanan/[kode]` — aksi: `upload-proof`, `approve`, `reject`, `mulai`, `selesai`, `siap`.
- `GET /api/antrean?mesinId=` — antrean produksi per mesin + estimasi selesai.
- `GET /api/tracking/[kode]` — status publik per kode pesanan.

## Catatan

- File upload tersimpan di `uploads/` (tidak ikut commit).
- Harga pada pesanan adalah snapshot saat dibuat; perubahan master harga
  tidak mengubah pesanan lama.
