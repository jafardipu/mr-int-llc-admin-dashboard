"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { logout } from "@/store/authSlice";
import { useAppDispatch } from "@/store/hooks";
import {
  IconBox,
  IconBrand,
  IconCarousel,
  IconCart,
  IconChevron,
  IconDashboard,
  IconDeal,
  IconFaq,
  IconList,
  IconOrders,
  IconPromo,
  IconSettings,
  IconSignOut,
  IconSupport,
  IconUsers,
  IconWallet,
} from "./icons";

const nav = [
  { href: "/", label: "Dashboard", icon: IconDashboard },
  { href: "/customers", label: "Customers", icon: IconUsers },
  { href: "/products", label: "Products", icon: IconCart },
  { href: "/categories", label: "Categories", icon: IconList },
  { href: "/brands", label: "Brands", icon: IconBrand },
  { href: "/carousel", label: "Carousel", icon: IconCarousel },
  { href: "/deals", label: "Deals", icon: IconDeal },
  { href: "/faqs", label: "FAQs", icon: IconFaq },
  { href: "/promo-codes", label: "Promo Codes", icon: IconPromo },
  { href: "/support", label: "Support", icon: IconSupport },
  { href: "/orders", label: "Orders", icon: IconOrders },
  { href: "/prep-requests", label: "3PL Prep Services", icon: IconBox },
  { href: "/payments", label: "Payments & Revenue", icon: IconWallet },
];

const settings = [
  { href: "/settings/profile", label: "Edit Profile" },
  { href: "/settings/pricing", label: "Pricing" },
  { href: "/settings/terms", label: "Terms & Conditions" },
  { href: "/settings/privacy", label: "Privacy Policy" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const settingsOpen = settings.some((item) => pathname.startsWith(item.href));
  const [open, setOpen] = useState(settingsOpen);

  return (
    <aside className="flex min-h-screen w-[256px] shrink-0 flex-col justify-between bg-sidebar py-4 shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
      <div>
        <div className="flex h-[88px] items-center justify-center px-6 pb-8">
          <Image
            src="/images/logo.png"
            alt="MR International LLC"
            width={115}
            height={81}
            className="h-[81px] w-[115px] object-contain"
            priority
          />
        </div>
        <nav className="flex flex-col gap-2.5 px-4">
          {nav.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm ${
                  active
                    ? "bg-brand font-semibold text-white shadow-[0_1px_1px_rgba(153,86,24,0.3)]"
                    : "font-medium text-slate hover:bg-white/50"
                }`}
              >
                <Icon className="size-5" />
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className={`flex items-center justify-between rounded-lg px-3.5 py-2.5 text-sm ${
              settingsOpen
                ? "bg-brand font-semibold text-white"
                : "font-medium text-slate hover:bg-white/50"
            }`}
          >
            <span className="flex items-center gap-3">
              <IconSettings className="size-5" />
              Settings
            </span>
            <IconChevron className={`size-4 transition ${open ? "rotate-90" : ""}`} />
          </button>
          {open
            ? settings.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`ml-8 rounded-lg px-3 py-2 text-sm ${
                    pathname === item.href
                      ? "bg-white font-semibold text-brand"
                      : "text-slate hover:bg-white/50"
                  }`}
                >
                  {item.label}
                </Link>
              ))
            : null}
        </nav>
      </div>
      <button
        type="button"
        onClick={() => {
          dispatch(logout());
          router.replace("/login");
        }}
        className="mx-4 mb-2 flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium text-danger hover:bg-white/60"
      >
        <IconSignOut className="size-5" />
        Sign out
      </button>
    </aside>
  );
}
