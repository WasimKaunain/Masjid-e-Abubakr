"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
    mosqueName: "Masjid-e-Abubakr",
    mosqueSubtitle: "A place of peace, prayer and purpose",
    treasurer: "Treasurer",
    donorList: "Donor List",
    language: "Language",
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
    totalCredit: "Total credited amount",
    totalDebit: "Total debited amount",
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
    mosqueName: "Masjid-e-Abubakr",
    mosqueSubtitle: "A place of peace, prayer and purpose",
    treasurer: "खजांची",
    donorList: "दाता सूची",
    language: "भाषा",
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
    totalCredit: "कुल जमा राशि",
    totalDebit: "कुल खर्च राशि",
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
    mosqueName: "Masjid-e-Abubakr",
    mosqueSubtitle: "A place of peace, prayer and purpose",
    treasurer: "خزانچی",
    donorList: "عطیہ دہندگان",
    language: "زبان",
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
    totalCredit: "کل وصولی",
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
  "/images/mosque/mosque-hero-1.jpeg",
  "/images/mosque/mosque-hero-2.jpeg",
  "/images/mosque/mosque-hero-3.jpeg",
  "/images/mosque/mosque-hero-4.jpeg",
  "/images/mosque/mosque-hero-5.jpeg",
  "/images/mosque/mosque-hero-6.jpeg",
  "/images/mosque/mosque-hero-7.jpeg",
  "/images/mosque/mosque-hero-8.jpg",
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
  const [donorOpen, setDonorOpen] = useState(false);
  const t = copy[language];

  const selectedMonth = useMemo(
    () => parseMonthKey(selectedMonthKey),
    [selectedMonthKey],
  );

  return (
    <main className={`dashboard-shell ${language === "ur" ? "rtl" : ""}`}>
      <header className="hero-card hero-banner">
        <div className="hero-header">
          <div className="hero-header__left">
            <div className="hero-logo hero-logo--desktop">
              <Image
                src="/images/mosque/mosque_logo.png"
                alt="Mosque logo"
                width={120}
                height={120}
                priority
              />
            </div>

            <Link
              className="treasurer-fab treasurer-fab--in-header"
              href="/treasurer/login"
              aria-label={t.treasurer}
              title={t.treasurer}
            >
              <span className="treasurer-fab__icon" aria-hidden="true">
                👤
              </span>
            </Link>
          </div>

          <div className="hero-header__center">
            <div className="hero-title-row">
              <h1 className="hero-title">{t.mosqueName}</h1>
            </div>
            <p className="hero-subtitle">{t.mosqueSubtitle}</p>

            <div className="hero-logo hero-logo--mobile">
              <Image
                src="/images/mosque/mosque_logo.png"
                alt="Mosque logo"
                width={120}
                height={120}
                priority
              />
            </div>
          </div>

          <div className="hero-header__right">
            <label className="language-picker language-picker--inline">
              <span className="sr-only">{t.language}</span>
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value as Language)}
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी</option>
                <option value="ur">اردو</option>
              </select>
            </label>

            <button
              type="button"
              className="banner-button"
              onClick={() => setDonorOpen(true)}
            >
              {t.donorList}
            </button>

            <Link
              className="banner-button"
              href="/treasurer/login"
              aria-label={t.treasurer}
              title={t.treasurer}
            >
              {t.treasurer}
            </Link>
          </div>

          {/* Mobile-only stacked controls */}
          <div className="hero-header__mobile-controls">
            <label className="language-picker language-picker--inline">
              <span className="sr-only">{t.language}</span>
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value as Language)}
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी</option>
                <option value="ur">اردو</option>
              </select>
            </label>

            <button
              type="button"
              className="banner-button"
              onClick={() => setDonorOpen(true)}
            >
              {t.donorList}
            </button>

            <Link
              className="banner-button"
              href="/treasurer/login"
              aria-label={t.treasurer}
              title={t.treasurer}
            >
              {t.treasurer}
            </Link>
          </div>
        </div>
      </header>

      <section
        className="image-strip image-strip--scroll"
        aria-label="Mosque gallery"
      >
        {mosqueImages.map((src, index) => (
          <div className="image-frame" key={src}>
            <Image
              src={src}
              alt={`${t.mosqueName} ${index + 1}`}
              fill
              sizes="(max-width: 900px) 90vw, 600px"
              className="mosque-image"
              priority={index === 0}
              style={{ objectFit: "contain" }}
            />
          </div>
        ))}
      </section>

      <DonationProgressHero
        title="Donation Goal"
        progress={donationProgress}
        mosqueName={t.mosqueName}
      />

      {donorOpen && <DonorModal onClose={() => setDonorOpen(false)} />}

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
        </div>

        {activeTab === "transactions" ? (
          <>
            <div className="month-header">
              <label className="month-picker month-picker--center">
                <span className="sr-only">{t.month}</span>
                <select
                  value={selectedMonthKey}
                  onChange={(event) => router.push(`/?month=${event.target.value}`)}
                >
                  {monthOptions.map((option) => {
                    const date = parseMonthKey(option);
                    const label = date ? monthLabel(date) : option;
                    return (
                      <option value={option} key={option}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </label>

              <h2 className="month-title">
                {selectedMonth ? monthLabel(selectedMonth) : selectedMonthKey}
              </h2>
            </div>

            <div className="table-shell transactions-table" aria-label={t.transactions}>
              <table>
                <thead>
                  <tr>
                    <th>{t.donor}</th>
                    <th>{t.amount}</th>
                    <th>{t.type}</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td className="empty-state" colSpan={3}>
                        {t.noTransactions}
                      </td>
                    </tr>
                  ) : (
                    transactions.flatMap((transaction) => {
                      const row = (
                        <tr key={transaction.id}>
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
                        </tr>
                      );

                      const debitDesc =
                        transaction.Type === "Debit" && transaction.Description
                          ? (
                              <tr key={`${transaction.id}-desc`}>
                                <td colSpan={3}>
                                  <div className="transaction-desc-pill">
                                    {transaction.Description}
                                  </div>
                                </td>
                              </tr>
                            )
                          : null;

                      return debitDesc ? [row, debitDesc] : [row];
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="transactions-cards" aria-label="Transactions (mobile)">
              {transactions.length === 0 ? (
                <div className="empty-state">{t.noTransactions}</div>
              ) : (
                transactions.map((transaction) => (
                  <article key={transaction.id} className="transaction-row--compact">
                    <span className="name">{transaction.Name ?? "—"}</span>
                    <span className="amount">{formatCurrency(transaction.Amount)}</span>
                    <span className="type">
                      <span
                        className={`pill ${
                          transaction.Type === "Credit" ? "credit" : "debit"
                        }`}
                      >
                        {transaction.Type ?? "—"}
                      </span>
                    </span>
                    {transaction.Type === "Debit" ? (
                      <span className="desc">{transaction.Description ?? "—"}</span>
                    ) : null}
                  </article>
                ))
              )}
            </div>

            <div className="summary-stack">
              <article className="summary-card capsule-card">
                <span>{t.totalCredit}</span>
                <strong>{formatCurrency(summary.totalCredit)}</strong>
              </article>
              <article className="summary-card capsule-card">
                <span>{t.totalDebit}</span>
                <strong>{formatCurrency(summary.totalDebit)}</strong>
              </article>
              <article className="summary-card capsule-card">
                <span>{t.closingBalance}</span>
                <strong>{formatCurrency(summary.closingBalance)}</strong>
              </article>
            </div>
          </>
        ) : (
          <div className="donation-tab">
            <h2>{t.donationHeading}</h2>
            <p>{t.donationBody}</p>

            <DonationPanel
              title={t.donationHeading}
              body={t.donationBody}
              amountLabel={t.amountToDonate}
              payLabel={t.payNow}
              missingUpiLabel={t.missingUpi}
              progress={donationProgress}
              upiId={upiId}
            />
          </div>
        )}
      </section>

      <footer className="site-footer" aria-label="Footer">
        <div className="site-footer__inner">
          <p>
            Developed by <strong>Wasim Konain</strong>.
          </p>
          <p>
            © 2026 <strong>Masjid-e-Abubakr</strong>. All rights reserved. Made with
            {" "}
            <span aria-label="heart" role="img">
              ❤️
            </span>
            .
          </p>
        </div>
      </footer>
    </main>
  );
}

function DonationProgressHero({
  title,
  progress,
  mosqueName,
}: {
  title: string;
  progress: { current: number; target: number };
  mosqueName: string;
}) {
  const percent =
    progress.target > 0
      ? Math.min(100, (progress.current / progress.target) * 100)
      : 0;

  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    // moderate animation speed
    const timeout = window.setTimeout(() => setAnimated(percent), 180);
    return () => window.clearTimeout(timeout);
  }, [percent]);

  const achieved = percent >= 100 && progress.target > 0;

  // Red -> Yellow -> Green
  const barGradient =
    percent >= 80
      ? "linear-gradient(90deg, #22c55e, #16a34a)"
      : percent >= 40
        ? "linear-gradient(90deg, #f97316, #facc15)"
        : "linear-gradient(90deg, #ef4444, #f97316)";

  return (
    <section className={`hero-progress ${achieved ? "achieved" : ""}`}>
      <div className="hero-progress__top">
        <strong>{title}</strong>
        <span>
          {formatCurrency(progress.current)} / {formatCurrency(progress.target)}
        </span>
      </div>
      <div className="progress-track" aria-label={title}>
        <div
          className="progress-fill"
          style={{ width: `${animated}%`, background: barGradient }}
        />
      </div>
      {achieved && (
        <p className="hero-progress__note">Goal achieved for {mosqueName}.</p>
      )}
    </section>
  );
}

function DonorModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<
    { id: number; name: string; amount: number; paid_or_not: boolean }[]
  >([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const res = await fetch("/api/public/donors");
        const data = (await res.json()) as {
          donors?: { id: number; name: string; amount: number; paid_or_not: boolean }[];
          message?: string;
        };
        if (!res.ok) throw new Error(data.message ?? "Unable to load donors");
        if (mounted) setRows(data.donors ?? []);
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : "Unable to load donors");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      mounted = false;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <button className="modal-close" type="button" onClick={onClose} aria-label="Close">
          ×
        </button>
        <h2 className="modal-title">Donor List</h2>

        {loading ? (
          <p className="modal-note">Loading...</p>
        ) : error ? (
          <p className="modal-note">{error}</p>
        ) : (
          <div className="donor-list">
            {rows.map((donor) => (
              <div className="donor-row" key={donor.id}>
                <span className="donor-row__name">{donor.name}</span>
                <span className="donor-row__amount">₹{donor.amount.toFixed(2)}</span>
                <span className={`status ${donor.paid_or_not ? "paid" : "unpaid"}`}>
                  {donor.paid_or_not ? "✓ Paid" : "✕ Due"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DonationPanel({
  title,
  body,
  amountLabel,
  payLabel,
  missingUpiLabel,
  progress,
  upiId,
}: {
  title: string;
  body: string;
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
