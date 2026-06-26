"use client";

import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
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

type PanelPosition = {
  left: number;
  top: number;
  width: number;
  maxHeight: number;
  opensUp: boolean;
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
  const [panelPosition, setPanelPosition] = useState<PanelPosition | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const listboxId = useId();
  const selected = useMemo(
    () => options.find((option) => option.value === value),
    [options, value]
  );
  const selectedIndex = useMemo(
    () => options.findIndex((option) => option.value === value),
    [options, value]
  );

  const updatePanelPosition = useCallback(() => {
    const button = rootRef.current?.querySelector("button");
    if (!(button instanceof HTMLButtonElement)) {
      return;
    }

    const rect = button.getBoundingClientRect();
    const viewportPadding = 12;
    const gap = 10;
    const availableBelow = window.innerHeight - rect.bottom - viewportPadding;
    const availableAbove = rect.top - viewportPadding;
    const opensUp = availableBelow < 260 && availableAbove > availableBelow;
    const availableSpace = opensUp ? availableAbove - gap : availableBelow - gap;
    const maxHeight = Math.max(180, Math.min(360, availableSpace));
    const width = Math.max(rect.width, 220);
    const left = Math.min(
      Math.max(viewportPadding, rect.left),
      Math.max(viewportPadding, window.innerWidth - width - viewportPadding)
    );
    const top = opensUp
      ? Math.max(viewportPadding, rect.top - maxHeight - gap)
      : Math.min(rect.bottom + gap, window.innerHeight - viewportPadding - maxHeight);

    setPanelPosition({ left, top, width, maxHeight, opensUp });
  }, []);

  useEffect(() => {
    function handleOutsidePointer(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (
        !rootRef.current?.contains(target) &&
        !panelRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handleOutsidePointer);
    return () => {
      document.removeEventListener("pointerdown", handleOutsidePointer);
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }

      if (!open || options.length === 0) {
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((current) => {
          const start =
            current >= 0
              ? current
              : selectedIndex >= 0
                ? selectedIndex
                : -1;
          return (start + 1 + options.length) % options.length;
        });
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((current) => {
          const start =
            current >= 0
              ? current
              : selectedIndex >= 0
                ? selectedIndex
                : 0;
          return (start - 1 + options.length) % options.length;
        });
        return;
      }

      if (event.key === "Enter" && activeIndex >= 0) {
        event.preventDefault();
        onChange(options[activeIndex].value);
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeIndex, onChange, open, options, selectedIndex]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      panelRef.current
        ?.querySelector('[data-selected="true"]')
        ?.scrollIntoView({ block: "nearest" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open, selectedIndex, updatePanelPosition]);

  useEffect(() => {
    if (!open) {
      return;
    }

    window.addEventListener("resize", updatePanelPosition);
    window.addEventListener("scroll", updatePanelPosition, true);

    return () => {
      window.removeEventListener("resize", updatePanelPosition);
      window.removeEventListener("scroll", updatePanelPosition, true);
    };
  }, [open, updatePanelPosition]);

  const panelStyle: CSSProperties | undefined = panelPosition
    ? {
        left: panelPosition.left,
        top: panelPosition.top,
        width: panelPosition.width,
        maxHeight: panelPosition.maxHeight,
      }
    : undefined;

  const panel =
    open && panelPosition
      ? createPortal(
          <div
            ref={panelRef}
            style={panelStyle}
            className={`fixed z-[9999] overflow-hidden rounded-[26px] border border-sky-100 bg-white p-2 shadow-[0_26px_70px_rgba(2,74,122,0.22)] transition duration-200 ${
              open
                ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
                : `pointer-events-none ${
                    panelPosition.opensUp ? "translate-y-2" : "-translate-y-2"
                  } scale-[0.98] opacity-0`
            } ${panelPosition.opensUp ? "origin-bottom" : "origin-top"} ${panelClassName}`}
          >
            <div
              id={listboxId}
              role="listbox"
              aria-label={placeholder}
              onWheel={(event) => event.stopPropagation()}
              className="overscroll-contain pr-1"
              style={{ maxHeight: panelPosition.maxHeight - 16, overflowY: "auto" }}
            >
              {options.map((option, index) => {
                const active = option.value === value;
                const highlighted = index === activeIndex;

                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={active}
                    data-selected={active ? "true" : undefined}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between gap-3 rounded-[20px] px-3 py-3 text-left transition ${
                      active
                        ? "bg-gradient-to-r from-sky-600 to-blue-700 text-white shadow-[0_10px_24px_rgba(2,132,199,0.2)]"
                        : highlighted
                          ? "bg-sky-50 text-sky-900"
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

                    {active && (
                      <CheckIcon className="h-4 w-4 shrink-0 text-white" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )
      : null;

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
        onClick={() => {
          if (disabled) {
            return;
          }

          if (open) {
            setOpen(false);
            return;
          }

          setActiveIndex(selectedIndex);
          updatePanelPosition();
          setOpen(true);
          window.requestAnimationFrame(updatePanelPosition);
        }}
        className={`group flex h-[58px] w-full items-center justify-between gap-3 rounded-[25px] border px-4 text-left outline-none transition duration-200 ${
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
      {panel}
    </div>
  );
}
