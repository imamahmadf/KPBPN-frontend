import React, { useState, useEffect, useRef } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import axios from "axios";
import ReactPaginate from "react-paginate";
import {
  Box,
  Button,
  FormControl,
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
  HStack,
  Divider,
  Badge,
  Flex,
  Spacer,
  SimpleGrid,
  Skeleton,
  Stack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormErrorMessage,
  Textarea,
  useDisclosure,
} from "@chakra-ui/react";
import { Select as Select2, AsyncSelect } from "chakra-react-select";
import LayoutKPBPN from "../../Componets/KPBPN/LayoutKPBPN";
import "../../Style/pagination.css";

const API_BASE = import.meta.env.VITE_REACT_APP_API_BASE_URL;

const konfirmasiSchema = Yup.object({
  tanggal: Yup.string().required("Tanggal wajib diisi"),
  volume: Yup.number()
    .typeError("Volume harus angka")
    .positive("Volume harus lebih dari 0")
    .required("Volume wajib diisi"),
  pegawaiId: Yup.mixed().nullable().required("Pegawai wajib dipilih"),
  catatan: Yup.string().nullable(),
});

const initialValuesKonfirmasi = {
  tanggal: "",
  volume: "",
  pegawaiId: null,
  pegawaiLabel: "",
  catatan: "",
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
    <Text fontSize="sm" color="gray.700">
      {children}
    </Text>
  </Box>
);

const formatVolumeLabel = (volume, satuan) => {
  if (volume === null || volume === undefined || volume === "") return "-";
  return satuan ? `${volume} ${satuan}` : String(volume);
};

const SuratJalan = () => {
  const toast = useToast();
  const dataListRef = useRef(null);
  const formikRefKonfirmasi = useRef(null);
  const {
    isOpen: isKonfirmasiOpen,
    onOpen: onKonfirmasiOpen,
    onClose: onKonfirmasiClose,
  } = useDisclosure();
  const {
    isOpen: isDetailKonfirmasiOpen,
    onOpen: onDetailKonfirmasiOpen,
    onClose: onDetailKonfirmasiClose,
  } = useDisclosure();
  const [selectedSuratJalan, setSelectedSuratJalan] = useState(null);
  const [selectedSuratJalanDetail, setSelectedSuratJalanDetail] =
    useState(null);
  const [dataKonfirmasi, setDataKonfirmasi] = useState([]);
  const [loadingDetailKonfirmasi, setLoadingDetailKonfirmasi] = useState(false);

  const [dataSuratJalan, setDataSuratJalan] = useState([]);
  const [dataSeed, setDataSeed] = useState(null);
  const [page, setPage] = useState(0);
  const [limit] = useState(50);
  const [pages, setPages] = useState(0);
  const [rows, setRows] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const [mitraFilterId, setMitraFilterId] = useState(0);
  const [transportirFilterId, setTransportirFilterId] = useState(0);
  const [supirFilterId, setSupirFilterId] = useState(0);
  const [unitKerjaFilterId, setUnitKerjaFilterId] = useState(0);
  const [statusSuratJalanFilterId, setStatusSuratJalanFilterId] = useState(0);
  const [tanggalAwal, setTanggalAwal] = useState("");
  const [tanggalAkhir, setTanggalAkhir] = useState("");
  const [sortBy, setSortBy] = useState("tanggal");
  const [sortOrder, setSortOrder] = useState("DESC");

  const allSupir = (dataSeed?.resultMitra || []).flatMap((m) =>
    (m.supirs || []).map((s) => ({
      ...s,
      mitraNama: m.nama,
    })),
  );

  const formatTanggal = (d) =>
    d
      ? new Date(d).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "-";

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
          mitraId: mitraFilterId || undefined,
          transportirId: transportirFilterId || undefined,
          supirId: supirFilterId || undefined,
          unitKerjaId: unitKerjaFilterId || undefined,
          statusSuratJalanId: statusSuratJalanFilterId || undefined,
          startDate: tanggalAwal || undefined,
          endDate: tanggalAkhir || undefined,
          sortBy,
          sortOrder,
        },
      });
      setDataSuratJalan(res.data.result || []);
      setPage(res.data.page ?? page);
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

  const verifikasiSuratJalan = async (id, mitraId) => {
    try {
      await axios.post(`${API_BASE}/pengiriman/verifikasi/${id}`, { mitraId });
      toast({
        title: "Berhasil",
        description: "Surat jalan berhasil diverifikasi",
        status: "success",
        duration: 4000,
        isClosable: true,
      });
      fetchDataSuratJalan();
    } catch (err) {
      console.error(err);
      toast({
        title: "Error!",
        description:
          err.response?.data?.error || "Gagal memverifikasi surat jalan",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const openKonfirmasiModal = (item) => {
    setSelectedSuratJalan(item);
    onKonfirmasiOpen();
  };

  const handleCloseKonfirmasiModal = () => {
    formikRefKonfirmasi.current?.resetForm();
    setSelectedSuratJalan(null);
    onKonfirmasiClose();
  };

  const handleCloseDetailKonfirmasiModal = () => {
    setSelectedSuratJalanDetail(null);
    setDataKonfirmasi([]);
    onDetailKonfirmasiClose();
  };

  const openDetailKonfirmasiModal = async (item) => {
    setSelectedSuratJalanDetail(item);
    setLoadingDetailKonfirmasi(true);
    onDetailKonfirmasiOpen();

    try {
      const res = await axios.get(
        `${API_BASE}/pengiriman/get/konfirmasi/${item.id}`,
      );
      setDataKonfirmasi(res.data.result || []);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error!",
        description:
          err.response?.data?.error ||
          "Gagal memuat data konfirmasi penerimaan",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      handleCloseDetailKonfirmasiModal();
    } finally {
      setLoadingDetailKonfirmasi(false);
    }
  };

  const submitKonfirmasiPenerimaan = async (
    values,
    { setSubmitting, resetForm },
  ) => {
    if (!selectedSuratJalan?.id) return;

    try {
      await axios.post(`${API_BASE}/pengiriman/post/konfirmasi`, {
        suratJalanId: selectedSuratJalan.id,
        tanggal: values.tanggal,
        volume: values.volume,
        pegawaiId: values.pegawaiId,
        catatan: values.catatan || "",
      });

      toast({
        title: "Berhasil",
        description: "Konfirmasi penerimaan berhasil disimpan",
        status: "success",
        duration: 4000,
        isClosable: true,
      });

      resetForm();
      handleCloseKonfirmasiModal();
      fetchDataSuratJalan();
    } catch (err) {
      console.error(err);
      toast({
        title: "Error!",
        description:
          err.response?.data?.error || "Gagal menyimpan konfirmasi penerimaan",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetFilter = () => {
    setMitraFilterId(0);
    setTransportirFilterId(0);
    setSupirFilterId(0);
    setUnitKerjaFilterId(0);
    setStatusSuratJalanFilterId(0);
    setTanggalAwal("");
    setTanggalAkhir("");
    setSortBy("tanggal");
    setSortOrder("DESC");
  };

  const hasActiveFilter =
    mitraFilterId ||
    transportirFilterId ||
    supirFilterId ||
    unitKerjaFilterId ||
    statusSuratJalanFilterId ||
    tanggalAwal ||
    tanggalAkhir ||
    sortBy !== "tanggal" ||
    sortOrder !== "DESC";

  const renderAksi = (item, fullWidth = false) => {
    const actions = [];

    if (item.statusSuratJalanId === 1) {
      actions.push(
        <Button
          key="verifikasi"
          size="sm"
          variant="outline"
          colorScheme="teal"
          w={fullWidth ? "full" : "auto"}
          onClick={() => verifikasiSuratJalan(item.id, item.mitraId)}
        >
          Verifikasi
        </Button>,
      );
    }
    if (item.statusSuratJalanId === 2) {
      actions.push(
        <Button
          key="konfirmasi"
          size="sm"
          variant="outline"
          colorScheme="orange"
          w={fullWidth ? "full" : "auto"}
          onClick={() => openKonfirmasiModal(item)}
        >
          Konfirmasi
        </Button>,
      );
    }
    if (item.statusSuratJalanId === 3) {
      actions.push(
        <Button
          key="detail-konfirmasi"
          size="sm"
          variant="outline"
          colorScheme="blue"
          w={fullWidth ? "full" : "auto"}
          onClick={() => openDetailKonfirmasiModal(item)}
        >
          Detail Konfirmasi
        </Button>,
      );
    }

    if (!actions.length) return null;

    if (fullWidth) {
      return (
        <Stack spacing={2} w="full">
          {actions}
        </Stack>
      );
    }

    return <HStack spacing={2}>{actions}</HStack>;
  };

  const renderAksiBox = (item) => {
    const aksi = renderAksi(item, true);
    if (!aksi) return null;
    return <Box mt={4}>{aksi}</Box>;
  };

  useEffect(() => {
    fetchSeed();
  }, []);

  useEffect(() => {
    setPage(0);
  }, [
    mitraFilterId,
    transportirFilterId,
    supirFilterId,
    unitKerjaFilterId,
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
    mitraFilterId,
    transportirFilterId,
    supirFilterId,
    unitKerjaFilterId,
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
            gap={{ base: 2, sm: 0 }}
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
            <Spacer />
          </Flex>

          <Divider mb={6} />

          <Box mb={6}>
            <Heading size="md" mb={4} color="kpbpn">
              Filter Pencarian
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="medium">
                  Mitra
                </FormLabel>
                <Select2
                  options={(dataSeed?.resultMitra || []).map((val) => ({
                    value: val.id,
                    label: val.nama || `Mitra #${val.id}`,
                  }))}
                  placeholder="Pilih Mitra"
                  onChange={(opt) => setMitraFilterId(opt?.value || 0)}
                  {...selectStyles}
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" fontWeight="medium">
                  Transportir
                </FormLabel>
                <Select2
                  options={(dataSeed?.resultTransportir || []).map((val) => ({
                    value: val.id,
                    label: val.plat || `Transportir #${val.id}`,
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
                  Proyek
                </FormLabel>
                <AsyncSelect
                  loadOptions={async (inputValue) => {
                    if (!inputValue) return [];
                    try {
                      const res = await axios.get(
                        `${API_BASE}/admin/search/unit-kerja?q=${encodeURIComponent(inputValue)}`,
                      );
                      return (res.data.result || []).map((val) => ({
                        value: val.id,
                        label: val.unitKerja,
                      }));
                    } catch (err) {
                      console.error("Failed to load options:", err.message);
                      return [];
                    }
                  }}
                  placeholder="Ketik Nama Proyek"
                  onChange={(opt) => setUnitKerjaFilterId(opt?.value || 0)}
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
                  {dataSuratJalan.map((item, index) => (
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
                        <VStack align="start" spacing={0}>
                          <Text fontSize="xs" color="gray.500">
                            No. {page * limit + index + 1}
                          </Text>
                          <Text fontWeight="bold" color="kpbpn" fontSize="sm">
                            {item.nomor || "-"}
                          </Text>
                        </VStack>
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
                        <MobileField label="Proyek">
                          {item.daftarUnitKerja?.unitKerja || "-"}
                        </MobileField>
                        <MobileField label="Volume">
                          {formatVolumeLabel(
                            item.volume,
                            item.satuanVolume?.satuan,
                          )}
                        </MobileField>
                        <MobileField label="Supir">
                          {item.supir?.nama || "-"}
                        </MobileField>
                      </SimpleGrid>
                      {renderAksiBox(item)}
                    </Box>
                  ))}
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
              <Table variant="simple" size="md" minW="1000px">
                <Thead bg="gray.50">
                  <Tr>
                    <Th textTransform="capitalize">No.</Th>
                    <Th textTransform="capitalize">Nomor</Th>
                    <Th textTransform="capitalize">Tanggal</Th>
                    <Th textTransform="capitalize">Mitra</Th>
                    <Th textTransform="capitalize">Transportir</Th>
                    <Th textTransform="capitalize">Proyek</Th>
                    <Th textTransform="capitalize" isNumeric>
                      Volume
                    </Th>
                    <Th textTransform="capitalize">Supir</Th>
                    <Th textTransform="capitalize">Status</Th>
                    <Th textTransform="capitalize">Aksi</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, idx) => (
                      <Tr key={idx}>
                        {Array.from({ length: 10 }).map((__, i) => (
                          <Td key={i}>
                            <Skeleton height="20px" />
                          </Td>
                        ))}
                      </Tr>
                    ))
                  ) : dataSuratJalan?.length > 0 ? (
                    dataSuratJalan.map((item, index) => (
                      <Tr key={item.id}>
                        <Td fontWeight="medium">{page * limit + index + 1}</Td>
                        <Td fontWeight="medium">{item.nomor || "-"}</Td>
                        <Td>{formatTanggal(item.tanggal)}</Td>
                        <Td>{item.mitra?.nama || "-"}</Td>
                        <Td>{item.transportir?.plat || "-"}</Td>
                        <Td>{item.daftarUnitKerja?.unitKerja || "-"}</Td>
                        <Td isNumeric>
                          {formatVolumeLabel(
                            item.volume,
                            item.satuanVolume?.satuan,
                          )}
                        </Td>
                        <Td>{item.supir?.nama || "-"}</Td>
                        <Td>
                          <Badge colorScheme="blue" variant="subtle">
                            {item.statusSuratJalan?.status || "-"}
                          </Badge>
                        </Td>

                        <Td>
                          <HStack spacing={2}>{renderAksi(item) || "-"}</HStack>
                        </Td>
                      </Tr>
                    ))
                  ) : (
                    <Tr>
                      <Td colSpan={10} textAlign="center" py={10}>
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
        isOpen={isKonfirmasiOpen}
        onClose={handleCloseKonfirmasiModal}
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
          <ModalHeader>Konfirmasi Penerimaan</ModalHeader>
          <ModalCloseButton />
          {selectedSuratJalan && (
            <Box px={6} pb={2}>
              <Text fontSize="sm" color="gray.500">
                Surat Jalan: {selectedSuratJalan.nomor || "-"}
              </Text>
            </Box>
          )}
          <Formik
            innerRef={formikRefKonfirmasi}
            initialValues={{
              ...initialValuesKonfirmasi,
              volume: selectedSuratJalan?.volume ?? "",
            }}
            enableReinitialize
            validationSchema={konfirmasiSchema}
            onSubmit={submitKonfirmasiPenerimaan}
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

                    <FormControl isInvalid={touched.volume && errors.volume}>
                      <FormLabel>Volume</FormLabel>
                      <Input
                        name="volume"
                        type="number"
                        bgColor="terang"
                        value={values.volume}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="Masukkan volume diterima"
                      />
                      <FormErrorMessage>{errors.volume}</FormErrorMessage>
                    </FormControl>

                    <FormControl
                      isInvalid={touched.pegawaiId && errors.pegawaiId}
                    >
                      <FormLabel>Pegawai</FormLabel>
                      <AsyncSelect
                        loadOptions={async (inputValue) => {
                          if (!inputValue) return [];
                          try {
                            const res = await axios.get(
                              `${API_BASE}/pegawai/search?q=${encodeURIComponent(inputValue)}`,
                            );
                            return (res.data.result || []).map((val) => ({
                              value: val.id,
                              label:
                                val.nama || val.name || `Pegawai #${val.id}`,
                            }));
                          } catch (err) {
                            console.error(
                              "Failed to load pegawai:",
                              err.message,
                            );
                            return [];
                          }
                        }}
                        placeholder="Ketik Nama Pegawai"
                        value={
                          values.pegawaiId
                            ? {
                                value: values.pegawaiId,
                                label: values.pegawaiLabel,
                              }
                            : null
                        }
                        onChange={(opt) => {
                          setFieldValue("pegawaiId", opt?.value || null);
                          setFieldValue("pegawaiLabel", opt?.label || "");
                        }}
                        {...selectStyles}
                      />
                      <FormErrorMessage>{errors.pegawaiId}</FormErrorMessage>
                    </FormControl>

                    <FormControl gridColumn={{ md: "span 2" }}>
                      <FormLabel>Catatan</FormLabel>
                      <Textarea
                        name="catatan"
                        bgColor="terang"
                        value={values.catatan}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="Catatan tambahan (opsional)"
                        rows={3}
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
                    onClick={handleCloseKonfirmasiModal}
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

      <Modal
        isOpen={isDetailKonfirmasiOpen}
        onClose={handleCloseDetailKonfirmasiModal}
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
          <ModalHeader>Detail Konfirmasi Penerimaan</ModalHeader>
          <ModalCloseButton />
          {selectedSuratJalanDetail && (
            <Box px={6} pb={2}>
              <Text fontSize="sm" color="gray.500">
                Surat Jalan: {selectedSuratJalanDetail.nomor || "-"}
              </Text>
            </Box>
          )}
          <ModalBody>
            {loadingDetailKonfirmasi ? (
              <Stack spacing={4}>
                <Skeleton height="24px" width="50%" />
                <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} height="48px" />
                  ))}
                </SimpleGrid>
              </Stack>
            ) : dataKonfirmasi.length > 0 ? (
              <Stack spacing={6}>
                {dataKonfirmasi.map((kp) => (
                  <Box
                    key={kp.id}
                    p={4}
                    borderRadius="lg"
                    border="1px solid"
                    borderColor="gray.200"
                    bg="gray.50"
                  >
                    <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
                      <MobileField label="Nomor Konfirmasi">
                        {kp.nomor || "-"}
                      </MobileField>
                      <MobileField label="Tanggal">
                        {formatTanggal(kp.tanggal)}
                      </MobileField>
                      <MobileField label="Volume Diterima">
                        {formatVolumeLabel(
                          kp.volume,
                          kp.suratJalan?.satuanVolume?.satuan ||
                            selectedSuratJalanDetail?.satuanVolume?.satuan,
                        )}
                      </MobileField>
                      <MobileField label="Pegawai">
                        {kp.pegawai?.nama || "-"}
                      </MobileField>
                      <MobileField label="Mitra">
                        {kp.suratJalan?.mitra?.nama ||
                          selectedSuratJalanDetail?.mitra?.nama ||
                          "-"}
                      </MobileField>
                      <MobileField label="Status Pengisian Tanki">
                        {kp.pengisianTankiId
                          ? `Sudah diisi (ID: ${kp.pengisianTankiId})`
                          : "Belum diisi tanki"}
                      </MobileField>
                      <Box gridColumn={{ sm: "span 2" }}>
                        <MobileField label="Catatan">
                          {kp.catatan || "-"}
                        </MobileField>
                      </Box>
                    </SimpleGrid>
                  </Box>
                ))}
              </Stack>
            ) : (
              <Box py={8} textAlign="center">
                <Text color="gray.500">
                  Belum ada data konfirmasi penerimaan untuk surat jalan ini.
                </Text>
              </Box>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="primary"
              onClick={handleCloseDetailKonfirmasiModal}
              w={{ base: "full", sm: "auto" }}
            >
              Tutup
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </LayoutKPBPN>
  );
};

export default SuratJalan;
