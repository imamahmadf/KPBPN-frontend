import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import ReactPaginate from "react-paginate";
import {
  Box,
  Button,
  Center,
  Container,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  Select,
  SimpleGrid,
  Spinner,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useToast,
} from "@chakra-ui/react";
import { useSelector } from "react-redux";
import LayoutKPBPN from "../../Componets/KPBPN/LayoutKPBPN";
import {
  selectIsKpbpnAdmin,
  selectScopedMitraId,
} from "../../Redux/Reducers/auth";
import "../../Style/pagination.css";

const API_BASE = import.meta.env.VITE_REACT_APP_API_BASE_URL;

const KLASIFIKASI_FIELDS = [
  { key: "area", label: "Area" },
  { key: "operasional", label: "Operasional" },
  { key: "lingkungan", label: "Lingkungan" },
  { key: "penyaluran", label: "Penyaluran" },
  { key: "statusKepemilikan", label: "Status Kepemilikan" },
  { key: "tingkatProduksi", label: "Tingkat Produksi" },
];

const klasifikasiFromSumur = (sumur) => ({
  area: sumur?.area ?? "",
  operasional: sumur?.operasional ?? "",
  lingkungan: sumur?.lingkungan ?? "",
  penyaluran: sumur?.penyaluran ?? "",
  statusKepemilikan: sumur?.statusKepemilikan ?? "",
  tingkatProduksi: sumur?.tingkatProduksi ?? "",
});

const displayValue = (value) =>
  value === null || value === undefined || value === "" ? "-" : String(value);

const isKlasifikasiChanged = (item, draft) =>
  KLASIFIKASI_FIELDS.some(
    (field) =>
      String(item?.[field.key] ?? "") !== String(draft?.[field.key] ?? ""),
  );

const MobileField = ({ label, children }) => (
  <Box minW={0}>
    <Text
      fontSize="xs"
      color="gray.500"
      fontWeight="semibold"
      textTransform="uppercase"
      letterSpacing="wide"
      mb={0.5}
    >
      {label}
    </Text>
    <Box fontSize="sm" color="gray.700" wordBreak="break-word">
      {children}
    </Box>
  </Box>
);

function KlasifikasiSumur() {
  const toast = useToast();
  const dataListRef = useRef(null);
  const isKpbpnAdmin = useSelector(selectIsKpbpnAdmin);
  const scopedMitraId = useSelector(selectScopedMitraId);

  const [dataSumur, setDataSumur] = useState([]);
  const [dataMitra, setDataMitra] = useState([]);
  const [page, setPage] = useState(0);
  const [limit] = useState(100);
  const [pages, setPages] = useState(0);
  const [rows, setRows] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const [mitraFilterId, setMitraFilterId] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [drafts, setDrafts] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const scrollToDataList = () => {
    dataListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const changePage = ({ selected }) => {
    if (isEditing) return;
    setPage(selected);
    scrollToDataList();
  };

  const fetchDataMitra = async () => {
    if (!isKpbpnAdmin) return;
    try {
      const res = await axios.get(`${API_BASE}/mitra/get`);
      setDataMitra(res.data.resultMitra || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDataSumur = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/sumur-minyak/get`, {
        params: {
          page,
          limit,
          mitraId: scopedMitraId || mitraFilterId || undefined,
          search: search || undefined,
        },
      });
      setDataSumur(res.data.result || []);
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
    fetchDataMitra();
  }, [isKpbpnAdmin]);

  useEffect(() => {
    if (isEditing) return;
    fetchDataSumur();
  }, [page, limit, mitraFilterId, search, scopedMitraId]);

  const startEdit = () => {
    const next = {};
    dataSumur.forEach((item) => {
      next[item.id] = klasifikasiFromSumur(item);
    });
    setDrafts(next);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setDrafts({});
    setIsEditing(false);
  };

  const updateDraft = (id, key, value) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [key]: value,
      },
    }));
  };

  const handleSaveAll = async () => {
    const changed = dataSumur.filter((item) =>
      isKlasifikasiChanged(item, drafts[item.id]),
    );

    if (!changed.length) {
      toast({
        title: "Tidak ada perubahan",
        status: "info",
        duration: 2500,
        isClosable: true,
      });
      setIsEditing(false);
      setDrafts({});
      return;
    }

    setIsSaving(true);
    try {
      await Promise.all(
        changed.map((item) =>
          axios.post(
            `${API_BASE}/sumur-minyak/edit-klasifikasi/${item.id}`,
            drafts[item.id],
          ),
        ),
      );
      toast({
        title: "Klasifikasi sumur berhasil disimpan",
        description: `${changed.length} data diperbarui`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setIsEditing(false);
      setDrafts({});
      await fetchDataSumur();
    } catch (err) {
      toast({
        title: "Gagal menyimpan klasifikasi",
        description: err.response?.data?.error || err.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFilter = () => {
    if (isEditing) return;
    setPage(0);
    setSearch(searchInput.trim());
  };

  const resetFilter = () => {
    if (isEditing) return;
    setMitraFilterId("");
    setSearchInput("");
    setSearch("");
    setPage(0);
  };

  const renderKlasifikasiValue = (item, field) => {
    if (!isEditing) return displayValue(item[field.key]);

    return (
      <Input
        type="number"
        step="1"
        size="sm"
        value={drafts[item.id]?.[field.key] ?? ""}
        onChange={(e) => updateDraft(item.id, field.key, e.target.value)}
        placeholder="-"
        bg="white"
      />
    );
  };

  return (
    <LayoutKPBPN>
      <Box
        bgColor="secondary"
        pb={{ base: 6, md: "40px" }}
        px={{ base: 3, sm: 4, md: 6, lg: "30px" }}
        minH="90vh"
        overflowX="hidden"
      >
        <Container
          variant="primary"
          maxW="100%"
          minW={0}
          p={{ base: 4, sm: 5, md: 6, lg: "30px" }}
          my={{ base: 4, md: "30px" }}
        >
          <Flex
            align={{ base: "stretch", sm: "center" }}
            direction={{ base: "column", sm: "row" }}
            gap={3}
            mb={6}
          >
            <Heading
              color="kpbpn"
              size={{ base: "md", md: "lg" }}
              textAlign={{ base: "center", sm: "left" }}
            >
              Klasifikasi Sumur
            </Heading>
            <HStack
              spacing={3}
              ml={{ sm: "auto" }}
              justify={{ base: "stretch", sm: "flex-end" }}
            >
              {isEditing ? (
                <>
                  <Button
                    variant="ghost"
                    onClick={cancelEdit}
                    isDisabled={isSaving}
                    w={{ base: "full", sm: "auto" }}
                  >
                    Batal
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSaveAll}
                    isLoading={isSaving}
                    w={{ base: "full", sm: "auto" }}
                  >
                    Simpan
                  </Button>
                </>
              ) : (
                <Button
                  variant="primary"
                  onClick={startEdit}
                  isDisabled={isLoading || dataSumur.length === 0}
                  w={{ base: "full", sm: "auto" }}
                >
                  Edit
                </Button>
              )}
            </HStack>
          </Flex>

          <Box mb={6} p={4} borderWidth="1px" borderRadius="lg" bg="gray.50">
            <Stack
              direction={{ base: "column", md: "row" }}
              spacing={4}
              flexWrap="wrap"
              align={{ base: "stretch", md: "flex-end" }}
            >
              {isKpbpnAdmin && (
                <FormControl maxW={{ md: "220px" }}>
                  <FormLabel fontSize="sm">Mitra</FormLabel>
                  <Select
                    placeholder="Semua mitra"
                    value={mitraFilterId}
                    isDisabled={isEditing}
                    onChange={(e) => {
                      setMitraFilterId(e.target.value);
                      setPage(0);
                    }}
                  >
                    {dataMitra.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nama}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              )}

              <FormControl maxW={{ md: "280px" }}>
                <FormLabel fontSize="sm">Cari</FormLabel>
                <Input
                  placeholder="Nama, nomor, atau alamat..."
                  value={searchInput}
                  isDisabled={isEditing}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleFilter()}
                />
              </FormControl>

              <HStack spacing={3}>
                <Button
                  variant="primary"
                  onClick={handleFilter}
                  isDisabled={isEditing}
                >
                  Terapkan
                </Button>
                <Button
                  variant="ghost"
                  onClick={resetFilter}
                  isDisabled={isEditing}
                >
                  Reset
                </Button>
              </HStack>
            </Stack>
          </Box>

          <Box ref={dataListRef} minW={0}>
            {isLoading ? (
              <Center py={10}>
                <Spinner size="lg" color="kpbpn" />
              </Center>
            ) : dataSumur.length === 0 ? (
              <Center py={10}>
                <Text color="gray.500">Belum ada data klasifikasi sumur</Text>
              </Center>
            ) : (
              <>
                <Stack display={{ base: "flex", lg: "none" }} spacing={3}>
                  {dataSumur.map((item) => (
                    <Box
                      key={item.id}
                      p={4}
                      borderRadius="lg"
                      border="1px solid"
                      borderColor="gray.200"
                      bg="white"
                      boxShadow="sm"
                    >
                      <Box mb={3}>
                        <Text fontWeight="bold" color="kpbpn">
                          {item.nama || "-"}
                        </Text>
                        <Text fontSize="sm" color="gray.500">
                          {item.nomor || "-"}
                          {item.mitra?.nama ? ` · ${item.mitra.nama}` : ""}
                        </Text>
                      </Box>
                      <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                        {KLASIFIKASI_FIELDS.map((field) => (
                          <MobileField key={field.key} label={field.label}>
                            {renderKlasifikasiValue(item, field)}
                          </MobileField>
                        ))}
                      </SimpleGrid>
                    </Box>
                  ))}
                </Stack>

                <Box
                  display={{ base: "none", lg: "block" }}
                  overflowX="auto"
                  borderWidth="1px"
                  borderRadius="lg"
                >
                  <Table size="sm">
                    <Thead bg="gray.50">
                      <Tr>
                        <Th>No</Th>
                        <Th>Nama</Th>
                        <Th>Nomor</Th>
                        <Th>Mitra</Th>
                        {KLASIFIKASI_FIELDS.map((field) => (
                          <Th key={field.key}>{field.label}</Th>
                        ))}
                      </Tr>
                    </Thead>
                    <Tbody>
                      {dataSumur.map((item, index) => (
                        <Tr key={item.id}>
                          <Td>{page * limit + index + 1}</Td>
                          <Td fontWeight="medium">{item.nama || "-"}</Td>
                          <Td>{item.nomor || "-"}</Td>
                          <Td>{item.mitra?.nama || "-"}</Td>
                          {KLASIFIKASI_FIELDS.map((field) => (
                            <Td
                              key={field.key}
                              minW={isEditing ? "110px" : undefined}
                            >
                              {renderKlasifikasiValue(item, field)}
                            </Td>
                          ))}
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              </>
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
                <Box
                  overflowX="auto"
                  py={1}
                  pointerEvents={isEditing ? "none" : "auto"}
                  opacity={isEditing ? 0.5 : 1}
                >
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

export default KlasifikasiSumur;
