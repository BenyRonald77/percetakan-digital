"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { rupiah, formatTanggal, STATUS_LABEL } from "@/lib/format";

function TrackingInner() {
  const params = useSearchParams();
  const [kode, setKode] = useState(params.get("kode") ?? "");
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  async function lacak(k?: string) {
    const key = (k ?? kode).trim();
    if (!key) return;
    setError(""); setData(null);
    const res = await fetch(`/api/tracking/${encodeURIComponent(key)}`);
    const d = await res.json();
    if (!res.ok) { setError(d.error ?? "gagal"); return; }
    setData(d);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded shadow p-6 mb-4">
        <h1 className="text-2xl font-bold mb-4">Tracking Pesanan</h1>
        <div className="flex gap-2">
          <input className="border rounded px-3 py-2 flex-1" placeholder="Kode pesanan, mis. PD-000001"
            value={kode} onChange={(e) => setKode(e.target.value)} />
          <button onClick={() => lacak()} className="bg-slate-900 text-white px-5 py-2 rounded">Lacak</button>
        </div>
        {error && <p className="text-red-600 mt-3">{error}</p>}
      </div>
      {data && (
        <div className="bg-white rounded shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">{data.kode}</h2>
            <span className="bg-blue-100 text-blue-800 rounded px-3 py-1 font-semibold">
              {STATUS_LABEL[data.status] ?? data.status}
            </span>
          </div>
          <dl className="text-sm grid grid-cols-2 gap-2">
            <dt className="text-slate-500">Pelanggan</dt><dd>{data.namaPelanggan}</dd>
            <dt className="text-slate-500">Bahan</dt><dd>{data.bahan}</dd>
            <dt className="text-slate-500">Finishing</dt><dd>{data.finishing ?? "—"}</dd>
            <dt className="text-slate-500">Ukuran</dt><dd>{data.ukuran}</dd>
            <dt className="text-slate-500">Jumlah</dt><dd>{data.jumlah}</dd>
            <dt className="text-slate-500">Total</dt><dd className="font-semibold">{rupiah(data.total)}</dd>
            {data.mesin && <><dt className="text-slate-500">Mesin</dt><dd>{data.mesin}</dd></>}
            {data.posisiAntrean && <><dt className="text-slate-500">Posisi antrean</dt><dd>#{data.posisiAntrean}</dd></>}
            {data.estimasiSelesai && <><dt className="text-slate-500">Estimasi selesai</dt><dd>{formatTanggal(data.estimasiSelesai)}</dd></>}
            {data.catatan && <><dt className="text-slate-500">Catatan</dt><dd>{data.catatan}</dd></>}
            <dt className="text-slate-500">Dibuat</dt><dd>{formatTanggal(data.dibuatPada)}</dd>
          </dl>
        </div>
      )}
    </div>
  );
}

export default function TrackingPage() {
  return (
    <Suspense fallback={<p>Memuat…</p>}>
      <TrackingInner />
    </Suspense>
  );
}
