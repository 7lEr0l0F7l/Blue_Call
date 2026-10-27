import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Radio, 
  MapPin, 
  AlertOctagon, 
  CheckCircle, 
  FileText, 
  Ship, 
  Sparkles, 
  RefreshCw, 
  Building2, 
  X, 
  Phone, 
  Flame, 
  UserCheck, 
  AlertTriangle,
  Search,
  MessageSquare,
  MessageSquareOff, 
  LocateFixed,
  Settings,
  LogOut
} from 'lucide-react';
import { GoogleMaritimeMap } from '../map/GoogleMaritimeMap';
import { MaritimeVessel, MaritimeSosEvent, MaritimeCall, CrewMember } from '../../types/maritime';
import { maritimeService, ActiveCallConnection } from '../../services/maritimeDataService';
import { audioHelper } from '../../utils/audio';
import { getCompassDirection, getShortCompassDirection } from '../../utils/maritimeNav';

interface MaritimeControlCenterProps {
  onLogout?: () => void;
}

export const MaritimeControlCenter: React.FC<MaritimeControlCenterProps> = ({ onLogout }) => {
  const [vessels, setVessels] = useState<MaritimeVessel[]>(maritimeService.getVessels());
  const [sosEvents, setSosEvents] = useState<MaritimeSosEvent[]>(maritimeService.getSosEvents());
  const [calls, setCalls] = useState<MaritimeCall[]>(maritimeService.getCalls());
  const [crew, setCrew] = useState<CrewMember[]>(maritimeService.getCrew());
  const [activeConnections, setActiveConnections] = useState<ActiveCallConnection[]>(maritimeService.getActiveConnections());
  const [selectedVessel, setSelectedVessel] = useState<MaritimeVessel | null>(null);
  const [leftTab, setLeftTab] = useState<'FLEET' | 'CALLS' | 'RISK'>('FLEET');
  const [isSosBannerDismissed, setIsSosBannerDismissed] = useState(maritimeService.getIsSosBannerDismissed());
  const [showSubscriberModal, setShowSubscriberModal] = useState(false);

  // Search by MMSI, 호출부호, 어선번호 only
  const [idSearchQuery, setIdSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [focusVesselTrigger, setFocusVesselTrigger] = useState<number>(0);
  const [focusHqTrigger, setFocusHqTrigger] = useState<number>(0);

  // Live Server Clock
  const [serverTime, setServerTime] = useState('17:47:34');

  const handleCenterLogout = () => {
    audioHelper.playTap();
    if (onLogout) {
      onLogout();
    } else if (typeof window !== 'undefined') {
      localStorage.removeItem('bluecall_logged_role');
      window.location.reload();
    }
  };

  useEffect(() => {
    const clock = setInterval(() => {
      const now = new Date();
      setServerTime(now.toTimeString().split(' ')[0]);
    }, 1000);
    return () => clearInterval(clock);
  }, []);

  useEffect(() => {
    const unsub = maritimeService.subscribe((event) => {
      setVessels([...maritimeService.getVessels()]);
      setSosEvents([...maritimeService.getSosEvents()]);
      setCalls([...maritimeService.getCalls()]);
      setCrew([...maritimeService.getCrew()]);
      setActiveConnections([...maritimeService.getActiveConnections()]);
      if (event === 'SOS_BANNER_DISMISSED') {
        setIsSosBannerDismissed(true);
      } else if (event === 'SOS_TRIGGERED') {
        setIsSosBannerDismissed(false);
      }
    });
    return unsub;
  }, []);

  const activeSos = !isSosBannerDismissed ? (sosEvents.find(e => e.status === 'ACTIVE') || null) : null;

  const handleDispatchPatrol = (agency: '해양경찰청 122' | '동·남해어업관리단' | '항만소방정대', vesselName: string) => {
    const targetSos = sosEvents.find(e => e.status === 'ACTIVE') || sosEvents[0];
    if (!targetSos) return;
    audioHelper.playRadioChirp();

    targetSos.status = 'RESPONDING';
    targetSos.dispatchAgency = agency;
    targetSos.dispatchedVesselName = vesselName;
    targetSos.actionLogs.push({
      timestamp: new Date().toISOString(),
      action: `${agency} (${vesselName}) 긴급 구조대 급파 지령 완료`,
      actor: '여수 해상교통관제센터 (VTS)'
    });
    setSosEvents([...sosEvents]);
  };

  const handleResolveSos = (id: string) => {
    audioHelper.playTap();
    maritimeService.resolveSos(id);
    setIsSosBannerDismissed(true);
    setSosEvents([...maritimeService.getSosEvents()]);
  };

  const activeCallsCount = activeConnections.length;

  // User Requirement: Search STRICTLY by MMSI, 호출부호, 어선번호
  const qClean = idSearchQuery.trim().toLowerCase();
  const matchingVesselsById = qClean
    ? vessels.filter(v => 
        v.mmsi.toLowerCase().includes(qClean) ||
        v.callSign.toLowerCase().includes(qClean) ||
        (v.registrationNo && v.registrationNo.toLowerCase().includes(qClean))
      )
    : [];

  const displayedFleet = qClean
    ? vessels.filter(v => 
        v.mmsi.toLowerCase().includes(qClean) ||
        v.callSign.toLowerCase().includes(qClean) ||
        (v.registrationNo && v.registrationNo.toLowerCase().includes(qClean))
      )
    : vessels;

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-100 overflow-hidden select-none">
      
      {/* Top Global Control Header (Exact style from video 00:06 "BLUE CALL CONTROL") */}
      <div className="h-16 border-b border-slate-800 bg-[#091524] px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-lg gap-3 relative z-40">
        {/* Left: Coastal Station / Subscriber Setting (User Requirement 2: 웹 관제센터는 해안국이니 해수부 본부가 가입자인 설정) */}
        <div className="flex items-center gap-3 shrink-0">
          <div 
            onClick={() => {
              audioHelper.playTap();
              setShowSubscriberModal(true);
            }}
            className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-500 cursor-pointer flex items-center justify-center text-white shadow-md shadow-blue-900/60 font-black text-sm shrink-0 transition"
            title="해안국 가입자 설정 열기"
          >
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm sm:text-base tracking-wider text-white">해양수산부 본부 중앙관제국</span>
              <button 
                onClick={() => {
                  audioHelper.playTap();
                  setShowSubscriberModal(true);
                }}
                className="text-[10px] bg-blue-900/90 hover:bg-blue-800 text-blue-200 border border-blue-500 px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 transition cursor-pointer shadow-sm active:scale-95"
                title="해안국 가입자 설정 확인 및 정보 보기"
              >
                <Settings className="w-3 h-3 text-cyan-300" />
                <span>해안국 가입자 설정</span>
              </button>
              <button 
                onClick={() => {
                  audioHelper.playTap();
                  setFocusHqTrigger(Date.now());
                }}
                className="text-[10px] bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/50 px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 transition cursor-pointer shadow-sm active:scale-95"
                title="관제센터 자기 위치(부산본부)로 지도 이동"
              >
                <LocateFixed className="w-3 h-3 text-cyan-400" />
                <span>자기 위치(부산본부)</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-400 hidden xl:flex items-center gap-2 font-mono mt-0.5">
              <span>호출부호: HLK-MOF</span>
              <span>·</span>
              <span>MMSI: 004400001</span>
              <span>·</span>
              <span>050 안심번호: 0504-2026-0001</span>
            </p>
          </div>
        </div>

        {/* Center: Dedicated Maritime Identification Search Bar (MMSI, 호출부호, 어선번호 전용 - User requirement 1) */}
        <div className="relative flex-1 min-w-[130px] max-w-xs xl:max-w-md mx-1 sm:mx-2 z-50">
          <div className="relative flex items-center bg-slate-900/95 hover:bg-slate-900 focus-within:bg-slate-900 border-2 border-slate-700/90 focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-500/30 rounded-xl px-3 py-1.5 shadow-lg transition">
            <Search className="w-4 h-4 text-cyan-400 shrink-0 mr-2 stroke-[2.5]" />
            <input
              type="text"
              value={idSearchQuery}
              onChange={(e) => {
                setIdSearchQuery(e.target.value);
                setIsSearchFocused(true);
              }}
              onFocus={() => setIsSearchFocused(true)}
              placeholder="MMSI, 호출부호, 어선번호로 선박 검색"
              className="w-full bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none font-bold font-mono"
            />
            {idSearchQuery && (
              <button
                onClick={() => {
                  setIdSearchQuery('');
                  setIsSearchFocused(false);
                }}
                className="p-1 text-slate-400 hover:text-white rounded ml-1 transition"
                title="검색어 지우기"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <div className="hidden sm:flex items-center gap-1 shrink-0 ml-2 pl-2 border-l border-slate-800 text-[10px] text-cyan-400/90 font-mono">
              <span className="bg-cyan-950/80 border border-cyan-800/60 px-1.5 py-0.5 rounded text-[9px]">MMSI</span>
              <span className="bg-cyan-950/80 border border-cyan-800/60 px-1.5 py-0.5 rounded text-[9px]">호출부호</span>
              <span className="bg-cyan-950/80 border border-cyan-800/60 px-1.5 py-0.5 rounded text-[9px]">어선번호</span>
            </div>
          </div>

          {/* Autocomplete Dropdown */}
          {idSearchQuery.trim() && isSearchFocused && (
            <div 
              className="absolute left-0 right-0 top-full mt-1.5 bg-slate-900/98 backdrop-blur-xl border border-cyan-500/50 rounded-2xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto z-50 divide-y divide-slate-800"
              onMouseDown={(e) => e.preventDefault()}
            >
              <div className="p-2.5 bg-slate-950/90 text-[11px] text-slate-400 flex items-center justify-between font-mono">
                <span className="text-cyan-400 font-bold">식별부호 검색 결과 ({matchingVesselsById.length}척)</span>
                <span className="text-[10px] text-slate-500">MMSI · 호출부호 · 어선번호 일치</span>
              </div>

              {matchingVesselsById.length > 0 ? (
                matchingVesselsById.map(v => (
                  <div
                    key={v.id}
                    onClick={() => {
                      audioHelper.playTap();
                      setSelectedVessel(v);
                      setIsSearchFocused(false);
                      setLeftTab('FLEET');
                    }}
                    className="p-2.5 hover:bg-slate-800/80 cursor-pointer transition flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-white text-xs">{v.shipName}</span>
                        <span className="text-[10px] text-slate-400">({v.vesselType})</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                          v.status === 'SOS' ? 'bg-red-600 text-white' : 'bg-cyan-950 text-cyan-400'
                        }`}>
                          {v.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono">
                        <span>MMSI: <strong className="text-cyan-300">{v.mmsi}</strong></span>
                        <span>호출: <strong className="text-cyan-300">{v.callSign}</strong></span>
                        <span>어선번호: <strong className="text-cyan-300">{v.registrationNo || '-'}</strong></span>
                      </div>
                    </div>
                    <div className="text-right text-[10px] text-slate-400 font-mono shrink-0 pl-2">
                      <div className="text-amber-400 font-bold">{v.distanceNM} NM</div>
                      <div>{v.captainName}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-slate-400">
                  일치하는 MMSI, 호출부호, 어선번호 선박이 없습니다.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Center/Right: Live Telemetry Badges & Logout Button */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-mono shrink-0">
          <div className="hidden lg:flex items-center gap-1.5 bg-slate-900/90 px-2.5 py-1 rounded-xl border border-slate-800">
            <span className="text-slate-400">운항:</span>
            <span className="text-cyan-400 font-bold">{vessels.length}척</span>
          </div>

          <div className="hidden xl:flex items-center gap-1.5 bg-slate-900/90 px-2.5 py-1 rounded-xl border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400">통화:</span>
            <span className="text-emerald-400 font-bold">{activeCallsCount}건</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 bg-slate-900/90 px-2.5 py-1 rounded-xl border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span className="text-slate-400">SOS:</span>
            <span className="text-red-400 font-bold">{sosEvents.filter(e => e.status === 'ACTIVE').length}건</span>
          </div>

          <div className="hidden 2xl:flex items-center gap-1.5 bg-slate-900/90 px-2.5 py-1 rounded-xl border border-slate-800 text-slate-300">
            <span>서버:</span>
            <span className="text-amber-400 font-bold">{serverTime}</span>
          </div>

          {/* Prominent High-Visibility Logout Button */}
          <button
            onClick={handleCenterLogout}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black transition shadow-lg shadow-red-950 active:scale-95 cursor-pointer shrink-0 border border-red-400/60 ml-1"
            title="관제센터 로그아웃 (사용자 역할 선택 창으로 전환)"
          >
            <LogOut className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>로그아웃</span>
          </button>
        </div>
      </div>

      {/* Main 3-Column Cockpit Layout (Video 00:06 & 02:18) */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Column: Fleet / Live Calls / AI Risk Alerts (310px) */}
        <div className="w-76 sm:w-80 border-r border-slate-800 bg-[#08121f] flex flex-col shrink-0 overflow-hidden">
          {/* Tabs */}
          <div className="flex items-center border-b border-slate-800 bg-slate-900/60 p-1 text-xs font-bold text-slate-300">
            <button
              onClick={() => setLeftTab('FLEET')}
              className={`flex-1 py-1.5 rounded-lg transition ${
                leftTab === 'FLEET' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              전체 선박 ({vessels.length})
            </button>
            <button
              onClick={() => setLeftTab('CALLS')}
              className={`flex-1 py-1.5 rounded-lg transition ${
                leftTab === 'CALLS' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              실시간 통화 ({calls.length})
            </button>
            <button
              onClick={() => setLeftTab('RISK')}
              className={`flex-1 py-1.5 rounded-lg transition ${
                leftTab === 'RISK' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              AI 위험감지
            </button>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            
            {/* 1. Fleet List */}
            {leftTab === 'FLEET' && (
              <>
                {idSearchQuery.trim() && (
                  <div className="p-2 rounded-xl bg-cyan-950/40 border border-cyan-800/80 text-[11px] flex items-center justify-between text-cyan-300 mb-1">
                    <span>식별부호 검색: <strong className="text-white">{displayedFleet.length}척</strong></span>
                    <button
                      onClick={() => setIdSearchQuery('')}
                      className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
                    >
                      전체보기
                    </button>
                  </div>
                )}
                {displayedFleet.map(v => {
                  const isSelected = selectedVessel?.id === v.id;
                  return (
                    <div
                      key={v.id}
                      onClick={() => {
                        audioHelper.playTap();
                        setSelectedVessel(v);
                      }}
                      className={`p-2.5 rounded-xl border transition cursor-pointer text-xs space-y-1 ${
                        isSelected
                          ? 'bg-blue-950/80 border-blue-500 shadow-md ring-1 ring-blue-500'
                          : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-white">{v.shipName}</span>
                          <span className="text-[10px] text-slate-400">({v.vesselType})</span>
                        </div>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                          v.status === 'SOS'
                            ? 'bg-red-600 text-white animate-pulse'
                            : v.status === 'FISHING'
                            ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          {v.status === 'FISHING' ? '조업중' : v.status === 'SOS' ? '조난' : '운항중'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span>MMSI: {v.mmsi}</span>
                        <span>호출: {v.callSign}</span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                        <span className="truncate max-w-[170px]">어선번호: {v.registrationNo || '-'}</span>
                        <span className="text-amber-400/90 font-semibold">{v.distanceNM}NM</span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-0.5 border-t border-slate-800/40">
                        <span>속력: <strong className="text-cyan-400">{v.speedKnots} kts</strong></span>
                        <span>방위: <strong className="text-emerald-400">{v.headingDeg}° ({getShortCompassDirection(v.headingDeg)})</strong></span>
                      </div>

                      {v.statusMessage && (
                        <div className="text-[10px] text-cyan-300 truncate">
                          {v.statusMessage}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}

            {/* 2. Live Calls & Transcript Summaries (Video 02:18) */}
            {leftTab === 'CALLS' && (
              calls.map(c => (
                <div key={c.id} className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-cyan-300 font-bold">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{c.callerVessel.shipName} ↔ {c.receiverVessel.shipName}</span>
                    </div>
                    <span className="text-[10px] bg-emerald-950 text-emerald-400 px-1.5 py-0.2 rounded font-bold">
                      통화완료
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-300 bg-slate-950 p-2 rounded-lg border border-slate-800 leading-tight">
                    "{c.aiSummary.summaryText}"
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-800">
                    <span>안심번호: {c.safeNumberUsed}</span>
                    <span>{c.timestamp}</span>
                  </div>
                </div>
              ))
            )}

            {/* 3. AI Risk Alerts (불법거래 의심, 정신건강 위기, 어장 충돌) (Video 02:28 / 05:45) */}
            {leftTab === 'RISK' && (
              <div className="space-y-2 text-xs">
                {/* Mental health / crew distress alert (Video 05:45) */}
                <div className="p-3 bg-red-950/40 border border-red-700/80 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-red-400 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                      <span>정신건강 위기 신호 감지</span>
                    </span>
                    <span className="text-[9px] bg-red-600 text-white px-1.5 py-0.2 rounded font-bold">
                      위험
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-200">
                    플라잉 더치맨호 승선원 '김윤지' 고립감 및 피로 누적 감지됨.
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    BlueBot 상담 중 · 24시간 원격의료 전문의 대기
                  </div>
                </div>

                {/* Illegal trade / collision risk tag */}
                <div className="p-3 bg-amber-950/40 border border-amber-700/80 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      <span>교차 침로 충돌 주의보</span>
                    </span>
                    <span className="text-[9px] bg-amber-600 text-white px-1.5 py-0.2 rounded font-bold">
                      주의
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-200">
                    플라잉 더치맨호 ↔ 태성호 간 거리 0.58해리 이내 근접 통항 중.
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    통발 양망 구역 0.5마일 우회 항해 권고 송출됨
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Center Column: Google Maritime Map with Call lines and Dismissible Banner (Flex-1) */}
        <div className="flex-1 flex flex-col p-3 bg-slate-950 overflow-hidden relative">
          <GoogleMaritimeMap
            vessels={vessels}
            sosEvents={sosEvents}
            selectedVessel={selectedVessel}
            onSelectVessel={v => setSelectedVessel(v)}
            onCallVessel={() => {}}
            onBroadcastSos={() => {}}
            height="100%"
            isControlCenter={true}
            searchQueryExternal={idSearchQuery}
            focusVesselTrigger={focusVesselTrigger}
            focusHqTrigger={focusHqTrigger}
          />
        </div>

        {/* Right Column: Vessel & Crew Condition Inspector (330px) (Video 00:06 / 02:50) */}
        <div className="w-80 sm:w-84 border-l border-slate-800 bg-[#08121f] flex flex-col shrink-0 overflow-y-auto p-3.5 space-y-3.5">
          {/* Coastal Station Identity Card (User Requirement 2: 웹 관제센터는 해안국이니 해수부 본부가 가입자인 설정) */}
          <div className="bg-gradient-to-br from-blue-950/90 via-slate-900/95 to-slate-950 rounded-2xl p-3.5 border border-blue-500/40 text-xs shadow-lg space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md font-bold text-xs shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-black text-white text-xs flex items-center gap-1.5">
                    <span>해양수산부 본부</span>
                    <span className="text-[9px] bg-blue-900/80 text-blue-300 px-1.5 py-0.2 rounded font-bold border border-blue-400/40">
                      해안국 가입자
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    호출부호: HLK-MOF · MMSI: 004400001
                  </div>
                </div>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
              <span className="text-slate-400">해안국 대표 안심통화:</span>
              <span className="text-cyan-400 font-bold">0504-2026-0001</span>
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-slate-400">관할 권역:</span>
              <span className="text-emerald-400 font-bold">대한민국 전 해역 종합 지휘</span>
            </div>
          </div>

          {selectedVessel ? (
            <>
              {/* Selected Vessel Card */}
              <div className="bg-slate-900/90 rounded-2xl p-3.5 border border-slate-800 space-y-2 text-xs shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-sm text-white">{selectedVessel.shipName}</span>
                    <button
                      onClick={() => {
                        audioHelper.playTap();
                        setSelectedVessel(null);
                      }}
                      className="text-[9px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 ml-1 transition"
                      title="해양수산부 본부 관제로 복귀"
                    >
                      본부 복귀
                    </button>
                  </div>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                    selectedVessel.status === 'SOS' ? 'bg-red-600 text-white' : 'bg-cyan-950 text-cyan-400'
                  }`}>
                    {selectedVessel.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono text-slate-300">
                  <div>선종: {selectedVessel.vesselType}</div>
                  <div>톤수: {selectedVessel.tonnage}t</div>
                  <div>MMSI: {selectedVessel.mmsi}</div>
                  <div>호출부호: {selectedVessel.callSign}</div>
                  <div>속력: <span className="text-cyan-400 font-bold">{selectedVessel.speedKnots} kts</span></div>
                  <div>방위: <span className="text-emerald-400 font-bold">{selectedVessel.headingDeg}° ({getCompassDirection(selectedVessel.headingDeg)})</span></div>
                </div>

                <div className="pt-1 border-t border-slate-800 text-[11px]">
                  <span>선장: <strong className="text-white">{selectedVessel.captainName}</strong></span>
                  <div className="text-cyan-400 font-mono mt-0.5">안심번호: {selectedVessel.safePhoneNumber}</div>
                </div>

                {/* Quick Call, Chat & Move Location Action buttons (User Requirements 1, 4 & 5) */}
                <div className="space-y-1.5 pt-1">
                  {/* 위치 이동 버튼 (선박 위치로 지도 중심 이동) */}
                  <button
                    onClick={() => {
                      audioHelper.playTap();
                      setFocusVesselTrigger(Date.now());
                    }}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 active:scale-98 text-cyan-300 border border-cyan-500/50 rounded-xl text-xs font-bold shadow flex items-center justify-center gap-1.5 transition"
                    title="선박 위치로 지도 중심 이동 및 확대"
                  >
                    <LocateFixed className="w-3.5 h-3.5 text-cyan-400" />
                    <span>선박 위치로 지도 이동 (관제 포커스)</span>
                  </button>

                  <button
                    onClick={() => {
                      audioHelper.playRadioChirp();
                      maritimeService.startCallConnection('004400001', '해양수산부 본부 (해안국)', selectedVessel.mmsi, selectedVessel.shipName);
                    }}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white rounded-xl text-xs font-bold shadow flex items-center justify-center gap-1.5 transition"
                    title={`050 안심번호 통화 (${selectedVessel.safePhoneNumber || '0504-****-****'})`}
                  >
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    <span>050 안심통화</span>
                  </button>

                  {selectedVessel.isSubscriber ? (
                    <button
                      onClick={() => {
                        audioHelper.playRadioChirp();
                        maritimeService.sendVesselChatMessage(selectedVessel.mmsi, '[해양수산부 본부] 본선 침로 및 안전 운항 지침을 확인하시기 바랍니다. 이상!');
                      }}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-500 active:scale-98 text-white rounded-xl text-xs font-bold shadow flex items-center justify-center gap-1.5 transition"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>해안국 ↔ 선박 문자/채팅 전송</span>
                    </button>
                  ) : (
                    <div
                      className="w-full py-2 bg-slate-800/80 border border-slate-700/80 text-slate-400 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-not-allowed select-none opacity-80"
                      title="미가입 선박은 채팅기능을 제공할 수 없습니다. 050 안심번호 전화만 지원됩니다."
                    >
                      <MessageSquareOff className="w-3.5 h-3.5 text-slate-500" />
                      <span>미가입 선박 (채팅 불가 · 안심번호 전화만 지원)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Crew Condition Real-Time Inspector (Video 00:06 / 02:50) */}
              {(() => {
                const vesselCrew = maritimeService.getVesselCrew(selectedVessel);
                const isOwn = selectedVessel.isOwnShip;
                return (
                  <div className="bg-slate-900/90 rounded-2xl p-3.5 border border-slate-800 space-y-2 text-xs shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-cyan-400" />
                        <span>승선원 (Crew) 컨디션 현황</span>
                      </span>
                      <span className="text-[10px] text-slate-300 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {isOwn ? '본선 승선원' : `${selectedVessel.shipName}`} · <strong className="text-cyan-400">{vesselCrew.length}명</strong>
                      </span>
                    </div>

                    <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-0.5">
                      {vesselCrew.map((member) => (
                        <div
                          key={member.id}
                          className="p-2 bg-slate-950 rounded-xl border border-slate-800/90 flex items-center justify-between text-xs hover:border-slate-700 transition"
                        >
                          <div className="flex-1 min-w-0 pr-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-white text-[11px]">{member.name}</span>
                              <span className="text-[10px] text-cyan-400 font-mono">({member.role})</span>
                              {member.role === '선장' && (
                                <span className="text-[9px] bg-blue-900/60 text-blue-300 px-1 rounded font-semibold">책임자</span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                              <span>심박 <strong className="text-slate-200">{member.heartRateBpm}</strong> bpm</span>
                              <span>·</span>
                              <span>피로도 <strong className={member.fatigueScore > 70 ? 'text-red-400' : member.fatigueScore > 50 ? 'text-amber-400' : 'text-emerald-400'}>{member.fatigueScore}%</strong></span>
                            </div>
                            {member.notes && member.notes !== '건강 상태 양호' && member.notes !== '특이사항 없음' && (
                              <div className="text-[10px] text-amber-300/90 mt-0.5 truncate flex items-center gap-1">
                                <AlertTriangle className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                                <span>{member.notes}</span>
                              </div>
                            )}
                          </div>

                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold shrink-0 ${
                            member.condition === '정상'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-900'
                              : member.condition === '주의'
                              ? 'bg-amber-950 text-amber-400 border border-amber-900'
                              : 'bg-red-950 text-red-400 border border-red-900 animate-pulse'
                          }`}>
                            {member.condition}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Emergency Dispatch Buttons (If active SOS) */}
              {sosEvents.some(e => e.status === 'ACTIVE') && (
                <div className="bg-red-950/40 rounded-2xl p-3.5 border border-red-800 space-y-2 text-xs shadow-md">
                  <div className="font-bold text-red-400 flex items-center gap-1.5">
                    <AlertOctagon className="w-4 h-4 text-red-500 animate-pulse" />
                    <span>긴급 구조대 출동 지령</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleDispatchPatrol('해양경찰청 122', '목포해경 경비정 3009함')}
                      className="py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow"
                    >
                      해경 122 출동
                    </button>
                    <button
                      onClick={() => handleDispatchPatrol('동·남해어업관리단', '무궁화18호 지도선')}
                      className="py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow"
                    >
                      어업지도선 급파
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      const active = sosEvents.find(e => e.status === 'ACTIVE');
                      if (active) handleResolveSos(active.id);
                    }}
                    className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[11px] font-bold transition"
                  >
                    조난 상황 종결 및 보고
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3">
              {/* MOF Headquarters Comprehensive Management Card */}
              <div className="bg-slate-900/90 rounded-2xl p-3.5 border border-blue-500/40 space-y-3 text-xs shadow-md">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
                    <span className="font-black text-sm text-white">해양수산부 (본부)</span>
                  </div>
                  <span className="text-[9px] bg-blue-900/80 text-blue-300 px-2 py-0.5 rounded font-bold border border-blue-400/40">
                    중앙관제국
                  </span>
                </div>

                <div className="space-y-1.5 text-[11px] text-slate-300">
                  <div className="flex items-start justify-between">
                    <span className="text-slate-400 shrink-0">기관 소재지:</span>
                    <span className="text-right text-slate-200">부산광역시 동구 중앙대로 206</span>
                  </div>
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-slate-400">대표 직통전화:</span>
                    <span className="text-cyan-400 font-bold">051-200-5114</span>
                  </div>
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-slate-400">비상 관제 무선:</span>
                    <span className="text-emerald-400 font-bold">VHF CH 16 / DSC 2187.5kHz</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">관할 해역:</span>
                    <span className="text-slate-200 font-medium">대한민국 전 해역 및 EEZ</span>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-1 text-[11px]">
                  <div className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">주요 관제 임무</div>
                  <p className="text-slate-300 leading-relaxed text-[10px]">
                    대한민국 전 해역 어선 및 상선 실시간 교통 관제, 안심번호 비상 통신망 운영, 해경 및 어업관리단 합동 조난·수색구조 총괄 지휘
                  </p>
                </div>

                {/* Focus HQ on Map button */}
                <button
                  onClick={() => {
                    audioHelper.playTap();
                    setFocusHqTrigger(Date.now());
                  }}
                  className="w-full py-2 bg-blue-600/90 hover:bg-blue-600 active:scale-98 text-white rounded-xl text-xs font-bold shadow flex items-center justify-center gap-1.5 transition"
                  title="지도에서 해양수산부 본부 위치로 이동"
                >
                  <LocateFixed className="w-3.5 h-3.5 text-white" />
                  <span>해양수산부 본부 위치로 지도 이동</span>
                </button>
              </div>

              {/* Fleet status summary */}
              <div className="bg-slate-900/70 rounded-2xl p-3 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="font-bold flex items-center gap-1.5">
                    <Ship className="w-3.5 h-3.5 text-cyan-400" />
                    <span>실시간 관제 선박 현황</span>
                  </span>
                  <span className="text-[10px] text-cyan-400 font-mono font-bold">{vessels.length}척</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                    <div className="text-slate-400">일반 가입선박</div>
                    <div className="text-cyan-400 font-black text-sm mt-0.5">
                      {vessels.filter(v => v.isSubscriber).length}척
                    </div>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                    <div className="text-slate-400">미가입/기타 선박</div>
                    <div className="text-slate-300 font-black text-sm mt-0.5">
                      {vessels.filter(v => !v.isSubscriber).length}척
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 text-center pt-1">
                  지도에서 선박을 클릭하면 상세 제원 및 승선원 상태가 표시됩니다.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
