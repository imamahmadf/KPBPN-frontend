import React from "react";
import { Link as ChakraLink } from "@chakra-ui/react";
import LaporanPage, {
  formatAngka,
  formatJam,
  formatTanggal,
  getImageUrl,
} from "./LaporanPage";

function LaporanKonfirmasiPenerimaan() {
  return (
    <LaporanPage
      title="Laporan Konfirmasi Penerimaan"
      description="Rekap konfirmasi penerimaan yang dicatat sebagai petugas keamanan atau petugas lab."
      endpoint="/laporan-kpbpn/konfirmasi-penerimaan"
      searchPlaceholder="Nomor konfirmasi / catatan"
      columns={[
        { key: "nomor", header: "Nomor" },
        {
          key: "tanggal",
          header: "Tanggal",
          render: (item) => formatTanggal(item.tanggal),
          excelValue: (item) => formatTanggal(item.tanggal),
        },
        {
          key: "jamKedatangan",
          header: "Jam Kedatangan",
          render: (item) => formatJam(item.jamKedatangan),
          excelValue: (item) => formatJam(item.jamKedatangan),
        },
        { key: "nomorSuratJalan", header: "Surat Jalan" },
        { key: "mitra", header: "Mitra" },
        {
          key: "volume",
          header: "Volume",
          isNumeric: true,
          render: (item) =>
            `${formatAngka(item.volume)} ${item.satuan || ""}`.trim(),
          excelValue: (item) => item.volume ?? "-",
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
        { key: "status", header: "Status SJ" },
        { key: "petugasPK", header: "Petugas PK" },
        { key: "petugasLab", header: "Petugas Lab" },
        { key: "tanki", header: "Tanki" },
        { key: "nomorBAST", header: "Nomor BAST" },
        {
          key: "foto",
          header: "Foto PK",
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
        {
          key: "fotoLab",
          header: "Foto Lab",
          render: (item) =>
            item.fotoLab ? (
              <ChakraLink
                href={getImageUrl(item.fotoLab)}
                isExternal
                color="blue.600"
              >
                Lihat
              </ChakraLink>
            ) : (
              "-"
            ),
          excelValue: (item) => (item.fotoLab ? getImageUrl(item.fotoLab) : "-"),
        },
      ]}
    />
  );
}

export default LaporanKonfirmasiPenerimaan;
