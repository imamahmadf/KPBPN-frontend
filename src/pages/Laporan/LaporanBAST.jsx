import React from "react";
import LaporanPage, { formatAngka, formatTanggal } from "./LaporanPage";

const formatDaftarAngka = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  const list = Array.isArray(value) ? value : [value];
  const formatted = list
    .filter((item) => item !== null && item !== undefined && item !== "")
    .map((item) => formatAngka(item));
  return formatted.length ? formatted.join(", ") : "-";
};

const kolomAngka = (key, header) => ({
  key,
  header,
  isNumeric: true,
  render: (item) => formatAngka(item[key]),
});

const kolomDaftarAngka = (key, header) => ({
  key,
  header,
  isNumeric: true,
  render: (item) => formatDaftarAngka(item[key]),
  excelValue: (item) => formatDaftarAngka(item[key]),
});

function LaporanBAST() {
  return (
    <LaporanPage
      title="Laporan BAST"
      description="Rekap Berita Acara Serah Terima (pengisian tanki) yang dibuat akun ini."
      endpoint="/laporan-kpbpn/bast"
      searchPlaceholder="Nomor BAST / catatan"
      tableMinW="1680px"
      columns={[
        {
          key: "tanggal",
          header: "Tanggal",
          render: (item) => formatTanggal(item.tanggal),
          excelValue: (item) => formatTanggal(item.tanggal),
        },
        { key: "nomorSurat", header: "Nomor BAST" },
        { key: "mitra", header: "Mitra" },
        { key: "tanki", header: "Tanki" },
        kolomAngka("gross", "Gross"),
        kolomAngka("net", "Net"),
        kolomAngka("loss", "Loss"),
        kolomAngka("netBarrel", "In"),
        kolomDaftarAngka("api", "API"),
        kolomDaftarAngka("sg", "SG"),
        kolomDaftarAngka("suhu", "SUHU"),
        kolomDaftarAngka("bsnw", "BSNW"),
        { key: "plat", header: "Plat Nomor" },
        { key: "supir", header: "Supir" },
        kolomAngka("jumlahMobil", "Jumlah Mobil"),
        {
          key: "volumeSuratJalan",
          header: "Volume Surat Jalan",
          isNumeric: true,
          render: (item) =>
            `${formatAngka(item.volumeSuratJalan)} ${item.satuanSuratJalan || ""}`.trim(),
          excelValue: (item) => item.volumeSuratJalan ?? "-",
        },
      ]}
    />
  );
}

export default LaporanBAST;
