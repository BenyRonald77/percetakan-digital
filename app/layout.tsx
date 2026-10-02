import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Percetakan Digital",
  description: "Kalkulasi harga, upload desain, proof, antrean produksi, dan tracking pesanan percetakan digital.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen text-slate-900">
        <nav className="bg-slate-900 text-white">
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap gap-4 items-center">
            <a href="/" className="font-bold text-lg mr-4">🖨️ Percetakan Digital</a>
            <a href="/" className="hover:underline">Kalkulator</a>
            <a href="/pesanan/baru" className="hover:underline">Buat Pesanan</a>
            <a href="/pesanan" className="hover:underline">Pesanan</a>
            <a href="/tracking" className="hover:underline">Tracking</a>
            <a href="/admin" className="hover:underline">Admin</a>
          </div>
        </nav>
        <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
