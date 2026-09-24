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
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Outer Shield Gradient */}
        <linearGradient id="shieldGrad" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>

        {/* Data Stream Gradient */}
        <linearGradient id="streamGrad" x1="0" y1="50" x2="60" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>

        {/* Glow Filter */}
        <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#38bdf8" floodOpacity="0.6" />
        </filter>
      </defs>

      {/* Background Dark Container */}
      <rect width="100" height="100" rx="22" fill="#0f172a" />
      <rect width="100" height="100" rx="22" stroke="#334155" strokeWidth="2" />

      {/* Cyber Defense Shield Outline */}
      <path
        d="M50 14L82 24V48C82 68 67 83 50 88C33 83 18 68 18 48V24L50 14Z"
        fill="#1e293b"
        stroke="url(#shieldGrad)"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />

      {/* Inner Shield Accent */}
      <path
        d="M50 22L74 30V48C74 63 63 75 50 79C37 75 26 63 26 48V30L50 22Z"
        fill="#0f172a"
        stroke="#1e3a8a"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Converging Log Streams (Multi-source Ingestion) */}
      {/* Stream 1 - Top */}
      <path
        d="M26 38H44L52 46H66"
        stroke="#38bdf8"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#cyanGlow)"
      />
      {/* Stream 2 - Mid Top */}
      <path
        d="M23 44H45L52 48H68"
        stroke="#22d3ee"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Stream 3 - Center */}
      <path
        d="M20 50H70"
        stroke="#60a5fa"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Stream 4 - Mid Bottom */}
      <path
        d="M23 56H45L52 52H68"
        stroke="#22d3ee"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Stream 5 - Bottom */}
      <path
        d="M26 62H44L52 54H66"
        stroke="#38bdf8"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#cyanGlow)"
      />

      {/* Central Unified Lossless Output Crystal Core / Node */}
      <circle cx="70" cy="50" r="4.5" fill="#ffffff" filter="url(#cyanGlow)" />
      <circle cx="70" cy="50" r="2.5" fill="#0284c7" />
    </svg>
  );
};
