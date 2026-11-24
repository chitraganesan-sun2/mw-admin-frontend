import { Input } from "antd";
import { FiSearch } from "react-icons/fi";

/** A plain controlled search box (40px, 12px radius, search icon) for pages that keep their search in local state. */
const SearchInput = ({
  value,
  onChange,
  placeholder = "Search",
  className = "min-w-[240px] flex-1 sm:max-w-md",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) => (
  <Input
    allowClear
    aria-label={placeholder}
    inputMode="search"
    placeholder={placeholder}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    prefix={<FiSearch className="text-ink-3" aria-hidden />}
    className={className}
  />
);

export default SearchInput;
