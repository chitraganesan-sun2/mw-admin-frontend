"use client";
import { useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { Input } from "antd";
import { FiSearch } from "react-icons/fi";

/**
 * The list pages' search box. It writes the same `?query=` URL param the shell header's search used to, so the
 * pages (which read `query`) are untouched, but it now sits in the page's own filter bar, right above the table
 * it filters. Keystrokes are local; the URL write is debounced so each one doesn't re-fetch.
 */
const ListSearch = ({
  placeholder = "Search",
  className = "min-w-[240px] flex-1 sm:max-w-md",
}: {
  placeholder?: string;
  className?: string;
}) => {
  const [searchQuery, setSearchQuery] = useQueryState("query");
  const [inputValue, setInputValue] = useState(searchQuery ?? "");

  useEffect(() => {
    setInputValue(searchQuery ?? "");
  }, [searchQuery]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (inputValue !== (searchQuery ?? "")) setSearchQuery(inputValue || null);
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue]);

  return (
    <Input
      allowClear
      aria-label={placeholder}
      inputMode="search"
      placeholder={placeholder}
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      prefix={<FiSearch className="text-ink-3" aria-hidden />}
      className={className}
    />
  );
};

export default ListSearch;
