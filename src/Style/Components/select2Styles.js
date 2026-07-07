// Helper function untuk mendapatkan chakraStyles Select2 dengan dark mode support
export const getSelect2Styles = (colorMode, options = {}) => {
  const {
    height = "32px",
    focusColor = colorMode === "dark" ? "pegawai" : "primary",
    hoverColor = colorMode === "dark" ? "gray.500" : "primary",
    backgroundColor = colorMode === "dark" ? "gray.700" : "white",
  } = options;

  return {
    container: (provided) => ({
      ...provided,
      borderRadius: "6px",
    }),
    control: (provided) => ({
      ...provided,
      backgroundColor: backgroundColor,
      color: colorMode === "dark" ? "white" : "gray.800",
      textTransform: "none",
      border: "1px solid",
      borderColor: colorMode === "dark" ? "gray.600" : "gray.200",
      height: height,
      _hover: {
        borderColor: hoverColor,
      },
      minHeight: height,
    }),
    menuList: (provided) => ({
      ...provided,
      bg: colorMode === "dark" ? "gray.800" : "white",
      border: "1px solid",
      borderColor: colorMode === "dark" ? "gray.700" : "gray.200",
    }),
    option: (provided, state) => ({
      ...provided,
      bg: state.isFocused
        ? colorMode === "dark"
          ? "gray.700"
          : "pegawai"
        : colorMode === "dark"
        ? "gray.800"
        : "white",
      color: state.isFocused
        ? "white"
        : colorMode === "dark"
        ? "white"
        : "gray.800",
      textTransform: "none",
      _hover: {
        bg: colorMode === "dark" ? "gray.700" : "pegawai",
        color: "white",
      },
    }),
    singleValue: (provided) => ({
      ...provided,
      color: colorMode === "dark" ? "white" : "gray.800",
    }),
    placeholder: (provided) => ({
      ...provided,
      color: colorMode === "dark" ? "gray.400" : "gray.500",
    }),
  };
};

// Helper function untuk mendapatkan components Select2 (tanpa dropdown indicator)
export const getSelect2Components = () => ({
  DropdownIndicator: () => null,
  IndicatorSeparator: () => null,
});

// Helper function untuk mendapatkan focusBorderColor berdasarkan colorMode
export const getSelect2FocusColor = (colorMode) =>
  colorMode === "dark" ? "pegawai" : "primary";

// Base styles untuk backward compatibility
export const select2Styles = {
  baseStyle: {
    chakraStyles: {
      container: (provided) => ({
        ...provided,
        borderRadius: "6px",
      }),
      control: (provided) => ({
        ...provided,
        backgroundColor: "terang",
        border: "0px",
        height: "60px",
        _hover: {
          borderColor: "yellow.700",
        },
        minHeight: "40px",
      }),
      option: (provided, state) => ({
        ...provided,
        bg: state.isFocused ? "primary" : "white",
        color: state.isFocused ? "white" : "black",
      }),
    },
    components: {
      DropdownIndicator: () => null,
      IndicatorSeparator: () => null,
    },
  },
  variants: {
    primary: {
      chakraStyles: {
        container: (provided) => ({
          ...provided,
          borderRadius: "6px",
        }),
        control: (provided) => ({
          ...provided,
          backgroundColor: "terang",
          border: "0px",
          height: "60px",
          _hover: {
            borderColor: "yellow.700",
          },
          minHeight: "40px",
        }),
        option: (provided, state) => ({
          ...provided,
          bg: state.isFocused ? "primary" : "white",
          color: state.isFocused ? "white" : "black",
        }),
      },
      components: {
        DropdownIndicator: () => null,
        IndicatorSeparator: () => null,
      },
    },
  },
  defaultProps: {
    variant: "primary",
  },
};
