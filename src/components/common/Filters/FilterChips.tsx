import clsx from "clsx";

/**
 * Status/category chips that switch a list between views (Pending / Approved / Rejected ...). The selected chip
 * is the one that stands out (brand tint + brand-ink text and border, semibold); the rest are white with a 1px
 * border. 40px high, so each is a comfortable target. Keeps the tab semantics the pages already had.
 */
const FilterChips = <K extends string>({
  items,
  value,
  onChange,
  ariaLabel,
  className,
}: {
  items: ReadonlyArray<{ key: K; label: string }>;
  value: K;
  onChange: (key: K) => void;
  ariaLabel: string;
  className?: string;
}) => (
  <div role="tablist" aria-label={ariaLabel} className={clsx("flex flex-wrap gap-2", className)}>
    {items.map((item) => {
      const selected = value === item.key;
      return (
        <button
          key={item.key}
          type="button"
          role="tab"
          aria-selected={selected}
          onClick={() => onChange(item.key)}
          className={clsx(
            "h-10 cursor-pointer rounded-full border px-4 text-sm !font-poppins transition-colors",
            selected
              ? "border-brand-ink bg-brand-tint font-semibold text-brand-ink"
              : "border-stroke bg-white font-medium text-ink hover:border-brand-ink hover:text-brand-ink"
          )}
        >
          {item.label}
        </button>
      );
    })}
  </div>
);

export default FilterChips;
