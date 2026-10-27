import React, { useState } from 'react';
import { 
  AlertOctagon, 
  Flame, 
  Anchor, 
  Wrench, 
  HeartPulse, 
  UserMinus, 
  AlertTriangle, 
  Radio, 
  X, 
  CheckCircle2, 
  Ship 
} from 'lucide-react';
import { MaritimeAccidentType, MaritimeSosEvent } from '../../types/maritime';
import { maritimeService } from '../../services/maritimeDataService';
import { audioHelper } from '../../utils/audio';

interface SosBroadcasterModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSos: MaritimeSosEvent | null;
  onResolveSos: (id: string) => void;
}

export const SosBroadcasterModal: React.FC<SosBroadcasterModalProps> = ({
  isOpen,
  onClose,
  activeSos,
  onResolveSos
}) => {
  const [selectedAccident, setSelectedAccident] = useState<MaritimeAccidentType>('기관고장');
  const [sosNotes, setSosNotes] = useState('');

  if (!isOpen) return null;

  const handleSendSos = () => {
    audioHelper.playSOS();
    maritimeService.triggerSos(selectedAccident, sosNotes);
  };

  const handleCancelSos = () => {
    audioHelper.playTap();
    if (activeSos) {
      onResolveSos(activeSos.id);
    }
    onClose();
  };

  const accidentTypes: { type: MaritimeAccidentType; icon: React.ReactNode; desc: string }[] = [
    { type: '기관고장', icon: <Wrench className="w-5 h-5 text-amber-400" />, desc: '주기관 정지, 추진 불가, 조류 표류' },
    { type: '화재/폭발', icon: <Flame className="w-5 h-5 text-red-500" />, desc: '기관실·조타실 화재, 소화 작업' },
    { type: '침수/전복', icon: <Anchor className="w-5 h-5 text-blue-400" />, desc: '선체 파공 침수, 복원성 상실 위기' },
    { type: '응급환자', icon: <HeartPulse className="w-5 h-5 text-rose-400" />, desc: '선원 골절·의식불명·심혈관 응급' },
    { type: '해상추락', icon: <UserMinus className="w-5 h-5 text-orange-400" />, desc: '선원 해상 추락, 익수자 발생' },
    { type: '충돌위험', icon: <AlertTriangle className="w-5 h-5 text-yellow-400" />, desc: '타 선박과 충돌 임박 또는 접촉사고' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-red-800/80 rounded-3xl max-w-md w-full overflow-hidden text-slate-100 shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-red-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-red-600 text-white shadow-lg shadow-red-950">
              <AlertOctagon className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-black text-white text-base">원터치 SOS 해상 조난 전파</h3>
              <p className="text-[11px] text-red-200">주변 선박 & 해경 122 동시 상황 전파</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          
          {/* Active SOS State View */}
          {activeSos && activeSos.status === 'ACTIVE' ? (
            <div className="space-y-4 text-center">
              <div className="p-6 bg-red-950/70 border-2 border-red-500 rounded-3xl space-y-3 animate-pulse">
                <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center mx-auto text-white shadow-2xl">
                  <Radio className="w-8 h-8 animate-spin" />
                </div>
                <h4 className="text-xl font-black text-white">SOS 조난 신호 송신 중</h4>
                <p className="text-xs text-red-200">
                  주변 선박 7척 및 해양경찰청 122로 사고 정보와 실시간 GPS가 전파되고 있습니다.
                </p>
              </div>

              {/* Surrounding Responding Vessels (PDF 4p) */}
              <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 text-left space-y-2.5">
                <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Ship className="w-4 h-4 text-cyan-400" />
                  <span>구조 참고 공공데이터 (인근 선박 응답 현황)</span>
                </div>

                <div className="space-y-2">
                  {activeSos.respondingVessels.map((v, i) => (
                    <div key={i} className="p-2.5 bg-slate-900 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-white">{v.vesselName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          거리 {v.distanceNM} NM · 도착 예상 {v.etaMinutes}분
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-950 text-blue-400 border border-blue-900">
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
                조난 상황 종료 및 해제
              </button>
            </div>
          ) : (
            /* SOS Trigger Setup */
            <div className="space-y-4">
              <div className="text-xs font-bold text-slate-300">
                1. 사고 유형을 선택하세요
              </div>

              <div className="grid grid-cols-2 gap-2">
                {accidentTypes.map(item => (
                  <button
                    key={item.type}
                    onClick={() => {
                      audioHelper.playTap();
                      setSelectedAccident(item.type);
                    }}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                      selectedAccident === item.type
                        ? 'bg-red-950/60 border-red-500 shadow-md ring-1 ring-red-500'
                        : 'bg-slate-950 hover:bg-slate-800/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-white">{item.type}</span>
                      {item.icon}
                    </div>
                    <span className="text-[10px] text-slate-400 leading-tight">{item.desc}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">
                  2. 현장 상황 메모 (선택 사항)
                </label>
                <textarea
                  rows={2}
                  value={sosNotes}
                  onChange={e => setSosNotes(e.target.value)}
                  placeholder="예: 승선원 3명 전원 구명동의 착용, 기관실 침수 20cm"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="p-3 bg-red-950/30 border border-red-900/40 rounded-xl text-[11px] text-red-300 space-y-1">
                <div className="font-bold flex items-center gap-1 text-red-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-red-400" />
                  원터치 자동 발송 안내:
                </div>
                <div>• 본선 GPS 위치, 어선 식별번호, 선장 정보 자동 전파</div>
                <div>• 주변 5해리 내 조업 선박 지도 화면에 실시간 경보 팝업</div>
              </div>

              <button
                onClick={handleSendSos}
                className="w-full py-4 bg-gradient-to-r from-red-600 via-rose-600 to-red-500 hover:from-red-500 hover:to-rose-500 active:scale-98 text-white rounded-2xl text-sm font-black shadow-xl shadow-red-950 flex items-center justify-center gap-2 transition"
              >
                <Radio className="w-5 h-5 animate-pulse" />
                <span>주변 선박 & 해경 122에 즉시 SOS 발신</span>
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
