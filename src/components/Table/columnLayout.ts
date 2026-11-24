// Pure helpers for the shared Table's column grid. antd draws a sticky/scrolling table as TWO tables (header
// and body) that only line up when every column has an explicit pixel width; most admin columns carried their
// width only as a Tailwind class (`w-[220px]`), which antd never sees, so headers drifted away from their cells
// (ADM-UI-1). Resolve a numeric width for each column and, when all have one, render a fixed layout.

export interface ColumnLike {
  width?: number | string;
  className?: string;
  fixed?: unknown;
  children?: ColumnLike[];
  [key: string]: unknown;
}

const WIDTH_CLASS = /(?:^|\s)!?w-\[(\d+(?:\.\d+)?)px\]/;

/** A column's pixel width: its `width` prop (number or "120px"), else a `w-[120px]` / `!w-[120px]` class. */
export const columnPixelWidth = (col: ColumnLike): number | undefined => {
  const w = col.width;
  if (typeof w === "number" && Number.isFinite(w) && w > 0) return w;
  if (typeof w === "string") {
    const m = /^(\d+(?:\.\d+)?)px$/.exec(w.trim());
    if (m) return Number(m[1]);
  }
  const fromClass = typeof col.className === "string" ? WIDTH_CLASS.exec(col.className) : null;
  return fromClass ? Number(fromClass[1]) : undefined;
};

export interface ResolvedColumns<T extends ColumnLike> {
  columns: T[];
  /** True when every leaf column has a pixel width, so `table-layout: fixed` is safe. */
  fixedLayout: boolean;
  /** Sum of the leaf widths (0 when not fixed): the table's minimum width before it scrolls. */
  totalWidth: number;
}

/** Copy `columns` with the resolved pixel width set on each; flag whether a fixed layout can be used. */
export function resolveColumns<T extends ColumnLike>(columns: T[] | undefined, extraWidth = 0): ResolvedColumns<T> {
  if (!columns || columns.length === 0) return { columns: columns ?? [], fixedLayout: false, totalWidth: 0 };
  let total = extraWidth;
  let complete = true;
  const walk = (cols: ColumnLike[]): ColumnLike[] =>
    cols.map((col) => {
      if (col.children && col.children.length) {
        return { ...col, children: walk(col.children) };
      }
      const width = columnPixelWidth(col);
      if (width === undefined) {
        complete = false;
        return col;
      }
      total += width;
      return { ...col, width };
    });
  const resolved = walk(columns) as T[];
  return { columns: resolved, fixedLayout: complete, totalWidth: complete ? total : 0 };
}
