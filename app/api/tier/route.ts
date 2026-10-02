import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const rows = await prisma.tierHarga.findMany({
    where: { aktif: true },
    orderBy: { minQty: "asc" },
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.nama || body.minQty == null)
    return NextResponse.json({ error: "nama dan minQty wajib diisi" }, { status: 400 });
  const minQty = Number(body.minQty);
  const maxQty = body.maxQty == null ? null : Number(body.maxQty);
  const diskon = Number(body.diskonPersen ?? 0);
  if (minQty < 1 || (maxQty !== null && maxQty < minQty))
    return NextResponse.json({ error: "rentang jumlah tidak valid" }, { status: 422 });
  if (diskon < 0 || diskon > 100)
    return NextResponse.json({ error: "diskonPersen harus 0–100" }, { status: 422 });
  const created = await prisma.tierHarga.create({
    data: { nama: String(body.nama), minQty, maxQty, diskonPersen: diskon },
  });
  return NextResponse.json(created, { status: 201 });
}
