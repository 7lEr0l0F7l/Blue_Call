import React, { useState } from 'react';
import { 
  Mic, 
  Clock, 
  Copy, 
  Check, 
  Laptop, 
  Smartphone, 
  HelpCircle, 
  ExternalLink, 
  Sparkles, 
  AlertTriangle,
  PlayCircle,
  FileText,
  ChevronRight
} from 'lucide-react';
import { PRESENTATION_SCRIPT, PRESENTATION_TIPS } from '../../data/presentationScript';
import { audioHelper } from '../../utils/audio';

interface PresentationScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  liveUrl: string;
}

type ModalTab = 'SCRIPT' | 'TIPS' | 'INSTALL';

export const PresentationScriptModal: React.FC<PresentationScriptModalProps> = ({
  isOpen,
  onClose,
  liveUrl
}) => {
  const [activeTab, setActiveTab] = useState<ModalTab>('SCRIPT');
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [expandedSection, setExpandedSection] = useState<number | null>(null);

  if (!isOpen) return null;

  // Generate full text script for 1-click clipboard copy
  const getFullScriptText = () => {
    let text = `[BlueCall - AI기반 해양 행정·현장소통플랫폼 5분 시연 발표 대본]\n\n`;
    text += `발표 시연 URL: ${liveUrl}\n`;
    text += `총 소요 시간: 약 4분 40초 ~ 5분\n`;
    text += `--------------------------------------------------------\n\n`;

    PRESENTATION_SCRIPT.forEach((sec, idx) => {
      text += `[${sec.time}] ${sec.title} (${sec.duration})\n`;
      text += `■ 화면 조작: ${sec.screenAction}\n`;
      text += `■ 발표 낭독 대본:\n"${sec.spokenScript}"\n`;
      text += `■ 핵심 포인트: ${sec.keyPoints.join(' / ')}\n\n`;
    });

    return text;
  };

  const handleCopyFullScript = () => {
    audioHelper.playTap();
    navigator.clipboard.writeText(getFullScriptText()).catch(() => {});
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handleCopyUrl = () => {
    audioHelper.playTap();
    navigator.clipboard.writeText(liveUrl).catch(() => {});
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-950 font-black text-sm">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-base">BlueCall 5분 시연 발표 대본 & 가이드</h3>
                <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800 px-2 py-0.5 rounded font-bold">
                  총 4분 45초 권장
                </span>
              </div>
              <p className="text-xs text-slate-400">화면 조작 액션과 발표 대본이 1:1 매칭된 실전용 시나리오</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 pt-3 pb-2 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => {
                audioHelper.playTap();
                setActiveTab('SCRIPT');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
                activeTab === 'SCRIPT'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>🎤 5분 실전 대본</span>
            </button>

            <button
              onClick={() => {
                audioHelper.playTap();
                setActiveTab('TIPS');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
                activeTab === 'TIPS'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>💡 시연 팁 & 예상 Q&A</span>
            </button>

            <button
              onClick={() => {
                audioHelper.playTap();
                setActiveTab('INSTALL');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
                activeTab === 'INSTALL'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>📱 스마트폰 APK·웹 가이드</span>
            </button>
          </div>

          {activeTab === 'SCRIPT' && (
            <button
              onClick={handleCopyFullScript}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold transition shadow"
            >
              {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedScript ? '대본 전체 복사됨!' : '대본 전체 복사'}</span>
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {/* TAB 1: 5-minute Script */}
          {activeTab === 'SCRIPT' && (
            <div className="space-y-4">
              
              {/* Top Banner Alert */}
              <div className="p-3.5 bg-gradient-to-r from-blue-950/80 to-slate-900 border border-blue-800/60 rounded-2xl flex items-start gap-3">
                <PlayCircle className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-white flex items-center gap-2">
                    <span>5분 시연 발표 황금 타임테이블 (4분 40초 낭독 + 20초 여유)</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    상단 12시 스위처의 <strong>[📱 어선 앱]</strong>과 <strong>[💻 노트북 웹 관제센터]</strong>를 교차로 보여주면서 청중의 시선을 사로잡는 구성입니다. 각 단계별 <strong>[화면 조작]</strong>에 맞춰 자연스럽게 낭독해 주세요.
                  </p>
                </div>
              </div>

              {/* Script Sections Timeline */}
              <div className="space-y-3.5">
                {PRESENTATION_SCRIPT.map((sec, idx) => (
                  <div 
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition space-y-2.5 shadow-md"
                  >
                    {/* Header info */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/70">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-blue-600/30 text-cyan-300 font-black text-xs flex items-center justify-center border border-blue-500/40">
                          {idx + 1}
                        </span>
                        <h4 className="font-extrabold text-sm text-white">{sec.title}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/50 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {sec.time} ({sec.duration})
                        </span>
                      </div>
                    </div>

                    {/* Screen Action Directive */}
                    <div className="p-2.5 bg-amber-950/30 border border-amber-600/40 rounded-xl text-xs text-amber-200/90 flex items-start gap-2">
                      <span className="font-black text-amber-400 shrink-0">👉 화면 조작:</span>
                      <span className="font-medium">{sec.screenAction}</span>
                    </div>

                    {/* Spoken Script */}
                    <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-xs sm:text-[13px] text-slate-200 leading-relaxed font-sans whitespace-pre-line border-l-4 border-l-cyan-500">
                      {sec.spokenScript}
                    </div>

                    {/* Key points tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {sec.keyPoints.map((kp, kIdx) => (
                        <span 
                          key={kIdx}
                          className="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded-full border border-slate-800"
                        >
                          ✓ {kp}
                        </span>
                      ))}
                    </div>

                  </div>
                ))}
              </div>

            </div>
          )}

          {/* TAB 2: Tips & Q&A */}
          {activeTab === 'TIPS' && (
            <div className="space-y-4">
              
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="font-extrabold text-white text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  심사위원 평가 점수를 극대화하는 3대 연출 팁
                </h4>
                
                <div className="space-y-2.5">
                  {PRESENTATION_TIPS.map((tip, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
                      <div className="font-bold text-cyan-300">
                        {idx + 1}. {tip.title}
                      </div>
                      <p className="text-slate-300 leading-relaxed">
                        {tip.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Predicted Q&A */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="font-extrabold text-white text-sm flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-emerald-400" />
                  예상 심사 질문 및 모범 답변 (Q&A 가이드)
                </h4>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                    <div className="font-bold text-red-300">
                      Q1. "기존 해로드(e-Nav) 앱이나 AIS 장비와 어떤 차별점이 있습니까?"
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      <strong>A.</strong> "기존 해로드나 AIS는 '단순 위치 확인'에 그쳐 충돌 위험 시 상대방과 직접 연락할 수 없었습니다. BlueCall은 <strong>[050 안심번호 원터치 직통 통화]</strong>와 <strong>[Gemini AI 통화 자동 요약]</strong>, 그리고 <strong>[반경 5NM 주변 선박 실시간 동시 전파]</strong>를 통해 관제국 중심에서 '현장 선원 중심의 실시간 쌍방향 소통'으로 패러다임을 바꾼 것이 가장 큰 차별점입니다."
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                    <div className="font-bold text-red-300">
                      Q2. "바다 위 먼 거리에서는 LTE 통신이 안 터지지 않나요?"
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      <strong>A.</strong> "대한민국 연근해는 해양수산부의 LTE-M 해상 초고속 무선통신망이 연안 100km까지 촘촘히 구축되어 있습니다. BlueCall은 LTE-M 기반 데이터 전송에 최적화된 경량 프로토콜을 사용하며, 통신 순단 시에도 로컬 버퍼링 후 재전송하는 안전 메커니즘을 지원합니다."
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                    <div className="font-bold text-red-300">
                      Q3. "050 안심번호는 어떻게 번호가 노출되지 않게 구현되었습니까?"
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      <strong>A.</strong> "선박 등록 시 해양수산부 선적 정보와 연계하여 고유 050 가상 매핑 서버를 거치도록 설계했습니다. 따라서 통화 버튼을 누르면 상대방 선장에게는 내 진짜 휴대전화 번호가 아닌 050 가상 번호만 표시되므로, 선원분들이 사생활 침해 걱정 없이 안심하고 조업 소통을 할 수 있습니다."
                    </p>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 3: App Installation & URLs */}
          {activeTab === 'INSTALL' && (
            <div className="space-y-4 text-xs text-slate-300">
              
              {/* URL Box */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5">
                    <Laptop className="w-4 h-4 text-cyan-400" />
                    발표장 빔프로젝터 / 노트북 접속용 웹사이트 주소
                  </span>
                  <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded-full font-bold">
                    실시간 접속 가능
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={liveUrl}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-[11px] text-cyan-300 font-mono select-all focus:outline-none"
                  />
                  <button
                    onClick={handleCopyUrl}
                    className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shrink-0 active:scale-95"
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedUrl ? '복사됨!' : '주소 복사'}</span>
                  </button>
                  <a
                    href={liveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition shrink-0"
                    title="새 창에서 열기"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Real Install Options */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="font-bold text-slate-200 flex items-center gap-1.5 text-xs">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  스마트폰에 실제 앱으로 설치하여 발표하는 2가지 방법
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-300 text-xs flex items-center gap-1">
                      ⭐ 방법 1: PWA 원터치 홈 화면 앱 설치 (가장 추천 / 10초 완료)
                    </span>
                    <span className="text-[10px] bg-emerald-500 text-slate-950 font-black px-1.5 py-0.5 rounded">
                      심사용 강력 추천
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    스마트폰 크롬/삼성인터넷 브라우저로 위 주소 접속 후, <strong>메뉴(⋮) → [홈 화면에 추가] 또는 [앱 설치]</strong>를 누르면 스마트폰 바탕화면에 <strong>&apos;바다안심콜&apos; 정식 앱 아이콘</strong>이 생깁니다.
                  </p>
                  <p className="text-[10px] text-emerald-400 font-medium">
                    ✓ 브라우저 주소창이 사라지고 100% 순수 네이티브 앱 화면으로 구동되어 발표 시연에 완벽합니다.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                  <div className="font-bold text-cyan-300 text-xs flex items-center gap-1">
                    📦 방법 2: 실제 안드로이드 순수 .apk 파일 추출하기
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    <strong>1) PWABuilder (무설치 웹 추출):</strong> 마이크로소프트의 <a href="https://www.pwabuilder.com/" target="_blank" rel="noreferrer" className="text-cyan-400 underline font-bold">PWABuilder.com</a>에 위 주소를 붙여넣으면 1분 만에 <strong>안드로이드 .apk 패키지</strong>를 무료로 다운로드할 수 있습니다.
                  </p>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    <strong>2) Capacitor 로컬 빌드:</strong> 본 프로젝트에 이미 <code>capacitor.config.json</code>이 탑재되어 있어, 로컬에서 <code>npx cap add android</code> 후 안드로이드 스튜디오에서 <strong>[Build APK]</strong>를 누르면 즉시 <code>app-debug.apk</code>가 생성됩니다.
                  </p>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-900/95 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-400">
            {activeTab === 'SCRIPT' && '대본을 읽으면서 각 단계의 화면 조작 지시문을 함께 수행해 주세요.'}
            {activeTab === 'TIPS' && '예상 심사 질문을 미리 숙지하면 Q&A 평가에서 높은 점수를 받을 수 있습니다.'}
            {activeTab === 'INSTALL' && '스마트폰 PWA로 설치하면 앱처럼 완벽하게 시연할 수 있습니다.'}
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'SCRIPT' && (
              <button
                onClick={handleCopyFullScript}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedScript ? '복사 완료' : '대본 복사'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-5 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl text-xs font-extrabold transition shadow-md"
            >
              닫기
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
