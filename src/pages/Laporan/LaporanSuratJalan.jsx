import React from "react";
import { Badge } from "@chakra-ui/react";
import LaporanPage, {
  formatAngka,
  formatDateTime,
  formatTanggal,
} from "./LaporanPage";

const statusColor = {
  DRAFT: "gray",
  KIRIM: "blue",
  TIBA: "orange",
  BATAL: "red",
  BONGKAR: "green",
};

function LaporanSuratJalan() {
  return (
    <LaporanPage
      title="Laporan Surat Jalan"
      description="Rekap surat jalan yang terkait dengan akun atau mitra yang sedang login."
      endpoint="/laporan-kpbpn/surat-jalan"
      searchPlaceholder="Nomor surat jalan"
      columns={[
        { key: "nomor", header: "Nomor" },
        {
          key: "tanggal",
          header: "Tanggal",
          render: (item) => formatTanggal(item.tanggal),
          excelValue: (item) => formatTanggal(item.tanggal),
        },
        { key: "mitra", header: "Mitra" },
        { key: "transportir", header: "Transportir" },
        { key: "supir", header: "Supir" },
        {
          key: "volume",
          header: "Volume",
          isNumeric: true,
          render: (item) =>
            `${formatAngka(item.volume)} ${item.satuan || ""}`.trim(),
          excelValue: (item) => item.volume ?? "-",
        },
        {
          key: "status",
          header: "Status",
          render: (item) => (
            <Badge colorScheme={statusColor[item.status] || "gray"}>
              {item.status || "-"}
            </Badge>
          ),
        },
        { key: "stasiun", header: "SPM" },
        { key: "asalMinyak", header: "Asal Minyak" },
        {
          key: "jamDatang",
          header: "Jam Datang",
          render: (item) => formatDateTime(item.jamDatang),
          excelValue: (item) => formatDateTime(item.jamDatang),
        },
        {
          key: "jamPergi",
          header: "Jam Pergi",
          render: (item) => formatDateTime(item.jamPergi),
          excelValue: (item) => formatDateTime(item.jamPergi),
        },
        { key: "petugasPK", header: "Petugas PK" },
      ]}
    />
  );
}

export default LaporanSuratJalan;
