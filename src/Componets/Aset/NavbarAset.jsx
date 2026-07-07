import React, { useState, useEffect } from "react";
import {
  Box,
  Text,
  HStack,
  Image,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  Flex,
  Avatar,
  VStack,
  useColorMode,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverArrow,
  Spacer,
  IconButton,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerCloseButton,
  Icon,
  Badge,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  SimpleGrid,
} from "@chakra-ui/react";
import { FaRoute, FaBars, FaSignOutAlt, FaMoon, FaSun } from "react-icons/fa";
import { Link, useHistory, useLocation } from "react-router-dom";
import { BiWallet } from "react-icons/bi";
import { BsHouseDoor, BsStar, BsEnvelope } from "react-icons/bs";
import { BsCart4 } from "react-icons/bs";
import { useSelector, useDispatch } from "react-redux";
import { GoShieldLock } from "react-icons/go";
import { BiCar } from "react-icons/bi";
import LogoPena from "../../assets/penaLogo.png";
import LogoAset from "../../assets/asetLogo.png";
import LogoPegawai from "../../assets/pegawaiLogo.png";
import LogoPerencanaan from "../../assets/perencanaanLogo.png";
import {
  selectIsAuthenticated,
  userRedux,
  selectRole,
  performLogout,
} from "../../Redux/Reducers/auth";
import Logo from "../../assets/logo.png";
import { HiOutlineUsers } from "react-icons/hi2";
import { io } from "socket.io-client";
import { useColorModeValues } from "../../Style/colorModeValues";
import LogoUtama from "../../assets/logo JDB.png";

// Data menu untuk mapping
const menuData = [
  {
    title: "Barang & Jasa",
    icon: GoShieldLock,
    pathPrefix: "/barjas",
    items: [
      { label: "Daftar Surat Pesanan", path: "/barjas/daftar-dokumen-sp" },
      { label: "Pengaturan Dokumen Barjas", path: "/barjas/jenis-dokumen" },
      { label: "Pengaturan SP", path: "/barjas/nomor-sp" },
    ],
  },
  {
    title: "Administrator",
    icon: GoShieldLock,
    pathPrefix: "/sijaka",
    items: [
      { label: "Daftar Kendaraan", path: "/sijaka/daftar-kendaraan" },
      // { label: "Surat Pengantar", path: "/sijaka/daftar-kendaraan" },
      { label: "template Surat", path: "/sijaka/template" },
      { label: "Pengaturan", path: "/barjas/pengaturan" },
    ],
  },
  {
    title: "Persediaan",
    icon: BsCart4,
    pathPrefix: "/aset",
    items: [
      { label: "Daftar Persediaan", path: "/aset/daftar-persediaan" },
      { label: "Tracking Persediaan", path: "/aset/tracking-persediaan" },
      { label: "Mutasi Persediaan", path: "/aset/mutasi-persediaan" },
      { label: "Laporan Persediaan", path: "/aset/laporan-persediaan" },
      { label: "Surat Pesanan", path: "/aset/surat-pesanan" },
    ],
  },

  {
    title: "Pengeluaran",
    icon: BsCart4,
    pathPrefix: "/pengeluaran",
    items: [
      { label: "Daftar Pengeluaran", path: "/pengeluaran/daftar-pengeluaran" },
      { label: "Dashboard Pengeluaran", path: "/pengeluaran/dashboard" },
    ],
  },

  {
    title: "Kendaraan",
    icon: BiCar,
    pathPrefix: "/kendaraan",
    items: [{ label: "Kendaraan Dinas", path: "/kendaraan/unit-kerja" }],
  },
];

function NavbarAset() {
  const isAuthenticated =
    useSelector(selectIsAuthenticated) || localStorage.getItem("token");
  const user = useSelector(userRedux);
  const role = useSelector(selectRole);
  const { colorMode, toggleColorMode } = useColorMode();
  const history = useHistory();
  const location = useLocation();
  const dispatch = useDispatch();
  const [jumlahNotifikasi, setJumlahNotifikasi] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [accordionIndex, setAccordionIndex] = useState(-1);

  // Color mode values untuk mobile drawer (dari Style folder)
  const {
    drawerBg,
    boxBg,
    textColor,
    textColorLight,
    borderColor,
    borderColorLight,
    borderColorDark,
    hoverBg,
    hoverBgWhite,
    accordionPanelBg,
    footerBoxShadow,
  } = useColorModeValues();

  const handleLogout = () => {
    dispatch(performLogout());
    setIsDrawerOpen(false);
  };

  // Inisialisasi Socket.io dan listener notifikasi
  useEffect(() => {
    if (!isAuthenticated) return;

    // Gunakan environment variable untuk URL socket.io
    const socketUrl = import.meta.env.VITE_REACT_APP_API_BASE_URL;

    // Validasi: Pastikan environment variable sudah diset (penting untuk produksi)
    if (!socketUrl) {
      console.error(
        "⚠️ VITE_REACT_APP_API_BASE_URL tidak diset! Socket.io tidak dapat terhubung.",
      );
      return; // Jangan inisialisasi socket jika URL tidak ada
    }

    // Peringatan jika masih menggunakan localhost di produksi
    if (socketUrl.includes("localhost") && import.meta.env.PROD) {
      console.warn(
        "⚠️ PERINGATAN: Menggunakan localhost di produksi! Pastikan environment variable sudah diset dengan benar.",
      );
    }

    const socket = io(socketUrl, {
      transports: ["websocket"],
    });

    // Listener untuk notifikasi baru
    const handleNotifikasi = (data) => {
      console.log("📡 Notifikasi baru diterima di React:", data);
      if (data.count !== undefined) {
        console.log("🧠 Update state jumlahNotifikasi ke:", data.count);
        setJumlahNotifikasi(data.count);
      }
    };

    socket.on("notifikasi:terbaru", handleNotifikasi);

    // Connect event
    socket.on("connect", () => {
      console.log("✅ Socket.io connected:", socket.id);
    });

    // Disconnect event
    socket.on("disconnect", () => {
      console.log("❌ Socket.io disconnected");
    });

    // Cleanup
    return () => {
      socket.off("notifikasi:terbaru", handleNotifikasi);
      socket.off("connect");
      socket.off("disconnect");
      socket.disconnect();
    };
  }, [isAuthenticated]);

  // Fungsi untuk mengecek apakah menu sedang aktif
  const isMenuActive = (menu) => {
    if (!menu.pathPrefix) return false;
    return location.pathname.startsWith(menu.pathPrefix);
  };

  // Fungsi untuk mengecek apakah item menu sedang aktif
  const isItemActive = (itemPath) => {
    return location.pathname === itemPath;
  };

  // Komponen untuk menu item
  const MenuItemComponent = ({ item, onItemClick }) => {
    if (!item || !item.path || !item.label) {
      return null;
    }

    const isActive = isItemActive(item.path);

    return (
      <Link to={item.path} onClick={onItemClick}>
        <Box
          px={4}
          py={3}
          borderRadius="xl"
          bg={isActive ? "aset" : "transparent"}
          color={isActive ? "white" : "gray.700"}
          fontWeight={isActive ? "700" : "600"}
          fontSize="14px"
          position="relative"
          overflow="hidden"
          _hover={{
            bg: isActive ? "rgba(0, 100, 180, 1)" : "gray.50",
            transform: "translateX(6px)",
            boxShadow: isActive
              ? "0 4px 12px rgba(0, 125, 226, 0.3)"
              : "0 2px 8px rgba(0, 0, 0, 0.08)",
            _before: {
              content: '""',
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: "4px",
              bg: isActive ? "white" : "aset",
              borderRadius: "0 4px 4px 0",
            },
          }}
          transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
          borderLeft={isActive ? "4px solid" : "4px solid transparent"}
          borderColor={isActive ? "white" : "transparent"}
          mx={1}
        >
          {item.label}
        </Box>
      </Link>
    );
  };

  // Komponen untuk menu dropdown
  const MenuDropdown = ({ menu }) => {
    if (!menu || !menu.title || !menu.items || !Array.isArray(menu.items)) {
      return null;
    }

    const IconComponent = menu.icon;
    const isActive = isMenuActive(menu);

    // State untuk hover dan klik
    const [isOpen, setIsOpen] = useState(false);
    const [isClicked, setIsClicked] = useState(false);

    // Handler untuk toggle saat diklik
    const handleClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const newState = !isOpen;
      setIsOpen(newState);
      setIsClicked(newState);
    };

    // Handler untuk mouse enter (hover)
    const handleMouseEnter = () => {
      setIsOpen(true);
    };

    // Handler untuk mouse leave (hanya tutup jika tidak diklik)
    const handleMouseLeave = () => {
      if (!isClicked) {
        setIsOpen(false);
      }
    };

    // Handler untuk menutup saat klik di luar
    const handleClose = () => {
      setIsOpen(false);
      setIsClicked(false);
    };

    // Handler untuk menutup saat item menu diklik
    const handleItemClick = () => {
      // Tidak menutup submenu saat item diklik, biarkan user navigasi
      // Submenu akan menutup otomatis saat klik di luar (closeOnBlur)
    };

    return (
      <Popover
        placement="bottom"
        isOpen={isOpen}
        onClose={handleClose}
        closeOnBlur={true}
      >
        <PopoverTrigger>
          <Button
            variant="ghost"
            leftIcon={<IconComponent />}
            position="relative"
            color={isActive ? "aset" : "gray.700"}
            fontWeight={isActive ? "600" : "500"}
            fontSize="14px"
            px={4}
            py={2}
            bg="transparent"
            _hover={{
              bg: "gray.50",
              color: "aset",
            }}
            _active={{
              bg: "gray.100",
            }}
            transition="all 0.2s ease"
            borderBottom={isActive ? "2px solid" : "2px solid transparent"}
            borderColor={isActive ? "aset" : "transparent"}
            borderRadius="0"
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {menu.title}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          mt={3}
          boxShadow="0 20px 60px rgba(0, 0, 0, 0.15), 0 8px 24px rgba(0, 0, 0, 0.1)"
          borderRadius="2xl"
          border="1px solid"
          borderColor="gray.200"
          bg="white"
          backdropFilter="blur(20px)"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          overflow="hidden"
          _before={{
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "3px",
            bgGradient: "linear(to-r, aset, rgba(0, 100, 180, 1))",
          }}
        >
          <PopoverArrow
            bg="white"
            borderColor="gray.200"
            borderWidth="1px"
            borderTop="none"
            borderLeft="none"
          />
          <PopoverBody p={2}>
            <VStack spacing={0.5} align="stretch">
              {menu.items.map((item, index) => (
                <MenuItemComponent
                  key={index}
                  item={item}
                  onItemClick={handleItemClick}
                />
              ))}
            </VStack>
          </PopoverBody>
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <>
      {/* Main Navbar */}
      <Box position="fixed" top={0} left={0} right={0} zIndex={999}>
        {/* Header dengan Background Putih */}
        <Box
          bg="white"
          px={{ base: 4, md: 6, lg: 8 }}
          py={4}
          minH="70px"
          boxShadow="0 2px 8px rgba(0, 0, 0, 0.08)"
          position="relative"
          borderBottom="1px solid"
          borderColor="gray.200"
        >
          {/* Container untuk konten navbar */}
          <Flex
            w="100%"
            px={{ base: 4, md: 6, lg: 8 }}
            justifyContent="space-between"
            alignItems="center"
            gap={4}
            flexWrap="nowrap"
            position="relative"
          >
            {/* Left Section: Logo */}
            <Flex
              gap={3}
              alignItems="center"
              flexShrink={0}
              position="relative"
              zIndex={1}
            >
              {/* Logo dan Brand */}
              <Flex gap={3} alignItems="center" flexShrink={0}>
                {/* <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  flexShrink={0}
                  h="32px"
                >
                  <Image height="100%" src={LogoAset} alt="Logo Pena" />
                </Box> */}
                <Box
                  h="48px"
                  borderRadius="md"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  flexShrink={0}
                  p={2}
                >
                  <Image
                    height="100%"
                    src={LogoUtama}
                    alt="Logo Dinas Kesehatan"
                  />
                </Box>
                {/* <Box display={{ base: "none", sm: "block" }}>
                  <Text
                    color="gray.800"
                    fontSize={{ base: "16px", md: "18px" }}
                    fontWeight={700}
                    letterSpacing="0.2px"
                  >
                    Dinas Kesehatan
                  </Text>
                  <Text
                    color="gray.600"
                    fontSize={{ base: "12px", md: "13px" }}
                    fontWeight={400}
                    letterSpacing="0.1px"
                    mt={0.5}
                  >
                    Kabupaten Paser
                  </Text>
                </Box> */}
              </Flex>
            </Flex>

            {/* Center Section: Menu Navigation - Hidden on mobile, positioned absolutely in center */}
            <Box
              display={{ base: "none", lg: "block" }}
              position="absolute"
              left="50%"
              transform="translateX(-50%)"
              zIndex={1}
            >
              <HStack spacing={1} justifyContent="center">
                {menuData.map((menu, index) => (
                  <MenuDropdown key={index} menu={menu} />
                ))}
              </HStack>
            </Box>

            {/* Right Section: User Menu (Desktop) dan Hamburger (Mobile) */}
            <HStack
              spacing={3}
              flexShrink={0}
              position="relative"
              zIndex={1}
              ml="auto"
            >
              {/* Color Mode Toggle - Hidden on mobile */}
              <IconButton
                display={{ base: "none", lg: "flex" }}
                onClick={toggleColorMode}
                aria-label="Toggle color mode"
                icon={<Icon as={colorMode === "light" ? FaMoon : FaSun} />}
                size="md"
                variant="ghost"
                color="gray.700"
                borderRadius="md"
                _hover={{
                  bg: "gray.100",
                  color: "aset",
                }}
                transition="all 0.2s ease"
              />

              {/* User Menu - Hidden on mobile, shown on desktop */}
              {isAuthenticated ? (
                <>
                  <Menu>
                    <MenuButton
                      as={Button}
                      variant="ghost"
                      size="md"
                      display={{ base: "none", lg: "flex" }}
                      px={2}
                      py={1}
                      _hover={{
                        bg: "transparent",
                      }}
                      _active={{
                        bg: "transparent",
                      }}
                    >
                      <HStack spacing={3}>
                        <VStack spacing={0} align="flex-end" mr={2}>
                          <Text
                            color="gray.800"
                            fontSize="14px"
                            fontWeight="600"
                            lineHeight="1.2"
                          >
                            {user[0]?.nama || "admin dinkes"}
                          </Text>
                          <Text
                            color="gray.600"
                            fontSize="12px"
                            fontWeight="400"
                            lineHeight="1.2"
                          >
                            Administrator
                          </Text>
                        </VStack>
                        <Avatar
                          size="sm"
                          name={user[0]?.nama || "AD"}
                          bg="aset"
                          color="white"
                          border="none"
                        />
                      </HStack>
                    </MenuButton>
                    <MenuList
                      boxShadow="0 20px 60px rgba(0, 0, 0, 0.15), 0 8px 24px rgba(0, 0, 0, 0.1)"
                      borderRadius="2xl"
                      border="1px solid"
                      borderColor="gray.200"
                      mt={3}
                      overflow="hidden"
                      _before={{
                        content: '""',
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: "3px",
                        bgGradient: "linear(to-r, aset, rgba(0, 100, 180, 1))",
                      }}
                    >
                      <Link to={"/profile"}>
                        <MenuItem
                          icon={<Avatar size="xs" name={user[0]?.nama} />}
                          _hover={{
                            bg: "gray.50",
                            transform: "translateX(4px)",
                            transition: "all 0.2s ease",
                          }}
                          borderRadius="lg"
                          transition="all 0.2s ease"
                        >
                          Profile
                        </MenuItem>
                      </Link>
                      <Link to={"/"}>
                        <MenuItem
                          icon={<Image h={"20px"} src={LogoPena} />}
                          _hover={{
                            bg: "gray.50",
                            transform: "translateX(4px)",
                            transition: "all 0.2s ease",
                          }}
                          borderRadius="lg"
                          transition="all 0.2s ease"
                        >
                          Pena
                        </MenuItem>
                      </Link>
                      <Link to={"/aset/dashboard"}>
                        <MenuItem
                          icon={<Image h={"20px"} src={LogoAset} />}
                          _hover={{
                            bg: "gray.50",
                            transform: "translateX(4px)",
                            transition: "all 0.2s ease",
                          }}
                          borderRadius="lg"
                          transition="all 0.2s ease"
                        >
                          Aset
                        </MenuItem>
                      </Link>
                      <Link to={"/pegawai/dashboard"}>
                        <MenuItem
                          icon={<Image h={"20px"} src={LogoPegawai} />}
                          _hover={{
                            bg: "gray.50",
                            transform: "translateX(4px)",
                            transition: "all 0.2s ease",
                          }}
                          borderRadius="lg"
                          transition="all 0.2s ease"
                        >
                          Kepegawaian
                        </MenuItem>
                      </Link>
                      <Link to={"/perencanaan"}>
                        <MenuItem
                          icon={<Image h={"20px"} src={LogoPerencanaan} />}
                          _hover={{
                            bg: "gray.50",
                            transform: "translateX(4px)",
                            transition: "all 0.2s ease",
                          }}
                          borderRadius="lg"
                          transition="all 0.2s ease"
                        >
                          Perencanaan
                        </MenuItem>
                      </Link>
                      <Box px={2} py={1}>
                        <Box
                          as="hr"
                          borderColor="gray.200"
                          borderWidth="1px"
                          my={1}
                        />
                      </Box>
                      <MenuItem
                        icon={<Icon as={FaSignOutAlt} />}
                        _hover={{
                          bg: "red.50",
                          color: "red.600",
                          transform: "translateX(4px)",
                          transition: "all 0.2s ease",
                        }}
                        onClick={handleLogout}
                        color="red.500"
                        fontWeight="700"
                        borderRadius="lg"
                        transition="all 0.2s ease"
                      >
                        Keluar
                      </MenuItem>
                    </MenuList>
                  </Menu>
                </>
              ) : (
                <Link to="/login">
                  <Button
                    variant={"primary"}
                    size="sm"
                    display={{ base: "none", lg: "flex" }}
                    _hover={{
                      transform: "translateY(-2px)",
                      boxShadow: "lg",
                    }}
                    transition="all 0.2s ease"
                  >
                    Login
                  </Button>
                </Link>
              )}

              {/* Hamburger Menu Button - Visible on mobile, positioned on right */}
              <IconButton
                display={{ base: "flex", lg: "none" }}
                aria-label="Open menu"
                icon={<FaBars />}
                size="md"
                variant="ghost"
                color="black"
                onClick={() => setIsDrawerOpen(true)}
                _hover={{
                  bg: "gray.100",
                  color: "black",
                  transform: "scale(1.1)",
                }}
                transition="all 0.2s ease"
              />
            </HStack>
          </Flex>
        </Box>
      </Box>
      {/* Mobile Drawer Menu */}
      <Drawer
        isOpen={isDrawerOpen}
        placement="left"
        onClose={() => setIsDrawerOpen(false)}
        size="xs"
      >
        <DrawerOverlay />
        <DrawerContent bg={boxBg}>
          <DrawerCloseButton color="white" />
          <DrawerHeader
            bgGradient="linear(to-r, aset, rgba(0, 100, 180, 1))"
            color="white"
            borderBottom="1px solid"
            borderColor="rgba(0,0,0,0.1)"
          >
            {/* <Flex gap={3} alignItems="center">
              <Image height="32px" src={LogoAset} alt="Logo Pena" />
              <Image height="32px" src={Logo} alt="Logo Dinkes" />
              <Box>
                <Text fontSize="14px" fontWeight={700}>
                  Dinas Kesehatan
                </Text>
                <Text fontSize="12px" opacity={0.9}>
                  Kabupaten Paser
                </Text>
              </Box>
            </Flex> */}
          </DrawerHeader>

          <DrawerBody
            p={0}
            bg={drawerBg}
            display="flex"
            flexDirection="column"
            maxH="calc(100vh - 60px)"
            overflow="hidden"
          >
            {/* User Profile Section - Mobile Only */}
            {isAuthenticated ? (
              <>
                <Box
                  bgGradient="linear(to-r, aset, rgba(0, 100, 180, 1))"
                  color="white"
                  p={5}
                  borderBottom="2px solid"
                  borderColor="rgba(255,255,255,0.1)"
                  flexShrink={0}
                >
                  <Flex gap={3} alignItems="center" mb={4}>
                    <Box position="relative">
                      <Avatar
                        size="lg"
                        name={user[0]?.nama}
                        border="3px solid"
                        borderColor="rgba(255, 255, 255, 0.4)"
                        boxShadow="0 4px 12px rgba(0,0,0,0.2)"
                      />
                      {jumlahNotifikasi > 0 && (
                        <Badge
                          position="absolute"
                          top="-2"
                          right="-2"
                          bg="red.500"
                          color="white"
                          fontSize="11px"
                          fontWeight="bold"
                          borderRadius="full"
                          minW="7"
                          h="7"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          boxShadow="0 2px 8px rgba(0,0,0,0.3)"
                          border="2px solid white"
                        >
                          {jumlahNotifikasi > 9 ? "9+" : jumlahNotifikasi}
                        </Badge>
                      )}
                    </Box>
                    <VStack align="start" spacing={1} flex="1">
                      <Text fontSize="lg" fontWeight={700}>
                        {user[0]?.nama || "User"}
                      </Text>
                      <Text fontSize="sm" opacity={0.9}>
                        {user[0]?.email || ""}
                      </Text>
                    </VStack>
                  </Flex>

                  {/* Profile Button */}
                  <Link to="/profile" onClick={() => setIsDrawerOpen(false)}>
                    <Button
                      w="full"
                      variant="outline"
                      colorScheme="whiteAlpha"
                      size="md"
                      leftIcon={<Avatar size="xs" name={user[0]?.nama} />}
                      _hover={{
                        bg: "rgba(255, 255, 255, 0.25)",
                        transform: "translateY(-2px)",
                        boxShadow: "md",
                      }}
                      transition="all 0.2s ease"
                      mb={3}
                    >
                      Lihat Profile
                    </Button>
                  </Link>
                </Box>

                {/* Quick Actions Section */}
                <Box
                  p={4}
                  bg={boxBg}
                  borderBottom="1px solid"
                  borderColor={borderColor}
                  flexShrink={0}
                >
                  <Text
                    fontSize="xs"
                    fontWeight={700}
                    color={textColorLight}
                    textTransform="uppercase"
                    letterSpacing="wide"
                    mb={3}
                  >
                    Aplikasi Lain
                  </Text>
                  <SimpleGrid columns={2} spacing={2}>
                    <Link to="/" onClick={() => setIsDrawerOpen(false)}>
                      <Button
                        w="full"
                        variant="outline"
                        size="sm"
                        leftIcon={<Image h={"18px"} src={LogoPena} />}
                        _hover={{
                          bg: hoverBg,
                          borderColor: "aset",
                          transform: "translateY(-2px)",
                        }}
                        transition="all 0.2s ease"
                      >
                        Pena
                      </Button>
                    </Link>
                    <Link
                      to="/aset/dashboard"
                      onClick={() => setIsDrawerOpen(false)}
                    >
                      <Button
                        w="full"
                        variant="outline"
                        size="sm"
                        leftIcon={<Image h={"18px"} src={LogoAset} />}
                        _hover={{
                          bg: hoverBg,
                          borderColor: "aset",
                          transform: "translateY(-2px)",
                        }}
                        transition="all 0.2s ease"
                      >
                        Aset
                      </Button>
                    </Link>
                    <Link
                      to="/pegawai/dashboard"
                      onClick={() => setIsDrawerOpen(false)}
                    >
                      <Button
                        w="full"
                        variant="outline"
                        size="sm"
                        leftIcon={<Image h={"18px"} src={LogoPegawai} />}
                        _hover={{
                          bg: hoverBg,
                          borderColor: "aset",
                          transform: "translateY(-2px)",
                        }}
                        transition="all 0.2s ease"
                      >
                        Kepegawaian
                      </Button>
                    </Link>
                    <Link
                      to="/perencanaan"
                      onClick={() => setIsDrawerOpen(false)}
                    >
                      <Button
                        w="full"
                        variant="outline"
                        size="sm"
                        leftIcon={<Image h={"18px"} src={LogoPerencanaan} />}
                        _hover={{
                          bg: hoverBg,
                          borderColor: "aset",
                          transform: "translateY(-2px)",
                        }}
                        transition="all 0.2s ease"
                      >
                        Perencanaan
                      </Button>
                    </Link>
                  </SimpleGrid>
                </Box>
              </>
            ) : (
              <Box
                p={5}
                bg={boxBg}
                borderBottom="1px solid"
                borderColor={borderColor}
                flexShrink={0}
              >
                <Link to="/login" onClick={() => setIsDrawerOpen(false)}>
                  <Button
                    w="full"
                    variant="solid"
                    colorScheme="aset"
                    size="lg"
                    _hover={{
                      transform: "translateY(-2px)",
                      boxShadow: "lg",
                    }}
                    transition="all 0.2s ease"
                  >
                    Login
                  </Button>
                </Link>
              </Box>
            )}

            {/* Menu Navigation */}
            <Box
              bg={boxBg}
              flex="1"
              overflowY="auto"
              minH={0}
              display="flex"
              flexDirection="column"
            >
              <Box
                px={4}
                py={3}
                borderBottom="1px solid"
                borderColor={borderColor}
                flexShrink={0}
              >
                <Text
                  fontSize="xs"
                  fontWeight={700}
                  color={textColorLight}
                  textTransform="uppercase"
                  letterSpacing="wide"
                >
                  Menu
                </Text>
              </Box>
              <Accordion
                allowToggle
                index={accordionIndex}
                onChange={(index) => {
                  // Hanya satu accordion yang bisa terbuka pada satu waktu
                  setAccordionIndex(
                    Array.isArray(index)
                      ? index.length > 0
                        ? index[0]
                        : -1
                      : index,
                  );
                }}
              >
                {menuData.map((menu, index) => {
                  const IconComponent = menu.icon;
                  const isActive = isMenuActive(menu);

                  return (
                    <AccordionItem
                      key={index}
                      border="none"
                      borderTop="1px solid"
                      borderColor={borderColorLight}
                    >
                      <AccordionButton
                        px={4}
                        py={3.5}
                        bg={isActive ? "aset" : boxBg}
                        color={isActive ? "white" : textColor}
                        fontWeight="600"
                        _hover={{
                          bg: isActive ? "rgba(0, 100, 180, 1)" : hoverBg,
                        }}
                        borderLeft={
                          isActive ? "4px solid" : "4px solid transparent"
                        }
                        borderColor={
                          isActive ? "rgba(0, 100, 180, 1)" : "transparent"
                        }
                        transition="all 0.2s ease"
                      >
                        <HStack flex="1" spacing={3}>
                          <Icon
                            as={IconComponent}
                            boxSize={5}
                            color={isActive ? "white" : "aset"}
                          />
                          <Text textAlign="left" fontSize="sm">
                            {menu.title}
                          </Text>
                        </HStack>
                        <AccordionIcon
                          color={isActive ? "white" : textColorLight}
                        />
                      </AccordionButton>
                      <AccordionPanel pb={3} px={0} bg={accordionPanelBg}>
                        <VStack spacing={1} align="stretch" px={2}>
                          {menu.items.map((item, itemIndex) => {
                            const itemIsActive = isItemActive(item.path);
                            return (
                              <Link
                                key={itemIndex}
                                to={item.path}
                                onClick={() => setIsDrawerOpen(false)}
                              >
                                <Box
                                  px={6}
                                  py={2.5}
                                  bg={itemIsActive ? "aset" : "transparent"}
                                  color={itemIsActive ? "white" : textColor}
                                  fontWeight={
                                    itemIsActive ? "semibold" : "medium"
                                  }
                                  fontSize="sm"
                                  borderRadius="md"
                                  _hover={{
                                    bg: itemIsActive
                                      ? "rgba(0, 100, 180, 1)"
                                      : hoverBgWhite,
                                    transform: "translateX(4px)",
                                    boxShadow: itemIsActive ? "none" : "sm",
                                  }}
                                  transition="all 0.2s ease"
                                  borderLeft={
                                    itemIsActive
                                      ? "3px solid"
                                      : "3px solid transparent"
                                  }
                                  borderColor={
                                    itemIsActive ? "white" : "transparent"
                                  }
                                >
                                  {item.label}
                                </Box>
                              </Link>
                            );
                          })}
                        </VStack>
                      </AccordionPanel>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </Box>

            {/* Footer Section - Color Mode & Logout */}
            <Box
              borderTop="2px solid"
              borderColor={borderColorDark}
              bg={boxBg}
              boxShadow={footerBoxShadow}
              display={{ base: "block", lg: "none" }}
              flexShrink={0}
            >
              <Box p={4}>
                <HStack spacing={3}>
                  {/* Color Mode Toggle */}
                  <Button
                    flex="1"
                    variant="outline"
                    size="md"
                    leftIcon={
                      <Box
                        as="span"
                        fontSize="lg"
                        filter={
                          colorMode === "light" ? "none" : "grayscale(0%)"
                        }
                      >
                        {colorMode === "light" ? "🌙" : "☀️"}
                      </Box>
                    }
                    onClick={toggleColorMode}
                    justifyContent="center"
                    bg={colorMode === "light" ? "gray.900" : "yellow.100"}
                    color={colorMode === "light" ? "white" : "gray.800"}
                    borderColor={
                      colorMode === "light" ? "gray.700" : "yellow.300"
                    }
                    _hover={{
                      bg: colorMode === "light" ? "gray.800" : "yellow.200",
                      transform: "translateY(-2px)",
                      boxShadow: "md",
                    }}
                    transition="all 0.2s ease"
                  >
                    {colorMode === "light" ? "Gelap" : "Terang"}
                  </Button>

                  {/* Logout Button */}
                  {isAuthenticated && (
                    <Button
                      flex="1"
                      variant="outline"
                      colorScheme="red"
                      size="md"
                      leftIcon={<Icon as={FaSignOutAlt} />}
                      onClick={handleLogout}
                      _hover={{
                        bg: "red.50",
                        borderColor: "red.400",
                        transform: "translateY(-2px)",
                        boxShadow: "md",
                      }}
                      transition="all 0.2s ease"
                    >
                      Keluar
                    </Button>
                  )}
                </HStack>
              </Box>
            </Box>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
      {/* Spacing untuk konten utama */}
      <Box h="70px" /> {/* Spacer untuk konten */}
    </>
  );
}

export default NavbarAset;
