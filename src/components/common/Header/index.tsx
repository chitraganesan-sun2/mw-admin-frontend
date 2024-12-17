import { useQueryState } from "nuqs";
// import Button from "@/components/common/Button";
import { cn, formatString } from "@/utils/merge-class";
import { useComponentStore } from "@/store/useComponenetStore";

const CommonHeader: React.FC = () => {
  const { headerOptions } = useComponentStore();
  const [searchQuery, setSearchQuery] = useQueryState("query");
  const {
    searchPlaceholder,
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
    <div className="w-full h-full p-2 px-3 flex items-center justify-between">
      <div className="flex capitalize items-center">
        {/* <Button
          icon={titleIcon}
          rootClassName={cn(
            "flex items-center justify-center  !w-10 h-10 rounded-full hover:bg-gray-100",
            titleIconClick ? "cursor-pointer border-stroke mr-2" : "border-none"
          )}
          onClick={titleIconClick}
        /> */}
        <h1 className="text-lg font-medium">{formatString(title ?? "")}</h1>
      </div>
      <div
        className={cn(
          actionButtonPlacement === "left" ? "flex-row-reverse" : "flex",
          "flex items-center justify-center gap-2"
        )}
      >
        {/* <Input
          value={searchQuery ?? ""}
          inputType="search"
          name="search"
          inputClassName="!bg-transparent mt-4 !rounded-xl gap-1 items-center"
          className="!bg-transparent !w-fit"
          onChange={(value: string) => setSearchQuery(value)}
          placeholder={searchPlaceholder ?? "Search"}
        />
        {showButton && (
          <Button
            title={actionButtonTitle}
            onClick={actionButtonOnClick}
            rootClassName={actionButtonClassName}
            size="small"
          />
        )} */}
      </div>
    </div>
  );
};

export default CommonHeader;
