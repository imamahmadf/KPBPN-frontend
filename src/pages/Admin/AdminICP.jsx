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
  useDisclosure,
  IconButton,
  Flex,
  Spinner,
  Center,
  Link,
} from "@chakra-ui/react";
import { BsPencil, BsTrash, BsDownload } from "react-icons/bs";
import LayoutKPBPN from "../../Componets/KPBPN/LayoutKPBPN";
import "../../Style/pagination.css";

const API_BASE = import.meta.env.VITE_REACT_APP_API_BASE_URL;

const ALLOWED_DOKUMEN_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
];

const isAllowedDokumen = (value) =>
  !value || ALLOWED_DOKUMEN_TYPES.includes(value.type);

const getIcpSchema = (isEdit) =>
  Yup.object({
    harga: Yup.string()
      .required("Harga wajib diisi")
      .test("is-number", "Harga harus angka valid", (value) => {
        const num = parseFloat(String(value || "").replace(",", "."));
        return Number.isFinite(num) && num >= 0;
      }),
    kursTengah: Yup.string()
      .required("Kurs tengah wajib diisi")
      .test("is-number", "Kurs tengah harus angka valid", (value) => {
        const num = parseFloat(String(value || "").replace(",", "."));
        return Number.isFinite(num) && num >= 0;
      }),
    bulan: Yup.string().required("Bulan wajib diisi"),
    dokumen: Yup.mixed()
      .test(
        "fileRequired",
        "Dokumen wajib diunggah",
        (value) => isEdit || !!value,
      )
      .test(
        "fileType",
        "Format dokumen tidak valid. Unggah PDF, Word, atau gambar",
        isAllowedDokumen,
      ),
  });

const formatBulan = (value) => {
  if (!value) return "-";
  const str = String(value);
  const d = /^\d{4}-\d{2}$/.test(str)
    ? new Date(`${str}-01T00:00:00`)
    : new Date(value);
  if (Number.isNaN(d.getTime())) return str;
  return d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
};

const toMonthInput = (value) => {
  if (!value) return "";
  const str = String(value);
  if (/^\d{4}-\d{2}$/.test(str)) return str;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const formatHarga = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return num.toLocaleString("id-ID", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  });
};

const getDokumenName = (filePath) => {
  if (!filePath) return "";
  return String(filePath).split("/").pop();
};

function AdminICP() {
  const toast = useToast();
  const dataListRef = useRef(null);

  const [dataIcp, setDataIcp] = useState([]);
  const [page, setPage] = useState(0);
  const [limit] = useState(20);
  const [pages, setPages] = useState(0);
  const [rows, setRows] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [editingIcp, setEditingIcp] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const scrollToDataList = () => {
    dataListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const changePage = ({ selected }) => {
    setPage(selected);
    scrollToDataList();
  };

  const fetchDataIcp = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/icp/get`, {
        params: {
          page,
          limit,
          search: search || undefined,
        },
      });
      setDataIcp(res.data.result || []);
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
    fetchDataIcp();
  }, [page, limit, search]);

  const showSuccess = (message) => {
    toast({
      title: "Berhasil",
      description: message,
      status: "success",
      duration: 4000,
      isClosable: true,
    });
    fetchDataIcp();
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

  const openAddIcp = () => {
    setEditingIcp(null);
    onFormOpen();
  };

  const openEditIcp = (item) => {
    setEditingIcp(item);
    onFormOpen();
  };

  const closeFormModal = () => {
    setEditingIcp(null);
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
      await axios.post(`${API_BASE}/icp/delete/${deleteTarget.id}`);
      showSuccess("Data ICP berhasil dihapus");
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
    setSearchInput("");
    setSearch("");
    setPage(0);
  };

  return (
    <LayoutKPBPN>
      <Box bgColor="secondary" pb="40px" px="30px" minH="90vh">
        <Container variant="primary" p="30px" my="30px" minW="1000px">
          <HStack justify="space-between" mb={6}>
            <Heading color="kpbpn">Data ICP</Heading>
            <Button variant="primary" onClick={openAddIcp}>
              + Tambah ICP
            </Button>
          </HStack>

          <Box mb={6} p={4} borderWidth="1px" borderRadius="lg" bg="gray.50">
            <HStack spacing={4} flexWrap="wrap" align="flex-end">
              <FormControl maxW="280px">
                <FormLabel fontSize="sm">Cari</FormLabel>
                <Input
                  placeholder="Harga, kurs tengah, atau bulan (YYYY-MM)..."
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
                      <Th>Bulan</Th>
                      <Th>Harga</Th>
                      <Th>Kurs Tengah</Th>
                      <Th>Dokumen</Th>
                      <Th>Aksi</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {dataIcp.length === 0 ? (
                      <Tr>
                        <Td colSpan={6} textAlign="center" py={6}>
                          Belum ada data ICP
                        </Td>
                      </Tr>
                    ) : (
                      dataIcp.map((item, index) => (
                        <Tr key={item.id}>
                          <Td>{page * limit + index + 1}</Td>
                          <Td fontWeight="medium">{formatBulan(item.bulan)}</Td>
                          <Td>{formatHarga(item.harga)}</Td>
                          <Td>{formatHarga(item.kursTengah)}</Td>
                          <Td>
                            {item.dokumen ? (
                              <Link
                                href={`${API_BASE}${item.dokumen}`}
                                isExternal
                                color="kpbpn"
                                fontWeight="medium"
                              >
                                {getDokumenName(item.dokumen)}
                              </Link>
                            ) : (
                              "-"
                            )}
                          </Td>
                          <Td>
                            <HStack spacing={1}>
                              {item.dokumen && (
                                <IconButton
                                  as="a"
                                  href={`${API_BASE}${item.dokumen}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  aria-label="Unduh dokumen ICP"
                                  icon={<BsDownload />}
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="teal"
                                />
                              )}
                              <IconButton
                                aria-label="Edit ICP"
                                icon={<BsPencil />}
                                size="sm"
                                variant="ghost"
                                colorScheme="blue"
                                onClick={() => openEditIcp(item)}
                              />
                              <IconButton
                                aria-label="Hapus ICP"
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

      <Modal isOpen={isFormOpen} onClose={closeFormModal} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editingIcp ? "Edit ICP" : "Tambah ICP"}</ModalHeader>
          <ModalCloseButton />
          <Formik
            enableReinitialize
            initialValues={{
              harga: editingIcp?.harga != null ? String(editingIcp.harga) : "",
              kursTengah:
                editingIcp?.kursTengah != null
                  ? String(editingIcp.kursTengah)
                  : "",
              bulan: toMonthInput(editingIcp?.bulan),
              dokumen: null,
            }}
            validationSchema={getIcpSchema(!!editingIcp)}
            onSubmit={async (values, { setSubmitting, resetForm }) => {
              try {
                const formData = new FormData();
                formData.append("harga", String(values.harga).replace(",", "."));
                formData.append(
                  "kursTengah",
                  String(values.kursTengah).replace(",", "."),
                );
                formData.append("bulan", values.bulan);
                if (values.dokumen) {
                  formData.append("dokumen", values.dokumen);
                }

                if (editingIcp) {
                  await axios.post(
                    `${API_BASE}/icp/edit/${editingIcp.id}`,
                    formData,
                    { headers: { "Content-Type": "multipart/form-data" } },
                  );
                  showSuccess("Data ICP berhasil diperbarui");
                } else {
                  await axios.post(`${API_BASE}/icp/post`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                  });
                  showSuccess("Data ICP berhasil ditambahkan");
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
            {({ values, errors, touched, setFieldValue, isSubmitting }) => (
              <Form>
                <ModalBody>
                  <VStack spacing={4}>
                    <FormControl isInvalid={touched.bulan && errors.bulan}>
                      <FormLabel>Bulan</FormLabel>
                      <Input
                        type="month"
                        value={values.bulan}
                        onChange={(e) => setFieldValue("bulan", e.target.value)}
                      />
                      <FormErrorMessage>{errors.bulan}</FormErrorMessage>
                    </FormControl>
                    <FormControl isInvalid={touched.harga && errors.harga}>
                      <FormLabel>Harga</FormLabel>
                      <Input
                        placeholder="Contoh: 78.6"
                        value={values.harga}
                        onChange={(e) => setFieldValue("harga", e.target.value)}
                      />
                      <FormErrorMessage>{errors.harga}</FormErrorMessage>
                    </FormControl>
                    <FormControl
                      isInvalid={touched.kursTengah && errors.kursTengah}
                    >
                      <FormLabel>Kurs Tengah</FormLabel>
                      <Input
                        placeholder="Contoh: 15450.25"
                        value={values.kursTengah}
                        onChange={(e) =>
                          setFieldValue("kursTengah", e.target.value)
                        }
                      />
                      <FormErrorMessage>{errors.kursTengah}</FormErrorMessage>
                    </FormControl>
                    <FormControl isInvalid={touched.dokumen && errors.dokumen}>
                      <FormLabel>
                        {editingIcp ? "Dokumen (opsional)" : "Dokumen"}
                      </FormLabel>
                      <Input
                        type="file"
                        accept=".pdf,.doc,.docx,image/png,image/jpeg"
                        pt={1}
                        onChange={(e) =>
                          setFieldValue("dokumen", e.target.files?.[0] || null)
                        }
                      />
                      {editingIcp?.dokumen && !values.dokumen && (
                        <Text fontSize="sm" color="gray.500" mt={2}>
                          Dokumen saat ini: {getDokumenName(editingIcp.dokumen)}
                        </Text>
                      )}
                      <FormErrorMessage>{errors.dokumen}</FormErrorMessage>
                    </FormControl>
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
                    {editingIcp ? "Perbarui" : "Simpan"}
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
              Apakah Anda yakin ingin menghapus data ICP bulan{" "}
              <Text as="span" fontWeight="bold">
                {formatBulan(deleteTarget?.bulan)}
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
    </LayoutKPBPN>
  );
}

export default AdminICP;
