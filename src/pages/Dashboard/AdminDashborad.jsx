import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { Link } from "react-router-dom";
import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  Text,
  HStack,
  Flex,
  Spacer,
  Icon,
  useColorModeValue,
  Card,
  CardBody,
  CardHeader,
  Select,
  Skeleton,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
} from "@chakra-ui/react";
import { FaCircle, FaFileAlt, FaCalendarAlt, FaChartLine } from "react-icons/fa";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import LayoutKPBPN from "../../Componets/KPBPN/LayoutKPBPN";
import {
  convertTarifFromBarrel,
  convertVolumeFromBarrel,
} from "../../lib/volumeSatuan";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const API_BASE = import.meta.env.VITE_REACT_APP_API_BASE_URL;

const MONTH_LABELS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const getSocketUrl = () => {
  const apiBase = import.meta.env.VITE_REACT_APP_API_BASE_URL || "";
  return apiBase.replace(/\/api\/?$/, "");
};

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatNumber = (value) =>
  Number(value || 0).toLocaleString("id-ID");

const formatTarif = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  const num = Number(value);
  if (Number.isNaN(num)) return "-";
  return num.toLocaleString("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDecimal = (value, digits = 2) => {
  if (value === null || value === undefined || value === "") return "-";
  const num = Number(value);
  if (Number.isNaN(num)) return "-";
  return num.toLocaleString("id-ID", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
};

const monthKey = (year, month) =>
  `${year}-${String(month).padStart(2, "0")}`;

const SATUAN_TARIF_OPTIONS = [
  { value: "barrel", label: "Barrel" },
  { value: "drum", label: "Drum" },
  { value: "liter", label: "Liter" },
];

const getTarifFormulaText = (satuan) => {
  if (satuan === "liter") {
    return "Tarif per liter = (ICP × kurs tengah × 62,5%) ÷ 158,987";
  }
  if (satuan === "drum") {
    return "Tarif per drum = (ICP × kurs tengah × 62,5%) × (200 ÷ 158,987)";
  }
  return "Tarif per barrel = ICP × kurs tengah × 62,5%";
};

function AdminDashborad() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [selectedYear, setSelectedYear] = useState(() =>
    String(new Date().getFullYear()),
  );
  const [satuanTarif, setSatuanTarif] = useState("barrel");
  const [satuanPenerimaan, setSatuanPenerimaan] = useState("barrel");
  const [satuanProduksi, setSatuanProduksi] = useState("barrel");
  const socketRef = useRef(null);

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("#374151", "#e5e7eb");
  const gridColor = useColorModeValue(
    "rgba(0,0,0,0.06)",
    "rgba(255,255,255,0.08)",
  );
  const mutedColor = useColorModeValue("gray.500", "gray.400");

  const applyDashboardData = useCallback((data) => {
    if (!data) return;
    setDashboard(data);
    setLoading(false);
  }, []);

  const fetchInitial = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/dashboard/get`);
      if (data?.success) {
        applyDashboardData(data);
      }
    } catch (err) {
      console.error("Gagal memuat dashboard:", err);
      setLoading(false);
    }
  }, [applyDashboardData]);

  useEffect(() => {
    fetchInitial();
  }, [fetchInitial]);

  useEffect(() => {
    const socketUrl = getSocketUrl();
    if (!socketUrl) return;

    const socket = io(socketUrl, {
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("dashboard:subscribe");
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("dashboard:kpbpn:data", applyDashboardData);
    socket.on("dashboard:kpbpn:update", applyDashboardData);

    return () => {
      socket.emit("dashboard:unsubscribe");
      socket.off("dashboard:kpbpn:data", applyDashboardData);
      socket.off("dashboard:kpbpn:update", applyDashboardData);
      socket.disconnect();
    };
  }, [applyDashboardData]);

  const availableYears = useMemo(() => {
    const years = new Set(
      [
        ...(dashboard?.suratJalanPerBulan || []),
        ...(dashboard?.tarifPerBulan || []),
        ...(dashboard?.penerimaanPerBulan || []),
        ...(dashboard?.produksiBak3sPerBulan || []),
      ].map((row) => row.bulan.slice(0, 4)),
    );
    years.add(String(new Date().getFullYear()));
    return Array.from(years).sort();
  }, [dashboard]);

  useEffect(() => {
    if (!availableYears.length) return;
    if (selectedYear !== "all" && !availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[availableYears.length - 1]);
    }
  }, [availableYears, selectedYear]);

  const monthlyRows = useMemo(() => {
    const rows = dashboard?.suratJalanPerBulan || [];
    if (selectedYear === "all") return rows;

    const byMonth = new Map(
      rows
        .filter((row) => row.bulan.startsWith(selectedYear))
        .map((row) => [row.bulan, row]),
    );
    const now = new Date();
    const lastMonth =
      selectedYear === String(now.getFullYear()) ? now.getMonth() + 1 : 12;
    const result = [];
    let kumulatif = 0;

    for (let month = 1; month <= lastMonth; month += 1) {
      const key = monthKey(selectedYear, month);
      const jumlah = byMonth.get(key)?.jumlah || 0;
      kumulatif += jumlah;
      result.push({
        bulan: key,
        label: `${MONTH_LABELS[month - 1]} ${selectedYear}`,
        jumlah,
        kumulatif,
      });
    }

    return result;
  }, [dashboard, selectedYear]);

  const tarifRows = useMemo(() => {
    const rows = dashboard?.tarifPerBulan || [];
    if (selectedYear === "all") return rows;

    const byMonth = new Map(
      rows
        .filter((row) => row.bulan.startsWith(selectedYear))
        .map((row) => [row.bulan, row]),
    );
    const now = new Date();
    const lastMonth =
      selectedYear === String(now.getFullYear()) ? now.getMonth() + 1 : 12;
    const result = [];

    for (let month = 1; month <= lastMonth; month += 1) {
      const key = monthKey(selectedYear, month);
      const row = byMonth.get(key);
      result.push({
        bulan: key,
        label: `${MONTH_LABELS[month - 1]} ${selectedYear}`,
        icp: row?.icp ?? null,
        kursTengah: row?.kursTengah ?? null,
        tarif: row?.tarif ?? null,
      });
    }

    return result;
  }, [dashboard, selectedYear]);

  const penerimaanRows = useMemo(() => {
    const rows = dashboard?.penerimaanPerBulan || [];
    if (selectedYear === "all") return rows;

    const byMonth = new Map(
      rows
        .filter((row) => row.bulan.startsWith(selectedYear))
        .map((row) => [row.bulan, row]),
    );
    const now = new Date();
    const lastMonth =
      selectedYear === String(now.getFullYear()) ? now.getMonth() + 1 : 12;
    const result = [];
    let kumulatifGross = 0;

    for (let month = 1; month <= lastMonth; month += 1) {
      const key = monthKey(selectedYear, month);
      const row = byMonth.get(key);
      const gross = row?.gross || 0;
      const net = row?.net || 0;
      const air = row?.air ?? gross - net;
      kumulatifGross += gross;
      result.push({
        bulan: key,
        label: `${MONTH_LABELS[month - 1]} ${selectedYear}`,
        gross,
        net,
        air,
        kumulatifGross,
      });
    }

    return result;
  }, [dashboard, selectedYear]);

  const produksiRows = useMemo(() => {
    const rows = dashboard?.produksiBak3sPerBulan || [];
    if (selectedYear === "all") return rows;

    const byMonth = new Map(
      rows
        .filter((row) => row.bulan.startsWith(selectedYear))
        .map((row) => [row.bulan, row]),
    );
    const now = new Date();
    const lastMonth =
      selectedYear === String(now.getFullYear()) ? now.getMonth() + 1 : 12;
    const result = [];
    let kumulatif = 0;

    for (let month = 1; month <= lastMonth; month += 1) {
      const key = monthKey(selectedYear, month);
      const produksi = byMonth.get(key)?.produksi || 0;
      kumulatif += produksi;
      result.push({
        bulan: key,
        label: `${MONTH_LABELS[month - 1]} ${selectedYear}`,
        produksi,
        kumulatif,
      });
    }

    return result;
  }, [dashboard, selectedYear]);

  const satuanTarifLabel =
    SATUAN_TARIF_OPTIONS.find((item) => item.value === satuanTarif)?.label ||
    "Barrel";

  const displayTarifRows = useMemo(
    () =>
      tarifRows.map((row) => ({
        ...row,
        tarif: convertTarifFromBarrel(row.tarif, satuanTarif),
      })),
    [tarifRows, satuanTarif],
  );

  const satuanPenerimaanLabel =
    SATUAN_TARIF_OPTIONS.find((item) => item.value === satuanPenerimaan)
      ?.label || "Barrel";

  const displayPenerimaanRows = useMemo(
    () =>
      penerimaanRows.map((row) => ({
        ...row,
        gross: convertVolumeFromBarrel(row.gross, satuanPenerimaan) || 0,
        net: convertVolumeFromBarrel(row.net, satuanPenerimaan) || 0,
        air: convertVolumeFromBarrel(row.air, satuanPenerimaan) || 0,
        kumulatifGross:
          convertVolumeFromBarrel(row.kumulatifGross, satuanPenerimaan) || 0,
      })),
    [penerimaanRows, satuanPenerimaan],
  );

  const satuanProduksiLabel =
    SATUAN_TARIF_OPTIONS.find((item) => item.value === satuanProduksi)?.label ||
    "Barrel";

  const displayProduksiRows = useMemo(
    () =>
      produksiRows.map((row) => ({
        ...row,
        produksi: convertVolumeFromBarrel(row.produksi, satuanProduksi) || 0,
        kumulatif: convertVolumeFromBarrel(row.kumulatif, satuanProduksi) || 0,
      })),
    [produksiRows, satuanProduksi],
  );

  const summary = dashboard?.summary || {};
  const currentMonthKey = monthKey(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
  );
  const previousMonthDate = new Date();
  previousMonthDate.setMonth(previousMonthDate.getMonth() - 1);
  const previousMonthKey = monthKey(
    previousMonthDate.getFullYear(),
    previousMonthDate.getMonth() + 1,
  );

  const allMonthly = dashboard?.suratJalanPerBulan || [];
  const bulanIni =
    allMonthly.find((row) => row.bulan === currentMonthKey)?.jumlah || 0;
  const bulanLalu =
    allMonthly.find((row) => row.bulan === previousMonthKey)?.jumlah || 0;
  const selisih = bulanIni - bulanLalu;
  const persentase =
    bulanLalu === 0
      ? bulanIni > 0
        ? 100
        : 0
      : Math.round((selisih / bulanLalu) * 1000) / 10;

  const chartData = useMemo(() => {
    if (!monthlyRows.length) return null;
    return {
      labels: monthlyRows.map((row) => row.label),
      datasets: [
        {
          type: "bar",
          label: "Jumlah surat jalan",
          data: monthlyRows.map((row) => row.jumlah),
          backgroundColor: "rgba(59, 130, 246, 0.72)",
          borderRadius: 8,
          yAxisID: "y",
          order: 2,
        },
        {
          type: "line",
          label: "Kumulatif",
          data: monthlyRows.map((row) => row.kumulatif),
          borderColor: "rgba(16, 185, 129, 1)",
          backgroundColor: "rgba(16, 185, 129, 0.12)",
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointBackgroundColor: "rgba(16, 185, 129, 1)",
          yAxisID: "y1",
          order: 1,
        },
      ],
    };
  }, [monthlyRows]);

  const tarifChartData = useMemo(() => {
    const rows = displayTarifRows.filter((row) => row.tarif !== null);
    if (!rows.length) return null;
    return {
      labels: rows.map((row) => row.label),
      datasets: [
        {
          label: `Tarif per ${satuanTarifLabel.toLowerCase()}`,
          data: rows.map((row) => row.tarif),
          borderColor: "rgba(245, 158, 11, 1)",
          backgroundColor: "rgba(245, 158, 11, 0.14)",
          fill: true,
          tension: 0.35,
          pointRadius: 5,
          pointBackgroundColor: "rgba(245, 158, 11, 1)",
        },
      ],
    };
  }, [displayTarifRows, satuanTarifLabel]);

  const tarifByLabel = useMemo(
    () => new Map(displayTarifRows.map((row) => [row.label, row])),
    [displayTarifRows],
  );

  const latestTarif = useMemo(() => {
    const rows = (dashboard?.tarifPerBulan || []).filter(
      (row) => row.tarif !== null,
    );
    const row = rows[rows.length - 1];
    if (!row) return null;
    return {
      ...row,
      tarif: convertTarifFromBarrel(row.tarif, satuanTarif),
    };
  }, [dashboard, satuanTarif]);

  const previousTarif = useMemo(() => {
    const rows = (dashboard?.tarifPerBulan || []).filter(
      (row) => row.tarif !== null,
    );
    const row = rows.length > 1 ? rows[rows.length - 2] : null;
    if (!row) return null;
    return {
      ...row,
      tarif: convertTarifFromBarrel(row.tarif, satuanTarif),
    };
  }, [dashboard, satuanTarif]);

  const selisihTarif =
    latestTarif?.tarif != null && previousTarif?.tarif != null
      ? latestTarif.tarif - previousTarif.tarif
      : null;

  const allPenerimaan = dashboard?.penerimaanPerBulan || [];
  const penerimaanBulanIni = allPenerimaan.find(
    (row) => row.bulan === currentMonthKey,
  );
  const penerimaanBulanLalu = allPenerimaan.find(
    (row) => row.bulan === previousMonthKey,
  );
  const grossBulanIni =
    convertVolumeFromBarrel(penerimaanBulanIni?.gross || 0, satuanPenerimaan) ||
    0;
  const netBulanIni =
    convertVolumeFromBarrel(penerimaanBulanIni?.net || 0, satuanPenerimaan) || 0;
  const airBulanIni =
    convertVolumeFromBarrel(
      penerimaanBulanIni?.air ??
        (penerimaanBulanIni?.gross || 0) - (penerimaanBulanIni?.net || 0),
      satuanPenerimaan,
    ) || 0;
  const grossBulanLalu =
    convertVolumeFromBarrel(penerimaanBulanLalu?.gross || 0, satuanPenerimaan) ||
    0;
  const selisihGross = grossBulanIni - grossBulanLalu;

  const penerimaanChartData = useMemo(() => {
    if (!displayPenerimaanRows.length) return null;
    const hasData = displayPenerimaanRows.some(
      (row) => row.gross || row.net || row.air,
    );
    if (!hasData) return null;
    return {
      labels: displayPenerimaanRows.map((row) => row.label),
      datasets: [
        {
          type: "bar",
          label: "Net",
          data: displayPenerimaanRows.map((row) => row.net),
          backgroundColor: "rgba(16, 185, 129, 0.82)",
          borderRadius: 0,
          yAxisID: "y",
          stack: "penerimaan",
          order: 3,
        },
        {
          type: "bar",
          label: "Air (gross − net)",
          data: displayPenerimaanRows.map((row) => row.air),
          backgroundColor: "rgba(14, 165, 233, 0.82)",
          borderRadius: { topLeft: 6, topRight: 6, bottomLeft: 0, bottomRight: 0 },
          yAxisID: "y",
          stack: "penerimaan",
          order: 2,
        },
        {
          type: "line",
          label: "Kumulatif gross",
          data: displayPenerimaanRows.map((row) => row.kumulatifGross),
          borderColor: "rgba(249, 115, 22, 1)",
          backgroundColor: "rgba(249, 115, 22, 0.12)",
          fill: false,
          tension: 0.35,
          pointRadius: 4,
          pointBackgroundColor: "rgba(249, 115, 22, 1)",
          yAxisID: "y1",
          stack: "kumulatif",
          order: 1,
        },
      ],
    };
  }, [displayPenerimaanRows]);

  const allProduksi = dashboard?.produksiBak3sPerBulan || [];
  const produksiBulanIni = allProduksi.find(
    (row) => row.bulan === currentMonthKey,
  );
  const produksiBulanLalu = allProduksi.find(
    (row) => row.bulan === previousMonthKey,
  );
  const produksiIni =
    convertVolumeFromBarrel(produksiBulanIni?.produksi || 0, satuanProduksi) ||
    0;
  const produksiLalu =
    convertVolumeFromBarrel(produksiBulanLalu?.produksi || 0, satuanProduksi) ||
    0;
  const selisihProduksi = produksiIni - produksiLalu;

  const produksiChartData = useMemo(() => {
    if (!displayProduksiRows.length) return null;
    const hasData = displayProduksiRows.some((row) => row.produksi);
    if (!hasData) return null;
    return {
      labels: displayProduksiRows.map((row) => row.label),
      datasets: [
        {
          type: "bar",
          label: "Produksi BAK3S",
          data: displayProduksiRows.map((row) => row.produksi),
          backgroundColor: "rgba(139, 92, 246, 0.78)",
          borderRadius: 8,
          yAxisID: "y",
          order: 2,
        },
        {
          type: "line",
          label: "Kumulatif produksi",
          data: displayProduksiRows.map((row) => row.kumulatif),
          borderColor: "rgba(249, 115, 22, 1)",
          backgroundColor: "rgba(249, 115, 22, 0.12)",
          fill: false,
          tension: 0.35,
          pointRadius: 4,
          pointBackgroundColor: "rgba(249, 115, 22, 1)",
          yAxisID: "y1",
          order: 1,
        },
      ],
    };
  }, [displayProduksiRows]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false,
      },
      plugins: {
        legend: {
          position: "bottom",
          labels: { color: textColor, padding: 18 },
        },
        tooltip: {
          callbacks: {
            label: (context) =>
              `${context.dataset.label}: ${formatNumber(context.parsed.y)}`,
          },
        },
      },
      scales: {
        x: {
          ticks: { color: textColor, maxRotation: 45, minRotation: 0 },
          grid: { color: gridColor },
        },
        y: {
          beginAtZero: true,
          position: "left",
          ticks: { color: textColor, precision: 0 },
          grid: { color: gridColor },
          title: {
            display: true,
            text: "Jumlah per bulan",
            color: mutedColor,
          },
        },
        y1: {
          beginAtZero: true,
          position: "right",
          ticks: { color: textColor, precision: 0 },
          grid: { drawOnChartArea: false },
          title: {
            display: true,
            text: "Kumulatif",
            color: mutedColor,
          },
        },
      },
    }),
    [textColor, gridColor, mutedColor],
  );

  const tarifChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false,
      },
      plugins: {
        legend: {
          position: "bottom",
          labels: { color: textColor, padding: 18 },
        },
        tooltip: {
          callbacks: {
            label: (context) =>
              `Tarif/${satuanTarifLabel.toLowerCase()}: ${formatTarif(context.parsed.y)}`,
            afterBody: (items) => {
              const row = tarifByLabel.get(items[0]?.label);
              if (!row) return [];
              return [
                `ICP: ${formatDecimal(row.icp)}`,
                `Kurs tengah: ${formatTarif(row.kursTengah)}`,
                `Satuan: ${satuanTarifLabel}`,
              ];
            },
          },
        },
      },
      scales: {
        x: {
          ticks: { color: textColor, maxRotation: 45, minRotation: 0 },
          grid: { color: gridColor },
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: textColor,
            callback: (value) => formatNumber(value),
          },
          grid: { color: gridColor },
          title: {
            display: true,
            text: `Tarif / ${satuanTarifLabel.toLowerCase()}`,
            color: mutedColor,
          },
        },
      },
    }),
    [textColor, gridColor, mutedColor, tarifByLabel, satuanTarifLabel],
  );

  const penerimaanChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false,
      },
      plugins: {
        legend: {
          position: "bottom",
          labels: { color: textColor, padding: 18 },
        },
        tooltip: {
          callbacks: {
            label: (context) =>
              `${context.dataset.label}: ${formatDecimal(context.parsed.y, 2)} ${satuanPenerimaanLabel.toLowerCase()}`,
            footer: (items) => {
              const stacked = items.filter(
                (item) => item.dataset.stack === "penerimaan",
              );
              if (!stacked.length) return "";
              const gross = stacked.reduce(
                (sum, item) => sum + (item.parsed.y || 0),
                0,
              );
              return `Gross: ${formatDecimal(gross, 2)} ${satuanPenerimaanLabel.toLowerCase()}`;
            },
          },
        },
      },
      scales: {
        x: {
          stacked: true,
          ticks: { color: textColor, maxRotation: 45, minRotation: 0 },
          grid: { color: gridColor },
        },
        y: {
          stacked: true,
          beginAtZero: true,
          position: "left",
          ticks: {
            color: textColor,
            callback: (value) => formatDecimal(value, 1),
          },
          grid: { color: gridColor },
          title: {
            display: true,
            text: `Volume / ${satuanPenerimaanLabel.toLowerCase()}`,
            color: mutedColor,
          },
        },
        y1: {
          stacked: false,
          beginAtZero: true,
          position: "right",
          ticks: {
            color: textColor,
            callback: (value) => formatDecimal(value, 1),
          },
          grid: { drawOnChartArea: false },
          title: {
            display: true,
            text: "Kumulatif gross",
            color: mutedColor,
          },
        },
      },
    }),
    [textColor, gridColor, mutedColor, satuanPenerimaanLabel],
  );

  const produksiChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false,
      },
      plugins: {
        legend: {
          position: "bottom",
          labels: { color: textColor, padding: 18 },
        },
        tooltip: {
          callbacks: {
            label: (context) =>
              `${context.dataset.label}: ${formatDecimal(context.parsed.y, 2)} ${satuanProduksiLabel.toLowerCase()}`,
          },
        },
      },
      scales: {
        x: {
          ticks: { color: textColor, maxRotation: 45, minRotation: 0 },
          grid: { color: gridColor },
        },
        y: {
          beginAtZero: true,
          position: "left",
          ticks: {
            color: textColor,
            callback: (value) => formatDecimal(value, 1),
          },
          grid: { color: gridColor },
          title: {
            display: true,
            text: `Produksi / ${satuanProduksiLabel.toLowerCase()}`,
            color: mutedColor,
          },
        },
        y1: {
          beginAtZero: true,
          position: "right",
          ticks: {
            color: textColor,
            callback: (value) => formatDecimal(value, 1),
          },
          grid: { drawOnChartArea: false },
          title: {
            display: true,
            text: "Kumulatif produksi",
            color: mutedColor,
          },
        },
      },
    }),
    [textColor, gridColor, mutedColor, satuanProduksiLabel],
  );

  return (
    <LayoutKPBPN>
      <Container maxW="container.xl" py={8}>
        <Flex mb={6} align="center" wrap="wrap" gap={3}>
          <Box>
            <Heading size="lg" mb={1}>
              Dashboard Admin KPBPN
            </Heading>
            <Text color={mutedColor} fontSize="sm">
              Grafik surat jalan, penerimaan, produksi BAK3S, dan tarif per bulan
            </Text>
          </Box>
          <Spacer />
          <HStack spacing={2}>
            <Icon
              as={FaCircle}
              boxSize={2}
              color={connected ? "green.400" : "red.400"}
            />
            <Text fontSize="sm" color={mutedColor}>
              {connected ? "Realtime aktif" : "Menghubungkan..."}
            </Text>
            {dashboard?.timestamp && (
              <Text fontSize="xs" color="gray.400">
                · Terakhir diperbarui {formatDate(dashboard.timestamp)}
              </Text>
            )}
          </HStack>
        </Flex>

        <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={5} mb={6}>
          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardBody>
              <HStack align="start" spacing={3}>
                <Flex
                  bg="blue.50"
                  color="blue.600"
                  boxSize={10}
                  borderRadius="lg"
                  align="center"
                  justify="center"
                >
                  <Icon as={FaFileAlt} />
                </Flex>
                <Stat>
                  <StatLabel color={mutedColor}>Total surat jalan</StatLabel>
                  {loading ? (
                    <Skeleton height="28px" mt={2} />
                  ) : (
                    <StatNumber fontSize="2xl">
                      {formatNumber(summary.suratJalan)}
                    </StatNumber>
                  )}
                  <StatHelpText mb={0}>Seluruh periode</StatHelpText>
                </Stat>
              </HStack>
            </CardBody>
          </Card>

          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardBody>
              <HStack align="start" spacing={3}>
                <Flex
                  bg="teal.50"
                  color="teal.600"
                  boxSize={10}
                  borderRadius="lg"
                  align="center"
                  justify="center"
                >
                  <Icon as={FaCalendarAlt} />
                </Flex>
                <Stat>
                  <StatLabel color={mutedColor}>Bulan ini</StatLabel>
                  {loading ? (
                    <Skeleton height="28px" mt={2} />
                  ) : (
                    <StatNumber fontSize="2xl">{formatNumber(bulanIni)}</StatNumber>
                  )}
                  <StatHelpText mb={0}>
                    {MONTH_LABELS[new Date().getMonth()]}{" "}
                    {new Date().getFullYear()}
                  </StatHelpText>
                </Stat>
              </HStack>
            </CardBody>
          </Card>

          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardBody>
              <HStack align="start" spacing={3}>
                <Flex
                  bg="purple.50"
                  color="purple.600"
                  boxSize={10}
                  borderRadius="lg"
                  align="center"
                  justify="center"
                >
                  <Icon as={FaCalendarAlt} />
                </Flex>
                <Stat>
                  <StatLabel color={mutedColor}>Bulan lalu</StatLabel>
                  {loading ? (
                    <Skeleton height="28px" mt={2} />
                  ) : (
                    <StatNumber fontSize="2xl">
                      {formatNumber(bulanLalu)}
                    </StatNumber>
                  )}
                  <StatHelpText mb={0}>
                    {MONTH_LABELS[previousMonthDate.getMonth()]}{" "}
                    {previousMonthDate.getFullYear()}
                  </StatHelpText>
                </Stat>
              </HStack>
            </CardBody>
          </Card>

          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardBody>
              <HStack align="start" spacing={3}>
                <Flex
                  bg={selisih >= 0 ? "green.50" : "red.50"}
                  color={selisih >= 0 ? "green.600" : "red.600"}
                  boxSize={10}
                  borderRadius="lg"
                  align="center"
                  justify="center"
                >
                  <Icon as={FaChartLine} />
                </Flex>
                <Stat>
                  <StatLabel color={mutedColor}>Peningkatan</StatLabel>
                  {loading ? (
                    <Skeleton height="28px" mt={2} />
                  ) : (
                    <StatNumber fontSize="2xl">
                      {selisih > 0 ? "+" : ""}
                      {formatNumber(selisih)}
                    </StatNumber>
                  )}
                  <StatHelpText mb={0}>
                    {selisih !== 0 && (
                      <StatArrow type={selisih >= 0 ? "increase" : "decrease"} />
                    )}
                    {persentase > 0 ? "+" : ""}
                    {persentase}% dibanding bulan lalu
                  </StatHelpText>
                </Stat>
              </HStack>
            </CardBody>
          </Card>
        </SimpleGrid>

        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" mb={6}>
          <CardHeader pb={2}>
            <Flex align="center" wrap="wrap" gap={3}>
              <Box>
                <Heading size="sm">Jumlah surat jalan per bulan</Heading>
                <Text fontSize="xs" color={mutedColor} mt={1}>
                  Batang menampilkan jumlah bulanan, garis menampilkan akumulasi
                </Text>
              </Box>
              <Spacer />
              <HStack>
                <Text fontSize="sm" color={mutedColor}>
                  Periode
                </Text>
                <Select
                  size="sm"
                  maxW="180px"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  <option value="all">Semua tahun</option>
                  {availableYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </Select>
                <Link to="/pengiriman-kpbpn/surat-jalan">
                  <Text fontSize="sm" color="yellow.600">
                    Lihat surat jalan →
                  </Text>
                </Link>
              </HStack>
            </Flex>
          </CardHeader>
          <CardBody pt={0}>
            <Box h={{ base: "320px", md: "420px" }} position="relative">
              {loading ? (
                <Skeleton height="100%" borderRadius="md" />
              ) : chartData ? (
                <Bar data={chartData} options={chartOptions} />
              ) : (
                <Flex h="100%" align="center" justify="center">
                  <Text fontSize="sm" color={mutedColor}>
                    Belum ada data surat jalan
                  </Text>
                </Flex>
              )}
            </Box>
          </CardBody>
        </Card>

        <Flex mb={3} align="center" wrap="wrap" gap={3}>
          <Heading size="sm">Penerimaan minyak</Heading>
          <Spacer />
          <HStack>
            <Text fontSize="sm" color={mutedColor}>
              Satuan
            </Text>
            <Select
              size="sm"
              maxW="160px"
              value={satuanPenerimaan}
              onChange={(e) => setSatuanPenerimaan(e.target.value)}
            >
              {SATUAN_TARIF_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </HStack>
        </Flex>

        <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={5} mb={6}>
          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardBody>
              <Stat>
                <StatLabel color={mutedColor}>
                  Gross bulan ini / {satuanPenerimaanLabel.toLowerCase()}
                </StatLabel>
                {loading ? (
                  <Skeleton height="28px" mt={2} />
                ) : (
                  <StatNumber fontSize="2xl">
                    {formatDecimal(grossBulanIni, 2)}
                  </StatNumber>
                )}
                <StatHelpText mb={0}>Dari pengisian tanki</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardBody>
              <Stat>
                <StatLabel color={mutedColor}>
                  Net bulan ini / {satuanPenerimaanLabel.toLowerCase()}
                </StatLabel>
                {loading ? (
                  <Skeleton height="28px" mt={2} />
                ) : (
                  <StatNumber fontSize="2xl">
                    {formatDecimal(netBulanIni, 2)}
                  </StatNumber>
                )}
                <StatHelpText mb={0}>Volume bersih</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardBody>
              <Stat>
                <StatLabel color={mutedColor}>
                  Air bulan ini / {satuanPenerimaanLabel.toLowerCase()}
                </StatLabel>
                {loading ? (
                  <Skeleton height="28px" mt={2} />
                ) : (
                  <StatNumber fontSize="2xl">
                    {formatDecimal(airBulanIni, 2)}
                  </StatNumber>
                )}
                <StatHelpText mb={0}>Gross − net</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardBody>
              <Stat>
                <StatLabel color={mutedColor}>Kenaikan gross</StatLabel>
                {loading ? (
                  <Skeleton height="28px" mt={2} />
                ) : (
                  <StatNumber fontSize="2xl">
                    {selisihGross > 0 ? "+" : ""}
                    {formatDecimal(selisihGross, 2)}
                  </StatNumber>
                )}
                <StatHelpText mb={0}>
                  {selisihGross !== 0 && (
                    <StatArrow
                      type={selisihGross >= 0 ? "increase" : "decrease"}
                    />
                  )}
                  dibanding bulan lalu
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" mb={6}>
          <CardHeader pb={2}>
            <Flex align="center" wrap="wrap" gap={3}>
              <Box>
                <Heading size="sm">
                  Penerimaan minyak per {satuanPenerimaanLabel.toLowerCase()}
                </Heading>
                <Text fontSize="xs" color={mutedColor} mt={1}>
                  Satu batang: net + air = gross. Garis menampilkan kumulatif gross.
                </Text>
              </Box>
              <Spacer />
              <HStack>
                <Text fontSize="sm" color={mutedColor}>
                  Periode
                </Text>
                <Select
                  size="sm"
                  maxW="180px"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  <option value="all">Semua tahun</option>
                  {availableYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </Select>
                <Select
                  size="sm"
                  maxW="140px"
                  value={satuanPenerimaan}
                  onChange={(e) => setSatuanPenerimaan(e.target.value)}
                >
                  {SATUAN_TARIF_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
                <Link to="/tanki-kpbpn/pengisian">
                  <Text fontSize="sm" color="yellow.600">
                    Lihat pengisian →
                  </Text>
                </Link>
              </HStack>
            </Flex>
          </CardHeader>
          <CardBody pt={0}>
            <Box h={{ base: "320px", md: "420px" }} position="relative">
              {loading ? (
                <Skeleton height="100%" borderRadius="md" />
              ) : penerimaanChartData ? (
                <Bar data={penerimaanChartData} options={penerimaanChartOptions} />
              ) : (
                <Flex h="100%" align="center" justify="center">
                  <Text fontSize="sm" color={mutedColor}>
                    Belum ada data pengisian tanki
                  </Text>
                </Flex>
              )}
            </Box>
          </CardBody>
        </Card>

        <Flex mb={3} align="center" wrap="wrap" gap={3}>
          <Heading size="sm">Produksi BAK3S</Heading>
          <Spacer />
          <HStack>
            <Text fontSize="sm" color={mutedColor}>
              Satuan
            </Text>
            <Select
              size="sm"
              maxW="160px"
              value={satuanProduksi}
              onChange={(e) => setSatuanProduksi(e.target.value)}
            >
              {SATUAN_TARIF_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </HStack>
        </Flex>

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={5} mb={6}>
          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardBody>
              <Stat>
                <StatLabel color={mutedColor}>
                  Produksi bulan ini / {satuanProduksiLabel.toLowerCase()}
                </StatLabel>
                {loading ? (
                  <Skeleton height="28px" mt={2} />
                ) : (
                  <StatNumber fontSize="2xl">
                    {formatDecimal(produksiIni, 2)}
                  </StatNumber>
                )}
                <StatHelpText mb={0}>Dari kolom produksi BAK3S</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardBody>
              <Stat>
                <StatLabel color={mutedColor}>
                  Produksi bulan lalu / {satuanProduksiLabel.toLowerCase()}
                </StatLabel>
                {loading ? (
                  <Skeleton height="28px" mt={2} />
                ) : (
                  <StatNumber fontSize="2xl">
                    {formatDecimal(produksiLalu, 2)}
                  </StatNumber>
                )}
                <StatHelpText mb={0}>
                  {MONTH_LABELS[previousMonthDate.getMonth()]}{" "}
                  {previousMonthDate.getFullYear()}
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardBody>
              <Stat>
                <StatLabel color={mutedColor}>Kenaikan produksi</StatLabel>
                {loading ? (
                  <Skeleton height="28px" mt={2} />
                ) : (
                  <StatNumber fontSize="2xl">
                    {selisihProduksi > 0 ? "+" : ""}
                    {formatDecimal(selisihProduksi, 2)}
                  </StatNumber>
                )}
                <StatHelpText mb={0}>
                  {selisihProduksi !== 0 && (
                    <StatArrow
                      type={selisihProduksi >= 0 ? "increase" : "decrease"}
                    />
                  )}
                  dibanding bulan lalu
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" mb={6}>
          <CardHeader pb={2}>
            <Flex align="center" wrap="wrap" gap={3}>
              <Box>
                <Heading size="sm">
                  Produksi BAK3S per {satuanProduksiLabel.toLowerCase()}
                </Heading>
                <Text fontSize="xs" color={mutedColor} mt={1}>
                  Batang menampilkan produksi bulanan, garis menampilkan akumulasi
                </Text>
              </Box>
              <Spacer />
              <HStack>
                <Text fontSize="sm" color={mutedColor}>
                  Periode
                </Text>
                <Select
                  size="sm"
                  maxW="180px"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  <option value="all">Semua tahun</option>
                  {availableYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </Select>
                <Select
                  size="sm"
                  maxW="140px"
                  value={satuanProduksi}
                  onChange={(e) => setSatuanProduksi(e.target.value)}
                >
                  {SATUAN_TARIF_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
                <Link to="/keuangan/rekapitulasi">
                  <Text fontSize="sm" color="yellow.600">
                    Lihat rekapitulasi →
                  </Text>
                </Link>
              </HStack>
            </Flex>
          </CardHeader>
          <CardBody pt={0}>
            <Box h={{ base: "320px", md: "420px" }} position="relative">
              {loading ? (
                <Skeleton height="100%" borderRadius="md" />
              ) : produksiChartData ? (
                <Bar data={produksiChartData} options={produksiChartOptions} />
              ) : (
                <Flex h="100%" align="center" justify="center">
                  <Text fontSize="sm" color={mutedColor}>
                    Belum ada data produksi BAK3S
                  </Text>
                </Flex>
              )}
            </Box>
          </CardBody>
        </Card>

        <Flex mb={3} align="center" wrap="wrap" gap={3}>
          <Heading size="sm">Tarif</Heading>
          <Spacer />
          <HStack>
            <Text fontSize="sm" color={mutedColor}>
              Satuan
            </Text>
            <Select
              size="sm"
              maxW="160px"
              value={satuanTarif}
              onChange={(e) => setSatuanTarif(e.target.value)}
            >
              {SATUAN_TARIF_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </HStack>
        </Flex>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5} mb={6}>
          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardBody>
              <Stat>
                <StatLabel color={mutedColor}>
                  Tarif terbaru / {satuanTarifLabel.toLowerCase()}
                </StatLabel>
                {loading ? (
                  <Skeleton height="28px" mt={2} />
                ) : (
                  <StatNumber fontSize="2xl">
                    {formatTarif(latestTarif?.tarif)}
                  </StatNumber>
                )}
                <StatHelpText mb={0}>
                  {latestTarif?.label || "Belum ada data ICP"}
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardBody>
              <Stat>
                <StatLabel color={mutedColor}>
                  Perubahan tarif / {satuanTarifLabel.toLowerCase()}
                </StatLabel>
                {loading ? (
                  <Skeleton height="28px" mt={2} />
                ) : (
                  <StatNumber fontSize="2xl">
                    {selisihTarif == null
                      ? "-"
                      : `${selisihTarif > 0 ? "+" : ""}${formatTarif(selisihTarif)}`}
                  </StatNumber>
                )}
                <StatHelpText mb={0}>
                  {selisihTarif != null && (
                    <StatArrow type={selisihTarif >= 0 ? "increase" : "decrease"} />
                  )}
                  dibanding {previousTarif?.label || "bulan sebelumnya"}
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" mb={6}>
          <CardHeader pb={2}>
            <Flex align="center" wrap="wrap" gap={3}>
              <Box>
                <Heading size="sm">
                  Perubahan tarif per {satuanTarifLabel.toLowerCase()}
                </Heading>
                <Text fontSize="xs" color={mutedColor} mt={1}>
                  {getTarifFormulaText(satuanTarif)}
                </Text>
              </Box>
              <Spacer />
              <HStack>
                <Text fontSize="sm" color={mutedColor}>
                  Periode
                </Text>
                <Select
                  size="sm"
                  maxW="180px"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  <option value="all">Semua tahun</option>
                  {availableYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </Select>
                <Select
                  size="sm"
                  maxW="140px"
                  value={satuanTarif}
                  onChange={(e) => setSatuanTarif(e.target.value)}
                >
                  {SATUAN_TARIF_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
                <Link to="/keuangan/icp">
                  <Text fontSize="sm" color="yellow.600">
                    Lihat ICP →
                  </Text>
                </Link>
              </HStack>
            </Flex>
          </CardHeader>
          <CardBody pt={0}>
            <Box h={{ base: "320px", md: "420px" }} position="relative">
              {loading ? (
                <Skeleton height="100%" borderRadius="md" />
              ) : tarifChartData ? (
                <Line data={tarifChartData} options={tarifChartOptions} />
              ) : (
                <Flex h="100%" align="center" justify="center">
                  <Text fontSize="sm" color={mutedColor}>
                    Belum ada data tarif ICP
                  </Text>
                </Flex>
              )}
            </Box>
          </CardBody>
        </Card>

        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" mb={6}>
          <CardHeader pb={2}>
            <Heading size="sm">Rincian surat jalan per bulan</Heading>
          </CardHeader>
          <CardBody pt={0} overflowX="auto">
            {loading ? (
              <Skeleton height="160px" borderRadius="md" />
            ) : monthlyRows.length === 0 ? (
              <Text fontSize="sm" color={mutedColor} py={4}>
                Belum ada rincian surat jalan
              </Text>
            ) : (
              <Table size="sm">
                <Thead>
                  <Tr>
                    <Th>Bulan</Th>
                    <Th isNumeric>Jumlah</Th>
                    <Th isNumeric>Perubahan</Th>
                    <Th isNumeric>Kumulatif</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {monthlyRows.map((row, index) => {
                    const prev = monthlyRows[index - 1]?.jumlah || 0;
                    const delta = index === 0 ? row.jumlah : row.jumlah - prev;
                    return (
                      <Tr key={row.bulan}>
                        <Td>{row.label}</Td>
                        <Td isNumeric>{formatNumber(row.jumlah)}</Td>
                        <Td
                          isNumeric
                          color={
                            delta > 0
                              ? "green.500"
                              : delta < 0
                                ? "red.500"
                                : mutedColor
                          }
                        >
                          {delta > 0 ? "+" : ""}
                          {formatNumber(delta)}
                        </Td>
                        <Td isNumeric>{formatNumber(row.kumulatif)}</Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            )}
          </CardBody>
        </Card>

        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" mt={6}>
          <CardHeader pb={2}>
            <Heading size="sm">
              Rincian penerimaan minyak per {satuanPenerimaanLabel.toLowerCase()}
            </Heading>
          </CardHeader>
          <CardBody pt={0} overflowX="auto">
            {loading ? (
              <Skeleton height="160px" borderRadius="md" />
            ) : displayPenerimaanRows.every(
                (row) => !row.gross && !row.net && !row.air,
              ) ? (
              <Text fontSize="sm" color={mutedColor} py={4}>
                Belum ada rincian pengisian tanki
              </Text>
            ) : (
              <Table size="sm">
                <Thead>
                  <Tr>
                    <Th>Bulan</Th>
                    <Th isNumeric>Gross</Th>
                    <Th isNumeric>Net</Th>
                    <Th isNumeric>Air</Th>
                    <Th isNumeric>Perubahan gross</Th>
                    <Th isNumeric>Kumulatif gross</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {displayPenerimaanRows.map((row, index) => {
                    const prev = displayPenerimaanRows[index - 1]?.gross || 0;
                    const delta = index === 0 ? row.gross : row.gross - prev;
                    return (
                      <Tr key={row.bulan}>
                        <Td>{row.label}</Td>
                        <Td isNumeric fontWeight="medium">
                          {formatDecimal(row.gross, 2)}
                        </Td>
                        <Td isNumeric>{formatDecimal(row.net, 2)}</Td>
                        <Td isNumeric>{formatDecimal(row.air, 2)}</Td>
                        <Td
                          isNumeric
                          color={
                            delta > 0
                              ? "green.500"
                              : delta < 0
                                ? "red.500"
                                : mutedColor
                          }
                        >
                          {delta > 0 ? "+" : ""}
                          {formatDecimal(delta, 2)}
                        </Td>
                        <Td isNumeric>
                          {formatDecimal(row.kumulatifGross, 2)}
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            )}
          </CardBody>
        </Card>

        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" mt={6}>
          <CardHeader pb={2}>
            <Heading size="sm">
              Rincian produksi BAK3S per {satuanProduksiLabel.toLowerCase()}
            </Heading>
          </CardHeader>
          <CardBody pt={0} overflowX="auto">
            {loading ? (
              <Skeleton height="160px" borderRadius="md" />
            ) : displayProduksiRows.every((row) => !row.produksi) ? (
              <Text fontSize="sm" color={mutedColor} py={4}>
                Belum ada rincian produksi BAK3S
              </Text>
            ) : (
              <Table size="sm">
                <Thead>
                  <Tr>
                    <Th>Bulan</Th>
                    <Th isNumeric>Produksi</Th>
                    <Th isNumeric>Perubahan</Th>
                    <Th isNumeric>Kumulatif</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {displayProduksiRows.map((row, index) => {
                    const prev = displayProduksiRows[index - 1]?.produksi || 0;
                    const delta =
                      index === 0 ? row.produksi : row.produksi - prev;
                    return (
                      <Tr key={row.bulan}>
                        <Td>{row.label}</Td>
                        <Td isNumeric fontWeight="medium">
                          {formatDecimal(row.produksi, 2)}
                        </Td>
                        <Td
                          isNumeric
                          color={
                            delta > 0
                              ? "green.500"
                              : delta < 0
                                ? "red.500"
                                : mutedColor
                          }
                        >
                          {delta > 0 ? "+" : ""}
                          {formatDecimal(delta, 2)}
                        </Td>
                        <Td isNumeric>{formatDecimal(row.kumulatif, 2)}</Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            )}
          </CardBody>
        </Card>

        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" mt={6}>
          <CardHeader pb={2}>
            <Heading size="sm">
              Rincian tarif per {satuanTarifLabel.toLowerCase()}
            </Heading>
          </CardHeader>
          <CardBody pt={0} overflowX="auto">
            {loading ? (
              <Skeleton height="160px" borderRadius="md" />
            ) : displayTarifRows.every((row) => row.tarif === null) ? (
              <Text fontSize="sm" color={mutedColor} py={4}>
                Belum ada rincian tarif ICP
              </Text>
            ) : (
              <Table size="sm">
                <Thead>
                  <Tr>
                    <Th>Bulan</Th>
                    <Th isNumeric>ICP</Th>
                    <Th isNumeric>Kurs tengah</Th>
                    <Th isNumeric>Tarif / {satuanTarifLabel.toLowerCase()}</Th>
                    <Th isNumeric>Perubahan</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {displayTarifRows.map((row, index) => {
                    const prev = displayTarifRows
                      .slice(0, index)
                      .reverse()
                      .find((item) => item.tarif !== null)?.tarif;
                    const delta =
                      row.tarif === null || prev == null
                        ? null
                        : row.tarif - prev;
                    return (
                      <Tr key={row.bulan}>
                        <Td>{row.label}</Td>
                        <Td isNumeric>{formatDecimal(row.icp)}</Td>
                        <Td isNumeric>{formatTarif(row.kursTengah)}</Td>
                        <Td isNumeric fontWeight="medium">
                          {formatTarif(row.tarif)}
                        </Td>
                        <Td
                          isNumeric
                          color={
                            delta > 0
                              ? "green.500"
                              : delta < 0
                                ? "red.500"
                                : mutedColor
                          }
                        >
                          {delta == null
                            ? "-"
                            : `${delta > 0 ? "+" : ""}${formatTarif(delta)}`}
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            )}
          </CardBody>
        </Card>
      </Container>
    </LayoutKPBPN>
  );
}

export default AdminDashborad;
