import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Laptop, 
  AlertOctagon, 
  Info, 
  Ship,
  Users,
  LogOut,
  Building2,
  Share2,
  Download,
  Copy,
  Check,
  ExternalLink,
  QrCode
} from 'lucide-react';
import { UserApp } from './components/user/UserApp';
import { MaritimeControlCenter } from './components/control/MaritimeControlCenter';
import { PresentationScriptModal } from './components/common/PresentationScriptModal';
import { SplashScreen } from './components/common/SplashScreen';
import { RoleSelectionModal, UserRoleType } from './components/common/RoleSelectionModal';
import { maritimeService } from './services/maritimeDataService';
import { audioHelper } from './utils/audio';

type ActivePlatform = 'MOBILE_APP' | 'LAPTOP_WEB';

export default function App() {
  // Support standalone mobile APK mode vs standalone web control center mode vs demo switcher mode
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const targetMode = searchParams?.get('mode') || searchParams?.get('view') || searchParams?.get('platform');
  const isMobileStandalone = targetMode === 'app' || targetMode === 'mobile' || targetMode === 'vessel';
  const isControlStandalone = targetMode === 'control' || targetMode === 'web' || targetMode === 'admin';

  // Check persisted logged-in role (Once selected, only that screen is shown until logout)
  const [loggedRole, setLoggedRole] = useState<UserRoleType | null>(() => {
    if (isMobileStandalone) return 'VESSEL_CREW';
    if (isControlStandalone) return 'CONTROL_OFFICER';
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bluecall_logged_role') as UserRoleType | null;
      if (saved === 'VESSEL_CREW' || saved === 'CONTROL_OFFICER') return saved;
    }
    return null;
  });

  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Flash (Splash) Screen & Role Selection States
  const [showInitialSplash, setShowInitialSplash] = useState(false);
  const [showStandaloneSplash, setShowStandaloneSplash] = useState(true);
  const [previewSplash, setPreviewSplash] = useState(searchParams?.get('splash') === 'true');
  const [showRoleSelectModal, setShowRoleSelectModal] = useState(false);

  // If no role has been logged into, show initial splash once on arrival
  useEffect(() => {
    if (!loggedRole) {
      setShowInitialSplash(true);
    }
  }, []);

  // Live website URL for presentation & smartphone testing
  const liveUrl = typeof window !== 'undefined' ? window.location.origin : "https://ais-pre-odqzillx2fvw74suchkuzy-25946652106.asia-northeast1.run.app";

  const handleCopyUrl = () => {
    audioHelper.playTap();
    navigator.clipboard.writeText(liveUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleQuickSOS = () => {
    audioHelper.playSOS();
    maritimeService.triggerSos('기관고장', '상단 헤더 긴급 조난 SOS 시뮬레이션');
  };

  // Role Selection (Login)
  const handleSelectRole = (role: UserRoleType) => {
    setLoggedRole(role);
    if (typeof window !== 'undefined') {
      localStorage.setItem('bluecall_logged_role', role);
    }
    setShowRoleSelectModal(false);
  };

  // Logout feature: clear role and return to Role Selection
  const handleLogout = () => {
    audioHelper.playTap();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('bluecall_logged_role');
    }
    setLoggedRole(null);
    setShowRoleSelectModal(true);
  };

  // [1] 안드로이드 스튜디오 / APK 빌드 전용 독립 모바일 앱 화면
  if (isMobileStandalone) {
    return (
      <div className="w-screen h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
        {showStandaloneSplash && (
          <SplashScreen 
            onFinish={() => {
              setShowStandaloneSplash(false);
              if (!loggedRole) setShowRoleSelectModal(true);
            }} 
            duration={2200} 
          />
        )}
        <UserApp 
          isStandalone={true} 
          onLogout={handleLogout}
        />
        <RoleSelectionModal
          isOpen={showRoleSelectModal || loggedRole === null}
          currentRole={loggedRole || 'VESSEL_CREW'}
          onSelectRole={handleSelectRole}
          onClose={loggedRole ? () => setShowRoleSelectModal(false) : undefined}
        />
      </div>
    );
  }

  // [2] 육상 관제센터 PC 웹 전용 독립 화면 (관제센터 담당자 접속 시 이 화면만 100% 표시)
  if (isControlStandalone || loggedRole === 'CONTROL_OFFICER') {
    return (
      <div className="w-screen h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
        <MaritimeControlCenter onLogout={handleLogout} />
        
        {/* Info Modal */}
        {showInfoModal && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full p-6 text-slate-100 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-cyan-600 flex items-center justify-center text-white font-bold text-sm">
                    BC
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">BlueCall (블루콜) 플랫폼 안내</h3>
                    <p className="text-xs text-slate-400">AI기반 해양 행정·현장소통플랫폼</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInfoModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                <p>
                  현재 <strong>[🏢 관제센터 담당자 모드 (해양수산부 부산본부)]</strong>로 접속 중입니다.
                </p>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5 text-[11px]">
                  <div className="text-cyan-400 font-bold">주요 기능:</div>
                  <div>• <strong>전국 연근해 선박 실시간 식별 및 AIS/MMSI 모니터링</strong></div>
                  <div>• <strong>050 안심번호 및 무전 직통 교신</strong></div>
                  <div>• <strong>조난 SOS 경보 발생 시 반경 5해리 내 선박 실시간 비상 전파</strong></div>
                </div>
              </div>

              <button
                onClick={() => setShowInfoModal(false)}
                className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 rounded-xl font-bold text-xs text-white transition shadow"
              >
                확인
              </button>
            </div>
          </div>
        )}

        {/* Presentation & Demo Kit Modal */}
        <PresentationScriptModal
          isOpen={showDemoModal}
          onClose={() => setShowDemoModal(false)}
          liveUrl={liveUrl}
        />

        {/* Manual Preview Splash Screen */}
        {previewSplash && (
          <SplashScreen onFinish={() => setPreviewSplash(false)} duration={2200} />
        )}

        {/* Role Selection Modal */}
        <RoleSelectionModal
          isOpen={showRoleSelectModal}
          currentRole={loggedRole || 'CONTROL_OFFICER'}
          onSelectRole={handleSelectRole}
          onClose={() => setShowRoleSelectModal(false)}
        />
      </div>
    );
  }

  // [3] 어선 선원 모드 (어선 선원 접속 시 어선 앱 화면만 100% 표시)
  if (loggedRole === 'VESSEL_CREW') {
    return (
      <div className="w-screen h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
        {/* Top Header for Fisher Mode */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/95 px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-md z-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-950 font-black text-sm">
              BC
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-white tracking-tight">BlueCall (블루콜)</span>
                <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800 px-2 py-0.5 rounded font-bold">
                  어선 선원 모드
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">전국 연근해 선박 식별 · 안심번호 통화 · 조난 안전망</p>
            </div>
          </div>

          {/* Current Connected Account Pill */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-950/70 border border-blue-500/50 text-xs font-bold text-blue-200 shadow-sm">
            <Ship className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="truncate">플라잉 더치맨호 <span className="text-slate-400 text-[11px]">(선장 홍길동 · 29톤)</span></span>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                audioHelper.playTap();
                setPreviewSplash(true);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl text-xs font-bold border border-slate-700/60 transition"
              title="앱 아이콘 및 플래시(스플래시) 화면 미리보기"
            >
              <img src="/app-icon.png" alt="icon" className="w-4 h-4 rounded-md object-cover border border-cyan-500/40" />
              <span className="hidden lg:inline">플래시 화면</span>
            </button>

            <button
              onClick={handleQuickSOS}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/90 hover:bg-red-600 text-white rounded-xl text-xs font-black shadow-md shadow-red-950 transition active:scale-95 animate-pulse"
              title="즉각 조난 SOS 전파 테스트"
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span className="hidden md:inline">즉시 조난(SOS) 테스트</span>
            </button>

            <button
              onClick={() => {
                audioHelper.playTap();
                setShowInfoModal(true);
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              title="플랫폼 소개"
            >
              <Info className="w-4 h-4" />
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/70 hover:bg-red-900 border border-red-700/80 text-red-200 hover:text-white rounded-xl text-xs font-bold transition shadow-sm active:scale-95 cursor-pointer ml-1"
              title="로그아웃 (역할 선택 화면으로 전환)"
            >
              <LogOut className="w-3.5 h-3.5 text-red-400" />
              <span>로그아웃</span>
            </button>
          </div>
        </header>

        {/* Fisher Smartphone Viewport ONLY (Control Center is NOT shown) */}
        <main className="flex-1 w-full h-[calc(100vh-4rem)] overflow-hidden relative bg-slate-950 flex items-center justify-center p-2 sm:p-4">
          <UserApp onLogout={handleLogout} />
        </main>

        {/* Info Modal */}
        {showInfoModal && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full p-6 text-slate-100 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-cyan-600 flex items-center justify-center text-white font-bold text-sm">
                    BC
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">BlueCall (블루콜) 플랫폼 안내</h3>
                    <p className="text-xs text-slate-400">AI기반 해양 행정·현장소통플랫폼</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInfoModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                <p>
                  현재 <strong>[🚢 어선 선원 모드 (플라잉 더치맨호)]</strong>로 접속 중입니다.
                </p>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5 text-[11px]">
                  <div className="text-cyan-400 font-bold">주요 기능:</div>
                  <div>• <strong>운항 지도 & 타 선박 식별</strong></div>
                  <div>• <strong>개인정보보호 050 안심번호 통화 & AI 통화 요약</strong></div>
                  <div>• <strong>3초 롱프레스 원터치 SOS 발신 (5해리 주변 전파)</strong></div>
                  <div>• <strong>선원 건강 모니터링 (체온, 활동 시간)</strong></div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-cyan-800/60 space-y-2 text-[11px]">
                  <div className="text-cyan-300 font-bold">안드로이드 APK 패키징 리소스:</div>
                  <div className="flex items-center gap-3 pt-1">
                    <img
                      src="/app-icon.png"
                      alt="BlueCall Icon"
                      className="w-10 h-10 rounded-xl border border-cyan-500/50 object-cover"
                    />
                    <div className="text-[10px] text-slate-300 leading-tight">
                      <div>• <strong>앱 아이콘:</strong> <code>res/mipmap/ic_launcher.png</code></div>
                      <div>• <strong>플래시 화면:</strong> <code>res/drawable/splash_screen.png</code></div>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowInfoModal(false)}
                className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 rounded-xl font-bold text-xs text-white transition shadow"
              >
                확인
              </button>
            </div>
          </div>
        )}

        {/* Presentation & Demo Kit Modal */}
        <PresentationScriptModal
          isOpen={showDemoModal}
          onClose={() => setShowDemoModal(false)}
          liveUrl={liveUrl}
        />

        {/* Manual Preview Splash Screen Overlay */}
        {previewSplash && (
          <SplashScreen onFinish={() => setPreviewSplash(false)} duration={2200} />
        )}

        {/* Role Selection Modal (if opened) */}
        <RoleSelectionModal
          isOpen={showRoleSelectModal}
          currentRole={loggedRole}
          onSelectRole={handleSelectRole}
          onClose={() => setShowRoleSelectModal(false)}
        />
      </div>
    );
  }

  // [4] 미접속 상태 (loggedRole === null): 두 화면 모두 보이지 않고 역할 선택 창 표시
  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center bg-[#040d21] text-slate-100 overflow-hidden font-sans relative select-none">
      {/* Background Ambient Branding */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950 pointer-events-none" />

      {/* Initial Splash Screen on Launch */}
      {showInitialSplash && (
        <SplashScreen 
          onFinish={() => {
            setShowInitialSplash(false);
            setShowRoleSelectModal(true);
          }} 
          duration={2200} 
        />
      )}

      {/* When splash is not showing, show waiting portal background */}
      {!showInitialSplash && (
        <div className="relative z-10 flex flex-col items-center text-center p-6 space-y-4 max-w-md animate-fadeIn">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-2xl font-black text-3xl border border-cyan-400/40">
            BC
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">BlueCall (블루콜)</h1>
            <p className="text-xs text-cyan-400 font-semibold mt-1">AI 기반 해양 소통 · 행정 · 안전 플랫폼</p>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            이용하실 사용자 역할(어선 선원 또는 관제센터 담당자)을 선택해 주세요.
          </p>
          <button
            onClick={() => setShowRoleSelectModal(true)}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl text-xs font-extrabold transition shadow-lg shadow-cyan-950 active:scale-95"
          >
            역할 선택 창 열기
          </button>
        </div>
      )}

      {/* Mandatory Role Selection Modal (Cannot be closed without selecting a role) */}
      <RoleSelectionModal
        isOpen={showRoleSelectModal || (!showInitialSplash && loggedRole === null)}
        currentRole="VESSEL_CREW"
        onSelectRole={handleSelectRole}
      />
    </div>
  );
}
