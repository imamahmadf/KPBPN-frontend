import React, { useState, useEffect } from "react";
import {
  Box,
  Text,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Container,
  HStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Heading,
  Stack,
  Card,
  CardBody,
  CardHeader,
  Input,
  useToast,
  Badge,
  VStack,
  Divider,
  Spacer,
  useDisclosure,
  Flex,
  IconButton,
  Center,
  Alert,
  AlertIcon,
  Tooltip,
} from "@chakra-ui/react";
import axios from "axios";
import { useHistory } from "react-router-dom";
import Layout from "../../Componets/Layout";
import { useSelector } from "react-redux";
import { userRedux, selectRole } from "../../Redux/Reducers/auth";
import Loading from "../../Componets/Loading";
import { BsEyeFill } from "react-icons/bs";
import { BsPencilFill } from "react-icons/bs";
import { BsPlusCircle } from "react-icons/bs";
import { BsTrash } from "react-icons/bs";
import { BsBuilding } from "react-icons/bs";
import { BsFileEarmarkText } from "react-icons/bs";
import { BsCheckCircle, BsXCircle } from "react-icons/bs";
function IndukUnitKerjaAdmin() {
  const user = useSelector(userRedux);
  const role = useSelector(selectRole);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedItem, setSelectedItem] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const toast = useToast();
  const history = useHistory();

  // Fungsi untuk mengubah nilai edit
  const handleEditChange = (id, value) => {
    setEditValues((prev) => ({ ...prev, [id]: value }));
  };

  // Fungsi untuk mengambil data dari API
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_REACT_APP_API_BASE_URL}/induk-unit-kerja/get/${
          user[0].unitKerja_profile.indukUnitKerja.id
        }`
      );
      setData(response.data.result);
      console.log(response.data);
    } catch (err) {
      console.error("Gagal mengambil data:", err);
      toast({
        title: "Gagal mengambil data",
        description: err.response?.data?.message || err.message,
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
  }, []);

  // Fungsi untuk menangani klik tombol hapus
  const handleDeleteClick = (item) => {
    setSelectedItem(item);
    onOpen();
  };

  // Fungsi untuk menangani klik tombol edit
  const handleEditClick = (itemId, type, unitKerjaId = null) => {
    const uniqueId = `${type}-${unitKerjaId || "induk"}-${itemId}`;
    setEditingId(editingId === uniqueId ? null : uniqueId);

    // Set nilai awal saat memulai edit
    if (editingId !== uniqueId) {
      const item = findItemById(itemId, type, unitKerjaId);
      if (item) {
        handleEditChange(uniqueId, item.jabatan);
      }
    }
  };

  // Fungsi untuk mencari item berdasarkan ID
  const findItemById = (itemId, type, unitKerjaId) => {
    if (type === "ttdSuratTugas") {
      return data?.indukUnitKerja_ttdSuratTugas?.find(
        (item) => item.id === itemId
      );
    } else {
      const unit = data?.daftarUnitKerjas?.find((u) => u.id === unitKerjaId);
      if (!unit) return null;

      const items =
        type === "notaDinas"
          ? unit.unitKerja_notaDinas
          : type === "PPTK"
          ? unit.PPTKs
          : unit.KPAs;

      return items?.find((item) => item.id === itemId);
    }
  };

  // Fungsi untuk konfirmasi hapus data
  const confirmDelete = async () => {
    try {
      setIsLoading(true);
      let endpoint = "";
      let payload = {};

      // Tentukan endpoint berdasarkan jenis data
      if (selectedItem.type === "ttdSuratTugas") {
        endpoint = `induk-unit-kerja/delete/ttd-surat-tugas/${selectedItem.id}`;
        payload = { id: selectedItem.id };
      } else {
        endpoint = `induk-unit-kerja/delete/tanda-tangan`;
        payload = {
          id: selectedItem.id,
          type: selectedItem.type,
          unitKerjaId: selectedItem.unitKerjaId,
        };
      }

      // Kirim request delete ke API
      await axios.post(
        `${import.meta.env.VITE_REACT_APP_API_BASE_URL}/${endpoint}`,
        { data: payload }
      );

      // Refresh data setelah berhasil dihapus
      await fetchData();

      toast({
        title: "Data berhasil dihapus",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error("Gagal menghapus data:", err);
      toast({
        title: "Gagal menghapus data",
        description: err.response?.data?.message || err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  // Fungsi untuk menyimpan perubahan data
  const handleSaveEdit = async (item, field, newValue) => {
    try {
      setIsLoading(true);
      let endpoint = "";
      let payload = {};

      // Tentukan endpoint berdasarkan jenis data
      if (item.type === "ttdSuratTugas") {
        endpoint = "induk-unit-kerja/update/ttd-surat-tugas";
        payload = {
          id: item.id,
          [field]: newValue,
        };
      } else {
        endpoint = "induk-unit-kerja/update/tanda-tangan";
        payload = {
          id: item.id,
          type: item.type,
          unitKerjaId: item.unitKerjaId,
          [field]: newValue,
        };
      }

      // Kirim request update ke API
      await axios.post(
        `${import.meta.env.VITE_REACT_APP_API_BASE_URL}/${endpoint}`,
        payload
      );

      // Refresh data setelah berhasil diupdate
      await fetchData();

      toast({
        title: "Data berhasil diupdate",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setEditingId(null);
    } catch (err) {
      console.error("Gagal mengupdate data:", err);
      toast({
        title: "Gagal mengupdate data",
        description: err.response?.data?.message || err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Komponen untuk cell yang bisa di-edit
  const EditableCell = ({ value, isEditing, onChange }) => {
    return isEditing ? (
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        size="sm"
        autoFocus
      />
    ) : (
      <Text>{value}</Text>
    );
  };

  // Fungsi untuk render tabel
  const renderTable = (items, type, unitKerjaId) => {
    if (isLoading) {
      return (
        <Center py={8}>
          <Loading />
        </Center>
      );
    }
    if (!items || items.length === 0) {
      return (
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <Text>Tidak ada data tersedia</Text>
        </Alert>
      );
    }

    return (
      <Table variant={"primary"}>
        <Thead>
          <Tr>
            <Th width="50px">No</Th>
            <Th width="450px">Jabatan</Th>
            <Th>Nama Pegawai</Th>
            <Th width="150px">Aksi</Th>
          </Tr>
        </Thead>
        <Tbody>
          {items.map((item, index) => {
            const uniqueId = `${type}-${unitKerjaId || "induk"}-${item.id}`;
            const isEditing = editingId === uniqueId;
            const currentValue = isEditing
              ? editValues[uniqueId] || item.jabatan
              : item.jabatan;

            const handleSave = () => {
              handleSaveEdit(
                { ...item, type, unitKerjaId },
                "jabatan",
                editValues[uniqueId]
              );
            };

            const handleCancel = () => {
              setEditingId(null);
            };

            return (
              <Tr key={item.id}>
                <Td>{index + 1}</Td>
                <Td>
                  <EditableCell
                    value={currentValue}
                    isEditing={isEditing}
                    onChange={(value) => handleEditChange(uniqueId, value)}
                  />
                </Td>
                <Td>
                  {type === "notaDinas"
                    ? item.pegawai_notaDinas.nama
                    : type === "PPTK"
                    ? item.pegawai_PPTK.nama
                    : item.pegawai_KPA.nama}
                </Td>
                <Td>
                  {isEditing ? (
                    <HStack spacing={2}>
                      <Button
                        size="sm"
                        colorScheme="green"
                        onClick={handleSave}
                        isLoading={isLoading}
                        leftIcon={<BsCheckCircle />}
                      >
                        Simpan
                      </Button>
                      <Button
                        size="sm"
                        colorScheme="red"
                        onClick={handleCancel}
                        isDisabled={isLoading}
                        leftIcon={<BsXCircle />}
                      >
                        Batal
                      </Button>
                    </HStack>
                  ) : (
                    <HStack spacing={2}>
                      <Tooltip label="Edit" placement="top">
                        <IconButton
                          size="sm"
                          variant={"secondary"}
                          onClick={() =>
                            handleEditClick(item.id, type, unitKerjaId)
                          }
                          isDisabled={isLoading}
                          icon={<BsPencilFill />}
                          aria-label="Edit"
                        />
                      </Tooltip>
                      <Tooltip label="Hapus" placement="top">
                        <IconButton
                          size="sm"
                          variant={"cancle"}
                          onClick={() =>
                            handleDeleteClick({ ...item, type, unitKerjaId })
                          }
                          isDisabled={isLoading}
                          icon={<BsTrash />}
                          aria-label="Hapus"
                        />
                      </Tooltip>
                    </HStack>
                  )}
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    );
  };

  // Render komponen utama
  if (isLoading && !data) {
    return (
      <Layout>
        <Box bgColor={"secondary"} pb={"40px"} px={"30px"} minH="80vh">
          <Container
            maxW={"1280px"}
            variant={"primary"}
            pt={"30px"}
            px={"20px"}
            my={"30px"}
          >
            <Center py={20}>
              <Loading />
            </Center>
          </Container>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box bgColor={"secondary"} pb={"40px"} px={"30px"}>
        <Container
          maxW={"1280px"}
          variant={"primary"}
          pt={"30px"}
          px={"20px"}
          my={"30px"}
        >
          {/* Modal Konfirmasi Hapus */}
          <Modal isOpen={isOpen} onClose={onClose} isCentered>
            <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
            <ModalContent borderRadius="lg" maxW="500px">
              <ModalHeader fontSize="xl" color="gray.700">
                Konfirmasi Hapus Data
              </ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <VStack align="start" spacing={3}>
                  <Alert status="warning" borderRadius="md">
                    <AlertIcon />
                    <Text fontWeight="medium">
                      Apakah Anda yakin ingin menghapus data ini?
                    </Text>
                  </Alert>
                  {selectedItem && (
                    <Box
                      p={3}
                      bg="gray.50"
                      borderRadius="md"
                      w="100%"
                      borderLeft="4px solid"
                      borderColor="danger"
                    >
                      <Text fontSize="sm" color="gray.600" fontWeight="medium">
                        Data yang akan dihapus:
                      </Text>
                      <Text fontSize="sm" color="gray.700" mt={1}>
                        {selectedItem.jabatan || "Data ini"}
                      </Text>
                    </Box>
                  )}
                  <Text fontSize="sm" color="gray.600">
                    Tindakan ini tidak dapat dibatalkan.
                  </Text>
                </VStack>
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="ghost"
                  mr={3}
                  onClick={onClose}
                  isDisabled={isLoading}
                >
                  Batal
                </Button>
                <Button
                  colorScheme="red"
                  onClick={confirmDelete}
                  isLoading={isLoading}
                  leftIcon={<BsTrash />}
                >
                  Ya, Hapus
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>

          {/* Header Induk Unit Kerja */}
          {data && (
            <Card
              mb={6}
              bg="primary"
              color="white"
              borderRadius="lg"
              boxShadow="lg"
            >
              <CardBody>
                <HStack spacing={4} align="start">
                  <Box
                    bg="whiteAlpha.200"
                    p={4}
                    borderRadius="lg"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <BsBuilding size={32} />
                  </Box>
                  <VStack align="start" spacing={2} flex={1}>
                    <Heading size="lg" color="white">
                      {data?.indukUnitKerja}
                    </Heading>
                    <HStack spacing={4} flexWrap="wrap">
                      <Badge
                        colorScheme="blue"
                        fontSize="sm"
                        px={3}
                        py={1}
                        borderRadius="full"
                        bg="whiteAlpha.200"
                        color="white"
                      >
                        Kode: {data?.kodeInduk}
                      </Badge>
                      {data?.daftarUnitKerjas?.[0]?.asal && (
                        <Badge
                          fontSize="sm"
                          px={3}
                          py={1}
                          borderRadius="full"
                          bg="whiteAlpha.200"
                          color="white"
                        >
                          Asal: {data?.daftarUnitKerjas[0]?.asal}
                        </Badge>
                      )}
                    </HStack>
                  </VStack>
                </HStack>
              </CardBody>
            </Card>
          )}

          {/* Tabel Tanda Tangan Surat Tugas */}
          <Box mb={8}>
            <Flex mb={6} align="center">
              <HStack spacing={3}>
                <Box
                  bg="primary"
                  color="white"
                  p={2}
                  borderRadius="md"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <BsFileEarmarkText size={20} />
                </Box>
                <Heading size="md" color="gray.700">
                  Tanda Tangan Surat Tugas
                </Heading>
              </HStack>
              <Spacer />
              <Button
                variant={"primary"}
                onClick={() => {
                  history.push("/admin/ttd-surat-tugas");
                }}
                leftIcon={<BsPlusCircle />}
              >
                Tambah TTD Surat Tugas
              </Button>
            </Flex>
            {isLoading ? (
              <Center py={8}>
                <Loading />
              </Center>
            ) : !data?.indukUnitKerja_ttdSuratTugas ||
              data?.indukUnitKerja_ttdSuratTugas?.length === 0 ? (
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Text>Tidak ada data Tanda Tangan Surat Tugas</Text>
              </Alert>
            ) : (
              <Box overflowX="auto">
                <Table variant={"primary"}>
                  <Thead>
                    <Tr>
                      <Th width="50px">No</Th>
                      <Th>Nama</Th>
                      <Th width="550px">Jabatan</Th>
                      <Th width="150px">Aksi</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {data?.indukUnitKerja_ttdSuratTugas?.map((item, index) => {
                      const uniqueId = `ttdSuratTugas-induk-${item.id}`;
                      const isEditing = editingId === uniqueId;
                      const currentValue = isEditing
                        ? editValues[uniqueId] || item.jabatan
                        : item.jabatan;

                      const handleSave = () => {
                        handleSaveEdit(
                          { ...item, type: "ttdSuratTugas" },
                          "jabatan",
                          editValues[uniqueId]
                        );
                      };

                      const handleCancel = () => {
                        setEditingId(null);
                      };

                      return (
                        <Tr key={item.id}>
                          <Td>{index + 1}</Td>
                          <Td>{item.pegawai.nama}</Td>
                          <Td>
                            <EditableCell
                              value={currentValue}
                              isEditing={isEditing}
                              onChange={(value) =>
                                handleEditChange(uniqueId, value)
                              }
                            />
                          </Td>
                          <Td>
                            {isEditing ? (
                              <HStack spacing={2}>
                                <Button
                                  size="sm"
                                  colorScheme="green"
                                  onClick={handleSave}
                                  isLoading={isLoading}
                                  leftIcon={<BsCheckCircle />}
                                >
                                  Simpan
                                </Button>
                                <Button
                                  size="sm"
                                  colorScheme="red"
                                  onClick={handleCancel}
                                  isDisabled={isLoading}
                                  leftIcon={<BsXCircle />}
                                >
                                  Batal
                                </Button>
                              </HStack>
                            ) : (
                              <HStack spacing={2}>
                                <Tooltip label="Edit" placement="top">
                                  <IconButton
                                    size="sm"
                                    variant={"secondary"}
                                    onClick={() =>
                                      handleEditClick(item.id, "ttdSuratTugas")
                                    }
                                    isDisabled={isLoading}
                                    icon={<BsPencilFill />}
                                    aria-label="Edit"
                                  />
                                </Tooltip>
                                <Tooltip label="Hapus" placement="top">
                                  <IconButton
                                    size="sm"
                                    variant={"cancle"}
                                    onClick={() =>
                                      handleDeleteClick({
                                        ...item,
                                        type: "ttdSuratTugas",
                                      })
                                    }
                                    isDisabled={isLoading}
                                    icon={<BsTrash />}
                                    aria-label="Hapus"
                                  />
                                </Tooltip>
                              </HStack>
                            )}
                          </Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
              </Box>
            )}
          </Box>

          <Divider my={8} borderColor="gray.300" />

          {/* Daftar Unit Kerja */}
          <Box>
            <Flex mb={6} align="center">
              <HStack spacing={3}>
                <Box
                  bg="primary"
                  color="white"
                  p={2}
                  borderRadius="md"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <BsBuilding size={20} />
                </Box>
                <Heading size="md" color="gray.700">
                  Daftar Unit Kerja
                </Heading>
              </HStack>
            </Flex>
            {isLoading ? (
              <Center py={8}>
                <Loading />
              </Center>
            ) : !data?.daftarUnitKerjas ||
              data?.daftarUnitKerjas?.length === 0 ? (
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Text>Tidak ada data Unit Kerja</Text>
              </Alert>
            ) : (
              <Stack spacing={6}>
                {data?.daftarUnitKerjas?.map((unitKerja) => (
                  <Card
                    key={unitKerja.id}
                    variant="outline"
                    borderRadius="lg"
                    boxShadow="sm"
                    _hover={{ boxShadow: "md" }}
                    transition="all 0.2s"
                  >
                    <CardHeader
                      bg="primary"
                      borderTopRadius="lg"
                      borderBottomWidth="2px"
                      borderBottomColor="primaryGelap"
                    >
                      <HStack>
                        <Box color="white" flex={1}>
                          <Heading size="md" mb={2} color="white">
                            {unitKerja.unitKerja}
                          </Heading>
                          <HStack spacing={4} flexWrap="wrap">
                            <Badge
                              fontSize="sm"
                              px={3}
                              py={1}
                              borderRadius="full"
                              bg="whiteAlpha.200"
                              color="white"
                            >
                              Asal: {unitKerja.asal}
                            </Badge>
                            <Badge
                              fontSize="sm"
                              px={3}
                              py={1}
                              borderRadius="full"
                              bg="whiteAlpha.200"
                              color="white"
                            >
                              Kode: {unitKerja.kode}
                            </Badge>
                          </HStack>
                        </Box>
                        <Tooltip label="Kelola Unit Kerja" placement="top">
                          <IconButton
                            variant="primary"
                            colorScheme="whiteAlpha"
                            color="white"
                            borderColor="whiteAlpha.300"
                            _hover={{
                              bg: "whiteAlpha.200",
                              borderColor: "white",
                            }}
                            onClick={() => {
                              history.push(`/admin/unit-kerja/${unitKerja.id}`);
                            }}
                            icon={<BsEyeFill />}
                            aria-label="Kelola Unit Kerja"
                            size="md"
                          />
                        </Tooltip>
                      </HStack>
                    </CardHeader>
                    <CardBody p={6}>
                      {/* Tabel Nota Dinas */}
                      <Box mb={6}>
                        <HStack mb={3} spacing={2}>
                          <Box
                            bg="primary"
                            color="white"
                            p={1.5}
                            borderRadius="md"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <BsFileEarmarkText size={16} />
                          </Box>
                          <Heading size="sm" color="gray.700">
                            Nota Dinas
                          </Heading>
                        </HStack>
                        {renderTable(
                          unitKerja.unitKerja_notaDinas,
                          "notaDinas",
                          unitKerja.id
                        )}
                      </Box>

                      <Divider my={4} />

                      {/* Tabel PPTK */}
                      <Box mb={6}>
                        <HStack mb={3} spacing={2}>
                          <Box
                            bg="primary"
                            color="white"
                            p={1.5}
                            borderRadius="md"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <BsFileEarmarkText size={16} />
                          </Box>
                          <Heading size="sm" color="gray.700">
                            PPTK
                          </Heading>
                        </HStack>
                        {renderTable(unitKerja.PPTKs, "PPTK", unitKerja.id)}
                      </Box>

                      <Divider my={4} />

                      {/* Tabel KPA */}
                      <Box>
                        <HStack mb={3} spacing={2}>
                          <Box
                            bg="primary"
                            color="white"
                            p={1.5}
                            borderRadius="md"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <BsFileEarmarkText size={16} />
                          </Box>
                          <Heading size="sm" color="gray.700">
                            KPA
                          </Heading>
                        </HStack>
                        {renderTable(unitKerja.KPAs, "KPA", unitKerja.id)}
                      </Box>
                    </CardBody>
                  </Card>
                ))}
              </Stack>
            )}
          </Box>
        </Container>
      </Box>
    </Layout>
  );
}

export default IndukUnitKerjaAdmin;
