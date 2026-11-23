import React from 'react';

interface Category3DIconProps {
  categoryKey: string;
  className?: string;
}

export const Category3DIcon: React.FC<Category3DIconProps> = ({
  categoryKey,
  className = 'w-9 h-9 sm:w-10 sm:h-10',
}) => {
  const k = categoryKey.toLowerCase();

  // 1. All Products — 4 beveled 3D isometric cubes
  if (categoryKey === 'All') {
    return (
      <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
        <defs>
          <linearGradient id="c3d-all-orange" x1="6" y1="6" x2="22" y2="22" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFB067" />
            <stop offset="55%" stopColor="#F57224" />
            <stop offset="100%" stopColor="#C2410C" />
          </linearGradient>
          <linearGradient id="c3d-all-blue" x1="26" y1="6" x2="42" y2="22" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#7DD3FC" />
            <stop offset="60%" stopColor="#0284C7" />
            <stop offset="100%" stopColor="#0369A1" />
          </linearGradient>
          <linearGradient id="c3d-all-emerald" x1="6" y1="26" x2="22" y2="42" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#6EE7B7" />
            <stop offset="60%" stopColor="#059669" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
          <linearGradient id="c3d-all-violet" x1="26" y1="26" x2="42" y2="42" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#C4B5FD" />
            <stop offset="60%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#5B21B6" />
          </linearGradient>
        </defs>
        {/* Top-left cube */}
        <rect x="7" y="8" width="15" height="15" rx="4.5" fill="rgba(15,23,42,0.14)" />
        <rect x="7" y="6" width="15" height="15" rx="4.5" fill="url(#c3d-all-orange)" />
        <path d="M10 8.5H19" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" />
        {/* Top-right cube */}
        <rect x="26" y="8" width="15" height="15" rx="4.5" fill="rgba(15,23,42,0.14)" />
        <rect x="26" y="6" width="15" height="15" rx="4.5" fill="url(#c3d-all-blue)" />
        <path d="M29 8.5H38" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" />
        {/* Bottom-left cube */}
        <rect x="7" y="27" width="15" height="15" rx="4.5" fill="rgba(15,23,42,0.14)" />
        <rect x="7" y="25" width="15" height="15" rx="4.5" fill="url(#c3d-all-emerald)" />
        <path d="M10 27.5H19" stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" strokeLinecap="round" />
        {/* Bottom-right cube */}
        <rect x="26" y="27" width="15" height="15" rx="4.5" fill="rgba(15,23,42,0.14)" />
        <rect x="26" y="25" width="15" height="15" rx="4.5" fill="url(#c3d-all-violet)" />
        <path d="M29 27.5H38" stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  // 2. Headphones & Audio (checked BEFORE phone so 'Headphones' never matches 'phone')
  if (k.includes('headphone') || k.includes('audio') || k.includes('sound')) {
    return (
      <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
        <defs>
          <linearGradient id="c3d-aud-band" x1="8" y1="6" x2="40" y2="26" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F1F5F9" />
            <stop offset="45%" stopColor="#64748B" />
            <stop offset="100%" stopColor="#1E293B" />
          </linearGradient>
          <linearGradient id="c3d-aud-cup" x1="7" y1="21" x2="17" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#C4B5FD" />
            <stop offset="50%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#4C1D95" />
          </linearGradient>
          <linearGradient id="c3d-aud-pad" x1="12" y1="22" x2="19" y2="39" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>
        </defs>
        {/* Outer padded headband arc */}
        <path d="M9.5 27.5V22C9.5 13.4 16 6.8 24 6.8C32 6.8 38.5 13.4 38.5 22V27.5" stroke="url(#c3d-aud-band)" strokeWidth="5" strokeLinecap="round" />
        {/* Top metallic sheen */}
        <path d="M14.5 9.8C17.2 7.8 20.5 6.8 24 6.8C27.5 6.8 30.8 7.8 33.5 9.8" stroke="rgba(255,255,255,0.85)" strokeWidth="1.6" strokeLinecap="round" />
        {/* Left ear cushion & 3D cup */}
        <rect x="13" y="23" width="5.5" height="16" rx="2.75" fill="url(#c3d-aud-pad)" />
        <rect x="6.5" y="21.5" width="8.5" height="18.5" rx="4.25" fill="url(#c3d-aud-cup)" />
        <rect x="8.8" y="24.5" width="2.2" height="12.5" rx="1.1" fill="rgba(255,255,255,0.48)" />
        {/* Right ear cushion & 3D cup */}
        <rect x="29.5" y="23" width="5.5" height="16" rx="2.75" fill="url(#c3d-aud-pad)" />
        <rect x="33" y="21.5" width="8.5" height="18.5" rx="4.25" fill="url(#c3d-aud-cup)" />
        <rect x="37" y="24.5" width="2.2" height="12.5" rx="1.1" fill="rgba(255,255,255,0.48)" />
      </svg>
    );
  }

  // 3. Smartphones & Mobiles
  if (k.includes('smartphone') || k.includes('mobile') || /\bphone\b/.test(k)) {
    return (
      <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
        <defs>
          <linearGradient id="c3d-phone-body" x1="13" y1="4" x2="35" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#64748B" />
            <stop offset="50%" stopColor="#334155" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>
          <linearGradient id="c3d-phone-screen" x1="16" y1="8" x2="32" y2="39" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="50%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#1E1B4B" />
          </linearGradient>
        </defs>
        <rect x="13.5" y="5" width="21" height="38" rx="5" fill="url(#c3d-phone-body)" />
        <rect x="14.2" y="5.7" width="19.6" height="36.6" rx="4.4" stroke="rgba(255,255,255,0.38)" strokeWidth="1" />
        <rect x="16" y="8" width="16" height="32" rx="3" fill="url(#c3d-phone-screen)" />
        {/* Glass reflection */}
        <path d="M16 11C16 9.34 17.34 8 19 8H28L16 28V11Z" fill="rgba(255,255,255,0.24)" />
        {/* Dynamic island + home indicator */}
        <rect x="20.5" y="9.5" width="7" height="2" rx="1" fill="#0F172A" />
        <rect x="20.5" y="37" width="7" height="1.3" rx="0.65" fill="rgba(255,255,255,0.75)" />
        {/* App icons dots */}
        <rect x="18.2" y="15" width="4.5" height="4.5" rx="1.2" fill="#FBBF24" />
        <rect x="25.2" y="15" width="4.5" height="4.5" rx="1.2" fill="#FB7185" />
        <rect x="18.2" y="21.5" width="4.5" height="4.5" rx="1.2" fill="#34D399" />
        <rect x="25.2" y="21.5" width="4.5" height="4.5" rx="1.2" fill="#A78BFA" />
      </svg>
    );
  }

  // 4. Laptops & Computers
  if (k.includes('laptop') || k.includes('computer') || k.includes('pc')) {
    return (
      <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
        <defs>
          <linearGradient id="c3d-lap-lid" x1="9" y1="8" x2="39" y2="30" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>
          <linearGradient id="c3d-lap-screen" x1="11" y1="10" x2="37" y2="28" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#818CF8" />
            <stop offset="55%" stopColor="#4F46E5" />
            <stop offset="100%" stopColor="#312E81" />
          </linearGradient>
          <linearGradient id="c3d-lap-base" x1="4" y1="30" x2="44" y2="38" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F8FAFC" />
            <stop offset="55%" stopColor="#CBD5E1" />
            <stop offset="100%" stopColor="#94A3B8" />
          </linearGradient>
        </defs>
        {/* Lid */}
        <rect x="9" y="8" width="30" height="22" rx="3" fill="url(#c3d-lap-lid)" />
        <rect x="11" y="10" width="26" height="18" rx="1.6" fill="url(#c3d-lap-screen)" />
        {/* Screen highlight sheen */}
        <path d="M11 10H26L14 28H11V10Z" fill="rgba(255,255,255,0.22)" />
        {/* Bottom metallic deck */}
        <path d="M6.5 30H41.5L44 36C44.3 36.8 43.7 37.6 42.8 37.6H5.2C4.3 37.6 3.7 36.8 4 36L6.5 30Z" fill="url(#c3d-lap-base)" />
        <rect x="4" y="36" width="40" height="2.4" rx="1.2" fill="#64748B" />
        {/* Keyboard & trackpad accent */}
        <rect x="11" y="31.4" width="26" height="2" rx="0.8" fill="#475569" opacity="0.6" />
        <rect x="20" y="34.2" width="8" height="1.4" rx="0.7" fill="#64748B" opacity="0.7" />
      </svg>
    );
  }

  // 5. Fashions
  if (k.includes('fashion') || k.includes('cloth') || k.includes('apparel')) {
    return (
      <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
        <defs>
          <linearGradient id="c3d-fash-shirt" x1="10" y1="8" x2="38" y2="41" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FB7185" />
            <stop offset="55%" stopColor="#E11D48" />
            <stop offset="100%" stopColor="#9F1239" />
          </linearGradient>
          <linearGradient id="c3d-fash-collar" x1="18" y1="7" x2="30" y2="14" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#881337" />
            <stop offset="100%" stopColor="#4C0519" />
          </linearGradient>
        </defs>
        <ellipse cx="24" cy="42.5" rx="13" ry="2.2" fill="rgba(15,23,42,0.14)" />
        {/* Shirt shadow edge */}
        <path d="M17.5 8.5L9 13.5L6.5 22L12.5 24.5L14 21V40.5C14 41.3 14.7 42 15.5 42H32.5C33.3 42 34 41.3 34 40.5V21L35.5 24.5L41.5 22L39 13.5L30.5 8.5H17.5Z" fill="#881337" />
        {/* Main sculpted shirt */}
        <path d="M17.5 7.5L9 12.5L6.5 21L12.5 23.5L14 19.5V39C14 39.8 14.7 40.5 15.5 40.5H32.5C33.3 40.5 34 39.8 34 39V19.5L35.5 23.5L41.5 21L39 12.5L30.5 7.5C29 10.5 26.8 12 24 12C21.2 12 19 10.5 17.5 7.5Z" fill="url(#c3d-fash-shirt)" />
        {/* Inner collar recess */}
        <path d="M17.8 7.5C19.2 10.5 21.4 12 24 12C26.6 12 28.8 10.5 30.2 7.5C28.3 8.8 26.2 9.4 24 9.4C21.8 9.4 19.7 8.8 17.8 7.5Z" fill="url(#c3d-fash-collar)" />
        {/* Specular fold & pocket */}
        <path d="M16 14.5C16.5 22 16 32 16 37" stroke="rgba(255,255,255,0.28)" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="26.5" y="18.5" width="4.5" height="5" rx="1" fill="rgba(255,255,255,0.22)" />
      </svg>
    );
  }

  // 6. Health & Beauty — 3D Luxury Serum Bottle
  if (k.includes('health') || k.includes('beauty') || k.includes('skin')) {
    return (
      <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
        <defs>
          <linearGradient id="c3d-bea-glass" x1="14" y1="18" x2="34" y2="42" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F9A8D4" />
            <stop offset="50%" stopColor="#EC4899" />
            <stop offset="100%" stopColor="#9D174D" />
          </linearGradient>
          <linearGradient id="c3d-bea-gold" x1="18" y1="12" x2="30" y2="18" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>
        </defs>
        <ellipse cx="24" cy="43" rx="11" ry="2.2" fill="rgba(15,23,42,0.15)" />
        {/* Dropper bulb */}
        <path d="M21 6.5C21 4.8 22.3 3.5 24 3.5C25.7 3.5 27 4.8 27 6.5V12H21V6.5Z" fill="#334155" />
        <path d="M22.5 5.5V10.5" stroke="rgba(255,255,255,0.45)" strokeWidth="1" strokeLinecap="round" />
        {/* Metallic collar */}
        <rect x="18" y="12" width="12" height="5.5" rx="1.8" fill="url(#c3d-bea-gold)" />
        {/* Bottle body */}
        <rect x="13" y="17.5" width="22" height="24" rx="6" fill="url(#c3d-bea-glass)" />
        {/* Glossy front highlight & label */}
        <rect x="16" y="20" width="3.5" height="18" rx="1.75" fill="rgba(255,255,255,0.35)" />
        <rect x="17" y="24" width="14" height="10" rx="2.5" fill="rgba(255,255,255,0.88)" />
        <path d="M20 27.8H28M21.5 30.8H26.5" stroke="#BE185D" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  // 7. Home & Lifestyle — 3D Sculpted Architectural Home
  if (k.includes('lifestyle') || k.includes('living') || k === 'home') {
    return (
      <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
        <defs>
          <linearGradient id="c3d-home-roof" x1="8" y1="7" x2="40" y2="24" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FDBA74" />
            <stop offset="55%" stopColor="#EA580C" />
            <stop offset="100%" stopColor="#9A3412" />
          </linearGradient>
          <linearGradient id="c3d-home-wall" x1="11" y1="20" x2="37" y2="41" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFBEB" />
            <stop offset="65%" stopColor="#FDE68A" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
        </defs>
        <ellipse cx="24" cy="42.5" rx="15" ry="2.2" fill="rgba(15,23,42,0.14)" />
        {/* Chimney */}
        <rect x="31" y="9" width="5" height="10" rx="1.2" fill="#B45309" />
        {/* House body */}
        <rect x="11" y="20" width="26" height="21" rx="3" fill="url(#c3d-home-wall)" />
        {/* Roof overhang shadow */}
        <path d="M11 22.5L24 12.5L37 22.5V25L24 15L11 25V22.5Z" fill="rgba(154,52,18,0.28)" />
        {/* Pitched roof */}
        <path d="M6.5 22L24 7.5L41.5 22C42.2 22.6 41.8 23.8 40.8 23.8H7.2C6.2 23.8 5.8 22.6 6.5 22Z" fill="url(#c3d-home-roof)" />
        {/* Door + Window */}
        <path d="M20.5 41V30.5C20.5 28.6 22.1 27 24 27C25.9 27 27.5 28.6 27.5 30.5V41H20.5Z" fill="#7C2D12" />
        <circle cx="25.8" cy="34.5" r="0.9" fill="#FDE68A" />
        <rect x="14" y="25" width="4.5" height="4.5" rx="1" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="1" />
        <rect x="29.5" y="25" width="4.5" height="4.5" rx="1" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="1" />
      </svg>
    );
  }

  // 8. Home Appliances — 3D Smart Refrigerator / Appliance
  if (k.includes('appliance') || k.includes('tv')) {
    return (
      <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
        <defs>
          <linearGradient id="c3d-app-body" x1="12" y1="6" x2="36" y2="42" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#99F6E4" />
            <stop offset="45%" stopColor="#14B8A6" />
            <stop offset="100%" stopColor="#0F766E" />
          </linearGradient>
          <linearGradient id="c3d-app-door" x1="14" y1="8" x2="34" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#CCFBF1" />
            <stop offset="55%" stopColor="#2DD4BF" />
            <stop offset="100%" stopColor="#0D9488" />
          </linearGradient>
        </defs>
        {/* Appliance metallic feet */}
        <rect x="14" y="40.5" width="4.5" height="2.8" rx="1.2" fill="#134E4A" />
        <rect x="29.5" y="40.5" width="4.5" height="2.8" rx="1.2" fill="#134E4A" />
        {/* 3D Side depth */}
        <rect x="12" y="6" width="24" height="35.5" rx="4.5" fill="url(#c3d-app-body)" />
        {/* Front sleek curved door face */}
        <rect x="13" y="6.8" width="20.5" height="33.8" rx="3.8" fill="url(#c3d-app-door)" />
        {/* Specular vertical sheen */}
        <rect x="14.8" y="9" width="3" height="29" rx="1.5" fill="rgba(255,255,255,0.45)" />
        {/* Freezer / Fridge split seam */}
        <rect x="13" y="20.5" width="20.5" height="1.6" fill="#0F766E" opacity="0.55" />
        {/* Chrome door handles */}
        <rect x="28.5" y="11" width="2.2" height="7" rx="1.1" fill="#FFFFFF" />
        <rect x="28.5" y="24.5" width="2.2" height="10" rx="1.1" fill="#FFFFFF" />
        {/* Smart temp LED display */}
        <rect x="19" y="11.5" width="6.5" height="4.5" rx="1.2" fill="#0F172A" />
        <circle cx="22.2" cy="13.7" r="1" fill="#5EEAD4" />
      </svg>
    );
  }

  // 9. Sports & Outdoors — 3D Chrome & Emerald Dumbbell
  if (k.includes('sport') || k.includes('outdoor') || k.includes('fitness')) {
    return (
      <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
        <defs>
          <linearGradient id="c3d-spt-plate" x1="6" y1="14" x2="18" y2="34" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="55%" stopColor="#059669" />
            <stop offset="100%" stopColor="#064E3B" />
          </linearGradient>
          <linearGradient id="c3d-spt-bar" x1="16" y1="21" x2="32" y2="27" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F8FAFC" />
            <stop offset="50%" stopColor="#94A3B8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>
        </defs>
        <ellipse cx="24" cy="40" rx="17" ry="2.4" fill="rgba(15,23,42,0.16)" />
        {/* Steel bar */}
        <rect x="5" y="21.5" width="38" height="5" rx="2.5" fill="url(#c3d-spt-bar)" />
        {/* Left outer & inner plates */}
        <rect x="7" y="16" width="4.5" height="16" rx="2.2" fill="#065F46" />
        <rect x="11" y="13" width="5.5" height="22" rx="2.6" fill="url(#c3d-spt-plate)" />
        <path d="M13 15.5V32.5" stroke="rgba(255,255,255,0.45)" strokeWidth="1.3" strokeLinecap="round" />
        {/* Right inner & outer plates */}
        <rect x="31.5" y="13" width="5.5" height="22" rx="2.6" fill="url(#c3d-spt-plate)" />
        <rect x="36.5" y="16" width="4.5" height="16" rx="2.2" fill="#065F46" />
        <path d="M33.5 15.5V32.5" stroke="rgba(255,255,255,0.45)" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    );
  }

  // 10. Groceries — 3D Basket + Crisp Apple
  if (k.includes('grocer') || k.includes('food') || k.includes('fresh')) {
    return (
      <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
        <defs>
          <linearGradient id="c3d-gro-apple" x1="13" y1="10" x2="27" y2="25" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FCA5A5" />
            <stop offset="45%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#991B1B" />
          </linearGradient>
          <linearGradient id="c3d-gro-basket" x1="8" y1="21" x2="40" y2="39" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#BEF264" />
            <stop offset="50%" stopColor="#65A30D" />
            <stop offset="100%" stopColor="#3F6212" />
          </linearGradient>
        </defs>
        <ellipse cx="24" cy="41.5" rx="15" ry="2.2" fill="rgba(15,23,42,0.15)" />
        {/* Fresh produce peeking out */}
        <circle cx="30" cy="18" r="6.5" fill="#F59E0B" />
        <circle cx="19" cy="18.5" r="7" fill="url(#c3d-gro-apple)" />
        <path d="M18.5 12C19.5 9.5 22 8.5 23.5 9.5C22.2 11.5 20.5 12.2 18.5 12Z" fill="#22C55E" />
        <circle cx="16.8" cy="16" r="1.5" fill="rgba(255,255,255,0.65)" />
        {/* Basket body */}
        <path d="M8.5 23H39.5L36.2 37.5C35.9 38.8 34.7 39.8 33.3 39.8H14.7C13.3 39.8 12.1 38.8 11.8 37.5L8.5 23Z" fill="url(#c3d-gro-basket)" />
        {/* Rim */}
        <rect x="6.5" y="20.5" width="35" height="4.2" rx="2.1" fill="#84CC16" />
        <path d="M9 21.8H39" stroke="rgba(255,255,255,0.55)" strokeWidth="1.2" strokeLinecap="round" />
        {/* Basket slots */}
        <path d="M16 28V35.5M24 28V35.5M32 28V35.5" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  // 11. Automotive — 3D Sculpted Car
  if (k.includes('auto') || k.includes('car') || k.includes('vehicle')) {
    return (
      <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
        <defs>
          <linearGradient id="c3d-car-body" x1="6" y1="14" x2="42" y2="35" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#60A5FA" />
            <stop offset="50%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#1E3A8A" />
          </linearGradient>
          <linearGradient id="c3d-car-glass" x1="14" y1="13" x2="34" y2="22" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#E0F2FE" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>
        </defs>
        <ellipse cx="24" cy="38.5" rx="18" ry="2.5" fill="rgba(15,23,42,0.18)" />
        {/* Cabin + body */}
        <path d="M12.5 22L16.5 13.5C17.2 12 18.7 11 20.4 11H29.6C31.3 11 32.8 12 33.5 13.5L37.5 22H12.5Z" fill="#1D4ED8" />
        <path d="M14.5 21.5L17.8 14.2C18.2 13.3 19.1 12.8 20.1 12.8H29.9C30.9 12.8 31.8 13.3 32.2 14.2L35.5 21.5H14.5Z" fill="url(#c3d-car-glass)" />
        <path d="M6 25C6 22.8 7.8 21 10 21H38C40.7 21 43 23.2 43 26V31.5C43 32.6 42.1 33.5 41 33.5H7C6.4 33.5 6 33.1 6 32.5V25Z" fill="url(#c3d-car-body)" />
        {/* Headlight & Taillight */}
        <rect x="38.5" y="24.5" width="4" height="2.6" rx="1.3" fill="#FEF08A" />
        <rect x="6.5" y="24.5" width="3" height="2.4" rx="1.2" fill="#FB7185" />
        {/* Specular highlight line */}
        <path d="M10 23.5H36" stroke="rgba(255,255,255,0.45)" strokeWidth="1.2" strokeLinecap="round" />
        {/* 3D Alloy Wheels */}
        <circle cx="14.5" cy="33.5" r="5" fill="#0F172A" />
        <circle cx="14.5" cy="33.5" r="2.4" fill="#CBD5E1" />
        <circle cx="34.5" cy="33.5" r="5" fill="#0F172A" />
        <circle cx="34.5" cy="33.5" r="2.4" fill="#CBD5E1" />
      </svg>
    );
  }

  // Fallback for dynamic admin-added categories — 3D Beveled Tag Cube
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="c3d-tag-main" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDBA74" />
          <stop offset="55%" stopColor="#F57224" />
          <stop offset="100%" stopColor="#C2410C" />
        </linearGradient>
      </defs>
      <ellipse cx="24" cy="42" rx="12" ry="2.2" fill="rgba(15,23,42,0.14)" />
      <path d="M9 12.5C9 10.6 10.6 9 12.5 9H23.2C24.2 9 25.1 9.4 25.8 10.1L38.2 22.5C39.7 24 39.7 26.5 38.2 28L28 38.2C26.5 39.7 24 39.7 22.5 38.2L10.1 25.8C9.4 25.1 9 24.2 9 23.2V12.5Z" fill="url(#c3d-tag-main)" />
      <circle cx="16.5" cy="16.5" r="2.5" fill="#FFFFFF" />
      <path d="M23 14.5L34.5 26" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
};
