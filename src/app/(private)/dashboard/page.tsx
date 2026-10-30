"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button, Skeleton } from "antd";
import { FiRefreshCw } from "react-icons/fi";
import { getDashboardSummary } from "@/api/dashboard";
import { getHeaderIcon } from "@/layouts/helper";
import { useComponentStore } from "@/store/useComponenetStore";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatDisplayDateTime } from "@/utils/displayDateTime";
import { AttentionCard, Section, StatCard, formatMoney, formatNumber, plural } from "@/components/dashboard/widgets";
import SessionsTable from "@/components/dashboard/SessionsTable";
import { useStaff } from "@/hooks/useStaff";

const DASHBOARD_QUERY_KEY = ["dashboard-summary"];

export default function DashboardPage() {
  const { setHeaderOptions } = useComponentStore();
  const pathname = usePathname();
  const { data: staff } = useStaff();
  // Sessions show members' names and live meeting links, so the table needs the Safety permission
  // (the API enforces the same rule).
  const canSeeSessions = !!staff?.permissions.includes("safety.monitor");

  useEffect(() => {
    setHeaderOptions({ title: "Dashboard", titleIcon: getHeaderIcon(pathname) });
  }, [setHeaderOptions, pathname]);

  // The server caches each figure for a couple of minutes, so reloading is cheap; there is no
  // point asking more often than that.
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: DASHBOARD_QUERY_KEY,
    queryFn: getDashboardSummary,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  });

  if (isLoading) {
    return (
      <div className="p-8" aria-busy="true" aria-label="Loading the dashboard">
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8" role="alert">
        <p className="text-dark mb-3">{getApiErrorMessage(error, "Couldn't load the dashboard.")}</p>
        <Button onClick={() => refetch()} loading={isFetching}>
          Try again
        </Button>
      </div>
    );
  }

  const { attention, numbers, health, unavailable } = data;
  const { members, donations, hiring } = numbers;
  const email = health.email;
  const hasAnything =
    attention.length > 0 || Object.keys(numbers).length > 0 || Object.keys(health).length > 0 || canSeeSessions;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-[#4F4F4F]">
          Updated {formatDisplayDateTime(data.generated_at)}. Figures refresh every few minutes.
        </p>
        <Button icon={<FiRefreshCw aria-hidden />} onClick={() => refetch()} loading={isFetching}>
          Refresh
        </Button>
      </div>

      {unavailable.length > 0 ? (
        <div role="status" className="mb-6 rounded-xl border border-stroke bg-white px-4 py-3 text-sm text-dark">
          Some figures couldn&apos;t load just now. Everything else is up to date. Try Refresh in a moment.
        </div>
      ) : null}

      {!hasAnything ? (
        <p className="text-dark">There&apos;s nothing to summarise for your account yet. Use the menu to open a section.</p>
      ) : null}

      {attention.length > 0 ? (
        <Section title="Needs attention" hint="Work waiting for someone on the team">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {attention.map((item) => (
              <AttentionCard key={item.key} item={item} />
            ))}
          </div>
        </Section>
      ) : null}

      {members || donations || hiring ? (
        <Section title="Key numbers">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {members ? (
              <>
                <StatCard
                  label="Active volunteers"
                  value={formatNumber(members.volunteers)}
                  detail={`${plural(members.new_volunteers_30d, "new sign-up")} in 30 days`}
                  href="/volunteer"
                />
                <StatCard
                  label="Active learners"
                  value={formatNumber(members.learners)}
                  detail={`${plural(members.new_learners_30d, "new sign-up")} in 30 days`}
                  href="/learner"
                />
              </>
            ) : null}
            {donations ? (
              <StatCard
                label="Donations, last 30 days"
                value={formatMoney(donations.total_30d)}
                detail={plural(donations.count_30d, "donation")}
                href="/donations"
              />
            ) : null}
            {hiring ? (
              <StatCard
                label="Careers applications, last 7 days"
                value={formatNumber(hiring.new_applications_7d)}
                href="/hiring"
              />
            ) : null}
          </div>
        </Section>
      ) : null}

      {email ? (
        <Section title="System health">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              label="Notification emails, last 7 days"
              value={
                email.total_7d === 0
                  ? "None sent"
                  : email.failed_7d === 0
                    ? "All delivered"
                    : `${formatNumber(email.failed_7d)} failed`
              }
              detail={`${plural(email.total_7d, "email")} attempted`}
              href="/notifications"
            />
          </div>
        </Section>
      ) : null}

      {canSeeSessions ? (
        <Section title="Sessions" hint="Every session, with a join link for confirmed ones that are still on">
          <SessionsTable />
        </Section>
      ) : null}
    </div>
  );
}
