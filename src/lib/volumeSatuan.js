/** Konversi satuan volume — selaras dengan backend tankiControllers */
export const LITER_PER_BARREL = 158.987;
export const LITER_PER_DRUM = 200;

export const normalizeSatuan = (satuan) => {
  const value = String(satuan || "barrel").trim().toLowerCase();
  if (value === "barrel" || value === "liter" || value === "drum") return value;
  return "barrel";
};

export const convertVolumeToLiter = (volume, satuan) => {
  const value = Number(volume);
  if (Number.isNaN(value)) return null;

  const unit = normalizeSatuan(satuan);
  if (unit === "barrel") return value * LITER_PER_BARREL;
  if (unit === "liter") return value;
  if (unit === "drum") return value * LITER_PER_DRUM;

  return value;
};

export const convertLiterToAllUnits = (liter) => {
  if (liter === null || Number.isNaN(liter)) return null;

  return {
    barrel: liter / LITER_PER_BARREL,
    liter,
    drum: liter / LITER_PER_DRUM,
  };
};

export const convertVolumeToAllUnits = (volume, satuan) => {
  const liter = convertVolumeToLiter(volume, satuan);
  if (liter === null) return null;
  return convertLiterToAllUnits(liter);
};

/** Volume dasar dalam barrel; konversi ke satuan tampilan. */
export const convertVolumeFromBarrel = (volumeBarrel, satuan) => {
  if (volumeBarrel === null || volumeBarrel === undefined || volumeBarrel === "") {
    return null;
  }
  const value = Number(volumeBarrel);
  if (Number.isNaN(value)) return null;

  const unit = normalizeSatuan(satuan);
  if (unit === "liter") return value * LITER_PER_BARREL;
  if (unit === "drum") return (value * LITER_PER_BARREL) / LITER_PER_DRUM;
  return value;
};

/** Tarif dasar dihitung per barrel; konversi ke satuan tampilan. */
export const convertTarifFromBarrel = (tarifBarrel, satuan) => {
  if (tarifBarrel === null || tarifBarrel === undefined || tarifBarrel === "") {
    return null;
  }
  const value = Number(tarifBarrel);
  if (Number.isNaN(value)) return null;

  const unit = normalizeSatuan(satuan);
  if (unit === "liter") return value / LITER_PER_BARREL;
  if (unit === "drum") return value * (LITER_PER_DRUM / LITER_PER_BARREL);
  return value;
};

export const roundVolumeNumber = (value, maxDecimals = 3) => {
  const num = Number(value);
  if (Number.isNaN(num)) return null;
  const factor = 10 ** maxDecimals;
  return Math.round((num + Number.EPSILON) * factor) / factor;
};

export const convertVolumeBetweenSatuan = (volume, fromSatuan, toSatuan) => {
  if (volume === null || volume === undefined || volume === "") return volume;
  const all = convertVolumeToAllUnits(volume, fromSatuan);
  if (!all) return null;
  return roundVolumeNumber(all[normalizeSatuan(toSatuan)], 3);
};

export const convertProduksiInputsBySatuan = (
  inputs,
  fromSatuan,
  toSatuan,
) => {
  if (!fromSatuan || !toSatuan) return inputs;
  if (normalizeSatuan(fromSatuan) === normalizeSatuan(toSatuan)) return inputs;

  const next = {};
  Object.entries(inputs || {}).forEach(([key, val]) => {
    if (val === "" || val == null) {
      next[key] = val;
      return;
    }
    const converted = convertVolumeBetweenSatuan(val, fromSatuan, toSatuan);
    next[key] = converted == null ? val : converted;
  });
  return next;
};

export const parseProduksiNumber = (value) => {
  if (value === null || value === undefined || value === "") return 0;
  const raw = String(value).trim();
  const normalized = raw.includes(".")
    ? raw.replace(/,/g, "")
    : raw.replace(",", ".");
  const rounded = roundVolumeNumber(normalized, 3);
  if (rounded === null || rounded <= 0) return 0;
  return rounded;
};

export const formatVolumeNumber = (num, maxDecimals = 3) => {
  if (num === null || Number.isNaN(num)) return "-";
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: maxDecimals,
    minimumFractionDigits: 0,
  }).format(num);
};

export const getVolumeAllSatuanLines = (volume, satuan) => {
  if (volume === null || volume === undefined || volume === "") return null;

  const all = convertVolumeToAllUnits(volume, satuan);
  if (!all) return null;

  return [
    { key: "barrel", label: `${formatVolumeNumber(all.barrel)} Barrel` },
    { key: "liter", label: `${formatVolumeNumber(all.liter)} Liter` },
    { key: "drum", label: `${formatVolumeNumber(all.drum)} Drum` },
  ];
};

export const isVolumeEqual = (volumeA, satuanA, volumeB, satuanB) => {
  const literA = convertVolumeToLiter(volumeA, satuanA);
  const literB = convertVolumeToLiter(volumeB, satuanB);
  if (literA === null || literB === null) return false;
  return Math.abs(literA - literB) < 0.001;
};

export const isVolumeOver = (volumeA, satuanA, volumeB, satuanB) => {
  const literA = convertVolumeToLiter(volumeA, satuanA);
  const literB = convertVolumeToLiter(volumeB, satuanB);
  if (literA === null || literB === null) return false;
  return literA - literB > 0.001;
};
