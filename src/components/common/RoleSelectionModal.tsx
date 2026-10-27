import React from 'react';
import { 
  Ship, 
  Building2, 
  Smartphone, 
  Laptop, 
  CheckCircle2, 
  ShieldAlert, 
  Sparkles, 
  Info, 
  ArrowRight,
  Anchor,
  Radio
} from 'lucide-react';
import { audioHelper } from '../../utils/audio';

export type UserRoleType = 'VESSEL_CREW' | 'CONTROL_OFFICER';

interface RoleSelectionModalProps {
  isOpen: boolean;
  currentRole?: UserRoleType;
  onSelectRole: (role: UserRoleType) => void;
  onClose?: () => void;
}

export const RoleSelectionModal: React.FC<RoleSelectionModalProps> = ({
  isOpen,
  currentRole = 'VESSEL_CREW',
  onSelectRole,
  onClose
}) => {
  const [selectedRole, setSelectedRole] = React.useState<UserRoleType>(currentRole || 'VESSEL_CREW');

  React.useEffect(() => {
    if (currentRole) setSelectedRole(currentRole);
  }, [currentRole]);

  if (!isOpen) return null;

  const handleConfirm = (role: UserRoleType) => {
    audioHelper.playTap();
    onSelectRole(role);
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 select-none animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-xl w-full flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-950 font-black text-base border border-cyan-400/30">
              BC
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-base sm:text-lg tracking-tight">사용자 역할 선택</h3>
                <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-700/60 px-2 py-0.5 rounded-full font-bold">
                  BlueCall
                </span>
              </div>
              <p className="text-xs text-slate-400">접속하실 이용자 유형을 선택해 주세요</p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition text-sm"
              title="닫기"
            >
              ✕
            </button>
          )}
        </div>

        {/* Body: Two Role Cards */}
        <div className="p-4 sm:p-6 space-y-3.5">
          
          {/* Card 1: 어선 선원 (선장/선원) */}
          <div
            onClick={() => {
              setSelectedRole('VESSEL_CREW');
              audioHelper.playTap();
            }}
            onDoubleClick={() => handleConfirm('VESSEL_CREW')}
            className={`group relative p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 active:scale-[0.99] ${
              selectedRole === 'VESSEL_CREW'
                ? 'bg-gradient-to-r from-blue-950/70 to-cyan-950/50 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400/40'
                : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-white shadow-md shadow-blue-950 shrink-0">
                  <Ship className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-white text-sm sm:text-base">어선 선원 (선장 / 선원)</span>
                    <span className="text-[10px] bg-blue-900/80 text-blue-300 px-2 py-0.5 rounded font-bold border border-blue-700/60 flex items-center gap-1">
                      <Smartphone className="w-3 h-3" />
                      스마트폰 모바일 앱
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 font-medium">
                    플라잉 더치맨호 (근해통발 · 29톤 · 승선 8명)
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2.5 text-[10px] text-cyan-200/90">
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700/80">
                      ⚓ 해상 운항 지도 & 선박 식별
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700/80">
                      📞 050 안심번호 통화
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700/80">
                      🚨 원터치 조난(SOS) 발신
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700/80">
                      🫀 선원 바이탈 케어
                    </span>
                  </div>
                </div>
              </div>

              <div className="shrink-0 pt-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center transition ${
                  selectedRole === 'VESSEL_CREW'
                    ? 'bg-cyan-400 text-slate-950 shadow-md shadow-cyan-400/50'
                    : 'border-2 border-slate-700 text-transparent group-hover:border-slate-500'
                }`}>
                  <CheckCircle2 className="w-4 h-4 fill-current stroke-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: 관제센터 담당자 */}
          <div
            onClick={() => {
              setSelectedRole('CONTROL_OFFICER');
              audioHelper.playTap();
            }}
            onDoubleClick={() => handleConfirm('CONTROL_OFFICER')}
            className={`group relative p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 active:scale-[0.99] ${
              selectedRole === 'CONTROL_OFFICER'
                ? 'bg-gradient-to-r from-blue-950/70 to-indigo-950/50 border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.25)] ring-1 ring-indigo-400/40'
                : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-indigo-950 shrink-0">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-white text-sm sm:text-base">관제센터 담당자</span>
                    <span className="text-[10px] bg-indigo-900/80 text-indigo-300 px-2 py-0.5 rounded font-bold border border-indigo-700/60 flex items-center gap-1">
                      <Laptop className="w-3 h-3" />
                      노트북 / PC 관제 웹
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 font-medium">
                    해양수산부 부산본부 / 해양경찰 상황실 관제 시스템
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2.5 text-[10px] text-indigo-200/90">
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700/80">
                      🌐 전국 연근해 통합 관제 맵
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700/80">
                      ⚠️ 실시간 조난 경보 접수 & 5해리 전파
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700/80">
                      🎙️ 선박 직통 무전 교신
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700/80">
                      🤖 AI 자동 상황 요약
                    </span>
                  </div>
                </div>
              </div>

              <div className="shrink-0 pt-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center transition ${
                  selectedRole === 'CONTROL_OFFICER'
                    ? 'bg-indigo-400 text-slate-950 shadow-md shadow-indigo-400/50'
                    : 'border-2 border-slate-700 text-transparent group-hover:border-slate-500'
                }`}>
                  <CheckCircle2 className="w-4 h-4 fill-current stroke-none" />
                </div>
              </div>
            </div>
          </div>

          {/* User Request Notice Banner (개인정보 및 본인인증, 선박정보 생략 안내) */}
          <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-600/40 text-amber-200/90 space-y-1">
            <div className="flex items-center gap-2 font-bold text-xs text-amber-300">
              <Info className="w-4 h-4 shrink-0 text-amber-400" />
              <span>데모 버전 시연 안내</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-200/80 pl-6">
              본 시스템은 <strong>시연 및 심사용 데모 버전</strong>이므로, 원활한 체험을 위해 실제 서비스에 요구되는 
              <strong> 개인정보 등록, 본인인증 절차(PASS/공동인증서), 및 선박 정보(V-Pass/MMSI) 입력 단계는 모두 자동 처리되어 생략</strong>됩니다.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <p className="text-[11px] text-slate-400">
            선택한 역할로만 화면이 표시되며, 상단 [로그아웃] 시 다시 역할을 선택할 수 있습니다.
          </p>
          <button
            onClick={() => handleConfirm(selectedRole)}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition shadow-lg shadow-cyan-950 shrink-0 active:scale-95"
          >
            <span>{selectedRole === 'VESSEL_CREW' ? '어선 선원으로 접속' : '관제센터로 접속'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
