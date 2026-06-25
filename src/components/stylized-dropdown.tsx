"use client";

import {
  type ReactNode,
  useEffect,
  useEffectEvent,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { CheckIcon, ChevronDownIcon } from "@/components/site-icons";

export type DropdownOption = {
  value: string;
  label: string;
  description?: string;
  icon?: ReactNode;
};

type StylizedDropdownProps = {
  value: string;
  onChange: (value: string) => void;
  options: readonly DropdownOption[];
  placeholder: string;
  buttonIcon?: ReactNode;
  disabled?: boolean;
  className?: string;
  panelClassName?: string;
};

export function StylizedDropdown({
  value,
  onChange,
  options,
  placeholder,
  buttonIcon,
  disabled = false,
  className = "",
  panelClassName = "",
}: StylizedDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const listboxId = useId();
  const selected = useMemo(
    () => options.find((option) => option.value === value),
    [options, value]
  );

  const handleOutsidePointer = useEffectEvent((event: PointerEvent) => {
    const target = event.target;
    if (!(target instanceof Node)) {
      return;
    }

    if (!rootRef.current?.contains(target)) {
      setOpen(false);
    }
  });

  useEffect(() => {
    document.addEventListener("pointerdown", handleOutsidePointer);
    return () => {
      document.removeEventListener("pointerdown", handleOutsidePointer);
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={`relative ${open ? "z-[70]" : "z-0"} ${className}`}
    >
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen((current) => !current)}
        className={`group flex h-14 w-full items-center justify-between gap-3 rounded-[24px] border px-4 text-left outline-none transition duration-200 ${
          open
            ? "border-sky-400 bg-white shadow-[0_18px_40px_rgba(2,132,199,0.14)] ring-4 ring-sky-100"
            : "border-slate-200/90 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.04)] hover:border-sky-300 hover:bg-sky-50/40"
        } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
      >
        <div className="flex min-w-0 items-center gap-3">
          {(buttonIcon || selected?.icon) && (
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition ${
                open
                  ? "bg-sky-100 text-sky-700"
                  : "bg-sky-50 text-sky-700 group-hover:bg-sky-100"
              }`}
            >
              {buttonIcon || selected?.icon}
            </div>
          )}

          <div className="min-w-0">
            <div
              className={`truncate text-[15px] font-semibold transition ${
                selected ? "text-slate-900" : "text-slate-400"
              }`}
            >
              {selected?.label || placeholder}
            </div>

            {selected?.description && (
              <div className="truncate text-xs text-slate-500">
                {selected.description}
              </div>
            )}
          </div>
        </div>

        <ChevronDownIcon
          className={`h-4 w-4 shrink-0 text-slate-400 transition duration-200 ${
            open ? "rotate-180 text-sky-600" : ""
          }`}
        />
      </button>

      <div
        className={`pointer-events-none absolute inset-x-0 top-[calc(100%+0.65rem)] z-[80] origin-top rounded-[26px] border border-sky-100 bg-white p-2 shadow-[0_26px_70px_rgba(2,74,122,0.2)] transition duration-200 ${
          open
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "-translate-y-2 scale-[0.98] opacity-0"
        } ${panelClassName}`}
      >
        <div
          id={listboxId}
          role="listbox"
          aria-label={placeholder}
          className="max-h-72 overflow-y-auto pr-1"
        >
          {options.map((option) => {
            const active = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-3 rounded-[20px] px-3 py-3 text-left transition ${
                  active
                    ? "bg-gradient-to-r from-sky-600 to-blue-700 text-white shadow-[0_10px_24px_rgba(2,132,199,0.2)]"
                    : "text-slate-700 hover:bg-sky-50 hover:text-sky-900"
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  {option.icon && (
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ${
                        active
                          ? "bg-white/10 text-white"
                          : "bg-sky-50 text-sky-700"
                      }`}
                    >
                      {option.icon}
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">
                      {option.label}
                    </div>
                    {option.description && (
                      <div
                        className={`truncate text-xs ${
                          active ? "text-white/70" : "text-slate-500"
                        }`}
                      >
                        {option.description}
                      </div>
                    )}
                  </div>
                </div>

                {active && <CheckIcon className="h-4 w-4 shrink-0 text-white" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
