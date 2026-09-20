import { useState } from 'react';

interface Props {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

export default function Autocomplete({
  value,
  onChange,
  options,
  placeholder,
  autoFocus,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(0);

  const filtered = options
    .filter((o) => o.toLowerCase().includes(value.toLowerCase()))
    .slice(0, 8);

  function select(opt: string) {
    onChange(opt);
    setOpen(false);
    setCursor(0);
  }

  return (
    <div className={`relative ${className ?? ''}`}>
      <input
        value={value}
        autoFocus={autoFocus}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500"
        onChange={(e) => {
          onChange(e.target.value);
          setCursor(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (!open || filtered.length === 0) return;
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setCursor((c) => Math.min(c + 1, filtered.length - 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setCursor((c) => Math.max(c - 1, 0));
          } else if (e.key === 'Enter') {
            e.preventDefault();
            select(filtered[cursor]);
          } else if (e.key === 'Escape') {
            setOpen(false);
          }
        }}
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-20 w-full mt-1 bg-gray-800 border border-gray-700 rounded shadow-xl max-h-56 overflow-y-auto">
          {filtered.map((opt, i) => (
            <li
              key={opt}
              onMouseDown={() => select(opt)}
              className={`px-3 py-2 text-sm cursor-pointer ${
                i === cursor
                  ? 'bg-blue-700 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
