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
