const base = {
  xmlns: 'http://www.w3.org/2000/svg',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

function svgProps({ size = 24 }) {
  return { ...base, width: size, height: size, viewBox: '0 0 24 24' };
}

export function BookIcon({ size = 24, filled = false }) {
  if (filled) {
    return (
      <svg {...svgProps({ size })} fill="currentColor" stroke="none">
        <path d="M4 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16a1 1 0 0 1-1.5.87L12 17.3l-6.5 3.57A1 1 0 0 1 4 20V4z" />
      </svg>
    );
  }
  return (
    <svg {...svgProps({ size })}>
      <path d="M6 3h11a2 2 0 0 1 2 2v14l-7-3-7 3V5a2 2 0 0 1 1-2z" />
    </svg>
  );
}

export function UsersIcon({ size = 24, filled = false }) {
  if (filled) {
    return (
      <svg {...svgProps({ size })} fill="currentColor" stroke="none">
        <circle cx="9" cy="8" r="4" />
        <path d="M1 21a8 8 0 0 1 16 0v1H1zM17 11a3 3 0 1 0 0-6M23 21a7 7 0 0 0-5-6.7" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }
  return (
    <svg {...svgProps({ size })}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function UserIcon({ size = 24, filled = false }) {
  if (filled) {
    return (
      <svg {...svgProps({ size })} fill="currentColor" stroke="none">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0v1H4z" />
      </svg>
    );
  }
  return (
    <svg {...svgProps({ size })}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function LogOutIcon({ size = 24 }) {
  return (
    <svg {...svgProps({ size })}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export function EditIcon({ size = 24 }) {
  return (
    <svg {...svgProps({ size })}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

export function TrashIcon({ size = 24 }) {
  return (
    <svg {...svgProps({ size })}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

export function PlusIcon({ size = 24 }) {
  return (
    <svg {...svgProps({ size })}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function ChevronRightIcon({ size = 24 }) {
  return (
    <svg {...svgProps({ size })}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export function CloseIcon({ size = 14 }) {
  return (
    <svg {...svgProps({ size })}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function MenuIcon({ size = 24 }) {
  return (
    <svg {...svgProps({ size })}>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

export function ChevronLeftIcon({ size = 24 }) {
  return (
    <svg {...svgProps({ size })}>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

export function BoldIcon({ size = 16 }) {
  return (
    <svg {...svgProps({ size })}>
      <path d="M6 4h6a3.5 3.5 0 0 1 0 7H6zM6 11h7a3.5 3.5 0 0 1 0 7H6z" />
    </svg>
  );
}

export function ItalicIcon({ size = 16 }) {
  return (
    <svg {...svgProps({ size })}>
      <line x1="12" y1="4" x2="9" y2="20" />
      <line x1="14" y1="4" x2="17" y2="4" />
      <line x1="6" y1="20" x2="9" y2="20" />
    </svg>
  );
}

export function ListIcon({ size = 16 }) {
  return (
    <svg {...svgProps({ size })}>
      <line x1="9" y1="6" x2="21" y2="6" />
      <line x1="9" y1="12" x2="21" y2="12" />
      <line x1="9" y1="18" x2="21" y2="18" />
      <circle cx="4" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="4" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="4" cy="18" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ListOrderedIcon({ size = 16 }) {
  return (
    <svg {...svgProps({ size })}>
      <line x1="10" y1="6" x2="21" y2="6" />
      <line x1="10" y1="12" x2="21" y2="12" />
      <line x1="10" y1="18" x2="21" y2="18" />
      <text x="1" y="9" fontSize="7" fill="currentColor" stroke="none">1</text>
      <text x="1" y="15" fontSize="7" fill="currentColor" stroke="none">2</text>
      <text x="1" y="21" fontSize="7" fill="currentColor" stroke="none">3</text>
    </svg>
  );
}

export function CodeIcon({ size = 16 }) {
  return (
    <svg {...svgProps({ size })}>
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

export function ImageIcon({ size = 16 }) {
  return (
    <svg {...svgProps({ size })}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

export function TableIcon({ size = 16 }) {
  return (
    <svg {...svgProps({ size })}>
      <rect x="3" y="3" width="18" height="18" rx="1" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="3" x2="9" y2="21" />
      <line x1="15" y1="3" x2="15" y2="21" />
    </svg>
  );
}
