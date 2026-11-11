import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function base(props: IconProps) {
  return {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...props,
  };
}

export function IconDashboard(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="3" width="7" height="9" rx="1.4" />
      <rect x="14" y="3" width="7" height="5" rx="1.4" />
      <rect x="14" y="12" width="7" height="9" rx="1.4" />
      <rect x="3" y="16" width="7" height="5" rx="1.4" />
    </svg>
  );
}

export function IconUsers(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19c.6-3 2.8-5 5.5-5s4.9 2 5.5 5" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M16 14.2c2.2.3 3.8 1.8 4.4 4.3" />
    </svg>
  );
}

export function IconCart(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 5h2l1.4 9.2a2 2 0 0 0 2 1.8h7.8a2 2 0 0 0 2-1.6L21 8H8" />
      <circle cx="10" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
    </svg>
  );
}

export function IconList(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M8 7h12M8 12h12M8 17h12" />
      <circle cx="4" cy="7" r="1" fill="currentColor" />
      <circle cx="4" cy="12" r="1" fill="currentColor" />
      <circle cx="4" cy="17" r="1" fill="currentColor" />
    </svg>
  );
}

export function IconOrders(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 7h14v12H5z" />
      <path d="M8 7V5.8A4 4 0 0 1 16 5.8V7" />
    </svg>
  );
}

export function IconBox(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 8l9-4 9 4-9 4-9-4z" />
      <path d="M3 8v8l9 4 9-4V8" />
      <path d="M12 12v8" />
    </svg>
  );
}

export function IconWallet(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M16 12h5v5h-5a2.5 2.5 0 0 1 0-5z" />
    </svg>
  );
}

export function IconCarousel(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M8 19h8" />
      <circle cx="9" cy="16.5" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="12" cy="16.5" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="15" cy="16.5" r="0.8" fill="currentColor" stroke="none" />
      <path d="M7 10l2.5 2.2L13 8.5l4 4.5" />
    </svg>
  );
}

export function IconBrand(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9z" />
      <path d="M12 12v9M4 7.5l8 4.5 8-4.5" />
    </svg>
  );
}

export function IconPromo(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 9.5 9.5 3l11.5 11.5-6.5 6.5L3 9.5z" />
      <circle cx="8.2" cy="8.2" r="1.2" fill="currentColor" stroke="none" />
      <path d="M12 11.5l3.5 3.5M14.5 9l3.5 3.5" />
    </svg>
  );
}

export function IconFaq(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.2a2.6 2.6 0 0 1 5 1c0 1.6-2.5 2-2.5 3.5" />
      <circle cx="12" cy="16.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconSupport(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 10a8 8 0 0 1 16 0v3.5a2.5 2.5 0 0 1-2.5 2.5H16" />
      <path d="M4 13.5A2.5 2.5 0 0 0 6.5 16H8v-5H6.5A2.5 2.5 0 0 0 4 13.5z" />
      <path d="M20 13.5A2.5 2.5 0 0 1 17.5 16H16v-5h1.5A2.5 2.5 0 0 1 20 13.5z" />
      <path d="M12 19h2a2 2 0 0 0 2-2" />
    </svg>
  );
}

export function IconSettings(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2M12 19v2M4.9 6.1l1.5 1.5M17.6 16.4l1.5 1.5M3 12h2M19 12h2M4.9 17.9l1.5-1.5M17.6 7.6l1.5-1.5" />
    </svg>
  );
}

export function IconSignOut(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M10 7V5a2 2 0 0 1 2-2h7v18h-7a2 2 0 0 1-2-2v-2" />
      <path d="M4 12h10M11 8l4 4-4 4" />
    </svg>
  );
}

export function IconBell(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 17h12l-1.2-2V10a4.8 4.8 0 0 0-9.6 0v5L6 17z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function IconCalendar(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M8 3.5V7M16 3.5V7M3.5 10h17" />
    </svg>
  );
}

export function IconSearch(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="11" cy="11" r="6" />
      <path d="M16 16l4 4" />
    </svg>
  );
}

export function IconEye(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M2.5 12S6.5 6 12 6s9.5 6 9.5 6-4 6-9.5 6S2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="2.4" />
    </svg>
  );
}

export function IconEdit(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3z" />
      <path d="M12.5 6.5l3 3" />
    </svg>
  );
}

export function IconTrash(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 7h16" />
      <path d="M9 7V5h6v2" />
      <path d="M7 7l1 12h8l1-12" />
      <path d="M10 11v5M14 11v5" />
    </svg>
  );
}

export function IconBan(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="8" />
      <path d="M7 7l10 10" />
    </svg>
  );
}

export function IconUnlock(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 7.5-2" />
    </svg>
  );
}

export function IconDots(props: IconProps) {
  return (
    <svg {...base({ ...props, fill: "currentColor", stroke: "none" })}>
      <circle cx="6" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="18" cy="12" r="1.6" />
    </svg>
  );
}

export function IconPlus(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconChevron(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}
