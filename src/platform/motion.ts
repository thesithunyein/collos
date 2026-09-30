import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/**
 * Whether the person has asked the system for less motion.
 *
 * Accessibility, not preference: vestibular disorders make spring and
 * count-up motion genuinely unpleasant, and iOS, Android and the browser all
 * expose the setting through the same `AccessibilityInfo` surface. Honouring it
 * is one of the things Apple's design criteria ask for by name.
 *
 * Never throws. Every call is guarded and every field of the result is optional,
 * so a platform that cannot answer reports `false` — the default behaviour
 * rather than a broken one. Same never-failing contract as the storage and
 * purchases wrappers.
 */
export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const ask = AccessibilityInfo.isReduceMotionEnabled;
    if (typeof ask === "function") {
      Promise.resolve(ask.call(AccessibilityInfo))
        .then((value) => {
          if (!cancelled) setReduce(Boolean(value));
        })
        .catch(() => {});
    }

    // `addEventListener`'s typings in React Native 0.74 enumerate only a few of
    // the events the runtime actually emits, and `reduceMotionChanged` is not
    // among them. The call is real and documented — the type is what is out of
    // date — so the signature is narrowed here rather than the subscription
    // dropped, and the result is treated as possibly absent.
    const subscribe = AccessibilityInfo.addEventListener as unknown as (
      event: string,
      handler: (value: boolean) => void,
    ) => { remove?: () => void } | undefined;

    if (typeof subscribe !== "function") {
      return () => {
        cancelled = true;
      };
    }

    const subscription = subscribe.call(AccessibilityInfo, "reduceMotionChanged", (value) =>
      setReduce(Boolean(value)),
    );

    return () => {
      cancelled = true;
      subscription?.remove?.();
    };
  }, []);

  return reduce;
}
