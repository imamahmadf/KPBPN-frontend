import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useHistory } from "react-router-dom";
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
  formatRupiah,
  formatTanggal,
  statusColor,
  unduhDokumenPengajuan,
  bacaErrorUnduhan,
} from "../../lib/pengajuanBarjas";

const API_BASE = import.meta.env.VITE_REACT_APP_API_BASE_URL;

function DaftarPengajuan() {
  const toast = useToast();
  const history = useHistory();
  const [rows, setRows] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("");
  const [jenis, setJenis] = useState("");
  const [statusId, setStatusId] = useState("");
  const [loadingCetak, setLoadingCetak] = useState({});

  useEffect(() => {
    axios
      .get(`${API_BASE}/pengajuan-barjas/seed`)
      .then((res) => setStatusOptions(res.data.status || []))
      .catch(() => setStatusOptions([]));
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/pengajuan-barjas/get`, {
          params: {
            page,
            limit: 20,
            search: search || undefined,
            level: level || undefined,
            jenis: jenis || undefined,
            statusId: statusId || undefined,
          },
        });
        setRows(res.data.result || []);
        setPages(res.data.totalPage || 0);
        setTotalRows(res.data.totalRows || 0);
      } catch (err) {
        toast({
          title: "Gagal memuat pengajuan",
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
  }, [page, search, level, jenis, statusId, toast]);

  const applyFilter = () => {
    setPage(0);
    setSearch(searchInput.trim());
  };

  const resetFilter = () => {
    setSearchInput("");
    setSearch("");
    setLevel("");
    setJenis("");
    setStatusId("");
    setPage(0);
  };

  const cetak = async (event, item, format) => {
    event.stopPropagation();
    const key = `${item.id}_${format}`;
    setLoadingCetak((prev) => ({ ...prev, [key]: true }));
    try {
      await unduhDokumenPengajuan(item.id, format, item.nomor);
      toast({
        title: "Berhasil",
        description: `Dokumen pengajuan ${format === "docx" ? "Word" : "PDF"} berhasil diunduh`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: "Gagal mengunduh",
        description: await bacaErrorUnduhan(err),
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoadingCetak((prev) => ({ ...prev, [key]: false }));
    }
  };

  return (
    <LayoutKPBPN>
      <Box py={{ base: 4, md: 8 }}>
        <Container maxW="7xl">
          <Flex
            justify="space-between"
            align={{ base: "stretch", md: "center" }}
            direction={{ base: "column", md: "row" }}
            gap={3}
            mb={6}
          >
            <Box>
              <Heading size="lg">Pengajuan Barang & Jasa</Heading>
              <Text color="gray.500" mt={1}>
                Ajukan kebutuhan barang atau jasa, lalu isi harga aktual setelah
                pembelian.
              </Text>
            </Box>
            <Button
              as={Link}
              to="/pengajuan/tambah"
              colorScheme="orange"
              alignSelf={{ base: "stretch", md: "center" }}
            >
              Buat Pengajuan
            </Button>
          </Flex>

          <Box
            bg="white"
            borderWidth="1px"
            borderRadius="md"
            p={{ base: 3, md: 4 }}
            mb={4}
          >
            <SimpleGrid columns={{ base: 1, md: 4 }} spacing={3}>
              <Input
                placeholder="Cari nomor, keperluan, atau lokasi"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") applyFilter();
                }}
              />
              <Select value={jenis} onChange={(e) => setJenis(e.target.value)}>
                <option value="">Semua jenis</option>
                <option value="barang">Barang</option>
                <option value="jasa">Jasa</option>
              </Select>
              <Select value={level} onChange={(e) => setLevel(e.target.value)}>
                <option value="">Semua level</option>
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
              </Select>
              <Select
                value={statusId}
                onChange={(e) => setStatusId(e.target.value)}
              >
                <option value="">Semua status</option>
                {statusOptions.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.nama}
                  </option>
                ))}
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
                Belum ada pengajuan barang atau jasa.
              </Text>
            ) : (
              <Table size="sm">
                <Thead>
                  <Tr>
                    <Th>Nomor</Th>
                    <Th>Tanggal</Th>
                    <Th>Jenis</Th>
                    <Th>Level</Th>
                    <Th>Status</Th>
                    <Th>Pemohon</Th>
                    <Th>Mengetahui</Th>
                    <Th>Menyetujui</Th>
                    <Th isNumeric>Item</Th>
                    <Th isNumeric>Estimasi</Th>
                    <Th isNumeric>Aktual</Th>
                    <Th>Dokumen</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {rows.map((item) => (
                    <Tr
                      key={item.id}
                      cursor="pointer"
                      _hover={{ bg: "orange.50" }}
                      onClick={() => history.push(`/pengajuan/detail/${item.id}`)}
                    >
                      <Td fontWeight="semibold">{item.nomor}</Td>
                      <Td>{formatTanggal(item.tanggal)}</Td>
                      <Td textTransform="capitalize">{item.jenis}</Td>
                      <Td>
                        <Badge colorScheme={item.level === "urgent" ? "red" : "gray"}>
                          {item.level === "urgent" ? "Urgent" : "Normal"}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge colorScheme={statusColor(item.statusPengajuanKpbpn?.nama)}>
                          {item.statusPengajuanKpbpn?.nama || "-"}
                        </Badge>
                      </Td>
                      <Td>{item.userKPBPN?.nama || "-"}</Td>
                      <Td>{item.mengetahui?.nama || "-"}</Td>
                      <Td>{item.menyetujui?.nama || "-"}</Td>
                      <Td isNumeric>{item.jumlahItem || 0}</Td>
                      <Td isNumeric>{formatRupiah(item.totalEstimasi)}</Td>
                      <Td isNumeric>{formatRupiah(item.totalAktual)}</Td>
                      <Td onClick={(event) => event.stopPropagation()}>
                        <HStack spacing={2}>
                          <Button
                            size="xs"
                            variant="outline"
                            isLoading={loadingCetak[`${item.id}_pdf`]}
                            onClick={(event) => cetak(event, item, "pdf")}
                          >
                            PDF
                          </Button>
                          <Button
                            size="xs"
                            variant="outline"
                            isLoading={loadingCetak[`${item.id}_docx`]}
                            onClick={(event) => cetak(event, item, "docx")}
                          >
                            Word
                          </Button>
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </Box>

          <Flex justify="space-between" align="center" mt={4} wrap="wrap" gap={3}>
            <Text fontSize="sm" color="gray.500">
              {totalRows} pengajuan
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

export default DaftarPengajuan;
