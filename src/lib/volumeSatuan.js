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

const parseProduksiHarian = (value) => {
  const num = Number(value);
  if (Number.isNaN(num) || num <= 0) return 0;
  return num;
};

/**
 * Bagi volume ke sumur secara acak.
 * Bobot default dari produksiHarian; bisa diganti lewat getWeight.
 * `step` 1 = angka bulat, 0.1 = satu desimal (contoh 4.5, 5.9).
 * Nilai 0 tetap 0. Total tidak melebihi target.
 */
export const distributeRandomVolume = (
  targetVolume,
  sumurList = [],
  getWeight = (sumur) => parseProduksiHarian(sumur.produksiHarian),
  step = 1,
) => {
  const inputs = {};
  const wells = (sumurList || []).map((sumur) => ({
    id: sumur.id,
    weight: parseProduksiHarian(getWeight(sumur)),
  }));

  wells.forEach((well) => {
    inputs[well.id] = 0;
  });

  const unit = Number(step) > 0 ? Number(step) : 1;
  const factor = Math.round(1 / unit);
  const decimals = Math.max(0, String(unit).split(".")[1]?.length || 0);
  const totalUnits = Math.floor(Number(targetVolume) * factor + 1e-9);
  const active = wells.filter((well) => well.weight > 0);

  if (!active.length || Number.isNaN(totalUnits) || totalUnits <= 0) {
    return inputs;
  }

  const jittered = active.map((well) => ({
    id: well.id,
    weight: well.weight * (0.65 + Math.random() * 0.7),
  }));
  const jitterTotal = jittered.reduce((sum, well) => sum + well.weight, 0);
  const expected = jittered.map(
    (well) => (totalUnits * well.weight) / jitterTotal,
  );
  const parts = expected.map((value) => Math.floor(value));
  const remaining = totalUnits - parts.reduce((sum, value) => sum + value, 0);

  const remainders = expected
    .map((value, index) => ({
      index,
      remainder: value - Math.floor(value),
      rand: Math.random(),
    }))
    .sort((a, b) => b.remainder - a.remainder || b.rand - a.rand);

  for (let i = 0; i < remaining; i += 1) {
    parts[remainders[i].index] += 1;
  }

  jittered.forEach((well, index) => {
    const value = parts[index] / factor;
    inputs[well.id] = value === 0 ? 0 : roundVolumeNumber(value, decimals);
  });

  return inputs;
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
  const rounded = roundVolumeNumber(num, maxDecimals);
  if (rounded === null) return "-";
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: maxDecimals,
    minimumFractionDigits: 0,
  }).format(rounded);
};

export const getVolumeAllSatuanLines = (volume, satuan) => {
  if (volume === null || volume === undefined || volume === "") return null;

  const all = convertVolumeToAllUnits(volume, satuan);
  if (!all) return null;

  return [
    {
      key: "barrel",
      label: `${formatVolumeNumber(all.barrel)} Barrel`,
    },
    { key: "liter", label: `${formatVolumeNumber(all.liter)} Liter` },
    { key: "drum", label: `${formatVolumeNumber(all.drum)} Drum` },
  ];
};

const toRoundedBarrel = (volume, satuan) => {
  const all = convertVolumeToAllUnits(volume, satuan);
  if (!all) return null;
  return roundVolumeNumber(all.barrel, 3);
};

export const isVolumeEqual = (volumeA, satuanA, volumeB, satuanB) => {
  const barrelA = toRoundedBarrel(volumeA, satuanA);
  const barrelB = toRoundedBarrel(volumeB, satuanB);
  if (barrelA === null || barrelB === null) return false;
  return barrelA === barrelB;
};

export const isVolumeOver = (volumeA, satuanA, volumeB, satuanB) => {
  const barrelA = toRoundedBarrel(volumeA, satuanA);
  const barrelB = toRoundedBarrel(volumeB, satuanB);
  if (barrelA === null || barrelB === null) return false;
  return barrelA > barrelB;
};
