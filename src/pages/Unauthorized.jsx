import React from "react";
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Button,
} from "@chakra-ui/react";
import { useHistory } from "react-router-dom";
import { FaLock, FaArrowLeft } from "react-icons/fa";
import Layout from "../Componets/Layout";

function Unauthorized() {
  const history = useHistory();

  const handleKembali = () => {
    if (history.length > 1) {
      history.go(-1);
    } else {
      history.push("/");
    }
  };

  return (
    <Box>
      <Container maxW="container.md" py={10}>
        <VStack spacing={6} textAlign="center">
          <Box
            p={6}
            borderRadius="full"
            bg="red.50"
            color="red.500"
            fontSize="4xl"
          >
            <FaLock />
          </Box>
          <Heading size="lg" color="gray.700">
            Akses Ditolak
          </Heading>
          <Text color="gray.600" fontSize="lg">
            Anda tidak memiliki role/izin untuk mengakses halaman tersebut.
            Silakan hubungi administrator jika Anda membutuhkan akses.
          </Text>
          <Button
            leftIcon={<FaArrowLeft />}
            colorScheme="blue"
            size="lg"
            onClick={handleKembali}
          >
            Kembali ke Halaman Sebelumnya
          </Button>
        </VStack>
      </Container>
    </Box>
  );
}

export default Unauthorized;
