"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { ChevronDown, Search, Phone, Check } from "lucide-react";
import { COUNTRIES_DIAL_CODES, CountryDialCode } from "../../data/countries-dial-codes";

export interface PhoneInputValue {
  countryCode: string;
  number: string;
  formatted: string;
}

export interface PhoneInputProps {
  id?: string;
  name?: string;
  label?: string;
  value?: string; // full phone or number
  countryCode?: string; // e.g. "+52"
  phoneNumber?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  style?: React.CSSProperties;
  inputStyle?: React.CSSProperties;
  selectStyle?: React.CSSProperties;
  onChange?: (combinedValue: string, countryCode: string, localNumber: string) => void;
  onPhoneChange?: (localNumber: string) => void;
  onCountryChange?: (countryCode: string) => void;
}

export default function PhoneInput({
  id,
  name,
  label,
  value,
  countryCode = "+52",
  phoneNumber,
  placeholder,
  disabled = false,
  required = false,
  error,
  hint,
  className = "",
  style,
  inputStyle,
  selectStyle,
  onChange,
  onPhoneChange,
  onCountryChange,
}: PhoneInputProps) {
  // Parse incoming value if provided as full string (e.g. "+52 3312345678" or "3312345678")
  const parsedFromValue = useMemo(() => {
    if (!value) return null;
    const trimmed = value.trim();
    if (trimmed.startsWith("+")) {
      const match = COUNTRIES_DIAL_CODES.find((c) => trimmed.startsWith(c.dialCode));
      if (match) {
        const num = trimmed.slice(match.dialCode.length).trim();
        return { dialCode: match.dialCode, number: num };
      }
    }
    return null;
  }, [value]);

  const [selectedDialCode, setSelectedDialCode] = useState<string>(
    parsedFromValue?.dialCode || countryCode || "+52"
  );
  const [localNumber, setLocalNumber] = useState<string>(
    parsedFromValue?.number !== undefined ? parsedFromValue.number : (phoneNumber ?? value ?? "")
  );

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (parsedFromValue) {
      setSelectedDialCode(parsedFromValue.dialCode);
      setLocalNumber(parsedFromValue.number);
    } else if (phoneNumber !== undefined && phoneNumber !== localNumber) {
      setLocalNumber(phoneNumber);
    } else if (value !== undefined && value !== "" && value !== localNumber) {
      setLocalNumber(value);
    }
  }, [value, phoneNumber, parsedFromValue]);

  useEffect(() => {
    if (countryCode && countryCode !== selectedDialCode && !parsedFromValue) {
      setSelectedDialCode(countryCode);
    }
  }, [countryCode, parsedFromValue]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setSearchQuery("");
      }
    }
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const selectedCountry = useMemo(() => {
    return (
      COUNTRIES_DIAL_CODES.find((c) => c.dialCode === selectedDialCode) ||
      COUNTRIES_DIAL_CODES[0]!
    );
  }, [selectedDialCode]);

  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return COUNTRIES_DIAL_CODES;
    const query = searchQuery.toLowerCase().trim();
    return COUNTRIES_DIAL_CODES.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.dialCode.includes(query) ||
        c.code.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleSelectCountry = (country: CountryDialCode) => {
    setSelectedDialCode(country.dialCode);
    setIsDropdownOpen(false);
    setSearchQuery("");
    onCountryChange?.(country.dialCode);
    const combined = localNumber ? `${country.dialCode} ${localNumber}`.trim() : "";
    onChange?.(combined, country.dialCode, localNumber);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    // Allow digits, spaces, parentheses, hyphens
    const cleaned = rawVal.replace(/[^\d\s\-()]/g, "");
    setLocalNumber(cleaned);
    onPhoneChange?.(cleaned);
    const combined = cleaned ? `${selectedDialCode} ${cleaned}`.trim() : "";
    onChange?.(combined, selectedDialCode, cleaned);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", ...style }} className={className}>
      {label && (
        <label
          htmlFor={id}
          style={{
            fontSize: "0.78rem",
            fontWeight: 700,
            color: "var(--devio-blue-dark)",
            display: "flex",
            alignItems: "center",
            gap: "0.35rem",
            marginBottom: "0.35rem",
          }}
        >
          <Phone size={13} style={{ color: "var(--devio-blue)" }} />
          {label} {required && <span style={{ color: "var(--devio-red)" }}>*</span>}
        </label>
      )}

      <div
        style={{
          display: "flex",
          position: "relative",
          width: "100%",
          borderRadius: "0.5rem",
          border: error ? "1.5px solid var(--devio-red)" : "1px solid var(--devio-neutral-2)",
          backgroundColor: disabled ? "#F8FAFC" : "#FFFFFF",
          transition: "border-color 0.15s ease, box-shadow 0.15s ease",
          boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
        }}
      >
        {/* Country Code Trigger / Dropdown Container */}
        <div ref={dropdownRef} style={{ position: "relative" }}>
          <button
            type="button"
            disabled={disabled}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            style={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.6rem 0.65rem",
              backgroundColor: "#F8FAFC",
              border: "none",
              borderRight: "1px solid var(--devio-neutral-2)",
              borderTopLeftRadius: "0.5rem",
              borderBottomLeftRadius: "0.5rem",
              cursor: disabled ? "not-allowed" : "pointer",
              fontSize: "0.85rem",
              fontWeight: 700,
              color: "var(--devio-blue-dark)",
              outline: "none",
              userSelect: "none",
              ...selectStyle,
            }}
            title={`${selectedCountry.name} (${selectedCountry.dialCode})`}
          >
            <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>{selectedCountry.flag}</span>
            <span>{selectedCountry.dialCode}</span>
            <ChevronDown size={14} style={{ color: "var(--devio-neutral-3)" }} />
          </button>

          {/* Searchable Worldwide Countries Dropdown Menu */}
          {isDropdownOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                left: 0,
                width: "280px",
                maxHeight: "300px",
                backgroundColor: "#FFFFFF",
                borderRadius: "0.75rem",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                border: "1px solid var(--devio-neutral-2)",
                zIndex: 10000,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              {/* Search Bar */}
              <div
                style={{
                  padding: "0.5rem",
                  borderBottom: "1px solid var(--devio-neutral-1)",
                  backgroundColor: "#FAFBFD",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                }}
              >
                <Search size={14} style={{ color: "var(--devio-neutral-3)" }} />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Buscar país o lada..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    border: "none",
                    outline: "none",
                    fontSize: "0.8rem",
                    backgroundColor: "transparent",
                    color: "var(--devio-blue-dark)",
                  }}
                />
              </div>

              {/* Country List */}
              <div style={{ overflowY: "auto", flex: 1, padding: "0.25rem 0" }}>
                {filteredCountries.length === 0 ? (
                  <div style={{ padding: "1rem", textAlign: "center", fontSize: "0.78rem", color: "var(--devio-neutral-3)" }}>
                    No se encontró ningún país
                  </div>
                ) : (
                  filteredCountries.map((c) => {
                    const isSelected = c.dialCode === selectedDialCode && c.code === selectedCountry.code;
                    return (
                      <button
                        key={`${c.code}-${c.dialCode}`}
                        type="button"
                        onClick={() => handleSelectCountry(c)}
                        style={{
                          width: "100%",
                          padding: "0.45rem 0.75rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          border: "none",
                          backgroundColor: isSelected ? "rgba(47, 128, 237, 0.08)" : "transparent",
                          cursor: "pointer",
                          fontSize: "0.82rem",
                          color: isSelected ? "var(--devio-blue)" : "var(--devio-blue-dark)",
                          fontWeight: isSelected ? 700 : 500,
                          textAlign: "left",
                          transition: "background-color 0.1s ease",
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.backgroundColor = "#F1F5F9";
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>{c.flag}</span>
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {c.name}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexShrink: 0, marginLeft: "0.5rem" }}>
                          <span style={{ fontSize: "0.78rem", color: "var(--devio-neutral-4)", fontWeight: 700 }}>
                            {c.dialCode}
                          </span>
                          {isSelected && <Check size={14} style={{ color: "var(--devio-blue)" }} />}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Local Number Input */}
        <input
          id={id}
          name={name}
          type="tel"
          disabled={disabled}
          required={required}
          value={localNumber}
          onChange={handleNumberChange}
          placeholder={placeholder || selectedCountry.format || "(33) 1234-5678"}
          style={{
            flex: 1,
            padding: "0.6rem 0.85rem",
            border: "none",
            outline: "none",
            backgroundColor: "transparent",
            fontSize: "0.88rem",
            color: "var(--devio-blue-dark)",
            borderTopRightRadius: "0.5rem",
            borderBottomRightRadius: "0.5rem",
            ...inputStyle,
          }}
        />
      </div>

      {error && (
        <span style={{ fontSize: "0.75rem", color: "var(--devio-red)", marginTop: "0.25rem", fontWeight: 600 }}>
          {error}
        </span>
      )}
      {hint && !error && (
        <span style={{ fontSize: "0.72rem", color: "var(--devio-neutral-3)", marginTop: "0.25rem" }}>
          {hint}
        </span>
      )}
    </div>
  );
}
