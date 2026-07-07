// Konfigurasi SEO untuk berbagai halaman
export const seoConfig = {
  // Default SEO untuk semua halaman
  default: {
    title: "Jasirah Diza Berjaya",
    description:
      "Sistem informasi perjalanan dinas dan pengelolaan aset Dinas Kesehatan",
    image: "/src/assets/dinkes.jpg",
    organization: {
      name: "Dinas Kesehatan",
      url: typeof window !== "undefined" ? window.location.origin : "",
      logo: "/src/assets/Logo Pena.png",
      description: "Dinas Kesehatan - Melayani Masyarakat dengan Profesional",
      address: {
        streetAddress: "gedung perkantoran",
        addressLocality: "Tana Paser",
        addressRegion: "Kalimantan Timur",
        postalCode: "76211",
      },
      contactPoint: {
        telephone: "+62-543-21123",
        contactType: "customer service",
      },
    },
  },

  // SEO untuk halaman Home
  home: {
    title: "Jasirah Diza Berjaya",
    description: "Jasirah Diza Berjaya",
    image: "/src/assets/dinkes.jpg",
  },

  // SEO untuk halaman Dashboard
  dashboard: {
    title: "Dashboard - Jasirah Core",
    description:
      "Dashboard utama sistem informasi perjalanan dinas dan pengelolaan aset Dinas Kesehatan Kabupaten Paser",
    image: "/src/assets/dinkes.jpg",
  },

  // SEO untuk halaman Perjalanan
  perjalanan: {
    title: "Perjalanan Dinas - Jasirah Core",
    description:
      "Kelola dan monitor perjalanan dinas pegawai Dinas Kesehatan Kabupaten Paser dengan sistem terintegrasi",
    image: "/src/assets/dinkes.jpg",
  },

  // SEO untuk halaman Aset
  aset: {
    title: "Pengelolaan Aset - Jasirah Core",
    description:
      "Sistem pengelolaan aset dan inventaris Dinas Kesehatan Kabupaten Paser untuk efisiensi administrasi",
    image: "/src/assets/dinkes.jpg",
  },

  // SEO untuk halaman Login
  login: {
    title: "Login - Jasirah Core",
    description:
      "Masuk ke sistem informasi perjalanan dinas Dinas Kesehatan Kabupaten Paser",
    image: "/src/assets/dinkes.jpg",
  },

  // SEO untuk halaman Profile
  profile: {
    title: "Profile Pegawai - Jasirah Core",
    description:
      "Kelola profile dan informasi pegawai Dinas Kesehatan Kabupaten Paser",
    image: "/src/assets/dinkes.jpg",
  },
};

// Helper function untuk menggabungkan konfigurasi
export const getSEOConfig = (page, customProps = {}) => {
  const baseConfig = seoConfig.default;
  const pageConfig = seoConfig[page] || {};

  return {
    ...baseConfig,
    ...pageConfig,
    ...customProps,
    url: typeof window !== "undefined" ? window.location.href : "",
    organization: {
      ...baseConfig.organization,
      ...pageConfig.organization,
      ...customProps.organization,
    },
  };
};
