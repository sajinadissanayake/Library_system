import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Type-ahead picker that replaces a <select> when the list is long.
 *
 * items       array of objects
 * value       selected key ("" when nothing is selected)
 * onChange    (key) => void   (called with "" when cleared)
 * getKey      item => key                 (default: item.id)
 * getLabel    item => string              (shown once selected)
 * getSearch   item => string              (text that the query is matched against)
 * renderItem  item => JSX                 (row shown in the list)
 * isDisabled  item => boolean             (row is visible but can't be picked)
 */
export default function SearchSelect({
  items,
  value,
  onChange,
  getKey = (x) => x.id,
  getLabel,
  getSearch,
  renderItem,
  isDisabled = () => false,
  placeholder = "Type to search...",
  maxShown = 50,
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const boxRef = useRef(null);
  const activeRef = useRef(null);

  const selected = items.find((x) => String(getKey(x)) === String(value));

  // every word typed must appear somewhere in the item's search text
  const matches = useMemo(() => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return items;
    return items.filter((x) => {
      const text = getSearch(x).toLowerCase();
      return words.every((w) => text.includes(w));
    });
  }, [items, query, getSearch]);

  const shown = matches.slice(0, maxShown);

  useEffect(() => setHi(0), [query, open]);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [hi]);

  // close when clicking outside
  useEffect(() => {
    const away = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, []);

  const pick = (item) => {
    if (isDisabled(item)) return;
    onChange(getKey(item));
    setOpen(false);
    setQuery("");
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHi((h) => Math.min(h + 1, shown.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHi((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter" && open) {
      e.preventDefault();               // don't submit the form
      if (shown[hi]) pick(shown[hi]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
    }
  };

  return (
    <div className="ss" ref={boxRef}>
      <input
        className="ss-input"
        value={open ? query : selected ? getLabel(selected) : ""}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onKeyDown={onKeyDown}
        autoComplete="off"
      />
      {selected && !open && (
        <button type="button" className="ss-clear" title="Clear" onClick={() => onChange("")}>×</button>
      )}

      {open && (
        <ul className="ss-list">
          {shown.map((x, idx) => (
            <li
              key={getKey(x)}
              ref={idx === hi ? activeRef : null}
              className={
                "ss-item" + (idx === hi ? " active" : "") + (isDisabled(x) ? " disabled" : "")
              }
              onMouseEnter={() => setHi(idx)}
              onMouseDown={(e) => { e.preventDefault(); pick(x); }}
            >
              {renderItem(x)}
            </li>
          ))}
          {shown.length === 0 && <li className="ss-empty">No matches for "{query}"</li>}
          {matches.length > shown.length && (
            <li className="ss-more">{matches.length - shown.length} more – keep typing to narrow down</li>
          )}
        </ul>
      )}
    </div>
  );
}