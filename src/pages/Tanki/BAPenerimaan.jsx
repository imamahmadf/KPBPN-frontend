import React, { useState, useEffect } from "react";
import axios from "axios";
import ReactPaginate from "react-paginate";
import ExcelJS from "exceljs";
import "../../Style/pagination.css";
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
  VStack,
  Collapse,
  IconButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  SimpleGrid,
  Divider,
} from "@chakra-ui/react";
import { BsChevronDown, BsChevronUp, BsX, BsFileEarmarkExcel } from "react-icons/bs";
import LayoutKPBPN from "../../Componets/KPBPN/LayoutKPBPN";

const API_BASE = import.meta.env.VITE_REACT_APP_API_BASE_URL;

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
  return satuan ? `${volume} ${satuan}` : String(volume);
};

const getPengisianList = (ba) => ba.pengisianTankis || [];

const getUniqueTankiKodes = (ba) => {
  const kodes = getPengisianList(ba)
    .map((item) => item.tanki?.kode)
    .filter(Boolean);
  return [...new Set(kodes)].join(", ") || "-";
};

const getKonfirmasiLabel = (item) => {
  const list = item.konfirmasiPenerimaans || [];
  if (!list.length) return "-";
  return list
    .map(
      (kp) =>
        kp.nomor ||
        kp.suratJalan?.transportir?.plat ||
        `ID ${kp.id}`,
    )
    .join(", ");
};

const BAPenerimaan = () => {
  const toast = useToast();
  const [dataBA, setDataBA] = useState([]);
  const [dataTanki, setDataTanki] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [loadingCetakBA, setLoadingCetakBA] = useState({});
  const [expandedIds, setExpandedIds] = useState([]);
  const [page, setPage] = useState(0);
  const [limit] = useState(50);
  const [pages, setPages] = useState(0);
  const [rows, setRows] = useState(0);
  const [tanggalAwal, setTanggalAwal] = useState("");
  const [tanggalAkhir, setTanggalAkhir] = useState("");
  const [tangkiFilterId, setTangkiFilterId] = useState("");
  const [baIdFilter, setBaIdFilter] = useState("");

  const buildFilterParams = (extra = {}) => ({
    page,
    limit,
    startDate: tanggalAwal || undefined,
    endDate: tanggalAkhir || undefined,
    tangkiId: tangkiFilterId || undefined,
    baId: baIdFilter || undefined,
    ...extra,
  });

  const hasActiveFilter =
    Boolean(tanggalAwal) ||
    Boolean(tanggalAkhir) ||
    Boolean(tangkiFilterId) ||
    Boolean(baIdFilter);

  const resetFilter = () => {
    setTanggalAwal("");
    setTanggalAkhir("");
    setTangkiFilterId("");
    setBaIdFilter("");
  };

  const changePage = ({ selected }) => {
    setPage(selected);
    setExpandedIds([]);
  };

  const fetchDataTanki = async () => {
    try {
      const res = await axios.get(`${API_BASE}/tanki/get/tanki`);
      setDataTanki(res.data.result || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDataBA = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/tanki/get/ba-penerimaan`, {
        params: buildFilterParams(),
      });
      setDataBA(res.data.result || []);
      setPage(res.data.page ?? 0);
      setPages(res.data.totalPage || 0);
      setRows(res.data.totalRows || 0);
    } catch (err) {
      console.error(err);
      setDataBA([]);
      setPage(0);
      setPages(0);
      setRows(0);
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

  const fetchAllBAForExport = async () => {
    const res = await axios.get(`${API_BASE}/tanki/get/ba-penerimaan`, {
      params: buildFilterParams({ page: 0, limit: 10000 }),
    });
    return res.data.result || [];
  };

  const downloadExcel = async () => {
    setIsExporting(true);
    try {
      const exportData = await fetchAllBAForExport();

      if (!exportData.length) {
        toast({
          title: "Tidak ada data",
          description: "Tidak ada data BA Penerimaan untuk diekspor",
          status: "info",
          duration: 4000,
          isClosable: true,
        });
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("BA Penerimaan");

      const headerStyle = {
        font: { bold: true, color: { argb: "FFFFFF" } },
        fill: {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "4472C4" },
        },
        alignment: { horizontal: "center", vertical: "middle" },
        border: {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        },
      };

      const dataStyle = {
        border: {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        },
        alignment: { vertical: "middle" },
      };

      const headers = [
        "No",
        "ID BA",
        "Tanggal BA",
        "Ukuran Cairan",
        "Ukuran Air",
        "Tanggal Pengisian",
        "Tangki",
        "Flow Meter",
        "Gross",
        "Net",
        "Penampilan Visual",
        "Warna",
        "Kandungan Air",
        "BSW",
        "Catatan",
        "Saksi",
        "Konfirmasi Penerimaan",
        "Nomor Surat BAST",
      ];

      const headerRow = worksheet.addRow(headers);
      headerRow.eachCell((cell) => {
        cell.style = headerStyle;
      });

      let rowNumber = 1;
      exportData.forEach((ba) => {
        const pengisianList = getPengisianList(ba);

        if (!pengisianList.length) {
          const dataRow = worksheet.addRow([
            rowNumber,
            ba.id,
            formatDate(ba.tanggal),
            ba.ukuranCairan ?? "-",
            ba.ukuranAir ?? "-",
            "-",
            "-",
            "-",
            "-",
            "-",
            "-",
            "-",
            "-",
            "-",
            "-",
            "-",
            "-",
            "-",
          ]);
          dataRow.eachCell((cell) => {
            cell.style = dataStyle;
          });
          rowNumber += 1;
          return;
        }

        pengisianList.forEach((item, pengisianIndex) => {
          const dataRow = worksheet.addRow([
            pengisianIndex === 0 ? rowNumber : "",
            pengisianIndex === 0 ? ba.id : "",
            pengisianIndex === 0 ? formatDate(ba.tanggal) : "",
            pengisianIndex === 0 ? (ba.ukuranCairan ?? "-") : "",
            pengisianIndex === 0 ? (ba.ukuranAir ?? "-") : "",
            formatDate(item.tanggal || item.createdAt),
            item.tanki?.kode || "-",
            item.flowMeter ?? "-",
            formatVolumeLabel(item.gross, item.satuanVolume?.satuan),
            formatVolumeLabel(item.net, item.satuanVolume?.satuan),
            item.penampilanVisual || "-",
            item.warna || "-",
            item.kandunganAir ?? "-",
            item.BSW ?? "-",
            item.catatan || "-",
            item.saksi || "-",
            getKonfirmasiLabel(item),
            item.nomorSurat || "-",
          ]);
          dataRow.eachCell((cell) => {
            cell.style = dataStyle;
          });
        });

        rowNumber += 1;
      });

      worksheet.columns.forEach((column) => {
        let maxLength = 10;
        column.eachCell({ includeEmpty: true }, (cell) => {
          const columnLength = cell.value ? cell.value.toString().length : 10;
          if (columnLength > maxLength) {
            maxLength = columnLength;
          }
        });
        column.width = Math.min(maxLength + 2, 40);
      });

      const currentDate = new Date().toISOString().split("T")[0];
      const filename = `BA_Penerimaan_${currentDate}.xlsx`;
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Berhasil",
        description: "File Excel berhasil diunduh",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Gagal",
        description: "Gagal mengekspor data ke Excel",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id],
    );
  };

  const cetakUlangBAPenerimaan = async (baId) => {
    if (!baId) return;

    setLoadingCetakBA((prev) => ({ ...prev, [baId]: true }));

    try {
      const res = await axios.post(
        `${API_BASE}/tanki/cetak/ba-penerimaan`,
        { BAPenerimaanId: baId },
        { responseType: "blob" },
      );

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `BA_Penerimaan_${baId}_${Date.now()}.docx`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Berhasil",
        description: "Dokumen BA Penerimaan berhasil diunduh",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error(err);
      let message = "Gagal mencetak ulang BA Penerimaan";
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          message = parsed.message || message;
        } catch {
          // gunakan pesan default
        }
      } else if (err.response?.data?.message) {
        message = err.response.data.message;
      }

      toast({
        title: "Gagal",
        description: message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoadingCetakBA((prev) => ({ ...prev, [baId]: false }));
    }
  };

  useEffect(() => {
    fetchDataTanki();
  }, []);

  useEffect(() => {
    setPage(0);
    setExpandedIds([]);
  }, [tanggalAwal, tanggalAkhir, tangkiFilterId, baIdFilter]);

  useEffect(() => {
    fetchDataBA();
  }, [page, tanggalAwal, tanggalAkhir, tangkiFilterId, baIdFilter]);

  const colSpan = 9;

  return (
    <LayoutKPBPN>
      <Box bgColor="secondary" pb="40px" px="30px" minH="90vh">
        <Container variant="primary" p="30px" my="30px" minW="2000px">
          <HStack justify="space-between" mb={6}>
            <Heading color="kpbpn">BA Penerimaan</Heading>
            <HStack spacing={3}>
              <Text fontSize="sm" color="gray.500">
                Total: {rows} data
              </Text>
              <Button
                leftIcon={<BsFileEarmarkExcel />}
                variant="outline"
                colorScheme="green"
                onClick={downloadExcel}
                isLoading={isExporting}
                loadingText="Mengekspor..."
              >
                Export Excel
              </Button>
            </HStack>
          </HStack>

          <Box mb={6} p={4} bg="gray.50" borderRadius="lg">
            <Heading size="sm" mb={4} color="gray.700">
              Filter Data
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
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
              <FormControl>
                <FormLabel fontSize="sm">ID BA</FormLabel>
                <Input
                  type="number"
                  bg="white"
                  placeholder="Cari ID BA"
                  value={baIdFilter}
                  onChange={(e) => setBaIdFilter(e.target.value)}
                />
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
                    <Th>ID BA</Th>
                    <Th>Tanggal</Th>
                    <Th>Ukuran Cairan</Th>
                    <Th>Ukuran Air</Th>
                    <Th>Jumlah Pengisian</Th>
                    <Th>Tangki</Th>
                    <Th>Aksi</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {dataBA.length === 0 ? (
                    <Tr>
                      <Td colSpan={colSpan} textAlign="center" py={6}>
                        {hasActiveFilter
                          ? "Tidak ada data BA Penerimaan sesuai filter"
                          : "Belum ada data BA Penerimaan"}
                      </Td>
                    </Tr>
                  ) : (
                    dataBA.map((ba, index) => {
                      const pengisianList = getPengisianList(ba);
                      const isExpanded = expandedIds.includes(ba.id);

                      return (
                        <React.Fragment key={ba.id}>
                          <Tr bg="gray.50">
                            <Td>
                              <IconButton
                                aria-label={
                                  isExpanded
                                    ? "Tutup detail pengisian"
                                    : "Lihat detail pengisian"
                                }
                                icon={
                                  isExpanded ? <BsChevronUp /> : <BsChevronDown />
                                }
                                size="xs"
                                variant="ghost"
                                onClick={() => toggleExpand(ba.id)}
                                isDisabled={!pengisianList.length}
                              />
                            </Td>
                            <Td>{page * limit + index + 1}</Td>
                            <Td>
                              <Badge colorScheme="green">BA #{ba.id}</Badge>
                            </Td>
                            <Td>{formatDate(ba.tanggal)}</Td>
                            <Td>{ba.ukuranCairan ?? "-"}</Td>
                            <Td>{ba.ukuranAir ?? "-"}</Td>
                            <Td>{pengisianList.length}</Td>
                            <Td>{getUniqueTankiKodes(ba)}</Td>
                            <Td>
                              <Button
                                size="sm"
                                variant="outline"
                                colorScheme="orange"
                                isLoading={loadingCetakBA[ba.id]}
                                onClick={() => cetakUlangBAPenerimaan(ba.id)}
                              >
                                Cetak Ulang BA
                              </Button>
                            </Td>
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
                                  <Text
                                    fontSize="sm"
                                    fontWeight="semibold"
                                    mb={3}
                                    color="gray.700"
                                  >
                                    Pengisian Tanki terkait BA #{ba.id}
                                  </Text>
                                  {pengisianList.length === 0 ? (
                                    <Text fontSize="sm" color="gray.500">
                                      Tidak ada pengisian tanki terkait
                                    </Text>
                                  ) : (
                                    <Box overflowX="auto">
                                      <Table size="sm" variant="simple">
                                        <Thead>
                                          <Tr>
                                            <Th>No</Th>
                                            <Th>Tanggal</Th>
                                            <Th>Tangki</Th>
                                            <Th>Flow Meter</Th>
                                            <Th>Gross</Th>
                                            <Th>Net</Th>
                                            <Th>Penampilan Visual</Th>
                                            <Th>Warna</Th>
                                            <Th>Kandungan Air</Th>
                                            <Th>BSW</Th>
                                            <Th>Catatan</Th>
                                            <Th>Saksi</Th>
                                            <Th>Konfirmasi Penerimaan</Th>
                                            <Th>Nomor Surat BAST</Th>
                                          </Tr>
                                        </Thead>
                                        <Tbody>
                                          {pengisianList.map(
                                            (item, pengisianIndex) => (
                                              <Tr key={item.id}>
                                                <Td>{pengisianIndex + 1}</Td>
                                                <Td>
                                                  {formatDate(
                                                    item.tanggal ||
                                                      item.createdAt,
                                                  )}
                                                </Td>
                                                <Td>
                                                  {item.tanki?.kode || "-"}
                                                </Td>
                                                <Td>{item.flowMeter ?? "-"}</Td>
                                                <Td>
                                                  {formatVolumeLabel(
                                                    item.gross,
                                                    item.satuanVolume?.satuan,
                                                  )}
                                                </Td>
                                                <Td>
                                                  {formatVolumeLabel(
                                                    item.net,
                                                    item.satuanVolume?.satuan,
                                                  )}
                                                </Td>
                                                <Td>
                                                  {item.penampilanVisual || "-"}
                                                </Td>
                                                <Td>{item.warna || "-"}</Td>
                                                <Td>
                                                  {item.kandunganAir ?? "-"}
                                                </Td>
                                                <Td>{item.BSW ?? "-"}</Td>
                                                <Td>{item.catatan || "-"}</Td>
                                                <Td>{item.saksi || "-"}</Td>
                                                <Td>
                                                  {(item.konfirmasiPenerimaans ||
                                                    []).length === 0 ? (
                                                    "-"
                                                  ) : (
                                                    <VStack align="start" spacing={1}>
                                                      {item.konfirmasiPenerimaans.map(
                                                        (kp) => (
                                                          <Badge
                                                            key={kp.id}
                                                            colorScheme="orange"
                                                          >
                                                            {kp.nomor ||
                                                              kp.suratJalan
                                                                ?.transportir
                                                                ?.plat ||
                                                              `ID ${kp.id}`}
                                                          </Badge>
                                                        ),
                                                      )}
                                                    </VStack>
                                                  )}
                                                </Td>
                                                <Td>
                                                  {item.nomorSurat ? (
                                                    <Text
                                                      fontSize="xs"
                                                      whiteSpace="nowrap"
                                                    >
                                                      {item.nomorSurat}
                                                    </Text>
                                                  ) : (
                                                    <Badge colorScheme="gray">
                                                      Belum ada
                                                    </Badge>
                                                  )}
                                                </Td>
                                              </Tr>
                                            ),
                                          )}
                                        </Tbody>
                                      </Table>
                                    </Box>
                                  )}
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

          {!isLoading && (
            <Box
              mt={6}
              display="flex"
              justifyContent="center"
              alignItems="center"
            >
              <ReactPaginate
                previousLabel={"←"}
                nextLabel={"→"}
                pageCount={pages}
                onPageChange={changePage}
                forcePage={page}
                activeClassName={"item active "}
                breakClassName={"item break-me "}
                breakLabel={"..."}
                containerClassName={"pagination"}
                disabledClassName={"disabled-page"}
                marginPagesDisplayed={1}
                nextClassName={"item next "}
                pageClassName={"item pagination-page "}
                pageRangeDisplayed={2}
                previousClassName={"item previous"}
              />
            </Box>
          )}
        </Container>
      </Box>
    </LayoutKPBPN>
  );
};

export default BAPenerimaan;
