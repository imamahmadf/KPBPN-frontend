import React from "react";
import { Box, Container } from "@chakra-ui/react";
import NavbarPegawai from "./NavbarPegawai";
import FooterPegawai from "./FooterPegawai";
import {
  selectIsAuthenticated,
  userRedux,
  selectRole,
} from "../../Redux/Reducers/auth";
import { useSelector } from "react-redux";

function LayoutPegawai({ children }) {
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
        <NavbarPegawai />
        {children}
        <FooterPegawai />
      </Box>
    </Box>
  );
}

export default LayoutPegawai;
