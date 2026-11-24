import { Button } from "antd";

type GroupFiltersProps = {
  tabButtons: any[];
  currentTab: string;
  handleTabClick: (tab: string) => void;
  showFilters?: boolean;
  handleFilterClick?: () => void;
  showSearch?: boolean;
};

// Filter chips for switching a list between categories (e.g. Reports by type). Unselected = white with a 1px
// border; selected = brand tint with the brand-ink text and border, so the active chip is the one that stands
// out (it used to be the other way round: unselected cyan, selected black).
function GroupFilters({ tabButtons, currentTab, handleTabClick }: GroupFiltersProps) {
  return (
    <div role="group" aria-label="Filter by type" className="flex flex-wrap gap-2 pb-4">
      {tabButtons.map((tabButton) => {
        const selected = currentTab === tabButton?.key;
        return (
          <Button
            key={tabButton?.key ?? tabButton?.title}
            aria-pressed={selected}
            shape="round"
            onClick={() => handleTabClick(tabButton?.key)}
            className={
              selected
                ? "!border-brand-ink !bg-brand-tint !font-semibold !text-brand-ink"
                : "!border-stroke !bg-white !text-ink hover:!border-brand-ink hover:!text-brand-ink"
            }
          >
            {tabButton?.title}
          </Button>
        );
      })}
    </div>
  );
}

export default GroupFilters;
