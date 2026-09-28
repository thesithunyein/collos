/**
 * Collos colour palette. Values are the ones documented in `brand.md`; keep the
 * two in sync when the palette changes.
 */
export const colors = {
  ink: "#15243D",
  muted: "#66758F",
  soft: "#F5F7FB",
  backdrop: "#E4E9F4",
  border: "#E8ECF3",
  blue: "#2457F5",
  blueDark: "#173DBA",
  blueWash: "#EAF0FF",
  blueTint: "#DCE7FF",
  blueMuted: "#ABC5FF",
  orange: "#F19B3B",
  orangeWash: "#FFF2DF",
  green: "#41A77A",
  greenWash: "#E7F6EE",
  purple: "#8B6CE8",
  purpleWash: "#F0EBFF",
  white: "#FFFFFF",
  danger: "#C75353",
} as const;

export type ColorName = keyof typeof colors;
