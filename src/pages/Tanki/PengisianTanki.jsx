import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useHistory } from "react-router-dom";
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
  Badge,
  Text,
  Spinner,
  Center,
  useToast,
  Checkbox,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  useDisclosure,
  VStack,
  Select,
  Divider,
  Textarea,
  SimpleGrid,
  CheckboxGroup,
  Stack,
  Collapse,
  Skeleton,
  FormHelperText,
  Flex,
  Spacer,
} from "@chakra-ui/react";
import LayoutKPBPN from "../../Componets/KPBPN/LayoutKPBPN";
import VolumeMultiSatuan from "../../Componets/VolumeMultiSatuan";
import "../../Style/pagination.css";

const API_BASE = import.meta.env.VITE_REACT_APP_API_BASE_URL;

const getTodayInputDate = () => new Date().toISOString().split("T")[0];

const toInputDate = (date) => {
  if (!date) return getTodayInputDate();
  return new Date(date).toISOString().split("T")[0];
};

const emptyEditForm = () => ({
  tanggal: getTodayInputDate(),
  tangkiId: "",
  gross: "",
  net: "",
  penampilanVisual: "",
  warna: "",
  kandunganAir: "",
  BSW: "",
  catatan: "",
  saksi: "",
  satuanVolumeId: "",
  nomorSurat: "",
  ids: [],
});

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getTangkiId = (item) => item.tangkiId ?? item.tanki?.id;

const getMitraNamesFromPengisian = (item) => {
  const names = new Set();
  (item.konfirmasiPenerimaans || []).forEach((kp) => {
    const nama = kp.suratJalan?.mitra?.nama;
    if (nama) names.add(nama);
  });
  return Array.from(names);
};

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

const getLinkedTankiKode = (kp) =>
  Array.from(
    new Set(
      (kp.pengisianTankis || [])
        .map((item) => item.tanki?.kode)
        .filter(Boolean),
    ),
  );

const PENGISIAN_TANKI_COL_COUNT = 15;

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
    <Box fontSize="sm" color="gray.700" wordBreak="break-word">
      {children}
    </Box>
  </Box>
);

const PengisianTanki = () => {
  const history = useHistory();
  const toast = useToast();
  const dataListRef = useRef(null);
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const [dataPengisian, setDataPengisian] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingCetak, setLoadingCetak] = useState({});
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState(emptyEditForm());
  const [dataTanki, setDataTanki] = useState([]);
  const [dataSatuanVolume, setDataSatuanVolume] = useState([]);
  const [editKonfirmasiOptions, setEditKonfirmasiOptions] = useState([]);
  const [isLoadingEditForm, setIsLoadingEditForm] = useState(false);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedProduksiId, setExpandedProduksiId] = useState(null);
  const [produksiPanel, setProduksiPanel] = useState({
    loading: false,
    groups: [],
  });
  const limit = 50;

  const changePage = ({ selected }) => {
    setPage(selected);
    setExpandedProduksiId(null);
    dataListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const fetchDataPengisianTanki = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE}/tanki/get?page=${page}&limit=${limit}`,
      );
      setDataPengisian(res.data.result || []);
      setTotalRows(res.data.totalRows || 0);
      setPages(res.data.totalPage || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const canModifyPengisian = (item) => !item.BABongkarId && !item.nomorSurat;

  const fetchEditFormData = async (item) => {
    setIsLoadingEditForm(true);
    try {
      const [tankiRes, konfirmasiRes] = await Promise.all([
        axios.get(`${API_BASE}/tanki/get/tanki`),
        axios.get(`${API_BASE}/tanki/get/konfirmasi-penerimaan`),
      ]);

      setDataTanki(tankiRes.data.result || []);
      setDataSatuanVolume(tankiRes.data.resultSatuanVolume || []);

      const linkedKonfirmasi = item.konfirmasiPenerimaans || [];
      const availableKonfirmasi = konfirmasiRes.data.result || [];
      const mergedMap = new Map();

      [...linkedKonfirmasi, ...availableKonfirmasi].forEach((kp) => {
        mergedMap.set(kp.id, kp);
      });

      setEditKonfirmasiOptions(Array.from(mergedMap.values()));
    } catch (err) {
      console.error(err);
      toast({
        title: "Gagal memuat data",
        description: err.response?.data?.error || err.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsLoadingEditForm(false);
    }
  };

  const handleOpenEdit = async (item) => {
    setEditingItem(item);
    setEditForm({
      tanggal: toInputDate(item.tanggal || item.createdAt),
      tangkiId: String(getTangkiId(item) || ""),
      gross: item.gross?.toString() || "",
      net: item.net?.toString() || "",
      penampilanVisual: item.penampilanVisual || "",
      warna: item.warna || "",
      kandunganAir: item.kandunganAir?.toString() || "",
      BSW: item.BSW?.toString() || "",
      catatan: item.catatan || "",
      saksi: item.saksi || "",
      satuanVolumeId: item.satuanVolumeId
        ? String(item.satuanVolumeId)
        : item.satuanVolume?.id
          ? String(item.satuanVolume.id)
          : "",
      nomorSurat: item.nomorSurat || "",
      ids: (item.konfirmasiPenerimaans || []).map((kp) => String(kp.id)),
    });
    onEditOpen();
    await fetchEditFormData(item);
  };

  const handleCloseEdit = () => {
    setEditingItem(null);
    setEditForm(emptyEditForm());
    setEditKonfirmasiOptions([]);
    onEditClose();
  };

  const handleEditFieldChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "tangkiId") {
        const selected = dataTanki.find((t) => String(t.id) === String(value));
        if (selected?.satuanVolumeId) {
          next.satuanVolumeId = String(selected.satuanVolumeId);
        }
      }
      return next;
    });
  };

  const handleSubmitEdit = async () => {
    if (!editingItem) return;

    const requiredFields = [
      ["tanggal", "Tanggal"],
      ["tangkiId", "Tanki"],
      ["gross", "Gross"],
      ["net", "Net"],
      ["penampilanVisual", "Penampilan visual"],
      ["warna", "Warna"],
      ["kandunganAir", "Kandungan air"],
      ["BSW", "BSW"],
      ["saksi", "Saksi"],
      ["satuanVolumeId", "Satuan volume"],
    ];

    for (const [field, label] of requiredFields) {
      if (!editForm[field] && editForm[field] !== 0) {
        toast({
          title: "Data belum lengkap",
          description: `${label} wajib diisi`,
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
        return;
      }
    }

    setIsSubmittingEdit(true);
    try {
      await axios.post(`${API_BASE}/tanki/edit/${editingItem.id}`, {
        tanggal: editForm.tanggal,
        tangkiId: parseInt(editForm.tangkiId, 10),
        gross: parseInt(editForm.gross, 10),
        net: parseInt(editForm.net, 10),
        penampilanVisual: editForm.penampilanVisual,
        warna: editForm.warna,
        kandunganAir: parseInt(editForm.kandunganAir, 10),
        BSW: parseInt(editForm.BSW, 10),
        catatan: editForm.catatan,
        saksi: editForm.saksi,
        satuanVolumeId: parseInt(editForm.satuanVolumeId, 10),
        nomorSurat: editForm.nomorSurat.trim(),
        ids: editForm.ids.map((id) => parseInt(id, 10)),
      });

      toast({
        title: "Berhasil",
        description: "Data pengisian tanki berhasil diperbarui",
        status: "success",
        duration: 4000,
        isClosable: true,
      });

      handleCloseEdit();
      fetchDataPengisianTanki();
    } catch (err) {
      console.error(err);
      toast({
        title: "Gagal memperbarui",
        description:
          err.response?.data?.message?.message ||
          err.response?.data?.message ||
          err.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleOpenDelete = (item) => {
    if (!canModifyPengisian(item)) {
      toast({
        title: "Tidak dapat dihapus",
        description:
          "Data yang sudah memiliki BA Bongkar atau nomor surat BAST tidak dapat dihapus",
        status: "warning",
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    setDeleteTarget(item);
    onDeleteOpen();
  };

  const handleCloseDelete = () => {
    setDeleteTarget(null);
    onDeleteClose();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      await axios.post(`${API_BASE}/tanki/delete/${deleteTarget.id}`);
      toast({
        title: "Berhasil",
        description: "Data pengisian tanki berhasil dihapus",
        status: "success",
        duration: 4000,
        isClosable: true,
      });
      handleCloseDelete();
      fetchDataPengisianTanki();
    } catch (err) {
      console.error(err);
      toast({
        title: "Gagal menghapus",
        description:
          err.response?.data?.message ||
          err.response?.data?.error ||
          err.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const cetakBAST = async (item) => {
    setLoadingCetak((prev) => ({ ...prev, [item.id]: true }));

    try {
      const res = await axios.post(
        `${API_BASE}/tanki/cetak/bast`,
        { id: item.id },
        { responseType: "blob" },
      );

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `BAST_${item.tanki?.kode || item.id}_${Date.now()}.docx`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Berhasil",
        description: "Dokumen BAST berhasil diunduh",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      fetchDataPengisianTanki();
    } catch (err) {
      console.error(err);
      let message = "Gagal mencetak dokumen BAST";
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
      setLoadingCetak((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  const fetchProduksiForPengisian = async (item) => {
    setProduksiPanel({ loading: true, groups: [] });

    const suratJalanMap = new Map();
    (item.konfirmasiPenerimaans || []).forEach((kp) => {
      if (kp.suratJalan?.id && !suratJalanMap.has(kp.suratJalan.id)) {
        suratJalanMap.set(kp.suratJalan.id, kp.suratJalan);
      }
    });

    if (suratJalanMap.size === 0) {
      setProduksiPanel({ loading: false, groups: [] });
      return;
    }

    try {
      const groups = await Promise.all(
        Array.from(suratJalanMap.entries()).map(async ([id, sj]) => {
          const res = await axios.get(
            `${API_BASE}/pengiriman/get/produksi-sumur/${id}`,
          );
          const sumurList = res.data.resultSumurMinyak || [];
          const existingProduksi = res.data.resultProduksi || [];

          const rows = sumurList.map((sumur) => {
            const existing = existingProduksi.find(
              (p) => p.sumurMinyakId === sumur.id,
            );
            return {
              ...sumur,
              produksi: existing?.produksi ?? null,
            };
          });

          const totalProduksi = rows.reduce(
            (sum, row) => sum + (row.produksi || 0),
            0,
          );

          return {
            suratJalan: res.data.suratJalan || sj,
            rows,
            totalProduksi,
          };
        }),
      );

      setProduksiPanel({ loading: false, groups });
    } catch (err) {
      console.error(err);
      setExpandedProduksiId(null);
      setProduksiPanel({ loading: false, groups: [] });
      toast({
        title: "Gagal memuat produksi sumur",
        description: err.response?.data?.error || err.message,
        status: "error",
        duration: 4000,
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
    await fetchProduksiForPengisian(item);
  };

  const hasLinkedSuratJalan = (item) =>
    (item.konfirmasiPenerimaans || []).some((kp) => kp.suratJalan?.id);

  const renderProduksiPanelContent = (item) => {
    if (!hasLinkedSuratJalan(item)) {
      return (
        <Text fontSize="sm" color="gray.500">
          Tidak ada surat jalan terkait pada pengisian ini
        </Text>
      );
    }

    if (produksiPanel.loading) {
      return (
        <Stack spacing={2}>
          <Skeleton height="20px" />
          <Skeleton height="20px" />
          <Skeleton height="20px" />
        </Stack>
      );
    }

    if (produksiPanel.groups.length === 0) {
      return (
        <Text fontSize="sm" color="gray.500">
          Tidak ada data produksi sumur
        </Text>
      );
    }

    return (
      <Stack spacing={6}>
        {produksiPanel.groups.map((group) => {
          const sj = group.suratJalan;
          const volume = sj?.volume;
          const satuan = sj?.satuanVolume?.satuan;

          return (
            <Box
              key={sj?.id}
              p={4}
              borderRadius="md"
              border="1px solid"
              borderColor="gray.200"
              bg="white"
            >
              <HStack
                justify="space-between"
                align="start"
                mb={3}
                flexWrap="wrap"
                gap={2}
              >
                <Box>
                  <Text fontSize="sm" fontWeight="bold" color="kpbpn">
                    Surat Jalan: {sj?.nomor || "-"}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {sj?.mitra?.nama || "-"} · {formatDate(sj?.tanggal)}
                  </Text>
                  <HStack spacing={1} align="start" mt={0.5}>
                    <Text fontSize="xs" color="gray.500">
                      Volume:
                    </Text>
                    <VolumeMultiSatuan
                      volume={volume}
                      satuan={satuan}
                      fontSize="xs"
                    />
                  </HStack>
                </Box>
                <Badge
                  colorScheme={
                    group.totalProduksi === volume ? "green" : "orange"
                  }
                  variant="subtle"
                >
                  Total Produksi: {group.totalProduksi}
                </Badge>
              </HStack>

              {group.rows.length === 0 ? (
                <Text fontSize="sm" color="gray.500">
                  Tidak ada data sumur minyak untuk mitra ini
                </Text>
              ) : (
                <Box overflowX="auto">
                  <Table size="sm" variant="simple">
                    <Thead bg="gray.100">
                      <Tr>
                        <Th>No</Th>
                        <Th>Nomor Sumur</Th>
                        <Th>Nama Sumur</Th>
                        <Th isNumeric>Produksi</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {group.rows.map((sumur, idx) => (
                        <Tr key={sumur.id}>
                          <Td>{idx + 1}</Td>
                          <Td>{sumur.nomor || "-"}</Td>
                          <Td>{sumur.nama || "-"}</Td>
                          <Td isNumeric fontWeight="medium">
                            {sumur.produksi != null ? sumur.produksi : "-"}
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              )}
            </Box>
          );
        })}
      </Stack>
    );
  };

  useEffect(() => {
    fetchDataPengisianTanki();
  }, [page]);

  const colSpan = PENGISIAN_TANKI_COL_COUNT + 1;

  const renderAksiButtons = (item, stacked = false) => {
    const isProduksiExpanded = expandedProduksiId === item.id;
    const Wrapper = stacked ? VStack : Flex;
    const wrapperProps = stacked
      ? { align: "stretch", spacing: 2 }
      : { gap: 2, wrap: "wrap" };

    return (
      <Wrapper {...wrapperProps}>
        <Button
          size="sm"
          variant={isProduksiExpanded ? "solid" : "outline"}
          colorScheme="orange"
          onClick={() => toggleProduksiPanel(item)}
        >
          Produksi
        </Button>
        <Button
          size="sm"
          variant="outline"
          colorScheme="blue"
          onClick={() => handleOpenEdit(item)}
        >
          Edit
        </Button>
        {canModifyPengisian(item) && (
          <Button
            size="sm"
            variant="outline"
            colorScheme="red"
            onClick={() => handleOpenDelete(item)}
          >
            Hapus
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          colorScheme="teal"
          isLoading={loadingCetak[item.id]}
          onClick={() => cetakBAST(item)}
        >
          Cetak BAST
        </Button>
      </Wrapper>
    );
  };

  const renderMitraCell = (mitraNames) =>
    mitraNames.length === 0 ? (
      "-"
    ) : (
      <Box>
        {mitraNames.map((nama) => (
          <Text key={nama} fontSize="xs">
            {nama}
          </Text>
        ))}
      </Box>
    );

  const renderPlatCell = (item) =>
    (item.konfirmasiPenerimaans || []).length === 0 ? (
      "-"
    ) : (
      <Box>
        {item.konfirmasiPenerimaans.map((kp) => (
          <Badge key={kp.id} colorScheme="orange" mr={1} mb={1}>
            {kp.nomor || kp.suratJalan?.transportir?.plat || `ID ${kp.id}`}
          </Badge>
        ))}
      </Box>
    );

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
          p={{ base: 4, sm: 5, md: 6, lg: "30px" }}
          my={{ base: 4, md: "30px" }}
        >
          <Flex
            align={{ base: "stretch", md: "center" }}
            direction={{ base: "column", md: "row" }}
            gap={4}
            mb={6}
          >
            <VStack align={{ base: "center", md: "start" }} spacing={1}>
              <Heading
                color="kpbpn"
                size={{ base: "md", md: "lg" }}
                textAlign={{ base: "center", md: "left" }}
              >
                Unloading truck - tanki
              </Heading>
              <Text
                fontSize="sm"
                color="gray.500"
                textAlign={{ base: "center", md: "left" }}
              >
                Total: {totalRows} data
              </Text>
            </VStack>
            <Spacer />
            <Flex
              gap={3}
              wrap="wrap"
              justify={{ base: "center", md: "flex-end" }}
              w={{ base: "full", md: "auto" }}
            >
              <Button
                variant="primary"
                w={{ base: "full", sm: "auto" }}
                onClick={() => history.push("/tanki-kpbpn/tambah-pengisian")}
              >
                + Tambah Unloading
              </Button>
            </Flex>
          </Flex>

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
            ) : dataPengisian.length === 0 ? (
              <Box
                py={10}
                textAlign="center"
                borderRadius="lg"
                border="1px solid"
                borderColor="gray.200"
                bg="white"
              >
                <Text fontSize="lg" color="gray.500">
                  Belum ada data pengisian tanki
                </Text>
              </Box>
            ) : (
              <Stack spacing={4}>
                {dataPengisian.map((item, index) => {
                  const sudahAdaBA = Boolean(item.BABongkarId);
                  const mitraNames = getMitraNamesFromPengisian(item);
                  const isProduksiExpanded = expandedProduksiId === item.id;

                  return (
                    <Box
                      key={item.id}
                      p={4}
                      borderRadius="lg"
                      border="1px solid"
                      borderColor="gray.200"
                      bg={sudahAdaBA ? "gray.50" : "white"}
                      boxShadow="sm"
                    >
                      <HStack justify="space-between" mb={3} align="start">
                        <VStack align="start" spacing={0}>
                          <Text fontSize="xs" color="gray.500">
                            No. {page * limit + index + 1}
                          </Text>
                          <Text fontWeight="bold" color="kpbpn">
                            {item.tanki?.kode || "-"}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            {formatDate(item.tanggal || item.createdAt)}
                          </Text>
                        </VStack>
                        {sudahAdaBA ? (
                          <Badge colorScheme="green">
                            BA #{item.BABongkarId}
                          </Badge>
                        ) : (
                          <Badge colorScheme="gray">Belum BA</Badge>
                        )}
                      </HStack>

                      <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                        <MobileField label="Mitra">
                          {renderMitraCell(mitraNames)}
                        </MobileField>
                        <MobileField label="No. Plat">
                          {renderPlatCell(item)}
                        </MobileField>
                        <MobileField label="Gross">
                          <VolumeMultiSatuan
                            volume={item.gross}
                            satuan={getPengisianSatuanOrDefault(item)}
                          />
                        </MobileField>
                        <MobileField label="Net">
                          <VolumeMultiSatuan
                            volume={item.net}
                            satuan={getPengisianSatuanOrDefault(item)}
                          />
                        </MobileField>
                        <MobileField label="Penampilan Visual">
                          {item.penampilanVisual || "-"}
                        </MobileField>
                        <MobileField label="Warna">
                          {item.warna || "-"}
                        </MobileField>
                        <MobileField label="Kandungan Air">
                          <VolumeMultiSatuan
                            volume={item.kandunganAir}
                            satuan={getPengisianSatuanOrDefault(item)}
                          />
                        </MobileField>
                        <MobileField label="BSW">{item.BSW ?? "-"}</MobileField>
                        <MobileField label="Saksi">
                          {item.saksi || "-"}
                        </MobileField>
                        <MobileField label="Nomor Surat BAST">
                          {item.nomorSurat || (
                            <Badge colorScheme="gray">Belum ada</Badge>
                          )}
                        </MobileField>
                        <MobileField label="Status BA">
                          {sudahAdaBA ? (
                            <Badge colorScheme="green">
                              BA #{item.BABongkarId}
                            </Badge>
                          ) : (
                            <Badge colorScheme="gray">Belum BA</Badge>
                          )}
                        </MobileField>
                      </SimpleGrid>

                      {item.catatan && (
                        <Box mt={3}>
                          <MobileField label="Catatan">
                            {item.catatan}
                          </MobileField>
                        </Box>
                      )}

                      <Box mt={4}>{renderAksiButtons(item)}</Box>

                      <Collapse in={isProduksiExpanded} animateOpacity>
                        <Box
                          mt={4}
                          pt={4}
                          borderTopWidth="1px"
                          borderColor="gray.100"
                        >
                          <Heading size="sm" mb={3} color="kpbpn">
                            Produksi Sumur Minyak
                          </Heading>
                          {renderProduksiPanelContent(item)}
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
                    <Th>No</Th>
                    <Th>Tanggal</Th>
                    <Th>Tangki</Th>
                    <Th>Mitra</Th>
                    <Th>Gross</Th>
                    <Th>Net</Th>
                    <Th>Penampilan Visual</Th>
                    <Th>Warna</Th>
                    <Th>Kandungan Air</Th>
                    <Th>BSW</Th>
                    <Th>Catatan</Th>
                    <Th>Saksi</Th>
                    <Th>No. Plat Kendaraan</Th>
                    <Th>Nomor Surat BAST</Th>
                    <Th>Status BA</Th>
                    <Th>Aksi</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {dataPengisian.length === 0 ? (
                    <Tr>
                      <Td colSpan={colSpan} textAlign="center" py={6}>
                        Belum ada data pengisian tanki
                      </Td>
                    </Tr>
                  ) : (
                    dataPengisian.map((item, index) => {
                      const sudahAdaBA = Boolean(item.BABongkarId);
                      const mitraNames = getMitraNamesFromPengisian(item);
                      const isProduksiExpanded = expandedProduksiId === item.id;

                      return (
                        <React.Fragment key={item.id}>
                          <Tr bg={sudahAdaBA ? "gray.50" : undefined}>
                            <Td>{page * limit + index + 1}</Td>
                            <Td>{formatDate(item.tanggal || item.createdAt)}</Td>
                            <Td>{item.tanki?.kode || "-"}</Td>
                            <Td>{renderMitraCell(mitraNames)}</Td>
                            <Td>
                              <VolumeMultiSatuan
                                volume={item.gross}
                                satuan={getPengisianSatuanOrDefault(item)}
                              />
                            </Td>
                            <Td>
                              <VolumeMultiSatuan
                                volume={item.net}
                                satuan={getPengisianSatuanOrDefault(item)}
                              />
                            </Td>
                            <Td>{item.penampilanVisual || "-"}</Td>
                            <Td>{item.warna || "-"}</Td>
                            <Td>
                              <VolumeMultiSatuan
                                volume={item.kandunganAir}
                                satuan={getPengisianSatuanOrDefault(item)}
                              />
                            </Td>
                            <Td>{item.BSW ?? "-"}</Td>
                            <Td maxW="180px" whiteSpace="normal">
                              {item.catatan || "-"}
                            </Td>
                            <Td>{item.saksi || "-"}</Td>
                            <Td>{renderPlatCell(item)}</Td>
                            <Td>
                              {item.nomorSurat ? (
                                <Text fontSize="xs" whiteSpace="nowrap">
                                  {item.nomorSurat}
                                </Text>
                              ) : (
                                <Badge colorScheme="gray">Belum ada</Badge>
                              )}
                            </Td>
                            <Td>
                              {sudahAdaBA ? (
                                <Badge colorScheme="green">
                                  BA #{item.BABongkarId}
                                </Badge>
                              ) : (
                                <Badge colorScheme="gray">Belum</Badge>
                              )}
                            </Td>
                            <Td>
                              {renderAksiButtons(item, true)}
                            </Td>
                          </Tr>
                          <Tr>
                            <Td colSpan={colSpan} p={0} borderBottom="none">
                              <Collapse in={isProduksiExpanded} animateOpacity>
                                <Box
                                  p={4}
                                  bg="orange.50"
                                  borderTopWidth="1px"
                                  borderColor="gray.200"
                                >
                                  <Heading size="sm" mb={3} color="kpbpn">
                                    Produksi Sumur Minyak
                                  </Heading>
                                  {renderProduksiPanelContent(item)}
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

          {totalRows > 0 && (
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
                {Math.min((page + 1) * limit, totalRows)} dari {totalRows} data
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
            </Flex>
          )}
          </Box>
        </Container>
      </Box>

      <Modal
        isOpen={isEditOpen}
        onClose={handleCloseEdit}
        size={{ base: "full", md: "4xl" }}
        scrollBehavior="inside"
      >
        <ModalOverlay />
        <ModalContent maxW={{ base: "100%", md: "900px" }} mx={{ base: 0, md: 4 }}>
          <ModalHeader px={{ base: 4, md: 6 }} pr={12}>
            Edit Pengisian Tanki
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody px={{ base: 4, md: 6 }}>
            {isLoadingEditForm ? (
              <Center py={10}>
                <Spinner color="kpbpn" />
              </Center>
            ) : (
              <VStack spacing={4} align="stretch">
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Tanggal</FormLabel>
                    <Input
                      name="tanggal"
                      type="date"
                      value={editForm.tanggal}
                      onChange={handleEditFieldChange}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Tangki</FormLabel>
                    <Select
                      name="tangkiId"
                      placeholder="Pilih tangki"
                      value={editForm.tangkiId}
                      onChange={handleEditFieldChange}
                    >
                      {dataTanki.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.kode}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl gridColumn={{ md: "1 / -1" }}>
                    <FormLabel>Nomor Surat BAST</FormLabel>
                    <Input
                      name="nomorSurat"
                      value={editForm.nomorSurat}
                      onChange={handleEditFieldChange}
                      placeholder="Contoh: 25/BAST/KPBPN/PGY-SSE/IX/2026"
                    />
                    <FormHelperText>
                      Nomor surat dapat diubah kapan saja, termasuk setelah BAST
                      tercetak.
                    </FormHelperText>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Gross</FormLabel>
                    <Input
                      name="gross"
                      type="number"
                      value={editForm.gross}
                      onChange={handleEditFieldChange}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Net</FormLabel>
                    <Input
                      name="net"
                      type="number"
                      value={editForm.net}
                      onChange={handleEditFieldChange}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Satuan Volume</FormLabel>
                    <Select
                      name="satuanVolumeId"
                      placeholder="Pilih satuan volume"
                      value={editForm.satuanVolumeId}
                      onChange={handleEditFieldChange}
                    >
                      {dataSatuanVolume.map((sv) => (
                        <option key={sv.id} value={sv.id}>
                          {sv.satuan}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Penampilan Visual</FormLabel>
                    <Input
                      name="penampilanVisual"
                      value={editForm.penampilanVisual}
                      onChange={handleEditFieldChange}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Warna</FormLabel>
                    <Input
                      name="warna"
                      value={editForm.warna}
                      onChange={handleEditFieldChange}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Kandungan Air</FormLabel>
                    <Input
                      name="kandunganAir"
                      type="number"
                      value={editForm.kandunganAir}
                      onChange={handleEditFieldChange}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>BSW</FormLabel>
                    <Input
                      name="BSW"
                      type="number"
                      value={editForm.BSW}
                      onChange={handleEditFieldChange}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Saksi</FormLabel>
                    <Input
                      name="saksi"
                      value={editForm.saksi}
                      onChange={handleEditFieldChange}
                    />
                  </FormControl>
                </SimpleGrid>

                <FormControl>
                  <FormLabel>Catatan</FormLabel>
                  <Textarea
                    name="catatan"
                    value={editForm.catatan}
                    onChange={handleEditFieldChange}
                  />
                </FormControl>

                <Divider />

                <Box>
                  <FormLabel mb={3}>Konfirmasi Penerimaan (opsional)</FormLabel>
                  <Text fontSize="sm" color="gray.500" mb={3}>
                    Konfirmasi yang sudah terhubung ke tanki lain tetap dapat
                    dipilih.
                  </Text>
                  {editKonfirmasiOptions.length === 0 ? (
                    <Text fontSize="sm" color="gray.500">
                      Tidak ada konfirmasi penerimaan tersedia
                    </Text>
                  ) : (
                    <CheckboxGroup
                      value={editForm.ids}
                      onChange={(val) =>
                        setEditForm((prev) => ({ ...prev, ids: val }))
                      }
                    >
                      <Stack spacing={2}>
                        {editKonfirmasiOptions.map((kp) => {
                          const linkedTanki = getLinkedTankiKode(kp);

                          return (
                            <Checkbox
                              key={kp.id}
                              value={String(kp.id)}
                              alignItems="flex-start"
                            >
                              <Box
                                fontSize="sm"
                                whiteSpace="normal"
                                wordBreak="break-word"
                              >
                                {kp.nomor || `Konfirmasi #${kp.id}`}
                                {" — "}
                                {formatDate(kp.tanggal)}
                                {" — "}
                                {kp.suratJalan?.transportir?.plat || "-"}
                                {" — Vol: "}
                                <VolumeMultiSatuan
                                  volume={kp.volume ?? kp.suratJalan?.volume}
                                  satuan={
                                    kp.suratJalan?.satuanVolume?.satuan ||
                                    "Barrel"
                                  }
                                  fontSize="sm"
                                />
                                {linkedTanki.length > 0
                                  ? ` — Tanki: ${linkedTanki.join(", ")}`
                                  : ""}
                              </Box>
                            </Checkbox>
                          );
                        })}
                      </Stack>
                    </CheckboxGroup>
                  )}
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter
            flexDir={{ base: "column-reverse", sm: "row" }}
            gap={2}
            px={{ base: 4, md: 6 }}
          >
            <Button
              variant="outline"
              w={{ base: "full", sm: "auto" }}
              onClick={handleCloseEdit}
            >
              Batal
            </Button>
            <Button
              colorScheme="blue"
              w={{ base: "full", sm: "auto" }}
              onClick={handleSubmitEdit}
              isLoading={isSubmittingEdit}
              isDisabled={isLoadingEditForm}
            >
              Simpan Perubahan
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isDeleteOpen} onClose={handleCloseDelete} isCentered>
        <ModalOverlay />
        <ModalContent mx={4}>
          <ModalHeader pr={12}>Hapus Pengisian Tanki</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              Apakah Anda yakin ingin menghapus data pengisian tanki{" "}
              <Text as="span" fontWeight="bold">
                {deleteTarget?.tanki?.kode || "-"}
              </Text>{" "}
              tanggal{" "}
              <Text as="span" fontWeight="bold">
                {formatDate(deleteTarget?.tanggal || deleteTarget?.createdAt)}
              </Text>
              ?
            </Text>
            <Text fontSize="sm" color="gray.500" mt={2}>
              Tindakan ini tidak dapat dibatalkan.
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
              onClick={handleCloseDelete}
            >
              Batal
            </Button>
            <Button
              colorScheme="red"
              w={{ base: "full", sm: "auto" }}
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

export default PengisianTanki;
