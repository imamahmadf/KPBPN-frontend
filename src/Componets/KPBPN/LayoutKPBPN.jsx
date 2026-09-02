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

function LayoutAset({ children, hideFooter = false }) {
  const isAuthenticated =
    useSelector(selectIsAuthenticated) || localStorage.getItem("token");
  return (
    <Box>
      <Box
        bgColor={"secondary"}
        minH={hideFooter ? "100vh" : "75vh"}
        // ms={isAuthenticated ? "250px" : "0"}
        pt={isAuthenticated ? "80px" : "0"}
      >
        <NavbarKPBPN />
        {children}
        {!hideFooter && <FooterKPBPN />}
      </Box>
    </Box>
  );
}

export default LayoutAset;
