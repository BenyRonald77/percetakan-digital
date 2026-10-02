import { NextRequest, NextResponse } from "next/server";
import { hitungHarga, HttpError } from "@/lib/pricing";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body)
    return NextResponse.json({ error: "body JSON tidak valid" }, { status: 400 });
  try {
    const rincian = await hitungHarga({
      bahanId: Number(body.bahanId),
      finishingId: body.finishingId ? Number(body.finishingId) : null,
      panjangCm: Number(body.panjangCm),
      lebarCm: Number(body.lebarCm),
      jumlah: Number(body.jumlah),
    });
    return NextResponse.json(rincian);
  } catch (e) {
    if (e instanceof HttpError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }
}
