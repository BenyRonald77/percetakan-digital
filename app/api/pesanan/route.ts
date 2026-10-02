import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nowIso } from "@/lib/format";
import { hitungHarga, HttpError, kodeDariId } from "@/lib/pricing";

const INCLUDE = {
  bahan: true,
  finishing: true,
  mesin: true,
  desainFile: true,
  proofFile: true,
} as const;

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");
  const rows = await prisma.pesanan.findMany({
    where: status ? { status } : undefined,
    include: INCLUDE,
    orderBy: { id: "desc" },
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.namaPelanggan || !body?.kontak || !body?.bahanId)
    return NextResponse.json(
      { error: "namaPelanggan, kontak, bahanId wajib diisi" },
      { status: 400 }
    );
  try {
    const rincian = await hitungHarga({
      bahanId: Number(body.bahanId),
      finishingId: body.finishingId ? Number(body.finishingId) : null,
      panjangCm: Number(body.panjangCm),
      lebarCm: Number(body.lebarCm),
      jumlah: Number(body.jumlah),
    });

    let desainFileId: number | null = null;
    if (body.desainFileId) {
      const df = await prisma.desainFile.findUnique({
        where: { id: Number(body.desainFileId) },
      });
      if (!df)
        return NextResponse.json({ error: "file desain tidak ditemukan" }, { status: 404 });
      desainFileId = df.id;
    }

    const created = await prisma.pesanan.create({
      data: {
        kode: "TMP",
        namaPelanggan: String(body.namaPelanggan),
        kontak: String(body.kontak),
        bahanId: Number(body.bahanId),
        finishingId: body.finishingId ? Number(body.finishingId) : null,
        panjangCm: Number(body.panjangCm),
        lebarCm: Number(body.lebarCm),
        jumlah: Number(body.jumlah),
        hargaSatuan: rincian.hargaSatuan,
        total: rincian.total,
        rincian: JSON.stringify(rincian),
        desainFileId,
        status: "menunggu_proof",
        dibuatPada: nowIso(),
      },
    });
    const updated = await prisma.pesanan.update({
      where: { id: created.id },
      data: { kode: kodeDariId(created.id) },
      include: INCLUDE,
    });
    return NextResponse.json(updated, { status: 201 });
  } catch (e) {
    if (e instanceof HttpError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }
}
