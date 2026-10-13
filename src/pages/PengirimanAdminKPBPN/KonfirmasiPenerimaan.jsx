import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import ReactPaginate from "react-paginate";
import { Link as RouterLink } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  HStack,
  Image,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Skeleton,
  Spacer,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tr,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react";
import LayoutKPBPN from "../../Componets/KPBPN/LayoutKPBPN";
import {
  formatVolumeNumber,
  roundVolumeNumber,
} from "../../lib/volumeSatuan";
import { selectIsPetugasKeamananOnly } from "../../Redux/Reducers/auth";
import FotoPlaceholder from "../../assets/add_photo.png";
import "../../Style/pagination.css";

const API_BASE = import.meta.env.VITE_REACT_APP_API_BASE_URL;
const LIMIT = 20;

const getDownloadFileName = (contentDisposition, fallback) => {
  if (!contentDisposition) return fallback;
  const utf8Name = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Name?.[1]) {
    try {
      return decodeURIComponent(utf8Name[1]);
    } catch {
      return utf8Name[1];
    }
  }
  const quotedName = contentDisposition.match(/filename="([^"]+)"/i);
  if (quotedName?.[1]) return quotedName[1];
  const plainName = contentDisposition.match(/filename=([^;]+)/i);
  return plainName?.[1]?.trim() || fallback;
};

const readBlobError = async (error, fallback) => {
  if (error?.response?.data instanceof Blob) {
    try {
      const text = await error.response.data.text();
      const parsed = JSON.parse(text);
      return parsed.error || fallback;
    } catch {
      return fallback;
    }
  }
  return error?.response?.data?.error || fallback;
};

const bisaUnduhBeritaAcara = (item) =>
  item?.volume !== null && item?.volume !== undefined && item?.volume !== "";

const getImageUrl = (path) => (path ? `${API_BASE}${path}` : null);

const formatTanggal = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatJam = (value) => {
  if (!value) return "-";
  const match = String(value).trim().match(/^(\d{1,2}):(\d{2})/);
  if (match) return `${match[1].padStart(2, "0")}:${match[2]}`;
  return String(value);
};

const formatAngka = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  const num = Number(value);
  if (Number.isNaN(num)) return "-";
  return formatVolumeNumber(num);
};

const statusBadgeColor = (status) => {
  const value = String(status || "").toUpperCase();
  if (value === "TIBA") return "green";
  if (value === "VOLUME") return "purple";
  if (value === "BONGKAR") return "orange";
  if (value === "KIRIM") return "blue";
  if (value === "BATAL") return "red";
  return "gray";
};

const satuanOf = (item) =>
  item?.satuanVolume?.satuan || item?.suratJalan?.satuanVolume?.satuan || "";

const formatVolume = (value, satuan) => {
  if (value === null || value === undefined || value === "") return "-";
  const angka = formatAngka(value);
  return satuan ? `${angka} ${satuan}` : angka;
};

const Field = ({ label, children }) => (
  <Box>
    <Text fontSize="xs" color="gray.500">
      {label}
    </Text>
    <Text fontSize="sm" fontWeight="medium">
      {children}
    </Text>
  </Box>
);

const DECIMAL_INPUT_PATTERN = /^\d*[.,]?\d*$/;

const parseDecimalInput = (value) => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isNaN(value) ? null : value;
  let normalized = String(value).trim().replace(/\s/g, "");
  if (!normalized) return null;
  if (normalized.includes(",") && normalized.includes(".")) {
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  } else {
    normalized = normalized.replace(",", ".");
  }
  if (normalized === "." || normalized.endsWith(".")) {
    normalized = normalized.replace(/\.$/, "");
    if (!normalized) return null;
  }
  const num = parseFloat(normalized);
  return Number.isNaN(num) ? null : num;
};

const toDecimalInput = (value) => {
  if (value === null || value === undefined || value === "") return "";
  return String(value).replace(".", ",");
};

const handleDecimalFieldChange = (setFieldValue, name) => (event) => {
  const raw = event.target.value;
  if (raw === "" || DECIMAL_INPUT_PATTERN.test(raw)) {
    setFieldValue(name, raw.replace(".", ","));
  }
};

const decimalFieldSchema = (label) =>
  Yup.string()
    .required(`${label} wajib diisi`)
    .test("is-decimal", `${label} harus angka valid`, (value) => {
      const str = String(value ?? "").trim();
      if (!str) return false;
      if (/^\d+[.,]$/.test(str)) return true;
      const num = parseDecimalInput(str);
      return num !== null && num >= 0;
    });

const STATUS_BONGKAR = 5;
const STATUS_VOLUME = 6;

const calcVolumeAkhir = (volume, volumeAir) => {
  const vol = parseDecimalInput(volume);
  const air = parseDecimalInput(volumeAir);
  if (vol === null || air === null || air > vol) return null;
  return roundVolumeNumber(vol - air, 3);
};

const volumeAirSchema = decimalFieldSchema("Volume air").test(
  "lte-volume",
  "Volume air tidak boleh lebih besar dari volume",
  function (value) {
    const air = parseDecimalInput(value);
    const volume = parseDecimalInput(this.parent.volume);
    if (air === null || volume === null) return true;
    return air <= volume;
  },
);

const volumeSchema = Yup.number()
  .typeError("Volume harus angka")
  .positive("Volume harus lebih dari 0")
  .required("Volume wajib diisi");

const editVolumeSchema = Yup.object({
  nomor: Yup.string().trim().required("Nomor konfirmasi wajib diisi"),
  volume: volumeSchema,
  volumeAir: volumeAirSchema,
});

const editSchema = Yup.object({
  nomor: Yup.string().trim().required("Nomor konfirmasi wajib diisi"),
  tanggal: Yup.string().required("Tanggal wajib diisi"),
  catatan: Yup.string().nullable(),
  volume: volumeSchema,
  volumeAir: volumeAirSchema,
  api: decimalFieldSchema("API"),
  BSNW: decimalFieldSchema("BSNW"),
  SG: decimalFieldSchema("SG"),
  fotoLab: Yup.mixed()
    .nullable()
    .test("is-file", "Foto lab tidak valid", (value) => {
      if (!value) return true;
      return value instanceof File;
    }),
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

const buildEditValues = (item) => ({
  nomor: item?.nomor || "",
  tanggal: toDateInput(item?.tanggal),
  volume: item?.volume ?? "",
  volumeAir: toDecimalInput(item?.volumeAir),
  volumeAkhir: toDecimalInput(item?.volumeAkhir),
  catatan: item?.catatan || "",
  api: toDecimalInput(item?.api),
  BSNW: toDecimalInput(item?.BSNW),
  SG: toDecimalInput(item?.SG),
  fotoLab: null,
  fotoLabPreview: getImageUrl(item?.fotoLab) || "",
});

const editHanyaVolume = (item) =>
  item?.suratJalan?.statusSuratJalanId === STATUS_VOLUME;

const bisaEditKonfirmasi = (item, isPetugasKeamanan) =>
  !isPetugasKeamanan &&
  [STATUS_VOLUME, STATUS_BONGKAR].includes(item?.suratJalan?.statusSuratJalanId);

const FileUploadField = ({
  label,
  preview,
  onChange,
  error,
  touched,
  isRequired = false,
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
        onChange={(event) => {
          const file = event.target.files?.[0] || null;
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

function KonfirmasiPenerimaan() {
  const toast = useToast();
  const isPetugasKeamanan = useSelector(selectIsPetugasKeamananOnly);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();
  const [rows, setRows] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [page, setPage] = useState(0);
  const [totalPage, setTotalPage] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);

  const unduhBeritaAcara = async (item) => {
    try {
      const res = await axios.get(
        `${API_BASE}/pengiriman/get/cetak-konfirmasi/${item.id}`,
        { responseType: "blob" },
      );
      const url = window.URL.createObjectURL(
        new Blob([res.data], {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        getDownloadFileName(
          res.headers?.["content-disposition"],
          `berita-acara-pengukuran-${item.id}.docx`,
        ),
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast({
        title: "Berhasil",
        description: "Berita acara pengukuran minyak bumi berhasil diunduh",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Gagal",
        description: await readBlobError(
          err,
          "Gagal mengunduh berita acara pengukuran",
        ),
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE}/pengiriman/get/daftar-konfirmasi`,
        {
          params: {
            page,
            limit: LIMIT,
            search: search || undefined,
          },
        },
      );
      setRows(res.data.result || []);
      setTotalRows(res.data.totalRows || 0);
      setTotalPage(res.data.totalPage || 0);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error!",
        description:
          err.response?.data?.error ||
          "Gagal memuat daftar konfirmasi penerimaan",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, search]);

  const applySearch = (event) => {
    event.preventDefault();
    setPage(0);
    setSearch(searchInput.trim());
  };

  const openDetail = (item) => {
    setSelected(item);
    onOpen();
  };

  const openEdit = (item) => {
    if (!bisaEditKonfirmasi(item, isPetugasKeamanan)) {
      toast({
        title: "Tidak dapat diedit",
        description: isPetugasKeamanan
          ? "Petugas Keamanan tidak dapat mengubah konfirmasi penerimaan"
          : "Konfirmasi hanya dapat diedit saat status volume atau bongkar",
        status: "warning",
        duration: 4000,
        isClosable: true,
      });
      return;
    }
    setEditing(item);
    onEditOpen();
  };

  const closeEdit = () => {
    setEditing(null);
    onEditClose();
  };

  const submitEdit = async (values, { setSubmitting }) => {
    if (!editing?.id) {
      setSubmitting(false);
      return;
    }

    try {
      const hanyaVolume = editHanyaVolume(editing);
      const formData = new FormData();
      formData.append("tahap", hanyaVolume ? "edit-volume" : "edit");
      formData.append("nomor", values.nomor.trim());
      const volumeAkhir = calcVolumeAkhir(values.volume, values.volumeAir);
      if (volumeAkhir === null) {
        setSubmitting(false);
        toast({
          title: "Volume akhir tidak valid",
          description: "Volume air tidak boleh lebih besar dari volume",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }
      formData.append("volume", values.volume);
      formData.append("volumeAir", parseDecimalInput(values.volumeAir) ?? "");
      formData.append("volumeAkhir", volumeAkhir);
      if (!hanyaVolume) {
        formData.append("tanggal", values.tanggal);
        formData.append("catatan", values.catatan || "");
        formData.append("api", parseDecimalInput(values.api) ?? "");
        formData.append("BSNW", parseDecimalInput(values.BSNW) ?? "");
        formData.append("SG", parseDecimalInput(values.SG) ?? "");
        if (values.fotoLab instanceof File) {
          formData.append("fotoLab", values.fotoLab);
        }
      }

      const res = await axios.post(
        `${API_BASE}/pengiriman/edit/konfirmasi/${editing.id}`,
        formData,
      );
      const updated = res.data?.result;

      toast({
        title: "Berhasil",
        description: "Konfirmasi penerimaan berhasil diperbarui",
        status: "success",
        duration: 4000,
        isClosable: true,
      });

      if (updated && selected?.id === editing.id) {
        setSelected((prev) => ({ ...prev, ...updated }));
      }
      closeEdit();
      fetchData();
    } catch (err) {
      console.error(err);
      toast({
        title: "Error!",
        description:
          err.response?.data?.error ||
          "Gagal memperbarui konfirmasi penerimaan",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const statusLabel = (item) => item?.suratJalan?.statusSuratJalan?.status;

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
            gap={3}
            mb={6}
          >
            <VStack align={{ base: "center", sm: "start" }} spacing={1}>
              <Heading
                color="kpbpn"
                size={{ base: "md", md: "lg" }}
                textAlign={{ base: "center", sm: "left" }}
              >
                Daftar Konfirmasi Penerimaan
              </Heading>
              <Text fontSize="sm" color="gray.500">
                Total: {totalRows} data
              </Text>
            </VStack>
            <Spacer />
          </Flex>

          <Box as="form" onSubmit={applySearch} mb={6}>
            <HStack align="end" spacing={3} flexWrap="wrap">
              <FormControl maxW={{ base: "100%", md: "360px" }}>
                <FormLabel fontSize="sm">Cari</FormLabel>
                <Input
                  bgColor="terang"
                  placeholder="Nomor konfirmasi, surat jalan, atau mitra"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </FormControl>
              <Button type="submit" variant="primary">
                Cari
              </Button>
              {search && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setSearchInput("");
                    setSearch("");
                    setPage(0);
                  }}
                >
                  Reset
                </Button>
              )}
            </HStack>
          </Box>

          <Box display={{ base: "block", lg: "none" }}>
            {isLoading ? (
              <Stack spacing={4}>
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} height="140px" borderRadius="lg" />
                ))}
              </Stack>
            ) : rows.length === 0 ? (
              <Text textAlign="center" color="gray.500" py={8}>
                Belum ada data konfirmasi penerimaan
              </Text>
            ) : (
              <Stack spacing={4}>
                {rows.map((item, index) => (
                  <Box
                    key={item.id}
                    p={4}
                    borderRadius="lg"
                    border="1px solid"
                    borderColor="gray.200"
                    bg="white"
                  >
                    <HStack justify="space-between" mb={3}>
                      <VStack align="start" spacing={0}>
                        <Text fontSize="xs" color="gray.500">
                          No. {page * LIMIT + index + 1}
                        </Text>
                        <Text fontWeight="bold" color="kpbpn" fontSize="sm">
                          {item.nomor || "-"}
                        </Text>
                      </VStack>
                      <Badge colorScheme={statusBadgeColor(statusLabel(item))}>
                        {statusLabel(item) || "-"}
                      </Badge>
                    </HStack>
                    <SimpleGrid columns={2} spacing={3} mb={3}>
                      <Field label="Surat Jalan">
                        {item.suratJalan?.nomor || "-"}
                      </Field>
                      <Field label="Tanggal">{formatTanggal(item.tanggal)}</Field>
                      <Field label="Jam">{formatJam(item.jamKedatangan)}</Field>
                      <Field label="Mitra">
                        {item.suratJalan?.mitra?.nama || "-"}
                      </Field>
                      <Field label="Volume Surat Jalan">
                        {formatVolume(
                          item.suratJalan?.volume,
                          item.suratJalan?.satuanVolume?.satuan,
                        )}
                      </Field>
                      <Field label="Volume">
                        {formatVolume(item.volume, satuanOf(item))}
                      </Field>
                      <Field label="Tinggi Cairan (cm)">
                        {formatAngka(item.tinggiCairan)}
                      </Field>
                      <Field label="Volume Air">{formatAngka(item.volumeAir)}</Field>
                      <Field label="Volume Akhir">
                        {formatAngka(item.volumeAkhir)}
                      </Field>
                    </SimpleGrid>
                    <HStack>
                      <Button size="sm" variant="outline" onClick={() => openDetail(item)}>
                        Detail
                      </Button>
                      {bisaEditKonfirmasi(item, isPetugasKeamanan) && (
                        <Button
                          size="sm"
                          variant="outline"
                          colorScheme="yellow"
                          onClick={() => openEdit(item)}
                        >
                          Edit
                        </Button>
                      )}
                      {bisaUnduhBeritaAcara(item) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => unduhBeritaAcara(item)}
                        >
                          Unduh Berita Acara
                        </Button>
                      )}
                    </HStack>
                  </Box>
                ))}
              </Stack>
            )}
          </Box>

          <Box display={{ base: "none", lg: "block" }} overflowX="auto">
            <Table size="sm">
              <Thead bg="gray.50">
                <Tr>
                  <Th>No</Th>
                  <Th>Nomor Konfirmasi</Th>
                  <Th>Surat Jalan</Th>
                  <Th>Tanggal</Th>
                  <Th>Jam</Th>
                  <Th>Mitra</Th>
                  <Th>Status</Th>
                  <Th>Volume Surat Jalan</Th>
                  <Th>Volume</Th>
                  <Th>Tinggi Cairan (cm)</Th>
                  <Th>Volume Air</Th>
                  <Th>Volume Akhir</Th>
                  <Th>API</Th>
                  <Th>BSNW</Th>
                  <Th>Aksi</Th>
                </Tr>
              </Thead>
              <Tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <Tr key={index}>
                      <Td colSpan={15}>
                        <Skeleton height="24px" />
                      </Td>
                    </Tr>
                  ))
                ) : rows.length === 0 ? (
                  <Tr>
                    <Td colSpan={15} textAlign="center" py={8}>
                      Belum ada data konfirmasi penerimaan
                    </Td>
                  </Tr>
                ) : (
                  rows.map((item, index) => (
                    <Tr key={item.id}>
                      <Td>{page * LIMIT + index + 1}</Td>
                      <Td>{item.nomor || "-"}</Td>
                      <Td>
                        {item.suratJalan?.id ? (
                          <Text
                            as={RouterLink}
                            to={`/pengiriman-kpbpn/detail-surat-jalan/${item.suratJalan.id}`}
                            color="kpbpn"
                            fontWeight="semibold"
                          >
                            {item.suratJalan.nomor || "-"}
                          </Text>
                        ) : (
                          "-"
                        )}
                      </Td>
                      <Td>{formatTanggal(item.tanggal)}</Td>
                      <Td>{formatJam(item.jamKedatangan)}</Td>
                      <Td>{item.suratJalan?.mitra?.nama || "-"}</Td>
                      <Td>
                        <Badge colorScheme={statusBadgeColor(statusLabel(item))}>
                          {statusLabel(item) || "-"}
                        </Badge>
                      </Td>
                      <Td>
                        {formatVolume(
                          item.suratJalan?.volume,
                          item.suratJalan?.satuanVolume?.satuan,
                        )}
                      </Td>
                      <Td>{formatVolume(item.volume, satuanOf(item))}</Td>
                      <Td>{formatAngka(item.tinggiCairan)}</Td>
                      <Td>{formatAngka(item.volumeAir)}</Td>
                      <Td>{formatAngka(item.volumeAkhir)}</Td>
                      <Td>{formatAngka(item.api)}</Td>
                      <Td>{formatAngka(item.BSNW)}</Td>
                      <Td>
                        <HStack>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openDetail(item)}
                          >
                            Detail
                          </Button>
                          {bisaEditKonfirmasi(item, isPetugasKeamanan) && (
                            <Button
                              size="sm"
                              variant="outline"
                              colorScheme="yellow"
                              onClick={() => openEdit(item)}
                            >
                              Edit
                            </Button>
                          )}
                          {bisaUnduhBeritaAcara(item) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => unduhBeritaAcara(item)}
                            >
                              Unduh
                            </Button>
                          )}
                        </HStack>
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </Box>

          {!isLoading && totalRows > 0 && (
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
                Menampilkan {page * LIMIT + 1}–
                {Math.min((page + 1) * LIMIT, totalRows)} dari {totalRows} data
              </Text>
              <ReactPaginate
                previousLabel="←"
                nextLabel="→"
                pageCount={Math.max(totalPage, 1)}
                onPageChange={({ selected: nextPage }) => setPage(nextPage)}
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
            </Flex>
          )}
        </Container>
      </Box>

      <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Detail Konfirmasi Penerimaan</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selected && (
              <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
                <Field label="Nomor Konfirmasi">{selected.nomor || "-"}</Field>
                <Field label="Surat Jalan">
                  {selected.suratJalan?.nomor || "-"}
                </Field>
                <Field label="Tanggal">{formatTanggal(selected.tanggal)}</Field>
                <Field label="Jam Kedatangan">
                  {formatJam(selected.jamKedatangan)}
                </Field>
                <Field label="Mitra">
                  {selected.suratJalan?.mitra?.nama || "-"}
                </Field>
                <Field label="Status">{statusLabel(selected) || "-"}</Field>
                <Field label="Volume Surat Jalan">
                  {formatVolume(
                    selected.suratJalan?.volume,
                    selected.suratJalan?.satuanVolume?.satuan,
                  )}
                </Field>
                <Field label="Volume">
                  {formatVolume(selected.volume, satuanOf(selected))}
                </Field>
                <Field label="Tinggi Cairan (cm)">
                  {formatAngka(selected.tinggiCairan)}
                </Field>
                <Field label="Volume Air">{formatAngka(selected.volumeAir)}</Field>
                <Field label="Volume Akhir">
                  {formatAngka(selected.volumeAkhir)}
                </Field>
                <Field label="SG">{formatAngka(selected.SG)}</Field>
                <Field label="API">{formatAngka(selected.api)}</Field>
                <Field label="BSNW">{formatAngka(selected.BSNW)}</Field>
                <Field label="Petugas PK">{selected.userPK?.nama || "-"}</Field>
                <Field label="Petugas Lab">{selected.userLab?.nama || "-"}</Field>
                <Box gridColumn={{ sm: "span 2" }}>
                  <Field label="Catatan">{selected.catatan || "-"}</Field>
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.500" mb={1}>
                    Foto Bukti Penerimaan
                  </Text>
                  {selected.foto ? (
                    <Image
                      src={getImageUrl(selected.foto)}
                      alt="Foto bukti penerimaan"
                      maxH="180px"
                      objectFit="cover"
                      borderRadius="md"
                    />
                  ) : (
                    <Text fontSize="sm">-</Text>
                  )}
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.500" mb={1}>
                    Foto Lab
                  </Text>
                  {selected.fotoLab ? (
                    <Image
                      src={getImageUrl(selected.fotoLab)}
                      alt="Foto lab"
                      maxH="180px"
                      objectFit="cover"
                      borderRadius="md"
                    />
                  ) : (
                    <Text fontSize="sm">-</Text>
                  )}
                </Box>
              </SimpleGrid>
            )}
          </ModalBody>
          <ModalFooter gap={2} flexWrap="wrap">
            {bisaEditKonfirmasi(selected, isPetugasKeamanan) && (
              <Button
                variant="outline"
                colorScheme="yellow"
                onClick={() => openEdit(selected)}
              >
                Edit
              </Button>
            )}
            {bisaUnduhBeritaAcara(selected) && (
              <Button
                variant="outline"
                onClick={() => unduhBeritaAcara(selected)}
              >
                Unduh Berita Acara
              </Button>
            )}
            <Button variant="primary" onClick={onClose}>
              Tutup
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isEditOpen}
        onClose={closeEdit}
        size="xl"
        scrollBehavior="inside"
        isCentered
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Konfirmasi Penerimaan</ModalHeader>
          <ModalCloseButton />
          {editing && (
            <Box px={6} pb={2}>
              <Text fontSize="sm" color="gray.500">
                Surat jalan {editing.suratJalan?.nomor || "-"}
                {editHanyaVolume(editing)
                  ? ". Status masih volume, yang dapat diubah hanya nomor konfirmasi dan data volume."
                  : ""}
              </Text>
            </Box>
          )}
          <Formik
            initialValues={buildEditValues(editing)}
            enableReinitialize
            validationSchema={
              editHanyaVolume(editing) ? editVolumeSchema : editSchema
            }
            onSubmit={submitEdit}
          >
            {({
              values,
              errors,
              touched,
              setFieldValue,
              setFieldTouched,
              isSubmitting,
              handleChange,
              handleBlur,
              submitForm,
              validateForm,
              setTouched,
            }) => {
              const hanyaVolume = editHanyaVolume(editing);
              return (
              <Box as={Form} id="form-edit-konfirmasi">
                <ModalBody>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl
                      isInvalid={touched.nomor && errors.nomor}
                      gridColumn={{ md: "span 2" }}
                    >
                      <FormLabel>Nomor Konfirmasi</FormLabel>
                      <Input
                        name="nomor"
                        bgColor="terang"
                        value={values.nomor}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="Masukkan nomor konfirmasi"
                      />
                      <FormErrorMessage>{errors.nomor}</FormErrorMessage>
                    </FormControl>

                    {!hanyaVolume && (
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
                    )}

                    <FormControl>
                      <FormLabel>Tinggi Cairan (cm)</FormLabel>
                      <Input
                        isReadOnly
                        bgColor="gray.50"
                        value={formatAngka(editing?.tinggiCairan)}
                      />
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

                    {[
                      ["volumeAir", "Volume Air"],
                      ...(!hanyaVolume
                        ? [
                            ["api", "API"],
                            ["BSNW", "BSNW"],
                            ["SG", "SG"],
                          ]
                        : []),
                    ].map(([name, label]) => (
                      <FormControl
                        key={name}
                        isInvalid={touched[name] && errors[name]}
                      >
                        <FormLabel>{label}</FormLabel>
                        <Input
                          name={name}
                          type="text"
                          inputMode="decimal"
                          lang="id-ID"
                          autoComplete="off"
                          bgColor="terang"
                          value={values[name]}
                          onChange={handleDecimalFieldChange(
                            setFieldValue,
                            name,
                          )}
                          onBlur={handleBlur}
                          placeholder="Contoh: 0,5"
                        />
                        <FormErrorMessage>{errors[name]}</FormErrorMessage>
                      </FormControl>
                    ))}

                    <FormControl>
                      <FormLabel>Volume Akhir</FormLabel>
                      <Input
                        isReadOnly
                        bgColor="gray.50"
                        value={(() => {
                          const akhir = calcVolumeAkhir(
                            values.volume,
                            values.volumeAir,
                          );
                          return akhir == null ? "" : formatVolumeNumber(akhir);
                        })()}
                      />
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        Volume akhir = volume − volume air
                      </Text>
                    </FormControl>

                    {!hanyaVolume && (
                      <>
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
                            label="Foto Lab"
                            preview={values.fotoLabPreview}
                            touched={touched.fotoLab}
                            error={errors.fotoLab}
                            onChange={(file) => {
                              setFieldValue("fotoLab", file);
                              setFieldValue(
                                "fotoLabPreview",
                                file
                                  ? URL.createObjectURL(file)
                                  : getImageUrl(editing?.fotoLab) || "",
                              );
                              setFieldTouched("fotoLab", true);
                            }}
                          />
                        </Box>
                      </>
                    )}
                  </SimpleGrid>
                </ModalBody>
                <ModalFooter gap={2} flexWrap="wrap">
                  <Button variant="ghost" onClick={closeEdit}>
                    Batal
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    form="form-edit-konfirmasi"
                    isLoading={isSubmitting}
                    onClick={async (event) => {
                      event.preventDefault();
                      const formErrors = await validateForm();
                      setTouched(
                        editHanyaVolume(editing)
                          ? {
                              nomor: true,
                              volume: true,
                              volumeAir: true,
                            }
                          : {
                              nomor: true,
                              tanggal: true,
                              volume: true,
                              volumeAir: true,
                              api: true,
                              BSNW: true,
                              SG: true,
                            },
                      );
                      if (Object.keys(formErrors || {}).length) {
                        toast({
                          title: "Form belum lengkap",
                          description: "Periksa kembali isian yang wajib diisi",
                          status: "warning",
                          duration: 4000,
                          isClosable: true,
                        });
                        return;
                      }
                      await submitForm();
                    }}
                  >
                    Simpan Perubahan
                  </Button>
                </ModalFooter>
              </Box>
              );
            }}
          </Formik>
        </ModalContent>
      </Modal>
    </LayoutKPBPN>
  );
}

export default KonfirmasiPenerimaan;
