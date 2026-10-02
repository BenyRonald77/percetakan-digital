import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Tracking publik per kode pesanan (tanpa data sensitif tambahan).
export async function GET(
  _req: NextRequest,
  { params }: { params: { kode: string } }
) {
  const row = await prisma.pesanan.findUnique({
    where: { kode: params.kode },
    include: {
      bahan: true,
      finishing: true,
      mesin: true,
      antrean: true,
    },
  });
  if (!row)
    return NextResponse.json({ error: "kode pesanan tidak ditemukan" }, { status: 404 });
  return NextResponse.json({
    kode: row.kode,
    namaPelanggan: row.namaPelanggan,
    status: row.status,
    bahan: row.bahan.nama,
    finishing: row.finishing?.nama ?? null,
    ukuran: `${row.panjangCm} × ${row.lebarCm} cm`,
    jumlah: row.jumlah,
    total: row.total,
    mesin: row.mesin?.nama ?? null,
    posisiAntrean: row.antrean?.posisi ?? null,
    estimasiSelesai: row.estimasiSelesai,
    catatan: row.catatan,
    dibuatPada: row.dibuatPada,
  });
}
