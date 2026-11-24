import { Button } from "antd";
import { FiRefreshCw } from "react-icons/fi";

/** The one "Refresh" button: secondary, with the refresh icon. */
const RefreshButton = ({
  onClick,
  loading,
  label = "Refresh",
}: {
  onClick?: () => void;
  loading?: boolean;
  label?: string;
}) => (
  <Button onClick={onClick} loading={loading} icon={<FiRefreshCw aria-hidden />}>
    {label}
  </Button>
);

export default RefreshButton;
