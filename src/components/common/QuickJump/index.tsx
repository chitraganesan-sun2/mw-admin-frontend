"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "antd";
import { FiSearch } from "react-icons/fi";
import { WINGTIME_ENABLED } from "@/config/wingtime";
import { NAV_GROUPS, flattenNav, searchNav, visibleNavGroups } from "@/config/nav";
import { useStaff } from "@/hooks/useStaff";
import { navIcon } from "@/components/common/Sidebar/navIcons";

const OPEN_EVENT = "mw-admin:quick-jump";

/** Open the palette from anywhere (the sidebar button, a menu item...). */
export const openQuickJump = () => {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(OPEN_EVENT));
};

/** Ctrl/Cmd+K palette: type a few letters, Enter to go. Lists only pages this account can open. */
export default function QuickJump() {
  const router = useRouter();
  const { data: staff } = useStaff();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const show = () => {
      setQuery("");
      setActive(0);
      setOpen(true);
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        show();
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_EVENT, show);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_EVENT, show);
    };
  }, []);

  const items = useMemo(() => {
    if (!staff) return [];
    const groups = visibleNavGroups(
      { permissions: staff.permissions ?? [], role: staff.role, wingtimeEnabled: WINGTIME_ENABLED },
      NAV_GROUPS
    );
    return searchNav(flattenNav(groups), query);
  }, [staff, query]);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, Math.max(items.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && items[active]) {
      e.preventDefault();
      go(items[active].href);
    }
  };

  useEffect(() => {
    listRef.current?.children[active]?.scrollIntoView?.({ block: "nearest" });
  }, [active]);

  return (
    <Modal
      open={open}
      onCancel={() => setOpen(false)}
      footer={null}
      closable={false}
      destroyOnClose
      afterOpenChange={(isOpen) => {
        if (isOpen) inputRef.current?.focus();
      }}
      width={520}
      styles={{ body: { padding: 0 } }}
      title={null}
    >
      <div className="flex items-center gap-2 border-b border-stroke px-4 py-3">
        <FiSearch aria-hidden className="text-gray-light" />
        <input
          ref={inputRef}
          autoFocus
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onInputKey}
          placeholder="Jump to a page…"
          aria-label="Jump to a page"
          role="combobox"
          aria-expanded
          aria-controls="quick-jump-list"
          aria-activedescendant={items[active] ? `qj-${items[active].href}` : undefined}
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>
      <ul id="quick-jump-list" role="listbox" ref={listRef} className="max-h-80 overflow-y-auto p-2">
        {items.length === 0 ? (
          <li className="px-3 py-6 text-center text-sm text-gray-light">No page matches &ldquo;{query}&rdquo;.</li>
        ) : (
          items.map((item, i) => (
            <li
              key={item.href}
              id={`qj-${item.href}`}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(item.href)}
              className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                i === active ? "bg-learner-background text-dark" : "text-gray-medium"
              }`}
            >
              <span aria-hidden className="text-[1.1rem] text-brand-ink">
                {navIcon(item.icon)}
              </span>
              <span className="flex-1 font-medium">{item.text}</span>
              {item.group ? <span className="text-xs text-gray-light">{item.group}</span> : null}
            </li>
          ))
        )}
      </ul>
    </Modal>
  );
}
