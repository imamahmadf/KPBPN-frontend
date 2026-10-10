import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import ExcelJS from "exceljs";
import {
  Badge,
  Box,
  Button,
  Center,
  Container,
  Flex,
  Heading,
  HStack,
  Image,
  Skeleton,
  Spinner,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { BsFileEarmarkExcel } from "react-icons/bs";
import { Link as RouterLink } from "react-router-dom";
import LayoutKPBPN from "../../Componets/KPBPN/LayoutKPBPN";
import VolumeMultiSatuan from "../../Componets/VolumeMultiSatuan";
import {
  ProduksiStickyBar,
  ProduksiSumurList,
  VolumeSummary,
} from "../../Componets/KPBPN/ProduksiSumurInput";
import {
  LITER_PER_BARREL,
  convertProduksiInputsBySatuan,
  convertVolumeBetweenSatuan,
  convertVolumeToLiter,
  distributeEqualDifference,
  formatVolumeNumber,
  getVolumeAllSatuanLines,
  isVolumeEqual,
  isVolumeOver,
  parseProduksiNumber,
  roundVolumeNumber,
} from "../../lib/volumeSatuan";

const API_BASE = import.meta.env.VITE_REACT_APP_API_BASE_URL;

const getImageUrl = (path) => (path ? `${API_BASE}${path}` : null);

const getDocumentUrl = (filePath) => (filePath ? `${API_BASE}${filePath}` : null);

const getDocumentName = (filePath) => {
  if (!filePath) return "";
  return String(filePath).split("/").pop();
};

const formatTanggal = (d) =>
  d
    ? new Date(d).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "-";

const formatJam = (value) => {
  if (!value) return "-";
  const str = String(value).trim();
  const timeOnly = str.match(/^(\d{2}:\d{2})(?::\d{2})?$/);
  if (timeOnly) return timeOnly[1];
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return str;
  return parsed.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const statusColor = (status) => {
  const value = String(status || "").toUpperCase();
  if (value === "TIBA") return "green";
  if (value === "BONGKAR") return "orange";
  if (value === "KIRIM") return "blue";
  if (value === "BATAL") return "red";
  return "gray";
};

const formatAngka = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  const angka = Number(value);
  if (Number.isNaN(angka)) return String(value);
  return formatVolumeNumber(angka);
};

const excelNumber = (value) => {
  if (value === null || value === undefined || value === "") return "";
  const angka = Number(value);
  return Number.isNaN(angka) ? String(value) : angka;
};

const sumRounded = (values) =>
  roundVolumeNumber(
    values.reduce((total, value) => total + (Number(value) || 0), 0),
    3,
  ) ?? 0;

/** Bagi produksi BAK3S (barrel) ke sumur. Total hasil sama dengan target. */
const allocateProduksiBak3sBarrel = (targetBarrel, sumurList, getSourceBarrel) => {
  const ids = (sumurList || []).map((sumur) => sumur.id);
  const target = roundVolumeNumber(Number(targetBarrel), 3) ?? 0;
  const allocated = distributeEqualDifference(
    target,
    sumurList,
    getSourceBarrel,
  );

  if (target <= 0 || !ids.length) return allocated;

  const total = sumRounded(ids.map((id) => allocated[id]));
  if (total === target) return allocated;

  if (!total) {
    const share = roundVolumeNumber(target / ids.length, 3) ?? 0;
    ids.forEach((id) => {
      allocated[id] = share;
    });
    const subtotal = sumRounded(ids.slice(0, -1).map((id) => allocated[id]));
    allocated[ids[ids.length - 1]] = roundVolumeNumber(target - subtotal, 3) ?? 0;
    return allocated;
  }

  const lastId =
    [...ids].reverse().find((id) => Number(allocated[id]) > 0) ||
    ids[ids.length - 1];
  const adjusted =
    roundVolumeNumber((Number(allocated[lastId]) || 0) + (target - total), 3) ??
    0;
  if (adjusted >= 0) allocated[lastId] = adjusted;
  return allocated;
};

const SectionCard = ({ title, action, children, ...rest }) => (
  <Box
    p={{ base: 3, sm: 4, md: 5 }}
    borderWidth="1px"
    borderRadius="lg"
    bg="gray.50"
    overflow="hidden"
    h="100%"
    minW={0}
    {...rest}
  >
    <Flex
      justify="space-between"
      align={{ base: "stretch", sm: "center" }}
      gap={2}
      mb={{ base: 3, md: 4 }}
      wrap="wrap"
    >
      <Heading size="sm" color="kpbpn" mb={0}>
        {title}
      </Heading>
      {action}
    </Flex>
    {children}
  </Box>
);

const EmptyText = ({ children }) => (
  <Text fontSize="sm" color="gray.500">
    {children}
  </Text>
);

const toLiter = (volume, satuan) => {
  if (volume === null || volume === undefined || volume === "") return null;
  const liter = convertVolumeToLiter(volume, satuan || "barrel");
  return liter === null || Number.isNaN(liter) ? null : liter;
};

const sumLiter = (values) => {
  const nums = values.filter((value) => value !== null && value !== undefined);
  if (!nums.length) return null;
  return nums.reduce((total, value) => total + value, 0);
};

const barrelFromLiter = (liter) => {
  if (liter === null || liter === undefined) return null;
  return roundVolumeNumber(liter / LITER_PER_BARREL, 3);
};

const selisihBarrel = (current, previous) => {
  if (current === null || previous === null) return null;
  return roundVolumeNumber(current - previous, 3);
};

const persenPerubahan = (current, previous) => {
  if (current === null || previous === null || !previous) return null;
  return ((current - previous) / previous) * 100;
};

const formatPersen = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return null;
  }
  const rounded = Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  const prefix = rounded > 0 ? "+" : "";
  const label = new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rounded);
  return `${prefix}${label}%`;
};

const VolumeBlock = ({ label, volume, satuan }) => (
  <Box>
    {label ? (
      <Text fontSize="xs" color="gray.500" mb={0.5}>
        {label}
      </Text>
    ) : null}
    <VolumeMultiSatuan
      volume={volume}
      satuan={satuan || "barrel"}
      primarySatuan="barrel"
    />
  </Box>
);

const SelisihVolume = ({ value, caption, percent }) => {
  const persenLabel = formatPersen(percent);

  if (value === null || value === undefined) {
    return (
      <Text fontSize="sm" color="gray.500">
        -
      </Text>
    );
  }

  const rounded = roundVolumeNumber(value, 3);
  const color =
    rounded === 0 ? "gray.500" : rounded < 0 ? "red.600" : "orange.600";

  if (rounded === 0) {
    return (
      <Box>
        {caption ? (
          <Text fontSize="xs" color="gray.500" mb={0.5}>
            {caption}
          </Text>
        ) : null}
        <Text fontSize="sm" color="gray.500" fontWeight="semibold">
          0{persenLabel ? ` (${persenLabel})` : ""}
        </Text>
      </Box>
    );
  }

  const lines = getVolumeAllSatuanLines(rounded, "barrel") || [];
  const prefix = rounded > 0 ? "+" : "";

  return (
    <Box>
      {caption ? (
        <Text fontSize="xs" color="gray.500" mb={0.5}>
          {caption}
        </Text>
      ) : null}
      <VStack align="start" spacing={0}>
        {lines.map(({ key, label }, index) => (
          <Text
            key={key}
            fontSize={index === 0 ? "md" : "xs"}
            fontWeight={index === 0 ? "semibold" : "normal"}
            color={index === 0 ? color : "gray.500"}
            lineHeight="short"
            whiteSpace="nowrap"
          >
            {prefix}
            {label}
            {index === 0 && persenLabel ? ` (${persenLabel})` : ""}
          </Text>
        ))}
      </VStack>
    </Box>
  );
};

function DetailBAK3S({ match }) {
  const bak3sId = match.params.id;
  const toast = useToast();

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [produksiPanel, setProduksiPanel] = useState({
    loading: false,
    saving: false,
    sumurList: [],
    inputs: {},
    satuanVolumeId: null,
    satuanVolumeOptions: [],
    relatedMitra: [],
    defaultProduksi: {},
    sumberReferensi: {},
    usedSumberDefault: false,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editSnapshot, setEditSnapshot] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  const fetchDetail = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/tanki/get/bak3s/${bak3sId}`);
      setData(res.data.result || null);
    } catch (err) {
      console.error(err);
      setData(null);
      toast({
        title: "Gagal memuat data",
        description: err.response?.data?.error || err.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProduksiPanel = async () => {
    if (!bak3sId) return;

    setProduksiPanel((prev) => ({
      ...prev,
      loading: true,
      sumurList: [],
      inputs: {},
      defaultProduksi: {},
      sumberReferensi: {},
      usedSumberDefault: false,
    }));

    try {
      const res = await axios.get(
        `${API_BASE}/tanki/get/produksi-sumur-k3s/${bak3sId}`,
      );

      const sumurList = res.data.resultSumurMinyak || [];
      const existingProduksi = res.data.resultProduksi || [];
      const defaultProduksiList = res.data.defaultProduksi || [];
      const satuanVolumeOptions = res.data.resultSatuanVolume || [];
      const existingBySumur = new Map(
        existingProduksi.map((item) => [item.sumurMinyakId, item]),
      );
      const defaultProduksi = {};
      defaultProduksiList.forEach((item) => {
        if (item?.sumurMinyakId && item?.produksi) {
          defaultProduksi[item.sumurMinyakId] = item.produksi;
        }
      });
      const sumberReferensi = {};
      (res.data.resultProduksiSumber || []).forEach((item) => {
        const sumurId = item?.sumurMinyakId;
        if (!sumurId) return;
        const nomor =
          item.suratJalan?.nomor ||
          (item.suratJalanId ? `SJ #${item.suratJalanId}` : null);
        if (!nomor) return;
        if (!sumberReferensi[sumurId]) sumberReferensi[sumurId] = [];
        if (!sumberReferensi[sumurId].includes(nomor)) {
          sumberReferensi[sumurId].push(nomor);
        }
      });
      Object.keys(sumberReferensi).forEach((sumurId) => {
        sumberReferensi[sumurId] = sumberReferensi[sumurId].join(", ");
      });
      const hasSavedProduksi = existingProduksi.length > 0;
      const inputs = {};
      let usedSumberDefault = false;

      sumurList.forEach((sumur) => {
        const existing = existingBySumur.get(sumur.id);
        const fromSumber = defaultProduksi[sumur.id];

        if (
          existing?.produksi !== null &&
          existing?.produksi !== undefined &&
          existing?.produksi !== ""
        ) {
          inputs[sumur.id] = existing.produksi;
        } else if (!hasSavedProduksi && fromSumber) {
          inputs[sumur.id] = fromSumber;
          usedSumberDefault = true;
        } else {
          inputs[sumur.id] = "";
        }
      });

      const defaultSatuanVolumeId =
        existingProduksi.find((p) => p.satuanVolumeId)?.satuanVolumeId ??
        res.data.defaultSatuanVolumeId ??
        satuanVolumeOptions[0]?.id ??
        null;

      setProduksiPanel((prev) => ({
        ...prev,
        loading: false,
        sumurList,
        inputs,
        satuanVolumeId: defaultSatuanVolumeId,
        satuanVolumeOptions,
        relatedMitra: res.data.relatedMitra || [],
        defaultProduksi,
        sumberReferensi,
        usedSumberDefault,
      }));
      setIsEditing(existingProduksi.length === 0);
      setEditSnapshot(null);
    } catch (err) {
      console.error(err);
      setProduksiPanel((prev) => ({ ...prev, loading: false }));
      toast({
        title: "Gagal memuat produksi",
        description:
          err.response?.data?.error || "Gagal memuat data produksi sumur",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    fetchDetail();
    fetchProduksiPanel();
  }, [bak3sId]);

  const handleProduksiInputChange = (sumurMinyakId, value) => {
    setProduksiPanel((prev) => ({
      ...prev,
      inputs: {
        ...prev.inputs,
        [sumurMinyakId]: value,
      },
    }));
  };

  const handleSatuanChange = (e) => {
    const nextId = e.target.value ? Number(e.target.value) : null;
    setProduksiPanel((prev) => {
      const fromSatuan = prev.satuanVolumeOptions.find(
        (opt) => opt.id === prev.satuanVolumeId,
      )?.satuan;
      const toSatuan = prev.satuanVolumeOptions.find(
        (opt) => opt.id === nextId,
      )?.satuan;

      return {
        ...prev,
        satuanVolumeId: nextId,
        inputs: convertProduksiInputsBySatuan(
          prev.inputs,
          fromSatuan,
          toSatuan,
        ),
        defaultProduksi: convertProduksiInputsBySatuan(
          prev.defaultProduksi,
          fromSatuan,
          toSatuan,
        ),
      };
    });
  };

  const totalProduksiInput = useMemo(() => {
    const total = Object.values(produksiPanel.inputs).reduce((sum, val) => {
      return sum + parseProduksiNumber(val);
    }, 0);
    return roundVolumeNumber(total, 3) ?? 0;
  }, [produksiPanel.inputs]);

  const produksiSatuanLabel = useMemo(() => {
    const selected = produksiPanel.satuanVolumeOptions.find(
      (opt) => opt.id === produksiPanel.satuanVolumeId,
    );
    return selected?.satuan || "Barrel";
  }, [produksiPanel.satuanVolumeOptions, produksiPanel.satuanVolumeId]);

  const isProduksiOverLimit = useMemo(
    () =>
      isVolumeOver(
        totalProduksiInput,
        produksiSatuanLabel,
        data?.produksi,
        "barrel",
      ),
    [totalProduksiInput, produksiSatuanLabel, data?.produksi],
  );

  const isProduksiExact = useMemo(
    () =>
      isVolumeEqual(
        totalProduksiInput,
        produksiSatuanLabel,
        data?.produksi,
        "barrel",
      ),
    [totalProduksiInput, produksiSatuanLabel, data?.produksi],
  );

  const produksiComparison = isProduksiOverLimit
    ? "over"
    : isProduksiExact
      ? "equal"
      : "under";

  const showMitraColumn = useMemo(() => {
    const ids = new Set(
      produksiPanel.sumurList.map((sumur) => sumur.mitraId).filter(Boolean),
    );
    return ids.size > 1;
  }, [produksiPanel.sumurList]);

  const startEditProduksi = () => {
    setEditSnapshot({
      inputs: { ...produksiPanel.inputs },
      satuanVolumeId: produksiPanel.satuanVolumeId,
    });

    setProduksiPanel((prev) => {
      const nextInputs = { ...prev.inputs };
      let usedSumberDefault = prev.usedSumberDefault;

      prev.sumurList.forEach((sumur) => {
        const current = nextInputs[sumur.id];
        const kosong =
          current === "" || current === null || current === undefined;
        const fromSumber = prev.defaultProduksi?.[sumur.id];
        if (kosong && fromSumber) {
          nextInputs[sumur.id] = fromSumber;
          usedSumberDefault = true;
        }
      });

      return {
        ...prev,
        inputs: nextInputs,
        usedSumberDefault,
      };
    });
    setIsEditing(true);
  };

  const cancelEditProduksi = () => {
    if (editSnapshot) {
      setProduksiPanel((prev) => ({
        ...prev,
        inputs: editSnapshot.inputs,
        satuanVolumeId: editSnapshot.satuanVolumeId,
        usedSumberDefault: false,
      }));
    }
    setIsEditing(false);
    setEditSnapshot(null);
  };

  const autoFillProduksiSumur = () => {
    const sumurList = produksiPanel.sumurList;
    if (sumurList.length === 0) {
      toast({
        title: "Tidak ada sumur",
        description: "Tidak ada data sumur minyak untuk diisi otomatis.",
        status: "warning",
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    const defaultProduksi = produksiPanel.defaultProduksi || {};
    const hasSumberProduksi = sumurList.some(
      (sumur) => Number(defaultProduksi[sumur.id]) > 0,
    );
    if (!hasSumberProduksi) {
      toast({
        title: "Produksi surat jalan kosong",
        description:
          "Tidak ada produksi sumur dari surat jalan sebagai rujukan isi otomatis.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (!produksiPanel.satuanVolumeId) {
      toast({
        title: "Satuan belum dipilih",
        description: "Pilih satuan volume produksi terlebih dahulu.",
        status: "warning",
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    const targetVolume = convertVolumeBetweenSatuan(
      data?.produksi,
      "barrel",
      produksiSatuanLabel,
    );

    if (targetVolume == null || targetVolume <= 0) {
      toast({
        title: "Produksi BAK3S tidak valid",
        description: "Produksi BAK3S harus lebih dari 0 untuk isi otomatis.",
        status: "warning",
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    setProduksiPanel((prev) => ({
      ...prev,
      inputs: distributeEqualDifference(
        targetVolume,
        sumurList,
        (sumur) => defaultProduksi[sumur.id],
      ),
    }));

    toast({
      title: "Isi otomatis",
      description:
        "Produksi K3S diisi dari produksi surat jalan dikurangi selisih (total produksi − produksi BAK3S) yang dibagi rata ke sumur.",
      status: "success",
      duration: 4000,
      isClosable: true,
    });
  };

  const saveProduksiSumur = async () => {
    const items = Object.entries(produksiPanel.inputs)
      .map(([sumurMinyakId, produksi]) => ({
        sumurMinyakId: parseInt(sumurMinyakId, 10),
        produksi: parseProduksiNumber(produksi),
      }))
      .filter((item) => item.produksi > 0);

    if (!produksiPanel.satuanVolumeId) {
      toast({
        title: "Satuan belum dipilih",
        description: "Pilih satuan volume produksi terlebih dahulu.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (isProduksiOverLimit) {
      toast({
        title: "Total produksi melebihi acuan",
        description: `Total produksi tidak boleh lebih dari produksi BAK3S (${formatAngka(data?.produksi)} barrel)`,
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setProduksiPanel((prev) => ({ ...prev, saving: true }));

    try {
      await axios.post(`${API_BASE}/tanki/post/produksi-sumur-k3s`, {
        BAK3SId: bak3sId,
        satuanVolumeId: produksiPanel.satuanVolumeId,
        items,
      });

      toast({
        title: "Berhasil",
        description: "Produksi sumur K3S berhasil disimpan.",
        status: "success",
        duration: 4000,
        isClosable: true,
      });

      await Promise.all([fetchDetail(), fetchProduksiPanel()]);
      setIsEditing(false);
      setEditSnapshot(null);
    } catch (err) {
      console.error(err);
      toast({
        title: "Gagal menyimpan",
        description:
          err.response?.data?.error || "Gagal menyimpan produksi sumur",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setProduksiPanel((prev) => ({ ...prev, saving: false }));
    }
  };

  const exportProduksiExcel = async () => {
    const rows = produksiPanel.sumurList.map((sumur) => ({
      sumur,
      produksi: parseProduksiNumber(produksiPanel.inputs[sumur.id]),
      produksiSuratJalan: parseProduksiNumber(
        produksiPanel.defaultProduksi?.[sumur.id],
      ),
      suratJalan: produksiPanel.sumberReferensi?.[sumur.id] || "-",
    }));

    if (!rows.length) {
      toast({
        title: "Tidak ada data",
        description: "Tidak ada data produksi sumur K3S untuk diekspor",
        status: "info",
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    setIsExporting(true);
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Produksi Sumur K3S");
      const satuanLabel = produksiSatuanLabel || "Barrel";
      const targetBarrel = roundVolumeNumber(Number(data?.produksi), 3) ?? 0;
      const toBarrelFromSatuan = (value) =>
        convertVolumeBetweenSatuan(
          parseProduksiNumber(value),
          satuanLabel,
          "barrel",
        );
      const hasInputProduksi = produksiPanel.sumurList.some(
        (sumur) => parseProduksiNumber(produksiPanel.inputs?.[sumur.id]) > 0,
      );
      const produksiBak3sBarrel = allocateProduksiBak3sBarrel(
        targetBarrel,
        produksiPanel.sumurList,
        (sumur) =>
          toBarrelFromSatuan(
            hasInputProduksi
              ? produksiPanel.inputs?.[sumur.id]
              : produksiPanel.defaultProduksi?.[sumur.id],
          ),
      );

      const headerStyle = {
        font: { bold: true, color: { argb: "FFFFFF" } },
        fill: {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "4472C4" },
        },
        alignment: { horizontal: "center", vertical: "middle" },
        border: {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        },
      };

      const dataStyle = {
        border: {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        },
        alignment: { vertical: "middle" },
      };

      const headerRow = worksheet.addRow([
        "No",
        "Nama Sumur",
        "Koordinat X",
        "Koordinat Y",
        "Surat Jalan",
        `Produksi Surat Jalan (${satuanLabel})`,
        `Produksi BAK3S (${satuanLabel})`,
        "Produksi BAK3S (Barrel)",
      ]);
      headerRow.eachCell((cell) => {
        cell.style = headerStyle;
      });

      rows.forEach((item, index) => {
        const dataRow = worksheet.addRow([
          index + 1,
          item.sumur.nama || "-",
          excelNumber(item.sumur.longitude),
          excelNumber(item.sumur.latitude),
          item.suratJalan,
          item.produksiSuratJalan,
          item.produksi,
          produksiBak3sBarrel[item.sumur.id] ?? 0,
        ]);
        dataRow.eachCell((cell) => {
          cell.style = dataStyle;
        });
        [3, 4].forEach((col) => {
          if (typeof dataRow.getCell(col).value === "number") {
            dataRow.getCell(col).numFmt = "0.00000000";
          }
        });
        [6, 7, 8].forEach((col) => {
          if (typeof dataRow.getCell(col).value === "number") {
            dataRow.getCell(col).numFmt = "#,##0.000";
          }
        });
      });

      const lastDataRow = rows.length + 1;
      const totalStyle = {
        font: { bold: true },
        fill: {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "D9E2F3" },
        },
        border: dataStyle.border,
        alignment: { vertical: "middle" },
      };
      const totalRow = worksheet.addRow([
        "",
        "Total",
        "",
        "",
        "",
        { formula: `SUM(F2:F${lastDataRow})` },
        { formula: `SUM(G2:G${lastDataRow})` },
        { formula: `SUM(H2:H${lastDataRow})` },
      ]);
      totalRow.eachCell((cell) => {
        cell.style = totalStyle;
      });
      [6, 7, 8].forEach((col) => {
        totalRow.getCell(col).numFmt = "#,##0.000";
      });

      worksheet.columns.forEach((column) => {
        let maxLength = 14;
        column.eachCell({ includeEmpty: true }, (cell) => {
          const columnLength = cell.value ? String(cell.value).length : 14;
          if (columnLength > maxLength) maxLength = columnLength;
        });
        column.width = Math.min(maxLength + 2, 40);
      });

      const filename = `Produksi_Sumur_K3S_BAK3S_${bak3sId}_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Berhasil",
        description: "File Excel produksi sumur K3S berhasil diunduh",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Gagal",
        description: err.message || "Gagal mengekspor data ke Excel",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const ba = data?.BABongkar;
  const tankiList = ba?.BABongkarTankis || [];
  const pengisianList = ba?.pengisianTankis || [];
  const konfirmasiList = useMemo(() => {
    const map = new Map();
    pengisianList.forEach((pt) => {
      (pt.konfirmasiPenerimaans || []).forEach((kp) => {
        if (kp?.id && !map.has(kp.id)) map.set(kp.id, kp);
      });
    });
    return Array.from(map.values());
  }, [pengisianList]);

  const perubahanVolume = useMemo(() => {
    const bak3sLiter = toLiter(data?.produksi, "barrel");
    const suratJalanMap = new Map();
    const grossList = [];
    const airList = [];

    pengisianList.forEach((pt) => {
      const satuan = pt.satuanVolume?.satuan || "Barrel";
      const grossLiter = toLiter(pt.gross, satuan);
      const airLiter = toLiter(pt.kandunganAir, satuan);
      grossList.push(grossLiter);
      airList.push(airLiter);

      (pt.konfirmasiPenerimaans || []).forEach((kp) => {
        const sj = kp.suratJalan;
        if (sj?.id && !suratJalanMap.has(sj.id)) {
          suratJalanMap.set(
            sj.id,
            toLiter(sj.volume, sj.satuanVolume?.satuan || "Barrel"),
          );
        }
      });
    });

    const totalSuratJalan = sumLiter(Array.from(suratJalanMap.values()));
    const totalGross = sumLiter(grossList);
    const totalAir = sumLiter(airList);
    const totalNett =
      totalGross === null
        ? null
        : totalGross - (totalAir || 0);

    const stage = (volumeLiter, satuan = "liter") => ({
      volume: satuan === "barrel" ? barrelFromLiter(volumeLiter) : volumeLiter,
      satuan,
      barrel: barrelFromLiter(volumeLiter),
    });

    const suratJalan = stage(totalSuratJalan);
    const gross = stage(totalGross);
    const nett = stage(totalNett);
    const bak3s = {
      volume: data?.produksi ?? null,
      satuan: "barrel",
      barrel: barrelFromLiter(bak3sLiter),
    };

    return [
      {
        key: "surat-jalan",
        tahap: "Surat Jalan",
        keterangan: `${suratJalanMap.size} surat jalan`,
        ...suratJalan,
        selisih: null,
        persen: null,
        selisihCaption: "Tahap awal",
      },
      {
        key: "gross",
        tahap: "Gross",
        keterangan: `${pengisianList.length} pengisian`,
        ...gross,
        selisih: selisihBarrel(gross.barrel, suratJalan.barrel),
        persen: persenPerubahan(gross.barrel, suratJalan.barrel),
        selisihCaption: "terhadap surat jalan",
      },
      {
        key: "nett",
        tahap: "Nett",
        keterangan: "Gross − air",
        ...nett,
        air: totalAir,
        selisih: selisihBarrel(nett.barrel, gross.barrel),
        persen: persenPerubahan(nett.barrel, gross.barrel),
        selisihCaption: "terhadap gross",
      },
      {
        key: "bak3s",
        tahap: "BAK3S",
        keterangan: data?.id ? `Produksi BAK3S #${data.id}` : "Produksi",
        ...bak3s,
        selisih: selisihBarrel(bak3s.barrel, nett.barrel),
        persen: persenPerubahan(bak3s.barrel, nett.barrel),
        selisihCaption: "terhadap nett",
      },
      {
        key: "sj-bak3s",
        tahap: "Surat Jalan ke BAK3S",
        keterangan: "Selisih keseluruhan",
        volume: null,
        satuan: "barrel",
        highlight: true,
        selisih: selisihBarrel(bak3s.barrel, suratJalan.barrel),
        persen: persenPerubahan(bak3s.barrel, suratJalan.barrel),
        selisihCaption: "terhadap surat jalan",
      },
    ];
  }, [data, pengisianList]);

  const tankiLabels =
    tankiList
      .map((item) => item.tanki?.kode)
      .filter(Boolean)
      .join(", ") ||
    pengisianList
      .map((item) => item.tanki?.kode)
      .filter(Boolean)
      .join(", ") ||
    "-";

  const relatedMitraLabel =
    produksiPanel.relatedMitra
      .map((item) => item.nama || `Mitra #${item.id}`)
      .join(", ") || "-";

  const renderDokumen = (dokumen) => {
    if (!dokumen) return "-";
    return (
      <Button
        as="a"
        href={getDocumentUrl(dokumen)}
        target="_blank"
        rel="noreferrer"
        size="xs"
        variant="link"
        colorScheme="orange"
      >
        {getDocumentName(dokumen) || "Unduh dokumen"}
      </Button>
    );
  };

  return (
    <LayoutKPBPN>
      <Box
        bgColor="secondary"
        pb={{ base: 6, md: "40px" }}
        px={{ base: 3, sm: 4, md: 6, lg: "30px" }}
        minH="90vh"
        maxW="100%"
      >
        <Container
          variant="primary"
          maxW="100%"
          p={{ base: 3, sm: 5, md: 6, lg: "30px" }}
          my={{ base: 3, md: "30px" }}
          minW={0}
        >
          <VStack align="stretch" spacing={2} mb={{ base: 4, md: 6 }}>
            <Button
              as={RouterLink}
              to="/tanki-kpbpn/ba-bongkar"
              variant="ghost"
              size="sm"
              alignSelf="flex-start"
              px={2}
              ml={-2}
            >
              ← Kembali ke BA Bongkar
            </Button>
            <Box minW={0}>
              <Heading
                color="kpbpn"
                size={{ base: "md", md: "lg" }}
                wordBreak="break-word"
              >
                Detail BAK3S
              </Heading>
              {data && (
                <HStack mt={2} spacing={2} flexWrap="wrap">
                  <Text color="gray.600" fontWeight="medium" fontSize="sm">
                    BAK3S #{data.id}
                  </Text>
                  <Badge colorScheme="green">
                    BA Bongkar #{data.BABongkarId}
                  </Badge>
                </HStack>
              )}
            </Box>
          </VStack>

          {isLoading ? (
            <Center py={10}>
              <Spinner size="lg" color="kpbpn" />
            </Center>
          ) : !data ? (
            <EmptyText>Data BAK3S tidak ditemukan.</EmptyText>
          ) : (
            <Stack spacing={{ base: 4, md: 5 }}>
              <SectionCard title="Data BAK3S">
                <Box overflowX="auto" maxW="100%">
                  <Table size="sm" variant="simple" minW="720px" bg="white">
                    <Thead bg="white">
                      <Tr>
                        <Th textTransform="capitalize">API</Th>
                        <Th textTransform="capitalize">BSNW</Th>
                        <Th textTransform="capitalize">Produksi</Th>
                        <Th textTransform="capitalize">SG</Th>
                        <Th textTransform="capitalize">Dibuat oleh</Th>
                        <Th textTransform="capitalize">Dokumen</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      <Tr>
                        <Td>{formatAngka(data.api)}</Td>
                        <Td>{formatAngka(data.BSNW)}</Td>
                        <Td>
                          <VolumeSummary
                            volume={data.produksi}
                            satuan="barrel"
                            compact={false}
                          />
                        </Td>
                        <Td>{formatAngka(data.sg)}</Td>
                        <Td>{data.userKPBPN?.nama || "-"}</Td>
                        <Td>{renderDokumen(data.dokumen)}</Td>
                      </Tr>
                    </Tbody>
                  </Table>
                </Box>
              </SectionCard>

              <SectionCard title="BA Bongkar">
                <Box overflowX="auto" maxW="100%">
                  <Table size="sm" variant="simple" minW="720px" bg="white">
                    <Thead bg="white">
                      <Tr>
                        <Th textTransform="capitalize">ID BA</Th>
                        <Th textTransform="capitalize">Tanggal</Th>
                        <Th textTransform="capitalize">Tangki</Th>
                        <Th textTransform="capitalize">Mitra terkait</Th>
                        <Th textTransform="capitalize">Jumlah pengisian</Th>
                        <Th textTransform="capitalize">Dibuat oleh</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      <Tr>
                        <Td whiteSpace="nowrap">
                          {ba?.id ? `BA #${ba.id}` : "-"}
                        </Td>
                        <Td whiteSpace="nowrap">
                          {formatTanggal(ba?.tanggal)}
                        </Td>
                        <Td>{tankiLabels}</Td>
                        <Td>{relatedMitraLabel}</Td>
                        <Td>{pengisianList.length}</Td>
                        <Td>{ba?.userKPBPN?.nama || "-"}</Td>
                      </Tr>
                    </Tbody>
                  </Table>
                </Box>
              </SectionCard>

              <SectionCard title="Perubahan Volume Minyak">
                <Text fontSize="sm" color="gray.600" mb={3}>
                  Urutan volume dimulai dari total surat jalan, total gross,
                  total nett (gross dikurangi air), sampai volume BAK3S.
                  Perubahan menampilkan selisih volume dan persentasenya.
                  Baris terakhir membandingkan surat jalan langsung dengan
                  BAK3S.
                </Text>
                <Box overflowX="auto" maxW="100%">
                  <Table size="sm" variant="simple" minW="640px" bg="white">
                    <Thead bg="white">
                      <Tr>
                        <Th textTransform="capitalize">No.</Th>
                        <Th textTransform="capitalize">Tahap</Th>
                        <Th textTransform="capitalize">Keterangan</Th>
                        <Th textTransform="capitalize">Volume</Th>
                        <Th textTransform="capitalize">Perubahan</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {perubahanVolume.map((row, index) => (
                        <Tr key={row.key} bg={row.highlight ? "orange.50" : undefined}>
                          <Td>{index + 1}</Td>
                          <Td fontWeight="semibold" whiteSpace="nowrap">
                            {row.tahap}
                          </Td>
                          <Td>{row.keterangan}</Td>
                          <Td>
                            {row.volume === null && row.air === undefined ? (
                              "-"
                            ) : (
                              <Stack spacing={2}>
                                <VolumeBlock
                                  volume={row.volume}
                                  satuan={row.satuan}
                                />
                                {row.air !== undefined ? (
                                  <VolumeBlock
                                    label="Air"
                                    volume={row.air}
                                    satuan="liter"
                                  />
                                ) : null}
                              </Stack>
                            )}
                          </Td>
                          <Td>
                            {row.selisih === null ? (
                              <Text fontSize="sm" color="gray.500">
                                {row.selisihCaption}
                              </Text>
                            ) : (
                              <SelisihVolume
                                value={row.selisih}
                                percent={row.persen}
                                caption={row.selisihCaption}
                              />
                            )}
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              </SectionCard>

              <SectionCard title="Surat Jalan & Konfirmasi Penerimaan">
                {konfirmasiList.length === 0 ? (
                  <EmptyText>
                    Belum ada surat jalan atau konfirmasi penerimaan yang
                    terhubung dengan BAK3S ini.
                  </EmptyText>
                ) : (
                  <Box overflowX="auto" maxW="100%">
                    <Table size="sm" variant="simple" minW="1280px" bg="white">
                      <Thead bg="white">
                        <Tr>
                          <Th textTransform="capitalize">No.</Th>
                          <Th textTransform="capitalize">Surat Jalan</Th>
                          <Th textTransform="capitalize">Status</Th>
                          <Th textTransform="capitalize">Tanggal SJ</Th>
                          <Th textTransform="capitalize">Mitra</Th>
                          <Th textTransform="capitalize">Volume SJ</Th>
                          <Th textTransform="capitalize">Plat</Th>
                          <Th textTransform="capitalize">Supir</Th>
                          <Th textTransform="capitalize">Konfirmasi</Th>
                          <Th textTransform="capitalize">Tanggal</Th>
                          <Th textTransform="capitalize">Jam</Th>
                          <Th textTransform="capitalize">Volume Diterima</Th>
                          <Th textTransform="capitalize">Petugas PK</Th>
                          <Th textTransform="capitalize">Petugas Lab</Th>
                          <Th textTransform="capitalize">API</Th>
                          <Th textTransform="capitalize">BSNW</Th>
                          <Th textTransform="capitalize">Catatan</Th>
                          <Th textTransform="capitalize">Foto</Th>
                          <Th textTransform="capitalize">Foto Lab</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {konfirmasiList.map((kp, index) => {
                          const sj = kp.suratJalan;
                          const satuan =
                            sj?.satuanVolume?.satuan || "Barrel";
                          return (
                            <Tr key={kp.id}>
                              <Td>{index + 1}</Td>
                              <Td whiteSpace="nowrap">
                                {sj?.id ? (
                                  <Button
                                    as={RouterLink}
                                    to={`/pengiriman-kpbpn/detail-surat-jalan/${sj.id}`}
                                    size="xs"
                                    variant="link"
                                    colorScheme="orange"
                                    fontWeight="semibold"
                                  >
                                    {sj.nomor || `Surat Jalan #${sj.id}`}
                                  </Button>
                                ) : (
                                  "-"
                                )}
                              </Td>
                              <Td>
                                <Badge
                                  colorScheme={statusColor(
                                    sj?.statusSuratJalan?.status,
                                  )}
                                  variant="subtle"
                                >
                                  {sj?.statusSuratJalan?.status || "-"}
                                </Badge>
                              </Td>
                              <Td whiteSpace="nowrap">
                                {formatTanggal(sj?.tanggal)}
                              </Td>
                              <Td>{sj?.mitra?.nama || "-"}</Td>
                              <Td>
                                <VolumeMultiSatuan
                                  volume={sj?.volume}
                                  satuan={satuan}
                                />
                              </Td>
                              <Td whiteSpace="nowrap">
                                {sj?.transportir?.plat || "-"}
                              </Td>
                              <Td>{sj?.supir?.nama || "-"}</Td>
                              <Td whiteSpace="nowrap">
                                {kp.nomor || `Konfirmasi #${kp.id}`}
                              </Td>
                              <Td whiteSpace="nowrap">
                                {formatTanggal(kp.tanggal)}
                              </Td>
                              <Td>{formatJam(kp.jamKedatangan)}</Td>
                              <Td>
                                <VolumeMultiSatuan
                                  volume={kp.volume}
                                  satuan={satuan}
                                />
                              </Td>
                              <Td>{kp.userPK?.nama || "-"}</Td>
                              <Td>{kp.userLab?.nama || "-"}</Td>
                              <Td>{formatAngka(kp.api)}</Td>
                              <Td>{formatAngka(kp.BSNW)}</Td>
                              <Td maxW="180px" whiteSpace="normal">
                                {kp.catatan || "-"}
                              </Td>
                              <Td>
                                {kp.foto ? (
                                  <Image
                                    as="a"
                                    href={getImageUrl(kp.foto)}
                                    target="_blank"
                                    rel="noreferrer"
                                    src={getImageUrl(kp.foto)}
                                    alt={`Foto konfirmasi ${kp.nomor || kp.id}`}
                                    boxSize="48px"
                                    objectFit="cover"
                                    borderRadius="md"
                                    border="1px solid"
                                    borderColor="gray.200"
                                  />
                                ) : (
                                  "-"
                                )}
                              </Td>
                              <Td>
                                {kp.fotoLab ? (
                                  <Image
                                    as="a"
                                    href={getImageUrl(kp.fotoLab)}
                                    target="_blank"
                                    rel="noreferrer"
                                    src={getImageUrl(kp.fotoLab)}
                                    alt={`Foto lab ${kp.nomor || kp.id}`}
                                    boxSize="48px"
                                    objectFit="cover"
                                    borderRadius="md"
                                    border="1px solid"
                                    borderColor="gray.200"
                                  />
                                ) : (
                                  "-"
                                )}
                              </Td>
                            </Tr>
                          );
                        })}
                      </Tbody>
                    </Table>
                  </Box>
                )}
              </SectionCard>

              <SectionCard title="Pengisian Tanki">
                {pengisianList.length === 0 ? (
                  <EmptyText>
                    Belum ada data pengisian tanki yang terhubung dengan BAK3S
                    ini.
                  </EmptyText>
                ) : (
                  <Box overflowX="auto" maxW="100%">
                    <Table size="sm" variant="simple" minW="1280px" bg="white">
                      <Thead bg="white">
                        <Tr>
                          <Th textTransform="capitalize">No.</Th>
                          <Th textTransform="capitalize">Tanki</Th>
                          <Th textTransform="capitalize">Konfirmasi</Th>
                          <Th textTransform="capitalize">Nomor Surat</Th>
                          <Th textTransform="capitalize">Tanggal</Th>
                          <Th textTransform="capitalize">Kapasitas Tanki</Th>
                          <Th textTransform="capitalize">Gross</Th>
                          <Th textTransform="capitalize">Net</Th>
                          <Th textTransform="capitalize">Flow Meter</Th>
                          <Th textTransform="capitalize">Penampilan Visual</Th>
                          <Th textTransform="capitalize">Warna</Th>
                          <Th textTransform="capitalize">Kandungan Air</Th>
                          <Th textTransform="capitalize">BSW</Th>
                          <Th textTransform="capitalize">Saksi</Th>
                          <Th textTransform="capitalize">Catatan</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {pengisianList.map((pt, index) => {
                          const satuanPt = pt.satuanVolume?.satuan || "Barrel";
                          const konfirmasiLabels = (
                            pt.konfirmasiPenerimaans || []
                          )
                            .map((kp) => kp.nomor || `#${kp.id}`)
                            .filter(Boolean);
                          return (
                            <Tr key={pt.id}>
                              <Td>{index + 1}</Td>
                              <Td whiteSpace="nowrap">
                                {pt.tanki?.kode || `#${pt.id}`}
                              </Td>
                              <Td>
                                {konfirmasiLabels.length > 0 ? (
                                  <HStack spacing={1} flexWrap="wrap">
                                    {konfirmasiLabels.map((label) => (
                                      <Badge
                                        key={label}
                                        colorScheme="blue"
                                        variant="subtle"
                                      >
                                        {label}
                                      </Badge>
                                    ))}
                                  </HStack>
                                ) : (
                                  "-"
                                )}
                              </Td>
                              <Td whiteSpace="nowrap">
                                {pt.nomorSurat || "-"}
                              </Td>
                              <Td whiteSpace="nowrap">
                                {formatTanggal(pt.tanggal)}
                              </Td>
                              <Td whiteSpace="nowrap">
                                {pt.tanki?.kapasitas != null
                                  ? `${pt.tanki.kapasitas} ${
                                      pt.tanki.satuanVolume?.satuan || ""
                                    }`.trim()
                                  : "-"}
                              </Td>
                              <Td>
                                <VolumeMultiSatuan
                                  volume={pt.gross}
                                  satuan={satuanPt}
                                />
                              </Td>
                              <Td>
                                <VolumeMultiSatuan
                                  volume={pt.net}
                                  satuan={satuanPt}
                                />
                              </Td>
                              <Td>{formatAngka(pt.flowMeter)}</Td>
                              <Td>{pt.penampilanVisual || "-"}</Td>
                              <Td>{pt.warna || "-"}</Td>
                              <Td>{formatAngka(pt.kandunganAir)}</Td>
                              <Td>{formatAngka(pt.BSW)}</Td>
                              <Td>{pt.saksi || "-"}</Td>
                              <Td maxW="180px" whiteSpace="normal">
                                {pt.catatan || "-"}
                              </Td>
                            </Tr>
                          );
                        })}
                      </Tbody>
                    </Table>
                  </Box>
                )}
              </SectionCard>

              <SectionCard
                title="Input Produksi Sumur"
                overflow="visible"
                minW={0}
                action={
                  produksiPanel.sumurList.length > 0 ? (
                    <Button
                      leftIcon={<BsFileEarmarkExcel />}
                      variant="outline"
                      colorScheme="green"
                      size="sm"
                      onClick={exportProduksiExcel}
                      isLoading={isExporting}
                      loadingText="Mengekspor..."
                      isDisabled={produksiPanel.loading}
                      w={{ base: "full", sm: "auto" }}
                    >
                      Export Excel
                    </Button>
                  ) : null
                }
              >
                {produksiPanel.loading ? (
                  <Stack spacing={3}>
                    <Skeleton height="20px" />
                    <Skeleton height="36px" />
                    <Skeleton height="36px" />
                  </Stack>
                ) : produksiPanel.sumurList.length === 0 ? (
                  <EmptyText>
                    Tidak ada sumur minyak terkait. Pastikan BA Bongkar terhubung
                    dengan pengisian tanki dan surat jalan mitra.
                  </EmptyText>
                ) : (
                  <>
                    <ProduksiStickyBar
                      totalProduksiInput={totalProduksiInput}
                      produksiSatuanLabel={produksiSatuanLabel}
                      acuanVolume={data.produksi}
                      acuanSatuan="barrel"
                      acuanLabel="Produksi BAK3S"
                      comparison={produksiComparison}
                      satuanVolumeId={produksiPanel.satuanVolumeId}
                      satuanVolumeOptions={produksiPanel.satuanVolumeOptions}
                      onSatuanChange={handleSatuanChange}
                      isEditing={isEditing}
                      saving={produksiPanel.saving}
                      canSave={
                        isEditing &&
                        !isProduksiOverLimit &&
                        Boolean(produksiPanel.satuanVolumeId) &&
                        !produksiPanel.loading
                      }
                      onEdit={startEditProduksi}
                      onCancel={cancelEditProduksi}
                      onSave={saveProduksiSumur}
                      onAutoFill={autoFillProduksiSumur}
                      showAutoFillButton={isEditing}
                    />

                    {produksiPanel.usedSumberDefault && (
                      <Text fontSize="sm" color="gray.600" mb={3}>
                        Nilai awal diisi dari produksi sumur surat jalan dengan
                        satuan aslinya. Mengubah satuan akan mengonversi nilai
                        produksi. Data yang sudah tersimpan di BAK3S tetap
                        diutamakan.
                      </Text>
                    )}

                    <ProduksiSumurList
                      sumurList={produksiPanel.sumurList}
                      inputs={produksiPanel.inputs}
                      isEditing={isEditing}
                      produksiSatuanLabel={produksiSatuanLabel}
                      showMitraColumn={showMitraColumn}
                      onInputChange={handleProduksiInputChange}
                      showSumberColumn
                      sumberInputs={produksiPanel.defaultProduksi}
                      sumberReferensi={produksiPanel.sumberReferensi}
                    />
                  </>
                )}
              </SectionCard>
            </Stack>
          )}
        </Container>
      </Box>
    </LayoutKPBPN>
  );
}

export default DetailBAK3S;
