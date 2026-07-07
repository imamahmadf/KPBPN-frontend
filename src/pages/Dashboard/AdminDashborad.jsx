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
  Badge,
  Text,
  HStack,
  VStack,
  Divider,
  Skeleton,
  Flex,
  Spacer,
  Icon,
  useColorModeValue,
  Card,
  CardBody,
  CardHeader,
} from "@chakra-ui/react";
import { FaCircle } from "react-icons/fa";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import LayoutKPBPN from "../../Componets/KPBPN/LayoutKPBPN";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const API_BASE = import.meta.env.VITE_REACT_APP_API_BASE_URL;

const CHART_COLORS = {
  teal: "rgba(45, 212, 191, 0.75)",
  cyan: "rgba(34, 211, 238, 0.75)",
  blue: "rgba(59, 130, 246, 0.75)",
  purple: "rgba(168, 85, 247, 0.75)",
  orange: "rgba(249, 115, 22, 0.75)",
  yellow: "rgba(234, 179, 8, 0.75)",
  red: "rgba(239, 68, 68, 0.75)",
  green: "rgba(34, 197, 94, 0.75)",
  gray: "rgba(156, 163, 175, 0.75)",
};

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

const formatShortDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
  });
};

const aktivitasColor = (type) => {
  if (
    type?.startsWith("mitra") ||
    type?.startsWith("supir") ||
    type?.startsWith("transportir")
  ) {
    return "teal";
  }
  if (type?.startsWith("suratJalan") || type?.startsWith("konfirmasi")) {
    return "blue";
  }
  if (
    type?.startsWith("pengisian") ||
    type?.startsWith("tanki") ||
    type?.startsWith("ba")
  ) {
    return "orange";
  }
  return "gray";
};

const ChartCard = ({
  title,
  subtitle,
  linkTo,
  linkLabel,
  children,
  height = "320px",
}) => {
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  return (
    <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" h="100%">
      <CardHeader pb={2}>
        <HStack>
          <Box>
            <Heading size="sm">{title}</Heading>
            {subtitle && (
              <Text fontSize="xs" color="gray.500" mt={1}>
                {subtitle}
              </Text>
            )}
          </Box>
          <Spacer />
          {linkTo && (
            <Link to={linkTo}>
              <Text fontSize="sm" color="yellow.600">
                {linkLabel || "Lihat semua →"}
              </Text>
            </Link>
          )}
        </HStack>
      </CardHeader>
      <CardBody pt={0}>
        <Box h={height} position="relative">
          {children}
        </Box>
      </CardBody>
    </Card>
  );
};

function AdminDashborad() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [aktivitas, setAktivitas] = useState([]);
  const socketRef = useRef(null);

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("#374151", "#e5e7eb");
  const gridColor = useColorModeValue(
    "rgba(0,0,0,0.06)",
    "rgba(255,255,255,0.08)",
  );

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: textColor },
        },
      },
      scales: {
        x: {
          ticks: { color: textColor },
          grid: { color: gridColor },
        },
        y: {
          beginAtZero: true,
          ticks: { color: textColor, precision: 0 },
          grid: { color: gridColor },
        },
      },
    }),
    [textColor, gridColor],
  );

  const doughnutOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: { color: textColor, padding: 16 },
        },
      },
    }),
    [textColor],
  );

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

    socket.on("dashboard:aktivitas", (item) => {
      setAktivitas((prev) => [item, ...prev].slice(0, 20));
    });

    return () => {
      socket.emit("dashboard:unsubscribe");
      socket.off("dashboard:kpbpn:data", applyDashboardData);
      socket.off("dashboard:kpbpn:update", applyDashboardData);
      socket.off("dashboard:aktivitas");
      socket.disconnect();
    };
  }, [applyDashboardData]);

  const summary = dashboard?.summary || {};

  const mitraArmadaChart = useMemo(() => {
    if (!dashboard) return null;
    return {
      labels: ["Mitra", "Transportir", "Supir"],
      datasets: [
        {
          label: "Jumlah",
          data: [summary.mitra, summary.transportir, summary.supir],
          backgroundColor: [
            CHART_COLORS.teal,
            CHART_COLORS.cyan,
            CHART_COLORS.blue,
          ],
          borderRadius: 8,
        },
      ],
    };
  }, [dashboard, summary.mitra, summary.transportir, summary.supir]);

  const statusSuratJalanChart = useMemo(() => {
    const rows = dashboard?.statusSuratJalan || [];
    if (!rows.length) {
      return {
        labels: ["Draft", "Kirim", "Terima"],
        datasets: [
          {
            data: [
              summary.suratJalanDraft,
              summary.suratJalanKirim,
              summary.suratJalanTerima,
            ],
            backgroundColor: [
              CHART_COLORS.gray,
              CHART_COLORS.blue,
              CHART_COLORS.green,
            ],
            borderWidth: 0,
          },
        ],
      };
    }
    return {
      labels: rows.map((r) => r.status),
      datasets: [
        {
          data: rows.map((r) => r.count),
          backgroundColor: [
            CHART_COLORS.gray,
            CHART_COLORS.blue,
            CHART_COLORS.green,
            CHART_COLORS.purple,
            CHART_COLORS.orange,
          ],
          borderWidth: 0,
        },
      ],
    };
  }, [dashboard, summary]);

  const tankiChart = useMemo(() => {
    if (!dashboard) return null;
    return {
      labels: [
        "Total Tanki",
        "Pengisian",
        "Monitoring Aktif",
        "Konfirmasi Pending",
      ],
      datasets: [
        {
          label: "Jumlah",
          data: [
            summary.tanki,
            summary.pengisianTanki,
            summary.tankiMonitoring,
            summary.konfirmasiPending,
          ],
          backgroundColor: [
            CHART_COLORS.yellow,
            CHART_COLORS.orange,
            CHART_COLORS.red,
            CHART_COLORS.purple,
          ],
          borderRadius: 8,
        },
      ],
    };
  }, [dashboard, summary]);

  const pengisianGrossNetChart = useMemo(() => {
    const items = [...(dashboard?.recentPengisianTanki || [])].reverse();
    if (!items.length) return null;
    return {
      labels: items.map(
        (pt) => `${pt.tanki?.kode || "T"} · ${formatShortDate(pt.tanggal)}`,
      ),
      datasets: [
        {
          label: "Gross",
          data: items.map((pt) => parseInt(pt.gross, 10) || 0),
          borderColor: CHART_COLORS.orange,
          backgroundColor: "rgba(249, 115, 22, 0.15)",
          fill: true,
          tension: 0.35,
        },
        {
          label: "Net",
          data: items.map((pt) => parseInt(pt.net, 10) || 0),
          borderColor: CHART_COLORS.green,
          backgroundColor: "rgba(34, 197, 94, 0.15)",
          fill: true,
          tension: 0.35,
        },
      ],
    };
  }, [dashboard]);

  const volumeSuratJalanChart = useMemo(() => {
    const items = dashboard?.recentSuratJalan || [];
    if (!items.length) return null;
    return {
      labels: items.map((sj) => sj.mitra?.nama || `SJ #${sj.id}`),
      datasets: [
        {
          label: "Volume",
          data: items.map((sj) => parseInt(sj.volume, 10) || 0),
          backgroundColor: CHART_COLORS.purple,
          borderRadius: 8,
        },
      ],
    };
  }, [dashboard]);

  const tankiMonitoringChart = useMemo(() => {
    const items = dashboard?.tankiMonitoring || [];
    if (!items.length) return null;
    return {
      labels: items.map((t) => t.kode),
      datasets: [
        {
          label: "Pengisian Aktif",
          data: items.map((t) => t.pengisianTankis?.length ?? 0),
          backgroundColor: CHART_COLORS.red,
          borderRadius: 8,
        },
      ],
    };
  }, [dashboard]);

  const mitraSupirChart = useMemo(() => {
    const items = dashboard?.recentMitra || [];
    if (!items.length) return null;
    return {
      labels: items.map((m) => m.nama),
      datasets: [
        {
          label: "Jumlah Supir",
          data: items.map((m) => m.supirs?.length ?? 0),
          backgroundColor: CHART_COLORS.teal,
          borderRadius: 8,
        },
      ],
    };
  }, [dashboard]);

  const ringkasanOperasionalChart = useMemo(() => {
    if (!dashboard) return null;
    return {
      labels: [
        "Mitra",
        "Transportir",
        "Supir",
        "Surat Jalan",
        "Tanki",
        "Pengisian",
      ],
      datasets: [
        {
          label: "Total Data",
          data: [
            summary.mitra,
            summary.transportir,
            summary.supir,
            summary.suratJalan,
            summary.tanki,
            summary.pengisianTanki,
          ],
          backgroundColor: [
            CHART_COLORS.teal,
            CHART_COLORS.cyan,
            CHART_COLORS.blue,
            CHART_COLORS.purple,
            CHART_COLORS.yellow,
            CHART_COLORS.orange,
          ],
          borderRadius: 6,
        },
      ],
    };
  }, [dashboard, summary]);

  const renderChart = (chartData, ChartComponent, options, emptyText) => {
    if (loading) return <Skeleton height="100%" borderRadius="md" />;
    if (!chartData) {
      return (
        <Flex h="100%" align="center" justify="center">
          <Text fontSize="sm" color="gray.500">
            {emptyText}
          </Text>
        </Flex>
      );
    }
    return <ChartComponent data={chartData} options={options} />;
  };

  return (
    <LayoutKPBPN>
      <Container maxW="container.xl" py={8}>
        <Flex mb={6} align="center" wrap="wrap" gap={3}>
          <Box>
            <Heading size="lg" mb={1}>
              Dashboard Admin KPBPN
            </Heading>
            <Text color="gray.500" fontSize="sm">
              Visualisasi grafik mitra, pengiriman, dan tanki secara realtime
            </Text>
          </Box>
          <Spacer />
          <HStack spacing={2}>
            <Icon
              as={FaCircle}
              boxSize={2}
              color={connected ? "green.400" : "red.400"}
            />
            <Text fontSize="sm" color="gray.500">
              {connected ? "Realtime aktif" : "Menghubungkan..."}
            </Text>
            {dashboard?.timestamp && (
              <Text fontSize="xs" color="gray.400">
                · Terakhir diperbarui {formatDate(dashboard.timestamp)}
              </Text>
            )}
          </HStack>
        </Flex>

        {/* Grafik ringkasan utama */}
        <SimpleGrid columns={{ base: 1, lg: 2, xl: 3 }} spacing={6} mb={6}>
          <ChartCard
            title="Ringkasan Operasional"
            subtitle="Total data mitra, pengiriman, dan tanki"
          >
            {renderChart(
              ringkasanOperasionalChart,
              Bar,
              {
                ...chartOptions,
                indexAxis: "y",
                plugins: {
                  ...chartOptions.plugins,
                  legend: { display: false },
                },
              },
              "Belum ada data",
            )}
          </ChartCard>

          <ChartCard
            title="Mitra & Armada"
            subtitle="Perbandingan mitra, transportir, dan supir"
            linkTo="/mitra-kpbpn/daftar"
          >
            {renderChart(
              mitraArmadaChart,
              Bar,
              {
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  legend: { display: false },
                },
              },
              "Belum ada data mitra",
            )}
          </ChartCard>

          <ChartCard
            title="Status Surat Jalan"
            subtitle="Distribusi status pengiriman"
            linkTo="/pengiriman-kpbpn/surat-jalan"
          >
            {renderChart(
              statusSuratJalanChart,
              Doughnut,
              doughnutOptions,
              "Belum ada surat jalan",
            )}
          </ChartCard>
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mb={6}>
          <ChartCard
            title="Tanki & Pengisian"
            subtitle="Kapasitas operasional tanki"
            linkTo="/tanki-kpbpn/pengisian"
          >
            {renderChart(
              tankiChart,
              Bar,
              {
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  legend: { display: false },
                },
              },
              "Belum ada data tanki",
            )}
          </ChartCard>

          <ChartCard
            title="Trend Gross vs Net Pengisian"
            subtitle="Pengisian tanki terbaru"
            linkTo="/tanki-kpbpn/pengisian"
            height="320px"
          >
            {renderChart(
              pengisianGrossNetChart,
              Line,
              chartOptions,
              "Belum ada data pengisian tanki",
            )}
          </ChartCard>
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mb={6}>
          <ChartCard
            title="Volume Surat Jalan Terbaru"
            subtitle="Per mitra / pengiriman terakhir"
            linkTo="/pengiriman-kpbpn/surat-jalan"
          >
            {renderChart(
              volumeSuratJalanChart,
              Bar,
              {
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  legend: { display: false },
                },
              },
              "Belum ada surat jalan",
            )}
          </ChartCard>

          <ChartCard
            title="Tanki Monitoring Aktif"
            subtitle="Jumlah pengisian tanpa BA per tanki"
          >
            {renderChart(
              tankiMonitoringChart,
              Bar,
              {
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  legend: { display: false },
                },
              },
              "Tidak ada tanki monitoring aktif",
            )}
          </ChartCard>
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={6}>
          <ChartCard
            title="Mitra Terbaru — Jumlah Supir"
            subtitle="Distribusi supir per mitra"
            linkTo="/mitra-kpbpn/daftar"
          >
            {renderChart(
              mitraSupirChart,
              Bar,
              {
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  legend: { display: false },
                },
              },
              "Belum ada data mitra",
            )}
          </ChartCard>
          {/* 
          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardHeader pb={2}>
              <Heading size="sm">Aktivitas Realtime</Heading>
              <Text fontSize="xs" color="gray.500">
                Perubahan data langsung dari Socket.IO
              </Text>
            </CardHeader>
            <CardBody pt={0} maxH="320px" overflowY="auto">
              {aktivitas.length === 0 ? (
                <Text fontSize="sm" color="gray.500" py={4}>
                  Belum ada aktivitas. Grafik akan diperbarui otomatis saat ada
                  perubahan data.
                </Text>
              ) : (
                <VStack align="stretch" spacing={3} divider={<Divider />}>
                  {aktivitas.map((item, idx) => (
                    <Box key={`${item.timestamp}-${idx}`}>
                      <HStack justify="space-between" mb={1}>
                        <Badge colorScheme={aktivitasColor(item.type)}>
                          {item.title}
                        </Badge>
                        <Text fontSize="xs" color="gray.400">
                          {formatDate(item.timestamp)}
                        </Text>
                      </HStack>
                      <Text fontSize="sm">{item.description}</Text>
                    </Box>
                  ))}
                </VStack>
              )}
            </CardBody>
          </Card> */}
        </SimpleGrid>
      </Container>
    </LayoutKPBPN>
  );
}

export default AdminDashborad;
