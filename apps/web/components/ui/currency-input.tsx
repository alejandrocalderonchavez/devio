"use client";

import React, { useState, useEffect } from "react";

export interface CurrencyInputProps {
  id?: string;
  name?: string;
  value: number | string;
  onChange: (value: number) => void;
  currencySymbol?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  style?: React.CSSProperties;
  inputStyle?: React.CSSProperties;
  allowDecimals?: boolean;
}

export default function CurrencyInput({
  id,
  name,
  value,
  onChange,
  currencySymbol = "$",
  placeholder = "0.00",
  disabled = false,
  required = false,
  className = "",
  style,
  inputStyle,
  allowDecimals = true,
}: CurrencyInputProps) {
  const formatNumberWithCommas = (num: number | string): string => {
    if (num === "" || num === undefined || num === null || isNaN(Number(num))) {
      return "";
    }
    const numVal = Number(num);
    // If integer, no decimals; if decimal, keep up to 2 decimals
    const parts = numVal.toString().split(".");
    const integerPart = (parts[0] || "0").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    if (parts.length > 1) {
      return `${integerPart}.${parts[1]!.slice(0, 2)}`;
    }
    return integerPart;
  };

  const [displayValue, setDisplayValue] = useState<string>(
    value !== undefined && value !== null && value !== "" ? formatNumberWithCommas(value) : ""
  );
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      if (value !== undefined && value !== null && value !== "") {
        setDisplayValue(formatNumberWithCommas(value));
      } else {
        setDisplayValue("");
      }
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value;
    // Remove everything except numbers and decimal point
    const cleaned = inputVal.replace(/[^0-9.]/g, "");
    
    // Prevent multiple decimal points
    const parts = cleaned.split(".");
    let validCleaned = parts[0] || "";
    if (allowDecimals && parts.length > 1) {
      validCleaned += "." + parts.slice(1).join("").slice(0, 2);
    }

    if (validCleaned === "" || validCleaned === ".") {
      setDisplayValue(validCleaned);
      onChange(0);
      return;
    }

    const numericVal = parseFloat(validCleaned);
    if (!isNaN(numericVal)) {
      // Format the integer part with commas as user types
      const cleanParts = validCleaned.split(".");
      const formattedInt = (cleanParts[0] || "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      const finalDisplay = cleanParts.length > 1 ? `${formattedInt}.${cleanParts[1]}` : formattedInt;
      
      setDisplayValue(finalDisplay);
      onChange(numericVal);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (value !== undefined && value !== null && value !== "") {
      setDisplayValue(formatNumberWithCommas(value));
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        position: "relative",
        borderRadius: "0.4rem",
        border: "1px solid var(--devio-neutral-2, #CBD5E1)",
        backgroundColor: disabled ? "#F8FAFC" : "#FFFFFF",
        transition: "border-color 0.15s ease, box-shadow 0.15s ease",
        ...style,
      }}
      className={className}
    >
      <span
        style={{
          paddingLeft: "0.5rem",
          paddingRight: "0.15rem",
          fontSize: "0.82rem",
          fontWeight: 700,
          color: "var(--devio-neutral-4, #64748B)",
          userSelect: "none",
        }}
      >
        {currencySymbol}
      </span>
      <input
        id={id}
        name={name}
        type="text"
        inputMode="decimal"
        disabled={disabled}
        required={required}
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "0.3rem 0.5rem 0.3rem 0.15rem",
          border: "none",
          outline: "none",
          backgroundColor: "transparent",
          fontSize: "0.82rem",
          fontWeight: 700,
          color: "var(--devio-blue-dark, #1F3652)",
          textAlign: "right",
          ...inputStyle,
        }}
      />
    </div>
  );
}
