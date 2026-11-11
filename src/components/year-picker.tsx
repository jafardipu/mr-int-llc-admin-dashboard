"use client";

import { ConfigProvider, DatePicker } from "antd";
import dayjs, { type Dayjs } from "dayjs";

type YearPickerProps = {
  year: number;
  onYearChange: (year: number) => void;
  className?: string;
};

export function YearPicker({ year, onYearChange, className }: YearPickerProps) {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#995618",
          colorPrimaryHover: "#7d4513",
          colorPrimaryActive: "#7d4513",
          colorLink: "#995618",
          colorText: "#1e1b18",
          colorTextSecondary: "#857d72",
          colorTextTertiary: "#857d72",
          colorBorder: "#ded5c6",
          colorSplit: "#ece4d6",
          colorBgElevated: "#ffffff",
          colorBgContainer: "#1e1b18",
          borderRadius: 16,
          borderRadiusLG: 18,
          fontFamily: "inherit",
          controlHeight: 32,
          fontSize: 12,
        },
        components: {
          DatePicker: {
            colorBgContainer: "#1e1b18",
            colorText: "#ffffff",
            colorTextPlaceholder: "rgba(255,255,255,0.7)",
            colorTextHeading: "#1e1b18",
            colorTextDescription: "#857d72",
            colorBorder: "#1e1b18",
            hoverBorderColor: "#995618",
            activeBorderColor: "#995618",
            activeShadow: "0 0 0 2px rgba(153, 86, 24, 0.18)",
            colorIcon: "#f4ebde",
            colorIconHover: "#ffffff",
            cellHoverBg: "#f4ebde",
            cellActiveWithRangeBg: "#995618",
            cellBgDisabled: "#faf8f5",
            paddingInline: 14,
            inputFontSize: 12,
          },
        },
      }}
    >
      <DatePicker
        picker="year"
        value={dayjs().year(year).startOf("year")}
        allowClear={false}
        inputReadOnly
        format={(value) => `Yearly ${value.year()}`}
        placeholder="Select year"
        className={`admin-year-picker ${className ?? ""}`.trim()}
        classNames={{ popup: { root: "admin-year-picker-dropdown" } }}
        onChange={(value: Dayjs | null) => {
          if (!value) return;
          onYearChange(value.year());
        }}
      />
    </ConfigProvider>
  );
}
