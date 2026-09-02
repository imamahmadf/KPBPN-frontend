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
  Container,
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
import { BsPencil, BsTrash, BsEyeFill } from "react-icons/bs";
import { Link as RouterLink } from "react-router-dom";
import LayoutKPBPN from "../../Componets/KPBPN/LayoutKPBPN";
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

const editSchema = createSchema.shape({
  pic: Yup.mixed().nullable(),
});

const formatTanggal = (d) =>
  d
    ? new Date(d).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "-";

function AdminSumurMinyak() {
  const toast = useToast();
  const dataListRef = useRef(null);

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
  const [editingSumur, setEditingSumur] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const scrollToDataList = () => {
    dataListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const changePage = ({ selected }) => {
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
          mitraId: mitraFilterId || undefined,
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
    fetchDataSumur();
  }, [page, limit, mitraFilterId, statusFilter, search]);

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
    setEditingSumur(null);
    onFormOpen();
  };

  const openEditSumur = (item) => {
    setEditingSumur(item);
    onFormOpen();
  };

  const closeFormModal = () => {
    setEditingSumur(null);
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
    setPage(0);
    setSearch(searchInput.trim());
  };

  const resetFilter = () => {
    setMitraFilterId("");
    setStatusFilter("");
    setSearchInput("");
    setSearch("");
    setPage(0);
  };

  return (
    <LayoutKPBPN>
      <Box bgColor="secondary" pb="40px" px="30px" minH="90vh">
        <Container variant="primary" p="30px" my="30px" minW="1000px">
          <HStack justify="space-between" mb={6}>
            <Heading color="kpbpn">Data Sumur Minyak</Heading>
            <Button variant="primary" onClick={openAddSumur}>
              + Tambah Sumur Minyak
            </Button>
          </HStack>

          <Box
            mb={6}
            p={4}
            borderWidth="1px"
            borderRadius="lg"
            bg="gray.50"
          >
            <HStack spacing={4} flexWrap="wrap" align="flex-end">
              <FormControl maxW="220px">
                <FormLabel fontSize="sm">Mitra</FormLabel>
                <Select
                  placeholder="Semua mitra"
                  value={mitraFilterId}
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

              <FormControl maxW="180px">
                <FormLabel fontSize="sm">Status Verifikasi</FormLabel>
                <Select
                  placeholder="Semua status"
                  value={statusFilter}
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
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleFilter()}
                />
              </FormControl>

              <Button variant="primary" onClick={handleFilter}>
                Terapkan
              </Button>
              <Button variant="ghost" onClick={resetFilter}>
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
                      <Th>Status</Th>
                      <Th>Tgl Verifikasi</Th>
                      <Th>Foto</Th>
                      <Th>Aksi</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {dataSumur.length === 0 ? (
                      <Tr>
                        <Td colSpan={10} textAlign="center" py={6}>
                          Belum ada data sumur minyak
                        </Td>
                      </Tr>
                    ) : (
                      dataSumur.map((item, index) => (
                        <Tr key={item.id}>
                          <Td>{page * limit + index + 1}</Td>
                          <Td fontWeight="medium">{item.nama || "-"}</Td>
                          <Td>{item.nomor || "-"}</Td>
                          <Td>{item.mitra?.nama || "-"}</Td>
                          <Td maxW="200px" isTruncated title={item.alamat}>
                            {item.alamat || "-"}
                          </Td>
                          <Td>
                            {item.produksiHarian != null
                              ? item.produksiHarian
                              : "-"}
                          </Td>
                          <Td>
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
                          </Td>
                          <Td>{formatTanggal(item.tanggalVerifikasi)}</Td>
                          <Td>
                            {item.foto ? (
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
                                as={RouterLink}
                                to={`/sumur/produksi-sumur/${item.id}`}
                                aria-label="Detail produksi sumur"
                                icon={<BsEyeFill />}
                                size="sm"
                                variant="ghost"
                                colorScheme="teal"
                              />
                              <IconButton
                                aria-label="Edit sumur minyak"
                                icon={<BsPencil />}
                                size="sm"
                                variant="ghost"
                                colorScheme="blue"
                                onClick={() => openEditSumur(item)}
                              />
                              <IconButton
                                aria-label="Hapus sumur minyak"
                                icon={<BsTrash />}
                                size="sm"
                                variant="ghost"
                                colorScheme="red"
                                onClick={() => openDeleteConfirm(item)}
                              />
                            </HStack>
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

      <Modal isOpen={isFormOpen} onClose={closeFormModal} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editingSumur ? "Edit Sumur Minyak" : "Tambah Sumur Minyak"}
          </ModalHeader>
          <ModalCloseButton />
          <Formik
            enableReinitialize
            initialValues={{
              nama: editingSumur?.nama || "",
              mitraId: editingSumur?.mitraId?.toString() || "",
              nomor: editingSumur?.nomor || "",
              statusVerifikasi: editingSumur?.statusVerifikasi || "belum",
              tanggalVerifikasi: editingSumur?.tanggalVerifikasi
                ? new Date(editingSumur.tanggalVerifikasi)
                    .toISOString()
                    .slice(0, 10)
                : "",
              longitude: editingSumur?.longitude?.toString() || "",
              latitude: editingSumur?.latitude?.toString() || "",
              alamat: editingSumur?.alamat || "",
              produksiHarian: editingSumur?.produksiHarian?.toString() || "",
              pic: null,
              picPreview: editingSumur?.foto
                ? getImageUrl(editingSumur.foto)
                : null,
            }}
            validationSchema={editingSumur ? editSchema : createSchema}
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

                if (editingSumur) {
                  await axios.post(
                    `${API_BASE}/sumur-minyak/edit/${editingSumur.id}`,
                    formData,
                    {
                      headers: { "Content-Type": "multipart/form-data" },
                    },
                  );
                  showSuccess("Sumur minyak berhasil diperbarui");
                } else {
                  await axios.post(`${API_BASE}/sumur-minyak/post`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                  });
                  showSuccess("Sumur minyak berhasil ditambahkan");
                }
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
                      >
                        {dataMitra.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.nama}
                          </option>
                        ))}
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
                      label={
                        editingSumur
                          ? "Foto Sumur (opsional)"
                          : "Foto Sumur *"
                      }
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
                    {editingSumur ? "Perbarui" : "Simpan"}
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
