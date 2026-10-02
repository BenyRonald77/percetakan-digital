"use client";
import { useEffect, useState } from "react";
import { rupiah } from "@/lib/format";

interface Opsi { id: number; nama: string; tipeHarga?: string; hargaDasar?: number; tipeBiaya?: string; biaya?: number }

export default function KalkulatorPage() {
  const [bahan, setBahan] = useState<Opsi[]>([]);
  const [finishing, setFinishing] = useState<Opsi[]>([]);
  const [bahanId, setBahanId] = useState("");
  const [finishingId, setFinishingId] = useState("");
  const [panjang, setPanjang] = useState("32");
  const [lebar, setLebar] = useState("48");
  const [jumlah, setJumlah] = useState("100");
  const [hasil, setHasil] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/bahan").then((r) => r.json()).then((d) => {
      setBahan(d); if (d[0]) setBahanId(String(d[0].id));
    });
    fetch("/api/finishing").then((r) => r.json()).then(setFinishing);
  }, []);

  async function hitung() {
    setError(""); setHasil(null);
    const res = await fetch("/api/kalkulasi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bahanId: Number(bahanId),
        finishingId: finishingId ? Number(finishingId) : null,
        panjangCm: Number(panjang),
        lebarCm: Number(lebar),
        jumlah: Number(jumlah),
      }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "gagal menghitung"); return; }
    setHasil(data);
  }

  const inp = "border rounded px-3 py-2 w-full";
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-white rounded shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Kalkulator Harga Cetak</h1>
        <label className="block mb-3">Bahan
          <select className={inp} value={bahanId} onChange={(e) => setBahanId(e.target.value)}>
            {bahan.map((b) => <option key={b.id} value={b.id}>{b.nama}</option>)}
          </select>
        </label>
        <label className="block mb-3">Finishing (opsional)
          <select className={inp} value={finishingId} onChange={(e) => setFinishingId(e.target.value)}>
            <option value="">— Tanpa finishing —</option>
            {finishing.map((f) => <option key={f.id} value={f.id}>{f.nama}</option>)}
          </select>
        </label>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <label>Panjang (cm)<input className={inp} value={panjang} onChange={(e) => setPanjang(e.target.value)} /></label>
          <label>Lebar (cm)<input className={inp} value={lebar} onChange={(e) => setLebar(e.target.value)} /></label>
          <label>Jumlah<input className={inp} value={jumlah} onChange={(e) => setJumlah(e.target.value)} /></label>
        </div>
        {error && <p className="text-red-600 mb-3">{error}</p>}
        <button onClick={hitung} className="bg-slate-900 text-white px-5 py-2 rounded hover:bg-slate-700">
          Hitung Harga
        </button>
      </div>
      <div className="bg-white rounded shadow p-6">
        <h2 className="text-xl font-bold mb-4">Rincian Perhitungan</h2>
        {!hasil && <p className="text-slate-500">Isi form lalu klik "Hitung Harga".</p>}
        {hasil && (
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b"><td className="py-2">Luas</td><td className="text-right">{hasil.luasCm2} cm²</td></tr>
              <tr className="border-b"><td className="py-2">Bahan ({hasil.bahanNama})</td><td className="text-right">{rupiah(hasil.bahanPerUnit)}/unit</td></tr>
              {hasil.finishingNama && (
                <tr className="border-b"><td className="py-2">Finishing ({hasil.finishingNama})</td><td className="text-right">{rupiah(hasil.finishingPerUnit)}/unit</td></tr>
              )}
              <tr className="border-b"><td className="py-2">Tier jumlah</td><td className="text-right">{hasil.tierNama} (−{hasil.diskonPersen}%)</td></tr>
              <tr className="border-b"><td className="py-2">Harga per unit</td><td className="text-right font-semibold">{rupiah(hasil.hargaSatuan)}</td></tr>
              <tr className="border-b"><td className="py-2">Jumlah</td><td className="text-right">{hasil.jumlah}</td></tr>
              <tr><td className="py-2 font-bold text-lg">Total</td><td className="text-right font-bold text-lg text-green-700">{rupiah(hasil.total)}</td></tr>
            </tbody>
          </table>
        )}
        {hasil && (
          <a href="/pesanan/baru" className="inline-block mt-4 bg-green-700 text-white px-5 py-2 rounded hover:bg-green-600">
            Buat Pesanan →
          </a>
        )}
      </div>
    </div>
  );
}
