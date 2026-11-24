"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useComponentStore } from "@/store/useComponenetStore";
import { useStaff } from "@/hooks/useStaff";
import { canAccessPath } from "@/constants/access";
import { getHeaderIcon } from "@/layouts/helper";
import { findNavItem } from "@/config/nav";
import { navIcon } from "@/components/common/Sidebar/navIcons";
import PageHeader from "@/components/common/PageHeader";
import EmptyState from "@/components/common/EmptyState";
import { FiArrowRight } from "react-icons/fi";

// Support landing page: shortcuts to the application queues this account can work on. The links
// shown come from the server's permission list for the account, like the sidebar.
const QUEUES = [
  { href: "/volunteer", title: "Volunteer Applications", text: "Review volunteers and approve or reject their applications." },
  { href: "/learner", title: "Learner Applications", text: "Review learners and approve or reject their applications." },
  { href: "/hiring", title: "Careers Applications", text: "Read careers applications and download resumes." },
  { href: "/profile-changes", title: "Profile Changes", text: "Approve or reject edits members have requested to their profile." },
];

export default function SupportDashboard() {
  const { setHeaderOptions } = useComponentStore();
  const pathname = usePathname();
  const { data: staff, isLoading } = useStaff();

  useEffect(() => {
    setHeaderOptions({ title: "Support", titleIcon: getHeaderIcon(pathname) });
  }, [setHeaderOptions, pathname]);

  const queues = QUEUES.filter((q) => canAccessPath(q.href, staff?.permissions ?? []));

  return (
    <div className="p-6">
      <h2 className="sr-only">Support dashboard</h2>
      <PageHeader
        description={`${staff?.username ? `Welcome, ${staff.username}. ` : ""}Pick a queue to start.`}
      />
      {isLoading ? (
        <p className="mt-6 text-ink-2">Loading...</p>
      ) : queues.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-stroke bg-white">
          <EmptyState
            title="No areas yet"
            description="Your account doesn't have access to any areas yet. Please ask an admin."
          />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {queues.map((q) => {
            const nav = findNavItem(q.href);
            return (
              <Link
                key={q.href}
                href={q.href}
                className="group flex items-start gap-4 rounded-2xl border border-stroke bg-white p-5 transition-colors hover:border-brand-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink"
              >
                <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-tint text-xl text-brand-ink">
                  {nav ? navIcon(nav.item.icon) : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-semibold text-ink">{q.title}</span>
                  <span className="mt-1 block text-sm text-ink-2">{q.text}</span>
                </span>
                <FiArrowRight aria-hidden className="mt-1 shrink-0 text-ink-3 transition-colors group-hover:text-brand-ink" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
