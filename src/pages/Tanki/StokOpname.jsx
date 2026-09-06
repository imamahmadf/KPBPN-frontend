import React, { useState, useEffect, useRef, useMemo } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import axios from "axios";
import ReactPaginate from "react-paginate";
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
import { BsChevronDown, BsChevronUp, BsPencil, BsTrash } from "react-icons/bs";
import LayoutKPBPN from "../../Componets/KPBPN/LayoutKPBPN";
import { formatVolumeNumber } from "../../lib/volumeSatuan";
import "../../Style/pagination.css";

const API_BASE = import.meta.env.VITE_REACT_APP_API_BASE_URL;
const SATUAN = "barrel";
const TABLE_COL_SPAN = 15;
const EXPAND_COL_SPAN = 12;

const roundBarrel = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 1000) / 1000;

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
      };
      map.set(key, group);
      groups.push(group);
    }

    const group = map.get(key);
    group.items.push(item);
    group.totalMasuk += Number(item.masuk) || 0;
    group.totalKeluar += Number(item.keluar) || 0;
  }

  return groups.map((group) => ({
    ...group,
    totalMasuk: roundBarrel(group.totalMasuk),
    totalKeluar: roundBarrel(group.totalKeluar),
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

const calcVolumePreview = (tinggi, factorTank) => {
  const height = parseDecimalInput(tinggi);
  const factor = Number(factorTank);
  if (height === null || Number.isNaN(factor) || factor <= 0) return null;
  return Math.round((height * factor + Number.EPSILON) * 1000) / 1000;
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

  const [tanggalAwal, setTanggalAwal] = useState(getDefaultStartDate);
  const [tanggalAkhir, setTanggalAkhir] = useState(getDefaultEndDate);
  const [tangkiFilterId, setTangkiFilterId] = useState("");

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
      setExpandedKeys([]);
    } catch (err) {
      console.error(err);
      setDataStok([]);
      setRows(0);
      setPages(0);
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
    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
      <Box>
        <Heading size="xs" mb={3} color="green.700">
          Minyak Masuk · Pengisian Tanki
        </Heading>
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
              </Box>
            ))}
          </Stack>
        ) : (
          <Text fontSize="sm" color="gray.500">
            Tidak ada BA bongkar pada tanggal ini
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
                Pengukuran manual harian (tinggi minyak & tinggi air × factor
                tank) dalam satuan barrel, plus minyak masuk dari pengisian
                tanki dan keluar dari BA bongkar.
              </Text>
              <Text fontSize="sm" color="gray.500">
                Total: {rows} data
              </Text>
            </VStack>
            <Spacer />
            <Button variant="primary" onClick={openAddForm}>
              + Tambah Stok Opname
            </Button>
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
                                      No. {page * limit + startIndex + itemIndex + 1}
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
                                  <MobileField label="Factor Tank">
                                    {formatAngka(item.factorTank)}
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
                      Factor Tank
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
                              <Td isNumeric>{formatAngka(item.factorTank)}</Td>
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
            {editingItem ? "Edit Stok Opname Tanki" : "Tambah Stok Opname Tanki"}
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
              const factorTank = selectedTanki?.factorTank;
              const volumeMinyak = calcVolumePreview(
                values.tinggiMinyak,
                factorTank,
              );
              const volumeAir = calcVolumePreview(values.tinggiAir, factorTank);
              const tinggiBersih =
                parseDecimalInput(values.tinggiMinyak) !== null &&
                parseDecimalInput(values.tinggiAir) !== null
                  ? parseDecimalInput(values.tinggiMinyak) -
                    parseDecimalInput(values.tinggiAir)
                  : null;
              const volumeBersih = calcVolumePreview(tinggiBersih, factorTank);

              return (
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
                      <FormControl isInvalid={touched.tankiId && errors.tankiId}>
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
                              {item.factorTank
                                ? ` · factor ${formatAngka(item.factorTank)}`
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
                        Pratinjau volume (tinggi × factor tank)
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
                      {selectedTanki && !selectedTanki.factorTank && (
                        <Text fontSize="xs" color="orange.600" mt={2}>
                          Tanki ini belum memiliki factor tank.
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
    </LayoutKPBPN>
  );
};

export default StokOpname;
