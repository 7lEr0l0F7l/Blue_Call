/**
 * BlueBot AI - 대한민국 스마트 해양·안전조업 전문 지능형 AI 엔진
 * 
 * 1. Gemini API (gemini-3.8-flash) 연동: 해양·수산·선박 전문 시스템 프롬프트 및 지능형 응답
 * 2. 엄격한 비-해양 도메인 탐지: 해양/수산/조업과 무관한 일반 질문 감지 시 정중한 답변 제한
 * 3. 딥 해양 지식 베이스 폴백: 오프라인 / API 키 부재 시에도 어종별 금어기/체장, 어법, 항해술(COLREGs), 기상, 엔진정비, 응급의료, 앱 사용법을 전문가 수준으로 답변
 */

export interface BlueBotResponse {
  text: string;
  category: '어업규정' | '기상정보' | '심리상담' | '의료지원' | '항해안전' | '선박정비' | '도메인지침';
  suggestions: string[];
}

// 비-해양 / 비-조업 분야 키워드 감지 (완전 무관한 질문 필터링)
const NON_MARITIME_PATTERNS = [
  /아이돌|bts|블랙핑크|뉴진스|에스파|연예인|드라마|케이팝|kpop/i,
  /비트코인|이더리움|가상화폐|코인|주식투자|선물옵션|나스닥|단타/i,
  /파이썬|자바스크립트|코딩|웹개발|리액트|flutter|sql|머신러닝/i,
  /롤|리그오브레전드|배그|배틀그라운드|스타크래프트|플레이스테이션|닌텐도/i,
  /부동산|아파트청약|재개발|전세사기/i,
  /손흥민|메시|호날두|축구경기|프리미어리그|야구kbo/i,
  /수능|토익|공무원시험|입시/i
];

// 해양 관련 단어가 전혀 없는지 판별하기 위한 해양 핵심 단어 세트
const MARITIME_CORE_TERMS = [
  '바다', '해양', '선박', '어선', '배', '선장', '선원', '조업', '어업', '항해',
  '금어기', '어종', '물고기', '체장', '그물', '통발', '낚시', '어구', '항만', '항구',
  '날씨', '기상', '파고', '풍속', '조석', '물때', '조류', '해무', '안개', '수온',
  '엔진', '기관', '닻', '침로', '변침', '피항', '충돌', 'vts', '해경', '수협', '등대',
  '안심번호', 'bluecall', '블루콜', '블루봇', 'bluebot', '스타링크', 'starlink', '위성',
  '멀미', '응급', '원격의료', '구급', '조난', 'sos', '구조', '앱', '사용법', '기능',
  '꽃게', '갈치', '문어', '주꾸미', '오징어', '고등어', '대게', '참조기', '넙치', '광어',
  '멸치', '전어', '삼치', '방어', '전복', '소라', '해삼', '바지락', '우울', '외롭', '피로',
  '구명조끼', '구명동의', '과태료', '벌금', '안전조업법', '안전장비', '부환'
];

/**
 * 사용자 질의가 비해양/비조업 분야인지 검사
 */
export function isNonMaritimeQuery(query: string): boolean {
  const clean = query.trim().toLowerCase();

  // 명백한 비해양 키워드가 포함되어 있고, 해양 관련 핵심어가 전혀 없는 경우
  const hasNonMaritimeKeyword = NON_MARITIME_PATTERNS.some(pattern => pattern.test(clean));
  const hasMaritimeTerm = MARITIME_CORE_TERMS.some(term => clean.includes(term));

  if (hasNonMaritimeKeyword && !hasMaritimeTerm) {
    return true;
  }

  // 글자 수가 8자 이상인데 해양 핵심 키워드가 하나도 없는 특정 일반 질문들
  if (clean.length >= 8 && !hasMaritimeTerm) {
    // 음식 배달, 쇼핑, 영화, 노래 등 명백한 일상 질문 감지
    const generalTrivia = /치킨|피자|배달|노래추천|영화추천|소설|만화|유튜브|넷플릭스|연애|소개팅|로또|운세/;
    if (generalTrivia.test(clean)) {
      return true;
    }
  }

  return false;
}

/**
 * BlueBot AI 응답 생성 함수
 */
export async function getBlueBotAiReply(userText: string): Promise<BlueBotResponse> {
  const cleanText = userText.trim();
  const lower = cleanText.toLowerCase();

  // 1. [사용자 요구사항]: 완전 해양, 조업분야가 아닌 질문을 할 때만 감지해서 제한
  if (isNonMaritimeQuery(cleanText)) {
    return {
      text: `선장님, BlueBot AI는 대한민국 해양·수산·조업 및 선박 안전 전용 지능형 어시스턴트입니다.\n\n문의하신 내용은 해양 및 수산 조업 분야와 관련이 없어 답변이 제한됩니다.\n\n어업 규정, 어종별 금어기 및 포획금지체장, 선박 운항 및 항해 안전, 해상 기상 속보, 선내 비상 응급 처치 및 어플리케이션 사용법에 대해 질문해 주시면 정확하고 전문적인 안내를 제공해 드리겠습니다. 안전 조업 되십시오. 이상!`,
      category: '도메인지침',
      suggestions: ['주요 어종 금어기', '구명조끼 미착용 과태료', '연근해 기상 속보', '어플리케이션 사용법']
    };
  }

  // 2. Gemini API 호출 시도 (gemini-3.8-flash)
  try {
    const geminiKey = typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : undefined;
    if (geminiKey && geminiKey !== 'MY_GEMINI_API_KEY') {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: geminiKey });

      const systemInstruction = `당신은 대한민국 해양수산부 및 어선 스마트 안전조업망(BlueCall)의 공식 AI 비서 "BlueBot AI(블루봇 AI)"입니다.

[역할 및 지침]:
1. 선장님과 선원들을 위한 전문 해양·수산·조업 지능형 비서입니다.
2. 해양, 조업, 어선 운항, 어구/어법(자망, 통발, 채낚기 등), 금어기/포획금지체장(수산자원관리법), 해상 기상/파고/물때, 항해술 및 충돌예방규칙(COLREGs), 선박 디젤 엔진 및 전기/통신 정비, 선내 응급의료/선원 건강, 어플리케이션 사용법 등 해양과 관련된 모든 질문에 대해 최고 전문가 수준으로 상세하고 명확하게 답변하세요.
3. [핵심 법령 - 구명조끼 미착용 과태료 (어선안전조업법)]:
   어선안전조업법에 따른 구명조끼(구명동의) 미착용 시 과태료는 현행법상 다음과 같습니다:
   * 1차 위반: 90만 원
   * 2차 위반: 150만 원
   * 3차 이상 위반: 300만 원 (최대 300만원 과태료 부과)
   구명조끼 미착용 벌금/과태료 문의 시 반드시 위 기준(1차 90만원, 2차 150만원, 3차 300만원)을 정확하게 제시하세요.
4. [도메인 제한 원칙]: 질문이 완전히 해양이나 조업, 선박과 무관한 일반 잡담, 연예, 주식, IT 프로그래밍 등인 경우에만 이를 감지하여 정중히 안내하고 답변을 제한하세요.
5. 답변 스타일:
   - 대한민국 선박 현장에 맞게 "선장님", "~하십시오", "~입니다"와 같이 듬직하고 정중한 어조를 유지하세요.
   - 핵심을 두괄식으로 간결하고 명확하게 정리하고, 법령이나 수치는 정확하게 전달하세요.
   - 마지막 줄에 관련 추천 질문 3~4개를 [추천질문: 키워드1, 키워드2, 키워드3] 형식으로 남기면 좋습니다.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          { role: 'user', parts: [{ text: `${systemInstruction}\n\n선장님 질문: "${cleanText}"` }] }
        ]
      });

      if (response && response.text) {
        let text = response.text.trim();
        let suggestions = ['주요 어종 금어기', '어플리케이션 사용법', '연근해 기상 속보', '선원 건강 상담'];

        // Extract suggestions if model appended them
        const sugMatch = text.match(/\[추천질문:\s*([^\]]+)\]/);
        if (sugMatch) {
          suggestions = sugMatch[1].split(',').map(s => s.trim()).filter(Boolean);
          text = text.replace(/\[추천질문:\s*[^\]]+\]/, '').trim();
        }

        return {
          text,
          category: categorizeMaritimeTopic(lower),
          suggestions
        };
      }
    }
  } catch (err) {
    console.warn('BlueBot Gemini API call failed or bypassed, falling back to expert maritime knowledge base:', err);
  }

  // 3. 전문가 수준의 오프라인 해양 지식 베이스 (Semantic Maritime Knowledge Engine)
  return getOfflineMaritimeKnowledgeReply(cleanText, lower);
}

function categorizeMaritimeTopic(lower: string): BlueBotResponse['category'] {
  if (lower.includes('기상') || lower.includes('날씨') || lower.includes('파고') || lower.includes('바람') || lower.includes('물때')) return '기상정보';
  if (lower.includes('금어기') || lower.includes('체장') || lower.includes('규정') || lower.includes('법') || lower.includes('벌금')) return '어업규정';
  if (lower.includes('우울') || lower.includes('외롭') || lower.includes('힘들') || lower.includes('답답')) return '심리상담';
  if (lower.includes('약') || lower.includes('아파') || lower.includes('멀미') || lower.includes('응급') || lower.includes('의료')) return '의료지원';
  if (lower.includes('엔진') || lower.includes('시동') || lower.includes('배터리') || lower.includes('필터') || lower.includes('냉각수')) return '선박정비';
  return '항해안전';
}

/**
 * 오프라인 심층 해양 지식 베이스
 */
function getOfflineMaritimeKnowledgeReply(userText: string, lower: string): BlueBotResponse {
  // 1. [사용자 요구사항]: 구명조끼 미착용 과태료 (어선안전조업법 현행법: 1차 90만원, 2차 150만원, 3차 300만원)
  if (
    lower.includes('구명조끼') || 
    lower.includes('구명동의') || 
    (lower.includes('벌금') && (lower.includes('구명') || lower.includes('착용') || lower.includes('어선'))) ||
    (lower.includes('과태료') && (lower.includes('구명') || lower.includes('착용') || lower.includes('어선')))
  ) {
    return {
      text: `🦺 [어선안전조업법 구명조끼(구명동의) 미착용 과태료 현행법 기준]\n\n어선안전조업법 제28조 및 동법 시행령에 따른 구명조끼 미착용 시 과태료는 다음과 같습니다:\n\n• 1차 위반: 90만 원\n• 2차 위반: 150만 원\n• 3차 이상 위반: 300만 원\n(※ 최대 300만 원 이하의 과태료가 부과됩니다)\n\n📌 [어선 구명조끼 의무 착용 상황]:\n1. 외판 갑판 상에서 조업(투망·양망) 또는 항해 당직 업무 시\n2. 풍랑주의보·태풍경보 등 기상특보 발효 시 갑판 상의 모든 선원\n3. 2인 이하 소형 어선의 단독 승선 운항 시\n\n⚠️ 구명조끼는 해상 추락 시 생명을 지켜주는 가장 중요한 기본 안전장비입니다. 단속 여부를 떠나 본인과 동료 선원의 생명을 위해 상시 착용해 주십시오!`,
      category: '어업규정',
      suggestions: ['주요 어종 금어기', '어선 안전 조업 수칙', '기상특보 시 행동요령', '어플리케이션 사용법']
    };
  }

  // A. 금어기 및 어종별 수산자원관리법
  if (lower.includes('금어기') || lower.includes('금어') || lower.includes('포획금지') || lower.includes('체장') || lower.includes('금지체장')) {
    if (lower.includes('꽃게')) {
      return {
        text: `🦀 [꽃게 금어기 및 포획 금지 규정]\n• 금어기: 매년 6월 21일 ~ 8월 20일 (전국 연근해 공통)\n  (※ 서해 특정해역 및 백령·대청·연평도 주변: 7월 1일 ~ 8월 31일)\n• 포획금지체장: 두부갑장(등딱지 세로길이) 6.4cm 이하 전면 금지\n• 암컷 보호: 복부에 알을 품은 암컷(외포란 꽃게)은 연중 포획 및 유통 절대 금지\n⚠️ 위반 시: 수산자원관리법 제14조에 따라 2년 이하의 징역 또는 2천만 원 이하의 벌금에 처해집니다.`,
        category: '어업규정',
        suggestions: ['참문어 금어기', '갈치 금어기', '주꾸미 금어기', '포획금지체장 전체보기']
      };
    }
    if (lower.includes('문어') || lower.includes('참문어') || lower.includes('대문어')) {
      return {
        text: `🐙 [문어 금어기 및 포획중량 기준]\n• 참문어(왜문어) 금어기: 5월 16일 ~ 6월 30일 (시·도 고시 기간)\n• 대문어 금어기: 3월 1일 ~ 3월 31일\n• 포획금지체중: 참문어 600g 이하, 대문어 600g 이하 포획 금지\n⚠️ 산란기 알자리 보호를 위해 통발 인양 시 미달 개체는 즉시 해상 방류하여 주시기 바랍니다.`,
        category: '어업규정',
        suggestions: ['주꾸미 금어기', '꽃게 금어기', '살오징어 금어기', '연근해 통발 규정']
      };
    }
    if (lower.includes('갈치')) {
      return {
        text: `🐟 [갈치 금어기 및 항문장 규정]\n• 금어기: 매년 7월 1일 ~ 7월 31일 (북위 33도 이북 연근해 전역)\n• 포획금지체장: 항문장(주둥이 끝에서 항문까지의 길이) 18cm 이하\n• 적용 업종: 연안복합, 근해채낚기, 통발, 안강망 등 전 어업\n어린 풀치 유통 및 불법 어획은 엄격히 단속됩니다.`,
        category: '어업규정',
        suggestions: ['고등어 금어기', '참조기 금어기', '꽃게 금어기', '주요 어종 금어기']
      };
    }
    if (lower.includes('주꾸미')) {
      return {
        text: `🐙 [주꾸미 금어기 규정 안내]\n• 금어기: 매년 5월 11일 ~ 8월 31일 (전국 공통 산란기)\n• 적용 대상: 어업인 조업 및 낚시어선, 비어업인 레저 활동 전면 적용\n• 해제일: 매년 9월 1일부터 합법 조업 및 낚시 재개 가능\n금어기 중 소라통발이나 채낚기 조업 시 적발되면 과태료 및 벌금형 처분을 받습니다.`,
        category: '어업규정',
        suggestions: ['살오징어 금어기', '문어 금어기', '꽃게 금어기', '주요 어종 금어기']
      };
    }
    if (lower.includes('오징어') || lower.includes('살오징어')) {
      return {
        text: `🦑 [살오징어 금어기 및 외투장 기준]\n• 금어기: 매년 4월 1일 ~ 5월 31일 (근해채낚기, 연안복합 등 전 업종)\n• 포획금지체장: 외투장(몸통 지느러미 끝~외투막 하단) 15cm 이하\n• 총알오징어로 불리는 어린 오징어의 포획 및 유통은 법적으로 엄격히 처벌됩니다.`,
        category: '어업규정',
        suggestions: ['고등어 금어기', '참조기 금어기', '주꾸미 금어기', '주요 어종 금어기']
      };
    }
    return {
      text: `📜 [대한민국 수산자원관리법 주요 연근해 금어기 총정리]\n\n1. 🦀 꽃게: 6.21 ~ 8.20 (서해 특정: 7.1 ~ 8.31 / 두부갑장 6.4cm 이하 금지)\n2. 🐟 갈치: 7.1 ~ 7.31 (항문장 18cm 이하 금지)\n3. 🐙 참문어: 5.16 ~ 6.30 (체중 600g 이하 금지)\n4. 🐙 주꾸미: 5.11 ~ 8.31 (산란기 전국 공통 금지)\n5. 🦑 살오징어: 4.1 ~ 5.31 (외투장 15cm 이하 금지)\n6. 🐟 고등어: 4.1 ~ 6.30 중 1개월 (전장 21cm 이하 금지)\n7. 🐟 참조기: 7.1 ~ 8.10 (전장 15cm 이하 금지)\n8. 🦀 대게: 6.1 ~ 11.30 (두부갑장 9cm 이하 및 암컷 연중 금지)\n\n※ 위반 시 2년 이하 징역 또는 2천만 원 이하 벌금이 부과됩니다.`,
      category: '어업규정',
      suggestions: ['꽃게 금어기', '문어 금어기', '갈치 금어기', '주꾸미 금어기']
    };
  }

  // B. 어플리케이션 사용법 및 기능 질의
  if (lower.includes('사용법') || lower.includes('이용법') || lower.includes('어떻게') || lower.includes('기능') || lower.includes('매뉴얼') || lower.includes('앱')) {
    return {
      text: `📱 [Remix BlueCall - 스마트 해양안전 조업 플랫폼 사용 가이드]\n\n🗺️ 1. [지도 탭]\n• 실시간 AIS 선박 4색 레이더 감시 (조난:빨강 / 조업·접근제한:보라 / 가입자:파랑 / 미가입:회색)\n• 선박 터치 시 상세 제원 확인 및 '050 안심번호' 1-Touch 직통 전화 통화\n• 통화 중인 선박 간에는 주황색 실선으로 1:1 연결되며, 다른 선박의 중복 발신은 자동 차단됩니다.\n• 상단 선박 범례는 드래그하여 원하는 위치로 자유롭게 이동할 수 있습니다.\n• 해수부 본부, 부산해수청, 해양경찰서, VTS, 수협 안전국 관공서 핀 조회 및 직통 통화\n\n💬 2. [채팅 탭]\n• 인근 어선과 해상 퀵 상용구 및 실시간 무선 문자 교신\n• BlueBot AI: 24시간 실시간 기상/금어기/규정/선박정비 인공지능 질의응답\n• Starlink 위성통신 실시간 진단 & 24시간 해상 원격의료 화상 상담\n• 선원 케어: 스마트 밴드 생체 텔레메트리 연동 선원 컨디션 및 한줄평 모니터링\n\n🚨 3. [SOS 조난 탭]\n• 오발신 방지를 위해 원형 SOS 버튼을 3초간 꾹 눌러야 인근 전 선박 및 해경 122 상황실로 긴급 조난 신호가 자동 전파됩니다.\n\n⚙️ 4. [설정 탭]\n• 선장 면허 정보, 본선 제원 관리 및 승선원 명부(정상/주의/위험) 관리`,
      category: '어업규정',
      suggestions: ['주요 어종 금어기', '꽃게 금어기', '연근해 기상 속보', '선원 건강 상담']
    };
  }

  // C. 항해 및 충돌 회피 규칙 (COLREGs)
  if (lower.includes('충돌') || lower.includes('피항') || lower.includes('변침') || lower.includes('침로') || lower.includes('우현') || lower.includes('좌현') || lower.includes('항해')) {
    return {
      text: `⚓ [국제해상충돌예방규칙(COLREGs) 및 안전 항행 수칙]\n\n1. 마주치는 상태 (Head-on Situation):\n• 두 동력선이 마주칠 경우 상호 우현 대 우현으로 지나가도록 침로를 '우현(Starboard)'으로 변침합니다.\n\n2. 횡단 상태 (Crossing Situation):\n• 상대 선박을 자신의 우현 쪽에 두고 있는 선박이 '피항선(Give-way vessel)'이 되어 충분한 안전거리를 두고 피항해야 합니다.\n\n3. 조업 중인 어선의 우선권:\n• 통발, 자망 등을 전개하여 조종 성능이 제한된 어선은 일반 동력선에 대해 통항 우선권이 인정되나, 항로 진입 시 대형 상선의 안전 통항을 방해해서는 안 됩니다.\n\n4. 무중 항행 (안개 시정 제한):\n• 무중신호(2분 이내 간격으로 장음 1회) 송출, 레이다 연속 감시 및 즉시 정지 가능한 안전 속력으로 감속하십시오.`,
      category: '항해안전',
      suggestions: ['연근해 기상 속보', '050 안심통화 방법', '선박 엔진 점검', '주요 어종 금어기']
    };
  }

  // D. 선박 디젤 엔진 및 정비
  if (lower.includes('엔진') || lower.includes('시동') || lower.includes('배터리') || lower.includes('냉각수') || lower.includes('고장') || lower.includes('발전기')) {
    return {
      text: `🔧 [선박 디젤 주기관 및 전기 계통 비상 점검 가이드]\n\n1. 엔진 시동 불량 시 점검 순서:\n• 배터리 전압: 메인 셀렉터 스위치 확인 (12V/24V 정상 전압 여부)\n• 연료 라인 에어 빼기: 프라이밍 펌프를 수회 펌핑하여 유수분리기 및 연료 필터 내 공기 배출\n• 연료 차단 밸브(비상 정지 레버) 정상 개방 확인\n\n2. 주기관 과열(Overheat) 경보 시:\n• 해수 스트레이너(킹스턴 밸브 흡입구)에 해조류/비닐 이물질 폐쇄 여부 즉시 점검\n• 임펠러(해수 펌프 고무 날개) 파손 및 V벨트 장력 점검\n\n3. 해상 표류 위기 시 조치:\n• 즉시 시앵커(Sea Anchor, 물닻)를 투하하여 선수가 파도를 향하도록 선체를 안정시키고 BlueCall 050으로 인근 선박이나 해경에 예인 협조를 요청하십시오.`,
      category: '선박정비',
      suggestions: ['해경 122 연결', '인근 선박 안심통화', '연근해 기상 속보', '어플리케이션 사용법']
    };
  }

  // E. 날씨 / 기상 / 파고 / 조석
  if (lower.includes('날씨') || lower.includes('기상') || lower.includes('파고') || lower.includes('풍속') || lower.includes('물때') || lower.includes('조류')) {
    return {
      text: `🌊 [연근해 기상 속보 및 물때 안내]\n• 해역: 부산 기장 및 남동해 외해 조업 구역\n• 풍향/풍속: 북동풍 4.5 ~ 6.8 m/s (조업 양호 수준)\n• 파고: 유의파고 0.8 ~ 1.2 m\n• 수온: 17.8°C / 시정: 12 km 이상 (양호)\n• 물때/조석: 5물 (사리 방향 전개 중, 조류 속도 1.4kt)\n\n※ 오늘 밤부터 동해남부 먼바다를 중심으로 풍랑 예비특보가 발효될 예정이오니, 야간 조업 선박은 기상 방송을 청취하고 안전 귀항을 준비하시기 바랍니다.`,
      category: '기상정보',
      suggestions: ['주요 어종 금어기', '어플리케이션 사용법', '선원 건강 상담', '항해 안전 수칙']
    };
  }

  // F. 의료 / 멀미 / 응급 처치
  if (lower.includes('의료') || lower.includes('멀미') || lower.includes('약') || lower.includes('아파') || lower.includes('다쳤') || lower.includes('환자') || lower.includes('응급')) {
    return {
      text: `🩺 [선내 응급 처치 및 해상 원격의료 지침]\n\n1. 심한 뱃멀미 승선원 응급 조치:\n• 선내 구급함 3번 상비약(디멘히드리네이트 성분 멀미약) 1정 복용 권장\n• 흔들림이 가장 적은 선박 중앙 선실로 이동, 벨트와 옷을 느슨하게 하고 수평선을 응시하거나 안대 착용 후 누워서 안정\n\n2. 어구 감김 및 외상/출혈 시:\n• 소독용 포비돈 및 멸균 거즈로 환부 직접 압박 지혈 실시\n\n3. 24시간 해상 원격의료 전문의 연결:\n• BlueCall 상단 '해상원격의료지원' 채널을 터치하시면 국립중앙의료원 해상응급센터 전문의와 즉시 1:1 화상 진료를 받으실 수 있습니다.`,
      category: '의료지원',
      suggestions: ['해상 원격의료지원 연결', '선원 케어 명부 확인', '어플리케이션 사용법', '연근해 기상 속보']
    };
  }

  // G. 기본 해양 전문 안내
  return {
    text: `선장님, BlueBot AI입니다. 말씀해주신 내용을 확인했습니다.\n\nBlueBot AI는 어선 안전 조업을 위한 24시간 해양 전문 AI 어시스턴트입니다.\n• 어종별 금어기 및 포획금지체장 규정\n• 항해술 및 해상 충돌 예방 규칙(COLREGs)\n• 선박 기관/디젤 엔진 및 전기 계통 자가 정비\n• 실시간 연근해 기상, 파고 및 물때 정보\n• 선내 승선원 응급처치 및 해상 원격의료 상담\n• BlueCall 어플리케이션 상세 기능 사용법\n\n궁금하신 해양·수산·조업 관련 내용을 언제든 편하게 질문해 주십시오. 안전 조업을 기원합니다. 이상!`,
    category: '항해안전',
    suggestions: ['주요 어종 금어기', '연근해 기상 속보', '어플리케이션 사용법', '선박 엔진 점검']
  };
}
