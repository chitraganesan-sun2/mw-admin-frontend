import { useQueryState } from "nuqs";
import Button from "../Button";
import Input from "../Input";
import { RiFilter3Line } from "react-icons/ri";

type GroupFiltersProps = {
  tabButtons: any[];
  currentTab: string;
  handleTabClick: (tab: string) => void;
  showFilters?: boolean;
  handleFilterClick?: () => void;
  showSearch?: boolean;
}

function GroupFilters({ tabButtons, currentTab, handleTabClick, showFilters, handleFilterClick, showSearch }: GroupFiltersProps) {
  const [searchQuery, setSearchQuery] = useQueryState("query");

  return (
    <div className='w-full py-10'>
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {tabButtons.map(tabButton => (
            <Button
              key={tabButton?.title}
              title={tabButton?.title}
              btnVariant={currentTab === tabButton?.key ? 'secondary' : 'primary'}
              onClick={() => handleTabClick(tabButton?.key)}
            />
          ))}
        </div>
        <div className="flex items-center gap-3">
          {showFilters && <Button
            onClick={handleFilterClick}
            title="Filters"
            icon={<RiFilter3Line className="text-lg" />}
            className="py-4 text-md font-medium"
          />}
          {showSearch && <Input
            value={searchQuery ?? ""}
            inputType="search"
            name="search"
            inputClassName="!bg-white !rounded-3xl gap-1 items-center !focus:border-none !target:border-none"
            onChange={(value: string) => setSearchQuery(value || null)}
            placeholder={"Search"}
          />}
        </div>
      </div>
    </div>
  )
}

export default GroupFilters