import React, { useState, useEffect } from "react";
import axios from "axios";
import ReactPaginate from "react-paginate";
import ExcelJS from "exceljs";
import "../../Style/pagination.css";
import {
  Box,
  Button,
  Container,
  Thead,
  Table,
  Tr,
  Th,
  Td,
  Tbody,
  Heading,
  HStack,
  Badge,
  Text,
  Spinner,
  Center,
  useToast,
  VStack,
  Collapse,
  IconButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  SimpleGrid,
  Divider,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  FormHelperText,
} from "@chakra-ui/react";
import {
  BsChevronDown,
  BsChevronUp,
  BsX,
  BsFileEarmarkExcel,
  BsTrash,
  BsPencil,
  BsDownload,
} from "react-icons/bs";
import LayoutKPBPN from "../../Componets/KPBPN/LayoutKPBPN";
import { formatVolumeNumber } from "../../lib/volumeSatuan";

const API_BASE = import.meta.env.VITE_REACT_APP_API_BASE_URL;

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toISOString
    ? new Date(date).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";
};

const formatAngka = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  const angka = Number(value);
  if (Number.isNaN(angka)) return String(value);
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 3,
    minimumFractionDigits: 0,
  }).format(angka);
};

const formatVolumeLabel = (volume, satuan) => {
  if (volume === null || volume === undefined || volume === "") return "-";
  return satuan ? `${volume} ${satuan}` : String(volume);
};

const parseUkuranBA = (ukuranCairan, ukuranAir) => {
  const parsedUkuranCairan =
    ukuranCairan !== null && ukuranCairan !== undefined && ukuranCairan !== ""
      ? Number(ukuranCairan)
      : null;
  const parsedUkuranAir =
    ukuranAir !== null && ukuranAir !== undefined && ukuranAir !== ""
      ? Number(ukuranAir)
      : null;
  const uMin =
    parsedUkuranCairan !== null &&
    parsedUkuranAir !== null &&
    !Number.isNaN(parsedUkuranCairan) &&
    !Number.isNaN(parsedUkuranAir)
      ? parsedUkuranCairan - parsedUkuranAir
      : null;

  return { uMin };
};

const calcVolumeBarrel = (ukuranCairan, ukuranAir, factorTank) => {
  const { uMin } = parseUkuranBA(ukuranCairan, ukuranAir);
  const factor = Number(factorTank);
  if (uMin === null || Number.isNaN(factor) || factor <= 0) return null;
  return Math.round((uMin * factor + Number.EPSILON) * 1000) / 1000;
};

const formatVolumeBarrelLabel = (volume) => {
  if (volume === null || volume === undefined) return "-";
  return `${formatVolumeNumber(volume)} barrel`;
};

const getPengisianList = (ba) => ba.pengisianTankis || [];

const getUkuranForTanki = (ba, tangkiId) => {
  const details = ba.BABongkarTankis || [];
  const match = details.find((detail) => detail.tangkiId === tangkiId);
  return {
    ukuranCairan: match?.ukuranCairan ?? ba.ukuranCairan,
    ukuranAir: match?.ukuranAir ?? ba.ukuranAir,
  };
};

const formatUkuranColumn = (ba, field) => {
  const details = ba.BABongkarTankis || [];
  if (!details.length) return ba[field] ?? "-";
  if (details.length === 1) {
    return details[0][field] ?? ba[field] ?? "-";
  }
  return details
    .map((detail) => {
      const kode = detail.tanki?.kode || `Tanki #${detail.tangkiId}`;
      return `${kode}: ${detail[field] ?? "-"}`;
    })
    .join(", ");
};

const getVolumeLabelsForBA = (ba) => {
  const pengisianList = getPengisianList(ba);
  const tankVolumes = new Map();

  for (const item of pengisianList) {
    const tangkiId = item.tanki?.id ?? item.tangkiId;
    if (!tangkiId || tankVolumes.has(tangkiId)) continue;

    const ukuran = getUkuranForTanki(ba, tangkiId);
    const volume = calcVolumeBarrel(
      ukuran.ukuranCairan,
      ukuran.ukuranAir,
      item.tanki?.factorTank,
    );
    if (volume !== null) {
      tankVolumes.set(tangkiId, volume);
    }
  }

  const volumes = [...tankVolumes.values()];
  if (!volumes.length) return "-";
  return volumes.map((volume) => formatVolumeBarrelLabel(volume)).join(", ");
};

const getUniqueTankiKodes = (ba) => {
  const kodes = getPengisianList(ba)
    .map((item) => item.tanki?.kode)
    .filter(Boolean);
  return [...new Set(kodes)].join(", ") || "-";
};

const formatFactorTank = (factorTank) => {
  if (factorTank === null || factorTank === undefined || factorTank === "") {
    return "-";
  }
  const num = Number(factorTank);
  if (Number.isNaN(num)) return "-";
  return formatVolumeNumber(num);
};

const getUniqueFactorTankLabels = (ba) => {
  const factors = getPengisianList(ba)
    .map((item) => item.tanki?.factorTank)
    .filter((value) => value !== null && value !== undefined && value !== "");
  const formatted = [
    ...new Set(factors.map((factor) => formatFactorTank(factor))),
  ].filter((value) => value !== "-");
  return formatted.length ? formatted.join(", ") : "-";
};

const getKonfirmasiLabel = (item) => {
  const list = item.konfirmasiPenerimaans || [];
  if (!list.length) return "-";
  return list
    .map(
      (kp) =>
        kp.nomor ||
        kp.suratJalan?.transportir?.plat ||
        `ID ${kp.id}`,
    )
    .join(", ");
};

const getDocumentUrl = (filePath) => (filePath ? `${API_BASE}${filePath}` : null);

const getDocumentName = (filePath) => {
  if (!filePath) return "";
  return String(filePath).split("/").pop();
};

const emptyBak3sForm = () => ({
  api: "",
  BSNW: "",
  produksi: "",
  sg: "",
  file: null,
});

const BABongkar = () => {
  const toast = useToast();
  const [dataBA, setDataBA] = useState([]);
  const [dataTanki, setDataTanki] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [loadingCetakBA, setLoadingCetakBA] = useState({});
  const [expandedIds, setExpandedIds] = useState([]);
  const [page, setPage] = useState(0);
  const [limit] = useState(50);
  const [pages, setPages] = useState(0);
  const [rows, setRows] = useState(0);
  const [tanggalAwal, setTanggalAwal] = useState("");
  const [tanggalAkhir, setTanggalAkhir] = useState("");
  const [tangkiFilterId, setTangkiFilterId] = useState("");
  const [baIdFilter, setBaIdFilter] = useState("");
  const [bak3sTarget, setBak3sTarget] = useState(null);
  const [bak3sForm, setBak3sForm] = useState(emptyBak3sForm());
  const [isSubmittingBak3s, setIsSubmittingBak3s] = useState(false);
  const [deleteBak3sTarget, setDeleteBak3sTarget] = useState(null);
  const [isDeletingBak3s, setIsDeletingBak3s] = useState(false);

  const {
    isOpen: isBak3sOpen,
    onOpen: onBak3sOpen,
    onClose: onBak3sClose,
  } = useDisclosure();
  const {
    isOpen: isDeleteBak3sOpen,
    onOpen: onDeleteBak3sOpen,
    onClose: onDeleteBak3sClose,
  } = useDisclosure();

  const buildFilterParams = (extra = {}) => ({
    page,
    limit,
    startDate: tanggalAwal || undefined,
    endDate: tanggalAkhir || undefined,
    tangkiId: tangkiFilterId || undefined,
    baId: baIdFilter || undefined,
    ...extra,
  });

  const hasActiveFilter =
    Boolean(tanggalAwal) ||
    Boolean(tanggalAkhir) ||
    Boolean(tangkiFilterId) ||
    Boolean(baIdFilter);

  const resetFilter = () => {
    setTanggalAwal("");
    setTanggalAkhir("");
    setTangkiFilterId("");
    setBaIdFilter("");
  };

  const changePage = ({ selected }) => {
    setPage(selected);
    setExpandedIds([]);
  };

  const fetchDataTanki = async () => {
    try {
      const res = await axios.get(`${API_BASE}/tanki/get/tanki`);
      setDataTanki(res.data.result || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDataBA = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/tanki/get/ba-bongkar`, {
        params: buildFilterParams(),
      });
      setDataBA(res.data.result || []);
      setPage(res.data.page ?? 0);
      setPages(res.data.totalPage || 0);
      setRows(res.data.totalRows || 0);
    } catch (err) {
      console.error(err);
      setDataBA([]);
      setPage(0);
      setPages(0);
      setRows(0);
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

  const fetchAllBAForExport = async () => {
    const res = await axios.get(`${API_BASE}/tanki/get/ba-bongkar`, {
      params: buildFilterParams({ page: 0, limit: 10000 }),
    });
    return res.data.result || [];
  };

  const downloadExcel = async () => {
    setIsExporting(true);
    try {
      const exportData = await fetchAllBAForExport();

      if (!exportData.length) {
        toast({
          title: "Tidak ada data",
          description: "Tidak ada data BA Bongkar untuk diekspor",
          status: "info",
          duration: 4000,
          isClosable: true,
        });
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("BA Bongkar");

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

      const headers = [
        "No",
        "ID BA",
        "Tanggal BA",
        "Ukuran Cairan (cm)",
        "Ukuran Air (cm)",
        "Factor Tank",
        "Volume (barrel)",
        "Tanggal Pengisian",
        "Tangki",
        "Gross",
        "Net",
        "Penampilan Visual",
        "Warna",
        "Kandungan Air",
        "BSW",
        "Catatan",
        "Saksi",
        "Konfirmasi Penerimaan",
        "Nomor Surat BAST",
      ];

      const headerRow = worksheet.addRow(headers);
      headerRow.eachCell((cell) => {
        cell.style = headerStyle;
      });

      let rowNumber = 1;
      exportData.forEach((ba) => {
        const pengisianList = getPengisianList(ba);

        if (!pengisianList.length) {
          const dataRow = worksheet.addRow([
            rowNumber,
            ba.id,
            formatDate(ba.tanggal),
            formatUkuranColumn(ba, "ukuranCairan"),
            formatUkuranColumn(ba, "ukuranAir"),
            getUniqueFactorTankLabels(ba),
            getVolumeLabelsForBA(ba),
            "-",
            "-",
            "-",
            "-",
            "-",
            "-",
            "-",
            "-",
            "-",
            "-",
            "-",
            "-",
          ]);
          dataRow.eachCell((cell) => {
            cell.style = dataStyle;
          });
          rowNumber += 1;
          return;
        }

        pengisianList.forEach((item, pengisianIndex) => {
          const ukuran = getUkuranForTanki(
            ba,
            item.tangkiId ?? item.tanki?.id,
          );
          const volumeBarrel = calcVolumeBarrel(
            ukuran.ukuranCairan,
            ukuran.ukuranAir,
            item.tanki?.factorTank,
          );

          const dataRow = worksheet.addRow([
            pengisianIndex === 0 ? rowNumber : "",
            pengisianIndex === 0 ? ba.id : "",
            pengisianIndex === 0 ? formatDate(ba.tanggal) : "",
            ukuran.ukuranCairan ?? "-",
            ukuran.ukuranAir ?? "-",
            formatFactorTank(item.tanki?.factorTank),
            formatVolumeBarrelLabel(volumeBarrel),
            formatDate(item.tanggal || item.createdAt),
            item.tanki?.kode || "-",
            formatVolumeLabel(item.gross, item.satuanVolume?.satuan),
            formatVolumeLabel(item.net, item.satuanVolume?.satuan),
            item.penampilanVisual || "-",
            item.warna || "-",
            item.kandunganAir ?? "-",
            item.BSW ?? "-",
            item.catatan || "-",
            item.saksi || "-",
            getKonfirmasiLabel(item),
            item.nomorSurat || "-",
          ]);
          dataRow.eachCell((cell) => {
            cell.style = dataStyle;
          });
        });

        rowNumber += 1;
      });

      worksheet.columns.forEach((column) => {
        let maxLength = 10;
        column.eachCell({ includeEmpty: true }, (cell) => {
          const columnLength = cell.value ? cell.value.toString().length : 10;
          if (columnLength > maxLength) {
            maxLength = columnLength;
          }
        });
        column.width = Math.min(maxLength + 2, 40);
      });

      const currentDate = new Date().toISOString().split("T")[0];
      const filename = `BA_Bongkar_${currentDate}.xlsx`;
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
        description: "File Excel berhasil diunduh",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Gagal",
        description: "Gagal mengekspor data ke Excel",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id],
    );
  };

  const cetakUlangBABongkar = async (baId) => {
    if (!baId) return;

    setLoadingCetakBA((prev) => ({ ...prev, [baId]: true }));

    try {
      const res = await axios.post(
        `${API_BASE}/tanki/cetak/ba-bongkar`,
        { BABongkarId: baId },
        { responseType: "blob" },
      );

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `BA_Bongkar_${baId}_${Date.now()}.docx`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Berhasil",
        description: "Dokumen BA Bongkar berhasil diunduh",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error(err);
      let message = "Gagal mencetak ulang BA Bongkar";
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          message = parsed.message || message;
        } catch {
          // gunakan pesan default
        }
      } else if (err.response?.data?.message) {
        message = err.response.data.message;
      }

      toast({
        title: "Gagal",
        description: message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoadingCetakBA((prev) => ({ ...prev, [baId]: false }));
    }
  };

  const openCreateBak3s = (ba) => {
    setBak3sTarget({ ba, bak3s: null });
    setBak3sForm(emptyBak3sForm());
    onBak3sOpen();
  };

  const openEditBak3s = (ba) => {
    const bak3s = ba.BAK3S;
    if (!bak3s) {
      openCreateBak3s(ba);
      return;
    }

    setBak3sTarget({ ba, bak3s });
    setBak3sForm({
      api: bak3s.api ?? "",
      BSNW: bak3s.BSNW ?? "",
      produksi: bak3s.produksi ?? "",
      sg: bak3s.sg ?? "",
      file: null,
    });
    onBak3sOpen();
  };

  const closeBak3sModal = () => {
    setBak3sTarget(null);
    setBak3sForm(emptyBak3sForm());
    onBak3sClose();
  };

  const handleBak3sFieldChange = (field, value) => {
    setBak3sForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmitBak3s = async () => {
    if (!bak3sTarget?.ba?.id) return;

    if (
      bak3sForm.api === "" ||
      bak3sForm.BSNW === "" ||
      bak3sForm.produksi === "" ||
      bak3sForm.sg === ""
    ) {
      toast({
        title: "Data belum lengkap",
        description: "API, BSNW, produksi, dan SG wajib diisi",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmittingBak3s(true);
    try {
      const formData = new FormData();
      formData.append("BABongkarId", bak3sTarget.ba.id);
      formData.append("api", bak3sForm.api);
      formData.append("BSNW", bak3sForm.BSNW);
      formData.append("produksi", bak3sForm.produksi);
      formData.append("sg", bak3sForm.sg);
      if (bak3sForm.file) formData.append("dokumen", bak3sForm.file);

      if (bak3sTarget.bak3s?.id) {
        await axios.post(
          `${API_BASE}/tanki/edit/bak3s/${bak3sTarget.bak3s.id}`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } },
        );
      } else {
        await axios.post(`${API_BASE}/tanki/post/bak3s`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      toast({
        title: "Berhasil",
        description: bak3sTarget.bak3s?.id
          ? "BAK3S berhasil diperbarui"
          : "BAK3S berhasil disimpan",
        status: "success",
        duration: 4000,
        isClosable: true,
      });
      closeBak3sModal();
      fetchDataBA();
    } catch (err) {
      toast({
        title: "Gagal menyimpan BAK3S",
        description: err.response?.data?.error || err.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsSubmittingBak3s(false);
    }
  };

  const openDeleteBak3s = (ba) => {
    if (!ba?.BAK3S) return;
    setDeleteBak3sTarget({ ba, bak3s: ba.BAK3S });
    onDeleteBak3sOpen();
  };

  const closeDeleteBak3s = () => {
    setDeleteBak3sTarget(null);
    onDeleteBak3sClose();
  };

  const handleDeleteBak3s = async () => {
    if (!deleteBak3sTarget?.bak3s?.id) return;

    setIsDeletingBak3s(true);
    try {
      await axios.post(
        `${API_BASE}/tanki/delete/bak3s/${deleteBak3sTarget.bak3s.id}`,
      );
      toast({
        title: "Berhasil",
        description: "BAK3S berhasil dihapus",
        status: "success",
        duration: 4000,
        isClosable: true,
      });
      closeDeleteBak3s();
      fetchDataBA();
    } catch (err) {
      toast({
        title: "Gagal menghapus",
        description: err.response?.data?.error || err.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsDeletingBak3s(false);
    }
  };

  useEffect(() => {
    fetchDataTanki();
  }, []);

  useEffect(() => {
    setPage(0);
    setExpandedIds([]);
  }, [tanggalAwal, tanggalAkhir, tangkiFilterId, baIdFilter]);

  useEffect(() => {
    fetchDataBA();
  }, [page, tanggalAwal, tanggalAkhir, tangkiFilterId, baIdFilter]);

  const colSpan = 12;

  return (
    <LayoutKPBPN>
      <Box bgColor="secondary" pb="40px" px="30px" minH="90vh">
        <Container variant="primary" p="30px" my="30px" minW="2000px">
          <HStack justify="space-between" mb={6}>
            <Heading color="kpbpn">BA Bongkar</Heading>
            <HStack spacing={3}>
              <Text fontSize="sm" color="gray.500">
                Total: {rows} data
              </Text>
              <Button
                leftIcon={<BsFileEarmarkExcel />}
                variant="outline"
                colorScheme="green"
                onClick={downloadExcel}
                isLoading={isExporting}
                loadingText="Mengekspor..."
              >
                Export Excel
              </Button>
            </HStack>
          </HStack>

          <Box mb={6} p={4} bg="gray.50" borderRadius="lg">
            <Heading size="sm" mb={4} color="gray.700">
              Filter Data
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
              <FormControl>
                <FormLabel fontSize="sm">Tanggal Awal</FormLabel>
                <Input
                  type="date"
                  bg="white"
                  value={tanggalAwal}
                  onChange={(e) => setTanggalAwal(e.target.value)}
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">Tanggal Akhir</FormLabel>
                <Input
                  type="date"
                  bg="white"
                  value={tanggalAkhir}
                  onChange={(e) => setTanggalAkhir(e.target.value)}
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">Tanki</FormLabel>
                <Select
                  bg="white"
                  placeholder="Semua tanki"
                  value={tangkiFilterId}
                  onChange={(e) => setTangkiFilterId(e.target.value)}
                >
                  {dataTanki.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.kode}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">ID BA</FormLabel>
                <Input
                  type="number"
                  bg="white"
                  placeholder="Cari ID BA"
                  value={baIdFilter}
                  onChange={(e) => setBaIdFilter(e.target.value)}
                />
              </FormControl>
            </SimpleGrid>
            <HStack mt={4} justify="flex-end">
              <Button
                leftIcon={<BsX />}
                variant="outline"
                colorScheme="gray"
                onClick={resetFilter}
                isDisabled={!hasActiveFilter}
              >
                Reset Filter
              </Button>
            </HStack>
          </Box>

          <Divider mb={6} />

          {isLoading ? (
            <Center py={10}>
              <Spinner size="lg" color="kpbpn" />
            </Center>
          ) : (
            <Box overflowX="auto" borderWidth="1px" borderRadius="lg">
              <Table size="sm">
                <Thead bg="gray.50">
                  <Tr>
                    <Th w="40px" />
                    <Th>No</Th>
                    <Th>ID BA</Th>
                    <Th>Tanggal</Th>
                    <Th>Ukuran Cairan (cm)</Th>
                    <Th>Ukuran Air (cm)</Th>
                    <Th isNumeric>Factor Tank</Th>
                    <Th>Volume (barrel)</Th>
                    <Th>Jumlah Pengisian</Th>
                    <Th>Tangki</Th>
                    <Th>BAK3S</Th>
                    <Th>Aksi</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {dataBA.length === 0 ? (
                    <Tr>
                      <Td colSpan={colSpan} textAlign="center" py={6}>
                        {hasActiveFilter
                          ? "Tidak ada data BA Bongkar sesuai filter"
                          : "Belum ada data BA Bongkar"}
                      </Td>
                    </Tr>
                  ) : (
                    dataBA.map((ba, index) => {
                      const pengisianList = getPengisianList(ba);
                      const isExpanded = expandedIds.includes(ba.id);

                      return (
                        <React.Fragment key={ba.id}>
                          <Tr bg="gray.50">
                            <Td>
                              <IconButton
                                aria-label={
                                  isExpanded
                                    ? "Tutup detail pengisian"
                                    : "Lihat detail pengisian"
                                }
                                icon={
                                  isExpanded ? <BsChevronUp /> : <BsChevronDown />
                                }
                                size="xs"
                                variant="ghost"
                                onClick={() => toggleExpand(ba.id)}
                              />
                            </Td>
                            <Td>{page * limit + index + 1}</Td>
                            <Td>
                              <Badge colorScheme="green">BA #{ba.id}</Badge>
                            </Td>
                            <Td>{formatDate(ba.tanggal)}</Td>
                            <Td>{formatUkuranColumn(ba, "ukuranCairan")}</Td>
                            <Td>{formatUkuranColumn(ba, "ukuranAir")}</Td>
                            <Td isNumeric>{getUniqueFactorTankLabels(ba)}</Td>
                            <Td isNumeric>{getVolumeLabelsForBA(ba)}</Td>
                            <Td>{pengisianList.length}</Td>
                            <Td>{getUniqueTankiKodes(ba)}</Td>
                            <Td>
                              {ba.BAK3S ? (
                                <Badge colorScheme="green">Ada</Badge>
                              ) : (
                                <Badge colorScheme="gray">Belum ada</Badge>
                              )}
                            </Td>
                            <Td>
                              <HStack spacing={2} align="start">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  colorScheme="orange"
                                  isLoading={loadingCetakBA[ba.id]}
                                  onClick={() => cetakUlangBABongkar(ba.id)}
                                >
                                  Cetak Ulang BA
                                </Button>
                                {ba.BAK3S ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    leftIcon={<BsPencil />}
                                    onClick={() => openEditBak3s(ba)}
                                  >
                                    Edit BAK3S
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    colorScheme="orange"
                                    onClick={() => openCreateBak3s(ba)}
                                  >
                                    Tambah BAK3S
                                  </Button>
                                )}
                              </HStack>
                            </Td>
                          </Tr>
                          <Tr>
                            <Td colSpan={colSpan} p={0} borderBottom="none">
                              <Collapse in={isExpanded} animateOpacity>
                                <Box
                                  p={4}
                                  bg="white"
                                  borderTopWidth="1px"
                                  borderColor="gray.100"
                                >
                                  <Box
                                    mb={5}
                                    p={3}
                                    borderWidth="1px"
                                    borderRadius="md"
                                  >
                                    <HStack
                                      justify="space-between"
                                      mb={3}
                                      align="start"
                                    >
                                      <Text
                                        fontSize="sm"
                                        fontWeight="semibold"
                                        color="gray.700"
                                      >
                                        BAK3S terkait BA #{ba.id}
                                      </Text>
                                      <HStack spacing={2}>
                                        {ba.BAK3S ? (
                                          <>
                                            <Button
                                              size="xs"
                                              variant="outline"
                                              leftIcon={<BsPencil />}
                                              onClick={() => openEditBak3s(ba)}
                                            >
                                              Edit
                                            </Button>
                                            <Button
                                              size="xs"
                                              colorScheme="red"
                                              variant="outline"
                                              leftIcon={<BsTrash />}
                                              onClick={() =>
                                                openDeleteBak3s(ba)
                                              }
                                            >
                                              Hapus
                                            </Button>
                                          </>
                                        ) : (
                                          <Button
                                            size="xs"
                                            colorScheme="orange"
                                            onClick={() => openCreateBak3s(ba)}
                                          >
                                            Tambah BAK3S
                                          </Button>
                                        )}
                                      </HStack>
                                    </HStack>
                                    {ba.BAK3S ? (
                                      <SimpleGrid
                                        columns={{ base: 2, md: 5 }}
                                        spacing={3}
                                      >
                                        <Box>
                                          <Text fontSize="xs" color="gray.500">
                                            API
                                          </Text>
                                          <Text fontSize="sm" fontWeight="medium">
                                            {formatAngka(ba.BAK3S.api)}
                                          </Text>
                                        </Box>
                                        <Box>
                                          <Text fontSize="xs" color="gray.500">
                                            BSNW
                                          </Text>
                                          <Text fontSize="sm" fontWeight="medium">
                                            {formatAngka(ba.BAK3S.BSNW)}
                                          </Text>
                                        </Box>
                                        <Box>
                                          <Text fontSize="xs" color="gray.500">
                                            Produksi
                                          </Text>
                                          <Text fontSize="sm" fontWeight="medium">
                                            {formatAngka(ba.BAK3S.produksi)}
                                          </Text>
                                        </Box>
                                        <Box>
                                          <Text fontSize="xs" color="gray.500">
                                            SG
                                          </Text>
                                          <Text fontSize="sm" fontWeight="medium">
                                            {formatAngka(ba.BAK3S.sg)}
                                          </Text>
                                        </Box>
                                        <Box>
                                          <Text fontSize="xs" color="gray.500">
                                            Dokumen
                                          </Text>
                                          {ba.BAK3S.dokumen ? (
                                            <Button
                                              as="a"
                                              href={getDocumentUrl(
                                                ba.BAK3S.dokumen,
                                              )}
                                              target="_blank"
                                              rel="noreferrer"
                                              size="xs"
                                              variant="link"
                                              colorScheme="orange"
                                              leftIcon={<BsDownload />}
                                            >
                                              Unduh
                                            </Button>
                                          ) : (
                                            <Text fontSize="sm">-</Text>
                                          )}
                                        </Box>
                                      </SimpleGrid>
                                    ) : (
                                      <Text fontSize="sm" color="gray.500">
                                        Belum ada BAK3S untuk BA Bongkar ini.
                                        Setiap BA Bongkar hanya dapat memiliki
                                        satu BAK3S.
                                      </Text>
                                    )}
                                  </Box>
                                  {(ba.ujiLabK3S || []).length > 0 && (
                                    <Box mb={5}>
                                      <Text
                                        fontSize="sm"
                                        fontWeight="semibold"
                                        mb={3}
                                        color="gray.700"
                                      >
                                        Uji Lab K3S terkait BA #{ba.id}
                                      </Text>
                                      <Box overflowX="auto">
                                        <Table size="sm" variant="simple">
                                          <Thead>
                                            <Tr>
                                              <Th>Tangki</Th>
                                              <Th>Tanggal</Th>
                                              <Th>API</Th>
                                              <Th>BSNW</Th>
                                              <Th>Suhu</Th>
                                              <Th>SG</Th>
                                              <Th>Kualitas</Th>
                                            </Tr>
                                          </Thead>
                                          <Tbody>
                                            {(ba.ujiLabK3S || []).map(
                                              (uji) => (
                                                <Tr key={uji.id}>
                                                  <Td>
                                                    {uji.tanki?.kode || "-"}
                                                  </Td>
                                                  <Td>
                                                    {formatDate(
                                                      uji.tanggal ||
                                                        uji.createdAt,
                                                    )}
                                                  </Td>
                                                  <Td>
                                                    {formatAngka(uji.api)}
                                                  </Td>
                                                  <Td>
                                                    {formatAngka(uji.BSNW)}
                                                  </Td>
                                                  <Td>
                                                    {formatAngka(uji.suhu)}
                                                  </Td>
                                                  <Td>
                                                    {formatAngka(uji.sg)}
                                                  </Td>
                                                  <Td>
                                                    <Badge
                                                      colorScheme={
                                                        uji.kualitas ===
                                                        "ONSPEC"
                                                          ? "green"
                                                          : "red"
                                                      }
                                                    >
                                                      {uji.kualitas}
                                                    </Badge>
                                                  </Td>
                                                </Tr>
                                              ),
                                            )}
                                          </Tbody>
                                        </Table>
                                      </Box>
                                    </Box>
                                  )}
                                  <Text
                                    fontSize="sm"
                                    fontWeight="semibold"
                                    mb={3}
                                    color="gray.700"
                                  >
                                    Pengisian Tanki terkait BA #{ba.id}
                                  </Text>
                                  {pengisianList.length === 0 ? (
                                    <Text fontSize="sm" color="gray.500">
                                      Tidak ada pengisian tanki terkait
                                    </Text>
                                  ) : (
                                    <Box overflowX="auto">
                                      <Table size="sm" variant="simple">
                                        <Thead>
                                          <Tr>
                                            <Th>No</Th>
                                            <Th>Tanggal</Th>
                                            <Th>Tangki</Th>
                                            <Th isNumeric>Factor Tank</Th>
                                            <Th isNumeric>Volume (barrel)</Th>
                                            <Th>Gross</Th>
                                            <Th>Net</Th>
                                            <Th>Penampilan Visual</Th>
                                            <Th>Warna</Th>
                                            <Th>Kandungan Air</Th>
                                            <Th>BSW</Th>
                                            <Th>Catatan</Th>
                                            <Th>Saksi</Th>
                                            <Th>Konfirmasi Penerimaan</Th>
                                            <Th>Nomor Surat BAST</Th>
                                          </Tr>
                                        </Thead>
                                        <Tbody>
                                          {pengisianList.map(
                                            (item, pengisianIndex) => {
                                              const ukuran = getUkuranForTanki(
                                                ba,
                                                item.tangkiId ?? item.tanki?.id,
                                              );

                                              return (
                                              <Tr key={item.id}>
                                                <Td>{pengisianIndex + 1}</Td>
                                                <Td>
                                                  {formatDate(
                                                    item.tanggal ||
                                                      item.createdAt,
                                                  )}
                                                </Td>
                                                <Td>
                                                  {item.tanki?.kode || "-"}
                                                </Td>
                                                <Td isNumeric>
                                                  {formatFactorTank(
                                                    item.tanki?.factorTank,
                                                  )}
                                                </Td>
                                                <Td isNumeric>
                                                  {formatVolumeBarrelLabel(
                                                    calcVolumeBarrel(
                                                      ukuran.ukuranCairan,
                                                      ukuran.ukuranAir,
                                                      item.tanki?.factorTank,
                                                    ),
                                                  )}
                                                </Td>
                                                <Td>
                                                  {formatVolumeLabel(
                                                    item.gross,
                                                    item.satuanVolume?.satuan,
                                                  )}
                                                </Td>
                                                <Td>
                                                  {formatVolumeLabel(
                                                    item.net,
                                                    item.satuanVolume?.satuan,
                                                  )}
                                                </Td>
                                                <Td>
                                                  {item.penampilanVisual || "-"}
                                                </Td>
                                                <Td>{item.warna || "-"}</Td>
                                                <Td>
                                                  {item.kandunganAir ?? "-"}
                                                </Td>
                                                <Td>{item.BSW ?? "-"}</Td>
                                                <Td>{item.catatan || "-"}</Td>
                                                <Td>{item.saksi || "-"}</Td>
                                                <Td>
                                                  {(item.konfirmasiPenerimaans ||
                                                    []).length === 0 ? (
                                                    "-"
                                                  ) : (
                                                    <VStack align="start" spacing={1}>
                                                      {item.konfirmasiPenerimaans.map(
                                                        (kp) => (
                                                          <Badge
                                                            key={kp.id}
                                                            colorScheme="orange"
                                                          >
                                                            {kp.nomor ||
                                                              kp.suratJalan
                                                                ?.transportir
                                                                ?.plat ||
                                                              `ID ${kp.id}`}
                                                          </Badge>
                                                        ),
                                                      )}
                                                    </VStack>
                                                  )}
                                                </Td>
                                                <Td>
                                                  {item.nomorSurat ? (
                                                    <Text
                                                      fontSize="xs"
                                                      whiteSpace="nowrap"
                                                    >
                                                      {item.nomorSurat}
                                                    </Text>
                                                  ) : (
                                                    <Badge colorScheme="gray">
                                                      Belum ada
                                                    </Badge>
                                                  )}
                                                </Td>
                                              </Tr>
                                              );
                                            },
                                          )}
                                        </Tbody>
                                      </Table>
                                    </Box>
                                  )}
                                </Box>
                              </Collapse>
                            </Td>
                          </Tr>
                        </React.Fragment>
                      );
                    })
                  )}
                </Tbody>
              </Table>
            </Box>
          )}

          {!isLoading && (
            <Box
              mt={6}
              display="flex"
              justifyContent="center"
              alignItems="center"
            >
              <ReactPaginate
                previousLabel={"←"}
                nextLabel={"→"}
                pageCount={pages}
                onPageChange={changePage}
                forcePage={page}
                activeClassName={"item active "}
                breakClassName={"item break-me "}
                breakLabel={"..."}
                containerClassName={"pagination"}
                disabledClassName={"disabled-page"}
                marginPagesDisplayed={1}
                nextClassName={"item next "}
                pageClassName={"item pagination-page "}
                pageRangeDisplayed={2}
                previousClassName={"item previous"}
              />
            </Box>
          )}
        </Container>
      </Box>

      <Modal isOpen={isBak3sOpen} onClose={closeBak3sModal} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {bak3sTarget?.bak3s?.id ? "Edit BAK3S" : "Tambah BAK3S"}
            {bak3sTarget?.ba?.id ? ` — BA #${bak3sTarget.ba.id}` : ""}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text fontSize="sm" color="gray.600">
                Setiap BA Bongkar hanya memiliki satu BAK3S. Isi API, BSNW,
                produksi, SG, dan unggah dokumen.
              </Text>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                <FormControl isRequired>
                  <FormLabel>API</FormLabel>
                  <Input
                    type="number"
                    step="0.001"
                    value={bak3sForm.api}
                    onChange={(e) =>
                      handleBak3sFieldChange("api", e.target.value)
                    }
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>BSNW</FormLabel>
                  <Input
                    type="number"
                    step="0.001"
                    value={bak3sForm.BSNW}
                    onChange={(e) =>
                      handleBak3sFieldChange("BSNW", e.target.value)
                    }
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Produksi</FormLabel>
                  <Input
                    type="number"
                    step="0.001"
                    value={bak3sForm.produksi}
                    onChange={(e) =>
                      handleBak3sFieldChange("produksi", e.target.value)
                    }
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>SG</FormLabel>
                  <Input
                    type="number"
                    step="0.001"
                    value={bak3sForm.sg}
                    onChange={(e) =>
                      handleBak3sFieldChange("sg", e.target.value)
                    }
                  />
                </FormControl>
              </SimpleGrid>
              <FormControl>
                <FormLabel>Dokumen</FormLabel>
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx,image/png,image/jpeg,image/jpg"
                  onChange={(e) =>
                    handleBak3sFieldChange("file", e.target.files?.[0] || null)
                  }
                />
                {bak3sTarget?.bak3s?.dokumen && !bak3sForm.file && (
                  <FormHelperText>
                    Dokumen saat ini:{" "}
                    {getDocumentName(bak3sTarget.bak3s.dokumen)}
                  </FormHelperText>
                )}
                {bak3sForm.file && (
                  <FormHelperText>
                    File baru: {bak3sForm.file.name}
                  </FormHelperText>
                )}
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={closeBak3sModal}>
              Batal
            </Button>
            <Button
              colorScheme="orange"
              onClick={handleSubmitBak3s}
              isLoading={isSubmittingBak3s}
            >
              Simpan
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isDeleteBak3sOpen} onClose={closeDeleteBak3s} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Hapus BAK3S</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              Hapus BAK3S untuk BA Bongkar{" "}
              <Text as="span" fontWeight="bold">
                #{deleteBak3sTarget?.ba?.id}
              </Text>
              ? Tindakan ini tidak dapat dibatalkan.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={closeDeleteBak3s}>
              Batal
            </Button>
            <Button
              colorScheme="red"
              onClick={handleDeleteBak3s}
              isLoading={isDeletingBak3s}
            >
              Hapus
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </LayoutKPBPN>
  );
};

export default BABongkar;
