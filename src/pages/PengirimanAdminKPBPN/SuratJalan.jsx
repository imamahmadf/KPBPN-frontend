import React, { useState, useEffect, useRef, useMemo } from "react";
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
  Image,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
} from "@chakra-ui/react";
import { Select as Select2, AsyncSelect } from "chakra-react-select";
import { Link as RouterLink } from "react-router-dom";
import { BsChevronDown } from "react-icons/bs";
import LayoutKPBPN from "../../Componets/KPBPN/LayoutKPBPN";
import VolumeMultiSatuan from "../../Componets/VolumeMultiSatuan";
import { formatVolumeNumber } from "../../lib/volumeSatuan";
import FotoPlaceholder from "../../assets/add_photo.png";
import "../../Style/pagination.css";

const API_BASE = import.meta.env.VITE_REACT_APP_API_BASE_URL;

const getImageUrl = (path) => (path ? `${API_BASE}${path}` : null);

const parseDecimalInput = (value) => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isNaN(value) ? null : value;
  const normalized = String(value).trim().replace(",", ".");
  const num = Number(normalized);
  return Number.isNaN(num) ? null : num;
};

const toDecimalInput = (value) => {
  if (value === null || value === undefined || value === "") return "";
  return String(value).replace(".", ",");
};

const decimalFieldSchema = (label) =>
  Yup.string()
    .required(`${label} wajib diisi`)
    .test("is-decimal", `${label} harus angka valid`, (value) => {
      const num = parseDecimalInput(value);
      return num !== null && num > 0;
    });

const konfirmasiSchema = Yup.object({
  tanggal: Yup.string().required("Tanggal wajib diisi"),
  volume: Yup.number()
    .typeError("Volume harus angka")
    .positive("Volume harus lebih dari 0")
    .required("Volume wajib diisi"),
  pegawaiId: Yup.mixed().nullable().required("Pegawai wajib dipilih"),
  catatan: Yup.string().nullable(),
  api: decimalFieldSchema("API"),
  BSNW: decimalFieldSchema("BSNW"),
  foto: Yup.mixed()
    .nullable()
    .test(
      "foto-required",
      "Foto bukti penerimaan wajib diunggah",
      function (value) {
        if (value instanceof File) return true;
        if (this.parent.fotoPreview) return true;
        return false;
      },
    )
    .test("is-file", "Foto tidak valid", (value) => {
      if (!value) return true;
      return value instanceof File;
    }),
});

const initialValuesKonfirmasi = {
  tanggal: "",
  volume: "",
  pegawaiId: null,
  pegawaiLabel: "",
  catatan: "",
  api: "",
  BSNW: "",
  foto: null,
  fotoPreview: "",
};

const FileUploadField = ({
  label,
  preview,
  onChange,
  error,
  touched,
  isRequired = true,
}) => {
  const inputRef = useRef(null);

  return (
    <FormControl isInvalid={touched && error} isRequired={isRequired}>
      <FormLabel>{label}</FormLabel>
      <Input
        ref={inputRef}
        type="file"
        accept="image/png, image/jpeg, image/jpg"
        display="none"
        required={false}
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
        type="button"
        variant="secondary"
        w="100%"
        size="sm"
        onClick={() => inputRef.current?.click()}
      >
        Pilih Foto
      </Button>
      <FormErrorMessage>{error}</FormErrorMessage>
    </FormControl>
  );
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

const suratJalanSchema = Yup.object({
  nomor: Yup.string().nullable(),
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
  jamDatang: Yup.string().required("Jam datang wajib diisi"),
  jamPergi: Yup.string().required("Jam pergi wajib diisi"),
});

const toDateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const toDateTimeLocalInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
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

const statusBadgeColor = (status) => {
  const value = String(status || "").toUpperCase();
  if (value === "TIBA") return "green";
  if (value === "KIRIM") return "blue";
  if (value === "BATAL") return "red";
  return "gray";
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

const SuratJalan = () => {
  const toast = useToast();
  const dataListRef = useRef(null);
  const formikRefKonfirmasi = useRef(null);
  const formikRefEdit = useRef(null);
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();
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
  const {
    isOpen: isPreviewFotoOpen,
    onOpen: onPreviewFotoOpen,
    onClose: onPreviewFotoClose,
  } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const {
    isOpen: isBatalOpen,
    onOpen: onBatalOpen,
    onClose: onBatalClose,
  } = useDisclosure();
  const [previewFoto, setPreviewFoto] = useState("");
  const [selectedSuratJalan, setSelectedSuratJalan] = useState(null);
  const [editingSuratJalan, setEditingSuratJalan] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [batalTarget, setBatalTarget] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [selectedSuratJalanDetail, setSelectedSuratJalanDetail] =
    useState(null);
  const [dataKonfirmasi, setDataKonfirmasi] = useState([]);
  const [loadingDetailKonfirmasi, setLoadingDetailKonfirmasi] = useState(false);
  const [editingKonfirmasi, setEditingKonfirmasi] = useState(null);

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
  const [stasiunPengumpulMinyakFilterId, setStasiunPengumpulMinyakFilterId] =
    useState(0);
  const [asalMinyakFilterId, setAsalMinyakFilterId] = useState(0);
  const [statusSuratJalanFilterId, setStatusSuratJalanFilterId] = useState(0);
  const [tanggalAwal, setTanggalAwal] = useState("");
  const [tanggalAkhir, setTanggalAkhir] = useState("");
  const [sortBy, setSortBy] = useState("id");
  const [sortOrder, setSortOrder] = useState("DESC");

  const allSupir = (dataSeed?.resultMitra || []).flatMap((m) =>
    (m.supirs || []).map((s) => ({
      ...s,
      mitraNama: m.nama,
    })),
  );

  const getSupirByMitra = (selectedMitraId) => {
    if (!selectedMitraId) return [];
    const mitraData = (dataSeed?.resultMitra || []).find(
      (m) => String(m.id) === String(selectedMitraId),
    );
    return mitraData?.supirs || [];
  };

  const initialValuesEdit = useMemo(() => {
    if (!editingSuratJalan) {
      return {
        nomor: "",
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
    }

    return {
      nomor: editingSuratJalan.nomor || "",
      tanggal: toDateInput(editingSuratJalan.tanggal),
      mitraId: editingSuratJalan.mitraId || null,
      transportirId: editingSuratJalan.transportirId || null,
      stasiunPengumpulMinyakId:
        editingSuratJalan.stasiunPengumpulMinyakId || null,
      asalMinyakId: editingSuratJalan.asalMinyakId || null,
      volume: editingSuratJalan.volume ?? "",
      satuanVolumeId: editingSuratJalan.satuanVolumeId || null,
      supirId: editingSuratJalan.supirId || null,
      jamDatang: toDateTimeLocalInput(editingSuratJalan.jamDatang),
      jamPergi: toDateTimeLocalInput(editingSuratJalan.jamPergi),
    };
  }, [editingSuratJalan]);

  const initialValuesKonfirmasiForm = useMemo(() => {
    if (editingKonfirmasi) {
      return {
        tanggal: toDateInput(editingKonfirmasi.tanggal),
        volume: editingKonfirmasi.volume ?? "",
        pegawaiId:
          editingKonfirmasi.pegawaiId ??
          editingKonfirmasi.pegawai?.id ??
          null,
        pegawaiLabel: editingKonfirmasi.pegawai?.nama || "",
        catatan: editingKonfirmasi.catatan || "",
        api: toDecimalInput(editingKonfirmasi.api),
        BSNW: toDecimalInput(editingKonfirmasi.BSNW),
        foto: null,
        fotoPreview: getImageUrl(editingKonfirmasi.foto) || "",
      };
    }

    return {
      ...initialValuesKonfirmasi,
      volume: selectedSuratJalan?.volume ?? "",
    };
  }, [editingKonfirmasi, selectedSuratJalan]);

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

  const openEditModal = (item) => {
    setEditingSuratJalan(item);
    onEditOpen();
  };

  const handleCloseEditModal = () => {
    formikRefEdit.current?.resetForm();
    setEditingSuratJalan(null);
    onEditClose();
  };

  const openDeleteModal = (item) => {
    setDeleteTarget(item);
    onDeleteOpen();
  };

  const handleCloseDeleteModal = () => {
    if (isDeleting) return;
    setDeleteTarget(null);
    onDeleteClose();
  };

  const openBatalModal = (item) => {
    if (item.statusSuratJalanId === 4) {
      toast({
        title: "Tidak dapat dibatalkan",
        description: "Surat jalan sudah berstatus BATAL",
        status: "warning",
        duration: 4000,
        isClosable: true,
      });
      return;
    }
    if (item.statusSuratJalanId === 3) {
      toast({
        title: "Tidak dapat dibatalkan",
        description: "Surat jalan yang sudah tiba tidak dapat dibatalkan",
        status: "warning",
        duration: 4000,
        isClosable: true,
      });
      return;
    }
    setBatalTarget(item);
    onBatalOpen();
  };

  const handleCloseBatalModal = () => {
    if (isCancelling) return;
    setBatalTarget(null);
    onBatalClose();
  };

  const handleBatalSuratJalan = async () => {
    if (!batalTarget?.id) return;

    setIsCancelling(true);
    try {
      await axios.post(`${API_BASE}/pengiriman/batal/${batalTarget.id}`);
      toast({
        title: "Berhasil",
        description: "Surat jalan berhasil dibatalkan",
        status: "success",
        duration: 4000,
        isClosable: true,
      });
      setBatalTarget(null);
      onBatalClose();
      fetchDataSuratJalan();
    } catch (err) {
      console.error(err);
      toast({
        title: "Gagal membatalkan",
        description:
          err.response?.data?.error ||
          err.response?.data?.message ||
          "Gagal membatalkan surat jalan",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleDeleteSuratJalan = async () => {
    if (!deleteTarget?.id) return;

    setIsDeleting(true);
    try {
      await axios.post(`${API_BASE}/pengiriman/delete/${deleteTarget.id}`);
      toast({
        title: "Berhasil",
        description: "Surat jalan berhasil dihapus",
        status: "success",
        duration: 4000,
        isClosable: true,
      });
      setDeleteTarget(null);
      onDeleteClose();
      if (dataSuratJalan.length === 1 && page > 0) {
        setPage((prev) => prev - 1);
      } else {
        fetchDataSuratJalan();
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Gagal menghapus",
        description:
          err.response?.data?.error ||
          err.response?.data?.message ||
          "Gagal menghapus surat jalan",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const submitEditSuratJalan = async (values, { setSubmitting, resetForm }) => {
    if (!editingSuratJalan?.id) return;

    try {
      await axios.post(`${API_BASE}/pengiriman/edit/${editingSuratJalan.id}`, {
        nomor: values.nomor,
        tanggal: values.tanggal,
        mitraId: values.mitraId,
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
        title: "Berhasil",
        description: "Surat jalan berhasil diperbarui",
        status: "success",
        duration: 4000,
        isClosable: true,
      });

      resetForm();
      handleCloseEditModal();
      fetchDataSuratJalan();
    } catch (err) {
      console.error(err);
      toast({
        title: "Error!",
        description:
          err.response?.data?.error || "Gagal memperbarui surat jalan",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const openKonfirmasiModal = (item) => {
    setEditingKonfirmasi(null);
    setSelectedSuratJalan(item);
    onKonfirmasiOpen();
  };

  const handleCloseKonfirmasiModal = () => {
    formikRefKonfirmasi.current?.resetForm();
    setEditingKonfirmasi(null);
    setSelectedSuratJalan(null);
    onKonfirmasiClose();
  };

  const refreshDataKonfirmasi = async (suratJalanId) => {
    if (!suratJalanId) return;
    const res = await axios.get(
      `${API_BASE}/pengiriman/get/konfirmasi/${suratJalanId}`,
    );
    setDataKonfirmasi(res.data.result || []);
  };

  const openEditKonfirmasiModal = (kp, suratJalanItem) => {
    const parentSuratJalan =
      suratJalanItem || selectedSuratJalanDetail || kp?.suratJalan || null;
    setEditingKonfirmasi(kp);
    setSelectedSuratJalan(parentSuratJalan);
    onKonfirmasiOpen();
  };

  const openEditKonfirmasiFromList = async (item) => {
    try {
      const res = await axios.get(
        `${API_BASE}/pengiriman/get/konfirmasi/${item.id}`,
      );
      const list = res.data.result || [];
      if (!list.length) {
        toast({
          title: "Tidak ada konfirmasi",
          description:
            "Belum ada data konfirmasi penerimaan untuk surat jalan ini",
          status: "warning",
          duration: 4000,
          isClosable: true,
        });
        return;
      }
      setSelectedSuratJalanDetail(item);
      setDataKonfirmasi(list);
      openEditKonfirmasiModal(list[0], item);
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
    }
  };

  const handleCloseDetailKonfirmasiModal = () => {
    setSelectedSuratJalanDetail(null);
    setDataKonfirmasi([]);
    setPreviewFoto("");
    onDetailKonfirmasiClose();
  };

  const showPreviewFoto = (path) => {
    const url = getImageUrl(path);
    if (!url) return;
    setPreviewFoto(url);
    onPreviewFotoOpen();
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
    const isEdit = Boolean(editingKonfirmasi?.id);
    const suratJalanId = isEdit
      ? editingKonfirmasi.suratJalanId || selectedSuratJalan?.id
      : selectedSuratJalan?.id;

    if (!suratJalanId && !isEdit) {
      setSubmitting(false);
      toast({
        title: "Error!",
        description: "Surat jalan tidak ditemukan",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("tanggal", values.tanggal);
      formData.append("volume", values.volume);
      formData.append("pegawaiId", values.pegawaiId);
      formData.append("catatan", values.catatan || "");
      formData.append("api", parseDecimalInput(values.api) ?? "");
      formData.append("BSNW", parseDecimalInput(values.BSNW) ?? "");
      if (values.foto instanceof File) formData.append("foto", values.foto);

      if (isEdit) {
        await axios.post(
          `${API_BASE}/pengiriman/edit/konfirmasi/${editingKonfirmasi.id}`,
          formData,
        );
      } else {
        formData.append("suratJalanId", suratJalanId);
        await axios.post(`${API_BASE}/pengiriman/post/konfirmasi`, formData);
      }

      toast({
        title: "Berhasil",
        description: isEdit
          ? "Konfirmasi penerimaan berhasil diperbarui"
          : "Konfirmasi penerimaan berhasil disimpan",
        status: "success",
        duration: 4000,
        isClosable: true,
      });

      const detailSuratJalanId =
        selectedSuratJalanDetail?.id || (isEdit ? suratJalanId : null);

      resetForm();
      handleCloseKonfirmasiModal();
      fetchDataSuratJalan();

      if (isEdit && detailSuratJalanId) {
        try {
          await refreshDataKonfirmasi(detailSuratJalanId);
        } catch (refreshErr) {
          console.error(refreshErr);
        }
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Error!",
        description:
          err.response?.data?.error ||
          (isEdit
            ? "Gagal memperbarui konfirmasi penerimaan"
            : "Gagal menyimpan konfirmasi penerimaan"),
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
    setStasiunPengumpulMinyakFilterId(0);
    setAsalMinyakFilterId(0);
    setStatusSuratJalanFilterId(0);
    setTanggalAwal("");
    setTanggalAkhir("");
    setSortBy("id");
    setSortOrder("DESC");
  };

  const hasActiveFilter =
    mitraFilterId ||
    transportirFilterId ||
    supirFilterId ||
    stasiunPengumpulMinyakFilterId ||
    asalMinyakFilterId ||
    statusSuratJalanFilterId ||
    tanggalAwal ||
    tanggalAkhir ||
    sortBy !== "id" ||
    sortOrder !== "DESC";

  const renderAksi = (item, fullWidth = false) => {
    const actions = [
      {
        key: "detail",
        label: "Detail",
        to: `/pengiriman-kpbpn/detail-surat-jalan/${item.id}`,
      },
      {
        key: "edit",
        label: "Edit",
        onClick: () => openEditModal(item),
      },
    ];

    if (item.statusSuratJalanId === 1) {
      actions.push({
        key: "verifikasi",
        label: "Verifikasi",
        onClick: () => verifikasiSuratJalan(item.id, item.mitraId),
      });
    }

    if (item.statusSuratJalanId === 2) {
      actions.push({
        key: "konfirmasi",
        label: "Konfirmasi",
        onClick: () => openKonfirmasiModal(item),
      });
    }

    if (item.statusSuratJalanId === 3) {
      actions.push(
        {
          key: "detail-konfirmasi",
          label: "Detail Konfirmasi",
          onClick: () => openDetailKonfirmasiModal(item),
        },
        {
          key: "edit-konfirmasi",
          label: "Edit Konfirmasi",
          onClick: () => openEditKonfirmasiFromList(item),
        },
      );
    }

    if (item.statusSuratJalanId === 1 || item.statusSuratJalanId === 2) {
      actions.push({
        key: "batal",
        label: "Batalkan",
        onClick: () => openBatalModal(item),
        destructive: true,
      });
    }

    actions.push({
      key: "hapus",
      label: "Hapus",
      onClick: () => openDeleteModal(item),
      destructive: true,
    });

    const destructiveIndex = actions.findIndex((action) => action.destructive);

    return (
      <Menu isLazy placement="bottom-end" strategy="fixed">
        <MenuButton
          as={Button}
          size="sm"
          variant="outline"
          rightIcon={<BsChevronDown />}
          w={fullWidth ? "full" : "auto"}
        >
          Aksi
        </MenuButton>
        <MenuList minW="200px" zIndex={20}>
          {actions.map((action, index) => (
            <React.Fragment key={action.key}>
              {destructiveIndex === index && index > 0 && <MenuDivider />}
              <MenuItem
                as={action.to ? RouterLink : undefined}
                to={action.to}
                onClick={action.onClick}
                color={action.destructive ? "red.500" : undefined}
                fontWeight={action.destructive ? "medium" : "normal"}
              >
                {action.label}
              </MenuItem>
            </React.Fragment>
          ))}
        </MenuList>
      </Menu>
    );
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
    mitraFilterId,
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
                    { value: "id", label: "Index" },
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
                          : sortBy === "tanggal"
                            ? "Tanggal"
                            : "Index",
                  }}
                  onChange={(opt) => setSortBy(opt?.value || "id")}
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
                        : sortBy === "tanggal"
                          ? [
                              { value: "DESC", label: "Tanggal Terbaru" },
                              { value: "ASC", label: "Tanggal Terlama" },
                            ]
                          : [
                              { value: "DESC", label: "Index Terbesar" },
                              { value: "ASC", label: "Index Terkecil" },
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
                          : sortBy === "tanggal"
                            ? sortOrder === "ASC"
                              ? "Tanggal Terlama"
                              : "Tanggal Terbaru"
                            : sortOrder === "ASC"
                              ? "Index Terkecil"
                              : "Index Terbesar",
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
                        <Badge
                          colorScheme={statusBadgeColor(
                            item.statusSuratJalan?.status,
                          )}
                          variant="subtle"
                        >
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
                      </SimpleGrid>
                      <Box mt={4}>{renderAksi(item, true)}</Box>
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
                    <Th textTransform="capitalize">Stasiun Pengumpul Minyak</Th>
                    <Th textTransform="capitalize">Asal Minyak</Th>
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
                        {Array.from({ length: 11 }).map((__, i) => (
                          <Td key={i}>
                            <Skeleton height="20px" />
                          </Td>
                        ))}
                      </Tr>
                    ))
                  ) : dataSuratJalan?.length > 0 ? (
                    dataSuratJalan.map((item, index) => (
                      <Tr key={item.id}>
                        <Td fontWeight="medium">
                          {page * limit + index + 1}
                        </Td>
                        <Td fontWeight="medium">{item.nomor || "-"}</Td>
                        <Td>{formatTanggal(item.tanggal)}</Td>
                        <Td>{item.mitra?.nama || "-"}</Td>
                        <Td>{item.transportir?.plat || "-"}</Td>
                        <Td>{item.stasiunPengumpulMinyak?.nama || "-"}</Td>
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
                        <Td>
                          <Badge
                            colorScheme={statusBadgeColor(
                              item.statusSuratJalan?.status,
                            )}
                            variant="subtle"
                          >
                            {item.statusSuratJalan?.status || "-"}
                          </Badge>
                        </Td>
                        <Td whiteSpace="nowrap">{renderAksi(item)}</Td>
                      </Tr>
                    ))
                  ) : (
                    <Tr>
                      <Td colSpan={11} textAlign="center" py={10}>
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
        isOpen={isEditOpen}
        onClose={handleCloseEditModal}
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
          <ModalHeader>Edit Surat Jalan</ModalHeader>
          <ModalCloseButton />
          <Formik
            innerRef={formikRefEdit}
            initialValues={initialValuesEdit}
            enableReinitialize
            validationSchema={suratJalanSchema}
            onSubmit={submitEditSuratJalan}
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
                    <FormControl
                      isInvalid={touched.nomor && errors.nomor}
                      gridColumn={{ md: "span 2" }}
                    >
                      <FormLabel>Nomor Surat Jalan</FormLabel>
                      <Input
                        name="nomor"
                        type="text"
                        bgColor="terang"
                        value={values.nomor}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="Masukkan nomor surat jalan"
                      />
                      <FormErrorMessage>{errors.nomor}</FormErrorMessage>
                    </FormControl>

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
                                    dataSeed?.resultStasiunPengumpulMinyak || []
                                  ).find(
                                    (s) =>
                                      s.id === values.stasiunPengumpulMinyakId,
                                  )?.nama || "",
                              }
                            : null
                        }
                        onChange={(opt) =>
                          setFieldValue(
                            "stasiunPengumpulMinyakId",
                            opt?.value || null,
                          )
                        }
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
                    onClick={handleCloseEditModal}
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
                    Simpan Perubahan
                  </Button>
                </ModalFooter>
              </Form>
            )}
          </Formik>
        </ModalContent>
      </Modal>

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
          <ModalHeader>
            {editingKonfirmasi
              ? "Edit Konfirmasi Penerimaan"
              : "Konfirmasi Penerimaan"}
          </ModalHeader>
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
            initialValues={initialValuesKonfirmasiForm}
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
              submitForm,
              validateForm,
              setTouched,
              setFieldTouched,
            }) => (
              <Form id="form-konfirmasi-penerimaan">
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
                          setFieldTouched("pegawaiId", true);
                        }}
                        {...selectStyles}
                      />
                      <FormErrorMessage>{errors.pegawaiId}</FormErrorMessage>
                    </FormControl>

                    <FormControl isInvalid={touched.api && errors.api}>
                      <FormLabel>API</FormLabel>
                      <Input
                        name="api"
                        type="text"
                        inputMode="decimal"
                        bgColor="terang"
                        value={values.api}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="Contoh: 3,553"
                      />
                      <FormErrorMessage>{errors.api}</FormErrorMessage>
                    </FormControl>

                    <FormControl isInvalid={touched.BSNW && errors.BSNW}>
                      <FormLabel>BSNW</FormLabel>
                      <Input
                        name="BSNW"
                        type="text"
                        inputMode="decimal"
                        bgColor="terang"
                        value={values.BSNW}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="Contoh: 3,553"
                      />
                      <FormErrorMessage>{errors.BSNW}</FormErrorMessage>
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

                    <Box gridColumn={{ md: "span 2" }}>
                      <FileUploadField
                        label="Foto Bukti Penerimaan"
                        preview={values.fotoPreview}
                        touched={touched.foto}
                        error={errors.foto}
                        isRequired={!editingKonfirmasi}
                        onChange={(file) => {
                          setFieldValue("foto", file);
                          setFieldValue(
                            "fotoPreview",
                            file
                              ? URL.createObjectURL(file)
                              : getImageUrl(editingKonfirmasi?.foto) || "",
                          );
                          setFieldTouched("foto", true);
                        }}
                      />
                    </Box>
                  </SimpleGrid>
                </ModalBody>
                <ModalFooter
                  flexDirection={{ base: "column-reverse", sm: "row" }}
                  gap={{ base: 2, sm: 0 }}
                >
                  <Button
                    type="button"
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
                    form="form-konfirmasi-penerimaan"
                    isLoading={isSubmitting}
                    w={{ base: "full", sm: "auto" }}
                    onClick={async (e) => {
                      e.preventDefault();
                      const formErrors = await validateForm();
                      setTouched({
                        tanggal: true,
                        volume: true,
                        pegawaiId: true,
                        api: true,
                        BSNW: true,
                        foto: true,
                      });
                      if (Object.keys(formErrors || {}).length) {
                        toast({
                          title: "Form belum lengkap",
                          description:
                            "Periksa kembali isian yang wajib diisi",
                          status: "warning",
                          duration: 4000,
                          isClosable: true,
                        });
                        return;
                      }
                      await submitForm();
                    }}
                  >
                    {editingKonfirmasi ? "Simpan Perubahan" : "Simpan"}
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
                    <Flex justify="flex-end" mb={3}>
                      <Button
                        size="sm"
                        variant="outline"
                        colorScheme="yellow"
                        onClick={() =>
                          openEditKonfirmasiModal(
                            kp,
                            selectedSuratJalanDetail,
                          )
                        }
                      >
                        Edit
                      </Button>
                    </Flex>
                    <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
                      <MobileField label="Nomor Konfirmasi">
                        {kp.nomor || "-"}
                      </MobileField>
                      <MobileField label="Tanggal">
                        {formatTanggal(kp.tanggal)}
                      </MobileField>
                      <MobileField label="Volume Diterima">
                        <VolumeMultiSatuan
                          volume={kp.volume}
                          satuan={
                            kp.suratJalan?.satuanVolume?.satuan ||
                            selectedSuratJalanDetail?.satuanVolume?.satuan ||
                            "Barrel"
                          }
                        />
                      </MobileField>
                      <MobileField label="Pegawai">
                        {kp.pegawai?.nama || "-"}
                      </MobileField>
                      <MobileField label="API">
                        {kp.api != null && kp.api !== ""
                          ? formatVolumeNumber(Number(kp.api))
                          : "-"}
                      </MobileField>
                      <MobileField label="BSNW">
                        {kp.BSNW != null && kp.BSNW !== ""
                          ? formatVolumeNumber(Number(kp.BSNW))
                          : "-"}
                      </MobileField>
                      <MobileField label="Mitra">
                        {kp.suratJalan?.mitra?.nama ||
                          selectedSuratJalanDetail?.mitra?.nama ||
                          "-"}
                      </MobileField>
                      <MobileField label="Status Pengisian Tanki">
                        {(kp.pengisianTankis || []).length > 0
                          ? `Sudah diisi (${
                              Array.from(
                                new Set(
                                  (kp.pengisianTankis || [])
                                    .map((item) => item.tanki?.kode)
                                    .filter(Boolean),
                                ),
                              ).join(", ") ||
                              `${kp.pengisianTankis.length} pengisian`
                            })`
                          : "Belum diisi tanki"}
                      </MobileField>
                      <Box gridColumn={{ sm: "span 2" }}>
                        <MobileField label="Catatan">
                          {kp.catatan || "-"}
                        </MobileField>
                      </Box>
                      <Box gridColumn={{ sm: "span 2" }}>
                        <MobileField label="Foto Bukti Penerimaan">
                          {kp.foto ? (
                            <Image
                              src={getImageUrl(kp.foto)}
                              alt={`Foto konfirmasi ${kp.nomor || kp.id}`}
                              w="100%"
                              maxH="220px"
                              objectFit="cover"
                              borderRadius="md"
                              border="1px solid"
                              borderColor="gray.200"
                              cursor="pointer"
                              onClick={() => showPreviewFoto(kp.foto)}
                            />
                          ) : (
                            "-"
                          )}
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

      <Modal
        isOpen={isDeleteOpen}
        onClose={handleCloseDeleteModal}
        isCentered
        closeOnOverlayClick={!isDeleting}
        closeOnEsc={!isDeleting}
      >
        <ModalOverlay />
        <ModalContent mx={4}>
          <ModalHeader pr={12}>Hapus Surat Jalan</ModalHeader>
          <ModalCloseButton isDisabled={isDeleting} />
          <ModalBody>
            <Text>
              Apakah Anda yakin ingin menghapus surat jalan{" "}
              <Text as="span" fontWeight="bold">
                {deleteTarget?.nomor || `#${deleteTarget?.id || "-"}`}
              </Text>{" "}
              tanggal{" "}
              <Text as="span" fontWeight="bold">
                {formatTanggal(deleteTarget?.tanggal)}
              </Text>
              ?
            </Text>
            <Text fontSize="sm" color="gray.500" mt={2}>
              Konfirmasi penerimaan dan data produksi sumur terkait juga akan
              dihapus. Surat jalan yang sudah dipakai pada pengisian tanki
              tidak dapat dihapus.
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
              onClick={handleCloseDeleteModal}
              isDisabled={isDeleting}
            >
              Batal
            </Button>
            <Button
              colorScheme="red"
              w={{ base: "full", sm: "auto" }}
              onClick={handleDeleteSuratJalan}
              isLoading={isDeleting}
            >
              Hapus
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isBatalOpen}
        onClose={handleCloseBatalModal}
        isCentered
        closeOnOverlayClick={!isCancelling}
        closeOnEsc={!isCancelling}
      >
        <ModalOverlay />
        <ModalContent mx={4}>
          <ModalHeader pr={12}>Batalkan Surat Jalan</ModalHeader>
          <ModalCloseButton isDisabled={isCancelling} />
          <ModalBody>
            <Text>
              Apakah Anda yakin ingin membatalkan surat jalan{" "}
              <Text as="span" fontWeight="bold">
                {batalTarget?.nomor || `#${batalTarget?.id || "-"}`}
              </Text>{" "}
              tanggal{" "}
              <Text as="span" fontWeight="bold">
                {formatTanggal(batalTarget?.tanggal)}
              </Text>
              ?
            </Text>
            <Text fontSize="sm" color="gray.500" mt={2}>
              Status surat jalan akan diubah menjadi BATAL. Surat jalan yang
              sudah tiba atau dipakai pada pengisian tanki tidak dapat
              dibatalkan.
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
              onClick={handleCloseBatalModal}
              isDisabled={isCancelling}
            >
              Tutup
            </Button>
            <Button
              colorScheme="red"
              w={{ base: "full", sm: "auto" }}
              onClick={handleBatalSuratJalan}
              isLoading={isCancelling}
            >
              Batalkan
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isPreviewFotoOpen}
        onClose={onPreviewFotoClose}
        size="xl"
        isCentered
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Foto Bukti Penerimaan</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {previewFoto ? (
              <Image
                src={previewFoto}
                alt="Foto bukti penerimaan"
                w="100%"
                borderRadius="md"
                objectFit="contain"
                maxH="70vh"
              />
            ) : null}
          </ModalBody>
        </ModalContent>
      </Modal>
    </LayoutKPBPN>
  );
};

export default SuratJalan;
