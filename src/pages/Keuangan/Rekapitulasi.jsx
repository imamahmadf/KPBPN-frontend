import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import ExcelJS from "exceljs";
import ReactPaginate from "react-paginate";
import {
  Box,
  Button,
  FormControl,
  Input,
  Text,
  useToast,
  FormLabel,
  Container,
  Thead,
  Table,
  Tr,
  Th,
  Td,
  Tbody,
  Heading,
  HStack,
  Flex,
  Spinner,
  Center,
} from "@chakra-ui/react";
import { BsFileEarmarkExcel } from "react-icons/bs";
import LayoutKPBPN from "../../Componets/KPBPN/LayoutKPBPN";
import "../../Style/pagination.css";

const API_BASE = import.meta.env.VITE_REACT_APP_API_BASE_URL;

const formatTanggal = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const formatDecimal = (value, digits = 3) => {
  if (value === null || value === undefined || value === "") return "-";
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return num.toLocaleString("id-ID", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
};

const formatTarif = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return num.toLocaleString("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatBulanTarif = (value) => {
  if (!value) return "-";
  const str = String(value);
  const d = /^\d{4}-\d{2}$/.test(str)
    ? new Date(`${str}-01T00:00:00`)
    : new Date(value);
  if (Number.isNaN(d.getTime())) return str;
  return d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
};

const excelNumber = (value) =>
  value === null || value === undefined || value === "" ? "-" : Number(value);

function Rekapitulasi() {
  const toast = useToast();
  const dataListRef = useRef(null);

  const [dataRekap, setDataRekap] = useState([]);
  const [page, setPage] = useState(0);
  const [limit] = useState(20);
  const [pages, setPages] = useState(0);
  const [rows, setRows] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const [bulan, setBulan] = useState("");
  const [bulanInput, setBulanInput] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const scrollToDataList = () => {
    dataListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const changePage = ({ selected }) => {
    setPage(selected);
    scrollToDataList();
  };

  const fetchRekapitulasi = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/icp/rekapitulasi`, {
        params: {
          page,
          limit,
          bulan: bulan || undefined,
        },
      });
      setDataRekap(res.data.result || []);
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
    fetchRekapitulasi();
  }, [page, limit, bulan]);

  const handleFilter = () => {
    setPage(0);
    setBulan(bulanInput);
  };

  const resetFilter = () => {
    setBulanInput("");
    setBulan("");
    setPage(0);
  };

  const fetchAllRekapForExport = async () => {
    const res = await axios.get(`${API_BASE}/icp/rekapitulasi`, {
      params: {
        page: 0,
        limit: 10000,
        bulan: bulan || undefined,
      },
    });
    return res.data.result || [];
  };

  const downloadExcel = async () => {
    setIsExporting(true);
    try {
      const exportData = await fetchAllRekapForExport();
      if (!exportData.length) {
        toast({
          title: "Tidak ada data",
          description: "Tidak ada data rekapitulasi untuk diekspor",
          status: "info",
          duration: 4000,
          isClosable: true,
        });
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Rekapitulasi BAK3S");

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

      worksheet.addRow(["Rekapitulasi BAK3S"]);
      worksheet.addRow([
        bulan
          ? `Filter bulan: ${formatBulanTarif(bulan)}`
          : "Filter bulan: semua data",
      ]);
      worksheet.addRow([
        "Tarif memakai ICP x kurs tengah bulan sebelumnya",
      ]);
      worksheet.addRow([]);

      const headerRow = worksheet.addRow([
        "No",
        "Tanggal",
        "API",
        "BSNW",
        "SG",
        "Produksi",
        "ICP",
        "Kurs Tengah",
        "Tarif",
        "Bulan Tarif",
      ]);
      headerRow.eachCell((cell) => {
        cell.style = headerStyle;
      });

      exportData.forEach((item, index) => {
        const dataRow = worksheet.addRow([
          index + 1,
          formatTanggal(item.tanggal),
          excelNumber(item.api),
          excelNumber(item.BSNW),
          excelNumber(item.sg),
          excelNumber(item.produksi),
          excelNumber(item.icp),
          excelNumber(item.kursTengah),
          excelNumber(item.tarif),
          formatBulanTarif(item.bulanTarif),
        ]);
        dataRow.eachCell((cell) => {
          cell.style = dataStyle;
        });
        [3, 4, 5, 6].forEach((col) => {
          if (typeof dataRow.getCell(col).value === "number") {
            dataRow.getCell(col).numFmt = "#,##0.000";
          }
        });
        [7, 8, 9].forEach((col) => {
          if (typeof dataRow.getCell(col).value === "number") {
            dataRow.getCell(col).numFmt = "#,##0.00";
          }
        });
      });

      worksheet.columns.forEach((column) => {
        let maxLength = 12;
        column.eachCell({ includeEmpty: true }, (cell) => {
          const columnLength = cell.value ? String(cell.value).length : 12;
          if (columnLength > maxLength) maxLength = columnLength;
        });
        column.width = Math.min(maxLength + 2, 40);
      });

      const filename = bulan
        ? `Rekapitulasi_BAK3S_${bulan}.xlsx`
        : `Rekapitulasi_BAK3S_${new Date().toISOString().split("T")[0]}.xlsx`;
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
        description:
          err.response?.data?.error || "Gagal mengekspor data ke Excel",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <LayoutKPBPN>
      <Box bgColor="secondary" pb="40px" px="30px" minH="90vh">
        <Container variant="primary" p="30px" my="30px" minW="1000px">
          <HStack justify="space-between" mb={6} align="flex-start">
            <Box>
              <Heading color="kpbpn">Rekapitulasi BAK3S</Heading>
              <Text mt={1} color="gray.600" fontSize="sm">
                Tarif memakai ICP × kurs tengah bulan sebelumnya. Contoh: BAK3S
                15 September 2026 memakai tarif Agustus 2026.
              </Text>
            </Box>
            <Button
              leftIcon={<BsFileEarmarkExcel />}
              variant="outline"
              colorScheme="green"
              onClick={downloadExcel}
              isLoading={isExporting}
              loadingText="Mengekspor..."
              isDisabled={rows === 0}
            >
              Export Excel
            </Button>
          </HStack>

          <Box mb={6} p={4} borderWidth="1px" borderRadius="lg" bg="gray.50">
            <HStack spacing={4} flexWrap="wrap" align="flex-end">
              <FormControl maxW="240px">
                <FormLabel fontSize="sm">Bulan</FormLabel>
                <Input
                  type="month"
                  value={bulanInput}
                  onChange={(e) => setBulanInput(e.target.value)}
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
                      <Th>Tanggal</Th>
                      <Th isNumeric>API</Th>
                      <Th isNumeric>BSNW</Th>
                      <Th isNumeric>SG</Th>
                      <Th isNumeric>Produksi</Th>
                      <Th isNumeric>Tarif</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {dataRekap.length === 0 ? (
                      <Tr>
                        <Td colSpan={7} textAlign="center" py={6}>
                          Belum ada data BAK3S
                        </Td>
                      </Tr>
                    ) : (
                      dataRekap.map((item, index) => (
                        <Tr key={item.id}>
                          <Td>{page * limit + index + 1}</Td>
                          <Td fontWeight="medium">
                            {formatTanggal(item.tanggal)}
                          </Td>
                          <Td isNumeric>{formatDecimal(item.api)}</Td>
                          <Td isNumeric>{formatDecimal(item.BSNW)}</Td>
                          <Td isNumeric>{formatDecimal(item.sg)}</Td>
                          <Td isNumeric>{formatDecimal(item.produksi)}</Td>
                          <Td isNumeric fontWeight="medium">
                            {formatTarif(item.tarif)}
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

export default Rekapitulasi;
