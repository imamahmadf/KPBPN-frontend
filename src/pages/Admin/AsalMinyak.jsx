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
} from "@chakra-ui/react";
import { BsPencil, BsTrash } from "react-icons/bs";
import LayoutKPBPN from "../../Componets/KPBPN/LayoutKPBPN";
import "../../Style/pagination.css";

const API_BASE = import.meta.env.VITE_REACT_APP_API_BASE_URL;

const asalMinyakSchema = Yup.object({
  nomor: Yup.string().trim().required("Nomor wajib diisi"),
  asal: Yup.string().trim().required("Asal wajib diisi"),
});

function AsalMinyak() {
  const toast = useToast();
  const dataListRef = useRef(null);

  const [dataAsalMinyak, setDataAsalMinyak] = useState([]);
  const [page, setPage] = useState(0);
  const [limit] = useState(20);
  const [pages, setPages] = useState(0);
  const [rows, setRows] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [editingAsal, setEditingAsal] = useState(null);
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

  const fetchDataAsalMinyak = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/asal-minyak/get`, {
        params: {
          page,
          limit,
          search: search || undefined,
        },
      });
      setDataAsalMinyak(res.data.result || []);
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
    fetchDataAsalMinyak();
  }, [page, limit, search]);

  const showSuccess = (message) => {
    toast({
      title: "Berhasil",
      description: message,
      status: "success",
      duration: 4000,
      isClosable: true,
    });
    fetchDataAsalMinyak();
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

  const openAddAsal = () => {
    setEditingAsal(null);
    onFormOpen();
  };

  const openEditAsal = (item) => {
    setEditingAsal(item);
    onFormOpen();
  };

  const closeFormModal = () => {
    setEditingAsal(null);
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
      await axios.post(`${API_BASE}/asal-minyak/delete/${deleteTarget.id}`);
      showSuccess("Asal minyak berhasil dihapus");
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
            <Heading color="kpbpn">Asal Minyak</Heading>
            <Button variant="primary" onClick={openAddAsal}>
              + Tambah Asal Minyak
            </Button>
          </HStack>

          <Box mb={6} p={4} borderWidth="1px" borderRadius="lg" bg="gray.50">
            <HStack spacing={4} flexWrap="wrap" align="flex-end">
              <FormControl maxW="320px">
                <FormLabel fontSize="sm">Cari</FormLabel>
                <Input
                  placeholder="Nomor atau asal..."
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
                      <Th>Nomor</Th>
                      <Th>Asal</Th>
                      <Th>Jumlah Surat Jalan</Th>
                      <Th>Aksi</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {dataAsalMinyak.length === 0 ? (
                      <Tr>
                        <Td colSpan={5} textAlign="center" py={6}>
                          Belum ada data asal minyak
                        </Td>
                      </Tr>
                    ) : (
                      dataAsalMinyak.map((item, index) => (
                        <Tr key={item.id}>
                          <Td>{page * limit + index + 1}</Td>
                          <Td fontWeight="medium">{item.nomor || "-"}</Td>
                          <Td>{item.asal || "-"}</Td>
                          <Td>{item.suratJalans?.length ?? 0}</Td>
                          <Td>
                            <HStack spacing={1}>
                              <IconButton
                                aria-label="Edit asal minyak"
                                icon={<BsPencil />}
                                size="sm"
                                variant="ghost"
                                colorScheme="blue"
                                onClick={() => openEditAsal(item)}
                              />
                              <IconButton
                                aria-label="Hapus asal minyak"
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
          <ModalHeader>
            {editingAsal ? "Edit Asal Minyak" : "Tambah Asal Minyak"}
          </ModalHeader>
          <ModalCloseButton />
          <Formik
            enableReinitialize
            initialValues={{
              nomor: editingAsal?.nomor || "",
              asal: editingAsal?.asal || "",
            }}
            validationSchema={asalMinyakSchema}
            onSubmit={async (values, { setSubmitting, resetForm }) => {
              try {
                const payload = {
                  nomor: values.nomor.trim(),
                  asal: values.asal.trim(),
                };

                if (editingAsal) {
                  await axios.post(
                    `${API_BASE}/asal-minyak/edit/${editingAsal.id}`,
                    payload,
                  );
                  showSuccess("Asal minyak berhasil diperbarui");
                } else {
                  await axios.post(`${API_BASE}/asal-minyak/post`, payload);
                  showSuccess("Asal minyak berhasil ditambahkan");
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
                    <FormControl isInvalid={touched.nomor && errors.nomor}>
                      <FormLabel>Nomor</FormLabel>
                      <Input
                        placeholder="Masukkan nomor"
                        value={values.nomor}
                        onChange={(e) => setFieldValue("nomor", e.target.value)}
                      />
                      <FormErrorMessage>{errors.nomor}</FormErrorMessage>
                    </FormControl>
                    <FormControl isInvalid={touched.asal && errors.asal}>
                      <FormLabel>Asal</FormLabel>
                      <Input
                        placeholder="Masukkan asal minyak"
                        value={values.asal}
                        onChange={(e) => setFieldValue("asal", e.target.value)}
                      />
                      <FormErrorMessage>{errors.asal}</FormErrorMessage>
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
                    {editingAsal ? "Perbarui" : "Simpan"}
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
              Apakah Anda yakin ingin menghapus asal minyak{" "}
              <Text as="span" fontWeight="bold">
                {[deleteTarget?.nomor, deleteTarget?.asal]
                  .filter(Boolean)
                  .join(" - ") || "-"}
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

export default AsalMinyak;
