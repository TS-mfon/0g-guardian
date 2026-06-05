const categoryPalette: Record<string, { a: string; b: string; c: string; label: string }> = {
  trading: { a: "#6366f1", b: "#22d3ee", c: "#10b981", label: "market intelligence" },
  research: { a: "#a855f7", b: "#6366f1", c: "#22d3ee", label: "research intelligence" },
  developer: { a: "#22d3ee", b: "#6366f1", c: "#f59e0b", label: "developer intelligence" },
  social: { a: "#ec4899", b: "#a855f7", c: "#22d3ee", label: "social intelligence" },
  game: { a: "#f59e0b", b: "#ec4899", c: "#6366f1", label: "game intelligence" },
  chat: { a: "#10b981", b: "#22d3ee", c: "#6366f1", label: "chat intelligence" },
  custom: { a: "#a855f7", b: "#6366f1", c: "#ec4899", label: "custom intelligence" }
};

function svgDataUri(name: string, category: string) {
  const palette = categoryPalette[category] ?? categoryPalette.custom;
  const safeName = name.replace(/[<>&"']/g, "");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" role="img" aria-label="${safeName} ${palette.label}">
    <defs>
      <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stop-color="${palette.a}"/>
        <stop offset="0.55" stop-color="${palette.b}"/>
        <stop offset="1" stop-color="${palette.c}"/>
      </linearGradient>
      <radialGradient id="glow" cx="65%" cy="25%" r="65%">
        <stop offset="0" stop-color="#ffffff" stop-opacity="0.86"/>
        <stop offset="0.32" stop-color="#ffffff" stop-opacity="0.18"/>
        <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
      </radialGradient>
      <filter id="soft"><feGaussianBlur stdDeviation="5"/></filter>
    </defs>
    <rect width="320" height="320" rx="40" fill="#131318"/>
    <rect x="12" y="12" width="296" height="296" rx="34" fill="url(#bg)"/>
    <rect x="12" y="12" width="296" height="296" rx="34" fill="url(#glow)"/>
    <g opacity="0.9" stroke="#fff" stroke-width="3" fill="none">
      <path d="M68 214c34-64 78-96 132-96 28 0 50 9 70 27"/>
      <path d="M74 238c45-38 91-55 139-50 23 2 43 9 60 20"/>
      <path d="M93 91h123c19 0 35 16 35 35v74c0 19-16 35-35 35H93c-19 0-35-16-35-35v-74c0-19 16-35 35-35z"/>
      <path d="M112 158h33m31 0h33"/>
      <path d="M159 91V58m-31 0h62"/>
    </g>
    <circle cx="245" cy="76" r="38" fill="#fff" opacity="0.16" filter="url(#soft)"/>
    <circle cx="248" cy="74" r="20" fill="#fff" opacity="0.28"/>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function AgentAvatar({ name, category, size = "md" }: { name: string; category: string; size?: "sm" | "md" | "xl" }) {
  return (
    <div className={`agent-avatar ${size}`}>
      <img src={svgDataUri(name, category)} alt={`${name} agent avatar`} />
    </div>
  );
}
