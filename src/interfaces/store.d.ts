type HeaderOptions = {
  actionButtonTitle?: string;
  actionButtonOnClick?: () => void;
  actionButtonClassName?: string;
  actionButtonPlacement?: "left" | "right";
  searchPlaceholder?: string;
  showButton?: boolean;
  titleIcon?: React.ReactNode;
  title?: string;
  titleIconClick?: () => void;
} | null;

type UseComponentStoreProps = {
  headerOptions: Partial<HeaderOptions>;
  setHeaderOptions: (options: HeaderOptions) => void;
};

type UseGlobalStoreProps = {};

type UseAppStoreProps = UseGlobalStoreProps;
