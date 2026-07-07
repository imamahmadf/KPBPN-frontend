import { Center, Spinner, Image, Flex, Text, Box } from "@chakra-ui/react";
// import LogoAPP from "../assets/logo app.png";
import LogoPena from "../assets/Logo Pena.png";
import LogoKPBPN from "../assets/Logo-KPBPN.png";
function Loading() {
  return (
    <Box>
      <Center h="100vh" flexDirection="column">
        <Image mb="20px" h="200px" src={LogoKPBPN} alt="Logo Pena" />
        <Flex>
          <Text h={"120px"} me="10px">
            Loading ...
          </Text>
          <Spinner color="primary" />
        </Flex>
      </Center>
    </Box>
  );
}

export default Loading;
