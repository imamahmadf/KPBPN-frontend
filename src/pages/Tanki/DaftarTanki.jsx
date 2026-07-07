import React, { useState, useEffect, useRef } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import axios from "axios";
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
  Image,
  useDisclosure,
  Spinner,
  Center,
  IconButton,
} from "@chakra-ui/react";
import { BsPencil, BsTrash } from "react-icons/bs";
import { AsyncSelect } from "chakra-react-select";
import LayoutKPBPN from "../../Componets/KPBPN/LayoutKPBPN";
import FotoPlaceholder from "../../assets/add_photo.png";

const API_BASE = import.meta.env.VITE_REACT_APP_API_BASE_URL;

const getImageUrl = (path) => (path ? `${API_BASE}${path}` : null);

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

const tankiSchema = Yup.object({
  kode: Yup.string().required("Kode tanki wajib diisi"),
  kapasitas: Yup.number()
    .typeError("Kapasitas harus angka")
    .positive("Kapasitas harus lebih dari 0")
    .required("Kapasitas wajib diisi"),
  factorTank: Yup.number()
    .typeError("Factor tank harus angka")
    .positive("Factor tank harus lebih dari 0")
    .integer("Factor tank harus bilangan bulat")
    .required("Factor tank wajib diisi"),
  unitKerjaId: Yup.mixed().nullable().required("Unit kerja wajib dipilih"),
  pic: Yup.mixed().nullable(),
});

const DaftarTanki = () => {
  const toast = useToast();
  const [dataTanki, setDataTanki] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [previewFoto, setPreviewFoto] = useState(null);
  const [editingTanki, setEditingTanki] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    isOpen: isTambahOpen,
    onOpen: onTambahOpen,
    onClose: onTambahClose,
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

  const fetchDataTanki = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/tanki/get/tanki`);
      setDataTanki(res.data.result || []);
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
    fetchDataTanki();
  }, []);

  const showSuccess = (message) => {
    toast({
      title: "Berhasil",
      description: message,
      status: "success",
      duration: 4000,
      isClosable: true,
    });
    fetchDataTanki();
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

  const openAddTanki = () => {
    setEditingTanki(null);
    onTambahOpen();
  };

  const openEditTanki = (item) => {
    setEditingTanki(item);
    onTambahOpen();
  };

  const closeTankiModal = () => {
    setEditingTanki(null);
    onTambahClose();
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
      await axios.post(`${API_BASE}/tanki/delete/tanki/${deleteTarget.id}`);
      showSuccess("Tanki berhasil dihapus");
      closeDeleteModal();
    } catch (err) {
      showError(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const loadUnitKerjaOptions = async (inputValue) => {
    try {
      const res = await axios.get(
        `${API_BASE}/admin/search/unit-kerja?q=${encodeURIComponent(inputValue || "")}`,
      );
      return (res.data.result || []).map((val) => ({
        value: val.id,
        label: val.unitKerja,
      }));
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  return (
    <LayoutKPBPN>
      <Box bgColor="secondary" pb="40px" px="30px" minH="90vh">
        <Container variant="primary" p="30px" my="30px" minW="1000px">
          <HStack justify="space-between" mb={6}>
            <Heading color="kpbpn">Daftar Tanki</Heading>
            <HStack spacing={4}>
              <Text fontSize="sm" color="gray.500">
                Total: {dataTanki.length} tanki
              </Text>
              <Button variant="primary" onClick={openAddTanki}>
                + Tambah Tanki
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
                    <Th>Kode</Th>
                    <Th>Unit Kerja</Th>
                    <Th>Kapasitas</Th>
                    <Th>Factor Tank</Th>
                    <Th>Foto</Th>
                    <Th>Aksi</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {dataTanki.length === 0 ? (
                    <Tr>
                      <Td colSpan={7} textAlign="center" py={6}>
                        Belum ada data tanki
                      </Td>
                    </Tr>
                  ) : (
                    dataTanki.map((item, index) => (
                      <Tr key={item.id}>
                        <Td>{index + 1}</Td>
                        <Td>{item.kode || "-"}</Td>
                        <Td>{item.daftarUnitKerja?.unitKerja || "-"}</Td>
                        <Td>{item.kapasitas ?? "-"}</Td>
                        <Td>{item.factorTank ?? "-"}</Td>
                        <Td>
                          {item.foto ? (
                            <Image
                              src={getImageUrl(item.foto)}
                              alt={item.kode}
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
                              aria-label="Edit tanki"
                              icon={<BsPencil />}
                              size="sm"
                              variant="ghost"
                              colorScheme="blue"
                              onClick={() => openEditTanki(item)}
                            />
                            <IconButton
                              aria-label="Hapus tanki"
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
        </Container>
      </Box>

      {/* Modal Tanki */}
      <Modal isOpen={isTambahOpen} onClose={closeTankiModal} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editingTanki ? "Edit Tanki" : "Tambah Tanki"}
          </ModalHeader>
          <ModalCloseButton />
          <Formik
            enableReinitialize
            initialValues={{
              kode: editingTanki?.kode || "",
              kapasitas: editingTanki?.kapasitas?.toString() || "",
              factorTank: editingTanki?.factorTank?.toString() || "",
              unitKerjaId: editingTanki?.unitKerjaId || null,
              unitKerjaLabel:
                editingTanki?.daftarUnitKerja?.unitKerja || "",
              pic: null,
              picPreview: editingTanki?.foto
                ? getImageUrl(editingTanki.foto)
                : null,
            }}
            validationSchema={tankiSchema}
            onSubmit={async (values, { setSubmitting, resetForm }) => {
              try {
                const formData = new FormData();
                formData.append("kode", values.kode);
                formData.append("kapasitas", values.kapasitas);
                formData.append("factorTank", values.factorTank);
                formData.append("unitKerjaId", values.unitKerjaId);
                if (values.pic) formData.append("pic", values.pic);

                if (editingTanki) {
                  await axios.post(
                    `${API_BASE}/tanki/edit/tanki/${editingTanki.id}`,
                    formData,
                    {
                      headers: { "Content-Type": "multipart/form-data" },
                    },
                  );
                  showSuccess("Tanki berhasil diperbarui");
                } else {
                  await axios.post(`${API_BASE}/tanki/post/tanki`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                  });
                  showSuccess("Tanki berhasil ditambahkan");
                }
                resetForm();
                closeTankiModal();
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
                    <FormControl isInvalid={touched.kode && errors.kode}>
                      <FormLabel>Kode Tanki</FormLabel>
                      <Input
                        name="kode"
                        value={values.kode}
                        onChange={(e) =>
                          setFieldValue("kode", e.target.value)
                        }
                      />
                      <FormErrorMessage>{errors.kode}</FormErrorMessage>
                    </FormControl>

                    <FormControl
                      isInvalid={touched.kapasitas && errors.kapasitas}
                    >
                      <FormLabel>Kapasitas (liter)</FormLabel>
                      <Input
                        name="kapasitas"
                        type="number"
                        value={values.kapasitas}
                        onChange={(e) =>
                          setFieldValue("kapasitas", e.target.value)
                        }
                      />
                      <FormErrorMessage>{errors.kapasitas}</FormErrorMessage>
                    </FormControl>

                    <FormControl
                      isInvalid={touched.factorTank && errors.factorTank}
                    >
                      <FormLabel>Factor Tank</FormLabel>
                      <Input
                        name="factorTank"
                        type="number"
                        value={values.factorTank}
                        onChange={(e) =>
                          setFieldValue("factorTank", e.target.value)
                        }
                      />
                      <FormErrorMessage>{errors.factorTank}</FormErrorMessage>
                    </FormControl>

                    <FormControl
                      isInvalid={touched.unitKerjaId && errors.unitKerjaId}
                    >
                      <FormLabel>Unit Kerja</FormLabel>
                      <AsyncSelect
                        placeholder="Cari unit kerja..."
                        cacheOptions
                        defaultOptions
                        loadOptions={loadUnitKerjaOptions}
                        value={
                          values.unitKerjaId
                            ? {
                                value: values.unitKerjaId,
                                label: values.unitKerjaLabel,
                              }
                            : null
                        }
                        onChange={(opt) => {
                          setFieldValue("unitKerjaId", opt?.value || null);
                          setFieldValue("unitKerjaLabel", opt?.label || "");
                        }}
                        chakraStyles={{
                          container: (provided) => ({
                            ...provided,
                            width: "100%",
                          }),
                          control: (provided) => ({
                            ...provided,
                            minHeight: "40px",
                          }),
                        }}
                      />
                      <FormErrorMessage>{errors.unitKerjaId}</FormErrorMessage>
                    </FormControl>

                    <FileUploadField
                      label="Foto Tanki"
                      preview={values.picPreview}
                      touched={touched.pic}
                      error={errors.pic}
                      onChange={(file) => {
                        setFieldValue("pic", file);
                        setFieldValue(
                          "picPreview",
                          file ? URL.createObjectURL(file) : null,
                        );
                      }}
                    />
                  </VStack>
                </ModalBody>
                <ModalFooter>
                  <Button variant="ghost" mr={3} onClick={closeTankiModal}>
                    Batal
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    isLoading={isSubmitting}
                  >
                    {editingTanki ? "Perbarui" : "Simpan"}
                  </Button>
                </ModalFooter>
              </Form>
            )}
          </Formik>
        </ModalContent>
      </Modal>

      {/* Modal Konfirmasi Hapus */}
      <Modal isOpen={isDeleteOpen} onClose={closeDeleteModal} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Konfirmasi Hapus</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              Apakah Anda yakin ingin menghapus tanki{" "}
              <Text as="span" fontWeight="bold">
                {deleteTarget?.kode || "-"}
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

      {/* Modal Preview Foto */}
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
};

export default DaftarTanki;
