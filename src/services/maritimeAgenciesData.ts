import { MaritimeAgency } from '../types/maritimeAgencies';

export const MARITIME_AGENCIES: MaritimeAgency[] = [
  // 1. 해양수산부 (부산본부)
  {
    id: 'agency-mof-busan',
    name: '해양수산부 (부산본부)',
    agencyType: 'MOF',
    categoryLabel: '정부중앙부처',
    region: 'SOUTH',
    lat: 35.1283,
    lng: 129.0472,
    address: '부산광역시 동구 중앙대로361번길 14 (해양수산부 부산본부 중앙종합관제국)',
    phone: '051-200-5114',
    emergencyVhf: 'VHF CH 16 / DSC 2187.5kHz',
    jurisdiction: '대한민국 전 해역 및 배타적경제수역(EEZ)',
    keyDuty: '해양수산 종합정책 총괄, 어선 안전 조업 정책, 연근해 해양교통망 및 스마트 항만 컨트롤',
    badgeColor: {
      bg: 'bg-blue-900/60',
      border: 'border-blue-600',
      text: 'text-blue-300',
      dot: 'bg-blue-400',
      pinHex: '#1e3a8a'
    }
  },

  // 2. 동·서·남해 어업관리단 (어업관리단)
  {
    id: 'agency-fmc-east',
    name: '동해어업관리단',
    agencyType: 'FISHERY_MGMT',
    categoryLabel: '어업관리단',
    region: 'EAST',
    lat: 35.2235,
    lng: 129.2274,
    address: '부산광역시 기장군 기장읍 대변로 74 (대변항 어업지도선 부두)',
    phone: '051-410-1000',
    emergencyVhf: 'VHF CH 16 / SSB 2182kHz',
    callSign: '동해어업본부',
    jurisdiction: '동해 연근해 및 대화퇴 수역, 조업자제해역',
    keyDuty: '국가어업지도선(무궁화호) 운용, 동해 EEZ 불법조업 감시 및 우리 어선 안전지도',
    badgeColor: {
      bg: 'bg-sky-900/60',
      border: 'border-sky-600',
      text: 'text-sky-300',
      dot: 'bg-sky-400',
      pinHex: '#0284c7'
    }
  },
  {
    id: 'agency-fmc-west',
    name: '서해어업관리단',
    agencyType: 'FISHERY_MGMT',
    categoryLabel: '어업관리단',
    region: 'WEST',
    lat: 34.7836,
    lng: 126.3931,
    address: '전라남도 목포시 삼학로 92번길 34 (목포 삼학도 어업지도선 부두)',
    phone: '061-240-1000',
    emergencyVhf: 'VHF CH 16 / SSB 2182kHz',
    callSign: '서해어업본부',
    jurisdiction: '서해 영해 및 한·중 잠정조치수역',
    keyDuty: '서해 특정해역 및 NLL 인근 안전조업 지도, 중국어선 불법조업 특별 단속',
    badgeColor: {
      bg: 'bg-sky-900/60',
      border: 'border-sky-600',
      text: 'text-sky-300',
      dot: 'bg-sky-400',
      pinHex: '#0284c7'
    }
  },
  {
    id: 'agency-fmc-south',
    name: '남해어업관리단',
    agencyType: 'FISHERY_MGMT',
    categoryLabel: '어업관리단',
    region: 'JEJU',
    lat: 33.5186,
    lng: 126.5410,
    address: '제주특별자치도 제주시 임항로 128 (제주항 제2부두)',
    phone: '064-728-1000',
    emergencyVhf: 'VHF CH 16 / SSB 2182kHz',
    callSign: '남해어업본부',
    jurisdiction: '남해안 및 제주 주변 해역, 한·일 중간수역',
    keyDuty: '남해안 황금어장 보호, 연근해 어선 갈등 조정 및 긴급 해상구난 지원',
    badgeColor: {
      bg: 'bg-sky-900/60',
      border: 'border-sky-600',
      text: 'text-sky-300',
      dot: 'bg-sky-400',
      pinHex: '#0284c7'
    }
  },

  // 3. 수협 어선안전조업국 (수협)
  {
    id: 'agency-safety-sokcho',
    name: '속초 어선안전조업국',
    agencyType: 'SAFETY_BUREAU',
    categoryLabel: '어선안전조업국',
    region: 'EAST',
    lat: 38.2045,
    lng: 128.5912,
    address: '강원특별자치도 속초시 설악금강대교로 11 (청초호 수협 어선안전국)',
    phone: '033-633-2841',
    emergencyVhf: 'VHF CH 16 / SSB 2182kHz',
    jurisdiction: '고성·속초 연근해 및 동해 북부 조업한계선 접경해역',
    keyDuty: '북방 접경수역 월선방지 지도, 24시간 어선 통신 및 기상특보 신속 발령',
    badgeColor: {
      bg: 'bg-emerald-900/60',
      border: 'border-emerald-600',
      text: 'text-emerald-300',
      dot: 'bg-emerald-400',
      pinHex: '#059669'
    }
  },
  {
    id: 'agency-safety-pohang',
    name: '포항 어선안전조업국',
    agencyType: 'SAFETY_BUREAU',
    categoryLabel: '어선안전조업국',
    region: 'EAST',
    lat: 36.0350,
    lng: 129.3780,
    address: '경상북도 포항시 북구 해동로 275 (수협중앙회 포항 어선안전국)',
    phone: '054-247-2841',
    emergencyVhf: 'VHF CH 16 / SSB 2182kHz',
    jurisdiction: '경북 동해안(울진·영덕·포항·경주) 및 대게/오징어 어장',
    keyDuty: '동해 중남부 출어선 위치확인, 해상 조난 SOS 즉각 대응 및 전파',
    badgeColor: {
      bg: 'bg-emerald-900/60',
      border: 'border-emerald-600',
      text: 'text-emerald-300',
      dot: 'bg-emerald-400',
      pinHex: '#059669'
    }
  },
  {
    id: 'agency-safety-ulleung',
    name: '울릉도 어선안전조업국',
    agencyType: 'SAFETY_BUREAU',
    categoryLabel: '어선안전조업국',
    region: 'EAST',
    lat: 37.4842,
    lng: 130.9055,
    address: '경상북도 울릉군 울릉읍 도동길 124 (도동항 수협 울릉도 어선안전조업국)',
    phone: '054-791-2841',
    emergencyVhf: 'VHF CH 16 / SSB 2182kHz',
    callSign: '울릉어선안전국',
    jurisdiction: '울릉도·독도 주변 전 해역 및 동해 한·일 중간수역, 대화퇴 원거리 조업선단',
    keyDuty: '독도 및 동해 최동단 해역 우리 어선 안전관리, 24시간 원거리 통신망 유지 및 조난 상황 즉시 대응',
    badgeColor: {
      bg: 'bg-emerald-900/60',
      border: 'border-emerald-600',
      text: 'text-emerald-300',
      dot: 'bg-emerald-400',
      pinHex: '#059669'
    }
  },
  {
    id: 'agency-safety-busan',
    name: '부산 어선안전조업국',
    agencyType: 'SAFETY_BUREAU',
    categoryLabel: '어선안전조업국',
    region: 'SOUTH',
    lat: 35.0872,
    lng: 129.0255,
    address: '부산광역시 서구 원양로 35 (수협중앙회 부산어선안전조업국)',
    phone: '051-240-6100',
    emergencyVhf: 'VHF CH 16 / SSB 2182kHz',
    jurisdiction: '부산 연안 및 남해 동부 대형선망/통발 조업구역',
    keyDuty: '남해안 대형 근해선단 운항 모니터링, 해난사고 초동 통신 전파',
    badgeColor: {
      bg: 'bg-emerald-900/60',
      border: 'border-emerald-600',
      text: 'text-emerald-300',
      dot: 'bg-emerald-400',
      pinHex: '#059669'
    }
  },
  {
    id: 'agency-safety-tongyeong',
    name: '통영 어선안전조업국',
    agencyType: 'SAFETY_BUREAU',
    categoryLabel: '어선안전조업국',
    region: 'SOUTH',
    lat: 34.8415,
    lng: 128.4215,
    address: '경상남도 통영시 통영해안로 267 (통영항 서호동 수협)',
    phone: '055-645-2841',
    emergencyVhf: 'VHF CH 16 / SSB 2182kHz',
    jurisdiction: '통영·거제·남해 연근해 및 멸치권현망/굴양식/장어통발 어장',
    keyDuty: '다도해 안개철 안전항해 유도, 어선 간 통신 중계 및 조업안전지도',
    badgeColor: {
      bg: 'bg-emerald-900/60',
      border: 'border-emerald-600',
      text: 'text-emerald-300',
      dot: 'bg-emerald-400',
      pinHex: '#059669'
    }
  },
  {
    id: 'agency-safety-yeosu',
    name: '여수 어선안전조업국',
    agencyType: 'SAFETY_BUREAU',
    categoryLabel: '어선안전조업국',
    region: 'SOUTH',
    lat: 34.7392,
    lng: 127.7380,
    address: '전라남도 여수시 이순신광장로 78 (여수 구항 수협)',
    phone: '061-662-2841',
    emergencyVhf: 'VHF CH 16 / SSB 2182kHz',
    jurisdiction: '여수·고흥 연안 및 백도·거문도 남방 해역',
    keyDuty: '남해 서부 어선 위치보고 접수, 안심번호 비상연락망 24시간 가동',
    badgeColor: {
      bg: 'bg-emerald-900/60',
      border: 'border-emerald-600',
      text: 'text-emerald-300',
      dot: 'bg-emerald-400',
      pinHex: '#059669'
    }
  },
  {
    id: 'agency-safety-mokpo',
    name: '목포 어선안전조업국',
    agencyType: 'SAFETY_BUREAU',
    categoryLabel: '어선안전조업국',
    region: 'WEST',
    lat: 34.7820,
    lng: 126.3860,
    address: '전라남도 목포시 해안로 165 (목포 여객터미널 수협)',
    phone: '061-244-2841',
    emergencyVhf: 'VHF CH 16 / SSB 2182kHz',
    jurisdiction: '목포·신안·진도 도서 해역 및 서남해 조업수역',
    keyDuty: '신안 천사섬 1000여 개 도서 항로 안전관리, 조업선 위치 실시간 관제',
    badgeColor: {
      bg: 'bg-emerald-900/60',
      border: 'border-emerald-600',
      text: 'text-emerald-300',
      dot: 'bg-emerald-400',
      pinHex: '#059669'
    }
  },
  {
    id: 'agency-safety-incheon',
    name: '인천 어선안전조업국',
    agencyType: 'SAFETY_BUREAU',
    categoryLabel: '어선안전조업국',
    region: 'WEST',
    lat: 37.4525,
    lng: 126.6115,
    address: '인천광역시 중구 축항대로 118번길 19 (인천 연안부두 수협)',
    phone: '032-882-2841',
    emergencyVhf: 'VHF CH 16 / SSB 2182kHz',
    jurisdiction: '인천 연안 및 서해 5도(백령·대청·소청·연평·우도) 해역',
    keyDuty: '서해 5도 특별조업구역 어선 출어 통제 및 야간 안전통신 점검',
    badgeColor: {
      bg: 'bg-emerald-900/60',
      border: 'border-emerald-600',
      text: 'text-emerald-300',
      dot: 'bg-emerald-400',
      pinHex: '#059669'
    }
  },
  {
    id: 'agency-safety-jeju',
    name: '제주 어선안전조업국',
    agencyType: 'SAFETY_BUREAU',
    categoryLabel: '어선안전조업국',
    region: 'JEJU',
    lat: 33.5165,
    lng: 126.5315,
    address: '제주특별자치도 제주시 산지로 25 (제주항 수협 어선안전국)',
    phone: '064-752-2841',
    emergencyVhf: 'VHF CH 16 / SSB 2182kHz',
    jurisdiction: '제주도 전 연안 및 서귀포·모슬포·성산포 출어선',
    keyDuty: '제주 갈치·옥돔 조업선 원거리 안전모니터링, 태풍피항 유도',
    badgeColor: {
      bg: 'bg-emerald-900/60',
      border: 'border-emerald-600',
      text: 'text-emerald-300',
      dot: 'bg-emerald-400',
      pinHex: '#059669'
    }
  },

  // 4. 지방해양수산청
  {
    id: 'agency-regional-busan',
    name: '부산지방해양수산청',
    agencyType: 'OCEANS_REGIONAL',
    categoryLabel: '지방해양수산청',
    region: 'SOUTH',
    lat: 35.1192,
    lng: 129.0467,
    address: '부산광역시 동구 충장대로 351 (부산항 북항)',
    phone: '051-609-6114',
    jurisdiction: '부산항 및 인근 연안 항만구역',
    keyDuty: '동북아 최대 메가포트 부산항 개발, 연안 여객선 및 선박안전검사',
    badgeColor: {
      bg: 'bg-purple-900/60',
      border: 'border-purple-600',
      text: 'text-purple-300',
      dot: 'bg-purple-400',
      pinHex: '#7c3aed'
    }
  },
  {
    id: 'agency-regional-incheon',
    name: '인천지방해양수산청',
    agencyType: 'OCEANS_REGIONAL',
    categoryLabel: '지방해양수산청',
    region: 'WEST',
    lat: 37.4560,
    lng: 126.6210,
    address: '인천광역시 중구 서해대로 365 (인천항만공사 인근)',
    phone: '032-880-6114',
    jurisdiction: '인천항, 경인항 및 서해 중부 연안',
    keyDuty: '수도권 관문항만 인프라 관리, 선원 복지 및 항로표지 점검',
    badgeColor: {
      bg: 'bg-purple-900/60',
      border: 'border-purple-600',
      text: 'text-purple-300',
      dot: 'bg-purple-400',
      pinHex: '#7c3aed'
    }
  },
  {
    id: 'agency-regional-yeosu',
    name: '여수광양지방해양수산청',
    agencyType: 'OCEANS_REGIONAL',
    categoryLabel: '지방해양수산청',
    region: 'SOUTH',
    lat: 34.7475,
    lng: 127.7470,
    address: '전라남도 여수시 박람회길 1 (여수엑스포역/신항 해양수산청)',
    phone: '061-650-6000',
    jurisdiction: '여수항, 광양제철소·석유화학단지 원유부두 항만권',
    keyDuty: '위험물 운송 선박 안전점검, 국가 거점 무역항 안전 항로 확보',
    badgeColor: {
      bg: 'bg-purple-900/60',
      border: 'border-purple-600',
      text: 'text-purple-300',
      dot: 'bg-purple-400',
      pinHex: '#7c3aed'
    }
  },
  {
    id: 'agency-regional-mokpo',
    name: '목포지방해양수산청',
    agencyType: 'OCEANS_REGIONAL',
    categoryLabel: '지방해양수산청',
    region: 'WEST',
    lat: 34.7830,
    lng: 126.3910,
    address: '전라남도 목포시 삼학로 92번길 (목포항 삼학도)',
    phone: '061-240-0600',
    jurisdiction: '목포항, 완도항 및 서남해 연안',
    keyDuty: '도서 여객선 안전운항 종합관리, 소형어선 등록 및 안전지원',
    badgeColor: {
      bg: 'bg-purple-900/60',
      border: 'border-purple-600',
      text: 'text-purple-300',
      dot: 'bg-purple-400',
      pinHex: '#7c3aed'
    }
  },
  {
    id: 'agency-regional-donghae',
    name: '동해지방해양수산청',
    agencyType: 'OCEANS_REGIONAL',
    categoryLabel: '지방해양수산청',
    region: 'EAST',
    lat: 37.5020,
    lng: 129.1170,
    address: '강원특별자치도 동해시 임항로 119 (동해항)',
    phone: '033-520-6114',
    jurisdiction: '동해·묵호·삼척·속초·옥계항 및 강원 연안',
    keyDuty: '동해안 주요 항만시설 유지, 등대/항로표지 안전관리',
    badgeColor: {
      bg: 'bg-purple-900/60',
      border: 'border-purple-600',
      text: 'text-purple-300',
      dot: 'bg-purple-400',
      pinHex: '#7c3aed'
    }
  },

  // 5. 지방 해양경찰서 (해양경찰)
  {
    id: 'agency-cg-incheon',
    name: '인천해양경찰서',
    agencyType: 'COAST_GUARD',
    categoryLabel: '해양경찰서',
    region: 'WEST',
    lat: 37.4475,
    lng: 126.6065,
    address: '인천광역시 중구 연안부두로 128번길 22 (인천해경 전용부두)',
    phone: '032-650-2000',
    emergencyVhf: '긴급구조 122 / VHF CH 16',
    jurisdiction: '인천 연안 및 연평·백령 특정해역',
    keyDuty: '해상 긴급구조 122 즉시 출동, 대형 경비함정 해상경비, 불법어로 단속',
    badgeColor: {
      bg: 'bg-amber-900/60',
      border: 'border-amber-600',
      text: 'text-amber-300',
      dot: 'bg-amber-400',
      pinHex: '#d97706'
    }
  },
  {
    id: 'agency-cg-taean',
    name: '태안해양경찰서',
    agencyType: 'COAST_GUARD',
    categoryLabel: '해양경찰서',
    region: 'WEST',
    lat: 36.7490,
    lng: 126.3015,
    address: '충청남도 태안군 태안읍 동백로 346',
    phone: '041-950-2000',
    emergencyVhf: '긴급구조 122 / VHF CH 16',
    jurisdiction: '태안반도 및 안면도 연안, 격렬비열도 수역',
    keyDuty: '해상 음주운항 단속, 갯벌 고립자 수색구조, 경비정 상시 순찰',
    badgeColor: {
      bg: 'bg-amber-900/60',
      border: 'border-amber-600',
      text: 'text-amber-300',
      dot: 'bg-amber-400',
      pinHex: '#d97706'
    }
  },
  {
    id: 'agency-cg-gunsan',
    name: '군산해양경찰서',
    agencyType: 'COAST_GUARD',
    categoryLabel: '해양경찰서',
    region: 'WEST',
    lat: 35.9815,
    lng: 126.7190,
    address: '전북특별자치도 군산시 둔율길 45',
    phone: '063-539-2000',
    emergencyVhf: '긴급구조 122 / VHF CH 16',
    jurisdiction: '군산·어청도·선유도 연근해',
    keyDuty: '서해안 해난구조, 낚시어선 안전점검 및 오염방제',
    badgeColor: {
      bg: 'bg-amber-900/60',
      border: 'border-amber-600',
      text: 'text-amber-300',
      dot: 'bg-amber-400',
      pinHex: '#d97706'
    }
  },
  {
    id: 'agency-cg-mokpo',
    name: '목포해양경찰서',
    agencyType: 'COAST_GUARD',
    categoryLabel: '해양경찰서',
    region: 'WEST',
    lat: 34.8080,
    lng: 126.3710,
    address: '전라남도 목포시 청호로 231 (목포해경 북항 전용부두)',
    phone: '061-241-2000',
    emergencyVhf: '긴급구조 122 / VHF CH 16',
    jurisdiction: '목포·신안·영광·무안 연안 및 가거도 원해',
    keyDuty: '3000톤급 경비함정 원거리 해상경비, 응급환자 닥터헬기/헬기 이송',
    badgeColor: {
      bg: 'bg-amber-900/60',
      border: 'border-amber-600',
      text: 'text-amber-300',
      dot: 'bg-amber-400',
      pinHex: '#d97706'
    }
  },
  {
    id: 'agency-cg-wando',
    name: '완도해양경찰서',
    agencyType: 'COAST_GUARD',
    categoryLabel: '해양경찰서',
    region: 'SOUTH',
    lat: 34.3160,
    lng: 126.7565,
    address: '전라남도 완도군 완도읍 해변공원로 108 (완도항 해경전용부두)',
    phone: '061-550-2000',
    emergencyVhf: '긴급구조 122 / VHF CH 16',
    jurisdiction: '완도·청산도·보길도·생일도 연안',
    keyDuty: '다도해 좁은 수로 안전통항 유도, 양식장 보호 및 좌초사고 긴급구난',
    badgeColor: {
      bg: 'bg-amber-900/60',
      border: 'border-amber-600',
      text: 'text-amber-300',
      dot: 'bg-amber-400',
      pinHex: '#d97706'
    }
  },
  {
    id: 'agency-cg-yeosu',
    name: '여수해양경찰서',
    agencyType: 'COAST_GUARD',
    categoryLabel: '해양경찰서',
    region: 'SOUTH',
    lat: 34.7575,
    lng: 127.7020,
    address: '전라남도 여수시 문수로 111 (여수해양경찰서)',
    phone: '061-840-2000',
    emergencyVhf: '긴급구조 122 / VHF CH 16',
    jurisdiction: '여수 연안, 광양만 및 거문도 남서 해역',
    keyDuty: '대형 유류유출 방제, 원유선 충돌사고 예방, 24시간 구조대 상시대기',
    badgeColor: {
      bg: 'bg-amber-900/60',
      border: 'border-amber-600',
      text: 'text-amber-300',
      dot: 'bg-amber-400',
      pinHex: '#d97706'
    }
  },
  {
    id: 'agency-cg-tongyeong',
    name: '통영해양경찰서',
    agencyType: 'COAST_GUARD',
    categoryLabel: '해양경찰서',
    region: 'SOUTH',
    lat: 34.8870,
    lng: 128.4230,
    address: '경상남도 통영시 광도면 죽림2로 47 (죽림 통영해경)',
    phone: '055-647-2000',
    emergencyVhf: '긴급구조 122 / VHF CH 16',
    jurisdiction: '통영·거제·고성·사천·남해 연근해',
    keyDuty: '한려해상국립공원 수상레저 안전관리, 연안 침수사고 신속 구조',
    badgeColor: {
      bg: 'bg-amber-900/60',
      border: 'border-amber-600',
      text: 'text-amber-300',
      dot: 'bg-amber-400',
      pinHex: '#d97706'
    }
  },
  {
    id: 'agency-cg-busan',
    name: '부산해양경찰서',
    agencyType: 'COAST_GUARD',
    categoryLabel: '해양경찰서',
    region: 'SOUTH',
    lat: 35.0765,
    lng: 129.0790,
    address: '부산광역시 영도구 태종로 780 (동삼동 해양클러스터 해경 전용부두)',
    phone: '051-664-2000',
    emergencyVhf: '긴급구조 122 / VHF CH 16',
    jurisdiction: '부산 앞바다 및 남해 동부 외해',
    keyDuty: '국제항만 해상보안, 광역 해상수색구조 및 특공대 대테러/인명구조',
    badgeColor: {
      bg: 'bg-amber-900/60',
      border: 'border-amber-600',
      text: 'text-amber-300',
      dot: 'bg-amber-400',
      pinHex: '#d97706'
    }
  },
  {
    id: 'agency-cg-pohang',
    name: '포항해양경찰서',
    agencyType: 'COAST_GUARD',
    categoryLabel: '해양경찰서',
    region: 'EAST',
    lat: 36.0745,
    lng: 129.3920,
    address: '경상북도 포항시 북구 삼흥로 369 (양덕동 포항해경)',
    phone: '054-750-2000',
    emergencyVhf: '긴급구조 122 / VHF CH 16',
    jurisdiction: '경북 동해안 및 호미곶 연안, 영일만항',
    keyDuty: '동해안 높은 파고 너울성 파도 대응, 어선 전복사고 특수구조',
    badgeColor: {
      bg: 'bg-amber-900/60',
      border: 'border-amber-600',
      text: 'text-amber-300',
      dot: 'bg-amber-400',
      pinHex: '#d97706'
    }
  },
  {
    id: 'agency-cg-donghae',
    name: '동해해양경찰서',
    agencyType: 'COAST_GUARD',
    categoryLabel: '해양경찰서',
    region: 'EAST',
    lat: 37.4985,
    lng: 129.1240,
    address: '강원특별자치도 동해시 이원길 143 (동해 송정동 해경전용부두)',
    phone: '033-741-2000',
    emergencyVhf: '긴급구조 122 / VHF CH 16',
    jurisdiction: '동해·강릉·삼척 연근해 및 독도·울릉도 영해',
    keyDuty: '독도 경비함정 5001함 영해 수호, 울릉도 긴급 이송 및 광역 수색',
    badgeColor: {
      bg: 'bg-amber-900/60',
      border: 'border-amber-600',
      text: 'text-amber-300',
      dot: 'bg-amber-400',
      pinHex: '#d97706'
    }
  },
  {
    id: 'agency-cg-jeju',
    name: '제주해양경찰서',
    agencyType: 'COAST_GUARD',
    categoryLabel: '해양경찰서',
    region: 'JEJU',
    lat: 33.4915,
    lng: 126.5290,
    address: '제주특별자치도 제주시 청사로 8길 10 (정부제주지방합동청사)',
    phone: '064-793-2000',
    emergencyVhf: '긴급구조 122 / VHF CH 16',
    jurisdiction: '제주 북부 해역 및 추자도 수역',
    keyDuty: '제주 북부 해역 해난구조, 불법 외국어선 단속 및 해양환경 감시',
    badgeColor: {
      bg: 'bg-amber-900/60',
      border: 'border-amber-600',
      text: 'text-amber-300',
      dot: 'bg-amber-400',
      pinHex: '#d97706'
    }
  },

  // 6. VTS (해상교통관제센터)
  {
    id: 'agency-vts-yeosu',
    name: '여수연안 VTS (해상교통관제센터)',
    agencyType: 'VTS',
    categoryLabel: 'VTS 해상교통관제',
    region: 'SOUTH',
    lat: 34.7455,
    lng: 127.7660,
    address: '전라남도 여수시 오동도로 111 (오동도 정상 여수연안VTS 관제탑)',
    phone: '061-690-5000',
    emergencyVhf: 'VHF CH 16 / CH 67 (관제)',
    jurisdiction: '여수 연안 통항로 및 남해안 주요 간선항로',
    keyDuty: '실시간 레이더 관제, 선박 접근 충돌위험 경보 송출, VHF 안전방송',
    badgeColor: {
      bg: 'bg-red-900/60',
      border: 'border-red-600',
      text: 'text-red-300',
      dot: 'bg-red-400',
      pinHex: '#dc2626'
    }
  },
  {
    id: 'agency-vts-busan',
    name: '부산항 VTS (해상교통관제센터)',
    agencyType: 'VTS',
    categoryLabel: 'VTS 해상교통관제',
    region: 'SOUTH',
    lat: 35.0740,
    lng: 129.0880,
    address: '부산광역시 영도구 해양로 301번길 17 (조도/아치섬 부산항VTS 관제탑)',
    phone: '051-664-2100',
    emergencyVhf: 'VHF CH 16 / CH 12 (부산관제)',
    jurisdiction: '부산항 북항, 감천항 및 오륙도 진입항로',
    keyDuty: '컨테이너선 및 통항선박 교통량 통제, 입출항 순서 및 묘박지 배정',
    badgeColor: {
      bg: 'bg-red-900/60',
      border: 'border-red-600',
      text: 'text-red-300',
      dot: 'bg-red-400',
      pinHex: '#dc2626'
    }
  },
  {
    id: 'agency-vts-incheon',
    name: '인천항 VTS (해상교통관제센터)',
    agencyType: 'VTS',
    categoryLabel: 'VTS 해상교통관제',
    region: 'WEST',
    lat: 37.4725,
    lng: 126.5985,
    address: '인천광역시 중구 월미로 198 (월미산 정상 인천항VTS 관제탑)',
    phone: '032-880-6000',
    emergencyVhf: 'VHF CH 16 / CH 14 (인천관제)',
    jurisdiction: '인천항 갑문 및 팔미도 제1·2항로',
    keyDuty: '조석간만의 차 극복 갑문 통항관제, 짙은 해무 시 항행안전지도',
    badgeColor: {
      bg: 'bg-red-900/60',
      border: 'border-red-600',
      text: 'text-red-300',
      dot: 'bg-red-400',
      pinHex: '#dc2626'
    }
  },
  {
    id: 'agency-vts-jindo',
    name: '진도연안 VTS (해상교통관제센터)',
    agencyType: 'VTS',
    categoryLabel: 'VTS 해상교통관제',
    region: 'WEST',
    lat: 34.3415,
    lng: 126.1360,
    address: '전라남도 진도군 임회면 남동리 323 (진도 서남단 진도연안VTS 관제탑)',
    phone: '061-540-3000',
    emergencyVhf: 'VHF CH 16 / CH 68 (진도연안)',
    jurisdiction: '맹골수도 및 서남해 연안 주요 항로',
    keyDuty: '급조류 해역 선박 안전속력 통제, 여객선·어선 충돌방지 실시간 모니터링',
    badgeColor: {
      bg: 'bg-red-900/60',
      border: 'border-red-600',
      text: 'text-red-300',
      dot: 'bg-red-400',
      pinHex: '#dc2626'
    }
  },
  {
    id: 'agency-vts-ulsan',
    name: '울산항 VTS (해상교통관제센터)',
    agencyType: 'VTS',
    categoryLabel: 'VTS 해상교통관제',
    region: 'SOUTH',
    lat: 35.5035,
    lng: 129.3820,
    address: '울산광역시 남구 장생포고래로 230 (장생포 울산항VTS 관제탑)',
    phone: '052-228-5000',
    emergencyVhf: 'VHF CH 16 / CH 13 (울산관제)',
    jurisdiction: '울산 본항, 온산항 및 동해 가스전 통항로',
    keyDuty: '원유운반선·케미컬선 등 위험화물선 전담 관제, 안전거리 유지',
    badgeColor: {
      bg: 'bg-red-900/60',
      border: 'border-red-600',
      text: 'text-red-300',
      dot: 'bg-red-400',
      pinHex: '#dc2626'
    }
  },
  {
    id: 'agency-vts-tongyeong',
    name: '통영연안 VTS (해상교통관제센터)',
    agencyType: 'VTS',
    categoryLabel: 'VTS 해상교통관제',
    region: 'SOUTH',
    lat: 34.8260,
    lng: 128.4350,
    address: '경상남도 통영시 도남로 257 (수란산 통영연안VTS 관제탑)',
    phone: '055-640-5000',
    emergencyVhf: 'VHF CH 16 / CH 69 (통영연안)',
    jurisdiction: '통영·사천·남해 연안 좁은 수로 및 어장 밀집구역',
    keyDuty: '어선 통항 밀집구역 항행 경고, 레저보트 및 조업선 충돌 예방',
    badgeColor: {
      bg: 'bg-red-900/60',
      border: 'border-red-600',
      text: 'text-red-300',
      dot: 'bg-red-400',
      pinHex: '#dc2626'
    }
  }
];
