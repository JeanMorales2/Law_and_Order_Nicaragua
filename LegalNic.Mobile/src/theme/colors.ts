export const colors = {
  navy: "#1B2A4A",
  navyDeep: "#12203B",
  navySoft: "#2C3E63",
  gold: "#B98B34",
  goldSoft: "#F1ECE0",
  paper: "#FAF7F1",
  ink: "#24262B",
  inkSoft: "#6B6E76",
  line: "#E7E1D6",
  verde: "#3F7A5C",
  rojo: "#A23B3B",
  white: "#FFFFFF",
  overlay: "rgba(18, 32, 59, 0.08)",
  shadow: "rgba(18, 32, 59, 0.14)",
} as const;

export type AppColor = keyof typeof colors;
