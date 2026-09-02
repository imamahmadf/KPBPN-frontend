import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import ReactPaginate from "react-paginate";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Text,
  useToast,
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
  Flex,
  Spinner,
  Center,
  SimpleGrid,
  Image,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import LayoutKPBPN from "../../Componets/KPBPN/LayoutKPBPN";
import "../../Style/pagination.css";

const API_BASE = import.meta.env.VITE_REACT_APP_API_BASE_URL;

const getImageUrl = (path) => (path ? `${API_BASE}${path}` : null);

const formatTanggal = (d) =>
  d
    ? new Date(d).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "-";

const formatVolumeLabel = (volume, satuan) => {
  if (volume === null || volume === undefined || volume === "") return "-";
  return satuan ? `${volume} ${satuan}` : String(volume);
};

function ProduksiSumur({ match }) {
  const sumurMinyakId = match.params.id;
  const toast = useToast();
  const dataListRef = useRef(null);

  const [sumurMinyak, setSumurMinyak] = useState(null);
  const [dataProduksi, setDataProduksi] = useState([]);
  const [totalProduksi, setTotalProduksi] = useState(0);
  const [page, setPage] = useState(0);
  const [limit] = useState(20);
  const [pages, setPages] = useState(0);
  const [rows, setRows] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const [tanggalAwal, setTanggalAwal] = useState("");
  const [tanggalAkhir, setTanggalAkhir] = useState("");
  const [appliedStartDate, setAppliedStartDate] = useState("");
  const [appliedEndDate, setAppliedEndDate] = useState("");

  const scrollToDataList = () => {
    dataListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const changePage = ({ selected }) => {
    setPage(selected);
    scrollToDataList();
  };

  const fetchDataProduksi = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE}/sumur-minyak/get/produksi/${sumurMinyakId}`,
        {
          params: {
            page,
            limit,
            startDate: appliedStartDate || undefined,
            endDate: appliedEndDate || undefined,
          },
        },
      );
      setSumurMinyak(res.data.sumurMinyak || null);
      setDataProduksi(res.data.result || []);
      setTotalProduksi(res.data.totalProduksi || 0);
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
    fetchDataProduksi();
  }, [sumurMinyakId, page, limit, appliedStartDate, appliedEndDate]);

  const handleFilter = () => {
    setPage(0);
    setAppliedStartDate(tanggalAwal);
    setAppliedEndDate(tanggalAkhir);
  };

  const resetFilter = () => {
    setTanggalAwal("");
    setTanggalAkhir("");
    setAppliedStartDate("");
    setAppliedEndDate("");
    setPage(0);
  };

  return (
    <LayoutKPBPN>
      <Box bgColor="secondary" pb="40px" px="30px" minH="90vh">
        <Container variant="primary" p="30px" my="30px" minW="1000px">
          <HStack justify="space-between" mb={6}>
            <Box>
              <Button
                as={RouterLink}
                to="/sumur/sumur-minyak"
                variant="ghost"
                size="sm"
                mb={2}
              >
                ← Kembali ke Daftar Sumur
              </Button>
              <Heading color="kpbpn" size="lg">
                Detail Produksi Sumur
              </Heading>
              {sumurMinyak && (
                <Text color="gray.600" mt={1}>
                  {sumurMinyak.nama}
                  {sumurMinyak.nomor ? ` · ${sumurMinyak.nomor}` : ""}
                </Text>
              )}
            </Box>
          </HStack>

          {sumurMinyak && (
            <Box
              mb={6}
              p={4}
              borderWidth="1px"
              borderRadius="lg"
              bg="gray.50"
            >
              <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
                <Box>
                  <Text fontSize="xs" color="gray.500" fontWeight="semibold">
                    MITRA
                  </Text>
                  <Text fontWeight="medium">{sumurMinyak.mitra?.nama || "-"}</Text>
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.500" fontWeight="semibold">
                    ALAMAT
                  </Text>
                  <Text>{sumurMinyak.alamat || "-"}</Text>
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.500" fontWeight="semibold">
                    PRODUKSI HARIAN
                  </Text>
                  <Text>
                    {sumurMinyak.produksiHarian != null
                      ? sumurMinyak.produksiHarian
                      : "-"}
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.500" fontWeight="semibold">
                    STATUS VERIFIKASI
                  </Text>
                  <Badge
                    colorScheme={
                      sumurMinyak.statusVerifikasi === "sudah"
                        ? "green"
                        : sumurMinyak.statusVerifikasi === "belum"
                          ? "yellow"
                          : "red"
                    }
                    variant="subtle"
                    textTransform="capitalize"
                  >
                    {sumurMinyak.statusVerifikasi || "-"}
                  </Badge>
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.500" fontWeight="semibold">
                    KOORDINAT
                  </Text>
                  <Text fontSize="sm">
                    {sumurMinyak.latitude != null && sumurMinyak.longitude != null
                      ? `${sumurMinyak.latitude}, ${sumurMinyak.longitude}`
                      : "-"}
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.500" fontWeight="semibold">
                    TOTAL PRODUKSI (FILTER)
                  </Text>
                  <Text fontWeight="bold" color="kpbpn">
                    {totalProduksi}
                  </Text>
                </Box>
                {sumurMinyak.foto && (
                  <Box gridColumn={{ md: "span 2" }}>
                    <Text
                      fontSize="xs"
                      color="gray.500"
                      fontWeight="semibold"
                      mb={1}
                    >
                      FOTO SUMUR
                    </Text>
                    <Image
                      src={getImageUrl(sumurMinyak.foto)}
                      alt={sumurMinyak.nama}
                      maxH="120px"
                      borderRadius="md"
                      objectFit="cover"
                    />
                  </Box>
                )}
              </SimpleGrid>
            </Box>
          )}

          <Box
            mb={6}
            p={4}
            borderWidth="1px"
            borderRadius="lg"
            bg="gray.50"
          >
            <HStack spacing={4} flexWrap="wrap" align="flex-end">
              <FormControl maxW="200px">
                <FormLabel fontSize="sm">Tanggal Awal</FormLabel>
                <Input
                  type="date"
                  value={tanggalAwal}
                  onChange={(e) => setTanggalAwal(e.target.value)}
                />
              </FormControl>
              <FormControl maxW="200px">
                <FormLabel fontSize="sm">Tanggal Akhir</FormLabel>
                <Input
                  type="date"
                  value={tanggalAkhir}
                  onChange={(e) => setTanggalAkhir(e.target.value)}
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
                      <Th>Tanggal Produksi</Th>
                      <Th>Produksi</Th>
                      <Th>Nomor Surat Jalan</Th>
                      <Th>Tanggal Surat Jalan</Th>
                      <Th>Volume Surat Jalan</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {dataProduksi.length === 0 ? (
                      <Tr>
                        <Td colSpan={6} textAlign="center" py={6}>
                          Belum ada data produksi untuk sumur ini
                        </Td>
                      </Tr>
                    ) : (
                      dataProduksi.map((item, index) => (
                        <Tr key={item.id}>
                          <Td>{page * limit + index + 1}</Td>
                          <Td>{formatTanggal(item.tanggal)}</Td>
                          <Td fontWeight="medium">{item.produksi ?? "-"}</Td>
                          <Td>{item.suratJalan?.nomor || "-"}</Td>
                          <Td>{formatTanggal(item.suratJalan?.tanggal)}</Td>
                          <Td>
                            {formatVolumeLabel(
                              item.suratJalan?.volume,
                              item.suratJalan?.satuanVolume?.satuan,
                            )}
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
    </LayoutKPBPN>
  );
}

export default ProduksiSumur;
