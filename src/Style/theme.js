import { extendTheme } from "@chakra-ui/react";
import { buttonStyles as Button } from "./Components/buttonStyles";
import { tableStyles as Table } from "./Components/tableStyles";
import { select2Styles as Select2 } from "./Components/select2Styles";
import { containerStyle as Container } from "./Components/containerStyle";
import { inputStyles as Input } from "./Components/inputStyles";

const breakpoints = {
  ss: "20em",
  sm: "30em",
  sl: "36em",
  md: "48em",
  lg: "62em",
  xl: "80em",
  "2xl": "96em",
};

export const myNewTheme = extendTheme({
  colors: {
    // primary: "rgba(29, 53, 87, 1)",
    primary: "#ED7A13",
    primaryGelap: "#DF4B0F",
    oren: "rgba(235, 92, 24, 1)",
    ungu: "rgba(73, 79, 171, 1)",
    secondary: {
      light: "rgb(248 250 252)",
      dark: "black.900",
    },
    danger: "rgba(198, 46, 46, 1)",
    gelap: "rgba(38, 38, 38, 1)",
    terang: "rgba(248, 250, 252, 1)",
    background: "rgba(248, 250, 252, 1)",
    aset: "rgba(0, 125, 226, 1)",
    // Warna untuk fitur Pegawai - Merah Profesional untuk Kepegawaian
    // Merah yang lebih dalam dan elegan, cocok untuk HR/People Management
    pegawai: "rgba(185, 28, 28, 1)", // Merah profesional (Red-700) - Lebih dalam dan elegan
    pegawaiGelap: "rgba(153, 27, 27, 1)", // Merah gelap (Red-800) - Untuk hover dan accent
    perencanaan: "rgba(235, 106, 63,1)",
    kpbpn: "rgb(89.02% 35.29% 6.27%)",
  },

  config: {
    initialColorMode: "light",
    useSystemColorMode: false,
  },

  styles: {
    global: (props) => ({
      body: {
        bg: props.colorMode === "dark" ? "gray.900" : "background",
        color: props.colorMode === "dark" ? "white" : "gray.800",
      },
      ".chakra-card": {
        bg: props.colorMode === "dark" ? "gray.800" : "white",
      },
      ".chakra-input": {
        bg: props.colorMode === "dark" ? "gray.700" : "white",
      },
      ".chakra-select": {
        bg: props.colorMode === "dark" ? "gray.700" : "white",
      },
      ".chakra-textarea": {
        bg: props.colorMode === "dark" ? "gray.700" : "white",
      },
      ".chakra-modal__content": {
        bg: props.colorMode === "dark" ? "gray.800" : "white",
      },
      ".chakra-menu__menu-list": {
        bg: props.colorMode === "dark" ? "gray.800" : "white",
      },
      ".chakra-accordion__button": {
        bg: props.colorMode === "dark" ? "gray.800" : "white",
        _hover: {
          bg: props.colorMode === "dark" ? "gray.700" : "gray.100",
        },
      },
      ".chakra-accordion__panel": {
        bg: props.colorMode === "dark" ? "gray.800" : "white",
      },
    }),
  },

  components: {
    Button,
    Table,
    Select2,
    Container,
    Input,
  },

  breakpoints: { ...breakpoints },
  //   fonts: {
  //     heading: `Work Sans`,
  //     body: `Work Sans`,
  //   },
});
