interface CenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  topContent?: string | React.ReactNode;
  titleColor?: string;
  width?: number | string;
  minWidth?: number | string;
  height?: number | string;
  minHeight?: number | string;
  children: React.ReactNode;
  customClassName?: string;
  titleClassName?: string;
  primaryActionProps?: ButtonProps;
  secondaryActionProps?: ButtonProps;
  hideFooter?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
  actionLoading?: boolean;
  acceptLoading?: boolean;
  rejectLoading?: boolean;
}

interface ViewModalProps {
  modalOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  className?: string;
  isFooterButtonsNeeded?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
  loading?: boolean;
}

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  primaryActionText?: string;
  secondaryActionText?: string;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
  isLoading?: boolean;
}

type ShowModalType = "view" | "edit" | "create" | null;
