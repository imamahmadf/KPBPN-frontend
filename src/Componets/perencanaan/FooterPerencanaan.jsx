import React, { useState, useEffect } from "react";
import {
  Box,
  Text,
  Container,
  FormControl,
  FormLabel,
  Center,
  HStack,
  Table,
  SimpleGrid,
  Flex,
  Spacer,
  Divider,
  Image,
} from "@chakra-ui/react";
import { BsGeoAltFill } from "react-icons/bs";
import { BsEnvelopeAtFill } from "react-icons/bs";
import { BsInstagram } from "react-icons/bs";
import LogoPutih from "../../assets/logo-putih.png";

function FooterPerencanaan() {
  return (
    <>
      <Box bgColor={"perencanaan"} zIndex={1001}>
        <Container py={"50px"} maxW={"1280px"}>
          {/* <Image w={"350px"} src={LogoPutih} /> */}
          <Box color={"white"} mt={"60px"}>
            <SimpleGrid columns={3} minChildWidth="200px">
              <Flex>
                <BsGeoAltFill fontSize={"30px"} />
                <Box ms={"10px"}>
                  <Text
                    fontSize={"18px"}
                    fontWeight={700}
                    width={"150px"}
                    me={"10px"}
                  >
                    ALamat:
                  </Text>
                  <Text fontSize={"14px"} fontWeight={300} me={"10px"}>
                    Komplek Perkantoran Jl. Kusuma Bangsa KM. 05 Gedung A. Lt.2
                    Kav. 1 Kav.1,Tanah Grogot,Paser,Kalimantan Timur 76251
                  </Text>
                </Box>
              </Flex>{" "}
              <Flex>
                <BsEnvelopeAtFill fontSize={"30px"} />
                <Box ms={"10px"}>
                  <Text
                    fontSize={"18px"}
                    fontWeight={700}
                    width={"150px"}
                    me={"10px"}
                  >
                    Email:
                  </Text>
                  <Text fontSize={"14px"} fontWeight={300} me={"10px"}>
                    dinkespaser.kaltim@gmail.com
                  </Text>
                </Box>
              </Flex>{" "}
              <Flex>
                <BsInstagram fontSize={"30px"} />
                <Box ms={"10px"}>
                  <Text
                    fontSize={"18px"}
                    fontWeight={700}
                    width={"150px"}
                    me={"10px"}
                  >
                    Instagram:
                  </Text>
                  <Text fontSize={"14px"} fontWeight={300} me={"10px"}>
                    dinkespaserkab
                  </Text>
                </Box>
              </Flex>
            </SimpleGrid>
          </Box>
          <Box mt={"20px"} ps={"10px"}>
            <Text
              fontSize={"18px"}
              fontWeight={700}
              width={"150px"}
              me={"10px"}
              color={"white"}
            >
              Menu:
            </Text>{" "}
            <Divider mt={"10px"} mb={"10px"} />
          </Box>
          {/* <SimpleGrid color={"white"} mt={"5px"} minChildWidth="350px">
            {menuFooter.map((val) => {
              return (
                <HStack
                  borderRadius={"5px"}
                  w={"100%"}
                  p={"10px"}
                  as="button"
                  key={val.menu}
                  fontSize={"15px"}
                  my={"5px"}
                  onClick={() => {
                    history.push(val.URL);
                  }}
                >
                  <Text
                    align={"left"}
                    fontSize={"18px"}
                    width={"150px"}
                    me={"10px"}
                  >
                    {val.menu}
                  </Text>
                </HStack>
              );
            })}
          </SimpleGrid> */}
        </Container>
      </Box>
      <Box
        borderTop={"1px"}
        borderColor={"white"}
        py={"20px"}
        bgColor={"gelap"}
        color={"white"}
      >
        <Container>
          <Center>
            Copyright © 2025 Imam Ahmad Fahrurazi. All Right Reserved
          </Center>
        </Container>
      </Box>
    </>
  );
}

export default FooterPerencanaan;
