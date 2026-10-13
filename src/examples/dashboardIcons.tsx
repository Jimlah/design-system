import type { ReactNode } from 'react'

/**
 * The leads page's icons, drawn locally.
 *
 * **This system ships no icon set, and that is deliberate rather than missing.** The library is
 * components and tokens; an icon is content, and every page that needs one draws the ones it uses —
 * which is what `Create` and `TaskBoard` already do, two and four glyphs at a time. This page needs
 * more than that, so they live in a file of their own rather than at the top of the page body.
 *
 * Two rules keep thirty glyphs from becoming thirty styles:
 *
 * - **One geometry.** Every icon is drawn on a 16-unit grid in a 1.4px stroke of `currentColor`, so
 *   a glyph takes the colour of whatever it sits in, and an icon beside a label is the same weight
 *   as the label's neighbour in the next row. The reference's icons are 1.5px on a 24 grid, which is
 *   the same ratio.
 * - **No colour of its own, ever.** An icon that needs to say something — a rising trend, a hot
 *   lead — says it by being placed inside a thing that is already coloured, or by taking a
 *   `text-*` utility from the caller. Nothing here hardcodes a hue, which is what lets the whole page
 *   flip between the two themes without a single icon being touched.
 */

export interface IconProps {
  /** The box the glyph is drawn into. `size-4` unless the caller says otherwise. */
  className?: string
}

/** The one wrapper. A glyph is its paths and nothing else. */
function Glyph({
  className = 'size-4',
  children,
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {children}
    </svg>
  )
}

/* --- the sidebar's destinations ------------------------------------------ */

export const IconDashboard = (p: IconProps) => (
  <Glyph {...p}>
    <circle cx="8" cy="8" r="5.6" />
    <path d="M8 4.6V8l2.4 1.6" />
  </Glyph>
)

export const IconLeads = (p: IconProps) => (
  <Glyph {...p}>
    <circle cx="6.4" cy="6" r="2.4" />
    <path d="M1.9 13.2c0-2.2 2-3.6 4.5-3.6 1 0 1.9.2 2.6.6" />
    <path d="M11.4 9.4v3.4M9.7 11.1H13.1" />
  </Glyph>
)

export const IconOrders = (p: IconProps) => (
  <Glyph {...p}>
    <path d="M6.2 2.4h3.6v1.8H6.2z" />
    <path d="M9.8 3.3h2a1 1 0 0 1 1 1v8.3a1 1 0 0 1-1 1H4.2a1 1 0 0 1-1-1V4.3a1 1 0 0 1 1-1h2" />
  </Glyph>
)

export const IconCustomers = (p: IconProps) => (
  <Glyph {...p}>
    <circle cx="6" cy="5.6" r="2.3" />
    <path d="M1.8 13.4c0-2.2 1.9-3.5 4.2-3.5s4.2 1.3 4.2 3.5" />
    <path d="M10.6 3.6a2.3 2.3 0 0 1 0 4.4M12 10.4c1.4.4 2.3 1.4 2.3 3" />
  </Glyph>
)

export const IconMessages = (p: IconProps) => (
  <Glyph {...p}>
    <path d="M2 3.6a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H6.4L3.2 14v-2.4H3a1 1 0 0 1-1-1z" />
    <path d="M5.2 5.9h5.6M5.2 8.3h3.4" />
  </Glyph>
)

export const IconFeedback = (p: IconProps) => (
  <Glyph {...p}>
    <path d="M13.4 7.6a5.4 5.4 0 0 1-7.8 4.8L2.6 13.4l1.1-2.9A5.4 5.4 0 1 1 13.4 7.6Z" />
  </Glyph>
)

export const IconHelp = (p: IconProps) => (
  <Glyph {...p}>
    <circle cx="8" cy="8" r="6" />
    <circle cx="8" cy="8" r="2.4" />
    <path d="M4.3 4.3 6.6 6.6M11.7 4.3 9.4 6.6M11.7 11.7 9.4 9.4M4.3 11.7l2.3-2.3" />
  </Glyph>
)

export const IconSettings = (p: IconProps) => (
  <Glyph {...p}>
    <circle cx="8" cy="8" r="2.2" />
    <path d="M12.9 9.8a1.1 1.1 0 0 0 .2 1.2l.1.1a1.3 1.3 0 1 1-1.9 1.9l-.1-.1a1.1 1.1 0 0 0-1.2-.2 1.1 1.1 0 0 0-.7 1v.2a1.3 1.3 0 1 1-2.6 0v-.1a1.1 1.1 0 0 0-.7-1 1.1 1.1 0 0 0-1.2.2l-.1.1a1.3 1.3 0 1 1-1.9-1.9l.1-.1a1.1 1.1 0 0 0 .2-1.2 1.1 1.1 0 0 0-1-.7h-.2a1.3 1.3 0 1 1 0-2.6h.1a1.1 1.1 0 0 0 1-.7 1.1 1.1 0 0 0-.2-1.2l-.1-.1a1.3 1.3 0 1 1 1.9-1.9l.1.1a1.1 1.1 0 0 0 1.2.2h.1a1.1 1.1 0 0 0 .7-1v-.2a1.3 1.3 0 1 1 2.6 0v.1a1.1 1.1 0 0 0 .7 1 1.1 1.1 0 0 0 1.2-.2l.1-.1a1.3 1.3 0 1 1 1.9 1.9l-.1.1a1.1 1.1 0 0 0-.2 1.2v.1a1.1 1.1 0 0 0 1 .7h.2a1.3 1.3 0 1 1 0 2.6h-.1a1.1 1.1 0 0 0-1 .7Z" />
  </Glyph>
)

/* --- the header ----------------------------------------------------------- */

export const IconSearch = (p: IconProps) => (
  <Glyph {...p}>
    <circle cx="7.1" cy="7.1" r="4.6" />
    <path d="M10.5 10.5 14 14" />
  </Glyph>
)

export const IconBell = (p: IconProps) => (
  <Glyph {...p}>
    <path d="M6.2 12.6a1.9 1.9 0 0 0 3.6 0" />
    <path d="M12 6.6a4 4 0 0 0-8 0c0 3-1.2 4-1.2 4h10.4S12 9.6 12 6.6Z" />
  </Glyph>
)

export const IconInfo = (p: IconProps) => (
  <Glyph {...p}>
    <circle cx="8" cy="8" r="6" />
    <path d="M8 7.3v3.4M8 5.4v.1" />
  </Glyph>
)

export const IconShare = (p: IconProps) => (
  <Glyph {...p}>
    <path d="M6.6 8.7a3.2 3.2 0 0 0 4.6.3l1.6-1.6a3.2 3.2 0 0 0-4.6-4.6l-.9.9" />
    <path d="M9.4 7.3a3.2 3.2 0 0 0-4.6-.3L3.2 8.6a3.2 3.2 0 0 0 4.6 4.6l.9-.9" />
  </Glyph>
)

export const IconChevronDown = (p: IconProps) => (
  <Glyph {...p}>
    <path d="m4.4 6.4 3.6 3.6 3.6-3.6" />
  </Glyph>
)

export const IconChevronUp = (p: IconProps) => (
  <Glyph {...p}>
    <path d="m4.4 9.6 3.6-3.6 3.6 3.6" />
  </Glyph>
)

export const IconChevronRight = (p: IconProps) => (
  <Glyph {...p}>
    <path d="m6.4 3.6 4.4 4.4-4.4 4.4" />
  </Glyph>
)

export const IconPlus = (p: IconProps) => (
  <Glyph {...p}>
    <path d="M8 3.2v9.6M3.2 8h9.6" />
  </Glyph>
)

/* --- the toolbar ---------------------------------------------------------- */

export const IconFilter = (p: IconProps) => (
  <Glyph {...p}>
    <path d="M2.4 3.4h11.2l-4.3 5v4.2l-2.6 1.4V8.4z" />
  </Glyph>
)

export const IconSort = (p: IconProps) => (
  <Glyph {...p}>
    <path d="M4.6 3.2v9.6M2.6 10.8 4.6 12.8 6.6 10.8" />
    <path d="M11.4 12.8V3.2M9.4 5.2 11.4 3.2 13.4 5.2" />
  </Glyph>
)

export const IconSliders = (p: IconProps) => (
  <Glyph {...p}>
    <path d="M2.6 4.6h10.8M2.6 11.4h10.8" />
    <circle cx="6.4" cy="4.6" r="1.6" />
    <circle cx="10.2" cy="11.4" r="1.6" />
  </Glyph>
)

export const IconColumns = (p: IconProps) => (
  <Glyph {...p}>
    <rect x="2.4" y="2.4" width="4.4" height="11.2" rx="1" />
    <rect x="9.2" y="2.4" width="4.4" height="11.2" rx="1" />
  </Glyph>
)

export const IconTable = (p: IconProps) => (
  <Glyph {...p}>
    <rect x="2.4" y="2.4" width="11.2" height="11.2" rx="1" />
    <path d="M2.4 6.2h11.2M6.4 6.2v7.4M9.8 6.2v7.4" />
  </Glyph>
)

export const IconImport = (p: IconProps) => (
  <Glyph {...p}>
    <path d="M8 2.6v7.2M5.2 7.2 8 10l2.8-2.8" />
    <path d="M2.6 11v1.6a1 1 0 0 0 1 1h8.8a1 1 0 0 0 1-1V11" />
  </Glyph>
)

export const IconExport = (p: IconProps) => (
  <Glyph {...p}>
    <path d="M8 10.2V3M5.2 5.8 8 3l2.8 2.8" />
    <path d="M2.6 11v1.6a1 1 0 0 0 1 1h8.8a1 1 0 0 0 1-1V11" />
  </Glyph>
)

/* --- the table ------------------------------------------------------------ */

export const IconCalendar = (p: IconProps) => (
  <Glyph {...p}>
    <rect x="2.4" y="3.6" width="11.2" height="10" rx="1" />
    <path d="M2.4 6.6h11.2M5.4 2.4v2.4M10.6 2.4v2.4" />
  </Glyph>
)

export const IconDots = (p: IconProps) => (
  <Glyph {...p}>
    <circle cx="3.6" cy="8" r=".9" fill="currentColor" stroke="none" />
    <circle cx="8" cy="8" r=".9" fill="currentColor" stroke="none" />
    <circle cx="12.4" cy="8" r=".9" fill="currentColor" stroke="none" />
  </Glyph>
)

export const IconTrendUp = (p: IconProps) => (
  <Glyph {...p}>
    <path d="M2.6 11.4 6.2 7.8l2.4 2.4 4.8-4.8" />
    <path d="M10 5.4h3.4v3.4" />
  </Glyph>
)

export const IconTrendDown = (p: IconProps) => (
  <Glyph {...p}>
    <path d="M2.6 4.6 6.2 8.2l2.4-2.4 4.8 4.8" />
    <path d="M10 10.6h3.4V7.2" />
  </Glyph>
)

/* --- the lead card -------------------------------------------------------- */

export const IconGrip = (p: IconProps) => (
  <Glyph {...p}>
    <circle cx="6" cy="4" r=".85" fill="currentColor" stroke="none" />
    <circle cx="10" cy="4" r=".85" fill="currentColor" stroke="none" />
    <circle cx="6" cy="8" r=".85" fill="currentColor" stroke="none" />
    <circle cx="10" cy="8" r=".85" fill="currentColor" stroke="none" />
    <circle cx="6" cy="12" r=".85" fill="currentColor" stroke="none" />
    <circle cx="10" cy="12" r=".85" fill="currentColor" stroke="none" />
  </Glyph>
)

export const IconExpand = (p: IconProps) => (
  <Glyph {...p}>
    <path d="M9.6 2.6h3.8v3.8M13.4 2.6 9.2 6.8" />
    <path d="M6.4 13.4H2.6V9.6M2.6 13.4l4.2-4.2" />
  </Glyph>
)

export const IconCollapse = (p: IconProps) => (
  <Glyph {...p}>
    <path d="M13.4 6.4h-3.8V2.6M9.6 6.4l4.2-4.2" />
    <path d="M2.6 9.6h3.8v3.8M6.4 9.6 2.2 13.8" />
  </Glyph>
)

export const IconClose = (p: IconProps) => (
  <Glyph {...p}>
    <path d="M3.8 3.8 12.2 12.2M12.2 3.8 3.8 12.2" />
  </Glyph>
)

export const IconEnvelope = (p: IconProps) => (
  <Glyph {...p}>
    <rect x="1.8" y="3.4" width="12.4" height="9.2" rx="1" />
    <path d="m2.4 4.4 5.6 4.2 5.6-4.2" />
  </Glyph>
)

export const IconBookmark = (p: IconProps) => (
  <Glyph {...p}>
    <path d="M4 2.6h8a.9.9 0 0 1 .9.9v10L8 10.6l-4.9 2.9v-10a.9.9 0 0 1 .9-.9Z" />
    <path d="M8 4.2v3.4M6.3 5.9h3.4" />
  </Glyph>
)

export const IconPhone = (p: IconProps) => (
  <Glyph {...p}>
    <path d="M5.1 2.6H3.4a1 1 0 0 0-1 1.1c.4 5 4 8.6 9 9a1 1 0 0 0 1.1-1v-1.7l-2.6-.9-1.1 1.5a8.4 8.4 0 0 1-3.2-3.2l1.5-1.1z" />
  </Glyph>
)

export const IconMail = (p: IconProps) => (
  <Glyph {...p}>
    <rect x="1.8" y="3.6" width="12.4" height="8.8" rx="1" />
    <path d="m2.4 4.6 5.6 4 5.6-4" />
  </Glyph>
)

export const IconBuilding = (p: IconProps) => (
  <Glyph {...p}>
    <path d="M2.6 13.4V3.2a1 1 0 0 1 1-1h5.2a1 1 0 0 1 1 1v10.2" />
    <path d="M9.8 6.6h2.6a1 1 0 0 1 1 1v5.8M1.6 13.4h12.8" />
    <path d="M4.6 4.8h3.2M4.6 7.2h3.2M4.6 9.6h3.2" />
  </Glyph>
)

export const IconMapPin = (p: IconProps) => (
  <Glyph {...p}>
    <path d="M8 14.2s4.4-3.6 4.4-7a4.4 4.4 0 1 0-8.8 0c0 3.4 4.4 7 4.4 7Z" />
    <circle cx="8" cy="7.1" r="1.7" />
  </Glyph>
)

export const IconGlobe = (p: IconProps) => (
  <Glyph {...p}>
    <circle cx="8" cy="8" r="6" />
    <path d="M2 8h12" />
    <path d="M8 2a9.3 9.3 0 0 1 0 12 9.3 9.3 0 0 1 0-12Z" />
  </Glyph>
)

export const IconStatus = (p: IconProps) => (
  <Glyph {...p}>
    <path d="M8 2.2 13.8 8 8 13.8 2.2 8z" />
  </Glyph>
)

export const IconClock = (p: IconProps) => (
  <Glyph {...p}>
    <circle cx="8" cy="8" r="6" />
    <path d="M8 4.6V8l2.4 1.6" />
  </Glyph>
)

export const IconRate = (p: IconProps) => (
  <Glyph {...p}>
    <circle cx="8" cy="8" r="6" />
    <circle cx="8" cy="8" r="2.8" />
    <circle cx="8" cy="8" r=".9" fill="currentColor" stroke="none" />
  </Glyph>
)

/* --- the menu ------------------------------------------------------------- */

export const IconCheckDouble = (p: IconProps) => (
  <Glyph {...p}>
    <path d="m1.8 8.4 3 3 5-6" />
    <path d="m8 11.4 5-6" />
  </Glyph>
)

export const IconPlusCircle = (p: IconProps) => (
  <Glyph {...p}>
    <circle cx="8" cy="8" r="6" />
    <path d="M8 5.4v5.2M5.4 8h5.2" />
  </Glyph>
)

export const IconFlag = (p: IconProps) => (
  <Glyph {...p}>
    <path d="M3.4 14V2.6M3.4 3.4h7.2l-.9 2.4.9 2.4H3.4" />
  </Glyph>
)

export const IconTag = (p: IconProps) => (
  <Glyph {...p}>
    <path d="M7.3 2.4H3.4a1 1 0 0 0-1 1v3.9c0 .3.1.5.3.7l5.3 5.3a1 1 0 0 0 1.4 0l3.9-3.9a1 1 0 0 0 0-1.4L8 2.7a1 1 0 0 0-.7-.3Z" />
    <path d="M5.2 5.2v.1" />
  </Glyph>
)

export const IconUserPlus = (p: IconProps) => (
  <Glyph {...p}>
    <circle cx="6.4" cy="5.8" r="2.6" />
    <path d="M1.8 13.4c0-2.4 2.1-3.8 4.6-3.8 1 0 2 .2 2.7.7" />
    <path d="M11.6 9.6v3.6M9.8 11.4h3.6" />
  </Glyph>
)

export const IconArchive = (p: IconProps) => (
  <Glyph {...p}>
    <rect x="1.8" y="2.6" width="12.4" height="3.2" rx="1" />
    <path d="M3 5.8v6.6a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V5.8" />
    <path d="M6.4 8.6h3.2" />
  </Glyph>
)

/* --- the selection bar ---------------------------------------------------- */

export const IconPencil = (p: IconProps) => (
  <Glyph {...p}>
    <path d="M11.1 2.7a1.4 1.4 0 0 1 2 2l-7.4 7.4-2.7.7.7-2.7z" />
  </Glyph>
)

export const IconAssign = (p: IconProps) => (
  <Glyph {...p}>
    <path d="M3 8h8.4" />
    <path d="m8.6 5.2 2.8 2.8-2.8 2.8" />
    <path d="M13.4 3.4v9.2" />
  </Glyph>
)

export const IconTrash = (p: IconProps) => (
  <Glyph {...p}>
    <path d="M2.6 4.4h10.8M6 4.4V3a.9.9 0 0 1 .9-.9h2.2a.9.9 0 0 1 .9.9v1.4" />
    <path d="M4.2 4.4l.7 8.6a1 1 0 0 0 1 .9h4.2a1 1 0 0 0 1-.9l.7-8.6" />
  </Glyph>
)

/* --- the window frame ------------------------------------------------------ */

export const IconSidebar = (p: IconProps) => (
  <Glyph {...p}>
    <rect x="1.8" y="2.6" width="12.4" height="10.8" rx="1" />
    <path d="M6.2 2.6v10.8" />
  </Glyph>
)
