import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import ReactPaginate from "react-paginate";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Text,
  useToast,
  Container,
  Thead,
  Table,
  Tr,
  Th,
  Td,
  Tbody,
  Heading,
  HStack,
  Stack,
  Badge,
  Flex,
  Spinner,
  Center,
  SimpleGrid,
  Image,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  useDisclosure,
} from "@chakra-ui/react";
import { Link as RouterLink, useHistory } from "react-router-dom";
import LayoutKPBPN from "../../Componets/KPBPN/LayoutKPBPN";
import {
  downloadObjectUrl,
  fetchSumurQrCode,
  parseQrError,
} from "../../lib/qrCodeSumur";
import "../../Style/pagination.css";

const API_BASE = import.meta.env.VITE_REACT_APP_API_BASE_URL;

const getImageUrl = (path) => (path ? `${API_BASE}${path}` : null);

const formatTanggal = (d) =>
  d
    ? new Date(d).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "-";

const formatVolumeLabel = (volume, satuan) => {
  if (volume === null || volume === undefined || volume === "") return "-";
  return satuan ? `${volume} ${satuan}` : String(volume);
};

const KLASIFIKASI_FIELDS = [
  { key: "area", label: "Area" },
  { key: "operasional", label: "Operasional" },
  { key: "lingkungan", label: "Lingkungan" },
  { key: "penyaluran", label: "Penyaluran" },
  { key: "statusKepemilikan", label: "Status Kepemilikan" },
  { key: "tingkatProduksi", label: "Tingkat Produksi" },
];

const emptyKlasifikasi = {
  area: "",
  operasional: "",
  lingkungan: "",
  penyaluran: "",
  statusKepemilikan: "",
  tingkatProduksi: "",
};

const klasifikasiFromSumur = (sumur) => ({
  area: sumur?.area ?? "",
  operasional: sumur?.operasional ?? "",
  lingkungan: sumur?.lingkungan ?? "",
  penyaluran: sumur?.penyaluran ?? "",
  statusKepemilikan: sumur?.statusKepemilikan ?? "",
  tingkatProduksi: sumur?.tingkatProduksi ?? "",
});

const PEMILIK_FIELDS = [
  { key: "namaPemilikLahan", label: "Nama Pemilik Lahan" },
  { key: "namaPemilikSumur", label: "Nama Pemilik Sumur" },
  { key: "kontakPemilikLahan", label: "Kontak Pemilik Lahan" },
  { key: "kontakPemilikSumur", label: "Kontak Pemilik Sumur" },
];

const emptyPemilik = {
  namaPemilikLahan: "",
  namaPemilikSumur: "",
  kontakPemilikLahan: "",
  kontakPemilikSumur: "",
};

const pemilikFromSumur = (sumur) => ({
  namaPemilikLahan: sumur?.namaPemilikLahan ?? "",
  namaPemilikSumur: sumur?.namaPemilikSumur ?? "",
  kontakPemilikLahan: sumur?.kontakPemilikLahan ?? "",
  kontakPemilikSumur: sumur?.kontakPemilikSumur ?? "",
});

function ProduksiSumur({ match }) {
  const sumurMinyakId = match.params.id;
  const toast = useToast();
  const history = useHistory();
  const dataListRef = useRef(null);
  const klasifikasiSyncedId = useRef(null);
  const pemilikSyncedId = useRef(null);

  const [sumurMinyak, setSumurMinyak] = useState(null);
  const [dataProduksi, setDataProduksi] = useState([]);
  const [totalProduksi, setTotalProduksi] = useState(0);
  const [page, setPage] = useState(0);
  const [limit] = useState(20);
  const [pages, setPages] = useState(0);
  const [rows, setRows] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const [tanggalAwal, setTanggalAwal] = useState("");
  const [tanggalAkhir, setTanggalAkhir] = useState("");
  const [appliedStartDate, setAppliedStartDate] = useState("");
  const [appliedEndDate, setAppliedEndDate] = useState("");

  const [klasifikasiForm, setKlasifikasiForm] = useState(emptyKlasifikasi);
  const [isSavingKlasifikasi, setIsSavingKlasifikasi] = useState(false);
  const [pemilikForm, setPemilikForm] = useState(emptyPemilik);
  const [isSavingPemilik, setIsSavingPemilik] = useState(false);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [qrPreview, setQrPreview] = useState(null);
  const {
    isOpen: isKlasifikasiOpen,
    onOpen: onKlasifikasiOpen,
    onClose: onKlasifikasiClose,
  } = useDisclosure();
  const {
    isOpen: isPemilikOpen,
    onOpen: onPemilikOpen,
    onClose: onPemilikClose,
  } = useDisclosure();
  const {
    isOpen: isQrOpen,
    onOpen: onQrOpen,
    onClose: onQrClose,
  } = useDisclosure();

  const scrollToDataList = () => {
    dataListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const changePage = ({ selected }) => {
    setPage(selected);
    scrollToDataList();
  };

  const fetchDataProduksi = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE}/sumur-minyak/get/produksi/${sumurMinyakId}`,
        {
          params: {
            page,
            limit,
            startDate: appliedStartDate || undefined,
            endDate: appliedEndDate || undefined,
          },
        },
      );
      const sumur = res.data.sumurMinyak || null;
      setSumurMinyak(sumur);
      if (klasifikasiSyncedId.current !== sumurMinyakId) {
        setKlasifikasiForm(klasifikasiFromSumur(sumur));
        klasifikasiSyncedId.current = sumurMinyakId;
      }
      if (pemilikSyncedId.current !== sumurMinyakId) {
        setPemilikForm(pemilikFromSumur(sumur));
        pemilikSyncedId.current = sumurMinyakId;
      }
      setDataProduksi(res.data.result || []);
      setTotalProduksi(res.data.totalProduksi || 0);
      setPage(res.data.page ?? page);
      setPages(res.data.totalPage || 0);
      setRows(res.data.totalRows || 0);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 403) {
        toast({
          title: "Akses ditolak",
          description: "Anda hanya dapat melihat data sumur milik mitra Anda.",
          status: "error",
          duration: 4000,
          isClosable: true,
        });
        history.push("/sumur/sumur-minyak");
        return;
      }
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

  useEffect(() => {
    fetchDataProduksi();
  }, [sumurMinyakId, page, limit, appliedStartDate, appliedEndDate]);

  const handleFilter = () => {
    setPage(0);
    setAppliedStartDate(tanggalAwal);
    setAppliedEndDate(tanggalAkhir);
  };

  const handleKlasifikasiChange = (key, value) => {
    setKlasifikasiForm((prev) => ({ ...prev, [key]: value }));
  };

  const saveKlasifikasi = async (payload, successTitle) => {
    setIsSavingKlasifikasi(true);
    try {
      const res = await axios.post(
        `${API_BASE}/sumur-minyak/edit-klasifikasi/${sumurMinyakId}`,
        payload,
      );
      const updated = res.data.result || null;
      setSumurMinyak(updated);
      setKlasifikasiForm(klasifikasiFromSumur(updated));
      onKlasifikasiClose();
      toast({
        title: successTitle,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: "Gagal menyimpan klasifikasi",
        description: err.response?.data?.error || err.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsSavingKlasifikasi(false);
    }
  };

  const handleSaveKlasifikasi = () => {
    saveKlasifikasi(klasifikasiForm, "Klasifikasi sumur berhasil disimpan");
  };

  const openKlasifikasiModal = () => {
    setKlasifikasiForm(klasifikasiFromSumur(sumurMinyak));
    onKlasifikasiOpen();
  };

  const handleResetKlasifikasiForm = () => {
    setKlasifikasiForm(klasifikasiFromSumur(sumurMinyak));
    onKlasifikasiClose();
  };

  const handleDeleteKlasifikasi = () => {
    const confirmed = window.confirm(
      "Kosongkan semua data klasifikasi sumur ini?",
    );
    if (!confirmed) return;
    saveKlasifikasi(emptyKlasifikasi, "Klasifikasi sumur berhasil dikosongkan");
  };

  const handlePemilikChange = (key, value) => {
    setPemilikForm((prev) => ({ ...prev, [key]: value }));
  };

  const savePemilik = async (payload, successTitle) => {
    setIsSavingPemilik(true);
    try {
      const res = await axios.post(
        `${API_BASE}/sumur-minyak/edit-pemilik/${sumurMinyakId}`,
        payload,
      );
      const updated = res.data.result || null;
      setSumurMinyak(updated);
      setPemilikForm(pemilikFromSumur(updated));
      onPemilikClose();
      toast({
        title: successTitle,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: "Gagal menyimpan data pemilik",
        description: err.response?.data?.error || err.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsSavingPemilik(false);
    }
  };

  const handleSavePemilik = () => {
    savePemilik(pemilikForm, "Data pemilik berhasil disimpan");
  };

  const openPemilikModal = () => {
    setPemilikForm(pemilikFromSumur(sumurMinyak));
    onPemilikOpen();
  };

  const handleResetPemilikForm = () => {
    setPemilikForm(pemilikFromSumur(sumurMinyak));
    onPemilikClose();
  };

  const handleDeletePemilik = () => {
    const confirmed = window.confirm(
      "Kosongkan semua data pemilik lahan dan sumur ini?",
    );
    if (!confirmed) return;
    savePemilik(emptyPemilik, "Data pemilik berhasil dikosongkan");
  };

  const closeQrModal = () => {
    if (qrPreview?.objectUrl?.startsWith("blob:")) {
      window.URL.revokeObjectURL(qrPreview.objectUrl);
    }
    setQrPreview(null);
    onQrClose();
  };

  const generateQrCode = async () => {
    if (!sumurMinyakId) return;
    setIsGeneratingQr(true);
    try {
      const fallbackName = `QR_Sumur_${sumurMinyak?.nama || sumurMinyakId}.png`;
      const result = await fetchSumurQrCode(
        API_BASE,
        sumurMinyakId,
        fallbackName,
      );
      if (qrPreview?.objectUrl?.startsWith("blob:")) {
        window.URL.revokeObjectURL(qrPreview.objectUrl);
      }
      setQrPreview(result);
      onQrOpen();
    } catch (err) {
      toast({
        title: "Gagal generate QR Code",
        description: parseQrError(err, "Gagal generate QR Code"),
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsGeneratingQr(false);
    }
  };

  const resetFilter = () => {
    setTanggalAwal("");
    setTanggalAkhir("");
    setAppliedStartDate("");
    setAppliedEndDate("");
    setPage(0);
  };

  return (
    <LayoutKPBPN>
      <Box
        bgColor="secondary"
        pb={{ base: 6, md: "40px" }}
        px={{ base: 3, md: "30px" }}
        minH="90vh"
        overflowX="hidden"
      >
        <Container
          variant="primary"
          maxW="100%"
          w="100%"
          p={{ base: 4, md: "30px" }}
          my={{ base: 4, md: "30px" }}
        >
          <Stack
            direction={{ base: "column", md: "row" }}
            justify="space-between"
            align={{ base: "stretch", md: "flex-start" }}
            spacing={4}
            mb={6}
          >
            <Box minW={0}>
              <Button
                as={RouterLink}
                to="/sumur/sumur-minyak"
                variant="ghost"
                size="sm"
                mb={2}
                px={0}
              >
                ← Kembali ke Daftar Sumur
              </Button>
              <Heading color="kpbpn" size={{ base: "md", md: "lg" }}>
                Detail Produksi Sumur
              </Heading>
              {sumurMinyak && (
                <Text color="gray.600" mt={1} wordBreak="break-word">
                  {sumurMinyak.nama}
                  {sumurMinyak.nomor ? ` · ${sumurMinyak.nomor}` : ""}
                </Text>
              )}
            </Box>
            {sumurMinyak && (
              <Stack
                direction={{ base: "column", sm: "row" }}
                spacing={2}
                w={{ base: "100%", md: "auto" }}
                flexShrink={0}
              >
                <Button
                  variant="secondary"
                  onClick={generateQrCode}
                  isLoading={isGeneratingQr}
                  w={{ base: "100%", md: "auto" }}
                >
                  Generate QR Code
                </Button>
                <Button
                  variant="primary"
                  onClick={openKlasifikasiModal}
                  w={{ base: "100%", md: "auto" }}
                >
                  Klasifikasi Sumur
                </Button>
              </Stack>
            )}
          </Stack>

          {sumurMinyak && (
            <Box
              mb={6}
              p={4}
              borderWidth="1px"
              borderRadius="lg"
              bg="gray.50"
            >
              <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
                <Box>
                  <Text fontSize="xs" color="gray.500" fontWeight="semibold">
                    MITRA
                  </Text>
                  <Text fontWeight="medium">{sumurMinyak.mitra?.nama || "-"}</Text>
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.500" fontWeight="semibold">
                    ALAMAT
                  </Text>
                  <Text wordBreak="break-word">{sumurMinyak.alamat || "-"}</Text>
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.500" fontWeight="semibold">
                    PRODUKSI HARIAN
                  </Text>
                  <Text>
                    {sumurMinyak.produksiHarian != null
                      ? sumurMinyak.produksiHarian
                      : "-"}
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.500" fontWeight="semibold">
                    STATUS VERIFIKASI
                  </Text>
                  <Badge
                    colorScheme={
                      sumurMinyak.statusVerifikasi === "sudah"
                        ? "green"
                        : sumurMinyak.statusVerifikasi === "belum"
                          ? "yellow"
                          : "red"
                    }
                    variant="subtle"
                    textTransform="capitalize"
                  >
                    {sumurMinyak.statusVerifikasi || "-"}
                  </Badge>
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.500" fontWeight="semibold">
                    KOORDINAT
                  </Text>
                  <Text fontSize="sm">
                    {sumurMinyak.latitude != null && sumurMinyak.longitude != null
                      ? `${sumurMinyak.latitude}, ${sumurMinyak.longitude}`
                      : "-"}
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.500" fontWeight="semibold">
                    TOTAL PRODUKSI (FILTER)
                  </Text>
                  <Text fontWeight="bold" color="kpbpn">
                    {totalProduksi}
                  </Text>
                </Box>
                {KLASIFIKASI_FIELDS.map((field) => (
                  <Box key={field.key}>
                    <Text fontSize="xs" color="gray.500" fontWeight="semibold">
                      {field.label.toUpperCase()}
                    </Text>
                    <Text>
                      {sumurMinyak[field.key] != null &&
                      sumurMinyak[field.key] !== ""
                        ? sumurMinyak[field.key]
                        : "-"}
                    </Text>
                  </Box>
                ))}
                {sumurMinyak.foto && (
                  <Box gridColumn={{ md: "span 2" }}>
                    <Text
                      fontSize="xs"
                      color="gray.500"
                      fontWeight="semibold"
                      mb={1}
                    >
                      FOTO SUMUR
                    </Text>
                    <Image
                      src={getImageUrl(sumurMinyak.foto)}
                      alt={sumurMinyak.nama}
                      maxH="120px"
                      maxW="100%"
                      borderRadius="md"
                      objectFit="cover"
                    />
                  </Box>
                )}
              </SimpleGrid>
            </Box>
          )}

          {sumurMinyak && (
            <Box
              mb={6}
              p={4}
              borderWidth="1px"
              borderRadius="lg"
              bg="white"
            >
              <Stack
                direction={{ base: "column", sm: "row" }}
                justify="space-between"
                mb={4}
                align={{ base: "stretch", sm: "center" }}
                spacing={3}
              >
                <Heading size="sm" color="kpbpn">
                  Data Pemilik
                </Heading>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={openPemilikModal}
                  w={{ base: "100%", sm: "auto" }}
                >
                  Kelola
                </Button>
              </Stack>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
                {PEMILIK_FIELDS.map((field) => (
                  <Box key={field.key}>
                    <Text fontSize="xs" color="gray.500" fontWeight="semibold">
                      {field.label.toUpperCase()}
                    </Text>
                    <Text wordBreak="break-word">
                      {sumurMinyak[field.key] || "-"}
                    </Text>
                  </Box>
                ))}
              </SimpleGrid>
            </Box>
          )}

          <Modal
            isOpen={isKlasifikasiOpen}
            onClose={handleResetKlasifikasiForm}
            size={{ base: "full", md: "xl" }}
            isCentered
          >
            <ModalOverlay />
            <ModalContent mx={{ base: 0, md: 4 }} my={{ base: 0, md: 16 }}>
              <ModalHeader color="kpbpn">Klasifikasi Sumur</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  {KLASIFIKASI_FIELDS.map((field) => (
                    <FormControl key={field.key}>
                      <FormLabel fontSize="sm">{field.label}</FormLabel>
                      <Input
                        type="number"
                        step="1"
                        value={klasifikasiForm[field.key]}
                        onChange={(e) =>
                          handleKlasifikasiChange(field.key, e.target.value)
                        }
                        placeholder={`Isi ${field.label.toLowerCase()}`}
                      />
                    </FormControl>
                  ))}
                </SimpleGrid>
              </ModalBody>
              <ModalFooter>
                <Stack
                  direction={{ base: "column-reverse", sm: "row" }}
                  spacing={3}
                  w="100%"
                  justify="flex-end"
                >
                  <Button
                    variant="cancle"
                    onClick={handleDeleteKlasifikasi}
                    isDisabled={isSavingKlasifikasi}
                    w={{ base: "100%", sm: "auto" }}
                  >
                    Kosongkan
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleResetKlasifikasiForm}
                    isDisabled={isSavingKlasifikasi}
                    w={{ base: "100%", sm: "auto" }}
                  >
                    Batal
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSaveKlasifikasi}
                    isLoading={isSavingKlasifikasi}
                    w={{ base: "100%", sm: "auto" }}
                  >
                    Simpan
                  </Button>
                </Stack>
              </ModalFooter>
            </ModalContent>
          </Modal>

          <Modal
            isOpen={isPemilikOpen}
            onClose={handleResetPemilikForm}
            size={{ base: "full", md: "xl" }}
            isCentered
          >
            <ModalOverlay />
            <ModalContent mx={{ base: 0, md: 4 }} my={{ base: 0, md: 16 }}>
              <ModalHeader color="kpbpn">Data Pemilik</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  {PEMILIK_FIELDS.map((field) => (
                    <FormControl key={field.key}>
                      <FormLabel fontSize="sm">{field.label}</FormLabel>
                      <Input
                        value={pemilikForm[field.key]}
                        onChange={(e) =>
                          handlePemilikChange(field.key, e.target.value)
                        }
                        placeholder={`Isi ${field.label.toLowerCase()}`}
                      />
                    </FormControl>
                  ))}
                </SimpleGrid>
              </ModalBody>
              <ModalFooter>
                <Stack
                  direction={{ base: "column-reverse", sm: "row" }}
                  spacing={3}
                  w="100%"
                  justify="flex-end"
                >
                  <Button
                    variant="cancle"
                    onClick={handleDeletePemilik}
                    isDisabled={isSavingPemilik}
                    w={{ base: "100%", sm: "auto" }}
                  >
                    Kosongkan
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleResetPemilikForm}
                    isDisabled={isSavingPemilik}
                    w={{ base: "100%", sm: "auto" }}
                  >
                    Batal
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSavePemilik}
                    isLoading={isSavingPemilik}
                    w={{ base: "100%", sm: "auto" }}
                  >
                    Simpan
                  </Button>
                </Stack>
              </ModalFooter>
            </ModalContent>
          </Modal>

          <Modal isOpen={isQrOpen} onClose={closeQrModal} size="md" isCentered>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader color="kpbpn">QR Code Sumur</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <Stack spacing={3} align="stretch">
                  <Box textAlign="center">
                    <Text fontWeight="bold">{sumurMinyak?.nama || "-"}</Text>
                    {sumurMinyak?.nomor && (
                      <Text fontSize="sm" color="gray.600">
                        No: {sumurMinyak.nomor}
                      </Text>
                    )}
                    {qrPreview?.url && (
                      <Text fontSize="sm" color="gray.500" mt={1} wordBreak="break-all">
                        {qrPreview.url}
                      </Text>
                    )}
                  </Box>
                  {qrPreview?.objectUrl && (
                    <Image
                      src={qrPreview.objectUrl}
                      alt="QR Code Sumur"
                      mx="auto"
                      maxW="280px"
                      w="100%"
                    />
                  )}
                </Stack>
              </ModalBody>
              <ModalFooter>
                <Button variant="ghost" mr={3} onClick={closeQrModal}>
                  Tutup
                </Button>
                <Button
                  variant="primary"
                  onClick={() =>
                    downloadObjectUrl(qrPreview?.objectUrl, qrPreview?.fileName)
                  }
                  isDisabled={!qrPreview?.objectUrl}
                >
                  Unduh QR Code
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>

          <Box
            mb={6}
            p={4}
            borderWidth="1px"
            borderRadius="lg"
            bg="gray.50"
          >
            <Stack
              direction={{ base: "column", md: "row" }}
              spacing={4}
              align={{ base: "stretch", md: "flex-end" }}
            >
              <FormControl w={{ base: "100%", md: "200px" }}>
                <FormLabel fontSize="sm">Tanggal Awal</FormLabel>
                <Input
                  type="date"
                  value={tanggalAwal}
                  onChange={(e) => setTanggalAwal(e.target.value)}
                />
              </FormControl>
              <FormControl w={{ base: "100%", md: "200px" }}>
                <FormLabel fontSize="sm">Tanggal Akhir</FormLabel>
                <Input
                  type="date"
                  value={tanggalAkhir}
                  onChange={(e) => setTanggalAkhir(e.target.value)}
                />
              </FormControl>
              <Stack direction={{ base: "column", sm: "row" }} spacing={3}>
                <Button
                  variant="primary"
                  onClick={handleFilter}
                  w={{ base: "100%", sm: "auto" }}
                >
                  Terapkan
                </Button>
                <Button
                  variant="ghost"
                  onClick={resetFilter}
                  w={{ base: "100%", sm: "auto" }}
                >
                  Reset
                </Button>
              </Stack>
            </Stack>
          </Box>

          <Box ref={dataListRef}>
            {isLoading ? (
              <Center py={10}>
                <Spinner size="lg" color="kpbpn" />
              </Center>
            ) : (
              <Box overflowX="auto" borderWidth="1px" borderRadius="lg">
                <Table size="sm" minW="720px">
                  <Thead bg="gray.50">
                    <Tr>
                      <Th>No</Th>
                      <Th>Tanggal Produksi</Th>
                      <Th>Produksi</Th>
                      <Th>Nomor Surat Jalan</Th>
                      <Th>Tanggal Surat Jalan</Th>
                      <Th>Volume Surat Jalan</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {dataProduksi.length === 0 ? (
                      <Tr>
                        <Td colSpan={6} textAlign="center" py={6}>
                          Belum ada data produksi untuk sumur ini
                        </Td>
                      </Tr>
                    ) : (
                      dataProduksi.map((item, index) => (
                        <Tr key={item.id}>
                          <Td>{page * limit + index + 1}</Td>
                          <Td>{formatTanggal(item.tanggal)}</Td>
                          <Td fontWeight="medium">{item.produksi ?? "-"}</Td>
                          <Td>{item.suratJalan?.nomor || "-"}</Td>
                          <Td>{formatTanggal(item.suratJalan?.tanggal)}</Td>
                          <Td>
                            {formatVolumeLabel(
                              item.suratJalan?.volume,
                              item.suratJalan?.satuanVolume?.satuan,
                            )}
                          </Td>
                        </Tr>
                      ))
                    )}
                  </Tbody>
                </Table>
              </Box>
            )}
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
              <Text fontSize="sm" color="gray.600">
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
                <Box overflowX="auto" py={1}>
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
                    pageRangeDisplayed={3}
                    previousClassName="item previous"
                  />
                </Box>
              )}
            </Flex>
          )}
        </Container>
      </Box>
    </LayoutKPBPN>
  );
}

export default ProduksiSumur;
