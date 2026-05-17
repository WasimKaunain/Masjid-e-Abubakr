"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TreasurerLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function sendOtp() {
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await response.json();
    setBusy(false);

    if (!response.ok) {
      setMessage(data.message);
      return;
    }

    setStep("otp");
    setMessage("OTP sent. It is valid for 5 minutes.");
  }

  async function verifyOtp() {
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ otp }),
    });
    const data = await response.json();
    setBusy(false);

    if (!response.ok) {
      setMessage(data.message);
      return;
    }

    router.push("/treasurer");
    router.refresh();
  }

  return (
    <div className="form-stack">
      <label>
        <span>Treasurer email</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={step === "otp"}
          placeholder="treasurer@example.com"
        />
      </label>

      {step === "otp" && (
        <label>
          <span>Enter OTP</span>
          <input
            inputMode="numeric"
            value={otp}
            onChange={(event) => setOtp(event.target.value)}
            placeholder="6-digit OTP"
          />
        </label>
      )}

      {message && <p className="form-message">{message}</p>}

      {step === "email" ? (
        <button className="primary-button" onClick={sendOtp} disabled={busy}>
          {busy ? "Sending..." : "Send OTP"}
        </button>
      ) : (
        <button className="primary-button" onClick={verifyOtp} disabled={busy}>
          {busy ? "Verifying..." : "Verify OTP"}
        </button>
      )}
    </div>
  );
}
