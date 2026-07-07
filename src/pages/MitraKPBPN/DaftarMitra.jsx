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
  Divider,
  Badge,
  useDisclosure,
  IconButton,
} from "@chakra-ui/react";
import { BsPencil, BsTrash } from "react-icons/bs";
import LayoutKPBPN from "../../Componets/KPBPN/LayoutKPBPN";
import FotoPlaceholder from "../../assets/add_photo.png";

const API_BASE = import.meta.env.VITE_REACT_APP_API_BASE_URL;

const getImageUrl = (path) => (path ? `${API_BASE}${path}` : null);

const FileUploadField = ({
  label,
  name,
  preview,
  onChange,
  error,
  touched,
}) => {
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

const DaftarMitra = () => {
  const toast = useToast();
  const [dataMitra, setDataMitra] = useState([]);
  const [dataTransportir, setDataTransportir] = useState([]);
  const [dataJenisTransportir, setDataJenisTransportir] = useState([]);
  const [dataJenisMitra, setDataJenisMitra] = useState([]);
  const [dataSatuanVolume, setDataSatuanVolume] = useState([]);
  const [previewFoto, setPreviewFoto] = useState(null);
  const [editingMitra, setEditingMitra] = useState(null);
  const [editingTransportir, setEditingTransportir] = useState(null);
  const [editingSupir, setEditingSupir] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    isOpen: isMitraOpen,
    onOpen: onMitraOpen,
    onClose: onMitraClose,
  } = useDisclosure();
  const {
    isOpen: isTransportirOpen,
    onOpen: onTransportirOpen,
    onClose: onTransportirClose,
  } = useDisclosure();
  const {
    isOpen: isSupirOpen,
    onOpen: onSupirOpen,
    onClose: onSupirClose,
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

  const fetchDataMitra = async () => {
    try {
      const res = await axios.get(`${API_BASE}/mitra/get`);
      setDataMitra(res.data.resultMitra || []);
      setDataTransportir(res.data.resultTransportir || []);
      setDataJenisTransportir(res.data.resultJenisTransportir || []);
      setDataJenisMitra(res.data.resultJenisMitra || []);
      setDataSatuanVolume(res.data.resultSatuanVolume || []);
    } catch (err) {
      console.error(err);
      toast({
        title: "Gagal memuat data",
        description: err.response?.data?.error || err.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    fetchDataMitra();
  }, []);

  const allSupir = (dataMitra || []).flatMap((mitra) =>
    (mitra.supirs || []).map((supir) => ({
      ...supir,
      mitraNama: mitra.nama,
    })),
  );

  const showPreview = (path) => {
    setPreviewFoto(getImageUrl(path));
    onPreviewOpen();
  };

  const showSuccess = (message) => {
    toast({
      title: "Berhasil",
      description: message,
      status: "success",
      duration: 4000,
      isClosable: true,
    });
    fetchDataMitra();
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

  const openAddMitra = () => {
    setEditingMitra(null);
    onMitraOpen();
  };

  const openEditMitra = (item) => {
    setEditingMitra(item);
    onMitraOpen();
  };

  const closeMitraModal = () => {
    setEditingMitra(null);
    onMitraClose();
  };

  const openAddTransportir = () => {
    setEditingTransportir(null);
    onTransportirOpen();
  };

  const openEditTransportir = (item) => {
    setEditingTransportir(item);
    onTransportirOpen();
  };

  const closeTransportirModal = () => {
    setEditingTransportir(null);
    onTransportirClose();
  };

  const openAddSupir = () => {
    setEditingSupir(null);
    onSupirOpen();
  };

  const openEditSupir = (item) => {
    setEditingSupir(item);
    onSupirOpen();
  };

  const closeSupirModal = () => {
    setEditingSupir(null);
    onSupirClose();
  };

  const openDeleteConfirm = (type, item) => {
    setDeleteTarget({ type, item });
    onDeleteOpen();
  };

  const closeDeleteModal = () => {
    setDeleteTarget(null);
    onDeleteClose();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    const endpoints = {
      mitra: `/mitra/delete/${deleteTarget.item.id}`,
      transportir: `/mitra/delete/transportir/${deleteTarget.item.id}`,
      supir: `/mitra/delete/supir/${deleteTarget.item.id}`,
    };
    const labels = {
      mitra: "Mitra",
      transportir: "Transportir",
      supir: "Supir",
    };

    setIsDeleting(true);
    try {
      await axios.post(`${API_BASE}${endpoints[deleteTarget.type]}`);
      showSuccess(`${labels[deleteTarget.type]} berhasil dihapus`);
      closeDeleteModal();
    } catch (err) {
      showError(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const getDeleteLabel = () => {
    if (!deleteTarget) return "";
    const { type, item } = deleteTarget;
    if (type === "mitra") return `${item.kode} - ${item.nama}`;
    if (type === "transportir") return item.plat;
    return item.nama;
  };

  const mitraSchema = Yup.object({
    nama: Yup.string().required("Nama wajib diisi"),
    alamat: Yup.string().required("Alamat wajib diisi"),
    npwp: Yup.string().required("NPWP wajib diisi"),
    kontak: Yup.string().required("Kontak wajib diisi"),
    penanggungJawab: Yup.string().required("Penanggung jawab wajib diisi"),
    kode: Yup.string().required("Kode wajib diisi"),
    jenisMitraId: Yup.string().required("Jenis mitra wajib dipilih"),
  });

  const transportirSchema = Yup.object({
    plat: Yup.string().required("Plat nomor wajib diisi"),
    kapasitas: Yup.number()
      .typeError("Kapasitas harus angka")
      .positive("Kapasitas harus lebih dari 0")
      .required("Kapasitas wajib diisi"),
    jenisTransportirId: Yup.string().required(
      "Jenis transportir wajib dipilih",
    ),
    satuanVolumeId: Yup.string().required("Satuan volume wajib dipilih"),
    pic: Yup.mixed().nullable(),
  });

  const supirSchema = Yup.object({
    nama: Yup.string().required("Nama wajib diisi"),
    nik: Yup.string().required("NIK wajib diisi"),
    mitraId: Yup.string().required("Mitra wajib dipilih"),
    ktp: Yup.mixed().nullable(),
    foto: Yup.mixed().nullable(),
  });

  return (
    <LayoutKPBPN>
      <Box bgColor="secondary" pb="40px" px="30px" minH="90vh">
        <Container variant="primary" p="30px" my="30px" minW="1000px">
          <Heading color="kpbpn" mb={6}>
            Daftar Mitra KPBPN
          </Heading>

          {/* Mitra */}
          <Box mb={10}>
            <HStack justify="space-between" mb={4}>
              <Heading size="md" color="kpbpn">
                Mitra
              </Heading>
              <Button variant="primary" onClick={openAddMitra}>
                + Tambah Mitra
              </Button>
            </HStack>
            <Box overflowX="auto" borderWidth="1px" borderRadius="lg">
              <Table size="sm">
                <Thead bg="gray.50">
                  <Tr>
                    <Th>No</Th>
                    <Th>Kode</Th>
                    <Th>Jenis</Th>
                    <Th>Nama</Th>
                    <Th>Alamat</Th>
                    <Th>NPWP</Th>
                    <Th>Kontak</Th>
                    <Th>Penanggung Jawab</Th>
                    <Th>Jumlah Supir</Th>
                    <Th>Aksi</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {dataMitra.length === 0 ? (
                    <Tr>
                      <Td colSpan={10} textAlign="center" py={6}>
                        Belum ada data mitra
                      </Td>
                    </Tr>
                  ) : (
                    dataMitra.map((item, index) => (
                      <Tr key={item.id}>
                        <Td>{index + 1}</Td>
                        <Td>{item.kode}</Td>
                        <Td>{item?.jenisMitra?.jenis || "-"}</Td>
                        <Td>{item.nama}</Td>
                        <Td>{item.alamat}</Td>
                        <Td>{item.npwp}</Td>
                        <Td>{item.kontak}</Td>
                        <Td>{item.penanggungJawab}</Td>
                        <Td>
                          <Badge colorScheme="orange">
                            {(item.supirs || []).length} supir
                          </Badge>
                        </Td>
                        <Td>
                          <HStack spacing={1}>
                            <IconButton
                              aria-label="Edit mitra"
                              icon={<BsPencil />}
                              size="sm"
                              variant="ghost"
                              colorScheme="blue"
                              onClick={() => openEditMitra(item)}
                            />
                            <IconButton
                              aria-label="Hapus mitra"
                              icon={<BsTrash />}
                              size="sm"
                              variant="ghost"
                              colorScheme="red"
                              onClick={() => openDeleteConfirm("mitra", item)}
                            />
                          </HStack>
                        </Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </Table>
            </Box>
          </Box>

          <Divider my={8} />

          {/* Transportir */}
          <Box mb={10}>
            <HStack justify="space-between" mb={4}>
              <Heading size="md" color="kpbpn">
                Transportir
              </Heading>
              <Button variant="primary" onClick={openAddTransportir}>
                + Tambah Transportir
              </Button>
            </HStack>
            <Box overflowX="auto" borderWidth="1px" borderRadius="lg">
              <Table size="sm">
                <Thead bg="gray.50">
                  <Tr>
                    <Th>No</Th>
                    <Th>Plat Nomor</Th>
                    <Th>Kapasitas</Th>
                    <Th>Jenis</Th>
                    <Th>Foto</Th>
                    <Th>Aksi</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {dataTransportir.length === 0 ? (
                    <Tr>
                      <Td colSpan={6} textAlign="center" py={6}>
                        Belum ada data transportir
                      </Td>
                    </Tr>
                  ) : (
                    dataTransportir.map((item, index) => (
                      <Tr key={item.id}>
                        <Td>{index + 1}</Td>
                        <Td>{item.plat}</Td>
                        <Td>
                          {item.kapasitas}
                          {item?.satuanVolume?.satuan
                            ? ` ${item.satuanVolume.satuan}`
                            : ""}
                        </Td>
                        <Td>{item?.jenisTransportir?.jenis}</Td>
                        <Td>
                          {item.foto ? (
                            <Image
                              src={getImageUrl(item.foto)}
                              alt={item.plat}
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
                              aria-label="Edit transportir"
                              icon={<BsPencil />}
                              size="sm"
                              variant="ghost"
                              colorScheme="blue"
                              onClick={() => openEditTransportir(item)}
                            />
                            <IconButton
                              aria-label="Hapus transportir"
                              icon={<BsTrash />}
                              size="sm"
                              variant="ghost"
                              colorScheme="red"
                              onClick={() =>
                                openDeleteConfirm("transportir", item)
                              }
                            />
                          </HStack>
                        </Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </Table>
            </Box>
          </Box>

          <Divider my={8} />

          {/* Supir */}
          <Box>
            <HStack justify="space-between" mb={4}>
              <Heading size="md" color="kpbpn">
                Supir
              </Heading>
              <Button
                variant="primary"
                onClick={openAddSupir}
                isDisabled={dataMitra.length === 0}
              >
                + Tambah Supir
              </Button>
            </HStack>
            <Box overflowX="auto" borderWidth="1px" borderRadius="lg">
              <Table size="sm">
                <Thead bg="gray.50">
                  <Tr>
                    <Th>No</Th>
                    <Th>Nama</Th>
                    <Th>NIK</Th>
                    <Th>Mitra</Th>
                    <Th>KTP</Th>
                    <Th>Foto</Th>
                    <Th>Aksi</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {allSupir.length === 0 ? (
                    <Tr>
                      <Td colSpan={7} textAlign="center" py={6}>
                        Belum ada data supir
                      </Td>
                    </Tr>
                  ) : (
                    allSupir.map((item, index) => (
                      <Tr key={item.id}>
                        <Td>{index + 1}</Td>
                        <Td>{item.nama}</Td>
                        <Td>{item.nik}</Td>
                        <Td>{item.mitraNama}</Td>
                        <Td>
                          {item.ktp ? (
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => showPreview(item.ktp)}
                            >
                              Lihat KTP
                            </Button>
                          ) : (
                            "-"
                          )}
                        </Td>
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
                              aria-label="Edit supir"
                              icon={<BsPencil />}
                              size="sm"
                              variant="ghost"
                              colorScheme="blue"
                              onClick={() => openEditSupir(item)}
                            />
                            <IconButton
                              aria-label="Hapus supir"
                              icon={<BsTrash />}
                              size="sm"
                              variant="ghost"
                              colorScheme="red"
                              onClick={() => openDeleteConfirm("supir", item)}
                            />
                          </HStack>
                        </Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </Table>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Modal Mitra */}
      <Modal isOpen={isMitraOpen} onClose={closeMitraModal} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editingMitra ? "Edit Mitra" : "Tambah Mitra"}
          </ModalHeader>
          <ModalCloseButton />
          <Formik
            enableReinitialize
            initialValues={{
              nama: editingMitra?.nama || "",
              alamat: editingMitra?.alamat || "",
              npwp: editingMitra?.npwp || "",
              kontak: editingMitra?.kontak || "",
              penanggungJawab: editingMitra?.penanggungJawab || "",
              kode: editingMitra?.kode || "",
              jenisMitraId: editingMitra?.jenisMitraId?.toString() || "",
            }}
            validationSchema={mitraSchema}
            onSubmit={async (values, { setSubmitting, resetForm }) => {
              try {
                if (editingMitra) {
                  await axios.post(
                    `${API_BASE}/mitra/edit/${editingMitra.id}`,
                    values,
                  );
                  showSuccess("Mitra berhasil diperbarui");
                } else {
                  await axios.post(`${API_BASE}/mitra/post`, values);
                  showSuccess("Mitra berhasil ditambahkan");
                }
                resetForm();
                closeMitraModal();
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
              isSubmitting,
              handleChange,
              handleBlur,
              setFieldValue,
            }) => (
              <Form>
                <ModalBody>
                  <VStack spacing={4}>
                    <FormControl
                      isInvalid={touched.jenisMitraId && errors.jenisMitraId}
                    >
                      <FormLabel>Jenis Mitra</FormLabel>
                      <Select
                        placeholder="Pilih jenis mitra"
                        value={values.jenisMitraId}
                        onChange={(e) =>
                          setFieldValue("jenisMitraId", e.target.value)
                        }
                      >
                        {dataJenisMitra.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.jenis}
                          </option>
                        ))}
                      </Select>
                      <FormErrorMessage>
                        {errors.jenisMitraId}
                      </FormErrorMessage>
                    </FormControl>
                    {[
                      { name: "kode", label: "Kode" },
                      { name: "nama", label: "Nama Mitra" },
                      { name: "alamat", label: "Alamat" },
                      { name: "npwp", label: "NPWP" },
                      { name: "kontak", label: "Kontak" },
                      { name: "penanggungJawab", label: "Penanggung Jawab" },
                    ].map((field) => (
                      <FormControl
                        key={field.name}
                        isInvalid={touched[field.name] && errors[field.name]}
                      >
                        <FormLabel>{field.label}</FormLabel>
                        <Input
                          name={field.name}
                          value={values[field.name]}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        />
                        <FormErrorMessage>
                          {errors[field.name]}
                        </FormErrorMessage>
                      </FormControl>
                    ))}
                  </VStack>
                </ModalBody>
                <ModalFooter>
                  <Button variant="ghost" mr={3} onClick={closeMitraModal}>
                    Batal
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    isLoading={isSubmitting}
                  >
                    {editingMitra ? "Perbarui" : "Simpan"}
                  </Button>
                </ModalFooter>
              </Form>
            )}
          </Formik>
        </ModalContent>
      </Modal>

      {/* Modal Transportir */}
      <Modal isOpen={isTransportirOpen} onClose={closeTransportirModal} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editingTransportir ? "Edit Transportir" : "Tambah Transportir"}
          </ModalHeader>
          <ModalCloseButton />
          <Formik
            enableReinitialize
            initialValues={{
              plat: editingTransportir?.plat || "",
              kapasitas: editingTransportir?.kapasitas?.toString() || "",
              jenisTransportirId:
                editingTransportir?.jenisTransportirId?.toString() || "",
              satuanVolumeId:
                editingTransportir?.satuanVolumeId?.toString() || "",
              pic: null,
              picPreview: editingTransportir?.foto
                ? getImageUrl(editingTransportir.foto)
                : null,
            }}
            validationSchema={transportirSchema}
            onSubmit={async (values, { setSubmitting, resetForm }) => {
              try {
                const formData = new FormData();
                formData.append("plat", values.plat);
                formData.append("kapasitas", values.kapasitas);
                formData.append(
                  "jenisTransportirId",
                  values.jenisTransportirId,
                );
                formData.append("satuanVolumeId", values.satuanVolumeId);
                if (values.pic) formData.append("pic", values.pic);

                if (editingTransportir) {
                  await axios.post(
                    `${API_BASE}/mitra/edit/transportir/${editingTransportir.id}`,
                    formData,
                    {
                      headers: { "Content-Type": "multipart/form-data" },
                    },
                  );
                  showSuccess("Transportir berhasil diperbarui");
                } else {
                  await axios.post(
                    `${API_BASE}/mitra/post/transportir`,
                    formData,
                    {
                      headers: { "Content-Type": "multipart/form-data" },
                    },
                  );
                  showSuccess("Transportir berhasil ditambahkan");
                }
                resetForm();
                closeTransportirModal();
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
                    <FormControl isInvalid={touched.plat && errors.plat}>
                      <FormLabel>Plat Nomor</FormLabel>
                      <Input
                        name="plat"
                        value={values.plat}
                        onChange={(e) => setFieldValue("plat", e.target.value)}
                      />
                      <FormErrorMessage>{errors.plat}</FormErrorMessage>
                    </FormControl>
                    <FormControl
                      isInvalid={touched.kapasitas && errors.kapasitas}
                    >
                      <FormLabel>Kapasitas</FormLabel>
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
                      isInvalid={
                        touched.jenisTransportirId && errors.jenisTransportirId
                      }
                    >
                      <FormLabel>Jenis Transportir</FormLabel>
                      <Select
                        placeholder="Pilih jenis transportir"
                        value={values.jenisTransportirId}
                        onChange={(e) =>
                          setFieldValue("jenisTransportirId", e.target.value)
                        }
                      >
                        {dataJenisTransportir.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.jenis}
                          </option>
                        ))}
                      </Select>
                      <FormErrorMessage>
                        {errors.jenisTransportirId}
                      </FormErrorMessage>
                    </FormControl>
                    <FormControl
                      isInvalid={
                        touched.satuanVolumeId && errors.satuanVolumeId
                      }
                    >
                      <FormLabel>Satuan Volume</FormLabel>
                      <Select
                        placeholder="Pilih satuan volume"
                        value={values.satuanVolumeId}
                        onChange={(e) =>
                          setFieldValue("satuanVolumeId", e.target.value)
                        }
                      >
                        {dataSatuanVolume.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.satuan}
                          </option>
                        ))}
                      </Select>
                      <FormErrorMessage>
                        {errors.satuanVolumeId}
                      </FormErrorMessage>
                    </FormControl>

                    <FileUploadField
                      label="Foto Kendaraan"
                      name="pic"
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
                  <Button variant="ghost" mr={3} onClick={closeTransportirModal}>
                    Batal
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    isLoading={isSubmitting}
                  >
                    {editingTransportir ? "Perbarui" : "Simpan"}
                  </Button>
                </ModalFooter>
              </Form>
            )}
          </Formik>
        </ModalContent>
      </Modal>

      {/* Modal Supir */}
      <Modal isOpen={isSupirOpen} onClose={closeSupirModal} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editingSupir ? "Edit Supir" : "Tambah Supir"}
          </ModalHeader>
          <ModalCloseButton />
          <Formik
            enableReinitialize
            initialValues={{
              nama: editingSupir?.nama || "",
              nik: editingSupir?.nik || "",
              mitraId: editingSupir?.mitraId?.toString() || "",
              ktp: null,
              foto: null,
              ktpPreview: editingSupir?.ktp
                ? getImageUrl(editingSupir.ktp)
                : null,
              fotoPreview: editingSupir?.foto
                ? getImageUrl(editingSupir.foto)
                : null,
            }}
            validationSchema={supirSchema}
            onSubmit={async (values, { setSubmitting, resetForm }) => {
              try {
                const formData = new FormData();
                formData.append("nama", values.nama);
                formData.append("nik", values.nik);
                formData.append("mitraId", values.mitraId);
                if (values.ktp) formData.append("ktp", values.ktp);
                if (values.foto) formData.append("foto", values.foto);

                if (editingSupir) {
                  await axios.post(
                    `${API_BASE}/mitra/edit/supir/${editingSupir.id}`,
                    formData,
                    {
                      headers: { "Content-Type": "multipart/form-data" },
                    },
                  );
                  showSuccess("Supir berhasil diperbarui");
                } else {
                  await axios.post(`${API_BASE}/mitra/post/supir`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                  });
                  showSuccess("Supir berhasil ditambahkan");
                }
                resetForm();
                closeSupirModal();
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
                    <FormControl isInvalid={touched.nama && errors.nama}>
                      <FormLabel>Nama Supir</FormLabel>
                      <Input
                        name="nama"
                        value={values.nama}
                        onChange={(e) => setFieldValue("nama", e.target.value)}
                      />
                      <FormErrorMessage>{errors.nama}</FormErrorMessage>
                    </FormControl>
                    <FormControl isInvalid={touched.nik && errors.nik}>
                      <FormLabel>NIK</FormLabel>
                      <Input
                        name="nik"
                        value={values.nik}
                        onChange={(e) => setFieldValue("nik", e.target.value)}
                      />
                      <FormErrorMessage>{errors.nik}</FormErrorMessage>
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
                        {dataMitra.map((mitra) => (
                          <option key={mitra.id} value={mitra.id}>
                            {mitra.kode} - {mitra.nama}
                          </option>
                        ))}
                      </Select>
                      <FormErrorMessage>{errors.mitraId}</FormErrorMessage>
                    </FormControl>
                    <FileUploadField
                      label="Foto KTP"
                      name="ktp"
                      preview={values.ktpPreview}
                      touched={touched.ktp}
                      error={errors.ktp}
                      onChange={(file) => {
                        setFieldValue("ktp", file);
                        setFieldValue(
                          "ktpPreview",
                          file ? URL.createObjectURL(file) : null,
                        );
                      }}
                    />
                    <FileUploadField
                      label="Foto Supir"
                      name="foto"
                      preview={values.fotoPreview}
                      touched={touched.foto}
                      error={errors.foto}
                      onChange={(file) => {
                        setFieldValue("foto", file);
                        setFieldValue(
                          "fotoPreview",
                          file ? URL.createObjectURL(file) : null,
                        );
                      }}
                    />
                  </VStack>
                </ModalBody>
                <ModalFooter>
                  <Button variant="ghost" mr={3} onClick={closeSupirModal}>
                    Batal
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    isLoading={isSubmitting}
                  >
                    {editingSupir ? "Perbarui" : "Simpan"}
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
              Apakah Anda yakin ingin menghapus{" "}
              <Text as="span" fontWeight="bold">
                {getDeleteLabel()}
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
            {previewFoto && (
              <Image
                src={previewFoto}
                alt="Preview"
                w="100%"
                maxH="70vh"
                objectFit="contain"
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </LayoutKPBPN>
  );
};

export default DaftarMitra;
