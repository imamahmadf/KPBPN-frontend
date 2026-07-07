import React from "react";
import {
  Box,
  Text,
  Container,
  Center,
  HStack,
  SimpleGrid,
  VStack,
  Icon,
  Link,
  Image,
  Divider,
} from "@chakra-ui/react";
import { BsGeoAltFill, BsEnvelopeAtFill, BsInstagram } from "react-icons/bs";
import LogoKPBPN from "../../assets/Logo-KPBPN-putih.png";

const contactItems = [
  {
    icon: BsGeoAltFill,
    title: "Alamat",
    content: "Jl. Contoh No. 123, Kota, Provinsi 12345",
  },
  {
    icon: BsEnvelopeAtFill,
    title: "Email",
    content: "info@kpbpn.co.id",
    href: "mailto:info@kpbpn.co.id",
  },
  {
    icon: BsInstagram,
    title: "Instagram",
    content: "@kpbpn_batanghari",
    href: "https://instagram.com",
  },
];

function FooterKPBPN() {
  return (
    <>
      <Box
        bgGradient="linear(to-br, kpbpn, gelap)"
        zIndex={1001}
        position="relative"
        overflow="hidden"
        _before={{
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bg: 'url(\'data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\')',
          opacity: 0.1,
        }}
      >
        <Container
          py={{ base: "40px", md: "60px" }}
          maxW="1280px"
          position="relative"
        >
          <VStack
            spacing={4}
            align={{ base: "center", md: "start" }}
            mb={{ base: 8, md: 10 }}
          >
            <Image
              src={LogoKPBPN}
              alt="Logo Koperasi Produsen Batanghari Patra Nusantara"
              maxW={{ base: "180px", md: "260px" }}
              objectFit="contain"
              fallback={
                <Text
                  color="white"
                  fontSize="2xl"
                  fontWeight="bold"
                  letterSpacing="wide"
                  textAlign="center"
                >
                  KPBPN
                </Text>
              }
            />
            <Text
              color="white"
              fontSize={{ base: "md", md: "lg" }}
              fontWeight={700}
              textAlign={{ base: "center", md: "left" }}
            >
              Koperasi Produsen Batanghari Patra Nusantara
            </Text>
            <Text
              color="white"
              fontSize={{ base: "sm", md: "md" }}
              opacity={0.9}
              textAlign={{ base: "center", md: "left" }}
              maxW="520px"
              lineHeight="1.7"
            >
              Sistem informasi manajemen pengiriman, mitra, tanki, dan
              operasional koperasi.
            </Text>
          </VStack>

          <Divider borderColor="whiteAlpha.300" mb={{ base: 6, md: 8 }} />

          <SimpleGrid
            columns={{ base: 1, sm: 2, md: 3 }}
            spacing={{ base: 6, md: 8 }}
          >
            {contactItems.map((item) => (
              <VStack key={item.title} align="start" spacing={3}>
                <HStack spacing={3}>
                  <Box
                    p={3}
                    bg="whiteAlpha.200"
                    borderRadius="lg"
                    backdropFilter="blur(10px)"
                  >
                    <Icon as={item.icon} color="white" boxSize={6} />
                  </Box>
                  <Text fontSize="lg" fontWeight={700} color="white">
                    {item.title}
                  </Text>
                </HStack>
                {item.href ? (
                  <Link
                    href={item.href}
                    target={item.href.startsWith("http") ? "_blank" : undefined}
                    rel={
                      item.href.startsWith("http")
                        ? "noopener noreferrer"
                        : undefined
                    }
                    fontSize="sm"
                    color="white"
                    opacity={0.9}
                    pl={14}
                    lineHeight="1.6"
                    _hover={{
                      opacity: 1,
                      textDecoration: "underline",
                    }}
                    transition="all 0.2s ease"
                  >
                    {item.content}
                  </Link>
                ) : (
                  <Text
                    fontSize="sm"
                    color="white"
                    opacity={0.9}
                    pl={14}
                    lineHeight="1.6"
                  >
                    {item.content}
                  </Text>
                )}
              </VStack>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      <Box
        borderTop="1px"
        borderColor="whiteAlpha.200"
        py="20px"
        bgColor="gelap"
        color="white"
      >
        <Container maxW="1280px">
          <Center>
            <Text fontSize="sm" opacity={0.8} textAlign="center">
              Copyright © {new Date().getFullYear()} Koperasi Produsen
              Batanghari Patra Nusantara. All Rights Reserved
            </Text>
          </Center>
        </Container>
      </Box>
    </>
  );
}

export default FooterKPBPN;
