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
import LogoKPBPN from "../assets/Logo-KPBPN-putih.png";

const API_BASE = import.meta.env.VITE_REACT_APP_API_BASE_URL;

const getImageUrl = (path) => (path ? `${API_BASE}${path}` : null);

const formatTanggal = (d) =>
  d
    ? new Date(d).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "-";

const formatJam = (value) => {
  if (!value) return "-";
  const str = String(value).trim();
  const timeOnly = str.match(/^(\d{2}:\d{2})(?::\d{2})?$/);
  if (timeOnly) return timeOnly[1];
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return str;
  return parsed.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const statusColor = (status) => {
  const value = String(status || "").toUpperCase();
  if (value === "TIBA") return "green";
  if (value === "BONGKAR") return "orange";
  if (value === "KIRIM") return "blue";
  if (value === "BATAL") return "red";
  return "gray";
};

const InfoItem = ({ label, children }) => (
  <Box>
    <Text fontSize="xs" color="gray.500" fontWeight="semibold">
      {label}
    </Text>
    <Text fontWeight="medium" wordBreak="break-word">
      {children}
    </Text>
  </Box>
);

function QRCodeSuratJalan({ match }) {
  const kode = match?.params?.kode;
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSuratJalan = async () => {
      if (!kode) {
        setError("Kode verifikasi tidak valid");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");
      try {
        const res = await axios.get(`${API_BASE}/pengiriman/public/${kode}`);
        setData(res.data.result || null);
      } catch (err) {
        setData(null);
        setError(
          err.response?.data?.error || "Data surat jalan tidak ditemukan",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuratJalan();
  }, [kode]);

  const produksi = data?.produksiSumurs || [];
  const konfirmasi = data?.konfirmasiPenerimaans || [];
  const satuan = data?.satuanVolume?.satuan || "";

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
          <Box
            bg="white"
            borderRadius="xl"
            p={8}
            textAlign="center"
            boxShadow="sm"
          >
            <Heading size="md" mb={2}>
              QR Code tidak valid
            </Heading>
            <Text color="gray.600">{error}</Text>
          </Box>
        ) : (
          <VStack spacing={6} align="stretch">
            <Box
              bg="white"
              borderRadius="xl"
              p={{ base: 5, md: 6 }}
              boxShadow="sm"
              borderTop="4px solid"
              borderColor="kpbpn"
            >
              <Heading size="md" color="kpbpn" mb={1}>
                {data.nomor || "Surat Jalan"}
              </Heading>
              <Text color="gray.600" mb={5}>
                {formatTanggal(data.tanggal)}
              </Text>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <Box>
                  <Text fontSize="xs" color="gray.500" fontWeight="semibold">
                    STATUS
                  </Text>
                  <Badge
                    colorScheme={statusColor(data.statusSuratJalan?.status)}
                    variant="subtle"
                    mt={1}
                  >
                    {data.statusSuratJalan?.status || "-"}
                  </Badge>
                </Box>
                <InfoItem label="VOLUME">
                  {data.volume != null
                    ? `${data.volume}${satuan ? ` ${satuan}` : ""}`
                    : "-"}
                </InfoItem>
                <InfoItem label="MITRA">
                  {[data.mitra?.jenisMitra?.jenis, data.mitra?.nama]
                    .filter(Boolean)
                    .join(" ") || "-"}
                </InfoItem>
                <InfoItem label="ALAMAT MITRA">
                  {data.mitra?.alamat || "-"}
                </InfoItem>
                <InfoItem label="PENANGGUNG JAWAB">
                  {data.mitra?.penanggungJawab || "-"}
                </InfoItem>
                <InfoItem label="KONTAK">{data.mitra?.kontak || "-"}</InfoItem>
                <InfoItem label="ASAL MINYAK">
                  {data.asalMinyak
                    ? [data.asalMinyak.nomor, data.asalMinyak.asal]
                        .filter(Boolean)
                        .join(" - ") || "-"
                    : "-"}
                </InfoItem>
                <InfoItem label="TUJUAN">
                  {data.stasiunPengumpulMinyak?.nama ||
                    data.daftarUnitKerja?.unitKerja ||
                    "-"}
                </InfoItem>
                <InfoItem label="JAM DATANG">
                  {formatJam(data.jamDatang)}
                </InfoItem>
                <InfoItem label="JAM PERGI">{formatJam(data.jamPergi)}</InfoItem>
              </SimpleGrid>
            </Box>

            <Box
              bg="white"
              borderRadius="xl"
              p={{ base: 5, md: 6 }}
              boxShadow="sm"
            >
              <Heading size="sm" color="kpbpn" mb={4}>
                Kendaraan / Transportir
              </Heading>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <InfoItem label="PLAT">
                  {data.transportir?.plat || "-"}
                </InfoItem>
                <InfoItem label="JENIS">
                  {data.transportir?.jenisTransportir?.jenis || "-"}
                </InfoItem>
                <InfoItem label="KAPASITAS">
                  {data.transportir?.kapasitas != null
                    ? `${data.transportir.kapasitas}${
                        data.transportir.satuanVolume?.satuan
                          ? ` ${data.transportir.satuanVolume.satuan}`
                          : ""
                      }`
                    : "-"}
                </InfoItem>
                <InfoItem label="NAMA SUPIR">{data.supir?.nama || "-"}</InfoItem>
              </SimpleGrid>
              {(data.transportir?.foto || data.supir?.foto) && (
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mt={4}>
                  {data.transportir?.foto && (
                    <Box>
                      <Text
                        fontSize="xs"
                        color="gray.500"
                        fontWeight="semibold"
                        mb={2}
                      >
                        FOTO KENDARAAN
                      </Text>
                      <Image
                        src={getImageUrl(data.transportir.foto)}
                        alt={data.transportir.plat || "Kendaraan"}
                        maxH="180px"
                        w="100%"
                        objectFit="cover"
                        borderRadius="md"
                      />
                    </Box>
                  )}
                  {data.supir?.foto && (
                    <Box>
                      <Text
                        fontSize="xs"
                        color="gray.500"
                        fontWeight="semibold"
                        mb={2}
                      >
                        FOTO SUPIR
                      </Text>
                      <Image
                        src={getImageUrl(data.supir.foto)}
                        alt={data.supir.nama || "Supir"}
                        maxH="180px"
                        w="100%"
                        objectFit="cover"
                        borderRadius="md"
                      />
                    </Box>
                  )}
                </SimpleGrid>
              )}
            </Box>

            <Box
              bg="white"
              borderRadius="xl"
              p={{ base: 5, md: 6 }}
              boxShadow="sm"
            >
              <Heading size="sm" color="kpbpn" mb={4}>
                Produksi Sumur
              </Heading>
              {produksi.length === 0 ? (
                <Text color="gray.500">Belum ada data produksi</Text>
              ) : (
                <Box overflowX="auto">
                  <Table size="sm">
                    <Thead bg="gray.50">
                      <Tr>
                        <Th>Sumur</Th>
                        <Th>Tanggal</Th>
                        <Th>Produksi</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {produksi.map((item, index) => (
                        <Tr key={`${item.tanggal}-${index}`}>
                          <Td>
                            {[item.sumurMinyak?.nama, item.sumurMinyak?.nomor]
                              .filter(Boolean)
                              .join(" · ") || "-"}
                          </Td>
                          <Td>{formatTanggal(item.tanggal)}</Td>
                          <Td>
                            {item.produksi != null
                              ? `${item.produksi}${
                                  item.satuanVolume?.satuan
                                    ? ` ${item.satuanVolume.satuan}`
                                    : ""
                                }`
                              : "-"}
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              )}
            </Box>

            <Box
              bg="white"
              borderRadius="xl"
              p={{ base: 5, md: 6 }}
              boxShadow="sm"
            >
              <Heading size="sm" color="kpbpn" mb={4}>
                Konfirmasi Penerimaan
              </Heading>
              {konfirmasi.length === 0 ? (
                <Text color="gray.500">Belum ada konfirmasi penerimaan</Text>
              ) : (
                <VStack spacing={4} align="stretch">
                  {konfirmasi.map((item, index) => (
                    <Box
                      key={`${item.tanggal}-${index}`}
                      p={4}
                      borderWidth="1px"
                      borderRadius="md"
                      bg="gray.50"
                    >
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                        <InfoItem label="TANGGAL">
                          {formatTanggal(item.tanggal)}
                        </InfoItem>
                        <InfoItem label="VOLUME">
                          {item.volume != null ? item.volume : "-"}
                        </InfoItem>
                        <InfoItem label="PETUGAS PENERIMA (PK)">
                          {item.userPK?.nama || "-"}
                        </InfoItem>
                        <InfoItem label="PETUGAS LAB">
                          {item.userLab?.nama || "-"}
                        </InfoItem>
                        <InfoItem label="CATATAN">{item.catatan || "-"}</InfoItem>
                      </SimpleGrid>
                      {(item.foto || item.fotoLab) && (
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} mt={3}>
                          {item.foto && (
                            <Box>
                              <Text fontSize="xs" color="gray.500" mb={1}>
                                Foto Bukti Penerimaan
                              </Text>
                              <Image
                                src={getImageUrl(item.foto)}
                                alt="Bukti penerimaan"
                                maxH="180px"
                                w="100%"
                                objectFit="cover"
                                borderRadius="md"
                              />
                            </Box>
                          )}
                          {item.fotoLab && (
                            <Box>
                              <Text fontSize="xs" color="gray.500" mb={1}>
                                Foto Lab
                              </Text>
                              <Image
                                src={getImageUrl(item.fotoLab)}
                                alt="Foto lab"
                                maxH="180px"
                                w="100%"
                                objectFit="cover"
                                borderRadius="md"
                              />
                            </Box>
                          )}
                        </SimpleGrid>
                      )}
                    </Box>
                  ))}
                </VStack>
              )}
            </Box>
          </VStack>
        )}
      </Container>
    </Box>
  );
}

export default QRCodeSuratJalan;
