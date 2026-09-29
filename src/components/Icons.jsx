import React from "react";

// Obsidian crystalline SVG icon
export const ObsidianIcon = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 2L88 35L50 98L12 35Z" stroke="currentColor" strokeWidth="4.5" strokeLinejoin="round" />
    <path d="M50 2L50 52" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
    <path d="M50 52L88 35" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
    <path d="M50 52L12 35" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
    <path d="M50 52L50 98" stroke="currentColor" strokeWidth="4.5" strokeLinejoin="round" />
    <path d="M50 2L88 35L50 52Z" fill="currentColor" fillOpacity="0.18" />
    <path d="M50 52L12 35L50 2Z" fill="currentColor" fillOpacity="0.08" />
    <path d="M50 52L50 98L12 35Z" fill="currentColor" fillOpacity="0.12" />
    <path d="M50 52L88 35L50 98Z" fill="currentColor" fillOpacity="0.25" />
  </svg>
);

// Endfield styled game target/crosshair icon
export const GameModeIcon = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="4" strokeDasharray="12 8" />
    <circle cx="50" cy="50" r="28" stroke="currentColor" strokeWidth="1.5" />
    <path d="M50 15V32M50 68V85M15 50H32M68 50H85" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    <path d="M38 38L44 44M62 38L56 44M62 62L56 56M38 62L44 56" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="50" cy="50" r="6" fill="currentColor" />
  </svg>
);

// Youtube icon outline (unfilled)
export const YoutubeOutlineIcon = ({ className = "w-4 h-4", style }) => (
  <svg 
    viewBox="0 0 24 24" 
    className={className} 
    style={style} 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
    <path d="m10 15 5-3-5-3z" />
  </svg>
);

// Code "</>" icon (<ms> tag style)
export const CodeTagIcon = ({ className = "w-4 h-4", style }) => (
  <svg 
    viewBox="0 0 24 24" 
    className={className} 
    style={style} 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);

// CyberCamera / Aperture Icon for Aktogram
export const CyberCameraIcon = ({ className = "w-5 h-5", style }) => (
  <svg 
    viewBox="0 0 100 100" 
    className={className} 
    style={style} 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Outer Cyber Rounded Body */}
    <rect x="8" y="20" width="84" height="68" rx="16" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
    {/* Viewfinder notch top */}
    <path d="M34 20L38 12H62L66 20" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
    {/* Sensor Flash / Status LED */}
    <circle cx="76" cy="34" r="4" fill="currentColor" />
    {/* Outer Lens Ring */}
    <circle cx="50" cy="54" r="24" stroke="currentColor" strokeWidth="5" strokeDasharray="8 4" />
    {/* Aperture Iris Blades */}
    <circle cx="50" cy="54" r="14" stroke="currentColor" strokeWidth="3" />
    <path d="M50 40L58 48M64 54L56 62M50 68L42 60M36 54L44 46" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    {/* Central Core Dot */}
    <circle cx="50" cy="54" r="3.5" fill="currentColor" />
  </svg>
);
