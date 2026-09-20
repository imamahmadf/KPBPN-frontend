import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import ExcelJS from "exceljs";
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
import { BsFileEarmarkExcel } from "react-icons/bs";
import LayoutKPBPN from "../../Componets/KPBPN/LayoutKPBPN";
import "../../Style/pagination.css";

const API_BASE = import.meta.env.VITE_REACT_APP_API_BASE_URL;

export const formatTanggal = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

export const formatDateTime = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatJam = (value) => {
  if (!value) return "-";
  const str = String(value).trim();
  const timeOnly = str.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (timeOnly) {
    return `${timeOnly[1].padStart(2, "0")}:${timeOnly[2]}`;
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return str;
  return d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

export const formatAngka = (value, digits = 3) => {
  if (value === null || value === undefined || value === "") return "-";
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return num.toLocaleString("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
};

export const formatTarif = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return num.toLocaleString("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const formatBulan = (value) => {
  if (!value) return "-";
  const str = String(value);
  const d = /^\d{4}-\d{2}$/.test(str)
    ? new Date(`${str}-01T00:00:00`)
    : new Date(value);
  if (Number.isNaN(d.getTime())) return str;
  return d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
};

export const getImageUrl = (path) => (path ? `${API_BASE}${path}` : null);

function LaporanPage({
  title,
  description,
  endpoint,
  columns,
  searchPlaceholder = "Cari data",
}) {
  const toast = useToast();
  const dataListRef = useRef(null);
  const [data, setData] = useState([]);
  const [page, setPage] = useState(0);
  const [limit] = useState(20);
  const [pages, setPages] = useState(0);
  const [rows, setRows] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [scoped, setScoped] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [startDateInput, setStartDateInput] = useState("");
  const [endDateInput, setEndDateInput] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const scrollToDataList = () => {
    dataListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const fetchData = async (override = {}) => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}${endpoint}`, {
        params: {
          page: override.page ?? page,
          limit: override.limit ?? limit,
          search: (override.search ?? search) || undefined,
          startDate: (override.startDate ?? startDate) || undefined,
          endDate: (override.endDate ?? endDate) || undefined,
        },
      });
      setData(res.data.result || []);
      setPage(res.data.page ?? page);
      setPages(res.data.totalPage || 0);
      setRows(res.data.totalRows || 0);
      setScoped(Boolean(res.data.scoped));
    } catch (err) {
      toast({
        title: "Gagal memuat laporan",
        description: err.response?.data?.error || err.response?.data?.message || err.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, search, startDate, endDate]);

  const handleFilter = () => {
    setPage(0);
    setSearch(searchInput.trim());
    setStartDate(startDateInput);
    setEndDate(endDateInput);
  };

  const resetFilter = () => {
    setSearchInput("");
    setSearch("");
    setStartDateInput("");
    setEndDateInput("");
    setStartDate("");
    setEndDate("");
    setPage(0);
  };

  const changePage = ({ selected }) => {
    setPage(selected);
    scrollToDataList();
  };

  const downloadExcel = async () => {
    setIsExporting(true);
    try {
      const res = await axios.get(`${API_BASE}${endpoint}`, {
        params: {
          page: 0,
          limit: 10000,
          search: search || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        },
      });
      const exportData = res.data.result || [];
      if (!exportData.length) {
        toast({
          title: "Tidak ada data",
          description: "Tidak ada data laporan untuk diekspor",
          status: "info",
          duration: 4000,
          isClosable: true,
        });
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(title.slice(0, 31));
      const headerStyle = {
        font: { bold: true, color: { argb: "FFFFFF" } },
        fill: {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "1368B9" },
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
        alignment: { vertical: "middle", wrapText: true },
      };

      worksheet.addRow([title]);
      worksheet.addRow([
        startDate || endDate
          ? `Periode: ${startDate || "..."} s.d. ${endDate || "..."}`
          : "Periode: semua data",
      ]);
      if (search) worksheet.addRow([`Pencarian: ${search}`]);
      worksheet.addRow([]);

      const excelColumns = columns.filter((col) => !col.hideExcel);
      const headerRow = worksheet.addRow([
        "No",
        ...excelColumns.map((col) => col.header),
      ]);
      headerRow.eachCell((cell) => {
        cell.style = headerStyle;
      });

      exportData.forEach((item, index) => {
        const dataRow = worksheet.addRow([
          index + 1,
          ...excelColumns.map((col) => {
            if (col.excelValue) return col.excelValue(item);
            const value = item[col.key];
            return value === null || value === undefined || value === ""
              ? "-"
              : value;
          }),
        ]);
        dataRow.eachCell((cell) => {
          cell.style = dataStyle;
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

      const filename = `${title.replace(/\s+/g, "_")}_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
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
      <Box bgColor="secondary" pb="40px" px={{ base: "16px", md: "30px" }} minH="90vh">
        <Container
          variant="primary"
          p={{ base: "20px", md: "30px" }}
          my="30px"
          maxW="100%"
        >
          <Flex
            justify="space-between"
            mb={6}
            align={{ base: "stretch", md: "flex-start" }}
            direction={{ base: "column", md: "row" }}
            gap={4}
          >
            <Box>
              <Heading color="kpbpn" size="lg">
                {title}
              </Heading>
              {description && (
                <Text mt={1} color="gray.600" fontSize="sm">
                  {description}
                </Text>
              )}
              {scoped && (
                <Text mt={1} color="blue.600" fontSize="sm" fontWeight="medium">
                  Data ditampilkan sesuai akun yang sedang login.
                </Text>
              )}
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
          </Flex>

          <Box mb={6} p={4} borderWidth="1px" borderRadius="lg" bg="gray.50">
            <HStack spacing={4} flexWrap="wrap" align="flex-end">
              <FormControl maxW="220px">
                <FormLabel fontSize="sm">Cari</FormLabel>
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={searchPlaceholder}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleFilter();
                  }}
                />
              </FormControl>
              <FormControl maxW="180px">
                <FormLabel fontSize="sm">Dari tanggal</FormLabel>
                <Input
                  type="date"
                  value={startDateInput}
                  onChange={(e) => setStartDateInput(e.target.value)}
                />
              </FormControl>
              <FormControl maxW="180px">
                <FormLabel fontSize="sm">Sampai tanggal</FormLabel>
                <Input
                  type="date"
                  value={endDateInput}
                  onChange={(e) => setEndDateInput(e.target.value)}
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
                <Table size="sm" variant="simple" minW="900px">
                  <Thead bg="gray.50">
                    <Tr>
                      <Th>No</Th>
                      {columns.map((col) => (
                        <Th key={col.key} isNumeric={col.isNumeric}>
                          {col.header}
                        </Th>
                      ))}
                    </Tr>
                  </Thead>
                  <Tbody>
                    {data.length === 0 ? (
                      <Tr>
                        <Td colSpan={columns.length + 1} textAlign="center" py={6}>
                          Belum ada data laporan
                        </Td>
                      </Tr>
                    ) : (
                      data.map((item, index) => (
                        <Tr key={item.id || index}>
                          <Td>{page * limit + index + 1}</Td>
                          {columns.map((col) => (
                            <Td key={col.key} isNumeric={col.isNumeric}>
                              {col.render
                                ? col.render(item)
                                : item[col.key] ?? "-"}
                            </Td>
                          ))}
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

export default LaporanPage;
