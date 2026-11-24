import { Button, Tooltip } from "antd";
import { FiTrash2 } from "react-icons/fi";

/**
 * The one destructive row action: an icon-only danger ghost button (32x32 hit area, danger icon, tinted hover)
 * with a tooltip and an accessible name. It only starts the action; each page still confirms in its own modal.
 */
const DeleteButton = ({
  label,
  onClick,
  disabled,
  loading,
}: {
  /** What it does, e.g. "Delete volunteer". Used as the tooltip and the aria-label. */
  label: string;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  disabled?: boolean;
  loading?: boolean;
}) => (
  <Tooltip title={label}>
    <Button
      danger
      type="text"
      size="small"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      loading={loading}
      icon={<FiTrash2 aria-hidden />}
      className="!w-8 !min-w-8 !px-0 hover:!bg-error-light"
    />
  </Tooltip>
);

export default DeleteButton;
