"use client";

import React, { useEffect, useState } from "react";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { useGuardedMutation } from "@/hooks/useGuardedMutation";
import { GET_API, POST_API } from "@/api/request";
import { endpoints } from "@/api/constants";
import { Button, Select } from "antd";
import Table from "@/components/Table";
import StatusTag from "@/components/common/StatusTag";
import { shortId } from "@/utils/auditLog";
import { useComponentStore } from "@/store/useComponenetStore";
import { usePathname } from "next/navigation";
import { getHeaderIcon } from "@/layouts/helper";
import { showToast } from "@/components/common/Toast";
import { getApiErrorMessage } from "@/utils/apiError";
import ErrorMsg from "@/components/common/Messages/ErrorMsg";
import { formatDisplayDateTime } from "@/utils/displayDateTime";

type TriggerSide = "learner" | "volunteer";

export default function MatchingPage() {
  const { setHeaderOptions } = useComponentStore();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [side, setSide] = useState<TriggerSide>("learner");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Remembered so the Select keeps showing the chosen name after a new search replaces the
  // option list (otherwise antd falls back to displaying the raw id).
  const [selectedOption, setSelectedOption] = useState<{ value: string; label: string } | null>(null);

  // The picker used to fetch a flat page=1&size=100 and filter client-side, so a
  // learner/volunteer past the first 100 verified users could never be found.
  // Now debounced server-side search, matching the pattern already used on the
  // hiring page - search_query is filtered server-side over the full list.
  const [pickerSearch, setPickerSearch] = useState("");
  const [debouncedPickerSearch, setDebouncedPickerSearch] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedPickerSearch(pickerSearch.trim()), 300);
    return () => clearTimeout(timeout);
  }, [pickerSearch]);

  useEffect(() => {
    // Clear any in-flight search text when switching who we're matching on
    // behalf of, so leftover text from one list doesn't look like a filter on
    // the other.
    setPickerSearch("");
    setDebouncedPickerSearch("");
  }, [side]);

  useEffect(() => {
    setHeaderOptions({
      title: "Matching",
      titleIcon: getHeaderIcon(pathname),
    });
  }, [setHeaderOptions, pathname]);

  // Verified members only, 50 per page; further pages load on demand ("Load more" in the list) so
  // the picker is no longer capped at the first 50. The server search narrows the whole list.
  const PICKER_PAGE_SIZE = 50;
  type PickerOption = { value: string; label: string };
  const fetchPickerPage = async (
    url: string,
    page: number,
    toOption: (item: any) => PickerOption
  ): Promise<{ options: PickerOption[]; fetched: number; total: number; page: number }> => {
    const params = new URLSearchParams({
      page: String(page),
      size: String(PICKER_PAGE_SIZE),
      onboarded_status: "verification_completed",
    });
    if (debouncedPickerSearch) params.append("search_query", debouncedPickerSearch);
    const res: any = await GET_API(`${url}?${params.toString()}`);
    const items: any[] = res?.data?.items || [];
    return {
      options: items.filter((m) => m.onboarded_status === "verification_completed").map(toOption),
      fetched: items.length,
      total: Number(res?.data?.total ?? 0),
      page,
    };
  };
  const nextPickerPage = (last: { fetched: number; total: number; page: number }, all: { fetched: number }[]) =>
    last.fetched > 0 && all.reduce((n, p) => n + p.fetched, 0) < last.total ? last.page + 1 : undefined;
  // A member can appear on two pages if the list shifts between requests; keep the first.
  const mergePickerPages = (pages?: { options: PickerOption[] }[]): PickerOption[] => {
    const seen = new Set<string>();
    return (pages ?? []).flatMap((p) => p.options).filter((o) => (seen.has(o.value) ? false : (seen.add(o.value), true)));
  };

  const learnerPicker = useInfiniteQuery({
    queryKey: ["matching-learners-picker", debouncedPickerSearch],
    queryFn: ({ pageParam }) =>
      fetchPickerPage(endpoints.learner.getAllLearners, pageParam, (l) => ({
        value: l.learner_id,
        label: l.learner_full_name || l.learner_id,
      })),
    initialPageParam: 1,
    getNextPageParam: nextPickerPage,
    enabled: side === "learner",
  });
  const volunteerPicker = useInfiniteQuery({
    queryKey: ["matching-volunteers-picker", debouncedPickerSearch],
    queryFn: ({ pageParam }) =>
      fetchPickerPage(endpoints.volunteer.getAllVolunteers, pageParam, (v) => ({
        value: v.volunteer_id,
        label:
          v.volunteer_first_name && v.volunteer_last_name
            ? `${v.volunteer_first_name} ${v.volunteer_last_name}`
            : v.volunteer_id,
      })),
    initialPageParam: 1,
    getNextPageParam: nextPickerPage,
    enabled: side === "volunteer",
  });
  const picker = side === "learner" ? learnerPicker : volunteerPicker;
  const pickerOptions = mergePickerPages(picker.data?.pages);
  const pickerTotal = picker.data?.pages[0]?.total ?? 0;

  const [matchesPage, setMatchesPage] = useState(1);
  const [matchesPageSize, setMatchesPageSize] = useState(15);

  const {
    data: matchesData,
    isLoading: isMatchesLoading,
    isError: isMatchesError,
    refetch: refetchMatches,
    isFetching: isMatchesFetching,
  } = useQuery({
    queryKey: ["matches", matchesPage, matchesPageSize],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(matchesPage),
        size: String(matchesPageSize),
      });
      const res: any = await GET_API(`${endpoints.match.getAll}?${params.toString()}`);
      return { items: res?.data?.items || [], total: res?.data?.total ?? 0 };
    },
  });
  const matches = matchesData?.items || [];
  const matchesTotal = matchesData?.total ?? 0;

  const triggerMutation = useGuardedMutation({
    mutationFn: (payload: { learner_id?: string; volunteer_id?: string }) =>
      POST_API(endpoints.match.trigger, payload),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      setSelectedId(null);
      if (res?.data?.status === "no_match_found") {
        showToast({ type: "info", message: "No eligible candidate found for this match." });
      } else {
        showToast({ type: "success", message: "Match triggered successfully" });
      }
    },
    onError: (err) => {
      showToast({ type: "error", message: getApiErrorMessage(err, "Couldn't trigger the match. Please try again.") });
    },
  });

  const handleTrigger = () => {
    if (!selectedId) return;
    triggerMutation.mutate(
      side === "learner" ? { learner_id: selectedId } : { volunteer_id: selectedId }
    );
  };

  const columns = [
    {
      title: "Learner",
      dataIndex: "learner_id",
      key: "learner_id",
      width: 180,
      render: (learnerId: string | null, record: any) => {
        if (!learnerId) return "—";
        // Name comes from the API; when it is missing, say so and keep a short id (full id on hover) so a
        // deleted/unnamed user is still traceable without a 36-character UUID wrapping over three lines.
        return (
          record.learner_name || (
            <span className="text-ink-3" title={learnerId}>
              Name unavailable <span className="font-mono text-xs">({shortId(learnerId)})</span>
            </span>
          )
        );
      },
    },
    {
      title: "Volunteer",
      dataIndex: "volunteer_id",
      key: "volunteer_id",
      width: 180,
      render: (volunteerId: string | null, record: any) => {
        if (!volunteerId) return "—";
        return (
          record.volunteer_name || (
            <span className="text-ink-3" title={volunteerId}>
              Name unavailable <span className="font-mono text-xs">({shortId(volunteerId)})</span>
            </span>
          )
        );
      },
    },
    {
      // What the matcher actually found in common. Skills are matched by id, languages by the learner's
      // primary language; nothing else (interests/hobbies) can create a match - they only influence the
      // compatibility score of candidates who already overlap on a skill or language.
      title: "What Matched",
      key: "what_matched",
      width: 240,
      render: (_: unknown, record: any) => {
        const skills: string[] = record.matched_skills || [];
        const academic: string[] = record.matched_academic_skills || [];
        const nonAcademic: string[] = record.matched_non_academic_skills || [];
        const languages: string[] = record.matched_languages || [];
        // Skills with no known category (and every match made before the split was stored) are listed as "Other skills".
        const categorised = new Set([...academic, ...nonAcademic].map((s) => s.toLowerCase()));
        const other = skills.filter((s) => !categorised.has(s.toLowerCase()));
        if (record.status === "no_match_found") return "—";
        if (!skills.length && !languages.length) {
          return <span className="text-ink-3">No skill or language overlap recorded</span>;
        }
        return (
          <div className="flex flex-col gap-0.5 text-sm">
            {academic.length > 0 && (
              <span>
                <span className="text-ink-3">Academic:</span> {academic.join(", ")}
              </span>
            )}
            {nonAcademic.length > 0 && (
              <span>
                <span className="text-ink-3">Arts &amp; Life:</span> {nonAcademic.join(", ")}
              </span>
            )}
            {other.length > 0 && (
              <span>
                <span className="text-ink-3">{academic.length || nonAcademic.length ? "Other skills:" : "Skills:"}</span>{" "}
                {other.join(", ")}
              </span>
            )}
            {languages.length > 0 && (
              <span>
                <span className="text-ink-3">Languages:</span> {languages.join(", ")}
              </span>
            )}
          </div>
        );
      },
    },
    {
      title: "Analytical Score",
      dataIndex: "analytical_score",
      key: "analytical_score",
      width: 100,
      render: (v: number) => v?.toFixed(1),
    },
    {
      title: "Compatibility Score",
      dataIndex: "compatibility_score",
      key: "compatibility_score",
      width: 120,
      render: (v: number) => v?.toFixed(2),
    },
    {
      title: "Combined Score",
      dataIndex: "combined_score",
      key: "combined_score",
      width: 100,
      render: (v: number) => v?.toFixed(1),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 150,
      render: (status: string) => (
        <StatusTag dot tone={status === "notified" ? "success" : "warning"}>
          {status === "notified" ? "Matched" : "No Match Found"}
        </StatusTag>
      ),
    },
    {
      title: "Session Status",
      dataIndex: "session_status",
      key: "session_status",
      width: 150,
      render: (sessionStatus: string | null) => {
        if (!sessionStatus) {
          return <StatusTag>No sessions yet</StatusTag>;
        }
        const colorByStatus: Record<string, string> = {
          accepted: "green",
          completed: "blue",
          pending: "gold",
          rejected: "red",
          cancelled: "red",
        };
        return (
          <StatusTag dot color={colorByStatus[sessionStatus]}>
            {sessionStatus.charAt(0).toUpperCase() + sessionStatus.slice(1)}
          </StatusTag>
        );
      },
    },
    {
      title: "Triggered By",
      dataIndex: "triggered_by",
      key: "triggered_by",
      width: 120,
      ellipsis: true,
    },
    {
      // When the match was created (not a session date). Re-triggering within 6 hours returns the
      // existing match, so this date does not move on a repeat.
      title: "Matched On",
      dataIndex: "created_at",
      key: "created_at",
      width: 180,
      className: "whitespace-nowrap",
      render: (v: string) => formatDisplayDateTime(v),
    },
  ];

  return (
    <div className="p-6">
      <div className="bg-white rounded-2xl border border-stroke p-5 mb-6 flex flex-wrap items-end gap-4">
        <div>
          <label htmlFor="matching-side" className="block text-xs font-medium text-ink-2 mb-1">Match on Behalf Of</label>
          <Select
            id="matching-side"
            value={side}
            onChange={(v) => {
              setSide(v);
              setSelectedId(null);
            }}
            style={{ width: 160 }}
            options={[
              { value: "learner", label: "Learner" },
              { value: "volunteer", label: "Volunteer" },
            ]}
          />
        </div>
        <div className="flex-1 min-w-[240px]">
          <label htmlFor="matching-person" className="block text-xs font-medium text-ink-2 mb-1">
            {side === "learner" ? "Select Learner" : "Select Volunteer"}
          </label>
          <Select
            id="matching-person"
            showSearch
            allowClear
            value={selectedId}
            onChange={(value: string | null, option: any) => {
              setSelectedId(value ?? null);
              setSelectedOption(value && option ? { value, label: String(option.label ?? value) } : null);
            }}
            onSearch={setPickerSearch}
            // Results are already filtered server-side (search_query) - a
            // local filterOption on top would incorrectly hide server matches
            // whose label doesn't literally contain what's typed so far
            // (e.g. searching by email while the label shows a name).
            filterOption={false}
            loading={picker.isFetching}
            style={{ width: "100%" }}
            placeholder={side === "learner" ? "Search learners..." : "Search volunteers..."}
            // A failed lookup must not look like "nobody found".
            notFoundContent={
              picker.isError ? (
                <span role="alert">
                  Couldn&apos;t load the list.{" "}
                  <button
                    type="button"
                    className="bg-transparent border-0 p-0 underline cursor-pointer text-brand-ink"
                    onClick={() => picker.refetch()}
                  >
                    Try again
                  </button>
                </span>
              ) : undefined
            }
            dropdownRender={(menu) => (
              <>
                {menu}
                {picker.hasNextPage ? (
                  <div className="border-t border-gray-200 p-2 text-center text-sm">
                    <button
                      type="button"
                      className="bg-transparent border-0 p-0 underline cursor-pointer"
                      disabled={picker.isFetchingNextPage}
                      // keep the dropdown open: a blur here would close it before the click lands
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => picker.fetchNextPage()}
                    >
                      {picker.isFetchingNextPage
                        ? "Loading..."
                        : `Load more (${pickerOptions.length} of ${pickerTotal} shown)`}
                    </button>
                  </div>
                ) : null}
              </>
            )}
            options={(() => {
              const list = pickerOptions;
              return selectedOption && selectedId === selectedOption.value && !list.some((o: any) => o.value === selectedId)
                ? [selectedOption, ...list]
                : list;
            })()}
          />
        </div>
        <Button
          type="primary"
          disabled={!selectedId}
          loading={triggerMutation.isPending}
          onClick={handleTrigger}
        >
          Trigger Match
        </Button>
      </div>

      {isMatchesError ? (
        <ErrorMsg message="Couldn't load the matches." onRetry={() => refetchMatches()} retrying={isMatchesFetching} />
      ) : (
        <Table
          data={matches}
          columns={columns}
          rowKey="match_id"
          loading={isMatchesLoading}
          emptyText="No matches yet."
          pagination={{
            current: matchesPage,
            pageSize: matchesPageSize,
            total: matchesTotal,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
          onChange={(paginationConfig) => {
            setMatchesPage(paginationConfig.current ?? 1);
            setMatchesPageSize(paginationConfig.pageSize ?? 15);
          }}
        />
      )}
    </div>
  );
}
