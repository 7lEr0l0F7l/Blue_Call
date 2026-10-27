import React, { useEffect, useRef, useState } from 'react';
import { 
  Compass, 
  Search, 
  Phone, 
  PhoneOff,
  AlertTriangle, 
  Ship, 
  Radio, 
  LocateFixed, 
  Plus, 
  Minus, 
  X,
  Volume2,
  Building2,
  Landmark,
  Shield,
  Anchor,
  Navigation,
  MapPin,
  ExternalLink,
  MessageSquare,
  MessageSquareOff,
  Send,
  GripHorizontal,
  Move,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Ban,
  Flag,
  Check,
  Sparkles,
  FileText
} from 'lucide-react';
import { MaritimeQuickPhrasesDropdown } from '../chat/MaritimeQuickPhrasesDropdown';
import { loadGoogleMaps, KOREA_SEA_REGIONS } from '../../services/googleMapsService';
import { MaritimeVessel, MaritimeSosEvent } from '../../types/maritime';
import { maritimeService, ActiveCallConnection } from '../../services/maritimeDataService';
import { audioHelper } from '../../utils/audio';
import { MARITIME_AGENCIES } from '../../services/maritimeAgenciesData';
import { MaritimeAgency, AgencyType, AGENCY_TYPE_CONFIG } from '../../types/maritimeAgencies';
import { 
  getCompassDirection, 
  getVesselColorInfo, 
  VESSEL_COLOR_DEFINITIONS, 
  VesselColorCategory 
} from '../../utils/maritimeNav';
import { 
  getAgencyMarkerIconConfig, 
  AgencyLogoEmblem, 
  getAgencyLogoGroup,
  AgencyLogoGroup,
  useCustomLogoVersion
} from '../../utils/maritimeLogos';
import { generateMaritimeChatReply } from '../../services/maritimeChatAi';

interface GoogleMaritimeMapProps {
  vessels: MaritimeVessel[];
  sosEvents: MaritimeSosEvent[];
  selectedVessel: MaritimeVessel | null;
  onSelectVessel: (vessel: MaritimeVessel | null) => void;
  onCallVessel: (vessel: MaritimeVessel) => void;
  onBroadcastSos: () => void;
  onStartChat?: (vessel: MaritimeVessel) => void;
  height?: string;
  isCompact?: boolean;
  isControlCenter?: boolean;
  searchQueryExternal?: string;
  focusVesselTrigger?: number;
  focusHqTrigger?: number;
}

// [1] 관제센터 시점: 대한민국 한반도 전역(동해·서해·남해·제주 전 해역)을 한눈에 조망하는 시점
const KOREA_PENINSULA_LOCATION = {
  lat: 35.80,
  lng: 127.80,
  zoom: 6.7, // 한반도 전역 종합 관제 최적 줌 레벨 (동해·서해·남해 전역 포괄)
  name: '대한민국 전 해역 종합 관제 시점'
};

// [2] 어선 앱 시점: 본선(플라잉 더치맨호) 기본 좌표 및 시작 화면 줌
const OWN_SHIP_LOCATION = {
  lat: 35.2100, // 부산 기장군 먼바다 (외해 조업 구역)
  lng: 129.3600,
  zoom: 12 // 시작화면: 이전보다 축소된 시점으로 기장 연안 및 주변 조업 선박들을 쾌적하게 조망
};

// [3] 해양수산부 부산본부 위치
const BUSAN_HQ_LOCATION = {
  lat: 35.1283,
  lng: 129.0472,
  name: '해양수산부 (부산본부)',
  zoom: 12
};

// 선박과의 통화 시 실제 발화되는 TTS 음성 대화 및 AI 실시간 요약 문구 (100% 일치 동기화)
export const getVesselCallDialogueAndSummary = (vessel: MaritimeVessel, sec: number) => {
  const name = vessel.shipName;
  const rawCaptain = (vessel.captainName || '').trim();
  // 중복되는 선장 단어 제거 (ex: '김철수 선장' -> '김철수 선장', '이창민' -> '이창민 선장')
  const captain = rawCaptain.endsWith('선장') ? rawCaptain : `${rawCaptain} 선장`.trim();
  const speed = vessel.speedKnots;

  // 1. 조난 선박 (SOS 상황): 실제 조난 상세 사유 발화 및 긴급 구난 요청 (전화 중 메이데이 제외)
  if (vessel.status === 'SOS') {
    const sosDetail = vessel.statusMessage || '주기관 정지로 조타 불능 상태이며 암초 방향 표류 및 침수 위험이 있습니다.';
    const speech = `여보세요? 본선 ${name} ${captain}입니다. 현재 ${sosDetail} 전 승선원 4명 구명동의 착용 완료 후 대기 중이며, 해경 경비정과 인근 통항 선박의 신속한 구조 지원을 요청합니다. 이상.`;
    return {
      speech,
      summary: sec < 3
        ? `[긴급 조난 선박 응답] ${name} ${captain} 상황 통화 연결`
        : `[AI 긴급상황 요약] ${name} 조난 상황 확인 (${sosDetail}) ➜ 해경 비상 출동 및 인근 선박 신속 구조 지원 요청 접수됨`
    };
  }

  // 2. 조업 중인 선박: 양망/투망 작업 상세 안내 및 0.5마일 안전 우회 요청
  if (vessel.status === 'FISHING') {
    const fishingDetail = vessel.statusMessage || '부표 2개 전개 및 통발/자망 양망 작업';
    const speech = `여보세요? ${name} ${captain}입니다. 현재 ${fishingDetail} 중으로 조타 및 급선회가 어렵습니다. 충돌 방지를 위해 본선 주위 0.5해리 안전 우회 통항 부탁드립니다. 이상.`;
    return {
      speech,
      summary: sec < 3
        ? `[수신 확인] ${name} ${captain} 050 응답 (조업 중 음성 수신)`
        : `[AI 실시간 요약] ${name} ${fishingDetail} 중 ➜ 주변 0.5해리 안전 이격 및 우회 통항 요청 접수됨`
    };
  }

  // 3. 고속 직진 통항 선박 (8kts 초과)
  if (vessel.speedKnots > 8) {
    const speech = `여보세요? ${name} ${captain}입니다. 현재 속력 ${speed}노트로 직진 통항 중이며, 우현 대 우현으로 안전 통항하겠습니다. 이상.`;
    return {
      speech,
      summary: sec < 3
        ? `[수신 확인] ${name} ${captain} 050 응답 (교행 침로 음성 수신 중)`
        : `[AI 실시간 요약] ${name} 속력 ${speed}kt 통항 중 ➜ 우현 대 우현 안전 통항 및 충돌 방지 합의`
    };
  }

  // 4. 일반 순항 선박
  const navDetail = vessel.statusMessage || `현재 본선 속력 ${speed}노트로 정상 안전 항해`;
  const speech = `여보세요? ${name} ${captain}입니다. ${navDetail} 중입니다. 교신 양호합니다. 이상.`;
  return {
    speech,
    summary: sec < 3
      ? `[수신 확인] ${name} ${captain} 050 응답 (항행 안전 음성 수신)`
      : `[AI 실시간 요약] ${name} ${navDetail} 확인 ➜ 상호 안전 거리 확보 및 안전 항해 합의`
  };
};

// 관공서 통화 시 실제 발화되는 TTS 음성 대화 및 AI 실시간 요약 문구 (100% 일치 동기화)
// 관제센터(웹) 시연 시: 해양수산부 본부 ↔ 타 공공기관 상호 교신이므로 "귀 기관" 호칭 사용 및 관할 해역 공조 안내
// 어선 앱 시연 시: 본선(플라잉 더치맨호) ↔ 관공서 비상 통화이므로 "플라잉 더치맨호 귀선" 호칭 사용
export const getAgencyCallDialogueAndSummary = (
  agency: MaritimeAgency, 
  sec: number, 
  isControlCenter: boolean = false
) => {
  // Strip parentheses and cleanly format agency name so it is never repeated
  let cleanName = (agency.name || '').replace(/\([^)]*\)/g, '').trim();
  if (agency.agencyType === 'VTS') {
    cleanName = cleanName.replace(/해상교통관제센터/g, '').trim();
    if (!cleanName.includes('VTS')) cleanName += ' VTS';
  } else if (agency.agencyType === 'SAFETY_BUREAU') {
    cleanName = cleanName.replace(/^수협\s*/, '').trim();
    if (!cleanName.startsWith('수협')) cleanName = `수협 ${cleanName}`;
  }

  let speech = '';
  let summary = '';

  if (isControlCenter) {
    // ----------------------------------------------------
    // [관제센터 웹]: 공공기관 상호 교신 (해양수산부 본부 ↔ 유관기관)
    // "귀 기관" 호칭 사용 및 임의 선박 언급/상호 기관 공조 내용
    // ----------------------------------------------------
    if (agency.agencyType === 'VTS') {
      speech = `${cleanName} 관제상황실입니다. 해양수산부 본부 중앙관제국 교신 확인했습니다. 귀 기관과 연계하여 외항 진입로 및 주요 항로를 통항 중인 화물선 및 남해보물호 등 연근해 선박들의 레이더 관제 데이터를 실시간 공유 중입니다. 말씀하십시오.`;
      summary = sec < 3
        ? `[관제센터 직통 연결] "${cleanName} ↔ 해양수산부 본부 공조 관제 회선 연결"`
        : `[AI 실시간 요약] ${cleanName}과 해양수산부 본부 간 실시간 항로 관제 레이더망 및 연근해 통항 선박 데이터 공유 중`;
    } else if (agency.agencyType === 'COAST_GUARD') {
      speech = `${cleanName} 종합상황실입니다. 당직관입니다. 해양수산부 본부 교신 확인되었습니다. 귀 기관 요청에 따라 연근해 경비함정 순찰 현황 및 동해7호 등 인근 조업 선단 안전 순찰과 긴급 출동 태세를 확인했습니다. 말씀하십시오.`;
      summary = sec < 3
        ? `[해경 122 직통 연결] "${cleanName} 상황실 연결 완료 (비상 공조망)"`
        : `[AI 실시간 요약] 해경 상황실과 해양수산부 본부 간 비상 관제망 연동 ➜ 인근 조업 선단 안전 순찰 및 긴급 구난 공조 가동`;
    } else if (agency.agencyType === 'SAFETY_BUREAU') {
      speech = `${cleanName}입니다. 해양수산부 본부 연결 확인되었습니다. 귀 기관과 함께 연근해 출어선 위치 보고 접수 현황 및 기상특보 예비구역 어선 안전 계도를 강화하고 있습니다. 말씀하십시오.`;
      summary = sec < 3
        ? `[수협 안전국 연결] "${cleanName} 교신 연결 완료"`
        : `[AI 실시간 요약] ${cleanName}과 해양수산부 본부 간 출어선 위치 접수 및 기상특보 안전 계도 공유`;
    } else if (agency.agencyType === 'FISHERY_MGMT') {
      speech = `${cleanName} 관제상황실입니다. 해양수산부 본부 수신했습니다. 귀 기관과 배타적경제수역(EEZ) 내 국가어업지도선 순찰 현황 및 조업자제선 안전 지도 공조를 진행하고 있습니다. 이상.`;
      summary = sec < 3
        ? `[어업관리단 연결] "${cleanName} 상황실 직통 연결"`
        : `[AI 실시간 요약] 어업관리단 순찰 현황 및 원거리 조업선 안전 지도 공조 완료`;
    } else {
      speech = `${cleanName} 종합상황실입니다. 해양수산부 본부 교신 확인했습니다. 귀 기관과 전국 연근해 선박 안전 조업 및 스마트 해양교통망 데이터를 상호 공유 중입니다. 말씀하십시오.`;
      summary = sec < 3
        ? `[유관기관 직통] "${cleanName} 직통 회선 연결"`
        : `[AI 실시간 요약] ${cleanName}과 해양수산부 본부 간 실시간 해양교통 종합 데이터 공유 중`;
    }
  } else {
    // ----------------------------------------------------
    // [어선 앱]: 본선(플라잉 더치맨호) ↔ 관공서 비상 통화
    // ----------------------------------------------------
    if (agency.agencyType === 'VTS') {
      speech = `${cleanName} 관제상황실입니다. 플라잉 더치맨호 귀선 현재 안전 통항 항로를 감시 중입니다. 말씀하십시오.`;
      summary = sec < 3
        ? `[VTS 관제 연결] "${cleanName} 교신 연결 (050 안전망)"`
        : `[AI 실시간 요약] ${cleanName}에서 플라잉 더치맨호 통항 항로 레이더 포착 및 안전 통항 감시 중`;
    } else if (agency.agencyType === 'SAFETY_BUREAU') {
      speech = `${cleanName}입니다. 플라잉 더치맨호 어선 안전 위치 보고 정상 접수되었습니다. 안전 조업하십시오.`;
      summary = sec < 3
        ? `[수협 안전국 연결] "${cleanName} 안전 위치국 교신 연결"`
        : `[AI 실시간 요약] ${cleanName}에 본선 위치 보고 정상 접수 완료 ➜ 조업 안전 등록됨`;
    } else if (agency.agencyType === 'FISHERY_MGMT') {
      speech = `${cleanName} 관제상황실입니다. 연근해 어선 안전 조업 수칙을 준수해 주십시오. 이상.`;
      summary = sec < 3
        ? `[어업관리단 연결] "${cleanName} 상황실 연결"`
        : `[AI 실시간 요약] 어업지도선 안전 조업 수칙 확인 ➜ 불법 조업 방지 및 안전 준수 기록됨`;
    } else {
      speech = `${cleanName} 종합상황실입니다. 당직관입니다. 플라잉 더치맨호 귀선의 위치와 안전 상태를 확인했습니다. 말씀하십시오.`;
      summary = sec < 3
        ? `[상황실 연결] "${cleanName} 종합상황실 연결 완료 (050 비상 안전망)"`
        : `[AI 실시간 요약] 해경 상황실에서 플라잉 더치맨호 GPS 위치 및 안전 상태 수신 확인 ➜ 비상 관제망 연동 완료`;
    }
  }

  return { speech, summary };
};

export const GoogleMaritimeMap: React.FC<GoogleMaritimeMapProps> = ({
  vessels,
  sosEvents,
  selectedVessel,
  onSelectVessel,
  onCallVessel,
  onBroadcastSos,
  onStartChat,
  height = '100%',
  isCompact = false,
  isControlCenter = false,
  searchQueryExternal,
  focusVesselTrigger,
  focusHqTrigger
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const circlesRef = useRef<google.maps.Circle[]>([]);
  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const agencyMarkersRef = useRef<google.maps.Marker[]>([]);

  const [mapEngine, setMapEngine] = useState<'GOOGLE_MAPS' | 'VECTOR_RADAR'>('GOOGLE_MAPS');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<keyof typeof KOREA_SEA_REGIONS>('KOREA_ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<VesselColorCategory | 'ALL'>('ALL');
  const [isSosDismissed, setIsSosDismissed] = useState(false);
  const [activeConnections, setActiveConnections] = useState<ActiveCallConnection[]>(maritimeService.getActiveConnections());
  const [radarZoom, setRadarZoom] = useState(1);

  // Maritime Public Agencies state (어업관리단, 어선안전조업국, 지방해수청, 해수부, 해경, VTS)
  const [showAgencies, setShowAgencies] = useState(true);
  const [selectedAgencyType, setSelectedAgencyType] = useState<AgencyType | 'ALL'>('ALL');
  const [selectedAgency, setSelectedAgency] = useState<MaritimeAgency | null>(() => {
    if (isControlCenter) {
      return MARITIME_AGENCIES.find(a => a.id === 'agency-mof-busan') || MARITIME_AGENCIES[0];
    }
    return null;
  });

  const logoVersion = useCustomLogoVersion();

  // Vessel Spec Detail Popup Modal (User Requirement 1: 상세정보 보기 클릭 시 새로운 창으로 출력)
  const [showVesselSpecModal, setShowVesselSpecModal] = useState(false);

  // In-map Quick Chat Modal state (User Requirements 4 & 5)
  const [activeChatVessel, setActiveChatVessel] = useState<MaritimeVessel | null>(null);
  const [chatInputText, setChatInputText] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; sender: 'ME' | 'THEM'; text: string; time: string }>>([]);

  // Active in-call timer & phases inside compact drawer (User Requirement 5 & 6)
  const [inCallSeconds, setInCallSeconds] = useState(0);
  const [isCallingActive, setIsCallingActive] = useState(false);
  const [callPhase, setCallPhase] = useState<'IDLE' | 'RINGING' | 'CONNECTED'>('IDLE');
  const [callingVessel, setCallingVessel] = useState<MaritimeVessel | null>(null);
  const [callWarningMessage, setCallWarningMessage] = useState<string | null>(null);

  // Maritime Agency Direct Call state (User Requirement 6: 주요 관공서 통화 연결 버그 해결)
  const [agencyCallPhase, setAgencyCallPhase] = useState<'IDLE' | 'RINGING' | 'CONNECTED'>('IDLE');
  const [agencyInCallSeconds, setAgencyInCallSeconds] = useState(0);

  // Vessel Report & Blacklist Modal state (User Requirement 7: 선박 신고 및 블랙리스트)
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('위험 항해 및 침로 방해');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSuccessMsg, setReportSuccessMsg] = useState<string | null>(null);

  // Timers
  const callRingTimerRef = useRef<number | null>(null);
  const agencyCallTimerRef = useRef<number | null>(null);

  // Draggable Legend Box state: 화면 전환 및 새로고침 시에도 위치 유지 (User Requirement 1: 옮긴 선박 구분 위치 유지)
  const LEGEND_STORAGE_KEY = 'bluecall_legend_position_v1';
  const [legendCustomPos, setLegendCustomPos] = useState<{ x: number; y: number } | null>(() => {
    try {
      const saved = localStorage.getItem(LEGEND_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [isDraggingLegend, setIsDraggingLegend] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const legendBoxRef = useRef<HTMLDivElement>(null);
  const categoryCycleIndexRef = useRef<Record<string, number>>({});

  useEffect(() => {
    try {
      if (legendCustomPos) {
        localStorage.setItem(LEGEND_STORAGE_KEY, JSON.stringify(legendCustomPos));
      } else {
        localStorage.removeItem(LEGEND_STORAGE_KEY);
      }
    } catch (e) {}
  }, [legendCustomPos]);

  useEffect(() => {
    const unsub = maritimeService.subscribe((event, data) => {
      if (event === 'CONNECTIONS_UPDATED') {
        setActiveConnections([...maritimeService.getActiveConnections()]);
      } else if (event === 'SOS_BANNER_DISMISSED') {
        setIsSosDismissed(true);
      } else if (event === 'SOS_TRIGGERED') {
        setIsSosDismissed(false);
      }
    });
    return unsub;
  }, []);

  // Filter vessels based on Category (5 colors) & strictly on MMSI, 호출부호, 어선번호
  const effectiveQuery = (searchQueryExternal !== undefined ? searchQueryExternal : searchQuery).trim().toLowerCase();
  const filteredVessels = vessels.filter(v => {
    // 단속 업무를 수행하는 국가 어업지도선 및 사용자 요청으로 제거된 광양항만호는 지도 표출 제외
    if (v.vesselType === '어업지도선' || v.shipName.includes('어업지도선') || v.shipName === '광양항만호') {
      return false;
    }

    // 5-Color category filter
    if (selectedCategoryFilter !== 'ALL') {
      const cInfo = getVesselColorInfo(v, activeConnections);
      if (cInfo.category !== selectedCategoryFilter) return false;
    }
    // Strict identification search
    if (!effectiveQuery) return true;
    const matchMmsi = v.mmsi.toLowerCase().includes(effectiveQuery);
    const matchCallSign = v.callSign.toLowerCase().includes(effectiveQuery);
    const matchRegNo = v.registrationNo ? v.registrationNo.toLowerCase().includes(effectiveQuery) : false;
    return matchMmsi || matchCallSign || matchRegNo;
  });

  // Auto pan to selected vessel (앱에서는 선박 선택 시 자동 이동, 관제센터에서는 초기 로딩 시 부산본부 중심 유지)
  useEffect(() => {
    if (isControlCenter) return;
    if (selectedVessel && mapInstanceRef.current && mapLoaded) {
      mapInstanceRef.current.panTo({ lat: selectedVessel.lat, lng: selectedVessel.lng });
    }
  }, [selectedVessel, mapLoaded, isControlCenter]);

  // Initialize Google Maps with gestureHandling: 'greedy' (no Ctrl key required to zoom!)
  useEffect(() => {
    let isMounted = true;

    loadGoogleMaps()
      .then((googleObj) => {
        if (!isMounted || !mapRef.current) return;

        // 본선(플라잉 더치맨호) 좌표 동적 취득
        const ownShip = vessels.find(v => v.isOwnShip);
        const ownLat = ownShip?.lat || OWN_SHIP_LOCATION.lat;
        const ownLng = ownShip?.lng || OWN_SHIP_LOCATION.lng;

        // [관제센터]: 한반도 전역을 보고 있는 시점 (동해·서해·남해·제주 전역 조망, zoom 7)
        // [어선 앱]: 본선이 중앙에 위치한 최대한 확대된 시점 (zoom 14)
        const center = isControlCenter
          ? { lat: KOREA_PENINSULA_LOCATION.lat, lng: KOREA_PENINSULA_LOCATION.lng }
          : { lat: ownLat, lng: ownLng };
        const initialZoom = isControlCenter ? KOREA_PENINSULA_LOCATION.zoom : OWN_SHIP_LOCATION.zoom;

        const map = new googleObj.maps.Map(mapRef.current, {
          center,
          zoom: initialZoom,
          minZoom: 6.5, // 한반도 전역 조망 지원
          maxZoom: 18, // 항만·부두 상세 확대
          restriction: {
            latLngBounds: {
              north: 43.5, // 한반도 북단 (동해 북부 및 NLL 수역)
              south: 31.0, // 이어도 및 제주 남방 한일공동개발구역 해역
              west: 122.0, // 서해 연근해 및 격렬비열도 서방
              east: 133.5  // 동해 대화퇴, 울릉도 및 독도 수역
            },
            strictBounds: false // 지도 튕김 방지 및 자연스러운 한반도 영역 유지
          },
          mapTypeId: 'roadmap', // Clean standard roadmap per user instruction
          gestureHandling: 'greedy', // Zoom immediately with mouse wheel without holding Ctrl!
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: false, // We provide custom sleek zoom buttons
          styles: [
            { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c7e5ff' }] },
            { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#f1f5f9' }] },
            { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#cbd5e1' }] },
            { featureType: 'poi', stylers: [{ visibility: 'off' }] }
          ]
        });

        mapInstanceRef.current = map;

        // User Requirement: 확대를 하면 할 수록 커지는 형태로 변경 (동적 줌 크기 반영)
        map.addListener('zoom_changed', () => {
          const newZoom = map.getZoom() || 8;
          agencyMarkersRef.current.forEach((marker) => {
            const aType = (marker as any).__agencyType as AgencyType;
            if (aType && (window as any).google) {
              marker.setIcon(getAgencyMarkerIconConfig((window as any).google, aType, newZoom));
            }
          });
        });

        setMapLoaded(true);
      })
      .catch((err) => {
        console.warn('Google Maps notice (falling back to Vector Radar):', err);
        if (isMounted) {
          setMapEngine('VECTOR_RADAR');
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Update region center when selected region changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      const region = KOREA_SEA_REGIONS[selectedRegion];
      mapInstanceRef.current.setCenter({ lat: region.lat, lng: region.lng });
      mapInstanceRef.current.setZoom(region.zoom);
    }
  }, [selectedRegion]);

  // Zoom controls with scale limit restrictions
  const handleZoomIn = () => {
    audioHelper.playTap();
    if (mapEngine === 'GOOGLE_MAPS' && mapInstanceRef.current) {
      const cur = mapInstanceRef.current.getZoom() || 8;
      if (cur < 18) {
        mapInstanceRef.current.setZoom(cur + 1);
      }
    } else {
      setRadarZoom(prev => Math.min(2.5, prev + 0.25));
    }
  };

  const handleZoomOut = () => {
    audioHelper.playTap();
    if (mapEngine === 'GOOGLE_MAPS' && mapInstanceRef.current) {
      const cur = mapInstanceRef.current.getZoom() || 8;
      if (cur > 7) {
        mapInstanceRef.current.setZoom(cur - 1);
      }
    } else {
      setRadarZoom(prev => Math.max(0.75, prev - 0.25));
    }
  };

  // 자기 위치로 이동 (노트북 웹 관제센터: 한반도 전역 시점으로 복귀 / 모바일 어선 앱: 본선 플라잉 더치맨호 최대 확대 시점 복귀)
  const handleCenterOwnShip = () => {
    audioHelper.playTap();
    if (isControlCenter) {
      if (mapInstanceRef.current && mapEngine === 'GOOGLE_MAPS') {
        mapInstanceRef.current.panTo({ lat: KOREA_PENINSULA_LOCATION.lat, lng: KOREA_PENINSULA_LOCATION.lng });
        mapInstanceRef.current.setZoom(KOREA_PENINSULA_LOCATION.zoom);
      } else {
        setRadarZoom(1.0);
      }
    } else {
      const own = vessels.find(v => v.isOwnShip);
      const targetLat = own ? own.lat : OWN_SHIP_LOCATION.lat;
      const targetLng = own ? own.lng : OWN_SHIP_LOCATION.lng;
      if (mapInstanceRef.current) {
        // [사용자 요구사항]: 본선으로 이동 시 강제 확대하지 않고 현재 화면 스케일(줌 레벨)을 그대로 유지하며 본선으로 이동
        mapInstanceRef.current.panTo({ lat: targetLat, lng: targetLng });
      }
    }
  };

  // Center on any vessel (User Requirement 1: 위치 이동 버튼)
  const handleCenterVessel = (v: MaritimeVessel) => {
    audioHelper.playTap();
    if (mapEngine === 'GOOGLE_MAPS' && mapInstanceRef.current) {
      mapInstanceRef.current.panTo({ lat: v.lat, lng: v.lng });
      mapInstanceRef.current.setZoom(13);
    } else {
      setRadarZoom(1.5);
    }
  };

  // Category selection with instant touch navigation to vessel (User Requirement 3)
  const handleCategorySelectAndNavigate = (cat: VesselColorCategory | 'ALL') => {
    audioHelper.playTap();
    setSelectedCategoryFilter(cat);

    if (cat === 'ALL') {
      handleCenterOwnShip();
      return;
    }

    const matching = vessels.filter(v => getVesselColorInfo(v, activeConnections).category === cat);
    if (matching.length > 0) {
      const curIdx = categoryCycleIndexRef.current[cat] || 0;
      const target = matching[curIdx % matching.length];
      categoryCycleIndexRef.current[cat] = (curIdx + 1) % matching.length;
      handleCenterVessel(target);
      onSelectVessel(target);
    }
  };

  // Touch and pointer drag handlers for moving the legend box freely by touch (User Requirement 3)
  const handleLegendDragStart = (clientX: number, clientY: number) => {
    if (!legendBoxRef.current) return;
    const rect = legendBoxRef.current.getBoundingClientRect();
    const parentRect = legendBoxRef.current.parentElement?.getBoundingClientRect();
    if (!parentRect) return;

    dragStartRef.current = {
      startX: clientX,
      startY: clientY,
      origX: rect.left - parentRect.left,
      origY: rect.top - parentRect.top
    };
    setIsDraggingLegend(true);
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!dragStartRef.current || !legendBoxRef.current) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const parentRect = legendBoxRef.current.parentElement?.getBoundingClientRect();
      if (!parentRect) return;

      const deltaX = clientX - dragStartRef.current.startX;
      const deltaY = clientY - dragStartRef.current.startY;
      const newX = Math.max(4, Math.min(parentRect.width - 150, dragStartRef.current.origX + deltaX));
      const newY = Math.max(4, Math.min(parentRect.height - 180, dragStartRef.current.origY + deltaY));

      setLegendCustomPos({ x: newX, y: newY });
    };

    const handleEnd = () => {
      setIsDraggingLegend(false);
      dragStartRef.current = null;
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, []);

  // Auto-pan when focusVesselTrigger changes
  useEffect(() => {
    if (selectedVessel && mapInstanceRef.current) {
      mapInstanceRef.current.panTo({ lat: selectedVessel.lat, lng: selectedVessel.lng });
      mapInstanceRef.current.setZoom(13);
    }
  }, [focusVesselTrigger]);

  // Auto-pan when focusHqTrigger changes (웹 관제센터 자기 위치: 부산본부로 화면 이동)
  useEffect(() => {
    if (focusHqTrigger && mapInstanceRef.current) {
      mapInstanceRef.current.panTo({ lat: BUSAN_HQ_LOCATION.lat, lng: BUSAN_HQ_LOCATION.lng });
      mapInstanceRef.current.setZoom(BUSAN_HQ_LOCATION.zoom);
    }
  }, [focusHqTrigger]);

  // Render Google Map Markers & Live Call Connection Lines (Orange dashed / Green solid line)
  useEffect(() => {
    const winGoogle = (window as unknown as { google?: typeof google }).google;
    if (!mapLoaded || !mapInstanceRef.current || !winGoogle?.maps) return;

    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
    circlesRef.current.forEach(c => c.setMap(null));
    circlesRef.current = [];
    polylinesRef.current.forEach(p => p.setMap(null));
    polylinesRef.current = [];

    const map = mapInstanceRef.current;
    const googleMaps = winGoogle.maps;

    // 1. Draw Active Call Lines between vessels: 실시간으로 통화 중인 선박은 주황색 삼각형 간에 주황색 실선 연결 (User Requirement)
    activeConnections.forEach(conn => {
      const vCaller = vessels.find(v => v.mmsi === conn.callerMmsi);
      const vReceiver = vessels.find(v => v.mmsi === conn.receiverMmsi);
      if (vCaller && vReceiver) {
        const line = new googleMaps.Polyline({
          path: [
            { lat: vCaller.lat, lng: vCaller.lng },
            { lat: vReceiver.lat, lng: vReceiver.lng }
          ],
          geodesic: true,
          strokeColor: '#f97316', // 주황색 실선 (통화 중인 선박 간 실시간 통신 연결)
          strokeOpacity: 0.95,
          strokeWeight: 3.5,
          map
        });
        polylinesRef.current.push(line);
      }
    });

    // 1-B. 조난을 송수신하여 조난선에 접근 중인 선박도 빨간색 실선 연결 (User Requirement)
    sosEvents.filter(e => e.status === 'ACTIVE' || e.status === 'RESPONDING').forEach(sos => {
      const distressVessel = vessels.find(v => v.id === sos.vessel.id || v.mmsi === sos.vessel.mmsi) || sos.vessel;
      if (!distressVessel) return;

      sos.respondingVessels.forEach(resp => {
        const matchName = resp.vesselName.replace(' (본선)', '').trim();
        const vResp = vessels.find(v => 
          v.shipName.includes(matchName) || 
          matchName.includes(v.shipName) ||
          (matchName.includes('해경') && v.vesselType === '해경 경비정')
        );

        if (vResp) {
          const rescueLine = new googleMaps.Polyline({
            path: [
              { lat: vResp.lat, lng: vResp.lng },
              { lat: distressVessel.lat, lng: distressVessel.lng }
            ],
            geodesic: true,
            strokeColor: '#ef4444', // 빨간색 실선 (조난선 긴급 구조 접근 항로)
            strokeOpacity: 0.95,
            strokeWeight: 3.5,
            map
          });
          polylinesRef.current.push(rescueLine);
        }
      });
    });

    // 2. Plot vessels on Google Maps with 5 distinct color categories
    filteredVessels.forEach((vessel) => {
      const colorInfo = getVesselColorInfo(vessel, activeConnections);

      // 플라잉 더치맨호는 앱 사용자 기준 본선이며, 웹 관제센터에서는 일반 선박과 동일한 모양(삼각형 방향 마커)으로 표출
      const isOwnShipInContext = !isControlCenter && vessel.isOwnShip;

      const iconColor = isOwnShipInContext ? '#2563eb' : colorInfo.colorHex;
      const strokeColor = isOwnShipInContext ? '#93c5fd' : colorInfo.strokeHex;

      // Triangle marker path vs Circle for Own Ship in Mobile App
      const svgIcon = isOwnShipInContext ? {
        path: googleMaps.SymbolPath.CIRCLE,
        scale: 9.5,
        fillColor: '#0284c7', // 선명한 청색/시안
        fillOpacity: 1,
        strokeColor: '#ffffff', // 화이트 테두리
        strokeWeight: 2.8,
        rotation: 0
      } : {
        path: 'M 0,-14 L 7,7 L 0,3 L -7,7 Z',
        fillColor: iconColor,
        fillOpacity: 1,
        strokeColor,
        strokeWeight: 1.5,
        scale: 1.25,
        rotation: vessel.headingDeg || 0,
        anchor: new googleMaps.Point(0, 0)
      };

      const marker = new googleMaps.Marker({
        position: { lat: vessel.lat, lng: vessel.lng },
        map,
        title: `${isOwnShipInContext ? '★ [본선] ' : ''}${vessel.shipName} (${vessel.vesselType}) [${colorInfo.label}] | 속력: ${vessel.speedKnots}kts | 방위: ${vessel.headingDeg}° (${getCompassDirection(vessel.headingDeg)})`,
        icon: svgIcon,
        zIndex: isOwnShipInContext ? 120 : colorInfo.category === 'SOS' ? 95 : colorInfo.category === 'IN_CALL' ? 85 : colorInfo.category === 'RESTRICTED' ? 75 : 50
      });

      marker.addListener('click', () => {
        audioHelper.playTap();
        setSelectedAgency(null); // Clear agency when selecting a vessel
        onSelectVessel(vessel);
      });

      markersRef.current.push(marker);

      // 본선 전용: 원형 펄스 헤일로 마커 추가 (모바일 앱 본선일 때만 표출, 웹 관제센터에서는 일반 선박과 동일하게 표출)
      if (isOwnShipInContext) {
        const ownHalo = new googleMaps.Marker({
          position: { lat: vessel.lat, lng: vessel.lng },
          map,
          clickable: false,
          icon: {
            path: googleMaps.SymbolPath.CIRCLE,
            scale: 17,
            fillColor: '#38bdf8',
            fillOpacity: 0.28,
            strokeColor: '#38bdf8',
            strokeWeight: 1.5
          },
          zIndex: 110
        });
        markersRef.current.push(ownHalo);
      }

      // 본선 레이더 탐지 범위 (모바일 앱 본선일 때만 표출)
      if (isOwnShipInContext) {
        const radarCircle = new googleMaps.Circle({
          strokeColor: '#2563eb',
          strokeOpacity: 0.6,
          strokeWeight: 1.5,
          fillColor: '#3b82f6',
          fillOpacity: 0.08,
          map,
          center: { lat: vessel.lat, lng: vessel.lng },
          radius: 1852
        });
        circlesRef.current.push(radarCircle);
      }

      // 조난 선박 (빨간색): 긴급 경고 반경
      if (colorInfo.category === 'SOS') {
        const sosCircle = new googleMaps.Circle({
          strokeColor: '#dc2626',
          strokeOpacity: 0.85,
          strokeWeight: 2,
          fillColor: '#ef4444',
          fillOpacity: 0.22,
          map,
          center: { lat: vessel.lat, lng: vessel.lng },
          radius: 1500
        });
        circlesRef.current.push(sosCircle);
      }



      // 조업·접근제한 선박 (보라색 추천): 어구 훼손방지 및 충돌회피 불가 안전 경계 반경 (700m)
      if (colorInfo.category === 'RESTRICTED') {
        const restrictedCircle = new googleMaps.Circle({
          strokeColor: '#a855f7',
          strokeOpacity: 0.7,
          strokeWeight: 1.5,
          fillColor: '#a855f7',
          fillOpacity: 0.08,
          map,
          center: { lat: vessel.lat, lng: vessel.lng },
          radius: 700
        });
        circlesRef.current.push(restrictedCircle);
      }
    });



    // 3. 주요 관공서 (동,서,남해 어업관리단과 어선안전조업국, 지방해양수산청, 해수부, 지방 해양경찰서, VTS) 육상 표출
    agencyMarkersRef.current.forEach(m => m.setMap(null));
    agencyMarkersRef.current = [];

    // 3. 주요 관공서 육상 표출 (수협, 해수부, 어업관리단, 지방청, 해양경찰서, VTS)
    if (showAgencies) {
      const curZoom = map.getZoom() || 8;
      MARITIME_AGENCIES.forEach((agency) => {
        if (selectedAgencyType !== 'ALL' && agency.agencyType !== selectedAgencyType) return;

        // User Requirement: 동그라미에 별표가 들어간 형태, 글자는 삽입하지 말아줘
        // User Requirement: 크기가 너무 크다 선박보다 작게 부탁해. 대신 확대를 하면 할 수록 커지는 형태로 하자
        const iconConfig = getAgencyMarkerIconConfig(winGoogle, agency.agencyType, curZoom);

        const agencyMarker = new googleMaps.Marker({
          position: { lat: agency.lat, lng: agency.lng },
          map,
          title: `[${agency.categoryLabel}] ${agency.name}\n비상무전: ${agency.emergencyVhf || 'VHF CH 16'}\n전화: ${agency.phone}\n관할: ${agency.jurisdiction}`,
          icon: iconConfig,
          zIndex: 60
        });

        (agencyMarker as any).__agencyType = agency.agencyType;

        agencyMarker.addListener('click', () => {
          audioHelper.playRadioChirp();
          setSelectedAgency(agency);
          onSelectVessel(null);
        });

        agencyMarkersRef.current.push(agencyMarker);
      });
    }

  }, [mapLoaded, filteredVessels, activeConnections, sosEvents, showAgencies, selectedAgencyType, onSelectVessel, logoVersion, isCompact, isControlCenter]);

  // Call duration timers
  useEffect(() => {
    let timer: number;
    if (callPhase === 'CONNECTED') {
      timer = window.setInterval(() => {
        setInCallSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [callPhase]);

  useEffect(() => {
    let timer: number;
    if (agencyCallPhase === 'CONNECTED') {
      timer = window.setInterval(() => {
        setAgencyInCallSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [agencyCallPhase]);

  // Clean up audio & timers on unmount
  useEffect(() => {
    return () => {
      audioHelper.stopRingtone();
      audioHelper.stopSpeech();
      if (callRingTimerRef.current) clearTimeout(callRingTimerRef.current);
      if (agencyCallTimerRef.current) clearTimeout(agencyCallTimerRef.current);
    };
  }, []);

  // Handle call directly inside compact drawer (User Requirement 5: 1:1 통화 제한, 연결음 + TTS 대화)
  const handleStartDrawerCall = (v: MaritimeVessel) => {
    audioHelper.playTap();
    setCallWarningMessage(null);

    // 1. 1:1 통화 검증 A: 본선이 이미 통화 중인 경우 (동시 2선박 이상 통화 차단)
    const ownConn = maritimeService.getOwnShipCallConnection();
    if (callPhase !== 'IDLE' || agencyCallPhase !== 'IDLE' || ownConn) {
      audioHelper.playRadioChirp();
      const partnerName = ownConn 
        ? (ownConn.callerMmsi === '440182940' ? ownConn.receiverName : ownConn.callerName)
        : (callingVessel?.shipName || selectedAgency?.name || '상대 선박/기관');
      setCallWarningMessage(`현재 본선이 [${partnerName}]와(과) 통화 중입니다. 통화 종료 후 발신해 주십시오.`);
      setTimeout(() => setCallWarningMessage(null), 5000);
      return;
    }

    // 2. 1:1 통화 검증 B: 상대 선박이 이미 다른 선박과 통화 중인 경우 (실선 연결 선박 1:1 통화 차단)
    if (maritimeService.isVesselInCall(v.mmsi, v.id, v.shipName)) {
      audioHelper.playRadioChirp();
      audioHelper.playBusy();
      setCallWarningMessage(`[통화 중] ${v.shipName}은(는) 현재 타 선박과 1:1 교신 중입니다. 1:1 통신 원칙에 따라 통화 종료 후 다시 걸어주십시오.`);
      setTimeout(() => setCallWarningMessage(null), 4000);
      return;
    }

    // 3. 블랙리스트 검증: 차단된 선박
    if (v.isBlacklisted) {
      audioHelper.playRadioChirp();
      setCallWarningMessage(`[차단됨] ${v.shipName}은(는) 블랙리스트로 등록되어 발신이 차단되었습니다.`);
      setTimeout(() => setCallWarningMessage(null), 3500);
      return;
    }

    // 발신 시작 -> 통화 연결음(링백톤) 재생
    setCallingVessel(v);
    setCallPhase('RINGING');
    setIsCallingActive(true);
    setInCallSeconds(0);
    audioHelper.startRingtone();

    // 2.4초 후 상대 선박 응답 (TTS 음성 대화 시작)
    if (callRingTimerRef.current) clearTimeout(callRingTimerRef.current);
    callRingTimerRef.current = window.setTimeout(() => {
      audioHelper.stopRingtone();
      audioHelper.playRadioChirp();
      setCallPhase('CONNECTED');
      maritimeService.startCallConnection('440182940', '플라잉 더치맨호 (본선)', v.mmsi, v.shipName);

      // 생생한 해상 음성 교신 TTS 송출 (AI 실시간 요약과 100% 동기화)
      const callData = getVesselCallDialogueAndSummary(v, 0);
      audioHelper.speakFakeVoice(callData.speech);
    }, 2400);
  };

  const handleEndDrawerCall = () => {
    if (callRingTimerRef.current) clearTimeout(callRingTimerRef.current);
    audioHelper.stopRingtone();
    audioHelper.stopSpeech();
    audioHelper.playRadioChirp();
    setCallPhase('IDLE');
    setIsCallingActive(false);
    if (callingVessel) {
      maritimeService.endCallByMmsi(callingVessel.mmsi);
    } else {
      maritimeService.endCallByMmsi('440182940');
    }
    setCallingVessel(null);
  };

  // Public Agency calling handler (User Requirement 6: 주요 관공서 통화 연결 버그 해결)
  const handleStartAgencyCall = (agency: MaritimeAgency) => {
    audioHelper.playTap();
    setCallWarningMessage(null);

    const ownConn = maritimeService.getOwnShipCallConnection();
    if (callPhase !== 'IDLE' || agencyCallPhase !== 'IDLE' || ownConn) {
      audioHelper.playRadioChirp();
      const partnerName = ownConn 
        ? (ownConn.callerMmsi === '440182940' ? ownConn.receiverName : ownConn.callerName)
        : (callingVessel?.shipName || selectedAgency?.name || '기존 통화 대상');
      setCallWarningMessage(`현재 본선이 [${partnerName}]와(과) 통화 중입니다. 기존 통화를 먼저 종료해 주십시오.`);
      setTimeout(() => setCallWarningMessage(null), 5000);
      return;
    }

    setAgencyCallPhase('RINGING');
    setAgencyInCallSeconds(0);
    audioHelper.startRingtone();

    if (agencyCallTimerRef.current) clearTimeout(agencyCallTimerRef.current);
    agencyCallTimerRef.current = window.setTimeout(() => {
      audioHelper.stopRingtone();
      audioHelper.playRadioChirp();
      setAgencyCallPhase('CONNECTED');
      maritimeService.startCallConnection('440182940', '플라잉 더치맨호 (본선)', agency.id, agency.name);

      // 생생한 관공서 교신 TTS 송출 (AI 실시간 요약과 100% 동기화)
      const agencyData = getAgencyCallDialogueAndSummary(agency, 0, isControlCenter);
      audioHelper.speakFakeVoice(agencyData.speech);
    }, 2200);
  };

  const handleEndAgencyCall = () => {
    if (agencyCallTimerRef.current) clearTimeout(agencyCallTimerRef.current);
    audioHelper.stopRingtone();
    audioHelper.stopSpeech();
    audioHelper.playRadioChirp();
    setAgencyCallPhase('IDLE');
    if (selectedAgency) {
      maritimeService.endCallByMmsi(selectedAgency.id);
    }
  };

  // Blacklist & Report handlers (User Requirement 7: 특정 선박 신고 및 블랙리스트)
  const handleToggleBlacklist = (v: MaritimeVessel) => {
    audioHelper.playTap();
    const isNowBlocked = maritimeService.toggleBlacklist(v.mmsi, reportReason || '이용자 차단 요청');
    setReportSuccessMsg(isNowBlocked ? `${v.shipName}이(가) 블랙리스트(차단)에 등록되었습니다.` : `${v.shipName}의 차단이 해제되었습니다.`);
    setTimeout(() => {
      setReportSuccessMsg(null);
      setShowReportModal(false);
    }, 1500);
  };

  const handleSubmitReport = (v: MaritimeVessel) => {
    audioHelper.playTap();
    maritimeService.reportVessel(v.mmsi, reportReason, reportDetails);
    setReportSuccessMsg(`${v.shipName}에 대한 신고가 VTS 및 관제기관에 성공적으로 접수되었습니다.`);
    setTimeout(() => {
      setReportSuccessMsg(null);
      setShowReportModal(false);
      setReportDetails('');
    }, 1800);
  };

  // Quick Chat handlers (User Requirements 4 & 5)
  const handleOpenQuickChat = (vessel: MaritimeVessel) => {
    audioHelper.playRadioChirp();
    setActiveChatVessel(vessel);
    const existing = maritimeService.getVesselChat(vessel.mmsi, isControlCenter);
    if (existing && existing.messages.length > 0) {
      setChatMessages(existing.messages.map(m => ({
        id: m.id,
        sender: m.senderId === 'ME' || m.senderId === 'OWN' ? 'ME' : 'THEM',
        text: m.text,
        time: m.timestamp
      })));
    } else {
      setChatMessages([
        {
          id: 'init-1',
          sender: 'THEM',
          text: isControlCenter
            ? `관제센터 상황실 수신 양호합니다. 여기는 ${vessel.shipName} (${vessel.callSign}) 선장입니다. 050 안전 관제 통신망 대기 중입니다.`
            : `여기는 ${vessel.shipName} (${vessel.callSign}) 선장입니다. 050 안전 무선 통신망 수신 대기 중입니다.`,
          time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
    if (onStartChat) {
      onStartChat(vessel);
    }
  };

  const handleSendChatMessage = async (presetText?: string) => {
    const textToSend = (presetText !== undefined ? presetText : chatInputText).trim();
    if (!textToSend || !activeChatVessel) return;
    audioHelper.playRadioChirp();
    const newMsg = {
      id: String(Date.now()),
      sender: 'ME' as const,
      text: textToSend,
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, newMsg]);
    if (!presetText) {
      setChatInputText('');
    }

    // Trigger service update
    maritimeService.sendVesselChatMessage(activeChatVessel.mmsi, textToSend, isControlCenter);

    // Realistic intelligent AI dialogue response (User Requirement: 의약품 소지 문의 및 해상 환경 대화)
    try {
      const aiReply = await generateMaritimeChatReply(textToSend, {
        shipName: activeChatVessel.shipName,
        captainName: activeChatVessel.captainName,
        vesselType: activeChatVessel.vesselType,
        mmsi: activeChatVessel.mmsi,
        status: activeChatVessel.status,
        statusMessage: activeChatVessel.statusMessage
      }, isControlCenter);

      setTimeout(() => {
        audioHelper.playRadioChirp();
        const replyMsg = {
          id: String(Date.now() + 1),
          sender: 'THEM' as const,
          text: aiReply.text,
          time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
        };
        setChatMessages(prev => [...prev, replyMsg]);
      }, 1000);
    } catch (err) {
      console.warn('AI reply generation fallback:', err);
    }
  };

  useEffect(() => {
    let t: number;
    if (isCallingActive) {
      t = window.setInterval(() => setInCallSeconds(s => s + 1), 1000);
    }
    return () => clearInterval(t);
  }, [isCallingActive]);

  const activeSos = !isSosDismissed ? (sosEvents.find(e => e.status === 'ACTIVE') || null) : null;

  return (
    <div className="relative w-full h-full min-h-[300px] flex-1 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 flex flex-col" style={{ height }}>
      
      {/* Top Map Action Bar */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-30 flex items-center justify-between gap-1.5 pointer-events-none">
        
        {/* Left: Sea Area Selector & Search (User Requirement 2: 해역 필터는 컴팩트하게, 검색창과 한 화면 동시 표시, 굵기 강화) */}
        <div className="flex-1 min-w-0 flex items-center gap-1.5 pointer-events-auto">
          {/* Sea Area Selector (User Requirement 2: 조금 작게) */}
          <div className={`bg-slate-900/95 backdrop-blur-md rounded-xl border-2 border-slate-700/90 shadow-lg flex items-center gap-1 text-white shrink-0 transition ${
            isCompact ? 'px-2 py-1.5' : 'px-2.5 py-1.5'
          }`}>
            <Compass className="w-3.5 h-3.5 text-cyan-400 shrink-0 stroke-[2.5]" />
            <select
              value={selectedRegion}
              onChange={(e) => {
                audioHelper.playTap();
                setSelectedRegion(e.target.value as keyof typeof KOREA_SEA_REGIONS);
              }}
              className="bg-transparent border-none text-[11px] font-black text-slate-100 focus:outline-none cursor-pointer pr-0.5"
            >
              <option value="KOREA_ALL" className="bg-slate-900">{isCompact ? '전국' : '전국 연근해 (종합)'}</option>
              <option value="SOUTH_SEA" className="bg-slate-900">{isCompact ? '남해' : '남해 (여수·통영·부산)'}</option>
              <option value="WEST_SEA" className="bg-slate-900">{isCompact ? '서해' : '서해 (인천·태안·목포)'}</option>
              <option value="EAST_SEA" className="bg-slate-900">{isCompact ? '동해' : '동해 (강릉·속초·포항)'}</option>
              <option value="JEJU_SEA" className="bg-slate-900">{isCompact ? '제주' : '제주 (제주항·서귀포)'}</option>
              <option value="OUTER_SEA" className="bg-slate-900">{isCompact ? '원해' : '원해·외해 먼바다 (대화퇴·이어도·EEZ)'}</option>
            </select>
          </div>

          {/* Search Input Bar (User Requirement 2: 검색창 동시 표시 & 굵기 border-2, font-bold 강화) */}
          <div className="flex-1 min-w-0 relative bg-slate-900/95 backdrop-blur-md rounded-xl border-2 border-slate-700/90 hover:border-slate-600 focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-500/30 shadow-lg flex items-center px-2 py-1 text-xs transition">
            <Search className="w-3.5 h-3.5 text-cyan-400 mr-1.5 shrink-0 stroke-[2.5]" />
            <input
              type="text"
              placeholder={isCompact ? "MMSI / 부호 / 어선번호" : "MMSI / 호출부호 / 어선번호 검색"}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-white text-[11px] placeholder-slate-400 font-bold font-mono focus:outline-none w-full min-w-0"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-white p-0.5 ml-1 shrink-0"
                title="검색 초기화"
              >
                <X className="w-3 h-3 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>

        {/* Right: Engine Switch & Zoom Controls (Ctrl 키 없이 바로 확대/축소 가능!) */}
        <div className="flex items-center gap-1 shrink-0 pointer-events-auto">
          {/* Zoom In/Out Buttons (굵기 및 터치 감도 강화) */}
          <div className="bg-slate-900/95 backdrop-blur-md rounded-xl border-2 border-slate-700/90 shadow-lg flex items-center p-0.5">
            <button
              onClick={handleZoomIn}
              className="p-1.5 hover:bg-slate-800 text-slate-200 hover:text-white rounded-lg transition"
              title="지도 확대 (Ctrl 키 없이 마우스 휠로도 확대 가능)"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1.5 hover:bg-slate-800 text-slate-200 hover:text-white rounded-lg transition border-l-2 border-slate-800"
              title="지도 축소 (Ctrl 키 없이 마우스 휠로도 축소 가능)"
            >
              <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>

          <button
            onClick={handleCenterOwnShip}
            className="p-1.5 rounded-xl bg-slate-900/95 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 border-2 border-slate-700/90 shadow-lg transition"
            title={isControlCenter ? "중앙관제국(부산본부) 위치로 화면 이동" : "본선(플라잉 더치맨호) 위치로 중심 이동"}
          >
            <LocateFixed className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>

      </div>

      {/* [앱 전용] 상단 관공서 상태 뱃지 & 토글 버튼 (선박 구분은 5시 방향 네모칸으로 이동) */}
      {isCompact && (
        <div className="absolute top-12 left-2.5 z-25 flex items-center gap-1.5 bg-slate-950/90 backdrop-blur-md px-2 py-1 rounded-xl border border-slate-800 shadow-xl text-[10px] pointer-events-auto">
          <button
            onClick={() => {
              audioHelper.playTap();
              setShowAgencies(!showAgencies);
            }}
            className={`px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 border transition shrink-0 ${
              showAgencies
                ? 'bg-sky-600 text-white border-sky-400 shadow'
                : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title="지도 상 육상 주요 관공서 핀 표출 ON/OFF"
          >
            <Building2 className="w-3 h-3 text-white" />
            <span>주요 관공서 ({MARITIME_AGENCIES.length}): {showAgencies ? 'ON' : 'OFF'}</span>
          </button>

        </div>
      )}

      {/* [웹 전용] 주요 관공서 육상 표출 및 필터 바 (User Requirement: 웹에서 top-12에 단독 표출) */}
      {!isCompact && (
        <div className="absolute top-12 left-2.5 right-2.5 z-25 flex flex-wrap items-center gap-1 bg-slate-950/90 backdrop-blur-md px-2 py-1 rounded-xl border border-slate-800 shadow-xl text-[10px] pointer-events-auto">
          <button
            onClick={() => {
              audioHelper.playTap();
              setShowAgencies(!showAgencies);
            }}
            className={`px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 border transition shrink-0 ${
              showAgencies
                ? 'bg-sky-600 text-white border-sky-400 shadow'
                : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title="지도 상 육상 주요 관공서 핀 표출 ON/OFF"
          >
            <Building2 className="w-3 h-3 text-white" />
            <span>주요 관공서 ({MARITIME_AGENCIES.length}): {showAgencies ? 'ON' : 'OFF'}</span>
          </button>

          {showAgencies && (
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
              <button
                onClick={() => {
                  audioHelper.playTap();
                  setSelectedAgencyType('ALL');
                }}
                className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition shrink-0 ${
                  selectedAgencyType === 'ALL' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                전체
              </button>
              <button
                onClick={() => {
                  audioHelper.playTap();
                  setSelectedAgencyType(selectedAgencyType === 'SAFETY_BUREAU' ? 'ALL' : 'SAFETY_BUREAU');
                }}
                className={`px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-1 transition shrink-0 ${
                  selectedAgencyType === 'SAFETY_BUREAU' ? 'bg-sky-700 text-white border border-sky-400' : 'text-sky-300 hover:text-white'
                }`}
                title="어선안전조업국 (동그라미 별표 마커)"
              >
                <AgencyLogoEmblem agencyType="SAFETY_BUREAU" size={16} />
                <span>어선안전조업국</span>
              </button>
              <button
                onClick={() => {
                  audioHelper.playTap();
                  setSelectedAgencyType(selectedAgencyType === 'MOF' ? 'ALL' : 'MOF');
                }}
                className={`px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-1 transition shrink-0 ${
                  selectedAgencyType === 'MOF' ? 'bg-blue-700 text-white border border-blue-400' : 'text-blue-300 hover:text-white'
                }`}
                title="해양수산부 본부 및 청사 (동그라미 별표 마커)"
              >
                <AgencyLogoEmblem agencyType="MOF" size={16} />
                <span>해양수산부</span>
              </button>
              <button
                onClick={() => {
                  audioHelper.playTap();
                  setSelectedAgencyType(selectedAgencyType === 'FISHERY_MGMT' ? 'ALL' : 'FISHERY_MGMT');
                }}
                className={`px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-1 transition shrink-0 ${
                  selectedAgencyType === 'FISHERY_MGMT' ? 'bg-blue-700 text-white border border-blue-400' : 'text-blue-300 hover:text-white'
                }`}
                title="동·서·남해 어업관리단 (동그라미 별표 마커)"
              >
                <AgencyLogoEmblem agencyType="FISHERY_MGMT" size={16} />
                <span>어업관리단</span>
              </button>
              <button
                onClick={() => {
                  audioHelper.playTap();
                  setSelectedAgencyType(selectedAgencyType === 'OCEANS_REGIONAL' ? 'ALL' : 'OCEANS_REGIONAL');
                }}
                className={`px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-1 transition shrink-0 ${
                  selectedAgencyType === 'OCEANS_REGIONAL' ? 'bg-blue-700 text-white border border-blue-400' : 'text-blue-300 hover:text-white'
                }`}
                title="지방해양수산청 (동그라미 별표 마커)"
              >
                <AgencyLogoEmblem agencyType="OCEANS_REGIONAL" size={16} />
                <span>지방청</span>
              </button>
              <button
                onClick={() => {
                  audioHelper.playTap();
                  setSelectedAgencyType(selectedAgencyType === 'COAST_GUARD' ? 'ALL' : 'COAST_GUARD');
                }}
                className={`px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-1 transition shrink-0 ${
                  selectedAgencyType === 'COAST_GUARD' ? 'bg-amber-700 text-white border border-amber-400' : 'text-amber-300 hover:text-white'
                }`}
                title="지방 해양경찰서 (동그라미 별표 마커)"
              >
                <AgencyLogoEmblem agencyType="COAST_GUARD" size={16} />
                <span>해양경찰서</span>
              </button>
              <button
                onClick={() => {
                  audioHelper.playTap();
                  setSelectedAgencyType(selectedAgencyType === 'VTS' ? 'ALL' : 'VTS');
                }}
                className={`px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-1 transition shrink-0 ${
                  selectedAgencyType === 'VTS' ? 'bg-red-700 text-white border border-red-400' : 'text-red-300 hover:text-white'
                }`}
                title="해상교통관제센터 VTS (동그라미 별표 마커)"
              >
                <AgencyLogoEmblem agencyType="VTS" size={16} />
                <span>VTS(교통관제)</span>
              </button>

            </div>
          )}
        </div>
      )}

      {/* 5시 방향 네모: 선박 구분 범례 및 퀵 필터 박스 (User Requirement 3: 터치만으로 원하는 위치 이동 & 카테고리 터치 시 해당 선박 위치로 지도 이동) */}
      <div 
        ref={legendBoxRef}
        style={legendCustomPos ? { left: legendCustomPos.x, top: legendCustomPos.y, bottom: 'auto', right: 'auto' } : undefined}
        className={`absolute z-25 bg-slate-900/95 backdrop-blur-md shadow-2xl flex flex-col pointer-events-auto ring-1 ring-slate-800 transition-all ${
          isDraggingLegend ? 'scale-105 shadow-cyan-900/50 ring-cyan-500 cursor-grabbing duration-0' : 'duration-300 ease-out'
        } ${
          !legendCustomPos
            ? selectedVessel || (selectedAgency && !selectedVessel)
              ? isCompact
                ? selectedVessel ? 'bottom-[255px]' : 'bottom-[225px]'
                : selectedVessel ? 'bottom-[245px]' : 'bottom-[235px]'
              : 'bottom-9'
            : ''
        } ${
          !legendCustomPos ? (isCompact ? 'right-2' : 'right-3.5') : ''
        } ${
          isCompact
            ? 'p-1 rounded-xl border border-slate-700/80 gap-0.5 w-[92px] text-[10px]'
            : 'p-2 rounded-2xl border-2 border-slate-700/90 gap-1 w-[125px] text-[11px]'
        }`}
      >
        {/* Box Header - 컴팩트 드래그 핸들 및 타이틀 */}
        <div 
          className="flex items-center justify-between p-1 bg-gradient-to-r from-cyan-950/90 via-slate-900 to-cyan-950/90 border-b border-cyan-800/60 rounded-t-lg whitespace-nowrap cursor-grab active:cursor-grabbing select-none touch-none shadow-inner"
          onMouseDown={(e) => handleLegendDragStart(e.clientX, e.clientY)}
          onTouchStart={(e) => {
            if (e.touches.length > 0) {
              handleLegendDragStart(e.touches[0].clientX, e.touches[0].clientY);
            }
          }}
          title="터치/드래그하여 원하는 위치로 이동"
        >
          <div className="flex items-center gap-1 min-w-0">
            <div 
              className="flex items-center justify-center w-3.5 h-3.5 rounded bg-cyan-500/30 text-cyan-200 border border-cyan-400 shrink-0"
              title="이동 핸들"
            >
              <Move className="w-2 h-2 text-cyan-200 stroke-[3] shrink-0" />
            </div>
            <span className="font-black text-[10px] text-white truncate">선박 구분</span>
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            {legendCustomPos && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  audioHelper.playTap();
                  setLegendCustomPos(null);
                }}
                className="text-[8px] text-slate-300 hover:text-white p-0.5 rounded bg-slate-800 border border-slate-700 transition flex items-center"
                title="기본 위치 복귀"
              >
                <RotateCcw className="w-2 h-2" />
              </button>
            )}
            {selectedCategoryFilter !== 'ALL' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCategorySelectAndNavigate('ALL');
                }}
                className="text-[8px] text-cyan-300 hover:text-white font-bold px-1 py-0.2 rounded bg-cyan-900/80 border border-cyan-600 transition shrink-0"
                title="전체 선박 표시"
              >
                전체
              </button>
            )}
          </div>
        </div>

        {/* List of 5 categories - 색상 명칭 및 척수 삭제된 초슬림 컴팩트 버튼 */}
        <div className="flex flex-col gap-0.5">
          {/* 전체 선박 */}
          <button
            onClick={() => handleCategorySelectAndNavigate('ALL')}
            className={`w-full px-1.5 py-0.5 rounded font-bold flex items-center transition text-left active:scale-98 ${
              selectedCategoryFilter === 'ALL'
                ? 'bg-slate-700 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="전체 선박"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0 mr-1" />
            <span className="truncate">전체 선박</span>
          </button>

          {/* 1. 일반 가입자 */}
          <button
            onClick={() => handleCategorySelectAndNavigate('SUBSCRIBER')}
            className={`w-full px-1.5 py-0.5 rounded font-bold flex items-center border transition text-left active:scale-98 ${
              selectedCategoryFilter === 'SUBSCRIBER'
                ? 'bg-blue-600 text-white border-blue-400 shadow-sm'
                : 'bg-blue-950/30 text-blue-300 border-blue-900/50 hover:bg-blue-900/40'
            }`}
            title="일반 가입자"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mr-1" />
            <span className="truncate">일반 가입자</span>
          </button>

          {/* 2. 미 가입자 */}
          <button
            onClick={() => handleCategorySelectAndNavigate('NON_SUBSCRIBER')}
            className={`w-full px-1.5 py-0.5 rounded font-bold flex items-center border transition text-left active:scale-98 ${
              selectedCategoryFilter === 'NON_SUBSCRIBER'
                ? 'bg-slate-700 text-white border-slate-400 shadow-sm'
                : 'bg-slate-800/40 text-slate-300 border-slate-700/50 hover:bg-slate-800/60'
            }`}
            title="미 가입자"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0 mr-1" />
            <span className="truncate">미 가입자</span>
          </button>

          {/* 3. 조난 선박 */}
          <button
            onClick={() => handleCategorySelectAndNavigate('SOS')}
            className={`w-full px-1.5 py-0.5 rounded font-bold flex items-center border transition text-left active:scale-98 ${
              selectedCategoryFilter === 'SOS'
                ? 'bg-red-600 text-white border-red-400 shadow-sm'
                : 'bg-red-950/30 text-red-300 border-red-900/50 hover:bg-red-900/40'
            }`}
            title="조난 선박"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping shrink-0 mr-1" />
            <span className="truncate">조난 선박</span>
          </button>



          {/* 5. 조업(외해) */}
          <button
            onClick={() => handleCategorySelectAndNavigate('RESTRICTED')}
            className={`w-full px-1.5 py-0.5 rounded font-bold flex items-center border transition text-left active:scale-98 ${
              selectedCategoryFilter === 'RESTRICTED'
                ? 'bg-purple-600 text-white border-purple-400 shadow-sm'
                : 'bg-purple-950/30 text-purple-300 border-purple-900/50 hover:bg-purple-900/40'
            }`}
            title="조업(외해)"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0 mr-1" />
            <span className="truncate">조업(외해)</span>
          </button>

          {/* 초미니 도형 구분 가이드 */}
          <div className="pt-0.5 mt-0.5 border-t border-slate-800/80 flex items-center justify-between text-[7px] text-slate-400 font-medium px-0.5">
            <span className="flex items-center gap-0.5">
              <span className="w-1 h-1 rounded-full bg-sky-500 inline-block" /> 본선
            </span>
            <span className="flex items-center gap-0.5">
              <span className="text-[7px] text-cyan-400">▲</span> 타선
            </span>
            <span className="flex items-center gap-0.5">
              <span className="text-[7px] text-amber-400">✪</span> 관청
            </span>
          </div>
        </div>
      </div>

      {/* DISMISSIBLE SOS ALERT BANNER */}
      {activeSos && (
        <div className="absolute top-30 left-2.5 right-2.5 z-40 bg-red-600/95 backdrop-blur-md text-white px-3.5 py-2 rounded-xl text-xs flex items-center justify-between shadow-2xl border border-red-400 animate-pulse">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-white animate-spin shrink-0" />
            <div>
              <div className="font-black text-xs">
                조난 신호 수신: {activeSos.vessel.shipName} ({activeSos.accidentType})
              </div>
              <div className="text-[10px] text-red-100">
                {activeSos.seaArea} · 거리 {activeSos.distanceNM}NM · 구조선 접근 중
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => {
                audioHelper.playTap();
                onSelectVessel(activeSos.vessel);
                setIsSosDismissed(true);
                maritimeService.dismissSosBanner();
              }}
              className="px-2.5 py-1 bg-white text-red-600 font-extrabold text-[11px] rounded-lg shadow hover:bg-slate-100 transition"
            >
              상황 확인
            </button>
            <button
              onClick={() => {
                audioHelper.playTap();
                setIsSosDismissed(true);
                maritimeService.dismissSosBanner();
              }}
              className="p-1 text-red-200 hover:text-white rounded-lg transition"
              title="경고창 닫기"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* MAP VIEWPORT: Google Maps container (Standard Roadmap, gestureHandling: 'greedy') */}
      <div 
        ref={mapRef} 
        className={`absolute inset-0 w-full h-full z-10 transition-opacity duration-300 ${
          mapEngine === 'GOOGLE_MAPS' && mapLoaded ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* MAP VIEWPORT: Vector Radar Chart (Instant fallback & full zoom support without Ctrl) */}
      {(mapEngine === 'VECTOR_RADAR' || !mapLoaded) && (
        <div 
          className="absolute inset-0 w-full h-full bg-[#08182b] z-10 overflow-hidden flex items-center justify-center select-none"
          onWheel={(e) => {
            // Zoom without Ctrl!
            if (e.deltaY < 0) {
              setRadarZoom(z => Math.min(2.5, z + 0.15));
            } else {
              setRadarZoom(z => Math.max(0.6, z - 0.15));
            }
          }}
        >
          {/* Nautical Radar Rings */}
          <div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none transition-transform duration-200"
            style={{ transform: `scale(${radarZoom})` }}
          >
            <div className="absolute w-[220px] h-[220px] rounded-full border border-cyan-500/25" />
            <div className="absolute w-[440px] h-[440px] rounded-full border border-cyan-500/20" />
            <div className="absolute w-[660px] h-[660px] rounded-full border border-cyan-500/15" />
            
            <div className="absolute w-full h-[1px] bg-cyan-500/20" />
            <div className="absolute h-full w-[1px] bg-cyan-500/20" />

            {/* Sweeping Radar Beam */}
            <div 
              className="absolute w-[440px] h-[440px] rounded-full pointer-events-none"
              style={{
                background: 'conic-gradient(from 0deg, transparent 0deg, transparent 315deg, rgba(6, 182, 212, 0.25) 360deg)',
                animation: 'spin 4s linear infinite'
              }}
            />
          </div>

          {/* Center in Vector Radar (Web Control Center: Busan HQ / Mobile App: Flying Dutchman) */}
          <div className="absolute z-20 flex flex-col items-center pointer-events-auto">
            <div className="relative flex items-center justify-center">
              <span className="absolute w-12 h-12 rounded-full bg-blue-500/25 animate-ping" />
              <div className="w-8 h-8 rounded-full bg-blue-700 border-2 border-white flex items-center justify-center text-white shadow-xl">
                {isControlCenter ? <Building2 className="w-4 h-4" /> : <Ship className="w-4 h-4" />}
              </div>
            </div>
            <span className="mt-1 text-[10px] font-extrabold bg-blue-950/90 text-blue-300 px-2 py-0.5 rounded border border-blue-800 shadow">
              {isControlCenter ? '해양수산부 중앙관제국 (부산본부)' : '플라잉 더치맨호 (본선)'}
            </span>
          </div>

          {/* Real-Time Call Lines (주황색 실선) & SOS Rescue Approach Lines (빨간색 실선) in Vector Radar */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-15 overflow-visible">
            <g style={{ transform: 'translate(50%, 50%)' }}>
              {/* 1. 통화 중인 선박 간 주황색 실선 연결 */}
              {activeConnections.map(conn => {
                const v1 = vessels.find(v => v.mmsi === conn.callerMmsi);
                const v2 = vessels.find(v => v.mmsi === conn.receiverMmsi);
                if (!v1 || !v2) return null;
                const x1 = (v1.lng - 127.8) * 110 * radarZoom;
                const y1 = -(v1.lat - 35.6) * 130 * radarZoom;
                const x2 = (v2.lng - 127.8) * 110 * radarZoom;
                const y2 = -(v2.lat - 35.6) * 130 * radarZoom;
                return (
                  <line
                    key={conn.id}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#f97316"
                    strokeWidth="3"
                    strokeOpacity="0.95"
                  />
                );
              })}

              {/* 2. 조난선 긴급 구조 접근 선박 간 빨간색 실선 연결 */}
              {sosEvents.filter(e => e.status === 'ACTIVE' || e.status === 'RESPONDING').map(sos => {
                const dv = vessels.find(v => v.id === sos.vessel.id || v.mmsi === sos.vessel.mmsi) || sos.vessel;
                if (!dv) return null;
                const xDistress = (dv.lng - 127.8) * 110 * radarZoom;
                const yDistress = -(dv.lat - 35.6) * 130 * radarZoom;

                return sos.respondingVessels.map((rv, rIdx) => {
                  const matchName = rv.vesselName.replace(' (본선)', '').trim();
                  const vResp = vessels.find(v => 
                    v.shipName.includes(matchName) || 
                    matchName.includes(v.shipName) ||
                    (matchName.includes('해경') && v.vesselType === '해경 경비정')
                  );
                  if (!vResp) return null;
                  const xResp = (vResp.lng - 127.8) * 110 * radarZoom;
                  const yResp = -(vResp.lat - 35.6) * 130 * radarZoom;
                  return (
                    <line
                      key={`radar-sos-${sos.id}-${rIdx}`}
                      x1={xResp}
                      y1={yResp}
                      x2={xDistress}
                      y2={yDistress}
                      stroke="#ef4444"
                      strokeWidth="3"
                      strokeOpacity="0.95"
                    />
                  );
                });
              })}
            </g>
          </svg>

          {/* Interactive Vessel Blips */}
          {filteredVessels.filter(v => isControlCenter ? true : !v.isOwnShip).map((vessel) => {
            const dLng = (vessel.lng - 127.8) * 110 * radarZoom;
            const dLat = -(vessel.lat - 35.6) * 130 * radarZoom;
            const isSelected = selectedVessel?.id === vessel.id;

            return (
              <div
                key={vessel.id}
                onClick={() => {
                  audioHelper.playTap();
                  setSelectedAgency(null);
                  onSelectVessel(vessel);
                }}
                className={`absolute z-20 flex flex-col items-center cursor-pointer transition-transform ${
                  isSelected ? 'scale-125 z-40' : 'hover:scale-110'
                }`}
                style={{
                  transform: `translate(${dLng}px, ${dLat}px)`
                }}
              >
                {(() => {
                  const colorInfo = getVesselColorInfo(vessel, activeConnections);
                  return (
                    <>
                      <div 
                        className={`p-1.5 rounded-full border shadow-xl flex items-center justify-center ${
                          colorInfo.category === 'SOS' ? 'animate-bounce' : ''
                        }`}
                        style={{
                          backgroundColor: colorInfo.colorHex,
                          borderColor: colorInfo.strokeHex,
                          color: '#ffffff'
                        }}
                      >
                        <Ship className="w-3 h-3" />
                      </div>
                      <div className="mt-0.5 text-[9px] font-bold bg-slate-950/90 text-slate-100 px-1 py-0.2 rounded border border-slate-800 whitespace-nowrap shadow flex items-center gap-1">
                        <span>{vessel.shipName}</span>
                        <span className={`text-[8px] px-1 rounded ${colorInfo.badgeBg} ${colorInfo.badgeText}`}>
                          {colorInfo.shortLabel}
                        </span>
                      </div>
                    </>
                  );
                })()}
              </div>
            );
          })}

          {/* Maritime Agencies in Vector Radar */}
          {showAgencies && MARITIME_AGENCIES.filter(a => selectedAgencyType === 'ALL' || a.agencyType === selectedAgencyType).map((agency) => {
            const dLng = (agency.lng - 127.8) * 110 * radarZoom;
            const dLat = -(agency.lat - 35.6) * 130 * radarZoom;
            const isSelected = selectedAgency?.id === agency.id;

            // User Requirement: 크기가 너무 크다 선박보다 작게 부탁해. 대신 확대를 하면 할 수록 커지는 형태로 하자
            const radarAgencySize = Math.max(10, Math.min(32, Math.round(14 * radarZoom)));

            return (
              <div
                key={agency.id}
                onClick={() => {
                  audioHelper.playRadioChirp();
                  setSelectedAgency(agency);
                  onSelectVessel(null);
                }}
                className={`absolute z-20 flex flex-col items-center cursor-pointer transition-transform ${
                  isSelected ? 'scale-125 z-40' : 'hover:scale-110'
                }`}
                style={{
                  transform: `translate(${dLng}px, ${dLat}px)`
                }}
              >
                <AgencyLogoEmblem agencyType={agency.agencyType} size={radarAgencySize} className="shadow-md border border-white" />
                {radarZoom >= 1.0 && (
                  <div className="mt-0.5 text-[8px] font-bold bg-slate-950/90 text-slate-100 px-1 py-0.2 rounded border border-slate-700 whitespace-nowrap shadow">
                    {agency.name}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* COMPACT FLOATING VESSEL DRAWER (User requirement 1: 웹페이지 6시 방향 정중앙 배치 & 굵기 border-2 강화) */}
      {selectedVessel && (() => {
        const selectedColorInfo = getVesselColorInfo(selectedVessel, activeConnections);
        return (
          <div className={`absolute z-30 bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl flex flex-col gap-2.5 text-xs text-white animate-fadeIn ${
            isCompact
              ? 'bottom-2 left-2 right-2 p-3 max-h-[75vh] overflow-y-auto border-2 border-cyan-500/80 shadow-2xl shadow-black/80 ring-1 ring-cyan-400/30'
              : 'bottom-4 left-1/2 -translate-x-1/2 w-[94%] sm:w-[520px] md:w-[560px] p-3.5 max-h-[80vh] overflow-y-auto border-2 border-cyan-500/80 ring-2 ring-cyan-500/40 shadow-2xl shadow-cyan-950/80'
          }`}>
            {/* Top row: Vessel name, 5-color category badge, location move button, and close button */}
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                <div 
                  className="p-1 rounded-lg border text-white shrink-0"
                  style={{ backgroundColor: `${selectedColorInfo.colorHex}22`, borderColor: selectedColorInfo.colorHex }}
                >
                  <Ship className="w-3.5 h-3.5" style={{ color: selectedColorInfo.colorHex }} />
                </div>
                <span className="font-extrabold text-sm text-white truncate">{selectedVessel.shipName}</span>
                <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 shrink-0">
                  {selectedVessel.vesselType} ({selectedVessel.tonnage}t)
                </span>
                
                {/* 5-Color Distinction Badge */}
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border flex items-center gap-1 shrink-0 ${selectedColorInfo.badgeBg} ${selectedColorInfo.badgeBorder} ${selectedColorInfo.badgeText}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${selectedColorInfo.dotBg} ${selectedColorInfo.category === 'SOS' ? 'animate-ping' : ''}`} />
                  <span>{selectedColorInfo.label}</span>
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* 위치 이동 버튼 (User Requirement 1: 웹 관제센터 창을 참고한 위치 이동 버튼) */}
                <button
                  onClick={() => handleCenterVessel(selectedVessel)}
                  className="px-2 py-1 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-600/70 text-cyan-300 rounded-lg text-[11px] font-bold flex items-center gap-1 shadow transition active:scale-95"
                  title="선박 위치로 지도 중심 이동"
                >
                  <LocateFixed className="w-3 h-3 text-cyan-400" />
                  <span>위치 이동</span>
                </button>

                <button
                  onClick={() => onSelectVessel(null)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg transition"
                  title="정보창 닫기"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Status / Restriction message banner if restricted, SOS, or non-subscriber */}
            {selectedVessel.statusMessage && (
              <div className={`px-2.5 py-1.5 rounded-lg text-[11px] border font-medium flex items-center gap-2 ${
                selectedColorInfo.category === 'RESTRICTED'
                  ? 'bg-purple-950/60 border-purple-800 text-purple-200'
                  : selectedColorInfo.category === 'SOS'
                  ? 'bg-red-950/60 border-red-800 text-red-200'
                  : selectedColorInfo.category === 'NON_SUBSCRIBER'
                  ? 'bg-slate-800/80 border-slate-700 text-slate-300'
                  : 'bg-blue-950/50 border-blue-900 text-blue-200'
              }`}>
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" style={{ color: selectedColorInfo.colorHex }} />
                <span className="truncate">{selectedVessel.statusMessage}</span>
              </div>
            )}

            {/* Sleek, Non-Obstructing Info Bar with "상세정보 보기" button (User Requirement 1: 상세정보 보기를 클릭하면 새로운 창이 출력되도록 설정) */}
            <div className="flex items-center justify-between bg-slate-950/75 px-3 py-2 rounded-xl border border-slate-800 text-[11px] text-slate-300">
              <div className="flex items-center gap-2 truncate font-mono text-[10.5px]">
                <span>거리: <strong className="text-amber-400 font-bold">{selectedVessel.distanceNM} NM</strong></span>
                <span className="text-slate-600">|</span>
                <span>속력: <strong className="text-cyan-400 font-bold">{selectedVessel.speedKnots} kts</strong></span>
                <span className="text-slate-600 hidden sm:inline">|</span>
                <span className="hidden sm:inline">방위: <strong className="text-emerald-400 font-bold">{selectedVessel.headingDeg}°</strong></span>
              </div>

              <button
                onClick={() => {
                  audioHelper.playTap();
                  setShowVesselSpecModal(true);
                }}
                className="px-2.5 py-1 bg-gradient-to-r from-blue-700 to-cyan-700 hover:from-blue-600 hover:to-cyan-600 active:scale-95 text-white font-extrabold rounded-lg text-[10px] flex items-center gap-1 shadow transition shrink-0 border border-cyan-500/40"
                title="MMSI, 호출부호, 어선번호, 선장, 상세 침로 및 제원 팝업 열기"
              >
                <FileText className="w-3 h-3 text-cyan-300" />
                <span>상세정보 보기</span>
              </button>
            </div>

            {/* Bottom Call & Chat Action Row (User Requirements 1, 4, 5, 7) */}
            <div className="pt-0.5 space-y-2">
              
              {/* Call Warning / Block Message (User Requirement 5: 1:1 통화 제한 및 동시 통화 방지 알림) */}
              {callWarningMessage && (
                <div className="bg-red-950/95 border-2 border-red-500 text-red-200 px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between gap-2 shadow-lg animate-fadeIn">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    <span className="truncate">{callWarningMessage}</span>
                  </div>
                  {maritimeService.isOwnShipInCall() && (
                    <button
                      onClick={() => {
                        audioHelper.playTap();
                        maritimeService.endOwnShipCall();
                        handleEndDrawerCall();
                        setAgencyCallPhase('IDLE');
                        setCallWarningMessage('본선 통화가 즉시 종료되었습니다.');
                        setTimeout(() => setCallWarningMessage(null), 2500);
                      }}
                      className="px-2.5 py-1 bg-red-600 hover:bg-red-500 active:scale-95 text-white rounded-lg text-[10px] font-black transition shrink-0 shadow flex items-center gap-1"
                    >
                      <PhoneOff className="w-3 h-3" />
                      <span>기존 통화 끊기</span>
                    </button>
                  )}
                </div>
              )}

              {!selectedVessel.isOwnShip ? (
                callPhase === 'RINGING' ? (
                  /* 1. Ringing State (통화 연결음 송출 중) */
                  <div className="bg-amber-950/90 border-2 border-amber-500 text-amber-200 px-3.5 py-2.5 rounded-xl flex items-center justify-between text-xs font-bold animate-pulse shadow-lg">
                    <div className="flex items-center gap-2.5">
                      <Phone className="w-4 h-4 text-amber-400 animate-bounce" />
                      <div className="flex flex-col">
                        <span className="text-white font-black">통화 연결음 송출 중...</span>
                        <span className="text-[10px] text-amber-300 font-normal">
                          {selectedVessel.shipName} ({selectedVessel.safePhoneNumber || '0504 안심번호'}) 수신 대기 중
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={handleEndDrawerCall}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-500 active:scale-95 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition shadow"
                    >
                      <PhoneOff className="w-3.5 h-3.5" />
                      <span>발신 취소</span>
                    </button>
                  </div>
                ) : callPhase === 'CONNECTED' ? (
                  /* 2. Connected In-Call State (1:1 안심 통화 중 & 음성 대화 및 실시간 내용 요약) */
                  <div className="bg-emerald-950/95 border-2 border-emerald-500 text-emerald-200 p-2.5 rounded-xl flex flex-col gap-2 shadow-xl animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-white font-black text-xs">1:1 안심번호 통화 중</span>
                          <span className="text-emerald-300 font-mono text-[11px] bg-emerald-900/90 px-2 py-0.5 rounded font-black border border-emerald-700">
                            {Math.floor(inCallSeconds / 60).toString().padStart(2, '0')}:{(inCallSeconds % 60).toString().padStart(2, '0')}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={handleEndDrawerCall}
                        className="px-3 py-1 bg-red-600 hover:bg-red-500 active:scale-95 text-white rounded-lg text-xs font-black flex items-center gap-1 transition shadow shadow-red-950 shrink-0"
                      >
                        <PhoneOff className="w-3.5 h-3.5" />
                        <span>통화 종료</span>
                      </button>
                    </div>

                    {/* 실시간 내용 요약 문구 출력 영역 (User Requirement: TTS 음성과 100% 일치 동기화) */}
                    {(() => {
                      const callData = getVesselCallDialogueAndSummary(selectedVessel, inCallSeconds);
                      return (
                        <div className="p-2 bg-emerald-900/60 rounded-lg border border-emerald-500/70 flex flex-col gap-1.5 shadow-inner">
                          <div className="flex items-start gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0 mt-0.5 animate-pulse" />
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="text-[9px] font-black text-cyan-300 bg-cyan-950 px-1.5 py-0.2 rounded border border-cyan-800">
                                  AI 실시간 통화 요약
                                </span>
                                <span className="text-[9px] text-emerald-300 font-medium truncate">
                                  {selectedVessel.shipName} ({selectedVessel.captainName})
                                </span>
                              </div>
                              <p className="text-[11px] text-emerald-100 font-extrabold leading-snug">
                                {callData.summary}
                              </p>
                            </div>
                          </div>

                          {/* 실시간 TTS 교신 음성 원문 표시 */}
                          <div className="pt-1 border-t border-emerald-700/60 text-[10px] text-emerald-200/90 flex items-start gap-1 font-mono">
                            <span className="text-emerald-400 font-bold shrink-0">🎙️ 교신 음성:</span>
                            <span className="italic leading-tight">&quot;{callData.speech}&quot;</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  /* 3. Normal Idle State (Action Buttons: 통화, 문자, 신고/차단) */
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    {/* 1. 050 안심번호 통화 버튼 (1:1 통화, 링백톤 + TTS 음성) */}
                    {(() => {
                      const isBusy = maritimeService.isVesselInCall(selectedVessel.mmsi, selectedVessel.id, selectedVessel.shipName);
                      return (
                        <button
                          onClick={() => handleStartDrawerCall(selectedVessel)}
                          disabled={selectedVessel.isBlacklisted || isBusy}
                          className={`flex-1 min-w-[100px] py-2 px-3 rounded-xl text-xs font-bold shadow flex items-center justify-center gap-1.5 transition active:scale-98 ${
                            selectedVessel.isBlacklisted
                              ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                              : isBusy
                              ? 'bg-slate-800/90 text-amber-300 border border-amber-800/80 cursor-not-allowed'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950'
                          }`}
                          title={
                            selectedVessel.isBlacklisted
                              ? '차단된 선박입니다'
                              : isBusy
                              ? '현재 다른 선박과 1:1 통화 중입니다 (발신 불가)'
                              : `050 안심번호 통화 (${selectedVessel.safePhoneNumber || '0504-****-****'})`
                          }
                        >
                          <Phone className="w-3.5 h-3.5 shrink-0" />
                          <span className="font-bold">
                            {selectedVessel.isBlacklisted
                              ? '통화 차단됨'
                              : isBusy
                              ? '1:1 통화 중 (발신불가)'
                              : '050 안심통화'}
                          </span>
                        </button>
                      );
                    })()}

                    {/* 2. 문자 / 채팅 버튼 */}
                    {selectedVessel.isSubscriber ? (
                      <button
                        onClick={() => handleOpenQuickChat(selectedVessel)}
                        disabled={selectedVessel.isBlacklisted}
                        className={`py-2 px-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 active:scale-98 text-white rounded-xl text-xs font-bold shadow flex items-center justify-center gap-1.5 transition shrink-0 ${
                          selectedVessel.isBlacklisted ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        title="선박과 실시간 문자 및 무선 채팅"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>문자/채팅</span>
                      </button>
                    ) : (
                      <div
                        className="py-2 px-3 bg-slate-800/90 border border-slate-700 text-slate-400 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 cursor-not-allowed select-none opacity-85 shrink-0"
                        title="미가입 선박은 채팅기능을 제공할 수 없습니다. 050 안심번호 전화만 이용 가능합니다."
                      >
                        <MessageSquareOff className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="text-[11px]">채팅 불가 (미가입 선박)</span>
                      </div>
                    )}

                    {/* 3. 특정 선박 신고 / 블랙리스트 버튼 (User Requirement 7) */}
                    <button
                      onClick={() => {
                        audioHelper.playTap();
                        setShowReportModal(true);
                      }}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1 shrink-0 ${
                        selectedVessel.isBlacklisted 
                          ? 'bg-rose-950/80 border-rose-500 text-rose-300 hover:bg-rose-900' 
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-rose-300 border-slate-700'
                      }`}
                      title="특정 선박 안전 위반 신고 및 050 통화 차단(블랙리스트)"
                    >
                      {selectedVessel.isBlacklisted ? (
                        <>
                          <Ban className="w-3.5 h-3.5 text-rose-400" />
                          <span>차단 해제</span>
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                          <span>신고/차단</span>
                        </>
                      )}
                    </button>
                  </div>
                )
              ) : (
                <div className="p-2.5 bg-blue-950/60 border border-blue-800 text-blue-200 rounded-xl text-center text-xs font-bold flex items-center justify-center gap-2">
                  <Ship className="w-4 h-4 text-cyan-400" />
                  <span>현재 운항 중인 본선 (My Vessel)입니다.</span>
                  <button
                    onClick={() => handleCenterVessel(selectedVessel)}
                    className="ml-2 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1"
                  >
                    <LocateFixed className="w-3 h-3" />
                    <span>본선 위치 이동</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* FLOATING MARITIME AGENCY DRAWER (User requirement 6: 주요 관공서 통화 연결 버그 해결) */}
      {selectedAgency && !selectedVessel && (
        <div className={`absolute z-35 bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl flex flex-col gap-2.5 text-xs text-white animate-fadeIn overflow-y-auto max-h-[82vh] scrollbar-thin scrollbar-thumb-sky-700/60 ${
          isCompact
            ? 'bottom-2 left-2 right-2 p-3 border-2 border-sky-600/90'
            : 'bottom-4 left-1/2 -translate-x-1/2 w-[94%] sm:w-[500px] md:w-[540px] p-4 border-2 border-sky-500/70 ring-2 ring-sky-500/30 shadow-2xl shadow-sky-950/70'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="relative shrink-0">
                <AgencyLogoEmblem agencyType={selectedAgency.agencyType} size={36} className="shadow-lg border-2 border-white ring-1 ring-slate-700" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-black text-sm text-white truncate">{selectedAgency.name}</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold border ${selectedAgency.badgeColor.bg} ${selectedAgency.badgeColor.border} ${selectedAgency.badgeColor.text}`}>
                    {selectedAgency.categoryLabel}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{selectedAgency.address}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                handleEndAgencyCall();
                setSelectedAgency(null);
              }}
              className="p-1 text-slate-400 hover:text-white rounded-lg transition shrink-0"
              title="관공서 정보 닫기"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-1.5 bg-slate-950/80 p-2 rounded-xl border border-slate-800 text-[11px] font-mono">
            <div>
              <span className="text-slate-500">직통 전화:</span>{' '}
              <span className="text-cyan-400 font-bold">{selectedAgency.phone}</span>
            </div>
            <div>
              <span className="text-slate-500">비상 무전:</span>{' '}
              <span className="text-emerald-400 font-bold">{selectedAgency.emergencyVhf || 'VHF CH 16'}</span>
            </div>
            <div className="col-span-2 text-[10px] truncate">
              <span className="text-slate-500">관할:</span>{' '}
              <span className="text-slate-200">{selectedAgency.jurisdiction}</span>
            </div>
            <div className="col-span-2 pt-1 border-t border-slate-800/80 text-[10px]">
              <span className="text-slate-500">임무:</span>{' '}
              <span className="text-slate-300 font-sans">{selectedAgency.keyDuty}</span>
            </div>
          </div>

          {/* Action buttons with Ringing & Connected State for Public Agencies (User Requirement 6) */}
          <div className="pt-0.5">
            {agencyCallPhase === 'RINGING' ? (
              <div className="bg-amber-950/90 border-2 border-amber-500 text-amber-200 px-3.5 py-2.5 rounded-xl flex items-center justify-between text-xs font-bold animate-pulse shadow-lg">
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-amber-400 animate-bounce" />
                  <div className="flex flex-col">
                    <span className="text-white font-black">관공서 비상 핫라인 연결음 송출 중...</span>
                    <span className="text-[10px] text-amber-300 font-normal">
                      {selectedAgency.name} 직통망 호출 중 ({selectedAgency.phone})
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleEndAgencyCall}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-500 active:scale-95 text-white rounded-lg text-xs font-bold transition shadow"
                >
                  <PhoneOff className="w-3.5 h-3.5" />
                  <span>연결 취소</span>
                </button>
              </div>
            ) : agencyCallPhase === 'CONNECTED' ? (
              <div className="bg-sky-950/95 border-2 border-sky-400 text-sky-200 p-2.5 rounded-xl flex flex-col gap-2 shadow-xl animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-ping shrink-0" />
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-white font-black text-xs">{selectedAgency.name} 직통 통화 중</span>
                      <span className="text-sky-300 font-mono text-[11px] bg-sky-900/90 px-2 py-0.5 rounded font-black border border-sky-700">
                        {Math.floor(agencyInCallSeconds / 60).toString().padStart(2, '0')}:{(agencyInCallSeconds % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleEndAgencyCall}
                    className="px-3 py-1 bg-red-600 hover:bg-red-500 active:scale-95 text-white rounded-lg text-xs font-black flex items-center gap-1 transition shadow shadow-red-950 shrink-0"
                  >
                    <PhoneOff className="w-3.5 h-3.5" />
                    <span>통화 종료</span>
                  </button>
                </div>

                {/* 관공서 실시간 내용 요약 문구 (TTS 음성과 100% 일치 동기화) */}
                {(() => {
                  const agencyData = getAgencyCallDialogueAndSummary(selectedAgency, agencyInCallSeconds, isControlCenter);
                  return (
                    <div className="p-2 bg-sky-900/60 rounded-lg border border-sky-400/70 flex flex-col gap-1.5 shadow-inner">
                      <div className="flex items-start gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0 mt-0.5 animate-pulse" />
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[9px] font-black text-cyan-300 bg-cyan-950 px-1.5 py-0.2 rounded border border-cyan-800">
                              AI 실시간 통화 요약
                            </span>
                            <span className="text-[9px] text-sky-300 font-medium truncate">
                              {selectedAgency.name} 당직 상황실
                            </span>
                          </div>
                          <p className="text-[11px] text-sky-100 font-extrabold leading-snug">
                            {agencyData.summary}
                          </p>
                        </div>
                      </div>

                      {/* 실시간 상황실 TTS 음성 원문 표시 */}
                      <div className="pt-1 border-t border-sky-700/60 text-[10px] text-sky-200/90 flex items-start gap-1 font-mono">
                        <span className="text-sky-300 font-bold shrink-0">🎙️ 상황실 음성:</span>
                        <span className="italic leading-tight">&quot;{agencyData.speech}&quot;</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleStartAgencyCall(selectedAgency)}
                  className="flex-1 py-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-lg flex items-center justify-center gap-1.5 transition active:scale-98"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>관공서 비상 직통 통화 (050 안전망)</span>
                </button>
                <button
                  onClick={() => {
                    audioHelper.playTap();
                    if (mapInstanceRef.current) {
                      mapInstanceRef.current.panTo({ lat: selectedAgency.lat, lng: selectedAgency.lng });
                      mapInstanceRef.current.setZoom(12);
                    }
                  }}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition flex items-center gap-1 shrink-0"
                >
                  <LocateFixed className="w-3.5 h-3.5 text-cyan-400" />
                  <span>위치 이동</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AIS Telemetry Status Badge */}
      <div className="absolute z-20 bg-slate-950/85 backdrop-blur-md px-2 py-0.5 rounded-lg border border-slate-800 text-[10px] text-slate-400 font-mono pointer-events-none flex items-center gap-1 bottom-1.5 left-2.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span>전국 연근해·원해 선박 {vessels.length}척 (마우스 휠로 확대 가능)</span>
      </div>

      {/* Floating Maritime Quick Chat Modal (User Requirements 4 & 5) */}
      {activeChatVessel && (
        <div className="absolute inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 animate-fadeIn pointer-events-auto">
          <div className="bg-slate-900 border-2 border-cyan-500/70 rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden text-white">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 px-3.5 py-2.5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-cyan-950/80 rounded-lg border border-cyan-700/60 text-cyan-400">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-white">{activeChatVessel.shipName}</span>
                    <span className="text-[10px] bg-blue-900/60 text-blue-300 px-1.5 py-0.2 rounded font-mono">
                      {activeChatVessel.callSign}
                    </span>
                    <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1 rounded flex items-center gap-1 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      위성통신 양호
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    선장 {activeChatVessel.captainName} · 안심번호 {activeChatVessel.safePhoneNumber}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActiveChatVessel(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="채팅창 닫기"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages box */}
            <div className="p-3 space-y-2.5 max-h-[260px] min-h-[160px] overflow-y-auto bg-slate-950/40 text-xs">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'ME' ? 'items-end' : 'items-start'}`}
                >
                  <div className={`max-w-[85%] px-3 py-2 rounded-2xl ${
                    msg.sender === 'ME'
                      ? 'bg-blue-600 text-white rounded-tr-none shadow'
                      : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700/70 shadow'
                  }`}>
                    <p className="leading-relaxed">{msg.text}</p>
                  </div>
                  <span className="text-[9px] text-slate-500 mt-0.5 px-1 font-mono">{msg.time}</span>
                </div>
              ))}
            </div>

            {/* Quick canned messages with Triangle Toggle & Vertical List (User Requirement: 상하 리스트 & 삼각형 토글) */}
            <MaritimeQuickPhrasesDropdown
              onSelectPhrase={(msg) => handleSendChatMessage(msg)}
              dropDirection="up"
            />

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChatMessage();
              }}
              className="p-2.5 bg-slate-900 border-t border-slate-800 flex items-center gap-2"
            >
              <input
                type="text"
                value={chatInputText}
                onChange={(e) => setChatInputText(e.target.value)}
                placeholder="전달할 문자 메시지를 입력하세요..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                disabled={!chatInputText.trim()}
                className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:hover:bg-cyan-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow"
              >
                <Send className="w-3.5 h-3.5" />
                <span>전송</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Vessel Report & Blacklist Modal (User Requirement 7: 특정 선박을 신고하거나 블랙 리스트에 넣는 기능) */}
      {showReportModal && selectedVessel && (
        <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 animate-fadeIn pointer-events-auto">
          <div className="bg-slate-900 border-2 border-rose-500/80 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-white flex flex-col">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950 px-4 py-3 border-b border-rose-800/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-rose-600/30 rounded-lg border border-rose-500 text-rose-300">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white flex items-center gap-1.5">
                    선박 안전 신고 및 블랙리스트 설정
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    대상 선박: <strong className="text-cyan-300">{selectedVessel.shipName}</strong> ({selectedVessel.mmsi})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-3.5 text-xs text-slate-300">
              
              {/* Toast message if submitted */}
              {reportSuccessMsg && (
                <div className="p-2.5 rounded-xl bg-emerald-950 border border-emerald-500 text-emerald-200 text-xs font-bold flex items-center gap-2 animate-pulse">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>{reportSuccessMsg}</span>
                </div>
              )}

              {/* Action Option 1: Blacklist Toggle */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Ban className="w-3.5 h-3.5 text-rose-400" />
                    050 통화 및 문자 수신 차단 (블랙리스트)
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    selectedVessel.isBlacklisted ? 'bg-rose-900 text-rose-200' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {selectedVessel.isBlacklisted ? '현재 차단됨' : '정상 교신'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  블랙리스트로 등록하면 해당 선박과의 050 안심번호 통화 및 상호 문자 메시지 교신이 즉시 차단됩니다.
                </p>
                <button
                  type="button"
                  onClick={() => handleToggleBlacklist(selectedVessel)}
                  className={`w-full py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow ${
                    selectedVessel.isBlacklisted
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600'
                      : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950'
                  }`}
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>{selectedVessel.isBlacklisted ? '블랙리스트 차단 해제' : '해당 선박 즉시 차단하기'}</span>
                </button>
              </div>

              {/* Action Option 2: Report to VTS & Coast Guard */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2.5">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Flag className="w-3.5 h-3.5 text-amber-400" />
                  해양경찰 / VTS 상황실에 안전 위반 신고
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold">신고 사유 선택:</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-rose-400"
                  >
                    <option value="위험 항해 및 침로 방해">위험 항해 및 침로 방해 (충돌 위험)</option>
                    <option value="불법 어구 설치 및 조업 의심">불법 어구 설치 및 불법 조업 의심</option>
                    <option value="VHF 무응답 및 안전 통신 거부">VHF 무응답 및 안전 통신 거부</option>
                    <option value="음주 운항 및 이상 지그재그 항적 의심">음주 운항 및 비정상 지그재그 항적 의심</option>
                    <option value="통화 중 폭언 및 허위 조난 유포">통화 중 폭언 및 허위 조난 유포</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold">상세 내용 (선택):</label>
                  <textarea
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="신고할 상황을 간단히 입력하세요..."
                    rows={2}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400 resize-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleSubmitReport(selectedVessel)}
                  className="w-full py-2 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow shadow-amber-950"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>해경·VTS 관제국에 공식 신고 접수</span>
                </button>
              </div>

            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
              >
                닫기
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. Vessel Specification Detail Modal (User Requirement 1: 상세정보 보기 클릭 시 새로운 창으로 출력되어 운항지도를 가리지 않음) */}
      {/* ======================================================== */}
      {showVesselSpecModal && selectedVessel && (() => {
        const specColorInfo = getVesselColorInfo(selectedVessel, activeConnections);
        return (
          <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 animate-fadeIn pointer-events-auto">
            <div className="bg-slate-900 border-2 border-cyan-500/80 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden text-white flex flex-col h-[94%] max-h-[94%]">
              
              {/* Header */}
              <div className="bg-gradient-to-r from-cyan-950 via-slate-900 to-blue-950 px-4 py-3.5 border-b border-cyan-800/60 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div 
                    className="p-2 rounded-xl border text-white shrink-0 shadow-lg"
                    style={{ backgroundColor: `${specColorInfo.colorHex}22`, borderColor: specColorInfo.colorHex }}
                  >
                    <Ship className="w-5 h-5" style={{ color: specColorInfo.colorHex }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-base text-white">{selectedVessel.shipName}</h3>
                      <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-mono">
                        {selectedVessel.vesselType} ({selectedVessel.tonnage}t)
                      </span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border flex items-center gap-1 ${specColorInfo.badgeBg} ${specColorInfo.badgeBorder} ${specColorInfo.badgeText}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${specColorInfo.dotBg} ${specColorInfo.category === 'SOS' ? 'animate-ping' : ''}`} />
                        <span>{specColorInfo.label}</span>
                      </span>
                    </div>
                    <p className="text-[11px] text-cyan-300 font-mono mt-0.5">선박 등록·제원 및 실시간 항해 텔레메트리 상세 보고서</p>
                  </div>
                </div>
              <button
                onClick={() => {
                  audioHelper.playTap();
                  setShowVesselSpecModal(false);
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
                title="상세정보 창 닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 min-h-0 p-4 sm:p-5 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-cyan-700/50">
              
              {/* Status Message if present */}
              {selectedVessel.statusMessage && (
                <div className="p-2.5 rounded-xl bg-cyan-950/60 border border-cyan-800 text-cyan-200 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="font-medium">{selectedVessel.statusMessage}</span>
                </div>
              )}

              {/* Section 1: 선박 등록 및 식별부호 (MMSI, 호출부호, 어선번호) */}
              <div className="bg-slate-950 rounded-2xl p-3.5 border border-slate-800 space-y-2.5">
                <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <span>선박 공인 식별 및 등록 정보</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block mb-0.5">MMSI 고유 식별번호</span>
                    <strong className="text-cyan-300 text-sm font-bold tracking-wider">{selectedVessel.mmsi}</strong>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block mb-0.5">호출부호 (CallSign)</span>
                    <strong className="text-cyan-300 text-sm font-bold tracking-wider">{selectedVessel.callSign}</strong>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block mb-0.5">어선 등록번호</span>
                    <strong className="text-slate-200 text-xs font-medium">{selectedVessel.registrationNo || '미기재'}</strong>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block mb-0.5">050 안심통화 번호</span>
                    <strong className="text-emerald-400 text-xs font-bold">{selectedVessel.safePhoneNumber || '0504-****-****'}</strong>
                  </div>
                </div>
              </div>

              {/* Section 2: 운항 텔레메트리 (선장, 거리, 속력, 방위) */}
              <div className="bg-slate-950 rounded-2xl p-3.5 border border-slate-800 space-y-2.5">
                <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Navigation className="w-4 h-4 text-emerald-400" />
                  <span>실시간 운항 및 침로 텔레메트리</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block mb-0.5">선장명</span>
                    <strong className="text-slate-100 text-xs font-bold truncate block">{selectedVessel.captainName}</strong>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block mb-0.5">본선과의 거리</span>
                    <strong className="text-amber-400 text-xs font-bold">{selectedVessel.distanceNM} NM</strong>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block mb-0.5">현재 속력</span>
                    <strong className="text-cyan-400 text-xs font-bold">{selectedVessel.speedKnots} kts</strong>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block mb-0.5">방위 / 침로</span>
                    <strong className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                      <Compass className="w-3 h-3 text-emerald-400 shrink-0" />
                      {selectedVessel.headingDeg}° ({getCompassDirection(selectedVessel.headingDeg)})
                    </strong>
                  </div>
                </div>
              </div>

              {/* Section 3: 위성 통신 및 안전 상태 */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">위성 통신(Starlink):</span>
                  <span className="text-emerald-400 font-bold">{selectedVessel.satelliteSignal || 'EXCELLENT'}</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">050 가입 여부:</span>
                  <span className={selectedVessel.isSubscriber ? 'text-blue-400 font-bold' : 'text-slate-500'}>
                    {selectedVessel.isSubscriber ? '가입 선박' : '미가입'}
                  </span>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
              <button
                onClick={() => handleCenterVessel(selectedVessel)}
                className="px-3 py-1.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-600/70 text-cyan-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition active:scale-95"
              >
                <LocateFixed className="w-3.5 h-3.5 text-cyan-400" />
                <span>선박 위치로 지도 이동</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  audioHelper.playTap();
                  setShowVesselSpecModal(false);
                }}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition active:scale-95"
              >
                닫기
              </button>
            </div>

          </div>
        </div>
        );
      })()}

    </div>
  );
};
