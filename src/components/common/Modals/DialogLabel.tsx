"use client";

import { useCallback } from "react";

// antd's Modal/Drawer only give their role="dialog" element an accessible name when antd
// renders its own title. These modals draw a custom header instead, so screen readers
// announced an unnamed "dialog". Rendered inside the dialog, this names it.
const DialogLabel = ({ label }: { label?: string }) => {
  const ref = useCallback(
    (el: HTMLSpanElement | null) => {
      const dialog = el?.closest('[role="dialog"]');
      if (dialog && label) dialog.setAttribute("aria-label", label);
    },
    [label]
  );
  return <span ref={ref} hidden />;
};

export default DialogLabel;
