import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const ULPFLogo: React.FC<LogoProps> = ({ className = '', size = 46 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Neon Prismatic Cyber Gradient for Main Armor */}
        <linearGradient id="cyberArmor" x1="8" y1="4" x2="56" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="50%" stopColor="#1d4ed8" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>

        {/* Hyper-Glow Cyan for Live Log Beams */}
        <linearGradient id="laserBeam" x1="0" y1="0" x2="48" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>

        {/* Intense Neon Drop-Shadow Filter */}
        <filter id="neonBlast" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#38bdf8" floodOpacity="0.9" />
        </filter>

        <filter id="coreFlare" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#a855f7" floodOpacity="0.8" />
        </filter>
      </defs>

      {/* 1. Outer Hexagonal Cyber-Shield Perimeter (Defense & Air-Gap Non-Repudiation) */}
      <path
        d="M32 4L56 16V40L32 60L8 40V16L32 4Z"
        fill="url(#cyberArmor)"
        stroke="#38bdf8"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* 2. Inner Shield Facet Accent */}
      <path
        d="M32 10L50 20V38L32 53L14 38V20L32 10Z"
        fill="#0b1329"
        stroke="#1e3a8a"
        strokeWidth="1.5"
      />

      {/* 3. Three Multi-Source Log Beams Funneling into the Quantum Center */}
      {/* Stream A: Top Beam (Firewall/Cisco) */}
      <path
        d="M12 22H24L32 30"
        stroke="#38bdf8"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#neonBlast)"
      />

      {/* Stream B: Center Direct High-Speed Beam (Linux/Syslog) */}
      <path
        d="M8 32H30"
        stroke="#67e8f9"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#neonBlast)"
      />

      {/* Stream C: Bottom Beam (WAF/CEF) */}
      <path
        d="M12 42H24L32 34"
        stroke="#38bdf8"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#neonBlast)"
      />

      {/* 4. Converged Unified Standardized OCSF Output Ray (Blasting out to the right) */}
      <path
        d="M36 32H54"
        stroke="url(#laserBeam)"
        strokeWidth="4"
        strokeLinecap="round"
        filter="url(#coreFlare)"
      />

      {/* 5. Central Quantum Normalization Core (The Lossless Uncorrupted Heart) */}
      <circle cx="32" cy="32" r="6" fill="#0284c7" />
      <polygon points="32,27 36,32 32,37 28,32" fill="#ffffff" filter="url(#neonBlast)" />

      {/* 6. Ingestion Data Packet Pulses on Left Entrance */}
      <circle cx="12" cy="22" r="2.2" fill="#ffffff" filter="url(#neonBlast)" />
      <circle cx="8" cy="32" r="2.5" fill="#ffffff" filter="url(#neonBlast)" />
      <circle cx="12" cy="42" r="2.2" fill="#ffffff" filter="url(#neonBlast)" />

      {/* 7. Output Standard Node on Right Exit */}
      <circle cx="54" cy="32" r="3" fill="#c084fc" filter="url(#coreFlare)" />
    </svg>
  );
};
