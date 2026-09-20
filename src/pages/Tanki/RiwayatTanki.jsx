import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  Badge,
  Box,
  Button,
  Center,
  Collapse,
  Container,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  Select,
  SimpleGrid,
  Skeleton,
  Spacer,
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
  VStack,
} from "@chakra-ui/react";
import { BsChevronDown, BsChevronUp } from "react-icons/bs";
import LayoutKPBPN from "../../Componets/KPBPN/LayoutKPBPN";
import VolumeMultiSatuan from "../../Componets/VolumeMultiSatuan";
import { formatVolumeNumber } from "../../lib/volumeSatuan";

const API_BASE = import.meta.env.VITE_REACT_APP_API_BASE_URL;

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatAngka = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  const angka = Number(value);
  if (Number.isNaN(angka)) return String(value);
  return formatVolumeNumber(angka);
};

const rowKey = (item) =>
  `${item.tankiId || "-"}-${item.konfirmasiId || item.suratJalanId || "-"}`;

const getTanggalPengisian = (item) => {
  if (item?.tanggalPengisian) return item.tanggalPengisian;
  const times = (item?.pengisian || [])
    .map((pengisian) => new Date(pengisian.tanggal).getTime())
    .filter((time) => !Number.isNaN(time));
  if (times.length) return new Date(Math.max(...times)).toISOString();
  return item?.tanggalKonfirmasi || item?.tanggalSuratJalan || null;
};

const sortByTanggalPengisian = (items) =>
  [...items].sort((a, b) => {
    const timeA = new Date(getTanggalPengisian(a)).getTime() || 0;
    const timeB = new Date(getTanggalPengisian(b)).getTime() || 0;
    return timeB - timeA;
  });

const summarizeItems = (items) => {
  const sj = new Set(items.map((item) => item.suratJalanId).filter(Boolean));
  return {
    jumlahSuratJalan: sj.size || items.length,
    jumlahKonfirmasi: items.length,
    jumlahMasihDiTanki: items.filter((item) => item.masihDiTanki).length,
    totalVolumeBarrel: items.reduce(
      (sum, item) => sum + (Number(item.volumeBarrel) || 0),
      0,
    ),
  };
};

const MobileField = ({ label, children }) => (
  <Box>
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

const RiwayatTanki = () => {
  const toast = useToast();
  const dataListRef = useRef(null);

  const [dataTanki, setDataTanki] = useState([]);
  const [dataRiwayat, setDataRiwayat] = useState([]);
  const [ringkasan, setRingkasan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [tangkiFilterId, setTangkiFilterId] = useState("");
  const [tanggalAwal, setTanggalAwal] = useState("");
  const [tanggalAkhir, setTanggalAkhir] = useState("");
  const [isiSaatIni, setIsiSaatIni] = useState("0");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [collapsedTankiIds, setCollapsedTankiIds] = useState([]);

  const hasActiveFilter =
    Boolean(tangkiFilterId) ||
    Boolean(tanggalAwal) ||
    Boolean(tanggalAkhir) ||
    Boolean(search) ||
    isiSaatIni !== "0";

  const resetFilter = () => {
    setTangkiFilterId("");
    setTanggalAwal("");
    setTanggalAkhir("");
    setIsiSaatIni("0");
    setSearch("");
    setSearchInput("");
  };

  const toggleExpand = (item) => {
    const key = rowKey(item);
    setExpandedKeys((prev) =>
      prev.includes(key) ? prev.filter((value) => value !== key) : [...prev, key],
    );
  };

  const toggleTankiSection = (tankiId) => {
    setCollapsedTankiIds((prev) =>
      prev.includes(tankiId)
        ? prev.filter((id) => id !== tankiId)
        : [...prev, tankiId],
    );
  };

  const groupedByTanki = useMemo(() => {
    const map = new Map();
    const tanksToShow = tangkiFilterId
      ? dataTanki.filter((item) => String(item.id) === String(tangkiFilterId))
      : dataTanki;

    tanksToShow.forEach((tanki) => {
      map.set(tanki.id, {
        tankiId: tanki.id,
        kode: tanki.kode || `Tanki #${tanki.id}`,
        stasiun: tanki.stasiunPengumpulMinyak?.nama || "-",
        kapasitas: tanki.kapasitas,
        satuan: tanki.satuanVolume?.satuan,
        items: [],
      });
    });

    dataRiwayat.forEach((item) => {
      const tankiId = item.tankiId;
      if (tangkiFilterId && String(tankiId) !== String(tangkiFilterId)) return;

      if (!map.has(tankiId)) {
        map.set(tankiId, {
          tankiId,
          kode: item.tankiKode || `Tanki #${tankiId || "-"}`,
          stasiun: "-",
          kapasitas: null,
          satuan: item.satuan,
          items: [],
        });
      }
      map.get(tankiId).items.push(item);
    });

    const hideEmpty = Boolean(search || tanggalAwal || tanggalAkhir || isiSaatIni === "1");

    return Array.from(map.values())
      .filter((group) => (hideEmpty && !tangkiFilterId ? group.items.length > 0 : true))
      .map((group) => ({
        ...group,
        items: sortByTanggalPengisian(group.items),
        ringkasan: summarizeItems(group.items),
      }))
      .sort((a, b) => String(a.kode).localeCompare(String(b.kode), "id"));
  }, [
    dataTanki,
    dataRiwayat,
    tangkiFilterId,
    search,
    tanggalAwal,
    tanggalAkhir,
    isiSaatIni,
  ]);

  const fetchDataTanki = async () => {
    try {
      const res = await axios.get(`${API_BASE}/tanki/get/tanki`);
      setDataTanki(res.data.result || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRiwayat = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/tanki/get/riwayat`, {
        params: {
          page: 0,
          limit: 1000,
          tangkiId: tangkiFilterId || undefined,
          startDate: tanggalAwal || undefined,
          endDate: tanggalAkhir || undefined,
          isiSaatIni: isiSaatIni === "1" ? "1" : undefined,
          search: search || undefined,
        },
      });
      setDataRiwayat(res.data.result || []);
      setRingkasan(res.data.ringkasan || null);
      setExpandedKeys([]);
    } catch (err) {
      console.error(err);
      setDataRiwayat([]);
      setRingkasan(null);
      toast({
        title: "Gagal memuat riwayat tanki",
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
    fetchDataTanki();
  }, []);

  useEffect(() => {
    fetchRiwayat();
  }, [tangkiFilterId, tanggalAwal, tanggalAkhir, isiSaatIni, search]);

  const renderNomorSuratJalan = (item) => {
    if (!item.nomorSuratJalan) return "-";
    if (!item.suratJalanId) return item.nomorSuratJalan;
    return (
      <Text
        as={Link}
        to={`/pengiriman-kpbpn/detail-surat-jalan/${item.suratJalanId}`}
        color="blue.600"
        fontWeight="medium"
        _hover={{ textDecoration: "underline" }}
      >
        {item.nomorSuratJalan}
      </Text>
    );
  };

  const renderStatusIsi = (item) =>
    item.masihDiTanki ? (
      <Badge colorScheme="green" variant="subtle">
        Masih di tanki
      </Badge>
    ) : (
      <Badge colorScheme="gray" variant="subtle">
        Sudah dibongkar
      </Badge>
    );

  const renderPengisianDetail = (item) => {
    const list = item.pengisian || [];
    if (!list.length) {
      return (
        <Text fontSize="sm" color="gray.500">
          Tidak ada data BAST terkait
        </Text>
      );
    }

    return (
      <Stack spacing={2}>
        {list.map((pengisian) => (
          <Box
            key={pengisian.id}
            p={3}
            borderRadius="md"
            bg="gray.50"
            border="1px solid"
            borderColor="gray.200"
          >
            <Text fontSize="sm" fontWeight="medium">
              {pengisian.nomorSurat || `BAST #${pengisian.id}`}
            </Text>
            <Text fontSize="xs" color="gray.500">
              {formatDate(pengisian.tanggal)}
            </Text>
            <HStack spacing={4} mt={1} flexWrap="wrap">
              <Text fontSize="sm">
                Gross: {formatAngka(pengisian.gross)} {pengisian.satuan || ""}
              </Text>
              <Text fontSize="sm">
                Net: {formatAngka(pengisian.net)} {pengisian.satuan || ""}
              </Text>
              {pengisian.sudahDibongkar ? (
                <Badge colorScheme="orange" variant="subtle">
                  Dibongkar {formatDate(pengisian.tanggalBongkar)}
                </Badge>
              ) : (
                <Badge colorScheme="green" variant="subtle">
                  Belum dibongkar
                </Badge>
              )}
            </HStack>
          </Box>
        ))}
      </Stack>
    );
  };

  const emptyMessage =
    isiSaatIni === "1"
      ? "Belum ada surat jalan yang masih berada di tanki ini"
      : "Belum ada riwayat surat jalan untuk tanki ini";

  const renderItemCards = (items) =>
    items.map((item) => {
      const key = rowKey(item);
      const isExpanded = expandedKeys.includes(key);
      return (
        <Box
          key={key}
          p={4}
          borderRadius="lg"
          border="1px solid"
          borderColor="gray.200"
          bg="white"
        >
          <HStack justify="space-between" mb={3} align="start">
            <Box>
              <Text fontWeight="semibold">
                {item.nomorSuratJalan || "Tanpa nomor SJ"}
              </Text>
              <Text fontSize="xs" color="gray.500">
                {formatDate(getTanggalPengisian(item))}
              </Text>
            </Box>
            {renderStatusIsi(item)}
          </HStack>
          <SimpleGrid columns={2} spacing={3}>
            <MobileField label="Konfirmasi">{item.nomorKonfirmasi || "-"}</MobileField>
            <MobileField label="Mitra">{item.mitra || "-"}</MobileField>
            <MobileField label="Supir">{item.supir || "-"}</MobileField>
            <MobileField label="No. Pol">{item.plat || "-"}</MobileField>
            <MobileField label="Volume">
              <VolumeMultiSatuan volume={item.volume} satuan={item.satuan} />
            </MobileField>
            <MobileField label="API">{formatAngka(item.api)}</MobileField>
            <MobileField label="BSNW">
              {item.BSNW != null ? `${formatAngka(item.BSNW)}%` : "-"}
            </MobileField>
          </SimpleGrid>
          <Button
            mt={4}
            size="sm"
            variant="outline"
            w="full"
            rightIcon={isExpanded ? <BsChevronUp /> : <BsChevronDown />}
            onClick={() => toggleExpand(item)}
          >
            {isExpanded ? "Tutup BAST" : "Lihat BAST"}
          </Button>
          <Collapse in={isExpanded} animateOpacity>
            <Box mt={3}>{renderPengisianDetail(item)}</Box>
          </Collapse>
        </Box>
      );
    });

  const renderItemTable = (items) => (
    <Box overflowX="auto" borderWidth="1px" borderRadius="lg" bg="white">
      <Table size="sm">
        <Thead bg="gray.50">
          <Tr>
            <Th>No</Th>
            <Th>Tanggal Pengisian</Th>
            <Th>Surat Jalan</Th>
            <Th>Konfirmasi</Th>
            <Th>Mitra</Th>
            <Th>Supir</Th>
            <Th>No. Pol</Th>
            <Th>Volume</Th>
            <Th isNumeric>API</Th>
            <Th isNumeric>BSNW</Th>
            <Th>Status</Th>
            <Th>BAST</Th>
          </Tr>
        </Thead>
        <Tbody>
          {items.length === 0 ? (
            <Tr>
              <Td colSpan={12} textAlign="center" py={8}>
                {emptyMessage}
              </Td>
            </Tr>
          ) : (
            items.map((item, index) => {
              const key = rowKey(item);
              const isExpanded = expandedKeys.includes(key);
              return (
                <React.Fragment key={key}>
                  <Tr>
                    <Td>{index + 1}</Td>
                    <Td>
                      {formatDate(getTanggalPengisian(item))}
                    </Td>
                    <Td>{renderNomorSuratJalan(item)}</Td>
                    <Td>{item.nomorKonfirmasi || "-"}</Td>
                    <Td>{item.mitra || "-"}</Td>
                    <Td>{item.supir || "-"}</Td>
                    <Td>{item.plat || "-"}</Td>
                    <Td>
                      <VolumeMultiSatuan volume={item.volume} satuan={item.satuan} />
                    </Td>
                    <Td isNumeric>{formatAngka(item.api)}</Td>
                    <Td isNumeric>
                      {item.BSNW != null ? `${formatAngka(item.BSNW)}%` : "-"}
                    </Td>
                    <Td>{renderStatusIsi(item)}</Td>
                    <Td>
                      <Button
                        size="xs"
                        variant="outline"
                        rightIcon={isExpanded ? <BsChevronUp /> : <BsChevronDown />}
                        onClick={() => toggleExpand(item)}
                      >
                        {item.pengisian?.length || 0} BAST
                      </Button>
                    </Td>
                  </Tr>
                  {isExpanded && (
                    <Tr>
                      <Td colSpan={12} bg="gray.50" py={4}>
                        {renderPengisianDetail(item)}
                      </Td>
                    </Tr>
                  )}
                </React.Fragment>
              );
            })
          )}
        </Tbody>
      </Table>
    </Box>
  );

  const renderTankiHeader = (group, compact = false) => {
    const isCollapsed = collapsedTankiIds.includes(group.tankiId);
    return (
      <Flex
        align={{ base: "stretch", md: "center" }}
        direction={{ base: "column", md: "row" }}
        gap={3}
        px={compact ? 0 : 1}
        cursor="pointer"
        onClick={() => toggleTankiSection(group.tankiId)}
      >
        <HStack spacing={3} align="start">
          <Box>
            <Heading size="md" color="kpbpn">
              Tanki {group.kode}
            </Heading>
            <Text fontSize="sm" color="gray.500">
              {group.stasiun}
              {group.kapasitas != null
                ? ` · Kapasitas ${formatAngka(group.kapasitas)} ${group.satuan || ""}`
                : ""}
            </Text>
          </Box>
        </HStack>
        <Spacer />
        <HStack spacing={2} flexWrap="wrap">
          <Badge colorScheme="blue" px={3} py={1} borderRadius="md">
            Surat jalan: {group.ringkasan.jumlahSuratJalan}
          </Badge>
          <Badge colorScheme="green" px={3} py={1} borderRadius="md">
            Masih di tanki: {group.ringkasan.jumlahMasihDiTanki}
          </Badge>
          <Badge colorScheme="orange" px={3} py={1} borderRadius="md">
            Volume: {formatAngka(group.ringkasan.totalVolumeBarrel)} Barrel
          </Badge>
          <Button
            size="xs"
            variant="ghost"
            rightIcon={isCollapsed ? <BsChevronDown /> : <BsChevronUp />}
            onClick={(e) => {
              e.stopPropagation();
              toggleTankiSection(group.tankiId);
            }}
          >
            {isCollapsed ? "Buka" : "Tutup"}
          </Button>
        </HStack>
      </Flex>
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
          p={{ base: 4, sm: 5, md: 6, lg: "30px" }}
          my={{ base: 4, md: "30px" }}
        >
          <Flex
            align={{ base: "stretch", md: "center" }}
            direction={{ base: "column", md: "row" }}
            gap={4}
            mb={6}
          >
            <VStack align={{ base: "center", md: "start" }} spacing={1}>
              <Heading
                color="kpbpn"
                size={{ base: "md", md: "lg" }}
                textAlign={{ base: "center", md: "left" }}
              >
                Riwayat Tanki
              </Heading>
              <Text
                fontSize="sm"
                color="gray.500"
                textAlign={{ base: "center", md: "left" }}
              >
                Data surat jalan dan konfirmasi penerimaan dikelompokkan per
                tanki.
              </Text>
            </VStack>
            <Spacer />
          </Flex>

          <HStack spacing={3} mb={6} flexWrap="wrap">
            <Badge colorScheme="blue" px={3} py={1} borderRadius="md">
              Surat jalan: {ringkasan?.jumlahSuratJalan ?? 0}
            </Badge>
            <Badge colorScheme="purple" px={3} py={1} borderRadius="md">
              Konfirmasi: {ringkasan?.jumlahKonfirmasi ?? 0}
            </Badge>
            <Badge colorScheme="green" px={3} py={1} borderRadius="md">
              Masih di tanki: {ringkasan?.jumlahMasihDiTanki ?? 0}
            </Badge>
            <Badge colorScheme="orange" px={3} py={1} borderRadius="md">
              Volume:{" "}
              {ringkasan?.totalVolumeBarrel != null
                ? `${formatAngka(ringkasan.totalVolumeBarrel)} Barrel`
                : "-"}
            </Badge>
          </HStack>

          <Divider mb={6} />

          <Box mb={6}>
            <Heading size="md" mb={4} color="kpbpn">
              Filter Pencarian
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 5 }} spacing={4}>
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="medium">
                  Tanki
                </FormLabel>
                <Select
                  bgColor="terang"
                  height="50px"
                  placeholder="Semua tanki"
                  value={tangkiFilterId}
                  onChange={(e) => setTangkiFilterId(e.target.value)}
                >
                  {dataTanki.map((item) => (
                    <option key={item.id} value={String(item.id)}>
                      {item.kode || `Tanki #${item.id}`}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="medium">
                  Tampilkan
                </FormLabel>
                <Select
                  bgColor="terang"
                  height="50px"
                  value={isiSaatIni}
                  onChange={(e) => setIsiSaatIni(e.target.value)}
                >
                  <option value="0">Semua riwayat</option>
                  <option value="1">Isi saat ini</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="medium">
                  Tanggal Awal
                </FormLabel>
                <Input
                  bgColor="terang"
                  height="50px"
                  type="date"
                  value={tanggalAwal}
                  onChange={(e) => setTanggalAwal(e.target.value)}
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="medium">
                  Tanggal Akhir
                </FormLabel>
                <Input
                  bgColor="terang"
                  height="50px"
                  type="date"
                  value={tanggalAkhir}
                  onChange={(e) => setTanggalAkhir(e.target.value)}
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="medium">
                  Cari
                </FormLabel>
                <Input
                  bgColor="terang"
                  height="50px"
                  placeholder="Nomor SJ / mitra / BAST"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setSearch(searchInput.trim());
                  }}
                  onBlur={() => setSearch(searchInput.trim())}
                />
              </FormControl>
            </SimpleGrid>
            {hasActiveFilter && (
              <Button
                mt={4}
                size="sm"
                variant="ghost"
                colorScheme="red"
                onClick={resetFilter}
              >
                Reset Filter
              </Button>
            )}
          </Box>

          <Box ref={dataListRef} scrollMarginTop={{ base: "72px", md: "88px" }}>
            {isLoading ? (
              <>
                <Box display={{ base: "block", lg: "none" }}>
                  <Stack spacing={4}>
                    {Array.from({ length: 3 }).map((_, idx) => (
                      <Box
                        key={idx}
                        p={4}
                        borderRadius="lg"
                        border="1px solid"
                        borderColor="gray.200"
                        bg="white"
                      >
                        <Skeleton height="24px" mb={3} width="40%" />
                        <Skeleton height="16px" mb={4} width="60%" />
                        <SimpleGrid columns={2} spacing={3}>
                          {Array.from({ length: 4 }).map((__, i) => (
                            <Skeleton key={i} height="36px" />
                          ))}
                        </SimpleGrid>
                      </Box>
                    ))}
                  </Stack>
                </Box>
                <Center display={{ base: "none", lg: "flex" }} py={10}>
                  <Spinner size="lg" color="kpbpn" />
                </Center>
              </>
            ) : groupedByTanki.length === 0 ? (
              <Box
                py={10}
                textAlign="center"
                borderRadius="lg"
                border="1px solid"
                borderColor="gray.200"
                bg="white"
              >
                <Text fontSize="lg" color="gray.500">
                  {emptyMessage}
                </Text>
              </Box>
            ) : (
              <Stack spacing={8}>
                {groupedByTanki.map((group) => {
                  const isCollapsed = collapsedTankiIds.includes(group.tankiId);
                  return (
                    <Box
                      key={group.tankiId || group.kode}
                      p={{ base: 4, md: 5 }}
                      borderRadius="xl"
                      border="1px solid"
                      borderColor="gray.200"
                      bg="gray.50"
                    >
                      {renderTankiHeader(group)}
                      <Collapse in={!isCollapsed} animateOpacity>
                        <Box mt={4} display={{ base: "block", lg: "none" }}>
                          {group.items.length === 0 ? (
                            <Box
                              py={8}
                              textAlign="center"
                              borderRadius="lg"
                              border="1px solid"
                              borderColor="gray.200"
                              bg="white"
                            >
                              <Text color="gray.500">{emptyMessage}</Text>
                            </Box>
                          ) : (
                            <Stack spacing={3}>{renderItemCards(group.items)}</Stack>
                          )}
                        </Box>
                        <Box mt={4} display={{ base: "none", lg: "block" }}>
                          {renderItemTable(group.items)}
                        </Box>
                      </Collapse>
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Box>
        </Container>
      </Box>
    </LayoutKPBPN>
  );
};

export default RiwayatTanki;
