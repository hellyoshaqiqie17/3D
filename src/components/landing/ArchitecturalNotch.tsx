import React from 'react';

/**
 * Architectural scalloped notches replicating the iconic DNOIN.INC aesthetic.
 * These SVG cutouts overlay image containers with the page background color (#F7F7F5)
 * to create smooth architectural concave and convex scoops.
 */

interface NotchProps {
  className?: string;
  fillColor?: string;
}

export function CardTopNotch({ className = '', fillColor = '#F7F7F5' }: NotchProps) {
  return (
    <div className={`w-full overflow-hidden leading-none ${className}`}>
      <svg
        viewBox="0 0 400 18"
        preserveAspectRatio="none"
        className="w-full h-[18px] block"
        style={{ fill: fillColor }}
      >
        {/* Concave dip in the center of the top border */}
        <path d="M 0,0 L 130,0 C 165,0 175,16 200,16 C 225,16 235,0 270,0 L 400,0 L 400,-1 L 0,-1 Z" />
      </svg>
    </div>
  );
}

export function HeroBottomNotch({ className = '', fillColor = '#F7F7F5' }: NotchProps) {
  return (
    <div className={`w-full overflow-hidden leading-none ${className}`}>
      <svg
        viewBox="0 0 600 24"
        preserveAspectRatio="none"
        className="w-full h-6 block"
        style={{ fill: fillColor }}
      >
        {/* Inverted scoop arching upward in the center */}
        <path d="M 0,24 L 210,24 C 255,24 265,4 300,4 C 335,4 345,24 390,24 L 600,24 L 600,25 L 0,25 Z" />
      </svg>
    </div>
  );
}

export function BannerTopNotch({ className = '', fillColor = '#F7F7F5' }: NotchProps) {
  return (
    <div className={`w-full overflow-hidden leading-none ${className}`}>
      <svg
        viewBox="0 0 600 24"
        preserveAspectRatio="none"
        className="w-full h-6 block"
        style={{ fill: fillColor }}
      >
        {/* Concave dip in the top center */}
        <path d="M 0,0 L 210,0 C 255,0 265,20 300,20 C 335,20 345,0 390,0 L 600,0 L 600,-1 L 0,-1 Z" />
      </svg>
    </div>
  );
}

export function BannerBottomNotch({ className = '', fillColor = '#F7F7F5' }: NotchProps) {
  return (
    <div className={`w-full overflow-hidden leading-none ${className}`}>
      <svg
        viewBox="0 0 600 24"
        preserveAspectRatio="none"
        className="w-full h-6 block"
        style={{ fill: fillColor }}
      >
        {/* Inverted scoop arching upward in the bottom center */}
        <path d="M 0,24 L 210,24 C 255,24 265,6 300,6 C 335,6 345,24 390,24 L 600,24 L 600,25 L 0,25 Z" />
      </svg>
    </div>
  );
}
