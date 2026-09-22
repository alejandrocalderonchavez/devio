"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  Check,
} from "lucide-react";

interface DevioDatePickerProps {
  id?: string;
  value?: string; // Format: YYYY-MM-DD or readable string
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  minDate?: string;
  maxDate?: string;
  showPresets?: boolean;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const DAY_NAMES = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"];

export function DevioDatePicker({
  id,
  value,
  onChange,
  placeholder = "Seleccionar fecha",
  label,
  required = false,
  minDate,
  maxDate,
  showPresets = true,
  disabled = false,
  style,
}: DevioDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number; openUpwards: boolean } | null>(null);

  // Parse initial date or default to current date
  const parseDate = (val?: string): Date => {
    if (!val) return new Date();
    const parts = val.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0] ?? "", 10);
      const month = parseInt(parts[1] ?? "", 10) - 1;
      const day = parseInt(parts[2] ?? "", 10);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        return new Date(year, month, day);
      }
    }
    const d = new Date(val);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const selectedDate = value ? parseDate(value) : null;
  const [viewDate, setViewDate] = useState<Date>(selectedDate || new Date());

  const updatePosition = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const popoverHeight = showPresets ? 390 : 330;
    const popoverWidth = 310;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpwards = spaceBelow < popoverHeight && rect.top > popoverHeight;

    const top = openUpwards ? Math.max(10, rect.top - popoverHeight - 6) : rect.bottom + 6;
    let left = rect.left;
    if (left + popoverWidth > window.innerWidth - 10) {
      left = window.innerWidth - popoverWidth - 10;
    }
    if (left < 10) left = 10;

    setCoords({ top, left, openUpwards });
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      const handleScrollOrResize = () => updatePosition();
      window.addEventListener("scroll", handleScrollOrResize, true);
      window.addEventListener("resize", handleScrollOrResize);
      return () => {
        window.removeEventListener("scroll", handleScrollOrResize, true);
        window.removeEventListener("resize", handleScrollOrResize);
      };
    }
  }, [isOpen, showPresets]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Format date to readable string (e.g. "18 Sep 2026")
  const formatDisplayDate = (d: Date | null): string => {
    if (!d) return "";
    const day = d.getDate();
    const month = d.toLocaleString("es-MX", { month: "short" });
    const year = d.getFullYear();
    return `${day} ${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`;
  };

  // Format date to standard YYYY-MM-DD
  const formatISODate = (d: Date): string => {
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  // Calendar calculations
  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleSelectDay = (day: number) => {
    const newDate = new Date(currentYear, currentMonth, day);
    onChange(formatISODate(newDate));
    setIsOpen(false);
  };

  // Presets
  const applyPreset = (type: "today" | "tomorrow" | "15days" | "30days" | "monthEnd") => {
    const now = new Date();
    let target = new Date();
    if (type === "today") {
      target = now;
    } else if (type === "tomorrow") {
      target.setDate(now.getDate() + 1);
    } else if (type === "15days") {
      target.setDate(now.getDate() + 15);
    } else if (type === "30days") {
      target.setDate(now.getDate() + 30);
    } else if (type === "monthEnd") {
      target = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }
    setViewDate(target);
    onChange(formatISODate(target));
    setIsOpen(false);
  };

  const isDateDisabled = (dayNum: number) => {
    const targetDate = new Date(currentYear, currentMonth, dayNum);
    targetDate.setHours(0, 0, 0, 0);

    if (minDate) {
      const minD = parseDate(minDate);
      minD.setHours(0, 0, 0, 0);
      if (targetDate < minD) return true;
    }
    if (maxDate) {
      const maxD = parseDate(maxDate);
      maxD.setHours(23, 59, 59, 999);
      if (targetDate > maxD) return true;
    }
    return false;
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === currentMonth &&
      selectedDate.getFullYear() === currentYear
    );
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === currentMonth &&
      today.getFullYear() === currentYear
    );
  };

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%", ...style }}>
      {label && (
        <label
          style={{
            fontSize: "0.78rem",
            fontWeight: 700,
            color: "#1F3652",
            display: "block",
            marginBottom: "0.35rem",
          }}
        >
          {label} {required && <span style={{ color: "#EF4444" }}>*</span>}
        </label>
      )}

      {/* Input Trigger Button */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.55rem 0.85rem",
          borderRadius: "0.6rem",
          border: isOpen ? "1.5px solid #2F80ED" : "1px solid #CBD5E1",
          backgroundColor: disabled ? "#F1F5F9" : "#FFFFFF",
          color: selectedDate ? "#1F3652" : "#94A3B8",
          fontSize: "0.85rem",
          fontWeight: selectedDate ? 600 : 400,
          cursor: disabled ? "not-allowed" : "pointer",
          outline: "none",
          transition: "all 0.15s ease",
          boxShadow: isOpen ? "0 0 0 3px rgba(47, 128, 237, 0.12)" : "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <CalendarIcon size={15} color={selectedDate ? "#2F80ED" : "#94A3B8"} />
          <span>{selectedDate ? formatDisplayDate(selectedDate) : placeholder}</span>
        </div>
        {value && !disabled && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "18px",
              height: "18px",
              borderRadius: "50%",
              backgroundColor: "#F1F5F9",
              color: "#64748B",
            }}
          >
            <X size={11} />
          </div>
        )}
      </button>

      {/* Popover Calendar via React Portal to escape overflow clipping */}
      {isOpen && coords && typeof document !== "undefined" && createPortal(
        <div
          ref={popoverRef}
          style={{
            position: "fixed",
            top: coords.top,
            left: coords.left,
            zIndex: 9999999,
            backgroundColor: "#FFFFFF",
            borderRadius: "1rem",
            border: "1px solid #E2E8F0",
            boxShadow: "0 20px 40px -8px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(0,0,0,0.05)",
            padding: "1rem",
            width: "310px",
            animation: "fadeIn 0.15s ease-out",
          }}
        >
          {/* Calendar Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.85rem",
              paddingBottom: "0.5rem",
              borderBottom: "1px solid #F1F5F9",
            }}
          >
            <button
              type="button"
              onClick={handlePrevMonth}
              style={{
                border: "none",
                background: "#F8FAFC",
                color: "#1F3652",
                width: "28px",
                height: "28px",
                borderRadius: "0.4rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <ChevronLeft size={16} />
            </button>

            <span style={{ fontSize: "0.88rem", fontWeight: 800, color: "#1F3652" }}>
              {MONTH_NAMES[currentMonth]} {currentYear}
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              style={{
                border: "none",
                background: "#F8FAFC",
                color: "#1F3652",
                width: "28px",
                height: "28px",
                borderRadius: "0.4rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Days of Week Header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              textAlign: "center",
              marginBottom: "0.4rem",
            }}
          >
            {DAY_NAMES.map((day, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  color: "#94A3B8",
                  padding: "0.25rem 0",
                }}
              >
                {day}
              </span>
            ))}
          </div>

          {/* Calendar Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: "2px",
            }}
          >
            {/* Previous Month Days */}
            {Array.from({ length: firstDayOfMonth }).map((_, idx) => {
              const dayNum = daysInPrevMonth - firstDayOfMonth + idx + 1;
              return (
                <div
                  key={`prev-${idx}`}
                  style={{
                    padding: "0.5rem 0",
                    textAlign: "center",
                    fontSize: "0.78rem",
                    color: "#CBD5E1",
                    userSelect: "none",
                  }}
                >
                  {dayNum}
                </div>
              );
            })}

            {/* Current Month Days */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const disabledDay = isDateDisabled(dayNum);
              const selected = isSelected(dayNum);
              const today = isToday(dayNum);

              return (
                <button
                  key={`curr-${dayNum}`}
                  type="button"
                  disabled={disabledDay}
                  onClick={() => {
                    if (!disabledDay) handleSelectDay(dayNum);
                  }}
                  style={{
                    padding: "0.5rem 0",
                    textAlign: "center",
                    fontSize: "0.8rem",
                    fontWeight: selected || today ? 700 : 500,
                    borderRadius: "0.5rem",
                    border: "none",
                    backgroundColor: selected
                      ? "#2F80ED"
                      : today && !disabledDay
                      ? "rgba(47, 128, 237, 0.1)"
                      : "transparent",
                    color: selected
                      ? "#FFFFFF"
                      : disabledDay
                      ? "#CBD5E1"
                      : today
                      ? "#2F80ED"
                      : "#1E293B",
                    cursor: disabledDay ? "not-allowed" : "pointer",
                    opacity: disabledDay ? 0.35 : 1,
                    transition: "all 0.1s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onMouseEnter={(e) => {
                    if (!selected && !disabledDay) e.currentTarget.style.backgroundColor = "#F1F5F9";
                  }}
                  onMouseLeave={(e) => {
                    if (!selected && !disabledDay)
                      e.currentTarget.style.backgroundColor = today
                        ? "rgba(47, 128, 237, 0.1)"
                        : "transparent";
                  }}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>

          {/* Presets Quick Actions */}
          {showPresets && (
            <div
              style={{
                marginTop: "0.85rem",
                paddingTop: "0.75rem",
                borderTop: "1px solid #F1F5F9",
                display: "flex",
                flexWrap: "wrap",
                gap: "0.35rem",
              }}
            >
              <button
                type="button"
                onClick={() => applyPreset("today")}
                style={{
                  padding: "0.25rem 0.55rem",
                  borderRadius: "9999px",
                  border: "1px solid #E2E8F0",
                  backgroundColor: "#F8FAFC",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  color: "#475569",
                  cursor: "pointer",
                }}
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={() => applyPreset("tomorrow")}
                style={{
                  padding: "0.25rem 0.55rem",
                  borderRadius: "9999px",
                  border: "1px solid #E2E8F0",
                  backgroundColor: "#F8FAFC",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  color: "#475569",
                  cursor: "pointer",
                }}
              >
                Mañana
              </button>
              <button
                type="button"
                onClick={() => applyPreset("15days")}
                style={{
                  padding: "0.25rem 0.55rem",
                  borderRadius: "9999px",
                  border: "1px solid #E2E8F0",
                  backgroundColor: "#F8FAFC",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  color: "#475569",
                  cursor: "pointer",
                }}
              >
                +15 Días
              </button>
              <button
                type="button"
                onClick={() => applyPreset("30days")}
                style={{
                  padding: "0.25rem 0.55rem",
                  borderRadius: "9999px",
                  border: "1px solid #E2E8F0",
                  backgroundColor: "#F8FAFC",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  color: "#475569",
                  cursor: "pointer",
                }}
              >
                +30 Días
              </button>
              <button
                type="button"
                onClick={() => applyPreset("monthEnd")}
                style={{
                  padding: "0.25rem 0.55rem",
                  borderRadius: "9999px",
                  border: "1px solid #E2E8F0",
                  backgroundColor: "#F8FAFC",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  color: "#475569",
                  cursor: "pointer",
                }}
              >
                Fin de Mes
              </button>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
