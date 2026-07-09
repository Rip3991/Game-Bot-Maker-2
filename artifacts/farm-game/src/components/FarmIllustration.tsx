import React from 'react';
import { motion } from 'framer-motion';

// ─── CSS animations injected once ────────────────────────────────────────────
const ANIM_STYLE = `
@keyframes farmBob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
@keyframes farmSway { 0%,100%{transform:rotate(-3deg)} 50%{transform:rotate(3deg)} }
@keyframes farmWiggle { 0%,100%{transform:rotate(-5deg) translateX(0)} 25%{transform:rotate(5deg) translateX(1px)} 75%{transform:rotate(-3deg) translateX(-1px)} }
@keyframes farmHover { 0%,100%{transform:translateY(0) rotate(-2deg)} 50%{transform:translateY(-5px) rotate(2deg)} }
@keyframes farmWingFlap { 0%,100%{transform:scaleX(1)} 50%{transform:scaleX(0.7)} }
@keyframes farmTailWag { 0%,100%{transform:rotate(-8deg)} 50%{transform:rotate(8deg)} }
@keyframes farmBreath { 0%,100%{transform:scaleY(1)} 50%{transform:scaleY(1.04)} }
@keyframes farmBloom { 0%,100%{transform:rotate(-2deg) scale(1)} 50%{transform:rotate(2deg) scale(1.03)} }
@keyframes farmGrass { 0%,100%{transform:rotate(-6deg) translateX(0)} 50%{transform:rotate(6deg) translateX(2px)} }
`;

let styleInjected = false;
function injectStyle() {
  if (styleInjected || typeof document === 'undefined') return;
  styleInjected = true;
  const el = document.createElement('style');
  el.textContent = ANIM_STYLE;
  document.head.appendChild(el);
}

// ─── SVG Animal Illustrations ────────────────────────────────────────────────

function ChickenSvg() {
  injectStyle();
  return (
    <svg viewBox="0 0 80 80" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      {/* body */}
      <ellipse cx="40" cy="52" rx="20" ry="16" fill="#d97706" style={{ animation:'farmBob 1.6s ease-in-out infinite' }}/>
      {/* wing */}
      <ellipse cx="28" cy="52" rx="9" ry="6" fill="#b45309" style={{ animation:'farmWingFlap 1.6s ease-in-out infinite', transformOrigin:'36px 52px' }}/>
      {/* neck */}
      <rect x="35" y="34" width="10" height="12" rx="5" fill="#d97706"/>
      {/* head */}
      <circle cx="40" cy="30" r="10" fill="#fbbf24"/>
      {/* comb */}
      <ellipse cx="38" cy="21" rx="3" ry="5" fill="#ef4444"/>
      <ellipse cx="42" cy="20" rx="3" ry="5" fill="#ef4444"/>
      <ellipse cx="40" cy="19" rx="2.5" ry="4.5" fill="#dc2626"/>
      {/* wattle */}
      <ellipse cx="37" cy="34" rx="3" ry="4" fill="#ef4444"/>
      {/* beak */}
      <polygon points="47,27 54,30 47,33" fill="#f59e0b"/>
      {/* eye */}
      <circle cx="44" cy="28" r="2.5" fill="#1c1917"/>
      <circle cx="44.8" cy="27.2" r="0.8" fill="white"/>
      {/* legs */}
      <line x1="36" y1="67" x2="33" y2="75" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round"/>
      <line x1="44" y1="67" x2="47" y2="75" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round"/>
      {/* toes */}
      <line x1="33" y1="75" x2="27" y2="73" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="33" y1="75" x2="33" y2="78" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="47" y1="75" x2="53" y2="73" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="47" y1="75" x2="47" y2="78" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round"/>
      {/* tail feathers */}
      <ellipse cx="20" cy="47" rx="5" ry="3" fill="#92400e" style={{ transform:'rotate(-30deg)', transformOrigin:'20px 47px' }}/>
    </svg>
  );
}

function CowSvg() {
  injectStyle();
  return (
    <svg viewBox="0 0 80 80" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      {/* body */}
      <ellipse cx="40" cy="50" rx="26" ry="18" fill="#f5f5f4" style={{ animation:'farmBreath 2.4s ease-in-out infinite' }}/>
      {/* spots */}
      <ellipse cx="32" cy="46" rx="8" ry="6" fill="#44403c" opacity="0.8"/>
      <ellipse cx="50" cy="55" rx="6" ry="5" fill="#44403c" opacity="0.7"/>
      {/* udder */}
      <ellipse cx="40" cy="67" rx="10" ry="5" fill="#fda4af"/>
      <circle cx="35" cy="71" r="2" fill="#fb7185"/>
      <circle cx="40" cy="71.5" r="2" fill="#fb7185"/>
      <circle cx="45" cy="71" r="2" fill="#fb7185"/>
      {/* neck */}
      <rect x="50" y="36" width="11" height="16" rx="5" fill="#e7e5e4"/>
      {/* head */}
      <ellipse cx="58" cy="30" rx="12" ry="10" fill="#e7e5e4"/>
      {/* snout */}
      <ellipse cx="64" cy="33" rx="7" ry="5" fill="#fda4af"/>
      <circle cx="62" cy="33" r="1.5" fill="#44403c"/>
      <circle cx="66" cy="33" r="1.5" fill="#44403c"/>
      {/* eyes */}
      <circle cx="55" cy="26" r="3" fill="#1c1917"/>
      <circle cx="55.8" cy="25.2" r="1" fill="white"/>
      {/* horns */}
      <path d="M52 21 Q47 14 44 17" stroke="#d4a017" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <path d="M60 20 Q63 13 66 16" stroke="#d4a017" strokeWidth="3" fill="none" strokeLinecap="round"/>
      {/* ears */}
      <ellipse cx="48" cy="23" rx="5" ry="7" fill="#e7e5e4" style={{ transform:'rotate(-20deg)', transformOrigin:'48px 23px' }}/>
      <ellipse cx="48" cy="23" rx="3" ry="5" fill="#fda4af" style={{ transform:'rotate(-20deg)', transformOrigin:'48px 23px' }}/>
      {/* legs */}
      <rect x="20" y="65" width="7" height="12" rx="3" fill="#d6d3d1"/>
      <rect x="30" y="65" width="7" height="12" rx="3" fill="#d6d3d1"/>
      <rect x="44" y="65" width="7" height="12" rx="3" fill="#d6d3d1"/>
      <rect x="54" y="65" width="7" height="12" rx="3" fill="#d6d3d1"/>
      {/* hooves */}
      <rect x="20" y="75" width="7" height="4" rx="2" fill="#44403c"/>
      <rect x="30" y="75" width="7" height="4" rx="2" fill="#44403c"/>
      <rect x="44" y="75" width="7" height="4" rx="2" fill="#44403c"/>
      <rect x="54" y="75" width="7" height="4" rx="2" fill="#44403c"/>
      {/* tail */}
      <path d="M14 48 Q8 42 10 36" stroke="#d6d3d1" strokeWidth="3" fill="none" strokeLinecap="round" style={{ animation:'farmTailWag 1.8s ease-in-out infinite', transformOrigin:'14px 48px' }}/>
      <circle cx="10" cy="34" r="4" fill="#78716c"/>
    </svg>
  );
}

function SheepSvg() {
  injectStyle();
  return (
    <svg viewBox="0 0 80 80" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      {/* wool body */}
      <circle cx="40" cy="50" r="20" fill="#f5f5f4" style={{ animation:'farmBob 2s ease-in-out infinite' }}/>
      {/* wool bumps */}
      <circle cx="24" cy="46" r="8" fill="#e7e5e4"/>
      <circle cx="32" cy="36" r="8" fill="#f5f5f4"/>
      <circle cx="44" cy="35" r="9" fill="#e7e5e4"/>
      <circle cx="56" cy="46" r="8" fill="#f5f5f4"/>
      <circle cx="50" cy="57" r="8" fill="#e7e5e4"/>
      <circle cx="30" cy="58" r="7" fill="#f5f5f4"/>
      {/* face */}
      <ellipse cx="40" cy="30" rx="11" ry="10" fill="#44403c"/>
      {/* snout */}
      <ellipse cx="40" cy="35" rx="7" ry="4.5" fill="#78716c"/>
      <circle cx="37.5" cy="35.5" r="1.5" fill="#1c1917"/>
      <circle cx="42.5" cy="35.5" r="1.5" fill="#1c1917"/>
      {/* eyes */}
      <ellipse cx="35" cy="27" rx="2.5" ry="3" fill="#ffd700"/>
      <ellipse cx="35" cy="27" rx="1" ry="3" fill="#1c1917"/>
      <ellipse cx="45" cy="27" rx="2.5" ry="3" fill="#ffd700"/>
      <ellipse cx="45" cy="27" rx="1" ry="3" fill="#1c1917"/>
      {/* ears */}
      <ellipse cx="29" cy="28" rx="5" ry="8" fill="#78716c" style={{ transform:'rotate(-20deg)', transformOrigin:'29px 28px', animation:'farmSway 2.5s ease-in-out infinite' }}/>
      <ellipse cx="51" cy="28" rx="5" ry="8" fill="#78716c" style={{ transform:'rotate(20deg)', transformOrigin:'51px 28px', animation:'farmSway 2.5s ease-in-out infinite 0.3s' }}/>
      {/* legs */}
      <rect x="27" y="68" width="6" height="11" rx="3" fill="#44403c"/>
      <rect x="36" y="69" width="6" height="10" rx="3" fill="#44403c"/>
      <rect x="45" y="69" width="6" height="10" rx="3" fill="#44403c"/>
      <rect x="52" y="68" width="6" height="11" rx="3" fill="#44403c"/>
      {/* hooves */}
      <rect x="27" y="77" width="6" height="3" rx="1.5" fill="#1c1917"/>
      <rect x="36" y="77" width="6" height="3" rx="1.5" fill="#1c1917"/>
      <rect x="45" y="77" width="6" height="3" rx="1.5" fill="#1c1917"/>
      <rect x="52" y="77" width="6" height="3" rx="1.5" fill="#1c1917"/>
    </svg>
  );
}

function PigSvg() {
  injectStyle();
  return (
    <svg viewBox="0 0 80 80" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      {/* body */}
      <ellipse cx="40" cy="52" rx="24" ry="20" fill="#fca5a5" style={{ animation:'farmBob 1.8s ease-in-out infinite' }}/>
      {/* spots */}
      <ellipse cx="30" cy="50" rx="7" ry="5" fill="#fbb5b5" opacity="0.6"/>
      {/* head */}
      <circle cx="40" cy="30" r="14" fill="#fca5a5"/>
      {/* snout */}
      <ellipse cx="40" cy="36" rx="9" ry="7" fill="#f87171"/>
      <circle cx="37" cy="36" r="2.5" fill="#44403c" opacity="0.6"/>
      <circle cx="43" cy="36" r="2.5" fill="#44403c" opacity="0.6"/>
      {/* eyes */}
      <circle cx="33" cy="26" r="3.5" fill="white"/>
      <circle cx="33" cy="26" r="2" fill="#1c1917"/>
      <circle cx="33.8" cy="25.2" r="0.8" fill="white"/>
      <circle cx="47" cy="26" r="3.5" fill="white"/>
      <circle cx="47" cy="26" r="2" fill="#1c1917"/>
      <circle cx="47.8" cy="25.2" r="0.8" fill="white"/>
      {/* ears */}
      <ellipse cx="28" cy="20" rx="7" ry="9" fill="#f87171" style={{ transform:'rotate(-15deg)', transformOrigin:'28px 20px', animation:'farmSway 2s ease-in-out infinite' }}/>
      <ellipse cx="52" cy="20" rx="7" ry="9" fill="#f87171" style={{ transform:'rotate(15deg)', transformOrigin:'52px 20px', animation:'farmSway 2s ease-in-out infinite 0.3s' }}/>
      {/* curly tail */}
      <path d="M16 50 Q10 44 14 38 Q18 32 14 28" stroke="#f87171" strokeWidth="3.5" fill="none" strokeLinecap="round" style={{ animation:'farmTailWag 1.5s ease-in-out infinite', transformOrigin:'16px 50px' }}/>
      {/* legs */}
      <rect x="21" y="68" width="8" height="10" rx="4" fill="#f87171"/>
      <rect x="32" y="69" width="8" height="9" rx="4" fill="#f87171"/>
      <rect x="42" y="69" width="8" height="9" rx="4" fill="#f87171"/>
      <rect x="53" y="68" width="8" height="10" rx="4" fill="#f87171"/>
    </svg>
  );
}

function HorseSvg() {
  injectStyle();
  return (
    <svg viewBox="0 0 80 80" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      {/* body */}
      <ellipse cx="38" cy="52" rx="26" ry="17" fill="#a16207" style={{ animation:'farmBob 1.4s ease-in-out infinite' }}/>
      {/* belly */}
      <ellipse cx="38" cy="56" rx="18" ry="10" fill="#ca8a04" opacity="0.5"/>
      {/* neck */}
      <path d="M56 46 Q62 38 60 28" stroke="#a16207" strokeWidth="12" fill="none" strokeLinecap="round"/>
      {/* head */}
      <ellipse cx="62" cy="24" rx="10" ry="13" fill="#a16207"/>
      {/* snout */}
      <ellipse cx="62" cy="32" rx="7" ry="5" fill="#ca8a04"/>
      <circle cx="60" cy="33" r="1.5" fill="#44403c"/>
      <circle cx="64" cy="33" r="1.5" fill="#44403c"/>
      {/* mane */}
      <path d="M58 14 Q50 20 52 30 Q54 38 56 44" stroke="#44403c" strokeWidth="8" fill="none" strokeLinecap="round" opacity="0.9"/>
      <path d="M60 13 Q53 18 55 28" stroke="#292524" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.7"/>
      {/* eyes */}
      <circle cx="57" cy="22" r="3" fill="#1c1917"/>
      <circle cx="57.8" cy="21.2" r="1" fill="white"/>
      {/* ear */}
      <ellipse cx="57" cy="14" rx="4" ry="6" fill="#a16207"/>
      <ellipse cx="57" cy="14" rx="2" ry="4" fill="#fda4af"/>
      {/* legs */}
      <rect x="17" y="66" width="7" height="13" rx="3" fill="#92400e"/>
      <rect x="28" y="67" width="7" height="12" rx="3" fill="#92400e"/>
      <rect x="42" y="67" width="7" height="12" rx="3" fill="#92400e"/>
      <rect x="54" y="66" width="7" height="13" rx="3" fill="#92400e"/>
      {/* hooves */}
      <rect x="17" y="77" width="7" height="4" rx="2" fill="#1c1917"/>
      <rect x="28" y="77" width="7" height="4" rx="2" fill="#1c1917"/>
      <rect x="42" y="77" width="7" height="4" rx="2" fill="#1c1917"/>
      <rect x="54" y="77" width="7" height="4" rx="2" fill="#1c1917"/>
      {/* tail */}
      <path d="M12 52 Q6 46 8 38 Q10 30 8 24" stroke="#44403c" strokeWidth="5" fill="none" strokeLinecap="round" style={{ animation:'farmTailWag 1.8s ease-in-out infinite', transformOrigin:'12px 52px' }}/>
    </svg>
  );
}

function RabbitSvg() {
  injectStyle();
  return (
    <svg viewBox="0 0 80 80" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      {/* body */}
      <ellipse cx="40" cy="58" rx="18" ry="16" fill="#f5f5f4" style={{ animation:'farmBob 1.2s ease-in-out infinite' }}/>
      {/* belly */}
      <ellipse cx="40" cy="60" rx="11" ry="10" fill="#fde68a" opacity="0.6"/>
      {/* tail */}
      <circle cx="22" cy="62" r="5" fill="white"/>
      {/* head */}
      <circle cx="40" cy="38" r="14" fill="#f5f5f4"/>
      {/* cheeks */}
      <circle cx="30" cy="43" r="5" fill="#fda4af" opacity="0.5"/>
      <circle cx="50" cy="43" r="5" fill="#fda4af" opacity="0.5"/>
      {/* nose */}
      <ellipse cx="40" cy="44" rx="3" ry="2" fill="#fda4af"/>
      {/* mouth */}
      <path d="M38 46 Q40 48 42 46" stroke="#d97706" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      {/* eyes */}
      <circle cx="34" cy="35" r="4" fill="#f43f5e"/>
      <circle cx="34" cy="35" r="2.5" fill="#1c1917"/>
      <circle cx="34.8" cy="34.2" r="1" fill="white"/>
      <circle cx="46" cy="35" r="4" fill="#f43f5e"/>
      <circle cx="46" cy="35" r="2.5" fill="#1c1917"/>
      <circle cx="46.8" cy="34.2" r="1" fill="white"/>
      {/* long ears */}
      <ellipse cx="33" cy="18" rx="5" ry="14" fill="#f5f5f4" style={{ animation:'farmSway 2s ease-in-out infinite', transformOrigin:'33px 28px' }}/>
      <ellipse cx="33" cy="18" rx="2.5" ry="11" fill="#fda4af"/>
      <ellipse cx="47" cy="18" rx="5" ry="14" fill="#f5f5f4" style={{ animation:'farmSway 2s ease-in-out infinite 0.4s', transformOrigin:'47px 28px' }}/>
      <ellipse cx="47" cy="18" rx="2.5" ry="11" fill="#fda4af"/>
      {/* legs */}
      <ellipse cx="30" cy="74" rx="9" ry="5" fill="#e7e5e4"/>
      <ellipse cx="50" cy="74" rx="9" ry="5" fill="#e7e5e4"/>
      <rect x="32" y="68" width="6" height="10" rx="3" fill="#f5f5f4"/>
      <rect x="44" y="68" width="6" height="10" rx="3" fill="#f5f5f4"/>
    </svg>
  );
}

function DuckSvg() {
  injectStyle();
  return (
    <svg viewBox="0 0 80 80" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      {/* water */}
      <ellipse cx="40" cy="73" rx="32" ry="6" fill="#0ea5e9" opacity="0.3"/>
      <path d="M10 71 Q20 68 30 71 Q40 74 50 71 Q60 68 70 71" stroke="#38bdf8" strokeWidth="2" fill="none" opacity="0.5"/>
      {/* body */}
      <ellipse cx="40" cy="58" rx="22" ry="14" fill="#fbbf24" style={{ animation:'farmBob 2s ease-in-out infinite' }}/>
      {/* wing */}
      <ellipse cx="32" cy="56" rx="12" ry="8" fill="#f59e0b" style={{ animation:'farmWingFlap 2s ease-in-out infinite', transformOrigin:'42px 56px' }}/>
      {/* wing detail */}
      <path d="M24 54 Q28 58 34 56" stroke="#d97706" strokeWidth="1.5" fill="none"/>
      {/* neck */}
      <rect x="36" y="40" width="10" height="16" rx="5" fill="#a3e635"/>
      {/* head */}
      <circle cx="41" cy="34" r="11" fill="#a3e635"/>
      {/* bill */}
      <polygon points="52,32 62,35 52,38" fill="#fb923c"/>
      {/* eye */}
      <circle cx="45" cy="31" r="3" fill="#1c1917"/>
      <circle cx="45.8" cy="30.2" r="1" fill="white"/>
      {/* head sheen */}
      <ellipse cx="38" cy="28" rx="5" ry="3" fill="#4ade80" opacity="0.4"/>
      {/* feet under water */}
      <rect x="30" y="70" width="6" height="8" rx="3" fill="#fb923c"/>
      <rect x="45" y="70" width="6" height="8" rx="3" fill="#fb923c"/>
    </svg>
  );
}

function GoatSvg() {
  injectStyle();
  return (
    <svg viewBox="0 0 80 80" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      {/* body */}
      <ellipse cx="40" cy="52" rx="24" ry="16" fill="#e7e5e4" style={{ animation:'farmBob 1.9s ease-in-out infinite' }}/>
      {/* spots */}
      <ellipse cx="34" cy="50" rx="8" ry="5" fill="#a8a29e" opacity="0.5"/>
      {/* head */}
      <ellipse cx="58" cy="32" rx="11" ry="10" fill="#e7e5e4"/>
      {/* snout */}
      <ellipse cx="64" cy="36" rx="6" ry="4.5" fill="#d6d3d1"/>
      <circle cx="62.5" cy="36.5" r="1.5" fill="#44403c"/>
      <circle cx="65.5" cy="36.5" r="1.5" fill="#44403c"/>
      {/* beard */}
      <path d="M60 42 Q62 50 60 56" stroke="#78716c" strokeWidth="4" fill="none" strokeLinecap="round"/>
      {/* eyes */}
      <ellipse cx="55" cy="28" rx="3" ry="2.5" fill="#ffd700"/>
      <ellipse cx="55" cy="28" rx="1" ry="2.5" fill="#1c1917"/>
      {/* ears */}
      <ellipse cx="48" cy="27" rx="4" ry="7" fill="#e7e5e4" style={{ transform:'rotate(-20deg)', transformOrigin:'48px 27px', animation:'farmSway 2.3s ease-in-out infinite' }}/>
      <ellipse cx="65" cy="25" rx="4" ry="6" fill="#e7e5e4" style={{ transform:'rotate(15deg)', transformOrigin:'65px 25px', animation:'farmSway 2.3s ease-in-out infinite 0.5s' }}/>
      {/* horns */}
      <path d="M52 22 Q48 14 50 10" stroke="#a16207" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <path d="M62 20 Q65 12 62 8" stroke="#a16207" strokeWidth="3" fill="none" strokeLinecap="round"/>
      {/* legs */}
      <rect x="19" y="65" width="7" height="12" rx="3" fill="#d6d3d1"/>
      <rect x="30" y="66" width="7" height="11" rx="3" fill="#d6d3d1"/>
      <rect x="44" y="66" width="7" height="11" rx="3" fill="#d6d3d1"/>
      <rect x="54" y="65" width="7" height="12" rx="3" fill="#d6d3d1"/>
      {/* hooves */}
      <rect x="19" y="75" width="7" height="4" rx="2" fill="#44403c"/>
      <rect x="30" y="75" width="7" height="4" rx="2" fill="#44403c"/>
      <rect x="44" y="75" width="7" height="4" rx="2" fill="#44403c"/>
      <rect x="54" y="75" width="7" height="4" rx="2" fill="#44403c"/>
      {/* tail */}
      <path d="M16 48 Q10 44 12 38" stroke="#d6d3d1" strokeWidth="3" fill="none" strokeLinecap="round" style={{ animation:'farmTailWag 2s ease-in-out infinite', transformOrigin:'16px 48px' }}/>
    </svg>
  );
}

function TurkeySvg() {
  injectStyle();
  return (
    <svg viewBox="0 0 80 80" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      {/* fan tail */}
      <ellipse cx="24" cy="46" rx="16" ry="22" fill="#dc2626" style={{ animation:'farmSway 2s ease-in-out infinite', transformOrigin:'40px 56px' }}/>
      <ellipse cx="26" cy="44" rx="12" ry="18" fill="#ea580c" style={{ animation:'farmSway 2s ease-in-out infinite 0.2s', transformOrigin:'40px 56px' }}/>
      <ellipse cx="28" cy="43" rx="9" ry="15" fill="#f59e0b" style={{ animation:'farmSway 2s ease-in-out infinite 0.1s', transformOrigin:'40px 56px' }}/>
      {/* body */}
      <ellipse cx="44" cy="54" rx="20" ry="16" fill="#92400e"/>
      {/* wing detail */}
      <ellipse cx="44" cy="54" rx="14" ry="11" fill="#a16207" opacity="0.6"/>
      {/* feather lines */}
      <path d="M30 54 Q44 48 58 54" stroke="#78350f" strokeWidth="1" fill="none" opacity="0.5"/>
      <path d="M30 58 Q44 52 58 58" stroke="#78350f" strokeWidth="1" fill="none" opacity="0.5"/>
      {/* neck */}
      <rect x="51" y="37" width="10" height="17" rx="5" fill="#78350f"/>
      {/* head */}
      <circle cx="56" cy="30" r="10" fill="#92400e"/>
      {/* wattle (red snood) */}
      <ellipse cx="63" cy="30" rx="4" ry="7" fill="#dc2626"/>
      {/* beak */}
      <polygon points="63,26 70,28 63,30" fill="#f59e0b"/>
      {/* eye */}
      <circle cx="53" cy="27" r="2.5" fill="#1c1917"/>
      <circle cx="53.8" cy="26.2" r="0.8" fill="white"/>
      {/* legs */}
      <line x1="42" y1="69" x2="38" y2="77" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round"/>
      <line x1="52" y1="69" x2="56" y2="77" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round"/>
      <line x1="38" y1="77" x2="32" y2="75" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round"/>
      <line x1="38" y1="77" x2="37" y2="80" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round"/>
      <line x1="56" y1="77" x2="62" y2="75" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round"/>
      <line x1="56" y1="77" x2="57" y2="80" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );
}

function BeeSvg() {
  injectStyle();
  return (
    <svg viewBox="0 0 80 80" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      {/* wings */}
      <ellipse cx="28" cy="34" rx="14" ry="8" fill="white" opacity="0.7" style={{ animation:'farmWingFlap 0.3s ease-in-out infinite', transformOrigin:'40px 38px' }}/>
      <ellipse cx="52" cy="34" rx="14" ry="8" fill="white" opacity="0.7" style={{ animation:'farmWingFlap 0.3s ease-in-out infinite 0.15s', transformOrigin:'40px 38px', transform:'scaleX(-1)' }}/>
      {/* wing veins */}
      <line x1="25" y1="32" x2="40" y2="36" stroke="#a3e635" strokeWidth="0.8" opacity="0.5"/>
      <line x1="55" y1="32" x2="40" y2="36" stroke="#a3e635" strokeWidth="0.8" opacity="0.5"/>
      {/* body */}
      <ellipse cx="40" cy="45" rx="15" ry="22" fill="#fbbf24" style={{ animation:'farmHover 1s ease-in-out infinite' }}/>
      {/* stripes */}
      <rect x="25" y="40" width="30" height="7" rx="3" fill="#1c1917" opacity="0.85"/>
      <rect x="25" y="52" width="30" height="7" rx="3" fill="#1c1917" opacity="0.85"/>
      <rect x="26" y="61" width="28" height="5" rx="2.5" fill="#1c1917" opacity="0.7"/>
      {/* stinger */}
      <polygon points="40,67 37,74 43,74" fill="#78350f"/>
      {/* head */}
      <circle cx="40" cy="25" r="12" fill="#fbbf24"/>
      {/* face */}
      <circle cx="35" cy="23" r="3" fill="#1c1917"/>
      <circle cx="35.8" cy="22.2" r="1" fill="white"/>
      <circle cx="45" cy="23" r="3" fill="#1c1917"/>
      <circle cx="45.8" cy="22.2" r="1" fill="white"/>
      {/* smile */}
      <path d="M35 30 Q40 34 45 30" stroke="#92400e" strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* antennae */}
      <line x1="36" y1="14" x2="30" y2="7" stroke="#44403c" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="30" cy="7" r="2.5" fill="#dc2626"/>
      <line x1="44" y1="14" x2="50" y2="7" stroke="#44403c" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="50" cy="7" r="2.5" fill="#dc2626"/>
    </svg>
  );
}

// ─── SVG Farm/Crop Illustrations ─────────────────────────────────────────────

function WheatSvg() {
  injectStyle();
  return (
    <svg viewBox="0 0 80 80" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      {/* soil line */}
      <ellipse cx="40" cy="75" rx="30" ry="5" fill="#7c5a2a" opacity="0.6"/>
      {/* stalks - 3 stalks */}
      {/* Left stalk */}
      <line x1="22" y1="75" x2="22" y2="28" stroke="#84cc16" strokeWidth="3" strokeLinecap="round" style={{ animation:'farmGrass 2.5s ease-in-out infinite 0.2s', transformOrigin:'22px 75px' }}/>
      <ellipse cx="22" cy="20" rx="5" ry="9" fill="#ca8a04" style={{ animation:'farmGrass 2.5s ease-in-out infinite 0.2s', transformOrigin:'22px 75px' }}/>
      <line x1="22" y1="42" x2="14" y2="32" stroke="#a3e635" strokeWidth="2" strokeLinecap="round"/>
      <line x1="22" y1="48" x2="30" y2="38" stroke="#a3e635" strokeWidth="2" strokeLinecap="round"/>
      {/* Center stalk (tallest) */}
      <line x1="40" y1="75" x2="40" y2="18" stroke="#65a30d" strokeWidth="3.5" strokeLinecap="round" style={{ animation:'farmGrass 2.8s ease-in-out infinite', transformOrigin:'40px 75px' }}/>
      <ellipse cx="40" cy="10" rx="6" ry="10" fill="#d97706" style={{ animation:'farmGrass 2.8s ease-in-out infinite', transformOrigin:'40px 75px' }}/>
      {/* wheat grain bumps */}
      <ellipse cx="37" cy="8" rx="4" ry="3" fill="#f59e0b"/>
      <ellipse cx="43" cy="9" rx="4" ry="3" fill="#f59e0b"/>
      <ellipse cx="40" cy="6" rx="3.5" ry="3" fill="#fbbf24"/>
      <ellipse cx="40" cy="12" rx="3.5" ry="3" fill="#f59e0b"/>
      <line x1="40" y1="35" x2="28" y2="25" stroke="#a3e635" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="40" y1="42" x2="52" y2="32" stroke="#a3e635" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Right stalk */}
      <line x1="58" y1="75" x2="58" y2="25" stroke="#84cc16" strokeWidth="3" strokeLinecap="round" style={{ animation:'farmGrass 2.5s ease-in-out infinite 0.4s', transformOrigin:'58px 75px' }}/>
      <ellipse cx="58" cy="17" rx="5" ry="9" fill="#ca8a04" style={{ animation:'farmGrass 2.5s ease-in-out infinite 0.4s', transformOrigin:'58px 75px' }}/>
      <line x1="58" y1="40" x2="66" y2="30" stroke="#a3e635" strokeWidth="2" strokeLinecap="round"/>
      <line x1="58" y1="46" x2="50" y2="36" stroke="#a3e635" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function CornSvg() {
  injectStyle();
  return (
    <svg viewBox="0 0 80 80" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      {/* soil */}
      <ellipse cx="40" cy="76" rx="28" ry="4" fill="#7c5a2a" opacity="0.6"/>
      {/* main stalk */}
      <line x1="40" y1="76" x2="40" y2="8" stroke="#65a30d" strokeWidth="5" strokeLinecap="round" style={{ animation:'farmGrass 3s ease-in-out infinite', transformOrigin:'40px 76px' }}/>
      {/* leaves */}
      <path d="M40 55 Q25 45 22 32" stroke="#84cc16" strokeWidth="4" fill="none" strokeLinecap="round" style={{ animation:'farmGrass 3s ease-in-out infinite 0.3s', transformOrigin:'40px 55px' }}/>
      <path d="M40 60 Q55 50 58 37" stroke="#84cc16" strokeWidth="4" fill="none" strokeLinecap="round" style={{ animation:'farmGrass 3s ease-in-out infinite 0.6s', transformOrigin:'40px 60px' }}/>
      <path d="M40 40 Q20 30 18 18" stroke="#a3e635" strokeWidth="3" fill="none" strokeLinecap="round"/>
      {/* corn cob body */}
      <rect x="32" y="28" width="16" height="30" rx="8" fill="#fbbf24"/>
      {/* husk leaves */}
      <path d="M32 56 Q22 62 24 72" stroke="#84cc16" strokeWidth="4" fill="none" strokeLinecap="round"/>
      <path d="M48 56 Q58 62 56 72" stroke="#84cc16" strokeWidth="4" fill="none" strokeLinecap="round"/>
      {/* kernel rows */}
      <line x1="36" y1="28" x2="36" y2="58" stroke="#d97706" strokeWidth="1.5" opacity="0.7"/>
      <line x1="40" y1="28" x2="40" y2="58" stroke="#d97706" strokeWidth="1.5" opacity="0.7"/>
      <line x1="44" y1="28" x2="44" y2="58" stroke="#d97706" strokeWidth="1.5" opacity="0.7"/>
      {/* kernel dots */}
      {[30,34,38,42,46,50,54].map((y, i) => (
        <React.Fragment key={i}>
          <circle cx="35" cy={y} r="2" fill="#f59e0b"/>
          <circle cx="40" cy={y+1} r="2" fill="#fbbf24"/>
          <circle cx="45" cy={y} r="2" fill="#f59e0b"/>
        </React.Fragment>
      ))}
      {/* silk */}
      <path d="M40 28 Q44 20 42 14" stroke="#f5f5f4" strokeWidth="1.5" fill="none" opacity="0.8"/>
      <path d="M40 28 Q38 19 36 13" stroke="#fde68a" strokeWidth="1.5" fill="none" opacity="0.8"/>
    </svg>
  );
}

function TomatoSvg() {
  injectStyle();
  return (
    <svg viewBox="0 0 80 80" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      {/* plant stem */}
      <line x1="40" y1="76" x2="40" y2="18" stroke="#65a30d" strokeWidth="3.5" strokeLinecap="round" style={{ animation:'farmGrass 2.5s ease-in-out infinite', transformOrigin:'40px 76px' }}/>
      {/* big leaves */}
      <path d="M40 50 Q22 42 20 28" stroke="#84cc16" strokeWidth="4" fill="none" strokeLinecap="round"/>
      <path d="M40 44 Q58 36 60 22" stroke="#84cc16" strokeWidth="4" fill="none" strokeLinecap="round"/>
      {/* tomato 1 (large, ripe) */}
      <circle cx="38" cy="52" r="16" fill="#ef4444" style={{ animation:'farmBob 2.2s ease-in-out infinite' }}/>
      <ellipse cx="38" cy="52" rx="16" ry="16" fill="#f87171" opacity="0.3"/>
      {/* highlight */}
      <circle cx="33" cy="46" r="5" fill="white" opacity="0.2"/>
      {/* tomato calyx */}
      <path d="M30 37 Q38 34 46 37 Q42 30 38 33 Q34 30 30 37Z" fill="#4ade80"/>
      <line x1="38" y1="35" x2="38" y2="30" stroke="#65a30d" strokeWidth="2"/>
      {/* tomato 2 (small, upper) */}
      <circle cx="56" cy="34" r="9" fill="#f97316" opacity="0.9"/>
      <path d="M52 26 Q56 24 60 26 Q58 22 56 24 Q54 22 52 26Z" fill="#4ade80"/>
      {/* tomato lines */}
      <path d="M28 52 Q38 56 48 52" stroke="#dc2626" strokeWidth="1" fill="none" opacity="0.5"/>
    </svg>
  );
}

function SunflowerSvg() {
  injectStyle();
  return (
    <svg viewBox="0 0 80 80" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      {/* stem */}
      <line x1="40" y1="76" x2="40" y2="26" stroke="#65a30d" strokeWidth="5" strokeLinecap="round" style={{ animation:'farmBloom 3s ease-in-out infinite', transformOrigin:'40px 76px' }}/>
      {/* stem leaves */}
      <path d="M40 55 Q26 48 24 36" stroke="#84cc16" strokeWidth="4" fill="none" strokeLinecap="round"/>
      <path d="M40 62 Q54 55 56 43" stroke="#84cc16" strokeWidth="4" fill="none" strokeLinecap="round"/>
      {/* outer petals */}
      {[0,45,90,135,180,225,270,315].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const cx = 40 + Math.cos(rad) * 14;
        const cy = 22 + Math.sin(rad) * 14;
        return <ellipse key={i} cx={cx} cy={cy} rx="6" ry="10" fill="#fbbf24"
          style={{ transform:`rotate(${angle}deg)`, transformOrigin:`${cx}px ${cy}px`,
                   animation:`farmBloom 3s ease-in-out infinite ${i*0.1}s` }}/>;
      })}
      {/* inner petals */}
      {[22.5,67.5,112.5,157.5,202.5,247.5,292.5,337.5].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const cx = 40 + Math.cos(rad) * 12;
        const cy = 22 + Math.sin(rad) * 12;
        return <ellipse key={i} cx={cx} cy={cy} rx="4" ry="8" fill="#f59e0b"
          style={{ transform:`rotate(${angle}deg)`, transformOrigin:`${cx}px ${cy}px` }}/>;
      })}
      {/* center disc */}
      <circle cx="40" cy="22" r="12" fill="#78350f"/>
      <circle cx="40" cy="22" r="9" fill="#451a00"/>
      {/* seed pattern */}
      {[0,60,120,180,240,300].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        return <circle key={i} cx={40 + Math.cos(rad)*5} cy={22 + Math.sin(rad)*5} r="1.5" fill="#92400e"/>;
      })}
      <circle cx="40" cy="22" r="2" fill="#92400e"/>
    </svg>
  );
}

// ─── Illustration map ─────────────────────────────────────────────────────────

const ILLUSTRATIONS: Record<string, () => React.ReactElement> = {
  chicken: ChickenSvg,
  cow: CowSvg,
  sheep: SheepSvg,
  pig: PigSvg,
  horse: HorseSvg,
  rabbit: RabbitSvg,
  duck: DuckSvg,
  goat: GoatSvg,
  turkey: TurkeySvg,
  bee: BeeSvg,
  wheat: WheatSvg,
  corn: CornSvg,
  tomato: TomatoSvg,
  sunflower: SunflowerSvg,
};

// ─── Public component ─────────────────────────────────────────────────────────

interface FarmIllustrationProps {
  id: string;
  count: number;
  size?: number;
  animate?: boolean;
}

export function FarmIllustration({ id, count, size = 64, animate = true }: FarmIllustrationProps) {
  const Svg = ILLUSTRATIONS[id];
  if (!Svg) return <span style={{ fontSize: size * 0.5 }}>?</span>;

  const show = Math.min(count, 5);
  if (show === 0) return null;

  // For counts 1–2: big, centered. 3–4: medium. 5+: small grid.
  const displaySize = show <= 2 ? size : show <= 4 ? size * 0.75 : size * 0.55;
  const extraCount = count - 5;

  return (
    <div className="flex flex-wrap items-center justify-center gap-1">
      {Array.from({ length: show }).map((_, i) => (
        <motion.div
          key={i}
          style={{ width: displaySize, height: displaySize }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: i * 0.06, type: 'spring', stiffness: 300, damping: 20 }}
        >
          <Svg />
        </motion.div>
      ))}
      {extraCount > 0 && (
        <span className="text-white/75 text-xs font-bold bg-black/50 px-2 py-0.5 rounded-lg">
          +{extraCount}
        </span>
      )}
    </div>
  );
}

export function FarmIllustrationBadge({ id, size = 32 }: { id: string; size?: number }) {
  const Svg = ILLUSTRATIONS[id];
  if (!Svg) return null;
  return (
    <div style={{ width: size, height: size }}>
      <Svg />
    </div>
  );
}
