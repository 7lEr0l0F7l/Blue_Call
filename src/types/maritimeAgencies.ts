export type AgencyType = 
  | 'FISHERY_MGMT'    // 동·서·남해 어업관리단
  | 'SAFETY_BUREAU'   // 어선안전조업국 (수협중앙회)
  | 'OCEANS_REGIONAL' // 지방해양수산청
  | 'MOF'             // 해양수산부
  | 'COAST_GUARD'     // 지방 해양경찰서
  | 'VTS';            // 해상교통관제센터 (항만/연안VTS)

export interface MaritimeAgency {
  id: string;
  name: string;
  agencyType: AgencyType;
  categoryLabel: string;
  region: 'EAST' | 'WEST' | 'SOUTH' | 'JEJU' | 'CENTRAL';
  lat: number;
  lng: number;
  address: string;
  phone: string;
  emergencyVhf?: string; // e.g. "VHF CH 16 / 67"
  jurisdiction: string;
  keyDuty: string;
  callSign?: string;
  badgeColor: {
    bg: string;
    border: string;
    text: string;
    dot: string;
    pinHex: string;
  };
}

export const AGENCY_TYPE_CONFIG: Record<AgencyType, {
  label: string;
  pinHex: string;
  badgeBg: string;
  badgeText: string;
  iconName: string;
  description: string;
}> = {
  MOF: {
    label: '해양수산부',
    pinHex: '#1e3a8a', // Deep Blue
    badgeBg: 'bg-blue-900/60',
    badgeText: 'text-blue-200',
    iconName: 'Building',
    description: '해양수산 정책 총괄, 연근해 어선 안전 정책 및 스마트 해양교통 컨트롤'
  },
  FISHERY_MGMT: {
    label: '어업관리단',
    pinHex: '#0284c7', // Sky Blue
    badgeBg: 'bg-sky-900/60',
    badgeText: 'text-sky-200',
    iconName: 'Anchor',
    description: '국가어업지도선 운영, 배타적경제수역(EEZ) 및 조업안전지도·불법어업단속'
  },
  SAFETY_BUREAU: {
    label: '어선안전조업국',
    pinHex: '#059669', // Emerald Green
    badgeBg: 'bg-emerald-900/60',
    badgeText: 'text-emerald-200',
    iconName: 'Radio',
    description: '수협 어선안전조업국 24시간 해상무선통신, 조업위치보고 접수 및 기상특보 전파'
  },
  OCEANS_REGIONAL: {
    label: '지방해양수산청',
    pinHex: '#7c3aed', // Purple
    badgeBg: 'bg-purple-900/60',
    badgeText: 'text-purple-200',
    iconName: 'Landmark',
    description: '항만 인프라 구축, 항로표지 관리 및 연안어업 등록 허가'
  },
  COAST_GUARD: {
    label: '지방 해양경찰서',
    pinHex: '#d97706', // Amber Gold
    badgeBg: 'bg-amber-900/60',
    badgeText: 'text-amber-200',
    iconName: 'ShieldAlert',
    description: '해상 긴급구조 122, 경비정 긴급출동, 해상치안 및 연안안전관리'
  },
  VTS: {
    label: '해상교통관제(VTS)',
    pinHex: '#dc2626', // Red Coral
    badgeBg: 'bg-red-900/60',
    badgeText: 'text-red-200',
    iconName: 'Navigation',
    description: '해상교통관제센터 레이더/AIS 모니터링, 통항선박 안전 항로 유도 및 충돌예방'
  }
};
