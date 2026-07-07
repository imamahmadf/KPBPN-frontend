import React, { useState, useEffect } from "react";
import {
  Box,
  Text,
  Container,
  FormControl,
  FormLabel,
  Center,
  HStack,
  Table,
  SimpleGrid,
  Flex,
  Spacer,
  Divider,
  Image,
  VStack,
  Icon,
  Link,
} from "@chakra-ui/react";
import { BsGeoAltFill, BsEnvelopeAtFill, BsInstagram } from "react-icons/bs";
import LogoPutih from "../../assets/logo-putih.png";

function FooterPegawai() {
  return (
    <>
      <Box
        bgGradient="linear(to-r, pegawai, pegawaiGelap)"
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
          maxW={"1280px"}
          position="relative"
        >
          <SimpleGrid
            columns={{ base: 1, md: 3 }}
            spacing={{ base: 6, md: 8 }}
            mb={8}
          >
            {/* Alamat */}
            <VStack align="start" spacing={3}>
              <HStack spacing={3}>
                <Box
                  p={3}
                  bg="rgba(255, 255, 255, 0.15)"
                  borderRadius="lg"
                  backdropFilter="blur(10px)"
                >
                  <Icon as={BsGeoAltFill} color="white" boxSize={6} />
                </Box>
                <Text fontSize={"18px"} fontWeight={700} color={"white"}>
                  Alamat
                </Text>
              </HStack>
              {/* <Text
                fontSize={"14px"}
                fontWeight={400}
                color={"white"}
                opacity={0.9}
                lineHeight="1.6"
                pl={12}
              >
                Komplek Perkantoran Jl. Kusuma Bangsa KM. 05 Gedung A. Lt.2 Kav.
                1 Kav.1, Tanah Grogot, Paser, Kalimantan Timur 76251
              </Text> */}
            </VStack>

            {/* Email */}
            <VStack align="start" spacing={3}>
              <HStack spacing={3}>
                <Box
                  p={3}
                  bg="rgba(255, 255, 255, 0.15)"
                  borderRadius="lg"
                  backdropFilter="blur(10px)"
                >
                  <Icon as={BsEnvelopeAtFill} color="white" boxSize={6} />
                </Box>
                <Text fontSize={"18px"} fontWeight={700} color={"white"}>
                  Email
                </Text>
              </HStack>
              {/* <Link
                href="mailto:dinkespaser.kaltim@gmail.com"
                fontSize={"14px"}
                fontWeight={400}
                color={"white"}
                opacity={0.9}
                pl={12}
                _hover={{
                  opacity: 1,
                  textDecoration: "underline",
                }}
                transition="all 0.2s ease"
              >
                dinkespaser.kaltim@gmail.com
              </Link> */}
            </VStack>

            {/* Instagram */}
            <VStack align="start" spacing={3}>
              <HStack spacing={3}>
                <Box
                  p={3}
                  bg="rgba(255, 255, 255, 0.15)"
                  borderRadius="lg"
                  backdropFilter="blur(10px)"
                >
                  <Icon as={BsInstagram} color="white" boxSize={6} />
                </Box>
                <Text fontSize={"18px"} fontWeight={700} color={"white"}>
                  Instagram
                </Text>
              </HStack>
              {/* <Link
                href="https://instagram.com/dinkespaserkab"
                target="_blank"
                rel="noopener noreferrer"
                fontSize={"14px"}
                fontWeight={400}
                color={"white"}
                opacity={0.9}
                pl={12}
                _hover={{
                  opacity: 1,
                  textDecoration: "underline",
                }}
                transition="all 0.2s ease"
              >
                @dinkespaserkab
              </Link> */}
            </VStack>
          </SimpleGrid>
        </Container>
      </Box>
      <Box
        borderTop={"1px"}
        borderColor={"rgba(255, 255, 255, 0.2)"}
        py={"20px"}
        bgColor={"gelap"}
        color={"white"}
      >
        <Container maxW={"1280px"}>
          <Center>
            <Text fontSize="sm" opacity={0.8}>
              Copyright © 2025 Imam Ahmad Fahrurazi. All Right Reserved
            </Text>
          </Center>
        </Container>
      </Box>
    </>
  );
}

export default FooterPegawai;
