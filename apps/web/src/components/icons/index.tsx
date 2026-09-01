import * as React from "react";

/**
 * Base utility for conditional class merging.
 */
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

const IconBase = React.forwardRef<SVGSVGElement, IconProps & { children: React.ReactNode }>(
  ({ size = 24, className, children, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.15" /* Increased from 1.75 to feel less faint and more robust */
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("shrink-0", className)}
      {...props}
    >
      {children}
    </svg>
  )
);
IconBase.displayName = "IconBase";

/* ==========================================================================
   NAVIGATION & CORE
   ========================================================================== */

export const IconHome = React.forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <IconBase ref={ref} {...props}>
    <path d="M4 10.5V18a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4v-7.5" />
    <path d="M22 11l-8-6.5a3.5 3.5 0 0 0-4 0L2 11" />
  </IconBase>
));

export const IconWallet = React.forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <IconBase ref={ref} {...props}>
    {/* Exaggerated rx=6 for a much softer, playful feel */}
    <rect x="3" y="5" width="18" height="14" rx="5" />
    <path d="M16 12h.01" />
    <path d="M21 12h-5" />
  </IconBase>
));

export const IconCard = React.forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <IconBase ref={ref} {...props}>
    {/* Extremely rounded card shape */}
    <rect x="3" y="5" width="18" height="14" rx="5" />
    <path d="M3 10h18" />
    <path d="M7 15h2" />
  </IconBase>
));

export const IconUser = React.forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <IconBase ref={ref} {...props}>
    <path d="M20 21v-1a5 5 0 0 0-5-5H9a5 5 0 0 0-5 5v1" />
    <circle cx="12" cy="7" r="4" />
  </IconBase>
));

export const IconBuilding = React.forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <IconBase ref={ref} {...props}>
    {/* Pediment (Roof) */}
    <path d="M3 10L12 4l9 6" />
    {/* Pillars */}
    <path d="M7 10v9" />
    <path d="M12 10v9" />
    <path d="M17 10v9" />
    {/* Steps/Base */}
    <path d="M2 19h20" />
    <path d="M4 22h16" />
  </IconBase>
));

export const IconGrid = React.forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <IconBase ref={ref} {...props}>
    <rect x="3" y="3" width="7" height="7" rx="3" />
    <rect x="14" y="3" width="7" height="7" rx="3" />
    <rect x="14" y="14" width="7" height="7" rx="3" />
    <rect x="3" y="14" width="7" height="7" rx="3" />
  </IconBase>
));

/* ==========================================================================
   SERVICES (Bespoke Concepts)
   ========================================================================== */

export const IconAirtime = React.forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <IconBase ref={ref} {...props}>
    <rect x="5" y="2" width="14" height="20" rx="4" />
    <path d="M12 18h.01" strokeWidth="2.5" />
    <path d="M10 5h4" />
  </IconBase>
));

export const IconData = React.forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <IconBase ref={ref} {...props}>
    <path d="M5 8a10 10 0 0 1 14 0" />
    <path d="M8.5 12.5a5 5 0 0 1 7 0" />
    <circle cx="12" cy="17" r="1.5" fill="currentColor" stroke="none" />
  </IconBase>
));

export const IconElectricity = React.forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <IconBase ref={ref} {...props}>
    <path d="M13 2L3 14h9l-1 8 10-12h-9l2-8z" />
  </IconBase>
));

export const IconTv = React.forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <IconBase ref={ref} {...props}>
    <rect x="2" y="7" width="20" height="14" rx="4" />
    <path d="M17 2l-5 5-5-5" />
  </IconBase>
));

export const IconGift = React.forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <IconBase ref={ref} {...props}>
    <rect x="3" y="8" width="18" height="13" rx="2" />
    <path d="M12 8v13" />
    <path d="M3 13h18" />
    <path d="M12 8c-3-4-7-2-2 1.5l2-1.5z" />
    <path d="M12 8c3-4 7-2 2 1.5l-2-1.5z" />
  </IconBase>
));

export const IconPlane = React.forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <IconBase ref={ref} {...props}>
    <path d="M17.8 19.2L16 11l3.5-3.5a2.12 2.12 0 0 0-3-3L13 8 4.8 6.2c-.5-.1-.9.2-1.1.6L3 8l6 4-3 3-3-1-2 2 5 2 2 5 2-2-1-3 3-3 4 6l1.2-.7c.4-.2.7-.6.6-1.1z" />
  </IconBase>
));

export const IconCoin = React.forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <IconBase ref={ref} {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9 9h6l-1 6H8l1-6z" />
  </IconBase>
));

/* ==========================================================================
   UI CONTROLS & ACTIONS
   ========================================================================== */

export const IconBell = React.forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <IconBase ref={ref} {...props}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </IconBase>
));

export const IconClock = React.forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <IconBase ref={ref} {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 6v6l3 3" />
  </IconBase>
));

export const IconHistory = IconClock;

export const IconEye = React.forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <IconBase ref={ref} {...props}>
    <path d="M2 12c3-6 9-8 15-4 1.5 1 2.5 2.5 3 4-3 6-9 8-15 4-1.5-1-2.5-2.5-3-4z" />
    <circle cx="12" cy="12" r="3" />
  </IconBase>
));

export const IconEyeOff = React.forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <IconBase ref={ref} {...props}>
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" y1="2" x2="22" y2="22" />
  </IconBase>
));

export const IconPlus = React.forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <IconBase ref={ref} {...props}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </IconBase>
));

export const IconArrowUpRight = React.forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <IconBase ref={ref} {...props}>
    <path d="M7 7h10v10" />
    <path d="M7 17L17 7" />
  </IconBase>
));

export const IconArrowLeft = React.forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <IconBase ref={ref} {...props}>
    <path d="M19 12H5" />
    <path d="M12 19l-7-7 7-7" />
  </IconBase>
));

export const IconChevronRight = React.forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <IconBase ref={ref} {...props}>
    <path d="M9 18l6-6-6-6" />
  </IconBase>
));

export const IconChevronDown = React.forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <IconBase ref={ref} {...props}>
    <path d="M6 9l6 6 6-6" />
  </IconBase>
));

export const IconCheck = React.forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <IconBase ref={ref} {...props}>
    <path d="M20 6L9 17l-5-5" />
  </IconBase>
));

export const IconClose = React.forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <IconBase ref={ref} {...props}>
    <path d="M18 6L6 18" />
    <path d="M6 6l12 12" />
  </IconBase>
));

export const IconLock = React.forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <IconBase ref={ref} {...props}>
    <rect x="4" y="10" width="16" height="12" rx="4" />
    <path d="M7 10V7a5 5 0 0 1 10 0v3" />
  </IconBase>
));

export const IconFingerprint = React.forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <IconBase ref={ref} {...props}>
    <path d="M2 12C2 6.5 6.5 2 12 2a10 10 0 0 1 8 4" />
    <path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 11.4-2.5" />
    <path d="M8 14a4 4 0 0 1 8 0" />
    <path d="M12 12v2" />
  </IconBase>
));

export const IconCopy = React.forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <IconBase ref={ref} {...props}>
    <rect x="8" y="8" width="13" height="13" rx="3" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </IconBase>
));

export const IconAlertTriangle = React.forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <IconBase ref={ref} {...props}>
    <path d="M10.3 3.3a2 2 0 0 1 3.4 0l6.6 11.4c.8 1.4-.2 3.3-1.7 3.3H5.4C3.9 18 2.9 16.1 3.7 14.7l6.6-11.4z" />
    <path d="M12 8v4" />
    <path d="M12 16h.01" />
  </IconBase>
));

export const IconSliders = React.forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <IconBase ref={ref} {...props}>
    <path d="M4 21v-7" />
    <path d="M4 10V3" />
    <path d="M12 21v-9" />
    <path d="M12 8V3" />
    <path d="M20 21v-5" />
    <path d="M20 12V3" />
    <path d="M1 14h6" />
    <path d="M9 8h6" />
    <path d="M17 16h2" />
  </IconBase>
));

export const IconLogOut = React.forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <IconBase ref={ref} {...props}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5" />
    <path d="M21 12H9" />
  </IconBase>
));

export const IconSun = React.forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <IconBase ref={ref} {...props}>
    <circle cx="12" cy="12" r="5" />
    <path d="M12 1v2" />
    <path d="M12 21v2" />
    <path d="M4.2 4.2l1.4 1.4" />
    <path d="M18.4 18.4l1.4 1.4" />
    <path d="M1 12h2" />
    <path d="M21 12h2" />
    <path d="M4.2 19.8l1.4-1.4" />
    <path d="M18.4 5.6l1.4-1.4" />
  </IconBase>
));

export const IconMoon = React.forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <IconBase ref={ref} {...props}>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  </IconBase>
));

export const IconSearch = React.forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <IconBase ref={ref} {...props}>
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.3-4.3" />
  </IconBase>
));

export const IconSmartphone = React.forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <IconBase ref={ref} {...props}>
    <rect x="5" y="2" width="14" height="20" rx="4" />
    <path d="M12 18h.01" />
  </IconBase>
));

export const IconKey = React.forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <IconBase ref={ref} {...props}>
    <circle cx="7.5" cy="15.5" r="5.5" />
    <path d="M21 2l-9.6 9.6" />
    <path d="M15.5 7.5l3 3L22 7l-3-3" />
  </IconBase>
));

export const IconShield = React.forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <IconBase ref={ref} {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </IconBase>
));

export const IconEdit = React.forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <IconBase ref={ref} {...props}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </IconBase>
));

export const IconUsers = React.forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <IconBase ref={ref} {...props}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </IconBase>
));

export const IconTrophy = React.forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <IconBase ref={ref} {...props}>
    <path d="M6 9H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h16c1.1 0 2 .9 2 2v2a2 2 0 0 1-2 2h-2" />
    <path d="M8 3h8v6c0 2.2-1.8 4-4 4s-4-1.8-4-4V3z" />
    <path d="M12 13v7" />
    <path d="M8 21h8" />
  </IconBase>
));

export const IconMedal = React.forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <IconBase ref={ref} {...props}>
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    <circle cx="12" cy="16" r="4" />
  </IconBase>
));

export const IconQrCode = React.forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <IconBase ref={ref} {...props}>
    <rect x="3" y="3" width="7" height="7" rx="2" />
    <rect x="14" y="3" width="7" height="7" rx="2" />
    <rect x="14" y="14" width="7" height="7" rx="2" />
    <rect x="3" y="14" width="7" height="7" rx="2" />
    <path d="M11 11h2v2h-2z" />
  </IconBase>
));
