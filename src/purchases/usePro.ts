import { useCallback, useEffect, useRef, useState } from "react";
import {
  type PlanOption,
  type ProMode,
  type ProState,
  emptyProState,
  loadPlans,
  loadProState,
  purchasePlan,
  restorePurchases,
} from "./revenuecat";

export type ProController = {
  /** `loading` until the first entitlement read resolves. */
  status: "loading" | "ready";
  mode: ProMode;
  pro: boolean;
  plans: PlanOption[];
  appUserId: string | null;
  managementUrl: string | null;
  expiresAt: string | null;
  /** Identifier of the plan currently being purchased, if any. */
  busyPlan: string | null;
  restoring: boolean;
  /** Feedback for the user. Errors and confirmations both land here. */
  message: string | null;
  /** Message kind, so the UI can colour it. */
  messageTone: "error" | "success" | "info";
  clearMessage: () => void;
  purchase: (plan: PlanOption) => Promise<void>;
  restore: () => Promise<void>;
  refresh: () => Promise<void>;
};

/**
 * Owns all RevenueCat state for the app: what can be bought, whether Pro is
 * active, and every action the paywall and settings screens need.
 *
 * The hook is deliberately never-failing: if the SDK is unreachable the app
 * still renders, in `preview` mode.
 */
export function usePro(): ProController {
  const [state, setState] = useState<ProState>(emptyProState);
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [status, setStatus] = useState<"loading" | "ready">("loading");
  const [busyPlan, setBusyPlan] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"error" | "success" | "info">("info");
  const previewUnlock = useRef(false);

  const refresh = useCallback(async () => {
    const [proState, planResult] = await Promise.all([
      loadProState(previewUnlock.current),
      loadPlans(),
    ]);
    previewUnlock.current = proState.previewUnlock;
    setState(proState);
    setPlans(planResult.plans);
    setStatus("ready");
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [proState, planResult] = await Promise.all([
        loadProState(false),
        loadPlans(),
      ]);
      if (cancelled) return;
      previewUnlock.current = proState.previewUnlock;
      setState(proState);
      setPlans(planResult.plans);
      setStatus("ready");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const purchase = useCallback(
    async (plan: PlanOption) => {
      setBusyPlan(plan.identifier);
      setMessage(null);
      const outcome = await purchasePlan(plan);
      setBusyPlan(null);

      if (outcome.status === "cancelled") {
        setMessageTone("info");
        setMessage("Purchase cancelled.");
        return;
      }
      if (outcome.status === "error") {
        setMessageTone("error");
        setMessage(outcome.message);
        return;
      }
      if (outcome.pro) {
        previewUnlock.current = state.mode === "preview";
        await refresh();
        setMessageTone("success");
        setMessage(
          state.mode === "preview"
            ? "Preview unlock — no payment was taken in this preview build."
            : "You’re all set. Collos Pro is unlocked.",
        );
        return;
      }
      // The store completed without granting the entitlement.
      await refresh();
      setMessageTone("error");
      setMessage("The purchase finished but Pro isn’t active yet. Try Restore purchases.");
    },
    [refresh, state.mode],
  );

  const restore = useCallback(async () => {
    setRestoring(true);
    setMessage(null);
    const outcome = await restorePurchases();
    setRestoring(false);

    if (outcome.status === "error") {
      setMessageTone("error");
      setMessage(outcome.message);
      return;
    }
    await refresh();
    if (outcome.pro) {
      setMessageTone("success");
      setMessage("Collos Pro restored.");
    } else {
      setMessageTone("info");
      setMessage("No previous Collos Pro purchase was found on this account.");
    }
  }, [refresh]);

  const clearMessage = useCallback(() => setMessage(null), []);

  return {
    status,
    mode: state.mode,
    pro: state.pro,
    plans,
    appUserId: state.appUserId,
    managementUrl: state.managementUrl,
    expiresAt: state.expiresAt,
    busyPlan,
    restoring,
    message,
    messageTone,
    clearMessage,
    purchase,
    restore,
    refresh,
  };
}
