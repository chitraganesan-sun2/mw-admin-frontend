import { Skeleton, Table as AntTable } from "antd";
import { useEffect, useMemo, useState } from "react";
import EmptyState from "@/components/common/EmptyState";
import { paginationItemRender } from "./paginationItemRender";
import { resolveColumns } from "./columnLayout";

interface TableProps {
  data: any;
  loading?: boolean;
  pagination?: any;
  onChange?: (pagination: any, filters?: any, sorter?: any) => void;
  columns?: any;
  onRow?: (record: any, index?: number) => any;
  handleSeeMoreDetails?: (id: string) => void;
  handleSeePost?: (id: string) => void;
  handleDelete?: (id: string) => void;
  rootClassName?: string;
  rowKey?: string | ((record: any) => string);
  // Pass-throughs for antd features pages opt into (expandable detail rows, checkbox selection).
  expandable?: any;
  rowSelection?: any;
  // What to say when there are no rows. A plain string becomes the title of the shared empty state.
  emptyText?: React.ReactNode;
  // Draw the table inside the standard white 16px card (ADM-UI-41). Turn off when a parent card already does.
  card?: boolean;
}

// Rows of skeleton bars shown while the FIRST load is in flight (instead of an empty table with a spinner).
const TableSkeleton = ({ rows = 6 }: { rows?: number }) => (
  <div className="flex flex-col gap-4 px-4 py-4" aria-busy="true" aria-label="Loading">
    {Array.from({ length: rows }).map((_, i) => (
      <Skeleton.Input key={i} active block size="small" />
    ))}
  </div>
);

// Different admin pages feed this table rows keyed by different id fields
// (volunteer_id, learner_id, report_id, ...). Fall through the common ones so
// antd always gets a stable, unique key and React stops warning.
const KEY_FIELDS = [
  "id", "key", "volunteer_id", "learner_id", "report_id", "reportId",
  "application_id", "donation_id", "link_id", "match_id", "comment_id",
  "post_id", "resource_id", "category_id", "docId",
];
const resolveRowKey = (record: any): string => {
  for (const f of KEY_FIELDS) {
    if (record?.[f] != null) return String(record[f]);
  }
  return JSON.stringify(record);
};

const Table: React.FC<TableProps> = ({
  data,
  loading,
  pagination,
  onChange,
  columns,
  onRow,
  rootClassName,
  rowKey,
  expandable,
  rowSelection,
  emptyText,
  card = true,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const hasRows = Array.isArray(data) ? data.length > 0 : !!data;

  // Every column gets an explicit pixel width (from `width` or a `w-[Npx]` class) so antd's header and body
  // share one grid; when all are sized the layout is `fixed` and the table only scrolls sideways below the
  // sum of the widths (ADM-UI-1/2/3). Selection / expand columns are 48px each.
  const extraWidth = (rowSelection ? 48 : 0) + (expandable ? 48 : 0);
  const layout = useMemo(() => resolveColumns<any>(columns, extraWidth), [columns, extraWidth]);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // A row made clickable via onRow's onClick was otherwise unreachable by
  // keyboard - antd doesn't add tabIndex/role/key-activation on its own. Fixed
  // once here so every current and future caller of this shared Table gets it
  // for free, instead of each page having to remember to add it.
  const keyboardAccessibleOnRow = onRow
    ? (record: any, index?: number) => {
        const rowProps = onRow(record, index) || {};
        if (typeof rowProps.onClick !== "function") return rowProps;
        return {
          ...rowProps,
          tabIndex: 0,
          role: "button",
          onKeyDown: (e: React.KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              rowProps.onClick(e);
            }
          },
        };
      }
    : undefined;

  const empty =
    typeof emptyText === "string" || emptyText == null ? (
      <EmptyState compact title={emptyText ?? "Nothing to show here yet"} />
    ) : (
      emptyText
    );

  return (
    <div
      className={`w-full h-full !font-poppins transition-opacity duration-500 ease-in-out ${
        card ? "overflow-hidden rounded-2xl border border-stroke bg-white" : ""
      } ${isVisible ? "opacity-100" : "opacity-0"} ${rootClassName ?? ""}`}
    >
      <AntTable
        className="mw-table capitalize !font-poppins"
        dataSource={data}
        columns={layout.columns}
        // The skeleton covers the first load; the spinner overlay is only for refreshing rows already on screen.
        loading={loading && hasRows}
        pagination={{
          showQuickJumper: false,
          itemRender: paginationItemRender,
          ...pagination,
        }}
        onChange={onChange}
        onRow={keyboardAccessibleOnRow}
        rowKey={rowKey ?? resolveRowKey}
        expandable={expandable}
        rowSelection={rowSelection}
        locale={{ emptyText: loading && !hasRows ? <TableSkeleton /> : empty }}
        showSorterTooltip={false}
        tableLayout={layout.fixedLayout ? "fixed" : undefined}
        scroll={{ x: layout.fixedLayout ? layout.totalWidth : "max-content" }}
      />
    </div>
  );
};

export default Table;
