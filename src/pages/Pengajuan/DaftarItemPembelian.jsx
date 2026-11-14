import React, { useEffect, useState } from "react";
import axios from "axios";
import { useHistory } from "react-router-dom";
import ReactPaginate from "react-paginate";
import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Input,
  Select,
  SimpleGrid,
  Spinner,
  Center,
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
import "../../Style/pagination.css";
import {
  formatJumlah,
  formatRupiah,
  formatTanggal,
  statusColor,
} from "../../lib/pengajuanBarjas";

const API_BASE = import.meta.env.VITE_REACT_APP_API_BASE_URL;

const kolomSort = [
  { key: "tanggal", label: "Tanggal" },
  { key: "nomor", label: "Nomor" },
  { key: "nama", label: "Item" },
  { key: "jumlah", label: "Jumlah" },
  { key: "estimasiHarga", label: "Estimasi" },
  { key: "hargaAktual", label: "Aktual" },
  { key: "statusBeli", label: "Pembelian" },
  { key: "statusPengajuan", label: "Status pengajuan" },
];

function tandaSort(aktif, arah, key) {
  if (aktif !== key) return "";
  return arah === "ASC" ? " ↑" : " ↓";
}

function DaftarItemPembelian() {
  const toast = useToast();
  const history = useHistory();
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [totalBelum, setTotalBelum] = useState(0);
  const [totalDibeli, setTotalDibeli] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusBeli, setStatusBeli] = useState("");
  const [jenis, setJenis] = useState("");
  const [sortBy, setSortBy] = useState("tanggal");
  const [sortDir, setSortDir] = useState("DESC");

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get(
          `${API_BASE}/pengajuan-barjas/item-pembelian`,
          {
            params: {
              page,
              limit: 20,
              search: search || undefined,
              statusBeli: statusBeli || undefined,
              jenis: jenis || undefined,
              sortBy,
              sortDir,
            },
          },
        );
        setRows(res.data.result || []);
        setPages(res.data.totalPage || 0);
        setTotalRows(res.data.totalRows || 0);
        setTotalBelum(res.data.totalBelum || 0);
        setTotalDibeli(res.data.totalDibeli || 0);
      } catch (err) {
        toast({
          title: "Gagal memuat item",
          description: err.response?.data?.error || err.message,
          status: "error",
          duration: 4000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [page, search, statusBeli, jenis, sortBy, sortDir, toast]);

  const applyFilter = () => {
    setPage(0);
    setSearch(searchInput.trim());
  };

  const resetFilter = () => {
    setSearchInput("");
    setSearch("");
    setStatusBeli("");
    setJenis("");
    setSortBy("tanggal");
    setSortDir("DESC");
    setPage(0);
  };

  const gantiSort = (key) => {
    setPage(0);
    if (sortBy === key) {
      setSortDir((prev) => (prev === "ASC" ? "DESC" : "ASC"));
      return;
    }
    setSortBy(key);
    setSortDir(key === "nama" || key === "nomor" ? "ASC" : "DESC");
  };

  return (
    <LayoutKPBPN>
      <Box py={{ base: 4, md: 8 }}>
        <Container maxW="7xl">
          <Box mb={6}>
            <Heading size="lg">Status Pembelian Item</Heading>
            <Text color="gray.500" mt={1}>
              Daftar seluruh item pengajuan beserta status sudah dibeli atau
              belum dibeli.
            </Text>
          </Box>

          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3} mb={4}>
            <Box bg="white" borderWidth="1px" borderRadius="md" p={4}>
              <Text fontSize="sm" color="gray.500">
                Total item
              </Text>
              <Text fontSize="2xl" fontWeight="bold">
                {totalRows}
              </Text>
            </Box>
            <Box bg="white" borderWidth="1px" borderRadius="md" p={4}>
              <Text fontSize="sm" color="gray.500">
                Belum dibeli
              </Text>
              <Text fontSize="2xl" fontWeight="bold">
                {totalBelum}
              </Text>
            </Box>
            <Box bg="white" borderWidth="1px" borderRadius="md" p={4}>
              <Text fontSize="sm" color="gray.500">
                Sudah dibeli
              </Text>
              <Text fontSize="2xl" fontWeight="bold">
                {totalDibeli}
              </Text>
            </Box>
          </SimpleGrid>

          <Box
            bg="white"
            borderWidth="1px"
            borderRadius="md"
            p={{ base: 3, md: 4 }}
            mb={4}
          >
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
              <Input
                placeholder="Cari item, nomor, atau keperluan"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") applyFilter();
                }}
              />
              <Select
                value={statusBeli}
                onChange={(e) => {
                  setStatusBeli(e.target.value);
                  setPage(0);
                }}
              >
                <option value="">Semua status pembelian</option>
                <option value="belum">Belum dibeli</option>
                <option value="dibeli">Sudah dibeli</option>
              </Select>
              <Select
                value={jenis}
                onChange={(e) => {
                  setJenis(e.target.value);
                  setPage(0);
                }}
              >
                <option value="">Semua jenis</option>
                <option value="barang">Barang</option>
                <option value="jasa">Jasa</option>
              </Select>
            </SimpleGrid>
            <HStack mt={3} justify="flex-end">
              <Button variant="outline" onClick={resetFilter}>
                Reset
              </Button>
              <Button colorScheme="orange" onClick={applyFilter}>
                Cari
              </Button>
            </HStack>
          </Box>

          <Box bg="white" borderWidth="1px" borderRadius="md" overflowX="auto">
            {isLoading ? (
              <Center py={16}>
                <Spinner />
              </Center>
            ) : rows.length === 0 ? (
              <Text textAlign="center" color="gray.500" py={12}>
                Belum ada item pengajuan.
              </Text>
            ) : (
              <Table size="sm">
                <Thead>
                  <Tr>
                    {kolomSort.map((kolom) => (
                      <Th
                        key={kolom.key}
                        cursor="pointer"
                        userSelect="none"
                        isNumeric={
                          kolom.key === "jumlah" ||
                          kolom.key === "estimasiHarga" ||
                          kolom.key === "hargaAktual"
                        }
                        onClick={() => gantiSort(kolom.key)}
                      >
                        {kolom.label}
                        {tandaSort(sortBy, sortDir, kolom.key)}
                      </Th>
                    ))}
                    <Th>Pemohon</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {rows.map((item) => {
                    const pengajuan = item.pengajuanBarjasKpbpn;
                    const sudahDibeli = item.statusBeli === "dibeli";
                    return (
                      <Tr
                        key={item.id}
                        cursor="pointer"
                        _hover={{ bg: "orange.50" }}
                        onClick={() =>
                          history.push(
                            `/pengajuan/detail/${pengajuan?.id || ""}`,
                          )
                        }
                      >
                        <Td>{formatTanggal(pengajuan?.tanggal)}</Td>
                        <Td fontWeight="semibold">{pengajuan?.nomor || "-"}</Td>
                        <Td>
                          <Text fontWeight="semibold">{item.nama}</Text>
                          <Text fontSize="xs" color="gray.500">
                            {item.spesifikasi || pengajuan?.keperluan || "-"}
                          </Text>
                        </Td>
                        <Td isNumeric>
                          {formatJumlah(item.jumlah)} {item.satuan || ""}
                        </Td>
                        <Td isNumeric>{formatRupiah(item.estimasiHarga)}</Td>
                        <Td isNumeric>{formatRupiah(item.hargaAktual)}</Td>
                        <Td>
                          <Badge colorScheme={sudahDibeli ? "green" : "gray"}>
                            {sudahDibeli ? "Sudah dibeli" : "Belum dibeli"}
                          </Badge>
                        </Td>
                        <Td>
                          <Badge
                            colorScheme={statusColor(
                              pengajuan?.statusPengajuanKpbpn?.nama,
                            )}
                          >
                            {pengajuan?.statusPengajuanKpbpn?.nama || "-"}
                          </Badge>
                        </Td>
                        <Td>{pengajuan?.userKPBPN?.nama || "-"}</Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            )}
          </Box>

          <Flex
            justify="space-between"
            align="center"
            mt={4}
            wrap="wrap"
            gap={3}
          >
            <Text fontSize="sm" color="gray.500">
              {totalRows} item
            </Text>
            {pages > 1 && (
              <ReactPaginate
                previousLabel="←"
                nextLabel="→"
                pageCount={pages}
                onPageChange={({ selected }) => setPage(selected)}
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
            )}
          </Flex>
        </Container>
      </Box>
    </LayoutKPBPN>
  );
}

export default DaftarItemPembelian;
