import React, { useState, useEffect } from "react";
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
  useDisclosure,
  Spinner,
  Center,
  IconButton,
  Select,
  Badge,
} from "@chakra-ui/react";
import { BsPencil, BsTrash, BsDownload } from "react-icons/bs";
import LayoutKPBPN from "../../Componets/KPBPN/LayoutKPBPN";

const API_BASE = import.meta.env.VITE_REACT_APP_API_BASE_URL;

const JENIS_DOKUMEN_OPTIONS = [
  { value: "BAST", label: "BAST" },
  { value: "BABongkar", label: "BA Bongkar" },
  { value: "suratJalan", label: "Surat Jalan" },
];

const getJenisLabel = (jenis) =>
  JENIS_DOKUMEN_OPTIONS.find((item) => item.value === jenis)?.label || jenis;

const isDocxFile = (value) =>
  !value ||
  value.type ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const getTemplateSchema = (isEdit) =>
  Yup.object({
    nama: Yup.string().required("Nama template wajib diisi"),
    jenisDokumen: Yup.string()
      .oneOf(["BAST", "BABongkar", "suratJalan"], "Jenis dokumen tidak valid")
      .required("Jenis dokumen wajib dipilih"),
    status: Yup.string()
      .oneOf(["aktif", "nonaktif"], "Status tidak valid")
      .required("Status wajib dipilih"),
    file: Yup.mixed()
      .test("fileRequired", "File harus diunggah", (value) => isEdit || !!value)
      .test(
        "fileType",
        "Format file tidak valid. Harap unggah file .docx",
        isDocxFile,
      ),
  });

const TemplateKPBPN = () => {
  const toast = useToast();
  const [dataTemplate, setDataTemplate] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

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

  const fetchDataTemplate = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/template-kpbpn/get`);
      setDataTemplate(res.data.result || []);
    } catch (err) {
      toast({
        title: "Gagal memuat data",
        description: err.response?.data?.message || err.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDataTemplate();
  }, []);

  const handleDownload = async (filePath) => {
    try {
      const response = await axios.get(`${API_BASE}/template-kpbpn/download`, {
        params: { filePath },
        responseType: "blob",
      });

      const fileName = filePath.split("/").pop();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Gagal mengunduh",
        description:
          error.response?.data?.message || "Terjadi kesalahan saat mengunduh file",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const openTambahModal = () => {
    setEditingTemplate(null);
    setSelectedFile(null);
    onFormOpen();
  };

  const openEditModal = (item) => {
    setEditingTemplate(item);
    setSelectedFile(null);
    onFormOpen();
  };

  const closeFormModal = () => {
    setEditingTemplate(null);
    setSelectedFile(null);
    onFormClose();
  };

  const submitTemplate = async (values, { setSubmitting, resetForm }) => {
    const formData = new FormData();
    formData.append("nama", values.nama);
    formData.append("jenisDokumen", values.jenisDokumen);
    formData.append("status", values.status);
    if (values.file) {
      formData.append("file", values.file);
    }

    try {
      if (editingTemplate) {
        await axios.post(
          `${API_BASE}/template-kpbpn/edit/${editingTemplate.id}`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } },
        );
        toast({
          title: "Berhasil",
          description: "Template berhasil diperbarui",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        await axios.post(`${API_BASE}/template-kpbpn/upload`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast({
          title: "Berhasil",
          description: "Template berhasil ditambahkan",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }

      resetForm();
      setSelectedFile(null);
      closeFormModal();
      fetchDataTemplate();
    } catch (error) {
      toast({
        title: "Gagal menyimpan",
        description:
          error.response?.data?.message || "Terjadi kesalahan saat menyimpan template",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (item) => {
    const newStatus = item.status === "aktif" ? "nonaktif" : "aktif";

    try {
      await axios.patch(`${API_BASE}/template-kpbpn/status/${item.id}`, {
        status: newStatus,
      });
      toast({
        title: "Berhasil",
        description: `Status template diubah menjadi ${newStatus}`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      fetchDataTemplate();
    } catch (error) {
      toast({
        title: "Gagal mengubah status",
        description: error.response?.data?.message || error.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    }
  };

  const confirmDelete = (item) => {
    setDeleteTarget(item);
    onDeleteOpen();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      await axios.post(`${API_BASE}/template-kpbpn/delete/${deleteTarget.id}`);
      toast({
        title: "Berhasil",
        description: "Template berhasil dihapus",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onDeleteClose();
      setDeleteTarget(null);
      fetchDataTemplate();
    } catch (error) {
      toast({
        title: "Gagal menghapus",
        description: error.response?.data?.message || error.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <LayoutKPBPN>
      <Container maxW="container.xl" py={6}>
        <HStack justify="space-between" mb={6} flexWrap="wrap" gap={3}>
          <Box>
            <Heading size="lg">Template Dokumen KPBPN</Heading>
            <Text color="gray.600" mt={1}>
              Kelola template BAST, BA Bongkar, dan Surat Jalan. Template
              berstatus aktif dipakai saat dokumen dicetak atau diunduh.
            </Text>
          </Box>
          <Button variant="primary" onClick={openTambahModal}>
            + Tambah Template
          </Button>
        </HStack>

        <Box
          borderWidth="1px"
          borderRadius="lg"
          overflow="hidden"
          bg="white"
          boxShadow="sm"
        >
          {isLoading ? (
            <Center py={12}>
              <Spinner size="lg" color="kpbpn" />
            </Center>
          ) : dataTemplate.length > 0 ? (
            <Box overflowX="auto">
              <Table variant="simple">
                <Thead bg="gray.50">
                  <Tr>
                    <Th>No</Th>
                    <Th>Nama</Th>
                    <Th>Jenis Dokumen</Th>
                    <Th>Status</Th>
                    <Th>File</Th>
                    <Th textAlign="center">Aksi</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {dataTemplate.map((item, index) => (
                    <Tr key={item.id}>
                      <Td>{index + 1}</Td>
                      <Td fontWeight="medium">{item.nama}</Td>
                      <Td>{getJenisLabel(item.jenisDokumen)}</Td>
                      <Td>
                        <Badge
                          colorScheme={item.status === "aktif" ? "green" : "gray"}
                          cursor="pointer"
                          onClick={() => handleToggleStatus(item)}
                        >
                          {item.status}
                        </Badge>
                      </Td>
                      <Td>
                        <Button
                          size="sm"
                          variant="outline"
                          leftIcon={<BsDownload />}
                          onClick={() => handleDownload(item.template)}
                        >
                          Unduh
                        </Button>
                      </Td>
                      <Td>
                        <HStack justify="center" spacing={2}>
                          <IconButton
                            aria-label="Edit template"
                            icon={<BsPencil />}
                            size="sm"
                            variant="outline"
                            onClick={() => openEditModal(item)}
                          />
                          <IconButton
                            aria-label="Hapus template"
                            icon={<BsTrash />}
                            size="sm"
                            variant="outline"
                            colorScheme="red"
                            onClick={() => confirmDelete(item)}
                          />
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          ) : (
            <Center py={12}>
              <Text color="gray.500">Belum ada template dokumen</Text>
            </Center>
          )}
        </Box>
      </Container>

      <Modal isOpen={isFormOpen} onClose={closeFormModal} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editingTemplate ? "Edit Template" : "Tambah Template"}
          </ModalHeader>
          <ModalCloseButton />
          <Formik
            enableReinitialize
            initialValues={{
              nama: editingTemplate?.nama || "",
              jenisDokumen: editingTemplate?.jenisDokumen || "",
              status: editingTemplate?.status || "aktif",
              file: null,
            }}
            validationSchema={getTemplateSchema(!!editingTemplate)}
            onSubmit={submitTemplate}
          >
            {({ setFieldValue, isSubmitting, errors, touched, values }) => (
              <Form>
                <ModalBody>
                  <VStack spacing={4} align="stretch">
                    <FormControl isInvalid={errors.nama && touched.nama}>
                      <FormLabel>Nama Template</FormLabel>
                      <Input
                        name="nama"
                        placeholder="Contoh: Template BAST Mitra"
                        value={values.nama}
                        onChange={(e) => setFieldValue("nama", e.target.value)}
                      />
                      <FormErrorMessage>{errors.nama}</FormErrorMessage>
                    </FormControl>

                    <FormControl
                      isInvalid={errors.jenisDokumen && touched.jenisDokumen}
                    >
                      <FormLabel>Jenis Dokumen</FormLabel>
                      <Select
                        placeholder="Pilih jenis dokumen"
                        value={values.jenisDokumen}
                        onChange={(e) =>
                          setFieldValue("jenisDokumen", e.target.value)
                        }
                      >
                        {JENIS_DOKUMEN_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Select>
                      <FormErrorMessage>{errors.jenisDokumen}</FormErrorMessage>
                    </FormControl>

                    <FormControl isInvalid={errors.status && touched.status}>
                      <FormLabel>Status</FormLabel>
                      <Select
                        value={values.status}
                        onChange={(e) => setFieldValue("status", e.target.value)}
                      >
                        <option value="aktif">Aktif</option>
                        <option value="nonaktif">Nonaktif</option>
                      </Select>
                      <FormErrorMessage>{errors.status}</FormErrorMessage>
                    </FormControl>

                    <FormControl isInvalid={errors.file && touched.file}>
                      <FormLabel>
                        File Template (.docx)
                        {editingTemplate && (
                          <Text as="span" fontSize="sm" color="gray.500" ml={2}>
                            (kosongkan jika tidak diganti)
                          </Text>
                        )}
                      </FormLabel>
                      <Input
                        type="file"
                        accept=".docx"
                        p={1}
                        onChange={(event) => {
                          const file = event.currentTarget.files?.[0] || null;
                          setFieldValue("file", file);
                          setSelectedFile(file);
                        }}
                      />
                      <FormErrorMessage>{errors.file}</FormErrorMessage>
                    </FormControl>

                    {selectedFile && (
                      <Text fontSize="sm" color="gray.600">
                        File: {selectedFile.name}
                      </Text>
                    )}

                    {editingTemplate?.template && !selectedFile && (
                      <Text fontSize="sm" color="gray.500">
                        File saat ini: {editingTemplate.template.split("/").pop()}
                      </Text>
                    )}
                  </VStack>
                </ModalBody>
                <ModalFooter>
                  <Button variant="ghost" mr={3} onClick={closeFormModal}>
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
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

      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Hapus Template</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              Apakah Anda yakin ingin menghapus template{" "}
              <strong>{deleteTarget?.nama}</strong>?
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onDeleteClose}>
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

export default TemplateKPBPN;
