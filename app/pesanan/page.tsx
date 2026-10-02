"use client";
import { useEffect, useState } from "react";
import { rupiah, formatTanggal, STATUS_LABEL } from "@/lib/format";

export default function PesananListPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [filter, setFilter] = useState("");

  function muat() {
    fetch("/api/pesanan" + (filter ? `?status=${filter}` : ""))
      .then((r) => r.json())
      .then(setRows);
  }
  useEffect(muat, [filter]);

  return (
    <div className="bg-white rounded shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Daftar Pesanan</h1>
        <select className="border rounded px-3 py-2" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">Semua status</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-slate-500">
            <th className="py-2">Kode</th><th>Pelanggan</th><th>Bahan</th>
            <th>Jumlah</th><th>Total</th><th>Status</th><th>Dibuat</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id} className="border-b hover:bg-slate-50">
              <td className="py-2"><a className="text-blue-700 underline" href={`/tracking?kode=${p.kode}`}>{p.kode}</a></td>
              <td>{p.namaPelanggan}</td>
              <td>{p.bahan?.nama}</td>
              <td>{p.jumlah}</td>
              <td>{rupiah(p.total)}</td>
              <td><span className="bg-slate-100 rounded px-2 py-1">{STATUS_LABEL[p.status] ?? p.status}</span></td>
              <td>{formatTanggal(p.dibuatPada)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <p className="text-slate-500 mt-4">Belum ada pesanan.</p>}
    </div>
  );
}
