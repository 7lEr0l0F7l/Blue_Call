import { 
  MaritimeVessel, 
  MaritimeSosEvent, 
  MaritimeCall, 
  CrewMember, 
  BlueBotMessage,
  VesselChatMessage,
  VesselChatHistory,
  MaritimeAccidentType
} from '../types/maritime';
import { audioHelper } from '../utils/audio';
import { generateMaritimeChatReply } from './maritimeChatAi';
import { getBlueBotAiReply } from './maritimeBlueBotAi';

export interface ActiveCallConnection {
  id: string;
  callerMmsi: string;
  callerName: string;
  receiverMmsi: string;
  receiverName: string;
  status: 'CONNECTING' | 'CONNECTED'; // CONNECTING = orange dashed line, CONNECTED = green solid line
  startedAt: string;
  transcriptPreview?: string;
  aiTag?: string;
}

// Coordinate distance & bearing helpers from Flying Dutchman (Yeosu: 34.7441, 127.7378)
function calcDistanceNM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3440.065; // Nautical miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function calcBearingDeg(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const y = Math.sin((lng2 - lng1) * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180);
  const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
            Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos((lng2 - lng1) * Math.PI / 180);
  let brng = Math.atan2(y, x) * 180 / Math.PI;
  return Math.round((brng + 360) % 360);
}

const ownLat = 35.2100;
const ownLng = 129.3600;

// 50+ Realistic Vessels evenly distributed across South Sea, West Sea, East Sea, and Jeju
const rawVessels: MaritimeVessel[] = [
  // ==========================================
  // [1] 남해·동남해안 (부산·기장·여수·광양·남해·통영·거제·완도·진도·목포)
  // ==========================================
  {
    id: 'vessel-own',
    mmsi: '440182940',
    shipName: '플라잉 더치맨호 (본선)',
    vesselType: '연안통발',
    tonnage: 9.77,
    callSign: 'DS8291',
    registrationNo: '부산기장-2023-089',
    captainName: '최재현 선장',
    safePhoneNumber: '0504-8921-1204',
    lat: ownLat,
    lng: ownLng,
    speedKnots: 5.4,
    headingDeg: 85,
    status: 'NORMAL',
    statusMessage: '안전 항해 중 (부산 기장 외해 조업 구역)',
    isOwnShip: true,
    batteryLevel: 94,
    satelliteSignal: 'EXCELLENT'
  },
  {
    id: 'vessel-01',
    mmsi: '440291842',
    shipName: '새벽별호',
    vesselType: '연안통발',
    tonnage: 7.93,
    callSign: 'DS3341',
    registrationNo: '부산기장-2021-042',
    captainName: '박도현 선장',
    safePhoneNumber: '0504-3341-9810',
    lat: 35.2250,
    lng: 129.3800,
    speedKnots: 5.2,
    headingDeg: 120,
    status: 'NORMAL',
    statusMessage: '부산 기장 외해 정상 항해 중 (통발 작업)',
    satelliteSignal: 'EXCELLENT'
  },
  {
    id: 'vessel-06',
    mmsi: '440552199',
    shipName: '해경122정 (부산기장)',
    vesselType: '해경 경비정',
    tonnage: 100.0,
    callSign: 'CG1220',
    registrationNo: '해경-경비-122',
    captainName: '강태양 함장',
    safePhoneNumber: '0504-1220-1122',
    lat: 35.1850,
    lng: 129.3400,
    speedKnots: 15.0,
    headingDeg: 340,
    status: 'NORMAL',
    statusMessage: '기장·부산 연안 해상 안전 순찰 중',
    satelliteSignal: 'EXCELLENT'
  },
  {
    id: 'vessel-south-01',
    mmsi: '440319201',
    shipName: '남해보물호',
    vesselType: '연안복합',
    tonnage: 4.98,
    callSign: 'NH3192',
    registrationNo: '경남남해-2022-031',
    captainName: '송진우 선장',
    safePhoneNumber: '0504-3192-8821',
    lat: 34.6200,
    lng: 128.0500,
    speedKnots: 4.8,
    headingDeg: 105,
    status: 'NORMAL',
    statusMessage: '남해 외해 남방 해역 항해 중',
    satelliteSignal: 'GOOD'
  },
  {
    id: 'vessel-south-03',
    mmsi: '440618223',
    shipName: '나로은빛호',
    vesselType: '연안통발',
    tonnage: 9.2,
    callSign: 'NR6182',
    registrationNo: '전남고흥-2021-118',
    captainName: '고영훈 선장',
    safePhoneNumber: '0504-6182-3390',
    lat: 34.3200,
    lng: 127.5500,
    speedKnots: 2.1,
    headingDeg: 70,
    status: 'NORMAL',
    statusMessage: '나로도 외해 정상 항해 중',
    satelliteSignal: 'GOOD'
  },
  {
    id: 'vessel-south-04',
    mmsi: '440512884',
    shipName: '거문수호호',
    vesselType: '근해자망',
    tonnage: 29.0,
    callSign: 'GM5128',
    registrationNo: '전남여수-2019-214',
    captainName: '배상원 선장',
    safePhoneNumber: '0504-5128-4412',
    lat: 33.9200,
    lng: 127.3200,
    speedKnots: 2.5,
    headingDeg: 160,
    status: 'FISHING',
    statusMessage: '거문도 남방 원거리 외해 대형 삼치 자망 양망 중 (어구전개 반경 800m 접근주의)',
    satelliteSignal: 'GOOD'
  },
  {
    id: 'vessel-04',
    mmsi: '440881920',
    shipName: '혜오름호',
    vesselType: '연안복합',
    tonnage: 4.99,
    callSign: 'HO8819',
    registrationNo: '경남통영-2021-088',
    captainName: '윤재호 선장',
    safePhoneNumber: '0504-8819-2211',
    lat: 34.6800,
    lng: 128.4800,
    speedKnots: 8.5,
    headingDeg: 220,
    status: 'NORMAL',
    statusMessage: '통영 외해 남방 항해 중',
    satelliteSignal: 'EXCELLENT'
  },
  {
    id: 'vessel-south-05',
    mmsi: '440781204',
    shipName: '한산대첩호',
    vesselType: '연안통발',
    tonnage: 7.5,
    callSign: 'HS7812',
    registrationNo: '경남통영-2022-054',
    captainName: '문정태 선장',
    safePhoneNumber: '0504-7812-9903',
    lat: 34.6600,
    lng: 128.5800,
    speedKnots: 4.8,
    headingDeg: 80,
    status: 'NORMAL',
    statusMessage: '거제 남방 외해 정상 통항',
    satelliteSignal: 'EXCELLENT'
  },
  {
    id: 'vessel-south-06',
    mmsi: '440629110',
    shipName: '욕지골드호',
    vesselType: '어선(채낚기)',
    tonnage: 15.0,
    callSign: 'YJ6291',
    registrationNo: '경남통영-2021-180',
    captainName: '조경수 선장',
    safePhoneNumber: '0504-6291-7781',
    lat: 34.4200,
    lng: 128.2500,
    speedKnots: 2.8,
    headingDeg: 140,
    status: 'FISHING',
    statusMessage: '욕지도 남방 15해리 원거리 외해 선망 투망 조업 중 (충돌회피 주의)',
    satelliteSignal: 'GOOD'
  },
  {
    id: 'vessel-south-07',
    mmsi: '440819332',
    shipName: '거제푸른호',
    vesselType: '연안복합',
    tonnage: 9.5,
    callSign: 'GJ8193',
    registrationNo: '경남거제-2020-093',
    captainName: '김태석 선장',
    safePhoneNumber: '0504-8193-4410',
    lat: 34.8200,
    lng: 128.8200,
    speedKnots: 7.1,
    headingDeg: 195,
    status: 'NORMAL',
    statusMessage: '장승포 외해 정상 항해 중',
    satelliteSignal: 'EXCELLENT'
  },
  {
    id: 'vessel-south-08',
    mmsi: '440901248',
    shipName: '어업지도선 무궁화15호',
    vesselType: '어업지도선',
    tonnage: 150.0,
    callSign: 'MK9012',
    registrationNo: '지도선-경남-015',
    captainName: '정해원 선장',
    safePhoneNumber: '0504-9012-1515',
    lat: 34.7800,
    lng: 128.8500,
    speedKnots: 13.5,
    headingDeg: 260,
    status: 'NORMAL',
    statusMessage: '남해 거제 동방 외해 조업 지도 순찰 중',
    satelliteSignal: 'EXCELLENT'
  },
  {
    id: 'vessel-05',
    mmsi: '440991823',
    shipName: '동양수산호',
    vesselType: '상선/화물선',
    tonnage: 128.0,
    callSign: 'DY9918',
    registrationNo: '부산남항-2019-028',
    captainName: '최동하 선장',
    safePhoneNumber: '0504-9918-6541',
    lat: 35.0200,
    lng: 129.1400,
    speedKnots: 9.4,
    headingDeg: 155,
    status: 'NORMAL',
    statusMessage: '부산 영도 남동방 외해 정상 항해',
    satelliteSignal: 'EXCELLENT'
  },
  {
    id: 'vessel-south-09',
    mmsi: '440819445',
    shipName: '부산신항호',
    vesselType: '상선/화물선',
    tonnage: 320.0,
    callSign: 'BS8194',
    registrationNo: '부산강서-2021-014',
    captainName: '오세훈 선장',
    safePhoneNumber: '0504-8194-2201',
    lat: 34.9800,
    lng: 128.8500,
    speedKnots: 8.8,
    headingDeg: 110,
    status: 'NORMAL',
    statusMessage: '가덕도 남방 통항로 항해',
    satelliteSignal: 'EXCELLENT'
  },
  {
    id: 'vessel-south-10',
    mmsi: '440718339',
    shipName: '기장미역호',
    vesselType: '연안복합',
    tonnage: 4.9,
    callSign: 'GJ7183',
    registrationNo: '부산기장-2022-044',
    captainName: '손대영 선장',
    safePhoneNumber: '0504-7183-1120',
    lat: 35.2000,
    lng: 129.3200,
    speedKnots: 5.1,
    headingDeg: 45,
    status: 'NORMAL',
    statusMessage: '기장 대변항 외해 정상 통항',
    satelliteSignal: 'GOOD'
  },
  {
    id: 'vessel-02',
    mmsi: '440718293',
    shipName: '목포청운호',
    vesselType: '연안복합',
    tonnage: 9.77,
    callSign: 'MP7182',
    registrationNo: '전남목포-2022-115',
    captainName: '정성호 선장',
    safePhoneNumber: '0504-7182-4432',
    lat: 34.6800,
    lng: 125.8800,
    speedKnots: 6.8,
    headingDeg: 210,
    status: 'NORMAL',
    statusMessage: '목포 서방 외해 통항로 입항 협의 중',
    satelliteSignal: 'GOOD'
  },
  {
    id: 'vessel-03',
    mmsi: '440661204',
    shipName: '청해진호',
    vesselType: '근해자망',
    tonnage: 24.0,
    callSign: 'CH6612',
    registrationNo: '전남완도-2022-411',
    captainName: '한지혁 선장',
    safePhoneNumber: '0504-6612-9901',
    lat: 34.2500,
    lng: 126.7500,
    speedKnots: 0.0,
    headingDeg: 0,
    status: 'SOS',
    statusMessage: '기관고장 표류 중 (지원 요청)',
    satelliteSignal: 'FAIR'
  },
  {
    id: 'vessel-south-11',
    mmsi: '440551902',
    shipName: '완도다도해호',
    vesselType: '연안복합',
    tonnage: 8.2,
    callSign: 'WD5519',
    registrationNo: '전남완도-2021-081',
    captainName: '임진택 선장',
    safePhoneNumber: '0504-5519-7801',
    lat: 34.2200,
    lng: 126.9200,
    speedKnots: 4.5,
    headingDeg: 125,
    status: 'NORMAL',
    statusMessage: '신지도 남동방 전복 어장 통항',
    satelliteSignal: 'GOOD'
  },
  {
    id: 'vessel-south-12',
    mmsi: '440449102',
    shipName: '진도명량호',
    vesselType: '근해안강망',
    tonnage: 35.0,
    callSign: 'JD4491',
    registrationNo: '전남진도-2020-032',
    captainName: '류경환 선장',
    safePhoneNumber: '0504-4491-3329',
    lat: 34.1800,
    lng: 125.9200,
    speedKnots: 5.6,
    headingDeg: 180,
    status: 'NORMAL',
    statusMessage: '진도 서망항 남서방 외해 항해 중',
    satelliteSignal: 'GOOD'
  },

  // ==========================================
  // [2] 서해안 (인천·강화·연평·당진·태안·보령·서천·군산·부안·신안·흑산도)
  // ==========================================
  {
    id: 'vessel-07',
    mmsi: '440331002',
    shipName: '서해영광호',
    vesselType: '근해안강망',
    tonnage: 42.0,
    callSign: 'IC3310',
    registrationNo: '인천중구-2019-105',
    captainName: '황도진 선장',
    safePhoneNumber: '0504-3310-3322',
    lat: 37.2200,
    lng: 126.0500,
    speedKnots: 5.8,
    headingDeg: 195,
    status: 'NORMAL',
    statusMessage: '인천 덕적도 남방 통항 중',
    satelliteSignal: 'EXCELLENT'
  },
  {
    id: 'vessel-west-01',
    mmsi: '440312001',
    shipName: '인천해경312함',
    vesselType: '해경 경비정',
    tonnage: 300.0,
    callSign: 'CG0312',
    registrationNo: '해경-인천-312',
    captainName: '서준영 함장',
    safePhoneNumber: '0504-3120-1120',
    lat: 37.3500,
    lng: 126.2800,
    speedKnots: 16.4,
    headingDeg: 240,
    status: 'NORMAL',
    statusMessage: '영종도 남서방 서해 경비 임무',
    satelliteSignal: 'EXCELLENT'
  },
  {
    id: 'vessel-west-02',
    mmsi: '440381920',
    shipName: '강화만조호',
    vesselType: '연안복합',
    tonnage: 6.5,
    callSign: 'GH3819',
    registrationNo: '인천강화-2022-019',
    captainName: '백승호 선장',
    safePhoneNumber: '0504-3819-7712',
    lat: 37.5200,
    lng: 125.7500,
    speedKnots: 5.2,
    headingDeg: 85,
    status: 'NORMAL',
    statusMessage: '강화 서방 해상 정상 통항',
    satelliteSignal: 'GOOD'
  },
  {
    id: 'vessel-west-03',
    mmsi: '440391004',
    shipName: '연평수호호',
    vesselType: '근해안강망',
    tonnage: 29.0,
    callSign: 'YP3910',
    registrationNo: '인천옹진-2021-073',
    captainName: '차정일 선장',
    safePhoneNumber: '0504-3910-1829',
    lat: 37.4500,
    lng: 125.5500,
    speedKnots: 2.5,
    headingDeg: 210,
    status: 'FISHING',
    statusMessage: '서해 원거리 외해 특정해역 꽃게 안강망 양망 작업 중 (접근주의)',
    satelliteSignal: 'GOOD'
  },
  {
    id: 'vessel-west-04',
    mmsi: '440351829',
    shipName: '덕적푸른호',
    vesselType: '연안통발',
    tonnage: 8.4,
    callSign: 'DJ3518',
    registrationNo: '인천옹진-2020-048',
    captainName: '남궁혁 선장',
    safePhoneNumber: '0504-3518-9921',
    lat: 37.1000,
    lng: 125.8500,
    speedKnots: 4.5,
    headingDeg: 135,
    status: 'NORMAL',
    statusMessage: '덕적군도 서방 통항 중',
    satelliteSignal: 'GOOD'
  },
  {
    id: 'vessel-west-05',
    mmsi: '440412890',
    shipName: '당진서해호',
    vesselType: '연안복합',
    tonnage: 5.8,
    callSign: 'DJ4128',
    registrationNo: '충남당진-2022-012',
    captainName: '권영수 선장',
    safePhoneNumber: '0504-4128-0912',
    lat: 37.0500,
    lng: 126.0500,
    speedKnots: 6.2,
    headingDeg: 300,
    status: 'NORMAL',
    statusMessage: '당진 외해 통항로 정상 항해',
    satelliteSignal: 'EXCELLENT'
  },
  {
    id: 'vessel-west-06',
    mmsi: '440451920',
    shipName: '태안신진호',
    vesselType: '어선(채낚기)',
    tonnage: 24.0,
    callSign: 'TA4519',
    registrationNo: '충남태안-2021-098',
    captainName: '신동혁 선장',
    safePhoneNumber: '0504-4519-8120',
    lat: 36.6500,
    lng: 126.0200,
    speedKnots: 4.8,
    headingDeg: 275,
    status: 'NORMAL',
    statusMessage: '안흥외항 서방 정상 통항',
    satelliteSignal: 'EXCELLENT'
  },
  {
    id: 'vessel-west-07',
    mmsi: '440481230',
    shipName: '격렬비열도호',
    vesselType: '근해자망',
    tonnage: 38.0,
    callSign: 'GR4812',
    registrationNo: '충남태안-2020-112',
    captainName: '탁기준 선장',
    safePhoneNumber: '0504-4812-4401',
    lat: 36.5500,
    lng: 125.3500,
    speedKnots: 2.8,
    headingDeg: 190,
    status: 'FISHING',
    statusMessage: '격렬비열도 서방 원거리 외해 안강망 대형 어구 전개 중 (접근제한)',
    satelliteSignal: 'GOOD'
  },
  {
    id: 'vessel-west-08',
    mmsi: '440491823',
    shipName: '대천바다호',
    vesselType: '근해안강망',
    tonnage: 22.0,
    callSign: 'DC4918',
    registrationNo: '충남보령-2021-045',
    captainName: '안상우 선장',
    safePhoneNumber: '0504-4918-6621',
    lat: 36.2800,
    lng: 126.2200,
    speedKnots: 5.8,
    headingDeg: 110,
    status: 'NORMAL',
    statusMessage: '보령 대천항 외해 정상 항해',
    satelliteSignal: 'EXCELLENT'
  },
  {
    id: 'vessel-west-09',
    mmsi: '440519283',
    shipName: '서천서부호',
    vesselType: '연안통발',
    tonnage: 7.9,
    callSign: 'SC5192',
    registrationNo: '충남서천-2022-038',
    captainName: '장만석 선장',
    safePhoneNumber: '0504-5192-3301',
    lat: 36.1000,
    lng: 126.2500,
    speedKnots: 5.4,
    headingDeg: 80,
    status: 'NORMAL',
    statusMessage: '서천 홍원항 외해 정상 항해',
    satelliteSignal: 'GOOD'
  },
  {
    id: 'vessel-west-10',
    mmsi: '440571902',
    shipName: '군산비응호',
    vesselType: '근해안강망',
    tonnage: 35.0,
    callSign: 'GS5719',
    registrationNo: '전북군산-2020-072',
    captainName: '노영일 선장',
    safePhoneNumber: '0504-5719-8812',
    lat: 35.9200,
    lng: 126.1800,
    speedKnots: 5.1,
    headingDeg: 225,
    status: 'NORMAL',
    statusMessage: '어청도 동방 해상 통항 중',
    satelliteSignal: 'EXCELLENT'
  },
  {
    id: 'vessel-west-11',
    mmsi: '440581209',
    shipName: '부안격포호',
    vesselType: '연안복합',
    tonnage: 9.8,
    callSign: 'BA5812',
    registrationNo: '전북부안-2021-029',
    captainName: '변재환 선장',
    safePhoneNumber: '0504-5812-7102',
    lat: 35.5800,
    lng: 126.1500,
    speedKnots: 6.0,
    headingDeg: 170,
    status: 'NORMAL',
    statusMessage: '위도 서방 해역 정상 운항',
    satelliteSignal: 'GOOD'
  },
  {
    id: 'vessel-west-12',
    mmsi: '440591823',
    shipName: '영광칠산호',
    vesselType: '근해자망',
    tonnage: 18.0,
    callSign: 'YG5918',
    registrationNo: '전남영광-2022-044',
    captainName: '하도영 선장',
    safePhoneNumber: '0504-5918-2231',
    lat: 35.3500,
    lng: 126.0500,
    speedKnots: 4.5,
    headingDeg: 60,
    status: 'NORMAL',
    statusMessage: '칠산바다 정상 통항 중',
    satelliteSignal: 'GOOD'
  },
  {
    id: 'vessel-west-13',
    mmsi: '440612940',
    shipName: '신안천사호',
    vesselType: '연안복합',
    tonnage: 8.0,
    callSign: 'SA6129',
    registrationNo: '전남신안-2021-155',
    captainName: '지용구 선장',
    safePhoneNumber: '0504-6129-9943',
    lat: 34.7800,
    lng: 125.7500,
    speedKnots: 5.8,
    headingDeg: 245,
    status: 'NORMAL',
    statusMessage: '비금·도초 서방 해상 순항',
    satelliteSignal: 'GOOD'
  },
  {
    id: 'vessel-west-14',
    mmsi: '440621008',
    shipName: '흑산바다호',
    vesselType: '근해자망',
    tonnage: 28.0,
    callSign: 'HS6210',
    registrationNo: '전남신안-2019-092',
    captainName: '구본철 선장',
    safePhoneNumber: '0504-6210-5512',
    lat: 34.5200,
    lng: 125.2000,
    speedKnots: 2.2,
    headingDeg: 130,
    status: 'FISHING',
    statusMessage: '흑산도 서남방 원거리 외해 홍어 주어장 자망 작업 중 (접근주의)',
    satelliteSignal: 'GOOD'
  },
  {
    id: 'vessel-west-15',
    mmsi: '440639102',
    shipName: '홍도노을호',
    vesselType: '어선(채낚기)',
    tonnage: 19.5,
    callSign: 'HD6391',
    registrationNo: '전남신안-2020-033',
    captainName: '양동진 선장',
    safePhoneNumber: '0504-6391-4190',
    lat: 34.6800,
    lng: 125.1000,
    speedKnots: 6.4,
    headingDeg: 95,
    status: 'NORMAL',
    statusMessage: '홍도 서방 외해 정상 운항',
    satelliteSignal: 'FAIR'
  },

  // ==========================================
  // [3] 동해안 (울산·포항·영덕·울진·삼척·동해·강릉·속초·고성·울릉도·독도)
  // ==========================================
  {
    id: 'vessel-east-01',
    mmsi: '440718902',
    shipName: '울산방어진호',
    vesselType: '연안통발',
    tonnage: 9.5,
    callSign: 'US7189',
    registrationNo: '울산동구-2021-067',
    captainName: '엄진섭 선장',
    safePhoneNumber: '0504-7189-1020',
    lat: 35.4600,
    lng: 129.5200,
    speedKnots: 4.0,
    headingDeg: 75,
    status: 'NORMAL',
    statusMessage: '방어진 동방 외해 통항 중',
    satelliteSignal: 'EXCELLENT'
  },
  {
    id: 'vessel-east-02',
    mmsi: '440729103',
    shipName: '간절곶등대호',
    vesselType: '연안복합',
    tonnage: 6.2,
    callSign: 'GJ7291',
    registrationNo: '울산울주-2022-015',
    captainName: '마동식 선장',
    safePhoneNumber: '0504-7291-3829',
    lat: 35.3200,
    lng: 129.4800,
    speedKnots: 5.3,
    headingDeg: 120,
    status: 'NORMAL',
    statusMessage: '간절곶 외해 항해 중',
    satelliteSignal: 'EXCELLENT'
  },
  {
    id: 'vessel-east-03',
    mmsi: '440781920',
    shipName: '호미곶일출호',
    vesselType: '어선(채낚기)',
    tonnage: 34.0,
    callSign: 'HM7819',
    registrationNo: '경북포항-2020-118',
    captainName: '피승우 선장',
    safePhoneNumber: '0504-7819-6612',
    lat: 36.1200,
    lng: 129.8800,
    speedKnots: 2.8,
    headingDeg: 90,
    status: 'FISHING',
    statusMessage: '호미곶 동방 22해리 원거리 외해 집어등 점등 채낚기 조업 (피항 요망)',
    satelliteSignal: 'EXCELLENT'
  },
  {
    id: 'vessel-east-04',
    mmsi: '440791024',
    shipName: '강구대게호',
    vesselType: '근해자망',
    tonnage: 27.0,
    callSign: 'GG7910',
    registrationNo: '경북영덕-2021-043',
    captainName: '서영택 선장',
    safePhoneNumber: '0504-7910-2291',
    lat: 36.3500,
    lng: 129.5200,
    speedKnots: 5.2,
    headingDeg: 35,
    status: 'NORMAL',
    statusMessage: '영덕 강구 외해 정상 통항',
    satelliteSignal: 'GOOD'
  },
  {
    id: 'vessel-east-05',
    mmsi: '440801239',
    shipName: '축산은빛호',
    vesselType: '연안통발',
    tonnage: 8.9,
    callSign: 'CS8012',
    registrationNo: '경북영덕-2022-019',
    captainName: '방현석 선장',
    safePhoneNumber: '0504-8012-7710',
    lat: 36.5000,
    lng: 129.5500,
    speedKnots: 5.6,
    headingDeg: 175,
    status: 'NORMAL',
    statusMessage: '축산항 외해 복귀 중',
    satelliteSignal: 'GOOD'
  },
  {
    id: 'vessel-east-06',
    mmsi: '440812903',
    shipName: '울진후포호',
    vesselType: '근해자망',
    tonnage: 33.0,
    callSign: 'UJ8129',
    registrationNo: '경북울진-2020-088',
    captainName: '표상민 선장',
    safePhoneNumber: '0504-8129-4409',
    lat: 36.6800,
    lng: 129.8000,
    speedKnots: 2.6,
    headingDeg: 65,
    status: 'FISHING',
    statusMessage: '왕돌초 원거리 외해 대게 자망 어구 전개 중 (접근제한)',
    satelliteSignal: 'EXCELLENT'
  },
  {
    id: 'vessel-east-07',
    mmsi: '440821098',
    shipName: '죽변청정호',
    vesselType: '어선(채낚기)',
    tonnage: 22.0,
    callSign: 'JB8210',
    registrationNo: '경북울진-2021-076',
    captainName: '원종철 선장',
    safePhoneNumber: '0504-8210-9921',
    lat: 37.0400,
    lng: 129.5500,
    speedKnots: 6.8,
    headingDeg: 15,
    status: 'NORMAL',
    statusMessage: '죽변항 외해 정상 항해 중',
    satelliteSignal: 'GOOD'
  },
  {
    id: 'vessel-east-08',
    mmsi: '440831204',
    shipName: '삼척이사부호',
    vesselType: '연안복합',
    tonnage: 7.8,
    callSign: 'SC8312',
    registrationNo: '강원삼척-2022-031',
    captainName: '전병준 선장',
    safePhoneNumber: '0504-8312-3104',
    lat: 37.4000,
    lng: 129.3500,
    speedKnots: 4.7,
    headingDeg: 110,
    status: 'NORMAL',
    statusMessage: '임원항 외해 가자미 조업 이동',
    satelliteSignal: 'GOOD'
  },
  {
    id: 'vessel-east-09',
    mmsi: '440841920',
    shipName: '동해묵호호',
    vesselType: '어선(채낚기)',
    tonnage: 26.0,
    callSign: 'DH8419',
    registrationNo: '강원동해-2020-052',
    captainName: '주광남 선장',
    safePhoneNumber: '0504-8419-8812',
    lat: 37.5200,
    lng: 129.2500,
    speedKnots: 5.9,
    headingDeg: 345,
    status: 'NORMAL',
    statusMessage: '묵호항 북동방 이동 중',
    satelliteSignal: 'EXCELLENT'
  },
  {
    id: 'vessel-east-10',
    mmsi: '440851203',
    shipName: '강릉주문진호',
    vesselType: '어선(채낚기)',
    tonnage: 29.0,
    callSign: 'JM8512',
    registrationNo: '강원강릉-2021-089',
    captainName: '유재덕 선장',
    safePhoneNumber: '0504-8512-4419',
    lat: 37.8800,
    lng: 129.0200,
    speedKnots: 5.5,
    headingDeg: 80,
    status: 'NORMAL',
    statusMessage: '주문진항 외해 정상 항해',
    satelliteSignal: 'EXCELLENT'
  },
  {
    id: 'vessel-east-11',
    mmsi: '440861928',
    shipName: '양양낙산호',
    vesselType: '연안통발',
    tonnage: 9.1,
    callSign: 'YY8619',
    registrationNo: '강원양양-2022-014',
    captainName: '문상호 선장',
    safePhoneNumber: '0504-8619-7102',
    lat: 38.1000,
    lng: 128.8200,
    speedKnots: 4.3,
    headingDeg: 160,
    status: 'NORMAL',
    statusMessage: '남애항·기사문 외해 항해',
    satelliteSignal: 'GOOD'
  },
  {
    id: 'vessel-east-12',
    mmsi: '440871024',
    shipName: '속초동명호',
    vesselType: '어선(채낚기)',
    tonnage: 25.0,
    callSign: 'SC8710',
    registrationNo: '강원속초-2020-064',
    captainName: '석진수 선장',
    safePhoneNumber: '0504-8710-5591',
    lat: 38.2000,
    lng: 128.7500,
    speedKnots: 5.4,
    headingDeg: 60,
    status: 'NORMAL',
    statusMessage: '속초항 외항 정상 통항',
    satelliteSignal: 'EXCELLENT'
  },
  {
    id: 'vessel-east-13',
    mmsi: '440881903',
    shipName: '고성거진호',
    vesselType: '근해자망',
    tonnage: 29.5,
    callSign: 'GS8819',
    registrationNo: '강원고성-2021-037',
    captainName: '현동수 선장',
    safePhoneNumber: '0504-8819-1104',
    lat: 38.4200,
    lng: 128.6000,
    speedKnots: 4.8,
    headingDeg: 20,
    status: 'NORMAL',
    statusMessage: '거진항 앞바다 동해 최북단 어로한계선 준수',
    satelliteSignal: 'GOOD'
  },
  {
    id: 'vessel-east-14',
    mmsi: '440500100',
    shipName: '동해해경5001함',
    vesselType: '해경 경비정',
    tonnage: 5000.0,
    callSign: 'CG5001',
    registrationNo: '해경-동해-5001',
    captainName: '조태웅 함장',
    safePhoneNumber: '0504-5001-1122',
    lat: 37.4500,
    lng: 129.5500,
    speedKnots: 18.0,
    headingDeg: 90,
    status: 'NORMAL',
    statusMessage: '동해 원거리 광역 해상 경비 작전',
    satelliteSignal: 'EXCELLENT'
  },
  {
    id: 'vessel-east-15',
    mmsi: '440891204',
    shipName: '울릉오징어호',
    vesselType: '어선(채낚기)',
    tonnage: 45.0,
    callSign: 'UL8912',
    registrationNo: '경북울릉-2019-018',
    captainName: '우상호 선장',
    safePhoneNumber: '0504-8912-8819',
    lat: 37.4500,
    lng: 131.0500,
    speedKnots: 2.8,
    headingDeg: 120,
    status: 'FISHING',
    statusMessage: '울릉도 동남방 원거리 외해 오징어 채낚기 조업 중 (접근주의)',
    satelliteSignal: 'EXCELLENT'
  },
  {
    id: 'vessel-east-16',
    mmsi: '440899102',
    shipName: '독도수호선',
    vesselType: '어업지도선',
    tonnage: 250.0,
    callSign: 'DK8991',
    registrationNo: '지도선-경북-001',
    captainName: '독고진 선장',
    safePhoneNumber: '0504-8991-7701',
    lat: 37.2200,
    lng: 131.9000,
    speedKnots: 12.0,
    headingDeg: 270,
    status: 'NORMAL',
    statusMessage: '독도 근해 한국 어선 안전 조업 지도',
    satelliteSignal: 'EXCELLENT'
  },

  // ==========================================
  // [4] 제주도 및 남해 원거리 외해 (한림·모슬포·마라도·서귀포·성산포·우도·추자도)
  // ==========================================
  {
    id: 'vessel-09',
    mmsi: '440881401',
    shipName: '제주한림호',
    vesselType: '어선(채낚기)',
    tonnage: 29.0,
    callSign: 'HL8814',
    registrationNo: '제주한림-2022-077',
    captainName: '강도현 선장',
    safePhoneNumber: '0504-8814-1234',
    lat: 33.3200,
    lng: 125.8500,
    speedKnots: 2.5,
    headingDeg: 215,
    status: 'FISHING',
    statusMessage: '제주 서방 원거리 외해 갈치 연승 어구 양망 중 (어구 훼손방지 접근주의)',
    satelliteSignal: 'EXCELLENT'
  },
  {
    id: 'vessel-jeju-01',
    mmsi: '440912803',
    shipName: '제주모슬포호',
    vesselType: '연안복합',
    tonnage: 9.8,
    callSign: 'MS9128',
    registrationNo: '제주서귀포-2021-041',
    captainName: '오창균 선장',
    safePhoneNumber: '0504-9128-4421',
    lat: 33.1500,
    lng: 126.1500,
    speedKnots: 5.2,
    headingDeg: 165,
    status: 'NORMAL',
    statusMessage: '모슬포항 외해 정상 통항',
    satelliteSignal: 'GOOD'
  },
  {
    id: 'vessel-jeju-02',
    mmsi: '440921094',
    shipName: '마라도평화호',
    vesselType: '어선(채낚기)',
    tonnage: 18.0,
    callSign: 'MR9210',
    registrationNo: '제주서귀포-2022-019',
    captainName: '좌종원 선장',
    safePhoneNumber: '0504-9210-9912',
    lat: 32.9000,
    lng: 126.2000,
    speedKnots: 2.8,
    headingDeg: 190,
    status: 'FISHING',
    statusMessage: '국토최남단 마라도 남방 원거리 외해 방어·갈치 조업 중 (접근제한)',
    satelliteSignal: 'GOOD'
  },
  {
    id: 'vessel-jeju-03',
    mmsi: '440931204',
    shipName: '서귀포은갈치호',
    vesselType: '어선(채낚기)',
    tonnage: 29.0,
    callSign: 'SG9312',
    registrationNo: '제주서귀포-2020-088',
    captainName: '부진호 선장',
    safePhoneNumber: '0504-9312-7719',
    lat: 33.1200,
    lng: 126.6500,
    speedKnots: 5.4,
    headingDeg: 130,
    status: 'NORMAL',
    statusMessage: '서귀포 외항 정상 통항',
    satelliteSignal: 'EXCELLENT'
  },
  {
    id: 'vessel-jeju-04',
    mmsi: '440941920',
    shipName: '성산일출호',
    vesselType: '어선(채낚기)',
    tonnage: 32.0,
    callSign: 'SS9419',
    registrationNo: '제주서귀포-2021-105',
    captainName: '양인석 선장',
    safePhoneNumber: '0504-9419-5501',
    lat: 33.4200,
    lng: 127.1000,
    speedKnots: 5.8,
    headingDeg: 80,
    status: 'NORMAL',
    statusMessage: '성산포 외항 정상 항해',
    satelliteSignal: 'EXCELLENT'
  },
  {
    id: 'vessel-jeju-05',
    mmsi: '440951239',
    shipName: '우도에메랄드호',
    vesselType: '연안복합',
    tonnage: 7.5,
    callSign: 'UD9512',
    registrationNo: '제주시-2022-033',
    captainName: '고광진 선장',
    safePhoneNumber: '0504-9512-3329',
    lat: 33.5800,
    lng: 127.0500,
    speedKnots: 6.2,
    headingDeg: 310,
    status: 'NORMAL',
    statusMessage: '우도 북동방 소라 조업지 통항',
    satelliteSignal: 'GOOD'
  },
  {
    id: 'vessel-jeju-06',
    mmsi: '440961829',
    shipName: '추자바다호',
    vesselType: '근해자망',
    tonnage: 24.0,
    callSign: 'CJ9618',
    registrationNo: '제주시-2021-061',
    captainName: '진성훈 선장',
    safePhoneNumber: '0504-9618-8821',
    lat: 33.9000,
    lng: 126.3000,
    speedKnots: 5.0,
    headingDeg: 140,
    status: 'NORMAL',
    statusMessage: '상·하추자도 외해 통항',
    satelliteSignal: 'GOOD'
  },

  // ==========================================
  // [5] 원해·외해 먼바다 (Outer Deep Waters & EEZ Boundary)
  // 대화퇴 어장, 독도·울릉도 동방 외해, 이어도 해양과학기지 인근, 제주 남방 먼바다,
  // 서해 격렬비열도 서방 한중잠정조치수역 부근, 가거도·흑산도 서남방 먼바다
  // ==========================================
  // --- 동해 대화퇴 & 독도 외해 원거리 어장 ---
  {
    id: 'vessel-outer-01',
    mmsi: '440899801',
    shipName: '대화퇴오징어1호',
    vesselType: '어선(채낚기)',
    tonnage: 98.0,
    callSign: 'DH8998',
    registrationNo: '강원속초-2019-112',
    captainName: '홍만석 선장',
    safePhoneNumber: '0504-8998-1001',
    lat: 39.4500,
    lng: 134.8000,
    speedKnots: 2.8,
    headingDeg: 70,
    status: 'FISHING',
    statusMessage: '동해 대화퇴 어장 중심부 야간 오징어 채낚기 조업',
    satelliteSignal: 'GOOD'
  },
  {
    id: 'vessel-outer-02',
    mmsi: '440899802',
    shipName: '동해원양선망호',
    vesselType: '근해자망',
    tonnage: 140.0,
    callSign: 'DH8999',
    registrationNo: '부산서구-2018-095',
    captainName: '강태영 선장',
    safePhoneNumber: '0504-8999-2002',
    lat: 39.1000,
    lng: 133.8500,
    speedKnots: 7.2,
    headingDeg: 130,
    status: 'NORMAL',
    statusMessage: '대화퇴 남서방 한일어업협정선 경계 해역 순항',
    satelliteSignal: 'GOOD'
  },
  {
    id: 'vessel-outer-03',
    mmsi: '440899803',
    shipName: '무궁화33호',
    vesselType: '어업지도선',
    tonnage: 1500.0,
    callSign: 'MK3301',
    registrationNo: '해수부-동해-033',
    captainName: '서진택 선장',
    safePhoneNumber: '0504-3301-3003',
    lat: 38.8000,
    lng: 133.2000,
    speedKnots: 13.5,
    headingDeg: 210,
    status: 'NORMAL',
    statusMessage: '동해 원거리 외해 한국 어선 안전조업 호위 및 지도',
    satelliteSignal: 'EXCELLENT'
  },
  {
    id: 'vessel-outer-04',
    mmsi: '440899804',
    shipName: '독도태평양호',
    vesselType: '연안통발',
    tonnage: 68.0,
    callSign: 'DK8998',
    registrationNo: '경북포항-2020-142',
    captainName: '안병권 선장',
    safePhoneNumber: '0504-8998-4004',
    lat: 37.3800,
    lng: 132.8000,
    speedKnots: 3.6,
    headingDeg: 95,
    status: 'FISHING',
    statusMessage: '독도 동남방 45해리 심해 붉은대게 통발 양망 중',
    satelliteSignal: 'GOOD'
  },
  {
    id: 'vessel-outer-05',
    mmsi: '440500307',
    shipName: '해경3007함 (태평양7호)',
    vesselType: '해경 경비정',
    tonnage: 3000.0,
    callSign: 'CG3007',
    registrationNo: '해경-동해-3007',
    captainName: '남궁철 함장',
    safePhoneNumber: '0504-3007-5005',
    lat: 37.1500,
    lng: 132.3500,
    speedKnots: 16.0,
    headingDeg: 350,
    status: 'NORMAL',
    statusMessage: '동해 EEZ 광역 해상주권 수호 및 해난구조 순찰',
    satelliteSignal: 'EXCELLENT'
  },
  {
    id: 'vessel-outer-06',
    mmsi: '440899806',
    shipName: '울릉심해호',
    vesselType: '어선(채낚기)',
    tonnage: 48.0,
    callSign: 'UL8998',
    registrationNo: '경북울릉-2021-049',
    captainName: '정해룡 선장',
    safePhoneNumber: '0504-8998-6006',
    lat: 38.1500,
    lng: 131.5000,
    speedKnots: 4.5,
    headingDeg: 140,
    status: 'NORMAL',
    statusMessage: '울릉도 북동방 35해리 외해 이동 중',
    satelliteSignal: 'GOOD'
  },
  {
    id: 'vessel-outer-07',
    mmsi: '440899807',
    shipName: '강릉원해트라울호',
    vesselType: '상선/화물선',
    tonnage: 85.0,
    callSign: 'GL8998',
    registrationNo: '강원강릉-2020-038',
    captainName: '배성민 선장',
    safePhoneNumber: '0504-8998-7007',
    lat: 37.6000,
    lng: 130.4000,
    speedKnots: 10.2,
    headingDeg: 280,
    status: 'NORMAL',
    statusMessage: '강릉 동방 60해리 원해 항로 통항',
    satelliteSignal: 'GOOD'
  },
  {
    id: 'vessel-outer-08',
    mmsi: '440899808',
    shipName: '후포외해대게호',
    vesselType: '근해자망',
    tonnage: 42.0,
    callSign: 'HP8998',
    registrationNo: '경북울진-2021-094',
    captainName: '송준기 선장',
    safePhoneNumber: '0504-8998-8008',
    lat: 36.7000,
    lng: 130.6000,
    speedKnots: 3.4,
    headingDeg: 45,
    status: 'FISHING',
    statusMessage: '후포 동방 55해리 심해 붉은대게 자망 투망 중',
    satelliteSignal: 'EXCELLENT'
  },

  // --- 남해 먼바다 & 이어도 해양과학기지 & 한일 EEZ 외해 ---
  {
    id: 'vessel-outer-09',
    mmsi: '440999801',
    shipName: '이어도수호호',
    vesselType: '연안복합',
    tonnage: 85.0,
    callSign: 'ID9998',
    registrationNo: '제주서귀포-2020-210',
    captainName: '고만식 선장',
    safePhoneNumber: '0504-9998-1009',
    lat: 32.1200,
    lng: 125.1800,
    speedKnots: 3.1,
    headingDeg: 220,
    status: 'FISHING',
    statusMessage: '이어도 해양과학기지 남서방 15해리 갈치 연승 조업',
    satelliteSignal: 'GOOD'
  },
  {
    id: 'vessel-outer-10',
    mmsi: '440999802',
    shipName: '제주원해선망호',
    vesselType: '근해안강망',
    tonnage: 135.0,
    callSign: 'JW9998',
    registrationNo: '부산남구-2019-122',
    captainName: '임동규 선장',
    safePhoneNumber: '0504-9998-2010',
    lat: 32.4000,
    lng: 126.8000,
    speedKnots: 8.4,
    headingDeg: 105,
    status: 'NORMAL',
    statusMessage: '제주 남방 85해리 고등어 어군 탐지 및 선망 조업단',
    satelliteSignal: 'EXCELLENT'
  },
  {
    id: 'vessel-outer-11',
    mmsi: '440500312',
    shipName: '남해해경3012함 (주작호)',
    vesselType: '해경 경비정',
    tonnage: 3000.0,
    callSign: 'CG3012',
    registrationNo: '해경-제주-3012',
    captainName: '황의진 함장',
    safePhoneNumber: '0504-3012-3011',
    lat: 32.3000,
    lng: 126.1000,
    speedKnots: 15.0,
    headingDeg: 80,
    status: 'NORMAL',
    statusMessage: '남해 최남단 EEZ 광역 해상경비 및 응급구조 대기',
    satelliteSignal: 'EXCELLENT'
  },
  {
    id: 'vessel-outer-12',
    mmsi: '440999804',
    shipName: '탐라외해트롤호',
    vesselType: '상선/화물선',
    tonnage: 95.0,
    callSign: 'TM9998',
    registrationNo: '제주제주-2021-180',
    captainName: '문성규 선장',
    safePhoneNumber: '0504-9998-4012',
    lat: 32.8000,
    lng: 127.5000,
    speedKnots: 4.8,
    headingDeg: 160,
    status: 'FISHING',
    statusMessage: '한일 중간수역 남방 갈치·삼치 트롤 조업',
    satelliteSignal: 'GOOD'
  },
  {
    id: 'vessel-outer-13',
    mmsi: '440999805',
    shipName: '무궁화28호',
    vesselType: '어업지도선',
    tonnage: 1200.0,
    callSign: 'MK2801',
    registrationNo: '해수부-남해-028',
    captainName: '이창민 선장',
    safePhoneNumber: '0504-2801-5013',
    lat: 32.9500,
    lng: 126.3000,
    speedKnots: 11.8,
    headingDeg: 290,
    status: 'NORMAL',
    statusMessage: '제주 남방 먼바다 조업지도선 안전항해 지원',
    satelliteSignal: 'EXCELLENT'
  },
  {
    id: 'vessel-outer-14',
    mmsi: '440999806',
    shipName: '거문도먼바다호',
    vesselType: '근해안강망',
    tonnage: 48.0,
    callSign: 'GM9998',
    registrationNo: '전남여수-2020-199',
    captainName: '백승호 선장',
    safePhoneNumber: '0504-9998-6014',
    lat: 33.3500,
    lng: 127.1000,
    speedKnots: 4.2,
    headingDeg: 125,
    status: 'NORMAL',
    statusMessage: '거문도 남방 50해리 외해 이동 항해',
    satelliteSignal: 'GOOD'
  },
  {
    id: 'vessel-outer-15',
    mmsi: '440999807',
    shipName: '대한해협원해호',
    vesselType: '상선/화물선',
    tonnage: 2500.0,
    callSign: 'DH9998',
    registrationNo: '부산중구-2017-043',
    captainName: '오세훈 선장',
    safePhoneNumber: '0504-9998-7015',
    lat: 34.3000,
    lng: 129.6000,
    speedKnots: 14.5,
    headingDeg: 60,
    status: 'NORMAL',
    statusMessage: '대한해협 원해 대마도 동측 국제항로 순항',
    satelliteSignal: 'EXCELLENT'
  },
  {
    id: 'vessel-outer-16',
    mmsi: '440999808',
    shipName: '백도남동먼바다호',
    vesselType: '연안통발',
    tonnage: 38.0,
    callSign: 'BD9998',
    registrationNo: '전남고흥-2021-088',
    captainName: '구인회 선장',
    safePhoneNumber: '0504-9998-8016',
    lat: 33.8000,
    lng: 128.3000,
    speedKnots: 3.7,
    headingDeg: 190,
    status: 'FISHING',
    statusMessage: '백도 남동방 40해리 심해 붕장어 통발 양망 중',
    satelliteSignal: 'EXCELLENT'
  },
  {
    id: 'vessel-outer-17',
    mmsi: '440999809',
    shipName: '완도원해청산호',
    vesselType: '근해자망',
    tonnage: 44.0,
    callSign: 'WD9998',
    registrationNo: '전남완도-2022-091',
    captainName: '차원석 선장',
    safePhoneNumber: '0504-9998-9017',
    lat: 33.7000,
    lng: 126.8500,
    speedKnots: 5.1,
    headingDeg: 340,
    status: 'NORMAL',
    statusMessage: '청산도 남방 40해리 민어·삼치 원해 조업지 복귀',
    satelliteSignal: 'GOOD'
  },

  // --- 서해 먼바다 & 격렬비열도 서방 & 한중잠정조치수역 부근 & 가거도·백령도 외해 ---
  {
    id: 'vessel-outer-18',
    mmsi: '440699801',
    shipName: '격렬비서방호',
    vesselType: '근해안강망',
    tonnage: 65.0,
    callSign: 'GR9998',
    registrationNo: '충남태안-2020-115',
    captainName: '하재성 선장',
    safePhoneNumber: '0504-6998-1018',
    lat: 36.6500,
    lng: 124.8500,
    speedKnots: 4.0,
    headingDeg: 215,
    status: 'FISHING',
    statusMessage: '격렬비열도 서방 45해리 한중잠정조치수역 인근 조업',
    satelliteSignal: 'GOOD'
  },
  {
    id: 'vessel-outer-19',
    mmsi: '440500306',
    shipName: '태안해경3006함',
    vesselType: '해경 경비정',
    tonnage: 3000.0,
    callSign: 'CG3006',
    registrationNo: '해경-태안-3006',
    captainName: '전우진 함장',
    safePhoneNumber: '0504-3006-2019',
    lat: 36.4500,
    lng: 124.3500,
    speedKnots: 16.5,
    headingDeg: 175,
    status: 'NORMAL',
    statusMessage: '서해 중부 EEZ 광역 경비 및 불법조업 차단 작전',
    satelliteSignal: 'EXCELLENT'
  },
  {
    id: 'vessel-outer-20',
    mmsi: '440699803',
    shipName: '서해원해지도선5호',
    vesselType: '어업지도선',
    tonnage: 1000.0,
    callSign: 'SH9998',
    registrationNo: '해수부-서해-005',
    captainName: '조성배 선장',
    safePhoneNumber: '0504-6998-3020',
    lat: 35.8000,
    lng: 124.5000,
    speedKnots: 12.0,
    headingDeg: 310,
    status: 'NORMAL',
    statusMessage: '서해 원거리 잠정조치수역 한국 어선 보호 순찰',
    satelliteSignal: 'EXCELLENT'
  },
  {
    id: 'vessel-outer-21',
    mmsi: '440699804',
    shipName: '어청도먼바다호',
    vesselType: '근해자망',
    tonnage: 52.0,
    callSign: 'AC9998',
    registrationNo: '전북군산-2021-140',
    captainName: '안기철 선장',
    safePhoneNumber: '0504-6998-4021',
    lat: 36.0000,
    lng: 124.7500,
    speedKnots: 3.5,
    headingDeg: 75,
    status: 'FISHING',
    statusMessage: '어청도 서방 70해리 꽃게·조기 원해 어장 작업',
    satelliteSignal: 'GOOD'
  },
  {
    id: 'vessel-outer-22',
    mmsi: '440699805',
    shipName: '가거도서남방호',
    vesselType: '연안통발',
    tonnage: 78.0,
    callSign: 'GG9998',
    registrationNo: '전남신안-2020-202',
    captainName: '권용수 선장',
    safePhoneNumber: '0504-6998-5022',
    lat: 33.8000,
    lng: 124.4500,
    speedKnots: 4.6,
    headingDeg: 145,
    status: 'NORMAL',
    statusMessage: '최서남단 가거도 서남방 35해리 외해 심해 어장',
    satelliteSignal: 'GOOD'
  },
  {
    id: 'vessel-outer-23',
    mmsi: '440699806',
    shipName: '흑산원해홍어호',
    vesselType: '연안복합',
    tonnage: 45.0,
    callSign: 'HS9998',
    registrationNo: '전남신안-2021-177',
    captainName: '장기환 선장',
    safePhoneNumber: '0504-6998-6023',
    lat: 34.4000,
    lng: 124.2500,
    speedKnots: 3.2,
    headingDeg: 260,
    status: 'FISHING',
    statusMessage: '흑산도 서방 60해리 홍어 원거리 주어장 주낙 조업',
    satelliteSignal: 'GOOD'
  },
  {
    id: 'vessel-outer-24',
    mmsi: '440699807',
    shipName: '백령서방외해호',
    vesselType: '근해자망',
    tonnage: 58.0,
    callSign: 'BR9998',
    registrationNo: '인천옹진-2020-089',
    captainName: '김태균 선장',
    safePhoneNumber: '0504-6998-7024',
    lat: 37.9500,
    lng: 124.1000,
    speedKnots: 5.4,
    headingDeg: 190,
    status: 'NORMAL',
    statusMessage: '백령도 서방 서해 특정해역 외해 안전 조업 준수',
    satelliteSignal: 'GOOD'
  },
  {
    id: 'vessel-outer-25',
    mmsi: '440699808',
    shipName: '홍도외해바다호',
    vesselType: '어선(채낚기)',
    tonnage: 62.0,
    callSign: 'HD9998',
    registrationNo: '전남목포-2021-133',
    captainName: '유호정 선장',
    safePhoneNumber: '0504-6998-8025',
    lat: 34.5500,
    lng: 124.6000,
    speedKnots: 4.1,
    headingDeg: 110,
    status: 'NORMAL',
    statusMessage: '홍도 서남방 40해리 원해 갈치 어장 통항',
    satelliteSignal: 'FAIR'
  },
  {
    id: 'vessel-outer-26',
    mmsi: '440699809',
    shipName: '목포원해안강망호',
    vesselType: '근해안강망',
    tonnage: 75.0,
    callSign: 'MP9998',
    registrationNo: '전남목포-2020-165',
    captainName: '신만복 선장',
    safePhoneNumber: '0504-6998-9026',
    lat: 34.1500,
    lng: 124.9000,
    speedKnots: 3.8,
    headingDeg: 80,
    status: 'FISHING',
    statusMessage: '흑산군도 남서방 45해리 안강망 투망 조업 중',
    satelliteSignal: 'GOOD'
  }
];

// Automatically populate exact distanceNM, bearingDeg, isSubscriber, and isRestrictedOperation
export const initialVessels: MaritimeVessel[] = rawVessels.map((v, idx) => {
  const isSos = v.status === 'SOS';
  // Non-subscribers (회색): 약 20%의 일반 AIS 연안 선박/화물선/미등록 선박
  const isNonSub = !v.isOwnShip && !isSos && (
    v.vesselType === '상선/화물선' ||
    ['vessel-south-02', 'vessel-south-09', 'vessel-south-14', 'vessel-west-08', 'vessel-west-13', 'vessel-east-04', 'vessel-east-09', 'vessel-jeju-03', 'vessel-outer-03', 'vessel-outer-07', 'vessel-outer-11'].includes(v.id) ||
    (idx % 4 === 2 && v.vesselType !== '해경 경비정' && v.vesselType !== '어업지도선' && v.status !== 'FISHING')
  );

  // User Requirement 3: 조업 선박(보라색)은 육지에 가깝게 표출되는게 맞지 않아. 연근해로 멀리 떨어진 더미 선박을 보라색으로 하자.
  // Restricted fishing vessels (보라색): 연근해로 멀리 떨어진 외해/원해 조업 선박만 보라색(FISHING)으로 지정
  const isRestricted = !isSos && !isNonSub && (
    v.status === 'FISHING' ||
    (v.statusMessage !== undefined && (
      v.statusMessage.includes('양망') || 
      v.statusMessage.includes('투망') || 
      v.statusMessage.includes('원거리 외해') ||
      v.statusMessage.includes('어구 전개') ||
      v.statusMessage.includes('접근제한')
    ))
  );

  const isSub = !isNonSub;
  // Ensure every vessel has an active 0504 safe phone number (050 안심전화 지원)
  const fallbackSafeNum = `0504-${v.mmsi.slice(-4)}-${String(idx + 1000).slice(-4)}`;

  const processedV: MaritimeVessel = {
    ...v,
    isSubscriber: isSub,
    safePhoneNumber: v.safePhoneNumber || fallbackSafeNum,
    isRestrictedOperation: isRestricted,
    statusMessage: isRestricted
      ? (v.statusMessage || '원거리 외해 어구 전개 조업 중 (어구 훼손방지 및 충돌회피 불가 접근제한)')
      : (isNonSub ? '미가입 선박 (050 안심번호 통화 가능 · 문자/채팅 불가)' : v.statusMessage)
  };

  if (v.isOwnShip) {
    return { ...processedV, distanceNM: 0.0, bearingDeg: 0, isSubscriber: true };
  }
  return {
    ...processedV,
    distanceNM: calcDistanceNM(ownLat, ownLng, v.lat, v.lng),
    bearingDeg: calcBearingDeg(ownLat, ownLng, v.lat, v.lng)
  };
});

const initialActiveConnections: ActiveCallConnection[] = [
  {
    id: 'conn-1',
    callerMmsi: '440319201',
    callerName: '남해보물호',
    receiverMmsi: '440618223',
    receiverName: '나로은빛호',
    status: 'CONNECTED',
    startedAt: '17:42:10',
    transcriptPreview: '내일 06시 남해 외해 항로 및 어구 부표 위치 확인 완료',
    aiTag: '항로 협의'
  },
  {
    id: 'conn-2',
    callerMmsi: '440991823',
    callerName: '동양수산호',
    receiverMmsi: '440881920',
    receiverName: '혜오름호',
    status: 'CONNECTED',
    startedAt: '17:40:05',
    transcriptPreview: '청해진호 조난 위치 공유 및 구조선 접근 침로 협조',
    aiTag: '구조 지원'
  }
];

const initialSosEvents: MaritimeSosEvent[] = [
  {
    id: 'SOS-2026-1013-001',
    vessel: initialVessels.find(v => v.id === 'vessel-03') || initialVessels[3],
    timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    accidentType: '기관고장',
    status: 'ACTIVE',
    priority: 'CRITICAL',
    lat: 34.3500,
    lng: 126.7500,
    seaArea: '전남 완도 청산도 남방 3.2해리 해상',
    distanceNM: 52.0,
    bearingDeg: 240,
    surroundingNotifiedCount: 8,
    respondingVessels: [
      { vesselName: '혜오름호', distanceNM: 36.0, etaMinutes: 45, status: '접근 중' },
      { vesselName: '해경122정', distanceNM: 42.0, etaMinutes: 38, status: '출동 중' }
    ],
    dispatchAgency: '해양경찰청 122',
    dispatchedVesselName: '목포해경 경비정 3009함',
    actionLogs: [
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
        action: '원터치 조난 SOS 발신 (기관실 정지 및 표류)',
        actor: '청해진호 (한지혁 선장)'
      },
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 7).toISOString(),
        action: '인근 50km 이내 10척 선박 및 해경 122 동시 전파 완료',
        actor: 'BlueCall 해상안전망'
      }
    ],
    notes: '선원 5명 전원 구명조끼 착용 완료. 예인줄 준비 요망.'
  }
];

// Our Vessel Crew: 선장 최재현, 승선원 김대건, 김광준, 김윤지 (체온 & 활동 시간 추가)
const initialCrew: CrewMember[] = [
  { id: 'crew-1', name: '최재현', role: '선장', condition: '정상', fatigueScore: 16, heartRateBpm: 72, bodyTemperature: 36.5, activityHours: '당직 4시간 10분', lastHealthCheck: '오늘 06:00', notes: '조타실 통신 당직 업무 수행 중 및 안전 운항 지휘' },
  { id: 'crew-2', name: '김대건', role: '승선원', condition: '정상', fatigueScore: 22, heartRateBpm: 74, bodyTemperature: 36.6, activityHours: '작업 3시간 40분', lastHealthCheck: '오늘 06:00', notes: '갑판 투망 및 양망 어구 정상 점검 완료' },
  { id: 'crew-3', name: '김광준', role: '승선원', condition: '주의', fatigueScore: 58, heartRateBpm: 88, bodyTemperature: 37.1, activityHours: '휴식 1시간 (작업 2시간)', lastHealthCheck: '10분 전', notes: '1시간째 멀미 지속중 (선내 구급약 복용 후 조타실 휴식)' },
  { id: 'crew-4', name: '김윤지', role: '승선원', condition: '주의', fatigueScore: 65, heartRateBpm: 82, bodyTemperature: 36.8, activityHours: '연장 당직 6시간 30분', lastHealthCheck: '20분 전', notes: '야간 조업으로 인한 피로도 누적 (수분 섭취 및 컨디션 집중 관리)' }
];

const initialCalls: MaritimeCall[] = [
  {
    id: 'call-hist-1',
    callerVessel: initialVessels[1], // 새벽별호
    receiverVessel: initialVessels[2], // 목포청운호
    timestamp: '17:42:10',
    durationSeconds: 145,
    safeNumberUsed: '0504-7182-4432',
    transcript: [
      '[새벽별호] "목포청운호 선장님, 내일 오전 6시 목포항 입항 예정이신가요?"',
      '[목포청운호] "네 새벽별호 선장님, 내일 6시 입항해서 3부두에 접안할 예정입니다."',
      '[새벽별호] "확인 감사합니다. 저희는 7시 입항으로 순서 조정하겠습니다."'
    ],
    aiSummary: {
      category: '업무 요청',
      summaryText: '내일 06시 목포항 입항 예정시간 확인 및 3부두 접안 순서 상호 협의 완료',
      actionRequired: '새벽별호 07시 입항으로 VTS 입항신고 시간 조정',
      publicDataRegistered: true,
      registeredToVTS: true
    }
  },
  {
    id: 'call-hist-2',
    callerVessel: initialVessels[5],
    receiverVessel: initialVessels[4],
    timestamp: '17:35:00',
    durationSeconds: 210,
    safeNumberUsed: '0504-8819-2211',
    transcript: [
      '[동양수산호] "혜오름호 선장님, 지금 청해진호 조난 위치 파악되셨나요?"',
      '[혜오름호] "네, 완도 청산도 남방 3.2마일입니다. 저희가 최대 속력으로 접근 중입니다."'
    ],
    aiSummary: {
      category: '긴급 지원',
      summaryText: '청해진호 조난 해역(청산도 남방 3.2NM) 구조 접근 침로 및 지원 상태 공유',
      actionRequired: '혜오름호 45분 후 현장 도착 예정 (VTS 상황실 공유)',
      publicDataRegistered: true,
      registeredToVTS: true
    }
  },
  {
    id: 'call-hist-3',
    callerVessel: initialVessels[3], // 남해보물호
    receiverVessel: {
      id: 'agency-vts-ys',
      mmsi: '004401001',
      shipName: '여수연안VTS 관제센터',
      vesselType: '어업지도선',
      tonnage: 0,
      callSign: 'VTS-YS',
      registrationNo: '관제국-2024-001',
      captainName: '임수진 관제관',
      safePhoneNumber: '0504-0012-0112',
      lat: 34.747,
      lng: 127.75,
      speedKnots: 0,
      headingDeg: 0,
      status: 'NORMAL',
      distanceNM: 2.4,
      isSubscriber: true,
      satelliteSignal: 'EXCELLENT'
    },
    timestamp: '17:18:40',
    durationSeconds: 98,
    safeNumberUsed: '0504-0012-0112',
    transcript: [
      '[여수연안VTS] "남해보물호, 여수 VTS 관제센터입니다. 돌산도 남동방 통항로 접근 중 입항 외항선과 안전거리 1마일 이상 유지하십시오."',
      '[남해보물호] "관제센터 상황실 수신했습니다. 관제관님, 전방 1.5마일 이격하며 우현 15도 변침하여 통항하겠습니다."',
      '[여수연안VTS] "수신 양호. 어구 전개 주의하시고 안전 항해 바랍니다."'
    ],
    aiSummary: {
      category: '안전 주의',
      summaryText: '남해 연안 진입로 레이더 포착 및 외항선 교행 시 1.5마일 이상 안전 이격 계도 완료',
      actionRequired: '남해보물호 우현 15도 변침 및 레이더 연속 모니터링',
      publicDataRegistered: true,
      registeredToVTS: true
    }
  }
];

const initialBotMessages: BlueBotMessage[] = [
  {
    id: 'bot-1',
    sender: 'BLUEBOT',
    text: '안녕하세요! 해양 AI 소통 비서 BlueBot입니다. 바다 위에서 필요한 기상 정보, 안전 조업 규정, 또는 심리 지원이 필요하시면 언제든 말씀해 주세요.',
    timestamp: '오늘 06:00',
    suggestions: [
      '오늘 연안 해역 풍속과 파고 알려줘',
      '인근 선박과 안심번호 통화 방법',
      '나 우울해 (선원 심리상담)',
      'Starlink 위성통신 연결 상태 점검'
    ]
  }
];

const initialVesselChatHistories: VesselChatHistory[] = [
  {
    id: 'chat-vessel-06',
    vesselId: 'vessel-06',
    vesselMmsi: '440552199',
    shipName: '해경122정 (여수)',
    captainName: '강태양 함장',
    vesselType: '해경 경비정',
    callSign: 'CG1220',
    safePhoneNumber: '0504-1220-1122',
    lastMessage: '수신 양호. 피항 완료 시 VTS 또는 본 경비정으로 입항 보고 부탁드립니다. 안전 항해하십시오.',
    lastTimestamp: '14:22',
    unreadCount: 0,
    isOnline: true,
    distanceNM: 2.1,
    messages: [
      {
        id: 'm-cg-1',
        senderId: '440552199',
        senderName: '해경122정 (강태양 함장)',
        text: '플라잉 더치맨호, 현재 여수 남방 해역 순찰 중입니다. 귀 선박 항행 상태 및 승선원 안전 이상 유무 확인 바랍니다.',
        timestamp: '14:10',
        isOwnShip: false
      },
      {
        id: 'm-cg-2',
        senderId: 'OWN',
        senderName: '플라잉 더치맨호 (최재현 선장)',
        text: '해경122정, 플라잉 더치맨 최재현 선장입니다. 현재 5.4노트 정상 순항 중이며, 최재현 선장 외 김대건, 김광준, 김윤지 승선원 4명 전원 건강 상태 양호합니다. 이상 없습니다.',
        timestamp: '14:12',
        isOwnShip: true
      },
      {
        id: 'm-cg-3',
        senderId: '440552199',
        senderName: '해경122정 (강태양 함장)',
        text: '확인되었습니다. 금일 18시 이후 남해 동부 해상에 돌풍 및 파고 2.5m 상승 예보가 있습니다. 조기 입항 또는 안전 해역 피항을 권고합니다.',
        timestamp: '14:15',
        isOwnShip: false
      },
      {
        id: 'm-cg-4',
        senderId: 'OWN',
        senderName: '플라잉 더치맨호 (최재현 선장)',
        text: '기상 정보 감사합니다. 통발 양망 1차 마무리 후 17시 이전 여수 신항 묘박지로 이동하겠습니다.',
        timestamp: '14:18',
        isOwnShip: true
      },
      {
        id: 'm-cg-5',
        senderId: '440552199',
        senderName: '해경122정 (강태양 함장)',
        text: '수신 양호. 피항 완료 시 VTS 또는 본 경비정으로 입항 보고 부탁드립니다. 안전 항해하십시오.',
        timestamp: '14:22',
        isOwnShip: false
      }
    ]
  },
  {
    id: 'chat-vessel-01',
    vesselId: 'vessel-01',
    vesselMmsi: '440291842',
    shipName: '새벽별호',
    captainName: '박도현 선장',
    vesselType: '연안통발',
    callSign: 'DS3341',
    safePhoneNumber: '0504-3341-9810',
    lastMessage: '최 선장님, 그쪽 어장에 통발 부표 3개 확인했습니다. 100m 간격 유지하며 안전하게 작업하겠습니다!',
    lastTimestamp: '13:45',
    unreadCount: 1,
    isOnline: true,
    distanceNM: 1.5,
    messages: [
      {
        id: 'm-sb-1',
        senderId: '440291842',
        senderName: '새벽별호 (박도현 선장)',
        text: '최 선장님, 안녕하세요. 플라잉 더치맨호 지금 3구역 쪽 투망하고 계신가요?',
        timestamp: '13:20',
        isOwnShip: false
      },
      {
        id: 'm-sb-2',
        senderId: 'OWN',
        senderName: '플라잉 더치맨호 (최재현 선장)',
        text: '박 선장님 반갑습니다. 네, 3구역 북동쪽 0.8마일에서 2번 라인 양망 중입니다. 30분 정도 걸립니다.',
        timestamp: '13:22',
        isOwnShip: true
      },
      {
        id: 'm-sb-3',
        senderId: '440291842',
        senderName: '새벽별호 (박도현 선장)',
        text: '아 그렇군요. 저희가 1마일 남쪽에서 진입할 테니 부표 겹치지 않게 거리 두겠습니다.',
        timestamp: '13:25',
        isOwnShip: false
      },
      {
        id: 'm-sb-4',
        senderId: 'OWN',
        senderName: '플라잉 더치맨호 (최재현 선장)',
        text: '배려 감사합니다 박 선장님. 저희 쪽 주황색 부표 3개 확인되실 겁니다.',
        timestamp: '13:30',
        isOwnShip: true
      },
      {
        id: 'm-sb-5',
        senderId: '440291842',
        senderName: '새벽별호 (박도현 선장)',
        text: '최 선장님, 그쪽 어장에 통발 부표 3개 확인했습니다. 100m 간격 유지하며 안전하게 작업하겠습니다!',
        timestamp: '13:45',
        isOwnShip: false
      }
    ]
  },
  {
    id: 'chat-vessel-south-01',
    vesselId: 'vessel-south-01',
    vesselMmsi: '440319201',
    shipName: '남해보물호',
    captainName: '송진우 선장',
    vesselType: '연안복합',
    callSign: 'NH3192',
    safePhoneNumber: '0504-3192-8821',
    lastMessage: '넵 최 선장님, 삼치 어군 괜찮네요! 좌표 34.75, 127.98 부근 찍어드립니다. 내일 오시면 무전 한번 주세요!',
    lastTimestamp: '어제 16:10',
    unreadCount: 0,
    isOnline: true,
    distanceNM: 12.4,
    messages: [
      {
        id: 'm-nh-1',
        senderId: 'OWN',
        senderName: '플라잉 더치맨호 (최재현 선장)',
        text: '송 선장님, 상주은모래비치 외해 쪽 어황 어떠신가요? 수온 변화가 좀 있나요?',
        timestamp: '어제 15:40',
        isOwnShip: true
      },
      {
        id: 'm-nh-2',
        senderId: '440319201',
        senderName: '남해보물호 (송진우 선장)',
        text: '아이고 최 선장님! 오늘 표층 수온이 1.5도 올라서 삼치랑 방어 어군이 꽤 잡힙니다.',
        timestamp: '어제 15:45',
        isOwnShip: false
      },
      {
        id: 'm-nh-3',
        senderId: 'OWN',
        senderName: '플라잉 더치맨호 (최재현 선장)',
        text: '오 그렇습니까? 저희도 내일 아침 물때에 그쪽 라인 한번 돌아보려 했습니다.',
        timestamp: '어제 15:52',
        isOwnShip: true
      },
      {
        id: 'm-nh-4',
        senderId: '440319201',
        senderName: '남해보물호 (송진우 선장)',
        text: '넵 최 선장님, 삼치 어군 괜찮네요! 좌표 34.75, 127.98 부근 찍어드립니다. 내일 오시면 무전 한번 주세요!',
        timestamp: '어제 16:10',
        isOwnShip: false
      }
    ]
  },
  {
    id: 'chat-vessel-vts',
    vesselId: 'vessel-vts',
    vesselMmsi: '004401001',
    shipName: '여수연안VTS (관제센터)',
    captainName: '임수진 관제사',
    vesselType: '해상교통관제',
    callSign: 'VTS-YS',
    safePhoneNumber: '0504-0012-0112',
    lastMessage: '플라잉 더치맨호, 전방 1.5마일에 입항 외항선 통항 중입니다. 안전거리 유지하시기 바랍니다.',
    lastTimestamp: '어제 11:20',
    unreadCount: 0,
    isOnline: true,
    distanceNM: 3.8,
    messages: [
      {
        id: 'm-vts-1',
        senderId: '004401001',
        senderName: '여수연안VTS (임수진 관제사)',
        text: '플라잉 더치맨호, 여수 VTS 관제센터입니다. 현재 돌산도 동방 통항로 접근 중이십니까?',
        timestamp: '어제 10:45',
        isOwnShip: false
      },
      {
        id: 'm-vts-2',
        senderId: 'OWN',
        senderName: '플라잉 더치맨호 (최재현 선장)',
        text: '여수 VTS, 플라잉 더치맨 최재현 선장입니다. 현재 침로 085도 속력 5.4노트로 진입 중입니다.',
        timestamp: '어제 10:48',
        isOwnShip: true
      },
      {
        id: 'm-vts-3',
        senderId: '004401001',
        senderName: '여수연안VTS (임수진 관제사)',
        text: '플라잉 더치맨호, 전방 1.5마일에 입항 외항선 통항 중입니다. 안전거리 유지하시기 바랍니다.',
        timestamp: '어제 11:20',
        isOwnShip: false
      }
    ]
  },
  {
    id: 'chat-vessel-05',
    vesselId: 'vessel-05',
    vesselMmsi: '440381920',
    shipName: '혜오름호',
    captainName: '정해진 선장',
    vesselType: '근해자망',
    callSign: 'DS5501',
    safePhoneNumber: '0504-5501-4432',
    lastMessage: '네 좋습니다! 플라잉 더치맨호도 만선하시길 기원합니다, 최 선장님!',
    lastTimestamp: '10월 10일',
    unreadCount: 0,
    isOnline: false,
    distanceNM: 4.5,
    messages: [
      {
        id: 'm-ho-1',
        senderId: '440381920',
        senderName: '혜오름호 (정해진 선장)',
        text: '최재현 선장님, 이번 주말 통영 수협 위판장 시세 혹시 알아보셨습니까?',
        timestamp: '10월 10일 16:30',
        isOwnShip: false
      },
      {
        id: 'm-ho-2',
        senderId: 'OWN',
        senderName: '플라잉 더치맨호 (최재현 선장)',
        text: '네 정 선장님, 꽃게랑 갈치가 지난주보다 kg당 2천원 정도 올랐습니다. 물량이 적어서 좋네요.',
        timestamp: '10월 10일 16:35',
        isOwnShip: true
      },
      {
        id: 'm-ho-3',
        senderId: '440381920',
        senderName: '혜오름호 (정해진 선장)',
        text: '좋은 소식이네요! 저희도 이번 조업 마치고 금요일 오전에 입항할 예정입니다.',
        timestamp: '10월 10일 16:40',
        isOwnShip: false
      },
      {
        id: 'm-ho-4',
        senderId: 'OWN',
        senderName: '플라잉 더치맨호 (최재현 선장)',
        text: '그때 항구에서 커피 한잔하시죠. 조업 조심하십시오.',
        timestamp: '10월 10일 16:42',
        isOwnShip: true
      },
      {
        id: 'm-ho-5',
        senderId: '440381920',
        senderName: '혜오름호 (정해진 선장)',
        text: '네 좋습니다! 플라잉 더치맨호도 만선하시길 기원합니다, 최 선장님!',
        timestamp: '10월 10일 16:45',
        isOwnShip: false
      }
    ]
  },
  {
    id: 'chat-vessel-south-03',
    vesselId: 'vessel-south-03',
    vesselMmsi: '440618223',
    shipName: '나로은빛호',
    captainName: '고영훈 선장',
    vesselType: '연안통발',
    callSign: 'NR6182',
    safePhoneNumber: '0504-6182-3390',
    lastMessage: '오후 2시 물돌이 시간 지나면 잠잠해집니다. 통발 닻 튼튼히 내리시면 괜찮습니다.',
    lastTimestamp: '10월 09일',
    unreadCount: 0,
    isOnline: true,
    distanceNM: 24.1,
    messages: [
      {
        id: 'm-nr-1',
        senderId: '440618223',
        senderName: '나로은빛호 (고영훈 선장)',
        text: '최재현 선장님, 나로도 남동 외해 문어 조업 현황 공유드립니다.',
        timestamp: '10월 09일 14:10',
        isOwnShip: false
      },
      {
        id: 'm-nr-2',
        senderId: 'OWN',
        senderName: '플라잉 더치맨호 (최재현 선장)',
        text: '고 선장님 수신했습니다. 그쪽 조류가 좀 세지 않나요?',
        timestamp: '10월 09일 14:15',
        isOwnShip: true
      },
      {
        id: 'm-nr-3',
        senderId: '440618223',
        senderName: '나로은빛호 (고영훈 선장)',
        text: '오후 2시 물돌이 시간 지나면 잠잠해집니다. 통발 닻 튼튼히 내리시면 괜찮습니다.',
        timestamp: '10월 09일 14:20',
        isOwnShip: false
      }
    ]
  }
];

const initialControlCenterChatHistories: VesselChatHistory[] = [
  {
    id: 'chat-vts-cg',
    vesselId: 'vessel-06',
    vesselMmsi: '440552199',
    shipName: '해경122정 (여수)',
    captainName: '강태양 함장',
    vesselType: '해경 경비정',
    callSign: 'CG1220',
    safePhoneNumber: '0504-1220-1122',
    lastMessage: '수신 양호. 남해 동부 연근해 어선 대상 안전 무선 방송 및 피항 안내 실시하겠습니다. 이상.',
    lastTimestamp: '14:22',
    unreadCount: 0,
    isOnline: true,
    distanceNM: 2.1,
    messages: [
      {
        id: 'm-vts-cg-1',
        senderId: '440552199',
        senderName: '해경122정 (강태양 함장)',
        text: '해양수산부 중앙관제센터, 해경122정입니다. 여수 연안 남방 해역 순찰 결과 통항 선박 특이사항 없습니다.',
        timestamp: '14:10',
        isOwnShip: false
      },
      {
        id: 'm-vts-cg-2',
        senderId: 'OWN',
        senderName: '해양수산부 종합상황실',
        text: '해경122정 수신 완료. 금일 18시 이후 남해 동부 해상에 기상 악화(풍랑) 예보가 있으니 인근 조업 선단 피항 계도에 만전을 기해주십시오.',
        timestamp: '14:15',
        isOwnShip: true
      },
      {
        id: 'm-vts-cg-3',
        senderId: '440552199',
        senderName: '해경122정 (강태양 함장)',
        text: '수신 양호. 남해 동부 연근해 어선 대상 안전 무선 방송 및 피항 안내 실시하겠습니다. 이상.',
        timestamp: '14:22',
        isOwnShip: false
      }
    ]
  },
  {
    id: 'chat-vts-sb',
    vesselId: 'vessel-01',
    vesselMmsi: '440291842',
    shipName: '새벽별호',
    captainName: '박도현 선장',
    vesselType: '연안통발',
    callSign: 'DS3341',
    safePhoneNumber: '0504-3341-9810',
    lastMessage: '네, 관제관님. 레이더 및 AIS 감시 철저히 하며 안전 조업하겠습니다!',
    lastTimestamp: '13:45',
    unreadCount: 0,
    isOnline: true,
    distanceNM: 1.5,
    messages: [
      {
        id: 'm-vts-sb-1',
        senderId: '440291842',
        senderName: '새벽별호 (박도현 선장)',
        text: '관제센터 상황실님 안녕하십니까. 새벽별호 현재 3구역 통발 조업 정상 진행 중입니다.',
        timestamp: '13:20',
        isOwnShip: false
      },
      {
        id: 'm-vts-sb-2',
        senderId: 'OWN',
        senderName: '해양수산부 종합상황실',
        text: '새벽별호 수신했습니다. 전방 2마일 상선 통항로와 교차하오니 AIS 주시 및 안전거리 유지 바랍니다.',
        timestamp: '13:30',
        isOwnShip: true
      },
      {
        id: 'm-vts-sb-3',
        senderId: '440291842',
        senderName: '새벽별호 (박도현 선장)',
        text: '네, 관제관님. 레이더 및 AIS 감시 철저히 하며 안전 조업하겠습니다!',
        timestamp: '13:45',
        isOwnShip: false
      }
    ]
  },
  {
    id: 'chat-vts-nh',
    vesselId: 'vessel-south-01',
    vesselMmsi: '440319201',
    shipName: '남해보물호',
    captainName: '송진우 선장',
    vesselType: '연안복합',
    callSign: 'NH3192',
    safePhoneNumber: '0504-3192-8821',
    lastMessage: '네, 관제센터님. 안전 운항 수칙 준수하겠습니다!',
    lastTimestamp: '어제 16:10',
    unreadCount: 0,
    isOnline: true,
    distanceNM: 12.4,
    messages: [
      {
        id: 'm-vts-nh-1',
        senderId: '440319201',
        senderName: '남해보물호 (송진우 선장)',
        text: '관제센터님, 남해보물호 외해 조업 위치 보고드립니다. 34.75, 127.98 해역입니다.',
        timestamp: '어제 15:40',
        isOwnShip: false
      },
      {
        id: 'm-vts-nh-2',
        senderId: 'OWN',
        senderName: '해양수산부 종합상황실',
        text: '남해보물호 위치 보고 정상 접수되었습니다. 수온 변화에 따른 해무 주의하십시오.',
        timestamp: '어제 15:52',
        isOwnShip: true
      },
      {
        id: 'm-vts-nh-3',
        senderId: '440319201',
        senderName: '남해보물호 (송진우 선장)',
        text: '네, 관제센터님. 안전 운항 수칙 준수하겠습니다!',
        timestamp: '어제 16:10',
        isOwnShip: false
      }
    ]
  },
  {
    id: 'chat-vts-ho',
    vesselId: 'vessel-05',
    vesselMmsi: '440381920',
    shipName: '혜오름호',
    captainName: '정해진 선장',
    vesselType: '근해자망',
    callSign: 'DS5501',
    safePhoneNumber: '0504-5501-4432',
    lastMessage: '네, 관제센터 지침 확인하여 현장 대기하겠습니다!',
    lastTimestamp: '10월 10일',
    unreadCount: 0,
    isOnline: false,
    distanceNM: 4.5,
    messages: [
      {
        id: 'm-vts-ho-1',
        senderId: '440381920',
        senderName: '혜오름호 (정해진 선장)',
        text: '해양수산부 관제센터, 혜오름호입니다. 완도 청산도 인근 통항 보고 드립니다.',
        timestamp: '10월 10일 16:30',
        isOwnShip: false
      },
      {
        id: 'm-vts-ho-2',
        senderId: 'OWN',
        senderName: '해양수산부 종합상황실',
        text: '혜오름호 확인되었습니다. 청해진호 긴급 구난 해역 안전 통항 협조 바랍니다.',
        timestamp: '10월 10일 16:35',
        isOwnShip: true
      },
      {
        id: 'm-vts-ho-3',
        senderId: '440381920',
        senderName: '혜오름호 (정해진 선장)',
        text: '네, 관제센터 지침 확인하여 현장 대기하겠습니다!',
        timestamp: '10월 10일 16:45',
        isOwnShip: false
      }
    ]
  },
  {
    id: 'chat-vts-nr',
    vesselId: 'vessel-south-03',
    vesselMmsi: '440618223',
    shipName: '나로은빛호',
    captainName: '고영훈 선장',
    vesselType: '연안통발',
    callSign: 'NR6182',
    safePhoneNumber: '0504-6182-3390',
    lastMessage: '관제센터 상황실 수신 완료. 통항 선박과 안전거리 유지하겠습니다.',
    lastTimestamp: '10월 09일',
    unreadCount: 0,
    isOnline: true,
    distanceNM: 24.1,
    messages: [
      {
        id: 'm-vts-nr-1',
        senderId: '440618223',
        senderName: '나로은빛호 (고영훈 선장)',
        text: '관제센터 상황실, 나로은빛호입니다. 나로도 남동 외해 통발 양망 작업 보고드립니다.',
        timestamp: '10월 09일 14:10',
        isOwnShip: false
      },
      {
        id: 'm-vts-nr-2',
        senderId: 'OWN',
        senderName: '해양수산부 종합상황실',
        text: '나로은빛호 수신했습니다. 오후 조류 변화에 유의하여 닻줄 결박 상태 확인 바랍니다.',
        timestamp: '10월 09일 14:15',
        isOwnShip: true
      },
      {
        id: 'm-vts-nr-3',
        senderId: '440618223',
        senderName: '나로은빛호 (고영훈 선장)',
        text: '관제센터 상황실 수신 완료. 통항 선박과 안전거리 유지하겠습니다.',
        timestamp: '10월 09일 14:20',
        isOwnShip: false
      }
    ]
  }
];

class MaritimeDataService {
  private vessels: MaritimeVessel[] = initialVessels;
  private sosEvents: MaritimeSosEvent[] = initialSosEvents;
  private calls: MaritimeCall[] = initialCalls;
  private crew: CrewMember[] = initialCrew;
  private botMessages: BlueBotMessage[] = initialBotMessages;
  private vesselChatHistories: VesselChatHistory[] = initialVesselChatHistories;
  private controlCenterChatHistories: VesselChatHistory[] = initialControlCenterChatHistories;
  private activeConnections: ActiveCallConnection[] = initialActiveConnections;
  private isSosBannerDismissed: boolean = false;
  private listeners: ((event: string, data: unknown) => void)[] = [];

  constructor() {
    this.loadStorage();
  }

  private loadStorage() {
    try {
      const v = localStorage.getItem('bluecall_maritime_vessels_v11');
      if (v) {
        const parsed = JSON.parse(v);
        if (Array.isArray(parsed) && parsed.length >= initialVessels.length - 2) {
          this.vessels = parsed.filter((ship: MaritimeVessel) => ship.shipName !== '광양항만호' && ship.shipName !== '포항영일호');
        } else {
          this.vessels = initialVessels.filter(ship => ship.shipName !== '광양항만호' && ship.shipName !== '포항영일호');
        }
      } else {
        this.vessels = initialVessels.filter(ship => ship.shipName !== '광양항만호' && ship.shipName !== '포항영일호');
        try { localStorage.setItem('bluecall_maritime_vessels_v11', JSON.stringify(this.vessels)); } catch (_) {}
      }

      // Explicitly ensure 광양항만호 & 포항영일호 never appear in vessels
      this.vessels = this.vessels.filter(ship => ship.shipName !== '광양항만호' && ship.shipName !== '포항영일호');

      const s = localStorage.getItem('bluecall_maritime_sos_v7');
      if (s) this.sosEvents = JSON.parse(s);

      const c = localStorage.getItem('bluecall_maritime_crew_v9');
      if (c) {
        this.crew = JSON.parse(c);
      } else {
        this.crew = initialCrew;
      }
      // Ensure captain & crew roles, notes, temperature and activity hours
      const defaultNotes: Record<string, string> = {
        '최재현': '조타실 통신 당직 업무 수행 중 및 안전 운항 지휘',
        '김대건': '갑판 투망 및 양망 어구 정상 점검 완료',
        '김광준': '1시간째 멀미 지속중 (선내 구급약 복용 후 조타실 휴식)',
        '김윤지': '야간 조업으로 인한 피로도 누적 (수분 섭취 및 컨디션 집중 관리)'
      };
      const defaultTemp: Record<string, number> = {
        '최재현': 36.5,
        '김대건': 36.6,
        '김광준': 37.1,
        '김윤지': 36.8
      };
      const defaultActivity: Record<string, string> = {
        '최재현': '당직 4시간 10분',
        '김대건': '작업 3시간 40분',
        '김광준': '휴식 1시간 (작업 2시간)',
        '김윤지': '연장 당직 6시간 30분'
      };
      this.crew = this.crew.map(m => {
        let role = m.role;
        if (m.name === '최재현') role = '선장';
        if (['김대건', '김광준', '김윤지'].includes(m.name)) role = '승선원';
        const note = m.notes || defaultNotes[m.name] || '컨디션 정상 양호';
        const bodyTemperature = m.bodyTemperature || defaultTemp[m.name] || 36.5;
        const activityHours = m.activityHours || defaultActivity[m.name] || '당직 4시간';
        return { ...m, role, notes: note, bodyTemperature, activityHours };
      });

      const call = localStorage.getItem('bluecall_maritime_calls_v8');
      if (call) this.calls = JSON.parse(call);

      const vch = localStorage.getItem('bluecall_maritime_vessel_chats_v2');
      if (vch) {
        const parsedVch = JSON.parse(vch);
        if (Array.isArray(parsedVch) && parsedVch.length > 0) {
          this.vesselChatHistories = parsedVch;
        } else {
          this.vesselChatHistories = initialVesselChatHistories;
        }
      } else {
        this.vesselChatHistories = initialVesselChatHistories;
      }

      const ccCh = localStorage.getItem('bluecall_maritime_control_chats_v1');
      if (ccCh) {
        const parsedCc = JSON.parse(ccCh);
        if (Array.isArray(parsedCc) && parsedCc.length > 0) {
          this.controlCenterChatHistories = parsedCc;
        }
      }
    } catch {
      // Ignore
    }
  }

  private saveStorage() {
    try {
      localStorage.setItem('bluecall_maritime_vessels_v11', JSON.stringify(this.vessels));
      localStorage.setItem('bluecall_maritime_sos_v7', JSON.stringify(this.sosEvents));
      localStorage.setItem('bluecall_maritime_crew_v8', JSON.stringify(this.crew));
      localStorage.setItem('bluecall_maritime_calls_v8', JSON.stringify(this.calls));
      localStorage.setItem('bluecall_maritime_vessel_chats_v2', JSON.stringify(this.vesselChatHistories));
      localStorage.setItem('bluecall_maritime_control_chats_v1', JSON.stringify(this.controlCenterChatHistories));
    } catch {
      // Ignore
    }
  }

  getVessels(): MaritimeVessel[] {
    return this.vessels;
  }

  getSosEvents(): MaritimeSosEvent[] {
    return this.sosEvents;
  }

  private vesselCrewCache: Map<string, CrewMember[]> = new Map();

  getCrew(): CrewMember[] {
    return this.crew;
  }

  getVesselCrew(vessel: MaritimeVessel | string | null | undefined): CrewMember[] {
    if (!vessel) return [];
    
    const targetVessel: MaritimeVessel | undefined = typeof vessel === 'string'
      ? this.vessels.find(v => v.id === vessel || v.mmsi === vessel)
      : vessel;

    if (!targetVessel) return this.crew;

    // 본선(플라잉 더치맨호)은 고유 본선 승선원 4명 리스트 반환
    if (targetVessel.isOwnShip || targetVessel.mmsi === '440182940' || targetVessel.shipName.includes('플라잉 더치맨')) {
      return this.crew;
    }

    const cacheKey = targetVessel.mmsi || targetVessel.id;
    if (this.vesselCrewCache.has(cacheKey)) {
      return this.vesselCrewCache.get(cacheKey)!;
    }

    // Generate unique crew members for other vessels based on ship type & tonnage
    const isSos = targetVessel.status === 'SOS';
    const isHazard = targetVessel.status === 'HAZARD';
    const isFishing = targetVessel.status === 'FISHING';
    const tonnage = targetVessel.tonnage || 9.77;

    let crewCount = 3;
    if (targetVessel.vesselType === '연안복합' || tonnage < 4) {
      crewCount = 2;
    } else if (targetVessel.vesselType === '연안통발' || (tonnage >= 4 && tonnage < 10)) {
      crewCount = 3 + (Math.abs(parseInt(targetVessel.mmsi.slice(-2), 10) || 0) % 2); // 3 or 4
    } else if (targetVessel.vesselType === '근해자망' || targetVessel.vesselType === '근해안강망' || (tonnage >= 10 && tonnage < 40)) {
      crewCount = 5 + (Math.abs(parseInt(targetVessel.mmsi.slice(-2), 10) || 0) % 3); // 5, 6, 7
    } else if (targetVessel.vesselType === '어업지도선' || targetVessel.vesselType === '해경 경비정') {
      crewCount = 8 + (Math.abs(parseInt(targetVessel.mmsi.slice(-2), 10) || 0) % 4); // 8 ~ 11
    } else {
      crewCount = 4 + (Math.abs(parseInt(targetVessel.mmsi.slice(-2), 10) || 0) % 3);
    }

    const captainClean = targetVessel.captainName 
      ? targetVessel.captainName.replace(' 선장', '') 
      : '김선장';

    const poolKoreanFirstNames = ['박성호', '강동원', '정기선', '임창규', '송민섭', '오태근', '윤석주', '문병호', '서진우', '배준혁', '조태양', '류원석', '황재필', '백동진', '차승헌', '권오현', '유영수', '천민기', '하재용', '신현우', '고재영', '노정훈', '남궁혁'];
    const poolForeignNames = ['딘티엔', '응우옌반', '부이반호앙', '알렉스', '아르만도', '마르코', '트란반'];

    const rolesLadder = [
      '선장',
      '기관장',
      '갑판장',
      '항해사',
      '선원(양망)',
      '선원(어획물선별)',
      '갑판원',
      '조리장',
      '기관사',
      '응급구조담당'
    ];

    const result: CrewMember[] = [];
    const seed = Math.abs(parseInt(targetVessel.mmsi.slice(-4), 10) || 1234);

    for (let i = 0; i < crewCount; i++) {
      const memberId = `crew-${cacheKey}-${i + 1}`;
      let name = '';
      let role = rolesLadder[i] || '선원';

      if (i === 0) {
        name = captainClean;
        role = '선장';
      } else if (i === crewCount - 1 && crewCount >= 4) {
        const fIdx = (seed + i) % poolForeignNames.length;
        name = poolForeignNames[fIdx];
      } else {
        const kIdx = (seed * 3 + i * 7) % poolKoreanFirstNames.length;
        name = poolKoreanFirstNames[kIdx];
      }

      let condition: '정상' | '주의' | '위험' = '정상';
      let fatigueScore = 20 + ((seed + i * 11) % 35);
      let heartRateBpm = 68 + ((seed + i * 5) % 22);
      let notes = '건강 상태 양호';

      if (isSos) {
        if (i === 0) {
          condition = '주의';
          fatigueScore = 78;
          heartRateBpm = 104;
          notes = '비상 상황 지휘 중 심박 상승 및 피로';
        } else if (i === 1) {
          condition = '위험';
          fatigueScore = 92;
          heartRateBpm = 118;
          notes = '기관실 진화 작업 중 2도 경미 화상 및 탈진';
        } else {
          condition = (i % 2 === 0) ? '주의' : '정상';
          fatigueScore = 65 + (i * 5);
          heartRateBpm = 95 + i;
          notes = '구명조끼 착용 및 침착 대기 중';
        }
      } else if (isHazard) {
        if (i === 1) {
          condition = '주의';
          fatigueScore = 68;
          heartRateBpm = 88;
          notes = '높은 파고로 인한 어지럼증 및 멀미 호소';
        }
      } else if (isFishing) {
        if (i === 2 && crewCount >= 3) {
          condition = '주의';
          fatigueScore = 62;
          heartRateBpm = 86;
          notes = '연속 양망 작업 피로 누적';
        }
      }

      const checkHour = 14 + ((seed + i) % 4);
      const checkMin = ((seed * 7 + i * 13) % 60).toString().padStart(2, '0');
      const lastHealthCheck = `오늘 ${checkHour}:${checkMin}`;
      const bodyTemperature = Number((36.4 + ((seed + i * 3) % 8) * 0.1).toFixed(1));
      const activityHours = `당직 ${2 + (i % 5)}시간 ${(seed * 7 + i * 13) % 50}분`;

      result.push({
        id: memberId,
        name,
        role,
        condition,
        fatigueScore,
        heartRateBpm,
        bodyTemperature,
        activityHours,
        lastHealthCheck,
        notes
      });
    }

    this.vesselCrewCache.set(cacheKey, result);
    return result;
  }

  getCalls(): MaritimeCall[] {
    return this.calls;
  }

  getBotMessages(): BlueBotMessage[] {
    return this.botMessages;
  }

  getVesselChatHistories(isControlCenter: boolean = false): VesselChatHistory[] {
    return isControlCenter ? this.controlCenterChatHistories : this.vesselChatHistories;
  }

  getVesselChat(chatId: string, isControlCenter: boolean = false): VesselChatHistory | undefined {
    const list = isControlCenter ? this.controlCenterChatHistories : this.vesselChatHistories;
    let found = list.find(c => c.id === chatId || c.vesselMmsi === chatId || c.vesselId === chatId);
    if (!found && isControlCenter) {
      const vessel = this.vessels.find(v => v.id === chatId || v.mmsi === chatId);
      if (vessel) {
        found = this.createOrGetChatWithVessel(vessel, true);
      }
    }
    return found;
  }

  markChatAsRead(chatId: string, isControlCenter: boolean = false) {
    const list = isControlCenter ? this.controlCenterChatHistories : this.vesselChatHistories;
    const chat = list.find(c => c.id === chatId || c.vesselMmsi === chatId || c.vesselId === chatId);
    if (chat && chat.unreadCount > 0) {
      chat.unreadCount = 0;
      this.saveStorage();
      this.notify('VESSEL_CHAT_UPDATED', chat);
    }
  }

  sendVesselChatMessage(chatId: string, text: string, isControlCenter: boolean = false): VesselChatMessage {
    const list = isControlCenter ? this.controlCenterChatHistories : this.vesselChatHistories;
    let chat = list.find(c => c.id === chatId || c.vesselMmsi === chatId || c.vesselId === chatId);
    
    // If chat doesn't exist, try to find the vessel and create one
    if (!chat) {
      const vessel = this.vessels.find(v => v.id === chatId || v.mmsi === chatId);
      if (vessel) {
        chat = this.createOrGetChatWithVessel(vessel, isControlCenter);
      } else {
        // Fallback default chat
        chat = list[0];
      }
    }

    const timeStr = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    const userMsg: VesselChatMessage = {
      id: `msg-${Date.now()}-own`,
      senderId: 'OWN',
      senderName: isControlCenter ? '해양수산부 종합상황실' : '플라잉 더치맨호 (최재현 선장)',
      text: text.trim(),
      timestamp: timeStr,
      isOwnShip: true
    };

    chat.messages.push(userMsg);
    chat.lastMessage = text.trim();
    chat.lastTimestamp = '방금 전';

    // Move this chat to the top of the history list
    if (isControlCenter) {
      this.controlCenterChatHistories = [chat, ...this.controlCenterChatHistories.filter(c => c.id !== chat!.id)];
    } else {
      this.vesselChatHistories = [chat, ...this.vesselChatHistories.filter(c => c.id !== chat!.id)];
    }
    this.saveStorage();
    this.notify('VESSEL_CHAT_UPDATED', chat);

    // Realistic intelligent AI dialogue from the other ship (User Requirement: 의약품 소지 및 선박 환경 대화)
    const targetChat = chat;
    const matchedVessel = this.vessels.find(v => v.mmsi === targetChat.vesselMmsi || v.id === targetChat.vesselId);
    generateMaritimeChatReply(text, {
      shipName: targetChat.shipName,
      captainName: targetChat.captainName,
      vesselType: targetChat.vesselType,
      mmsi: targetChat.vesselMmsi,
      status: matchedVessel?.status,
      statusMessage: matchedVessel?.statusMessage
    }, isControlCenter).then((aiResult) => {
      setTimeout(() => {
        const replyMsg: VesselChatMessage = {
          id: `msg-${Date.now()}-reply`,
          senderId: targetChat.vesselMmsi,
          senderName: `${targetChat.shipName} (${targetChat.captainName})`,
          text: aiResult.text,
          timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
          isOwnShip: false
        };

        targetChat.messages.push(replyMsg);
        targetChat.lastMessage = aiResult.text;
        targetChat.lastTimestamp = '방금 전';
        this.saveStorage();
        this.notify('VESSEL_CHAT_UPDATED', targetChat);
        audioHelper.playRadioChirp();
      }, 1000);
    }).catch(err => {
      console.warn('AI chat error:', err);
    });

    return userMsg;
  }

  createOrGetChatWithVessel(vessel: MaritimeVessel, isControlCenter: boolean = false): VesselChatHistory {
    const list = isControlCenter ? this.controlCenterChatHistories : this.vesselChatHistories;
    const existing = list.find(c => c.vesselMmsi === vessel.mmsi || c.vesselId === vessel.id);
    if (existing) return existing;

    const isSos = vessel.status === 'SOS' || vessel.mmsi === '440661208';
    const sosDetail = vessel.statusMessage || '주기관 정지로 조타 불능 상태이며 암초 방향 표류 중';

    const defaultMsg = isSos
      ? (isControlCenter
          ? `[긴급 조난] 관제센터 종합상황실, ${vessel.shipName}입니다! 현재 ${sosDetail}입니다. 승선원 안전 확보 중이며 신속한 구조 지원을 요청합니다!`
          : `[긴급 조난] 본선 ${vessel.shipName}입니다! 현재 ${sosDetail} 상태입니다. 인근 선박의 신속한 구조 지원 협조 부탁드립니다!`)
      : (isControlCenter
          ? `관제센터 상황실 수신 양호합니다. 여기는 ${vessel.shipName} (${vessel.callSign}) 선장입니다. 050 안전 관제 통신망 대기 중입니다.`
          : `여기는 ${vessel.shipName} (${vessel.callSign}) 선장입니다. 050 안전 무선 통신망 수신 대기 중입니다.`);

    const newChat: VesselChatHistory = {
      id: `chat-${vessel.id}${isControlCenter ? '-vts' : ''}`,
      vesselId: vessel.id,
      vesselMmsi: vessel.mmsi,
      shipName: vessel.shipName,
      captainName: vessel.captainName,
      vesselType: vessel.vesselType,
      callSign: vessel.callSign,
      safePhoneNumber: vessel.safePhoneNumber,
      lastMessage: defaultMsg,
      lastTimestamp: '방금 전',
      unreadCount: 0,
      isOnline: true,
      distanceNM: vessel.distanceNM,
      messages: [
        {
          id: `m-init-${Date.now()}`,
          senderId: vessel.mmsi,
          senderName: `${vessel.shipName} (${vessel.captainName})`,
          text: defaultMsg,
          timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
          isOwnShip: false
        }
      ]
    };

    if (isControlCenter) {
      this.controlCenterChatHistories = [newChat, ...this.controlCenterChatHistories];
    } else {
      this.vesselChatHistories = [newChat, ...this.vesselChatHistories];
    }
    this.saveStorage();
    this.notify('VESSEL_CHAT_UPDATED', newChat);
    return newChat;
  }

  getActiveConnections(): ActiveCallConnection[] {
    return this.activeConnections;
  }

  getIsSosBannerDismissed(): boolean {
    return this.isSosBannerDismissed;
  }

  dismissSosBanner() {
    this.isSosBannerDismissed = true;
    this.notify('SOS_BANNER_DISMISSED', true);
  }

  // Trigger one-touch SOS 조난 발신
  triggerSos(accidentType: MaritimeSosEvent['accidentType'], notes?: string): MaritimeSosEvent {
    audioHelper.playSOS();
    this.isSosBannerDismissed = false; // Show banner again when new SOS triggered
    const ownShip = this.vessels.find(v => v.isOwnShip) || this.vessels[0];

    const newEvent: MaritimeSosEvent = {
      id: `SOS-2026-1013-${String(Math.floor(Math.random() * 900) + 100)}`,
      vessel: {
        ...ownShip,
        status: 'SOS',
        statusMessage: `긴급 조난 발신 (${accidentType})`
      },
      timestamp: new Date().toISOString(),
      accidentType,
      status: 'ACTIVE',
      priority: 'CRITICAL',
      lat: ownShip.lat,
      lng: ownShip.lng,
      seaArea: '남해 여수 오동도 동남방 1.5해리',
      distanceNM: 0.0,
      bearingDeg: 0,
      surroundingNotifiedCount: 10,
      respondingVessels: [
        { vesselName: '해경122정 (여수)', distanceNM: 1.25, etaMinutes: 4, status: '출동 중' },
        { vesselName: '새벽별호', distanceNM: 1.4, etaMinutes: 7, status: '접근 중' }
      ],
      dispatchAgency: '해양경찰청 122',
      dispatchedVesselName: '여수해경 경비정 122호',
      actionLogs: [
        {
          timestamp: new Date().toISOString(),
          action: `원터치 조난 SOS 발신 (${accidentType})`,
          actor: `${ownShip.shipName} (${ownShip.captainName})`
        },
        {
          timestamp: new Date().toISOString(),
          action: '인근 50km 이내 10척 선박 및 해경 122 실시간 전파',
          actor: 'BlueCall 해상안전망'
        }
      ],
      notes: notes || '원터치 비상 SOS 조난 신호 발신. 인근 선박의 신속한 구조 지원 요청.'
    };

    ownShip.status = 'SOS';
    ownShip.statusMessage = `조난 상황 (${accidentType})`;

    this.sosEvents = [newEvent, ...this.sosEvents];
    this.saveStorage();
    this.notify('SOS_TRIGGERED', newEvent);
    return newEvent;
  }

  resolveSos(id: string) {
    const target = this.sosEvents.find(e => e.id === id);
    if (target) {
      target.status = 'RESOLVED';
      this.isSosBannerDismissed = true;
      const own = this.vessels.find(v => v.isOwnShip);
      if (own && own.status === 'SOS') {
        own.status = 'NORMAL';
        own.statusMessage = '안전 운항 중';
      }
      this.saveStorage();
      this.notify('SOS_RESOLVED', target);
    }
  }

  // Update SOS distress type during active SOS broadcast (User Requirement 7: 기관고장, 침몰, 폭발, 화재 등 조난 상태 설정)
  updateSosAccidentType(id: string, newType: MaritimeAccidentType, customNotes?: string) {
    const target = this.sosEvents.find(e => e.id === id);
    if (target) {
      target.accidentType = newType;
      if (customNotes) target.notes = customNotes;
      target.actionLogs.push({
        timestamp: new Date().toISOString(),
        action: `선박 조난 상태 변경 설정: [${newType}]`,
        actor: '본선 비상 지휘통제'
      });
      const own = this.vessels.find(v => v.isOwnShip);
      if (own) {
        own.status = 'SOS';
        own.statusMessage = `조난 상황 (${newType})`;
      }
      this.saveStorage();
      this.notify('SOS_UPDATED', target);
      audioHelper.playRadioChirp();
    }
  }

  // Add / Connect live call
  startCallConnection(callerMmsi: string, callerName: string, receiverMmsi: string, receiverName: string) {
    const newConn: ActiveCallConnection = {
      id: `conn-${Date.now()}`,
      callerMmsi,
      callerName,
      receiverMmsi,
      receiverName,
      status: 'CONNECTING',
      startedAt: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    this.activeConnections.push(newConn);
    this.notify('CONNECTIONS_UPDATED', this.activeConnections);

    // After 2 seconds, switch to CONNECTED (green solid line)
    setTimeout(() => {
      newConn.status = 'CONNECTED';
      this.notify('CONNECTIONS_UPDATED', this.activeConnections);
    }, 2000);

    return newConn;
  }

  // 1:1 Call checks (실선으로 연결된 모든 선박/기관은 1:1 통신 중으로 간주되어 신규 전화 불가)
  isVesselInCall(mmsiOrId: string, vesselId?: string, shipName?: string): boolean {
    return this.activeConnections.some(
      c => c.callerMmsi === mmsiOrId || 
           c.receiverMmsi === mmsiOrId ||
           (vesselId && (c.callerMmsi === vesselId || c.receiverMmsi === vesselId)) ||
           (shipName && (c.callerName.includes(shipName) || c.receiverName.includes(shipName)))
    );
  }

  isOwnShipInCall(): boolean {
    const ownMmsi = '440182940';
    return this.activeConnections.some(
      c => c.callerMmsi === ownMmsi || c.receiverMmsi === ownMmsi
    );
  }

  getOwnShipCallConnection(): ActiveCallConnection | undefined {
    const ownMmsi = '440182940';
    return this.activeConnections.find(
      c => c.callerMmsi === ownMmsi || c.receiverMmsi === ownMmsi
    );
  }

  endOwnShipCall() {
    this.endCallByMmsi('440182940');
  }

  // Blacklist & Report (User Requirement 4: 특정 선박을 신고하거나 블랙 리스트에 넣는 기능)
  toggleBlacklist(vesselIdOrMmsi: string, reason: string = '위험/불법 행위 의심'): boolean {
    const target = this.vessels.find(v => v.id === vesselIdOrMmsi || v.mmsi === vesselIdOrMmsi);
    if (!target) return false;

    target.isBlacklisted = !target.isBlacklisted;
    if (target.isBlacklisted) {
      target.blacklistedReason = reason;
      target.statusMessage = `[차단/블랙리스트] ${reason} (호출 제한)`;
    } else {
      target.blacklistedReason = undefined;
      target.statusMessage = '정상 운항 중';
    }

    this.saveStorage();
    this.notify('VESSELS_UPDATED', this.vessels);
    this.notify('VESSEL_BLACKLIST_CHANGED', target);
    return !!target.isBlacklisted;
  }

  reportVessel(vesselIdOrMmsi: string, reason: string, details?: string): boolean {
    const target = this.vessels.find(v => v.id === vesselIdOrMmsi || v.mmsi === vesselIdOrMmsi);
    if (!target) return false;

    if (!target.reports) target.reports = [];
    const reportItem = {
      id: `rep-${Date.now()}`,
      reason,
      details: details || '현장 안전 위반 접수',
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      reporter: '플라잉 더치맨호 (최재현 선장)'
    };
    target.reports.unshift(reportItem);
    target.reportCount = target.reports.length;

    // Auto flag blacklist if multiple reports
    if (target.reportCount >= 2 && !target.isBlacklisted) {
      target.isBlacklisted = true;
      target.blacklistedReason = `누적 위험 신고 ${target.reportCount}건 접수: ${reason}`;
    }

    this.saveStorage();
    this.notify('VESSELS_UPDATED', this.vessels);
    this.notify('VESSEL_REPORTED', { vessel: target, report: reportItem });
    return true;
  }

  endCallConnection(id: string) {
    this.activeConnections = this.activeConnections.filter(c => c.id !== id);
    this.notify('CONNECTIONS_UPDATED', this.activeConnections);
  }

  endCallByMmsi(mmsi: string) {
    this.activeConnections = this.activeConnections.filter(c => c.callerMmsi !== mmsi && c.receiverMmsi !== mmsi);
    this.notify('CONNECTIONS_UPDATED', this.activeConnections);
  }

  addCompletedCall(call: MaritimeCall) {
    this.calls = [call, ...this.calls];
    this.saveStorage();
    this.notify('CALL_COMPLETED', call);
  }

  sendBotMessage(userText: string): BlueBotMessage {
    const userMsg: BlueBotMessage = {
      id: `msg-${Date.now()}-user`,
      sender: 'USER',
      text: userText,
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    };

    this.botMessages.push(userMsg);
    this.notify('BOT_MESSAGE', userMsg);

    // Check psychological distress / mental recovery
    if (userText.includes('우울') || userText.includes('힘들') || userText.includes('답답')) {
      const targetCrew = this.crew.find(c => c.name === '나아파') || this.crew[4];
      if (targetCrew) {
        targetCrew.condition = '위험';
        targetCrew.fatigueScore = 88;
        targetCrew.notes = '정신건강 위기 확인: 선내 우울감 및 고립 호소';
        this.saveStorage();
        this.notify('CREW_ALERT', targetCrew);
      }
    } else if (userText.includes('안전') || userText.includes('괜찮')) {
      const targetCrew = this.crew.find(c => c.name === '나아파') || this.crew[4];
      if (targetCrew) {
        targetCrew.condition = '정상';
        targetCrew.fatigueScore = 35;
        targetCrew.notes = '심리 안정 회복됨';
        this.saveStorage();
        this.notify('CREW_ALERT', targetCrew);
      }
    }

    // Call intelligent BlueBot AI Engine (Gemini 3.8 Flash + Deep Maritime Knowledge + Domain Filter)
    (async () => {
      try {
        const aiResponse = await getBlueBotAiReply(userText);
        const botReply: BlueBotMessage = {
          id: `msg-${Date.now()}-bot`,
          sender: 'BLUEBOT',
          text: aiResponse.text,
          timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
          category: aiResponse.category as BlueBotMessage['category'],
          suggestions: aiResponse.suggestions
        };
        this.botMessages.push(botReply);
        this.notify('BOT_MESSAGE', botReply);
      } catch (err) {
        console.error('Error generating BlueBot response:', err);
      }
    })();

    return userMsg;
  }

  // 선장님의 판단(정상, 주의, 위험) 설정: 선원이 직접 입력한 프로필 메시지(notes)는 보존됨
  updateCrewCondition(crewId: string, condition: '정상' | '주의' | '위험', optionalNotes?: string) {
    const member = this.crew.find(c => c.id === crewId);
    if (member) {
      member.condition = condition;
      if (optionalNotes) {
        member.notes = optionalNotes;
      }
      member.lastHealthCheck = '방금 전';
      this.saveStorage();
      this.notify('CREW_UPDATED', member);
    }
  }

  // 선원 본인이 입력하는 상태 메시지 / 프로필 업데이트
  updateCrewNote(crewId: string, note: string) {
    const member = this.crew.find(c => c.id === crewId);
    if (member) {
      member.notes = note.trim();
      this.saveStorage();
      this.notify('CREW_UPDATED', member);
    }
  }

  subscribe(fn: (event: string, data: unknown) => void) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  private notify(event: string, data: unknown) {
    this.listeners.forEach(fn => fn(event, data));
  }
}

export const maritimeService = new MaritimeDataService();
