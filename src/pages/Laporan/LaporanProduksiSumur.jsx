import React from "react";
import { Badge } from "@chakra-ui/react";
import LaporanPage, { formatAngka, formatTanggal } from "./LaporanPage";

const tipeColor = {
  "Surat Jalan": "blue",
  BAK3S: "purple",
};

function LaporanProduksiSumur() {
  return (
    <LaporanPage
      title="Laporan Produksi Sumur"
      description="Rekap produksi sumur harian dari surat jalan dan BAK3S."
      endpoint="/laporan-kpbpn/produksi-sumur"
      searchPlaceholder="Sumur, nomor, mitra, atau referensi"
      filters={[
        {
          key: "sumber",
          label: "Sumber",
          options: [
            { value: "", label: "Semua sumber" },
            { value: "suratJalan", label: "Surat Jalan" },
            { value: "BAK3S", label: "BAK3S" },
          ],
        },
      ]}
      columns={[
        {
          key: "tanggal",
          header: "Tanggal",
          render: (item) => formatTanggal(item.tanggal),
          excelValue: (item) => formatTanggal(item.tanggal),
        },
        { key: "sumur", header: "Sumur" },
        { key: "nomorSumur", header: "Nomor Sumur" },
        { key: "mitra", header: "Mitra" },
        {
          key: "tipe",
          header: "Sumber",
          render: (item) => (
            <Badge colorScheme={tipeColor[item.tipe] || "gray"}>
              {item.tipe || "-"}
            </Badge>
          ),
        },
        { key: "referensi", header: "Referensi" },
        {
          key: "produksi",
          header: "Produksi",
          isNumeric: true,
          render: (item) => formatAngka(item.produksi),
          excelValue: (item) => item.produksi ?? "-",
        },
        { key: "satuan", header: "Satuan" },
      ]}
    />
  );
}

export default LaporanProduksiSumur;
