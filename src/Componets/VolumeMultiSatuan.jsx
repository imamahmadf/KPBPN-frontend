import React from "react";
import { Text, VStack } from "@chakra-ui/react";
import { getVolumeAllSatuanLines } from "../lib/volumeSatuan";

const VolumeMultiSatuan = ({ volume, satuan, fontSize = "xs", align = "start" }) => {
  const lines = getVolumeAllSatuanLines(volume, satuan);

  if (!lines) {
    return <Text fontSize={fontSize}>-</Text>;
  }

  return (
    <VStack align={align} spacing={0}>
      {lines.map(({ key, label }) => (
        <Text key={key} fontSize={fontSize} whiteSpace="nowrap">
          {label}
        </Text>
      ))}
    </VStack>
  );
};

export default VolumeMultiSatuan;
