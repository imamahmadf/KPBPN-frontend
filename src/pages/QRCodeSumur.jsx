import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import {
  Badge,
  Box,
  Center,
  Container,
  Heading,
  Image,
  Link,
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
import "leaflet/dist/leaflet.css";

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

const PEMILIK_FIELDS = [
  { key: "namaPemilikLahan", label: "Nama Pemilik Lahan" },
  { key: "namaPemilikSumur", label: "Nama Pemilik Sumur" },
  { key: "kontakPemilikLahan", label: "Kontak Pemilik Lahan" },
  { key: "kontakPemilikSumur", label: "Kontak Pemilik Sumur" },
];

const statusBadgeColor = {
  sudah: "green",
  belum: "yellow",
  tidak: "red",
};

const MARKER_COLOR = "#DD6B20";
const MAX_ZOOM = 22;

const parseCoordinate = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const createMarkerIcon = () => {
  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41">
      <path fill="${MARKER_COLOR}" stroke="#1A202C" stroke-width="1" d="M12.5 0C5.596 0 0 5.596 0 12.5c0 9.375 12.5 28.5 12.5 28.5S25 21.875 25 12.5C25 5.596 19.404 0 12.5 0z"/>
      <circle cx="12.5" cy="12.2" r="4.8" fill="#fff"/>
    </svg>`,
  );

  return L.icon({
    iconUrl: `data:image/svg+xml;charset=UTF-8,${svg}`,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });
};

const markerIcon = createMarkerIcon();

function MapResize() {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 0);
    return () => clearTimeout(timer);
  }, [map]);

  return null;
}

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

function QRCodeSumur({ match }) {
  const kode = match?.params?.kode;
  const [sumur, setSumur] = useState(null);
  const [produksi, setProduksi] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSumur = async () => {
      if (!kode) {
        setError("Kode QR tidak valid");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");
      try {
        const res = await axios.get(`${API_BASE}/sumur-minyak/public/${kode}`);
        setSumur(res.data.result || null);
        setProduksi(res.data.produksi || []);
      } catch (err) {
        setSumur(null);
        setProduksi([]);
        setError(
          err.response?.data?.error || "Data sumur tidak ditemukan",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchSumur();
  }, [kode]);

  const koordinat = useMemo(() => {
    const lat = parseCoordinate(sumur?.latitude);
    const lng = parseCoordinate(sumur?.longitude);
    if (
      lat === null ||
      lng === null ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      return null;
    }
    return { lat, lng };
  }, [sumur]);

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
                {sumur.nama || "Sumur Minyak"}
              </Heading>
              <Text color="gray.600" mb={5}>
                {sumur.nomor ? `Nomor ${sumur.nomor}` : "Informasi sumur"}
              </Text>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <InfoItem label="MITRA">{sumur.mitra?.nama || "-"}</InfoItem>
                <InfoItem label="ALAMAT">{sumur.alamat || "-"}</InfoItem>
                <InfoItem label="PRODUKSI HARIAN">
                  {sumur.produksiHarian != null ? sumur.produksiHarian : "-"}
                </InfoItem>
                <Box>
                  <Text fontSize="xs" color="gray.500" fontWeight="semibold">
                    STATUS VERIFIKASI
                  </Text>
                  <Badge
                    colorScheme={
                      statusBadgeColor[sumur.statusVerifikasi] || "gray"
                    }
                    variant="subtle"
                    textTransform="capitalize"
                    mt={1}
                  >
                    {sumur.statusVerifikasi || "-"}
                  </Badge>
                </Box>
                <InfoItem label="TANGGAL VERIFIKASI">
                  {formatTanggal(sumur.tanggalVerifikasi)}
                </InfoItem>
                <InfoItem label="KOORDINAT">
                  {koordinat
                    ? `${koordinat.lat}, ${koordinat.lng}`
                    : "-"}
                </InfoItem>
              </SimpleGrid>

              {sumur.foto && (
                <Box mt={5}>
                  <Text
                    fontSize="xs"
                    color="gray.500"
                    fontWeight="semibold"
                    mb={2}
                  >
                    FOTO SUMUR
                  </Text>
                  <Image
                    src={getImageUrl(sumur.foto)}
                    alt={sumur.nama}
                    maxH="240px"
                    w="100%"
                    objectFit="cover"
                    borderRadius="md"
                  />
                </Box>
              )}
            </Box>

            <Box bg="white" borderRadius="xl" p={{ base: 5, md: 6 }} boxShadow="sm">
              <Heading size="sm" color="kpbpn" mb={4}>
                Lokasi Sumur
              </Heading>
              {koordinat ? (
                <>
                  <Box
                    h={{ base: "260px", md: "360px" }}
                    borderRadius="md"
                    overflow="hidden"
                    borderWidth="1px"
                    borderColor="gray.200"
                  >
                    <MapContainer
                      center={[koordinat.lat, koordinat.lng]}
                      zoom={15}
                      maxZoom={MAX_ZOOM}
                      style={{ height: "100%", width: "100%" }}
                      scrollWheelZoom
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        maxNativeZoom={19}
                        maxZoom={MAX_ZOOM}
                      />
                      <MapResize />
                      <Marker
                        position={[koordinat.lat, koordinat.lng]}
                        icon={markerIcon}
                      >
                        <Popup>
                          <VStack align="start" spacing={1} minW="160px">
                            <Text fontWeight="bold">{sumur.nama || "-"}</Text>
                            {sumur.nomor && (
                              <Text fontSize="sm">No: {sumur.nomor}</Text>
                            )}
                            <Text fontSize="sm">
                              Koordinat: {koordinat.lat}, {koordinat.lng}
                            </Text>
                          </VStack>
                        </Popup>
                      </Marker>
                    </MapContainer>
                  </Box>
                  <Link
                    href={`https://www.google.com/maps?q=${koordinat.lat},${koordinat.lng}`}
                    isExternal
                    color="kpbpn"
                    fontSize="sm"
                    fontWeight="medium"
                    mt={3}
                    display="inline-block"
                  >
                    Buka di Google Maps
                  </Link>
                </>
              ) : (
                <Text color="gray.500">Koordinat sumur belum tersedia</Text>
              )}
            </Box>

            <Box bg="white" borderRadius="xl" p={{ base: 5, md: 6 }} boxShadow="sm">
              <Heading size="sm" color="kpbpn" mb={4}>
                Data Pemilik
              </Heading>
              <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
                {PEMILIK_FIELDS.map((field) => (
                  <InfoItem key={field.key} label={field.label.toUpperCase()}>
                    {sumur[field.key] || "-"}
                  </InfoItem>
                ))}
              </SimpleGrid>
            </Box>

            <Box bg="white" borderRadius="xl" p={{ base: 5, md: 6 }} boxShadow="sm">
              <Heading size="sm" color="kpbpn" mb={4}>
                Produksi Terbaru
              </Heading>
              {produksi.length === 0 ? (
                <Text color="gray.500">Belum ada data produksi</Text>
              ) : (
                <Box overflowX="auto">
                  <Table size="sm">
                    <Thead bg="gray.50">
                      <Tr>
                        <Th>Tanggal</Th>
                        <Th>Produksi</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {produksi.map((item, index) => (
                        <Tr key={`${item.tanggal}-${index}`}>
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
          </VStack>
        )}
      </Container>
    </Box>
  );
}

export default QRCodeSumur;
