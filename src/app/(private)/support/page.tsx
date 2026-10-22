"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useComponentStore } from "@/store/useComponenetStore";
import { useStaff } from "@/hooks/useStaff";
import { canAccessPath } from "@/constants/access";

// Support landing page: shortcuts to the application queues this account can work on. The links
// shown come from the server's permission list for the account, like the sidebar.
const QUEUES = [
  { href: "/volunteer", title: "Volunteer applications", text: "Review volunteers and approve or decline their applications." },
  { href: "/learner", title: "Learner applications", text: "Review learners and approve or decline their applications." },
  { href: "/hiring", title: "Careers applications", text: "Read careers applications and download resumes." },
  { href: "/profile-changes", title: "Profile changes", text: "Approve or decline edits members have requested to their profile." },
];

export default function SupportDashboard() {
  const { setHeaderOptions } = useComponentStore();
  const pathname = usePathname();
  const { data: staff, isLoading } = useStaff();

  useEffect(() => {
    setHeaderOptions({ title: "Support", titleIcon: null });
  }, [setHeaderOptions, pathname]);

  const queues = QUEUES.filter((q) => canAccessPath(q.href, staff?.permissions ?? []));

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold">Support dashboard</h2>
      <p className="mt-1 text-gray-600">
        {staff?.username ? `Welcome, ${staff.username}. ` : ""}Pick a queue to start.
      </p>
      {isLoading ? (
        <p className="mt-6 text-gray-500">Loading...</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {queues.map((q) => (
            <Link
              key={q.href}
              href={q.href}
              className="rounded-2xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
            >
              <p className="text-lg font-medium text-[#121212]">{q.title}</p>
              <p className="mt-1 text-sm text-gray-600">{q.text}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
