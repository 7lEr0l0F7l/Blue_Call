import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  Wifi, 
  HeartPulse, 
  Users, 
  MessageSquare, 
  Sparkles, 
  Radio, 
  ShieldCheck, 
  Search,
  Phone,
  ArrowLeft,
  Ship,
  Check,
  CheckCheck,
  PlusCircle,
  X,
  Compass,
  Navigation,
  Clock,
  Waves,
  Activity,
  Video,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Edit3,
  Headphones,
  Globe,
  Thermometer
} from 'lucide-react';
import { MaritimeQuickPhrasesDropdown } from '../chat/MaritimeQuickPhrasesDropdown';
import { 
  CrewMember, 
  BlueBotMessage, 
  VesselChatHistory, 
  VesselChatMessage, 
  MaritimeVessel 
} from '../../types/maritime';
import { maritimeService } from '../../services/maritimeDataService';
import { audioHelper } from '../../utils/audio';
import { getShortCompassDirection } from '../../utils/maritimeNav';

// 다양한 선원 상태 메시지 (User Requirement 5: 다양해진 선원 본인 상태 메시지)
export const DIVERSE_CREW_STATUS_MESSAGES = [
  '조타실 통신 당직 및 안전 항해 지휘 중',
  '갑판 투망 및 양망 어구 정상 결박 완료',
  '갑판 물청소 및 해수 세척 작업 진행 중',
  '기관실 주기관 및 발전기 유압/온도 일상 점검 완료',
  '1시간째 약한 멀미 지속 (선내 상비약 복용 후 조타실 휴식)',
  '야간 연장 조업으로 인한 수면 부족 및 피로도 누적',
  '선원실에서 스타링크 위성 Wi-Fi로 가족과 영상 통화 중',
  '선미 와이어로프 및 안전 난간 결속 상태 보강 완료',
  '닻줄 및 윈치 작동 상태 양호, 투묘 준비 대기',
  '선내 주방 식자재 정리 및 조업 후 따뜻한 식사 준비 중',
  '해상 원격의료 화상 상담 완료 및 처방약 복용 중',
  '선박 구명조끼 및 구명환 비치 상태 전수 점검 완료'
];

interface CrewManagementViewProps {
  initialChatVesselId?: string | null;
  onOpenCall?: (vessel: MaritimeVessel) => void;
}

export const CrewManagementView: React.FC<CrewManagementViewProps> = ({
  initialChatVesselId,
  onOpenCall
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'VESSEL_CHATS' | 'BOT' | 'CHANNELS' | 'CREW_LIST'>('VESSEL_CHATS');
  const [vesselChats, setVesselChats] = useState<VesselChatHistory[]>(maritimeService.getVesselChatHistories());
  const [selectedChatId, setSelectedChatId] = useState<string | null>(initialChatVesselId || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [chatInputText, setChatInputText] = useState('');
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [newChatSearch, setNewChatSearch] = useState('');

  // Bot states
  const [botMessages, setBotMessages] = useState<BlueBotMessage[]>(maritimeService.getBotMessages());
  const [botInputText, setBotInputText] = useState('');
  const [isBotThinking, setIsBotThinking] = useState(false);

  // Crew states
  const [crew, setCrew] = useState<CrewMember[]>(maritimeService.getCrew());
  const [editingCrewId, setEditingCrewId] = useState<string | null>(null);
  const [editNoteText, setEditNoteText] = useState<string>('');

  // Modal states for Starlink and Telemedicine channels
  const [isStarlinkModalOpen, setIsStarlinkModalOpen] = useState(false);
  const [isTelemedicineModalOpen, setIsTelemedicineModalOpen] = useState(false);
  const [telemedicineSelectedCrew, setTelemedicineSelectedCrew] = useState<string>('crew-3'); // Default to 김광준 (멀미)
  const [telemedicineSymptom, setTelemedicineSymptom] = useState<string>('멀미');
  const [telemedicineConsultationActive, setTelemedicineConsultationActive] = useState(false);
  const [starlinkTesting, setStarlinkTesting] = useState(false);
  const [starlinkSpeed, setStarlinkSpeed] = useState({ dl: 154, ul: 28, ping: 38 });
  const [starlinkPriorityMode, setStarlinkPriorityMode] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const botMessagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialChatVesselId) {
      setSelectedChatId(initialChatVesselId);
      setActiveSubTab('VESSEL_CHATS');
    }
  }, [initialChatVesselId]);

  useEffect(() => {
    const unsub = maritimeService.subscribe((event) => {
      if (event === 'VESSEL_CHAT_UPDATED') {
        setVesselChats([...maritimeService.getVesselChatHistories()]);
      } else if (event === 'CREW_UPDATED') {
        setCrew(maritimeService.getCrew());
      } else if (event === 'BOT_MESSAGE') {
        setBotMessages([...maritimeService.getBotMessages()]);
        setIsBotThinking(false);
      }
    });
    return unsub;
  }, []);

  // Auto scroll messages in active vessel chat room
  useEffect(() => {
    if (selectedChatId) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedChatId, vesselChats]);

  // Auto scroll messages in BlueBot AI chat
  useEffect(() => {
    if (activeSubTab === 'BOT') {
      botMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [botMessages, isBotThinking, activeSubTab]);

  const activeChat = vesselChats.find(
    c => c.id === selectedChatId || c.vesselMmsi === selectedChatId || c.vesselId === selectedChatId
  );

  const totalUnreadCount = vesselChats.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  const handleSelectChat = (chatId: string) => {
    audioHelper.playTap();
    setSelectedChatId(chatId);
    maritimeService.markChatAsRead(chatId);
  };

  const handleSendVesselMessage = (textToSend?: string) => {
    const text = textToSend || chatInputText;
    if (!text.trim() || !selectedChatId) return;

    audioHelper.playTap();
    maritimeService.sendVesselChatMessage(selectedChatId, text);
    setChatInputText('');
  };

  const handleSendBotMessage = (textToSend?: string) => {
    const text = textToSend || botInputText;
    if (!text.trim()) return;
    audioHelper.playTap();
    setIsBotThinking(true);
    maritimeService.sendBotMessage(text);
    // User Requirement 1: 대화창에 바로 내가 입력한 대화가 출력되도록 즉시 상태 반영
    setBotMessages([...maritimeService.getBotMessages()]);
    setBotInputText('');
  };

  // 선장님의 상태 판단 (정상, 주의, 위험) 설정: 선원이 직접 입력한 프로필 메시지는 덮어쓰지 않고 보존
  const handleConditionChange = (id: string, newCondition: '정상' | '주의' | '위험') => {
    audioHelper.playTap();
    maritimeService.updateCrewCondition(id, newCondition);
  };

  // 선원 본인 상태 메시지 다양화 순환 (User Requirement 5)
  const handleCycleCrewMessage = (crewId: string, currentNote?: string) => {
    audioHelper.playTap();
    const currentIndex = DIVERSE_CREW_STATUS_MESSAGES.indexOf(currentNote || '');
    const nextIndex = (currentIndex + 1) % DIVERSE_CREW_STATUS_MESSAGES.length;
    const nextMsg = DIVERSE_CREW_STATUS_MESSAGES[nextIndex];
    maritimeService.updateCrewNote(crewId, nextMsg);
  };

  const handleStartEditNote = (crewId: string, currentNote?: string) => {
    audioHelper.playTap();
    setEditingCrewId(crewId);
    setEditNoteText(currentNote || '');
  };

  const handleSaveEditNote = (crewId: string) => {
    if (!editNoteText.trim()) return;
    audioHelper.playTap();
    maritimeService.updateCrewNote(crewId, editNoteText.trim());
    setEditingCrewId(null);
  };

  const handleCancelEditNote = () => {
    audioHelper.playTap();
    setEditingCrewId(null);
  };

  const handleStartNewChatWithVessel = (v: MaritimeVessel) => {
    audioHelper.playTap();
    const chat = maritimeService.createOrGetChatWithVessel(v);
    setSelectedChatId(chat.id);
    setIsNewChatModalOpen(false);
  };

  const handleTriggerCallFromChat = (chat: VesselChatHistory) => {
    audioHelper.playTap();
    const matchedVessel = maritimeService.getVessels().find(v => v.mmsi === chat.vesselMmsi || v.id === chat.vesselId);
    if (matchedVessel && onOpenCall) {
      onOpenCall(matchedVessel);
    } else {
      audioHelper.playRadioChirp();
      alert(`[안심번호 0504 연동]\n상대선박: ${chat.shipName} (${chat.captainName})\n안심번호: ${chat.safePhoneNumber}\n\n음성 통화를 발신합니다.`);
    }
  };

  // Filtered vessel chats
  const filteredChats = vesselChats.filter(chat => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      chat.shipName.toLowerCase().includes(q) ||
      chat.captainName.toLowerCase().includes(q) ||
      chat.vesselMmsi.includes(q) ||
      chat.callSign.toLowerCase().includes(q) ||
      chat.vesselType.toLowerCase().includes(q) ||
      chat.lastMessage.toLowerCase().includes(q)
    );
  });

  // Filtered vessels for new chat modal
  const allVessels = maritimeService.getVessels().filter(v => !v.isOwnShip);
  const filteredCandidates = allVessels.filter(v => {
    const q = newChatSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      v.shipName.toLowerCase().includes(q) ||
      v.captainName.toLowerCase().includes(q) ||
      v.mmsi.includes(q) ||
      v.callSign.toLowerCase().includes(q) ||
      v.vesselType.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex-1 flex flex-col p-3 bg-slate-950 text-slate-100 overflow-hidden select-none">
      
      {/* Top Main Navigation Tabs (선박 대화 | BlueBot AI | 주요 채널 | 선원 컨디션) */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-slate-900/90 rounded-xl border border-slate-800 mb-3 text-[11px] font-bold">
        <button
          onClick={() => {
            audioHelper.playTap();
            setActiveSubTab('VESSEL_CHATS');
          }}
          className={`py-1.5 px-1 rounded-lg transition flex items-center justify-center gap-1 relative ${
            activeSubTab === 'VESSEL_CHATS' 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>선박 대화</span>
          {totalUnreadCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => {
            audioHelper.playTap();
            setActiveSubTab('BOT');
          }}
          className={`py-1.5 px-1 rounded-lg transition flex items-center justify-center gap-1 ${
            activeSubTab === 'BOT' 
              ? 'bg-cyan-600 text-white shadow-md' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>BlueBot AI</span>
        </button>

        <button
          onClick={() => {
            audioHelper.playTap();
            setActiveSubTab('CHANNELS');
          }}
          className={`py-1.5 px-1 rounded-lg transition flex items-center justify-center gap-1 ${
            activeSubTab === 'CHANNELS' 
              ? 'bg-purple-600 text-white shadow-md' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>주요 채널</span>
        </button>

        <button
          onClick={() => {
            audioHelper.playTap();
            setActiveSubTab('CREW_LIST');
          }}
          className={`py-1.5 px-1 rounded-lg transition flex items-center justify-center gap-1 ${
            activeSubTab === 'CREW_LIST' 
              ? 'bg-emerald-600 text-white shadow-md' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>선원 케어</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 1. VESSEL CHATS TAB (선박 대화 히스토리 및 대화방) */}
      {/* ======================================================== */}
      {activeSubTab === 'VESSEL_CHATS' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          
          {/* VIEW A: Conversation List Mode */}
          {!selectedChatId && (
            <div className="flex-1 flex flex-col overflow-hidden">
              
              {/* My Ship Status Banner (User Requirement: 본선 선장 최재현 / 플라잉 더치맨호) */}
              <div className="bg-gradient-to-r from-blue-950/80 via-slate-900 to-cyan-950/70 p-2.5 rounded-2xl border border-blue-800/60 shadow-lg mb-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-400/50 flex items-center justify-center text-blue-300">
                    <Ship className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-white">플라잉 더치맨호</span>
                      <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded font-bold border border-blue-500/30">
                        최재현 선장 (본선)
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-2 font-mono">
                      <span>MMSI: 440182940</span>
                      <span>호출부호: DS8291</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    교신 대기
                  </span>
                  <span className="text-[9px] text-slate-500 mt-0.5">승선원 4명 정상</span>
                </div>
              </div>

              {/* Action & Search Bar */}
              <div className="flex items-center gap-1.5 mb-2.5">
                <div className="flex-1 relative flex items-center bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 focus-within:border-blue-500">
                  <Search className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="선박명, 선장, MMSI, 호출부호 검색..."
                    className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="text-slate-500 hover:text-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => {
                    audioHelper.playTap();
                    setIsNewChatModalOpen(true);
                  }}
                  className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[11px] font-bold flex items-center gap-1 shadow-sm shrink-0 transition active:scale-95"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>새 교신</span>
                </button>
              </div>

              {/* Chat History Header Title */}
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 px-1 mb-1.5">
                <span>최근 교신 선박 히스토리 ({filteredChats.length}건)</span>
                <span className="text-[10px] text-slate-500 font-normal">터치하여 대화창 열기</span>
              </div>

              {/* Chat List Scrollable Feed */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
                {filteredChats.length === 0 ? (
                  <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-slate-800/60 my-4 text-xs text-slate-400 space-y-2">
                    <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
                    <p>검색된 선박 교신 기록이 없습니다.</p>
                  </div>
                ) : (
                  filteredChats.map(chat => {
                    // Badge styles by vessel type
                    const isCoastGuard = chat.vesselType.includes('해경') || chat.shipName.includes('해경');
                    const isVts = chat.vesselType.includes('관제') || chat.shipName.includes('VTS');
                    const isCargo = chat.vesselType.includes('화물') || chat.vesselType.includes('상선');
                    
                    return (
                      <div
                        key={chat.id}
                        onClick={() => handleSelectChat(chat.id)}
                        className={`p-3 rounded-2xl border transition cursor-pointer relative shadow-sm ${
                          chat.unreadCount > 0 
                            ? 'bg-slate-900/95 border-blue-500/60 ring-1 ring-blue-500/30' 
                            : 'bg-slate-900/70 hover:bg-slate-900 border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        {/* Top Row: Vessel Name, Captain, Type, Time */}
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                              isCoastGuard 
                                ? 'bg-purple-950/80 text-purple-400 border-purple-800/60'
                                : isVts
                                ? 'bg-cyan-950/80 text-cyan-400 border-cyan-800/60'
                                : isCargo
                                ? 'bg-amber-950/80 text-amber-400 border-amber-800/60'
                                : 'bg-blue-950/80 text-blue-400 border-blue-800/60'
                            }`}>
                              <Ship className="w-4 h-4" />
                            </div>

                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-black text-white">{chat.shipName}</span>
                                <span className="text-[10px] text-slate-300 font-bold">
                                  {chat.captainName}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400 flex items-center gap-1.5 font-mono">
                                <span className={`px-1 py-0.1 rounded text-[9px] font-bold ${
                                  isCoastGuard
                                    ? 'bg-purple-900/40 text-purple-300'
                                    : isVts
                                    ? 'bg-cyan-900/40 text-cyan-300'
                                    : 'bg-slate-800 text-slate-300'
                                }`}>
                                  {chat.vesselType}
                                </span>
                                <span>MMSI: {chat.vesselMmsi}</span>
                                {chat.distanceNM !== undefined && (
                                  <span className="text-amber-400 font-bold">{chat.distanceNM} NM</span>
                                )}
                                {(() => {
                                  const vObj = maritimeService.getVessels().find(v => v.mmsi === chat.vesselMmsi || v.id === chat.vesselId);
                                  if (!vObj) return null;
                                  return (
                                    <span className="text-emerald-400/90 font-mono">
                                      {vObj.speedKnots}kts · {vObj.headingDeg}°({getShortCompassDirection(vObj.headingDeg)})
                                    </span>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end">
                            <span className="text-[10px] text-slate-400 font-medium">{chat.lastTimestamp}</span>
                            {chat.unreadCount > 0 && (
                              <span className="mt-1 px-1.5 py-0.2 rounded-full bg-blue-500 text-white text-[9px] font-black animate-pulse">
                                {chat.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Bottom Row: Last Message snippet */}
                        <div className="text-[11px] text-slate-300 line-clamp-1 pl-10 font-medium">
                          {chat.lastMessage}
                        </div>

                        {/* Quick Action Badges */}
                        <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] pl-10">
                          <span className="text-slate-400 font-mono flex items-center gap-1">
                            <Phone className="w-3 h-3 text-emerald-400" />
                            {chat.safePhoneNumber}
                          </span>
                          
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTriggerCallFromChat(chat);
                              }}
                              className="px-2 py-0.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/80 font-bold flex items-center gap-1 transition"
                            >
                              <Phone className="w-2.5 h-2.5" />
                              <span>050 통화</span>
                            </button>
                            <span className="text-blue-400 font-bold">
                              대화 보기 &gt;
                            </span>
                          </div>
                        </div>

                      </div>
                    );
                  })
                )}
              </div>

            </div>
          )}

          {/* VIEW B: Dedicated Vessel Chat Room Mode */}
          {selectedChatId && activeChat && (
            <div className="flex-1 flex flex-col bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
              
              {/* Chat Room Header */}
              <div className="p-2.5 bg-gradient-to-r from-slate-900 via-slate-950 to-blue-950 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      audioHelper.playTap();
                      setSelectedChatId(null);
                    }}
                    className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-white transition"
                    title="목록으로"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-400/40 flex items-center justify-center text-blue-300 shrink-0">
                    <Ship className="w-4 h-4" />
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-xs font-black text-white">{activeChat.shipName}</h3>
                      <span className="text-[10px] text-slate-300 font-bold">{activeChat.captainName}</span>
                    </div>
                    <div className="text-[9px] text-slate-400 flex flex-wrap items-center gap-1.5 font-mono">
                      <span>{activeChat.vesselType}</span>
                      <span>MMSI: {activeChat.vesselMmsi}</span>
                      {activeChat.distanceNM !== undefined && (
                        <span className="text-amber-400 font-bold">{activeChat.distanceNM} NM</span>
                      )}
                      {(() => {
                        const vObj = maritimeService.getVessels().find(v => v.mmsi === activeChat.vesselMmsi || v.id === activeChat.vesselId);
                        if (!vObj) return null;
                        return (
                          <>
                            <span className="text-cyan-400 font-bold">속력 {vObj.speedKnots}kts</span>
                            <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                              <Compass className="w-2.5 h-2.5 text-emerald-400" />
                              방위 {vObj.headingDeg}°({getShortCompassDirection(vObj.headingDeg)})
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleTriggerCallFromChat(activeChat)}
                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-bold flex items-center gap-1 shadow transition active:scale-95"
                  >
                    <Phone className="w-3 h-3" />
                    <span>050 통화</span>
                  </button>
                </div>
              </div>

              {/* Vessel Safety Channel Banner */}
              <div className="px-3 py-1 bg-slate-950/80 border-b border-slate-800 text-[10px] text-slate-400 flex items-center justify-between font-mono">
                <span className="flex items-center gap-1 text-cyan-400 font-bold">
                  <Radio className="w-3 h-3 text-cyan-400" />
                  연안 VHF/Starlink 보안 암호화 채널 연동
                </span>
                <span>발신자: 플라잉 더치맨호 (최재현 선장)</span>
              </div>

              {/* Messages Bubble Stream */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                {activeChat.messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.isOwnShip ? 'items-end' : 'items-start'}`}
                  >
                    {/* Sender Name Label */}
                    <span className="text-[9px] font-medium text-slate-400 mb-0.5 px-1 flex items-center gap-1">
                      {msg.isOwnShip ? (
                        <>
                          <span className="text-blue-300 font-bold">본선 플라잉 더치맨호</span>
                          <span className="text-slate-400">(최재현 선장)</span>
                        </>
                      ) : (
                        <>
                          <span className="text-slate-300 font-bold">{msg.senderName}</span>
                        </>
                      )}
                    </span>

                    {/* Speech Bubble */}
                    <div className={`max-w-[85%] rounded-2xl p-2.5 text-xs leading-relaxed whitespace-pre-line shadow ${
                      msg.isOwnShip
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-slate-950 border border-slate-800 text-slate-100 rounded-tl-none'
                    }`}>
                      {msg.text}
                    </div>

                    {/* Timestamp & read receipts */}
                    <div className="flex items-center gap-1 text-[9px] text-slate-500 mt-0.5 px-1 font-mono">
                      <span>{msg.timestamp}</span>
                      {msg.isOwnShip && (
                        <span className="text-blue-400 font-bold flex items-center">
                          <CheckCheck className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Vertical Maritime Quick Phrases Dropdown with Triangle Toggle (User Requirement: 상하 리스트 & 삼각형 토글) */}
              <MaritimeQuickPhrasesDropdown
                onSelectPhrase={(phrase) => handleSendVesselMessage(phrase)}
                dropDirection="up"
              />

              {/* Chat Input Bar */}
              <div className="p-2 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
                <input
                  type="text"
                  value={chatInputText}
                  onChange={e => setChatInputText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendVesselMessage()}
                  placeholder="최재현 선장 명의로 교신 메시지 입력..."
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={() => handleSendVesselMessage()}
                  className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition shadow active:scale-95"
                  title="전송"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

            </div>
          )}

        </div>
      )}

      {/* ======================================================== */}
      {/* 2. BLUEBOT AI CHAT VIEW (마음건강 & 어업규정 & 기상 AI) */}
      {/* ======================================================== */}
      {activeSubTab === 'BOT' && (
        <div className="flex-1 flex flex-col bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-inner">
          {/* Bot Card Hero Banner */}
          <div className="p-3 bg-gradient-to-r from-blue-900/60 to-cyan-950/80 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-extrabold text-white">BlueBot AI 해양 비서</h3>
                <p className="text-[10px] text-cyan-200">해양·수산·조업 규정 & 항해안전 & 선원 케어 지능형 비서</p>
              </div>
            </div>
            <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-900 font-bold">
              AI ONLINE
            </span>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {botMessages.map(msg => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'USER' ? 'items-end' : 'items-start'}`}
              >
                <div className={`max-w-[85%] rounded-2xl p-2.5 text-xs leading-relaxed whitespace-pre-line ${
                  msg.sender === 'USER'
                    ? 'bg-blue-600 text-white shadow'
                    : 'bg-slate-950 border border-slate-800 text-slate-200 shadow'
                }`}>
                  {msg.text}
                </div>
                <span className="text-[9px] text-slate-500 mt-1 px-1">{msg.timestamp}</span>

                {/* Suggestions chips */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {msg.suggestions.map((sug, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendBotMessage(sug)}
                        className="px-2 py-1 bg-slate-950 hover:bg-slate-800 border border-cyan-900/60 text-cyan-300 rounded-full text-[10px] font-medium transition"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isBotThinking && (
              <div className="flex flex-col items-start animate-fadeIn">
                <div className="bg-slate-950 border border-cyan-800/80 rounded-2xl p-2.5 text-xs text-cyan-300 flex items-center gap-2 shadow">
                  <Bot className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  <span className="font-medium">BlueBot이 해양 규정 및 법령 정보를 분석하고 있습니다...</span>
                </div>
              </div>
            )}
            <div ref={botMessagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="p-2 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={botInputText}
              onChange={e => setBotInputText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendBotMessage()}
              placeholder="금어기, 어업규정, 기상, 항해술, 선박 엔진 질의..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              onClick={() => handleSendBotMessage()}
              className="p-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. KEY CHANNELS VIEW (Starlink & 원격의료 & 커뮤니티) */}
      {/* ======================================================== */}
      {activeSubTab === 'CHANNELS' && (
        <div className="flex-1 overflow-y-auto space-y-3 pr-0.5">
          {/* Channel 1: Starlink Satellite */}
          <div 
            onClick={() => {
              audioHelper.playTap();
              setIsStarlinkModalOpen(true);
            }}
            className="bg-slate-900/90 hover:bg-slate-800/90 transition cursor-pointer rounded-2xl p-3.5 border border-purple-900/40 hover:border-purple-500/60 space-y-2 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-950 text-purple-400 border border-purple-800">
                  <Wifi className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Starlink 위성통신 지원</span>
                    <span className="text-[9px] bg-purple-900/70 text-purple-300 px-1 rounded font-normal">터치하여 진단</span>
                  </h4>
                  <p className="text-[10px] text-slate-400">외해 통신 음영 해소 및 선내 초고속 Wi-Fi</p>
                </div>
              </div>
              <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                정상 연동
              </span>
            </div>
            <div className="p-2 bg-slate-950 rounded-xl text-[10px] text-slate-300 flex items-center justify-between font-mono">
              <span>수신: Elevation 42° (안테나 추적 중)</span>
              <span className="text-purple-300 font-bold">{starlinkSpeed.dl} Mbps (핑 {starlinkSpeed.ping}ms)</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px]">
              <span className="text-slate-400">선내 연결 기기 5대 정상</span>
              <span className="text-purple-400 font-bold hover:underline">상태 진단 및 설정 열기 ➜</span>
            </div>
          </div>

          {/* Channel 2: Marine Telemedicine 24h */}
          <div 
            onClick={() => {
              audioHelper.playRadioChirp();
              setIsTelemedicineModalOpen(true);
            }}
            className="bg-slate-900/90 hover:bg-slate-800/90 transition cursor-pointer rounded-2xl p-3.5 border border-rose-900/40 hover:border-rose-500/60 space-y-2 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-950 text-rose-400 border border-rose-800">
                  <HeartPulse className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>해상 원격 의료지원 (24시간)</span>
                    <span className="text-[9px] bg-rose-900/70 text-rose-300 px-1 rounded font-normal">전문의 대기</span>
                  </h4>
                  <p className="text-[10px] text-slate-400">국립중앙의료원 해상응급센터 전문의 화상 연결</p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  audioHelper.playRadioChirp();
                  setIsTelemedicineModalOpen(true);
                }}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-bold shadow transition"
              >
                원격 진료 신청
              </button>
            </div>
            <div className="p-2 bg-slate-950 rounded-xl text-[10px] text-slate-300 flex items-center justify-between">
              <span className="text-rose-300 font-medium">선내 구급함 3호(멀미약) 구비 완료</span>
              <span className="text-slate-400 font-mono">평균 응답: 1분 이내</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px]">
              <span className="text-slate-400">현재 승선원 2명 주의 관찰 중</span>
              <span className="text-rose-400 font-bold hover:underline">화상 상담실 입장 ➜</span>
            </div>
          </div>


          {/* Channel 4: 24시 정신건강 상담전화 (User Requirement 4) */}
          <div className="bg-slate-900/90 rounded-2xl p-3.5 border border-teal-900/50 space-y-2.5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-teal-950 text-teal-400 border border-teal-800">
                  <Headphones className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>24시 정신건강 상담전화</span>
                    <span className="text-[9px] bg-teal-900/80 text-teal-300 px-1 rounded font-normal">공공 상담전화</span>
                  </h4>
                  <div className="text-sm font-black text-teal-300 font-mono tracking-wide mt-0.5">
                    1577-0199
                  </div>
                </div>
              </div>
              <a
                href="tel:1577-0199"
                onClick={() => audioHelper.playRadioChirp()}
                className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-[10px] font-bold shadow flex items-center gap-1 transition active:scale-95"
              >
                <Phone className="w-3 h-3" />
                <span>전화 연결</span>
              </a>
            </div>

            <div className="p-2.5 bg-slate-950 rounded-xl text-[10px] text-slate-300 grid grid-cols-2 gap-2 font-mono border border-slate-800/80">
              <div>
                <span className="text-slate-500 block mb-0.5">담당 기관명</span>
                <span className="text-teal-200 font-sans font-semibold">보건복지부 / 국립정신건강센터</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">운영 시간</span>
                <span className="text-emerald-400 font-sans font-bold">24시간 연중무휴 (365일 상시 운영)</span>
              </div>
            </div>
          </div>

          {/* Channel 5: 외국인 선원 상담 - 한국선원복지고용센터 (User Requirement 4) */}
          <div className="bg-slate-900/90 rounded-2xl p-3.5 border border-amber-900/50 space-y-2.5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-950 text-amber-400 border border-amber-800">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>외국인 선원 상담 (고충 및 권익 보호)</span>
                    <span className="text-[9px] bg-amber-900/80 text-amber-300 px-1 rounded font-normal">다국어 지원</span>
                  </h4>
                  <div className="text-sm font-black text-amber-300 font-mono tracking-wide mt-0.5">
                    1566-3151
                  </div>
                </div>
              </div>
              <a
                href="tel:1566-3151"
                onClick={() => audioHelper.playRadioChirp()}
                className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[10px] font-bold shadow flex items-center gap-1 transition active:scale-95"
              >
                <Phone className="w-3 h-3" />
                <span>전화 연결</span>
              </a>
            </div>

            <div className="p-2.5 bg-slate-950 rounded-xl text-[10px] text-slate-300 grid grid-cols-2 gap-2 font-mono border border-slate-800/80">
              <div>
                <span className="text-slate-500 block mb-0.5">담당 기관명</span>
                <span className="text-amber-200 font-sans font-semibold">한국선원복지고용센터</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">운영 시간</span>
                <span className="text-amber-300 font-sans font-bold">평일 09:00 ~ 18:00 (공휴일 야간 자동응대)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. CREW CONDITION CARE VIEW (최재현 선장 & 승선원 케어) */}
      {/* ======================================================== */}
      {activeSubTab === 'CREW_LIST' && (
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span className="font-bold text-slate-300">플라잉 더치맨호 승선원 명부 ({crew.length}명)</span>
            <span className="font-mono text-[10px]">스마트 밴드 생체 텔레메트리</span>
          </div>

          <div className="space-y-2.5">
            {crew.map(member => (
              <div
                key={member.id}
                className="p-3 bg-slate-900/90 rounded-2xl border border-slate-800 flex flex-col gap-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-white text-sm">{member.name}</span>
                    <span className="text-[10px] bg-slate-800 text-cyan-300 px-1.5 py-0.5 rounded font-bold">
                      {member.role}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-extrabold border ${
                      member.condition === '정상'
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-900'
                        : member.condition === '주의'
                        ? 'bg-amber-950 text-amber-400 border-amber-900'
                        : 'bg-red-950 text-red-400 border-red-900 animate-pulse'
                    }`}>
                      {member.condition}
                    </span>
                  </div>

                  {/* Condition toggle buttons */}
                  <div className="flex items-center gap-1">
                    {(['정상', '주의', '위험'] as const).map(c => (
                      <button
                        key={c}
                        onClick={() => handleConditionChange(member.id, c)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                          member.condition === c
                            ? c === '정상' ? 'bg-emerald-600 text-white' : c === '주의' ? 'bg-amber-600 text-white' : 'bg-red-600 text-white shadow'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Health Metrics (User Requirement 3: 체온, 활동 시간 정보 추가) */}
                <div className="text-[10px] text-slate-400 flex items-center flex-wrap gap-x-3 gap-y-1 font-mono">
                  <span>심박: <strong className="text-slate-200">{member.heartRateBpm} bpm</strong></span>
                  <span>체온: <strong className={member.bodyTemperature && member.bodyTemperature >= 37.5 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>{member.bodyTemperature ?? 36.5}°C</strong></span>
                  <span>활동 시간: <strong className="text-cyan-300 font-sans font-semibold">{member.activityHours ?? '당직 4시간 10분'}</strong></span>
                  <span>피로도: <strong className={member.fatigueScore > 50 ? 'text-amber-400' : 'text-slate-200'}>{member.fatigueScore}/100</strong></span>
                  <span>체크: {member.lastHealthCheck}</span>
                </div>

                {/* 선원 본인 작성 프로필 / 상태 메시지 (User Requirement 5) */}
                <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-2 text-[11px]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
                        member.condition === '위험'
                          ? 'bg-red-950 text-red-300 border border-red-800'
                          : member.condition === '주의'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                      }`}>
                        선원 본인 입력 상태
                      </span>
                      <span className="text-[9px] text-slate-400">선원 본인 작성 프로필</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCycleCrewMessage(member.id, member.notes)}
                        title="다양한 메시지로 변경 (데모)"
                        className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[10px] flex items-center gap-1 transition"
                      >
                        <RefreshCw className="w-2.5 h-2.5" />
                        <span>메시지 순환</span>
                      </button>
                      <button
                        onClick={() => handleStartEditNote(member.id, member.notes)}
                        title="선원 본인 프로필 직접 수정"
                        className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white rounded text-[10px] flex items-center gap-1 transition"
                      >
                        <Edit3 className="w-2.5 h-2.5" />
                        <span>직접 수정</span>
                      </button>
                    </div>
                  </div>

                  {editingCrewId === member.id ? (
                    <div className="space-y-1.5 pt-1">
                      <input
                        type="text"
                        value={editNoteText}
                        onChange={(e) => setEditNoteText(e.target.value)}
                        placeholder="선원 본인의 현재 상태 메시지를 입력하세요..."
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-cyan-600 rounded-lg text-white text-xs outline-none focus:ring-1 focus:ring-cyan-400"
                        autoFocus
                      />
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={handleCancelEditNote}
                          className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px]"
                        >
                          취소
                        </button>
                        <button
                          onClick={() => handleSaveEditNote(member.id)}
                          className="px-2 py-0.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded text-[10px]"
                        >
                          저장
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="font-medium text-slate-200 leading-snug pl-0.5">
                      {member.notes || '조타실 정상 통신 당직 및 안전 운항 지휘 중'}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: 새 선박과 교신 시작 (Surrounding vessels selection) */}
      {/* ======================================================== */}
      {isNewChatModalOpen && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm p-4 flex flex-col justify-end animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-4 max-h-[85%] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Ship className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-black text-white">새 선박과 교신 시작</h3>
              </div>
              <button
                onClick={() => setIsNewChatModalOpen(false)}
                className="p-1 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Candidate Search */}
            <div className="my-3 relative flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
              <Search className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
              <input
                type="text"
                value={newChatSearch}
                onChange={e => setNewChatSearch(e.target.value)}
                placeholder="선박명, 선장, MMSI 검색..."
                className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {filteredCandidates.map(v => (
                <div
                  key={v.id}
                  onClick={() => handleStartNewChatWithVessel(v)}
                  className="p-2.5 bg-slate-950/70 hover:bg-slate-800/90 rounded-xl border border-slate-800/60 flex items-center justify-between cursor-pointer transition"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{v.shipName}</span>
                      <span className="text-[10px] text-slate-400">{v.captainName}</span>
                      <span className="text-[9px] bg-slate-800 text-slate-300 px-1 rounded">
                        {v.vesselType}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      MMSI: {v.mmsi} | 호출부호: {v.callSign}
                    </div>
                  </div>

                  <button className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold">
                    교신 연결
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: Starlink Maritime 위성통신 진단 및 네트워크 센터 */}
      {/* ======================================================== */}
      {isStarlinkModalOpen && (
        <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md p-3 flex flex-col justify-end animate-fadeIn">
          <div className="bg-slate-900 border border-purple-500/50 rounded-3xl p-4 max-h-[92%] flex flex-col shadow-2xl space-y-3 overflow-y-auto">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-purple-950 text-purple-400 border border-purple-700">
                  <Wifi className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Starlink Maritime 위성 네트워크</h3>
                  <p className="text-[10px] text-purple-300 font-mono">LEO 안테나 실시간 추적 상태</p>
                </div>
              </div>
              <button
                onClick={() => setIsStarlinkModalOpen(false)}
                className="p-1 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Diagnostic Metric Cards */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 bg-slate-950 rounded-2xl border border-slate-800">
                <div className="text-[10px] text-slate-400">다운로드</div>
                <div className="text-base font-black text-purple-400 font-mono mt-0.5">{starlinkSpeed.dl} <span className="text-[10px] text-slate-400">Mbps</span></div>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-2xl border border-slate-800">
                <div className="text-[10px] text-slate-400">업로드</div>
                <div className="text-base font-black text-cyan-400 font-mono mt-0.5">{starlinkSpeed.ul} <span className="text-[10px] text-slate-400">Mbps</span></div>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-2xl border border-slate-800">
                <div className="text-[10px] text-slate-400">지연시간(핑)</div>
                <div className="text-base font-black text-emerald-400 font-mono mt-0.5">{starlinkSpeed.ping} <span className="text-[10px] text-slate-400">ms</span></div>
              </div>
            </div>

            {/* Satellite Tracking Info */}
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">위성군 추적 현황</span>
                <span className="text-emerald-400 font-bold font-mono">● 정상 트래킹 (6기 교차 연동)</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
                <span>안테나 고도각: 42.4°</span>
                <span>방위각: 138.2° SE</span>
                <span>신호 감도: -82 dBm</span>
              </div>
            </div>

            {/* Priority Bandwidth Toggle */}
            <div className="p-3 bg-purple-950/40 rounded-2xl border border-purple-800/60 flex items-center justify-between text-xs">
              <div>
                <div className="font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                  <span>비상 안전망/SOS 우선 대역폭 보장</span>
                </div>
                <p className="text-[10px] text-purple-300">조난 및 선박 교신 데이터 최우선 통신 큐 할당</p>
              </div>
              <button
                onClick={() => {
                  audioHelper.playTap();
                  setStarlinkPriorityMode(!starlinkPriorityMode);
                }}
                className={`px-3 py-1 rounded-full text-[10px] font-bold font-mono transition ${
                  starlinkPriorityMode ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {starlinkPriorityMode ? '활성 (ON)' : '해제 (OFF)'}
              </button>
            </div>

            {/* Connected Devices */}
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5 text-xs">
              <div className="font-bold text-slate-300 text-[11px]">선내 Wi-Fi 연결 기기 (5대)</div>
              <div className="space-y-1 text-[10px] text-slate-400 font-mono">
                <div className="flex justify-between"><span>• 조타실 AIS 네비게이션 태블릿</span><span className="text-emerald-400 font-bold">12 Mbps</span></div>
                <div className="flex justify-between"><span>• 최재현 선장 스마트폰 (BlueCall)</span><span className="text-emerald-400 font-bold">24 Mbps</span></div>
                <div className="flex justify-between"><span>• 김대건/김광준/김윤지 승선원 스마트밴드</span><span className="text-emerald-400 font-bold">생체 연동 중</span></div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => {
                  audioHelper.playRadioChirp();
                  setStarlinkTesting(true);
                  setTimeout(() => {
                    setStarlinkTesting(false);
                    setStarlinkSpeed({
                      dl: Math.floor(145 + Math.random() * 20),
                      ul: Math.floor(25 + Math.random() * 8),
                      ping: Math.floor(35 + Math.random() * 6)
                    });
                  }, 1200);
                }}
                disabled={starlinkTesting}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-purple-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border border-purple-900/50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${starlinkTesting ? 'animate-spin' : ''}`} />
                <span>{starlinkTesting ? '통신망 측정 중...' : '위성 통신망 재진단 및 리셋'}</span>
              </button>
              <button
                onClick={() => {
                  setIsStarlinkModalOpen(false);
                  setActiveSubTab('BOT');
                  handleSendBotMessage('Starlink 위성 상태 안내해줘');
                }}
                className="px-3 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition shadow"
              >
                AI 비서 질의
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: 24시간 해상 원격 의료지원 센터 (전문의 화상 진료) */}
      {/* ======================================================== */}
      {isTelemedicineModalOpen && (
        <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md p-3 flex flex-col justify-end animate-fadeIn">
          <div className="bg-slate-900 border border-rose-500/50 rounded-3xl p-4 max-h-[92%] flex flex-col shadow-2xl space-y-3 overflow-y-auto">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-rose-950 text-rose-400 border border-rose-700">
                  <HeartPulse className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">24시간 해상 원격의료지원 센터</h3>
                  <p className="text-[10px] text-rose-300">국립중앙의료원 해상응급센터 전문의 화상 연결</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsTelemedicineModalOpen(false);
                  setTelemedicineConsultationActive(false);
                }}
                className="p-1 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!telemedicineConsultationActive ? (
              <>
                {/* Patient Selection */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300">진료 대상 승선원 선택</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {crew.map(m => (
                      <button
                        key={m.id}
                        onClick={() => {
                          audioHelper.playTap();
                          setTelemedicineSelectedCrew(m.id);
                        }}
                        className={`p-2 rounded-xl text-left border transition text-xs ${
                          telemedicineSelectedCrew === m.id
                            ? 'bg-rose-950/70 border-rose-500 text-white shadow'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="font-bold flex items-center justify-between">
                          <span>{m.name} ({m.role})</span>
                          <span className={`text-[9px] px-1 rounded font-bold ${
                            m.condition === '위험' ? 'text-red-400 bg-red-950' : m.condition === '주의' ? 'text-amber-400 bg-amber-950' : 'text-emerald-400 bg-emerald-950'
                          }`}>{m.condition}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5 font-mono">
                          <span className={m.bodyTemperature && m.bodyTemperature >= 37.5 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>체온 {m.bodyTemperature ?? 36.5}°C</span>
                          <span>·</span>
                          <span className="text-cyan-300 font-sans">{m.activityHours ?? '당직 4h'}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">{m.notes}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Symptom Selection */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300">주요 호소 증상</label>
                  <div className="flex flex-wrap gap-1.5">
                    {['멀미 (구토/현기증)', '야간 피로 및 두통', '외상 및 자상/출혈', '화상/염좌', '발열/오한'].map(sym => (
                      <button
                        key={sym}
                        onClick={() => {
                          audioHelper.playTap();
                          setTelemedicineSymptom(sym);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition ${
                          telemedicineSymptom === sym
                            ? 'bg-rose-600 border-rose-500 text-white font-bold'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {sym}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Medicine Cabinet Information */}
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs space-y-1.5">
                  <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>선내 응급 구급함 현황</span>
                  </div>
                  <p className="text-[10px] text-slate-300 leading-relaxed">
                    • 3번 구급함: 디멘히드리네이트 멀미약 (보유량 12정)<br />
                    • 1번 구급함: 지혈대, 멸균 드레싱, 소독약, 항생연고 구비 완료
                  </p>
                </div>

                {/* Start Consultation Button */}
                <button
                  onClick={() => {
                    audioHelper.playRadioChirp();
                    setTelemedicineConsultationActive(true);
                  }}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black shadow-lg transition flex items-center justify-center gap-2"
                >
                  <Video className="w-4 h-4 animate-pulse" />
                  <span>24시간 당직 전문의 화상 진료실 연결</span>
                </button>
              </>
            ) : (
              /* Active Video Consultation Room */
              <div className="space-y-3">
                <div className="relative rounded-2xl overflow-hidden bg-slate-950 border-2 border-rose-500/80 aspect-video flex flex-col justify-between p-3">
                  <div className="flex items-center justify-between text-xs z-10">
                    <span className="bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      실시간 화상 진료 중
                    </span>
                    <span className="text-[10px] text-slate-300 font-mono">00:01:24</span>
                  </div>

                  <div className="text-center space-y-1 my-auto">
                    <div className="w-14 h-14 rounded-full bg-rose-950 text-rose-300 border-2 border-rose-500 flex items-center justify-center mx-auto text-xl font-bold">
                      🩺
                    </div>
                    <div className="text-xs font-bold text-white">이진우 응급의학과 전문의</div>
                    <div className="text-[10px] text-rose-300">국립중앙의료원 해상응급원격의료센터</div>
                  </div>

                  <div className="bg-black/70 backdrop-blur-sm p-2 rounded-xl text-[10px] text-slate-200 leading-relaxed border border-slate-800">
                    "선장님, 말씀해주신 승선원의 1시간 이상 급성 멀미 증상을 확인했습니다. 구급함 3번 멀미약 1정을 미온수와 복용케 하고, 통풍이 원활한 중앙 선실에서 안정을 취하도록 하십시오."
                  </div>
                </div>

                {/* Prescription & Outcome */}
                <div className="p-3 bg-slate-950 rounded-2xl border border-emerald-800/60 text-xs space-y-1">
                  <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>전문의 전자 처방 및 지도 기록</span>
                  </div>
                  <p className="text-[10px] text-slate-300 leading-snug">
                    • 처방: 디멘히드리네이트 50mg 1정 복용 및 전해질 이온음료 섭취 권고<br />
                    • 소견: 40분 후 재검진 예정, 승선원 명부 한줄평 자동 동기화됨
                  </p>
                </div>

                <button
                  onClick={() => {
                    audioHelper.playTap();
                    const target = crew.find(c => c.id === telemedicineSelectedCrew);
                    if (target) {
                      maritimeService.updateCrewCondition(
                        target.id,
                        '주의',
                        '원격의료 전문의 처방 복용 완료: 1시간 멀미 증상 완화 중 (조타실 휴식)'
                      );
                    }
                    setTelemedicineConsultationActive(false);
                    setIsTelemedicineModalOpen(false);
                  }}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow"
                >
                  진료 완료 및 승선원 건강기록 저장
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
