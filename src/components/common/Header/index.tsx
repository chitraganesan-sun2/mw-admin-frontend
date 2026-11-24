import Button from "@/components/common/Button";
import { cn } from "@/utils/merge-class";
import { useComponentStore } from "@/store/useComponenetStore";

const CommonHeader: React.FC = () => {
  const { headerOptions } = useComponentStore();
  const {
    actionButtonOnClick,
    actionButtonClassName,
    actionButtonPlacement,
    actionButtonTitle,
    showButton,
    titleIcon,
    title,
    titleIconClick,
  } = headerOptions || {};

  return (
    <div className="w-full lg:h-full p-2 px-3 flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center min-w-0">
        {/* The icon is a real button only when it does something (a back arrow); otherwise it is
            decoration, not an unnamed button that does nothing. Every header icon is drawn at 20px. */}
        {titleIconClick ? (
          <Button
            aria-label="Back"
            icon={titleIcon}
            iconOnly
            customClassName="!rounded-full mr-2 [&_svg]:h-5 [&_svg]:w-5"
            onClick={titleIconClick}
          />
        ) : titleIcon ? (
          <span
            aria-hidden="true"
            className="mr-2 flex h-8 w-8 items-center justify-center text-ink-2 [&_svg]:h-5 [&_svg]:w-5"
          >
            {titleIcon}
          </span>
        ) : null}
        {/* The title is shown as the page gives it (no forced capitalisation: "List of Values" matches the sidebar). */}
        <h1 className="truncate text-xl font-medium text-ink">{title ?? ""}</h1>
      </div>
      <div
        className={cn(
          actionButtonPlacement === "left" ? "flex-row-reverse" : "flex",
          "flex items-center justify-center gap-2 flex-wrap max-w-full"
        )}
      >
        {showButton && (
          <Button
            title={actionButtonTitle}
            onClick={actionButtonOnClick}
            rootClassName={actionButtonClassName}
            size="small"
          />
        )}
      </div>
    </div>
  );
};

export default CommonHeader;
