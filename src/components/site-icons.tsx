import type { SVGProps } from "react";
import type { VehicleKind } from "@/lib/site-data";

type IconProps = SVGProps<SVGSVGElement>;

function Svg({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m6 9 6 6 6-6" />
    </Svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </Svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </Svg>
  );
}

export function BoardIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <path d="M7 8h10" />
      <path d="M7 12h7" />
      <path d="M7 16h5" />
      <circle cx="17.5" cy="15.5" r="1.5" />
    </Svg>
  );
}

export function CitiesIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 20V8l5-3 5 3v12" />
      <path d="M14 20V4l6 3v13" />
      <path d="M7 12h.01" />
      <path d="M7 16h.01" />
      <path d="M11 12h.01" />
      <path d="M17 11h.01" />
      <path d="M17 15h.01" />
    </Svg>
  );
}

export function CapacityIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="8" cy="9" r="3" />
      <circle cx="16.5" cy="8.5" r="2.5" />
      <path d="M3.5 19a4.5 4.5 0 0 1 9 0" />
      <path d="M13 19a3.5 3.5 0 0 1 7 0" />
    </Svg>
  );
}

export function DriverIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M5 20c0-3.5 3.2-6 7-6s7 2.5 7 6" />
    </Svg>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20c.6-4 3.3-6 7.5-6s6.9 2 7.5 6" />
    </Svg>
  );
}

export function LogOutIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M10 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h5" />
      <path d="M14 8l4 4-4 4" />
      <path d="M8 12h10" />
    </Svg>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
      <path d="M3 10h18" />
      <path d="M8 14h3" />
      <path d="M13 14h3" />
    </Svg>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M21 16.2v2.5a2 2 0 0 1-2.2 2 19.2 19.2 0 0 1-8.3-3A18.8 18.8 0 0 1 4.3 11.5a19.2 19.2 0 0 1-3-8.3A2 2 0 0 1 3.3 1h2.5a2 2 0 0 1 2 1.7l.5 2.7a2 2 0 0 1-.5 1.7L6.5 8.5a16 16 0 0 0 9 9l1.4-1.3a2 2 0 0 1 1.7-.5l2.7.5a2 2 0 0 1 1.7 2Z" />
    </Svg>
  );
}

export function MapPinIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 21s6-5.6 6-11a6 6 0 1 0-12 0c0 5.4 6 11 6 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </Svg>
  );
}

export function RouteIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="6.5" cy="17.5" r="2.5" />
      <circle cx="17.5" cy="6.5" r="2.5" />
      <path d="M9 17.5h3.5a3.5 3.5 0 0 0 3.5-3.5V9" />
      <path d="M16 9h1.5" />
    </Svg>
  );
}

export function CopyIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" />
    </Svg>
  );
}

export function EditIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m4 20 4.5-1 9-9a2.1 2.1 0 0 0-3-3l-9 9L4 20Z" />
      <path d="M13.5 6.5 17 10" />
    </Svg>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 7h16" />
      <path d="M9 3h6" />
      <path d="M7 7l1 13h8l1-13" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
    </Svg>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3 5 6v5c0 5 3 8.3 7 10 4-1.7 7-5 7-10V6l-7-3Z" />
      <path d="m9.5 12 1.7 1.7 3.3-3.7" />
    </Svg>
  );
}

export function RefreshIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20 7v5h-5" />
      <path d="M4 17v-5h5" />
      <path d="M6.8 9A7 7 0 0 1 18.3 6.6L20 7" />
      <path d="M17.2 15A7 7 0 0 1 5.7 17.4L4 17" />
    </Svg>
  );
}

export function TrendIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 17 10 11l4 4 6-8" />
      <path d="M15 7h5v5" />
    </Svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </Svg>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="9" cy="9" r="3" />
      <circle cx="17" cy="8" r="2.5" />
      <path d="M3.5 19a5 5 0 0 1 11 0" />
      <path d="M15 18a4 4 0 0 1 5 0" />
    </Svg>
  );
}

export function MegaphoneIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 13v-2a2 2 0 0 1 1.6-2L17 6v12l-11.4-3A2 2 0 0 1 4 13Z" />
      <path d="M17 9.5a4 4 0 0 0 0 5" />
      <path d="m8 15 1.8 4.2a1.5 1.5 0 0 0 2.8-1.2L11.6 15" />
    </Svg>
  );
}

export function MessageIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7A2.5 2.5 0 0 1 17.5 16H11l-4.5 4v-4H6.5A2.5 2.5 0 0 1 4 13.5Z" />
    </Svg>
  );
}

export function NoteIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 3h8l4 4v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      <path d="M14 3v4h4" />
      <path d="M8 12h8" />
      <path d="M8 16h6" />
    </Svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m5 12.5 4.2 4.2L19 7" />
    </Svg>
  );
}

export function VehicleGlyph({
  kind,
  className,
}: {
  kind: VehicleKind;
  className?: string;
}) {
  if (kind === "tow") {
    return (
      <svg
        viewBox="0 0 64 44"
        fill="none"
        className={className}
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="4" y="18" width="24" height="12" rx="3" />
        <path d="M28 28h10l6-8h8" />
        <path d="M14 18V8h8" />
        <path d="M18 8v10" />
        <path d="M44 20v10" />
        <circle cx="16" cy="34" r="4" />
        <circle cx="44" cy="34" r="4" />
        <circle cx="56" cy="34" r="4" />
      </svg>
    );
  }

  if (kind === "carrier") {
    return (
      <svg
        viewBox="0 0 64 44"
        fill="none"
        className={className}
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M6 28h44l8-10" />
        <path d="M10 28 18 16h16l-6 12" />
        <path d="M36 18h16l-4 10" />
        <path d="M6 28h52" />
        <circle cx="14" cy="34" r="4" />
        <circle cx="34" cy="34" r="4" />
        <circle cx="52" cy="34" r="4" />
      </svg>
    );
  }

  if (kind === "trailer") {
    return (
      <svg
        viewBox="0 0 64 44"
        fill="none"
        className={className}
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="4" y="16" width="30" height="14" rx="3" />
        <path d="M34 24h10l8-8" />
        <path d="M52 16h6" />
        <circle cx="14" cy="34" r="4" />
        <circle cx="28" cy="34" r="4" />
        <circle cx="54" cy="34" r="4" />
      </svg>
    );
  }

  if (kind === "minivan") {
    return (
      <svg
        viewBox="0 0 64 44"
        fill="none"
        className={className}
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M6 28V18l8-6h18l6 6h8l8 6v4H6Z" />
        <path d="M42 24h8" />
        <circle cx="18" cy="34" r="4" />
        <circle cx="34" cy="34" r="4" />
        <circle cx="52" cy="34" r="4" />
      </svg>
    );
  }

  if (kind === "truck") {
    return (
      <svg
        viewBox="0 0 64 44"
        fill="none"
        className={className}
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="4" y="14" width="32" height="16" rx="3" />
        <path d="M36 20h10l6 6v4H36V20Z" />
        <circle cx="16" cy="34" r="4" />
        <circle cx="32" cy="34" r="4" />
        <circle cx="50" cy="34" r="4" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 64 44"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="32" cy="22" r="14" />
      <path d="M32 14v8l5 5" />
    </svg>
  );
}
