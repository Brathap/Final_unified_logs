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
        {/* Shield Gradient */}
        <linearGradient id="shieldFillGrad" x1="24" y1="4" x2="24" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#1e40af" />
        </linearGradient>

        <linearGradient id="shieldBorderGrad" x1="6" y1="4" x2="42" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>

        {/* Glow */}
        <filter id="laserGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#38bdf8" floodOpacity="0.8" />
        </filter>
      </defs>

      {/* 1. Clear Cybersecurity Defense Shield */}
      <path
        d="M24 4L42 11V23C42 34 34.5 41.5 24 44C13.5 41.5 6 34 6 23V11L24 4Z"
        fill="url(#shieldFillGrad)"
        stroke="url(#shieldBorderGrad)"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* 2. Three Incoming Raw Log Streams on the Left */}
      {/* Top Stream */}
      <path
        d="M12 17H19L24 22H32"
        stroke="#7dd3fc"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Middle Stream */}
      <path
        d="M10 24H33"
        stroke="#ffffff"
        strokeWidth="2.8"
        strokeLinecap="round"
        filter="url(#laserGlow)"
      />
      {/* Bottom Stream */}
      <path
        d="M12 31H19L24 26H32"
        stroke="#7dd3fc"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 3. Ingestion Dots on Left */}
      <circle cx="12" cy="17" r="1.8" fill="#38bdf8" />
      <circle cx="10" cy="24" r="2" fill="#ffffff" />
      <circle cx="12" cy="31" r="1.8" fill="#38bdf8" />

      {/* 4. Single Unified Standardized Output Core (Right) */}
      <circle cx="34" cy="24" r="3.2" fill="#38bdf8" filter="url(#laserGlow)" />
      <circle cx="34" cy="24" r="1.5" fill="#ffffff" />
    </svg>
  );
};
