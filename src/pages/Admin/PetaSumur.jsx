import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import {
  Badge,
  Box,
  Center,
  Heading,
  HStack,
  Spinner,
  Text,
  useToast,
  VStack,
} from "@chakra-ui/react";
import LayoutKPBPN from "../../Componets/KPBPN/LayoutKPBPN";
import "leaflet/dist/leaflet.css";
import markerIconImg from "leaflet/dist/images/marker-icon.png";
import markerIconRetina from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const API_BASE = import.meta.env.VITE_REACT_APP_API_BASE_URL;

const DEFAULT_CENTER = [-2.5489, 118.0149];
const DEFAULT_ZOOM = 5;

const statusBadgeColor = {
  sudah: "green",
  belum: "yellow",
  tidak: "red",
};

const statusLabel = {
  sudah: "Sudah",
  belum: "Belum",
  tidak: "Tidak",
};

const markerIcon = L.icon({
  iconUrl: markerIconImg,
  iconRetinaUrl: markerIconRetina,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const parseCoordinate = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const hasValidCoordinates = (sumur) => {
  const lat = parseCoordinate(sumur.latitude);
  const lng = parseCoordinate(sumur.longitude);
  return lat !== null && lng !== null && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

function FitBounds({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;
    const bounds = L.latLngBounds(points.map((point) => [point.lat, point.lng]));
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14 });
  }, [map, points]);

  return null;
}

function MapResize() {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 0);
    return () => clearTimeout(timer);
  }, [map]);

  return null;
}

function PetaSumur() {
  const toast = useToast();
  const [sumurList, setSumurList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSumur = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/sumur-minyak/get`, {
          params: { page: 0, limit: 1000 },
        });
        setSumurList(res.data.result || []);
      } catch (err) {
        console.error(err);
        toast({
          title: "Gagal memuat data sumur",
          description: err.response?.data?.error || err.message,
          status: "error",
          duration: 4000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSumur();
  }, [toast]);

  const sumurDenganKoordinat = useMemo(
    () =>
      sumurList
        .filter(hasValidCoordinates)
        .map((sumur) => ({
          ...sumur,
          lat: parseCoordinate(sumur.latitude),
          lng: parseCoordinate(sumur.longitude),
        })),
    [sumurList],
  );

  const mapCenter = useMemo(() => {
    if (!sumurDenganKoordinat.length) return DEFAULT_CENTER;
    const avgLat =
      sumurDenganKoordinat.reduce((total, sumur) => total + sumur.lat, 0) /
      sumurDenganKoordinat.length;
    const avgLng =
      sumurDenganKoordinat.reduce((total, sumur) => total + sumur.lng, 0) /
      sumurDenganKoordinat.length;
    return [avgLat, avgLng];
  }, [sumurDenganKoordinat]);

  return (
    <LayoutKPBPN hideFooter>
      <Box position="fixed" top="80px" left="0" right="0" bottom="0" zIndex={1}>
        {!isLoading && (
          <Box
            position="absolute"
            top={4}
            left={4}
            zIndex={1000}
            bg="white"
            px={4}
            py={3}
            borderRadius="md"
            boxShadow="md"
            maxW="320px"
          >
            <Heading size="md">Peta Sumur Minyak</Heading>
            <Text color="gray.600" fontSize="sm" mt={1}>
              {sumurDenganKoordinat.length} dari {sumurList.length} sumur
              memiliki koordinat.
            </Text>
            {sumurDenganKoordinat.length === 0 && (
              <Text color="gray.500" fontSize="sm" mt={2}>
                Belum ada sumur dengan koordinat latitude/longitude yang valid.
              </Text>
            )}
          </Box>
        )}

        {isLoading ? (
          <Center h="100%" w="100%">
            <Spinner size="xl" color="primary" />
          </Center>
        ) : (
          <MapContainer
            center={mapCenter}
            zoom={DEFAULT_ZOOM}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapResize />
            {sumurDenganKoordinat.length > 0 && (
              <FitBounds points={sumurDenganKoordinat} />
            )}
            {sumurDenganKoordinat.map((sumur) => (
              <Marker
                key={sumur.id}
                position={[sumur.lat, sumur.lng]}
                icon={markerIcon}
              >
                <Popup>
                  <VStack align="start" spacing={1} minW="180px">
                    <Text fontWeight="bold">{sumur.nama || "-"}</Text>
                    {sumur.nomor && (
                      <Text fontSize="sm">No: {sumur.nomor}</Text>
                    )}
                    {sumur.mitra?.nama && (
                      <Text fontSize="sm">Mitra: {sumur.mitra.nama}</Text>
                    )}
                    {sumur.alamat && (
                      <Text fontSize="sm">Alamat: {sumur.alamat}</Text>
                    )}
                    <Text fontSize="sm">
                      Koordinat: {sumur.lat}, {sumur.lng}
                    </Text>
                    {sumur.produksiHarian != null && (
                      <Text fontSize="sm">
                        Produksi harian: {sumur.produksiHarian}
                      </Text>
                    )}
                    <HStack>
                      <Text fontSize="sm">Verifikasi:</Text>
                      <Badge
                        colorScheme={
                          statusBadgeColor[sumur.statusVerifikasi] || "gray"
                        }
                      >
                        {statusLabel[sumur.statusVerifikasi] ||
                          sumur.statusVerifikasi ||
                          "-"}
                      </Badge>
                    </HStack>
                  </VStack>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </Box>
    </LayoutKPBPN>
  );
}

export default PetaSumur;
