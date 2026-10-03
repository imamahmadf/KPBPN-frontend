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
  SimpleGrid,
  Skeleton,
  Spinner,
  Stack,
  Text,
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
  convertProduksiInputsBySatuan,
  convertVolumeBetweenSatuan,
  distributeRandomVolume,
  formatVolumeNumber,
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

const InfoField = ({ label, children }) => (
  <Box minW={0}>
    <Text
      fontSize="xs"
      color="gray.500"
      fontWeight="semibold"
      textTransform="uppercase"
      letterSpacing="wide"
      mb={0.5}
    >
      {label}
    </Text>
    <Box fontSize="sm" color="gray.700" wordBreak="break-word">
      {children}
    </Box>
  </Box>
);

const excelNumber = (value) => {
  if (value === null || value === undefined || value === "") return "";
  const angka = Number(value);
  return Number.isNaN(angka) ? String(value) : angka;
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

const FotoThumb = ({ src, alt }) => {
  if (!src) return <EmptyText>Tidak ada foto</EmptyText>;
  return (
    <Image
      src={getImageUrl(src)}
      alt={alt}
      w="100%"
      maxW="100%"
      maxH={{ base: "160px", md: "180px" }}
      borderRadius="md"
      objectFit="cover"
      border="1px solid"
      borderColor="gray.200"
    />
  );
};

const NestedCard = ({ children }) => (
  <Box
    p={{ base: 3, md: 4 }}
    borderWidth="1px"
    borderRadius="md"
    bg="white"
    overflow="hidden"
  >
    {children}
  </Box>
);

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
      inputs: distributeRandomVolume(
        targetVolume,
        sumurList,
        (sumur) => defaultProduksi[sumur.id],
        0.1,
      ),
    }));

    toast({
      title: "Isi otomatis",
      description:
        "Produksi diisi acak berdasar produksi sumur surat jalan (boleh desimal, contoh 4.5 atau 5.9), total tidak melebihi produksi BAK3S.",
      status: "success",
      duration: 3000,
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
        ]);
        dataRow.eachCell((cell) => {
          cell.style = dataStyle;
        });
        [3, 4].forEach((col) => {
          if (typeof dataRow.getCell(col).value === "number") {
            dataRow.getCell(col).numFmt = "0.00000000";
          }
        });
        [6, 7].forEach((col) => {
          if (typeof dataRow.getCell(col).value === "number") {
            dataRow.getCell(col).numFmt = "#,##0.000";
          }
        });
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
  const suratJalanList = useMemo(() => {
    const map = new Map();
    konfirmasiList.forEach((kp) => {
      const sj = kp.suratJalan;
      if (sj?.id && !map.has(sj.id)) {
        map.set(sj.id, {
          ...sj,
          konfirmasiNomor: kp.nomor,
          konfirmasiId: kp.id,
        });
      }
    });
    return Array.from(map.values());
  }, [konfirmasiList]);
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
              <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={{ base: 4, md: 5 }}>
                <SectionCard title="Data BAK3S">
                  <SimpleGrid columns={2} spacing={{ base: 3, md: 4 }}>
                    <InfoField label="API">{formatAngka(data.api)}</InfoField>
                    <InfoField label="BSNW">{formatAngka(data.BSNW)}</InfoField>
                    <InfoField label="Produksi">
                      <VolumeSummary
                        volume={data.produksi}
                        satuan="barrel"
                        compact={false}
                      />
                    </InfoField>
                    <InfoField label="SG">{formatAngka(data.sg)}</InfoField>
                    <InfoField label="Dibuat oleh">
                      {data.userKPBPN?.nama || "-"}
                    </InfoField>
                    <InfoField label="Dokumen">
                      {renderDokumen(data.dokumen)}
                    </InfoField>
                  </SimpleGrid>
                </SectionCard>

                <SectionCard title="BA Bongkar">
                  <SimpleGrid columns={2} spacing={{ base: 3, md: 4 }}>
                    <InfoField label="ID BA">
                      {ba?.id ? `BA #${ba.id}` : "-"}
                    </InfoField>
                    <InfoField label="Tanggal">
                      {formatTanggal(ba?.tanggal)}
                    </InfoField>
                    <InfoField label="Tangki">{tankiLabels}</InfoField>
                    <InfoField label="Mitra terkait">
                      {relatedMitraLabel}
                    </InfoField>
                    <InfoField label="Jumlah pengisian">
                      {pengisianList.length}
                    </InfoField>
                    <InfoField label="Dibuat oleh">
                      {ba?.userKPBPN?.nama || "-"}
                    </InfoField>
                  </SimpleGrid>
                </SectionCard>
              </SimpleGrid>

              <SectionCard title="Surat Jalan">
                {suratJalanList.length === 0 ? (
                  <EmptyText>
                    Belum ada surat jalan yang terhubung dengan BAK3S ini.
                  </EmptyText>
                ) : (
                  <Stack spacing={4}>
                    {suratJalanList.map((sj) => {
                      const satuanSj = sj.satuanVolume?.satuan || "Barrel";
                      return (
                        <NestedCard key={sj.id}>
                          <Flex
                            justify="space-between"
                            align={{ base: "flex-start", sm: "center" }}
                            mb={3}
                            gap={2}
                            direction={{ base: "column", sm: "row" }}
                          >
                            <Heading size="xs" color="gray.700">
                              {sj.nomor || `Surat Jalan #${sj.id}`}
                            </Heading>
                            <HStack spacing={2} flexWrap="wrap">
                              <Badge
                                colorScheme={statusColor(
                                  sj.statusSuratJalan?.status,
                                )}
                                variant="subtle"
                              >
                                {sj.statusSuratJalan?.status || "-"}
                              </Badge>
                              <Button
                                as={RouterLink}
                                to={`/pengiriman-kpbpn/detail-surat-jalan/${sj.id}`}
                                size="xs"
                                variant="link"
                                colorScheme="orange"
                              >
                                Lihat detail
                              </Button>
                            </HStack>
                          </Flex>
                          <SimpleGrid
                            columns={{ base: 1, sm: 2, lg: 3 }}
                            spacing={{ base: 3, md: 4 }}
                          >
                            <InfoField label="Tanggal">
                              {formatTanggal(sj.tanggal)}
                            </InfoField>
                            <InfoField label="Mitra">
                              {sj.mitra?.nama || "-"}
                            </InfoField>
                            <InfoField label="Volume">
                              <VolumeMultiSatuan
                                volume={sj.volume}
                                satuan={satuanSj}
                              />
                            </InfoField>
                            <InfoField label="Plat">
                              {sj.transportir?.plat || "-"}
                            </InfoField>
                            <InfoField label="Supir">
                              {sj.supir?.nama || "-"}
                            </InfoField>
                            <InfoField label="Konfirmasi">
                              {sj.konfirmasiNomor ||
                                (sj.konfirmasiId
                                  ? `#${sj.konfirmasiId}`
                                  : "-")}
                            </InfoField>
                          </SimpleGrid>
                        </NestedCard>
                      );
                    })}
                  </Stack>
                )}
              </SectionCard>

              <SectionCard title="Konfirmasi Penerimaan">
                {konfirmasiList.length === 0 ? (
                  <EmptyText>
                    Belum ada konfirmasi penerimaan yang terhubung dengan BAK3S
                    ini.
                  </EmptyText>
                ) : (
                  <Stack spacing={4}>
                    {konfirmasiList.map((kp) => {
                      const satuanKp =
                        kp.suratJalan?.satuanVolume?.satuan || "Barrel";
                      return (
                        <NestedCard key={kp.id}>
                          <Flex
                            justify="space-between"
                            align={{ base: "flex-start", sm: "center" }}
                            mb={3}
                            gap={2}
                            direction={{ base: "column", sm: "row" }}
                          >
                            <Heading size="xs" color="gray.700">
                              {kp.nomor || `Konfirmasi #${kp.id}`}
                            </Heading>
                            {kp.suratJalan?.nomor && (
                              <Badge colorScheme="blue" variant="subtle">
                                {kp.suratJalan.nomor}
                              </Badge>
                            )}
                          </Flex>
                          <SimpleGrid
                            columns={{ base: 1, sm: 2, lg: 3 }}
                            spacing={{ base: 3, md: 4 }}
                          >
                            <InfoField label="Tanggal">
                              {formatTanggal(kp.tanggal)}
                            </InfoField>
                            <InfoField label="Jam Kedatangan">
                              {formatJam(kp.jamKedatangan)}
                            </InfoField>
                            <InfoField label="Volume Diterima">
                              <VolumeMultiSatuan
                                volume={kp.volume}
                                satuan={satuanKp}
                              />
                            </InfoField>
                            <InfoField label="Petugas Penerima (PK)">
                              {kp.userPK?.nama || "-"}
                            </InfoField>
                            <InfoField label="Petugas Lab">
                              {kp.userLab?.nama || "-"}
                            </InfoField>
                            <InfoField label="API">
                              {formatAngka(kp.api)}
                            </InfoField>
                            <InfoField label="BSNW">
                              {formatAngka(kp.BSNW)}
                            </InfoField>
                            <Box gridColumn={{ lg: "span 2" }}>
                              <InfoField label="Catatan">
                                {kp.catatan || "-"}
                              </InfoField>
                            </Box>
                            <Box>
                              <InfoField label="Foto Bukti Penerimaan">
                                <FotoThumb
                                  src={kp.foto}
                                  alt={`Foto konfirmasi ${kp.nomor || kp.id}`}
                                />
                              </InfoField>
                            </Box>
                            <Box>
                              <InfoField label="Foto Lab">
                                <FotoThumb
                                  src={kp.fotoLab}
                                  alt={`Foto lab ${kp.nomor || kp.id}`}
                                />
                              </InfoField>
                            </Box>
                          </SimpleGrid>
                        </NestedCard>
                      );
                    })}
                  </Stack>
                )}
              </SectionCard>

              <SectionCard title="Pengisian Tanki">
                {pengisianList.length === 0 ? (
                  <EmptyText>
                    Belum ada data pengisian tanki yang terhubung dengan BAK3S
                    ini.
                  </EmptyText>
                ) : (
                  <Stack spacing={4}>
                    {pengisianList.map((pt) => {
                      const satuanPt = pt.satuanVolume?.satuan || "Barrel";
                      const konfirmasiLabels = (pt.konfirmasiPenerimaans || [])
                        .map((kp) => kp.nomor || `#${kp.id}`)
                        .filter(Boolean);
                      return (
                        <NestedCard key={pt.id}>
                          <Flex
                            justify="space-between"
                            align={{ base: "flex-start", sm: "center" }}
                            mb={3}
                            gap={2}
                            direction={{ base: "column", sm: "row" }}
                          >
                            <Heading size="xs" color="gray.700">
                              Tanki {pt.tanki?.kode || `#${pt.id}`}
                            </Heading>
                            {konfirmasiLabels.length > 0 && (
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
                            )}
                          </Flex>
                          <SimpleGrid
                            columns={{ base: 1, sm: 2, lg: 3 }}
                            spacing={{ base: 3, md: 4 }}
                          >
                            <InfoField label="Nomor Surat">
                              {pt.nomorSurat || "-"}
                            </InfoField>
                            <InfoField label="Tanggal">
                              {formatTanggal(pt.tanggal)}
                            </InfoField>
                            <InfoField label="Kapasitas Tanki">
                              {pt.tanki?.kapasitas != null
                                ? `${pt.tanki.kapasitas} ${
                                    pt.tanki.satuanVolume?.satuan || ""
                                  }`.trim()
                                : "-"}
                            </InfoField>
                            <InfoField label="Gross">
                              <VolumeMultiSatuan
                                volume={pt.gross}
                                satuan={satuanPt}
                              />
                            </InfoField>
                            <InfoField label="Net">
                              <VolumeMultiSatuan
                                volume={pt.net}
                                satuan={satuanPt}
                              />
                            </InfoField>
                            <InfoField label="Flow Meter">
                              {formatAngka(pt.flowMeter)}
                            </InfoField>
                            <InfoField label="Penampilan Visual">
                              {pt.penampilanVisual || "-"}
                            </InfoField>
                            <InfoField label="Warna">
                              {pt.warna || "-"}
                            </InfoField>
                            <InfoField label="Kandungan Air">
                              {formatAngka(pt.kandunganAir)}
                            </InfoField>
                            <InfoField label="BSW">
                              {formatAngka(pt.BSW)}
                            </InfoField>
                            <InfoField label="Saksi">
                              {pt.saksi || "-"}
                            </InfoField>
                            <InfoField label="Catatan">
                              {pt.catatan || "-"}
                            </InfoField>
                          </SimpleGrid>
                        </NestedCard>
                      );
                    })}
                  </Stack>
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
