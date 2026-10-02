import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { masukkanAntrean, hitungUlangAntrean } from "@/lib/antrean";

const INCLUDE = {
  bahan: true,
  finishing: true,
  mesin: true,
  desainFile: true,
  proofFile: true,
  antrean: { include: { mesin: true } },
} as const;

export async function GET(
  _req: NextRequest,
  { params }: { params: { kode: string } }
) {
  const row = await prisma.pesanan.findUnique({
    where: { kode: params.kode },
    include: INCLUDE,
  });
  if (!row)
    return NextResponse.json({ error: "pesanan tidak ditemukan" }, { status: 404 });
  return NextResponse.json(row);
}

// Transisi status atomik: conditional updateMany memastikan hanya pesanan
// dengan status sumber yang tepat yang berubah (tahan konkurensi SQLite).
async function transisi(
  kode: string,
  dari: string[],
  ke: string,
  extra: Record<string, unknown> = {}
) {
  const r = await prisma.pesanan.updateMany({
    where: { kode, status: { in: dari } },
    data: { status: ke, ...extra },
  });
  if (r.count === 0) {
    const ada = await prisma.pesanan.findUnique({ where: { kode } });
    if (!ada) return { ok: false as const, status: 404, error: "pesanan tidak ditemukan" };
    return {
      ok: false as const,
      status: 409,
      error: `status pesanan '${ada.status}' tidak dapat diproses untuk aksi ini`,
    };
  }
  return { ok: true as const };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { kode: string } }
) {
  const body = await req.json().catch(() => null);
  if (!body?.aksi)
    return NextResponse.json({ error: "field 'aksi' wajib diisi" }, { status: 400 });
  const { kode } = params;
  const aksi = String(body.aksi);

  if (aksi === "upload-proof") {
    if (!body.proofFileId)
      return NextResponse.json({ error: "proofFileId wajib diisi" }, { status: 400 });
    const pf = await prisma.desainFile.findUnique({
      where: { id: Number(body.proofFileId) },
    });
    if (!pf)
      return NextResponse.json({ error: "file proof tidak ditemukan" }, { status: 404 });
    const t = await transisi(kode, ["menunggu_proof"], "menunggu_persetujuan", {
      proofFileId: pf.id,
    });
    if (!t.ok) return NextResponse.json({ error: t.error }, { status: t.status });
  } else if (aksi === "approve") {
    if (!body.mesinId)
      return NextResponse.json({ error: "mesinId wajib diisi" }, { status: 400 });
    const mesin = await prisma.mesin.findFirst({
      where: { id: Number(body.mesinId), aktif: true },
    });
    if (!mesin)
      return NextResponse.json({ error: "mesin tidak ditemukan" }, { status: 404 });
    const pesanan = await prisma.pesanan.findUnique({ where: { kode } });
    if (!pesanan)
      return NextResponse.json({ error: "pesanan tidak ditemukan" }, { status: 404 });
    const t = await transisi(kode, ["menunggu_persetujuan"], "antre_produksi", {
      mesinId: mesin.id,
    });
    if (!t.ok) return NextResponse.json({ error: t.error }, { status: t.status });
    await masukkanAntrean(pesanan.id, mesin.id);
  } else if (aksi === "reject") {
    const t = await transisi(kode, ["menunggu_persetujuan"], "menunggu_proof", {
      catatan: String(body.catatan ?? ""),
    });
    if (!t.ok) return NextResponse.json({ error: t.error }, { status: t.status });
  } else if (aksi === "mulai") {
    const t = await transisi(kode, ["antre_produksi"], "dikerjakan");
    if (!t.ok) return NextResponse.json({ error: t.error }, { status: t.status });
    const p = await prisma.pesanan.findUnique({ where: { kode } });
    if (p?.mesinId) {
      await prisma.antrean.updateMany({
        where: { pesananId: p.id, status: "antre" },
        data: { status: "dikerjakan" },
      });
      await hitungUlangAntrean(p.mesinId);
    }
  } else if (aksi === "selesai") {
    const t = await transisi(kode, ["dikerjakan"], "selesai");
    if (!t.ok) return NextResponse.json({ error: t.error }, { status: t.status });
    const p = await prisma.pesanan.findUnique({ where: { kode } });
    if (p?.mesinId) {
      await prisma.antrean.updateMany({
        where: { pesananId: p.id },
        data: { status: "selesai" },
      });
      await hitungUlangAntrean(p.mesinId);
    }
  } else if (aksi === "siap") {
    const t = await transisi(kode, ["selesai"], "siap_diambil");
    if (!t.ok) return NextResponse.json({ error: t.error }, { status: t.status });
  } else {
    return NextResponse.json(
      { error: "aksi tidak dikenal (upload-proof|approve|reject|mulai|selesai|siap)" },
      { status: 400 }
    );
  }

  const updated = await prisma.pesanan.findUnique({
    where: { kode },
    include: INCLUDE,
  });
  return NextResponse.json(updated);
}
