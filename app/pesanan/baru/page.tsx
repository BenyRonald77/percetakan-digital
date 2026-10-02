"use client";
import { useEffect, useState } from "react";
import { rupiah } from "@/lib/format";

interface Opsi { id: number; nama: string }

export default function PesananBaruPage() {
  const [bahan, setBahan] = useState<Opsi[]>([]);
  const [finishing, setFinishing] = useState<Opsi[]>([]);
  const [form, setForm] = useState({
    namaPelanggan: "", kontak: "", bahanId: "", finishingId: "",
    panjangCm: "32", lebarCm: "48", jumlah: "100",
  });
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [kode, setKode] = useState("");

  useEffect(() => {
    fetch("/api/bahan").then((r) => r.json()).then((d) => {
      setBahan(d); setForm((f) => ({ ...f, bahanId: d[0] ? String(d[0].id) : "" }));
    });
    fetch("/api/finishing").then((r) => r.json()).then(setFinishing);
  }, []);

  const set = (k: string) => (e: any) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit() {
    setError(""); setStatus("Mengunggah file desain…"); setKode("");
    let desainFileId: number | null = null;
    if (file) {
      const fd = new FormData();
      fd.append("file", file);
      const up = await fetch("/api/upload", { method: "POST", body: fd });
      const ud = await up.json();
      if (!up.ok) { setError(ud.error ?? "upload gagal"); setStatus(""); return; }
      desainFileId = ud.id;
    }
    setStatus("Membuat pesanan…");
    const res = await fetch("/api/pesanan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        namaPelanggan: form.namaPelanggan,
        kontak: form.kontak,
        bahanId: Number(form.bahanId),
        finishingId: form.finishingId ? Number(form.finishingId) : null,
        panjangCm: Number(form.panjangCm),
        lebarCm: Number(form.lebarCm),
        jumlah: Number(form.jumlah),
        desainFileId,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "gagal membuat pesanan"); setStatus(""); return; }
    setKode(data.kode);
    setStatus(`Pesanan ${data.kode} dibuat — total ${rupiah(data.total)}. Simpan kode ini untuk tracking.`);
  }

  const inp = "border rounded px-3 py-2 w-full";
  return (
    <div className="max-w-2xl bg-white rounded shadow p-6">
      <h1 className="text-2xl font-bold mb-4">Buat Pesanan</h1>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <label>Nama<input className={inp} value={form.namaPelanggan} onChange={set("namaPelanggan")} /></label>
        <label>Kontak (WA)<input className={inp} value={form.kontak} onChange={set("kontak")} /></label>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <label>Bahan
          <select className={inp} value={form.bahanId} onChange={set("bahanId")}>
            {bahan.map((b) => <option key={b.id} value={b.id}>{b.nama}</option>)}
          </select>
        </label>
        <label>Finishing
          <select className={inp} value={form.finishingId} onChange={set("finishingId")}>
            <option value="">— Tanpa finishing —</option>
            {finishing.map((f) => <option key={f.id} value={f.id}>{f.nama}</option>)}
          </select>
        </label>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-3">
        <label>Panjang (cm)<input className={inp} value={form.panjangCm} onChange={set("panjangCm")} /></label>
        <label>Lebar (cm)<input className={inp} value={form.lebarCm} onChange={set("lebarCm")} /></label>
        <label>Jumlah<input className={inp} value={form.jumlah} onChange={set("jumlah")} /></label>
      </div>
      <label className="block mb-4">File desain (PDF/JPG/PNG, maks 20 MB)
        <input type="file" accept=".pdf,.jpg,.jpeg,.png" className={inp}
          onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      </label>
      {error && <p className="text-red-600 mb-3">{error}</p>}
      {status && <p className="text-green-700 mb-3">{status}</p>}
      {kode && <a href={`/tracking?kode=${kode}`} className="text-blue-700 underline">Lacak pesanan {kode} →</a>}
      <div className="mt-3">
        <button onClick={submit} className="bg-slate-900 text-white px-5 py-2 rounded hover:bg-slate-700">
          Buat Pesanan
        </button>
      </div>
    </div>
  );
}
