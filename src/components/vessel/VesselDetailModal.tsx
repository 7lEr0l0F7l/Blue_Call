import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2, 
  Ship, 
  Sparkles, 
  FileText, 
  CheckCircle, 
  Clock, 
  ShieldCheck, 
  X,
  MessageSquare,
  MessageSquareOff,
  Compass
} from 'lucide-react';
import { MaritimeVessel, MaritimeCall, AiCallSummary } from '../../types/maritime';
import { maritimeService } from '../../services/maritimeDataService';
import { audioHelper } from '../../utils/audio';
import { getCompassDirection } from '../../utils/maritimeNav';
import { getVesselCallDialogueAndSummary } from '../map/GoogleMaritimeMap';

interface VesselDetailModalProps {
  vessel: MaritimeVessel | null;
  isOpen: boolean;
  onClose: () => void;
  onStartCallDirectly?: boolean;
  onStartChat?: (vessel: MaritimeVessel) => void;
}

export const VesselDetailModal: React.FC<VesselDetailModalProps> = ({
  vessel,
  isOpen,
  onClose,
  onStartCallDirectly = false,
  onStartChat
}) => {
  const [callState, setCallState] = useState<'IDLE' | 'CALLING' | 'CONNECTED' | 'SUMMARIZING' | 'SUMMARY_READY'>('IDLE');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [completedCall, setCompletedCall] = useState<MaritimeCall | null>(null);
  const [callWarning, setCallWarning] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      maritimeService.endOwnShipCall();
      setCallState('IDLE');
      setCallDuration(0);
      setCompletedCall(null);
      setCallWarning(null);
      audioHelper.stopRingtone();
      audioHelper.stopSpeech();
      return;
    }

    if (onStartCallDirectly) {
      startSafeCall();
    }
  }, [isOpen, onStartCallDirectly]);

  const startSafeCall = () => {
    audioHelper.playTap();
    if (!vessel) return;

    if (maritimeService.isVesselInCall(vessel.mmsi, vessel.id, vessel.shipName)) {
      audioHelper.playRadioChirp();
      audioHelper.playBusy();
      setCallWarning(`[통화 중] ${vessel.shipName}은(는) 현재 타 선박과 1:1 교신 중입니다. 통화 종료 후 다시 걸어주십시오.`);
      setTimeout(() => setCallWarning(null), 4000);
      return;
    }

    setCallState('CALLING');
    audioHelper.startRingtone();

    // Answer call after 2 seconds
    setTimeout(() => {
      audioHelper.stopRingtone();
      setCallState('CONNECTED');
      audioHelper.playRadioChirp();

      // Speak realistic maritime conversation matching AI summary
      if (vessel) {
        const dialogue = getVesselCallDialogueAndSummary(vessel, 0);
        audioHelper.speakFakeVoice(dialogue.speech);
      }
    }, 2200);
  };

  // Connected call duration timer
  useEffect(() => {
    let timer: number;
    if (callState === 'CONNECTED') {
      timer = window.setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [callState]);

  const endCall = () => {
    maritimeService.endOwnShipCall();
    audioHelper.stopRingtone();
    audioHelper.stopSpeech();
    audioHelper.playRadioChirp();
    setCallState('SUMMARIZING');

    // Simulate Generative AI summary generation (1.5 seconds)
    setTimeout(() => {
      if (!vessel) return;

      const own = maritimeService.getVessels().find(v => v.isOwnShip) || maritimeService.getVessels()[0];

      const dialogue = getVesselCallDialogueAndSummary(vessel, 5);
      const transcript = vessel.status === 'SOS'
        ? [
            `[본선 ${own.shipName}] "여보세요, ${vessel.shipName} 선장님! 본선 플라잉 더치맨호입니다. 현 상황 말씀해주십시오!"`,
            `[상대선 ${vessel.shipName}] "${dialogue.speech}"`,
            `[본선 ${own.shipName}] "수신 완료! 귀선 조난 위치 확인했습니다. 해경 상황실에 즉시 전파하고 구조정 급파 및 구난 지원 협조하겠습니다!"`,
            `[상대선 ${vessel.shipName}] "감사합니다! 신속한 구조 지원 부탁드립니다!"`
          ]
        : [
            `[본선 ${own.shipName}] "여보세요? ${vessel.shipName} 050 안심번호로 호출합니다."`,
            `[상대선 ${vessel.shipName}] "${dialogue.speech}"`,
            `[본선 ${own.shipName}] "수신 양호합니다. 전달해주신 내용대로 안전 거리 유지하여 통항하겠습니다."`,
            `[상대선 ${vessel.shipName}] "네, 안전 항해하세요, 수고하세요."`
          ];

      const aiSummary: AiCallSummary = {
        category: vessel.status === 'SOS' ? '긴급 지원' : vessel.status === 'FISHING' ? '어장 협조' : '안전 주의',
        summaryText: dialogue.summary.replace(/\[.*?\]\s*/, ''),
        actionRequired: vessel.status === 'SOS' 
          ? '해경 122 즉시 전파 및 구조정 급파 대기, 인근 선박 구조 협조' 
          : vessel.status === 'FISHING' 
          ? '0.5해리 이상 안전 이격 및 부표 시각 감시 지속' 
          : '우현 대 우현 교행 및 안전 거리 0.8해리 유지',
        publicDataRegistered: true,
        registeredToVTS: true
      };

      const newCallRecord: MaritimeCall = {
        id: `CALL-${Date.now()}`,
        callerVessel: own,
        receiverVessel: vessel,
        timestamp: new Date().toISOString(),
        durationSeconds: Math.max(12, callDuration),
        safeNumberUsed: vessel.safePhoneNumber,
        transcript,
        aiSummary
      };

      maritimeService.addCompletedCall(newCallRecord);
      setCompletedCall(newCallRecord);
      setCallState('SUMMARY_READY');
    }, 1500);
  };

  if (!isOpen || !vessel) return null;

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full overflow-hidden text-slate-100 shadow-2xl flex flex-col h-[94%] max-h-[94%] sm:h-auto sm:max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800">
              <Ship className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">{vessel.shipName}</h3>
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-mono">
                  {vessel.vesselType}
                </span>
              </div>
              <p className="text-xs text-slate-400">선장: {vessel.captainName} · {vessel.tonnage}톤</p>
            </div>
          </div>
          <button
            onClick={() => {
              audioHelper.playTap();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 min-h-0 p-5 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-cyan-700/50">
          
          {/* Active Call In-Progress Screen */}
          {(callState === 'CALLING' || callState === 'CONNECTED') && (
            <div className="bg-gradient-to-b from-slate-950 to-slate-900 rounded-2xl p-6 border border-slate-800 text-center space-y-4 shadow-inner">
              <div className="w-20 h-20 rounded-full bg-cyan-950/80 border-2 border-cyan-500/60 flex items-center justify-center mx-auto text-cyan-400 shadow-xl">
                <Ship className="w-10 h-10 animate-pulse" />
              </div>

              <div>
                <h4 className="text-lg font-black text-white">{vessel.shipName}</h4>
                <div className="text-xs text-cyan-400 font-mono mt-0.5">
                  안심번호 {vessel.safePhoneNumber} 연결 중
                </div>
                <div className="text-xs font-mono text-slate-400 mt-2">
                  {callState === 'CALLING' ? '상대 선박 호출 신호 송신 중...' : `통화 시간: ${formatDuration(callDuration)}`}
                </div>
              </div>

              {callState === 'CONNECTED' && (
                <div className="p-3 bg-emerald-950/80 border border-emerald-500/60 rounded-xl text-left space-y-2 shadow-md">
                  {(() => {
                    const dialogue = getVesselCallDialogueAndSummary(vessel, callDuration);
                    return (
                      <>
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                          <span className="text-[10px] font-black text-cyan-300 bg-cyan-950 px-1.5 py-0.2 rounded border border-cyan-800">
                            AI 실시간 통화 요약
                          </span>
                        </div>
                        <p className="text-xs text-emerald-100 font-extrabold leading-snug">
                          {dialogue.summary}
                        </p>
                        <div className="pt-1.5 border-t border-emerald-800/60 text-[10px] text-emerald-300/90 italic font-mono flex items-start gap-1">
                          <span className="text-emerald-400 font-bold shrink-0">🎙️ 수신 음성:</span>
                          <span className="leading-tight">&quot;{dialogue.speech}&quot;</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {callState === 'CONNECTED' && (
                <div className="flex items-center justify-center gap-4 py-2">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`p-3 rounded-full transition ${isMuted ? 'bg-white text-black' : 'bg-slate-800 text-white'}`}
                  >
                    {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={endCall}
                    className="p-4 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-xl active:scale-95 transition"
                  >
                    <PhoneOff className="w-6 h-6" />
                  </button>
                  <button className="p-3 rounded-full bg-slate-800 text-white">
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* AI Summarizing Spinner */}
          {callState === 'SUMMARIZING' && (
            <div className="p-8 text-center bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <Sparkles className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
              <div className="text-sm font-bold text-white">AI 통화 내용 자동 요약 & 분류 중...</div>
              <p className="text-xs text-slate-400">
                선박 간 음성 대화에서 핵심 안전 조업 협조 사항을 추출하고 공공데이터 규격으로 변환하고 있습니다.
              </p>
            </div>
          )}

          {/* AI Call Summary Results View (PDF 3p & 5p core feature) */}
          {callState === 'SUMMARY_READY' && completedCall && (
            <div className="bg-slate-950 rounded-2xl p-4 border border-cyan-800/80 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400">
                  <Sparkles className="w-4 h-4" />
                  <span>생성형 AI 통화 요약 & 공공데이터 분류 결과</span>
                </div>
                <span className="text-[10px] bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded font-bold border border-cyan-800">
                  {completedCall.aiSummary.category}
                </span>
              </div>

              <div className="text-xs text-slate-200 leading-relaxed font-medium bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                📌 <strong>핵심 요약:</strong> {completedCall.aiSummary.summaryText}
              </div>

              <div className="text-xs text-emerald-300 leading-relaxed bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-900/60">
                ✅ <strong>조치 사항:</strong> {completedCall.aiSummary.actionRequired}
              </div>

              <div className="text-[11px] text-slate-400 space-y-1 pt-1 border-t border-slate-800 font-mono">
                <div className="flex items-center justify-between">
                  <span>통화 시간:</span>
                  <span className="text-slate-300">{formatDuration(completedCall.durationSeconds)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>해상교통관제(VTS) 연계:</span>
                  <span className="text-emerald-400 font-bold">자동 기록 완료</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>공공데이터포털 축적:</span>
                  <span className="text-cyan-400 font-bold">동기화 완료</span>
                </div>
              </div>
            </div>
          )}

          {/* Vessel Information Card */}
          {callState === 'IDLE' && (
            <>
              <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-3">
                <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>선박 기본 식별 정보</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-slate-900 rounded-lg">
                    <span className="text-[11px] text-slate-400 block">MMSI 식별번호</span>
                    <span className="font-mono font-bold text-white">{vessel.mmsi}</span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-lg">
                    <span className="text-[11px] text-slate-400 block">호출부호 (CallSign)</span>
                    <span className="font-mono font-bold text-white">{vessel.callSign}</span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-lg">
                    <span className="text-[11px] text-slate-400 block">어선 등록번호</span>
                    <span className="text-white font-medium">{vessel.registrationNo}</span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-lg">
                    <span className="text-[11px] text-slate-400 block">개인정보보호 안심번호</span>
                    <span className="font-mono text-cyan-400 font-bold">{vessel.safePhoneNumber}</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl text-xs space-y-2 border border-slate-800">
                  {/* Speed and Bearing (방위) Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-[11px] text-slate-400 block mb-0.5">현재 속력</span>
                      <span className="text-cyan-400 font-mono font-bold text-sm">{vessel.speedKnots} kts</span>
                    </div>
                    <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-[11px] text-slate-400 block mb-0.5">선박 방위 (침로)</span>
                      <span className="text-emerald-400 font-mono font-bold text-sm flex items-center gap-1">
                        <Compass className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        {vessel.headingDeg}°
                        <span className="text-[11px] text-emerald-300 font-normal">({getCompassDirection(vessel.headingDeg)})</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-slate-400 pt-1 border-t border-slate-800 text-[11px]">
                    <span>본선과의 거리 / 방위:</span>
                    <span className="text-amber-400 font-mono font-bold">
                      {vessel.distanceNM} NM / {vessel.bearingDeg ?? vessel.headingDeg}° ({getCompassDirection(vessel.bearingDeg ?? vessel.headingDeg)})
                    </span>
                  </div>

                  {vessel.statusMessage && (
                    <div className="pt-1 text-cyan-300 border-t border-slate-800 font-medium text-[11px]">
                      📢 {vessel.statusMessage}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons (Requirement 4 & 5: 안심번호 통화 상시 가능, 미가입 선박은 채팅 제한) */}
              <div className="space-y-2 pt-2">
                {callWarning && (
                  <div className="p-2.5 bg-amber-950/80 border border-amber-500/80 rounded-xl text-amber-200 text-xs font-bold animate-pulse text-center">
                    ⚠️ {callWarning}
                  </div>
                )}

                {(() => {
                  const isBusy = vessel ? maritimeService.isVesselInCall(vessel.mmsi, vessel.id, vessel.shipName) : false;
                  return (
                    <button
                      onClick={startSafeCall}
                      disabled={isBusy}
                      className={`w-full py-3 rounded-xl text-xs font-bold shadow-lg flex items-center justify-center gap-2 transition active:scale-98 ${
                        isBusy 
                          ? 'bg-slate-800 text-amber-300 border border-amber-800/80 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950'
                      }`}
                      title={isBusy ? '현재 다른 선박과 1:1 통화 중입니다' : `050 안심번호: ${vessel.safePhoneNumber}`}
                    >
                      <Phone className="w-4 h-4" />
                      <span>{isBusy ? '현재 1:1 통화 중 (발신 불가)' : '050 안심통화'}</span>
                    </button>
                  );
                })()}

                {onStartChat && (
                  vessel.isSubscriber === false ? (
                    <div 
                      className="w-full py-2.5 bg-slate-800/80 border border-slate-700/80 text-slate-400 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-not-allowed select-none"
                      title="미가입 선박은 채팅기능을 제공할 수 없습니다. 050 안심번호 전화만 이용 가능합니다."
                    >
                      <MessageSquareOff className="w-4 h-4 text-slate-500" />
                      <span>미가입 선박 (채팅 불가 · 안심번호 전화만 지원)</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => onStartChat(vessel)}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-98 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>선박과 실시간 문자 / 채팅 교신</span>
                    </button>
                  )
                )}
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};
