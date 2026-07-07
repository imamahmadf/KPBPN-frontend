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
  SimpleGrid,
  TableContainer,
  Spinner,
  Center,
} from "@chakra-ui/react";
import axios from "axios";
import { BsEyeFill, BsToggleOn, BsToggleOff } from "react-icons/bs";
import { Link, useHistory } from "react-router-dom";
import Layout from "../../Componets/Layout";
import { useSelector } from "react-redux";
import { userRedux, selectRole } from "../../Redux/Reducers/auth";

function DaftarIndukUnitKerjaAdmin() {
  const [allChecked, setAllChecked] = useState(false);
  const history = useHistory();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [data, setData] = useState(null);
  const [dataSumberDana, setDataSumberDana] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [updatingKeuanganId, setUpdatingKeuanganId] = useState(null);
  const [indukUnitKerja, setIndukUnitKerja] = useState("");
  const [kodeInduk, setKodeInduk] = useState("");
  const [checkedItems, setCheckedItems] = useState([]);
  const [checkedIds, setCheckedIds] = useState([]);
  const [asal, setAsal] = useState("");
  const [loading, setLoading] = useState(true);
  const handleCheckboxChange = (index) => {
    const updatedCheckedItems = [...checkedItems];
    updatedCheckedItems[index] = !updatedCheckedItems[index];
    setCheckedItems(updatedCheckedItems);

    if (updatedCheckedItems[index]) {
      setCheckedIds([...checkedIds, dataSumberDana[index].id]);
    } else {
      setCheckedIds(checkedIds.filter((id) => id !== dataSumberDana[index].id));
    }

    setAllChecked(updatedCheckedItems.every(Boolean));
  };
  const postIndukUnitKerja = () => {
    axios
      .post(
        `${import.meta.env.VITE_REACT_APP_API_BASE_URL}/induk-unit-kerja/post`,
        {
          FEIndukUnitKerja: indukUnitKerja,
          kodeInduk,
          asal,
          sumberDanaId: checkedIds,
        },
      )
      .then((res) => {
        console.log(res.data);
        toast({
          title: "Berhasil",
          description: "Data OPD berhasil ditambahkan.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        handleCloseModal();
        fetchDaftarIndukUnitKerja();
      })
      .catch((err) => {
        console.error(err);
        toast({
          title: "Gagal",
          description:
            err.response?.data?.message || "Gagal menambahkan data OPD.",
          status: "error",
          duration: 4000,
          isClosable: true,
        });
      });
  };
  async function fetchDaftarIndukUnitKerja() {
    setLoading(true);
    await axios
      .get(
        `${import.meta.env.VITE_REACT_APP_API_BASE_URL}/induk-unit-kerja/get`,
      )
      .then((res) => {
        console.log(res.status, res.data, "tessss");

        setData(res.data.result);
        setDataSumberDana(res.data.resultSumberDana);
      })
      .catch((err) => {
        console.error(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }
  const togglePenomoran = async (item) => {
    const isAktif = item.penomoran === "aktif" || item.penomoran === true;
    const nilaiBaru = isAktif ? "nonaktif" : "aktif";
    setUpdatingId(item.id);
    try {
      await axios.post(
        `${import.meta.env.VITE_REACT_APP_API_BASE_URL}/induk-unit-kerja/penomoran/${item.id}`,
        { penomoran: nilaiBaru },
      );
      toast({
        title: "Berhasil",
        description: nilaiBaru === "aktif"
          ? "Penomoran diaktifkan."
          : "Penomoran dinonaktifkan.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      fetchDaftarIndukUnitKerja();
    } catch (err) {
      console.error(err);
      toast({
        title: "Gagal",
        description:
          err.response?.data?.message || "Gagal mengubah status penomoran.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setUpdatingId(null);
    }
  };
  const toggleKeuangan = async (item) => {
    const isAktif = item.keuangan === "aktif" || item.keuangan === true;
    const nilaiBaru = isAktif ? "nonaktif" : "aktif";
    setUpdatingKeuanganId(item.id);
    try {
      await axios.post(
        `${import.meta.env.VITE_REACT_APP_API_BASE_URL}/induk-unit-kerja/keuangan/${item.id}`,
        { keuangan: nilaiBaru },
      );
      toast({
        title: "Berhasil",
        description: nilaiBaru === "aktif"
          ? "Keuangan diaktifkan."
          : "Keuangan dinonaktifkan.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      fetchDaftarIndukUnitKerja();
    } catch (err) {
      console.error(err);
      toast({
        title: "Gagal",
        description:
          err.response?.data?.message || "Gagal mengubah status keuangan.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setUpdatingKeuanganId(null);
    }
  };
  useEffect(() => {
    fetchDaftarIndukUnitKerja();
  }, []);

  const handleCloseModal = () => {
    onClose();
    // Reset form when modal closes
    setIndukUnitKerja("");
    setKodeInduk("");
    setAsal("");
    setCheckedItems([]);
    setCheckedIds([]);
  };

  return (
    <Layout>
      <Box bgColor={"secondary"} pb={"40px"} px={"30px"} minH="100vh">
        <Container variant={"primary"} maxW={"1280px"} p={"30px"} my={"30px"}>
          <Flex justify="space-between" align="center" mb={"30px"}>
            <Heading size="lg" color="gray.700">
              Daftar Induk Unit Kerja
            </Heading>
            <Button variant={"primary"} onClick={onOpen}>
              Tambah OPD +
            </Button>
          </Flex>

          {loading ? (
            <Center py={10}>
              <Spinner size="xl" color="blue.500" />
            </Center>
          ) : (
            <TableContainer
              bg="white"
              borderRadius="md"
              boxShadow="sm"
              overflowX="auto"
            >
              <Table variant={"primary"} size="md">
                <Thead bg="gray.100" borderBottom="2px solid" borderColor="gray.300">
                  <Tr>
                    <Th
                      fontWeight="bold"
                      fontSize="sm"
                      color="gray.700"
                      textTransform="uppercase"
                      letterSpacing="wide"
                      py={4}
                      px={4}
                      borderRight="1px solid"
                      borderColor="gray.200"
                    >
                      No
                    </Th>
                    <Th
                      fontWeight="bold"
                      fontSize="sm"
                      color="gray.700"
                      textTransform="uppercase"
                      letterSpacing="wide"
                      py={4}
                      px={4}
                      borderRight="1px solid"
                      borderColor="gray.200"
                    >
                      OPD
                    </Th>
                    <Th
                      fontWeight="bold"
                      fontSize="sm"
                      color="gray.700"
                      textTransform="uppercase"
                      letterSpacing="wide"
                      py={4}
                      px={4}
                      borderRight="1px solid"
                      borderColor="gray.200"
                    >
                      Kode
                    </Th>
                    <Th
                      fontWeight="bold"
                      fontSize="sm"
                      color="gray.700"
                      textTransform="uppercase"
                      letterSpacing="wide"
                      py={4}
                      px={4}
                      borderRight="1px solid"
                      borderColor="gray.200"
                    >
                      Asal
                    </Th>
                    <Th
                      fontWeight="bold"
                      fontSize="sm"
                      color="gray.700"
                      textTransform="uppercase"
                      letterSpacing="wide"
                      py={4}
                      px={4}
                      borderRight="1px solid"
                      borderColor="gray.200"
                    >
                      Sumber Dana
                    </Th>
                    <Th
                      fontWeight="bold"
                      fontSize="sm"
                      color="gray.700"
                      textTransform="uppercase"
                      letterSpacing="wide"
                      py={4}
                      px={4}
                      borderRight="1px solid"
                      borderColor="gray.200"
                    >
                      Penomoran
                    </Th>
                    <Th
                      fontWeight="bold"
                      fontSize="sm"
                      color="gray.700"
                      textTransform="uppercase"
                      letterSpacing="wide"
                      py={4}
                      px={4}
                      borderRight="1px solid"
                      borderColor="gray.200"
                    >
                      Keuangan
                    </Th>
                    <Th
                      fontWeight="bold"
                      fontSize="sm"
                      color="gray.700"
                      textTransform="uppercase"
                      letterSpacing="wide"
                      py={4}
                      px={4}
                      textAlign="center"
                    >
                      Aksi
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {data && data.length > 0 ? (
                    data.map((item, index) => (
                      <Tr 
                        key={item.id} 
                        _hover={{ bg: "gray.50" }}
                        borderBottom="1px solid"
                        borderColor="gray.200"
                      >
                        <Td fontWeight="medium" py={4} px={4} borderRight="1px solid" borderColor="gray.200">
                          {index + 1}
                        </Td>
                        <Td py={4} px={4} borderRight="1px solid" borderColor="gray.200">
                          {item.indukUnitKerja}
                        </Td>
                        <Td py={4} px={4} borderRight="1px solid" borderColor="gray.200">
                          <Badge colorScheme="blue" variant="subtle">
                            {item.kodeInduk}
                          </Badge>
                        </Td>
                        <Td py={4} px={4} borderRight="1px solid" borderColor="gray.200">
                          {item.asal || "-"}
                        </Td>
                        <Td py={4} px={4} borderRight="1px solid" borderColor="gray.200">
                          <VStack align="start" spacing={1}>
                            {item.indukUKSumberDanas && item.indukUKSumberDanas.length > 0 ? (
                              item.indukUKSumberDanas.map((val, idx) => (
                                <Badge
                                  key={idx}
                                  colorScheme="purple"
                                  variant="subtle"
                                  fontSize="xs"
                                >
                                  {val.sumberDana?.sumber || "-"}
                                </Badge>
                              ))
                            ) : (
                              <Text fontSize="sm" color="gray.400">
                                -
                              </Text>
                            )}
                          </VStack>
                        </Td>
                        <Td py={4} px={4} borderRight="1px solid" borderColor="gray.200">
                          <Badge
                            colorScheme={item.penomoran === "aktif" ? "green" : "gray"}
                            fontSize="sm"
                            px={2}
                            py={1}
                          >
                            {item.penomoran === "aktif" ? "Aktif" : "Nonaktif"}
                          </Badge>
                        </Td>
                        <Td py={4} px={4} borderRight="1px solid" borderColor="gray.200">
                          <Badge
                            colorScheme={item.keuangan === "aktif" ? "green" : "gray"}
                            fontSize="sm"
                            px={2}
                            py={1}
                          >
                            {item.keuangan === "aktif" ? "Aktif" : "Nonaktif"}
                          </Badge>
                        </Td>
                        <Td py={4} px={4} textAlign="center">
                          <HStack spacing={2} flexWrap="wrap" justify="center">
                            <Button
                              variant={"primary"}
                              size="sm"
                              p={"8px"}
                              fontSize={"14px"}
                              onClick={() =>
                                history.push(
                                  `/admin/detail-induk-unit-kerja/${item.id}`,
                                )
                              }
                              title="Detail"
                            >
                              <BsEyeFill />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              colorScheme={item.penomoran === "aktif" ? "orange" : "green"}
                              leftIcon={
                                item.penomoran === "aktif" ? (
                                  <BsToggleOn />
                                ) : (
                                  <BsToggleOff />
                                )
                              }
                              onClick={() => togglePenomoran(item)}
                              isLoading={updatingId === item.id}
                              loadingText="..."
                              title={
                                item.penomoran === "aktif"
                                  ? "Nonaktifkan penomoran"
                                  : "Aktifkan penomoran"
                              }
                            >
                              {item.penomoran === "aktif" ? "Nonaktifkan" : "Aktifkan"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              colorScheme={item.keuangan === "aktif" ? "orange" : "green"}
                              leftIcon={
                                item.keuangan === "aktif" ? (
                                  <BsToggleOn />
                                ) : (
                                  <BsToggleOff />
                                )
                              }
                              onClick={() => toggleKeuangan(item)}
                              isLoading={updatingKeuanganId === item.id}
                              loadingText="..."
                              title={
                                item.keuangan === "aktif"
                                  ? "Nonaktifkan keuangan"
                                  : "Aktifkan keuangan"
                              }
                            >
                              {item.keuangan === "aktif" ? "Nonaktifkan" : "Aktifkan"}
                            </Button>
                          </HStack>
                        </Td>
                      </Tr>
                    ))
                  ) : (
                    <Tr>
                      <Td colSpan={8} textAlign="center" py={10}>
                        <VStack spacing={2}>
                          <Text color="gray.500" fontSize="lg">
                            Belum ada data
                          </Text>
                          <Text color="gray.400" fontSize="sm">
                            Klik "Tambah OPD +" untuk menambahkan data baru
                          </Text>
                        </VStack>
                      </Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </TableContainer>
          )}
        </Container>
      </Box>

      <Modal isOpen={isOpen} onClose={handleCloseModal} size="xl">
        <ModalOverlay />
        <ModalContent maxWidth="900px">
          <ModalHeader fontSize="xl" fontWeight="bold">
            Tambah OPD
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel fontSize={"16px"} fontWeight="medium">
                  OPD
                </FormLabel>
                <Input
                  onChange={(e) => {
                    setIndukUnitKerja(e.target.value);
                  }}
                  bgColor={"terang"}
                  height="50px"
                  placeholder="Masukkan nama Unit Kerja"
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize={"16px"} fontWeight="medium">
                  Kode
                </FormLabel>
                <Input
                  onChange={(e) => {
                    setKodeInduk(e.target.value);
                  }}
                  bgColor={"terang"}
                  height="50px"
                  placeholder="Masukkan Kode"
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize={"16px"} fontWeight="medium">
                  Asal
                </FormLabel>
                <Input
                  onChange={(e) => {
                    setAsal(e.target.value);
                  }}
                  bgColor={"terang"}
                  height="50px"
                  placeholder="Masukkan Asal"
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize={"16px"} fontWeight="medium" mb={3}>
                  Sumber Dana
                </FormLabel>
                <Box
                  border="1px"
                  borderColor="gray.200"
                  borderRadius="md"
                  p={4}
                  maxH="200px"
                  overflowY="auto"
                >
                  {dataSumberDana && dataSumberDana.length > 0 ? (
                    <SimpleGrid columns={2} spacing={3}>
                      {dataSumberDana.map((item, index) => (
                        <Checkbox
                          colorScheme="blue"
                          key={item.id}
                          isChecked={checkedItems[index]}
                          onChange={() => handleCheckboxChange(index)}
                        >
                          {item.sumber}
                        </Checkbox>
                      ))}
                    </SimpleGrid>
                  ) : (
                    <Text color="gray.500" fontSize="sm">
                      Tidak ada sumber dana tersedia
                    </Text>
                  )}
                </Box>
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={handleCloseModal}>
              Batal
            </Button>
            <Button onClick={postIndukUnitKerja} variant="primary">
              Tambah
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Layout>
  );
}

export default DaftarIndukUnitKerjaAdmin;
