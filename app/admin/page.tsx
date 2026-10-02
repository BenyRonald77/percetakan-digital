"use client";
import { useEffect, useState } from "react";
import { rupiah, formatTanggal, STATUS_LABEL } from "@/lib/format";

const inp = "border rounded px-3 py-2 w-full text-sm";
const btn = "bg-slate-900 text-white px-3 py-1 rounded text-sm hover:bg-slate-700";

export default function AdminPage() {
  const [pesanan, setPesanan] = useState<any[]>([]);
  const [mesin, setMesin] = useState<any[]>([]);
  const [mesinId, setMesinId] = useState("");
  const [antrean, setAntrean] = useState<any[]>([]);
  const [bahan, setBahan] = useState<any[]>([]);
  const [finishing, setFinishing] = useState<any[]>([]);
  const [tier, setTier] = useState<any[]>([]);
  const [catatan, setCatatan] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");

  function muat() {
    fetch("/api/pesanan").then((r) => r.json()).then(setPesanan);
    fetch("/api/mesin").then((r) => r.json()).then((d) => {
      setMesin(d); if (d[0] && !mesinId) setMesinId(String(d[0].id));
    });
    fetch("/api/bahan").then((r) => r.json()).then(setBahan);
    fetch("/api/finishing").then((r) => r.json()).then(setFinishing);
    fetch("/api/tier").then((r) => r.json()).then(setTier);
  }
  useEffect(muat, []);
  useEffect(() => {
    if (mesinId) fetch(`/api/antrean?mesinId=${mesinId}`).then((r) => r.json()).then((d) => setAntrean(d.antrean ?? []));
  }, [mesinId, pesanan]);

  async function aksi(kode: string, a: string, extra: any = {}) {
    setMsg("");
    const res = await fetch(`/api/pesanan/${kode}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aksi: a, ...extra }),
    });
    const d = await res.json();
    if (!res.ok) { setMsg("❌ " + (d.error ?? "gagal")); return; }
    setMsg(`✅ ${kode}: ${STATUS_LABEL[d.status] ?? d.status}`);
    muat();
  }

  async function uploadProof(kode: string, file: File | null) {
    if (!file) { setMsg("❌ pilih file proof dulu"); return; }
    const fd = new FormData();
    fd.append("file", file);
    const up = await fetch("/api/upload", { method: "POST", body: fd });
    const ud = await up.json();
    if (!up.ok) { setMsg("❌ " + (ud.error ?? "upload gagal")); return; }
    await aksi(kode, "upload-proof", { proofFileId: ud.id });
  }

  const butuhProof = pesanan.filter((p) => p.status === "menunggu_proof");
  const butuhSetuju = pesanan.filter((p) => p.status === "menunggu_persetujuan");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Panel Admin</h1>
      {msg && <p className="bg-white rounded shadow p-3">{msg}</p>}

      <section className="bg-white rounded shadow p-6">
        <h2 className="text-xl font-bold mb-3">Upload Proof ({butuhProof.length})</h2>
        {butuhProof.map((p) => (
          <div key={p.id} className="border-b py-3 flex flex-wrap gap-3 items-center justify-between">
            <div className="text-sm">
              <b>{p.kode}</b> — {p.namaPelanggan} · {p.bahan?.nama} · {p.jumlah} pcs · {rupiah(p.total)}
              <div className="text-slate-500">Desain: {p.desainFile?.namaAsli ?? "—"}</div>
            </div>
            <label className="text-sm flex gap-2 items-center">
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" id={`proof-${p.id}`} className="text-sm" />
              <button className={btn} onClick={() => {
                const el = document.getElementById(`proof-${p.id}`) as HTMLInputElement;
                uploadProof(p.kode, el.files?.[0] ?? null);
              }}>Upload Proof</button>
            </label>
          </div>
        ))}
        {butuhProof.length === 0 && <p className="text-slate-500 text-sm">Tidak ada.</p>}
      </section>

      <section className="bg-white rounded shadow p-6">
        <h2 className="text-xl font-bold mb-3">Persetujuan Pelanggan ({butuhSetuju.length})</h2>
        <p className="text-sm text-slate-500 mb-3">Admin mencatat keputusan pelanggan di sini.</p>
        {butuhSetuju.map((p) => (
          <div key={p.id} className="border-b py-3 text-sm">
            <b>{p.kode}</b> — {p.namaPelanggan} · {rupiah(p.total)} · proof: {p.proofFile?.namaAsli ?? "—"}
            <div className="flex flex-wrap gap-2 mt-2 items-center">
              <select className="border rounded px-2 py-1" value={p._mesinPilih ?? ""} id={`mesin-${p.id}`}>
                <option value="">— pilih mesin —</option>
                {mesin.map((m: any) => <option key={m.id} value={m.id}>{m.nama}</option>)}
              </select>
              <button className="bg-green-700 text-white px-3 py-1 rounded text-sm" onClick={() => {
                const el = document.getElementById(`mesin-${p.id}`) as HTMLSelectElement;
                if (!el.value) { setMsg("❌ pilih mesin dulu"); return; }
                aksi(p.kode, "approve", { mesinId: Number(el.value) });
              }}>Approve → Produksi</button>
              <input className="border rounded px-2 py-1 flex-1 min-w-[200px]" placeholder="Catatan penolakan…"
                value={catatan[p.kode] ?? ""} onChange={(e) => setCatatan({ ...catatan, [p.kode]: e.target.value })} />
              <button className="bg-red-700 text-white px-3 py-1 rounded text-sm"
                onClick={() => aksi(p.kode, "reject", { catatan: catatan[p.kode] ?? "" })}>Reject</button>
            </div>
          </div>
        ))}
        {butuhSetuju.length === 0 && <p className="text-slate-500 text-sm">Tidak ada.</p>}
      </section>

      <section className="bg-white rounded shadow p-6">
        <div className="flex gap-3 items-center mb-3">
          <h2 className="text-xl font-bold">Antrean Produksi</h2>
          <select className="border rounded px-3 py-1 text-sm" value={mesinId} onChange={(e) => setMesinId(e.target.value)}>
            {mesin.map((m: any) => <option key={m.id} value={m.id}>{m.nama} ({m.kapasitasPerJam}/jam)</option>)}
          </select>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left text-slate-500">
            <th className="py-2">#</th><th>Kode</th><th>Pelanggan</th><th>Jumlah</th><th>Durasi</th><th>Status</th><th>Estimasi Selesai</th><th>Aksi</th>
          </tr></thead>
          <tbody>
            {antrean.map((a: any) => (
              <tr key={a.id} className="border-b">
                <td className="py-2">{a.posisi}</td>
                <td>{a.pesanan.kode}</td>
                <td>{a.pesanan.namaPelanggan}</td>
                <td>{a.pesanan.jumlah}</td>
                <td>{a.durasiMenit} mnt</td>
                <td>{a.status === "antre" ? "Antre" : "Dikerjakan"}</td>
                <td>{a.estimasiSelesai ? formatTanggal(a.estimasiSelesai) : "—"}</td>
                <td className="flex gap-1">
                  {a.status === "antre" && <button className={btn} onClick={() => aksi(a.pesanan.kode, "mulai")}>Mulai</button>}
                  {a.status === "dikerjakan" && <button className={btn} onClick={() => aksi(a.pesanan.kode, "selesai")}>Selesai</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {antrean.length === 0 && <p className="text-slate-500 text-sm mt-2">Antrean kosong.</p>}
      </section>

      <section className="bg-white rounded shadow p-6">
        <h2 className="text-xl font-bold mb-3">Siap Diambil</h2>
        {pesanan.filter((p) => p.status === "selesai").map((p) => (
          <div key={p.id} className="text-sm border-b py-2 flex justify-between items-center">
            <span><b>{p.kode}</b> — {p.namaPelanggan} · {rupiah(p.total)}</span>
            <button className={btn} onClick={() => aksi(p.kode, "siap")}>Tandai Siap Diambil</button>
          </div>
        ))}
      </section>

      <section className="bg-white rounded shadow p-6">
        <h2 className="text-xl font-bold mb-3">Master Harga</h2>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <h3 className="font-semibold mb-2">Bahan</h3>
            {bahan.map((b: any) => <div key={b.id} className="border-b py-1">{b.nama} — {b.tipeHarga === "per_cm2" ? rupiah(b.hargaDasar) + "/cm²" : rupiah(b.hargaDasar) + "/lbr"}</div>)}
          </div>
          <div>
            <h3 className="font-semibold mb-2">Finishing</h3>
            {finishing.map((f: any) => <div key={f.id} className="border-b py-1">{f.nama} — {rupiah(f.biaya)}{f.tipeBiaya === "flat" ? " (flat)" : f.tipeBiaya === "per_cm2" ? "/cm²" : "/lbr"}</div>)}
          </div>
          <div>
            <h3 className="font-semibold mb-2">Tier Jumlah</h3>
            {tier.map((t: any) => <div key={t.id} className="border-b py-1">{t.nama} — diskon {t.diskonPersen}%</div>)}
          </div>
        </div>
      </section>
    </div>
  );
}
