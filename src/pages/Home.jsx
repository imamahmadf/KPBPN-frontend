import React from "react";
import {
  Box,
  Text,
  Button,
  Container,
  VStack,
  HStack,
  SimpleGrid,
  Icon,
  Heading,
  Image,
  Badge,
} from "@chakra-ui/react";
import { keyframes, css } from "@emotion/react";
import {
  FaUsers,
  FaRoute,
  FaGasPump,
  FaClipboardList,
  FaChartLine,
  FaShieldAlt,
} from "react-icons/fa";
import Layout from "../Componets/Layout";
import { useSelector } from "react-redux";
import { selectIsAuthenticated } from "../Redux/Reducers/auth";
import FotoTanki from "../assets/fototanki.jpg";
import LogoKPBPN from "../assets/Logo-KPBPN-putih.png";
import { getSEOConfig } from "../config/seoConfig";
import { useHistory } from "react-router-dom";

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
`;

const fadeInAnimation = css`
  animation: ${fadeIn} 0.9s ease-out both;
`;

const fadeInDelay1 = css`
  animation: ${fadeIn} 0.9s ease-out 0.15s both;
`;

const fadeInDelay2 = css`
  animation: ${fadeIn} 0.9s ease-out 0.3s both;
`;

const fadeInDelay3 = css`
  animation: ${fadeIn} 0.9s ease-out 0.45s both;
`;

const floatAnimation = css`
  animation: ${float} 2.2s ease-in-out infinite;
`;

const features = [
  {
    icon: FaUsers,
    title: "Manajemen Mitra",
    description:
      "Kelola data mitra koperasi, status keanggotaan, dan informasi operasional secara terpusat.",
    color: "kpbpn",
  },
  {
    icon: FaRoute,
    title: "Pengiriman & Surat Jalan",
    description:
      "Pantau dan kelola surat jalan pengiriman minyak dari sumur masyarakat dengan alur yang terstruktur.",
    color: "aset",
  },
  {
    icon: FaGasPump,
    title: "Pengisian Tanki",
    description:
      "Catat unloading truk ke tanki, volume pengisian, dan riwayat operasional harian.",
    color: "perencanaan",
  },
  {
    icon: FaClipboardList,
    title: "Daftar Tanki",
    description:
      "Monitoring kapasitas, status, dan ketersediaan tanki penyimpanan di seluruh unit.",
    color: "pegawai",
  },
  {
    icon: FaChartLine,
    title: "Laporan & Rekapitulasi",
    description:
      "Rekapitulasi data pengiriman, mitra, dan tanki untuk kebutuhan evaluasi operasional.",
    color: "ungu",
  },
  {
    icon: FaShieldAlt,
    title: "Akses Berbasis Peran",
    description:
      "Keamanan data terjamin dengan hak akses berbeda untuk admin, super admin, dan mitra.",
    color: "primary",
  },
];

const highlights = [
  { label: "Modul Terintegrasi", value: "Mitra · Pengiriman · Tanki" },
  { label: "Operasional", value: "Real-time & Terstruktur" },
  { label: "Platform", value: "KPBPN Digital" },
];

function Home() {
  const isAuthenticated =
    useSelector(selectIsAuthenticated) || localStorage.getItem("token");
  const history = useHistory();

  const scrollToFeatures = () => {
    document
      .getElementById("fitur-kpbpn")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <Layout seoProps={getSEOConfig("home")} noPaddingTop={true}>
      {/* Hero */}
      <Box
        position="relative"
        minH={{ base: "100svh", md: "92vh" }}
        display="flex"
        alignItems="center"
        overflow="hidden"
      >
        <Box
          position="absolute"
          inset={0}
          backgroundImage={`url(${FotoTanki})`}
          backgroundSize="cover"
          backgroundPosition="center"
          backgroundAttachment={{ base: "scroll", md: "fixed" }}
        />

        <Box
          position="absolute"
          inset={0}
          bgGradient="linear(to-br, rgba(89, 35, 6, 0.88) 0%, rgba(38, 38, 38, 0.82) 55%, rgba(0, 0, 0, 0.75) 100%)"
        />

        <Box
          position="absolute"
          inset={0}
          opacity={0.08}
          backgroundImage="radial-gradient(circle at 2px 2px, white 1px, transparent 0)"
          backgroundSize="36px 36px"
        />

        <Container
          maxW="container.xl"
          position="relative"
          zIndex={2}
          py={{ base: 28, md: 20 }}
        >
          <VStack spacing={{ base: 6, md: 8 }} textAlign="center">
            <Box css={fadeInAnimation}>
              <Image
                src={LogoKPBPN}
                alt="Logo Koperasi Produsen Batanghari Patra Nusantara"
                maxW={{ base: "160px", md: "220px" }}
                mx="auto"
                mb={6}
                filter="drop-shadow(0 8px 24px rgba(0,0,0,0.35))"
              />
              <Badge
                colorScheme="orange"
                px={4}
                py={1}
                borderRadius="full"
                fontSize="xs"
                letterSpacing="wider"
                textTransform="uppercase"
                mb={4}
              >
                Sistem Informasi Koperasi
              </Badge>
              <Heading
                as="h1"
                color="white"
                fontWeight={800}
                fontSize={{ base: "2xl", sm: "3xl", md: "4xl", lg: "5xl" }}
                lineHeight="1.15"
                letterSpacing="tight"
                textShadow="0 4px 20px rgba(0,0,0,0.4)"
              >
                Koperasi Produsen
                <Text
                  as="span"
                  display="block"
                  mt={2}
                  bgGradient="linear(to-r, #FDBA74, #FED7AA)"
                  bgClip="text"
                >
                  Batanghari Patra Nusantara
                </Text>
              </Heading>
            </Box>

            <Box css={fadeInDelay1} maxW="680px" px={2}>
              <Text
                color="whiteAlpha.900"
                fontSize={{ base: "md", md: "lg", lg: "xl" }}
                lineHeight="1.8"
                textShadow="0 2px 8px rgba(0,0,0,0.3)"
              >
                Platform digital untuk pengelolaan mitra, pengiriman minyak
                dari sumur masyarakat, pengisian tanki, dan operasional
                koperasi secara terintegrasi.
              </Text>
            </Box>

            <Box css={fadeInDelay2} w="full" maxW="560px">
              <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={3}>
                {highlights.map((item) => (
                  <Box
                    key={item.label}
                    bg="whiteAlpha.150"
                    backdropFilter="blur(12px)"
                    border="1px solid"
                    borderColor="whiteAlpha.250"
                    borderRadius="xl"
                    px={4}
                    py={3}
                  >
                    <Text
                      fontSize="xs"
                      color="whiteAlpha.700"
                      textTransform="uppercase"
                      letterSpacing="wide"
                      mb={1}
                    >
                      {item.label}
                    </Text>
                    <Text
                      fontSize={{ base: "sm", md: "md" }}
                      fontWeight={700}
                      color="white"
                    >
                      {item.value}
                    </Text>
                  </Box>
                ))}
              </SimpleGrid>
            </Box>

            <Box css={fadeInDelay3} pt={2}>
              <HStack spacing={4} justify="center" flexWrap="wrap">
                {isAuthenticated ? (
                  <Button
                    colorScheme="orange"
                    size="lg"
                    px={8}
                    onClick={() => history.push("/mitra-kpbpn/daftar")}
                    _hover={{ transform: "translateY(-2px)", boxShadow: "xl" }}
                    transition="all 0.25s"
                  >
                    Buka Dashboard
                  </Button>
                ) : (
                  <Button
                    colorScheme="orange"
                    size="lg"
                    px={8}
                    onClick={() => history.push("/login")}
                    _hover={{ transform: "translateY(-2px)", boxShadow: "xl" }}
                    transition="all 0.25s"
                  >
                    Masuk ke Sistem
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="lg"
                  px={8}
                  color="white"
                  borderColor="whiteAlpha.600"
                  _hover={{
                    bg: "whiteAlpha.200",
                    borderColor: "white",
                    transform: "translateY(-2px)",
                  }}
                  transition="all 0.25s"
                  onClick={scrollToFeatures}
                >
                  Lihat Fitur
                </Button>
              </HStack>
            </Box>
          </VStack>
        </Container>

        <Box
          position="absolute"
          bottom="28px"
          left="50%"
          transform="translateX(-50%)"
          zIndex={2}
          css={floatAnimation}
          cursor="pointer"
          onClick={scrollToFeatures}
          role="button"
          aria-label="Scroll ke fitur"
        >
          <Box
            w="28px"
            h="44px"
            border="2px solid"
            borderColor="whiteAlpha.700"
            borderRadius="full"
            position="relative"
          >
            <Box
              w="4px"
              h="8px"
              bg="whiteAlpha.800"
              borderRadius="full"
              position="absolute"
              top="10px"
              left="50%"
              transform="translateX(-50%)"
            />
          </Box>
        </Box>
      </Box>

      {/* Fitur */}
      <Box
        id="fitur-kpbpn"
        py={{ base: 16, md: 24 }}
        bg="gray.50"
        position="relative"
        _before={{
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          h: "4px",
          bgGradient: "linear(to-r, kpbpn, primary, kpbpn)",
        }}
      >
        <Container maxW="container.xl">
          <VStack spacing={4} textAlign="center" mb={{ base: 10, md: 14 }}>
            <Badge colorScheme="orange" px={3} py={1} borderRadius="full">
              Layanan Utama
            </Badge>
            <Heading
              as="h2"
              size={{ base: "lg", md: "xl" }}
              color="gelap"
              fontWeight={800}
            >
              Kelola Operasional Koperasi dalam Satu Platform
            </Heading>
            <Text
              color="gray.600"
              maxW="640px"
              fontSize={{ base: "md", md: "lg" }}
              lineHeight="1.7"
            >
              Semua modul dirancang untuk mendukung alur kerja harian tim KPBPN
              — dari pendaftaran mitra hingga pencatatan pengisian tanki.
            </Text>
          </VStack>

          <SimpleGrid
            columns={{ base: 1, sm: 2, lg: 3 }}
            spacing={{ base: 5, md: 6 }}
          >
            {features.map((feature) => (
              <Box
                key={feature.title}
                bg="white"
                borderRadius="2xl"
                p={{ base: 6, md: 7 }}
                border="1px solid"
                borderColor="gray.100"
                boxShadow="sm"
                transition="all 0.3s ease"
                _hover={{
                  transform: "translateY(-6px)",
                  boxShadow: "lg",
                  borderColor: `${feature.color}`,
                }}
              >
                <Box
                  display="inline-flex"
                  p={3}
                  borderRadius="xl"
                  bg={`${feature.color}`}
                  mb={4}
                  boxShadow="md"
                >
                  <Icon as={feature.icon} color="white" boxSize={6} />
                </Box>
                <Heading
                  as="h3"
                  size="md"
                  color="gelap"
                  mb={3}
                  fontWeight={700}
                >
                  {feature.title}
                </Heading>
                <Text color="gray.600" fontSize="sm" lineHeight="1.7">
                  {feature.description}
                </Text>
              </Box>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/* CTA */}
      <Box
        py={{ base: 14, md: 20 }}
        bgGradient="linear(to-br, kpbpn, gelap)"
        position="relative"
        overflow="hidden"
      >
        <Box
          position="absolute"
          inset={0}
          opacity={0.06}
          backgroundImage="radial-gradient(circle at 2px 2px, white 1px, transparent 0)"
          backgroundSize="40px 40px"
        />
        <Container maxW="container.lg" position="relative">
          <VStack spacing={6} textAlign="center">
            <Heading
              as="h2"
              size={{ base: "lg", md: "xl" }}
              color="white"
              fontWeight={800}
            >
              Siap Mengelola Operasional KPBPN?
            </Heading>
            <Text color="whiteAlpha.800" maxW="520px" lineHeight="1.7">
              Masuk ke sistem untuk mengakses modul mitra, pengiriman, dan tanki
              sesuai peran pengguna Anda.
            </Text>
            {!isAuthenticated && (
              <Button
                size="lg"
                bg="white"
                color="kpbpn"
                px={10}
                fontWeight={700}
                _hover={{ bg: "orange.50", transform: "translateY(-2px)" }}
                transition="all 0.25s"
                onClick={() => history.push("/login")}
              >
                Login Sekarang
              </Button>
            )}
          </VStack>
        </Container>
      </Box>
    </Layout>
  );
}

export default Home;
