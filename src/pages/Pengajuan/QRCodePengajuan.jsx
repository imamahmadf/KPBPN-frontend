import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Badge,
  Box,
  Center,
  Container,
  Heading,
  Image,
  SimpleGrid,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
} from "@chakra-ui/react";
import LogoKPBPN from "../../assets/Logo-KPBPN-putih.png";

const API_BASE = import.meta.env.VITE_REACT_APP_API_BASE_URL;

const BULAN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const formatTanggal = (value) => {
  if (!value) return "-";
  const [year, month, day] = String(value).slice(0, 10).split("-");
  const monthIndex = Number(month) - 1;
  if (!year || !day || monthIndex < 0 || monthIndex > 11) return "-";
  return `${Number(day)} ${BULAN[monthIndex]} ${year}`;
};

const formatJumlah = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 3 }).format(
    number,
  );
};

const statusColor = (nama) => {
  if (nama === "Disetujui" || nama === "Selesai") return "green";
  if (nama === "Ditolak") return "red";
  if (nama === "Diproses") return "orange";
  if (nama === "Diajukan") return "blue";
  return "gray";
};

const InfoItem = ({ label, children }) => (
  <Box>
    <Text fontSize="xs" color="gray.500" fontWeight="semibold">
      {label}
    </Text>
    <Text fontWeight="medium" wordBreak="break-word">
      {children || "-"}
    </Text>
  </Box>
);

function QRCodePengajuan({ match }) {
  const kode = match?.params?.kode;
  const [data, setData] = useState(null);
  const [berlaku, setBerlaku] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPengajuan = async () => {
      if (!kode) {
        setError("Kode barcode tidak valid");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");
      try {
        const res = await axios.get(`${API_BASE}/pengajuan-barjas/public/${kode}`);
        setData(res.data.result || null);
        setBerlaku(Boolean(res.data.berlaku));
      } catch (err) {
        setData(null);
        setBerlaku(false);
        setError(err.response?.data?.error || "Pengajuan tidak ditemukan");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPengajuan();
  }, [kode]);

  const items = data?.items || [];

  return (
    <Box minH="100vh" bg="gray.50">
      <Box bgGradient="linear(to-r, gelap, kpbpn)" py={5} px={4}>
        <Center>
          <VStack spacing={2}>
            <Image src={LogoKPBPN} alt="Logo KPBPN" maxH="64px" />
            <Text color="white" fontWeight="bold" fontSize="sm">
              Koperasi Produsen Batanghari Patra Nusantara
            </Text>
          </VStack>
        </Center>
      </Box>

      <Container maxW="960px" py={{ base: 6, md: 10 }} px={{ base: 4, md: 6 }}>
        {isLoading ? (
          <Center py={16}>
            <Spinner size="lg" color="kpbpn" />
          </Center>
        ) : error ? (
          <Box bg="white" borderRadius="xl" p={8} textAlign="center" boxShadow="sm">
            <Heading size="md" mb={2}>
              QR Code tidak valid
            </Heading>
            <Text color="gray.600">{error}</Text>
          </Box>
        ) : (
          <VStack spacing={6} align="stretch">
            <Box
              bg={berlaku ? "green.50" : "red.50"}
              borderRadius="xl"
              p={4}
              borderWidth="1px"
              borderColor={berlaku ? "green.200" : "red.200"}
            >
              <Text fontWeight="bold" color={berlaku ? "green.700" : "red.700"}>
                {berlaku
                  ? "QR Code berlaku. Pengajuan ini berstatus Disetujui, Diproses, atau Selesai."
                  : "QR Code tidak berlaku. Pengajuan ini belum disetujui atau statusnya sudah diubah."}
              </Text>
            </Box>

            <Box
              bg="white"
              borderRadius="xl"
              p={{ base: 5, md: 6 }}
              boxShadow="sm"
              borderTop="4px solid"
              borderColor="kpbpn"
            >
              <Heading size="md" color="kpbpn" mb={1}>
                {data.nomor || "Pengajuan Barang & Jasa"}
              </Heading>
              <Text color="gray.600" mb={5}>
                Verifikasi persetujuan pengajuan
              </Text>
              <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
                <InfoItem label="Tanggal">{formatTanggal(data.tanggal)}</InfoItem>
                <InfoItem label="Tanggal dibutuhkan">
                  {formatTanggal(data.tanggalDibutuhkan)}
                </InfoItem>
                <InfoItem label="Jenis">
                  {data.jenis === "jasa" ? "Jasa" : data.jenis === "barang" ? "Barang" : "-"}
                </InfoItem>
                <InfoItem label="Level">
                  {data.level === "urgent" ? "Urgent" : "Normal"}
                </InfoItem>
                <InfoItem label="Status">
                  <Badge colorScheme={statusColor(data.status)}>{data.status}</Badge>
                </InfoItem>
                <InfoItem label="Pemohon">{data.pemohon}</InfoItem>
                <InfoItem label="Mengetahui">{data.mengetahui}</InfoItem>
                <InfoItem label="Menyetujui">{data.menyetujui}</InfoItem>
                <InfoItem label="Lokasi penggunaan">{data.lokasi}</InfoItem>
                <Box gridColumn={{ sm: "1 / -1" }}>
                  <InfoItem label="Keperluan">{data.keperluan}</InfoItem>
                </Box>
              </SimpleGrid>
            </Box>

            <Box bg="white" borderRadius="xl" boxShadow="sm" overflowX="auto">
              <Box p={{ base: 5, md: 6 }} pb={0}>
                <Heading size="sm">Daftar item</Heading>
              </Box>
              <Table size="sm" mt={3}>
                <Thead>
                  <Tr>
                    <Th>Barang / jasa</Th>
                    <Th>Jumlah</Th>
                    <Th>Keterangan</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {items.length === 0 ? (
                    <Tr>
                      <Td colSpan={3} color="gray.500">
                        Tidak ada item.
                      </Td>
                    </Tr>
                  ) : (
                    items.map((item, index) => (
                      <Tr key={`${item.nama}-${index}`}>
                        <Td>
                          <Text fontWeight="semibold">{item.nama}</Text>
                          {item.spesifikasi && (
                            <Text fontSize="sm" color="gray.500">
                              {item.spesifikasi}
                            </Text>
                          )}
                        </Td>
                        <Td>
                          {formatJumlah(item.jumlah)} {item.satuan}
                        </Td>
                        <Td>{item.keterangan || "-"}</Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </Table>
            </Box>
          </VStack>
        )}
      </Container>
    </Box>
  );
}

export default QRCodePengajuan;
