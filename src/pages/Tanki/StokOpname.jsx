import React, { useState, useEffect, useRef, useMemo } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import axios from "axios";
import ReactPaginate from "react-paginate";
import ExcelJS from "exceljs";
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
  Text,
  useToast,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Select,
  SimpleGrid,
  Divider,
  Collapse,
  IconButton,
  VStack,
  Flex,
  Spacer,
  Skeleton,
  Stack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Badge,
} from "@chakra-ui/react";
import {
  BsChevronDown,
  BsChevronUp,
  BsPencil,
  BsTrash,
  BsFileEarmarkExcel,
} from "react-icons/bs";
import LayoutKPBPN from "../../Componets/KPBPN/LayoutKPBPN";
import {
  formatVolumeNumber,
  convertVolumeToAllUnits,
} from "../../lib/volumeSatuan";
import "../../Style/pagination.css";

const API_BASE = import.meta.env.VITE_REACT_APP_API_BASE_URL;
const SATUAN = "barrel";
const TABLE_COL_SPAN = 17;
const EXPAND_COL_SPAN = 14;

const roundBarrel = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 1000) / 1000;

const calcBsnwGabungan = (sedimen, volume) => {
  const totalVolume = Number(volume) || 0;
  const totalSedimen = Number(sedimen) || 0;
  if (totalVolume <= 0) return null;
  return (
    Math.round(((totalSedimen / totalVolume) * 100 + Number.EPSILON) * 1000) /
    1000
  );
};

const groupStokByTanggal = (items) => {
  const groups = [];
  const map = new Map();

  for (const item of items) {
    const key = item.tanggal || "";
    if (!map.has(key)) {
      const group = {
        tanggal: key,
        items: [],
        totalMasuk: 0,
        totalKeluar: 0,
        totalBsnwMasukVolume: 0,
        totalBsnwMasukSedimen: 0,
      };
      map.set(key, group);
      groups.push(group);
    }

    const group = map.get(key);
    group.items.push(item);
    group.totalMasuk += Number(item.masuk) || 0;
    group.totalKeluar += Number(item.keluar) || 0;
    group.totalBsnwMasukVolume += Number(item.bsnwMasukVolume) || 0;
    group.totalBsnwMasukSedimen += Number(item.bsnwMasukSedimen) || 0;
  }

  return groups.map((group) => ({
    ...group,
    totalMasuk: roundBarrel(group.totalMasuk),
    totalKeluar: roundBarrel(group.totalKeluar),
    totalBsnwMasukVolume: roundBarrel(group.totalBsnwMasukVolume),
    totalBsnwMasukSedimen: roundBarrel(group.totalBsnwMasukSedimen),
    BSNWGabunganMasuk: calcBsnwGabungan(
      group.totalBsnwMasukSedimen,
      group.totalBsnwMasukVolume,
    ),
  }));
};

const toLocalInputDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const getDefaultStartDate = () => {
  const now = new Date();
  return toLocalInputDate(new Date(now.getFullYear(), now.getMonth(), 1));
};

const getDefaultEndDate = () => toLocalInputDate(new Date());

const getTodayInputDate = () => toLocalInputDate(new Date());

const toDateKey = (date) => {
  if (!date) return "";
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}/.test(date)) {
    return date.slice(0, 10);
  }
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";
  return toLocalInputDate(parsed);
};

const isDateInRange = (tanggal, startDate, endDate) => {
  const key = toDateKey(tanggal);
  if (!key) return false;
  if (startDate && key < startDate) return false;
  if (endDate && key > endDate) return false;
  return true;
};

const toInputDate = (date) => {
  if (!date) return getTodayInputDate();
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}/.test(date)) {
    return date.slice(0, 10);
  }
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return getTodayInputDate();
  return toLocalInputDate(parsed);
};

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDecimalInput = (value) => {
  if (value === null || value === undefined || value === "") return "";
  return String(value).replace(".", ",");
};

const parseDecimalInput = (value) => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isNaN(value) ? null : value;
  const normalized = String(value).trim().replace(",", ".");
  const num = Number(normalized);
  return Number.isNaN(num) ? null : num;
};

const formatAngka = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  const angka = Number(value);
  if (Number.isNaN(angka)) return String(value);
  return formatVolumeNumber(angka);
};

const formatBarrel = (volume) => {
  if (volume === null || volume === undefined || volume === "") return "-";
  return `${formatVolumeNumber(volume)} ${SATUAN}`;
};

const getMasukBsnw = (item) => {
  if (item?.BSNW != null && item.BSNW !== "") return item.BSNW;
  const fromSj = (item?.suratJalans || [])
    .map((sj) => sj.BSNW)
    .filter((value) => value != null && value !== "");
  if (!fromSj.length) return null;
  if (fromSj.length === 1) return fromSj[0];
  return [...new Set(fromSj.map((value) => formatAngka(value)))].join(", ");
};

const formatBsnw = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "string" && value.includes(",")) return value;
  return formatAngka(value);
};

const formatBsnwPercent = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  return `${formatBsnw(value)}%`;
};

const formatVolumeSatuan = (volume, satuan) => {
  if (volume === null || volume === undefined || volume === "") return "-";
  return `${formatAngka(volume)} ${satuan || SATUAN}`;
};

const kualitasColor = (kualitas) => {
  if (kualitas === "ONSPEC") return "green";
  if (kualitas === "OFFSPEC") return "red";
  return "gray";
};

const calcVolumePreview = (tinggi, panjang, lebar) => {
  const height = parseDecimalInput(tinggi);
  const length = parseDecimalInput(panjang);
  const width = parseDecimalInput(lebar);
  if (
    height === null ||
    length === null ||
    width === null ||
    length <= 0 ||
    width <= 0
  ) {
    return null;
  }
  const liter = (height * length * width) / 1000;
  const converted = convertVolumeToAllUnits(liter, "liter");
  if (!converted) return null;
  return roundBarrel(converted.barrel);
};

const hasTankiDimensi = (tanki) => {
  const length = parseDecimalInput(tanki?.panjang);
  const width = parseDecimalInput(tanki?.lebar);
  return length !== null && width !== null && length > 0 && width > 0;
};

const decimalFieldSchema = (label) =>
  Yup.string()
    .required(`${label} wajib diisi`)
    .test("is-decimal", `${label} harus angka valid`, (value) => {
      const num = parseDecimalInput(value);
      return num !== null && num >= 0;
    });

const stockOpnameSchema = Yup.object({
  tanggal: Yup.string().required("Tanggal wajib diisi"),
  tankiId: Yup.string().required("Tanki wajib dipilih"),
  tinggiMinyak: decimalFieldSchema("Tinggi minyak"),
  tinggiAir: decimalFieldSchema("Tinggi air").test(
    "lte-minyak",
    "Tinggi air tidak boleh lebih besar dari tinggi minyak",
    function (value) {
      const tinggiAir = parseDecimalInput(value);
      const tinggiMinyak = parseDecimalInput(this.parent.tinggiMinyak);
      if (tinggiAir === null || tinggiMinyak === null) return true;
      return tinggiAir <= tinggiMinyak;
    },
  ),
  suhu: Yup.string()
    .nullable()
    .test("is-decimal", "Suhu harus angka valid", (value) => {
      if (value === null || value === undefined || value === "") return true;
      return parseDecimalInput(value) !== null;
    }),
});

const emptyFormValues = () => ({
  tanggal: getTodayInputDate(),
  tankiId: "",
  tinggiMinyak: "",
  tinggiAir: "",
  suhu: "",
});

const excelNumber = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  const num = Number(value);
  return Number.isNaN(num) ? "-" : num;
};

const toBarrel = (value, satuan) => {
  if (value === null || value === undefined || value === "") return 0;
  const converted = convertVolumeToAllUnits(value, satuan);
  if (!converted) return 0;
  return roundBarrel(converted.barrel);
};

const pengisianBarrel = (masuk, field, barrelField) => {
  if (masuk[barrelField] != null) {
    return roundBarrel(Number(masuk[barrelField]) || 0);
  }
  return toBarrel(masuk[field], masuk.satuan);
};

const buildExportGroups = (items) => {
  const dateMap = new Map();
  const dateOrder = [];

  for (const item of items) {
    const tanggal = item.tanggal || "";
    if (!dateMap.has(tanggal)) {
      const dateGroup = { tanggal, tanks: [], tankMap: new Map() };
      dateMap.set(tanggal, dateGroup);
      dateOrder.push(dateGroup);
    }

    const dateGroup = dateMap.get(tanggal);
    const tankKey = [
      item.kode || item.tankiId || "",
      roundBarrel(Number(item.volumeMinyak) || 0),
      roundBarrel(Number(item.volumeAir) || 0),
    ].join("|");

    if (!dateGroup.tankMap.has(tankKey)) {
      const tankGroup = {
        kode: item.kode || "-",
        volumeMinyak: item.volumeMinyak,
        volumeAir: item.volumeAir,
        details: [],
      };
      dateGroup.tankMap.set(tankKey, tankGroup);
      dateGroup.tanks.push(tankGroup);
    }

    const tankGroup = dateGroup.tankMap.get(tankKey);
    const pengisianList = item.detailMasuk || [];
    for (const masuk of pengisianList) {
      const suratJalans = masuk.suratJalans || [];
      const grossBarrel = pengisianBarrel(masuk, "gross", "grossBarrel");
      const kandunganAirBarrel = pengisianBarrel(
        masuk,
        "kandunganAir",
        "kandunganAirBarrel",
      );
      const nomorSurat = masuk.nomorSurat || "-";
      const pengisianKey = [
        masuk.id || "",
        grossBarrel,
        kandunganAirBarrel,
        nomorSurat,
      ].join("|");
      const detailBase = {
        pengisianKey,
        grossBarrel,
        kandunganAirBarrel,
        nomorSurat,
      };

      if (!suratJalans.length) {
        tankGroup.details.push({
          ...detailBase,
          mitraNama: "-",
          nomorSuratJalan: "-",
        });
        continue;
      }

      suratJalans.forEach((sj) => {
        tankGroup.details.push({
          ...detailBase,
          mitraNama: sj.mitraNama || "-",
          nomorSuratJalan: sj.nomor || "-",
        });
      });
    }
  }

  return dateOrder.map((dateGroup) => ({
    tanggal: dateGroup.tanggal,
    tanks: dateGroup.tanks.map((tankGroup) => {
      const details = tankGroup.details.length
        ? [...tankGroup.details].sort((a, b) => {
            const pengisianCompare = String(a.pengisianKey).localeCompare(
              String(b.pengisianKey),
            );
            if (pengisianCompare !== 0) return pengisianCompare;
            return String(a.nomorSuratJalan).localeCompare(
              String(b.nomorSuratJalan),
            );
          })
        : [
            {
              pengisianKey: "-",
              grossBarrel: null,
              kandunganAirBarrel: null,
              nomorSurat: "-",
              mitraNama: "-",
              nomorSuratJalan: "-",
            },
          ];
      return { ...tankGroup, details };
    }),
  }));
};

const isFirstConsecutive = (details, index, getKey) =>
  index === 0 || getKey(details[index - 1]) !== getKey(details[index]);

const collectConsecutiveMerges = (details, startRow, getKey) => {
  const merges = [];
  if (!details.length) return merges;

  let rangeStart = startRow;
  details.forEach((detail, index) => {
    const isLast = index === details.length - 1;
    const nextKey = isLast ? null : getKey(details[index + 1]);
    if (isLast || nextKey !== getKey(detail)) {
      merges.push({
        startRow: rangeStart,
        endRow: startRow + index,
      });
      rangeStart = startRow + index + 1;
    }
  });
  return merges;
};

const EXCEL_BORDER = {
  top: { style: "thin" },
  left: { style: "thin" },
  bottom: { style: "thin" },
  right: { style: "thin" },
};

const mergeAndCenter = (worksheet, startRow, endRow, col, fillArgb) => {
  if (endRow > startRow) {
    worksheet.mergeCells(startRow, col, endRow, col);
  }

  for (let rowNumber = startRow; rowNumber <= endRow; rowNumber += 1) {
    const cell = worksheet.getCell(rowNumber, col);
    cell.border = EXCEL_BORDER;
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: fillArgb },
    };
    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };
    if (typeof cell.value === "number") {
      cell.numFmt = Number.isInteger(cell.value) ? "#,##0" : "#,##0.000";
    }
  }
};

const EXCEL_HEADER_STYLE = {
  font: { bold: true, color: { argb: "FFFFFF" } },
  fill: {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "4472C4" },
  },
  alignment: { horizontal: "center", vertical: "middle", wrapText: true },
  border: {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  },
};

const EXCEL_DATA_STYLE = {
  border: {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  },
  alignment: { vertical: "middle", wrapText: true },
};

const EXCEL_MASUK_STYLE = {
  ...EXCEL_DATA_STYLE,
  fill: {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "E2EFDA" },
  },
};

const applyExcelHeader = (row) => {
  row.eachCell((cell) => {
    cell.style = EXCEL_HEADER_STYLE;
  });
  row.height = 24;
};

const applyExcelRowStyle = (row, style = EXCEL_DATA_STYLE) => {
  row.eachCell((cell) => {
    cell.style = style;
    if (typeof cell.value === "number") {
      cell.numFmt = Number.isInteger(cell.value) ? "#,##0" : "#,##0.000";
    }
  });
};

const autoFitColumns = (worksheet) => {
  worksheet.columns.forEach((column) => {
    let maxLength = 12;
    column.eachCell({ includeEmpty: true }, (cell) => {
      const columnLength = cell.value ? cell.value.toString().length : 10;
      if (columnLength > maxLength) {
        maxLength = columnLength;
      }
    });
    column.width = Math.min(maxLength + 2, 40);
  });
};

const MobileField = ({ label, children }) => (
  <Box>
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
    <Box fontSize="sm" color="gray.700">
      {children}
    </Box>
  </Box>
);

const StokOpname = () => {
  const toast = useToast();
  const dataListRef = useRef(null);
  const formikRef = useRef(null);
  const {
    isOpen: isFormOpen,
    onOpen: onFormOpen,
    onClose: onFormClose,
  } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const {
    isOpen: isExportOpen,
    onOpen: onExportOpen,
    onClose: onExportClose,
  } = useDisclosure();

  const [dataStok, setDataStok] = useState([]);
  const [dataTanki, setDataTanki] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [page, setPage] = useState(0);
  const [limit] = useState(50);
  const [pages, setPages] = useState(0);
  const [rows, setRows] = useState(0);
  const [totalMasuk, setTotalMasuk] = useState(0);
  const [totalKeluar, setTotalKeluar] = useState(0);
  const [totalStok, setTotalStok] = useState(0);
  const [totalBSNWGabunganMasuk, setTotalBSNWGabunganMasuk] = useState(null);

  const [tanggalAwal, setTanggalAwal] = useState(getDefaultStartDate);
  const [tanggalAkhir, setTanggalAkhir] = useState(getDefaultEndDate);
  const [tangkiFilterId, setTangkiFilterId] = useState("");
  const [exportStartDate, setExportStartDate] = useState(getDefaultStartDate);
  const [exportEndDate, setExportEndDate] = useState(getDefaultEndDate);
  const [isExporting, setIsExporting] = useState(false);

  const hasActiveFilter =
    Boolean(tanggalAwal) || Boolean(tanggalAkhir) || Boolean(tangkiFilterId);

  const resetFilter = () => {
    setTanggalAwal(getDefaultStartDate());
    setTanggalAkhir(getDefaultEndDate());
    setTangkiFilterId("");
  };

  const scrollToDataList = () => {
    dataListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const changePage = ({ selected }) => {
    setPage(selected);
    setExpandedKeys([]);
    scrollToDataList();
  };

  const fetchDataTanki = async () => {
    try {
      const res = await axios.get(`${API_BASE}/tanki/get/tanki`);
      setDataTanki(res.data.result || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDataStokOpname = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/stock-opname/get`, {
        params: {
          page,
          limit,
          startDate: tanggalAwal || undefined,
          endDate: tanggalAkhir || undefined,
          tankiId: tangkiFilterId || undefined,
        },
      });
      setDataStok(res.data.result || []);
      setPage(res.data.page ?? page);
      setPages(res.data.totalPage || 0);
      setRows(res.data.totalRows || 0);
      setTotalMasuk(res.data.totalMasuk || 0);
      setTotalKeluar(res.data.totalKeluar || 0);
      setTotalStok(res.data.totalStok || 0);
      setTotalBSNWGabunganMasuk(res.data.totalBSNWGabunganMasuk ?? null);
      setExpandedKeys([]);
    } catch (err) {
      console.error(err);
      setDataStok([]);
      setRows(0);
      setPages(0);
      setTotalBSNWGabunganMasuk(null);
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

  const toggleExpand = (key) => {
    setExpandedKeys((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key],
    );
  };

  const openAddForm = () => {
    setEditingItem(null);
    onFormOpen();
  };

  const openEditForm = (item) => {
    setEditingItem(item);
    onFormOpen();
  };

  const handleCloseForm = () => {
    formikRef.current?.resetForm();
    setEditingItem(null);
    onFormClose();
  };

  const openDeleteConfirm = (item) => {
    setDeleteTarget(item);
    onDeleteOpen();
  };

  const closeDeleteModal = () => {
    setDeleteTarget(null);
    onDeleteClose();
  };

  const openExportModal = () => {
    setExportStartDate(tanggalAwal || getDefaultStartDate());
    setExportEndDate(tanggalAkhir || getDefaultEndDate());
    onExportOpen();
  };

  const closeExportModal = () => {
    if (isExporting) return;
    onExportClose();
  };

  const fetchAllStokOpnameForExport = async (startDate, endDate) => {
    const exportLimit = 200;
    let currentPage = 0;
    let totalPage = 1;
    const allRows = [];

    do {
      const res = await axios.get(`${API_BASE}/stock-opname/get`, {
        params: {
          page: currentPage,
          limit: exportLimit,
          startDate,
          endDate,
        },
      });
      allRows.push(...(res.data.result || []));
      totalPage = Math.max(res.data.totalPage || 1, 1);
      currentPage += 1;
    } while (currentPage < totalPage);

    return allRows.filter((item) =>
      isDateInRange(item.tanggal, startDate, endDate),
    );
  };

  const downloadExcel = async () => {
    if (!exportStartDate || !exportEndDate) {
      toast({
        title: "Tanggal wajib diisi",
        description: "Pilih tanggal awal dan tanggal akhir terlebih dahulu",
        status: "warning",
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    if (exportStartDate > exportEndDate) {
      toast({
        title: "Rentang tanggal tidak valid",
        description: "Tanggal awal tidak boleh lebih besar dari tanggal akhir",
        status: "warning",
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    setIsExporting(true);
    try {
      const exportData = await fetchAllStokOpnameForExport(
        exportStartDate,
        exportEndDate,
      );

      if (!exportData.length) {
        toast({
          title: "Tidak ada data",
          description:
            "Tidak ada data stok opname pada rentang tanggal tersebut",
          status: "info",
          duration: 4000,
          isClosable: true,
        });
        return;
      }

      const sortedData = [...exportData].sort((a, b) => {
        const dateCompare = String(a.tanggal || "").localeCompare(
          String(b.tanggal || ""),
        );
        if (dateCompare !== 0) return dateCompare;
        return String(a.kode || "").localeCompare(String(b.kode || ""));
      });

      const grouped = groupStokByTanggal(sortedData);
      const tankiCodes = [
        ...new Set(sortedData.map((item) => item.kode || "-")),
      ].sort((a, b) => a.localeCompare(b));

      const exportGroups = buildExportGroups(sortedData);

      const workbook = new ExcelJS.Workbook();
      workbook.creator = "KPBPN";
      workbook.created = new Date();

      const detailSheet = workbook.addWorksheet("Stok Opname");
      const detailColCount = 10;
      const mergeDetailTitle = (rowNumber) => {
        detailSheet.mergeCells(rowNumber, 1, rowNumber, detailColCount);
      };

      detailSheet.addRow(["Laporan Stok Opname Tanki"]);
      mergeDetailTitle(1);
      detailSheet.getCell("A1").font = { bold: true, size: 14 };
      detailSheet.addRow([
        `Periode: ${formatDate(exportStartDate)} s.d. ${formatDate(exportEndDate)}`,
      ]);

      mergeDetailTitle(4);
      detailSheet.addRow([]);

      const detailHeaders = [
        "No",
        "Tanggal",
        "Tanki",
        "Volume Minyak (Stok Opname) (barrel)",
        "Volume Air (Stok Opname) (barrel)",
        "Volume Minyak (Gross Pengisian) (barrel)",
        "Volume Air (Kandungan Air Pengisian) (barrel)",
        "Nomor Surat",
        "Nama Mitra",
        "Nomor Surat Jalan",
      ];
      applyExcelHeader(detailSheet.addRow(detailHeaders));

      const dateMerges = [];
      const tankMerges = [];
      const pengisianMerges = [];
      const suratJalanMerges = [];
      let groupNumber = 1;
      const getPengisianKey = (detail) => detail.pengisianKey;
      const getSuratJalanKey = (detail) => detail.nomorSuratJalan;

      exportGroups.forEach((dateGroup) => {
        const dateStartRow = detailSheet.lastRow.number + 1;

        dateGroup.tanks.forEach((tankGroup, tankIndex) => {
          const tankStartRow = detailSheet.lastRow.number + 1;

          tankGroup.details.forEach((detail, detailIndex) => {
            const isFirstDateRow = tankIndex === 0 && detailIndex === 0;
            const isFirstTankRow = detailIndex === 0;
            const isFirstPengisianRow = isFirstConsecutive(
              tankGroup.details,
              detailIndex,
              getPengisianKey,
            );
            const isFirstSjRow = isFirstConsecutive(
              tankGroup.details,
              detailIndex,
              getSuratJalanKey,
            );
            const dataRow = detailSheet.addRow([
              isFirstTankRow ? groupNumber : "",
              isFirstDateRow ? formatDate(dateGroup.tanggal) : "",
              isFirstTankRow ? tankGroup.kode || "-" : "",
              isFirstTankRow ? excelNumber(tankGroup.volumeMinyak) : "",
              isFirstTankRow ? excelNumber(tankGroup.volumeAir) : "",
              isFirstPengisianRow
                ? detail.grossBarrel == null
                  ? "-"
                  : excelNumber(detail.grossBarrel)
                : "",
              isFirstPengisianRow
                ? detail.kandunganAirBarrel == null
                  ? "-"
                  : excelNumber(detail.kandunganAirBarrel)
                : "",
              isFirstPengisianRow ? detail.nomorSurat : "",
              detail.mitraNama,
              isFirstSjRow ? detail.nomorSuratJalan : "",
            ]);
            applyExcelRowStyle(dataRow, EXCEL_MASUK_STYLE);
          });

          const tankEndRow = detailSheet.lastRow.number;
          tankMerges.push({
            startRow: tankStartRow,
            endRow: tankEndRow,
          });
          pengisianMerges.push(
            ...collectConsecutiveMerges(
              tankGroup.details,
              tankStartRow,
              getPengisianKey,
            ),
          );
          suratJalanMerges.push(
            ...collectConsecutiveMerges(
              tankGroup.details,
              tankStartRow,
              getSuratJalanKey,
            ),
          );
          groupNumber += 1;
        });

        dateMerges.push({
          startRow: dateStartRow,
          endRow: detailSheet.lastRow.number,
        });
      });

      dateMerges.forEach(({ startRow, endRow }) => {
        mergeAndCenter(detailSheet, startRow, endRow, 2, "D6EAF8");
      });
      tankMerges.forEach(({ startRow, endRow }) => {
        [1, 3, 4, 5].forEach((col) => {
          mergeAndCenter(detailSheet, startRow, endRow, col, "D6EAF8");
        });
      });
      pengisianMerges.forEach(({ startRow, endRow }) => {
        [6, 7, 8].forEach((col) => {
          mergeAndCenter(detailSheet, startRow, endRow, col, "E2EFDA");
        });
      });
      suratJalanMerges.forEach(({ startRow, endRow }) => {
        mergeAndCenter(detailSheet, startRow, endRow, 10, "E2EFDA");
      });

      autoFitColumns(detailSheet);
      detailSheet.views = [{ state: "frozen", ySplit: 6 }];

      const rekapSheet = workbook.addWorksheet("Rekap per Tanggal");
      rekapSheet.addRow(["Rekap Stok Opname per Tanggal — Semua Tanki"]);
      rekapSheet.mergeCells(1, 1, 1, tankiCodes.length + 4);
      rekapSheet.getCell("A1").font = { bold: true, size: 14 };
      rekapSheet.addRow([
        `Periode: ${formatDate(exportStartDate)} s.d. ${formatDate(exportEndDate)}`,
      ]);
      rekapSheet.mergeCells(2, 1, 2, tankiCodes.length + 4);
      rekapSheet.addRow([`Satuan: ${SATUAN}`]);
      rekapSheet.mergeCells(3, 1, 3, tankiCodes.length + 4);
      rekapSheet.addRow([]);

      const rekapHeaders = [
        "Tanggal",
        ...tankiCodes.map((kode) => `Stok ${kode}`),
        "Total Stok (barrel)",
        "Total Masuk (barrel)",
        "Total Keluar (barrel)",
      ];
      applyExcelHeader(rekapSheet.addRow(rekapHeaders));

      grouped.forEach((group) => {
        const stokByTanki = new Map(
          group.items.map((item) => [item.kode || "-", item.volumeBersih]),
        );
        const totalStokHari = roundBarrel(
          group.items.reduce(
            (sum, item) => sum + (Number(item.volumeBersih) || 0),
            0,
          ),
        );
        const dataRow = rekapSheet.addRow([
          formatDate(group.tanggal),
          ...tankiCodes.map((kode) => excelNumber(stokByTanki.get(kode))),
          totalStokHari,
          excelNumber(group.totalMasuk),
          excelNumber(group.totalKeluar),
        ]);
        applyExcelRowStyle(dataRow);
      });

      autoFitColumns(rekapSheet);
      rekapSheet.views = [{ state: "frozen", ySplit: 5, xSplit: 1 }];

      const filename = `Stok_Opname_${exportStartDate}_sd_${exportEndDate}.xlsx`;
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
        description: "File Excel stok opname berhasil diunduh",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onExportClose();
    } catch (err) {
      console.error(err);
      toast({
        title: "Gagal",
        description:
          err.response?.data?.error ||
          "Gagal mengekspor data stok opname ke Excel",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      await axios.post(`${API_BASE}/stock-opname/delete/${deleteTarget.id}`);
      toast({
        title: "Berhasil",
        description: "Stok opname tanki berhasil dihapus",
        status: "success",
        duration: 4000,
        isClosable: true,
      });
      closeDeleteModal();
      fetchDataStokOpname();
    } catch (err) {
      toast({
        title: "Gagal",
        description: err.response?.data?.error || err.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const submitStockOpname = async (values, { setSubmitting, resetForm }) => {
    try {
      const payload = {
        tanggal: values.tanggal,
        tankiId: values.tankiId,
        tinggiMinyak: parseDecimalInput(values.tinggiMinyak),
        tinggiAir: parseDecimalInput(values.tinggiAir),
        suhu: parseDecimalInput(values.suhu),
      };

      if (editingItem?.id) {
        await axios.post(
          `${API_BASE}/stock-opname/edit/${editingItem.id}`,
          payload,
        );
        toast({
          title: "Berhasil",
          description: "Stok opname tanki berhasil diperbarui",
          status: "success",
          duration: 4000,
          isClosable: true,
        });
      } else {
        await axios.post(`${API_BASE}/stock-opname/post`, payload);
        toast({
          title: "Berhasil",
          description: "Stok opname tanki berhasil disimpan",
          status: "success",
          duration: 4000,
          isClosable: true,
        });
      }

      resetForm();
      handleCloseForm();
      fetchDataStokOpname();
    } catch (err) {
      toast({
        title: "Gagal",
        description: err.response?.data?.error || err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderDetailMutasi = (row) => (
    <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={4}>
      <Box>
        <Heading size="xs" mb={3} color="green.700">
          Minyak Masuk · Pengisian Tanki
        </Heading>
        {row.BSNWGabunganMasuk != null && (
          <Box
            mb={3}
            p={3}
            borderRadius="md"
            bg="green.50"
            border="1px solid"
            borderColor="green.100"
          >
            <Text fontSize="sm" fontWeight="semibold" color="green.800">
              BSNW gabungan: {formatBsnwPercent(row.BSNWGabunganMasuk)}
            </Text>
            <Text fontSize="xs" color="gray.600" mt={1}>
              Total volume: {formatBarrel(row.bsnwMasukVolume)} · Total BS&W:{" "}
              {formatBarrel(row.bsnwMasukSedimen)}
            </Text>
            <Text fontSize="xs" color="gray.500">
              (Total BS&W ÷ total volume) × 100%
            </Text>
          </Box>
        )}
        {(row.detailMasuk || []).length ? (
          <Stack spacing={2}>
            {row.detailMasuk.map((item) => (
              <Box
                key={`masuk-${item.id}`}
                p={3}
                borderRadius="md"
                bg="white"
                border="1px solid"
                borderColor="gray.200"
              >
                <Text fontSize="sm" fontWeight="medium">
                  {item.nomorSurat || `Pengisian #${item.id}`}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  {formatDate(item.tanggal)}
                </Text>
                <Text fontSize="sm" mt={1}>
                  Gross: {formatBarrel(item.grossBarrel)}
                </Text>
                <Text fontSize="sm">Net: {formatBarrel(item.netBarrel)}</Text>
                <Text fontSize="sm">
                  BSNW gabungan:{" "}
                  {formatBsnwPercent(
                    item.BSNWGabungan ?? getMasukBsnw(item),
                  )}
                </Text>
                {(item.suratJalans || []).length > 0 && (
                  <Stack spacing={2} mt={2}>
                    {item.suratJalans.map((sj) => (
                      <Box
                        key={`sj-${item.id}-${sj.id}`}
                        p={2}
                        borderRadius="md"
                        bg="gray.50"
                      >
                        <Text fontSize="xs" fontWeight="medium" color="gray.700">
                          {sj.nomorSuratJalan || sj.nomor || "Surat jalan"}
                          {sj.mitraNama ? ` · ${sj.mitraNama}` : ""}
                        </Text>
                        <Text fontSize="xs" color="gray.600">
                          Volume:{" "}
                          {sj.satuan &&
                          String(sj.satuan).toLowerCase() !== "barrel"
                            ? `${formatVolumeSatuan(sj.volume, sj.satuan)} (${formatBarrel(sj.volumeBarrel)})`
                            : formatBarrel(sj.volumeBarrel ?? sj.volume)}
                        </Text>
                        <Text fontSize="xs" color="gray.600">
                          BSNW: {formatBsnwPercent(sj.BSNW)}
                        </Text>
                        <Text fontSize="xs" color="gray.600">
                          BS&W: {formatBarrel(sj.sedimenBarrel)}
                        </Text>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Box>
            ))}
          </Stack>
        ) : (
          <Text fontSize="sm" color="gray.500">
            Tidak ada pengisian tanki pada tanggal ini
          </Text>
        )}
      </Box>
      <Box>
        <Heading size="xs" mb={3} color="red.700">
          Minyak Keluar · BA Bongkar
        </Heading>
        {(row.detailKeluar || []).length ? (
          <Stack spacing={2}>
            {row.detailKeluar.map((item) => (
              <Box
                key={`keluar-${item.baId}`}
                p={3}
                borderRadius="md"
                bg="white"
                border="1px solid"
                borderColor="gray.200"
              >
                <Text fontSize="sm" fontWeight="medium">
                  BA Bongkar #{item.baId}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  {formatDate(item.tanggal)}
                </Text>
                <Text fontSize="sm" mt={1}>
                  Ukuran cairan: {formatAngka(item.ukuranCairan)}
                </Text>
                <Text fontSize="sm">
                  Ukuran air: {formatAngka(item.ukuranAir)}
                </Text>
                <Text fontSize="sm">Volume: {formatBarrel(item.volume)}</Text>
                <Text fontSize="sm">BSNW: {formatBsnw(item.BSNW)}</Text>
                {item.api != null && (
                  <Text fontSize="sm">API: {formatAngka(item.api)}</Text>
                )}
                {item.kualitas && (
                  <Badge
                    mt={1}
                    colorScheme={kualitasColor(item.kualitas)}
                    variant="subtle"
                  >
                    {item.kualitas}
                  </Badge>
                )}
              </Box>
            ))}
          </Stack>
        ) : (
          <Text fontSize="sm" color="gray.500">
            Tidak ada BA bongkar pada tanggal ini
          </Text>
        )}
      </Box>
      <Box>
        <Heading size="xs" mb={3} color="purple.700">
          BSNW · Uji Lab K3S
        </Heading>
        {(row.detailBSNW || []).length ? (
          <Stack spacing={2}>
            {row.detailBSNW.map((item) => (
              <Box
                key={`bsnw-${item.id}`}
                p={3}
                borderRadius="md"
                bg="white"
                border="1px solid"
                borderColor="gray.200"
              >
                <Text fontSize="sm" fontWeight="medium">
                  Uji Lab #{item.id}
                  {item.baId ? ` · BA #${item.baId}` : ""}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  {formatDate(item.tanggal)}
                </Text>
                <Text fontSize="sm" mt={1} fontWeight="semibold">
                  BSNW: {formatBsnw(item.BSNW)}
                </Text>
                <Text fontSize="sm">API: {formatAngka(item.api)}</Text>
                <Text fontSize="sm">SG: {formatAngka(item.sg)}</Text>
                <Text fontSize="sm">
                  Suhu:{" "}
                  {item.suhu != null ? `${formatAngka(item.suhu)} °C` : "-"}
                </Text>
                {item.kualitas && (
                  <Badge
                    mt={1}
                    colorScheme={kualitasColor(item.kualitas)}
                    variant="subtle"
                  >
                    {item.kualitas}
                  </Badge>
                )}
              </Box>
            ))}
          </Stack>
        ) : (
          <Text fontSize="sm" color="gray.500">
            Tidak ada data uji lab BSNW pada tanggal ini
          </Text>
        )}
      </Box>
    </SimpleGrid>
  );

  useEffect(() => {
    fetchDataTanki();
  }, []);

  useEffect(() => {
    setPage(0);
  }, [tanggalAwal, tanggalAkhir, tangkiFilterId]);

  useEffect(() => {
    fetchDataStokOpname();
  }, [page, limit, tanggalAwal, tanggalAkhir, tangkiFilterId]);

  const groupedStok = useMemo(() => groupStokByTanggal(dataStok), [dataStok]);

  const renderTotalHari = (group, compact = false) => (
    <HStack
      spacing={compact ? 4 : 6}
      align="start"
      justify={compact ? "flex-end" : "flex-start"}
    >
      <Box>
        <Text fontSize="xs" color="gray.500" fontWeight="semibold">
          Total masuk
        </Text>
        <Text fontSize="sm" color="green.600" fontWeight="semibold">
          {formatBarrel(group.totalMasuk)}
        </Text>
      </Box>
      <Box>
        <Text fontSize="xs" color="gray.500" fontWeight="semibold">
          Total keluar
        </Text>
        <Text fontSize="sm" color="red.600" fontWeight="semibold">
          {formatBarrel(group.totalKeluar)}
        </Text>
      </Box>
      <Box>
        <Text fontSize="xs" color="gray.500" fontWeight="semibold">
          BSNW gabungan
        </Text>
        <Text fontSize="sm" color="green.700" fontWeight="semibold">
          {formatBsnwPercent(group.BSNWGabunganMasuk)}
        </Text>
      </Box>
    </HStack>
  );

  return (
    <LayoutKPBPN>
      <Box
        bgColor="secondary"
        pb={{ base: 6, md: "40px" }}
        px={{ base: 3, sm: 4, md: 6, lg: "30px" }}
        minH="90vh"
      >
        <Container
          variant="primary"
          maxW="100%"
          p={{ base: 4, sm: 5, md: 6, lg: "30px" }}
          my={{ base: 4, md: "30px" }}
        >
          <Flex
            align={{ base: "stretch", sm: "center" }}
            direction={{ base: "column", sm: "row" }}
            gap={{ base: 3, sm: 0 }}
            mb={6}
          >
            <VStack align={{ base: "center", sm: "start" }} spacing={1}>
              <Heading
                color="kpbpn"
                size={{ base: "md", md: "lg" }}
                textAlign={{ base: "center", sm: "left" }}
              >
                Stok Opname Tanki
              </Heading>
              <Text
                fontSize="sm"
                color="gray.500"
                textAlign={{ base: "center", sm: "left" }}
              >
                Pengukuran manual harian (tinggi × panjang × lebar / 1000 =
                liter, lalu dikonversi ke barrel), plus minyak masuk dari
                pengisian tanki, keluar dari BA bongkar, dan BSNW gabungan
                minyak masuk (rata-rata tertimbang volume).
              </Text>
              <Text fontSize="sm" color="gray.500">
                Total: {rows} data
              </Text>
            </VStack>
            <Spacer />
            <HStack
              spacing={3}
              justify={{ base: "center", sm: "flex-end" }}
              w={{ base: "full", sm: "auto" }}
              flexWrap="wrap"
            >
              <Button
                leftIcon={<BsFileEarmarkExcel />}
                variant="outline"
                colorScheme="green"
                onClick={openExportModal}
                w={{ base: "full", sm: "auto" }}
              >
                Export Excel
              </Button>
              <Button
                variant="primary"
                onClick={openAddForm}
                w={{ base: "full", sm: "auto" }}
              >
                + Tambah Stok Opname
              </Button>
            </HStack>
          </Flex>

          <HStack
            spacing={4}
            mb={6}
            flexWrap="wrap"
            justify={{ base: "center", md: "flex-start" }}
          >
            <Badge colorScheme="green" px={3} py={1} borderRadius="md">
              Masuk: {formatBarrel(totalMasuk)}
            </Badge>
            <Badge colorScheme="red" px={3} py={1} borderRadius="md">
              Keluar: {formatBarrel(totalKeluar)}
            </Badge>
            <Badge colorScheme="purple" px={3} py={1} borderRadius="md">
              Stok terukur: {formatBarrel(totalStok)}
            </Badge>
            <Badge colorScheme="teal" px={3} py={1} borderRadius="md">
              BSNW gabungan: {formatBsnwPercent(totalBSNWGabunganMasuk)}
            </Badge>
          </HStack>

          <Divider mb={6} />

          <Box mb={6}>
            <Heading size="md" mb={4} color="kpbpn">
              Filter Pencarian
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="medium">
                  Tanggal Awal
                </FormLabel>
                <Input
                  bgColor="terang"
                  height="50px"
                  type="date"
                  value={tanggalAwal}
                  onChange={(e) => setTanggalAwal(e.target.value)}
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="medium">
                  Tanggal Akhir
                </FormLabel>
                <Input
                  bgColor="terang"
                  height="50px"
                  type="date"
                  value={tanggalAkhir}
                  onChange={(e) => setTanggalAkhir(e.target.value)}
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="medium">
                  Tanki
                </FormLabel>
                <Select
                  bgColor="terang"
                  height="50px"
                  placeholder="Semua tanki"
                  value={tangkiFilterId}
                  onChange={(e) => setTangkiFilterId(e.target.value)}
                >
                  {dataTanki.map((item) => (
                    <option key={item.id} value={String(item.id)}>
                      {item.kode || `Tanki #${item.id}`}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </SimpleGrid>
            {hasActiveFilter && (
              <Button
                mt={4}
                size="sm"
                variant="ghost"
                colorScheme="red"
                onClick={resetFilter}
              >
                Reset Filter
              </Button>
            )}
          </Box>

          <Divider mb={6} />

          <Box ref={dataListRef} scrollMarginTop={{ base: "72px", md: "88px" }}>
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
              ) : groupedStok.length > 0 ? (
                <Stack spacing={5}>
                  {groupedStok.map((group, groupIndex) => {
                    const startIndex = groupedStok
                      .slice(0, groupIndex)
                      .reduce((sum, item) => sum + item.items.length, 0);

                    return (
                      <Box key={group.tanggal || `group-${groupIndex}`}>
                        <HStack
                          justify="space-between"
                          align="start"
                          mb={3}
                          px={1}
                          flexWrap="wrap"
                          gap={2}
                        >
                          <Text fontWeight="bold" color="kpbpn">
                            {formatDate(group.tanggal)}
                          </Text>
                          {renderTotalHari(group, true)}
                        </HStack>
                        <Stack spacing={4}>
                          {group.items.map((item, itemIndex) => {
                            const isExpanded = expandedKeys.includes(item.id);
                            return (
                              <Box
                                key={item.id}
                                p={4}
                                borderRadius="lg"
                                border="1px solid"
                                borderColor="gray.200"
                                bg="white"
                                boxShadow="sm"
                              >
                                <HStack justify="space-between" mb={3}>
                                  <VStack align="start" spacing={0}>
                                    <Text fontSize="xs" color="gray.500">
                                      No.{" "}
                                      {page * limit +
                                        startIndex +
                                        itemIndex +
                                        1}
                                    </Text>
                                    <Text fontWeight="bold" color="kpbpn">
                                      {item.kode || "-"}
                                    </Text>
                                  </VStack>
                                </HStack>
                                <SimpleGrid columns={2} spacing={3}>
                                  <MobileField label="Tinggi Minyak">
                                    {formatAngka(item.tinggiMinyak)}
                                  </MobileField>
                                  <MobileField label="Tinggi Air">
                                    {formatAngka(item.tinggiAir)}
                                  </MobileField>
                                  <MobileField label="Suhu">
                                    {item.suhu != null
                                      ? `${formatAngka(item.suhu)} °C`
                                      : "-"}
                                  </MobileField>
                                  <MobileField label="Panjang">
                                    {formatAngka(item.panjang ?? item.tanki?.panjang)}
                                  </MobileField>
                                  <MobileField label="Lebar">
                                    {formatAngka(item.lebar ?? item.tanki?.lebar)}
                                  </MobileField>
                                  <MobileField label="Volume Minyak">
                                    {formatBarrel(item.volumeMinyak)}
                                  </MobileField>
                                  <MobileField label="Volume Air">
                                    {formatBarrel(item.volumeAir)}
                                  </MobileField>
                                  <MobileField label="Stok Terukur">
                                    {formatBarrel(item.volumeBersih)}
                                  </MobileField>
                                  <MobileField label="Masuk">
                                    {formatBarrel(item.masuk)}
                                  </MobileField>
                                  <MobileField label="Keluar">
                                    {formatBarrel(item.keluar)}
                                  </MobileField>
                                  <MobileField label="BSNW Gabungan">
                                    {formatBsnwPercent(item.BSNWGabunganMasuk)}
                                  </MobileField>
                                </SimpleGrid>
                                <HStack mt={4} spacing={2} flexWrap="wrap">
                                  <Button
                                    size="sm"
                                    variant={isExpanded ? "solid" : "outline"}
                                    colorScheme="orange"
                                    onClick={() => toggleExpand(item.id)}
                                    leftIcon={
                                      isExpanded ? (
                                        <BsChevronUp />
                                      ) : (
                                        <BsChevronDown />
                                      )
                                    }
                                  >
                                    Mutasi
                                  </Button>
                                  <IconButton
                                    aria-label="Edit stok opname"
                                    icon={<BsPencil />}
                                    size="sm"
                                    variant="ghost"
                                    colorScheme="blue"
                                    onClick={() => openEditForm(item)}
                                  />
                                  <IconButton
                                    aria-label="Hapus stok opname"
                                    icon={<BsTrash />}
                                    size="sm"
                                    variant="ghost"
                                    colorScheme="red"
                                    onClick={() => openDeleteConfirm(item)}
                                  />
                                </HStack>
                                <Collapse in={isExpanded} animateOpacity>
                                  <Box
                                    mt={4}
                                    pt={4}
                                    borderTopWidth="1px"
                                    borderColor="gray.100"
                                  >
                                    {renderDetailMutasi(item)}
                                  </Box>
                                </Collapse>
                              </Box>
                            );
                          })}
                        </Stack>
                      </Box>
                    );
                  })}
                </Stack>
              ) : (
                <Box
                  py={10}
                  textAlign="center"
                  borderRadius="lg"
                  border="1px solid"
                  borderColor="gray.200"
                  bg="white"
                >
                  <Text fontSize="lg" color="gray.500">
                    Tidak ada data stok opname
                  </Text>
                </Box>
              )}
            </Box>

            <Box
              display={{ base: "none", lg: "block" }}
              borderRadius="8px"
              overflow="hidden"
              overflowX="auto"
              border="1px solid"
              borderColor="gray.200"
            >
              <Table variant="simple" size="md" minW="1200px">
                <Thead bg="gray.50">
                  <Tr>
                    <Th textTransform="capitalize">Tanggal</Th>
                    <Th textTransform="capitalize" isNumeric>
                      Total Masuk
                    </Th>
                    <Th textTransform="capitalize" isNumeric>
                      Total Keluar
                    </Th>
                    <Th textTransform="capitalize">No.</Th>
                    <Th textTransform="capitalize">Tanki</Th>
                    <Th textTransform="capitalize" isNumeric>
                      Tinggi Minyak
                    </Th>
                    <Th textTransform="capitalize" isNumeric>
                      Tinggi Air
                    </Th>
                    <Th textTransform="capitalize" isNumeric>
                      Suhu
                    </Th>
                    <Th textTransform="capitalize" isNumeric>
                      Panjang
                    </Th>
                    <Th textTransform="capitalize" isNumeric>
                      Lebar
                    </Th>
                    <Th textTransform="capitalize" isNumeric>
                      Volume Minyak
                    </Th>
                    <Th textTransform="capitalize" isNumeric>
                      Stok Terukur
                    </Th>
                    <Th textTransform="capitalize" isNumeric>
                      Masuk
                    </Th>
                    <Th textTransform="capitalize" isNumeric>
                      Keluar
                    </Th>
                    <Th textTransform="capitalize" isNumeric>
                      BSNW Gabungan
                    </Th>
                    <Th textTransform="capitalize">Mutasi</Th>
                    <Th textTransform="capitalize">Aksi</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, idx) => (
                      <Tr key={idx}>
                        {Array.from({ length: TABLE_COL_SPAN }).map((__, i) => (
                          <Td key={i}>
                            <Skeleton height="20px" />
                          </Td>
                        ))}
                      </Tr>
                    ))
                  ) : groupedStok.length > 0 ? (
                    groupedStok.map((group, groupIndex) => {
                      const startIndex = groupedStok
                        .slice(0, groupIndex)
                        .reduce((sum, item) => sum + item.items.length, 0);
                      const rowSpan = group.items.length * 2;

                      return group.items.map((item, itemIndex) => {
                        const isFirst = itemIndex === 0;
                        const isExpanded = expandedKeys.includes(item.id);

                        return (
                          <React.Fragment key={item.id}>
                            <Tr>
                              {isFirst && (
                                <Td
                                  rowSpan={rowSpan}
                                  verticalAlign="top"
                                  bg="gray.50"
                                  minW="120px"
                                >
                                  <Text fontWeight="semibold">
                                    {formatDate(group.tanggal)}
                                  </Text>
                                </Td>
                              )}
                              {isFirst && (
                                <Td
                                  rowSpan={rowSpan}
                                  verticalAlign="top"
                                  bg="gray.50"
                                  minW="140px"
                                  isNumeric
                                >
                                  <Text
                                    fontSize="sm"
                                    color="green.600"
                                    fontWeight="semibold"
                                  >
                                    {formatBarrel(group.totalMasuk)}
                                  </Text>
                                  <Text fontSize="xs" color="gray.500" mt={2}>
                                    BSNW gabungan
                                  </Text>
                                  <Text
                                    fontSize="sm"
                                    color="green.700"
                                    fontWeight="semibold"
                                  >
                                    {formatBsnwPercent(group.BSNWGabunganMasuk)}
                                  </Text>
                                </Td>
                              )}
                              {isFirst && (
                                <Td
                                  rowSpan={rowSpan}
                                  verticalAlign="top"
                                  bg="gray.50"
                                  minW="140px"
                                  isNumeric
                                >
                                  <Text
                                    fontSize="sm"
                                    color="red.600"
                                    fontWeight="semibold"
                                  >
                                    {formatBarrel(group.totalKeluar)}
                                  </Text>
                                </Td>
                              )}
                              <Td fontWeight="medium">
                                {page * limit + startIndex + itemIndex + 1}
                              </Td>
                              <Td fontWeight="medium">{item.kode || "-"}</Td>
                              <Td isNumeric>
                                {formatAngka(item.tinggiMinyak)}
                              </Td>
                              <Td isNumeric>{formatAngka(item.tinggiAir)}</Td>
                              <Td isNumeric>
                                {item.suhu != null
                                  ? formatAngka(item.suhu)
                                  : "-"}
                              </Td>
                              <Td isNumeric>
                                {formatAngka(
                                  item.panjang ?? item.tanki?.panjang,
                                )}
                              </Td>
                              <Td isNumeric>
                                {formatAngka(item.lebar ?? item.tanki?.lebar)}
                              </Td>
                              <Td isNumeric>
                                {formatBarrel(item.volumeMinyak)}
                              </Td>
                              <Td isNumeric fontWeight="semibold">
                                {formatBarrel(item.volumeBersih)}
                              </Td>
                              <Td isNumeric color="green.600">
                                {formatBarrel(item.masuk)}
                              </Td>
                              <Td isNumeric color="red.600">
                                {formatBarrel(item.keluar)}
                              </Td>
                              <Td isNumeric>
                                {formatBsnwPercent(item.BSNWGabunganMasuk)}
                              </Td>
                              <Td>
                                <Button
                                  size="sm"
                                  variant={isExpanded ? "solid" : "outline"}
                                  colorScheme="orange"
                                  onClick={() => toggleExpand(item.id)}
                                  leftIcon={
                                    isExpanded ? (
                                      <BsChevronUp />
                                    ) : (
                                      <BsChevronDown />
                                    )
                                  }
                                >
                                  Detail
                                </Button>
                              </Td>
                              <Td>
                                <HStack spacing={1}>
                                  <IconButton
                                    aria-label="Edit stok opname"
                                    icon={<BsPencil />}
                                    size="sm"
                                    variant="ghost"
                                    colorScheme="blue"
                                    onClick={() => openEditForm(item)}
                                  />
                                  <IconButton
                                    aria-label="Hapus stok opname"
                                    icon={<BsTrash />}
                                    size="sm"
                                    variant="ghost"
                                    colorScheme="red"
                                    onClick={() => openDeleteConfirm(item)}
                                  />
                                </HStack>
                              </Td>
                            </Tr>
                            <Tr>
                              <Td
                                colSpan={EXPAND_COL_SPAN}
                                p={0}
                                borderBottom="none"
                              >
                                <Collapse in={isExpanded} animateOpacity>
                                  <Box
                                    p={4}
                                    bg="gray.50"
                                    borderTopWidth="1px"
                                    borderColor="gray.200"
                                  >
                                    {renderDetailMutasi(item)}
                                  </Box>
                                </Collapse>
                              </Td>
                            </Tr>
                          </React.Fragment>
                        );
                      });
                    })
                  ) : (
                    <Tr>
                      <Td colSpan={TABLE_COL_SPAN} textAlign="center" py={10}>
                        <Text fontSize="lg" color="gray.500">
                          Tidak ada data stok opname
                        </Text>
                      </Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </Box>
          </Box>

          {!isLoading && (
            <Flex
              className="pengeluaran-pagination"
              mt={6}
              pt={4}
              borderTop="1px solid"
              borderColor="gray.200"
              justify="space-between"
              align={{ base: "stretch", md: "center" }}
              direction={{ base: "column", md: "row" }}
              gap={4}
            >
              <Text
                fontSize="sm"
                color="gray.600"
                textAlign={{ base: "center", md: "left" }}
              >
                {rows > 0 ? (
                  <>
                    Menampilkan {page * limit + 1}–
                    {Math.min((page + 1) * limit, rows)} dari {rows} data
                    {pages > 1 && (
                      <>
                        {" "}
                        · Halaman {page + 1} dari {pages}
                      </>
                    )}
                  </>
                ) : (
                  "Tidak ada data untuk ditampilkan"
                )}
              </Text>
              {rows > 0 && (
                <Box
                  overflowX="auto"
                  py={1}
                  w={{ base: "full", md: "auto" }}
                  display="flex"
                  justifyContent={{ base: "center", md: "flex-end" }}
                >
                  <ReactPaginate
                    previousLabel="←"
                    nextLabel="→"
                    pageCount={Math.max(pages, 1)}
                    onPageChange={changePage}
                    forcePage={page}
                    activeClassName="item active"
                    breakClassName="item break-me"
                    breakLabel="..."
                    containerClassName="pagination"
                    disabledClassName="disabled-page"
                    marginPagesDisplayed={1}
                    nextClassName="item next"
                    pageClassName="item pagination-page"
                    pageRangeDisplayed={2}
                    previousClassName="item previous"
                  />
                </Box>
              )}
            </Flex>
          )}
        </Container>
      </Box>

      <Modal
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        size={{ base: "full", md: "xl" }}
        scrollBehavior="inside"
        isCentered
      >
        <ModalOverlay />
        <ModalContent
          mx={{ base: 0, md: 4 }}
          my={{ base: 0, md: "auto" }}
          borderRadius={{ base: 0, md: "md" }}
          maxH={{ base: "100vh", md: "90vh" }}
        >
          <ModalHeader>
            {editingItem
              ? "Edit Stok Opname Tanki"
              : "Tambah Stok Opname Tanki"}
          </ModalHeader>
          <ModalCloseButton />
          <Formik
            innerRef={formikRef}
            enableReinitialize
            initialValues={
              editingItem
                ? {
                    tanggal: toInputDate(editingItem.tanggal),
                    tankiId: editingItem.tankiId
                      ? String(editingItem.tankiId)
                      : "",
                    tinggiMinyak: formatDecimalInput(editingItem.tinggiMinyak),
                    tinggiAir: formatDecimalInput(editingItem.tinggiAir),
                    suhu: formatDecimalInput(editingItem.suhu),
                  }
                : emptyFormValues()
            }
            validationSchema={stockOpnameSchema}
            onSubmit={submitStockOpname}
          >
            {({
              values,
              errors,
              touched,
              isSubmitting,
              handleChange,
              handleBlur,
            }) => {
              const selectedTanki = dataTanki.find(
                (item) => String(item.id) === String(values.tankiId),
              );
              const volumeMinyak = calcVolumePreview(
                values.tinggiMinyak,
                selectedTanki?.panjang,
                selectedTanki?.lebar,
              );
              const volumeAir = calcVolumePreview(
                values.tinggiAir,
                selectedTanki?.panjang,
                selectedTanki?.lebar,
              );
              const tinggiBersih =
                parseDecimalInput(values.tinggiMinyak) !== null &&
                parseDecimalInput(values.tinggiAir) !== null
                  ? parseDecimalInput(values.tinggiMinyak) -
                    parseDecimalInput(values.tinggiAir)
                  : null;
              const volumeBersih = calcVolumePreview(
                tinggiBersih,
                selectedTanki?.panjang,
                selectedTanki?.lebar,
              );

              return (
                <Form>
                  <ModalBody>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <FormControl
                        isInvalid={touched.tanggal && errors.tanggal}
                      >
                        <FormLabel>Tanggal</FormLabel>
                        <Input
                          name="tanggal"
                          type="date"
                          bgColor="terang"
                          value={values.tanggal}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        />
                        <FormErrorMessage>{errors.tanggal}</FormErrorMessage>
                      </FormControl>
                      <FormControl
                        isInvalid={touched.tankiId && errors.tankiId}
                      >
                        <FormLabel>Tanki</FormLabel>
                        <Select
                          name="tankiId"
                          bgColor="terang"
                          placeholder="Pilih tanki"
                          value={values.tankiId}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        >
                          {dataTanki.map((item) => (
                            <option key={item.id} value={String(item.id)}>
                              {item.kode || `Tanki #${item.id}`}
                              {hasTankiDimensi(item)
                                ? ` · ${formatAngka(item.panjang)} × ${formatAngka(item.lebar)}`
                                : ""}
                            </option>
                          ))}
                        </Select>
                        <FormErrorMessage>{errors.tankiId}</FormErrorMessage>
                      </FormControl>
                      <FormControl
                        isInvalid={touched.tinggiMinyak && errors.tinggiMinyak}
                      >
                        <FormLabel>Tinggi Minyak</FormLabel>
                        <Input
                          name="tinggiMinyak"
                          type="text"
                          inputMode="decimal"
                          bgColor="terang"
                          value={values.tinggiMinyak}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder="Contoh: 120,5"
                        />
                        <FormErrorMessage>
                          {errors.tinggiMinyak}
                        </FormErrorMessage>
                      </FormControl>
                      <FormControl
                        isInvalid={touched.tinggiAir && errors.tinggiAir}
                      >
                        <FormLabel>Tinggi Air</FormLabel>
                        <Input
                          name="tinggiAir"
                          type="text"
                          inputMode="decimal"
                          bgColor="terang"
                          value={values.tinggiAir}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder="Contoh: 2,5"
                        />
                        <FormErrorMessage>{errors.tinggiAir}</FormErrorMessage>
                      </FormControl>
                      <FormControl
                        isInvalid={touched.suhu && errors.suhu}
                        gridColumn={{ md: "span 2" }}
                      >
                        <FormLabel>Suhu (°C)</FormLabel>
                        <Input
                          name="suhu"
                          type="text"
                          inputMode="decimal"
                          bgColor="terang"
                          value={values.suhu}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder="Opsional, contoh: 32,4"
                        />
                        <FormErrorMessage>{errors.suhu}</FormErrorMessage>
                      </FormControl>
                    </SimpleGrid>

                    <Box
                      mt={5}
                      p={4}
                      borderRadius="md"
                      bg="gray.50"
                      border="1px solid"
                      borderColor="gray.200"
                    >
                      <Text fontSize="sm" fontWeight="semibold" mb={2}>
                        Pratinjau volume (tinggi × panjang × lebar / 1000 =
                        liter → barrel)
                      </Text>
                      <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={3}>
                        <MobileField label="Volume Minyak">
                          {formatBarrel(volumeMinyak)}
                        </MobileField>
                        <MobileField label="Volume Air">
                          {formatBarrel(volumeAir)}
                        </MobileField>
                        <MobileField label="Stok Terukur">
                          {formatBarrel(volumeBersih)}
                        </MobileField>
                      </SimpleGrid>
                      {!selectedTanki && (
                        <Text fontSize="xs" color="gray.500" mt={2}>
                          Pilih tanki untuk menghitung volume barrel.
                        </Text>
                      )}
                      {selectedTanki && !hasTankiDimensi(selectedTanki) && (
                        <Text fontSize="xs" color="orange.600" mt={2}>
                          Tanki ini belum memiliki panjang dan lebar.
                        </Text>
                      )}
                    </Box>
                  </ModalBody>
                  <ModalFooter
                    flexDirection={{ base: "column-reverse", sm: "row" }}
                    gap={{ base: 2, sm: 0 }}
                  >
                    <Button
                      variant="ghost"
                      mr={{ base: 0, sm: 3 }}
                      onClick={handleCloseForm}
                      w={{ base: "full", sm: "auto" }}
                    >
                      Batal
                    </Button>
                    <Button
                      variant="primary"
                      type="submit"
                      isLoading={isSubmitting}
                      w={{ base: "full", sm: "auto" }}
                    >
                      Simpan
                    </Button>
                  </ModalFooter>
                </Form>
              );
            }}
          </Formik>
        </ModalContent>
      </Modal>

      <Modal isOpen={isDeleteOpen} onClose={closeDeleteModal} isCentered>
        <ModalOverlay />
        <ModalContent mx={4}>
          <ModalHeader>Hapus Stok Opname</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              Hapus stok opname tanki{" "}
              <Text as="span" fontWeight="semibold">
                {deleteTarget?.kode || "-"}
              </Text>{" "}
              tanggal {formatDate(deleteTarget?.tanggal)}?
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={closeDeleteModal}>
              Batal
            </Button>
            <Button
              colorScheme="red"
              onClick={handleDelete}
              isLoading={isDeleting}
            >
              Hapus
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isExportOpen}
        onClose={closeExportModal}
        isCentered
        size="lg"
        closeOnOverlayClick={!isExporting}
      >
        <ModalOverlay />
        <ModalContent mx={4}>
          <ModalHeader>Export Stok Opname</ModalHeader>
          <ModalCloseButton isDisabled={isExporting} />
          <ModalBody>
            <Text fontSize="sm" color="gray.600" mb={4}>
              Filter berdasarkan tanggal stok opname. Hanya data dalam rentang
              tanggal awal sampai tanggal akhir yang diunduh. Semua volume dalam
              barrel.
            </Text>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl isRequired>
                <FormLabel>Tanggal Awal</FormLabel>
                <Input
                  type="date"
                  bgColor="terang"
                  value={exportStartDate}
                  onChange={(e) => setExportStartDate(e.target.value)}
                  max={exportEndDate || undefined}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Tanggal Akhir</FormLabel>
                <Input
                  type="date"
                  bgColor="terang"
                  value={exportEndDate}
                  onChange={(e) => setExportEndDate(e.target.value)}
                  min={exportStartDate || undefined}
                />
              </FormControl>
            </SimpleGrid>
          </ModalBody>
          <ModalFooter
            flexDirection={{ base: "column-reverse", sm: "row" }}
            gap={{ base: 2, sm: 0 }}
          >
            <Button
              variant="ghost"
              mr={{ base: 0, sm: 3 }}
              onClick={closeExportModal}
              isDisabled={isExporting}
              w={{ base: "full", sm: "auto" }}
            >
              Batal
            </Button>
            <Button
              leftIcon={<BsFileEarmarkExcel />}
              colorScheme="green"
              onClick={downloadExcel}
              isLoading={isExporting}
              loadingText="Mengekspor..."
              w={{ base: "full", sm: "auto" }}
            >
              Unduh Excel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </LayoutKPBPN>
  );
};

export default StokOpname;
