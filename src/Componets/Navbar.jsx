import React, { useState, useEffect, useCallback, useRef } from "react";
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
  useColorModeValue,
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
  useDisclosure,
  useBreakpointValue,
  Divider,
  Icon,
  Badge,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  SimpleGrid,
} from "@chakra-ui/react";
import {
  FaRoute,
  FaBars,
  FaSignOutAlt,
  FaMoon,
  FaSun,
  FaPlane,
  FaUser,
  FaBuilding,
  FaCog,
} from "react-icons/fa";
import { Link, useHistory, useLocation } from "react-router-dom";
import { BiWallet } from "react-icons/bi";
import { BsHouseDoor, BsStar, BsEnvelope } from "react-icons/bs";
import { useSelector, useDispatch } from "react-redux";
import { GoShieldLock } from "react-icons/go";
import { BiCar } from "react-icons/bi";
import LogoPena from "../assets/penaLogo.png";
import LogoAset from "../assets/asetLogo.png";
import LogoPegawai from "../assets/pegawaiLogo.png";
import LogoPerencanaan from "../assets/perencanaanLogo.png";
import LogoUtama from "../assets/Logo-KPBPN.png";
import {
  selectIsAuthenticated,
  userRedux,
  selectRoleIds,
  performLogout,
} from "../Redux/Reducers/auth";
import Logo from "../assets/logo.png";
import { HiOutlineUsers } from "react-icons/hi2";
import { io } from "socket.io-client";
import { useColorModeValues } from "../Style/colorModeValues";
import { FaBell } from "react-icons/fa";
import axios from "axios";
import { useToast } from "@chakra-ui/react";
import { BsStack, BsFileEarmarkText } from "react-icons/bs";
import { GiOilPump } from "react-icons/gi";

const ROLE_KPBPN = {
  SUPER_ADMIN: 1,
  ADMIN: 2,
  MITRA: 3,
};

const filterMenusByRole = (menus, userRoleIds) => {
  if (!userRoleIds?.length) return [];
  return menus.filter((menu) =>
    menu.allowedRoles?.some((roleId) => userRoleIds.includes(roleId)),
  );
};

const buildMenuGroups = (menus) =>
  menus.reduce((groups, menu) => {
    const key = menu.group || "Menu";
    if (!groups[key]) groups[key] = [];
    groups[key].push(menu);
    return groups;
  }, {});

const getSocketUrl = () => {
  const apiBase = import.meta.env.VITE_REACT_APP_API_BASE_URL || "";
  return apiBase.replace(/\/api\/?$/, "");
};

// Data menu untuk mapping
const menuData = [
  // {
  //   title: "Kendaraan",
  //   icon: BiCar,
  //   pathPrefix: "/kendaraan",
  //   items: [
  //     { label: "Kendaraan Saya", path: "/kendaraan/kendaraan-saya" },
  //     { label: "Perjalanan", path: "/kendaraan/perjalanan" },
  //     {
  //       label: "Daftar Perjalanan",
  //       path: "/kendaraan/daftar-perjalanan-kendaraan",
  //     },
  //     { label: "Admin Kendaraan", path: "/kendaraan/daftar-kendaraan" },
  //   ],
  // },
  // {
  //   title: "Perjalanan",
  //   icon: FaPlane,
  //   pathPrefix: "/perjalanan",
  //   items: [
  //     { label: "Perjalanan", path: "/perjalanan" },
  //     { label: "Daftar Perjalanan", path: "/perjalanan/daftar" },
  //     { label: "Kwitansi Global", path: "/perjalanan/kwitansi-global" },
  //     { label: "Rekap Perjalanan", path: "/perjalanan/rekap" },
  //   ],
  // },
  // {
  //   title: "Keuangan",
  //   icon: BiWallet,
  //   pathPrefix: "/keuangan",
  //   items: [
  //     {
  //       label: "Dashboard Keuangan",
  //       path: "/keuangan/dashboard",
  //     },
  //     {
  //       label: "Daftar Kwitansi Global",
  //       path: "/keuangan/daftar-kwitansi-global",
  //     },
  //     { label: "Daftar Perjalanan", path: "/keuangan/daftar-perjalanan" },
  //     { label: "Perjalanan Pegawai", path: "/keuangan/perjalanan-pegawai" },
  //     { label: "Template Keuangan", path: "/keuangan/template" },
  //     { label: "Daftar Tujuan Dalam Kota", path: "/keuangan/dalam-kota" },
  //     { label: "Sumber Dana", path: "/keuangan/sumber-dana" },
  //     { label: "verifikasi Template BPD", path: "/keuangan/template-bpd" },
  //   ],
  // },
  // {
  //   title: "Kepegawaian",
  //   icon: HiOutlineUsers,
  //   pathPrefix: "/kepegawaian",
  //   items: [
  //     { label: "Daftar Pegawai", path: "/kepegawaian/daftar-pegawai" },
  //     { label: "Statistik Pegawai", path: "/kepegawaian/statistik-pegawai" },
  //     { label: "Data Saya", path: "/kepegawaian/profile" },
  //     { label: "Usulan Pegawai", path: "/kepegawaian/usulan" },
  //   ],
  // },

  // {
  //   title: "Unit Kerja",
  //   icon: FaBuilding,
  //   pathPrefix: "/unit-kerja",
  //   items: [
  //     { label: "Induk Unit Kerja", path: "/unit-kerja/induk-unit-kerja" },
  //     { label: "Daftar Pegawai", path: "/unit-kerja/daftar-pegawai" },
  //     { label: "Daftar Bendahara", path: "/unit-kerja/daftar-bendahara" },
  //     { label: "Template Surat", path: "/unit-kerja/template" },
  //     { label: "Sub Kegiatan", path: "/unit-kerja/sub-kegiatan" },
  //     { label: "Tujuan Dalam Kota", path: "/unit-kerja/dalam-kota" },
  //     { label: "Template BPD", path: "/unit-kerja/template-bpd" },
  //   ],
  // },
  // {
  //   title: "Surat",
  //   icon: BsEnvelope,
  //   pathPrefix: "/surat",
  //   items: [
  //     { label: "Pengaturan", path: "/surat/nomor" },
  //     { label: "Daftar Surat Keluar", path: "/surat/surat-keluar" },
  //     { label: "Daftar SPPD", path: "/surat/sppd" },
  //     { label: "Daftar Surat Tugas", path: "/surat/surat-tugas" },
  //   ],
  // },

  {
    title: "Pengiriman KPBPN",
    icon: FaRoute,
    group: "Pengiriman",
    pathPrefix: "/pengiriman-kpbpn",
    allowedRoles: [ROLE_KPBPN.SUPER_ADMIN, ROLE_KPBPN.ADMIN],
    items: [{ label: "Surat Jalan", path: "/pengiriman-kpbpn/surat-jalan" }],
  },
  {
    title: "Pengiriman Mitra",
    icon: BiCar,
    group: "Pengiriman",
    pathPrefix: "/pengiriman-mitra",
    allowedRoles: [ROLE_KPBPN.SUPER_ADMIN, ROLE_KPBPN.ADMIN, ROLE_KPBPN.MITRA],
    items: [{ label: "Surat Jalan", path: "/pengiriman-mitra/surat-jalan" }],
  },
  {
    title: "Operasional",
    icon: BsStack,
    group: "Operasional",
    pathPrefix: "/tanki-kpbpn",
    allowedRoles: [ROLE_KPBPN.SUPER_ADMIN, ROLE_KPBPN.ADMIN],
    items: [
      { label: "BAST", path: "/tanki-kpbpn/pengisian" },
      { label: "Uji Lab K3S", path: "/tanki-kpbpn/uji-lab" },
      { label: "BA Bongkar", path: "/tanki-kpbpn/ba-bongkar" },
      { label: "Stok Opname", path: "/tanki-kpbpn/stok-opname" },
      // { label: "Tambah Pengisian", path: "/tanki-kpbpn/tambah-pengisian" },
     
    ],
  },
  {
    title: "Sumur",
    icon: GiOilPump,
    group: "Operasional",
    pathPrefix: "/sumur",
    allowedRoles: [ROLE_KPBPN.SUPER_ADMIN, ROLE_KPBPN.ADMIN, ROLE_KPBPN.MITRA],
    items: [
      { label: "Sumur Minyak", path: "/sumur/sumur-minyak" },
      { label: "Peta Sumur", path: "/sumur/peta-sumur" },
    ],
  },

  {
    title: "Administrasi",
    icon: FaCog,
    group: "Sistem",
    pathPrefix: "/admin",
    allowedRoles: [ROLE_KPBPN.SUPER_ADMIN],
    items: [
      { label: "Tambah Pengguna", path: "/admin/tambah-user" },
      { label: "Daftar Pengguna", path: "/admin/daftar-user" },
      { label: "Daftar Tanki", path: "/admin/daftar-tanki" },
      { label: "Stasiun Pengumpul Minyak", path: "/admin/stasiun-pengumpul-minyak" },
      { label: "Asal Minyak", path: "/admin/asal-minyak" },
      { label: "Dashboard", path: "/admin/dashboard" },
      { label: "Mitra", path: "/admin/mitra" },
      { label: "Kelola Template", path: "/admin/template-kpbpn" },
      { label: "Kelola Data", path: "/admin/data" },
    ],
  },
];

function Navbar() {
  const isAuthenticated =
    useSelector(selectIsAuthenticated) || localStorage.getItem("token");
  const user = useSelector(userRedux);
  const userRoleIds = useSelector(selectRoleIds);
  const { colorMode, toggleColorMode } = useColorMode();
  const history = useHistory();
  const location = useLocation();
  const dispatch = useDispatch();
  const [jumlahNotifikasi, setJumlahNotifikasi] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [accordionIndex, setAccordionIndex] = useState(-1);
  const [notifikasiList, setNotifikasiList] = useState([]);
  const [isNotifikasiOpen, setIsNotifikasiOpen] = useState(false);
  const isNotifikasiOpenRef = useRef(false);
  const [notifikasiSuratJalanDraft, setNotifikasiSuratJalanDraft] = useState({
    count: 0,
    message: "",
  });
  const [profilePic, setProfilePic] = useState(null);
  const toast = useToast();

  // Notifikasi surat jalan DRAFT untuk Super Admin & Admin KPBPN (roleKPBPNId 1 atau 2)
  const hasKpbpnAdminRole = React.useMemo(() => {
    if (!userRoleIds?.length) return false;
    return userRoleIds.some(
      (roleId) =>
        roleId === ROLE_KPBPN.SUPER_ADMIN || roleId === ROLE_KPBPN.ADMIN,
    );
  }, [userRoleIds]);

  // Fetch foto profile
  const fetchProfilePic = useCallback(async () => {
    if (!isAuthenticated || !user || !user[0]?.id) return;
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_REACT_APP_API_BASE_URL}/user/profile/${
          user[0].id
        }`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (response.data?.result?.profilePic) {
        setProfilePic(response.data.result.profilePic);
      }
    } catch (error) {
      console.error("Error fetching profile pic:", error);
    }
  }, [isAuthenticated, user]);

  // Fetch foto profile saat mount atau saat authenticated berubah
  useEffect(() => {
    if (isAuthenticated && user && user[0]?.id) {
      fetchProfilePic();
    } else {
      setProfilePic(null);
    }
  }, [isAuthenticated, user, fetchProfilePic]);

  // Refresh foto profile saat kembali ke halaman (misalnya setelah upload foto)
  useEffect(() => {
    const handleFocus = () => {
      if (isAuthenticated && user && user[0]?.id) {
        fetchProfilePic();
      }
    };

    // Refresh saat window focus (user kembali ke tab)
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [isAuthenticated, user, fetchProfilePic]);

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

  const navbarBg = useColorModeValue(
    "rgba(255, 255, 255, 0.92)",
    "rgba(26, 32, 44, 0.95)",
  );
  const navbarBorder = useColorModeValue("gray.200", "gray.700");
  const navTextColor = useColorModeValue("gray.600", "gray.300");
  const navActiveBg = useColorModeValue("primary", "primary");
  const navHoverBg = useColorModeValue("gray.100", "gray.700");
  const dropdownBg = useColorModeValue("white", "gray.800");
  const dropdownBorder = useColorModeValue("gray.200", "gray.600");
  const brandTitleColor = useColorModeValue("gray.800", "white");
  const brandSubtitleColor = useColorModeValue("gray.500", "gray.400");
  const navActiveMenuBg = useColorModeValue(
    "rgba(19, 104, 185, 0.12)",
    "whiteAlpha.100",
  );
  const brandActiveColor = "#1368B9";
  const navbarShadow = useColorModeValue(
    "0 1px 3px rgba(0,0,0,0.06)",
    "0 1px 3px rgba(0,0,0,0.3)",
  );
  const logoBoxBg = useColorModeValue("white", "gray.700");

  const displayName = user?.[0]?.nama || user?.nama || "Pengguna";

  const visibleMenus = React.useMemo(() => {
    if (!isAuthenticated) return [];
    return filterMenusByRole(menuData, userRoleIds);
  }, [isAuthenticated, userRoleIds]);

  const visibleMenuGroups = React.useMemo(
    () => buildMenuGroups(visibleMenus),
    [visibleMenus],
  );

  const handleLogout = () => {
    dispatch(performLogout());
    setIsDrawerOpen(false);
  };

  // Fetch daftar notifikasi dari API
  const fetchNotifikasi = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_REACT_APP_API_BASE_URL}/notifikasi/kpbpn/get`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const backendCount = response.data.total ?? response.data.count ?? 0;
      setJumlahNotifikasi(backendCount);

      if (response.data.suratJalanDraft !== undefined) {
        setNotifikasiSuratJalanDraft({
          count:
            response.data.suratJalanDraft.count ??
            response.data.suratJalanDraft ??
            0,
          message:
            response.data.suratJalanDraft.message ||
            response.data.message ||
            "",
        });
      }

      if (response.data.notifikasi) {
        setNotifikasiList(response.data.notifikasi);
      }
    } catch (error) {
      console.error("Error fetching notifikasi:", error);
    }
  }, []);

  useEffect(() => {
    isNotifikasiOpenRef.current = isNotifikasiOpen;
  }, [isNotifikasiOpen]);

  // Inisialisasi Socket.io dan listener notifikasi surat jalan DRAFT
  useEffect(() => {
    if (!isAuthenticated || !hasKpbpnAdminRole) return;

    const socketUrl = getSocketUrl();

    if (!socketUrl) {
      console.error(
        "⚠️ VITE_REACT_APP_API_BASE_URL tidak diset! Socket.io tidak dapat terhubung.",
      );
      return;
    }

    if (socketUrl.includes("localhost") && import.meta.env.PROD) {
      console.warn(
        "⚠️ PERINGATAN: Menggunakan localhost di produksi! Pastikan environment variable sudah diset dengan benar.",
      );
    }

    const socket = io(socketUrl, {
      transports: ["websocket", "polling"],
    });

    const handleNotifikasi = (data) => {
      console.log("📡 Notifikasi KPBPN diterima:", data);

      if (data.count !== undefined) {
        setJumlahNotifikasi((prevCount) => {
          const newCount = data.count;

          if (newCount > prevCount && data.message) {
            toast({
              title: "Surat Jalan Baru",
              description:
                data.message || "Ada surat jalan DRAFT menunggu verifikasi",
              status: "info",
              duration: 4000,
              isClosable: true,
              position: "top-right",
            });
          }

          return newCount;
        });
      }

      if (data.suratJalanDraft !== undefined) {
        setNotifikasiSuratJalanDraft({
          count: data.suratJalanDraft.count || 0,
          message: data.suratJalanDraft.message || "",
        });
      }

      if (data.notifikasi) {
        setNotifikasiList(data.notifikasi);
      }

      if (isNotifikasiOpenRef.current) {
        fetchNotifikasi();
      }
    };

    socket.on("notifikasi:kpbpn:terbaru", handleNotifikasi);

    socket.on("connect", () => {
      console.log("✅ Socket.io connected:", socket.id, "→", socketUrl);
    });

    socket.on("connect_error", (error) => {
      console.error("❌ Socket.io connect error:", error.message);
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket.io disconnected");
    });

    return () => {
      socket.off("notifikasi:kpbpn:terbaru", handleNotifikasi);
      socket.off("connect");
      socket.off("connect_error");
      socket.off("disconnect");
      socket.disconnect();
    };
  }, [isAuthenticated, hasKpbpnAdminRole, toast, fetchNotifikasi]);

  useEffect(() => {
    if (isAuthenticated && hasKpbpnAdminRole) {
      fetchNotifikasi();
    } else {
      setJumlahNotifikasi(0);
      setNotifikasiList([]);
      setNotifikasiSuratJalanDraft({ count: 0, message: "" });
    }
  }, [isAuthenticated, hasKpbpnAdminRole, fetchNotifikasi]);

  useEffect(() => {
    if (isNotifikasiOpen && isAuthenticated && hasKpbpnAdminRole) {
      fetchNotifikasi();
    }
  }, [isNotifikasiOpen, isAuthenticated, hasKpbpnAdminRole, fetchNotifikasi]);

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
        <Flex
          align="center"
          gap={3}
          px={3}
          py={2.5}
          borderRadius="lg"
          bg={isActive ? "primary" : "transparent"}
          color={isActive ? "white" : navTextColor}
          fontWeight={isActive ? "600" : "500"}
          fontSize="sm"
          _hover={{
            bg: isActive ? "primaryGelap" : navHoverBg,
            color: isActive ? "white" : "primary",
          }}
          transition="all 0.2s ease"
        >
          <Box
            w="6px"
            h="6px"
            borderRadius="full"
            bg={isActive ? "white" : "primary"}
            flexShrink={0}
          />
          {item.label}
        </Flex>
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
            leftIcon={
              <Icon
                as={IconComponent}
                boxSize={4}
                color={isActive ? "primary" : "inherit"}
              />
            }
            position="relative"
            color={isActive ? "primary" : navTextColor}
            fontWeight={isActive ? "600" : "500"}
            fontSize="sm"
            px={3}
            py={2}
            h="auto"
            minH="36px"
            bg={isActive ? navActiveMenuBg : "transparent"}
            _hover={{
              bg: navHoverBg,
              color: "primary",
            }}
            _active={{ bg: navHoverBg }}
            transition="all 0.2s ease"
            borderRadius="lg"
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {menu.title}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          mt={2}
          w="auto"
          minW="220px"
          boxShadow="lg"
          borderRadius="xl"
          border="1px solid"
          borderColor={dropdownBorder}
          bg={dropdownBg}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          overflow="hidden"
        >
          <PopoverArrow bg={dropdownBg} />
          <PopoverBody p={2}>
            {menu.group && (
              <Text
                px={3}
                pt={1}
                pb={2}
                fontSize="xs"
                fontWeight="700"
                color={textColorLight}
                textTransform="uppercase"
                letterSpacing="wider"
              >
                {menu.group}
              </Text>
            )}
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
        <Box
          bg={navbarBg}
          backdropFilter="blur(12px)"
          borderBottom="1px solid"
          borderColor={navbarBorder}
          boxShadow={navbarShadow}
          position="relative"
          _before={{
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "3px",
            bgGradient: "linear(to-r, primary, primaryGelap)",
          }}
        >
          <Flex
            maxW="1400px"
            mx="auto"
            px={{ base: 4, md: 6 }}
            py={3}
            minH="64px"
            alignItems="center"
            gap={{ base: 2, lg: 6 }}
          >
            {/* Brand */}
            <Link to="/">
              <Flex gap={3} alignItems="center" flexShrink={0}>
                <Box
                  h="44px"
                  w="44px"
                  borderRadius="lg"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  bg={logoBoxBg}
                  boxShadow="sm"
                  p={1}
                >
                  <Image
                    h="100%"
                    w="100%"
                    objectFit="contain"
                    src={LogoUtama}
                    alt="Logo KPBPN"
                  />
                </Box>
                <Box display={{ base: "none", md: "block" }}>
                  <Text
                    color={brandTitleColor}
                    fontSize="sm"
                    fontWeight="700"
                    lineHeight="1.2"
                  >
                    Sistem KPBPN
                  </Text>
                  <Text
                    color={brandSubtitleColor}
                    fontSize="xs"
                    fontWeight="400"
                    lineHeight="1.2"
                  >
                    Manajemen Pengiriman & Tanki
                  </Text>
                </Box>
              </Flex>
            </Link>

            {/* Desktop Navigation */}
            <HStack
              spacing={1}
              flex="1"
              justify="center"
              display={{ base: "none", lg: "flex" }}
            >
              {visibleMenus.map((menu, index) => (
                <MenuDropdown key={index} menu={menu} />
              ))}
            </HStack>

            {/* Right Actions */}
            <HStack spacing={2} flexShrink={0} ml={{ base: "auto", lg: 0 }}>
              {/* Color Mode Toggle - Hidden on mobile */}
              <IconButton
                display={{ base: "none", lg: "flex" }}
                onClick={toggleColorMode}
                aria-label="Toggle color mode"
                icon={<Icon as={colorMode === "light" ? FaMoon : FaSun} />}
                size="sm"
                variant="ghost"
                color={navTextColor}
                borderRadius="lg"
                _hover={{
                  bg: navHoverBg,
                  color: "primary",
                }}
                transition="all 0.2s ease"
              />

              {/* Notifikasi Bell Icon - untuk Super Admin & Admin KPBPN */}
              {isAuthenticated && hasKpbpnAdminRole && (
                <Popover
                  placement="bottom-end"
                  isOpen={isNotifikasiOpen}
                  onOpen={() => setIsNotifikasiOpen(true)}
                  onClose={() => setIsNotifikasiOpen(false)}
                  closeOnBlur={true}
                >
                  <PopoverTrigger>
                    <Box
                      position="relative"
                      display={{ base: "none", lg: "block" }}
                    >
                      <IconButton
                        aria-label="Notifikasi"
                        icon={<Icon as={FaBell} />}
                        size="sm"
                        variant="ghost"
                        color={navTextColor}
                        borderRadius="lg"
                        _hover={{
                          bg: navHoverBg,
                          color: "primary",
                        }}
                        transition="all 0.2s ease"
                      />
                      {jumlahNotifikasi > 0 && (
                        <Badge
                          position="absolute"
                          top="-2"
                          right="-2"
                          bg="red.500"
                          color="white"
                          fontSize="10px"
                          fontWeight="bold"
                          borderRadius="full"
                          minW="6"
                          h="6"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          boxShadow="0 2px 8px rgba(220, 38, 38, 0.4)"
                          border="2px solid white"
                          animation="pulse 2s infinite"
                        >
                          {jumlahNotifikasi > 9 ? "9+" : jumlahNotifikasi}
                        </Badge>
                      )}
                    </Box>
                  </PopoverTrigger>
                  <PopoverContent
                    w="400px"
                    maxH="500px"
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
                      bgGradient: "linear(to-r, primary, primaryGelap)",
                    }}
                  >
                    <PopoverArrow
                      bg="white"
                      borderColor="gray.200"
                      borderWidth="1px"
                      borderTop="none"
                      borderLeft="none"
                    />
                    <PopoverBody p={0}>
                      <Box
                        p={4}
                        borderBottom="1px solid"
                        borderColor="gray.200"
                        bg="gray.50"
                      >
                        <Flex
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Text fontWeight="bold" fontSize="lg">
                            Notifikasi
                          </Text>
                          {jumlahNotifikasi > 0 && (
                            <Badge colorScheme="red" borderRadius="full">
                              {jumlahNotifikasi}
                            </Badge>
                          )}
                        </Flex>
                      </Box>
                      <Box
                        maxH="400px"
                        overflowY="auto"
                        css={{
                          "&::-webkit-scrollbar": {
                            width: "8px",
                          },
                          "&::-webkit-scrollbar-track": {
                            background: "#f1f1f1",
                          },
                          "&::-webkit-scrollbar-thumb": {
                            background: "#888",
                            borderRadius: "4px",
                          },
                          "&::-webkit-scrollbar-thumb:hover": {
                            background: "#555",
                          },
                        }}
                      >
                        {jumlahNotifikasi === 0 ? (
                          <Box p={6} textAlign="center">
                            <Icon
                              as={FaBell}
                              boxSize={12}
                              color="gray.300"
                              mb={3}
                            />
                            <Text color="gray.500" fontSize="sm">
                              Tidak ada notifikasi
                            </Text>
                          </Box>
                        ) : (
                          <VStack spacing={0} align="stretch">
                            {notifikasiSuratJalanDraft.count > 0 && (
                              <Link to="/pengiriman-kpbpn/surat-jalan">
                                <Box
                                  p={4}
                                  borderBottom="1px solid"
                                  borderColor="gray.100"
                                  bg="orange.50"
                                  borderLeft="4px solid"
                                  borderLeftColor="orange.500"
                                  _hover={{ bg: "orange.100" }}
                                  cursor="pointer"
                                  transition="all 0.2s ease"
                                  onClick={() => setIsNotifikasiOpen(false)}
                                >
                                  <Flex
                                    justifyContent="space-between"
                                    alignItems="start"
                                    mb={1}
                                  >
                                    <Text
                                      fontWeight="bold"
                                      fontSize="sm"
                                      color="orange.700"
                                    >
                                      Surat Jalan DRAFT
                                    </Text>
                                    <Badge
                                      colorScheme="orange"
                                      borderRadius="full"
                                      fontSize="xs"
                                    >
                                      {notifikasiSuratJalanDraft.count}
                                    </Badge>
                                  </Flex>
                                  <Text fontSize="sm" color="gray.700" mt={1}>
                                    {notifikasiSuratJalanDraft.message ||
                                      `Ada ${notifikasiSuratJalanDraft.count} surat jalan menunggu verifikasi`}
                                  </Text>
                                </Box>
                              </Link>
                            )}

                            {notifikasiList.map((notif, index) => (
                              <Link
                                key={notif.id || index}
                                to="/pengiriman-kpbpn/surat-jalan"
                              >
                                <Box
                                  p={4}
                                  borderBottom="1px solid"
                                  borderColor="gray.100"
                                  _hover={{ bg: "gray.50" }}
                                  cursor="pointer"
                                  transition="all 0.2s ease"
                                  onClick={() => setIsNotifikasiOpen(false)}
                                >
                                  <Text
                                    fontWeight="medium"
                                    fontSize="sm"
                                    mb={1}
                                  >
                                    {notif.message || "Surat jalan DRAFT baru"}
                                  </Text>
                                  {notif.timestamp && (
                                    <Text color="gray.500" fontSize="xs">
                                      {new Date(notif.timestamp).toLocaleString(
                                        "id-ID",
                                      )}
                                    </Text>
                                  )}
                                </Box>
                              </Link>
                            ))}

                            {notifikasiSuratJalanDraft.count === 0 &&
                              notifikasiList.length === 0 &&
                              jumlahNotifikasi > 0 && (
                                <Box p={4}>
                                  <Text fontSize="sm" color="gray.600">
                                    Anda memiliki {jumlahNotifikasi} notifikasi
                                    baru
                                  </Text>
                                </Box>
                              )}
                          </VStack>
                        )}
                      </Box>
                    </PopoverBody>
                  </PopoverContent>
                </Popover>
              )}

              {/* Separator */}
              <Box
                display={{ base: "none", lg: "block" }}
                w="1px"
                h="28px"
                bg={navbarBorder}
              />

              {/* User Menu - Desktop */}
              {isAuthenticated ? (
                <>
                  <Menu>
                    <MenuButton
                      as={Button}
                      variant="ghost"
                      size="sm"
                      display={{ base: "none", lg: "flex" }}
                      px={2}
                      py={1}
                      borderRadius="lg"
                      _hover={{ bg: navHoverBg }}
                      _active={{ bg: navHoverBg }}
                    >
                      <HStack spacing={2}>
                        <Avatar
                          size="sm"
                          name={displayName}
                          src={
                            profilePic
                              ? `${import.meta.env.VITE_REACT_APP_API_BASE_URL}${profilePic}`
                              : undefined
                          }
                          bg="primary"
                          color="white"
                        />
                        <VStack
                          spacing={0}
                          align="flex-start"
                          display={{ base: "none", xl: "flex" }}
                        >
                          <Text
                            color={brandTitleColor}
                            fontSize="sm"
                            fontWeight="600"
                            lineHeight="1.2"
                            noOfLines={1}
                            maxW="140px"
                          >
                            {displayName}
                          </Text>
                          <Text
                            color={brandSubtitleColor}
                            fontSize="xs"
                            lineHeight="1.2"
                          >
                            Akun Saya
                          </Text>
                        </VStack>
                      </HStack>
                    </MenuButton>
                    <MenuList
                      boxShadow="lg"
                      borderRadius="xl"
                      border="1px solid"
                      borderColor={dropdownBorder}
                      bg={dropdownBg}
                      mt={2}
                      minW="200px"
                    >
                      <Link to={"/profile"}>
                        <MenuItem
                          icon={
                            <Avatar
                              size="xs"
                              name={displayName}
                              src={
                                profilePic
                                  ? `${import.meta.env.VITE_REACT_APP_API_BASE_URL}${profilePic}`
                                  : undefined
                              }
                            />
                          }
                          _hover={{ bg: navHoverBg }}
                          borderRadius="md"
                        >
                          Profil Saya
                        </MenuItem>
                      </Link>
                      <Divider my={1} />
                      <MenuItem
                        icon={<Icon as={FaSignOutAlt} />}
                        _hover={{ bg: "red.50", color: "red.600" }}
                        onClick={handleLogout}
                        color="red.500"
                        fontWeight="600"
                        borderRadius="md"
                      >
                        Keluar
                      </MenuItem>
                    </MenuList>
                  </Menu>
                </>
              ) : (
                <Link to="/login">
                  <Button
                    variant={"kpbpn"}
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
                aria-label="Buka menu"
                icon={<FaBars />}
                size="sm"
                variant="ghost"
                color={navTextColor}
                borderRadius="lg"
                onClick={() => setIsDrawerOpen(true)}
                _hover={{ bg: navHoverBg, color: "primary" }}
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
          <DrawerCloseButton color="white" top={3} />
          <DrawerHeader
            bgGradient="linear(to-r, primary, primaryGelap)"
            color="white"
            py={5}
            borderBottom="1px solid"
            borderColor="rgba(255,255,255,0.15)"
          >
            <Flex gap={3} alignItems="center">
              <Box
                h="40px"
                w="40px"
                borderRadius="md"
                bg="white"
                p={1}
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Image h="100%" src={LogoUtama} alt="Logo KPBPN" />
              </Box>
              <Box>
                <Text fontSize="sm" fontWeight={700}>
                  Sistem KPBPN
                </Text>
                <Text fontSize="xs" opacity={0.9}>
                  Manajemen Pengiriman & Tanki
                </Text>
              </Box>
            </Flex>
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
                  bgGradient="linear(to-r, primary, primaryGelap)"
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
                        src={
                          profilePic
                            ? `${
                                import.meta.env.VITE_REACT_APP_API_BASE_URL
                              }${profilePic}`
                            : undefined
                        }
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
                      <Text fontSize="md" fontWeight={700}>
                        {displayName}
                      </Text>
                      <Text fontSize="xs" opacity={0.9}>
                        {user?.[0]?.email || ""}
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
                      leftIcon={
                        <Avatar
                          size="xs"
                          name={user[0]?.nama}
                          src={
                            profilePic
                              ? `${
                                  import.meta.env.VITE_REACT_APP_API_BASE_URL
                                }${profilePic}`
                              : undefined
                          }
                        />
                      }
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

                {/* Penomoran & Keuangan */}
                <Box
                  px={4}
                  py={2}
                  bg={boxBg}
                  borderBottom="1px solid"
                  borderColor={borderColor}
                >
                  <Text fontSize="xs" color={textColorLight}>
                    Penomoran:{" "}
                    <Text
                      as="span"
                      color={
                        user[0]?.unitKerja_profile?.indukUnitKerja
                          ?.penomoran === "aktif"
                          ? brandActiveColor
                          : undefined
                      }
                      fontWeight="500"
                    >
                      {user[0]?.unitKerja_profile?.indukUnitKerja?.penomoran ||
                        "-"}
                    </Text>
                    {" · "}
                    Keuangan:{" "}
                    <Text
                      as="span"
                      color={
                        user[0]?.unitKerja_profile?.indukUnitKerja?.keuangan ===
                        "aktif"
                          ? brandActiveColor
                          : undefined
                      }
                      fontWeight="500"
                    >
                      {user[0]?.unitKerja_profile?.indukUnitKerja?.keuangan ||
                        "-"}
                    </Text>
                  </Text>
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
                    colorScheme="kpbpn"
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

            {/* Menu Navigation - dikelompokkan */}
            <Box bg={boxBg} flex="1" overflowY="auto" minH={0}>
              {Object.entries(visibleMenuGroups).map(
                ([groupName, menus], groupIndex) => (
                  <Box key={groupName}>
                    <Box px={4} py={2} bg={drawerBg}>
                      <Text
                        fontSize="xs"
                        fontWeight={700}
                        color={textColorLight}
                        textTransform="uppercase"
                        letterSpacing="wider"
                      >
                        {groupName}
                      </Text>
                    </Box>
                    <Accordion
                      allowToggle
                      index={
                        accordionIndex >= 0 &&
                        visibleMenus[accordionIndex]?.group === groupName
                          ? menus.findIndex(
                              (m) =>
                                m.pathPrefix ===
                                visibleMenus[accordionIndex]?.pathPrefix,
                            )
                          : -1
                      }
                      onChange={(index) => {
                        const idx = Array.isArray(index)
                          ? index.length > 0
                            ? index[0]
                            : -1
                          : index;
                        if (idx === -1) {
                          setAccordionIndex(-1);
                          return;
                        }
                        const globalIndex = visibleMenus.findIndex(
                          (m) => m.pathPrefix === menus[idx]?.pathPrefix,
                        );
                        setAccordionIndex(globalIndex);
                      }}
                    >
                      {menus.map((menu, index) => {
                        const IconComponent = menu.icon;
                        const isActive = isMenuActive(menu);
                        const globalIndex = visibleMenus.findIndex(
                          (m) => m.pathPrefix === menu.pathPrefix,
                        );

                        return (
                          <AccordionItem
                            key={globalIndex}
                            border="none"
                            borderTop={index > 0 ? "1px solid" : "none"}
                            borderColor={borderColorLight}
                          >
                            <AccordionButton
                              px={4}
                              py={3}
                              bg={isActive ? "primary" : boxBg}
                              color={isActive ? "white" : textColor}
                              fontWeight="600"
                              _hover={{
                                bg: isActive ? "primaryGelap" : hoverBg,
                              }}
                              borderLeft={
                                isActive ? "3px solid" : "3px solid transparent"
                              }
                              borderColor={
                                isActive ? "primaryGelap" : "transparent"
                              }
                              transition="all 0.2s ease"
                            >
                              <HStack flex="1" spacing={3}>
                                <Icon
                                  as={IconComponent}
                                  boxSize={4}
                                  color={isActive ? "white" : "primary"}
                                />
                                <Text textAlign="left" fontSize="sm">
                                  {menu.title}
                                </Text>
                              </HStack>
                              <AccordionIcon
                                color={isActive ? "white" : textColorLight}
                              />
                            </AccordionButton>
                            <AccordionPanel pb={2} px={0} bg={accordionPanelBg}>
                              <VStack spacing={0.5} align="stretch" px={2}>
                                {menu.items.map((item, itemIndex) => {
                                  const itemIsActive = isItemActive(item.path);
                                  return (
                                    <Link
                                      key={itemIndex}
                                      to={item.path}
                                      onClick={() => setIsDrawerOpen(false)}
                                    >
                                      <Flex
                                        align="center"
                                        gap={2}
                                        px={4}
                                        py={2}
                                        ml={4}
                                        bg={
                                          itemIsActive
                                            ? "primary"
                                            : "transparent"
                                        }
                                        color={
                                          itemIsActive ? "white" : textColor
                                        }
                                        fontWeight={
                                          itemIsActive ? "600" : "500"
                                        }
                                        fontSize="sm"
                                        borderRadius="md"
                                        _hover={{
                                          bg: itemIsActive
                                            ? "primaryGelap"
                                            : hoverBgWhite,
                                        }}
                                        transition="all 0.2s ease"
                                      >
                                        <Box
                                          w="5px"
                                          h="5px"
                                          borderRadius="full"
                                          bg={
                                            itemIsActive ? "white" : "primary"
                                          }
                                        />
                                        {item.label}
                                      </Flex>
                                    </Link>
                                  );
                                })}
                              </VStack>
                            </AccordionPanel>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                    {groupIndex < Object.keys(visibleMenuGroups).length - 1 && (
                      <Divider borderColor={borderColor} />
                    )}
                  </Box>
                ),
              )}
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
      <Box h="64px" />
    </>
  );
}

export default Navbar;
