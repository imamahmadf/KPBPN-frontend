import React, { useState } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  FormControl,
  FormLabel,
  FormErrorMessage,
  Box,
  useColorModeValue,
} from "@chakra-ui/react";
import { id } from "date-fns/locale";
import { format } from "date-fns";

registerLocale("id", id);

const DateRangePicker = ({
  label = "Rentang Tanggal",
  startDate,
  endDate,
  onChange,
  isInvalid = false,
  errorMessage = "",
  placeholder = "Pilih rentang tanggal",
  height = "60px",
  bgColor = "terang",
  ...props
}) => {
  const [startDateValue, setStartDateValue] = useState(
    startDate ? new Date(startDate) : null
  );
  const [endDateValue, setEndDateValue] = useState(
    endDate ? new Date(endDate) : null
  );

  const bgColorValue = useColorModeValue("#F7FAFC", "#2D3748");
  const borderColor = useColorModeValue("#E2E8F0", "#4A5568");
  const focusBorderColor = useColorModeValue("#E53E3E", "#FC8181");

  const handleDateChange = (dates) => {
    const [start, end] = dates;
    setStartDateValue(start);
    setEndDateValue(end);

    if (onChange) {
      onChange({
        startDate: start ? start.toISOString().split("T")[0] : "",
        endDate: end ? end.toISOString().split("T")[0] : "",
      });
    }
  };

  // Update state when props change
  React.useEffect(() => {
    if (startDate) {
      setStartDateValue(new Date(startDate));
    } else {
      setStartDateValue(null);
    }
  }, [startDate]);

  React.useEffect(() => {
    if (endDate) {
      setEndDateValue(new Date(endDate));
    } else {
      setEndDateValue(null);
    }
  }, [endDate]);

  // Format display text
  const getDisplayText = () => {
    if (startDateValue && endDateValue) {
      return `${format(startDateValue, "dd/MM/yyyy")} - ${format(
        endDateValue,
        "dd/MM/yyyy"
      )}`;
    } else if (startDateValue) {
      return `${format(startDateValue, "dd/MM/yyyy")} - ...`;
    }
    return placeholder;
  };

  return (
    <FormControl isInvalid={isInvalid} {...props}>
      {label && (
        <FormLabel fontSize={"20px"} fontWeight={"500"} mb={"10px"}>
          {label}
        </FormLabel>
      )}
      <Box>
        <DatePicker
          selected={startDateValue}
          onChange={handleDateChange}
          startDate={startDateValue}
          endDate={endDateValue}
          selectsRange
          locale="id"
          dateFormat="dd/MM/yyyy"
          placeholderText={placeholder}
          wrapperClassName="date-picker-wrapper"
          customInput={
            <input
              value={getDisplayText()}
              readOnly
              style={{
                width: "100%",
                height: height,
                backgroundColor: bgColorValue,
                border: "1px solid",
                borderColor: borderColor,
                borderRadius: "6px",
                padding: "0 16px",
                fontSize: "16px",
                cursor: "pointer",
              }}
            />
          }
        />
      </Box>
      {isInvalid && errorMessage && (
        <FormErrorMessage>{errorMessage}</FormErrorMessage>
      )}
      <style>{`
        .date-picker-wrapper {
          width: 100%;
        }
        .react-datepicker-wrapper {
          width: 100%;
        }
        .react-datepicker__input-container input:focus {
          outline: 2px solid ${focusBorderColor} !important;
          outline-offset: 0 !important;
          border-color: ${focusBorderColor} !important;
        }
        .react-datepicker__input-container input:hover {
          border-color: ${focusBorderColor} !important;
        }
      `}</style>
    </FormControl>
  );
};

export default DateRangePicker;
