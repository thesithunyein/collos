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
 * The spacing scale. Every inset, gap and padding in the app comes from here.
 *
 * Before this existed the app declared 25 distinct padding/margin values,
 * including odd ones (3, 7, 9, 11, 13, 15, 17, 21, 26) that no grid can be read
 * out of. The eye reads that as "slightly off, and unfixable" even when it
 * cannot name why, which is exactly the difference between a tidy app and a
 * considered one. Ten even steps absorb the old values with no visible jump —
 * an odd number snaps to its nearest even neighbour — so adopting the scale is
 * a rename rather than a re-layout.
 *
 * Even numbers, not a strict 4/8 grid: the app is built around 10 and 14 as
 * much as 8 and 16, and forcing those onto a 4/8 grid would have moved half the
 * screen for the sake of the grid rather than the eye.
 */
export const space = {
  xxs: 4,
  xs: 6,
  sm: 8,
  md: 10,
  lg: 12,
  xl: 14,
  xxl: 16,
  xxxl: 20,
  huge: 24,
  giant: 32,
} as const;

/**
 * The type scale: size, leading, weight and tracking locked together.
 *
 * The app used to set 16 distinct font sizes (9 through 38), ten different
 * letter-spacings, and only 35 explicit `lineHeight`s against 119 `fontSize`s —
 * so most text inherited the platform's default leading and every screen had
 * drifted a little. That is the single loudest "not a design system" signal in
 * a codebase, and it is invisible to the person who wrote it.
 *
 * Nine steps replace all of it. Each step carries its own leading and tracking
 * because a size without them is how the drift started: a `fontSize` is a
 * decision, and the leading that goes with it is part of the same decision.
 *
 * Weights stay at 400/600/700. The first version of this app shipped 51 styles
 * at weight 800 and six at 900, which reads as shouting; three weights, each
 * with one job, is what makes type feel authored.
 */
export const type = {
  /** Screen titles and the greeting. One per screen, never two. */
  display: { fontSize: 25, lineHeight: 31, fontWeight: "700", letterSpacing: -0.6 },
  /** Sheet titles and section titles that lead a card. */
  title: { fontSize: 21, lineHeight: 27, fontWeight: "700", letterSpacing: -0.5 },
  /** A card's heading. */
  heading: { fontSize: 18, lineHeight: 24, fontWeight: "600", letterSpacing: -0.3 },
  /** A row's title, and the label on a primary button. */
  subhead: { fontSize: 15, lineHeight: 21, fontWeight: "600", letterSpacing: -0.2 },
  /** Reading text. */
  body: { fontSize: 14, lineHeight: 20, fontWeight: "400", letterSpacing: 0 },
  /** Supporting copy under a heading. */
  callout: { fontSize: 13, lineHeight: 19, fontWeight: "400", letterSpacing: 0 },
  /** Secondary detail: a card's note, a row's relationship. */
  caption: { fontSize: 12, lineHeight: 17, fontWeight: "500", letterSpacing: 0 },
  /** Labels, eyebrows, nav items, small buttons. */
  micro: { fontSize: 11, lineHeight: 15, fontWeight: "600", letterSpacing: 0.2 },
  /** The smallest dressed text: badges, all-caps field labels. */
  tag: { fontSize: 10, lineHeight: 14, fontWeight: "700", letterSpacing: 0.4 },
} as const;

/**
 * The motion system: five durations and three springs, used everywhere.
 *
 * Motion was previously ad hoc — two literal durations in the whole app and a
 * hand-tuned friction/tension pair per component, so nothing shared a rhythm.
 * Premium motion is not bigger; it is *consistent*, and the rule that makes it
 * read as intentional is that leaving is faster than arriving.
 */
export const motion = {
  duration: {
    /** A state flip with nothing travelling: a tint, a badge. */
    instant: 120,
    /** Leaving. Always faster than `base`. */
    quick: 180,
    /** Arriving: a toast rising, a card settling. */
    base: 240,
    /** A deliberate reveal. */
    slow: 320,
    /** The one hero beat: the ring drawing up. */
    hero: 420,
  },
  /** `friction`/`tension` pairs, named for the job rather than the feel. */
  spring: {
    /** A control acknowledging a press. Snappy, no overshoot worth seeing. */
    press: { friction: 5, tension: 220 },
    /** A selected state settling: the tab capsule, the active icon. */
    lift: { friction: 6, tension: 190 },
    /** A surface arriving. Softer, because a large object in motion needs it. */
    sheet: { friction: 8, tension: 120 },
  },
} as const;

/**
 * The one prop that makes animated numbers look engineered instead of jittery.
 *
 * Proportional digits have different widths, so a value counting 0 → 100 makes
 * every digit to its left shift. Tabular figures are all one width, so the
 * number grows without the layout breathing. Applied to every figure the app
 * animates or that changes with the plan.
 */
export const numeric: { fontVariant: ("tabular-nums")[] } = { fontVariant: ["tabular-nums"] };

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
 * The paper material: a card is white, edged with a hairline, and lifted by a
 * shadow you have to look for.
 *
 * These exist as tokens rather than per-component numbers because the landing
 * site draws the same two shadows, and a card in the app has to match the card
 * on the page that shows it. `elevation` is Android's own shadow; it is a hard
 * edge rather than a blur, so the value stays at 1 where the reference is
 * barely-there, and both keys are always set together.
 */
export const elevation = {
  /** A resting surface: 2px offset, 12px blur, 5% ink. */
  card: {
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 1,
  },
  /** The same surface raised: hover, focus, the one card that matters. */
  lifted: {
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 28,
    elevation: 4,
  },
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
