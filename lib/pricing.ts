import { prisma } from "./prisma";

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export interface RincianHarga {
  luasCm2: number;
  bahanNama: string;
  bahanPerUnit: number;
  finishingNama: string | null;
  finishingPerUnit: number;
  hargaUnitSebelumDiskon: number;
  tierNama: string;
  diskonPersen: number;
  hargaSatuan: number;
  jumlah: number;
  total: number;
}

export async function hitungHarga(input: {
  bahanId: number;
  finishingId?: number | null;
  panjangCm: number;
  lebarCm: number;
  jumlah: number;
}): Promise<RincianHarga> {
  const { bahanId, finishingId, panjangCm, lebarCm, jumlah } = input;
  if (!bahanId || !panjangCm || !lebarCm || !jumlah)
    throw new HttpError(400, "bahanId, panjangCm, lebarCm, jumlah wajib diisi");
  if (panjangCm <= 0 || lebarCm <= 0 || jumlah <= 0)
    throw new HttpError(422, "panjangCm, lebarCm, jumlah harus lebih dari 0");

  const bahan = await prisma.bahan.findFirst({
    where: { id: bahanId, aktif: true },
  });
  if (!bahan) throw new HttpError(404, "bahan tidak ditemukan");

  let finishing: { nama: string; tipeBiaya: string; biaya: number } | null = null;
  if (finishingId) {
    const f = await prisma.finishing.findFirst({
      where: { id: finishingId, aktif: true },
    });
    if (!f) throw new HttpError(404, "finishing tidak ditemukan");
    finishing = f;
  }

  const luasCm2 = panjangCm * lebarCm;
  const bahanPerUnit =
    bahan.tipeHarga === "per_lembar" ? bahan.hargaDasar : bahan.hargaDasar * luasCm2;

  let finishingPerUnit = 0;
  if (finishing) {
    if (finishing.tipeBiaya === "per_cm2") finishingPerUnit = finishing.biaya * luasCm2;
    else if (finishing.tipeBiaya === "per_lembar") finishingPerUnit = finishing.biaya;
    else finishingPerUnit = finishing.biaya / jumlah; // flat dibagi rata per unit
  }

  const hargaUnitSebelumDiskon = bahanPerUnit + finishingPerUnit;

  const tiers = await prisma.tierHarga.findMany({
    where: { aktif: true },
    orderBy: { minQty: "asc" },
  });
  const tier =
    tiers.find((t) => jumlah >= t.minQty && (t.maxQty === null || jumlah <= t.maxQty)) ??
    null;
  const diskonPersen = tier?.diskonPersen ?? 0;
  const hargaSatuan = Math.round(hargaUnitSebelumDiskon * (1 - diskonPersen / 100));
  const total = hargaSatuan * jumlah;

  return {
    luasCm2,
    bahanNama: bahan.nama,
    bahanPerUnit,
    finishingNama: finishing?.nama ?? null,
    finishingPerUnit,
    hargaUnitSebelumDiskon,
    tierNama: tier?.nama ?? "-",
    diskonPersen,
    hargaSatuan,
    jumlah,
    total,
  };
}

// Kode pesanan: PD-<id padded>. Dibuat setelah insert agar unik & atomik.
export function kodeDariId(id: number) {
  return "PD-" + String(id).padStart(6, "0");
}
