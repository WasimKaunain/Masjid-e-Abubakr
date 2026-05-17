export async function sendTreasurerOtp(email: string, otp: string) {
  const domain = process.env.MAILGUN_DOMAIN;
  const apiKey = process.env.MAILGUN_API_KEY;
  const from = process.env.MAIL_FROM;

  if (!domain || !apiKey || !from) {
    throw new Error("Mailgun environment variables are missing");
  }

  const body = new URLSearchParams({
    from,
    to: email,
    subject: "Your treasurer OTP",
    text: `Your OTP is ${otp}. It is valid for 5 minutes.`,
  });

  const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`Mailgun request failed with status ${response.status}`);
  }
}
