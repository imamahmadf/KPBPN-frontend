import {
  Box,
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from "@chakra-ui/react";

function ModalPratinjauPengajuan({
  preview,
  onClose,
  onUnduhPdf,
  onUnduhWord,
  isLoadingWord,
}) {
  return (
    <Modal
      isOpen={Boolean(preview)}
      onClose={onClose}
      size="6xl"
      scrollBehavior="inside"
    >
      <ModalOverlay />
      <ModalContent h={{ base: "100dvh", md: "88vh" }} my={{ base: 0, md: 8 }}>
        <ModalHeader pr={12}>Pratinjau Pengajuan</ModalHeader>
        <ModalCloseButton />
        <ModalBody display="flex" flex="1" flexDir="column" minH={0} overflow="hidden">
          {preview?.url && (
            <Box
              as="iframe"
              title="Pratinjau pengajuan"
              src={preview.url}
              flex="1"
              w="full"
              minH="65vh"
              borderWidth="1px"
              borderRadius="md"
            />
          )}
        </ModalBody>
        <ModalFooter
          flexDir={{ base: "column-reverse", sm: "row" }}
          gap={2}
          px={{ base: 4, md: 6 }}
        >
          <Button variant="outline" w={{ base: "full", sm: "auto" }} onClick={onClose}>
            Tutup
          </Button>
          <Button
            variant="outline"
            w={{ base: "full", sm: "auto" }}
            onClick={onUnduhWord}
            isLoading={isLoadingWord}
          >
            Unduh Word
          </Button>
          <Button
            colorScheme="orange"
            w={{ base: "full", sm: "auto" }}
            onClick={onUnduhPdf}
          >
            Unduh PDF
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default ModalPratinjauPengajuan;
