import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { userRedux } from "../../Redux/Reducers/auth";
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
  Flex,
  Spacer,
  Stack,
  Skeleton,
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
  FormErrorMessage,
  Checkbox,
  Image,
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
import { Link as RouterLink, useHistory } from "react-router-dom";
import LayoutKPBPN from "../../Componets/KPBPN/LayoutKPBPN";
import VolumeMultiSatuan from "../../Componets/VolumeMultiSatuan";
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

const getTodayInputDate = () => new Date().toISOString().split("T")[0];

const emptyBaUkuran = () => ({ ukuranCairan: "", ukuranAir: "" });

const isUkuranValueFilled = (value) => {
  if (value === "" || value === null || value === undefined) return false;
  return !Number.isNaN(Number(value));
};

const emptyUjiLabForm = () => ({
  tanggal: getTodayInputDate(),
  api: "",
  BSNW: "",
  suhu: "",
  sg: "",
  kualitas: "",
  pic: null,
  picPreview: null,
});

const getTangkiId = (item) => item.tangkiId ?? item.tanki?.id;

const getTangkiKode = (item) => item.tanki?.kode || "-";

const getPengisianSatuan = (item) => {
  if (item?.satuanVolume?.satuan) return item.satuanVolume.satuan;

  for (const kp of item?.konfirmasiPenerimaans || []) {
    const satuan = kp.suratJalan?.satuanVolume?.satuan;
    if (satuan) return satuan;
  }

  return "";
};

const getPengisianSatuanOrDefault = (item) =>
  getPengisianSatuan(item) || "Barrel";

const getLatestUjiLab = (ujiLabs, tangkiId) =>
  (ujiLabs || []).find((item) => item.tangkiId === tangkiId) || null;

const isUjiLabSiapBA = (uji) =>
  Boolean(uji && uji.kualitas === "ONSPEC" && !uji.BABongkarId);

const groupPengisianByTangki = (items) => {
  const map = new Map();

  items.forEach((item) => {
    const tangkiId = getTangkiId(item);
    if (!tangkiId) return;

    if (!map.has(tangkiId)) {
      map.set(tangkiId, {
        tangkiId,
        kode: getTangkiKode(item),
        items: [],
      });
    }

    map.get(tangkiId).items.push(item);
  });

  return Array.from(map.values()).sort((a, b) =>
    a.kode.localeCompare(b.kode, "id"),
  );
};

const getPembuatNama = (item) => item?.userKPBPN?.nama || "-";

const MobileField = ({ label, children }) => (
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

const BABongkar = () => {
  const toast = useToast();
  const history = useHistory();
  const user = useSelector(userRedux);
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
  const [modalPengisianData, setModalPengisianData] = useState([]);
  const [isLoadingModal, setIsLoadingModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [baTanggal, setBaTanggal] = useState(getTodayInputDate());
  const [baUkuranByTangki, setBaUkuranByTangki] = useState({});
  const [showUkuranError, setShowUkuranError] = useState(false);
  const [ujiLabList, setUjiLabList] = useState([]);
  const [ujiLabTarget, setUjiLabTarget] = useState(null);
  const [ujiLabForm, setUjiLabForm] = useState(emptyUjiLabForm());
  const [isSubmittingUjiLab, setIsSubmittingUjiLab] = useState(false);
  const [isSubmittingBA, setIsSubmittingBA] = useState(false);

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
  const {
    isOpen: isCreateBAOpen,
    onOpen: onCreateBAOpen,
    onClose: onCreateBAClose,
  } = useDisclosure();
  const {
    isOpen: isUjiLabOpen,
    onOpen: onUjiLabOpen,
    onClose: onUjiLabClose,
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
        "Dibuat oleh",
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
            getPembuatNama(ba),
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
            pengisianIndex === 0 ? getPembuatNama(ba) : "",
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
      if (user?.id) formData.append("userKPBPNId", user.id);
      if (bak3sForm.file) formData.append("dokumen", bak3sForm.file);

      const isEdit = Boolean(bak3sTarget.bak3s?.id);
      const res = isEdit
        ? await axios.post(
            `${API_BASE}/tanki/edit/bak3s/${bak3sTarget.bak3s.id}`,
            formData,
            { headers: { "Content-Type": "multipart/form-data" } },
          )
        : await axios.post(`${API_BASE}/tanki/post/bak3s`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });

      toast({
        title: "Berhasil",
        description: isEdit
          ? "BAK3S berhasil diperbarui"
          : "BAK3S berhasil disimpan",
        status: "success",
        duration: 4000,
        isClosable: true,
      });
      closeBak3sModal();
      fetchDataBA();

      const createdId = res.data?.result?.id;
      if (!isEdit && createdId) {
        history.push(`/tanki-kpbpn/detail-bak3s/${createdId}`);
      }
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

  const fetchEligiblePengisianForBA = async () => {
    setIsLoadingModal(true);
    try {
      const [pengisianRes, ujiRes] = await Promise.all([
        axios.get(`${API_BASE}/tanki/get?page=0&limit=1000`),
        axios.get(`${API_BASE}/tanki/get/uji-lab`),
      ]);
      const eligible = (pengisianRes.data.result || []).filter(
        (item) => !item.BABongkarId,
      );
      setModalPengisianData(eligible);
      setUjiLabList(ujiRes.data.result || []);
      return eligible;
    } catch (err) {
      console.error(err);
      toast({
        title: "Gagal memuat data",
        description: "Tidak dapat memuat data pengisian tanki",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
      return [];
    } finally {
      setIsLoadingModal(false);
    }
  };

  const resetModalBA = () => {
    setSelectedIds([]);
    setBaTanggal(getTodayInputDate());
    setBaUkuranByTangki({});
    setShowUkuranError(false);
    setModalPengisianData([]);
    setUjiLabList([]);
  };

  const handleCloseModalBA = () => {
    onUjiLabClose();
    setUjiLabTarget(null);
    setUjiLabForm(emptyUjiLabForm());
    onCreateBAClose();
    resetModalBA();
  };

  const handleOpenModalBA = async () => {
    resetModalBA();
    onCreateBAOpen();
    const eligible = await fetchEligiblePengisianForBA();

    if (!eligible.length) {
      toast({
        title: "Tidak ada data",
        description:
          "Semua pengisian tanki sudah memiliki BA Bongkar atau belum ada data",
        status: "info",
        duration: 4000,
        isClosable: true,
      });
    }
  };

  const toggleSelectModalItem = (item) => {
    const latest = getLatestUjiLab(ujiLabList, getTangkiId(item));
    if (!isUjiLabSiapBA(latest) && !selectedIds.includes(item.id)) {
      toast({
        title: "Uji lab belum ONSPEC",
        description:
          "Lakukan uji lab K3S sampai hasil terakhir ONSPEC sebelum memilih tanki ini",
        status: "warning",
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    setSelectedIds((prev) =>
      prev.includes(item.id)
        ? prev.filter((id) => id !== item.id)
        : [...prev, item.id],
    );
  };

  const toggleSelectTangkiGroup = (group, checked) => {
    const latest = getLatestUjiLab(ujiLabList, group.tangkiId);
    if (checked && !isUjiLabSiapBA(latest)) {
      toast({
        title: "Uji lab belum ONSPEC",
        description: `Tanki ${group.kode} belum siap BA Bongkar`,
        status: "warning",
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    const groupIds = group.items.map((item) => item.id);
    setSelectedIds((prev) =>
      checked
        ? [...new Set([...prev, ...groupIds])]
        : prev.filter((id) => !groupIds.includes(id)),
    );
  };

  const getBaUkuran = (tangkiId) =>
    baUkuranByTangki[tangkiId] || emptyBaUkuran();

  const handleBaUkuranChange = (tangkiId, field, value) => {
    setBaUkuranByTangki((prev) => ({
      ...prev,
      [tangkiId]: {
        ...emptyBaUkuran(),
        ...prev[tangkiId],
        [field]: value,
      },
    }));
  };

  const handleCloseUjiLab = () => {
    if (ujiLabForm.picPreview) {
      URL.revokeObjectURL(ujiLabForm.picPreview);
    }
    setUjiLabTarget(null);
    setUjiLabForm(emptyUjiLabForm());
    onUjiLabClose();
  };

  const handleUjiLabFieldChange = (field, value) => {
    setUjiLabForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleUjiLabFotoChange = (file) => {
    setUjiLabForm((prev) => {
      if (prev.picPreview) URL.revokeObjectURL(prev.picPreview);
      return {
        ...prev,
        pic: file,
        picPreview: file ? URL.createObjectURL(file) : null,
      };
    });
  };

  const handleSubmitUjiLab = async () => {
    if (!ujiLabTarget?.tangkiId) return;

    if (
      !ujiLabForm.tanggal ||
      ujiLabForm.api === "" ||
      ujiLabForm.BSNW === "" ||
      ujiLabForm.suhu === "" ||
      ujiLabForm.sg === "" ||
      !["ONSPEC", "OFFSPEC"].includes(ujiLabForm.kualitas)
    ) {
      toast({
        title: "Data belum lengkap",
        description: "API, BSNW, suhu, SG, dan kualitas wajib diisi",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmittingUjiLab(true);
    try {
      const formData = new FormData();
      formData.append("tangkiId", ujiLabTarget.tangkiId);
      formData.append("tanggal", ujiLabForm.tanggal);
      formData.append("api", ujiLabForm.api);
      formData.append("BSNW", ujiLabForm.BSNW);
      formData.append("suhu", ujiLabForm.suhu);
      formData.append("sg", ujiLabForm.sg);
      formData.append("kualitas", ujiLabForm.kualitas);
      if (ujiLabForm.pic) formData.append("pic", ujiLabForm.pic);

      await axios.post(`${API_BASE}/tanki/post/uji-lab`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const ujiRes = await axios.get(`${API_BASE}/tanki/get/uji-lab`);
      setUjiLabList(ujiRes.data.result || []);

      toast({
        title: "Berhasil",
        description:
          ujiLabForm.kualitas === "ONSPEC"
            ? `Tanki ${ujiLabTarget.kode} ONSPEC dan siap untuk BA Bongkar`
            : `Tanki ${ujiLabTarget.kode} OFFSPEC. Lakukan pencampuran bahan kimia, lalu uji ulang`,
        status: ujiLabForm.kualitas === "ONSPEC" ? "success" : "warning",
        duration: 4000,
        isClosable: true,
      });
      handleCloseUjiLab();
    } catch (err) {
      toast({
        title: "Gagal menyimpan uji lab",
        description: err.response?.data?.error || err.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsSubmittingUjiLab(false);
    }
  };

  const tangkiGroups = groupPengisianByTangki(modalPengisianData);
  const selectedTangkiCount = new Set(
    modalPengisianData
      .filter((item) => selectedIds.includes(item.id))
      .map((item) => getTangkiId(item)),
  ).size;

  const handleSubmitBABongkar = async () => {
    if (!selectedIds.length) {
      toast({
        title: "Pilih data",
        description: "Pilih minimal satu pengisian tanki",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const tankiBelumSiap = tangkiGroups.filter((group) => {
      const hasSelected = group.items.some((item) =>
        selectedIds.includes(item.id),
      );
      if (!hasSelected) return false;
      return !isUjiLabSiapBA(getLatestUjiLab(ujiLabList, group.tangkiId));
    });

    if (tankiBelumSiap.length) {
      toast({
        title: "Uji lab belum lengkap",
        description: `Tanki ${tankiBelumSiap
          .map((group) => group.kode)
          .join(", ")} belum ONSPEC`,
        status: "warning",
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    if (!baTanggal) {
      toast({
        title: "Tanggal wajib diisi",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const tankiTanpaUkuran = tangkiGroups.filter((group) => {
      const hasSelected = group.items.some((item) =>
        selectedIds.includes(item.id),
      );
      if (!hasSelected) return false;
      const ukuran = getBaUkuran(group.tangkiId);
      return (
        !isUkuranValueFilled(ukuran.ukuranCairan) ||
        !isUkuranValueFilled(ukuran.ukuranAir)
      );
    });

    if (tankiTanpaUkuran.length) {
      setShowUkuranError(true);
      toast({
        title: "Ukuran wajib diisi",
        description: `Isi ukuran cairan dan ukuran air untuk tanki ${tankiTanpaUkuran
          .map((group) => group.kode)
          .join(", ")}`,
        status: "warning",
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    setIsSubmittingBA(true);
    try {
      const tankiPayload = tangkiGroups
        .map((group) => {
          const ids = group.items
            .filter((item) => selectedIds.includes(item.id))
            .map((item) => item.id);
          if (!ids.length) return null;

          const ukuran = getBaUkuran(group.tangkiId);
          return {
            tangkiId: group.tangkiId,
            ukuranCairan:
              ukuran.ukuranCairan !== "" ? Number(ukuran.ukuranCairan) : null,
            ukuranAir:
              ukuran.ukuranAir !== "" ? Number(ukuran.ukuranAir) : null,
            ids,
          };
        })
        .filter(Boolean);

      const res = await axios.post(
        `${API_BASE}/tanki/post/ba-bongkar`,
        {
          tanggal: baTanggal,
          tanki: tankiPayload,
          userKPBPNId: user?.id || null,
        },
        { responseType: "blob" },
      );

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `BA_Bongkar_${baTanggal}_${Date.now()}.docx`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Berhasil",
        description: "BA Bongkar berhasil dibuat dan diunduh",
        status: "success",
        duration: 4000,
        isClosable: true,
      });

      handleCloseModalBA();
      fetchDataBA();
    } catch (err) {
      console.error(err);
      let message = "Gagal membuat BA Bongkar";
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          message = parsed.message || parsed.error || message;
        } catch {
          // gunakan pesan default
        }
      } else if (err.response?.data?.message || err.response?.data?.error) {
        message = err.response.data.message || err.response.data.error;
      }

      toast({
        title: "Gagal",
        description: message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsSubmittingBA(false);
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

  const colSpan = 13;

  const renderBaAksiButtons = (ba, isMobile = false) => (
    <Flex
      gap={2}
      wrap="wrap"
      direction={isMobile ? "column" : "row"}
      align={isMobile ? "stretch" : "start"}
    >
      <Button
        size="sm"
        variant="outline"
        colorScheme="orange"
        isLoading={loadingCetakBA[ba.id]}
        onClick={() => cetakUlangBABongkar(ba.id)}
        w={isMobile ? "full" : "auto"}
      >
        Cetak Ulang BA
      </Button>
      {ba.BAK3S ? (
        <>
          <Button
            as={RouterLink}
            to={`/tanki-kpbpn/detail-bak3s/${ba.BAK3S.id}`}
            size="sm"
            colorScheme="orange"
            w={isMobile ? "full" : "auto"}
          >
            Detail BAK3S
          </Button>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<BsPencil />}
            onClick={() => openEditBak3s(ba)}
            w={isMobile ? "full" : "auto"}
          >
            Edit BAK3S
          </Button>
        </>
      ) : (
        <Button
          size="sm"
          colorScheme="orange"
          onClick={() => openCreateBak3s(ba)}
          w={isMobile ? "full" : "auto"}
        >
          Tambah BAK3S
        </Button>
      )}
    </Flex>
  );

  const renderBaDetail = (ba) => {
    const pengisianList = getPengisianList(ba);

    return (
      <Box p={{ base: 3, md: 4 }} bg="white" minW={0}>
        <Box mb={5} p={3} borderWidth="1px" borderRadius="md">
          <Flex
            justify="space-between"
            mb={3}
            align="start"
            gap={2}
            wrap="wrap"
          >
            <Text fontSize="sm" fontWeight="semibold" color="gray.700">
              BAK3S terkait BA #{ba.id}
            </Text>
            <Flex gap={2} wrap="wrap">
              {ba.BAK3S ? (
                <>
                  <Button
                    as={RouterLink}
                    to={`/tanki-kpbpn/detail-bak3s/${ba.BAK3S.id}`}
                    size="xs"
                    colorScheme="orange"
                  >
                    Detail
                  </Button>
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
                    onClick={() => openDeleteBak3s(ba)}
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
            </Flex>
          </Flex>
          {ba.BAK3S ? (
            <SimpleGrid columns={{ base: 2, sm: 3, md: 6 }} spacing={3}>
              <MobileField label="API">
                {formatAngka(ba.BAK3S.api)}
              </MobileField>
              <MobileField label="BSNW">
                {formatAngka(ba.BAK3S.BSNW)}
              </MobileField>
              <MobileField label="Produksi">
                {formatAngka(ba.BAK3S.produksi)}
              </MobileField>
              <MobileField label="SG">{formatAngka(ba.BAK3S.sg)}</MobileField>
              <MobileField label="Dibuat oleh">
                {getPembuatNama(ba.BAK3S)}
              </MobileField>
              <MobileField label="Dokumen">
                {ba.BAK3S.dokumen ? (
                  <Button
                    as="a"
                    href={getDocumentUrl(ba.BAK3S.dokumen)}
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
                  "-"
                )}
              </MobileField>
            </SimpleGrid>
          ) : (
            <Text fontSize="sm" color="gray.500">
              Belum ada BAK3S untuk BA Bongkar ini. Setiap BA Bongkar hanya
              dapat memiliki satu BAK3S.
            </Text>
          )}
        </Box>

        {(ba.ujiLabK3S || []).length > 0 && (
          <Box mb={5}>
            <Text fontSize="sm" fontWeight="semibold" mb={3} color="gray.700">
              Uji Lab K3S terkait BA #{ba.id}
            </Text>
            <Stack display={{ base: "flex", lg: "none" }} spacing={3}>
              {(ba.ujiLabK3S || []).map((uji) => (
                <Box
                  key={uji.id}
                  p={3}
                  borderWidth="1px"
                  borderRadius="md"
                  bg="gray.50"
                >
                  <Flex justify="space-between" mb={2} gap={2} wrap="wrap">
                    <Text fontWeight="semibold" fontSize="sm">
                      {uji.tanki?.kode || "-"}
                    </Text>
                    <Badge
                      colorScheme={uji.kualitas === "ONSPEC" ? "green" : "red"}
                    >
                      {uji.kualitas}
                    </Badge>
                  </Flex>
                  <SimpleGrid columns={2} spacing={3}>
                    <MobileField label="Tanggal">
                      {formatDate(uji.tanggal || uji.createdAt)}
                    </MobileField>
                    <MobileField label="API">{formatAngka(uji.api)}</MobileField>
                    <MobileField label="BSNW">
                      {formatAngka(uji.BSNW)}
                    </MobileField>
                    <MobileField label="Suhu">
                      {formatAngka(uji.suhu)}
                    </MobileField>
                    <MobileField label="SG">{formatAngka(uji.sg)}</MobileField>
                  </SimpleGrid>
                </Box>
              ))}
            </Stack>
            <Box display={{ base: "none", lg: "block" }} overflowX="auto">
              <Table size="sm" variant="simple" minW="640px">
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
                  {(ba.ujiLabK3S || []).map((uji) => (
                    <Tr key={uji.id}>
                      <Td>{uji.tanki?.kode || "-"}</Td>
                      <Td>{formatDate(uji.tanggal || uji.createdAt)}</Td>
                      <Td>{formatAngka(uji.api)}</Td>
                      <Td>{formatAngka(uji.BSNW)}</Td>
                      <Td>{formatAngka(uji.suhu)}</Td>
                      <Td>{formatAngka(uji.sg)}</Td>
                      <Td>
                        <Badge
                          colorScheme={
                            uji.kualitas === "ONSPEC" ? "green" : "red"
                          }
                        >
                          {uji.kualitas}
                        </Badge>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </Box>
        )}

        <Text fontSize="sm" fontWeight="semibold" mb={3} color="gray.700">
          Pengisian Tanki terkait BA #{ba.id}
        </Text>
        {pengisianList.length === 0 ? (
          <Text fontSize="sm" color="gray.500">
            Tidak ada pengisian tanki terkait
          </Text>
        ) : (
          <>
            <Stack display={{ base: "flex", lg: "none" }} spacing={3}>
              {pengisianList.map((item) => {
                const ukuran = getUkuranForTanki(
                  ba,
                  item.tangkiId ?? item.tanki?.id,
                );

                return (
                  <Box
                    key={item.id}
                    p={3}
                    borderWidth="1px"
                    borderRadius="md"
                    bg="gray.50"
                  >
                    <Text fontWeight="semibold" fontSize="sm" mb={2}>
                      {item.tanki?.kode || "-"}
                    </Text>
                    <SimpleGrid columns={2} spacing={3}>
                      <MobileField label="Tanggal">
                        {formatDate(item.tanggal || item.createdAt)}
                      </MobileField>
                      <MobileField label="Factor Tank">
                        {formatFactorTank(item.tanki?.factorTank)}
                      </MobileField>
                      <MobileField label="Volume">
                        {formatVolumeBarrelLabel(
                          calcVolumeBarrel(
                            ukuran.ukuranCairan,
                            ukuran.ukuranAir,
                            item.tanki?.factorTank,
                          ),
                        )}
                      </MobileField>
                      <MobileField label="Gross">
                        {formatVolumeLabel(
                          item.gross,
                          item.satuanVolume?.satuan,
                        )}
                      </MobileField>
                      <MobileField label="Net">
                        {formatVolumeLabel(item.net, item.satuanVolume?.satuan)}
                      </MobileField>
                      <MobileField label="Penampilan Visual">
                        {item.penampilanVisual || "-"}
                      </MobileField>
                      <MobileField label="Warna">{item.warna || "-"}</MobileField>
                      <MobileField label="Kandungan Air">
                        {item.kandunganAir ?? "-"}
                      </MobileField>
                      <MobileField label="BSW">{item.BSW ?? "-"}</MobileField>
                      <MobileField label="Saksi">{item.saksi || "-"}</MobileField>
                      <MobileField label="Konfirmasi Penerimaan">
                        {getKonfirmasiLabel(item)}
                      </MobileField>
                      <MobileField label="Nomor Surat BAST">
                        {item.nomorSurat || (
                          <Badge colorScheme="gray">Belum ada</Badge>
                        )}
                      </MobileField>
                    </SimpleGrid>
                    {item.catatan && (
                      <Box mt={3}>
                        <MobileField label="Catatan">{item.catatan}</MobileField>
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Stack>
            <Box display={{ base: "none", lg: "block" }} overflowX="auto">
              <Table size="sm" variant="simple" minW="1100px">
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
                  {pengisianList.map((item, pengisianIndex) => {
                    const ukuran = getUkuranForTanki(
                      ba,
                      item.tangkiId ?? item.tanki?.id,
                    );

                    return (
                      <Tr key={item.id}>
                        <Td>{pengisianIndex + 1}</Td>
                        <Td>{formatDate(item.tanggal || item.createdAt)}</Td>
                        <Td>{item.tanki?.kode || "-"}</Td>
                        <Td isNumeric>
                          {formatFactorTank(item.tanki?.factorTank)}
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
                        <Td>{item.penampilanVisual || "-"}</Td>
                        <Td>{item.warna || "-"}</Td>
                        <Td>{item.kandunganAir ?? "-"}</Td>
                        <Td>{item.BSW ?? "-"}</Td>
                        <Td>{item.catatan || "-"}</Td>
                        <Td>{item.saksi || "-"}</Td>
                        <Td>
                          {(item.konfirmasiPenerimaans || []).length === 0 ? (
                            "-"
                          ) : (
                            <VStack align="start" spacing={1}>
                              {item.konfirmasiPenerimaans.map((kp) => (
                                <Badge key={kp.id} colorScheme="orange">
                                  {kp.nomor ||
                                    kp.suratJalan?.transportir?.plat ||
                                    `ID ${kp.id}`}
                                </Badge>
                              ))}
                            </VStack>
                          )}
                        </Td>
                        <Td>
                          {item.nomorSurat ? (
                            <Text fontSize="xs" whiteSpace="nowrap">
                              {item.nomorSurat}
                            </Text>
                          ) : (
                            <Badge colorScheme="gray">Belum ada</Badge>
                          )}
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            </Box>
          </>
        )}
      </Box>
    );
  };

  return (
    <LayoutKPBPN>
      <Box
        bgColor="secondary"
        pb={{ base: 6, md: "40px" }}
        px={{ base: 3, sm: 4, md: 6, lg: "30px" }}
        minH="90vh"
        overflowX="hidden"
      >
        <Container
          variant="primary"
          maxW="100%"
          minW={0}
          p={{ base: 4, sm: 5, md: 6, lg: "30px" }}
          my={{ base: 4, md: "30px" }}
        >
          <Flex
            align={{ base: "stretch", md: "center" }}
            direction={{ base: "column", md: "row" }}
            gap={4}
            mb={6}
          >
            <VStack align={{ base: "center", md: "start" }} spacing={1} minW={0}>
              <Heading
                color="kpbpn"
                size={{ base: "md", md: "lg" }}
                textAlign={{ base: "center", md: "left" }}
              >
                BA Bongkar
              </Heading>
              <Text
                fontSize="sm"
                color="gray.500"
                textAlign={{ base: "center", md: "left" }}
              >
                Total: {rows} data
              </Text>
            </VStack>
            <Spacer display={{ base: "none", md: "block" }} />
            <Flex
              gap={3}
              wrap="wrap"
              justify={{ base: "center", md: "flex-end" }}
              w={{ base: "full", md: "auto" }}
            >
              <Button
                colorScheme="orange"
                onClick={handleOpenModalBA}
                w={{ base: "full", sm: "auto" }}
              >
                Buat BA Bongkar
              </Button>
              <Button
                leftIcon={<BsFileEarmarkExcel />}
                variant="outline"
                colorScheme="green"
                onClick={downloadExcel}
                isLoading={isExporting}
                loadingText="Mengekspor..."
                w={{ base: "full", sm: "auto" }}
              >
                Export Excel
              </Button>
            </Flex>
          </Flex>

          <Box
            mb={6}
            p={{ base: 3, md: 4 }}
            bg="gray.50"
            borderRadius="lg"
          >
            <Heading size="sm" mb={4} color="gray.700">
              Filter Data
            </Heading>
            <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={4}>
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
            <Flex mt={4} justify={{ base: "stretch", sm: "flex-end" }}>
              <Button
                leftIcon={<BsX />}
                variant="outline"
                colorScheme="gray"
                onClick={resetFilter}
                isDisabled={!hasActiveFilter}
                w={{ base: "full", sm: "auto" }}
              >
                Reset Filter
              </Button>
            </Flex>
          </Box>

          <Divider mb={6} />

          <Box>
            <Box display={{ base: "block", lg: "none" }}>
              {isLoading ? (
                <Stack spacing={4}>
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <Box
                      key={idx}
                      p={4}
                      borderRadius="lg"
                      border="1px solid"
                      borderColor="gray.200"
                      bg="white"
                    >
                      <Skeleton height="20px" mb={3} width="60%" />
                      <SimpleGrid columns={2} spacing={3}>
                        {Array.from({ length: 6 }).map((__, i) => (
                          <Skeleton key={i} height="36px" />
                        ))}
                      </SimpleGrid>
                    </Box>
                  ))}
                </Stack>
              ) : dataBA.length === 0 ? (
                <Box
                  py={10}
                  textAlign="center"
                  borderRadius="lg"
                  border="1px solid"
                  borderColor="gray.200"
                  bg="white"
                >
                  <Text fontSize="lg" color="gray.500">
                    {hasActiveFilter
                      ? "Tidak ada data BA Bongkar sesuai filter"
                      : "Belum ada data BA Bongkar"}
                  </Text>
                </Box>
              ) : (
                <Stack spacing={4}>
                  {dataBA.map((ba, index) => {
                    const pengisianList = getPengisianList(ba);
                    const isExpanded = expandedIds.includes(ba.id);

                    return (
                      <Box
                        key={ba.id}
                        p={4}
                        borderRadius="lg"
                        border="1px solid"
                        borderColor="gray.200"
                        bg="white"
                        boxShadow="sm"
                      >
                        <Flex
                          justify="space-between"
                          mb={3}
                          align="start"
                          gap={2}
                        >
                          <VStack align="start" spacing={0} minW={0}>
                            <Text fontSize="xs" color="gray.500">
                              No. {page * limit + index + 1}
                            </Text>
                            <Badge colorScheme="green">BA #{ba.id}</Badge>
                            <Text fontSize="xs" color="gray.500" mt={1}>
                              {formatDate(ba.tanggal)}
                            </Text>
                          </VStack>
                          {ba.BAK3S ? (
                            <Badge colorScheme="green">Ada BAK3S</Badge>
                          ) : (
                            <Badge colorScheme="gray">Belum BAK3S</Badge>
                          )}
                        </Flex>

                        <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                          <MobileField label="Ukuran Cairan (cm)">
                            {formatUkuranColumn(ba, "ukuranCairan")}
                          </MobileField>
                          <MobileField label="Ukuran Air (cm)">
                            {formatUkuranColumn(ba, "ukuranAir")}
                          </MobileField>
                          <MobileField label="Factor Tank">
                            {getUniqueFactorTankLabels(ba)}
                          </MobileField>
                          <MobileField label="Volume (barrel)">
                            {getVolumeLabelsForBA(ba)}
                          </MobileField>
                          <MobileField label="Jumlah Pengisian">
                            {pengisianList.length}
                          </MobileField>
                          <MobileField label="Tangki">
                            {getUniqueTankiKodes(ba)}
                          </MobileField>
                          <MobileField label="Dibuat oleh">
                            {getPembuatNama(ba)}
                          </MobileField>
                        </SimpleGrid>

                        <Box mt={4}>{renderBaAksiButtons(ba, true)}</Box>

                        <Button
                          mt={3}
                          size="sm"
                          variant="ghost"
                          w="full"
                          rightIcon={
                            isExpanded ? <BsChevronUp /> : <BsChevronDown />
                          }
                          onClick={() => toggleExpand(ba.id)}
                        >
                          {isExpanded ? "Sembunyikan detail" : "Lihat detail"}
                        </Button>

                        <Collapse in={isExpanded} animateOpacity>
                          <Box
                            mt={3}
                            pt={3}
                            borderTopWidth="1px"
                            borderColor="gray.100"
                          >
                            {renderBaDetail(ba)}
                          </Box>
                        </Collapse>
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </Box>

            <Box
              display={{ base: "none", lg: "block" }}
              overflowX="auto"
              borderWidth="1px"
              borderRadius="lg"
            >
              {isLoading ? (
                <Center py={10}>
                  <Spinner size="lg" color="kpbpn" />
                </Center>
              ) : (
                <Table size="sm" minW="1400px">
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
                      <Th>Dibuat oleh</Th>
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
                                    isExpanded ? (
                                      <BsChevronUp />
                                    ) : (
                                      <BsChevronDown />
                                    )
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
                              <Td isNumeric>
                                {getUniqueFactorTankLabels(ba)}
                              </Td>
                              <Td isNumeric>{getVolumeLabelsForBA(ba)}</Td>
                              <Td>{pengisianList.length}</Td>
                              <Td>{getUniqueTankiKodes(ba)}</Td>
                              <Td>{getPembuatNama(ba)}</Td>
                              <Td>
                                {ba.BAK3S ? (
                                  <Badge colorScheme="green">Ada</Badge>
                                ) : (
                                  <Badge colorScheme="gray">Belum ada</Badge>
                                )}
                              </Td>
                              <Td>{renderBaAksiButtons(ba)}</Td>
                            </Tr>
                            <Tr>
                              <Td colSpan={colSpan} p={0} borderBottom="none">
                                <Collapse in={isExpanded} animateOpacity>
                                  <Box
                                    borderTopWidth="1px"
                                    borderColor="gray.100"
                                  >
                                    {renderBaDetail(ba)}
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
              )}
            </Box>
          </Box>

          {!isLoading && (
            <Flex
              mt={6}
              direction={{ base: "column", md: "row" }}
              align={{ base: "stretch", md: "center" }}
              justify="space-between"
              gap={3}
            >
              <Text
                fontSize="sm"
                color="gray.500"
                textAlign={{ base: "center", md: "left" }}
              >
                Menampilkan {rows === 0 ? 0 : page * limit + 1}–
                {Math.min((page + 1) * limit, rows)} dari {rows} data
                {pages > 1 && (
                  <>
                    {" "}
                    · Halaman {page + 1} dari {pages}
                  </>
                )}
              </Text>
              <Box
                overflowX="auto"
                py={1}
                w={{ base: "full", md: "auto" }}
                display="flex"
                justifyContent={{ base: "center", md: "flex-end" }}
              >
                <ReactPaginate
                  previousLabel={"←"}
                  nextLabel={"→"}
                  pageCount={Math.max(pages, 1)}
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
            </Flex>
          )}
        </Container>
      </Box>

      <Modal
        isOpen={isBak3sOpen}
        onClose={closeBak3sModal}
        size={{ base: "full", md: "lg" }}
        scrollBehavior="inside"
      >
        <ModalOverlay />
        <ModalContent
          mx={{ base: 0, md: 4 }}
          maxW={{ base: "100%", md: "lg" }}
        >
          <ModalHeader px={{ base: 4, md: 6 }} pr={12}>
            {bak3sTarget?.bak3s?.id ? "Edit BAK3S" : "Tambah BAK3S"}
            {bak3sTarget?.ba?.id ? ` — BA #${bak3sTarget.ba.id}` : ""}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody px={{ base: 4, md: 6 }}>
            <VStack spacing={4} align="stretch">
              <Text fontSize="sm" color="gray.600">
                Setiap BA Bongkar hanya memiliki satu BAK3S. Isi API, BSNW,
                produksi, SG, dan unggah dokumen.
              </Text>
              {!bak3sTarget?.bak3s?.id && (
                <Text fontSize="sm" color="gray.500">
                  Dokumen akan tercatat atas nama:{" "}
                  <Text as="span" fontWeight="semibold" color="gray.700">
                    {user?.nama || "-"}
                  </Text>
                </Text>
              )}
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
          <ModalFooter
            flexDir={{ base: "column-reverse", sm: "row" }}
            gap={2}
            px={{ base: 4, md: 6 }}
          >
            <Button
              variant="outline"
              w={{ base: "full", sm: "auto" }}
              onClick={closeBak3sModal}
            >
              Batal
            </Button>
            <Button
              colorScheme="orange"
              w={{ base: "full", sm: "auto" }}
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
        <ModalContent
          mx={{ base: 4, md: 4 }}
          maxW={{ base: "calc(100vw - 2rem)", md: "md" }}
        >
          <ModalHeader px={{ base: 4, md: 6 }} pr={12}>
            Hapus BAK3S
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody px={{ base: 4, md: 6 }}>
            <Text>
              Hapus BAK3S untuk BA Bongkar{" "}
              <Text as="span" fontWeight="bold">
                #{deleteBak3sTarget?.ba?.id}
              </Text>
              ? Tindakan ini tidak dapat dibatalkan.
            </Text>
          </ModalBody>
          <ModalFooter
            flexDir={{ base: "column-reverse", sm: "row" }}
            gap={2}
            px={{ base: 4, md: 6 }}
          >
            <Button
              variant="outline"
              w={{ base: "full", sm: "auto" }}
              onClick={closeDeleteBak3s}
            >
              Batal
            </Button>
            <Button
              colorScheme="red"
              w={{ base: "full", sm: "auto" }}
              onClick={handleDeleteBak3s}
              isLoading={isDeletingBak3s}
            >
              Hapus
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isCreateBAOpen}
        onClose={handleCloseModalBA}
        size={{ base: "full", md: "4xl" }}
        scrollBehavior="inside"
      >
        <ModalOverlay />
        <ModalContent maxW={{ base: "100%", md: "1100px" }} mx={{ base: 0, md: 4 }}>
          <ModalHeader px={{ base: 4, md: 6 }} pr={12}>
            Buat BA Bongkar
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody px={{ base: 4, md: 6 }}>
            <VStack spacing={5} align="stretch">
              <Text fontSize="sm" color="gray.600">
                Uji lab K3S wajib ONSPEC per tanki sebelum BA Bongkar dibuat.
                Jika OFFSPEC, lakukan pencampuran bahan kimia lalu uji ulang.
                Setiap tanki menjadi satu baris terpisah dalam dokumen BA
                Bongkar.
              </Text>
              <Text fontSize="sm" color="gray.500">
                Dokumen akan tercatat atas nama:{" "}
                <Text as="span" fontWeight="semibold" color="gray.700">
                  {user?.nama || "-"}
                </Text>
              </Text>
              {selectedIds.length > 0 && (
                <Text fontSize="sm" color="kpbpn" fontWeight="medium">
                  Terpilih: {selectedIds.length} pengisian dari{" "}
                  {selectedTangkiCount} tanki
                </Text>
              )}

              {isLoadingModal ? (
                <Center py={8}>
                  <Spinner color="kpbpn" />
                </Center>
              ) : tangkiGroups.length === 0 ? (
                <Center py={8}>
                  <Text color="gray.500">
                    Tidak ada pengisian tanki yang belum memiliki BA Bongkar
                  </Text>
                </Center>
              ) : (
                <VStack
                  spacing={4}
                  align="stretch"
                  maxH={{ base: "none", md: "420px" }}
                  overflowY="auto"
                >
                  {tangkiGroups.map((group) => {
                    const selectedInGroup = group.items.filter((item) =>
                      selectedIds.includes(item.id),
                    ).length;
                    const allSelected =
                      group.items.length > 0 &&
                      selectedInGroup === group.items.length;
                    const someSelected = selectedInGroup > 0 && !allSelected;
                    const ukuran = getBaUkuran(group.tangkiId);
                    const latestUji = getLatestUjiLab(
                      ujiLabList,
                      group.tangkiId,
                    );
                    const siapBA = isUjiLabSiapBA(latestUji);

                    return (
                      <Box
                        key={group.tangkiId}
                        borderWidth="1px"
                        borderRadius="md"
                        p={3}
                      >
                        <HStack
                          justify="space-between"
                          mb={3}
                          align="start"
                          flexWrap="wrap"
                          gap={2}
                        >
                          <Checkbox
                            isChecked={allSelected}
                            isIndeterminate={someSelected}
                            isDisabled={!siapBA}
                            onChange={(e) =>
                              toggleSelectTangkiGroup(group, e.target.checked)
                            }
                          >
                            <Text fontWeight="semibold" fontSize="sm">
                              Tanki {group.kode}
                            </Text>
                          </Checkbox>
                          <HStack spacing={2} flexWrap="wrap">
                            {latestUji ? (
                              <Badge
                                colorScheme={
                                  latestUji.kualitas === "ONSPEC"
                                    ? "green"
                                    : "red"
                                }
                              >
                                {latestUji.kualitas}
                              </Badge>
                            ) : (
                              <Badge colorScheme="gray">Belum uji lab</Badge>
                            )}
                            <Text fontSize="xs" color="gray.500">
                              {selectedInGroup}/{group.items.length} terpilih
                            </Text>
                          </HStack>
                        </HStack>
                        {latestUji && (
                          <Text fontSize="xs" color="gray.600" mb={2}>
                            {formatDate(latestUji.tanggal || latestUji.createdAt)}{" "}
                            · API {latestUji.api} · BSNW {latestUji.BSNW} · Suhu{" "}
                            {latestUji.suhu} · SG {latestUji.sg}
                          </Text>
                        )}
                        {!siapBA && (
                          <Text fontSize="sm" color="red.500" mb={3}>
                            {latestUji?.kualitas === "OFFSPEC"
                              ? "Hasil OFFSPEC. Lakukan pencampuran bahan kimia, lalu uji ulang."
                              : latestUji?.BABongkarId
                                ? "Uji lab terakhir sudah dipakai BA Bongkar. Lakukan uji lab baru."
                                : "Belum ada uji lab K3S untuk tanki ini."}
                          </Text>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          colorScheme="orange"
                          mb={3}
                          onClick={() => {
                            setUjiLabTarget(group);
                            setUjiLabForm(emptyUjiLabForm());
                            onUjiLabOpen();
                          }}
                        >
                          Tambah Uji Lab
                        </Button>
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} mb={3}>
                          <FormControl
                            isRequired
                            isInvalid={
                              showUkuranError &&
                              selectedInGroup > 0 &&
                              !isUkuranValueFilled(ukuran.ukuranCairan)
                            }
                          >
                            <FormLabel fontSize="sm">
                              Ukuran Cairan (cm)
                            </FormLabel>
                            <Input
                              type="number"
                              min={0}
                              size="sm"
                              value={ukuran.ukuranCairan}
                              onChange={(e) =>
                                handleBaUkuranChange(
                                  group.tangkiId,
                                  "ukuranCairan",
                                  e.target.value,
                                )
                              }
                              placeholder="Ukuran cairan tanki ini"
                            />
                            <FormErrorMessage>
                              Ukuran cairan wajib diisi
                            </FormErrorMessage>
                          </FormControl>
                          <FormControl
                            isRequired
                            isInvalid={
                              showUkuranError &&
                              selectedInGroup > 0 &&
                              !isUkuranValueFilled(ukuran.ukuranAir)
                            }
                          >
                            <FormLabel fontSize="sm">Ukuran Air (cm)</FormLabel>
                            <Input
                              type="number"
                              min={0}
                              size="sm"
                              value={ukuran.ukuranAir}
                              onChange={(e) =>
                                handleBaUkuranChange(
                                  group.tangkiId,
                                  "ukuranAir",
                                  e.target.value,
                                )
                              }
                              placeholder="Ukuran air tanki ini"
                            />
                            <FormErrorMessage>
                              Ukuran air wajib diisi
                            </FormErrorMessage>
                          </FormControl>
                        </SimpleGrid>
                        <Stack display={{ base: "flex", md: "none" }} spacing={2}>
                          {group.items.map((item) => {
                            const isSelected = selectedIds.includes(item.id);

                            return (
                              <Box
                                key={item.id}
                                p={3}
                                borderWidth="1px"
                                borderRadius="md"
                                bg={isSelected ? "orange.50" : "white"}
                                borderColor={
                                  isSelected ? "orange.300" : "gray.200"
                                }
                                opacity={siapBA ? 1 : 0.7}
                              >
                                <HStack align="start" spacing={3}>
                                  <Checkbox
                                    mt={1}
                                    isChecked={isSelected}
                                    isDisabled={!siapBA}
                                    onChange={() => toggleSelectModalItem(item)}
                                  />
                                  <SimpleGrid columns={2} spacing={2} flex={1}>
                                    <MobileField label="Tanggal">
                                      {formatDate(
                                        item.tanggal || item.createdAt,
                                      )}
                                    </MobileField>
                                    <MobileField label="Nomor Surat BAST">
                                      {item.nomorSurat || "-"}
                                    </MobileField>
                                    <MobileField label="Gross">
                                      <VolumeMultiSatuan
                                        volume={item.gross}
                                        satuan={getPengisianSatuanOrDefault(
                                          item,
                                        )}
                                      />
                                    </MobileField>
                                    <MobileField label="Net">
                                      <VolumeMultiSatuan
                                        volume={item.net}
                                        satuan={getPengisianSatuanOrDefault(
                                          item,
                                        )}
                                      />
                                    </MobileField>
                                  </SimpleGrid>
                                </HStack>
                              </Box>
                            );
                          })}
                        </Stack>
                        <Box
                          display={{ base: "none", md: "block" }}
                          overflowX="auto"
                        >
                          <Table size="sm" minW="520px">
                            <Thead bg="gray.50">
                              <Tr>
                                <Th w="40px" />
                                <Th>Tanggal</Th>
                                <Th>Gross</Th>
                                <Th>Net</Th>
                                <Th>Nomor Surat BAST</Th>
                              </Tr>
                            </Thead>
                            <Tbody>
                              {group.items.map((item) => {
                                const isSelected = selectedIds.includes(item.id);

                                return (
                                  <Tr
                                    key={item.id}
                                    bg={isSelected ? "orange.50" : undefined}
                                  >
                                    <Td>
                                      <Checkbox
                                        isChecked={isSelected}
                                        isDisabled={!siapBA}
                                        onChange={() =>
                                          toggleSelectModalItem(item)
                                        }
                                      />
                                    </Td>
                                    <Td>
                                      {formatDate(
                                        item.tanggal || item.createdAt,
                                      )}
                                    </Td>
                                    <Td>
                                      <VolumeMultiSatuan
                                        volume={item.gross}
                                        satuan={getPengisianSatuanOrDefault(
                                          item,
                                        )}
                                      />
                                    </Td>
                                    <Td>
                                      <VolumeMultiSatuan
                                        volume={item.net}
                                        satuan={getPengisianSatuanOrDefault(
                                          item,
                                        )}
                                      />
                                    </Td>
                                    <Td>{item.nomorSurat || "-"}</Td>
                                  </Tr>
                                );
                              })}
                            </Tbody>
                          </Table>
                        </Box>
                      </Box>
                    );
                  })}
                </VStack>
              )}

              <Divider />

              <FormControl isRequired>
                <FormLabel>Tanggal BA Bongkar</FormLabel>
                <Input
                  type="date"
                  value={baTanggal}
                  onChange={(e) => setBaTanggal(e.target.value)}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter
            flexDir={{ base: "column-reverse", sm: "row" }}
            gap={2}
            px={{ base: 4, md: 6 }}
          >
            <Button
              variant="outline"
              w={{ base: "full", sm: "auto" }}
              onClick={handleCloseModalBA}
            >
              Batal
            </Button>
            <Button
              colorScheme="orange"
              w={{ base: "full", sm: "auto" }}
              onClick={handleSubmitBABongkar}
              isLoading={isSubmittingBA}
              isDisabled={isLoadingModal || !tangkiGroups.length}
            >
              Simpan
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isUjiLabOpen}
        onClose={handleCloseUjiLab}
        size={{ base: "full", md: "lg" }}
        scrollBehavior="inside"
      >
        <ModalOverlay />
        <ModalContent mx={{ base: 0, md: 4 }}>
          <ModalHeader px={{ base: 4, md: 6 }} pr={12}>
            Tambah Uji Lab K3S
            {ujiLabTarget?.kode ? ` — Tanki ${ujiLabTarget.kode}` : ""}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody px={{ base: 4, md: 6 }}>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>Tanggal Uji</FormLabel>
                <Input
                  type="date"
                  value={ujiLabForm.tanggal}
                  onChange={(e) =>
                    handleUjiLabFieldChange("tanggal", e.target.value)
                  }
                />
              </FormControl>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                <FormControl isRequired>
                  <FormLabel>API</FormLabel>
                  <Input
                    type="number"
                    step="0.001"
                    value={ujiLabForm.api}
                    onChange={(e) =>
                      handleUjiLabFieldChange("api", e.target.value)
                    }
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>BSNW</FormLabel>
                  <Input
                    type="number"
                    step="0.001"
                    value={ujiLabForm.BSNW}
                    onChange={(e) =>
                      handleUjiLabFieldChange("BSNW", e.target.value)
                    }
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Suhu</FormLabel>
                  <Input
                    type="number"
                    step="0.001"
                    value={ujiLabForm.suhu}
                    onChange={(e) =>
                      handleUjiLabFieldChange("suhu", e.target.value)
                    }
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>SG</FormLabel>
                  <Input
                    type="number"
                    step="0.001"
                    value={ujiLabForm.sg}
                    onChange={(e) =>
                      handleUjiLabFieldChange("sg", e.target.value)
                    }
                  />
                </FormControl>
              </SimpleGrid>
              <FormControl isRequired>
                <FormLabel>Kualitas</FormLabel>
                <Select
                  placeholder="Pilih kualitas"
                  value={ujiLabForm.kualitas}
                  onChange={(e) =>
                    handleUjiLabFieldChange("kualitas", e.target.value)
                  }
                >
                  <option value="ONSPEC">ONSPEC</option>
                  <option value="OFFSPEC">OFFSPEC</option>
                </Select>
                {ujiLabForm.kualitas === "OFFSPEC" && (
                  <FormHelperText color="red.500">
                    Perlu pencampuran bahan kimia, lalu uji ulang
                  </FormHelperText>
                )}
                {ujiLabForm.kualitas === "ONSPEC" && (
                  <FormHelperText color="green.600">
                    Tanki siap untuk pembuatan BA Bongkar
                  </FormHelperText>
                )}
              </FormControl>
              <FormControl>
                <FormLabel>Foto Uji Lab</FormLabel>
                <Input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={(e) =>
                    handleUjiLabFotoChange(e.target.files?.[0] || null)
                  }
                />
                {ujiLabForm.picPreview && (
                  <Image
                    src={ujiLabForm.picPreview}
                    alt="Preview foto uji lab"
                    mt={3}
                    maxH="180px"
                    maxW="100%"
                    objectFit="cover"
                    borderRadius="md"
                  />
                )}
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter
            flexDir={{ base: "column-reverse", sm: "row" }}
            gap={2}
            px={{ base: 4, md: 6 }}
          >
            <Button
              variant="outline"
              w={{ base: "full", sm: "auto" }}
              onClick={handleCloseUjiLab}
            >
              Batal
            </Button>
            <Button
              colorScheme="orange"
              w={{ base: "full", sm: "auto" }}
              onClick={handleSubmitUjiLab}
              isLoading={isSubmittingUjiLab}
            >
              Simpan Uji Lab
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </LayoutKPBPN>
  );
};

export default BABongkar;
