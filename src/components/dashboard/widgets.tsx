import Link from "next/link";
import type { ReactNode } from "react";

const formatNumber = (value: number) => value.toLocaleString("en-US");
const formatMoney = (value: number) =>
  value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });

export const Section = ({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) => (
  <section className="mb-8" aria-label={title}>
    <div className="flex items-baseline gap-3 mb-3">
      <h2 className="text-lg font-semibold text-dark">{title}</h2>
      {hint ? <span className="text-sm text-[#4F4F4F]">{hint}</span> : null}
    </div>
    {children}
  </section>
);

// One queue (e.g. "Volunteer applications to review"). Colour marks work waiting, but the words
// ("All clear" / the number) carry the meaning too.
export const AttentionCard = ({ item }: { item: DashboardAttentionItem }) => {
  const waiting = item.count > 0;
  return (
    <Link
      href={item.href}
      className={`block rounded-2xl p-5 bg-white border transition-shadow hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
        waiting ? "border-primary" : "border-stroke"
      }`}
    >
      <div className={`text-4xl font-semibold ${waiting ? "text-dark" : "text-[#4F4F4F]"}`}>{formatNumber(item.count)}</div>
      <div className="mt-1 text-sm text-dark">{item.label}</div>
      <div className={`mt-3 text-xs font-medium ${waiting ? "text-[#046A8A]" : "text-success"}`}>
        {waiting ? "Review now →" : "All clear"}
      </div>
    </Link>
  );
};

export const StatCard = ({
  label,
  value,
  detail,
  href,
}: {
  label: string;
  value: string;
  detail?: string;
  href?: string;
}) => {
  const body = (
    <>
      <div className="text-xs uppercase font-medium text-[#4F4F4F] tracking-wide">{label}</div>
      <div className="mt-2 text-3xl font-semibold text-dark">{value}</div>
      {detail ? <div className="mt-1 text-sm text-[#4F4F4F]">{detail}</div> : null}
    </>
  );
  const base = "block rounded-2xl p-5 bg-white border border-stroke";
  return href ? (
    <Link href={href} className={`${base} hover:shadow-md transition-shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary`}>
      {body}
    </Link>
  ) : (
    <div className={base}>{body}</div>
  );
};

export const plural = (count: number, one: string, many = `${one}s`) => `${formatNumber(count)} ${count === 1 ? one : many}`;
export { formatNumber, formatMoney };