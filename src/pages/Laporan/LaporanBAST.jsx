import React from "react";
import LaporanPage, { formatAngka, formatTanggal } from "./LaporanPage";

function LaporanBAST() {
  return (
    <LaporanPage
      title="Laporan BAST"
      description="Rekap Berita Acara Serah Terima (pengisian tanki) yang dibuat akun ini."
      endpoint="/laporan-kpbpn/bast"
      searchPlaceholder="Nomor BAST / catatan"
      columns={[
        {
          key: "tanggal",
          header: "Tanggal",
          render: (item) => formatTanggal(item.tanggal),
          excelValue: (item) => formatTanggal(item.tanggal),
        },
        { key: "nomorSurat", header: "Nomor BAST" },
        { key: "tanki", header: "Tanki" },
        { key: "mitra", header: "Mitra" },
        { key: "nomorSuratJalan", header: "Surat Jalan" },
        {
          key: "flowMeter",
          header: "Flow Meter",
          isNumeric: true,
          render: (item) => formatAngka(item.flowMeter),
        },
        {
          key: "gross",
          header: "Gross",
          isNumeric: true,
          render: (item) => formatAngka(item.gross),
        },
        {
          key: "net",
          header: "Net",
          isNumeric: true,
          render: (item) => formatAngka(item.net),
        },
        {
          key: "volumeKonfirmasi",
          header: "Volume Diterima",
          isNumeric: true,
          render: (item) =>
            `${formatAngka(item.volumeKonfirmasi)} ${item.satuan || ""}`.trim(),
          excelValue: (item) => item.volumeKonfirmasi ?? "-",
        },
        { key: "pembuat", header: "Pembuat" },
        {
          key: "baBongkarId",
          header: "BA Bongkar",
          render: (item) => (item.baBongkarId ? `#${item.baBongkarId}` : "-"),
          excelValue: (item) => item.baBongkarId || "-",
        },
      ]}
    />
  );
}

export default LaporanBAST;
