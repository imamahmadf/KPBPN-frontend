import React from "react";
import DetailSuratJalan from "../SuratJalan/DetailSuratJalan";

function DetailSuratJalanMitra(props) {
  return (
    <DetailSuratJalan
      {...props}
      backTo="/pengiriman-mitra/surat-jalan"
      showExtendedSections={false}
      allowEditProduksiAnytime
      showAutoFillProduksi
    />
  );
}

export default DetailSuratJalanMitra;
