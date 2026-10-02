import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const rows = await prisma.bahan.findMany({
    where: { aktif: true },
    orderBy: { id: "asc" },
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.nama || body.hargaDasar == null)
    return NextResponse.json({ error: "nama dan hargaDasar wajib diisi" }, { status: 400 });
  if (!["per_cm2", "per_lembar"].includes(body.tipeHarga ?? "per_cm2"))
    return NextResponse.json({ error: "tipeHarga harus per_cm2 atau per_lembar" }, { status: 422 });
  if (Number(body.hargaDasar) < 0)
    return NextResponse.json({ error: "hargaDasar tidak boleh negatif" }, { status: 422 });
  const created = await prisma.bahan.create({
    data: {
      nama: String(body.nama),
      tipeHarga: body.tipeHarga ?? "per_cm2",
      hargaDasar: Math.round(Number(body.hargaDasar)),
    },
  });
  return NextResponse.json(created, { status: 201 });
}
