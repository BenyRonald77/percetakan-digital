import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/antrean?mesinId=<id> — antrean aktif per mesin + estimasi selesai
export async function GET(req: NextRequest) {
  const mesinId = Number(req.nextUrl.searchParams.get("mesinId"));
  if (!mesinId)
    return NextResponse.json({ error: "mesinId wajib diisi" }, { status: 400 });
  const mesin = await prisma.mesin.findFirst({ where: { id: mesinId, aktif: true } });
  if (!mesin)
    return NextResponse.json({ error: "mesin tidak ditemukan" }, { status: 404 });
  const rows = await prisma.antrean.findMany({
    where: { mesinId, status: { in: ["antre", "dikerjakan"] } },
    orderBy: { posisi: "asc" },
    include: {
      pesanan: { include: { bahan: true, finishing: true } },
    },
  });
  return NextResponse.json({ mesin, antrean: rows });
}
