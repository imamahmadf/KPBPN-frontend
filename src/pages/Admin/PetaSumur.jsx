import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import L from "leaflet";
import {
  Circle,
  CircleMarker,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import {
  Badge,
  Box,
  Button,
  Center,
  Heading,
  HStack,
  Spinner,
  Text,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { useSelector } from "react-redux";
import LayoutKPBPN from "../../Componets/KPBPN/LayoutKPBPN";
import { selectScopedMitraId } from "../../Redux/Reducers/auth";
import "leaflet/dist/leaflet.css";

const API_BASE = import.meta.env.VITE_REACT_APP_API_BASE_URL;

const DEFAULT_CENTER = [-2.5489, 118.0149];
const DEFAULT_ZOOM = 5;
const MAX_ZOOM = 22;
const LABEL_MIN_ZOOM = 13;
const DEFAULT_MARKER_COLOR = "#718096";

const MARKER_COLORS = [
  "#E53E3E",
  "#3182CE",
  "#38A169",
  "#D69E2E",
  "#805AD5",
  "#DD6B20",
  "#319795",
  "#D53F8C",
  "#2C7A7B",
  "#C05621",
  "#553C9A",
  "#2B6CB0",
];

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

const markerIconCache = {};

const createColoredMarkerIcon = (color) => {
  if (markerIconCache[color]) return markerIconCache[color];

  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41">
      <path fill="${color}" stroke="#1A202C" stroke-width="1" d="M12.5 0C5.596 0 0 5.596 0 12.5c0 9.375 12.5 28.5 12.5 28.5S25 21.875 25 12.5C25 5.596 19.404 0 12.5 0z"/>
      <circle cx="12.5" cy="12.2" r="4.8" fill="#fff"/>
    </svg>`,
  );

  markerIconCache[color] = L.icon({
    iconUrl: `data:image/svg+xml;charset=UTF-8,${svg}`,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });

  return markerIconCache[color];
};

const parseCoordinate = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const hasValidCoordinates = (sumur) => {
  const lat = parseCoordinate(sumur.latitude);
  const lng = parseCoordinate(sumur.longitude);
  return (
    lat !== null &&
    lng !== null &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
};

function FitBounds({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;
    const bounds = L.latLngBounds(
      points.map((point) => [point.lat, point.lng]),
    );
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

function ZoomTracker({ onZoomChange }) {
  const map = useMap();

  useEffect(() => {
    const updateZoom = () => onZoomChange(map.getZoom());
    updateZoom();
    map.on("zoomend", updateZoom);
    return () => map.off("zoomend", updateZoom);
  }, [map, onZoomChange]);

  return null;
}

function PetaSumur() {
  const toast = useToast();
  const scopedMitraId = useSelector(selectScopedMitraId);
  const [sumurList, setSumurList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [userLocationStatus, setUserLocationStatus] = useState("loading");
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);
  const showSumurLabels = mapZoom >= LABEL_MIN_ZOOM;

  useEffect(() => {
    if (!navigator.geolocation) {
      setUserLocationStatus("unsupported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setUserLocationStatus("ready");
      },
      (error) => {
        setUserLocationStatus(error.code === 1 ? "denied" : "error");
        toast({
          title: "Lokasi Anda tidak ditampilkan",
          description:
            error.code === 1
              ? "Izinkan akses lokasi di browser untuk menampilkan posisi Anda di peta."
              : "Gagal mendapatkan posisi perangkat.",
          status: "warning",
          duration: 4000,
          isClosable: true,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
      },
    );
  }, [toast]);

  useEffect(() => {
    const fetchSumur = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/sumur-minyak/get`, {
          params: {
            page: 0,
            limit: 1000,
            mitraId: scopedMitraId || undefined,
          },
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
  }, [toast, scopedMitraId]);

  const sumurDenganKoordinat = useMemo(
    () =>
      sumurList.filter(hasValidCoordinates).map((sumur) => ({
        ...sumur,
        lat: parseCoordinate(sumur.latitude),
        lng: parseCoordinate(sumur.longitude),
      })),
    [sumurList],
  );

  const mapCenter = useMemo(() => {
    if (userLocation) return [userLocation.lat, userLocation.lng];
    if (!sumurDenganKoordinat.length) return DEFAULT_CENTER;
    const avgLat =
      sumurDenganKoordinat.reduce((total, sumur) => total + sumur.lat, 0) /
      sumurDenganKoordinat.length;
    const avgLng =
      sumurDenganKoordinat.reduce((total, sumur) => total + sumur.lng, 0) /
      sumurDenganKoordinat.length;
    return [avgLat, avgLng];
  }, [sumurDenganKoordinat, userLocation]);

  const fitPoints = useMemo(() => {
    const points = [...sumurDenganKoordinat];
    if (userLocation) {
      points.push({ lat: userLocation.lat, lng: userLocation.lng });
    }
    return points;
  }, [sumurDenganKoordinat, userLocation]);

  const mitraLegend = useMemo(() => {
    const seen = new Map();

    sumurDenganKoordinat.forEach((sumur) => {
      const key = sumur.mitraId ?? "unknown";
      if (!seen.has(key)) {
        seen.set(key, {
          mitraId: sumur.mitraId,
          nama:
            sumur.mitra?.nama ||
            (sumur.mitraId ? `Mitra #${sumur.mitraId}` : "Tanpa mitra"),
        });
      }
    });

    return Array.from(seen.values())
      .sort((a, b) => a.nama.localeCompare(b.nama, "id"))
      .map((item) => ({
        ...item,
        color:
          item.mitraId == null
            ? DEFAULT_MARKER_COLOR
            : MARKER_COLORS[
                Math.abs(Number(item.mitraId)) % MARKER_COLORS.length
              ],
      }));
  }, [sumurDenganKoordinat]);

  const colorByMitraId = useMemo(() => {
    const colors = {};
    mitraLegend.forEach((item) => {
      if (item.mitraId != null) colors[item.mitraId] = item.color;
    });
    return colors;
  }, [mitraLegend]);

  const userLocationText = {
    loading: "Mencari posisi Anda...",
    ready: "Posisi Anda ditampilkan di peta.",
    denied: "Izin lokasi ditolak. Aktifkan akses lokasi di browser.",
    unsupported: "Browser tidak mendukung deteksi lokasi.",
    error: "Gagal mendapatkan posisi Anda.",
  }[userLocationStatus];

  return (
    <LayoutKPBPN hideFooter>
      <Box position="fixed" top="80px" left="0" right="0" bottom="0" zIndex={1}>
        {/* {!isLoading && (
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
            <Text color="gray.600" fontSize="sm" mt={1}>
              {userLocationText}
            </Text>
            {sumurDenganKoordinat.length === 0 && (
              <Text color="gray.500" fontSize="sm" mt={2}>
                Belum ada sumur dengan koordinat latitude/longitude yang valid.
              </Text>
            )}
            {mitraLegend.length > 0 && (
              <VStack align="start" spacing={1} mt={3}>
                <Text fontSize="sm" fontWeight="semibold">
                  Warna ikon mitra
                </Text>
                {mitraLegend.map((item) => (
                  <HStack key={item.mitraId ?? "unknown"} spacing={2}>
                    <Box
                      w="12px"
                      h="12px"
                      borderRadius="full"
                      bg={item.color}
                      border="1px solid"
                      borderColor="gray.400"
                      flexShrink={0}
                    />
                    <Text fontSize="sm">{item.nama}</Text>
                  </HStack>
                ))}
              </VStack>
            )}
          </Box>
        )} */}

        {isLoading ? (
          <Center h="100%" w="100%">
            <Spinner size="xl" color="primary" />
          </Center>
        ) : (
          <MapContainer
            center={mapCenter}
            zoom={DEFAULT_ZOOM}
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
            <ZoomTracker onZoomChange={setMapZoom} />
            {fitPoints.length > 0 && <FitBounds points={fitPoints} />}
            <style>
              {`
                .sumur-name-label {
                  background: #fff;
                  border: 1px solid #CBD5E0;
                  border-radius: 4px;
                  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.16);
                  color: #1A202C;
                  font-size: 12px;
                  font-weight: 600;
                  padding: 2px 6px;
                  white-space: nowrap;
                }
                .sumur-name-label::before {
                  display: none;
                }
                .leaflet-popup-content a.peta-sumur-detail-btn {
                  color: #fff;
                  text-decoration: none;
                  display: inline-flex;
                  align-items: center;
                  justify-content: center;
                }
              `}
            </style>
            {userLocation && (
              <>
                <Circle
                  center={[userLocation.lat, userLocation.lng]}
                  radius={userLocation.accuracy || 50}
                  pathOptions={{
                    color: "#3182CE",
                    fillColor: "#63B3ED",
                    fillOpacity: 0.2,
                    weight: 1,
                  }}
                />
                <CircleMarker
                  center={[userLocation.lat, userLocation.lng]}
                  radius={9}
                  pathOptions={{
                    color: "#2B6CB0",
                    fillColor: "#3182CE",
                    fillOpacity: 1,
                    weight: 3,
                  }}
                >
                  <Popup>
                    <VStack align="start" spacing={1} minW="160px">
                      <Text fontWeight="bold">Lokasi Anda</Text>
                      <Text fontSize="sm">
                        Koordinat: {userLocation.lat.toFixed(6)},{" "}
                        {userLocation.lng.toFixed(6)}
                      </Text>
                      {userLocation.accuracy != null && (
                        <Text fontSize="sm">
                          Akurasi: ±{Math.round(userLocation.accuracy)} m
                        </Text>
                      )}
                    </VStack>
                  </Popup>
                </CircleMarker>
              </>
            )}
            {sumurDenganKoordinat.map((sumur) => (
              <Marker
                key={sumur.id}
                position={[sumur.lat, sumur.lng]}
                icon={createColoredMarkerIcon(
                  colorByMitraId[sumur.mitraId] || DEFAULT_MARKER_COLOR,
                )}
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
                    <Button
                      as={RouterLink}
                      to={`/sumur/produksi-sumur/${sumur.id}`}
                      className="peta-sumur-detail-btn"
                      variant="primary"
                      size="sm"
                      mt={3}
                      w="100%"
                      h="34px"
                      px={3}
                      fontSize="sm"
                    >
                      Detail
                    </Button>
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
