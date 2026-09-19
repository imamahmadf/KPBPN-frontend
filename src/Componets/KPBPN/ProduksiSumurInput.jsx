import React from "react";
import {
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useBreakpointValue,
} from "@chakra-ui/react";
import VolumeMultiSatuan from "../VolumeMultiSatuan";
import { getVolumeAllSatuanLines } from "../../lib/volumeSatuan";

export const VolumeSummary = ({ volume, satuan, compact }) => {
  if (compact) {
    const lines = getVolumeAllSatuanLines(volume, satuan);
    return (
      <Text
        fontSize="sm"
        fontWeight="semibold"
        noOfLines={2}
        wordBreak="break-word"
      >
        {lines?.[0]?.label || "-"}
      </Text>
    );
  }

  return <VolumeMultiSatuan volume={volume} satuan={satuan} fontSize="sm" />;
};

const InfoField = ({ label, children }) => (
  <Box minW={0}>
    <Text
      fontSize="xs"
      color="gray.500"
      fontWeight="semibold"
      textTransform="uppercase"
      letterSpacing="wide"
      mb={0.5}
    >
      {label}
    </Text>
    <Box fontSize="sm" color="gray.700" wordBreak="break-word">
      {children}
    </Box>
  </Box>
);

export const ProduksiStickyBar = ({
  totalProduksiInput,
  produksiSatuanLabel,
  acuanVolume,
  acuanSatuan = "barrel",
  acuanLabel = "Produksi BAK3S",
  comparison,
  statusHintOver = "Total produksi tidak boleh lebih dari produksi BAK3S",
  statusHintUnder = "Total produksi masih kurang dari acuan, data tetap bisa disimpan",
  satuanVolumeId,
  satuanVolumeOptions = [],
  onSatuanChange,
  isEditing,
  saving,
  canSave,
  onEdit,
  onCancel,
  onSave,
  showEditButton = true,
  showSaveButton = true,
}) => {
  const isCompact = useBreakpointValue({ base: true, lg: false }) ?? true;

  const statusLabel =
    comparison === "over"
      ? "Melebihi acuan"
      : comparison === "equal"
        ? "Sudah cocok"
        : "Kurang dari acuan";
  const statusColor =
    comparison === "over" ? "red" : comparison === "equal" ? "green" : "orange";
  const statusHint =
    comparison === "over"
      ? statusHintOver
      : comparison === "under"
        ? statusHintUnder
        : "";

  return (
    <Box
      position="sticky"
      top="64px"
      zIndex={20}
      bg="white"
      borderWidth="1px"
      borderRadius="md"
      p={{ base: 3, md: 4 }}
      mb={4}
      boxShadow="md"
      maxW="100%"
      minW={0}
    >
      <Stack spacing={{ base: 3, lg: 4 }}>
        <Flex
          justify="space-between"
          align={{ base: "start", sm: "center" }}
          gap={2}
          wrap="wrap"
        >
          <Badge
            colorScheme={statusColor}
            fontSize={{ base: "xs", md: "sm" }}
            px={2}
            py={1}
          >
            {statusLabel}
          </Badge>
          {statusHint && (
            <Text
              fontSize="xs"
              color={comparison === "over" ? "red.500" : "orange.500"}
              flex="1"
              minW="160px"
            >
              {statusHint}
            </Text>
          )}
        </Flex>

        <Flex
          align={{ base: "stretch", lg: "center" }}
          direction={{ base: "column", lg: "row" }}
          gap={{ base: 3, lg: 4 }}
          justify="space-between"
        >
          <SimpleGrid
            columns={2}
            spacing={{ base: 3, md: 6 }}
            flex="1"
            minW={0}
            maxW={{ lg: "520px" }}
          >
            <Box minW={0}>
              <Text
                fontSize="xs"
                color="gray.500"
                fontWeight="semibold"
                textTransform="uppercase"
                letterSpacing="wide"
                mb={1}
              >
                Total Produksi
              </Text>
              <VolumeSummary
                volume={totalProduksiInput}
                satuan={produksiSatuanLabel}
                compact={isCompact}
              />
            </Box>
            <Box minW={0}>
              <Text
                fontSize="xs"
                color="gray.500"
                fontWeight="semibold"
                textTransform="uppercase"
                letterSpacing="wide"
                mb={1}
              >
                {acuanLabel}
              </Text>
              <VolumeSummary
                volume={acuanVolume}
                satuan={acuanSatuan}
                compact={isCompact}
              />
            </Box>
          </SimpleGrid>

          <Flex
            direction={{ base: "column", sm: "row" }}
            align={{ base: "stretch", sm: "end" }}
            gap={3}
            flexShrink={0}
            w={{ base: "full", lg: "auto" }}
          >
            <FormControl
              w={{ base: "full", sm: "auto" }}
              minW={{ sm: "160px" }}
              flex={{ sm: "1", lg: "0 0 180px" }}
            >
              <FormLabel
                fontSize="xs"
                color="gray.500"
                fontWeight="semibold"
                textTransform="uppercase"
                letterSpacing="wide"
                mb={1}
              >
                Satuan Produksi
              </FormLabel>
              {isEditing ? (
                <Select
                  size="sm"
                  bg="white"
                  value={satuanVolumeId || ""}
                  onChange={onSatuanChange}
                >
                  <option value="">Pilih satuan</option>
                  {satuanVolumeOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.satuan || `Satuan #${opt.id}`}
                    </option>
                  ))}
                </Select>
              ) : (
                <Text fontSize="sm" fontWeight="medium" py={1}>
                  {produksiSatuanLabel}
                </Text>
              )}
            </FormControl>
            {showEditButton &&
              (isEditing ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCancel}
                  isDisabled={saving}
                  w={{ base: "full", sm: "auto" }}
                  flexShrink={0}
                >
                  Batal
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onEdit}
                  w={{ base: "full", sm: "auto" }}
                  flexShrink={0}
                >
                  Edit Produksi
                </Button>
              ))}
            {showSaveButton && (
              <Button
                variant="primary"
                size="sm"
                isLoading={saving}
                isDisabled={!canSave}
                onClick={onSave}
                w={{ base: "full", sm: "auto" }}
                flexShrink={0}
              >
                Simpan Produksi
              </Button>
            )}
          </Flex>
        </Flex>
      </Stack>
    </Box>
  );
};

export const ProduksiSumurList = ({
  sumurList = [],
  inputs = {},
  isEditing,
  produksiSatuanLabel,
  showMitraColumn = false,
  onInputChange,
}) => {
  const renderProduksiValue = (sumur, compact) => {
    if (isEditing) {
      return (
        <Input
          type="number"
          min={0}
          step="0.001"
          size="sm"
          bg="white"
          w={compact ? "100%" : { lg: "120px", xl: "140px" }}
          maxW="100%"
          ml={compact ? 0 : "auto"}
          value={inputs[sumur.id] ?? ""}
          onChange={(e) => onInputChange(sumur.id, e.target.value)}
          placeholder="0"
        />
      );
    }

    if (
      inputs[sumur.id] !== "" &&
      inputs[sumur.id] != null &&
      Number(inputs[sumur.id]) > 0
    ) {
      return compact ? (
        <VolumeSummary
          volume={inputs[sumur.id]}
          satuan={produksiSatuanLabel}
          compact
        />
      ) : (
        <VolumeMultiSatuan
          volume={inputs[sumur.id]}
          satuan={produksiSatuanLabel}
        />
      );
    }

    return "-";
  };

  return (
    <>
      <Stack spacing={3} display={{ base: "flex", lg: "none" }}>
        {sumurList.map((sumur, index) => (
          <Box
            key={sumur.id}
            p={3}
            borderWidth="1px"
            borderRadius="md"
            bg="white"
            minW={0}
          >
            <HStack justify="space-between" mb={3} align="start" spacing={3}>
              <Text
                fontWeight="bold"
                color="kpbpn"
                fontSize="sm"
                wordBreak="break-word"
                minW={0}
              >
                {sumur.nama || "-"}
              </Text>
              <Text fontSize="xs" color="gray.500" flexShrink={0}>
                No. {index + 1}
              </Text>
            </HStack>
            <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
              {showMitraColumn && (
                <InfoField label="Mitra">{sumur.mitra?.nama || "-"}</InfoField>
              )}
              <InfoField label="Nomor Sumur">{sumur.nomor || "-"}</InfoField>
              <Box gridColumn={{ sm: showMitraColumn ? "span 2" : "auto" }}>
                <InfoField label={`Produksi (${produksiSatuanLabel})`}>
                  {renderProduksiValue(sumur, true)}
                </InfoField>
              </Box>
            </SimpleGrid>
          </Box>
        ))}
      </Stack>

      <Box
        display={{ base: "none", lg: "block" }}
        overflowX="auto"
        borderWidth="1px"
        borderRadius="md"
        bg="white"
        maxW="100%"
      >
        <Table variant="simple" size="sm" minW="560px">
          <Thead bg="white">
            <Tr>
              <Th textTransform="capitalize">No.</Th>
              {showMitraColumn && <Th textTransform="capitalize">Mitra</Th>}
              <Th textTransform="capitalize">Sumur</Th>
              <Th textTransform="capitalize">Nomor Sumur</Th>
              <Th textTransform="capitalize" isNumeric>
                Produksi ({produksiSatuanLabel})
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {sumurList.map((sumur, index) => (
              <Tr key={sumur.id}>
                <Td>{index + 1}</Td>
                {showMitraColumn && (
                  <Td>
                    <Text noOfLines={2}>{sumur.mitra?.nama || "-"}</Text>
                  </Td>
                )}
                <Td>
                  <Text noOfLines={2}>{sumur.nama || "-"}</Text>
                </Td>
                <Td>{sumur.nomor || "-"}</Td>
                <Td isNumeric>{renderProduksiValue(sumur, false)}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </>
  );
};
