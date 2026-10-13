import React, { useState, useEffect, useRef } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import axios from "axios";
import ReactPaginate from "react-paginate";
import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  Input,
  Text,
  VStack,
  useToast,
  FormLabel,
  Select,
  Thead,
  Table,
  Tr,
  Th,
  Td,
  Tbody,
  Heading,
  HStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  Image,
  Badge,
  useDisclosure,
  IconButton,
  Flex,
  Spinner,
  Center,
} from "@chakra-ui/react";
import { BsTrash, BsEyeFill, BsQrCode } from "react-icons/bs";
import { Link as RouterLink } from "react-router-dom";
import { useSelector } from "react-redux";
import LayoutKPBPN from "../../Componets/KPBPN/LayoutKPBPN";
import {
  selectIsKpbpnAdmin,
  selectMitra,
  selectScopedMitraId,
} from "../../Redux/Reducers/auth";
import {
  downloadObjectUrl,
  fetchSumurQrCode,
  parseQrError,
} from "../../lib/qrCodeSumur";
import FotoPlaceholder from "../../assets/add_photo.png";
import "../../Style/pagination.css";

const API_BASE = import.meta.env.VITE_REACT_APP_API_BASE_URL;

const getImageUrl = (path) => (path ? `${API_BASE}${path}` : null);

const STATUS_VERIFIKASI = [
  { value: "belum", label: "Belum" },
  { value: "sudah", label: "Sudah" },
  { value: "tidak", label: "Tidak" },
];

const statusBadgeColor = {
  sudah: "green",
  belum: "yellow",
  tidak: "red",
};

const FileUploadField = ({ label, preview, onChange, error, touched }) => {
  const inputRef = useRef(null);

  return (
    <FormControl isInvalid={touched && error}>
      <FormLabel>{label}</FormLabel>
      <Input
        ref={inputRef}
        type="file"
        accept="image/png, image/jpeg, image/jpg"
        display="none"
        onChange={(e) => {
          const file = e.target.files?.[0] || null;
          onChange(file);
        }}
      />
      <Image
        src={preview || FotoPlaceholder}
        alt={label}
        w="100%"
        maxH="200px"
        objectFit="cover"
        borderRadius="md"
        border="1px solid"
        borderColor="gray.200"
        mb={2}
        cursor="pointer"
        onClick={() => inputRef.current?.click()}
      />
      <Button
        variant="secondary"
        w="100%"
        size="sm"
        onClick={() => inputRef.current?.click()}
      >
        Pilih Gambar
      </Button>
      <FormErrorMessage>{error}</FormErrorMessage>
    </FormControl>
  );
};

const createSchema = Yup.object({
  nama: Yup.string().required("Nama sumur wajib diisi"),
  mitraId: Yup.string().required("Mitra wajib dipilih"),
  nomor: Yup.string().nullable(),
  statusVerifikasi: Yup.string()
    .oneOf(["sudah", "belum", "tidak"])
    .required("Status verifikasi wajib dipilih"),
  tanggalVerifikasi: Yup.string().nullable(),
  longitude: Yup.number().typeError("Longitude harus angka").nullable(),
  latitude: Yup.number().typeError("Latitude harus angka").nullable(),
  alamat: Yup.string().nullable(),
  produksiHarian: Yup.number()
    .typeError("Produksi harus angka")
    .min(0, "Produksi tidak boleh negatif")
    .nullable(),
  pic: Yup.mixed().required("Foto sumur wajib diunggah"),
});

const formatTanggal = (d) =>
  d
    ? new Date(d).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "-";

const displayValue = (value) =>
  value === null || value === undefined || value === "" ? "-" : String(value);

const toDateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const PRESERVED_KEYS = [
  "area",
  "operasional",
  "lingkungan",
  "penyaluran",
  "statusKepemilikan",
  "tingkatProduksi",
  "namaPemilikLahan",
  "namaPemilikSumur",
  "kontakPemilikLahan",
  "kontakPemilikSumur",
];

const COMPARE_KEYS = [
  "nama",
  "mitraId",
  "nomor",
  "statusVerifikasi",
  "tanggalVerifikasi",
  "longitude",
  "latitude",
  "alamat",
  "produksiHarian",
];

const draftFromSumur = (sumur) => ({
  nama: sumur?.nama ?? "",
  mitraId: sumur?.mitraId != null ? String(sumur.mitraId) : "",
  nomor: sumur?.nomor ?? "",
  statusVerifikasi: sumur?.statusVerifikasi ?? "belum",
  tanggalVerifikasi: toDateInput(sumur?.tanggalVerifikasi),
  longitude: sumur?.longitude != null ? String(sumur.longitude) : "",
  latitude: sumur?.latitude != null ? String(sumur.latitude) : "",
  alamat: sumur?.alamat ?? "",
  produksiHarian:
    sumur?.produksiHarian != null ? String(sumur.produksiHarian) : "",
  pic: null,
  picPreview: null,
});

const isSumurChanged = (item, draft) => {
  if (!draft) return false;
  if (draft.pic) return true;
  const original = draftFromSumur(item);
  return COMPARE_KEYS.some(
    (key) => String(original[key] ?? "") !== String(draft[key] ?? ""),
  );
};

const validateDraft = (item, draft) => {
  const label = String(draft?.nama || "").trim() || item?.nama || `ID ${item?.id}`;
  if (!String(draft?.nama || "").trim()) {
    return `Nama sumur wajib diisi (${label})`;
  }
  if (!draft?.mitraId) {
    return `Mitra wajib dipilih untuk ${label}`;
  }
  if (!["sudah", "belum", "tidak"].includes(draft?.statusVerifikasi)) {
    return `Status verifikasi tidak valid untuk ${label}`;
  }
  if (draft.longitude !== "" && Number.isNaN(Number(draft.longitude))) {
    return `Longitude harus angka untuk ${label}`;
  }
  if (draft.latitude !== "" && Number.isNaN(Number(draft.latitude))) {
    return `Latitude harus angka untuk ${label}`;
  }
  if (draft.produksiHarian !== "") {
    const produksi = Number(draft.produksiHarian);
    if (Number.isNaN(produksi)) {
      return `Produksi harian harus angka untuk ${label}`;
    }
    if (produksi < 0) {
      return `Produksi harian tidak boleh negatif untuk ${label}`;
    }
  }
  return null;
};

const revokeDraftPreviews = (draftMap) => {
  Object.values(draftMap || {}).forEach((draft) => {
    if (draft?.picPreview?.startsWith("blob:")) {
      window.URL.revokeObjectURL(draft.picPreview);
    }
  });
};

function AdminSumurMinyak() {
  const toast = useToast();
  const dataListRef = useRef(null);
  const isKpbpnAdmin = useSelector(selectIsKpbpnAdmin);
  const mitra = useSelector(selectMitra);
  const scopedMitraId = useSelector(selectScopedMitraId);

  const [dataSumur, setDataSumur] = useState([]);
  const [dataMitra, setDataMitra] = useState([]);
  const [page, setPage] = useState(0);
  const [limit] = useState(20);
  const [pages, setPages] = useState(0);
  const [rows, setRows] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const [mitraFilterId, setMitraFilterId] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [previewFoto, setPreviewFoto] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [drafts, setDrafts] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loadingQr, setLoadingQr] = useState({});
  const [qrPreview, setQrPreview] = useState(null);

  const {
    isOpen: isFormOpen,
    onOpen: onFormOpen,
    onClose: onFormClose,
  } = useDisclosure();
  const {
    isOpen: isPreviewOpen,
    onOpen: onPreviewOpen,
    onClose: onPreviewClose,
  } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
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
    if (isEditing) return;
    setPage(selected);
    scrollToDataList();
  };

  const fetchDataMitra = async () => {
    try {
      const res = await axios.get(`${API_BASE}/mitra/get`);
      setDataMitra(res.data.resultMitra || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDataSumur = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/sumur-minyak/get`, {
        params: {
          page,
          limit,
          mitraId: scopedMitraId || mitraFilterId || undefined,
          statusVerifikasi: statusFilter || undefined,
          search: search || undefined,
        },
      });
      setDataSumur(res.data.result || []);
      setPage(res.data.page ?? page);
      setPages(res.data.totalPage || 0);
      setRows(res.data.totalRows || 0);
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
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDataMitra();
  }, []);

  useEffect(() => {
    if (isEditing) return;
    fetchDataSumur();
  }, [page, limit, mitraFilterId, statusFilter, search, scopedMitraId]);

  const showSuccess = (message) => {
    toast({
      title: "Berhasil",
      description: message,
      status: "success",
      duration: 4000,
      isClosable: true,
    });
    fetchDataSumur();
  };

  const showError = (err) => {
    toast({
      title: "Gagal",
      description: err.response?.data?.error || err.message,
      status: "error",
      duration: 4000,
      isClosable: true,
    });
  };

  const showPreview = (path) => {
    setPreviewFoto(getImageUrl(path));
    onPreviewOpen();
  };

  const openAddSumur = () => {
    if (isEditing) return;
    onFormOpen();
  };

  const closeFormModal = () => {
    onFormClose();
  };

  const startEdit = () => {
    const next = {};
    dataSumur.forEach((item) => {
      next[item.id] = draftFromSumur(item);
    });
    setDrafts(next);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    revokeDraftPreviews(drafts);
    setDrafts({});
    setIsEditing(false);
  };

  const updateDraft = (id, key, value) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [key]: value,
      },
    }));
  };

  const updateDraftFoto = (item, file) => {
    setDrafts((prev) => {
      const current = prev[item.id] || draftFromSumur(item);
      if (current.picPreview?.startsWith("blob:")) {
        window.URL.revokeObjectURL(current.picPreview);
      }
      return {
        ...prev,
        [item.id]: {
          ...current,
          pic: file,
          picPreview: file ? URL.createObjectURL(file) : null,
        },
      };
    });
  };

  const handleSaveAll = async () => {
    const changed = dataSumur.filter((item) =>
      isSumurChanged(item, drafts[item.id]),
    );

    if (!changed.length) {
      toast({
        title: "Tidak ada perubahan",
        status: "info",
        duration: 2500,
        isClosable: true,
      });
      cancelEdit();
      return;
    }

    for (const item of changed) {
      const error = validateDraft(item, drafts[item.id]);
      if (error) {
        toast({
          title: "Data belum lengkap",
          description: error,
          status: "warning",
          duration: 4000,
          isClosable: true,
        });
        return;
      }
    }

    setIsSaving(true);
    try {
      await Promise.all(
        changed.map((item) => {
          const draft = drafts[item.id];
          const formData = new FormData();
          formData.append("nama", draft.nama.trim());
          formData.append("mitraId", draft.mitraId);
          formData.append("nomor", draft.nomor || "");
          formData.append("statusVerifikasi", draft.statusVerifikasi);
          if (draft.tanggalVerifikasi) {
            formData.append("tanggalVerifikasi", draft.tanggalVerifikasi);
          }
          if (draft.longitude !== "") {
            formData.append("longitude", draft.longitude);
          }
          if (draft.latitude !== "") {
            formData.append("latitude", draft.latitude);
          }
          formData.append("alamat", draft.alamat || "");
          if (draft.produksiHarian !== "") {
            formData.append("produksiHarian", draft.produksiHarian);
          }
          PRESERVED_KEYS.forEach((key) => {
            const value = item[key];
            if (value !== null && value !== undefined && value !== "") {
              formData.append(key, value);
            }
          });
          if (draft.pic) formData.append("pic", draft.pic);

          return axios.post(
            `${API_BASE}/sumur-minyak/edit/${item.id}`,
            formData,
            { headers: { "Content-Type": "multipart/form-data" } },
          );
        }),
      );
      toast({
        title: "Data sumur minyak berhasil disimpan",
        description: `${changed.length} data diperbarui`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      revokeDraftPreviews(drafts);
      setIsEditing(false);
      setDrafts({});
      await fetchDataSumur();
    } catch (err) {
      toast({
        title: "Gagal menyimpan data sumur",
        description: err.response?.data?.error || err.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const openDeleteConfirm = (item) => {
    setDeleteTarget(item);
    onDeleteOpen();
  };

  const closeDeleteModal = () => {
    setDeleteTarget(null);
    onDeleteClose();
  };

  const closeQrModal = () => {
    if (qrPreview?.objectUrl?.startsWith("blob:")) {
      window.URL.revokeObjectURL(qrPreview.objectUrl);
    }
    setQrPreview(null);
    onQrClose();
  };

  const generateQrCode = async (item) => {
    if (!item?.id) return;
    setLoadingQr((prev) => ({ ...prev, [item.id]: true }));
    try {
      const fallbackName = `QR_Sumur_${item.nama || item.id}.png`;
      const result = await fetchSumurQrCode(API_BASE, item.id, fallbackName);
      if (qrPreview?.objectUrl?.startsWith("blob:")) {
        window.URL.revokeObjectURL(qrPreview.objectUrl);
      }
      setQrPreview({
        ...result,
        nama: item.nama,
        nomor: item.nomor,
        id: item.id,
      });
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
      setLoadingQr((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      await axios.post(`${API_BASE}/sumur-minyak/delete/${deleteTarget.id}`);
      showSuccess("Sumur minyak berhasil dihapus");
      closeDeleteModal();
    } catch (err) {
      showError(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFilter = () => {
    if (isEditing) return;
    setPage(0);
    setSearch(searchInput.trim());
  };

  const resetFilter = () => {
    if (isEditing) return;
    setMitraFilterId("");
    setStatusFilter("");
    setSearchInput("");
    setSearch("");
    setPage(0);
  };

  return (
    <LayoutKPBPN>
      <Box bgColor="secondary" pt="30px" pb="40px" px="30px" minH="90vh">
          <HStack justify="space-between" mb={6} align="center">
            <Heading color="kpbpn">Data Sumur Minyak</Heading>
            <HStack spacing={3}>
              {isEditing ? (
                <>
                  <Button
                    variant="ghost"
                    onClick={cancelEdit}
                    isDisabled={isSaving}
                  >
                    Batal
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSaveAll}
                    isLoading={isSaving}
                  >
                    Simpan
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="primary"
                    onClick={startEdit}
                    isDisabled={isLoading || dataSumur.length === 0}
                  >
                    Edit
                  </Button>
                  <Button variant="primary" onClick={openAddSumur}>
                    + Tambah Sumur Minyak
                  </Button>
                </>
              )}
            </HStack>
          </HStack>

          <Box
            mb={6}
            p={4}
            borderWidth="1px"
            borderRadius="lg"
            bg="gray.50"
          >
            <HStack spacing={4} flexWrap="wrap" align="flex-end">
              {isKpbpnAdmin && (
              <FormControl maxW="220px">
                <FormLabel fontSize="sm">Mitra</FormLabel>
                <Select
                  placeholder="Semua mitra"
                  value={mitraFilterId}
                  isDisabled={isEditing}
                  onChange={(e) => {
                    setMitraFilterId(e.target.value);
                    setPage(0);
                  }}
                >
                  {dataMitra.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nama}
                    </option>
                  ))}
                </Select>
              </FormControl>
              )}

              <FormControl maxW="180px">
                <FormLabel fontSize="sm">Status Verifikasi</FormLabel>
                <Select
                  placeholder="Semua status"
                  value={statusFilter}
                  isDisabled={isEditing}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(0);
                  }}
                >
                  {STATUS_VERIFIKASI.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl maxW="260px">
                <FormLabel fontSize="sm">Cari</FormLabel>
                <Input
                  placeholder="Nama, nomor, atau alamat..."
                  value={searchInput}
                  isDisabled={isEditing}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleFilter()}
                />
              </FormControl>

              <Button
                variant="primary"
                onClick={handleFilter}
                isDisabled={isEditing}
              >
                Terapkan
              </Button>
              <Button variant="ghost" onClick={resetFilter} isDisabled={isEditing}>
                Reset
              </Button>
            </HStack>
          </Box>

          <Box ref={dataListRef}>
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
                      <Th>Nama</Th>
                      <Th>Nomor</Th>
                      <Th>Mitra</Th>
                      <Th>Alamat</Th>
                      <Th>Produksi Harian</Th>
                      <Th>Longitude</Th>
                      <Th>Latitude</Th>
                      <Th>Status</Th>
                      <Th>Tgl Verifikasi</Th>
                      <Th>Foto</Th>
                      <Th>Aksi</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {dataSumur.length === 0 ? (
                      <Tr>
                        <Td colSpan={12} textAlign="center" py={6}>
                          Belum ada data sumur minyak
                        </Td>
                      </Tr>
                    ) : (
                      dataSumur.map((item, index) => {
                        const draft = drafts[item.id];
                        return (
                        <Tr key={item.id}>
                          <Td>{page * limit + index + 1}</Td>
                          <Td fontWeight="medium" minW={isEditing ? "160px" : undefined}>
                            {isEditing ? (
                              <Input
                                size="sm"
                                bg="white"
                                value={draft?.nama ?? ""}
                                onChange={(e) =>
                                  updateDraft(item.id, "nama", e.target.value)
                                }
                              />
                            ) : (
                              displayValue(item.nama)
                            )}
                          </Td>
                          <Td minW={isEditing ? "120px" : undefined}>
                            {isEditing ? (
                              <Input
                                size="sm"
                                bg="white"
                                value={draft?.nomor ?? ""}
                                onChange={(e) =>
                                  updateDraft(item.id, "nomor", e.target.value)
                                }
                              />
                            ) : (
                              displayValue(item.nomor)
                            )}
                          </Td>
                          <Td minW={isEditing ? "160px" : undefined}>
                            {isEditing && isKpbpnAdmin ? (
                              <Select
                                size="sm"
                                bg="white"
                                value={draft?.mitraId ?? ""}
                                onChange={(e) =>
                                  updateDraft(item.id, "mitraId", e.target.value)
                                }
                              >
                                <option value="">Pilih mitra</option>
                                {dataMitra.map((m) => (
                                  <option key={m.id} value={m.id}>
                                    {m.nama}
                                  </option>
                                ))}
                              </Select>
                            ) : (
                              item.mitra?.nama || "-"
                            )}
                          </Td>
                          <Td
                            maxW={isEditing ? undefined : "200px"}
                            minW={isEditing ? "180px" : undefined}
                            isTruncated={!isEditing}
                            title={item.alamat}
                          >
                            {isEditing ? (
                              <Input
                                size="sm"
                                bg="white"
                                value={draft?.alamat ?? ""}
                                onChange={(e) =>
                                  updateDraft(item.id, "alamat", e.target.value)
                                }
                              />
                            ) : (
                              displayValue(item.alamat)
                            )}
                          </Td>
                          <Td minW={isEditing ? "120px" : undefined}>
                            {isEditing ? (
                              <Input
                                type="number"
                                step="any"
                                size="sm"
                                bg="white"
                                value={draft?.produksiHarian ?? ""}
                                onChange={(e) =>
                                  updateDraft(
                                    item.id,
                                    "produksiHarian",
                                    e.target.value,
                                  )
                                }
                              />
                            ) : (
                              displayValue(item.produksiHarian)
                            )}
                          </Td>
                          <Td minW={isEditing ? "130px" : undefined}>
                            {isEditing ? (
                              <Input
                                type="number"
                                step="any"
                                size="sm"
                                bg="white"
                                value={draft?.longitude ?? ""}
                                onChange={(e) =>
                                  updateDraft(item.id, "longitude", e.target.value)
                                }
                              />
                            ) : (
                              displayValue(item.longitude)
                            )}
                          </Td>
                          <Td minW={isEditing ? "130px" : undefined}>
                            {isEditing ? (
                              <Input
                                type="number"
                                step="any"
                                size="sm"
                                bg="white"
                                value={draft?.latitude ?? ""}
                                onChange={(e) =>
                                  updateDraft(item.id, "latitude", e.target.value)
                                }
                              />
                            ) : (
                              displayValue(item.latitude)
                            )}
                          </Td>
                          <Td minW={isEditing ? "130px" : undefined}>
                            {isEditing ? (
                              <Select
                                size="sm"
                                bg="white"
                                value={draft?.statusVerifikasi ?? "belum"}
                                onChange={(e) =>
                                  updateDraft(
                                    item.id,
                                    "statusVerifikasi",
                                    e.target.value,
                                  )
                                }
                              >
                                {STATUS_VERIFIKASI.map((s) => (
                                  <option key={s.value} value={s.value}>
                                    {s.label}
                                  </option>
                                ))}
                              </Select>
                            ) : (
                              <Badge
                                colorScheme={
                                  statusBadgeColor[item.statusVerifikasi] ||
                                  "gray"
                                }
                                variant="subtle"
                                textTransform="capitalize"
                              >
                                {item.statusVerifikasi || "-"}
                              </Badge>
                            )}
                          </Td>
                          <Td minW={isEditing ? "150px" : undefined}>
                            {isEditing ? (
                              <Input
                                type="date"
                                size="sm"
                                bg="white"
                                value={draft?.tanggalVerifikasi ?? ""}
                                onChange={(e) =>
                                  updateDraft(
                                    item.id,
                                    "tanggalVerifikasi",
                                    e.target.value,
                                  )
                                }
                              />
                            ) : (
                              formatTanggal(item.tanggalVerifikasi)
                            )}
                          </Td>
                          <Td minW={isEditing ? "160px" : undefined}>
                            {isEditing ? (
                              <HStack spacing={2} align="center">
                                {(draft?.picPreview || item.foto) && (
                                  <Image
                                    src={
                                      draft?.picPreview || getImageUrl(item.foto)
                                    }
                                    alt={item.nama}
                                    boxSize="40px"
                                    objectFit="cover"
                                    borderRadius="md"
                                  />
                                )}
                                <Input
                                  type="file"
                                  accept="image/png, image/jpeg, image/jpg"
                                  size="sm"
                                  p={1}
                                  bg="white"
                                  maxW="140px"
                                  onChange={(e) =>
                                    updateDraftFoto(
                                      item,
                                      e.target.files?.[0] || null,
                                    )
                                  }
                                />
                              </HStack>
                            ) : item.foto ? (
                              <Image
                                src={getImageUrl(item.foto)}
                                alt={item.nama}
                                boxSize="50px"
                                objectFit="cover"
                                borderRadius="md"
                                cursor="pointer"
                                onClick={() => showPreview(item.foto)}
                              />
                            ) : (
                              "-"
                            )}
                          </Td>
                          <Td>
                            <HStack spacing={1}>
                              <IconButton
                                as={isEditing ? undefined : RouterLink}
                                to={
                                  isEditing
                                    ? undefined
                                    : `/sumur/produksi-sumur/${item.id}`
                                }
                                aria-label="Detail produksi sumur"
                                icon={<BsEyeFill />}
                                size="sm"
                                variant="ghost"
                                colorScheme="teal"
                                isDisabled={isEditing}
                              />
                              <IconButton
                                aria-label="Generate QR Code"
                                icon={<BsQrCode />}
                                size="sm"
                                variant="ghost"
                                colorScheme="purple"
                                isLoading={!!loadingQr[item.id]}
                                isDisabled={isEditing}
                                onClick={() => generateQrCode(item)}
                              />
                              <IconButton
                                aria-label="Hapus sumur minyak"
                                icon={<BsTrash />}
                                size="sm"
                                variant="ghost"
                                colorScheme="red"
                                isDisabled={isEditing}
                                onClick={() => openDeleteConfirm(item)}
                              />
                            </HStack>
                          </Td>
                        </Tr>
                        );
                      })
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
                <Box
                  overflowX="auto"
                  py={1}
                  pointerEvents={isEditing ? "none" : "auto"}
                  opacity={isEditing ? 0.5 : 1}
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
                    pageRangeDisplayed={3}
                    previousClassName="item previous"
                  />
                </Box>
              )}
            </Flex>
          )}
      </Box>

      <Modal isOpen={isFormOpen} onClose={closeFormModal} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Tambah Sumur Minyak</ModalHeader>
          <ModalCloseButton />
          <Formik
            enableReinitialize
            initialValues={{
              nama: "",
              mitraId: scopedMitraId ? String(scopedMitraId) : "",
              nomor: "",
              statusVerifikasi: "belum",
              tanggalVerifikasi: "",
              longitude: "",
              latitude: "",
              alamat: "",
              produksiHarian: "",
              pic: null,
              picPreview: null,
            }}
            validationSchema={createSchema}
            onSubmit={async (values, { setSubmitting, resetForm }) => {
              try {
                const formData = new FormData();
                formData.append("nama", values.nama);
                formData.append("mitraId", values.mitraId);
                formData.append("nomor", values.nomor || "");
                formData.append("statusVerifikasi", values.statusVerifikasi);
                if (values.tanggalVerifikasi) {
                  formData.append(
                    "tanggalVerifikasi",
                    values.tanggalVerifikasi,
                  );
                }
                if (values.longitude) {
                  formData.append("longitude", values.longitude);
                }
                if (values.latitude) {
                  formData.append("latitude", values.latitude);
                }
                formData.append("alamat", values.alamat || "");
                if (values.produksiHarian) {
                  formData.append("produksiHarian", values.produksiHarian);
                }
                if (values.pic) formData.append("pic", values.pic);

                await axios.post(`${API_BASE}/sumur-minyak/post`, formData, {
                  headers: { "Content-Type": "multipart/form-data" },
                });
                showSuccess("Sumur minyak berhasil ditambahkan");
                resetForm();
                closeFormModal();
              } catch (err) {
                showError(err);
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({
              values,
              errors,
              touched,
              setFieldValue,
              isSubmitting,
            }) => (
              <Form>
                <ModalBody>
                  <VStack spacing={4}>
                    <FormControl isInvalid={touched.nama && errors.nama}>
                      <FormLabel>Nama Sumur</FormLabel>
                      <Input
                        value={values.nama}
                        onChange={(e) => setFieldValue("nama", e.target.value)}
                      />
                      <FormErrorMessage>{errors.nama}</FormErrorMessage>
                    </FormControl>

                    <FormControl isInvalid={touched.mitraId && errors.mitraId}>
                      <FormLabel>Mitra</FormLabel>
                      <Select
                        placeholder="Pilih mitra"
                        value={values.mitraId}
                        onChange={(e) =>
                          setFieldValue("mitraId", e.target.value)
                        }
                        isDisabled={!isKpbpnAdmin}
                      >
                        {(isKpbpnAdmin
                          ? dataMitra
                          : dataMitra.filter(
                              (m) => Number(m.id) === Number(scopedMitraId),
                            )
                        ).map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.nama}
                          </option>
                        ))}
                        {!isKpbpnAdmin &&
                          scopedMitraId &&
                          !dataMitra.some(
                            (m) => Number(m.id) === Number(scopedMitraId),
                          ) && (
                            <option value={scopedMitraId}>
                              {mitra?.nama || `Mitra #${scopedMitraId}`}
                            </option>
                          )}
                      </Select>
                      <FormErrorMessage>{errors.mitraId}</FormErrorMessage>
                    </FormControl>

                    <FormControl isInvalid={touched.nomor && errors.nomor}>
                      <FormLabel>Nomor Sumur</FormLabel>
                      <Input
                        value={values.nomor}
                        onChange={(e) =>
                          setFieldValue("nomor", e.target.value)
                        }
                      />
                      <FormErrorMessage>{errors.nomor}</FormErrorMessage>
                    </FormControl>

                    <FormControl
                      isInvalid={
                        touched.statusVerifikasi && errors.statusVerifikasi
                      }
                    >
                      <FormLabel>Status Verifikasi</FormLabel>
                      <Select
                        value={values.statusVerifikasi}
                        onChange={(e) =>
                          setFieldValue("statusVerifikasi", e.target.value)
                        }
                      >
                        {STATUS_VERIFIKASI.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </Select>
                      <FormErrorMessage>
                        {errors.statusVerifikasi}
                      </FormErrorMessage>
                    </FormControl>

                    <FormControl
                      isInvalid={
                        touched.tanggalVerifikasi && errors.tanggalVerifikasi
                      }
                    >
                      <FormLabel>Tanggal Verifikasi</FormLabel>
                      <Input
                        type="date"
                        value={values.tanggalVerifikasi}
                        onChange={(e) =>
                          setFieldValue("tanggalVerifikasi", e.target.value)
                        }
                      />
                      <FormErrorMessage>
                        {errors.tanggalVerifikasi}
                      </FormErrorMessage>
                    </FormControl>

                    <HStack w="100%" spacing={4}>
                      <FormControl
                        isInvalid={touched.longitude && errors.longitude}
                      >
                        <FormLabel>Longitude</FormLabel>
                        <Input
                          type="number"
                          step="any"
                          value={values.longitude}
                          onChange={(e) =>
                            setFieldValue("longitude", e.target.value)
                          }
                        />
                        <FormErrorMessage>{errors.longitude}</FormErrorMessage>
                      </FormControl>

                      <FormControl
                        isInvalid={touched.latitude && errors.latitude}
                      >
                        <FormLabel>Latitude</FormLabel>
                        <Input
                          type="number"
                          step="any"
                          value={values.latitude}
                          onChange={(e) =>
                            setFieldValue("latitude", e.target.value)
                          }
                        />
                        <FormErrorMessage>{errors.latitude}</FormErrorMessage>
                      </FormControl>
                    </HStack>

                    <FormControl isInvalid={touched.alamat && errors.alamat}>
                      <FormLabel>Alamat</FormLabel>
                      <Input
                        value={values.alamat}
                        onChange={(e) =>
                          setFieldValue("alamat", e.target.value)
                        }
                      />
                      <FormErrorMessage>{errors.alamat}</FormErrorMessage>
                    </FormControl>

                    <FormControl
                      isInvalid={
                        touched.produksiHarian && errors.produksiHarian
                      }
                    >
                      <FormLabel>Produksi Harian</FormLabel>
                      <Input
                        type="number"
                        step="any"
                        value={values.produksiHarian}
                        onChange={(e) =>
                          setFieldValue("produksiHarian", e.target.value)
                        }
                      />
                      <FormErrorMessage>
                        {errors.produksiHarian}
                      </FormErrorMessage>
                    </FormControl>

                    <FileUploadField
                      label="Foto Sumur *"
                      preview={values.picPreview}
                      touched={touched.pic}
                      error={errors.pic}
                      onChange={(file) => {
                        setFieldValue("pic", file);
                        setFieldValue(
                          "picPreview",
                          file ? URL.createObjectURL(file) : values.picPreview,
                        );
                      }}
                    />
                  </VStack>
                </ModalBody>
                <ModalFooter>
                  <Button variant="ghost" mr={3} onClick={closeFormModal}>
                    Batal
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    isLoading={isSubmitting}
                  >
                    Simpan
                  </Button>
                </ModalFooter>
              </Form>
            )}
          </Formik>
        </ModalContent>
      </Modal>

      <Modal isOpen={isDeleteOpen} onClose={closeDeleteModal} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Konfirmasi Hapus</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              Apakah Anda yakin ingin menghapus sumur minyak{" "}
              <Text as="span" fontWeight="bold">
                {deleteTarget?.nama || "-"}
              </Text>
              ? Tindakan ini tidak dapat dibatalkan.
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

      <Modal isOpen={isQrOpen} onClose={closeQrModal} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>QR Code Sumur</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={3} align="stretch">
              <Box textAlign="center">
                <Text fontWeight="bold">{qrPreview?.nama || "-"}</Text>
                {qrPreview?.nomor && (
                  <Text fontSize="sm" color="gray.600">
                    No: {qrPreview.nomor}
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
            </VStack>
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

      <Modal isOpen={isPreviewOpen} onClose={onPreviewClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Preview Foto</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Image
              src={previewFoto || FotoPlaceholder}
              alt="Preview"
              w="100%"
              maxH="70vh"
              objectFit="contain"
              borderRadius="md"
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </LayoutKPBPN>
  );
}

export default AdminSumurMinyak;
