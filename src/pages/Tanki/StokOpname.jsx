import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Container,
  Thead,
  Table,
  Tr,
  Th,
  Td,
  Tbody,
  Heading,
  HStack,
  Badge,
  Text,
  Spinner,
  Center,
  useToast,
  FormControl,
  FormLabel,
  Input,
  Select,
  SimpleGrid,
  Divider,
  Collapse,
  IconButton,
  VStack,
} from "@chakra-ui/react";
import { BsChevronDown, BsChevronUp, BsX } from "react-icons/bs";
import LayoutKPBPN from "../../Componets/KPBPN/LayoutKPBPN";

const API_BASE = import.meta.env.VITE_REACT_APP_API_BASE_URL;
const SATUAN = "barrel";

const getDefaultStartDate = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
};

const getDefaultEndDate = () => new Date().toISOString().split("T")[0];

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatVolumeLabel = (volume, satuan) => {
  if (volume === null || volume === undefined || volume === "") return "-";
  const formatted = Number(volume).toLocaleString("id-ID", {
    maximumFractionDigits: 3,
  });
  return satuan ? `${formatted} ${satuan}` : formatted;
};

const StokOpname = () => {
  const toast = useToast();
  const [dataStok, setDataStok] = useState([]);
  const [dataTanki, setDataTanki] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [tanggalAwal, setTanggalAwal] = useState(getDefaultStartDate);
  const [tanggalAkhir, setTanggalAkhir] = useState(getDefaultEndDate);
  const [tangkiFilterId, setTangkiFilterId] = useState("");

  const hasActiveFilter =
    Boolean(tanggalAwal) ||
    Boolean(tanggalAkhir) ||
    Boolean(tangkiFilterId);

  const resetFilter = () => {
    setTanggalAwal(getDefaultStartDate());
    setTanggalAkhir(getDefaultEndDate());
    setTangkiFilterId("");
  };

  const fetchDataTanki = async () => {
    try {
      const res = await axios.get(`${API_BASE}/tanki/get/tanki`);
      setDataTanki(res.data.result || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDataStokOpname = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/tanki/get/stok-opname`, {
        params: {
          startDate: tanggalAwal || undefined,
          endDate: tanggalAkhir || undefined,
          tangkiId: tangkiFilterId || undefined,
        },
      });
      setDataStok(res.data.result || []);
      setExpandedKeys([]);
    } catch (err) {
      console.error(err);
      setDataStok([]);
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

  const toggleExpand = (key) => {
    setExpandedKeys((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key],
    );
  };

  const getRowKey = (row) => `${row.tanggal}|${row.tangkiId}`;

  const totalMasuk = dataStok.reduce((sum, row) => sum + (row.masuk || 0), 0);
  const totalKeluar = dataStok.reduce((sum, row) => sum + (row.keluar || 0), 0);

  useEffect(() => {
    fetchDataTanki();
  }, []);

  useEffect(() => {
    fetchDataStokOpname();
  }, [tanggalAwal, tanggalAkhir, tangkiFilterId]);

  const colSpan = 11;

  return (
    <LayoutKPBPN>
      <Box bgColor="secondary" pb="40px" px="30px" minH="90vh">
        <Container variant="primary" p="30px" my="30px" minW="1200px">
          <HStack justify="space-between" mb={6} align="flex-start">
            <Box>
              <Heading color="kpbpn" mb={2}>
                Stok Opname Tanki
              </Heading>
              <Text fontSize="sm" color="gray.500">
                Rekapitulasi minyak masuk (gross BAST / pengisian tanki, dikonversi
                ke barrel) dan keluar (BA bongkar: (ukuran cairan − ukuran air)
                × factor tank) per hari per tanki. Konversi: 1 barrel = 158,987
                liter, 1 drum = 200 liter.
              </Text>
            </Box>
            <VStack align="flex-end" spacing={1}>
              <Text fontSize="sm" color="gray.500">
                Total baris: {dataStok.length}
              </Text>
              <Text fontSize="xs" color="gray.400">
                Masuk: {totalMasuk.toLocaleString("id-ID")} {SATUAN} · Keluar:{" "}
                {totalKeluar.toLocaleString("id-ID")} {SATUAN}
              </Text>
            </VStack>
          </HStack>

          <Box mb={6} p={4} bg="gray.50" borderRadius="lg">
            <Heading size="sm" mb={4} color="gray.700">
              Filter Data
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <FormControl>
                <FormLabel fontSize="sm">Tanggal Awal</FormLabel>
                <Input
                  type="date"
                  bg="white"
                  value={tanggalAwal}
                  onChange={(e) => setTanggalAwal(e.target.value)}
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">Tanggal Akhir</FormLabel>
                <Input
                  type="date"
                  bg="white"
                  value={tanggalAkhir}
                  onChange={(e) => setTanggalAkhir(e.target.value)}
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">Tanki</FormLabel>
                <Select
                  bg="white"
                  placeholder="Semua tanki"
                  value={tangkiFilterId}
                  onChange={(e) => setTangkiFilterId(e.target.value)}
                >
                  {dataTanki.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.kode}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </SimpleGrid>
            <HStack mt={4} justify="flex-end">
              <Button
                leftIcon={<BsX />}
                variant="outline"
                colorScheme="gray"
                onClick={resetFilter}
                isDisabled={!hasActiveFilter}
              >
                Reset Filter
              </Button>
            </HStack>
          </Box>

          <Divider mb={6} />

          {isLoading ? (
            <Center py={10}>
              <Spinner size="lg" color="kpbpn" />
            </Center>
          ) : (
            <Box overflowX="auto" borderWidth="1px" borderRadius="lg">
              <Table size="sm">
                <Thead bg="gray.50">
                  <Tr>
                    <Th w="40px" />
                    <Th>No</Th>
                    <Th>Tanggal</Th>
                    <Th>Tanki</Th>
                    <Th isNumeric>Masuk (Pengisian) ({SATUAN})</Th>
                    <Th isNumeric>Keluar (BA) ({SATUAN})</Th>
                    <Th isNumeric>Selisih ({SATUAN})</Th>
                    <Th isNumeric>Jml Masuk</Th>
                    <Th isNumeric>Jml Keluar</Th>
                    <Th>Ukuran Cairan</Th>
                    <Th>Ukuran Air</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {dataStok.length === 0 ? (
                    <Tr>
                      <Td colSpan={colSpan} textAlign="center" py={6}>
                        {hasActiveFilter
                          ? "Tidak ada data stok opname sesuai filter"
                          : "Belum ada data stok opname"}
                      </Td>
                    </Tr>
                  ) : (
                    dataStok.map((row, index) => {
                      const rowKey = getRowKey(row);
                      const isExpanded = expandedKeys.includes(rowKey);
                      const hasDetail =
                        (row.detailMasuk?.length || 0) > 0 ||
                        (row.detailKeluar?.length || 0) > 0;

                      return (
                        <React.Fragment key={rowKey}>
                          <Tr>
                            <Td>
                              <IconButton
                                aria-label={
                                  isExpanded
                                    ? "Tutup detail transaksi"
                                    : "Lihat detail transaksi"
                                }
                                icon={
                                  isExpanded ? (
                                    <BsChevronUp />
                                  ) : (
                                    <BsChevronDown />
                                  )
                                }
                                size="xs"
                                variant="ghost"
                                onClick={() => toggleExpand(rowKey)}
                                isDisabled={!hasDetail}
                              />
                            </Td>
                            <Td>{index + 1}</Td>
                            <Td>{formatDate(row.tanggal)}</Td>
                            <Td>
                              <Badge colorScheme="blue">{row.kode}</Badge>
                            </Td>
                            <Td isNumeric color="green.600" fontWeight="medium">
                              {formatVolumeLabel(row.masuk, SATUAN)}
                            </Td>
                            <Td isNumeric color="orange.600" fontWeight="medium">
                              {formatVolumeLabel(row.keluar, SATUAN)}
                            </Td>
                            <Td
                              isNumeric
                              fontWeight="medium"
                              color={
                                row.selisih > 0
                                  ? "green.600"
                                  : row.selisih < 0
                                    ? "red.600"
                                    : "gray.600"
                              }
                            >
                              {formatVolumeLabel(row.selisih, SATUAN)}
                            </Td>
                            <Td isNumeric>{row.jumlahMasuk || 0}</Td>
                            <Td isNumeric>{row.jumlahKeluar || 0}</Td>
                            <Td>{row.ukuranCairan ?? "-"}</Td>
                            <Td>{row.ukuranAir ?? "-"}</Td>
                          </Tr>
                          <Tr>
                            <Td colSpan={colSpan} p={0} borderBottom="none">
                              <Collapse in={isExpanded} animateOpacity>
                                <Box
                                  p={4}
                                  bg="white"
                                  borderTopWidth="1px"
                                  borderColor="gray.100"
                                >
                                  <SimpleGrid
                                    columns={{ base: 1, lg: 2 }}
                                    spacing={6}
                                  >
                                    <Box>
                                      <Text
                                        fontSize="sm"
                                        fontWeight="semibold"
                                        mb={3}
                                        color="green.700"
                                      >
                                        Detail Masuk (Pengisian Tanki)
                                      </Text>
                                      {(row.detailMasuk || []).length === 0 ? (
                                        <Text fontSize="sm" color="gray.500">
                                          Tidak ada pengisian tanki pada tanggal
                                          ini
                                        </Text>
                                      ) : (
                                        <Box overflowX="auto">
                                          <Table size="xs" variant="simple">
                                            <Thead>
                                              <Tr>
                                                <Th>ID</Th>
                                                <Th isNumeric>Gross Asli</Th>
                                                <Th isNumeric>
                                                  Gross ({SATUAN})
                                                </Th>
                                                <Th isNumeric>Net ({SATUAN})</Th>
                                                <Th>BA</Th>
                                              </Tr>
                                            </Thead>
                                            <Tbody>
                                              {row.detailMasuk.map((item) => (
                                                <Tr key={item.id}>
                                                  <Td>#{item.id}</Td>
                                                  <Td isNumeric>
                                                    {formatVolumeLabel(
                                                      item.gross,
                                                      item.satuan,
                                                    )}
                                                  </Td>
                                                  <Td isNumeric>
                                                    {formatVolumeLabel(
                                                      item.grossBarrel ??
                                                        item.gross,
                                                      SATUAN,
                                                    )}
                                                  </Td>
                                                  <Td isNumeric>
                                                    {formatVolumeLabel(
                                                      item.netBarrel ?? item.net,
                                                      SATUAN,
                                                    )}
                                                  </Td>
                                                  <Td>
                                                    {item.BABongkarId ? (
                                                      <Badge colorScheme="green">
                                                        BA #{item.BABongkarId}
                                                      </Badge>
                                                    ) : (
                                                      <Badge colorScheme="gray">
                                                        Belum
                                                      </Badge>
                                                    )}
                                                  </Td>
                                                </Tr>
                                              ))}
                                            </Tbody>
                                          </Table>
                                        </Box>
                                      )}
                                    </Box>
                                    <Box>
                                      <Text
                                        fontSize="sm"
                                        fontWeight="semibold"
                                        mb={3}
                                        color="orange.700"
                                      >
                                        Detail Keluar (BA Bongkar)
                                      </Text>
                                      {(row.detailKeluar || []).length === 0 ? (
                                        <Text fontSize="sm" color="gray.500">
                                          Tidak ada BA bongkar pada tanggal
                                          ini
                                        </Text>
                                      ) : (
                                        <Box overflowX="auto">
                                          <Table size="xs" variant="simple">
                                            <Thead>
                                              <Tr>
                                                <Th>BA</Th>
                                                <Th isNumeric>Volume ({SATUAN})</Th>
                                                <Th isNumeric>Cairan</Th>
                                                <Th isNumeric>Air</Th>
                                                <Th>Pengisian</Th>
                                              </Tr>
                                            </Thead>
                                            <Tbody>
                                              {row.detailKeluar.map((item) => (
                                                <Tr key={`${item.baId}-${item.volume}`}>
                                                  <Td>
                                                    <Badge colorScheme="orange">
                                                      BA #{item.baId}
                                                    </Badge>
                                                  </Td>
                                                  <Td isNumeric>
                                                    {formatVolumeLabel(
                                                      item.volume,
                                                      SATUAN,
                                                    )}
                                                  </Td>
                                                  <Td isNumeric>
                                                    {item.ukuranCairan ?? "-"}
                                                  </Td>
                                                  <Td isNumeric>
                                                    {item.ukuranAir ?? "-"}
                                                  </Td>
                                                  <Td>
                                                    {(item.pengisianIds || [])
                                                      .map((id) => `#${id}`)
                                                      .join(", ") || "-"}
                                                  </Td>
                                                </Tr>
                                              ))}
                                            </Tbody>
                                          </Table>
                                        </Box>
                                      )}
                                    </Box>
                                  </SimpleGrid>
                                </Box>
                              </Collapse>
                            </Td>
                          </Tr>
                        </React.Fragment>
                      );
                    })
                  )}
                </Tbody>
              </Table>
            </Box>
          )}
        </Container>
      </Box>
    </LayoutKPBPN>
  );
};

export default StokOpname;
