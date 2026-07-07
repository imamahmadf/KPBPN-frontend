import React from "react";
import { Box, Container } from "@chakra-ui/react";
import NavbarKPBPN from "../Navbar";
import FooterKPBPN from "./FooterKPBPN";
import {
  selectIsAuthenticated,
  userRedux,
  selectRole,
} from "../../Redux/Reducers/auth";
import { useSelector } from "react-redux";

function LayoutAset({ children }) {
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
        <NavbarKPBPN />
        {children}
        <FooterKPBPN />
      </Box>
    </Box>
  );
}

export default LayoutAset;
