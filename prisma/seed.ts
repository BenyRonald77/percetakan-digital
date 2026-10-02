import { PrismaClient } from "@prisma/client";
import { hitungHarga } from "../lib/pricing";

const prisma = new PrismaClient();
const now = () => new Date().toISOString();

async function buatPesananContoh(o: {
  namaPelanggan: string;
  kontak: string;
  bahanId: number;
  finishingId?: number | null;
  panjangCm: number;
  lebarCm: number;
  jumlah: number;
  status: string;
  mesinId?: number | null;
  catatan?: string;
  menitLalu: number;
}) {
  const rincian = await hitungHarga({
    bahanId: o.bahanId,
    finishingId: o.finishingId ?? null,
    panjangCm: o.panjangCm,
    lebarCm: o.lebarCm,
    jumlah: o.jumlah,
  });
  const dibuat = new Date(Date.now() - o.menitLalu * 60_000).toISOString();
  const p = await prisma.pesanan.create({
    data: {
      kode: "TMP",
      namaPelanggan: o.namaPelanggan,
      kontak: o.kontak,
      bahanId: o.bahanId,
      finishingId: o.finishingId ?? null,
      panjangCm: o.panjangCm,
      lebarCm: o.lebarCm,
      jumlah: o.jumlah,
      hargaSatuan: rincian.hargaSatuan,
      total: rincian.total,
      rincian: JSON.stringify(rincian),
      status: o.status,
      mesinId: o.mesinId ?? null,
      catatan: o.catatan ?? "",
      dibuatPada: dibuat,
    },
  });
  const kode = "PD-" + String(p.id).padStart(6, "0");
  await prisma.pesanan.update({ where: { id: p.id }, data: { kode } });
  return { ...p, kode };
}

async function main() {
  if ((await prisma.pesanan.count()) > 0) {
    console.log("seed dilewati (sudah ada data)");
    return;
  }

  const bahan = await prisma.bahan.createMany({
    data: [
      { nama: "Art Carton 260gsm", tipeHarga: "per_cm2", hargaDasar: 4 },
      { nama: "HVS 80gsm", tipeHarga: "per_cm2", hargaDasar: 1 },
      { nama: "Vinyl", tipeHarga: "per_cm2", hargaDasar: 6 },
      { nama: "Albatros", tipeHarga: "per_cm2", hargaDasar: 3 },
      { nama: "Stiker Chromo (per lembar)", tipeHarga: "per_lembar", hargaDasar: 5000 },
    ],
  });
  console.log("bahan:", bahan.count);

  const finishing = await prisma.finishing.createMany({
    data: [
      { nama: "Laminating Doff", tipeBiaya: "per_cm2", biaya: 2 },
      { nama: "Laminating Glossy", tipeBiaya: "per_cm2", biaya: 2 },
      { nama: "UV Spot", tipeBiaya: "per_cm2", biaya: 3 },
      { nama: "Emboss", tipeBiaya: "flat", biaya: 25000 },
    ],
  });
  console.log("finishing:", finishing.count);

  const tier = await prisma.tierHarga.createMany({
    data: [
      { nama: "1–50", minQty: 1, maxQty: 50, diskonPersen: 0 },
      { nama: "51–200", minQty: 51, maxQty: 200, diskonPersen: 10 },
      { nama: "201+", minQty: 201, maxQty: null, diskonPersen: 20 },
    ],
  });
  console.log("tier:", tier.count);

  const mesin = await prisma.mesin.createMany({
    data: [
      { nama: "Digital Press A3+", kapasitasPerJam: 120 },
      { nama: "Large Format Printer", kapasitasPerJam: 30 },
    ],
  });
  console.log("mesin:", mesin.count);

  const artCarton = (await prisma.bahan.findFirst({ where: { nama: { startsWith: "Art Carton" } } }))!;
  const vinyl = (await prisma.bahan.findFirst({ where: { nama: "Vinyl" } }))!;
  const doff = (await prisma.finishing.findFirst({ where: { nama: "Laminating Doff" } }))!;
  const uv = (await prisma.finishing.findFirst({ where: { nama: "UV Spot" } }))!;
  const pressA3 = (await prisma.mesin.findFirst({ where: { nama: { contains: "Digital Press" } } }))!;
  const large = (await prisma.mesin.findFirst({ where: { nama: { contains: "Large Format" } } }))!;

  // Contoh pesanan di tiap status
  const s1 = await buatPesananContoh({
    namaPelanggan: "Toko Berkah", kontak: "0812-0001", bahanId: artCarton.id,
    finishingId: doff.id, panjangCm: 32, lebarCm: 48, jumlah: 100,
    status: "menunggu_proof", menitLalu: 300,
  });
  const s2 = await buatPesananContoh({
    namaPelanggan: "Kafe Aroma", kontak: "0812-0002", bahanId: artCarton.id,
    finishingId: uv.id, panjangCm: 21, lebarCm: 29.7, jumlah: 250,
    status: "menunggu_persetujuan", menitLalu: 240,
  });
  const a1 = await buatPesananContoh({
    namaPelanggan: "Bengkel Maju", kontak: "0812-0003", bahanId: vinyl.id,
    finishingId: null, panjangCm: 100, lebarCm: 50, jumlah: 20,
    status: "antre_produksi", mesinId: large.id, menitLalu: 180,
  });
  const a2 = await buatPesananContoh({
    namaPelanggan: "Sekolah Pelita", kontak: "0812-0004", bahanId: artCarton.id,
    finishingId: doff.id, panjangCm: 32, lebarCm: 48, jumlah: 150,
    status: "antre_produksi", mesinId: pressA3.id, menitLalu: 150,
  });
  const d1 = await buatPesananContoh({
    namaPelanggan: "Resto Sederhana", kontak: "0812-0005", bahanId: artCarton.id,
    finishingId: null, panjangCm: 21, lebarCm: 29.7, jumlah: 80,
    status: "dikerjakan", mesinId: pressA3.id, menitLalu: 120,
  });
  const f1 = await buatPesananContoh({
    namaPelanggan: "Laundry Bersih", kontak: "0812-0006", bahanId: vinyl.id,
    finishingId: null, panjangCm: 60, lebarCm: 40, jumlah: 10,
    status: "selesai", mesinId: large.id, menitLalu: 90,
  });
  const g1 = await buatPesananContoh({
    namaPelanggan: "Apotek Sehat", kontak: "0812-0007", bahanId: artCarton.id,
    finishingId: doff.id, panjangCm: 32, lebarCm: 48, jumlah: 60,
    status: "siap_diambil", mesinId: pressA3.id, menitLalu: 60,
  });
  const r1 = await buatPesananContoh({
    namaPelanggan: "Warung Kopi", kontak: "0812-0008", bahanId: artCarton.id,
    finishingId: null, panjangCm: 21, lebarCm: 29.7, jumlah: 30,
    status: "ditolak", catatan: "Warna tidak sesuai, revisi desain dulu.",
    menitLalu: 30,
  });

  // Masukkan yang berstatus produksi ke antrean mesinnya
  for (const [p, m, st] of [
    [a1, large, "antre"],
    [a2, pressA3, "antre"],
    [d1, pressA3, "dikerjakan"],
    [f1, large, "selesai"],
    [g1, pressA3, "selesai"],
  ] as const) {
    await prisma.antrean.create({
      data: {
        pesananId: p.id,
        mesinId: m.id,
        posisi: 1,
        status: st,
        durasiMenit: Math.max(1, Math.ceil((p.jumlah / m.kapasitasPerJam) * 60)),
        dibuatPada: p.dibuatPada,
      },
    });
  }
  console.log("pesanan contoh:", [s1, s2, a1, a2, d1, f1, g1, r1].map((p) => p.kode).join(", "));
  console.log("seed selesai", now());
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
