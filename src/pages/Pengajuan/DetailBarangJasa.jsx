import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useHistory } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Badge,
  Box,
  Button,
  Center,
  Container,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  SimpleGrid,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useToast,
} from "@chakra-ui/react";
import LayoutKPBPN from "../../Componets/KPBPN/LayoutKPBPN";
import { selectRoleIds } from "../../Redux/Reducers/auth";
import { formatJumlah, formatTanggal, statusColor } from "../../lib/pengajuanBarjas";

const API_BASE = import.meta.env.VITE_REACT_APP_API_BASE_URL;

const Info = ({ label, children }) => (
  <Box>
    <Text fontSize="xs" color="gray.500" fontWeight="semibold" mb={1}>
      {label}
    </Text>
    <Text>{children || "-"}</Text>
  </Box>
);

function DetailBarangJasa({ match }) {
  const barangId = match.params.id;
  const history = useHistory();
  const toast = useToast();
  const roleIds = (useSelector(selectRoleIds) || []).map(Number);
  const bolehPakaiStok = roleIds.some((id) => [1, 2, 4, 7].includes(id));
  const [data, setData] = useState(null);
  const [riwayat, setRiwayat] = useState([]);
  const [mutasi, setMutasi] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pakaiJumlah, setPakaiJumlah] = useState("");
  const [pakaiCatatan, setPakaiCatatan] = useState("");
  const [isPakai, setIsPakai] = useState(false);

  const muat = async () => {
    const res = await axios.get(
      `${API_BASE}/pengajuan-barjas/barang-jasa/riwayat/${barangId}`,
    );
    setData(res.data.result || null);
    setRiwayat(res.data.riwayat || []);
    setMutasi(res.data.mutasi || []);
  };

  useEffect(() => {
    setIsLoading(true);
    muat()
      .catch((err) => {
        toast({
          title: "Gagal memuat detail item",
          description: err.response?.data?.error || err.message,
          status: "error",
          duration: 4000,
          isClosable: true,
        });
      })
      .finally(() => setIsLoading(false));
  }, [barangId]);

  const pakaiStok = async () => {
    setIsPakai(true);
    try {
      const res = await axios.post(
        `${API_BASE}/pengajuan-barjas/barang-jasa/stok/${barangId}`,
        { jumlah: pakaiJumlah, keterangan: pakaiCatatan },
      );
      toast({
        title: "Stok berkurang",
        description: res.data.message,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setPakaiJumlah("");
      setPakaiCatatan("");
      await muat();
    } catch (err) {
      toast({
        title: "Gagal mengurangi stok",
        description: err.response?.data?.error || err.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsPakai(false);
    }
  };

  const adalahBarang = data?.jenis === "barang";

  return (
    <LayoutKPBPN>
      <Box py={{ base: 4, md: 8 }}>
        <Container maxW="6xl">
          <Button
            variant="link"
            colorScheme="orange"
            mb={4}
            onClick={() => history.push("/pengajuan/barang-jasa")}
          >
            Kembali ke daftar item
          </Button>

          {isLoading ? (
            <Center py={20}>
              <Spinner />
            </Center>
          ) : !data ? (
            <Text color="gray.500">Item tidak ditemukan.</Text>
          ) : (
            <Box>
              <HStack justify="space-between" align="start" wrap="wrap" mb={6}>
                <Box>
                  <Heading size="lg">{data.nama}</Heading>
                  <HStack mt={2} spacing={2}>
                    <Badge textTransform="capitalize">{data.jenis}</Badge>
                    {adalahBarang && data.stokHabis && (
                      <Badge colorScheme="red">Habis</Badge>
                    )}
                  </HStack>
                </Box>
              </HStack>

              <SimpleGrid columns={{ base: 1, md: adalahBarang ? 2 : 1 }} spacing={4} mb={4}>
                {adalahBarang && (
                  <Box bg="white" borderWidth="1px" borderRadius="md" p={{ base: 4, md: 6 }}>
                    <Text fontSize="sm" color="gray.500" fontWeight="semibold">
                      Stok saat ini
                    </Text>
                    <Text
                      fontSize="4xl"
                      fontWeight="bold"
                      color={data.stokHabis ? "red.500" : "gray.800"}
                      lineHeight="1.1"
                      mt={2}
                    >
                      {formatJumlah(data.stok)}
                    </Text>
                    <Text color="gray.600" mt={1}>
                      {data.satuan}
                    </Text>
                  </Box>
                )}
                <Box bg="white" borderWidth="1px" borderRadius="md" p={{ base: 4, md: 6 }}>
                  <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
                    <Info label="Satuan">{data.satuan}</Info>
                    <Info label="Spesifikasi">{data.spesifikasi}</Info>
                    <Info label="Total diajukan">{formatJumlah(data.totalJumlah)}</Info>
                    <Info label="Ditolak">{formatJumlah(data.jumlahDitolak)}</Info>
                    <Info label="Berjalan">{formatJumlah(data.jumlahBerjalan)}</Info>
                    <Info label="Jumlah pengajuan">{data.jumlahPengajuan}</Info>
                  </SimpleGrid>
                  {!adalahBarang && (
                    <Text fontSize="sm" color="gray.500" mt={4}>
                      Stok hanya dicatat untuk barang.
                    </Text>
                  )}
                </Box>
              </SimpleGrid>

              {adalahBarang && bolehPakaiStok && (
                <Box bg="white" borderWidth="1px" borderRadius="md" p={{ base: 4, md: 6 }} mb={4}>
                  <Heading size="sm" mb={4}>
                    Pakai stok
                  </Heading>
                  <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
                    <FormControl>
                      <FormLabel>Jumlah dipakai</FormLabel>
                      <Input
                        type="number"
                        min="0"
                        step="0.001"
                        value={pakaiJumlah}
                        onChange={(e) => setPakaiJumlah(e.target.value)}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Catatan</FormLabel>
                      <Input
                        value={pakaiCatatan}
                        onChange={(e) => setPakaiCatatan(e.target.value)}
                        placeholder="Pemakaian, rusak, atau lain-lain"
                      />
                    </FormControl>
                    <Button
                      alignSelf="end"
                      colorScheme="orange"
                      isLoading={isPakai}
                      onClick={pakaiStok}
                    >
                      Kurangi stok
                    </Button>
                  </SimpleGrid>
                </Box>
              )}

              {adalahBarang && (
                <Box bg="white" borderWidth="1px" borderRadius="md" overflowX="auto" mb={4}>
                  <Box p={{ base: 3, md: 5 }} pb={0}>
                    <Heading size="sm">Mutasi stok</Heading>
                  </Box>
                  <Table size="sm" mt={3}>
                    <Thead>
                      <Tr>
                        <Th>Tanggal</Th>
                        <Th>Jenis</Th>
                        <Th isNumeric>Jumlah</Th>
                        <Th>Catatan</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {mutasi.length === 0 ? (
                        <Tr>
                          <Td colSpan={4}>
                            <Text color="gray.500" py={4}>
                              Belum ada mutasi stok.
                            </Text>
                          </Td>
                        </Tr>
                      ) : (
                        mutasi.map((item) => (
                          <Tr key={item.id}>
                            <Td>{formatTanggal(item.tanggal)}</Td>
                            <Td>
                              <Badge colorScheme={item.jenis === "masuk" ? "green" : "red"}>
                                {item.jenis === "masuk" ? "Masuk" : "Keluar"}
                              </Badge>
                            </Td>
                            <Td isNumeric>
                              {formatJumlah(item.jumlah)} {data.satuan}
                            </Td>
                            <Td>
                              {item.pengajuanId ? (
                                <Button
                                  as={Link}
                                  to={`/pengajuan/detail/${item.pengajuanId}`}
                                  variant="link"
                                  colorScheme="orange"
                                  size="sm"
                                >
                                  {item.keterangan}
                                </Button>
                              ) : (
                                item.keterangan
                              )}
                            </Td>
                          </Tr>
                        ))
                      )}
                    </Tbody>
                  </Table>
                </Box>
              )}

              <Box bg="white" borderWidth="1px" borderRadius="md" overflowX="auto">
                <Box p={{ base: 3, md: 5 }} pb={0}>
                  <Heading size="sm">Pengajuan</Heading>
                </Box>
                <Table size="sm" mt={3}>
                  <Thead>
                    <Tr>
                      <Th>Nomor</Th>
                      <Th>Tanggal</Th>
                      <Th>Status</Th>
                      <Th isNumeric>Jumlah</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {riwayat.length === 0 ? (
                      <Tr>
                        <Td colSpan={4}>
                          <Text color="gray.500" py={4}>
                            Belum ada pengajuan untuk item ini.
                          </Text>
                        </Td>
                      </Tr>
                    ) : (
                      riwayat.map((item) => (
                        <Tr key={item.itemId}>
                          <Td>
                            <Button
                              as={Link}
                              to={`/pengajuan/detail/${item.pengajuanId}`}
                              variant="link"
                              colorScheme="orange"
                            >
                              {item.nomor}
                            </Button>
                          </Td>
                          <Td>{formatTanggal(item.tanggal)}</Td>
                          <Td>
                            <Badge colorScheme={statusColor(item.status)}>{item.status}</Badge>
                          </Td>
                          <Td isNumeric>
                            {formatJumlah(item.jumlah)} {item.satuan}
                          </Td>
                        </Tr>
                      ))
                    )}
                  </Tbody>
                </Table>
              </Box>
            </Box>
          )}
        </Container>
      </Box>
    </LayoutKPBPN>
  );
}

export default DetailBarangJasa;
