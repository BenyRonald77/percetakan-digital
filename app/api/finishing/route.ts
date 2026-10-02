import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const rows = await prisma.finishing.findMany({
    where: { aktif: true },
    orderBy: { id: "asc" },
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.nama || body.biaya == null)
    return NextResponse.json({ error: "nama dan biaya wajib diisi" }, { status: 400 });
  if (!["per_cm2", "per_lembar", "flat"].includes(body.tipeBiaya ?? "per_cm2"))
    return NextResponse.json(
      { error: "tipeBiaya harus per_cm2, per_lembar, atau flat" },
      { status: 422 }
    );
  if (Number(body.biaya) < 0)
    return NextResponse.json({ error: "biaya tidak boleh negatif" }, { status: 422 });
  const created = await prisma.finishing.create({
    data: {
      nama: String(body.nama),
      tipeBiaya: body.tipeBiaya ?? "per_cm2",
      biaya: Math.round(Number(body.biaya)),
    },
  });
  return NextResponse.json(created, { status: 201 });
}
