import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const ULPFLogo: React.FC<LogoProps> = ({ className = '', size = 36 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Vibrant Electric Blue-to-Cyan Gradient for Left "U" Stem */}
        <linearGradient id="ulpfGradLeft" x1="6" y1="6" x2="24" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>

        {/* Vibrant Royal Indigo-to-Blue Gradient for Right Shield Wing */}
        <linearGradient id="ulpfGradRight" x1="42" y1="6" x2="24" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>

        {/* Neon Core Glow for Center Ingestion Point */}
        <filter id="coreGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#38bdf8" floodOpacity="0.8" />
        </filter>
      </defs>

      {/* 
        THE CRAZY / UNIQUE ULPF MONOGRAM SHIELD:
        - An ultra-bold, geometric, interlocking "U" representing Universal Log Framework
        - The bottom tapers into an impenetrable defense shield crest
        - The negative space inside houses the live terminal log pipeline bracket `>_`
      */}

      {/* Left Wing / Left "U" Arm with Beveled Cyber Cut */}
      <path
        d="M8 8H16V26C16 30.5 19.5 34 24 34V42C14 42 8 35 8 26V8Z"
        fill="url(#ulpfGradLeft)"
      />

      {/* Right Wing / Right Shield Arm with Angular Facet */}
      <path
        d="M40 8H32V26C32 30.5 28.5 34 24 34V42C34 42 40 35 40 26V8Z"
        fill="url(#ulpfGradRight)"
      />

      {/* Top Cyber Defense Bar linking the structure */}
      <rect x="18" y="8" width="12" height="4.5" rx="2" fill="#2563eb" />

      {/* Converging Log Stream Data Tracks (Horizontal Beams crossing into the Shield) */}
      <rect x="4" y="14" width="7" height="3" rx="1.5" fill="#0284c7" />
      <rect x="2" y="20" width="9" height="3" rx="1.5" fill="#38bdf8" filter="url(#coreGlow)" />
      <rect x="4" y="26" width="7" height="3" rx="1.5" fill="#0284c7" />

      {/* Center Console Terminal Prompt `> _` (Representing Real-time Log Stream Engine) */}
      {/* The `>` Symbol */}
      <path
        d="M20 18L24.5 22L20 26"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* The Cursor `_` */}
      <path
        d="M26 26H29.5"
        stroke="#38bdf8"
        strokeWidth="2.5"
        strokeLinecap="round"
        filter="url(#coreGlow)"
      />

      {/* Bottom Shield Anchor Node (Deterministic Non-Repudiation Seal) */}
      <circle cx="24" cy="42" r="2.5" fill="#2563eb" />
      <circle cx="24" cy="42" r="1.2" fill="#ffffff" />
    </svg>
  );
};
