import React from "react";
import { Box, Container } from "@chakra-ui/react";
import NavbarPerencanaan from "./NavbarPerencanaan";
import FooterPerencanaan from "./FooterPerencanaan";
import {
  selectIsAuthenticated,
  userRedux,
  selectRole,
} from "../../Redux/Reducers/auth";
import { useSelector } from "react-redux";

function LayoutPerencanaan({ children }) {
  const isAuthenticated =
    useSelector(selectIsAuthenticated) || localStorage.getItem("token");
  return (
    <Box>
      <Box
        bgColor={"secondary"}
        minH={"75vh"}
        // ms={isAuthenticated ? "250px" : "0"}
        pt={isAuthenticated ? "80px" : "0"}
      >
        <NavbarPerencanaan />
        {children}
        <FooterPerencanaan />
      </Box>
    </Box>
  );
}

export default LayoutPerencanaan;
