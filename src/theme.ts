/**
 * Collos design tokens: colour palette, corner radii, and platform-safe
 * vertical metrics. Values are the ones documented in `brand.md`; keep the two
 * in sync when the palette changes.
 *
 * The blues here are read straight off the logo rather than picked by eye:
 * `ink` is the navy of the cat's outline, `periwinkle` is the square it sits
 * on, and `blush` is the heart on its collar. The landing site uses the same
 * values, so the phone frames on that page match the app they show.
 */
import { Platform } from "react-native";

export const colors = {
  ink: "#183468",
  muted: "#5D7099",
  soft: "#F3F7FE",
  backdrop: "#EDF3FE",
  border: "#E3EAF8",
  /** A border that sits on a wash, where `border` would disappear. */
  borderSoft: "#CFDDF4",
  blue: "#2F63D6",
  blueDark: "#1B3F96",
  blueWash: "#EAF1FE",
  blueTint: "#D5E3FB",
  /** Supporting copy that sits *on* brand blue, so it has to be light. */
  blueMuted: "#E8F0FE",
  /** Disabled primary buttons: brand blue, drained toward its wash. */
  blueDisabled: "#9EB6E8",
  /** The logo's own square — decorative fills on top of navy or blue. */
  periwinkle: "#9ABFF3",
  placeholder: "#8FA6CE",
  skeleton: "#E9EFFA",
  /** Modal scrim: the ink navy at 42%. */
  scrim: "rgba(24,52,104,0.42)",
  blush: "#DD6B6B",
  blushWash: "#FCECEC",
  mint: "#4FA98A",
  mintWash: "#E8F5EF",
  lilac: "#7B76DE",
  lilacWash: "#EFEDFC",
  errorWash: "#FDEEEE",
  errorBorder: "#F0D4D4",
  white: "#FFFFFF",
  danger: "#C75353",
} as const;

export type ColorName = keyof typeof colors;

/**
 * The corner-radius scale. Cards get `lg`, hero surfaces `xl`, rows and chips
 * `md`, and buttons `sm` — one number per size class instead of ad-hoc values,
 * so radii stay consistent across screens.
 */
export const shape = {
  sm: 14,
  md: 17,
  lg: 20,
  xl: 24,
} as const;

/**
 * Platform-safe vertical metrics, estimated without a native dependency.
 *
 * `react-native-safe-area-context` would report exact values, but adding it now
 * means adding an unpinned native dependency late in the project, which is
 * exactly the risk the `expo-font` incident warns about. These estimates cover
 * every device the app runs on: the top band clears the notch (iOS
 * carries the larger inset; Android statuses are shorter), and the bottom band
 * clears the home indicator / gesture bar.
 */
export const insets = {
  /** Clearance for the status bar / notch on fixed headers. */
  top: Platform.OS === "android" ? 36 : 54,
  /** Clearance for the home indicator on fixed bottom chrome. */
  bottom: Platform.OS === "android" ? 12 : 24,
} as const;

/**
 * `useNativeDriver: true` on iOS/Android; `false` on web, where the native
 * animated module does not exist and react-native-web would log a console
 * warning on every animation. Same motion everywhere, no warning noise in the
 * browser build.
 */
export const nativeAnimDriver = Platform.OS !== "web";
