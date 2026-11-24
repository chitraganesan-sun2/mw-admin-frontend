import React from "react";
import { Button, type ButtonProps } from "antd";
import { FiTrash2 } from "react-icons/fi";

/**
 * The one destructive row action: an icon-only danger ghost button (32x32 hit area, danger icon, tinted hover)
 * with an accessible name and a native tooltip. It only starts the action; each page still confirms in its own
 * modal or Popconfirm. It forwards its ref and props so it can sit directly inside a Popconfirm.
 */
const DeleteButton = React.forwardRef<
  HTMLButtonElement,
  Omit<ButtonProps, "icon" | "type" | "danger" | "size"> & {
    /** What it does, e.g. "Delete volunteer". Used as the tooltip and the aria-label. */
    label: string;
  }
>(({ label, className, ...rest }, ref) => (
  <Button
    ref={ref}
    danger
    type="text"
    size="small"
    aria-label={label}
    title={label}
    icon={<FiTrash2 aria-hidden />}
    className={`!w-8 !min-w-8 !px-0 hover:!bg-error-light ${className ?? ""}`}
    {...rest}
  />
));
DeleteButton.displayName = "DeleteButton";

export default DeleteButton;
