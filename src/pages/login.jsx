import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory, Link } from "react-router-dom";
import {
  Box,
  Center,
  Text,
  Button,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  IconButton,
  VStack,
  Image,
  Flex,
  useToast,
  Alert,
  AlertIcon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Heading,
  Badge,
} from "@chakra-ui/react";
import { keyframes, css } from "@emotion/react";
import { FaEye, FaEyeSlash, FaUser, FaLock, FaArrowLeft } from "react-icons/fa";
import { login } from "../Redux/Reducers/auth";
import { selectIsAuthenticated, selectRole } from "../Redux/Reducers/auth";
import LogoKPBPN from "../assets/Logo-KPBPN-putih.png";
import FotoTanki from "../assets/fototanki.jpg";

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const fadeInAnimation = css`
  animation: ${fadeIn} 0.8s ease-out both;
`;

const fadeInDelay = css`
  animation: ${fadeIn} 0.8s ease-out 0.15s both;
`;

const inputFocusStyles = {
  borderColor: "kpbpn",
  boxShadow: "0 0 0 1px var(--chakra-colors-kpbpn)",
};

const Login = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const isAuthenticated =
    useSelector(selectIsAuthenticated) || localStorage.getItem("token");
  const roles = useSelector(selectRole);
  const toast = useToast();
  const {
    isOpen: isErrorModalOpen,
    onOpen: onErrorModalOpen,
    onClose: onErrorModalClose,
  } = useDisclosure();

  const [namaPengguna, setNamaPengguna] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!namaPengguna || !password) {
      const msg = "Akun pengguna dan password harus diisi.";
      setError(msg);
      toast({
        title: "Peringatan",
        description: msg,
        status: "warning",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
      return;
    }

    setIsLoading(true);

    try {
      await dispatch(login(namaPengguna, password));
      await new Promise((resolve) => setTimeout(resolve, 100));

      setError("");
      setNamaPengguna("");
      setPassword("");

      toast({
        title: "Login Berhasil",
        description: "Anda berhasil masuk ke sistem KPBPN.",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
      history.push("/");
    } catch (err) {
      console.error("Login error:", err);

      const errorMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Akun pengguna atau password salah!";

      setError(errorMsg);
      setErrorMessage(errorMsg);
      onErrorModalOpen();

      toast({
        title: "Login Gagal",
        description: errorMsg,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthenticated) {
    const currentRoles = roles || JSON.parse(localStorage.getItem("role"));

    if (
      Array.isArray(currentRoles) &&
      currentRoles.length === 1 &&
      (currentRoles[0].roleKPBPNId === 9 || currentRoles[0].id === 9)
    ) {
      history.push("/pegawai/dashboard");
    } else if (
      Array.isArray(currentRoles) &&
      currentRoles.length === 1 &&
      (currentRoles[0].roleKPBPNId === 10 || currentRoles[0].id === 10)
    ) {
      history.push("/aset/dashboard");
    } else {
      history.push("/");
    }
  }

  return (
    <Flex minH="100svh" position="relative" overflow="hidden">
      {/* Panel kiri — branding */}
      <Box
        display={{ base: "none", lg: "flex" }}
        w="50%"
        position="relative"
        alignItems="center"
        justifyContent="center"
        overflow="hidden"
      >
        <Image
          position="absolute"
          inset={0}
          h="100%"
          w="100%"
          objectFit="cover"
          src={FotoTanki}
          alt="Operasional KPBPN"
        />
        <Box
          position="absolute"
          inset={0}
          bgGradient="linear(to-br, rgba(89, 35, 6, 0.9) 0%, rgba(38, 38, 38, 0.85) 60%, rgba(0, 0, 0, 0.8) 100%)"
        />
        <Box
          position="absolute"
          inset={0}
          opacity={0.08}
          backgroundImage="radial-gradient(circle at 2px 2px, white 1px, transparent 0)"
          backgroundSize="36px 36px"
        />

        <VStack
          position="relative"
          zIndex={2}
          spacing={6}
          px={12}
          textAlign="center"
          maxW="520px"
          css={fadeInAnimation}
        >
          <Image
            src={LogoKPBPN}
            alt="Logo KPBPN"
            maxW="200px"
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
          >
            Sistem Informasi Koperasi
          </Badge>
          <Heading
            color="white"
            fontSize="3xl"
            fontWeight={800}
            lineHeight="1.2"
            textShadow="0 4px 16px rgba(0,0,0,0.4)"
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
          <Text color="whiteAlpha.800" fontSize="md" lineHeight="1.8">
            Kelola mitra, pengiriman, dan pengisian tanki dalam satu platform
            terintegrasi.
          </Text>
        </VStack>
      </Box>

      {/* Panel kanan — form */}
      <Center
        flex={1}
        w={{ base: "100%", lg: "50%" }}
        minH="100svh"
        position="relative"
        bg={{ base: "gray.50", lg: "white" }}
        p={{ base: 4, md: 8 }}
      >
        {/* Background mobile */}
        <Box
          display={{ base: "block", lg: "none" }}
          position="absolute"
          inset={0}
        >
          <Image h="100%" w="100%" objectFit="cover" src={FotoTanki} alt="" />
          <Box
            position="absolute"
            inset={0}
            bgGradient="linear(to-b, rgba(89, 35, 6, 0.75), rgba(38, 38, 38, 0.9))"
          />
        </Box>

        <Box
          w="100%"
          maxW="440px"
          position="relative"
          zIndex={2}
          css={fadeInDelay}
        >
          <Button
            as={Link}
            to="/"
            variant="ghost"
            size="sm"
            leftIcon={<FaArrowLeft />}
            color={{ base: "whiteAlpha.900", lg: "gray.600" }}
            mb={4}
            _hover={{ bg: { base: "whiteAlpha.200", lg: "gray.100" } }}
          >
            Kembali ke Beranda
          </Button>

          <Box
            bg="white"
            borderRadius="2xl"
            boxShadow="2xl"
            p={{ base: 6, md: 8 }}
            border="1px solid"
            borderColor="gray.100"
            position="relative"
            overflow="hidden"
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
            <VStack spacing={6} align="stretch">
              {/* Header — tampil di mobile saja */}
              <VStack spacing={3} display={{ base: "flex", lg: "none" }}>
                <Image src={LogoKPBPN} alt="Logo KPBPN" maxW="120px" />
                <Badge colorScheme="orange" borderRadius="full" px={3}>
                  Login KPBPN
                </Badge>
              </VStack>

              <VStack spacing={1} align={{ base: "center", lg: "start" }}>
                <Heading
                  as="h1"
                  size="lg"
                  color="gelap"
                  fontWeight={800}
                  textAlign={{ base: "center", lg: "left" }}
                >
                  Selamat Datang
                </Heading>
                <Text
                  color="gray.500"
                  fontSize="sm"
                  textAlign={{ base: "center", lg: "left" }}
                >
                  Masuk ke akun Anda untuk mengakses sistem KPBPN
                </Text>
              </VStack>

              <Box as="form" onSubmit={handleSubmit}>
                <VStack spacing={5} align="stretch">
                  <FormControl isRequired>
                    <FormLabel
                      fontSize="sm"
                      fontWeight={600}
                      color="gray.700"
                      display="flex"
                      alignItems="center"
                      gap={2}
                    >
                      <FaUser size="13px" />
                      Akun Pengguna
                    </FormLabel>
                    <Input
                      value={namaPengguna}
                      onChange={(e) => setNamaPengguna(e.target.value)}
                      h="48px"
                      placeholder="Masukkan akun pengguna"
                      borderRadius="xl"
                      borderColor="gray.200"
                      _hover={{ borderColor: "orange.300" }}
                      _focus={inputFocusStyles}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel
                      fontSize="sm"
                      fontWeight={600}
                      color="gray.700"
                      display="flex"
                      alignItems="center"
                      gap={2}
                    >
                      <FaLock size="13px" />
                      Password
                    </FormLabel>
                    <InputGroup>
                      <Input
                        placeholder="Masukkan password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        h="48px"
                        type={showPassword ? "text" : "password"}
                        pr="48px"
                        borderRadius="xl"
                        borderColor="gray.200"
                        _hover={{ borderColor: "orange.300" }}
                        _focus={inputFocusStyles}
                      />
                      <InputRightElement h="48px" w="48px">
                        <IconButton
                          aria-label={
                            showPassword
                              ? "Sembunyikan password"
                              : "Tampilkan password"
                          }
                          icon={showPassword ? <FaEyeSlash /> : <FaEye />}
                          onClick={() => setShowPassword(!showPassword)}
                          variant="ghost"
                          size="sm"
                          color="gray.400"
                          _hover={{ color: "kpbpn", bg: "orange.50" }}
                        />
                      </InputRightElement>
                    </InputGroup>
                  </FormControl>

                  {error && (
                    <Alert
                      status="error"
                      borderRadius="xl"
                      variant="left-accent"
                      fontSize="sm"
                    >
                      <AlertIcon />
                      {error}
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    w="100%"
                    colorScheme="orange"
                    size="lg"
                    h="48px"
                    fontWeight={700}
                    borderRadius="xl"
                    isLoading={isLoading}
                    loadingText="Memproses..."
                    isDisabled={isLoading}
                    _hover={{ transform: "translateY(-2px)", boxShadow: "lg" }}
                    transition="all 0.25s"
                  >
                    Masuk ke Sistem
                  </Button>
                </VStack>
              </Box>

              <Text fontSize="xs" color="gray.400" textAlign="center" pt={1}>
                © {new Date().getFullYear()} Koperasi Produsen Batanghari Patra
                Nusantara
              </Text>
            </VStack>
          </Box>
        </Box>
      </Center>

      {/* Modal error */}
      <Modal
        isOpen={isErrorModalOpen}
        onClose={onErrorModalClose}
        isCentered
        size="md"
      >
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
        <ModalContent borderRadius="2xl" overflow="hidden">
          <ModalHeader
            color="red.600"
            fontSize="lg"
            fontWeight={700}
            bg="red.50"
            borderBottom="1px solid"
            borderColor="red.100"
          >
            Login Gagal
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody py={6}>
            <Alert
              status="error"
              borderRadius="xl"
              mb={4}
              variant="left-accent"
            >
              <AlertIcon />
              <Text fontSize="sm" fontWeight={600}>
                {errorMessage ||
                  "Terjadi kesalahan saat melakukan login. Silakan coba lagi."}
              </Text>
            </Alert>
            <Text fontSize="sm" color="gray.600" lineHeight="1.7">
              Pastikan akun pengguna dan password sudah benar. Jika masalah
              berlanjut, hubungi administrator sistem.
            </Text>
          </ModalBody>
          <ModalFooter borderTop="1px solid" borderColor="gray.100">
            <Button
              colorScheme="red"
              onClick={onErrorModalClose}
              w="100%"
              borderRadius="xl"
              fontWeight={600}
              _hover={{ transform: "translateY(-1px)" }}
            >
              Tutup
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  );
};

export default Login;
