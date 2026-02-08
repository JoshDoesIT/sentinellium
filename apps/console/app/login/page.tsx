"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";

/**
 * @module Login Page
 * @description Enterprise login with email/password + MFA TOTP step.
 * Includes SSO placeholder, session timeout notice, and error handling.
 */

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"credentials" | "mfa">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const digitRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleCredentialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    // Simulate credential check — move to MFA step
    setStep("mfa");
  };

  const handleDigitChange = useCallback(
    (index: number, value: string) => {
      if (!/^\d?$/.test(value)) return;

      const next = [...mfaCode];
      next[index] = value;
      setMfaCode(next);

      // Auto-advance to next digit
      if (value && index < 5) {
        digitRefs.current[index + 1]?.focus();
      }

      // Auto-submit when all 6 digits entered
      if (value && index === 5 && next.every((d) => d)) {
        router.push("/");
      }
    },
    [mfaCode, router],
  );

  const handleDigitKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !mfaCode[index] && index > 0) {
      digitRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className={styles["login-page"]}>
      <div className={styles["login-card"]}>
        <Image
          src="/logo.png"
          alt="Sentinellium"
          width={56}
          height={56}
          className={styles["login-card__logo"]}
          priority
        />
        <span className={styles["login-card__wordmark"]}>Sentinellium</span>
        <span className={styles["login-card__tagline"]}>
          Intelligence at the edge. Privacy at the core.
        </span>

        {error && <div className={styles["login-error"]}>{error}</div>}

        {step === "credentials" && (
          <>
            <form
              className={styles["login-form"]}
              onSubmit={handleCredentialSubmit}
            >
              <div className={styles["login-form__field"]}>
                <label className={styles["login-form__label"]} htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="input"
                  placeholder="analyst@corp.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  autoFocus
                />
              </div>

              <div className={styles["login-form__field"]}>
                <label
                  className={styles["login-form__label"]}
                  htmlFor="password"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  className="input"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>

              <label className={styles["login-form__remember"]}>
                <input type="checkbox" />
                Remember this device for 30 days
              </label>

              <button
                type="submit"
                className={`btn btn--primary ${styles["login-form__submit"]}`}
              >
                Sign In
              </button>
            </form>

            <div className={styles["sso-divider"]}>or</div>

            <button className={`btn btn--secondary ${styles["sso-btn"]}`}>
              Sign in with SSO
            </button>
          </>
        )}

        {step === "mfa" && (
          <div className={styles["mfa-section"]}>
            <span className={styles["mfa-section__title"]}>
              Two-Factor Authentication
            </span>
            <span className={styles["mfa-section__desc"]}>
              Enter the 6-digit code from your authenticator app
            </span>

            <div className={styles["mfa-digits"]}>
              {mfaCode.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    digitRefs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  className={styles["mfa-digit"]}
                  value={digit}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleDigitKeyDown(i, e)}
                  autoFocus={i === 0}
                  aria-label={`Digit ${i + 1}`}
                />
              ))}
            </div>

            <button
              className="btn btn--ghost"
              onClick={() => {
                setStep("credentials");
                setMfaCode(["", "", "", "", "", ""]);
              }}
            >
              ← Back to login
            </button>
          </div>
        )}

        <span className={styles["session-notice"]}>
          Sessions expire after 30 minutes of inactivity
        </span>
      </div>
    </div>
  );
}
