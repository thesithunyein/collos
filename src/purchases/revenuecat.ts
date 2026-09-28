import Purchases, { LOG_LEVEL } from "react-native-purchases";
import type { CustomerInfo, PurchasesPackage } from "react-native-purchases";
import {
  PRO_ENTITLEMENT,
  activeApiKey,
  activePlatform,
  isPaymentsConfigured,
  storeDisplayName,
} from "./config";

/**
 * Thin, failure-tolerant wrapper around the RevenueCat SDK.
 *
 * Two modes:
 *  - `live`    — a real SDK key exists for this platform, so offerings, purchases,
 *                restores and entitlement checks all hit RevenueCat.
 *  - `preview` — no key configured yet. The UI still renders a complete, honest
 *                purchase flow against clearly-labelled sample plans so the public
 *                demo is not a dead end. Nothing is charged and nothing pretends
 *                to be a real transaction.
 */

export type ProMode = "live" | "preview";

export type PlanOption = {
  /** Stable key for lists. Prefers the real RevenueCat package identifier. */
  identifier: string;
  /** "month" | "year" | "lifetime" | "" */
  period: string;
  /** "Monthly" | "Annual" — short label for the plan row. */
  label: string;
  /** Localised price straight from the store, or a sample string in preview mode. */
  priceString: string;
  /** e.g. "1 month" — the title the store reports. */
  title: string;
  description: string;
  /** Cheapest per-month equivalent, when the store gives us enough to compute it. */
  perMonthString?: string;
  /** Percentage saved versus the monthly plan, when both are known. */
  savingsPercent?: number;
  /** Set on the row we want preselected. */
  highlighted: boolean;
  /** The underlying RevenueCat package. Absent in preview mode. */
  package?: PurchasesPackage;
};

export type ProState = {
  mode: ProMode;
  /** Entitlement is active — Collos Pro features should unlock. */
  pro: boolean;
  customerInfo: CustomerInfo | null;
  appUserId: string | null;
  /** URL the store provides for managing/cancelling the subscription. */
  managementUrl: string | null;
  /** ISO date the current entitlement expires, when there is one. */
  expiresAt: string | null;
  /** Set when we are in preview mode because of a simulated purchase. */
  previewUnlock: boolean;
};

export const emptyProState: ProState = {
  mode: isPaymentsConfigured() ? "live" : "preview",
  pro: false,
  customerInfo: null,
  appUserId: null,
  managementUrl: null,
  expiresAt: null,
  previewUnlock: false,
};

/** Sample plans shown only when no SDK key exists. Prices are illustrative. */
const PREVIEW_PLANS: PlanOption[] = [
  {
    identifier: "preview_monthly",
    period: "month",
    label: "Monthly",
    priceString: "$4.99",
    title: "1 month",
    description: "Billed monthly, cancel anytime",
    highlighted: false,
  },
  {
    identifier: "preview_annual",
    period: "year",
    label: "Annual",
    priceString: "$39.99",
    title: "1 year",
    description: "Billed once a year",
    perMonthString: "$3.33",
    savingsPercent: 33,
    highlighted: true,
  },
];

const PERIOD_BY_PACKAGE_TYPE: Record<string, { period: string; label: string }> = {
  MONTHLY: { period: "month", label: "Monthly" },
  ANNUAL: { period: "year", label: "Annual" },
  YEARLY: { period: "year", label: "Annual" },
  LIFETIME: { period: "lifetime", label: "Lifetime" },
  WEEKLY: { period: "week", label: "Weekly" },
  SIX_MONTH: { period: "6 months", label: "6 months" },
  THREE_MONTH: { period: "3 months", label: "3 months" },
  TWO_MONTH: { period: "2 months", label: "2 months" },
};

/** RevenueCat package types arrive as `$rc_monthly`, `$rc_annual`, … */
function describePackageType(packageType: string): { period: string; label: string } {
  const key = packageType.replace(/^\$rc_/, "").toUpperCase();
  return PERIOD_BY_PACKAGE_TYPE[key] ?? { period: "", label: packageType };
}

function toPlanOption(pkg: PurchasesPackage): PlanOption {
  const { period, label } = describePackageType(pkg.packageType);
  return {
    identifier: pkg.identifier,
    period,
    label,
    priceString: pkg.product.priceString,
    title: pkg.product.title || pkg.product.identifier,
    description: pkg.product.description || "",
    highlighted: period === "year" || (period === "lifetime" && false),
    package: pkg,
  };
}

/**
 * Adds a per-month equivalent and a "save X%" badge by comparing the monthly and
 * annual packages when the store returned both.
 */
function decoratePlans(plans: PlanOption[]): PlanOption[] {
  const monthly = plans.find((plan) => plan.period === "month");
  const annual = plans.find((plan) => plan.period === "year");

  if (!monthly || !annual?.package || !monthly.package) return plans;

  const monthlyPrice = monthly.package.product.price;
  const annualPrice = annual.package.product.price;
  if (!monthlyPrice || !annualPrice) return plans;

  const perMonth = annualPrice / 12;
  const savings = Math.round((1 - perMonth / monthlyPrice) * 100);

  return plans.map((plan) => {
    if (plan.identifier !== annual.identifier) return plan;
    return {
      ...plan,
      perMonthString: `${annual.package!.product.currencyCode === "USD" ? "$" : ""}${perMonth.toFixed(2)}`,
      savingsPercent: savings > 0 ? savings : undefined,
      highlighted: true,
    };
  });
}

let configured = false;
let configureFailed = false;

/** True once `Purchases.configure` has run successfully this session. */
export function isSdkConfigured(): boolean {
  return configured;
}

/**
 * Initialises the SDK once per session. Safe to call from an effect on every
 * render: repeated calls are no-ops, and any failure is swallowed so a broken
 * store connection can never take the app down.
 */
export async function initPurchases(): Promise<boolean> {
  if (configured || configureFailed) return configured;

  const apiKey = activeApiKey();
  if (!apiKey) return false;

  try {
    try {
      await Purchases.setLogLevel(LOG_LEVEL.INFO);
    } catch {
      // Log level is cosmetic; carry on if the platform refuses it.
    }
    Purchases.configure({ apiKey });
    configured = true;
    return true;
  } catch {
    configureFailed = true;
    return false;
  }
}

function isEntitled(customerInfo: CustomerInfo): boolean {
  return typeof customerInfo.entitlements.active[PRO_ENTITLEMENT] !== "undefined";
}

/** Reads the current entitlement, or returns null when the SDK is unavailable. */
export async function loadProState(previewUnlock: boolean): Promise<ProState> {
  const mode: ProMode = isPaymentsConfigured() ? "live" : "preview";

  if (mode === "preview") {
    return { ...emptyProState, mode, pro: previewUnlock, previewUnlock };
  }

  const ready = await initPurchases();
  if (!ready) {
    // A key is present but the SDK refused to start. Fall through to preview so
    // the user still sees a usable screen rather than a spinner forever.
    return { ...emptyProState, mode: "preview", pro: previewUnlock, previewUnlock };
  }

  try {
    const [customerInfo, appUserId] = await Promise.all([
      Purchases.getCustomerInfo(),
      Purchases.getAppUserID().catch(() => null),
    ]);
    const entitlement = customerInfo.entitlements.active[PRO_ENTITLEMENT];
    return {
      mode: "live",
      pro: isEntitled(customerInfo),
      customerInfo,
      appUserId: appUserId ?? customerInfo.originalAppUserId ?? null,
      managementUrl: customerInfo.managementURL ?? null,
      expiresAt: entitlement?.expirationDate ?? null,
      previewUnlock,
    };
  } catch (error) {
    return { ...emptyProState, mode: "live", pro: previewUnlock, previewUnlock };
  }
}

/** Fetches the plans to show on the paywall. */
export async function loadPlans(): Promise<{ plans: PlanOption[]; mode: ProMode }> {
  if (!isPaymentsConfigured()) {
    return { plans: PREVIEW_PLANS, mode: "preview" };
  }

  const ready = await initPurchases();
  if (!ready) return { plans: PREVIEW_PLANS, mode: "preview" };

  try {
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    const packages = current?.availablePackages ?? [];
    if (packages.length === 0) {
      return { plans: PREVIEW_PLANS, mode: "preview" };
    }
    return { plans: decoratePlans(packages.map(toPlanOption)), mode: "live" };
  } catch {
    return { plans: PREVIEW_PLANS, mode: "preview" };
  }
}

export type PurchaseOutcome =
  | { status: "success"; pro: boolean }
  | { status: "cancelled" }
  | { status: "error"; message: string };

/** Restoring can never be user-cancelled, so it gets a narrower result type. */
export type RestoreOutcome =
  | { status: "success"; pro: boolean }
  | { status: "error"; message: string };

/** Everything the store can throw at us, turned into one honest sentence. */
export function purchaseErrorMessage(error: unknown): string {
  const err = error as { userCancelled?: boolean; message?: string; code?: string } | null;
  if (err?.userCancelled) return "Purchase cancelled.";

  const code = typeof err?.code === "string" ? err.code : "";
  switch (code) {
    case "1": // PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR
      return "Purchase cancelled.";
    case "4":
      return "That item isn’t available right now. Please try again in a moment.";
    case "8":
      return "This device isn’t allowed to make purchases.";
    case "10":
      return "You’re already subscribed to Collos Pro.";
    case "13":
      return "Something went wrong with the store. Please try again.";
    case "14":
      return "The store receipt could not be verified. Please contact support.";
    default:
      break;
  }

  if (err?.message && err.message.length < 160) return err.message;
  return "We couldn’t complete that purchase. Please try again.";
}

/**
 * Runs a purchase. In preview mode this unlocks locally and says so, so the demo
 * flow is complete without ever implying a real transaction took place.
 */
export async function purchasePlan(plan: PlanOption): Promise<PurchaseOutcome> {
  // No SDK key, or an offering came back without a real package: this is a preview
  // build, so unlock locally instead of pretending a transaction happened.
  if (!isPaymentsConfigured() || !plan.package) {
    return { status: "success", pro: true };
  }

  try {
    const { customerInfo } = await Purchases.purchasePackage(plan.package);
    return { status: "success", pro: isEntitled(customerInfo) };
  } catch (error) {
    if ((error as { userCancelled?: boolean })?.userCancelled) {
      return { status: "cancelled" };
    }
    return { status: "error", message: purchaseErrorMessage(error) };
  }
}

/**
 * Restores previous purchases. RevenueCat does not support this on the web, so
 * we explain that instead of showing a confusing failure.
 */
export async function restorePurchases(): Promise<RestoreOutcome> {
  if (activePlatform() === "web") {
    return {
      status: "error",
      message: "Restore isn’t available on the web. Open Collos on iOS or Android, or sign in with the same account.",
    };
  }

  if (!isPaymentsConfigured()) {
    return {
      status: "error",
      message: "RevenueCat isn’t configured in this build yet.",
    };
  }

  const ready = await initPurchases();
  if (!ready) {
    return { status: "error", message: "We couldn’t reach the store. Please try again." };
  }

  try {
    const customerInfo = await Purchases.restorePurchases();
    return { status: "success", pro: isEntitled(customerInfo) };
  } catch (error) {
    return { status: "error", message: purchaseErrorMessage(error) };
  }
}

/** Human-readable explanation of what the store will say on the button. */
export function storeNote(): string {
  return `Billed by ${storeDisplayName()} · cancel anytime`;
}
