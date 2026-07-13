import React from 'react';

export function HexagonBackground() {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden hex-grid-container pointer-events-none bg-background">
      <div className="absolute top-0 left-0 w-[200vw] h-[200vh] -translate-x-[50vw] -translate-y-[50vh] hex-grid-surface">
        {/* We use an SVG pattern to render repeating hexagons efficiently */}
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern 
              id="hexagons" 
              width="60" 
              height="103.92304845413263" 
              patternUnits="userSpaceOnUse" 
              patternTransform="scale(1.5)"
            >
              <path 
                d="M30 0L60 17.32050807568877L60 51.96152422706631L30 69.28203230275508L0 51.96152422706631L0 17.32050807568877Z" 
                stroke="currentColor" 
                strokeWidth="1" 
                fill="transparent" 
                className="text-primary/10 dark:text-primary/15"
              />
              <path 
                d="M30 103.92304845413263L60 86.60254037844386L60 51.96152422706631L30 69.28203230275508L0 51.96152422706631L0 86.60254037844386Z" 
                stroke="currentColor" 
                strokeWidth="1" 
                fill="transparent" 
                className="text-primary/10 dark:text-primary/15"
              />
            </pattern>
            {/* Soft gradient to fade out the edges */}
            <radialGradient id="fade" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="white" stopOpacity="1" />
              <stop offset="80%" stopColor="white" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#hexagons)" mask="url(#fadeMask)" />
          <mask id="fadeMask">
            <rect width="100%" height="100%" fill="url(#fade)" />
          </mask>
        </svg>
      </div>
      
      {/* Brand glowing orbs */}
      <div className="absolute top-[20%] left-[10%] w-[600px] h-[600px] bg-primary/20 dark:bg-primary/10 rounded-full blur-[150px] mix-blend-screen" />
      <div className="absolute bottom-[10%] right-[10%] w-[800px] h-[800px] bg-blue-600/10 dark:bg-blue-900/30 rounded-full blur-[150px] mix-blend-screen" />
    </div>
  );
}
