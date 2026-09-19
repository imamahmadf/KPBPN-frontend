import React from "react";
import LaporanPage, {
  formatAngka,
  formatBulan,
  formatTanggal,
  formatTarif,
} from "./LaporanPage";

function LaporanKeuangan() {
  return (
    <LaporanPage
      title="Laporan Keuangan"
      description="Rekap BAK3S beserta tarif ICP × kurs tengah bulan sebelumnya dan nilai produksi."
      endpoint="/laporan-kpbpn/keuangan"
      searchPlaceholder="Pembuat / ID BA"
      columns={[
        {
          key: "tanggal",
          header: "Tanggal",
          render: (item) => formatTanggal(item.tanggal),
          excelValue: (item) => formatTanggal(item.tanggal),
        },
        {
          key: "baBongkarId",
          header: "BA Bongkar",
          render: (item) => (item.baBongkarId ? `#${item.baBongkarId}` : "-"),
        },
        {
          key: "api",
          header: "API",
          isNumeric: true,
          render: (item) => formatAngka(item.api),
        },
        {
          key: "BSNW",
          header: "BSNW",
          isNumeric: true,
          render: (item) => formatAngka(item.BSNW),
        },
        {
          key: "sg",
          header: "SG",
          isNumeric: true,
          render: (item) => formatAngka(item.sg),
        },
        {
          key: "produksi",
          header: "Produksi",
          isNumeric: true,
          render: (item) => formatAngka(item.produksi),
        },
        {
          key: "icp",
          header: "ICP",
          isNumeric: true,
          render: (item) => formatTarif(item.icp),
        },
        {
          key: "kursTengah",
          header: "Kurs Tengah",
          isNumeric: true,
          render: (item) => formatTarif(item.kursTengah),
        },
        {
          key: "tarif",
          header: "Tarif",
          isNumeric: true,
          render: (item) => formatTarif(item.tarif),
        },
        {
          key: "nilai",
          header: "Nilai",
          isNumeric: true,
          render: (item) => formatTarif(item.nilai),
        },
        {
          key: "bulanTarif",
          header: "Bulan Tarif",
          render: (item) => formatBulan(item.bulanTarif),
          excelValue: (item) => formatBulan(item.bulanTarif),
        },
        { key: "pembuat", header: "Pembuat" },
      ]}
    />
  );
}

export default LaporanKeuangan;
