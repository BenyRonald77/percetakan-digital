import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nowIso } from "@/lib/format";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

const MAX_BYTES = 20 * 1024 * 1024;
const ALLOWED: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
};

export async function GET() {
  const rows = await prisma.desainFile.findMany({
    orderBy: { id: "desc" },
    take: 50,
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "body harus multipart/form-data" }, { status: 400 });
  }
  const file = form.get("file");
  if (!file || typeof file === "string")
    return NextResponse.json({ error: "field 'file' wajib diisi" }, { status: 400 });

  const f = file as File;
  const ext = ALLOWED[f.type];
  if (!ext)
    return NextResponse.json(
      { error: "tipe file tidak didukung (hanya PDF, JPG, PNG)" },
      { status: 400 }
    );
  if (f.size > MAX_BYTES)
    return NextResponse.json(
      { error: `ukuran file melebihi 20 MB (${(f.size / 1024 / 1024).toFixed(1)} MB)` },
      { status: 413 }
    );
  if (f.size === 0)
    return NextResponse.json({ error: "file kosong" }, { status: 400 });

  const dir = join(process.cwd(), "uploads");
  await mkdir(dir, { recursive: true });
  const namaSimpan = randomUUID() + "." + ext;
  const buf = Buffer.from(await f.arrayBuffer());
  await writeFile(join(dir, namaSimpan), buf);

  const row = await prisma.desainFile.create({
    data: {
      namaAsli: f.name || "tanpa-nama",
      namaSimpan,
      mime: f.type,
      ukuran: f.size,
      dibuatPada: nowIso(),
    },
  });
  return NextResponse.json(row, { status: 201 });
}
