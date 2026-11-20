import React from "react";

const LABELS: Record<string, string> = {
    prev: "Previous page",
    next: "Next page",
    "jump-prev": "Back 5 pages",
    "jump-next": "Forward 5 pages",
};

/**
 * antd's pagination draws the prev/next/jump controls as icon-only buttons with no accessible
 * name (a screen reader just says "button"). Pass this as `pagination.itemRender` to name them;
 * numbered pages already carry their number as text.
 */
export const paginationItemRender = (_page: number, type: string, element: React.ReactNode): React.ReactNode => {
    const label = LABELS[type];
    if (!label || !React.isValidElement(element)) return element;
    return React.cloneElement(element as React.ReactElement<{ "aria-label"?: string }>, { "aria-label": label });
};
