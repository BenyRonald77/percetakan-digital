export const rupiah = (n: number) =>
  "Rp" + Math.round(n).toLocaleString("id-ID");
export const nowIso = () => new Date().toISOString();
export const formatTanggal = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const STATUS_LABEL: Record<string, string> = {
  menunggu_proof: "Menunggu Proof",
  menunggu_persetujuan: "Menunggu Persetujuan",
  antre_produksi: "Antre Produksi",
  dikerjakan: "Dikerjakan",
  selesai: "Selesai",
  siap_diambil: "Siap Diambil",
  ditolak: "Ditolak",
};
