export const inputStyles = {
  variants: {
    primary: {
      bgColor: "primary",
      border: "none",
      borderRadius: "6px",
      padding: "0 20px",
      width: "100%",
      fontSize: "16px",
      transition: "all 0.8s cubic-bezier(0.25, 0.1, 0.25, 1)",
      _hover: {
        borderColor: "yellow.700",
        transform: "translateY(-2px)",
        boxShadow: "md",
      },
      _focus: {
        borderColor: "primary",
        boxShadow: "none",
      },
      _placeholder: {
        color: "gray.500",
      },
    },

    select: {
      container: (provided) => ({
        ...provided,
        borderRadius: "6px",
      }),
      control: (provided) => ({
        ...provided,
        backgroundColor: "terang",
        border: "0px",
        height: "60px",
        transition: "all 0.8s cubic-bezier(0.25, 0.1, 0.25, 1)",
        _hover: {
          borderColor: "yellow.700",
          transform: "translateY(-2px)",
          boxShadow: "md",
        },
        minHeight: "40px",
      }),
      option: (provided, state) => ({
        ...provided,
        bg: state.isFocused ? "primary" : "white",
        color: state.isFocused ? "white" : "black",
      }),
    },
    textarea: {
      backgroundColor: "terang",
      padding: "20px",
      minHeight: "160px",
      borderRadius: "6px",
      border: "none",
      width: "100%",
      fontSize: "16px",
      transition: "all 0.8s cubic-bezier(0.25, 0.1, 0.25, 1)",
      _hover: {
        borderColor: "yellow.700",
        transform: "translateY(-2px)",
        boxShadow: "md",
      },
      _focus: {
        borderColor: "primary",
        boxShadow: "none",
      },
      _placeholder: {
        color: "gray.500",
      },
    },
  },
};
