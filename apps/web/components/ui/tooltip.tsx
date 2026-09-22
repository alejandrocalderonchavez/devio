"use client";

import React, { useState } from "react";
import { Info, AlertCircle, HelpCircle } from "lucide-react";

interface InfoTooltipProps {
  content: string;
  title?: string;
  icon?: "info" | "alert" | "help";
  size?: number;
  iconColor?: string;
  position?: "top" | "bottom" | "left" | "right";
  children?: React.ReactNode;
}

export function InfoTooltip({
  content,
  title,
  icon = "info",
  size = 14,
  iconColor = "#94A3B8",
  position = "top",
  children,
}: InfoTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const getIcon = () => {
    switch (icon) {
      case "alert":
        return <AlertCircle size={size} color={iconColor} />;
      case "help":
        return <HelpCircle size={size} color={iconColor} />;
      case "info":
      default:
        return <Info size={size} color={iconColor} />;
    }
  };

  const getPositionStyles = () => {
    switch (position) {
      case "bottom":
        return {
          top: "calc(100% + 8px)",
          left: "50%",
          transform: "translateX(-50%)",
        };
      case "left":
        return {
          right: "calc(100% + 8px)",
          top: "50%",
          transform: "translateY(-50%)",
        };
      case "right":
        return {
          left: "calc(100% + 8px)",
          top: "50%",
          transform: "translateY(-50%)",
        };
      case "top":
      default:
        return {
          bottom: "calc(100% + 8px)",
          left: "50%",
          transform: "translateX(-50%)",
        };
    }
  };

  return (
    <div
      style={{ position: "relative", display: "inline-flex", alignItems: "center", cursor: "help" }}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children || getIcon()}

      {isVisible && (
        <div
          role="tooltip"
          style={{
            position: "absolute",
            ...getPositionStyles(),
            zIndex: 99999,
            width: "max-content",
            maxWidth: "260px",
            backgroundColor: "#1B3047",
            color: "#FFFFFF",
            padding: "0.6rem 0.85rem",
            borderRadius: "0.6rem",
            fontSize: "0.75rem",
            lineHeight: 1.35,
            fontWeight: 400,
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2)",
            pointerEvents: "none",
            textAlign: "left",
            border: "1px solid rgba(255, 255, 255, 0.15)",
          }}
        >
          {title && (
            <div style={{ fontWeight: 700, color: "#E5C46A", marginBottom: "0.2rem", fontSize: "0.78rem" }}>
              {title}
            </div>
          )}
          <div>{content}</div>
        </div>
      )}
    </div>
  );
}
