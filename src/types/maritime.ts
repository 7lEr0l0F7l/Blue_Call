// Core Maritime Types for AI-based Maritime Administration & Field Communication Platform (BlueCall)

export type VesselStatus = 'NORMAL' | 'FISHING' | 'ANCHORED' | 'HAZARD' | 'SOS';

export type VesselType = 
  | '연안통발' 
  | '연안복합' 
  | '근해자망' 
  | '근해안강망' 
  | '어선(채낚기)' 
  | '어업지도선' 
  | '해경 경비정' 
  | '상선/화물선';

export interface MaritimeVessel {
  id: string;
  mmsi: string;
  shipName: string;
  vesselType: VesselType;
  tonnage: number;
  callSign: string;
  registrationNo: string;
  captainName: string;
  safePhoneNumber: string; // 050-XXXX-XXXX
  lat: number;
  lng: number;
  speedKnots: number;
  headingDeg: number;
  status: VesselStatus;
  statusMessage?: string; // e.g., "연안 통발 양망 중 - 인근 접근 주의"
  distanceNM?: number;
  bearingDeg?: number;
  isOwnShip?: boolean;
  batteryLevel?: number;
  satelliteSignal?: 'EXCELLENT' | 'GOOD' | 'FAIR';
  isSubscriber?: boolean; // 일반 가입자 여부 (true: 청색 일반 가입자, false: 회색 미가입자)
  isRestrictedOperation?: boolean; // 조업 중 어구 훼손방지 및 충돌회피 불가 접근제한 선박 (보라색 추천)
  isBlacklisted?: boolean; // 특정 선박 블랙리스트 차단 여부
  blacklistedReason?: string; // 블랙리스트 차단 사유
  reportCount?: number; // 신고 횟수
  reports?: Array<{ id: string; reason: string; timestamp: string; details?: string; reporter: string }>;
}

export type MaritimeAccidentType = 
  | '기관고장'
  | '침몰'
  | '폭발'
  | '화재'
  | '화재/폭발' 
  | '침수/전복' 
  | '침수'
  | '전복'
  | '응급환자' 
  | '해상추락' 
  | '충돌위험'
  | '좌초'
  | '충돌';

export interface MaritimeSosEvent {
  id: string;
  vessel: MaritimeVessel;
  timestamp: string;
  accidentType: MaritimeAccidentType;
  status: 'ACTIVE' | 'RESPONDING' | 'RESOLVED';
  priority: 'CRITICAL' | 'HIGH';
  lat: number;
  lng: number;
  seaArea: string;
  distanceNM: number;
  bearingDeg: number;
  surroundingNotifiedCount: number;
  respondingVessels: {
    vesselName: string;
    distanceNM: number;
    etaMinutes: number;
    status: '접근 중' | '구조 완료' | '상황 대기' | '출동 중';
  }[];
  dispatchAgency?: '해양경찰청 122' | '동·남해어업관리단' | '항만소방정대';
  dispatchedVesselName?: string;
  actionLogs: {
    timestamp: string;
    action: string;
    actor: string;
  }[];
  notes?: string;
}

export interface AiCallSummary {
  category: '업무 요청' | '안전 주의' | '어장 협조' | '긴급 지원' | '일반 소통';
  summaryText: string;
  actionRequired: string;
  publicDataRegistered: boolean;
  registeredToVTS: boolean;
}

export interface MaritimeCall {
  id: string;
  callerVessel: MaritimeVessel;
  receiverVessel: MaritimeVessel;
  timestamp: string;
  durationSeconds: number;
  safeNumberUsed: string;
  transcript: string[];
  aiSummary: AiCallSummary;
}

export interface CrewMember {
  id: string;
  name: string;
  role: string;
  condition: '정상' | '주의' | '위험';
  fatigueScore: number; // 0-100
  heartRateBpm: number;
  bodyTemperature?: number; // 체온 (°C, e.g. 36.5)
  activityHours?: string; // 활동 시간 (e.g. "당직 4시간 10분", "작업 3시간 30분")
  lastHealthCheck: string;
  notes?: string;
}

export interface BlueBotMessage {
  id: string;
  sender: 'USER' | 'BLUEBOT';
  text: string;
  timestamp: string;
  suggestions?: string[];
  category?: '기상정보' | '어업규정' | '심리상담' | '의료지원';
}

export interface VesselChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isOwnShip: boolean;
  messageType?: 'TEXT' | 'POSITION_SHARE' | 'ALERT' | 'CALL_LOG';
}

export interface VesselChatHistory {
  id: string;
  vesselId: string;
  vesselMmsi: string;
  shipName: string;
  captainName: string;
  vesselType: string;
  callSign: string;
  safePhoneNumber: string;
  lastMessage: string;
  lastTimestamp: string;
  unreadCount: number;
  isOnline: boolean;
  distanceNM?: number;
  messages: VesselChatMessage[];
}

