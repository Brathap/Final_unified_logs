import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const ULPFLogo: React.FC<LogoProps> = ({ className = '', size = 42 }) => {
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
        {/* Crisp Azure Cyber Gradient */}
        <linearGradient id="shieldVibrant" x1="24" y1="4" x2="24" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>

      {/* Modern High-End Cyber Defense Shield */}
      <path
        d="M24 4L42 11V23C42 34 34.5 41.5 24 44C13.5 41.5 6 34 6 23V11L24 4Z"
        fill="url(#shieldVibrant)"
        stroke="#1e40af"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Terminal Command Prompt Bracket `>` (Solid Crisp White) */}
      <path
        d="M17 18L25 24L17 30"
        stroke="#ffffff"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Glowing High-Speed Terminal Cursor `_` */}
      <path
        d="M28 30H34"
        stroke="#38bdf8"
        strokeWidth="3.2"
        strokeLinecap="round"
      />

      {/* Real-Time Processing Pulse Dot (Top-Right of Shield) */}
      <circle cx="33" cy="18" r="2.2" fill="#38bdf8" />
    </svg>
  );
};
