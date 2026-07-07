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
  FormControl,
  FormLabel,
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
  Checkbox,
  Flex,
  Center,
} from "@chakra-ui/react";
import axios from "axios";
import { Link, useHistory } from "react-router-dom";
import Layout from "../../Componets/Layout";
import { useSelector } from "react-redux";
import { userRedux, selectRole } from "../../Redux/Reducers/auth";
import Loading from "../../Componets/Loading";
import TambahUnitKerja from "../../Componets/TambahUnitKerja";

function DetailIndukUnitKerja(props) {
  const [data, setData] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    unitKerja: "",
    kode: "",
    asal: "",
  });
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editIndukForm, setEditIndukForm] = useState({
    indukUnitKerja: "",
    kodeInduk: "",
  });
  const toast = useToast();
  const user = useSelector(userRedux);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const [unitKerjaIdToDelete, setUnitKerjaIdToDelete] = useState(null);
  const [tahunHapus, setTahunHapus] = useState(
    new Date().getFullYear().toString()
  );

  async function fetchDataIndukUnitKerja() {
    try {
      const res = await axios.get(
        `${
          import.meta.env.VITE_REACT_APP_API_BASE_URL
        }/induk-unit-kerja/get/detail/${props.match.params.id}`
      );
      setData(res.data.result);
      console.log(res.data.result);
      setIsLoading(false);
    } catch (err) {
      console.error(err);
      setError("Gagal memuat data pegawai");
    } finally {
    }
  }
  //   if (loading) {
  //     return (
  //       <Layout>
  //         <Loading />
  //       </Layout>
  //     );
  //   }
  if (error) {
    return (
      <Layout>
        <Center pt="80px" h="100vh">
          <Text color="red.500">{error}</Text>
        </Center>
      </Layout>
    );
  }
  useEffect(() => {
    fetchDataIndukUnitKerja();
  }, []);

  const handleEdit = (item) => {
    setEditingId(item.id);
    setEditForm({
      unitKerja: item.unitKerja,
      kode: item.kode,
      asal: item.asal,
    });
  };

  const handleSave = async (id) => {
    try {
      const response = await axios.post(
        `${
          import.meta.env.VITE_REACT_APP_API_BASE_URL
        }/induk-unit-kerja/edit/unit-kerja/${id}`,
        editForm
      );

      // Update data lokal
      setData((prevData) => ({
        ...prevData,
        daftarUnitKerjas: prevData.daftarUnitKerjas.map((item) =>
          item.id === id ? { ...item, ...editForm } : item
        ),
      }));

      setEditingId(null);
      toast({
        title: "Berhasil",
        description: "Data berhasil diperbarui",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memperbarui data",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const handleEditInduk = () => {
    setEditIndukForm({
      indukUnitKerja: data?.indukUnitKerja,
      kodeInduk: data?.kodeInduk,
      asal: data?.daftarUnitKerjas[0]?.asal,
    });
    onOpen();
  };

  const handleSaveInduk = async () => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_REACT_APP_API_BASE_URL}/induk-unit-kerja/edit/${
          props.match.params.id
        }`,
        editIndukForm
      );

      setData((prevData) => ({
        ...prevData,
        ...editIndukForm,
      }));

      onClose();
      toast({
        title: "Berhasil",
        description: "Data induk unit kerja berhasil diperbarui",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memperbarui data induk unit kerja",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeletePerjalanan = (unitKerjaId) => {
    setUnitKerjaIdToDelete(unitKerjaId);
    setTahunHapus(new Date().getFullYear().toString());
    onDeleteOpen();
  };

  const handleCloseDeleteModal = () => {
    setTahunHapus(new Date().getFullYear().toString());
    setUnitKerjaIdToDelete(null);
    onDeleteClose();
  };

  const confirmDeletePerjalanan = async () => {
    if (!tahunHapus || tahunHapus.trim() === "") {
      toast({
        title: "Error",
        description: "Tahun harus diisi",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsLoading(true);
      await axios.post(
        `${
          import.meta.env.VITE_REACT_APP_API_BASE_URL
        }/admin/delete/perjalanan-by-unitkerja/${unitKerjaIdToDelete}`,
        {
          tahun: parseInt(tahunHapus),
        }
      );

      toast({
        title: "Berhasil",
        description: `Data perjalanan tahun ${tahunHapus} berhasil dihapus`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      handleCloseDeleteModal();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Gagal menghapus data perjalanan",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      {isLoading ? (
        <Loading />
      ) : (
        <Box pb={"40px"} px={"30px"}>
          <Container variant={"primary"} maxW={"1280px"} p={"30px"} my={"30px"}>
            <VStack align="start" spacing={2} mb={6} px={4}>
              <Flex justify="space-between" width="100%" align="center">
                <Heading size="lg">{data?.indukUnitKerja}</Heading>
                <Button colorScheme="blue" onClick={handleEditInduk}>
                  Edit Induk Unit Kerja
                </Button>
              </Flex>
              <Badge colorScheme="blue" fontSize="md">
                Kode: {data?.kodeInduk}
              </Badge>
              <Text>Asal: {data?.daftarUnitKerjas[0]?.asal}</Text>
              <Flex gap={2} align="center">
                <Text>Sumber Dana: </Text>
                {data?.indukUKSumberDanas?.map((item, index) => (
                  <Badge key={index}>{item.sumberDana.sumber}</Badge>
                ))}
              </Flex>
            </VStack>
            <TambahUnitKerja
              indukUnitKerjaId={user[0].unitKerja_profile.indukUnitKerja.id}
            />
            <Table variant={"primary"} mt={"30px"}>
              <Thead>
                <Tr>
                  <Th>No</Th>
                  <Th>Unit Kerja</Th>
                  <Th>kode</Th>
                  <Th>Asal</Th>
                  <Th>Aksi</Th>
                </Tr>
              </Thead>
              <Tbody>
                {data?.daftarUnitKerjas.map((item, index) => (
                  <Tr key={item.id}>
                    <Td>{index + 1}</Td>
                    <Td>
                      {editingId === item.id ? (
                        <Input
                          value={editForm.unitKerja}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              unitKerja: e.target.value,
                            }))
                          }
                        />
                      ) : (
                        item.unitKerja
                      )}
                    </Td>
                    <Td>
                      {editingId === item.id ? (
                        <Input
                          value={editForm.kode}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              kode: e.target.value,
                            }))
                          }
                        />
                      ) : (
                        item.kode
                      )}
                    </Td>
                    <Td>
                      {editingId === item.id ? (
                        <Input
                          value={editForm.asal}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              asal: e.target.value,
                            }))
                          }
                        />
                      ) : (
                        item.asal
                      )}
                    </Td>
                    <Td>
                      {editingId === item.id ? (
                        <HStack spacing={2}>
                          <Button
                            variant={"primary"}
                            onClick={() => handleSave(item.id)}
                          >
                            Simpan
                          </Button>
                          <Button variant={"cancle"} onClick={handleCancel}>
                            Batal
                          </Button>
                        </HStack>
                      ) : (
                        <HStack spacing={2}>
                          <Button onClick={() => handleEdit(item)}>Edit</Button>
                          <Button
                            colorScheme="red"
                            onClick={() => handleDeletePerjalanan(item.id)}
                          >
                            Hapus Perjalanan
                          </Button>
                        </HStack>
                      )}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            <Modal isOpen={isOpen} onClose={onClose}>
              <ModalOverlay />
              <ModalContent>
                <ModalHeader>Edit Induk Unit Kerja</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                  <Stack spacing={4}>
                    <FormControl>
                      <FormLabel>Nama Induk Unit Kerja</FormLabel>
                      <Input
                        value={editIndukForm.indukUnitKerja}
                        onChange={(e) =>
                          setEditIndukForm((prev) => ({
                            ...prev,
                            indukUnitKerja: e.target.value,
                          }))
                        }
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Kode Induk</FormLabel>
                      <Input
                        value={editIndukForm.kodeInduk}
                        onChange={(e) =>
                          setEditIndukForm((prev) => ({
                            ...prev,
                            kodeInduk: e.target.value,
                          }))
                        }
                      />
                    </FormControl>
                  </Stack>
                </ModalBody>
                <ModalFooter>
                  <Button variant={"primary"} mr={3} onClick={handleSaveInduk}>
                    Simpan
                  </Button>
                  <Button variant={"cancle"} onClick={onClose}>
                    Batal
                  </Button>
                </ModalFooter>
              </ModalContent>
            </Modal>
            <Modal isOpen={isDeleteOpen} onClose={handleCloseDeleteModal}>
              <ModalOverlay />
              <ModalContent>
                <ModalHeader>Konfirmasi Hapus Perjalanan</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                  <Text mb={4}>
                    Apakah Anda yakin ingin menghapus data perjalanan untuk unit
                    kerja ini?
                  </Text>
                  <FormControl isRequired>
                    <FormLabel>Tahun</FormLabel>
                    <Input
                      type="number"
                      value={tahunHapus}
                      onChange={(e) => setTahunHapus(e.target.value)}
                      placeholder="Masukkan tahun (contoh: 2024)"
                      min="2000"
                      max="2100"
                    />
                    <Text mt={2} fontSize="sm" color="gray.500">
                      Hanya perjalanan pada tahun yang dipilih yang akan dihapus
                    </Text>
                  </FormControl>
                  <Text mt={4} color="red.500" fontSize="sm">
                    Tindakan ini tidak dapat dibatalkan dan akan menghapus semua
                    data perjalanan pada tahun yang dipilih untuk unit kerja
                    ini.
                  </Text>
                </ModalBody>
                <ModalFooter>
                  <Button
                    colorScheme="red"
                    mr={3}
                    onClick={confirmDeletePerjalanan}
                    isLoading={isLoading}
                  >
                    Hapus
                  </Button>
                  <Button variant="ghost" onClick={handleCloseDeleteModal}>
                    Batal
                  </Button>
                </ModalFooter>
              </ModalContent>
            </Modal>
          </Container>
        </Box>
      )}
    </Layout>
  );
}

export default DetailIndukUnitKerja;
