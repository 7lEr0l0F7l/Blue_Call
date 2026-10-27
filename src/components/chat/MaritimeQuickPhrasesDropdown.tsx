import React, { useState, useRef, useEffect } from 'react';
import { Send, Check, X, Sparkles, MessageSquare } from 'lucide-react';
import { audioHelper } from '../../utils/audio';

export interface QuickPhraseItem {
  id: string;
  category: '위치' | '조업' | '투묘' | '항로' | '기상' | '통신' | '점검' | '인사';
  badgeColor: string;
  borderColor: string;
  icon: string;
  title: string;
  text: string;
  desc: string;
}

export const MARITIME_QUICK_PHRASES: QuickPhraseItem[] = [
  {
    id: 'gps',
    category: '위치',
    badgeColor: 'bg-cyan-950 text-cyan-300 border-cyan-800',
    borderColor: 'hover:border-cyan-500',
    icon: '📍',
    title: '본선 GPS 위치 전송',
    text: '📍 본선 GPS 위치 전송 (34.68N, 127.82E)',
    desc: '인근 선박에 본선의 현재 위경도 좌표를 공유합니다.'
  },
  {
    id: 'fishing',
    category: '조업',
    badgeColor: 'bg-amber-950 text-amber-300 border-amber-800',
    borderColor: 'hover:border-amber-500',
    icon: '⚠️',
    title: '통발·그물 양망 중 (우회 요청)',
    text: '⚠️ 통발·그물 양망 중 (0.5NM 우회 통항 요청)',
    desc: '어구 손상 방지 및 안전 이격을 위해 0.5마일 우회를 요청합니다.'
  },
  {
    id: 'anchor',
    category: '투묘',
    badgeColor: 'bg-blue-950 text-blue-300 border-blue-800',
    borderColor: 'hover:border-blue-500',
    icon: '⚓',
    title: '투묘 완료 (서행 요망)',
    text: '⚓ 투묘 완료 (주변 선박 서행 요망)',
    desc: '본선 닻 투묘 완료 상태로 주변 선박에 서행 통항을 안내합니다.'
  },
  {
    id: 'yield',
    category: '항로',
    badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-800',
    borderColor: 'hover:border-emerald-500',
    icon: '✅',
    title: '항로 양보 및 변침 안내',
    text: '✅ 변침하여 항로 양보하겠습니다',
    desc: '피항 동작을 취해 상대선에 항로를 우선 양보합니다.'
  },
  {
    id: 'weather',
    category: '기상',
    badgeColor: 'bg-sky-950 text-sky-300 border-sky-800',
    borderColor: 'hover:border-sky-500',
    icon: '🌊',
    title: '현 해역 기상 공유',
    text: '🌊 현 위치 파고 0.8m / 시정 5NM 양호',
    desc: '현재 해역의 파고, 시정 및 풍속 상태를 알립니다.'
  },
  {
    id: 'call',
    category: '통신',
    badgeColor: 'bg-purple-950 text-purple-300 border-purple-800',
    borderColor: 'hover:border-purple-500',
    icon: '📻',
    title: 'VHF Ch.16 / 050 안전 통화 요청',
    text: '📻 VHF Ch.16 / 050 안전 통화 요청',
    desc: '무전 채널 16번 또는 BlueCall 안심번호 직접 통화를 요청합니다.'
  },
  {
    id: 'engine',
    category: '점검',
    badgeColor: 'bg-rose-950 text-rose-300 border-rose-800',
    borderColor: 'hover:border-rose-500',
    icon: '🚨',
    title: '기관 점검 중 (서행 접근 요망)',
    text: '🚨 기관 점검 중 (서행 접근 요망)',
    desc: '본선 주기관 점검 중이므로 접근 시 서행을 요망합니다.'
  },
  {
    id: 'greetings',
    category: '인사',
    badgeColor: 'bg-teal-950 text-teal-300 border-teal-800',
    borderColor: 'hover:border-teal-500',
    icon: '🤝',
    title: '교신 양호 및 안전 항해 기원',
    text: '🤝 교신 양호합니다. 안전 항해하십시오!',
    desc: '상대선과의 교신을 확인하고 상호 안전 운항을 기원합니다.'
  }
];

interface MaritimeQuickPhrasesDropdownProps {
  onSelectPhrase: (phraseText: string, autoSend?: boolean) => void;
  dropDirection?: 'up' | 'down';
  className?: string;
  compact?: boolean;
}

export const MaritimeQuickPhrasesDropdown: React.FC<MaritimeQuickPhrasesDropdownProps> = ({
  onSelectPhrase,
  dropDirection = 'up',
  className = '',
  compact = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleDropdown = () => {
    audioHelper.playTap();
    setIsOpen(prev => !prev);
  };

  const handleSelect = (phraseText: string, autoSend: boolean = true) => {
    audioHelper.playTap();
    onSelectPhrase(phraseText, autoSend);
    setIsOpen(false);
  };

  const filteredPhrases = selectedFilter === 'ALL'
    ? MARITIME_QUICK_PHRASES
    : MARITIME_QUICK_PHRASES.filter(p => p.category === selectedFilter);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      
      {/* Trigger Bar with Triangle (▼ / ▲) Indicator */}
      <div className="bg-slate-950/95 border-t border-slate-800/90 px-3 py-1.5 flex items-center justify-between text-xs">
        
        {/* Triangle Button Trigger */}
        <button
          type="button"
          onClick={toggleDropdown}
          aria-expanded={isOpen}
          className={`flex items-center gap-2 px-3 py-1 rounded-xl text-xs font-bold transition-all border shadow-sm ${
            isOpen 
              ? 'bg-gradient-to-r from-cyan-950 to-blue-950 text-cyan-200 border-cyan-400 ring-2 ring-cyan-500/30' 
              : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border-slate-700/80'
          }`}
          title="간편 문구 상하 목록 열기/닫기"
        >
          <span className="flex items-center gap-1">
            <span className="text-cyan-400">⚡</span>
            <span>간편문구</span>
          </span>

          {/* Explicit Triangle Icon: True geometric triangle with rotation animation */}
          <div className="flex items-center justify-center pl-1 border-l border-slate-700/60">
            <svg 
              className={`w-3 h-3 text-cyan-400 transition-transform duration-200 ease-out ${
                isOpen ? 'rotate-180 text-cyan-300 scale-110' : 'rotate-0'
              }`} 
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              {/* Downward triangle path: (12, 18.5) bottom apex, (3.5, 6.5) top-left, (20.5, 6.5) top-right */}
              <path d="M12 18.5L3.5 6.5h17L12 18.5z" />
            </svg>
          </div>
        </button>

        {/* Status Hint */}
        <div className="flex items-center gap-2 text-[10px] text-slate-400">
          {isOpen ? (
            <span className="text-cyan-300 font-semibold animate-pulse">
              원하는 문구를 터치하면 즉시 전송됩니다
            </span>
          ) : (
            <span className="text-slate-400 flex items-center gap-1">
              <span>삼각형(</span>
              <span className="text-cyan-400 font-black">▼</span>
              <span>)을 누르면 상하 목록이 펼쳐집니다</span>
            </span>
          )}
        </div>
      </div>

      {/* Upward / Downward Popover Vertical List (상하 목록 출력 UI) */}
      {isOpen && (
        <div 
          className={`absolute left-2 right-2 z-40 bg-slate-950/98 backdrop-blur-lg border-2 border-cyan-500/70 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-cyan-400/20 ${
            dropDirection === 'up' 
              ? 'bottom-full mb-2 max-h-[340px]' 
              : 'top-full mt-2 max-h-[340px]'
          } flex flex-col`}
        >
          {/* Header */}
          <div className="px-3.5 py-2.5 bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              {/* Upward triangle in header */}
              <div className="w-6 h-6 rounded-lg bg-cyan-950 border border-cyan-700/80 flex items-center justify-center text-cyan-300">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 5.5l8.5 12H3.5L12 5.5z" />
                </svg>
              </div>
              <div>
                <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                  <span>해상 교신 간편 문구 선택</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-900/60 text-cyan-300 border border-cyan-700/50 font-mono">
                    {filteredPhrases.length}개
                  </span>
                </h4>
                <p className="text-[10px] text-slate-400">터치 시 상대 선박으로 즉시 무선 전송됩니다</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                audioHelper.playTap();
                setIsOpen(false);
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="닫기"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Category Filter Pills */}
          <div className="px-3 py-1.5 bg-slate-900/60 border-b border-slate-800/80 flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0 text-[10px]">
            {['ALL', '위치', '조업', '투묘', '항로', '기상', '통신', '점검', '인사'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  audioHelper.playTap();
                  setSelectedFilter(cat);
                }}
                className={`px-2 py-0.5 rounded-lg font-bold transition whitespace-nowrap ${
                  selectedFilter === cat
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {cat === 'ALL' ? '전체 보기' : cat}
              </button>
            ))}
          </div>

          {/* Vertical Scrollable List (상하 리스트) */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 divide-y divide-slate-800/40">
            {filteredPhrases.map((phrase) => (
              <div
                key={phrase.id}
                onClick={() => handleSelect(phrase.text, true)}
                className={`pt-1.5 first:pt-0 p-2.5 rounded-xl bg-slate-900/80 hover:bg-cyan-950/70 border border-slate-800/90 ${phrase.borderColor} transition-all cursor-pointer flex items-center justify-between gap-3 group active:scale-[0.99]`}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <span className="text-lg shrink-0 mt-0.5 select-none">{phrase.icon}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold border ${phrase.badgeColor}`}>
                        {phrase.category}
                      </span>
                      <span className="text-xs font-black text-slate-100 group-hover:text-cyan-300 transition truncate">
                        {phrase.title}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 group-hover:text-white leading-snug break-keep font-medium">
                      {phrase.text}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate hidden sm:block">
                      {phrase.desc}
                    </p>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(phrase.text, true);
                    }}
                    className="px-2.5 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl text-[11px] font-black flex items-center gap-1 shadow-md shadow-cyan-950 transition active:scale-95"
                    title="즉시 전송"
                  >
                    <span>전송</span>
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Footer note */}
          <div className="p-2 bg-slate-950/90 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 shrink-0">
            <span>💡 긴급 상황 시 VHF 무전 또는 050 안심통화를 병행하세요.</span>
            <button
              type="button"
              onClick={() => {
                audioHelper.playTap();
                setIsOpen(false);
              }}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            >
              닫기
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
