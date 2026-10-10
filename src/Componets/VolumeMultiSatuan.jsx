import React from "react";
import { Text, VStack } from "@chakra-ui/react";
import {
  getVolumeAllSatuanLines,
  normalizeSatuan,
} from "../lib/volumeSatuan";

const VolumeMultiSatuan = ({
  volume,
  satuan,
  fontSize = "xs",
  align = "start",
  primarySatuan,
}) => {
  const lines = getVolumeAllSatuanLines(volume, satuan);

  if (!lines) {
    return <Text fontSize={fontSize}>-</Text>;
  }

  const primary = primarySatuan ? normalizeSatuan(primarySatuan) : null;
  const ordered = primary
    ? [
        ...lines.filter((line) => line.key === primary),
        ...lines.filter((line) => line.key !== primary),
      ]
    : lines;

  return (
    <VStack align={align} spacing={0}>
      {ordered.map(({ key, label }) => {
        const isPrimary = primary && key === primary;
        return (
          <Text
            key={key}
            fontSize={isPrimary ? "md" : primary ? "xs" : fontSize}
            fontWeight={isPrimary ? "semibold" : "normal"}
            color={isPrimary ? "gray.800" : primary ? "gray.500" : undefined}
            lineHeight="short"
            whiteSpace="nowrap"
          >
            {label}
          </Text>
        );
      })}
    </VStack>
  );
};

export default VolumeMultiSatuan;
