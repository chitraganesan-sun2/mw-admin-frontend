"use client";

import { FiZap } from "react-icons/fi";
import { SEVERITY_COLORS, categoryLabel } from "../severity";
import { ReportFinding, buildScoreBreakdown, scoreSeverity } from "./helpers";
import { Panel } from "./parts";

export default function ScoreBreakdown({
  findings,
  riskScore,
}: {
  findings: ReportFinding[];
  riskScore: number | null;
}) {
  const { rows, rawTotal } = buildScoreBreakdown(findings);
  if (!rows.length) return null;

  const capped = Math.min(100, rawTotal);
  const maxPoints = Math.max(...rows.map((r) => r.points), 1);
  const totalColor = SEVERITY_COLORS[scoreSeverity(capped)].hex;
  const differs = riskScore != null && Math.abs(riskScore - capped) >= 0.5;

  return (
    <Panel title="How the score was calculated" icon={<FiZap className="text-indigo-500" aria-hidden="true" />}>
      <p className="text-sm text-gray-600 bg-gray-50 border border-gray-100 rounded-md px-3 py-2.5 mb-4 leading-relaxed">
        Each finding adds <strong className="text-gray-800">category weight x confidence x diminishing factor</strong> to the total.
        Repeated findings in the same category count for less each time (x0.5, x0.25, x0.125 and so on), and the total is capped at 100.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[520px]">
          <caption className="sr-only">Score contribution by category</caption>
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-gray-500 border-b border-gray-200">
              <th scope="col" className="py-2 pr-3 font-semibold">Category</th>
              <th scope="col" className="py-2 px-3 font-semibold text-center">Weight</th>
              <th scope="col" className="py-2 px-3 font-semibold text-center">Findings</th>
              <th scope="col" className="py-2 px-3 font-semibold text-center">Avg confidence</th>
              <th scope="col" className="py-2 pl-3 font-semibold text-right">Points</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.category} className="border-b border-gray-50">
                <th scope="row" className="py-2 pr-3 text-left font-medium text-gray-800">{categoryLabel(row.category)}</th>
                <td className="py-2 px-3 text-center text-gray-600">{row.weight}</td>
                <td className="py-2 px-3 text-center text-gray-600">{row.count}</td>
                <td className="py-2 px-3 text-center text-gray-600">{(row.avgConfidence * 100).toFixed(0)}%</td>
                <td className="py-2 pl-3">
                  <div className="flex items-center justify-end gap-2">
                    <span className="hidden sm:block h-1.5 w-20 rounded-full bg-gray-100 overflow-hidden" aria-hidden="true">
                      <span className="block h-full rounded-full bg-indigo-500" style={{ width: `${(row.points / maxPoints) * 100}%` }} />
                    </span>
                    <span className="font-semibold text-gray-800 min-w-[2.5rem] text-right">{row.points.toFixed(1)}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-200">
              <th scope="row" className="pt-3 pr-3 text-left font-bold text-gray-800">Total, capped at 100</th>
              <td />
              <td className="pt-3 px-3 text-center font-semibold text-gray-800">{findings.length}</td>
              <td />
              <td className="pt-3 pl-3 text-right">
                <span className="text-lg font-bold" style={{ color: totalColor }}>{capped.toFixed(1)}</span>
                {rawTotal > 100 && <span className="text-xs text-gray-500 ml-2">(uncapped {rawTotal.toFixed(1)})</span>}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="text-xs text-gray-500 mt-3">
        Rebuilt from the findings listed in this report to explain the score.{" "}
        {differs && riskScore != null
          ? `The pipeline recorded ${riskScore.toFixed(1)}, which is the score of record.`
          : "It matches the score the pipeline recorded."}
      </p>
    </Panel>
  );
}
