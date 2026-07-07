import React, { useState, useEffect } from "react";
import axios from "axios";
import Layout from "../Componets/Layout";
import { useDisclosure } from "@chakra-ui/react";
import Foto from "../assets/add_photo.png";
import {
  Box,
  Text,
  Button,
  Modal,
  ModalOverlay,
  Heading,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  Image,
  ModalCloseButton,
  Container,
  FormControl,
  FormLabel,
  HStack,
  Table,
  Tbody,
  Tr,
  Th,
  Td,
  Flex,
  Input,
  FormHelperText,
  VStack,
  Icon,
  InputGroup,
  InputRightElement,
  IconButton,
  useToast,
} from "@chakra-ui/react";
import { FaEye, FaEyeSlash, FaLock } from "react-icons/fa";
import { useSelector } from "react-redux";
import { userRedux } from "../Redux/Reducers/auth";

function Profile() {
  const user = useSelector(userRedux);
  const toast = useToast();
  const [dataProfile, setDataProfile] = useState(null);

  const {
    isOpen: isOpenGantiPassword,
    onOpen: onOpenGantiPassword,
    onClose: onCloseGantiPassword,
  } = useDisclosure();
  const [passwordLama, setPasswordLama] = useState("");
  const [passwordBaru, setPasswordBaru] = useState("");
  const [showPasswordLama, setShowPasswordLama] = useState(false);
  const [showPasswordBaru, setShowPasswordBaru] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const token = localStorage.getItem("token");

  async function fetchProfile() {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_REACT_APP_API_BASE_URL}/user-kpbpn/profile/${user.id}`,
      );
      setDataProfile(res.data.result);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    if (user?.id) {
      fetchProfile();
    }
  }, [user?.id]);
  const handleChangePassword = async () => {
    // Validasi
    if (!passwordLama || !passwordBaru) {
      toast({
        title: "Error",
        description: "Password lama dan password baru harus diisi",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (passwordBaru.length < 6) {
      toast({
        title: "Error",
        description: "Password baru minimal 6 karakter",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_REACT_APP_API_BASE_URL}/user-kpbpn/change-password`,
        {
          passwordLama,
          passwordBaru,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      toast({
        title: "Berhasil",
        description: res.data.message || "Password berhasil diubah",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // Reset form dan tutup modal
      setPasswordLama("");
      setPasswordBaru("");
      onCloseGantiPassword();
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        "Gagal mengubah password. Silakan coba lagi.";
      toast({
        title: "Error",
        description: errorMessage,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <Box bgColor={"secondary"} pb={"40px"} px={"30px"}>
        <Container
          border={"1px"}
          borderRadius={"6px"}
          borderColor={"rgba(229, 231, 235, 1)"}
          maxW={"1280px"}
          bgColor={"white"}
          pt={"30px"}
          ps={"0px"}
        >
          <Box p={"30px"}>
            {dataProfile ? (
              <>
                <Flex justify="space-between" align="center" mb={"30px"}>
                  <Heading size="lg">Profil Pengguna</Heading>
                </Flex>

                <Box mb={"30px"}>
                  <Heading size="md" mb={"15px"}>
                    Foto Profile
                  </Heading>
                  <Box
                    border={"1px"}
                    borderColor={"rgba(229, 231, 235, 1)"}
                    borderRadius={"6px"}
                    p={"20px"}
                  >
                    <Flex align="center" gap={6}>
                      <Image
                        src={Foto}
                        alt="Foto Profile"
                        boxSize="150px"
                        borderRadius="full"
                        objectFit="cover"
                        border="4px solid"
                        borderColor="blue.200"
                      />
                      <VStack align="start" spacing={2}>
                        <Text fontSize="md" fontWeight="medium">
                          {dataProfile.nama}
                        </Text>
                        <Text fontSize="sm" color="gray.500">
                          {dataProfile.namaPengguna}
                        </Text>
                      </VStack>
                    </Flex>
                  </Box>
                </Box>

                <Box mb={"30px"}>
                  <Heading size="md" mb={"15px"}>
                    Informasi Dasar
                  </Heading>
                  <Box
                    border={"1px"}
                    borderColor={"rgba(229, 231, 235, 1)"}
                    borderRadius={"6px"}
                    p={"20px"}
                  >
                    <Table variant="simple">
                      <Tbody>
                        <Tr>
                          <Th width={"30%"}>Nama</Th>
                          <Td>{dataProfile.nama}</Td>
                        </Tr>
                        <Tr>
                          <Th>Nama Pengguna</Th>
                          <Td>{dataProfile.namaPengguna}</Td>
                        </Tr>
                      </Tbody>
                    </Table>
                  </Box>
                </Box>

                <Box mb={"30px"}>
                  <HStack justify="space-between" mb={"15px"}>
                    <Heading size="md">Informasi User</Heading>
                    <Button
                      colorScheme="blue"
                      leftIcon={<Icon as={FaLock} />}
                      onClick={onOpenGantiPassword}
                    >
                      Ganti Password
                    </Button>
                  </HStack>
                  <Box
                    border={"1px"}
                    borderColor={"rgba(229, 231, 235, 1)"}
                    borderRadius={"6px"}
                    p={"20px"}
                  >
                    <Table variant="simple">
                      <Tbody>
                        <Tr>
                          <Th width={"30%"}>Nama Pengguna</Th>
                          <Td>{dataProfile.namaPengguna}</Td>
                        </Tr>
                        <Tr>
                          <Th>Roles</Th>
                          <Td>
                            {dataProfile.userRoleKPBPNs?.length > 0 ? (
                              dataProfile.userRoleKPBPNs.map((userRole) => (
                                <Text
                                  key={userRole.id}
                                  as="span"
                                  mr={"10px"}
                                  px={"10px"}
                                  py={"5px"}
                                  bgColor={"blue.100"}
                                  borderRadius={"4px"}
                                  display={"inline-block"}
                                  mb={"5px"}
                                >
                                  {userRole.roleKPBPN?.name || "-"}
                                </Text>
                              ))
                            ) : (
                              "-"
                            )}
                          </Td>
                        </Tr>
                      </Tbody>
                    </Table>
                  </Box>
                </Box>
              </>
            ) : (
              <Text>Memuat data profil...</Text>
            )}
          </Box>
        </Container>
      </Box>

      {/* Modal Ganti Password */}
      <Modal
        isOpen={isOpenGantiPassword}
        onClose={onCloseGantiPassword}
        size="md"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Ganti Password</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel display="flex" alignItems="center" gap={2}>
                  <Icon as={FaLock} />
                  Password Lama
                </FormLabel>
                <InputGroup>
                  <Input
                    type={showPasswordLama ? "text" : "password"}
                    placeholder="Masukkan password lama"
                    value={passwordLama}
                    onChange={(e) => setPasswordLama(e.target.value)}
                    pr="50px"
                  />
                  <InputRightElement width="50px">
                    <IconButton
                      aria-label={
                        showPasswordLama
                          ? "Sembunyikan password"
                          : "Tampilkan password"
                      }
                      icon={showPasswordLama ? <FaEyeSlash /> : <FaEye />}
                      onClick={() => setShowPasswordLama(!showPasswordLama)}
                      variant="ghost"
                      size="sm"
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              <FormControl>
                <FormLabel display="flex" alignItems="center" gap={2}>
                  <Icon as={FaLock} />
                  Password Baru
                </FormLabel>
                <InputGroup>
                  <Input
                    type={showPasswordBaru ? "text" : "password"}
                    placeholder="Masukkan password baru (min. 6 karakter)"
                    value={passwordBaru}
                    onChange={(e) => setPasswordBaru(e.target.value)}
                    pr="50px"
                  />
                  <InputRightElement width="50px">
                    <IconButton
                      aria-label={
                        showPasswordBaru
                          ? "Sembunyikan password"
                          : "Tampilkan password"
                      }
                      icon={showPasswordBaru ? <FaEyeSlash /> : <FaEye />}
                      onClick={() => setShowPasswordBaru(!showPasswordBaru)}
                      variant="ghost"
                      size="sm"
                    />
                  </InputRightElement>
                </InputGroup>
                <FormHelperText>
                  Password baru minimal 6 karakter
                </FormHelperText>
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={onCloseGantiPassword}
              isDisabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleChangePassword}
              isLoading={isSubmitting}
              loadingText="Mengubah..."
            >
              Ubah Password
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

    </Layout>
  );
}

export default Profile;
