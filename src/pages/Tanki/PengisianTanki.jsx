import React, { useState, useEffect } from "react";
import axios from "axios";
import { useHistory } from "react-router-dom";
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
} from "@chakra-ui/react";
import LayoutKPBPN from "../../Componets/KPBPN/LayoutKPBPN";

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

const formatVolumeLabel = (volume, satuan) => {
  if (volume === null || volume === undefined || volume === "") return "-";
  return satuan ? `${volume} ${satuan}` : String(volume);
};

const getTangkiId = (item) => item.tangkiId ?? item.tanki?.id;

const getTangkiKode = (item) => item.tanki?.kode || "-";

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

const PengisianTanki = () => {
  const history = useHistory();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
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
  const [loadingCetakBA, setLoadingCetakBA] = useState({});
  const [modalPengisianData, setModalPengisianData] = useState([]);
  const [isLoadingModal, setIsLoadingModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [baTanggal, setBaTanggal] = useState(getTodayInputDate());
  const [baUkuranCairan, setBaUkuranCairan] = useState("");
  const [baUkuranAir, setBaUkuranAir] = useState("");
  const [isSubmittingBA, setIsSubmittingBA] = useState(false);
  const [page, setPage] = useState(0);
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
  const limit = 50;

  const fetchDataPengisianTanki = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE}/tanki/get?page=${page}&limit=${limit}`,
      );
      setDataPengisian(res.data.result || []);
      setTotalRows(res.data.totalRows || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEligiblePengisianForBA = async () => {
    setIsLoadingModal(true);
    try {
      const res = await axios.get(`${API_BASE}/tanki/get?page=0&limit=1000`);
      const eligible = (res.data.result || []).filter(
        (item) => !item.BAPenerimaanId,
      );
      setModalPengisianData(eligible);
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
    setBaUkuranCairan("");
    setBaUkuranAir("");
    setModalPengisianData([]);
  };

  const handleCloseModalBA = () => {
    onClose();
    resetModalBA();
  };

  const handleOpenModalBA = async () => {
    resetModalBA();
    onOpen();
    const eligible = await fetchEligiblePengisianForBA();

    if (!eligible.length) {
      toast({
        title: "Tidak ada data",
        description:
          "Semua pengisian tanki sudah memiliki BA Penerimaan atau belum ada data",
        status: "info",
        duration: 4000,
        isClosable: true,
      });
    }
  };

  const canModifyPengisian = (item) => !item.BAPenerimaanId && !item.nomorSurat;

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
    if (!canModifyPengisian(item)) {
      toast({
        title: "Tidak dapat diubah",
        description:
          "Data yang sudah memiliki BA Penerimaan atau nomor surat BAST tidak dapat diubah",
        status: "warning",
        duration: 4000,
        isClosable: true,
      });
      return;
    }

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
    setEditForm((prev) => ({ ...prev, [name]: value }));
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
          "Data yang sudah memiliki BA Penerimaan atau nomor surat BAST tidak dapat dihapus",
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

  const toggleSelectModalItem = (item) => {
    setSelectedIds((prev) =>
      prev.includes(item.id)
        ? prev.filter((id) => id !== item.id)
        : [...prev, item.id],
    );
  };

  const tangkiGroups = groupPengisianByTangki(modalPengisianData);
  const selectedTangkiCount = new Set(
    modalPengisianData
      .filter((item) => selectedIds.includes(item.id))
      .map((item) => getTangkiId(item)),
  ).size;

  const handleSubmitBAPenerimaan = async () => {
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

    if (!baTanggal) {
      toast({
        title: "Tanggal wajib diisi",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmittingBA(true);
    try {
      const res = await axios.post(
        `${API_BASE}/tanki/post/ba-penerimaan`,
        {
          tanggal: baTanggal,
          ukuranCairan: baUkuranCairan !== "" ? Number(baUkuranCairan) : null,
          ukuranAir: baUkuranAir !== "" ? Number(baUkuranAir) : null,
          ids: selectedIds,
        },
        { responseType: "blob" },
      );

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `BA_Penerimaan_${baTanggal}_${Date.now()}.docx`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Berhasil",
        description: "BA Penerimaan berhasil dibuat dan diunduh",
        status: "success",
        duration: 4000,
        isClosable: true,
      });

      handleCloseModalBA();
      fetchDataPengisianTanki();
    } catch (err) {
      console.error(err);
      let message = "Gagal membuat BA Penerimaan";
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
      setIsSubmittingBA(false);
    }
  };

  const cetakUlangBAPenerimaan = async (item) => {
    const baId = item.BAPenerimaanId;
    if (!baId) return;

    setLoadingCetakBA((prev) => ({ ...prev, [baId]: true }));

    try {
      const res = await axios.post(
        `${API_BASE}/tanki/cetak/ba-penerimaan`,
        { BAPenerimaanId: baId },
        { responseType: "blob" },
      );

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `BA_Penerimaan_${baId}_${Date.now()}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Berhasil",
        description: "Dokumen BA Penerimaan berhasil diunduh",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error(err);
      let message = "Gagal mencetak ulang BA Penerimaan";
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

  useEffect(() => {
    fetchDataPengisianTanki();
  }, [page]);

  const colSpan = 18;

  return (
    <LayoutKPBPN>
      <Box bgColor="secondary" pb="40px" px="30px" minH="90vh">
        <Container variant="primary" p="30px" my="30px" minW="2000px">
          <HStack justify="space-between" mb={6}>
            <Heading color="kpbpn">Unloading truck - tanki </Heading>
            <HStack spacing={3}>
              <Text fontSize="sm" color="gray.500">
                Total: {totalRows} data
              </Text>
              <Button
                variant="outline"
                colorScheme="orange"
                onClick={handleOpenModalBA}
              >
                Buat BA Bongkar
              </Button>
              <Button
                variant="primary"
                onClick={() => history.push("/tanki-kpbpn/tambah-pengisian")}
              >
                + Tambah Unloading
              </Button>
            </HStack>
          </HStack>

          {isLoading ? (
            <Center py={10}>
              <Spinner size="lg" color="kpbpn" />
            </Center>
          ) : (
            <Box overflowX="auto" borderWidth="1px" borderRadius="lg">
              <Table size="sm">
                <Thead bg="gray.50">
                  <Tr>
                    <Th>No</Th>
                    <Th>Tanggal</Th>
                    <Th>Tangki</Th>
                    <Th>Flow Meter</Th>
                    <Th>Gross</Th>
                    <Th>Net</Th>
                    <Th>Penampilan Visual</Th>
                    <Th>Warna</Th>
                    <Th>Kandungan Air</Th>
                    <Th>BSW</Th>
                    <Th>Ukuran Cairan</Th>
                    <Th>Ukuran Air</Th>
                    <Th>Catatan</Th>
                    <Th>Saksi</Th>
                    <Th>No. Plat Kendaraan</Th>
                    <Th>Nomor Surat BAST</Th>
                    <Th>BA Bongkar</Th>
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
                      const sudahAdaBA = Boolean(item.BAPenerimaanId);

                      return (
                        <Tr
                          key={item.id}
                          bg={sudahAdaBA ? "gray.50" : undefined}
                        >
                          <Td>{page * limit + index + 1}</Td>
                          <Td>{formatDate(item.tanggal || item.createdAt)}</Td>
                          <Td>{item.tanki?.kode || "-"}</Td>
                          <Td>{item.flowMeter ?? "-"}</Td>
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
                          <Td>{item.BAPenerimaan?.ukuranCairan ?? "-"}</Td>
                          <Td>{item.BAPenerimaan?.ukuranAir ?? "-"}</Td>
                          <Td>{item.catatan || "-"}</Td>
                          <Td>{item.saksi || "-"}</Td>
                          <Td>
                            {(item.konfirmasiPenerimaans || []).length === 0 ? (
                              "-"
                            ) : (
                              <Box>
                                {item.konfirmasiPenerimaans.map((kp) => (
                                  <Badge
                                    key={kp.id}
                                    colorScheme="orange"
                                    mr={1}
                                    mb={1}
                                  >
                                    {kp.nomor ||
                                      kp.suratJalan?.transportir?.plat ||
                                      `ID ${kp.id}`}
                                  </Badge>
                                ))}
                              </Box>
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
                          <Td>
                            {sudahAdaBA ? (
                              <Badge colorScheme="green">
                                BA #{item.BAPenerimaanId}
                              </Badge>
                            ) : (
                              <Badge colorScheme="gray">Belum</Badge>
                            )}
                          </Td>
                          <Td>
                            <VStack align="stretch" spacing={2}>
                              {canModifyPengisian(item) && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    colorScheme="blue"
                                    onClick={() => handleOpenEdit(item)}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    colorScheme="red"
                                    onClick={() => handleOpenDelete(item)}
                                  >
                                    Hapus
                                  </Button>
                                </>
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
                              {sudahAdaBA && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  colorScheme="orange"
                                  isLoading={
                                    loadingCetakBA[item.BAPenerimaanId]
                                  }
                                  onClick={() => cetakUlangBAPenerimaan(item)}
                                >
                                  Cetak Ulang BA
                                </Button>
                              )}
                            </VStack>
                          </Td>
                        </Tr>
                      );
                    })
                  )}
                </Tbody>
              </Table>
            </Box>
          )}
        </Container>
      </Box>

      <Modal
        isOpen={isOpen}
        onClose={handleCloseModalBA}
        size="4xl"
        scrollBehavior="inside"
      >
        <ModalOverlay />
        <ModalContent maxW="1100px">
          <ModalHeader>Buat BA Penerimaan</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={5} align="stretch">
              <Text fontSize="sm" color="gray.600">
                Centang pengisian dari satu atau lebih tanki. Setiap tanki akan
                menjadi satu baris terpisah dalam dokumen BA Bongkar.
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
                    Tidak ada pengisian tanki yang belum memiliki BA Penerimaan
                  </Text>
                </Center>
              ) : (
                <>
                  <VStack spacing={4} align="stretch" maxH="420px" overflowY="auto">
                    {tangkiGroups.map((group) => {
                      const selectedInGroup = group.items.filter((item) =>
                        selectedIds.includes(item.id),
                      ).length;

                      return (
                        <Box
                          key={group.tangkiId}
                          borderWidth="1px"
                          borderRadius="md"
                          p={3}
                        >
                          <HStack justify="space-between" mb={2}>
                            <Text fontWeight="semibold" fontSize="sm">
                              Tanki {group.kode}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              {selectedInGroup}/{group.items.length} terpilih
                            </Text>
                          </HStack>
                          <Box overflowX="auto">
                            <Table size="sm">
                              <Thead bg="gray.50">
                                <Tr>
                                  <Th w="40px" />
                                  <Th>Tanggal</Th>
                                  <Th>Flow Meter</Th>
                                  <Th>Gross</Th>
                                  <Th>Net</Th>
                                  <Th>Nomor Surat BAST</Th>
                                </Tr>
                              </Thead>
                              <Tbody>
                                {group.items.map((item) => {
                                  const isSelected = selectedIds.includes(
                                    item.id,
                                  );

                                  return (
                                    <Tr
                                      key={item.id}
                                      bg={isSelected ? "orange.50" : undefined}
                                    >
                                      <Td>
                                        <Checkbox
                                          isChecked={isSelected}
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
                                      <Td>{item.flowMeter ?? "-"}</Td>
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
                </>
              )}

              <Divider />

              <FormControl isRequired>
                <FormLabel>Tanggal BA Penerimaan</FormLabel>
                <Input
                  type="date"
                  value={baTanggal}
                  onChange={(e) => setBaTanggal(e.target.value)}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Ukuran Cairan</FormLabel>
                <Input
                  type="number"
                  min={0}
                  value={baUkuranCairan}
                  onChange={(e) => setBaUkuranCairan(e.target.value)}
                  placeholder="Masukkan ukuran cairan"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Ukuran Air</FormLabel>
                <Input
                  type="number"
                  min={0}
                  value={baUkuranAir}
                  onChange={(e) => setBaUkuranAir(e.target.value)}
                  placeholder="Masukkan ukuran air"
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={handleCloseModalBA}>
              Batal
            </Button>
            <Button
              colorScheme="orange"
              onClick={handleSubmitBAPenerimaan}
              isLoading={isSubmittingBA}
              isDisabled={isLoadingModal || !tangkiGroups.length}
            >
              Simpan
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isEditOpen}
        onClose={handleCloseEdit}
        size="4xl"
        scrollBehavior="inside"
      >
        <ModalOverlay />
        <ModalContent maxW="900px">
          <ModalHeader>Edit Pengisian Tanki</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
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
                        {editKonfirmasiOptions.map((kp) => (
                          <Checkbox key={kp.id} value={String(kp.id)}>
                            {kp.nomor || `Konfirmasi #${kp.id}`}
                            {" — "}
                            {formatDate(kp.tanggal)}
                            {" — "}
                            {kp.suratJalan?.transportir?.plat || "-"}
                            {" — Vol: "}
                            {formatVolumeLabel(
                              kp.volume ?? kp.suratJalan?.volume,
                              kp.suratJalan?.satuanVolume?.satuan,
                            )}
                          </Checkbox>
                        ))}
                      </Stack>
                    </CheckboxGroup>
                  )}
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={handleCloseEdit}>
              Batal
            </Button>
            <Button
              colorScheme="blue"
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
        <ModalContent>
          <ModalHeader>Hapus Pengisian Tanki</ModalHeader>
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
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={handleCloseDelete}>
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

export default PengisianTanki;
