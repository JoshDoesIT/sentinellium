/**
 * @module Badge State Management
 * @description Controls the extension toolbar badge to communicate
 * status at a glance. Maps extension states to badge text, colors,
 * and tooltip titles using the Sentinellium brand color palette.
 */

/** All possible extension states shown via the toolbar badge. */
export enum BadgeState {
  IDLE = "IDLE",
  SCANNING = "SCANNING",
  THREAT_DETECTED = "THREAT_DETECTED",
  PROTECTED = "PROTECTED",
  DISABLED = "DISABLED",
  ERROR = "ERROR",
}

/** Configuration for a single badge state. */
interface BadgeConfig {
  text: string;
  color: string;
  title: string;
}

/**
 * Brand-aligned colors from SECURITY.md severity mapping.
 * These match the Sentinellium design system.
 */
const COLORS = {
  cyan: "#1AC8FF",
  green: "#34D058",
  red: "#E63946",
  orange: "#F77F00",
  gray: "#6B7280",
} as const;

/**
 * Get the badge configuration for a given state.
 * Optionally accepts a threat count for THREAT_DETECTED state.
 */
export function getBadgeConfig(
  state: BadgeState,
  threatCount?: number,
): BadgeConfig {
  switch (state) {
    case BadgeState.IDLE:
      return { text: "", color: COLORS.gray, title: "Sentinellium: Idle" };
    case BadgeState.SCANNING:
      return {
        text: "...",
        color: COLORS.cyan,
        title: "Sentinellium: Scanning",
      };
    case BadgeState.THREAT_DETECTED:
      return {
        text: threatCount ? String(threatCount) : "!",
        color: COLORS.red,
        title: "Sentinellium: Threat Detected",
      };
    case BadgeState.PROTECTED:
      return {
        text: "✓",
        color: COLORS.green,
        title: "Sentinellium: Protected",
      };
    case BadgeState.DISABLED:
      return {
        text: "OFF",
        color: COLORS.gray,
        title: "Sentinellium: Disabled",
      };
    case BadgeState.ERROR:
      return {
        text: "ERR",
        color: COLORS.orange,
        title: "Sentinellium: Error",
      };
  }
}

/**
 * Apply a badge state to the extension toolbar icon.
 * Sets badge text, background color, and tooltip title.
 */
export async function setBadgeState(
  state: BadgeState,
  threatCount?: number,
): Promise<void> {
  const config = getBadgeConfig(state, threatCount);

  await Promise.all([
    chrome.action.setBadgeText({ text: config.text }),
    chrome.action.setBadgeBackgroundColor({ color: config.color }),
    chrome.action.setTitle({ title: config.title }),
  ]);
}
