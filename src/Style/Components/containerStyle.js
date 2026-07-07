export const containerStyle = {
  variants: {
    primary: (props) => ({
      bgColor: props.colorMode === "dark" ? "gray.800" : "white",
      boxShadow: "sm",
    }),
  },
};
