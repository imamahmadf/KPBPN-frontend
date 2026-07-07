import { useColorModeValue } from "@chakra-ui/react";

/**
 * Hook untuk mendapatkan color mode values yang digunakan di mobile drawer dan komponen lainnya
 * @returns {Object} Object berisi semua color mode values
 */
export const useColorModeValues = () => {
  return {
    // Background colors
    drawerBg: useColorModeValue("gray.50", "gray.800"),
    boxBg: useColorModeValue("white", "gray.700"),
    accordionPanelBg: useColorModeValue("gray.50", "gray.750"),

    // Text colors
    textColor: useColorModeValue("gray.700", "gray.200"),
    textColorLight: useColorModeValue("gray.500", "gray.400"),

    // Border colors
    borderColor: useColorModeValue("gray.200", "gray.600"),
    borderColorLight: useColorModeValue("gray.100", "gray.700"),
    borderColorDark: useColorModeValue("gray.300", "gray.600"),

    // Hover colors
    hoverBg: useColorModeValue("gray.50", "gray.600"),
    hoverBgWhite: useColorModeValue("white", "gray.600"),

    // Shadow
    footerBoxShadow: useColorModeValue(
      "0 -4px 6px -1px rgba(0, 0, 0, 0.1)",
      "0 -4px 6px -1px rgba(0, 0, 0, 0.3)"
    ),
  };
};
