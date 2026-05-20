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

  async function sendOtp() 
    {
      setBusy(true);
      setMessage("");
      const response = await fetch("/api/auth/send-otp", {method: "POST",headers: { "Content-Type": "application/json" },body: JSON.stringify({ email }),});
      const data = await response.json();
      setBusy(false);

      if (!response.ok) { setMessage(data.message); return; }

      setStep("otp");
      setMessage("OTP sent. It is valid for 5 minutes.");
    }

  async function verifyOtp() 
    {
      setBusy(true);
      setMessage("");
      const response = await fetch("/api/auth/verify-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ otp }), });
      const data = await response.json();
      setBusy(false);

      if (!response.ok) { setMessage(data.message); return; }

      router.push("/treasurer");
      router.refresh();
    }

  return (
    <div className="treasurer-login-card">
      <div className="login-header">
        <h3>Treasurer Login</h3>
        <p>Secure access for mosque treasury management</p>
      </div>

      <div className="form-stack form-stack--polished">
        <label className="form-field">
          <span>Treasurer Email</span>

          <div className="input-wrapper">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={step === "otp"}
              placeholder="treasurer@example.com"
            />
          </div>
        </label>

        {step === "otp" && (
          <label className="form-field">
            <span>Enter OTP</span>
        
            <div className="input-wrapper">
              <input
                inputMode="numeric"
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                placeholder="6-digit OTP"
              />
            </div>
          </label>
        )}

        {message && (
          <p className="form-message">
            {message}
          </p>
        )}

        {step === "email" ? (
          <button
            className="primary-button login-button"
            onClick={sendOtp}
            disabled={busy}
          >
            {busy ? "Sending..." : "Send OTP"}
          </button>
        ) : (
          <button
            className="primary-button login-button"
            onClick={verifyOtp}
            disabled={busy}
          >
            {busy ? "Verifying..." : "Verify OTP"}
          </button>
        )}
      </div>
    </div>
  );
}
