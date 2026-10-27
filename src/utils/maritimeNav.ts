import { MaritimeVessel } from '../types/maritime';

/**
 * 해양 방위각(0°~360°) 및 나침반 방위 표출 유틸리티
 */

// 16방위 변환 (해양 표준 표기)
export function getCompassDirection(deg: number | undefined | null): string {
  if (deg === undefined || deg === null || isNaN(deg)) return '북(N)';
  const normalized = ((deg % 360) + 360) % 360;
  const directions = [
    '북(N)', '북북동(NNE)', '북동(NE)', '동북동(ENE)',
    '동(E)', '동남동(ESE)', '남동(SE)', '남남동(SSE)',
    '남(S)', '남남서(SSW)', '남서(SW)', '서남서(WSW)',
    '서(W)', '서북서(WNW)', '북서(NW)', '북북서(NNW)'
  ];
  const index = Math.round(normalized / 22.5) % 16;
  return directions[index];
}

// 8방위 간략 표기
export function getShortCompassDirection(deg: number | undefined | null): string {
  if (deg === undefined || deg === null || isNaN(deg)) return '북(N)';
  const normalized = ((deg % 360) + 360) % 360;
  const directions = [
    '북(N)', '북동(NE)', '동(E)', '남동(SE)',
    '남(S)', '남서(SW)', '서(W)', '북서(NW)'
  ];
  const index = Math.round(normalized / 45) % 8;
  return directions[index];
}

// 방위 포맷 문자열: e.g. "085° (동북동)"
export function formatHeading(deg: number | undefined | null): string {
  if (deg === undefined || deg === null || isNaN(deg)) return '000°';
  const normalized = Math.round(((deg % 360) + 360) % 360);
  const padded = normalized.toString().padStart(3, '0');
  return `${padded}° (${getCompassDirection(normalized)})`;
}

/**
 * 선박 차별화 색상 카테고리 정의 (User Requirement 5)
 * 1. 청색(기존) : 일반 가입자 (#2563eb / #38bdf8)
 * 2. 회색 : 미 가입자 (#64748b / #94a3b8)
 * 3. 빨간색 : 조난 선박 (#dc2626 / #ef4444)
 * 4. 노란색 : 통화 중인 선박 (#eab308 / #facc15)
 * 5. 보라색 [추천] : 조업 중이라 어구 훼손을 막거나 충돌 회피가 불가능해 접근 제한을 알리는 선박 (#a855f7 / #c084fc)
 */
export type VesselColorCategory = 
  | 'SOS'               // 3. 빨간색 : 조난 선박
  | 'IN_CALL'           // 4. 노란색 : 통화 중인 선박
  | 'RESTRICTED'        // 5. 보라색 [추천] : 조업·접근제한 선박 (어구보호 / 충돌방지)
  | 'SUBSCRIBER'        // 1. 청색 : 일반 가입자
  | 'NON_SUBSCRIBER';   // 2. 회색 : 미 가입자

export interface VesselColorInfo {
  category: VesselColorCategory;
  label: string;
  colorHex: string;
  fillHex: string;
  strokeHex: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  dotBg: string;
  glowColor: string;
  description: string;
  shortLabel: string;
}

export const VESSEL_COLOR_DEFINITIONS: Record<VesselColorCategory, VesselColorInfo> = {
  SOS: {
    category: 'SOS',
    label: '조난 선박',
    shortLabel: '조난',
    colorHex: '#dc2626',
    fillHex: '#dc2626',
    strokeHex: '#ffffff',
    badgeBg: 'bg-red-500/20',
    badgeBorder: 'border-red-500/50',
    badgeText: 'text-red-400',
    dotBg: 'bg-red-500',
    glowColor: 'rgba(220, 38, 38, 0.5)',
    description: '긴급 구조(SOS) 신호 발생 선박 (접근 구조 지원 요망)'
  },
  IN_CALL: {
    category: 'IN_CALL',
    label: '통화 중인 선박',
    shortLabel: '통화중',
    colorHex: '#f97316', // 주황색 (통화 중인 선박 실시간 연결)
    fillHex: '#f97316',
    strokeHex: '#ffedd5',
    badgeBg: 'bg-orange-500/20',
    badgeBorder: 'border-orange-500/50',
    badgeText: 'text-orange-400',
    dotBg: 'bg-orange-500',
    glowColor: 'rgba(249, 115, 22, 0.5)',
    description: '050 안심번호 / LTE-M 음성 통화 진행 중인 선박 (주황색 삼각형)'
  },
  RESTRICTED: {
    category: 'RESTRICTED',
    label: '조업·접근제한 (어구보호)',
    shortLabel: '접근제한',
    colorHex: '#a855f7', // 추천: 보라색 (Purple / Magenta)
    fillHex: '#a855f7',
    strokeHex: '#f3e8ff',
    badgeBg: 'bg-purple-500/20',
    badgeBorder: 'border-purple-500/50',
    badgeText: 'text-purple-300',
    dotBg: 'bg-purple-400',
    glowColor: 'rgba(168, 85, 247, 0.5)',
    description: '어구 전개·양망 중으로 어구 훼손 방지 및 충돌 회피가 곤란하여 접근 제한 안내'
  },
  SUBSCRIBER: {
    category: 'SUBSCRIBER',
    label: '일반 가입자',
    shortLabel: '가입선박',
    colorHex: '#2563eb', // 청색
    fillHex: '#2563eb',
    strokeHex: '#ffffff',
    badgeBg: 'bg-blue-500/20',
    badgeBorder: 'border-blue-500/50',
    badgeText: 'text-blue-400',
    dotBg: 'bg-blue-500',
    glowColor: 'rgba(37, 99, 235, 0.4)',
    description: 'BlueCall 안심번호 및 스마트 안전망 정식 가입 선박'
  },
  NON_SUBSCRIBER: {
    category: 'NON_SUBSCRIBER',
    label: '미 가입자',
    shortLabel: '미가입',
    colorHex: '#64748b', // 회색
    fillHex: '#64748b',
    strokeHex: '#cbd5e1',
    badgeBg: 'bg-slate-800/80',
    badgeBorder: 'border-slate-700',
    badgeText: 'text-slate-400',
    dotBg: 'bg-slate-400',
    glowColor: 'rgba(100, 116, 139, 0.2)',
    description: '일반 AIS만 송출되는 미가입 선박 (안심번호 미등록)'
  }
};

/**
 * 선박의 현재 상태 및 통화 연결 상태를 기반으로 5개 색상 정보 판별
 */
export function getVesselColorInfo(
  vessel: MaritimeVessel, 
  activeConnections: { callerMmsi: string; receiverMmsi: string }[] = []
): VesselColorInfo {
  // 1. 빨간색 : 조난 선박 (최우선)
  if (vessel.status === 'SOS') {
    return VESSEL_COLOR_DEFINITIONS.SOS;
  }

  // 2. 보라색 [추천] : 조업 중이라 어구 훼손을 막거나 충돌 회피가 불가능해 접근을 제한하는 선박
  if (
    vessel.isRestrictedOperation ||
    vessel.status === 'FISHING' ||
    vessel.status === 'HAZARD' ||
    (vessel.statusMessage && (
      vessel.statusMessage.includes('양망') ||
      vessel.statusMessage.includes('투망') ||
      vessel.statusMessage.includes('어구') ||
      vessel.statusMessage.includes('접근 주의') ||
      vessel.statusMessage.includes('접근 제한') ||
      vessel.statusMessage.includes('접근금지')
    ))
  ) {
    return VESSEL_COLOR_DEFINITIONS.RESTRICTED;
  }

  // 4. 회색 : 미 가입자
  if (vessel.isSubscriber === false || (!vessel.safePhoneNumber && !vessel.isOwnShip)) {
    return VESSEL_COLOR_DEFINITIONS.NON_SUBSCRIBER;
  }

  // 5. 청색(기존) : 일반 가입자 (기본)
  return VESSEL_COLOR_DEFINITIONS.SUBSCRIBER;
}
