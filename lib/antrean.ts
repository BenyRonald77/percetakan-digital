import { prisma } from "./prisma";
import { nowIso } from "./format";

// Durasi produksi (menit) = jumlah unit / kapasitas per jam * 60, dibulatkan ke atas.
export function durasiMenit(jumlah: number, kapasitasPerJam: number) {
  return Math.max(1, Math.ceil((jumlah / kapasitasPerJam) * 60));
}

// Hitung ulang posisi + estimasi selesai untuk antrean aktif sebuah mesin.
// Antrean aktif = status 'antre' atau 'dikerjakan', diurutkan by dibuatPada.
export async function hitungUlangAntrean(mesinId: number) {
  const aktif = await prisma.antrean.findMany({
    where: { mesinId, status: { in: ["antre", "dikerjakan"] } },
    orderBy: [{ dibuatPada: "asc" }, { id: "asc" }],
    include: { pesanan: true },
  });
  let kumulatif = Date.now();
  for (let i = 0; i < aktif.length; i++) {
    const a = aktif[i];
    kumulatif += a.durasiMenit * 60 * 1000;
    const estimasi = new Date(kumulatif).toISOString();
    await prisma.antrean.update({
      where: { id: a.id },
      data: { posisi: i + 1, estimasiSelesai: estimasi },
    });
    await prisma.pesanan.update({
      where: { id: a.pesananId },
      data: { estimasiSelesai: estimasi },
    });
  }
  return aktif.length;
}

export async function masukkanAntrean(pesananId: number, mesinId: number) {
  const mesin = await prisma.mesin.findFirst({
    where: { id: mesinId, aktif: true },
  });
  if (!mesin) return null;
  const pesanan = await prisma.pesanan.findUnique({ where: { id: pesananId } });
  if (!pesanan) return null;
  const jumlahAktif = await prisma.antrean.count({
    where: { mesinId, status: { in: ["antre", "dikerjakan"] } },
  });
  const row = await prisma.antrean.create({
    data: {
      pesananId,
      mesinId,
      posisi: jumlahAktif + 1,
      status: "antre",
      durasiMenit: durasiMenit(pesanan.jumlah, mesin.kapasitasPerJam),
      dibuatPada: nowIso(),
    },
  });
  await hitungUlangAntrean(mesinId);
  return row;
}

export { nowIso };
