/**
 * Jeu d'icones minimaliste, dessine a la main en SVG.
 *
 * Choix assume : pas de bibliotheque d'icones. Cela evite ~50 ko de JavaScript
 * pour une dizaine de pictogrammes, et garantit un rendu identique partout.
 * Toutes les icones sont `aria-hidden` : le sens est porte par le texte voisin.
 */

type IconProps = {
  className?: string;
  strokeWidth?: number;
};

function Svg({
  children,
  className = "h-5 w-5",
  strokeWidth = 1.75,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export const CalendarIcon = (props: IconProps) => (
  <Svg {...props}>
    <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
    <path d="M3 9.5h18M8 2.5v4M16 2.5v4" />
  </Svg>
);

export const ClockIcon = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5.2l3.2 2" />
  </Svg>
);

export const UserIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M20 21v-1.5a5 5 0 0 0-5-5H9a5 5 0 0 0-5 5V21" />
    <circle cx="12" cy="7" r="4" />
  </Svg>
);

export const CheckIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M20 6 9 17l-5-5" />
  </Svg>
);

export const CheckCircleIcon = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8.5 12.2 2.4 2.4 4.6-4.9" />
  </Svg>
);

export const XIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Svg>
);

export const AlertIcon = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5.5M12 16.5h.01" />
  </Svg>
);

export const ArrowRightIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);

export const ArrowLeftIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M19 12H5M11 18l-6-6 6-6" />
  </Svg>
);

export const ChevronLeftIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="m15 6-6 6 6 6" />
  </Svg>
);

export const ChevronRightIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="m9 6 6 6-6 6" />
  </Svg>
);

export const ChevronDownIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="m6 9 6 6 6-6" />
  </Svg>
);

export const PhoneIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M21 16.9v2.4a2 2 0 0 1-2.2 2 19.6 19.6 0 0 1-8.5-3 19.3 19.3 0 0 1-6-6 19.6 19.6 0 0 1-3-8.6A2 2 0 0 1 3.3 1.6h2.4a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L6.8 9.5a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.4c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z" />
  </Svg>
);

export const MailIcon = (props: IconProps) => (
  <Svg {...props}>
    <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
    <path d="m3 7 8.2 5.6a1.5 1.5 0 0 0 1.6 0L21 7" />
  </Svg>
);

export const MapPinIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M20 10.5c0 5.5-8 12-8 12s-8-6.5-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10.5" r="2.8" />
  </Svg>
);

export const ScissorsIcon = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="6" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12" />
  </Svg>
);

export const RazorIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M4 20 14.5 9.5M13 3.5 20.5 11l-4 4L9 7.5z" />
    <path d="M4.5 19.5h3" />
  </Svg>
);

/** Etiquette de prix — utilisee pour afficher le tarif. */
export const TagIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M20.5 12.9V5A1.5 1.5 0 0 0 19 3.5h-7.9a2 2 0 0 0-1.4.6l-6 6a2 2 0 0 0 0 2.8l6.4 6.4a2 2 0 0 0 2.8 0l6-6a2 2 0 0 0 .6-1.4Z" />
    <circle cx="16" cy="8" r="1.15" fill="currentColor" />
  </Svg>
);

export const SparkleIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M12 3.5 13.9 9l5.6 1.9-5.6 1.9L12 18.5l-1.9-5.7-5.6-1.9L10.1 9z" />
  </Svg>
);

export const InstagramIcon = (props: IconProps) => (
  <Svg {...props}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="3.8" />
    <circle cx="17.3" cy="6.7" r="0.9" fill="currentColor" />
  </Svg>
);

export const FacebookIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M14.5 8.5h2.2V5.4c-.4-.05-1.6-.17-3-.17-3 0-5 1.83-5 5.2v2.4H6v3.4h2.7V22h3.4v-5.77h2.8l.5-3.4h-3.3v-2.06c0-1 .3-1.67 1.4-1.67Z" />
  </Svg>
);

export const TikTokIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M15.5 3.5c.4 2.3 1.9 3.9 4 4.2v3c-1.5.1-3-.3-4.2-1.1v6a5.6 5.6 0 1 1-5.6-5.6c.3 0 .6 0 .9.1v3.2a2.5 2.5 0 1 0 1.7 2.4V3.5z" />
  </Svg>
);

export const SnapchatIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M12 3c2.6 0 4.2 1.9 4.2 4.6 0 .8-.1 1.6-.1 2.1.5.3 1 .1 1.5-.1.6-.2 1.2.6.6 1.2-.5.5-1.4.8-1.7 1.2-.3.5.9 2.8 3 3.5.5.2.4.8-.1 1-.6.2-1.5.3-1.8.6-.2.3 0 .9-.4 1.1-.5.2-1.5-.2-2.4 0-.8.1-1.6 1.3-2.8 1.3s-2-1.2-2.8-1.3c-.9-.2-1.9.2-2.4 0-.4-.2-.2-.8-.4-1.1-.3-.3-1.2-.4-1.8-.6-.5-.2-.6-.8-.1-1 2.1-.7 3.3-3 3-3.5-.3-.4-1.2-.7-1.7-1.2-.6-.6 0-1.4.6-1.2.5.2 1 .4 1.5.1 0-.5-.1-1.3-.1-2.1C7.8 4.9 9.4 3 12 3Z" />
  </Svg>
);

export const MenuIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Svg>
);

export const TrashIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M3.5 6.5h17M9 6.5V4.8A1.3 1.3 0 0 1 10.3 3.5h3.4A1.3 1.3 0 0 1 15 4.8v1.7M18.5 6.5l-.8 12a2 2 0 0 1-2 1.9H8.3a2 2 0 0 1-2-1.9l-.8-12" />
    <path d="M10 11v5.5M14 11v5.5" />
  </Svg>
);

export const EditIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M12.5 5.5H5a2 2 0 0 0-2 2V19a2 2 0 0 0 2 2h11.5a2 2 0 0 0 2-2v-7.5" />
    <path d="M17 3.4a2 2 0 0 1 2.9 2.8L12.4 13.7l-3.6.8.8-3.6z" />
  </Svg>
);

export const PlusIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const SearchIcon = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.6-3.6" />
  </Svg>
);

export const LockIcon = (props: IconProps) => (
  <Svg {...props}>
    <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
    <path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7" />
  </Svg>
);

export const LogOutIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M9.5 20.5H6a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2h3.5" />
    <path d="M16 16.5l4.5-4.5L16 7.5M20 12H9.5" />
  </Svg>
);

export const DownloadIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M12 3.5v11M7.5 10.5 12 15l4.5-4.5" />
    <path d="M4.5 17.5v1.5a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-1.5" />
  </Svg>
);

export const BanIcon = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="m5.6 5.6 12.8 12.8" />
  </Svg>
);

export const SettingsIcon = (props: IconProps) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M19.4 14.5a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.9 2.9l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.9-2.9l.1-.1a1.7 1.7 0 0 0-1.2-2.9H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.9-2.9l.1.1a1.7 1.7 0 0 0 2.9-1.2V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.9 2.9l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.2a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.6 1Z" />
  </Svg>
);

export const ListIcon = (props: IconProps) => (
  <Svg {...props}>
    <path d="M8.5 6.5h12M8.5 12h12M8.5 17.5h12M3.5 6.5h.01M3.5 12h.01M3.5 17.5h.01" />
  </Svg>
);

export const SpinnerIcon = ({ className = "h-5 w-5" }: IconProps) => (
  <svg
    className={`animate-spin ${className}`}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    <circle
      cx="12"
      cy="12"
      r="9"
      stroke="currentColor"
      strokeWidth="2.5"
      opacity="0.25"
    />
    <path
      d="M21 12a9 9 0 0 0-9-9"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </svg>
);
