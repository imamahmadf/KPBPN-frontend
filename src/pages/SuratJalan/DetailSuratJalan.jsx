import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Text,
  useToast,
  Container,
  Heading,
  HStack,
  Badge,
  Flex,
  Spinner,
  Center,
  SimpleGrid,
  Image,
  VStack,
  Stack,
  Skeleton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import LayoutKPBPN from "../../Componets/KPBPN/LayoutKPBPN";
import VolumeMultiSatuan from "../../Componets/VolumeMultiSatuan";
import {
  ProduksiStickyBar,
  ProduksiSumurList,
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

const getDocumentUrl = (filePath) =>
  filePath ? `${API_BASE}${filePath}` : null;

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

const formatAngka = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  const angka = Number(value);
  if (Number.isNaN(angka)) return String(value);
  return formatVolumeNumber(angka);
};

const statusColor = (status) => {
  const value = String(status || "").toUpperCase();
  if (value === "TIBA") return "green";
  if (value === "VOLUME") return "purple";
  if (value === "BONGKAR") return "orange";
  if (value === "KIRIM") return "blue";
  if (value === "BATAL") return "red";
  return "gray";
};

const kualitasColor = (kualitas) =>
  String(kualitas || "").toUpperCase() === "ONSPEC" ? "green" : "orange";

const calcVolumeBarrelFromUkuran = (ukuranCairan, ukuranAir, factorTank) => {
  const cairan = Number(ukuranCairan);
  const air =
    ukuranAir === null || ukuranAir === undefined || ukuranAir === ""
      ? 0
      : Number(ukuranAir);
  const factor = Number(factorTank);
  if (
    ukuranCairan === null ||
    ukuranCairan === undefined ||
    ukuranCairan === "" ||
    Number.isNaN(cairan) ||
    Number.isNaN(air) ||
    Number.isNaN(factor) ||
    factor <= 0
  ) {
    return null;
  }
  return Math.round(((cairan - air) * factor + Number.EPSILON) * 1000) / 1000;
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

const SectionCard = ({ title, children, ...rest }) => (
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
    <Heading size="sm" color="kpbpn" mb={{ base: 3, md: 4 }}>
      {title}
    </Heading>
    {children}
  </Box>
);

const EmptyText = ({ children }) => (
  <Text fontSize="sm" color="gray.500">
    {children}
  </Text>
);

const FotoThumb = ({ src, alt, title, onOpen }) => {
  if (!src) return <EmptyText>Tidak ada foto</EmptyText>;
  const label = title || alt;
  return (
    <Box
      as="button"
      type="button"
      onClick={() => onOpen(src, label)}
      aria-label={`Perbesar ${label}`}
      w={{ base: "148px", md: "220px" }}
      h={{ base: "148px", md: "180px" }}
      p={1.5}
      borderRadius="md"
      border="1px solid"
      borderColor="gray.200"
      bg="white"
      overflow="hidden"
      display="flex"
      alignItems="center"
      justifyContent="center"
      cursor="pointer"
      flexShrink={0}
      transition="border-color 0.15s ease, box-shadow 0.15s ease"
      _hover={{ borderColor: "orange.300", boxShadow: "sm" }}
    >
      <Image
        src={getImageUrl(src)}
        alt={alt}
        maxW="100%"
        maxH="100%"
        objectFit="contain"
        pointerEvents="none"
      />
    </Box>
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

function DetailSuratJalan({
  match,
  backTo = "/pengiriman-kpbpn/surat-jalan",
  showExtendedSections = true,
  allowEditProduksiAnytime = false,
  showAutoFillProduksi = false,
  showHapusProduksi = false,
}) {
  const suratJalanId = match.params.id;
  const toast = useToast();

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [produksiPanel, setProduksiPanel] = useState({
    loading: false,
    saving: false,
    sumurList: [],
    sumurTerisiHariIni: [],
    inputs: {},
    volume: 0,
    satuan: "",
    satuanVolumeId: null,
    satuanVolumeOptions: [],
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editSnapshot, setEditSnapshot] = useState(null);
  const [previewFoto, setPreviewFoto] = useState(null);
  const [isHapusProduksiOpen, setIsHapusProduksiOpen] = useState(false);
  const [isDeletingProduksi, setIsDeletingProduksi] = useState(false);

  const openPreviewFoto = (src, title) => {
    setPreviewFoto({ src: getImageUrl(src), title: title || "Foto" });
  };

  const closePreviewFoto = () => setPreviewFoto(null);

  const fetchDetail = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE}/pengiriman/detail-surat-jalan/${suratJalanId}`,
      );
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
    if (!suratJalanId) return;

    setProduksiPanel((prev) => ({
      ...prev,
      loading: true,
      sumurList: [],
      sumurTerisiHariIni: [],
      inputs: {},
    }));

    try {
      const res = await axios.get(
        `${API_BASE}/pengiriman/get/produksi-sumur/${suratJalanId}`,
      );

      const sumurList = res.data.resultSumurMinyak || [];
      const existingProduksi = res.data.resultProduksi || [];
      const satuanVolumeOptions = res.data.resultSatuanVolume || [];
      const inputs = {};

      sumurList.forEach((sumur) => {
        const existing = existingProduksi.find(
          (p) => p.sumurMinyakId === sumur.id,
        );
        inputs[sumur.id] = existing?.produksi ?? "";
      });

      const defaultSatuanVolumeId =
        existingProduksi.find((p) => p.satuanVolumeId)?.satuanVolumeId ??
        res.data.suratJalan?.satuanVolumeId ??
        satuanVolumeOptions[0]?.id ??
        null;

      setProduksiPanel((prev) => ({
        ...prev,
        loading: false,
        sumurList,
        sumurTerisiHariIni: res.data.sumurTerisiHariIni || [],
        inputs,
        volume: res.data.suratJalan?.volume ?? 0,
        satuan: res.data.suratJalan?.satuanVolume?.satuan || "",
        satuanVolumeId: defaultSatuanVolumeId,
        satuanVolumeOptions,
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
  }, [suratJalanId]);

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
    return selected?.satuan || produksiPanel.satuan || "Barrel";
  }, [
    produksiPanel.satuanVolumeOptions,
    produksiPanel.satuanVolumeId,
    produksiPanel.satuan,
  ]);

  const isProduksiTotalValid = useMemo(
    () =>
      isVolumeEqual(
        totalProduksiInput,
        produksiSatuanLabel,
        produksiPanel.volume,
        produksiPanel.satuan || "Barrel",
      ),
    [
      totalProduksiInput,
      produksiSatuanLabel,
      produksiPanel.volume,
      produksiPanel.satuan,
    ],
  );

  const isProduksiOverLimit = useMemo(
    () =>
      isVolumeOver(
        totalProduksiInput,
        produksiSatuanLabel,
        produksiPanel.volume,
        produksiPanel.satuan || "Barrel",
      ),
    [
      totalProduksiInput,
      produksiSatuanLabel,
      produksiPanel.volume,
      produksiPanel.satuan,
    ],
  );

  const produksiComparison = isProduksiOverLimit
    ? "over"
    : isProduksiTotalValid
      ? "equal"
      : "under";

  const startEditProduksi = () => {
    setEditSnapshot({
      inputs: { ...produksiPanel.inputs },
      satuanVolumeId: produksiPanel.satuanVolumeId,
    });
    setIsEditing(true);
  };

  const cancelEditProduksi = () => {
    if (editSnapshot) {
      setProduksiPanel((prev) => ({
        ...prev,
        inputs: editSnapshot.inputs,
        satuanVolumeId: editSnapshot.satuanVolumeId,
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

    const getTingkatProduksi = (sumur) => {
      const raw = sumur?.tingkatProduksi;
      if (raw === null || raw === undefined || String(raw).trim() === "") {
        return 0;
      }
      const num = Number(raw);
      if (Number.isNaN(num) || num <= 0) return 0;
      return num;
    };

    const hasFillableWell = sumurList.some(
      (sumur) => getTingkatProduksi(sumur) > 0,
    );
    if (!hasFillableWell) {
      toast({
        title: "Tingkat produksi kosong",
        description:
          "Semua sumur memiliki tingkat produksi 0. Isi tingkat produksi di data klasifikasi sumur terlebih dahulu.",
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
      produksiPanel.volume,
      produksiPanel.satuan || "Barrel",
      produksiSatuanLabel,
    );

    if (targetVolume == null || targetVolume <= 0) {
      toast({
        title: "Volume surat jalan tidak valid",
        description:
          "Volume surat jalan harus lebih dari 0 untuk isi otomatis.",
        status: "warning",
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    const minProduksiPerSumur = 0.5;
    const maxProduksiPerSumur = 2;
    const filledToday = new Set(
      (produksiPanel.sumurTerisiHariIni || []).map((id) => Number(id)),
    );
    const belumTerisi = sumurList.filter(
      (sumur) =>
        !filledToday.has(Number(sumur.id)) && getTingkatProduksi(sumur) > 0,
    );
    const sudahTerisi = sumurList.filter(
      (sumur) =>
        filledToday.has(Number(sumur.id)) && getTingkatProduksi(sumur) > 0,
    );
    const eligibleCount = belumTerisi.length + sudahTerisi.length;
    const maxTotal = eligibleCount * maxProduksiPerSumur;

    const distribusi = (volume, wells) =>
      distributeRandomVolume(
        volume,
        wells,
        (sumur) => getTingkatProduksi(sumur),
        0.1,
        {
          minPerWell: minProduksiPerSumur,
          maxPerWell: maxProduksiPerSumur,
          leaveSomeEmpty: true,
        },
      );

    const inputs = {};
    sumurList.forEach((sumur) => {
      inputs[sumur.id] = 0;
    });

    const hasilUtama = belumTerisi.length
      ? distribusi(targetVolume, belumTerisi)
      : {};
    Object.assign(inputs, hasilUtama);

    const terisiUtama = Object.values(hasilUtama).reduce(
      (sum, value) => sum + (Number(value) || 0),
      0,
    );
    const sisaVolume = roundVolumeNumber(targetVolume - terisiUtama, 1) ?? 0;
    const utamaMasihMuat = belumTerisi.some(
      (sumur) => (Number(hasilUtama[sumur.id]) || 0) < maxProduksiPerSumur - 1e-9,
    );
    let pakaiCadangan = false;

    if (
      sisaVolume >= minProduksiPerSumur - 1e-9 &&
      sudahTerisi.length > 0 &&
      !utamaMasihMuat
    ) {
      Object.assign(inputs, distribusi(sisaVolume, sudahTerisi));
      pakaiCadangan = true;
    }

    setProduksiPanel((prev) => ({
      ...prev,
      inputs,
    }));

    let description =
      "Produksi diisi acak pada sumur yang belum punya produksi hari ini. Besaran mengikuti tingkat produksi. Angka terisi 0,5 sampai 2, dan sebagian sumur bisa tetap 0.";
    if (maxTotal + 1e-9 < targetVolume) {
      description =
        "Sumur yang belum punya produksi hari ini diutamakan. Setiap sumur paling banyak 2, jadi total belum mencapai volume surat jalan.";
    } else if (belumTerisi.length === 0) {
      description =
        "Semua sumur dengan tingkat produksi di atas 0 sudah punya produksi pada tanggal ini. Produksi diisi acak 0,5 sampai 2 berdasar tingkat produksi.";
    } else if (pakaiCadangan) {
      description =
        "Sumur yang belum punya produksi hari ini sudah diisi sampai batas 2. Sisa volume diisi ke sumur yang sudah punya produksi.";
    }

    toast({
      title: maxTotal < targetVolume ? "Isi otomatis terbatas" : "Isi otomatis",
      description,
      status: maxTotal < targetVolume ? "warning" : "success",
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

    if (!isProduksiTotalValid) {
      toast({
        title: "Total produksi tidak sesuai",
        description: `Total produksi harus sama dengan volume surat jalan (${produksiPanel.volume}${produksiPanel.satuan ? ` ${produksiPanel.satuan}` : ""})`,
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setProduksiPanel((prev) => ({ ...prev, saving: true }));

    try {
      await axios.post(`${API_BASE}/pengiriman/post/produksi-sumur`, {
        suratJalanId,
        satuanVolumeId: produksiPanel.satuanVolumeId,
        items,
      });

      toast({
        title: "Berhasil",
        description: "Produksi sumur berhasil disimpan.",
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

  const hapusProduksiSumur = async () => {
    setIsDeletingProduksi(true);
    try {
      const res = await axios.post(
        `${API_BASE}/pengiriman/delete/produksi-sumur/${suratJalanId}`,
      );
      const deletedProduksi = Number(res.data?.deletedProduksi) || 0;

      toast({
        title: deletedProduksi > 0 ? "Berhasil" : "Tidak ada data",
        description:
          deletedProduksi > 0
            ? `${deletedProduksi} data produksi sumur dihapus.`
            : "Tidak ada data produksi sumur pada surat jalan ini.",
        status: deletedProduksi > 0 ? "success" : "info",
        duration: 4000,
        isClosable: true,
      });

      setIsHapusProduksiOpen(false);
      await Promise.all([fetchDetail(), fetchProduksiPanel()]);
    } catch (err) {
      console.error(err);
      toast({
        title: "Gagal menghapus",
        description:
          err.response?.data?.error || "Gagal menghapus produksi sumur",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsDeletingProduksi(false);
    }
  };

  const konfirmasiList = data?.konfirmasiPenerimaans || [];
  const satuanSurat = data?.satuanVolume?.satuan || "Barrel";
  const canEditProduksi =
    allowEditProduksiAnytime || data?.statusSuratJalanId === 1;
  const isProduksiEditing = canEditProduksi && isEditing;
  const displayedSumurList = canEditProduksi
    ? produksiPanel.sumurList
    : produksiPanel.sumurList.filter((sumur) => {
        const value = produksiPanel.inputs[sumur.id];
        return value !== "" && value != null && Number(value) > 0;
      });

  const pengisianList = useMemo(() => {
    const items = [];
    konfirmasiList.forEach((kp) => {
      (kp.pengisianTankis || []).forEach((pt) => {
        items.push({ ...pt, konfirmasiNomor: kp.nomor, konfirmasiId: kp.id });
      });
    });
    return items;
  }, [konfirmasiList]);

  const ujiLabList = useMemo(() => {
    const map = new Map();
    pengisianList.forEach((pt) => {
      (pt.BABongkar?.ujiLabK3S || []).forEach((uji) => {
        if (uji?.id && !map.has(uji.id)) map.set(uji.id, uji);
      });
    });
    return Array.from(map.values());
  }, [pengisianList]);

  const bak3sList = useMemo(() => {
    const map = new Map();
    pengisianList.forEach((pt) => {
      const bak = pt.BABongkar?.BAK3S;
      if (bak?.id && !map.has(bak.id)) {
        map.set(bak.id, {
          ...bak,
          baTanggal: pt.BABongkar?.tanggal,
          baId: pt.BABongkar?.id,
          tankiKode: pt.tanki?.kode,
        });
      }
    });
    return Array.from(map.values());
  }, [pengisianList]);

  const baBongkarList = useMemo(() => {
    const factorByTankiId = new Map();
    pengisianList.forEach((pt) => {
      const tangkiId = pt.tanki?.id ?? pt.tangkiId;
      if (tangkiId != null && pt.tanki?.factorTank != null) {
        factorByTankiId.set(tangkiId, pt.tanki.factorTank);
      }
    });

    const map = new Map();
    pengisianList.forEach((pt) => {
      const ba = pt.BABongkar;
      if (ba?.id && !map.has(ba.id)) {
        map.set(ba.id, {
          ...ba,
          tankiKode: pt.tanki?.kode,
          konfirmasiNomor: pt.konfirmasiNomor,
          factorTank: pt.tanki?.factorTank,
          BABongkarTankis: (ba.BABongkarTankis || []).map((item) => {
            const tangkiId = item.tanki?.id ?? item.tangkiId;
            return {
              ...item,
              factorTank:
                item.tanki?.factorTank ?? factorByTankiId.get(tangkiId) ?? null,
            };
          }),
        });
      }
    });
    return Array.from(map.values());
  }, [pengisianList]);

  const renderDokumenBak3s = (dokumen) => {
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
          p={{ base: 4, sm: 5, md: 6, lg: "30px" }}
          my={{ base: 4, md: "30px" }}
        >
          <VStack align="stretch" spacing={2} mb={{ base: 4, md: 6 }}>
            <Button
              as={RouterLink}
              to={backTo}
              variant="ghost"
              size="sm"
              alignSelf={{ base: "stretch", sm: "flex-start" }}
            >
              ← Kembali ke Surat Jalan
            </Button>
            <Flex
              direction={{ base: "column", sm: "row" }}
              align={{ base: "stretch", sm: "center" }}
              justify="space-between"
              gap={2}
            >
              <Box>
                <Heading
                  color="kpbpn"
                  size={{ base: "md", md: "lg" }}
                  wordBreak="break-word"
                >
                  Detail Surat Jalan
                </Heading>
                {data && (
                  <HStack mt={2} spacing={2} flexWrap="wrap">
                    <Text
                      color="gray.600"
                      fontWeight="medium"
                      fontSize={{ base: "sm", md: "md" }}
                      wordBreak="break-word"
                    >
                      {data.nomor || `Surat Jalan #${data.id}`}
                    </Text>
                    <Badge
                      colorScheme={statusColor(data.statusSuratJalan?.status)}
                      variant="subtle"
                    >
                      {data.statusSuratJalan?.status || "-"}
                    </Badge>
                  </HStack>
                )}
              </Box>
            </Flex>
          </VStack>

          {isLoading ? (
            <Center py={16}>
              <Spinner size="lg" color="kpbpn" />
            </Center>
          ) : !data ? (
            <Center py={16}>
              <Text color="gray.500">Surat jalan tidak ditemukan</Text>
            </Center>
          ) : (
            <Stack spacing={{ base: 4, md: 6 }}>
              <SimpleGrid
                columns={{ base: 1, lg: 2 }}
                spacing={{ base: 4, md: 6 }}
                alignItems="stretch"
              >
                <SectionCard title="Data Surat Jalan">
                  <SimpleGrid
                    columns={{ base: 1, sm: 2 }}
                    spacing={{ base: 3, md: 4 }}
                  >
                    <InfoField label="Nomor">{data.nomor || "-"}</InfoField>
                    <InfoField label="Tanggal">
                      {formatTanggal(data.tanggal)}
                    </InfoField>
                    <InfoField label="Status">
                      <Badge
                        colorScheme={statusColor(data.statusSuratJalan?.status)}
                        variant="subtle"
                      >
                        {data.statusSuratJalan?.status || "-"}
                      </Badge>
                    </InfoField>
                    <InfoField label="Mitra">
                      {data.mitra?.nama || "-"}
                    </InfoField>
                    <InfoField label="Jenis Mitra">
                      {data.mitra?.jenisMitra?.jenis || "-"}
                    </InfoField>
                    <InfoField label="Stasiun Pengumpul Minyak">
                      {data.stasiunPengumpulMinyak?.nama || "-"}
                    </InfoField>
                    {/* <InfoField label="Asal Minyak">
                      {data.asalMinyak
                        ? [data.asalMinyak.nomor, data.asalMinyak.asal]
                            .filter(Boolean)
                            .join(" - ") || "-"
                        : "-"}
                    </InfoField> */}
                    <InfoField label="Volume">
                      <VolumeMultiSatuan
                        volume={data.volume}
                        satuan={satuanSurat}
                        primarySatuan="drum"
                      />
                    </InfoField>
                    <InfoField label="Jam Datang">
                      {formatJam(data.jamDatang)}
                    </InfoField>
                    <InfoField label="Jam Pergi">
                      {formatJam(data.jamPergi)}
                    </InfoField>
                    <InfoField label="Unit Kerja">
                      {data.daftarUnitKerja?.unitKerja || "-"}
                    </InfoField>
                    <InfoField label="Kode Verifikasi">
                      {data.verifikasi || "-"}
                    </InfoField>
                    <InfoField label="Alamat Mitra">
                      {data.mitra?.alamat || "-"}
                    </InfoField>
                  </SimpleGrid>
                </SectionCard>

                <SectionCard title="Kendaraan / Transportir">
                  <SimpleGrid
                    columns={{ base: 1, sm: 2 }}
                    spacing={{ base: 3, md: 4 }}
                  >
                    <InfoField label="Plat">
                      {data.transportir?.plat || "-"}
                    </InfoField>
                    <InfoField label="Jenis">
                      {data.transportir?.jenisTransportir?.jenis || "-"}
                    </InfoField>
                    <InfoField label="Kapasitas">
                      {data.transportir?.kapasitas != null
                        ? `${data.transportir.kapasitas} ${
                            data.transportir.satuanVolume?.satuan || ""
                          }`.trim()
                        : "-"}
                    </InfoField>
                    <InfoField label="Nama Supir">
                      {data.supir?.nama || "-"}
                    </InfoField>
                    <InfoField label="NIK Supir">
                      {data.supir?.nik || "-"}
                    </InfoField>
                  </SimpleGrid>
                  <SimpleGrid
                    columns={{ base: 1, sm: 2 }}
                    spacing={{ base: 3, md: 4 }}
                    mt={{ base: 3, md: 4 }}
                  >
                    <InfoField label="Foto Kendaraan">
                      <FotoThumb
                        src={data.transportir?.foto}
                        alt={data.transportir?.plat || "Kendaraan"}
                        title="Foto Kendaraan"
                        onOpen={openPreviewFoto}
                      />
                    </InfoField>
                    <InfoField label="Foto Supir">
                      <FotoThumb
                        src={data.supir?.foto}
                        alt={data.supir?.nama || "Supir"}
                        title="Foto Supir"
                        onOpen={openPreviewFoto}
                      />
                    </InfoField>
                  </SimpleGrid>
                </SectionCard>
              </SimpleGrid>

              <SectionCard
                title="Input Produksi Sumur"
                overflow="visible"
                minW={0}
              >
                {produksiPanel.loading ? (
                  <Stack spacing={3}>
                    <Skeleton height="20px" />
                    <Skeleton height="36px" />
                    <Skeleton height="36px" />
                  </Stack>
                ) : displayedSumurList.length === 0 ? (
                  <Stack spacing={3}>
                    {showHapusProduksi && canEditProduksi && (
                      <Button
                        variant="outline"
                        colorScheme="red"
                        size="sm"
                        alignSelf="flex-start"
                        onClick={() => setIsHapusProduksiOpen(true)}
                        isDisabled={isDeletingProduksi}
                      >
                        Hapus Produksi
                      </Button>
                    )}
                    <EmptyText>
                      {produksiPanel.sumurList.length === 0
                        ? "Tidak ada data sumur minyak untuk mitra ini."
                        : "Belum ada data produksi sumur untuk surat jalan ini."}
                    </EmptyText>
                  </Stack>
                ) : (
                  <>
                    <ProduksiStickyBar
                      totalProduksiInput={totalProduksiInput}
                      produksiSatuanLabel={produksiSatuanLabel}
                      acuanVolume={produksiPanel.volume}
                      acuanSatuan={produksiPanel.satuan || satuanSurat}
                      acuanLabel="Volume Surat Jalan"
                      comparison={produksiComparison}
                      statusHintOver="Total produksi harus sama dengan volume surat jalan"
                      statusHintUnder="Total produksi harus sama dengan volume surat jalan"
                      satuanVolumeId={produksiPanel.satuanVolumeId}
                      satuanVolumeOptions={produksiPanel.satuanVolumeOptions}
                      onSatuanChange={handleSatuanChange}
                      isEditing={isProduksiEditing}
                      saving={produksiPanel.saving}
                      canSave={
                        isProduksiEditing &&
                        isProduksiTotalValid &&
                        Boolean(produksiPanel.satuanVolumeId) &&
                        !produksiPanel.loading
                      }
                      onEdit={startEditProduksi}
                      onCancel={cancelEditProduksi}
                      onSave={saveProduksiSumur}
                      onAutoFill={autoFillProduksiSumur}
                      onDelete={() => setIsHapusProduksiOpen(true)}
                      showEditButton={canEditProduksi}
                      showSaveButton={canEditProduksi}
                      showAutoFillButton={
                        showAutoFillProduksi && isProduksiEditing
                      }
                      showDeleteButton={showHapusProduksi && canEditProduksi}
                      deleting={isDeletingProduksi}
                      primarySatuan="drum"
                    />

                    <ProduksiSumurList
                      sumurList={displayedSumurList}
                      inputs={produksiPanel.inputs}
                      isEditing={isProduksiEditing}
                      produksiSatuanLabel={produksiSatuanLabel}
                      onInputChange={handleProduksiInputChange}
                      primarySatuan="drum"
                    />
                  </>
                )}
              </SectionCard>

              {showExtendedSections && (
                <>
                  <SectionCard title="Konfirmasi Penerimaan">
                    {konfirmasiList.length === 0 ? (
                      <EmptyText>
                        Belum ada konfirmasi penerimaan untuk surat jalan ini.
                      </EmptyText>
                    ) : (
                      <Stack spacing={4}>
                        {konfirmasiList.map((kp) => (
                          <NestedCard key={kp.id}>
                            <SimpleGrid
                              columns={{ base: 1, sm: 2 }}
                              spacing={{ base: 3, md: 4 }}
                            >
                              <InfoField label="Nomor Konfirmasi">
                                {kp.nomor || "-"}
                              </InfoField>
                              <InfoField label="Tanggal">
                                {formatTanggal(kp.tanggal)}
                              </InfoField>
                              <InfoField label="Jam Kedatangan">
                                {formatJam(kp.jamKedatangan)}
                              </InfoField>
                              <InfoField label="Volume Diterima">
                                <VolumeMultiSatuan
                                  volume={kp.volume}
                                  satuan={satuanSurat}
                                  primarySatuan="drum"
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
                              <Box gridColumn={{ sm: "span 2" }}>
                                <InfoField label="Catatan">
                                  {kp.catatan || "-"}
                                </InfoField>
                              </Box>
                              <Box>
                                <InfoField label="Foto Bukti Penerimaan">
                                  <FotoThumb
                                    src={kp.foto}
                                    alt={`Foto konfirmasi ${kp.nomor || kp.id}`}
                                    title="Foto Bukti Penerimaan"
                                    onOpen={openPreviewFoto}
                                  />
                                </InfoField>
                              </Box>
                              <Box>
                                <InfoField label="Foto Lab">
                                  <FotoThumb
                                    src={kp.fotoLab}
                                    alt={`Foto lab ${kp.nomor || kp.id}`}
                                    title="Foto Lab"
                                    onOpen={openPreviewFoto}
                                  />
                                </InfoField>
                              </Box>
                            </SimpleGrid>
                          </NestedCard>
                        ))}
                      </Stack>
                    )}
                  </SectionCard>

                  <SectionCard title="Pengisian Tanki">
                    {pengisianList.length === 0 ? (
                      <EmptyText>
                        Belum ada data pengisian tanki yang terhubung dengan
                        surat jalan ini.
                      </EmptyText>
                    ) : (
                      <Stack spacing={4}>
                        {pengisianList.map((pt) => (
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
                              {pt.konfirmasiNomor && (
                                <Badge colorScheme="blue" variant="subtle">
                                  Konfirmasi {pt.konfirmasiNomor}
                                </Badge>
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
                                {pt.tanki?.kapasitas != null ? (
                                  <VolumeMultiSatuan
                                    volume={pt.tanki.kapasitas}
                                    satuan={
                                      pt.tanki.satuanVolume?.satuan ||
                                      satuanSurat
                                    }
                                    primarySatuan="liter"
                                  />
                                ) : (
                                  "-"
                                )}
                              </InfoField>
                              <InfoField label="Gross">
                                <VolumeMultiSatuan
                                  volume={pt.gross}
                                  satuan={
                                    pt.satuanVolume?.satuan || satuanSurat
                                  }
                                  primarySatuan="liter"
                                />
                              </InfoField>
                              <InfoField label="Net">
                                <VolumeMultiSatuan
                                  volume={pt.net}
                                  satuan={
                                    pt.satuanVolume?.satuan || satuanSurat
                                  }
                                  primarySatuan="liter"
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
                        ))}
                      </Stack>
                    )}
                  </SectionCard>

                  <SimpleGrid
                    columns={{ base: 1, lg: 3 }}
                    spacing={{ base: 4, md: 6 }}
                    alignItems="stretch"
                  >
                    <SectionCard title="BA Bongkar">
                      {baBongkarList.length === 0 ? (
                        <EmptyText>
                          Belum ada data BA Bongkar yang terhubung dengan surat
                          jalan ini.
                        </EmptyText>
                      ) : (
                        <Stack spacing={3}>
                          {baBongkarList.map((ba) => {
                            const tankiRows = ba.BABongkarTankis || [];
                            const tankiLabel =
                              tankiRows
                                .map(
                                  (item) =>
                                    item.tanki?.kode ||
                                    (item.tangkiId
                                      ? `Tanki #${item.tangkiId}`
                                      : null),
                                )
                                .filter(Boolean)
                                .join(", ") ||
                              ba.tankiKode ||
                              `BA #${ba.id}`;

                            return (
                              <NestedCard key={ba.id}>
                                <HStack
                                  justify="space-between"
                                  mb={3}
                                  flexWrap="wrap"
                                  gap={2}
                                >
                                  <Text
                                    fontWeight="bold"
                                    color="kpbpn"
                                    fontSize="sm"
                                  >
                                    {tankiLabel}
                                  </Text>
                                  <Text fontSize="xs" color="gray.500">
                                    {formatTanggal(ba.tanggal)}
                                  </Text>
                                </HStack>
                                {tankiRows.length === 0 ? (
                                  <SimpleGrid
                                    columns={{ base: 1, sm: 2 }}
                                    spacing={3}
                                  >
                                    <InfoField label="Ukuran Cairan">
                                      {formatAngka(ba.ukuranCairan)}
                                    </InfoField>
                                    <InfoField label="Ukuran Air">
                                      {formatAngka(ba.ukuranAir)}
                                    </InfoField>
                                    <Box gridColumn={{ sm: "span 2" }}>
                                      <InfoField label="Volume">
                                        <VolumeMultiSatuan
                                          volume={calcVolumeBarrelFromUkuran(
                                            ba.ukuranCairan,
                                            ba.ukuranAir,
                                            ba.factorTank,
                                          )}
                                          satuan="barrel"
                                          primarySatuan="barrel"
                                        />
                                      </InfoField>
                                    </Box>
                                  </SimpleGrid>
                                ) : (
                                  <Stack spacing={2}>
                                    {tankiRows.map((baTanki) => (
                                      <Box
                                        key={baTanki.id}
                                        p={3}
                                        borderRadius="md"
                                        bg="gray.50"
                                      >
                                        <Text
                                          fontSize="sm"
                                          fontWeight="semibold"
                                          color="gray.700"
                                          mb={2}
                                        >
                                          {baTanki.tanki?.kode ||
                                            `Tanki #${baTanki.tangkiId}`}
                                        </Text>
                                        <InfoField label="Volume">
                                          <VolumeMultiSatuan
                                            volume={calcVolumeBarrelFromUkuran(
                                              baTanki.ukuranCairan,
                                              baTanki.ukuranAir,
                                              baTanki.factorTank,
                                            )}
                                            satuan="barrel"
                                            primarySatuan="barrel"
                                          />
                                        </InfoField>
                                        <SimpleGrid columns={2} spacing={2} mt={2}>
                                          <InfoField label="Cairan">
                                            {formatAngka(baTanki.ukuranCairan)}
                                          </InfoField>
                                          <InfoField label="Air">
                                            {formatAngka(baTanki.ukuranAir)}
                                          </InfoField>
                                        </SimpleGrid>
                                      </Box>
                                    ))}
                                  </Stack>
                                )}
                              </NestedCard>
                            );
                          })}
                        </Stack>
                      )}
                    </SectionCard>

                    <SectionCard title="BAK3S">
                      {bak3sList.length === 0 ? (
                        <EmptyText>
                          Belum ada data BAK3S yang terhubung dengan surat jalan
                          ini.
                        </EmptyText>
                      ) : (
                        <Stack spacing={3}>
                          {bak3sList.map((bak) => (
                            <NestedCard key={bak.id}>
                              <HStack
                                justify="space-between"
                                mb={3}
                                flexWrap="wrap"
                                gap={2}
                              >
                                <Text
                                  fontWeight="bold"
                                  color="kpbpn"
                                  fontSize="sm"
                                >
                                  {bak.tankiKode || `BA #${bak.baId || bak.id}`}
                                </Text>
                                <Text fontSize="xs" color="gray.500">
                                  {formatTanggal(bak.tanggal || bak.baTanggal)}
                                </Text>
                              </HStack>
                              <SimpleGrid
                                columns={{ base: 1, sm: 2 }}
                                spacing={3}
                              >
                                <InfoField label="Tanggal">
                                  {formatTanggal(bak.tanggal || bak.baTanggal)}
                                </InfoField>
                                <InfoField label="API">
                                  {formatAngka(bak.api)}
                                </InfoField>
                                <InfoField label="BSNW">
                                  {formatAngka(bak.BSNW)}
                                </InfoField>
                                <InfoField label="Produksi">
                                  <VolumeMultiSatuan
                                    volume={bak.produksi}
                                    satuan="barrel"
                                    primarySatuan="barrel"
                                  />
                                </InfoField>
                                <InfoField label="SG">
                                  {formatAngka(bak.sg)}
                                </InfoField>
                                <Box gridColumn={{ sm: "span 2" }}>
                                  <InfoField label="Dokumen">
                                    {renderDokumenBak3s(bak.dokumen)}
                                  </InfoField>
                                </Box>
                              </SimpleGrid>
                            </NestedCard>
                          ))}
                        </Stack>
                      )}
                    </SectionCard>

                    <SectionCard title="Uji Lab K3S">
                      {ujiLabList.length === 0 ? (
                        <EmptyText>
                          Belum ada data uji lab K3S yang terhubung dengan surat
                          jalan ini.
                        </EmptyText>
                      ) : (
                        <Stack spacing={3}>
                          {ujiLabList.map((uji) => (
                            <NestedCard key={uji.id}>
                              <HStack
                                justify="space-between"
                                mb={3}
                                flexWrap="wrap"
                                gap={2}
                              >
                                <Text
                                  fontWeight="bold"
                                  color="kpbpn"
                                  fontSize="sm"
                                >
                                  {uji.tanki?.kode || "Tanki"}
                                </Text>
                                <Badge
                                  colorScheme={kualitasColor(uji.kualitas)}
                                  variant="subtle"
                                >
                                  {uji.kualitas || "-"}
                                </Badge>
                              </HStack>
                              <SimpleGrid
                                columns={{ base: 1, sm: 2 }}
                                spacing={3}
                              >
                                <InfoField label="Tanggal">
                                  {formatTanggal(uji.tanggal)}
                                </InfoField>
                                <InfoField label="API">
                                  {formatAngka(uji.api)}
                                </InfoField>
                                <InfoField label="BSNW">
                                  {formatAngka(uji.BSNW)}
                                </InfoField>
                                <InfoField label="Suhu">
                                  {formatAngka(uji.suhu)}
                                </InfoField>
                                <InfoField label="SG">
                                  {formatAngka(uji.sg)}
                                </InfoField>
                                <Box gridColumn={{ sm: "span 2" }}>
                                  <InfoField label="Foto">
                                    <FotoThumb
                                      src={uji.foto}
                                      alt="Foto uji lab"
                                      title="Foto Uji Lab"
                                      onOpen={openPreviewFoto}
                                    />
                                  </InfoField>
                                </Box>
                              </SimpleGrid>
                            </NestedCard>
                          ))}
                        </Stack>
                      )}
                    </SectionCard>
                  </SimpleGrid>
                </>
              )}
            </Stack>
          )}
        </Container>
      </Box>

      <Modal
        isOpen={Boolean(previewFoto)}
        onClose={closePreviewFoto}
        size="xl"
        isCentered
      >
        <ModalOverlay />
        <ModalContent
          mx={{ base: 3, md: 4 }}
          maxW={{ base: "calc(100vw - 1.5rem)", md: "xl" }}
          maxH="90vh"
        >
          <ModalHeader pr={12} fontSize={{ base: "md", md: "lg" }}>
            {previewFoto?.title || "Foto"}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody
            pb={6}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            {previewFoto?.src ? (
              <Image
                src={previewFoto.src}
                alt={previewFoto.title}
                w="100%"
                maxH="70vh"
                objectFit="contain"
                borderRadius="md"
              />
            ) : null}
          </ModalBody>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isHapusProduksiOpen}
        onClose={() => {
          if (!isDeletingProduksi) setIsHapusProduksiOpen(false);
        }}
        isCentered
        closeOnOverlayClick={!isDeletingProduksi}
        closeOnEsc={!isDeletingProduksi}
      >
        <ModalOverlay />
        <ModalContent
          mx={4}
          w="auto"
          maxW={{ base: "calc(100vw - 2rem)", md: "md" }}
        >
          <ModalHeader pr={12} fontSize={{ base: "lg", md: "xl" }}>
            Hapus Produksi
          </ModalHeader>
          <ModalCloseButton isDisabled={isDeletingProduksi} />
          <ModalBody>
            <Text>
              Semua data produksi sumur pada surat jalan{" "}
              <Text as="span" fontWeight="bold">
                {data?.nomor || `#${suratJalanId}`}
              </Text>{" "}
              akan dihapus. Status surat jalan tidak berubah.
            </Text>
          </ModalBody>
          <ModalFooter
            flexDir={{ base: "column-reverse", sm: "row" }}
            gap={2}
          >
            <Button
              variant="outline"
              w={{ base: "full", sm: "auto" }}
              onClick={() => setIsHapusProduksiOpen(false)}
              isDisabled={isDeletingProduksi}
            >
              Tutup
            </Button>
            <Button
              colorScheme="red"
              w={{ base: "full", sm: "auto" }}
              onClick={hapusProduksiSumur}
              isLoading={isDeletingProduksi}
            >
              Hapus Produksi
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </LayoutKPBPN>
  );
}

export default DetailSuratJalan;
