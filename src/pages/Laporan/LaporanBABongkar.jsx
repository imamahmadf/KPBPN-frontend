import React from "react";
import { Badge } from "@chakra-ui/react";
import LaporanPage, { formatAngka, formatTanggal } from "./LaporanPage";

function LaporanBABongkar() {
  return (
    <LaporanPage
      title="Laporan BA Bongkar"
      description="Rekap Berita Acara Bongkar yang dibuat akun ini, termasuk kaitan BAST dan BAK3S."
      endpoint="/laporan-kpbpn/ba-bongkar"
      searchPlaceholder="ID BA Bongkar"
      columns={[
        {
          key: "id",
          header: "ID",
          render: (item) => `#${item.id}`,
        },
        {
          key: "tanggal",
          header: "Tanggal",
          render: (item) => formatTanggal(item.tanggal),
          excelValue: (item) => formatTanggal(item.tanggal),
        },
        { key: "tanki", header: "Tanki" },
        { key: "ukuranCairan", header: "Ukuran Cairan" },
        { key: "ukuranAir", header: "Ukuran Air" },
        { key: "nomorBAST", header: "Nomor BAST" },
        { key: "mitra", header: "Mitra" },
        { key: "pembuat", header: "Pembuat" },
        {
          key: "produksiK3S",
          header: "Produksi K3S",
          isNumeric: true,
          render: (item) => formatAngka(item.produksiK3S),
        },
        {
          key: "punyaBAK3S",
          header: "BAK3S",
          render: (item) => (
            <Badge colorScheme={item.punyaBAK3S ? "green" : "gray"}>
              {item.punyaBAK3S ? "Ada" : "Belum"}
            </Badge>
          ),
          excelValue: (item) => (item.punyaBAK3S ? "Ada" : "Belum"),
        },
      ]}
    />
  );
}

export default LaporanBABongkar;
