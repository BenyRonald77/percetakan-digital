import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const rows = await prisma.mesin.findMany({
    where: { aktif: true },
    orderBy: { id: "asc" },
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.nama || body.kapasitasPerJam == null)
    return NextResponse.json({ error: "nama dan kapasitasPerJam wajib diisi" }, { status: 400 });
  if (Number(body.kapasitasPerJam) <= 0)
    return NextResponse.json({ error: "kapasitasPerJam harus lebih dari 0" }, { status: 422 });
  const created = await prisma.mesin.create({
    data: { nama: String(body.nama), kapasitasPerJam: Math.round(Number(body.kapasitasPerJam)) },
  });
  return NextResponse.json(created, { status: 201 });
}
