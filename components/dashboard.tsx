"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { monthLabel, parseMonthKey } from "@/lib/months";

type Transaction = {
  id: number;
  Name: string | null;
  Amount: number;
  Type: "Credit" | "Debit" | null;
  Description: string | null;
  Timestamp: string | null;
};

type Summary = {
  totalCredit: number;
  totalDebit: number;
  previousBalance: number;
  remaining: number;
  closingBalance: number;
};

type DashboardProps = {
  currentMonthKey: string;
  selectedMonthKey: string;
  monthOptions: string[];
  transactions: Transaction[];
  summary: Summary;
  donationProgress: {
    current: number;
    target: number;
  };
  upiId: string;
};

type Language = "en" | "hi" | "ur";

const copy = {
  en: {
    transactions: "Transactions",
    donations: "Donations",
    month: "Choose month",
    currentMonth: "Current month",
    date: "Date",
    donor: "Name",
    amount: "Amount",
    type: "Type",
    description: "Description",
    noTransactions: "No transactions recorded for this month yet.",
    totalCredit: "Total credit",
    totalDebit: "Total debit",
    previousBalance: "Previous balance",
    remaining: "Month remaining",
    closingBalance: "Closing balance",
    donationHeading: "Support the mosque",
    donationBody: "Choose an amount and continue in your UPI app.",
    currentProgress: "Current month collection",
    amountToDonate: "Donation amount",
    payNow: "Pay now with UPI",
    missingUpi: "UPI ID is not configured yet.",
  },
  hi: {
    transactions: "लेन-देन",
    donations: "दान",
    month: "महीना चुनें",
    currentMonth: "वर्तमान महीना",
    date: "तारीख",
    donor: "नाम",
    amount: "राशि",
    type: "प्रकार",
    description: "विवरण",
    noTransactions: "इस महीने के लिए अभी कोई लेन-देन दर्ज नहीं है।",
    totalCredit: "कुल जमा",
    totalDebit: "कुल खर्च",
    previousBalance: "पिछला शेष",
    remaining: "महीने का शेष",
    closingBalance: "अंतिम शेष",
    donationHeading: "मस्जिद की मदद करें",
    donationBody: "राशि चुनें और अपने UPI ऐप में आगे बढ़ें।",
    currentProgress: "वर्तमान महीने का संग्रह",
    amountToDonate: "दान राशि",
    payNow: "UPI से भुगतान करें",
    missingUpi: "UPI ID अभी सेट नहीं है।",
  },
  ur: {
    transactions: "لین دین",
    donations: "عطیات",
    month: "مہینہ منتخب کریں",
    currentMonth: "موجودہ مہینہ",
    date: "تاریخ",
    donor: "نام",
    amount: "رقم",
    type: "قسم",
    description: "تفصیل",
    noTransactions: "اس مہینے کے لیے ابھی کوئی لین دین درج نہیں ہوا۔",
    totalCredit: "کل آمدنی",
    totalDebit: "کل خرچ",
    previousBalance: "پچھلا بیلنس",
    remaining: "ماہانہ باقی",
    closingBalance: "اختتامی بیلنس",
    donationHeading: "مسجد کی مدد کریں",
    donationBody: "رقم منتخب کریں اور اپنے UPI ایپ میں آگے بڑھیں۔",
    currentProgress: "موجودہ مہینے کی وصولی",
    amountToDonate: "عطیہ کی رقم",
    payNow: "UPI سے ادائیگی کریں",
    missingUpi: "UPI ID ابھی ترتیب نہیں دی گئی۔",
  },
} satisfies Record<Language, Record<string, string>>;

const mosqueImages = [
  "/images/mosque/mosque-hero-1.jpg",
  "/images/mosque/mosque-hero-2.jpg",
  "/images/mosque/mosque-hero-3.jpg",
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function Dashboard({
  currentMonthKey,
  selectedMonthKey,
  monthOptions,
  transactions,
  summary,
  donationProgress,
  upiId,
}: DashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"transactions" | "donations">(
    "transactions",
  );
  const [language, setLanguage] = useState<Language>("en");
  const t = copy[language];

  const selectedMonth = useMemo(
    () => parseMonthKey(selectedMonthKey),
    [selectedMonthKey],
  );

  return (
    <main className={`dashboard-shell ${language === "ur" ? "rtl" : ""}`}>
      <header className="hero-card">
        <div className="top-row">
          <div>
            <p className="eyebrow">Masjide AbuBakr</p>
            <h1>Masjide AbuBakr</h1>
          </div>

          <div className="header-actions">
            <Link className="soft-link" href="/donors" target="_blank">
              Donor List
            </Link>
            <Link className="primary-link" href="/treasurer/login">
              Treasurer
            </Link>
            <label className="language-picker">
              <span>Language</span>
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value as Language)}
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी</option>
                <option value="ur">اردو</option>
              </select>
            </label>
          </div>
        </div>

        <section className="image-strip" aria-label="Mosque gallery">
          {mosqueImages.map((src, index) => (
            <div className="image-frame" key={src}>
              <Image
                src={src}
                alt={`Mosque view ${index + 1}`}
                fill
                sizes="(max-width: 900px) 100vw, 33vw"
                className="mosque-image"
              />
            </div>
          ))}
        </section>
      </header>

      <section className="panel">
        <div className="tab-row">
          <div className="tabs" role="tablist" aria-label="Dashboard sections">
            <button
              className={activeTab === "transactions" ? "active" : ""}
              onClick={() => setActiveTab("transactions")}
              role="tab"
              aria-selected={activeTab === "transactions"}
            >
              {t.transactions}
            </button>
            <button
              className={activeTab === "donations" ? "active" : ""}
              onClick={() => setActiveTab("donations")}
              role="tab"
              aria-selected={activeTab === "donations"}
            >
              {t.donations}
            </button>
          </div>

          {activeTab === "transactions" && (
            <label className="month-picker">
              <span>{t.month}</span>
              <select
                value={selectedMonthKey}
                onChange={(event) => router.push(`/?month=${event.target.value}`)}
              >
                {monthOptions.map((option) => {
                  const date = parseMonthKey(option);
                  const label = date ? monthLabel(date) : option;
                  return (
                    <option value={option} key={option}>
                      {option === currentMonthKey ? `${t.currentMonth} — ` : ""}
                      {label}
                    </option>
                  );
                })}
              </select>
            </label>
          )}
        </div>

        {activeTab === "transactions" ? (
          <>
            <div className="section-heading">
              <h2>{selectedMonth ? monthLabel(selectedMonth) : selectedMonthKey}</h2>
            </div>

            <div className="table-shell">
              <table>
                <thead>
                  <tr>
                    <th>{t.date}</th>
                    <th>{t.donor}</th>
                    <th>{t.amount}</th>
                    <th>{t.type}</th>
                    <th>{t.description}</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td className="empty-state" colSpan={5}>
                        {t.noTransactions}
                      </td>
                    </tr>
                  ) : (
                    transactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td>{formatDate(transaction.Timestamp)}</td>
                        <td>{transaction.Name ?? "—"}</td>
                        <td>{formatCurrency(transaction.Amount)}</td>
                        <td>
                          <span
                            className={`pill ${
                              transaction.Type === "Credit" ? "credit" : "debit"
                            }`}
                          >
                            {transaction.Type ?? "—"}
                          </span>
                        </td>
                        <td>{transaction.Description ?? "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="summary-grid">
              <article>
                <span>{t.totalCredit}</span>
                <strong>{formatCurrency(summary.totalCredit)}</strong>
              </article>
              <article>
                <span>{t.totalDebit}</span>
                <strong>{formatCurrency(summary.totalDebit)}</strong>
              </article>
              <article>
                <span>{t.previousBalance}</span>
                <strong>{formatCurrency(summary.previousBalance)}</strong>
              </article>
              <article>
                <span>{t.remaining}</span>
                <strong>{formatCurrency(summary.remaining)}</strong>
              </article>
              <article className="closing-card">
                <span>{t.closingBalance}</span>
                <strong>{formatCurrency(summary.closingBalance)}</strong>
              </article>
            </div>
          </>
        ) : (
          <DonationPanel
            title={t.donationHeading}
            body={t.donationBody}
            progressLabel={t.currentProgress}
            amountLabel={t.amountToDonate}
            payLabel={t.payNow}
            missingUpiLabel={t.missingUpi}
            progress={donationProgress}
            upiId={upiId}
          />
        )}
      </section>
    </main>
  );
}

function DonationPanel({
  title,
  body,
  progressLabel,
  amountLabel,
  payLabel,
  missingUpiLabel,
  progress,
  upiId,
}: {
  title: string;
  body: string;
  progressLabel: string;
  amountLabel: string;
  payLabel: string;
  missingUpiLabel: string;
  progress: { current: number; target: number };
  upiId: string;
}) {
  const [amount, setAmount] = useState("");
  const percent =
    progress.target > 0
      ? Math.min(100, (progress.current / progress.target) * 100)
      : 0;
  const numericAmount = Number(amount);
  const paymentHref =
    upiId && numericAmount > 0
      ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
          "Masjide AbuBakr",
        )}&am=${numericAmount}&cu=INR`
      : "";

  return (
    <div className="donation-card donation-layout">
      <div>
        <h2>{title}</h2>
        <p>{body}</p>

        <div className="donation-progress">
          <span>{progressLabel}</span>
          <div className="progress-track" aria-label={progressLabel}>
            <div className="progress-fill" style={{ width: `${percent}%` }} />
          </div>
          <strong>
            {formatCurrency(progress.current)} / {formatCurrency(progress.target)}
          </strong>
        </div>
      </div>

      <div className="donation-action-card">
        <label>
          <span>{amountLabel}</span>
          <input
            type="number"
            min="1"
            step="1"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="500"
          />
        </label>

        <div className="quick-amounts">
          {[100, 500, 1000].map((value) => (
            <button key={value} type="button" onClick={() => setAmount(String(value))}>
              ₹{value}
            </button>
          ))}
        </div>

        {paymentHref ? (
          <a className="donate-button" href={paymentHref}>
            {payLabel}
          </a>
        ) : (
          <p className="donation-note">
            {upiId ? "Enter a valid amount to continue." : missingUpiLabel}
          </p>
        )}
      </div>
    </div>
  );
}
