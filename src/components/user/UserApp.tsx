import React, { useState, useEffect, useRef } from 'react';
import { 
  Compass, 
  Phone, 
  Users, 
  Ship, 
  AlertOctagon, 
  Search, 
  Settings, 
  MessageSquare,
  Sparkles,
  Wifi,
  X,
  Volume2,
  Clock,
  ShieldCheck,
  Radio,
  LogOut
} from 'lucide-react';
import { IPhoneFrame } from '../common/IPhoneFrame';
import { SplashScreen } from '../common/SplashScreen';
import { RoleSelectionModal, UserRoleType } from '../common/RoleSelectionModal';
import { GoogleMaritimeMap } from '../map/GoogleMaritimeMap';
import { VesselDetailModal } from '../vessel/VesselDetailModal';
import { CrewManagementView } from '../crew/CrewManagementView';
import { maritimeService } from '../../services/maritimeDataService';
import { MaritimeVessel, MaritimeSosEvent, CrewMember, MaritimeAccidentType } from '../../types/maritime';
import { audioHelper } from '../../utils/audio';

type MobileTab = 'MAP' | 'CHAT' | 'SOS' | 'SETTINGS';
type UserRole = 'CAPTAIN' | 'CREW';

// 선박 조난 상태 목록 (User Requirement 7: 기관고장, 침몰, 폭발, 화재 등)
const DISTRESS_TYPES: Array<{
  type: MaritimeAccidentType;
  title: string;
  desc: string;
  icon: string;
  badgeColor: string;
}> = [
  { type: '기관고장', title: '기관고장', desc: '주기관 정지 및 표류 중 (조종 불능)', icon: '⚙️', badgeColor: 'bg-amber-600' },
  { type: '화재', title: '선내 화재', desc: '기관실/선내 화재 발생 및 진화 작업 중', icon: '🔥', badgeColor: 'bg-orange-600' },
  { type: '침몰', title: '침몰 위험', desc: '선체 침몰 위험 및 퇴선 구명벌 투하 대기', icon: '⚠️', badgeColor: 'bg-red-700' },
  { type: '폭발', title: '선내 폭발', desc: '기관실/화물창 폭발 사고 및 다수 부상자', icon: '💥', badgeColor: 'bg-rose-700' },
  { type: '침수/전복', title: '침수 / 전복', desc: '선체 해수 침수 및 급격한 경사 위험', icon: '🌊', badgeColor: 'bg-blue-600' },
  { type: '응급환자', title: '응급환자', desc: '선내 중증 외상 / 심정지 긴급 이송 필요', icon: '🩺', badgeColor: 'bg-emerald-600' },
  { type: '해상추락', title: '해상추락', desc: '승선원 해상 추락/익수자 발생 및 즉시 수색', icon: '🛟', badgeColor: 'bg-purple-600' },
  { type: '좌초', title: '암초 좌초', desc: '암초/천퇴 좌초 및 선저 파공 파손', icon: '🪨', badgeColor: 'bg-yellow-700' },
  { type: '충돌', title: '선박 충돌', desc: '타 선박과의 충돌 사고 및 선체 파손', icon: '🚢', badgeColor: 'bg-indigo-600' }
];

interface UserAppProps {
  onOpenControlCenter?: () => void;
  isStandalone?: boolean;
  onLogout?: () => void;
}

export const UserApp: React.FC<UserAppProps> = ({ onOpenControlCenter, isStandalone = false, onLogout }) => {
  const [activeTab, setActiveTab] = useState<MobileTab>('MAP');
  const [userRole, setUserRole] = useState<UserRole>('CAPTAIN');
  const [vessels, setVessels] = useState<MaritimeVessel[]>(maritimeService.getVessels());
  const [sosEvents, setSosEvents] = useState<MaritimeSosEvent[]>(maritimeService.getSosEvents());
  const [crew, setCrew] = useState<CrewMember[]>(maritimeService.getCrew());
  const [selectedVessel, setSelectedVessel] = useState<MaritimeVessel | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCallDirectly, setIsCallDirectly] = useState(false);
  const [targetChatVesselId, setTargetChatVesselId] = useState<string | null>(null);
  const [showSplash, setShowSplash] = useState(false);
  const [showRoleSelect, setShowRoleSelect] = useState(false);

  // SOS in-app flow states
  const [sosSendingState, setSosSendingState] = useState<'IDLE' | 'SENDING' | 'RESCUE_ACTIVE'>('IDLE');
  const [sosLongPressSeconds, setSosLongPressSeconds] = useState(3);
  const [pressProgress, setPressProgress] = useState(0); // 0.0 to 1.0 (Clockwise circle stroke)
  const [isPressingSos, setIsPressingSos] = useState(false);
  const [sosWarningMsg, setSosWarningMsg] = useState<string | null>(null);
  const [showDistressSettingModal, setShowDistressSettingModal] = useState(false);
  const animFrameRef = useRef<number | null>(null);
  const pressStartTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const unsub = maritimeService.subscribe((event) => {
      setVessels([...maritimeService.getVessels()]);
      setSosEvents([...maritimeService.getSosEvents()]);
      setCrew([...maritimeService.getCrew()]);
      if (event === 'SOS_RESOLVED') {
        setSosSendingState('IDLE');
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const activeSos = sosEvents.find(e => e.status === 'ACTIVE') || null;

  // Strict 3-second continuous press handlers (User requirement 6: 시계방향으로 3초 동안 테두리 1바퀴 회전)
  const handleStartSosPress = (e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
    }
    setSosWarningMsg(null);
    setIsPressingSos(true);
    setPressProgress(0);
    setSosLongPressSeconds(3);
    pressStartTimeRef.current = Date.now();
    audioHelper.playTap();

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }

    const updateFrame = () => {
      if (!pressStartTimeRef.current) return;
      const elapsed = Date.now() - pressStartTimeRef.current;
      const progress = Math.min(1, elapsed / 3000);
      setPressProgress(progress);
      const remainingSeconds = Math.max(0, 3 - Math.floor(elapsed / 1000));
      setSosLongPressSeconds(remainingSeconds);

      // Only fire when strictly 3000ms or more continuous press has elapsed
      if (elapsed >= 3000) {
        if (animFrameRef.current) {
          cancelAnimationFrame(animFrameRef.current);
          animFrameRef.current = null;
        }
        pressStartTimeRef.current = null;
        setIsPressingSos(false);
        setPressProgress(0);
        setSosLongPressSeconds(3);
        audioHelper.playSOS();
        maritimeService.triggerSos('기관고장', '주기관 정지 및 표류 중');
        setSosSendingState('SENDING');
      } else {
        animFrameRef.current = requestAnimationFrame(updateFrame);
      }
    };

    animFrameRef.current = requestAnimationFrame(updateFrame);
  };

  const handleStopSosPress = (e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (pressStartTimeRef.current) {
      const elapsed = Date.now() - pressStartTimeRef.current;
      if (elapsed < 3000) {
        setSosWarningMsg('⚠️ 3초 이상 길게 누르고 있어야 조난 신호가 송신됩니다 (오발신 방지)');
      }
      pressStartTimeRef.current = null;
    }
    setIsPressingSos(false);
    setPressProgress(0);
    setSosLongPressSeconds(3);
  };

  const handleCancelSos = () => {
    audioHelper.playTap();
    if (activeSos) {
      maritimeService.resolveSos(activeSos.id);
    }
    setSosSendingState('IDLE');
  };

  const handleSelectDistressType = (type: MaritimeAccidentType, defaultDesc: string) => {
    audioHelper.playRadioChirp();
    if (activeSos) {
      maritimeService.updateSosAccidentType(activeSos.id, type, defaultDesc);
    }
    setShowDistressSettingModal(false);
  };

  const appContent = (
    <div className="relative w-full h-full flex-1 flex flex-col justify-between overflow-hidden bg-slate-950 text-slate-100 select-none">
        
        {/* Top Floating App Bar (Video 00:06) */}
        <div className="p-2.5 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between text-xs z-20">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm text-white">전국 해역 운항 현황</span>
              <span className="text-[10px] text-cyan-400 font-mono">{vessels.length}척</span>
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
              <span>풍속 3.2m/s</span>
              <span>·</span>
              <span>파고 0.8m</span>
              <span>·</span>
              <span>수온 18.2°C</span>
            </div>
          </div>

          {/* Captain vs Crew Role Selector Pill & Logout (Video 00:06 / 04:02) */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center p-0.5 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-bold">
              <button
                onClick={() => {
                  audioHelper.playTap();
                  setUserRole('CAPTAIN');
                }}
                className={`px-2.5 py-1 rounded-lg transition ${
                  userRole === 'CAPTAIN' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                선장
              </button>
              <button
                onClick={() => {
                  audioHelper.playTap();
                  setUserRole('CREW');
                }}
                className={`px-2.5 py-1 rounded-lg transition ${
                  userRole === 'CREW' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                승선원
              </button>
            </div>

            {onLogout && (
              <button
                onClick={() => {
                  audioHelper.playTap();
                  onLogout();
                }}
                className="p-1.5 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-800/60 text-red-300 hover:text-white transition shadow-sm active:scale-95"
                title="로그아웃 (역할 선택 화면으로 전환)"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Tab Content Views */}
        <div className="flex-1 overflow-hidden flex flex-col relative">
          
          {/* TAB 1: Real-time Maritime Map (Video 00:06 - 01:45) */}
          <div className={`flex-1 w-full h-full relative overflow-hidden flex flex-col ${activeTab === 'MAP' ? '' : 'hidden'}`}>
            <GoogleMaritimeMap
              vessels={vessels}
              sosEvents={sosEvents}
              selectedVessel={selectedVessel}
              onSelectVessel={(v) => setSelectedVessel(v)}
              onCallVessel={(v) => {
                setSelectedVessel(v);
                const isBusy = maritimeService.isVesselInCall(v.mmsi, v.id, v.shipName);
                if (isBusy) {
                  audioHelper.playBusy();
                  setIsCallDirectly(false);
                } else {
                  setIsCallDirectly(true);
                }
                setIsDetailModalOpen(true);
              }}
              onBroadcastSos={() => setActiveTab('SOS')}
              onStartChat={(v) => {
                setTargetChatVesselId(v.mmsi);
              }}
              height="100%"
              isCompact={true}
            />
          </div>

          {/* TAB 2: Chat Tab (Recent Vessel Chats & Crew Hub) */}
          <div className={`flex-1 w-full h-full relative overflow-hidden flex flex-col ${activeTab === 'CHAT' ? '' : 'hidden'}`}>
            <CrewManagementView
              initialChatVesselId={targetChatVesselId}
              onOpenCall={(v) => {
                setSelectedVessel(v);
                setIsCallDirectly(true);
                setIsDetailModalOpen(true);
              }}
            />
          </div>

          {/* TAB 3: SOS Emergency Rescue Tab (Video 06:34 - 08:30) */}
          {activeTab === 'SOS' && (
            <div className="flex-1 flex flex-col p-4 bg-slate-950 overflow-y-auto text-slate-100 space-y-4">
              
              {sosSendingState === 'IDLE' && !activeSos && (
                <div className="flex-1 flex flex-col items-center justify-around py-4">
                  <div className="text-center space-y-1">
                    <h2 className="text-xl font-black text-white">긴급 구조 요청</h2>
                    <p className="text-xs text-slate-400">버튼을 3초간 길게 누르면 조난 신호가 발신됩니다</p>
                  </div>

                  {/* Big SOS Circle Button with Clockwise 3-Second Border (User Requirement 6) */}
                  <div className="relative flex items-center justify-center my-4 w-48 h-48 select-none">
                    {/* Radar Ripple Waves */}
                    <div className={`absolute w-52 h-52 rounded-full bg-red-600/20 transition-transform ${isPressingSos ? 'scale-125 animate-ping' : ''}`} />
                    <div className="absolute w-40 h-40 rounded-full bg-red-600/30" />

                    {/* Clockwise Circular SVG Border: 3초 동안 시계방향으로 테두리가 따라서 형성되며 3초를 넘겼을 경우 1바퀴를 정확히 도는 속도로 버튼을 완전히 감쌈 */}
                    <svg className="absolute w-44 h-44 -rotate-90 pointer-events-none z-10" viewBox="0 0 176 176">
                      <defs>
                        <linearGradient id="sosCircleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#f87171" />
                          <stop offset="50%" stopColor="#ef4444" />
                          <stop offset="100%" stopColor="#fbbf24" />
                        </linearGradient>
                      </defs>
                      {/* Background Track Circle */}
                      <circle
                        cx="88"
                        cy="88"
                        r="74"
                        fill="none"
                        stroke="rgba(239, 68, 68, 0.25)"
                        strokeWidth="5"
                      />
                      {/* Clockwise Filling Stroke (Circumference: 2 * PI * 74 = 464.96) */}
                      <circle
                        cx="88"
                        cy="88"
                        r="74"
                        fill="none"
                        stroke="url(#sosCircleGrad)"
                        strokeWidth={isPressingSos ? 7 : 5}
                        strokeLinecap="round"
                        strokeDasharray={464.96}
                        strokeDashoffset={464.96 * (1 - pressProgress)}
                        className={isPressingSos ? "filter drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" : ""}
                      />
                    </svg>

                    <button
                      onMouseDown={handleStartSosPress}
                      onMouseUp={handleStopSosPress}
                      onMouseLeave={handleStopSosPress}
                      onTouchStart={handleStartSosPress}
                      onTouchEnd={handleStopSosPress}
                      onTouchCancel={handleStopSosPress}
                      onContextMenu={(e) => e.preventDefault()}
                      onClick={(e) => {
                        e.preventDefault();
                        if (pressProgress < 1) {
                          setSosWarningMsg('⚠️ 3초 이상 길게 누르고 있어야 조난 신호가 송신됩니다 (오발신 방지)');
                        }
                      }}
                      className={`relative z-20 w-36 h-36 rounded-full bg-gradient-to-tr from-red-600 via-rose-600 to-red-500 active:scale-95 text-white shadow-2xl flex flex-col items-center justify-center transition select-none ${
                        isPressingSos ? 'scale-95 shadow-red-500/50' : ''
                      }`}
                    >
                      <AlertOctagon className="w-10 h-10 mb-1" />
                      <span className="text-2xl font-black tracking-widest font-mono">
                        {isPressingSos ? `${Math.ceil(Math.max(0.1, 3 * (1 - pressProgress)))}초` : 'SOS'}
                      </span>
                      <span className="text-[10px] font-bold text-red-100 uppercase tracking-wider">
                        {isPressingSos ? `${Math.round(pressProgress * 100)}% (떼면 취소)` : '3초 길게 누르기'}
                      </span>
                    </button>
                  </div>

                  {/* Warning Toast if tapped for less than 3 seconds */}
                  {sosWarningMsg && (
                    <div className="w-full text-center text-xs text-amber-300 font-bold bg-amber-950/80 border border-amber-800/80 px-3 py-2 rounded-xl animate-bounce">
                      {sosWarningMsg}
                    </div>
                  )}

                  {/* Sub Information */}
                  <div className="w-full bg-slate-900/90 rounded-2xl p-3.5 border border-slate-800 text-xs text-slate-300 space-y-2">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <Radio className="w-4 h-4 text-cyan-400" />
                      <span>원터치 자동 발신 연동 안내</span>
                    </div>
                    <div className="text-[11px] text-slate-400 leading-relaxed">
                      발신 시 인근 선박 및 해양경찰청 122 상황실로 현재 GPS 위치(위도 35.21N, 경도 129.36E / 부산 기장 외해)와 선박 제원이 즉시 전파됩니다.
                    </div>
                  </div>
                </div>
              )}

              {/* SOS Active Sending Screen (User Requirement 7: 조난 상태 설정 세팅 버튼 지원) */}
              {(sosSendingState === 'SENDING' || activeSos) && (
                <div className="flex-1 flex flex-col space-y-3">
                  <div className="p-4 bg-red-950/80 border-2 border-red-500 rounded-3xl text-center space-y-2 animate-pulse">
                    <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center mx-auto text-white shadow-2xl">
                      <Radio className="w-6 h-6 animate-spin" />
                    </div>
                    <h3 className="text-base font-black text-white">SOS 송신 중 (해상 비상 전파)</h3>
                    <p className="text-xs text-red-200">
                      인근 선박 및 해경 122에 실시간 구조 요청을 전송했습니다.
                    </p>
                  </div>

                  {/* Active Distress Type Card & Setting Button (User Requirement 7) */}
                  <div className="bg-slate-900/90 rounded-2xl p-3.5 border border-red-500/50 space-y-3 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                        <span className="text-xs font-bold text-white">현재 조난 분류</span>
                      </div>
                      <span className="px-2.5 py-1 bg-red-600 text-white font-black text-xs rounded-lg shadow border border-red-400">
                        {activeSos?.accidentType || '기관고장'}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-300 bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-0.5">
                      <div className="font-semibold text-red-300">상황 전파 내용:</div>
                      <div className="font-medium text-slate-200 leading-relaxed">
                        {activeSos?.notes || '원터치 비상 SOS 조난 신호 발신. 인근 선박의 신속한 구조 지원 요청.'}
                      </div>
                    </div>

                    {/* Distress Status Setting / Change Button */}
                    <button
                      onClick={() => {
                        audioHelper.playTap();
                        setShowDistressSettingModal(true);
                      }}
                      className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition"
                    >
                      <Settings className="w-4 h-4" />
                      <span>선박 조난 상태 설정 / 긴급 변경 (세팅)</span>
                    </button>
                  </div>

                  {/* Responding vessels list */}
                  <div className="bg-slate-900/90 rounded-2xl p-3.5 border border-slate-800 space-y-2 text-xs">
                    <div className="font-bold text-slate-300 flex items-center gap-1.5">
                      <Ship className="w-4 h-4 text-cyan-400" />
                      <span>구조 참고 공공데이터 (인근 구조 가능 선박)</span>
                    </div>

                    <div className="space-y-2">
                      {[
                        { name: '혜오름호', dist: '1.2 NM', eta: '4분', status: '접근 중' },
                        { name: '해경122정 (여수)', dist: '2.1 NM', eta: '6분', status: '출동 중' }
                      ].map((v, i) => (
                        <div key={i} className="p-2.5 bg-slate-950 rounded-xl flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-white">{v.name}</span>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">거리 {v.dist} · 도착 {v.eta}</div>
                          </div>
                          <span className="text-[10px] bg-blue-950 text-blue-400 font-bold px-2 py-0.5 rounded border border-blue-900">
                            {v.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleCancelSos}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
                  >
                    조난 상황 종료 및 전파 해제
                  </button>
                </div>
              )}

            </div>
          )}

          {/* Modal: 선박 조난 상태 설정/변경 (User Requirement 7: 기관고장, 침몰, 폭발, 화재 등 현재 선박의 조난 상태 설정) */}
          {showDistressSettingModal && (
            <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm p-4 flex flex-col justify-end animate-fadeIn">
              <div className="bg-slate-900 border border-slate-700 rounded-3xl p-4 max-h-[85%] flex flex-col shadow-2xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <AlertOctagon className="w-5 h-5 text-red-400" />
                    <h3 className="text-sm font-black text-white">선박 조난 상태 설정 / 긴급 변경</h3>
                  </div>
                  <button
                    onClick={() => setShowDistressSettingModal(false)}
                    className="p-1 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <p className="text-[11px] text-slate-400">
                  현재 선박의 위급 상태를 설정하면 인근 조업 선박 및 해경 122 상황실로 전파 내용이 즉시 갱신됩니다.
                </p>

                <div className="overflow-y-auto space-y-2 pr-1 max-h-[50vh]">
                  {DISTRESS_TYPES.map(item => (
                    <button
                      key={item.type}
                      onClick={() => handleSelectDistressType(item.type, item.desc)}
                      className={`w-full p-2.5 rounded-2xl border text-left flex items-center justify-between transition ${
                        activeSos?.accidentType === item.type
                          ? 'bg-red-950/70 border-red-500 shadow-lg'
                          : 'bg-slate-950 hover:bg-slate-800 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">{item.icon}</span>
                        <div>
                          <div className="font-bold text-white text-xs flex items-center gap-1.5">
                            <span>{item.title}</span>
                            {activeSos?.accidentType === item.type && (
                              <span className="text-[9px] bg-red-600 text-white font-bold px-1.5 py-0.5 rounded">현재 설정</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{item.desc}</div>
                        </div>
                      </div>
                      <span className={`text-[10px] px-2 py-1 rounded-lg font-bold text-white shrink-0 ${item.badgeColor}`}>
                        선택
                      </span>
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={() => setShowDistressSettingModal(false)}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition"
                  >
                    닫기
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Settings & Crew Management (Video 09:07 - 10:15) */}
          {activeTab === 'SETTINGS' && (
            <div className="flex-1 flex flex-col p-4 bg-slate-950 overflow-y-auto space-y-4 text-xs">
              <div className="border-b border-slate-800 pb-2">
                <h2 className="text-base font-extrabold text-white">설정 및 내 선박</h2>
                <p className="text-[11px] text-slate-400">선장/선원 인증 정보 및 승선원 명부</p>
              </div>

              {/* Captain Profile Card */}
              <div className="p-3.5 bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-white">최재현 선장</div>
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-900">
                    선장 인증완료
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  연락처: 010-8921-1204 (안심번호 0504-8921-1204)
                </div>
              </div>

              {/* My Vessel Card */}
              <div className="p-3.5 bg-slate-900 rounded-2xl border border-slate-800 space-y-2 font-mono text-[11px]">
                <div className="font-bold text-white text-xs font-sans">내 선박: 플라잉 더치맨호 (연안통발 9.77t)</div>
                <div className="text-slate-400">어선번호: 전남여수-2023-089</div>
                <div className="text-slate-400">MMSI: 440182940 · 호출부호: DS8291</div>
                <div className="text-slate-400">승선정원: 4명 / 현재 승선: 4명</div>
              </div>

              {/* Crew List (우리 팀원: 최재현, 김대건, 김광준, 김윤지) */}
              <div className="p-3.5 bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between font-bold text-white">
                  <span>승선원 명부</span>
                  <span className="text-cyan-400 font-mono">{crew.length}명</span>
                </div>

                <div className="space-y-1.5">
                  {crew.map(m => (
                    <div key={m.id} className="p-2.5 bg-slate-950 rounded-xl flex items-center justify-between border border-slate-800/60">
                      <div className="flex-1 mr-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-white text-xs">{m.name}</span>
                          <span className="text-[10px] text-slate-400">({m.role})</span>
                          <span className="text-[10px] text-emerald-400 font-mono">체온 {m.bodyTemperature ?? 36.5}°C</span>
                          <span className="text-[10px] text-cyan-300">· {m.activityHours ?? '당직 4h'}</span>
                        </div>
                        {m.notes && (
                          <div className="text-[10px] text-slate-300 mt-0.5 truncate font-medium">
                            {m.notes}
                          </div>
                        )}
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-extrabold border shrink-0 ${
                        m.condition === '정상'
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-900'
                          : m.condition === '주의'
                          ? 'bg-amber-950 text-amber-400 border-amber-900'
                          : 'bg-red-950 text-red-400 border-red-900 font-extrabold animate-pulse'
                      }`}>
                        {m.condition}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* App Icon & Splash Screen Package (Android APK 제작 리소스) */}
              <div className="p-3.5 bg-slate-900 rounded-2xl border border-cyan-800/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span>앱 아이콘 & 플래시(스플래시) 화면</span>
                  </div>
                  <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-700/60 px-2 py-0.5 rounded font-mono">
                    APK 패키징 리소스
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {/* App Icon */}
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex flex-col items-center gap-2 text-center">
                    <img 
                      src="/app-icon.png" 
                      alt="BlueCall App Icon" 
                      className="w-14 h-14 rounded-2xl shadow-lg border border-cyan-500/40 object-cover" 
                    />
                    <div>
                      <div className="font-bold text-slate-200 text-xs">앱 아이콘 (1:1)</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">ic_launcher.png</div>
                    </div>
                    <a
                      href="/app-icon.png"
                      download="bluecall_app_icon.png"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg font-bold text-[10px] flex items-center justify-center gap-1 transition"
                    >
                      <span>아이콘 다운로드</span>
                    </a>
                  </div>

                  {/* Splash Screen */}
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex flex-col items-center gap-2 text-center">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg border border-cyan-500/40 relative flex items-center justify-center bg-slate-900">
                      <img 
                        src="/splash-screen.png" 
                        alt="BlueCall Splash" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div>
                      <div className="font-bold text-slate-200 text-xs">플래시 화면 (9:16)</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">splash_screen.png</div>
                    </div>
                    <button
                      onClick={() => {
                        audioHelper.playTap();
                        setShowSplash(true);
                      }}
                      className="w-full py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold text-[10px] flex items-center justify-center gap-1 transition shadow"
                    >
                      <span>플래시 미리보기</span>
                    </button>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 leading-relaxed border-t border-slate-800 pt-2">
                  안드로이드 스튜디오 `res/mipmap` 및 `res/drawable`에 등록 가능한 공식 고해상도 그래픽 리소스입니다.
                </p>
              </div>

              {/* Logout Button Card */}
              {onLogout && (
                <div className="p-3.5 bg-slate-900 rounded-2xl border border-red-900/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-white text-xs flex items-center gap-2">
                      <LogOut className="w-4 h-4 text-red-400" />
                      <span>어선 앱 로그아웃</span>
                    </div>
                    <span className="text-[10px] text-slate-400">플라잉 더치맨호</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    로그아웃 시 현재 세션이 종료되며, 다시 어선 선원 또는 관제센터 역할을 선택할 수 있습니다.
                  </p>
                  <button
                    onClick={() => {
                      audioHelper.playTap();
                      onLogout();
                    }}
                    className="w-full py-2 bg-red-950/80 hover:bg-red-900 border border-red-700/80 text-red-200 hover:text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition shadow active:scale-95"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-400" />
                    <span>로그아웃 (역할 다시 선택)</span>
                  </button>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Bottom Cupertino 4 Tabs (Video 00:06 & 04:30) */}
        <div className="w-full bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 px-4 py-2 flex items-center justify-around z-30 select-none">
          <button
            onClick={() => {
              audioHelper.playTap();
              setActiveTab('MAP');
            }}
            className={`flex flex-col items-center gap-1 py-1 px-3 transition ${
              activeTab === 'MAP' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-5 h-5" />
            <span className="text-[10px]">운항지도</span>
          </button>

          <button
            onClick={() => {
              audioHelper.playTap();
              setActiveTab('CHAT');
            }}
            className={`flex flex-col items-center gap-1 py-1 px-3 transition relative ${
              activeTab === 'CHAT' ? 'text-blue-500 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <MessageSquare className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            </div>
            <span className="text-[10px]">chat</span>
          </button>

          <button
            onClick={() => {
              audioHelper.playTap();
              setActiveTab('SOS');
            }}
            className={`flex flex-col items-center gap-1 py-1 px-3 transition ${
              activeTab === 'SOS' ? 'text-red-500 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertOctagon className="w-5 h-5" />
            <span className="text-[10px]">SOS</span>
          </button>

          <button
            onClick={() => {
              audioHelper.playTap();
              setActiveTab('SETTINGS');
            }}
            className={`flex flex-col items-center gap-1 py-1 px-3 transition ${
              activeTab === 'SETTINGS' ? 'text-purple-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-[10px]">설정</span>
          </button>
        </div>

        {/* Detailed Modal if needed */}
        <VesselDetailModal
          vessel={selectedVessel}
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          onStartCallDirectly={isCallDirectly}
          onStartChat={(v) => {
            maritimeService.createOrGetChatWithVessel(v);
            setTargetChatVesselId(v.mmsi);
            setActiveTab('CHAT');
            setIsDetailModalOpen(false);
          }}
        />

        {/* Splash Screen Overlay */}
        {showSplash && (
          <SplashScreen 
            onFinish={() => {
              setShowSplash(false);
              setShowRoleSelect(true);
            }} 
            duration={2200} 
          />
        )}

        {/* Role Selection Modal (플래시 화면 종료 후 역할 선택 + 데모 안내) */}
        <RoleSelectionModal
          isOpen={showRoleSelect}
          currentRole="VESSEL_CREW"
          onSelectRole={(role) => {
            setShowRoleSelect(false);
            if (role === 'CONTROL_OFFICER' && onOpenControlCenter) {
              onOpenControlCenter();
            }
          }}
          onClose={() => setShowRoleSelect(false)}
        />

      </div>
  );

  if (isStandalone) {
    return (
      <div className="w-full h-full flex flex-col overflow-hidden bg-slate-950">
        {appContent}
      </div>
    );
  }

  return (
    <IPhoneFrame activeCallStatus={activeSos ? 'SOS' : undefined}>
      {appContent}
    </IPhoneFrame>
  );
};
