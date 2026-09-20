import React from "react";
import { Link as ChakraLink } from "@chakra-ui/react";
import LaporanPage, {
  formatAngka,
  formatDateTime,
  formatJam,
  formatTanggal,
  getImageUrl,
} from "./LaporanPage";

function LaporanPetugasKeamanan() {
  return (
    <LaporanPage
      title="Laporan Petugas Keamanan"
      description="Rekap konfirmasi kedatangan yang dicatat petugas keamanan, termasuk surat jalan terkait."
      endpoint="/laporan-kpbpn/petugas-keamanan"
      searchPlaceholder="Nomor surat jalan / mitra"
      columns={[
        {
          key: "tanggal",
          header: "Tanggal",
          render: (item) => formatTanggal(item.tanggal),
          excelValue: (item) => formatTanggal(item.tanggal),
        },
        { key: "nomorSuratJalan", header: "Nomor Surat Jalan" },
        { key: "mitra", header: "Mitra" },
        { key: "supir", header: "Supir" },
        { key: "transportir", header: "Transportir" },
        {
          key: "volumeSuratJalan",
          header: "Volume SJ",
          isNumeric: true,
          render: (item) =>
            `${formatAngka(item.volumeSuratJalan)} ${item.satuan || ""}`.trim(),
          excelValue: (item) => item.volumeSuratJalan ?? "-",
        },
        {
          key: "jamKedatangan",
          header: "Jam Kedatangan",
          render: (item) => formatJam(item.jamKedatangan),
          excelValue: (item) => formatJam(item.jamKedatangan),
        },
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
        { key: "status", header: "Status" },
        { key: "petugasPK", header: "Petugas PK" },
        {
          key: "foto",
          header: "Foto",
          render: (item) =>
            item.foto ? (
              <ChakraLink
                href={getImageUrl(item.foto)}
                isExternal
                color="blue.600"
              >
                Lihat
              </ChakraLink>
            ) : (
              "-"
            ),
          excelValue: (item) => (item.foto ? getImageUrl(item.foto) : "-"),
        },
      ]}
    />
  );
}

export default LaporanPetugasKeamanan;
