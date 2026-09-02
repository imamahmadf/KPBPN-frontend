import React, { useState, useEffect, useRef } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import axios from "axios";
import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormHelperText,
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
  Select,
  SimpleGrid,
  Badge,
  Collapse,
} from "@chakra-ui/react";
import { BsTrash, BsChevronDown, BsChevronUp } from "react-icons/bs";
import LayoutKPBPN from "../../Componets/KPBPN/LayoutKPBPN";
import FotoPlaceholder from "../../assets/add_photo.png";

const API_BASE = import.meta.env.VITE_REACT_APP_API_BASE_URL;

const getImageUrl = (path) => (path ? `${API_BASE}${path}` : null);

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatAngka = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  const angka = Number(value);
  if (Number.isNaN(angka)) return String(value);
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 3,
    minimumFractionDigits: 0,
  }).format(angka);
};

const getTodayInputDate = () => new Date().toISOString().split("T")[0];

const ujiLabSchema = Yup.object({
  tangkiId: Yup.string().required("Tanki wajib dipilih"),
  tanggal: Yup.string().required("Tanggal wajib diisi"),
  api: Yup.number().typeError("API harus angka").required("API wajib diisi"),
  BSNW: Yup.number()
    .typeError("BSNW harus angka")
    .required("BSNW wajib diisi"),
  suhu: Yup.number().typeError("Suhu harus angka").required("Suhu wajib diisi"),
  sg: Yup.number().typeError("SG harus angka").required("SG wajib diisi"),
  kualitas: Yup.string()
    .oneOf(["ONSPEC", "OFFSPEC"], "Kualitas tidak valid")
    .required("Kualitas wajib dipilih"),
  pic: Yup.mixed().nullable(),
});

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

const getLatestUjiLab = (items) => items[0] || null;

const isSiapBABongkar = (uji) =>
  Boolean(uji && uji.kualitas === "ONSPEC" && !uji.BABongkarId);

const UjiLabK3S = () => {
  const toast = useToast();
  const [dataTanki, setDataTanki] = useState([]);
  const [dataUjiLab, setDataUjiLab] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [previewFoto, setPreviewFoto] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedIds, setExpandedIds] = useState([]);
  const [defaultTangkiId, setDefaultTangkiId] = useState("");

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

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [tankiRes, ujiRes] = await Promise.all([
        axios.get(`${API_BASE}/tanki/get/tanki`),
        axios.get(`${API_BASE}/tanki/get/uji-lab`),
      ]);
      setDataTanki(tankiRes.data.result || []);
      setDataUjiLab(ujiRes.data.result || []);
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
    fetchData();
  }, []);

  const groups = dataTanki.map((tank) => {
    const items = dataUjiLab.filter((item) => item.tangkiId === tank.id);
    return {
      tank,
      items,
      latest: getLatestUjiLab(items),
    };
  });

  const showPreview = (path) => {
    setPreviewFoto(getImageUrl(path));
    onPreviewOpen();
  };

  const openAddForm = (tangkiId = "") => {
    setDefaultTangkiId(tangkiId ? String(tangkiId) : "");
    onFormOpen();
  };

  const closeForm = () => {
    setDefaultTangkiId("");
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
      await axios.post(`${API_BASE}/tanki/delete/uji-lab/${deleteTarget.id}`);
      toast({
        title: "Berhasil",
        description: "Uji lab K3S berhasil dihapus",
        status: "success",
        duration: 4000,
        isClosable: true,
      });
      closeDeleteModal();
      fetchData();
    } catch (err) {
      toast({
        title: "Gagal menghapus",
        description: err.response?.data?.error || err.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
    );
  };

  return (
    <LayoutKPBPN>
      <Box bgColor="secondary" pb="40px" px="30px" minH="90vh">
        <Container variant="primary" p="30px" my="30px" minW="1100px">
          <HStack justify="space-between" mb={6}>
            <Box>
              <Heading color="kpbpn">Uji Lab K3S</Heading>
              <Text fontSize="sm" color="gray.500" mt={1}>
                Uji lab dilakukan per tanki. Jika OFFSPEC, lakukan pencampuran
                bahan kimia lalu uji ulang. BA Bongkar hanya dapat dibuat jika
                hasil terakhir ONSPEC.
              </Text>
            </Box>
            <Button variant="primary" onClick={() => openAddForm()}>
              + Tambah Uji Lab
            </Button>
          </HStack>

          {isLoading ? (
            <Center py={10}>
              <Spinner size="lg" color="kpbpn" />
            </Center>
          ) : (
            <VStack spacing={4} align="stretch">
              {groups.length === 0 ? (
                <Text color="gray.500">Belum ada data tanki</Text>
              ) : (
                groups.map((group) => {
                  const isExpanded = expandedIds.includes(group.tank.id);
                  const latest = group.latest;
                  const siapBA = isSiapBABongkar(latest);

                  return (
                    <Box
                      key={group.tank.id}
                      borderWidth="1px"
                      borderRadius="lg"
                      overflow="hidden"
                    >
                      <HStack
                        px={4}
                        py={3}
                        bg="gray.50"
                        justify="space-between"
                        align="center"
                      >
                        <HStack spacing={3}>
                          <IconButton
                            aria-label="Toggle riwayat"
                            icon={
                              isExpanded ? <BsChevronUp /> : <BsChevronDown />
                            }
                            size="xs"
                            variant="ghost"
                            onClick={() => toggleExpand(group.tank.id)}
                            isDisabled={!group.items.length}
                          />
                          <Text fontWeight="semibold">
                            Tanki {group.tank.kode}
                          </Text>
                          {latest ? (
                            <Badge
                              colorScheme={
                                latest.kualitas === "ONSPEC"
                                  ? "green"
                                  : "red"
                              }
                            >
                              {latest.kualitas}
                            </Badge>
                          ) : (
                            <Badge colorScheme="gray">Belum uji lab</Badge>
                          )}
                          {latest?.BABongkarId && (
                            <Badge colorScheme="orange">
                              Dipakai BA #{latest.BABongkarId}
                            </Badge>
                          )}
                          {siapBA && (
                            <Badge colorScheme="green" variant="outline">
                              Siap BA Bongkar
                            </Badge>
                          )}
                        </HStack>
                        <Button
                          size="sm"
                          colorScheme="orange"
                          variant="outline"
                          onClick={() => openAddForm(group.tank.id)}
                        >
                          Tambah Uji Lab
                        </Button>
                      </HStack>

                      <Collapse in={isExpanded} animateOpacity>
                        <Box p={4} bg="white">
                          {group.items.length === 0 ? (
                            <Text fontSize="sm" color="gray.500">
                              Belum ada riwayat uji lab
                            </Text>
                          ) : (
                            <Box overflowX="auto">
                              <Table size="sm">
                                <Thead bg="gray.50">
                                  <Tr>
                                    <Th>No</Th>
                                    <Th>Tanggal</Th>
                                    <Th>API</Th>
                                    <Th>BSNW</Th>
                                    <Th>Suhu</Th>
                                    <Th>SG</Th>
                                    <Th>Kualitas</Th>
                                    <Th>Foto</Th>
                                    <Th>Status</Th>
                                    <Th>Aksi</Th>
                                  </Tr>
                                </Thead>
                                <Tbody>
                                  {group.items.map((item, index) => (
                                    <Tr key={item.id}>
                                      <Td>{index + 1}</Td>
                                      <Td>
                                        {formatDate(
                                          item.tanggal || item.createdAt,
                                        )}
                                      </Td>
                                      <Td>{formatAngka(item.api)}</Td>
                                      <Td>{formatAngka(item.BSNW)}</Td>
                                      <Td>{formatAngka(item.suhu)}</Td>
                                      <Td>{formatAngka(item.sg)}</Td>
                                      <Td>
                                        <Badge
                                          colorScheme={
                                            item.kualitas === "ONSPEC"
                                              ? "green"
                                              : "red"
                                          }
                                        >
                                          {item.kualitas}
                                        </Badge>
                                      </Td>
                                      <Td>
                                        {item.foto ? (
                                          <Image
                                            src={getImageUrl(item.foto)}
                                            alt="Foto uji lab"
                                            boxSize="48px"
                                            objectFit="cover"
                                            borderRadius="md"
                                            cursor="pointer"
                                            onClick={() =>
                                              showPreview(item.foto)
                                            }
                                          />
                                        ) : (
                                          "-"
                                        )}
                                      </Td>
                                      <Td>
                                        {item.BABongkarId
                                          ? `BA #${item.BABongkarId}`
                                          : "Belum dipakai"}
                                      </Td>
                                      <Td>
                                        <IconButton
                                          aria-label="Hapus uji lab"
                                          icon={<BsTrash />}
                                          size="sm"
                                          variant="ghost"
                                          colorScheme="red"
                                          isDisabled={Boolean(
                                            item.BABongkarId,
                                          )}
                                          onClick={() =>
                                            openDeleteConfirm(item)
                                          }
                                        />
                                      </Td>
                                    </Tr>
                                  ))}
                                </Tbody>
                              </Table>
                            </Box>
                          )}
                        </Box>
                      </Collapse>
                    </Box>
                  );
                })
              )}
            </VStack>
          )}
        </Container>
      </Box>

      <Modal isOpen={isFormOpen} onClose={closeForm} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Tambah Uji Lab K3S</ModalHeader>
          <ModalCloseButton />
          <Formik
            enableReinitialize
            initialValues={{
              tangkiId: defaultTangkiId,
              tanggal: getTodayInputDate(),
              api: "",
              BSNW: "",
              suhu: "",
              sg: "",
              kualitas: "",
              pic: null,
              picPreview: null,
            }}
            validationSchema={ujiLabSchema}
            onSubmit={async (values, { setSubmitting, resetForm }) => {
              try {
                const formData = new FormData();
                formData.append("tangkiId", values.tangkiId);
                formData.append("tanggal", values.tanggal);
                formData.append("api", values.api);
                formData.append("BSNW", values.BSNW);
                formData.append("suhu", values.suhu);
                formData.append("sg", values.sg);
                formData.append("kualitas", values.kualitas);
                if (values.pic) formData.append("pic", values.pic);

                await axios.post(`${API_BASE}/tanki/post/uji-lab`, formData, {
                  headers: { "Content-Type": "multipart/form-data" },
                });

                toast({
                  title: "Berhasil",
                  description:
                    values.kualitas === "ONSPEC"
                      ? "Hasil ONSPEC. Tanki siap untuk BA Bongkar"
                      : "Hasil OFFSPEC. Lakukan pencampuran bahan kimia lalu uji ulang",
                  status: values.kualitas === "ONSPEC" ? "success" : "warning",
                  duration: 4000,
                  isClosable: true,
                });
                resetForm();
                closeForm();
                fetchData();
              } catch (err) {
                toast({
                  title: "Gagal menyimpan",
                  description: err.response?.data?.error || err.message,
                  status: "error",
                  duration: 4000,
                  isClosable: true,
                });
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
                    <FormControl
                      isRequired
                      isInvalid={touched.tangkiId && errors.tangkiId}
                    >
                      <FormLabel>Tanki</FormLabel>
                      <Select
                        placeholder="Pilih tanki"
                        value={values.tangkiId}
                        onChange={(e) =>
                          setFieldValue("tangkiId", e.target.value)
                        }
                      >
                        {dataTanki.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.kode}
                          </option>
                        ))}
                      </Select>
                      <FormErrorMessage>{errors.tangkiId}</FormErrorMessage>
                    </FormControl>

                    <FormControl
                      isRequired
                      isInvalid={touched.tanggal && errors.tanggal}
                    >
                      <FormLabel>Tanggal Uji</FormLabel>
                      <Input
                        type="date"
                        value={values.tanggal}
                        onChange={(e) =>
                          setFieldValue("tanggal", e.target.value)
                        }
                      />
                      <FormErrorMessage>{errors.tanggal}</FormErrorMessage>
                    </FormControl>

                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="100%">
                      <FormControl
                        isRequired
                        isInvalid={touched.api && errors.api}
                      >
                        <FormLabel>API</FormLabel>
                        <Input
                          type="number"
                          step="0.001"
                          value={values.api}
                          onChange={(e) => setFieldValue("api", e.target.value)}
                        />
                        <FormErrorMessage>{errors.api}</FormErrorMessage>
                      </FormControl>
                      <FormControl
                        isRequired
                        isInvalid={touched.BSNW && errors.BSNW}
                      >
                        <FormLabel>BSNW</FormLabel>
                        <Input
                          type="number"
                          step="0.001"
                          value={values.BSNW}
                          onChange={(e) =>
                            setFieldValue("BSNW", e.target.value)
                          }
                        />
                        <FormErrorMessage>{errors.BSNW}</FormErrorMessage>
                      </FormControl>
                      <FormControl
                        isRequired
                        isInvalid={touched.suhu && errors.suhu}
                      >
                        <FormLabel>Suhu</FormLabel>
                        <Input
                          type="number"
                          step="0.001"
                          value={values.suhu}
                          onChange={(e) =>
                            setFieldValue("suhu", e.target.value)
                          }
                        />
                        <FormErrorMessage>{errors.suhu}</FormErrorMessage>
                      </FormControl>
                      <FormControl
                        isRequired
                        isInvalid={touched.sg && errors.sg}
                      >
                        <FormLabel>SG</FormLabel>
                        <Input
                          type="number"
                          step="0.001"
                          value={values.sg}
                          onChange={(e) => setFieldValue("sg", e.target.value)}
                        />
                        <FormErrorMessage>{errors.sg}</FormErrorMessage>
                      </FormControl>
                    </SimpleGrid>

                    <FormControl
                      isRequired
                      isInvalid={touched.kualitas && errors.kualitas}
                    >
                      <FormLabel>Kualitas</FormLabel>
                      <Select
                        placeholder="Pilih kualitas"
                        value={values.kualitas}
                        onChange={(e) =>
                          setFieldValue("kualitas", e.target.value)
                        }
                      >
                        <option value="ONSPEC">ONSPEC</option>
                        <option value="OFFSPEC">OFFSPEC</option>
                      </Select>
                      {values.kualitas === "OFFSPEC" && (
                        <FormHelperText color="red.500">
                          Perlu pencampuran bahan kimia, lalu uji ulang
                        </FormHelperText>
                      )}
                      {values.kualitas === "ONSPEC" && (
                        <FormHelperText color="green.600">
                          Tanki siap untuk pembuatan BA Bongkar
                        </FormHelperText>
                      )}
                      <FormErrorMessage>{errors.kualitas}</FormErrorMessage>
                    </FormControl>

                    <FileUploadField
                      label="Foto Uji Lab"
                      preview={values.picPreview}
                      error={errors.pic}
                      touched={touched.pic}
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
                  <Button variant="outline" mr={3} onClick={closeForm}>
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

      <Modal isOpen={isPreviewOpen} onClose={onPreviewClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Foto Uji Lab</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {previewFoto && (
              <Image src={previewFoto} alt="Foto uji lab" w="100%" />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      <Modal isOpen={isDeleteOpen} onClose={closeDeleteModal} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Hapus Uji Lab</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            Hapus data uji lab ini? Tindakan ini tidak dapat dibatalkan.
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={closeDeleteModal}>
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

export default UjiLabK3S;
