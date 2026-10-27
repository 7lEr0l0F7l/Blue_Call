import React, { useState, useEffect, useRef } from 'react';
import { AgencyType } from '../types/maritimeAgencies';
import { Upload, Link2, RotateCcw, Check, Sparkles, Image as ImageIcon, X } from 'lucide-react';

export type AgencyLogoGroup = 'SUHYUP' | 'MOF' | 'KCG';

export function getAgencyLogoGroup(agencyType: AgencyType): AgencyLogoGroup {
  switch (agencyType) {
    case 'SAFETY_BUREAU':
      // 1. 어선안전조업국 -> 수협마크
      return 'SUHYUP';
    case 'MOF':
    case 'FISHERY_MGMT':
    case 'OCEANS_REGIONAL':
      // 2. 해양수산부, 어업관리단, 지방청 -> 해수부 마크
      return 'MOF';
    case 'VTS':
    case 'COAST_GUARD':
      // 3. vts, 해양경찰서 -> 해경마크
      return 'KCG';
    default:
      return 'MOF';
  }
}

export function getAgencyLogoLabel(agencyType: AgencyType): string {
  const group = getAgencyLogoGroup(agencyType);
  if (group === 'SUHYUP') return '어선안전조업국 (수협마크)';
  if (group === 'MOF') return '해양수산부·어업관리단·지방청 (해수부마크)';
  return 'VTS·해양경찰서 (해경마크)';
}

export const AGENCY_GROUP_INFO: Record<AgencyLogoGroup, {
  name: string;
  agencies: string;
  themeColor: string;
  defaultBadge: string;
  pinBg: string;
}> = {
  SUHYUP: {
    name: '어선안전조업국 (수협마크)',
    agencies: '전국 20개 어선안전조업국 (수협중앙회)',
    themeColor: '#00479d',
    defaultBadge: '수협',
    pinBg: '#00479d'
  },
  MOF: {
    name: '해양수산부·어업관리단·지방청 (해수부마크)',
    agencies: '해양수산부 본부(부산), 동·서·남해 어업관리단, 지방해양수산청 11개소',
    themeColor: '#004ea2',
    defaultBadge: '해수부',
    pinBg: '#004ea2'
  },
  KCG: {
    name: 'VTS·해양경찰서 (해경마크)',
    agencies: '전국 해상교통관제센터(VTS 20개소), 지방 해양경찰서 20개소',
    themeColor: '#0b2545',
    defaultBadge: '해경',
    pinBg: '#0b2545'
  }
};

/**
 * Custom Logo Manager with localStorage persistence and reactive subscriptions
 */
class CustomLogoManager {
  private listeners: Set<() => void> = new Set();
  private cache: Record<AgencyLogoGroup, string | null> = {
    SUHYUP: null,
    MOF: null,
    KCG: null
  };

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      this.cache.SUHYUP = localStorage.getItem('maritime_custom_logo_SUHYUP') || null;
      this.cache.MOF = localStorage.getItem('maritime_custom_logo_MOF') || null;
      this.cache.KCG = localStorage.getItem('maritime_custom_logo_KCG') || null;
    } catch {
      // ignore storage access issues
    }
  }

  getCustomLogo(group: AgencyLogoGroup): string | null {
    return this.cache[group];
  }

  setCustomLogo(group: AgencyLogoGroup, imageSrc: string) {
    this.cache[group] = imageSrc;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`maritime_custom_logo_${group}`, imageSrc);
      } catch (err) {
        console.warn('Failed to save logo to localStorage:', err);
      }
    }
    this.notify();
  }

  resetCustomLogo(group: AgencyLogoGroup) {
    this.cache[group] = null;
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(`maritime_custom_logo_${group}`);
      } catch {
        // ignore
      }
    }
    this.notify();
  }

  resetAll() {
    this.cache = { SUHYUP: null, MOF: null, KCG: null };
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('maritime_custom_logo_SUHYUP');
        localStorage.removeItem('maritime_custom_logo_MOF');
        localStorage.removeItem('maritime_custom_logo_KCG');
      } catch {
        // ignore
      }
    }
    this.notify();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }
}

export const customLogoManager = new CustomLogoManager();

/**
 * Hook to re-render component whenever custom logos change
 */
export function useCustomLogoVersion(): number {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    return customLogoManager.subscribe(() => {
      setVersion(v => v + 1);
    });
  }, []);
  return version;
}

/**
 * Escape XML special characters for SVG embedding
 */
function escapeXml(str: string): string {
  return str.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

/**
 * Returns standalone SVG string for Google Maps Marker Icon
 * Width: 46, Height: 52 (Pin shape with circular logo window & pinpoint tip)
 */
export interface AgencyStarCircleConfig {
  fullName: string;
  categoryLabel: string;
  bg: string;
  border: string;
  starColor: string;
  innerBorder?: string;
}

export function getAgencyStarCircleConfig(agencyType: AgencyType): AgencyStarCircleConfig {
  switch (agencyType) {
    case 'SAFETY_BUREAU':
      return {
        fullName: '어선안전조업국 (수협중앙회)',
        categoryLabel: '어선안전조업국',
        bg: '#00479d', // Suhyup Ocean Blue
        border: '#ffffff',
        starColor: '#ffffff',
        innerBorder: 'rgba(255, 255, 255, 0.4)'
      };
    case 'MOF':
      return {
        fullName: '해양수산부 (본부)',
        categoryLabel: '해양수산부',
        bg: '#004ea2', // Government Blue
        border: '#ffffff',
        starColor: '#ffffff',
        innerBorder: 'rgba(255, 255, 255, 0.4)'
      };
    case 'FISHERY_MGMT':
      return {
        fullName: '어업관리단 (동·서·남해)',
        categoryLabel: '어업관리단',
        bg: '#0284c7', // Sky Blue
        border: '#ffffff',
        starColor: '#ffffff',
        innerBorder: 'rgba(255, 255, 255, 0.4)'
      };
    case 'OCEANS_REGIONAL':
      return {
        fullName: '지방해양수산청',
        categoryLabel: '지방청',
        bg: '#7c3aed', // Purple
        border: '#ffffff',
        starColor: '#ffffff',
        innerBorder: 'rgba(255, 255, 255, 0.4)'
      };
    case 'COAST_GUARD':
      return {
        fullName: '지방 해양경찰서',
        categoryLabel: '해양경찰',
        bg: '#0b2545', // Coast Guard Navy
        border: '#f59e0b', // Gold Border
        starColor: '#f59e0b', // Gold Star
        innerBorder: 'rgba(245, 158, 11, 0.4)'
      };
    case 'VTS':
      return {
        fullName: '해상교통관제센터 (VTS)',
        categoryLabel: '해경VTS',
        bg: '#dc2626', // Navigation Warning Red
        border: '#ffffff',
        starColor: '#ffffff',
        innerBorder: 'rgba(255, 255, 255, 0.4)'
      };
    default:
      return {
        fullName: '해양 관공서',
        categoryLabel: '관공서',
        bg: '#1e3a8a',
        border: '#ffffff',
        starColor: '#ffffff'
      };
  }
}

/**
 * Calculates marker pixel size based on Google Maps zoom level
 * User requirement: "선박보다 작게 부탁해. 대신 확대를 하면 할 수록 커지는 형태로 하자"
 * - Normal / Overview (Zoom <= 8): 12~14px (noticeably smaller than vessel markers ~20-26px)
 * - Medium Zoom (9-11): 17~25px
 * - Close-up Zoom (12-14+): 29~38px
 */
export function getAgencyMarkerSizeByZoom(zoom: number): number {
  if (zoom <= 6) return 10;
  if (zoom === 7) return 12;
  if (zoom === 8) return 14; // Default coast map overview
  if (zoom === 9) return 17;
  if (zoom === 10) return 21;
  if (zoom === 11) return 25;
  if (zoom === 12) return 29;
  if (zoom === 13) return 33;
  return 38; // Zoom >= 14
}

/**
 * Returns standalone SVG string for Google Maps Marker Icon
 * Circle with Star inside, ZERO text/letters inside per user requirement.
 */
export function getAgencyMarkerSvg(agencyType: AgencyType, size: number = 14): string {
  const config = getAgencyStarCircleConfig(agencyType);

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 38 38">
  <defs>
    <filter id="shadow-circle-${agencyType}" x="-25%" y="-25%" width="150%" height="150%">
      <feDropShadow dx="0" dy="1.5" stdDeviation="2" flood-color="#000000" flood-opacity="0.6"/>
    </filter>
  </defs>
  <!-- 외곽 동그라미 본체 (Circle with Drop Shadow) -->
  <circle cx="19" cy="19" r="16.5" 
          fill="${config.bg}" 
          stroke="${config.border}" 
          stroke-width="2.5" 
          filter="url(#shadow-circle-${agencyType})"/>
  <!-- 내부 포인트 원형 테두리 -->
  <circle cx="19" cy="19" r="13.5" 
          fill="none" 
          stroke="${config.innerBorder || 'rgba(255,255,255,0.35)'}" 
          stroke-width="1"/>
  <!-- 중앙 별표 (Five-pointed Star with no text) -->
  <path d="M 19,8.2 L 22.2,15 L 29.5,15.8 L 24.2,21 L 25.5,28.2 L 19,24.6 L 12.5,28.2 L 13.8,21 L 8.5,15.8 L 15.8,15 Z" 
        fill="${config.starColor}" 
        stroke="${config.border === '#f59e0b' ? '#d97706' : 'rgba(0,0,0,0.15)'}" 
        stroke-width="0.5"/>
</svg>
`.trim();
}

/**
 * Returns Google Maps data URI icon object for google.maps.Marker
 * Supports dynamic zoom level (User Requirement: 선박보다 작고, 확대할수록 커지는 크기)
 */
export function getAgencyMarkerIconConfig(googleObj: typeof google, agencyType: AgencyType, zoomOrPixelSize: number = 8) {
  const pixelSize = zoomOrPixelSize > 25 ? zoomOrPixelSize : getAgencyMarkerSizeByZoom(zoomOrPixelSize);
  const svg = getAgencyMarkerSvg(agencyType, pixelSize);
  const dataUri = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);

  return {
    url: dataUri,
    scaledSize: new googleObj.maps.Size(pixelSize, pixelSize),
    anchor: new googleObj.maps.Point(pixelSize / 2, pixelSize / 2)
  };
}

/**
 * React Component for rendering the circular star badge in UI cards, headers, and pills.
 * (User Requirement: 동그라미에 별표가 들어간 형태, 글자 삽입 없음)
 */
export const AgencyLogoEmblem: React.FC<{ 
  agencyType: AgencyType; 
  size?: number; 
  className?: string;
}> = ({ agencyType, size = 32, className = '' }) => {
  const config = getAgencyStarCircleConfig(agencyType);
  const starViewSize = Math.round(size * 0.85);

  return (
    <div 
      className={`rounded-full flex items-center justify-center shadow-md select-none shrink-0 ${className}`}
      style={{ 
        width: size, 
        height: size, 
        backgroundColor: config.bg,
        border: `2px solid ${config.border}`,
        color: config.starColor
      }}
      title={`${config.fullName} (동그라미 별표 관공서 마커)`}
    >
      <svg 
        viewBox="0 0 38 38" 
        width={starViewSize} 
        height={starViewSize} 
        className="pointer-events-none"
      >
        <circle cx="19" cy="19" r="14.5" fill="none" stroke={config.innerBorder || 'rgba(255,255,255,0.3)'} strokeWidth="1" />
        <path 
          d="M 19,8.2 L 22.2,15 L 29.5,15.8 L 24.2,21 L 25.5,28.2 L 19,24.6 L 12.5,28.2 L 13.8,21 L 8.5,15.8 L 15.8,15 Z" 
          fill={config.starColor}
        />
      </svg>
    </div>
  );
};

/**
 * Interactive Modal for the user to customize & enter logo images for the 3 official agency groups:
 * 1. 어선안전조업국 (수협)
 * 2. 해양수산부, 어업관리단, 지방청 (해수부)
 * 3. VTS, 해양경찰서 (해경)
 */
export const AgencyLogoSettingsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  initialGroup?: AgencyLogoGroup;
}> = ({ isOpen, onClose, initialGroup = 'MOF' }) => {
  const [activeGroup, setActiveGroup] = useState<AgencyLogoGroup>(initialGroup);
  const [urlInput, setUrlInput] = useState('');
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync active group when initialGroup changes
  useEffect(() => {
    setActiveGroup(initialGroup);
  }, [initialGroup]);

  // Load existing custom logo when changing group
  useEffect(() => {
    const existing = customLogoManager.getCustomLogo(activeGroup);
    setPreviewSrc(existing);
    setUrlInput(existing && existing.startsWith('http') ? existing : '');
  }, [activeGroup]);

  // Global clipboard paste listener for images when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = () => {
              setPreviewSrc(reader.result as string);
              showToast('클립보드 이미지가 성공적으로 붙여넣어졌습니다! [로고 적용 및 저장]을 눌러주세요.');
            };
            reader.readAsDataURL(file);
            return;
          }
        }
      }

      // Check for pasted URL string
      const pastedText = e.clipboardData?.getData('text');
      if (pastedText && (pastedText.startsWith('http://') || pastedText.startsWith('https://') || pastedText.startsWith('data:image/'))) {
        setUrlInput(pastedText.trim());
        setPreviewSrc(pastedText.trim());
        showToast('클립보드 이미지 웹 주소를 불러왔습니다.');
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen, activeGroup]);

  if (!isOpen) return null;

  const currentInfo = AGENCY_GROUP_INFO[activeGroup];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('이미지 파일(PNG, JPG, SVG, WebP 등)만 선택 가능합니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPreviewSrc(result);
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) return;
    setPreviewSrc(urlInput.trim());
  };

  const handleSave = () => {
    if (previewSrc) {
      customLogoManager.setCustomLogo(activeGroup, previewSrc);
      showToast(`${currentInfo.name}에 사용자 입력 이미지가 설정되었습니다.`);
    } else {
      customLogoManager.resetCustomLogo(activeGroup);
      showToast(`${currentInfo.name}가 기본 공식 마크로 초기화되었습니다.`);
    }
  };

  const handleResetCurrent = () => {
    customLogoManager.resetCustomLogo(activeGroup);
    setPreviewSrc(null);
    setUrlInput('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    showToast(`${currentInfo.name} 로고가 기본 공식 엠블럼으로 초기화되었습니다.`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border-2 border-cyan-500/60 rounded-2xl shadow-2xl shadow-cyan-950/80 overflow-hidden flex flex-col text-white">
        
        {/* Header */}
        <div className="px-4 py-3 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-600/30 border border-cyan-400/50 flex items-center justify-center text-cyan-300">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                <span>관공서 로고 이미지 사용자 직접 설정</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">USER LOGO</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                원하는 로고 이미지(파일 업로드 또는 URL)를 입력하면 지도 핀과 UI에 실시간 적용됩니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Group Selector Tabs */}
        <div className="grid grid-cols-3 p-2 gap-1.5 bg-slate-950/60 border-b border-slate-800">
          {(['MOF', 'SUHYUP', 'KCG'] as AgencyLogoGroup[]).map((grp) => {
            const isSel = activeGroup === grp;
            const hasCustom = Boolean(customLogoManager.getCustomLogo(grp));
            const info = AGENCY_GROUP_INFO[grp];

            return (
              <button
                key={grp}
                onClick={() => setActiveGroup(grp)}
                className={`py-2 px-1.5 rounded-xl text-center text-xs font-bold transition flex flex-col items-center gap-1 border ${
                  isSel
                    ? 'bg-slate-800 border-cyan-400 text-white shadow-md ring-1 ring-cyan-500/40'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <div className="relative">
                  <AgencyLogoEmblem 
                    agencyType={grp === 'MOF' ? 'MOF' : grp === 'SUHYUP' ? 'SAFETY_BUREAU' : 'COAST_GUARD'} 
                    size={28} 
                  />
                  {hasCustom && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900" title="사용자 지정 이미지 적용 중" />
                  )}
                </div>
                <span className="text-[11px] truncate w-full text-center">
                  {grp === 'MOF' ? '해양수산부' : grp === 'SUHYUP' ? '수협(조업국)' : '해양경찰·VTS'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Target Group Info Banner */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-black text-cyan-300">{currentInfo.name}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{currentInfo.agencies}</div>
            </div>
            <div className="text-right">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                previewSrc 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}>
                {previewSrc ? '사용자 지정 이미지' : '기본 공식 엠블럼'}
              </span>
            </div>
          </div>

          {/* User Image Attachment Notification / Tip */}
          <div className="p-3 rounded-xl bg-cyan-950/60 border border-cyan-700/60 text-xs text-cyan-200 flex items-start gap-2.5 shadow-lg">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-white text-[11px]">
                첨부하셨던 로고 이미지를 바로 반영하세요!
              </div>
              <div className="text-[10px] text-cyan-300 leading-relaxed">
                채팅에 첨부하셨던 로고 이미지 파일을 아래 <strong>[이미지 파일 찾기 및 선택]</strong>으로 등록하시거나, 이미지를 복사하신 후 이 창에서 <strong>Ctrl+V (붙여넣기)</strong> 하시면 즉시 100% 동일한 이미지가 지도 핀과 관공서 정보창에 반영됩니다.
              </div>
            </div>
          </div>

          {/* Live Preview Display (Pin & Emblem) */}
          <div 
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files?.[0];
              if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = () => {
                  setPreviewSrc(reader.result as string);
                  showToast('드래그한 이미지를 성공적으로 불러왔습니다!');
                };
                reader.readAsDataURL(file);
              }
            }}
            className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center justify-around hover:border-cyan-500/50 transition cursor-pointer"
            title="이미지를 이 영역으로 드래그 앤 드롭해도 등록됩니다."
          >
            <div className="flex flex-col items-center gap-1.5">
              <div className="text-[10px] font-bold text-slate-400">지도 핀 프리뷰</div>
              <div className="relative w-12 h-14 flex items-center justify-center">
                {/* Simulated Pin */}
                <div className="relative flex flex-col items-center">
                  <div 
                    className="w-10 h-10 rounded-full border-2 border-white shadow-xl flex items-center justify-center overflow-hidden bg-white"
                    style={{ backgroundColor: currentInfo.themeColor }}
                  >
                    {previewSrc ? (
                      <img src={previewSrc} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <AgencyLogoEmblem 
                        agencyType={activeGroup === 'MOF' ? 'MOF' : activeGroup === 'SUHYUP' ? 'SAFETY_BUREAU' : 'COAST_GUARD'} 
                        size={36} 
                      />
                    )}
                  </div>
                  {/* Pin Point */}
                  <div 
                    className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] -mt-1"
                    style={{ borderTopColor: currentInfo.themeColor }}
                  />
                  <div 
                    className="text-[8px] font-black px-1.5 py-0.2 rounded text-white shadow mt-0.5"
                    style={{ backgroundColor: currentInfo.themeColor }}
                  >
                    {currentInfo.defaultBadge}
                  </div>
                </div>
              </div>
            </div>

            <div className="h-14 w-px bg-slate-800" />

            <div className="flex flex-col items-center gap-1.5">
              <div className="text-[10px] font-bold text-slate-400">상세창 원형 엠블럼 프리뷰</div>
              <div className="w-12 h-12 rounded-full bg-white p-0.5 border-2 border-cyan-400 shadow-xl overflow-hidden flex items-center justify-center">
                {previewSrc ? (
                  <img src={previewSrc} alt="Emblem Preview" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <AgencyLogoEmblem 
                    agencyType={activeGroup === 'MOF' ? 'MOF' : activeGroup === 'SUHYUP' ? 'SAFETY_BUREAU' : 'COAST_GUARD'} 
                    size={44} 
                  />
                )}
              </div>
            </div>
          </div>

          {/* Method 1: Local File Upload */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>방법 1: 내 컴퓨터에서 로고 이미지 파일 선택 (JPG, PNG, WebP, SVG)</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="agency-logo-file-input"
              />
              <label
                htmlFor="agency-logo-file-input"
                className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 cursor-pointer flex items-center justify-center gap-2 transition"
              >
                <Upload className="w-4 h-4 text-cyan-400" />
                <span>이미지 파일 찾기 및 선택</span>
              </label>
              {previewSrc && (
                <button
                  onClick={() => {
                    setPreviewSrc(null);
                    setUrlInput('');
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl border border-slate-700 text-xs"
                  title="선택 해제"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Method 2: Image URL direct input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>방법 2: 로고 이미지 웹 링크 (URL) 직접 입력</span>
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="url"
                placeholder="https://example.com/logo.png (이미지 직접 주소)"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 font-mono focus:outline-none"
              />
              <button
                type="button"
                onClick={handleApplyUrl}
                className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl transition"
              >
                미리보기
              </button>
            </div>
          </div>

          {/* Method 3: Official Preset Templates (One-Click Selection) */}
          <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
            <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>추천 공식 고화질 엠블럼 샘플</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => {
                  if (activeGroup === 'MOF') {
                    setPreviewSrc('https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Emblem_of_the_Government_of_the_Republic_of_Korea.svg/300px-Emblem_of_the_Government_of_the_Republic_of_Korea.svg.png');
                  } else if (activeGroup === 'SUHYUP') {
                    setPreviewSrc('https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/National_Federation_of_Fisheries_Cooperatives_Logo.svg/320px-National_Federation_of_Fisheries_Cooperatives_Logo.svg.png');
                  } else {
                    setPreviewSrc('https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Emblem_of_Korea_Coast_Guard.svg/300px-Emblem_of_Korea_Coast_Guard.svg.png');
                  }
                }}
                className="p-2 rounded-xl bg-slate-800/70 hover:bg-slate-700/80 border border-slate-700 text-left text-slate-200 transition"
              >
                <div className="font-bold text-cyan-300">정부·기관 공식 CI 마크</div>
                <div className="text-[9px] text-slate-400">고해상도 공공 CI 심볼 로드</div>
              </button>

              <button
                type="button"
                onClick={handleResetCurrent}
                className="p-2 rounded-xl bg-slate-800/70 hover:bg-slate-700/80 border border-slate-700 text-left text-slate-200 transition"
              >
                <div className="font-bold text-slate-300">기본 벡터 그래픽 복원</div>
                <div className="text-[9px] text-slate-400">내장 고대비 SVG 엠블럼 사용</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-2">
          <button
            onClick={handleResetCurrent}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>기본 로고 복원</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
            >
              닫기
            </button>
            <button
              onClick={() => {
                handleSave();
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-900/50 flex items-center gap-1.5 transition"
            >
              <Check className="w-4 h-4" />
              <span>로고 적용 및 저장</span>
            </button>
          </div>
        </div>

        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-2xl flex items-center gap-1.5 border border-emerald-400 animate-bounce">
            <Check className="w-3.5 h-3.5" />
            <span>{toastMessage}</span>
          </div>
        )}

      </div>
    </div>
  );
};
