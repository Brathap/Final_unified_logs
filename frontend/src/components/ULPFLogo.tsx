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
        <linearGradient id="ulpfShieldGrad" x1="6" y1="4" x2="42" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>

        {/* Stream Gradient */}
        <linearGradient id="ulpfStreamGrad" x1="8" y1="24" x2="38" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
      </defs>

      {/* Cyber Security Shield (Transparent background, clean modern 2.5px vector stroke) */}
      <path
        d="M24 5L41 11.5V23C41 33.5 33.7 42 24 45C14.3 42 7 33.5 7 23V11.5L24 5Z"
        fill="#eff6ff"
        stroke="url(#ulpfShieldGrad)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Converging Multi-source Log Streams into Unified Pipeline */}
      {/* Stream 1 - Top source (Cisco/Firewall) */}
      <path
        d="M13 18H20L25 24H33"
        stroke="#2563eb"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Stream 2 - Middle source (Linux/SSHD direct pipeline) */}
      <path
        d="M11 24H34"
        stroke="#0284c7"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Stream 3 - Bottom source (WAF/CEF) */}
      <path
        d="M13 30H20L25 24H33"
        stroke="#2563eb"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Ingestion Source Nodes (3 incoming dots) */}
      <circle cx="13" cy="18" r="1.5" fill="#3b82f6" />
      <circle cx="11" cy="24" r="1.5" fill="#0284c7" />
      <circle cx="13" cy="30" r="1.5" fill="#3b82f6" />

      {/* Central Lossless Unified Output Core */}
      <circle cx="34" cy="24" r="2.8" fill="#2563eb" />
      <circle cx="34" cy="24" r="1.2" fill="#ffffff" />
    </svg>
  );
};
