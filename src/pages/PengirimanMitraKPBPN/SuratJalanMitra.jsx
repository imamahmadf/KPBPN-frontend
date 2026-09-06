import React, { useState, useEffect, useRef, useMemo } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useSelector } from "react-redux";
import { selectMitra, selectRoleIds } from "../../Redux/Reducers/auth";
import ReactPaginate from "react-paginate";
import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Text,
  VStack,
  useToast,
  Container,
  Thead,
  Table,
  Tr,
  Th,
  Td,
  Tbody,
  Heading,
  Divider,
  Badge,
  Flex,
  Spacer,
  SimpleGrid,
  Skeleton,
  Stack,
  HStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Collapse,
} from "@chakra-ui/react";
import { Select as Select2 } from "chakra-react-select";
import LayoutKPBPN from "../../Componets/KPBPN/LayoutKPBPN";
import VolumeMultiSatuan from "../../Componets/VolumeMultiSatuan";
import { isVolumeEqual } from "../../lib/volumeSatuan";
import "../../Style/pagination.css";

const API_BASE = import.meta.env.VITE_REACT_APP_API_BASE_URL;
const ROLE_SUPER_ADMIN = 1;

const suratJalanSchema = Yup.object({
  tanggal: Yup.string().required("Tanggal wajib diisi"),
  mitraId: Yup.mixed().nullable().required("Mitra wajib dipilih"),
  transportirId: Yup.mixed().nullable().required("Transportir wajib dipilih"),
  stasiunPengumpulMinyakId: Yup.mixed()
    .nullable()
    .required("Stasiun pengumpul minyak wajib dipilih"),
  asalMinyakId: Yup.mixed()
    .nullable()
    .required("Asal minyak wajib dipilih"),
  volume: Yup.number()
    .typeError("Volume harus angka")
    .positive("Volume harus lebih dari 0")
    .required("Volume wajib diisi"),
  satuanVolumeId: Yup.mixed()
    .nullable()
    .required("Satuan volume wajib dipilih"),
  supirId: Yup.mixed().nullable().required("Supir wajib dipilih"),
  jamDatang: Yup.string().required("Tanggal wajib diisi"),
  jamPergi: Yup.string().required("Tanggal wajib diisi"),
});

const initialValuesTambahBase = {
  tanggal: "",
  mitraId: null,
  transportirId: null,
  stasiunPengumpulMinyakId: null,
  asalMinyakId: null,
  volume: "",
  satuanVolumeId: null,
  supirId: null,
  jamDatang: "",
  jamPergi: "",
};

const selectStyles = {
  components: {
    DropdownIndicator: () => null,
    IndicatorSeparator: () => null,
  },
  chakraStyles: {
    container: (provided) => ({
      ...provided,
      borderRadius: "6px",
    }),
    control: (provided) => ({
      ...provided,
      backgroundColor: "terang",
      border: "0px",
      height: "50px",
      _hover: { borderColor: "yellow.700" },
      minHeight: "40px",
    }),
    option: (provided, state) => ({
      ...provided,
      bg: state.isFocused ? "kpbpn" : "white",
      color: state.isFocused ? "white" : "black",
    }),
  },
};

const formatTransportirLabel = (val) => {
  if (!val) return "";
  const satuan = val?.satuanVolume?.satuan;
  const kapasitas = val?.kapasitas;
  let label = val.plat || `Transportir #${val.id}`;
  if (kapasitas) {
    label += ` (${kapasitas}${satuan ? ` ${satuan}` : ""})`;
  }
  return label;
};

const formatMitraLabel = (val) => {
  if (!val) return "";
  return val.kode
    ? `${val.nama} (${val.kode})`
    : val.nama || `Mitra #${val.id}`;
};

const formatAsalMinyakLabel = (val) => {
  if (!val) return "";
  if (val.nomor && val.asal) return `${val.nomor} - ${val.asal}`;
  return val.asal || val.nomor || `Asal #${val.id}`;
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

const SuratJalanMitra = () => {
  const toast = useToast();
  const mitra = useSelector(selectMitra);
  const userRoleIds = useSelector(selectRoleIds);
  const isSuperAdmin = (userRoleIds || []).includes(ROLE_SUPER_ADMIN);
  const mitraId = mitra?.id ?? null;
  const dataListRef = useRef(null);
  const formikRefTambah = useRef(null);
  const {
    isOpen: isTambahOpen,
    onOpen: onTambahOpen,
    onClose: onTambahClose,
  } = useDisclosure();

  const [dataSuratJalan, setDataSuratJalan] = useState([]);
  const [dataSeed, setDataSeed] = useState(null);
  const [page, setPage] = useState(0);
  const [limit] = useState(50);
  const [pages, setPages] = useState(0);
  const [rows, setRows] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingCetak, setLoadingCetak] = useState({});
  const [expandedProduksiId, setExpandedProduksiId] = useState(null);
  const [produksiPanel, setProduksiPanel] = useState({
    loading: false,
    saving: false,
    sumurList: [],
    inputs: {},
    volume: 0,
    satuan: "",
    satuanVolumeId: null,
    satuanVolumeOptions: [],
  });

  const TABLE_COL_SPAN = 12;

  const [mitraFilterId, setMitraFilterId] = useState(0);
  const [transportirFilterId, setTransportirFilterId] = useState(0);
  const [supirFilterId, setSupirFilterId] = useState(0);
  const [stasiunPengumpulMinyakFilterId, setStasiunPengumpulMinyakFilterId] =
    useState(0);
  const [asalMinyakFilterId, setAsalMinyakFilterId] = useState(0);
  const [statusSuratJalanFilterId, setStatusSuratJalanFilterId] = useState(0);
  const [tanggalAwal, setTanggalAwal] = useState("");
  const [tanggalAkhir, setTanggalAkhir] = useState("");
  const [sortBy, setSortBy] = useState("tanggal");
  const [sortOrder, setSortOrder] = useState("DESC");

  const initialValuesTambah = useMemo(
    () => ({
      ...initialValuesTambahBase,
      mitraId: isSuperAdmin ? null : mitraId,
    }),
    [isSuperAdmin, mitraId],
  );

  const allSupir = useMemo(() => {
    const mitraList = dataSeed?.resultMitra || [];
    if (isSuperAdmin) {
      return mitraList.flatMap((m) =>
        (m.supirs || []).map((s) => ({
          ...s,
          mitraNama: m.nama,
        })),
      );
    }
    if (!mitraId) return [];
    const mitraData = mitraList.find(
      (m) => String(m.id) === String(mitraId),
    );
    return (mitraData?.supirs || []).map((s) => ({
      ...s,
      mitraNama: mitraData?.nama || mitra?.nama,
    }));
  }, [dataSeed, isSuperAdmin, mitraId, mitra?.nama]);

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
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const scrollToDataList = () => {
    dataListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const changePage = ({ selected }) => {
    setPage(selected);
    scrollToDataList();
  };

  const fetchSeed = async () => {
    try {
      const res = await axios.get(`${API_BASE}/pengiriman/get/seed`);
      setDataSeed(res.data);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error!",
        description: "Gagal memuat data filter surat jalan",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const fetchDataSuratJalan = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/pengiriman/get`, {
        params: {
          page,
          limit,
          mitraId: isSuperAdmin
            ? mitraFilterId || undefined
            : mitraId || undefined,
          transportirId: transportirFilterId || undefined,
          supirId: supirFilterId || undefined,
          stasiunPengumpulMinyakId: stasiunPengumpulMinyakFilterId || undefined,
          asalMinyakId: asalMinyakFilterId || undefined,
          statusSuratJalanId: statusSuratJalanFilterId || undefined,
          startDate: tanggalAwal || undefined,
          endDate: tanggalAkhir || undefined,
          sortBy,
          sortOrder,
        },
      });
      setDataSuratJalan(res.data.result || []);
      setPages(res.data.totalPage || 0);
      setRows(res.data.totalRows || 0);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error!",
        description: "Gagal memuat data surat jalan",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetFilter = () => {
    setMitraFilterId(0);
    setTransportirFilterId(0);
    setSupirFilterId(0);
    setStasiunPengumpulMinyakFilterId(0);
    setAsalMinyakFilterId(0);
    setStatusSuratJalanFilterId(0);
    setTanggalAwal("");
    setTanggalAkhir("");
    setSortBy("tanggal");
    setSortOrder("DESC");
  };

  const handleCloseTambahModal = () => {
    formikRefTambah.current?.resetForm();
    onTambahClose();
  };

  const submitTambahSuratJalan = async (
    values,
    { setSubmitting, resetForm },
  ) => {
    try {
      await axios.post(`${API_BASE}/pengiriman/post`, {
        nomor: values.nomor,
        tanggal: values.tanggal,
        mitraId: values.mitraId || mitraId,
        transportirId: values.transportirId,
        stasiunPengumpulMinyakId: values.stasiunPengumpulMinyakId,
        asalMinyakId: values.asalMinyakId,
        volume: values.volume,
        satuanVolumeId: values.satuanVolumeId,
        supirId: values.supirId,
        jamDatang: values.jamDatang,
        jamPergi: values.jamPergi,
      });

      toast({
        title: "Berhasil!",
        description: "Surat jalan berhasil ditambahkan.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      resetForm();
      onTambahClose();
      await fetchDataSuratJalan();
    } catch (err) {
      console.error(err);
      toast({
        title: "Error!",
        description:
          err.response?.data?.error || "Gagal menambahkan surat jalan",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenTambahModal = () => {
    if (!isSuperAdmin && !mitraId) {
      toast({
        title: "Mitra tidak ditemukan",
        description:
          "Akun Anda tidak terhubung ke mitra. Hubungi administrator.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    onTambahOpen();
  };

  const getSupirByMitra = (selectedMitraId) => {
    if (!selectedMitraId) return [];
    const mitraData = (dataSeed?.resultMitra || []).find(
      (m) => String(m.id) === String(selectedMitraId),
    );
    return mitraData?.supirs || [];
  };

  const cetakSuratJalan = async (item) => {
    setLoadingCetak((prev) => ({ ...prev, [item.id]: true }));
    try {
      const res = await axios.get(
        `${API_BASE}/pengiriman/get/cetak/${item.id}`,
        { responseType: "blob" },
      );

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `surat-jalan_${item.nomor || item.id}.docx`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Berhasil",
        description: "Dokumen surat jalan berhasil diunduh",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error(err);
      let message = "Gagal mengunduh dokumen surat jalan";

      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          message = parsed.error || message;
        } catch {
          // gunakan pesan default
        }
      } else if (err.response?.data?.error) {
        message = err.response.data.error;
      }

      toast({
        title: "Gagal",
        description: message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoadingCetak((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  const fetchProduksiPanel = async (item) => {
    setProduksiPanel((prev) => ({
      ...prev,
      loading: true,
      sumurList: [],
      inputs: {},
      volume: item.volume || 0,
      satuan: item.satuanVolume?.satuan || "",
      satuanVolumeId: item.satuanVolumeId || null,
    }));

    try {
      const res = await axios.get(
        `${API_BASE}/pengiriman/get/produksi-sumur/${item.id}`,
      );

      const sumurList = res.data.resultSumurMinyak || [];
      const existingProduksi = res.data.resultProduksi || [];
      const satuanVolumeOptions =
        res.data.resultSatuanVolume ||
        dataSeed?.resultSatuanVolume ||
        [];
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
        item.satuanVolumeId ??
        satuanVolumeOptions[0]?.id ??
        null;

      setProduksiPanel((prev) => ({
        ...prev,
        loading: false,
        sumurList,
        inputs,
        volume: res.data.suratJalan?.volume ?? item.volume ?? 0,
        satuan: res.data.suratJalan?.satuanVolume?.satuan
          || item.satuanVolume?.satuan
          || "",
        satuanVolumeId: defaultSatuanVolumeId,
        satuanVolumeOptions,
      }));
    } catch (err) {
      console.error(err);
      setExpandedProduksiId(null);
      setProduksiPanel((prev) => ({ ...prev, loading: false }));
      toast({
        title: "Error!",
        description:
          err.response?.data?.error || "Gagal memuat data produksi sumur",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const toggleProduksiPanel = async (item) => {
    if (expandedProduksiId === item.id) {
      setExpandedProduksiId(null);
      return;
    }

    setExpandedProduksiId(item.id);
    await fetchProduksiPanel(item);
  };

  const handleProduksiInputChange = (sumurMinyakId, value) => {
    setProduksiPanel((prev) => ({
      ...prev,
      inputs: {
        ...prev.inputs,
        [sumurMinyakId]: value,
      },
    }));
  };

  const totalProduksiInput = useMemo(() => {
    return Object.values(produksiPanel.inputs).reduce((sum, val) => {
      const num = parseInt(val, 10);
      return sum + (Number.isNaN(num) ? 0 : num);
    }, 0);
  }, [produksiPanel.inputs]);

  const produksiSatuanOptions = useMemo(() => {
    const options = produksiPanel.satuanVolumeOptions.length
      ? produksiPanel.satuanVolumeOptions
      : dataSeed?.resultSatuanVolume || [];

    return options.map((val) => ({
      value: val.id,
      label: val.satuan || `Satuan #${val.id}`,
    }));
  }, [produksiPanel.satuanVolumeOptions, dataSeed?.resultSatuanVolume]);

  const produksiSatuanLabel = useMemo(() => {
    const selected = produksiSatuanOptions.find(
      (opt) => opt.value === produksiPanel.satuanVolumeId,
    );
    return selected?.label || produksiPanel.satuan || "Barrel";
  }, [
    produksiSatuanOptions,
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

  const renderProduksiSatuanField = (isEditable) => (
    <FormControl mb={4} maxW={{ md: "320px" }}>
      <FormLabel fontSize="sm">Satuan Produksi</FormLabel>
      <Select2
        options={produksiSatuanOptions}
        placeholder="Pilih satuan volume"
        isDisabled={!isEditable}
        value={
          produksiPanel.satuanVolumeId
            ? produksiSatuanOptions.find(
                (opt) => opt.value === produksiPanel.satuanVolumeId,
              ) || null
            : null
        }
        onChange={(opt) =>
          setProduksiPanel((prev) => ({
            ...prev,
            satuanVolumeId: opt?.value || null,
          }))
        }
        {...selectStyles}
      />
    </FormControl>
  );

  const renderProduksiSummary = () => (
    <Box mb={2}>
      <HStack spacing={1} align="start" mb={1}>
        <Text fontSize="sm" color="gray.600">
          Total Produksi:
        </Text>
        <VolumeMultiSatuan
          volume={totalProduksiInput}
          satuan={produksiSatuanLabel}
          fontSize="sm"
        />
      </HStack>
      <HStack spacing={1} align="start">
        <Text fontSize="sm" color="gray.600">
          Volume Surat Jalan:
        </Text>
        <VolumeMultiSatuan
          volume={produksiPanel.volume}
          satuan={produksiPanel.satuan || "Barrel"}
          fontSize="sm"
        />
      </HStack>
      {!isProduksiTotalValid && (
        <Text fontSize="xs" color="red.500" mt={1}>
          Total produksi harus sama dengan volume surat jalan
        </Text>
      )}
    </Box>
  );

  const saveProduksiSumur = async (suratJalanId) => {
    const items = Object.entries(produksiPanel.inputs)
      .map(([sumurMinyakId, produksi]) => ({
        sumurMinyakId: parseInt(sumurMinyakId, 10),
        produksi: parseInt(produksi, 10) || 0,
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
        description:
          "Total produksi harus sama dengan volume surat jalan setelah konversi satuan.",
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
        title: "Berhasil!",
        description: "Produksi sumur berhasil disimpan.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Error!",
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

  const hasActiveFilter =
    (isSuperAdmin && mitraFilterId) ||
    transportirFilterId ||
    supirFilterId ||
    stasiunPengumpulMinyakFilterId ||
    asalMinyakFilterId ||
    statusSuratJalanFilterId ||
    tanggalAwal ||
    tanggalAkhir ||
    sortBy !== "tanggal" ||
    sortOrder !== "DESC";

  useEffect(() => {
    fetchSeed();
  }, []);

  useEffect(() => {
    setPage(0);
  }, [
    mitraId,
    mitraFilterId,
    isSuperAdmin,
    transportirFilterId,
    supirFilterId,
    stasiunPengumpulMinyakFilterId,
    asalMinyakFilterId,
    statusSuratJalanFilterId,
    tanggalAwal,
    tanggalAkhir,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    fetchDataSuratJalan();
  }, [
    page,
    limit,
    mitraId,
    mitraFilterId,
    isSuperAdmin,
    transportirFilterId,
    supirFilterId,
    stasiunPengumpulMinyakFilterId,
    asalMinyakFilterId,
    statusSuratJalanFilterId,
    tanggalAwal,
    tanggalAkhir,
    sortBy,
    sortOrder,
  ]);

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
            gap={{ base: 4, sm: 0 }}
            mb={6}
          >
            <VStack align={{ base: "center", sm: "start" }} spacing={1}>
              <Heading
                color="kpbpn"
                size={{ base: "md", md: "lg" }}
                textAlign={{ base: "center", sm: "left" }}
              >
                Daftar Surat Jalan
              </Heading>
              <Text fontSize="sm" color="gray.500">
                Total: {rows} data
              </Text>
            </VStack>
            <Spacer display={{ base: "none", sm: "block" }} />
            <Button
              variant="primary"
              onClick={handleOpenTambahModal}
              w={{ base: "full", sm: "auto" }}
              flexShrink={0}
            >
              + Tambah Surat Jalan
            </Button>
          </Flex>

          <Divider mb={6} />

          <Box mb={6}>
            <Heading size="md" mb={4} color="kpbpn">
              Filter Pencarian
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              {isSuperAdmin && (
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="medium">
                    Mitra
                  </FormLabel>
                  <Select2
                    options={(dataSeed?.resultMitra || []).map((val) => ({
                      value: val.id,
                      label: formatMitraLabel(val),
                    }))}
                    placeholder="Pilih Mitra"
                    isClearable
                    value={
                      mitraFilterId
                        ? {
                            value: mitraFilterId,
                            label: formatMitraLabel(
                              (dataSeed?.resultMitra || []).find(
                                (m) => m.id === mitraFilterId,
                              ),
                            ),
                          }
                        : null
                    }
                    onChange={(opt) => setMitraFilterId(opt?.value || 0)}
                    {...selectStyles}
                  />
                </FormControl>
              )}

              <FormControl>
                <FormLabel fontSize="sm" fontWeight="medium">
                  Transportir
                </FormLabel>
                <Select2
                  options={(dataSeed?.resultTransportir || []).map((val) => ({
                    value: val.id,
                    label: formatTransportirLabel(val),
                  }))}
                  placeholder="Pilih Transportir"
                  onChange={(opt) => setTransportirFilterId(opt?.value || 0)}
                  {...selectStyles}
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" fontWeight="medium">
                  Supir
                </FormLabel>
                <Select2
                  options={allSupir.map((val) => ({
                    value: val.id,
                    label: `${val.nama} (${val.mitraNama})`,
                  }))}
                  placeholder="Pilih Supir"
                  onChange={(opt) => setSupirFilterId(opt?.value || 0)}
                  {...selectStyles}
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" fontWeight="medium">
                  Stasiun Pengumpul Minyak
                </FormLabel>
                <Select2
                  options={(dataSeed?.resultStasiunPengumpulMinyak || []).map(
                    (val) => ({
                      value: val.id,
                      label: val.nama,
                    }),
                  )}
                  placeholder="Pilih Stasiun"
                  onChange={(opt) =>
                    setStasiunPengumpulMinyakFilterId(opt?.value || 0)
                  }
                  {...selectStyles}
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" fontWeight="medium">
                  Asal Minyak
                </FormLabel>
                <Select2
                  options={(dataSeed?.resultAsalMinyak || []).map((val) => ({
                    value: val.id,
                    label: formatAsalMinyakLabel(val),
                  }))}
                  placeholder="Pilih Asal Minyak"
                  onChange={(opt) => setAsalMinyakFilterId(opt?.value || 0)}
                  {...selectStyles}
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" fontWeight="medium">
                  Status Surat Jalan
                </FormLabel>
                <Select2
                  options={(dataSeed?.resultStatusSuratJalan || []).map(
                    (val) => ({
                      value: val.id,
                      label: val.status || `Status #${val.id}`,
                    }),
                  )}
                  placeholder="Pilih Status"
                  onChange={(opt) =>
                    setStatusSuratJalanFilterId(opt?.value || 0)
                  }
                  {...selectStyles}
                />
              </FormControl>

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
                  Urutkan Berdasarkan
                </FormLabel>
                <Select2
                  options={[
                    { value: "tanggal", label: "Tanggal" },
                    { value: "nomor", label: "Nomor" },
                    { value: "volume", label: "Volume" },
                  ]}
                  value={{
                    value: sortBy,
                    label:
                      sortBy === "nomor"
                        ? "Nomor"
                        : sortBy === "volume"
                          ? "Volume"
                          : "Tanggal",
                  }}
                  onChange={(opt) => setSortBy(opt?.value || "tanggal")}
                  {...selectStyles}
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" fontWeight="medium">
                  Urutan
                </FormLabel>
                <Select2
                  options={
                    sortBy === "volume"
                      ? [
                          { value: "DESC", label: "Volume Terbesar" },
                          { value: "ASC", label: "Volume Terkecil" },
                        ]
                      : sortBy === "nomor"
                        ? [
                            { value: "ASC", label: "Nomor A-Z" },
                            { value: "DESC", label: "Nomor Z-A" },
                          ]
                        : [
                            { value: "DESC", label: "Tanggal Terbaru" },
                            { value: "ASC", label: "Tanggal Terlama" },
                          ]
                  }
                  value={{
                    value: sortOrder,
                    label:
                      sortBy === "volume"
                        ? sortOrder === "ASC"
                          ? "Volume Terkecil"
                          : "Volume Terbesar"
                        : sortBy === "nomor"
                          ? sortOrder === "ASC"
                            ? "Nomor A-Z"
                            : "Nomor Z-A"
                          : sortOrder === "ASC"
                            ? "Tanggal Terlama"
                            : "Tanggal Terbaru",
                  }}
                  onChange={(opt) => setSortOrder(opt?.value || "DESC")}
                  {...selectStyles}
                />
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
            {/* Tampilan kartu — mobile & tablet */}
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
              ) : dataSuratJalan?.length > 0 ? (
                <Stack spacing={4}>
                  {dataSuratJalan.map((item) => {
                    const isProduksiExpanded = expandedProduksiId === item.id;

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
                        <HStack
                          justify="space-between"
                          align="start"
                          mb={3}
                          flexWrap="wrap"
                          gap={2}
                        >
                          <Text fontWeight="bold" color="kpbpn" fontSize="sm">
                            {item.nomor || "-"}
                          </Text>
                          <Badge colorScheme="blue" variant="subtle">
                            {item.statusSuratJalan?.status || "-"}
                          </Badge>
                        </HStack>
                        <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                          <MobileField label="Tanggal">
                            {formatTanggal(item.tanggal)}
                          </MobileField>
                          <MobileField label="Mitra">
                            {item.mitra?.nama || "-"}
                          </MobileField>
                          <MobileField label="Transportir">
                            {item.transportir?.plat || "-"}
                          </MobileField>
                          <MobileField label="Stasiun Pengumpul Minyak">
                            {item.stasiunPengumpulMinyak?.nama || "-"}
                          </MobileField>
                          <MobileField label="Asal Minyak">
                            {formatAsalMinyakLabel(item.asalMinyak) || "-"}
                          </MobileField>
                          <MobileField label="Volume">
                            <VolumeMultiSatuan
                              volume={item.volume}
                              satuan={item.satuanVolume?.satuan || "Barrel"}
                            />
                          </MobileField>
                          <MobileField label="Supir">
                            {item.supir?.nama || "-"}
                          </MobileField>
                          <MobileField label="Jam Pergi">
                            {formatJam(item.jamPergi)}
                          </MobileField>
                          <MobileField label="Jam Datang">
                            {formatJam(item.jamDatang)}
                          </MobileField>
                        </SimpleGrid>
                        <HStack mt={4} spacing={2}>
                          <Button
                            size="sm"
                            variant={isProduksiExpanded ? "solid" : "outline"}
                            colorScheme="orange"
                            flex={1}
                            onClick={() => toggleProduksiPanel(item)}
                          >
                            Produksi
                          </Button>
                          {item.statusSuratJalanId !== 1 && (
                            <Button
                              size="sm"
                              variant="outline"
                              colorScheme="teal"
                              flex={1}
                              isLoading={loadingCetak[item.id]}
                              onClick={() => cetakSuratJalan(item)}
                            >
                              Cetak
                            </Button>
                          )}
                        </HStack>
                        <Collapse in={isProduksiExpanded} animateOpacity>
                          <Box
                            mt={4}
                            pt={4}
                            borderTopWidth="1px"
                            borderColor="gray.100"
                          >
                            <Heading size="xs" mb={3} color="kpbpn">
                              Input Produksi Sumur Minyak
                            </Heading>
                            {produksiPanel.loading ? (
                              <Stack spacing={2}>
                                <Skeleton height="20px" />
                                <Skeleton height="20px" />
                              </Stack>
                            ) : produksiPanel.sumurList.length === 0 ? (
                              <Text fontSize="sm" color="gray.500">
                                Tidak ada data sumur minyak untuk mitra ini
                              </Text>
                            ) : (
                              <>
                                {renderProduksiSatuanField(
                                  item.statusSuratJalanId === 1,
                                )}
                                <Stack spacing={3} mb={4}>
                                  {produksiPanel.sumurList.map((sumur, idx) => (
                                    <Box
                                      key={sumur.id}
                                      p={3}
                                      borderRadius="md"
                                      border="1px solid"
                                      borderColor="gray.100"
                                      bg="gray.50"
                                    >
                                      <Text fontSize="xs" color="gray.500" mb={1}>
                                        Sumur #{idx + 1} · {sumur.nomor || "-"}
                                      </Text>
                                      <Text fontSize="sm" fontWeight="medium" mb={2}>
                                        {sumur.nama || "-"}
                                      </Text>
                                      <FormControl>
                                        <FormLabel fontSize="xs">
                                          Produksi ({produksiSatuanLabel})
                                        </FormLabel>
                                        <Input
                                          type="number"
                                          min={0}
                                          size="sm"
                                          bgColor="terang"
                                          value={
                                            produksiPanel.inputs[sumur.id] ?? ""
                                          }
                                          onChange={(e) =>
                                            handleProduksiInputChange(
                                              sumur.id,
                                              e.target.value,
                                            )
                                          }
                                          placeholder="0"
                                          isDisabled={
                                            item.statusSuratJalanId !== 1
                                          }
                                        />
                                      </FormControl>
                                    </Box>
                                  ))}
                                </Stack>
                                {renderProduksiSummary()}
                                {item.statusSuratJalanId === 1 && (
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    w="full"
                                    isLoading={produksiPanel.saving}
                                    isDisabled={
                                      !isProduksiTotalValid ||
                                      !produksiPanel.satuanVolumeId ||
                                      produksiPanel.loading
                                    }
                                    onClick={() => saveProduksiSumur(item.id)}
                                  >
                                    Simpan Produksi
                                  </Button>
                                )}
                              </>
                            )}
                          </Box>
                        </Collapse>
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
                    Tidak ada data surat jalan
                  </Text>
                </Box>
              )}
            </Box>

            {/* Tampilan tabel — desktop */}
            <Box
              display={{ base: "none", lg: "block" }}
              borderRadius="8px"
              overflow="hidden"
              overflowX="auto"
              border="1px solid"
              borderColor="gray.200"
            >
              <Table variant="simple" size="md" minW="1100px">
                <Thead bg="gray.50">
                  <Tr>
                    <Th textTransform="capitalize">Nomor</Th>
                    <Th textTransform="capitalize">Tanggal</Th>
                    <Th textTransform="capitalize">Mitra</Th>
                    <Th textTransform="capitalize">Transportir</Th>
                    <Th textTransform="capitalize">
                      Stasiun Pengumpul Minyak
                    </Th>
                    <Th textTransform="capitalize">Asal Minyak</Th>
                    <Th textTransform="capitalize" isNumeric>
                      Volume
                    </Th>
                    <Th textTransform="capitalize">Supir</Th>
                    <Th textTransform="capitalize">Jam Pergi</Th>
                    <Th textTransform="capitalize">Jam Datang</Th>
                    <Th textTransform="capitalize">Status</Th>{" "}
                    <Th textTransform="capitalize">Aksi</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, idx) => (
                      <Tr key={idx}>
                        {Array.from({ length: 12 }).map((__, i) => (
                          <Td key={i}>
                            <Skeleton height="20px" />
                          </Td>
                        ))}
                      </Tr>
                    ))
                  ) : dataSuratJalan?.length > 0 ? (
                    dataSuratJalan.map((item) => {
                      const isProduksiExpanded = expandedProduksiId === item.id;

                      return (
                        <React.Fragment key={item.id}>
                          <Tr>
                            <Td fontWeight="medium">{item.nomor || "-"}</Td>
                            <Td>{formatTanggal(item.tanggal)}</Td>
                            <Td>{item.mitra?.nama || "-"}</Td>
                            <Td>{item.transportir?.plat || "-"}</Td>
                            <Td>
                              {item.stasiunPengumpulMinyak?.nama || "-"}
                            </Td>
                            <Td>
                              {formatAsalMinyakLabel(item.asalMinyak) || "-"}
                            </Td>
                            <Td>
                              <VolumeMultiSatuan
                                volume={item.volume}
                                satuan={item.satuanVolume?.satuan || "Barrel"}
                              />
                            </Td>
                            <Td>{item.supir?.nama || "-"}</Td>
                            <Td>{formatJam(item.jamPergi)}</Td>
                            <Td>{formatJam(item.jamDatang)}</Td>
                            <Td>
                              <Badge colorScheme="blue" variant="subtle">
                                {item.statusSuratJalan?.status || "-"}
                              </Badge>
                            </Td>
                            <Td>
                              <HStack spacing={2}>
                                <Button
                                  size="sm"
                                  variant={isProduksiExpanded ? "solid" : "outline"}
                                  colorScheme="orange"
                                  onClick={() => toggleProduksiPanel(item)}
                                >
                                  Produksi
                                </Button>
                                {item.statusSuratJalanId !== 1 && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    colorScheme="teal"
                                    isLoading={loadingCetak[item.id]}
                                    onClick={() => cetakSuratJalan(item)}
                                  >
                                    Cetak
                                  </Button>
                                )}
                              </HStack>
                            </Td>
                          </Tr>
                          <Tr>
                            <Td colSpan={TABLE_COL_SPAN} p={0} borderBottom="none">
                              <Collapse in={isProduksiExpanded} animateOpacity>
                                <Box
                                  p={4}
                                  bg="gray.50"
                                  borderTopWidth="1px"
                                  borderColor="gray.200"
                                >
                                  <Heading size="sm" mb={3} color="kpbpn">
                                    Input Produksi Sumur Minyak
                                  </Heading>
                                  {produksiPanel.loading ? (
                                    <Stack spacing={2}>
                                      <Skeleton height="20px" />
                                      <Skeleton height="20px" />
                                      <Skeleton height="20px" />
                                    </Stack>
                                  ) : produksiPanel.sumurList.length === 0 ? (
                                    <Text fontSize="sm" color="gray.500">
                                      Tidak ada data sumur minyak untuk mitra ini
                                    </Text>
                                  ) : (
                                    <>
                                      {renderProduksiSatuanField(
                                        item.statusSuratJalanId === 1,
                                      )}
                                      <Box overflowX="auto" mb={4}>
                                        <Table size="sm" variant="simple" bg="white">
                                          <Thead bg="gray.100">
                                            <Tr>
                                              <Th>No</Th>
                                              <Th>Nomor Sumur</Th>
                                              <Th>Nama Sumur</Th>
                                              <Th isNumeric>
                                                Produksi ({produksiSatuanLabel})
                                              </Th>
                                            </Tr>
                                          </Thead>
                                          <Tbody>
                                            {produksiPanel.sumurList.map(
                                              (sumur, idx) => (
                                                <Tr key={sumur.id}>
                                                  <Td>{idx + 1}</Td>
                                                  <Td>{sumur.nomor || "-"}</Td>
                                                  <Td>{sumur.nama || "-"}</Td>
                                                  <Td isNumeric>
                                                    <Input
                                                      type="number"
                                                      min={0}
                                                      size="sm"
                                                      w="120px"
                                                      ml="auto"
                                                      bgColor="terang"
                                                      value={
                                                        produksiPanel.inputs[
                                                          sumur.id
                                                        ] ?? ""
                                                      }
                                                      onChange={(e) =>
                                                        handleProduksiInputChange(
                                                          sumur.id,
                                                          e.target.value,
                                                        )
                                                      }
                                                      placeholder="0"
                                                      isDisabled={
                                                        item.statusSuratJalanId !==
                                                        1
                                                      }
                                                    />
                                                  </Td>
                                                </Tr>
                                              ),
                                            )}
                                          </Tbody>
                                        </Table>
                                      </Box>
                                      <Flex
                                        align={{ base: "stretch", md: "center" }}
                                        direction={{ base: "column", md: "row" }}
                                        gap={3}
                                        justify="space-between"
                                      >
                                        <Box>{renderProduksiSummary()}</Box>
                                        {item.statusSuratJalanId === 1 && (
                                          <Button
                                            variant="primary"
                                            size="sm"
                                            isLoading={produksiPanel.saving}
                                            isDisabled={
                                              !isProduksiTotalValid ||
                                              !produksiPanel.satuanVolumeId ||
                                              produksiPanel.loading
                                            }
                                            onClick={() =>
                                              saveProduksiSumur(item.id)
                                            }
                                            w={{ base: "full", md: "auto" }}
                                          >
                                            Simpan Produksi
                                          </Button>
                                        )}
                                      </Flex>
                                    </>
                                  )}
                                </Box>
                              </Collapse>
                            </Td>
                          </Tr>
                        </React.Fragment>
                      );
                    })
                  ) : (
                    <Tr>
                      <Td colSpan={12} textAlign="center" py={10}>
                        <VStack spacing={2}>
                          <Text fontSize="lg" color="gray.500">
                            Tidak ada data surat jalan
                          </Text>
                        </VStack>
                      </Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </Box>
          </Box>

          {rows > 0 && (
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
                Menampilkan {page * limit + 1}–
                {Math.min((page + 1) * limit, rows)} dari {rows} data
                {pages > 1 && (
                  <>
                    {" "}
                    · Halaman {page + 1} dari {pages}
                  </>
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
                    pageCount={pages}
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
        isOpen={isTambahOpen}
        onClose={handleCloseTambahModal}
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
          <ModalHeader>Tambah Surat Jalan</ModalHeader>
          <ModalCloseButton />
          <Formik
            innerRef={formikRefTambah}
            initialValues={initialValuesTambah}
            enableReinitialize
            validationSchema={suratJalanSchema}
            onSubmit={submitTambahSuratJalan}
          >
            {({
              values,
              errors,
              touched,
              setFieldValue,
              isSubmitting,
              handleChange,
              handleBlur,
            }) => (
              <Form>
                <ModalBody>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl isInvalid={touched.tanggal && errors.tanggal}>
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
                    <FormControl isInvalid={touched.mitraId && errors.mitraId}>
                      <FormLabel>Mitra</FormLabel>
                      {isSuperAdmin ? (
                        <Select2
                          options={(dataSeed?.resultMitra || []).map((val) => ({
                            value: val.id,
                            label: formatMitraLabel(val),
                          }))}
                          placeholder="Pilih Mitra"
                          value={
                            values.mitraId
                              ? {
                                  value: values.mitraId,
                                  label: formatMitraLabel(
                                    (dataSeed?.resultMitra || []).find(
                                      (m) => m.id === values.mitraId,
                                    ),
                                  ),
                                }
                              : null
                          }
                          onChange={(opt) => {
                            setFieldValue("mitraId", opt?.value || null);
                            setFieldValue("supirId", null);
                          }}
                          {...selectStyles}
                        />
                      ) : (
                        <Input
                          bgColor="terang"
                          value={
                            mitra?.kode
                              ? `${mitra.nama} (${mitra.kode})`
                              : mitra?.nama || "-"
                          }
                          isReadOnly
                        />
                      )}
                      <FormErrorMessage>{errors.mitraId}</FormErrorMessage>
                    </FormControl>
                    <FormControl
                      isInvalid={touched.transportirId && errors.transportirId}
                    >
                      <FormLabel>Transportir</FormLabel>
                      <Select2
                        options={(dataSeed?.resultTransportir || []).map(
                          (val) => ({
                            value: val.id,
                            label: formatTransportirLabel(val),
                          }),
                        )}
                        placeholder="Pilih Transportir"
                        value={
                          values.transportirId
                            ? {
                                value: values.transportirId,
                                label: formatTransportirLabel(
                                  (dataSeed?.resultTransportir || []).find(
                                    (t) => t.id === values.transportirId,
                                  ),
                                ),
                              }
                            : null
                        }
                        onChange={(opt) => {
                          setFieldValue("transportirId", opt?.value || null);
                          const selectedTransportir = (
                            dataSeed?.resultTransportir || []
                          ).find((t) => t.id === opt?.value);
                          if (selectedTransportir?.satuanVolumeId) {
                            setFieldValue(
                              "satuanVolumeId",
                              selectedTransportir.satuanVolumeId,
                            );
                          }
                        }}
                        {...selectStyles}
                      />
                      <FormErrorMessage>
                        {errors.transportirId}
                      </FormErrorMessage>
                    </FormControl>
                    <FormControl
                      isInvalid={
                        touched.stasiunPengumpulMinyakId &&
                        errors.stasiunPengumpulMinyakId
                      }
                    >
                      <FormLabel>Stasiun Pengumpul Minyak</FormLabel>
                      <Select2
                        options={(
                          dataSeed?.resultStasiunPengumpulMinyak || []
                        ).map((val) => ({
                          value: val.id,
                          label: val.nama,
                        }))}
                        placeholder="Pilih Stasiun Pengumpul Minyak"
                        value={
                          values.stasiunPengumpulMinyakId
                            ? {
                                value: values.stasiunPengumpulMinyakId,
                                label:
                                  (
                                    dataSeed?.resultStasiunPengumpulMinyak ||
                                    []
                                  ).find(
                                    (s) =>
                                      s.id === values.stasiunPengumpulMinyakId,
                                  )?.nama || "",
                              }
                            : null
                        }
                        onChange={(opt) => {
                          setFieldValue(
                            "stasiunPengumpulMinyakId",
                            opt?.value || null,
                          );
                        }}
                        {...selectStyles}
                      />
                      <FormErrorMessage>
                        {errors.stasiunPengumpulMinyakId}
                      </FormErrorMessage>
                    </FormControl>
                    <FormControl
                      isInvalid={touched.asalMinyakId && errors.asalMinyakId}
                    >
                      <FormLabel>Asal Minyak</FormLabel>
                      <Select2
                        options={(dataSeed?.resultAsalMinyak || []).map(
                          (val) => ({
                            value: val.id,
                            label: formatAsalMinyakLabel(val),
                          }),
                        )}
                        placeholder="Pilih Asal Minyak"
                        value={
                          values.asalMinyakId
                            ? {
                                value: values.asalMinyakId,
                                label: formatAsalMinyakLabel(
                                  (dataSeed?.resultAsalMinyak || []).find(
                                    (a) => a.id === values.asalMinyakId,
                                  ),
                                ),
                              }
                            : null
                        }
                        onChange={(opt) =>
                          setFieldValue("asalMinyakId", opt?.value || null)
                        }
                        {...selectStyles}
                      />
                      <FormErrorMessage>
                        {errors.asalMinyakId}
                      </FormErrorMessage>
                    </FormControl>
                    <FormControl isInvalid={touched.volume && errors.volume}>
                      <FormLabel>Volume</FormLabel>
                      <Input
                        name="volume"
                        type="number"
                        bgColor="terang"
                        value={values.volume}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="Masukkan volume"
                      />
                      <FormErrorMessage>{errors.volume}</FormErrorMessage>
                    </FormControl>
                    <FormControl
                      isInvalid={
                        touched.satuanVolumeId && errors.satuanVolumeId
                      }
                    >
                      <FormLabel>Satuan Volume</FormLabel>
                      <Select2
                        options={(dataSeed?.resultSatuanVolume || []).map(
                          (val) => ({
                            value: val.id,
                            label: val.satuan || `Satuan #${val.id}`,
                          }),
                        )}
                        placeholder="Pilih satuan volume"
                        value={
                          values.satuanVolumeId
                            ? {
                                value: values.satuanVolumeId,
                                label:
                                  (dataSeed?.resultSatuanVolume || []).find(
                                    (s) => s.id === values.satuanVolumeId,
                                  )?.satuan ||
                                  `Satuan #${values.satuanVolumeId}`,
                              }
                            : null
                        }
                        onChange={(opt) =>
                          setFieldValue("satuanVolumeId", opt?.value || null)
                        }
                        {...selectStyles}
                      />
                      <FormErrorMessage>
                        {errors.satuanVolumeId}
                      </FormErrorMessage>
                    </FormControl>
                    <FormControl isInvalid={touched.supirId && errors.supirId}>
                      <FormLabel>Supir</FormLabel>
                      <Select2
                        options={getSupirByMitra(values.mitraId).map((val) => ({
                          value: val.id,
                          label: val.nama || `Supir #${val.id}`,
                        }))}
                        placeholder={
                          values.mitraId
                            ? "Pilih Supir"
                            : "Pilih mitra terlebih dahulu"
                        }
                        isDisabled={!values.mitraId}
                        value={
                          values.supirId
                            ? {
                                value: values.supirId,
                                label:
                                  getSupirByMitra(values.mitraId).find(
                                    (s) => s.id === values.supirId,
                                  )?.nama || `Supir #${values.supirId}`,
                              }
                            : null
                        }
                        onChange={(opt) =>
                          setFieldValue("supirId", opt?.value || null)
                        }
                        {...selectStyles}
                      />
                      <FormErrorMessage>{errors.supirId}</FormErrorMessage>
                    </FormControl>
                    <FormControl
                      isInvalid={touched.jamPergi && errors.jamPergi}
                    >
                      <FormLabel>Jam Pergi</FormLabel>
                      <Input
                        name="jamPergi"
                        type="datetime-local"
                        bgColor="terang"
                        value={values.jamPergi}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                      <FormErrorMessage>{errors.jamPergi}</FormErrorMessage>
                    </FormControl>

                    <FormControl
                      isInvalid={touched.jamDatang && errors.jamDatang}
                    >
                      <FormLabel>Jam Datang</FormLabel>
                      <Input
                        name="jamDatang"
                        type="datetime-local"
                        bgColor="terang"
                        value={values.jamDatang}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                      <FormErrorMessage>{errors.jamDatang}</FormErrorMessage>
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
                    onClick={handleCloseTambahModal}
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
            )}
          </Formik>
        </ModalContent>
      </Modal>
    </LayoutKPBPN>
  );
};

export default SuratJalanMitra;
