import React, { useEffect, useState } from "react";
import axios from "axios";
import { useHistory } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
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
  Textarea,
  Th,
  Thead,
  Tr,
  useToast,
} from "@chakra-ui/react";
import LayoutKPBPN from "../../Componets/KPBPN/LayoutKPBPN";
import { formatJumlah } from "../../lib/pengajuanBarjas";

const API_BASE = import.meta.env.VITE_REACT_APP_API_BASE_URL;
const formKosong = {
  id: null,
  nama: "",
  jenis: "barang",
  satuan: "unit",
  spesifikasi: "",
};

function DaftarBarangJasa() {
  const toast = useToast();
  const history = useHistory();
  const [rows, setRows] = useState([]);
  const [belum, setBelum] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [jenis, setJenis] = useState("");
  const [form, setForm] = useState(formKosong);
  const [tampilForm, setTampilForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sedangDaftar, setSedangDaftar] = useState(null);

  const muat = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/pengajuan-barjas/barang-jasa`, {
        params: {
          search: search || undefined,
          jenis: jenis || undefined,
        },
      });
      setRows(res.data.result || []);
      setBelum(res.data.belum || []);
    } catch (err) {
      toast({
        title: "Gagal memuat daftar item",
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
    muat();
  }, [search, jenis]);

  const simpan = async () => {
    if (!form.nama.trim()) {
      toast({
        title: "Nama wajib diisi",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    setIsSaving(true);
    try {
      const url = form.id
        ? `${API_BASE}/pengajuan-barjas/barang-jasa/edit/${form.id}`
        : `${API_BASE}/pengajuan-barjas/barang-jasa`;
      const res = await axios.post(url, form);
      toast({
        title: "Berhasil",
        description: res.data.message,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setForm(formKosong);
      setTampilForm(false);
      await muat();
    } catch (err) {
      toast({
        title: "Gagal menyimpan",
        description: err.response?.data?.error || err.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const hapus = async (row) => {
    try {
      const res = await axios.post(
        `${API_BASE}/pengajuan-barjas/barang-jasa/delete/${row.id}`,
      );
      toast({
        title: "Berhasil",
        description: res.data.message,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      await muat();
    } catch (err) {
      toast({
        title: "Gagal menghapus",
        description: err.response?.data?.error || err.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    }
  };

  const daftarkan = async (kelompok) => {
    setSedangDaftar(kelompok.itemPengajuanId);
    try {
      const res = await axios.post(`${API_BASE}/pengajuan-barjas/barang-jasa/daftarkan`, {
        itemPengajuanId: kelompok.itemPengajuanId,
      });
      toast({
        title: "Item didaftarkan",
        description: res.data.message,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      await muat();
    } catch (err) {
      toast({
        title: "Gagal mendaftarkan",
        description: err.response?.data?.error || err.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setSedangDaftar(null);
    }
  };

  return (
    <LayoutKPBPN>
      <Box py={{ base: 4, md: 8 }}>
        <Container maxW="7xl">
          <HStack justify="space-between" mb={6} align="start" wrap="wrap">
            <Box>
              <Heading size="lg">Daftar Item</Heading>
              <Text color="gray.500" mt={1}>
                Daftarkan barang atau jasa untuk melacak jumlah yang diajukan
                dan stok barang.
              </Text>
            </Box>
            <Button
              colorScheme="orange"
              onClick={() => {
                setForm(formKosong);
                setTampilForm((prev) => !prev);
              }}
            >
              Daftarkan item
            </Button>
          </HStack>

          {tampilForm && (
            <Box bg="white" borderWidth="1px" borderRadius="md" p={{ base: 3, md: 5 }} mb={4}>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Nama</FormLabel>
                  <Input
                    value={form.nama}
                    onChange={(e) => setForm((prev) => ({ ...prev, nama: e.target.value }))}
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Jenis</FormLabel>
                  <Select
                    value={form.jenis}
                    onChange={(e) => setForm((prev) => ({ ...prev, jenis: e.target.value }))}
                  >
                    <option value="barang">Barang</option>
                    <option value="jasa">Jasa</option>
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>Satuan</FormLabel>
                  <Input
                    value={form.satuan}
                    onChange={(e) => setForm((prev) => ({ ...prev, satuan: e.target.value }))}
                    placeholder="unit, liter, hari"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Spesifikasi</FormLabel>
                  <Textarea
                    value={form.spesifikasi}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, spesifikasi: e.target.value }))
                    }
                  />
                </FormControl>
              </SimpleGrid>
              <HStack mt={4}>
                <Button colorScheme="orange" isLoading={isSaving} onClick={simpan}>
                  {form.id ? "Simpan perubahan" : "Simpan"}
                </Button>
                <Button variant="outline" onClick={() => setTampilForm(false)}>
                  Tutup
                </Button>
              </HStack>
            </Box>
          )}

          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3} mb={4}>
            <Input
              placeholder="Cari nama item"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setSearch(searchInput.trim());
              }}
              bg="white"
            />
            <Select value={jenis} onChange={(e) => setJenis(e.target.value)} bg="white">
              <option value="">Semua jenis</option>
              <option value="barang">Barang</option>
              <option value="jasa">Jasa</option>
            </Select>
            <Button onClick={() => setSearch(searchInput.trim())}>Cari</Button>
          </SimpleGrid>

          <Box bg="white" borderWidth="1px" borderRadius="md" overflowX="auto" mb={6}>
            {isLoading ? (
              <Center py={16}>
                <Spinner />
              </Center>
            ) : rows.length === 0 ? (
              <Text textAlign="center" color="gray.500" py={12}>
                Belum ada item terdaftar.
              </Text>
            ) : (
              <Table size="sm">
                <Thead>
                  <Tr>
                    <Th>Nama</Th>
                    <Th>Jenis</Th>
                    <Th>Satuan</Th>
                    <Th isNumeric>Total diajukan</Th>
                    <Th isNumeric>Ditolak</Th>
                    <Th isNumeric>Berjalan</Th>
                    <Th isNumeric>Stok</Th>
                    <Th isNumeric>Pengajuan</Th>
                    <Th></Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {rows.map((row) => (
                    <Tr
                      key={row.id}
                      cursor="pointer"
                      _hover={{ bg: "orange.50" }}
                      onClick={() =>
                        history.push(`/pengajuan/barang-jasa/detail/${row.id}`)
                      }
                    >
                      <Td>
                        <Text fontWeight="semibold">{row.nama}</Text>
                        {row.spesifikasi && (
                          <Text fontSize="sm" color="gray.500">
                            {row.spesifikasi}
                          </Text>
                        )}
                      </Td>
                      <Td textTransform="capitalize">{row.jenis}</Td>
                      <Td>{row.satuan}</Td>
                      <Td isNumeric>{formatJumlah(row.totalJumlah)}</Td>
                      <Td isNumeric>{formatJumlah(row.jumlahDitolak)}</Td>
                      <Td isNumeric>{formatJumlah(row.jumlahBerjalan)}</Td>
                      <Td isNumeric>
                        {row.jenis === "barang" ? (
                          <Text
                            as="span"
                            color={row.stokHabis ? "red.500" : undefined}
                            fontWeight={row.stokHabis ? "semibold" : undefined}
                          >
                            {formatJumlah(row.stok)}
                            {row.stokHabis ? " · Habis" : ""}
                          </Text>
                        ) : (
                          "-"
                        )}
                      </Td>
                      <Td isNumeric>{row.jumlahPengajuan}</Td>
                      <Td onClick={(event) => event.stopPropagation()}>
                        <HStack>
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() =>
                              history.push(`/pengajuan/barang-jasa/detail/${row.id}`)
                            }
                          >
                            Detail
                          </Button>
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => {
                              setForm({
                                id: row.id,
                                nama: row.nama,
                                jenis: row.jenis,
                                satuan: row.satuan,
                                spesifikasi: row.spesifikasi || "",
                              });
                              setTampilForm(true);
                            }}
                          >
                            Ubah
                          </Button>
                          {row.jumlahPengajuan === 0 && (
                            <Button
                              size="xs"
                              variant="outline"
                              colorScheme="red"
                              onClick={() => hapus(row)}
                            >
                              Hapus
                            </Button>
                          )}
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </Box>

          <Heading size="md" mb={3}>
            Belum didaftarkan
          </Heading>
          <Box bg="white" borderWidth="1px" borderRadius="md" overflowX="auto">
            {belum.length === 0 ? (
              <Text textAlign="center" color="gray.500" py={10}>
                Semua item pengajuan sudah terdaftar.
              </Text>
            ) : (
              <Table size="sm">
                <Thead>
                  <Tr>
                    <Th>Nama</Th>
                    <Th>Jenis</Th>
                    <Th>Satuan</Th>
                    <Th isNumeric>Total diajukan</Th>
                    <Th isNumeric>Baris</Th>
                    <Th></Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {belum.map((row) => (
                    <Tr key={`${row.nama}-${row.jenis}-${row.satuan}`}>
                      <Td fontWeight="semibold">{row.nama}</Td>
                      <Td textTransform="capitalize">{row.jenis}</Td>
                      <Td>{row.satuan}</Td>
                      <Td isNumeric>{formatJumlah(row.totalJumlah)}</Td>
                      <Td isNumeric>{row.jumlahBaris}</Td>
                      <Td>
                        <Button
                          size="xs"
                          colorScheme="orange"
                          variant="outline"
                          isLoading={sedangDaftar === row.itemPengajuanId}
                          onClick={() => daftarkan(row)}
                        >
                          Daftarkan
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </Box>
        </Container>
      </Box>
    </LayoutKPBPN>
  );
}

export default DaftarBarangJasa;
