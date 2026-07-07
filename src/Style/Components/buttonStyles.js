export const buttonStyles = {
  variants: {
    primary: {
      bgGradient:
        "linear-gradient(0deg, #124370 0%, #1368B9 100%)",
      color: "white",
      borderRadius: "5px",
      px: "30px",
      height: "40px",
      fontSize: "16px",
      fontWeight: "600",
      transition: "all 0.8s cubic-bezier(0.25, 0.1, 0.25, 1)",
      _hover: {
        bgGradient:
          "linear-gradient(0deg, #124370 0%, #124370 100%)",
        transform: "translateY(-2px)",
        boxShadow: "md",
      },
    },
    cancle: {
      bg: "oren",
      color: "white",
      borderRadius: "5px",

      fontSize: "16px",
      fontWeight: "600",
      transition: "all 0.8s cubic-bezier(0.25, 0.1, 0.25, 1)",
      _hover: {
        bg: "rgb(217,57,19)",

        borderColor: "white",
        transform: "translateY(-2px)",
        boxShadow: "md",
      },
    },
    secondary: {
      bgGradient:
        "linear-gradient(0deg,rgba(203, 250, 234, 1) 0%, rgba(203, 250, 234, 1) 100%);",
      color: "primary",
      borderRadius: "5px",
      border: "2px",
      borderColor: "primary",
      fontSize: "16px",
      fontWeight: "600",
      transition: "all 0.8s cubic-bezier(0.25, 0.1, 0.25, 1)",
      _hover: {
        bgGradient:
          "radial-gradient(circle,rgba(55, 176, 134, 1) 0%, rgba(19, 122, 106, 1) 100%)",
        color: "white",
        borderColor: "white",
      },
    },
  },
};
