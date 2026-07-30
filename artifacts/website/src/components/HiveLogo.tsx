import React from 'react';

export function HiveLogo({ className = "", size = 48 }: { className?: string, size?: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 120 120" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Top Hexagon */}
      <path d="M60 10 L86 25 L86 55 L60 70 L34 55 L34 25 Z" fill="#F5C518" fillOpacity="0.9"/>
      {/* Bottom Right Hexagon */}
      <path d="M86 55 L112 70 L112 100 L86 115 L60 100 L60 70 Z" fill="#D4A017" fillOpacity="0.85"/>
      {/* Bottom Left Hexagon */}
      <path d="M34 55 L60 70 L60 100 L34 115 L8 100 L8 70 Z" fill="#C9860A" fillOpacity="0.95"/>
    </svg>
  );
}
