import { MaritimeVessel } from '../types/maritime';

export interface MaritimeAiReplyResult {
  text: string;
  category: 'MEDICINE' | 'NAVIGATION' | 'FISHING_GEAR' | 'WEATHER' | 'DISTRESS' | 'NONSENSE' | 'GREETING';
}

/**
 * Intelligent AI Response Engine for Maritime Vessel-to-Vessel Communications (BlueCall)
 * Simulates real-time VHF / messaging dialogue between captains with deep nautical domain knowledge.
 */
export async function generateMaritimeChatReply(
  userText: string,
  targetVessel: {
    shipName: string;
    captainName: string;
    vesselType: string;
    mmsi: string;
    status?: string;
    statusMessage?: string;
  },
  isControlCenter: boolean = false
): Promise<MaritimeAiReplyResult> {
  const cleanText = userText.trim();
  const lower = cleanText.toLowerCase();
  const isDistressed = targetVessel.status === 'SOS' || targetVessel.shipName.includes('청해진') || targetVessel.mmsi === '440661208';
  const distressDetail = targetVessel.statusMessage || '주기관 정지로 조타 불능 상태이며 암초 방향으로 표류 중';

  // Try server or client Gemini API if key is present
  try {
    const geminiKey = typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : undefined;
    if (geminiKey && geminiKey !== 'MY_GEMINI_API_KEY') {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: geminiKey });

      const callerDescription = isControlCenter
        ? '대한민국 해양수산부 해상교통관제센터(종합상황실/관제관)'
        : '상대 선박(플라잉 더치맨호 최재현 선장)';

      const addressingRule = isControlCenter
        ? `상대방은 '해양수산부 해상교통관제센터(종합상황실)'입니다. 절대로 '선장님'이나 '최재현', '플라잉 더치맨호'라고 부르지 마시고, '관제센터 상황실님', '관제관님', '주무관님'으로 깍듯하게 호칭하며 관제 지시 및 협조에 응답하세요.`
        : `상대 선박(플라잉 더치맨호 최재현 선장)의 무선 호출에 동료 선장으로서 협조적으로 응답하세요.`;

      const distressPromptRule = isDistressed
        ? `[긴급 주의: 현재 본선은 실제 조난(SOS) 상황입니다!]: 현재 상황: ${distressDetail}. 절대로 평상시처럼 안전 항해 중이라거나 정상 조업 중이라고 답변하지 마십시오. 현재 조난 사유를 설명하고 승선원 안전 확보 상태와 함께 신속한 구조 및 지원을 간곡히 요청하십시오. (단, 전화나 문자에서 '메이데이'를 외치지는 마십시오.)`
        : `[의약품/상비약/부상 관련 문의 시]: 소지 중인 상비약(타이레놀, 소화제, 소독약, 붕대, 멀미약 등)을 확인하고 상황에 맞게 답변하세요.
[항해/충돌 회피/침로/어장/기상 관련 문의 시]: 선박 제원과 작업 상황을 바탕으로 현실적인 해상 통항 협조 답변을 하세요.`;

      const prompt = `당신은 대한민국 연근해에서 실제 운항 중인 선박의 선장입니다.
선박 정보:
- 본 선박명: ${targetVessel.shipName}
- 선장명: ${targetVessel.captainName}
- 선박 종류: ${targetVessel.vesselType}
- 조난 여부: ${isDistressed ? '조난 중 (SOS)' : '정상 운항'}

${callerDescription}으로부터 다음 무선 문자 메시지를 수신했습니다:
"${cleanText}"

답변 지침:
1. ${addressingRule}
2. ${distressPromptRule}
3. [완전 엉뚱한 문자(음식 배달, 게임, 잡담, 비속어, 무의미한 단어나 장난 등) 수신 시]: 해상 관제/안전 통신 채널 환경에 맞추어 무슨 말인지 모르겠다는 반응을 정중하고 단호하게 하세요.
4. 첫머리에 '[${targetVessel.shipName}]'으로 시작하세요.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt
      });

      if (response && response.text) {
        return {
          text: response.text.trim(),
          category: isDistressed ? 'DISTRESS' : categorizeUserIntent(lower)
        };
      }
    }
  } catch (err) {
    console.warn('Gemini API call bypassed, falling back to local maritime AI dialogue engine:', err);
  }

  // Fallback to local intelligent nautical response engine
  return generateLocalMaritimeAiReply(cleanText, targetVessel, isControlCenter);
}

function categorizeUserIntent(lower: string): MaritimeAiReplyResult['category'] {
  if (
    lower.includes('약') || 
    lower.includes('의약') || 
    lower.includes('구급') || 
    lower.includes('상비약') || 
    lower.includes('소화제') || 
    lower.includes('진통제') || 
    lower.includes('타이레놀') || 
    lower.includes('두통') || 
    lower.includes('멀미') || 
    lower.includes('감기') || 
    lower.includes('붕대') || 
    lower.includes('소독') || 
    lower.includes('연고') || 
    lower.includes('부상') || 
    lower.includes('다쳤') || 
    lower.includes('다쳐') || 
    lower.includes('아파') || 
    lower.includes('환자') || 
    lower.includes('응급')
  ) {
    return 'MEDICINE';
  }

  if (
    lower.includes('침로') || 
    lower.includes('변침') || 
    lower.includes('방위') || 
    lower.includes('속력') || 
    lower.includes('속도') || 
    lower.includes('감속') || 
    lower.includes('충돌') || 
    lower.includes('우현') || 
    lower.includes('좌현') || 
    lower.includes('피항') || 
    lower.includes('통항') || 
    lower.includes('비켜') || 
    lower.includes('접근')
  ) {
    return 'NAVIGATION';
  }

  if (
    lower.includes('그물') || 
    lower.includes('통발') || 
    lower.includes('양망') || 
    lower.includes('투망') || 
    lower.includes('부표') || 
    lower.includes('어장') || 
    lower.includes('조업') || 
    lower.includes('닻줄')
  ) {
    return 'FISHING_GEAR';
  }

  if (
    lower.includes('기상') || 
    lower.includes('날씨') || 
    lower.includes('파고') || 
    lower.includes('너울') || 
    lower.includes('안개') || 
    lower.includes('시정') || 
    lower.includes('바람')
  ) {
    return 'WEATHER';
  }

  if (
    lower.includes('조난') || 
    lower.includes('고장') || 
    lower.includes('엔진') || 
    lower.includes('시동') || 
    lower.includes('예인') || 
    lower.includes('침수') || 
    lower.includes('구조') || 
    lower.includes('살려')
  ) {
    return 'DISTRESS';
  }

  // Maritime greeting or communication check
  if (
    lower.includes('감도') || 
    lower.includes('무전') || 
    lower.includes('교신') || 
    lower.includes('수신') || 
    lower.includes('들리') || 
    lower.includes('들리시') || 
    lower.includes('오버') || 
    lower.includes('이상')
  ) {
    return 'GREETING';
  }

  // Any message not matching nautical, navigation, weather, or medical safety is treated as NONSENSE in maritime VHF
  return 'NONSENSE';
}

function generateLocalMaritimeAiReply(
  userText: string,
  targetVessel: {
    shipName: string;
    captainName: string;
    vesselType: string;
    mmsi: string;
    status?: string;
    statusMessage?: string;
  },
  isControlCenter: boolean = false
): MaritimeAiReplyResult {
  const lower = userText.toLowerCase().trim();
  const isCoastGuard = targetVessel.vesselType.includes('해경') || targetVessel.shipName.includes('해경');
  const isVts = targetVessel.shipName.includes('VTS') || targetVessel.vesselType.includes('관제');
  const isSafetyBureau = targetVessel.shipName.includes('조업국') || targetVessel.vesselType.includes('안전') || targetVessel.shipName.includes('수협');
  const isDistressed = targetVessel.status === 'SOS' || targetVessel.shipName.includes('청해진') || targetVessel.mmsi === '440661208';
  const distressDetail = targetVessel.statusMessage || '주기관 정지로 조타 불능 상태이며 암초 방향으로 표류 중';
  const category = isDistressed ? 'DISTRESS' : categorizeUserIntent(lower);

  // ----------------------------------------------------
  // [0] 조난 선박 (SOS 상황) 응답 처리 (User Requirement 4)
  // 조난 중인 선박은 어떤 질문을 받아도 실제 조난 상태임을 알리고 긴급 구조를 요청함
  // ----------------------------------------------------
  if (isDistressed) {
    if (isControlCenter) {
      if (category === 'MEDICINE') {
        return {
          text: `[${targetVessel.shipName}] "관제관님, ${targetVessel.shipName} 선장입니다! 비상 구급함으로 선내 경상자 응급처치는 진행 중이나, ${distressDetail}입니다! 승선원 안전 확보를 위해 해경 경비정과 예인선의 신속한 급파를 간곡히 요청드립니다! 이상!"`,
          category: 'DISTRESS'
        };
      }
      return {
        text: `[${targetVessel.shipName}] "해양수산부 관제센터 상황실 수신했습니다! 여기는 ${targetVessel.shipName} 선장입니다. 현재 ${distressDetail} 상태입니다! 전 승선원 4명 구명동의 착용 완료 후 대기 중이며, 해경 구조선과 인근 선박의 신속한 구조 지원을 거듭 요청드립니다! 이상!"`,
        category: 'DISTRESS'
      };
    } else {
      // 어선 모바일 앱 모드 (최재현 선장 ↔ 조난 선박 교신)
      if (lower.includes('약') || lower.includes('구급') || lower.includes('환자') || lower.includes('다쳤')) {
        return {
          text: `[${targetVessel.shipName}] "최재현 선장님, 연락 주셔서 감사합니다! 선내 구급함으로 응급처치는 진행 중이나, 현재 ${distressDetail}입니다. 혹시 본선 근처로 접근 가능하시면 조난 위치 주시 및 구조 협조를 간곡히 부탁드립니다! 이상!"`,
          category: 'DISTRESS'
        };
      }
      if (lower.includes('예인') || lower.includes('줄') || lower.includes('로프')) {
        return {
          text: `[${targetVessel.shipName}] "최 선장님, 예인줄 비트 결박 준비 중입니다! 현재 조류와 너울로 선체 동요가 심하니 접현 시 충돌 안전에 각별히 유의해 주십시오. 도와주셔서 정말 감사드립니다! 이상!"`,
          category: 'DISTRESS'
        };
      }
      return {
        text: `[${targetVessel.shipName}] "플라잉 더치맨호 최재현 선장님, 연락 주셔서 정말 감사합니다! 현재 본선 ${distressDetail}입니다. 승선원 4명 전원 구명동의 착용 완료하고 대기 중입니다. 해경 구조선 도착 전까지 인근에서 본선 위치 주시 및 신속한 구조 협조 부탁드립니다! 이상!"`,
        category: 'DISTRESS'
      };
    }
  }

  // ----------------------------------------------------
  // [1] 관제센터 웹 시연 모드 (isControlCenter === true)
  // 상대 선박은 관공서(해양수산부 관제센터)에 보고하는 어조로 답변
  // 절대 '최재현 선장'이나 '플라잉 더치맨호'를 언급하지 않음
  // ----------------------------------------------------
  if (isControlCenter) {
    if (category === 'MEDICINE') {
      return {
        text: `[${targetVessel.shipName}] "해양수산부 중앙관제센터 상황실 수신 양호합니다. 관제관님, 본선 선내 비상구급함에 상비약 구비되어 있으며, 현재 승선원 환자 없이 정상 조업 및 안전 운항 중입니다. 이상!"`,
        category: 'MEDICINE'
      };
    }
    if (category === 'NAVIGATION') {
      return {
        text: `[${targetVessel.shipName}] "관제센터 상황실 수신했습니다. 관제관님, 지시하신 지정 항로 및 안전 속력을 철저히 준수하여 통항하겠습니다. 이상!"`,
        category: 'NAVIGATION'
      };
    }
    if (category === 'FISHING_GEAR') {
      return {
        text: `[${targetVessel.shipName}] "관제센터, ${targetVessel.shipName}입니다. 현재 인가 어장 구역 내에서 통발 작업 중이며 통항 항로 침범 없이 안전 이격 유지 중입니다."`,
        category: 'FISHING_GEAR'
      };
    }
    if (category === 'WEATHER') {
      return {
        text: `[${targetVessel.shipName}] "관제센터 기상 주의보 전파 수신했습니다. 현재 현지 해역 파고 1.1m 양호하며, 기상 악화 시 즉시 피항 조치하겠습니다. 이상!"`,
        category: 'WEATHER'
      };
    }
    if (category === 'DISTRESS') {
      return {
        text: `[${targetVessel.shipName}] "관제센터 종합상황실, ${targetVessel.shipName} 수신했습니다! 주변 조난 선박 발생 시 즉시 구조 지원 태세로 전환하겠습니다. 이상!"`,
        category: 'DISTRESS'
      };
    }
    if (category === 'GREETING') {
      return {
        text: `[${targetVessel.shipName}] "해양수산부 중앙관제센터 종합상황실, 수신 감도 5/5로 매우 양호합니다! 해상 안전 관제에 수고가 많으십니다. 이상!"`,
        category: 'GREETING'
      };
    }
    return {
      text: `[${targetVessel.shipName}] "관제센터 상황실, 송신 내용에 통신 장애가 있거나 메시지 확인이 어렵습니다. 해상 안전 관제 용무이시면 다시 말씀해 주십시오. 이상!"`,
      category: 'NONSENSE'
    };
  }

  // ----------------------------------------------------
  // [2] 어선 모바일 앱 모드 (일반 선박 간 교신)
  // ----------------------------------------------------
  // 1. 의약품 / 상비약 / 구급약 / 응급 치료 관련 질문
  if (category === 'MEDICINE') {
    if (isCoastGuard) {
      return {
        text: `[${targetVessel.shipName}] "해경 경비정입니다. 플라잉 더치맨호 최재현 선장님, 함내 전문 응급구급함 및 외상처치 의료장비, 산소호흡기 보유 중입니다. 환자 상태와 필요 약품을 무선 통보해 주시면 즉시 최대속력으로 접현하여 응급조치 및 지원하겠습니다. 이상!"`,
        category: 'MEDICINE'
      };
    }
    if (isVts) {
      return {
        text: `[${targetVessel.shipName}] "해상교통관제센터(VTS)입니다. 플라잉 더치맨호, 의약품 긴급 지원 요청 수신했습니다. 인근 1.5마일 내에 위치한 해경 경비정과 원격의료지원 지정선에 긴급 타전하였습니다. 환자 의식 상태를 확인해 주십시오. 이상!"`,
        category: 'MEDICINE'
      };
    }
    if (isSafetyBureau) {
      return {
        text: `[${targetVessel.shipName}] "어선안전조업국입니다. 플라잉 더치맨호, 의약품 긴급 지원 요청 접수했습니다. 귀 선박 인근에서 조업 중인 수협 선단선에 비상 구호약품 전달 협조 무전을 긴급 타전합니다. 현재 위치와 VHF 채널 16 수신 대기 바랍니다."`,
        category: 'MEDICINE'
      };
    }

    // Specific medicine variants
    if (lower.includes('멀미') || lower.includes('두통') || lower.includes('어지')) {
      return {
        text: `[${targetVessel.shipName}] "플라잉 더치맨호 선장님! 저희 배에 멀미약(마시는 약 3병, 귀미테 패치)과 타이레놀 두통약 여유분 있습니다. 전방 0.4마일 거리이니 필요하시면 바로 접근해서 던짐줄 바구니로 넘겨드리겠습니다. 이상!"`,
        category: 'MEDICINE'
      };
    }
    if (lower.includes('붕대') || lower.includes('소독') || lower.includes('피') || lower.includes('연고') || lower.includes('다쳤') || lower.includes('상처')) {
      return {
        text: `[${targetVessel.shipName}] "최재현 선장님, 선원분 다치셨습니까? 저희 선내 구급함에 포비돈 소독약, 멸균 거즈, 압박 붕대 충분히 소지하고 있습니다. 출혈 부위 압박하시고, 저희가 지금 그쪽으로 변침하여 즉시 전달하겠습니다!"`,
        category: 'MEDICINE'
      };
    }
    if (lower.includes('소화') || lower.includes('체했') || lower.includes('배아')) {
      return {
        text: `[${targetVessel.shipName}] "네 선장님, 선내에 훼스탈 소화제와 제산제 여유분 있습니다. 바다 위에서 체하면 고생스러우니 본선 쪽으로 서행해 오시면 바로 건네드리겠습니다. 이상!"`,
        category: 'MEDICINE'
      };
    }

    // General medicine confirmation
    return {
      text: `[${targetVessel.shipName}] "플라잉 더치맨호 최재현 선장님, ${targetVessel.shipName} ${targetVessel.captainName}입니다! 네, 선내 비상구급함에 종합감기약, 해열진통제(타이레놀), 소화제, 지혈제, 소독약과 붕대 구비되어 있습니다. 필요하신 약품 말씀해주시면 즉시 접현하거나 투척 바구니로 전달해 드리겠습니다. 현재 본선 쪽으로 접근하시겠습니까? 이상!"`,
      category: 'MEDICINE'
    };
  }

  // 2. 항해 / 충돌 예방 / 침로 / 변침
  if (category === 'NAVIGATION') {
    if (isCoastGuard || isVts) {
      return {
        text: `[${targetVessel.shipName}] "플라잉 더치맨호, 레이더로 귀 선박 확인 중입니다. 남동쪽 항로 통항선 다수 있으니 침로 135도 유지하시고 안전속력 10노트 준수 바랍니다. 이상!"`,
        category: 'NAVIGATION'
      };
    }
    return {
      text: `[${targetVessel.shipName}] "최재현 선장님, AIS 및 레이더로 본선 확인했습니다. 저희 선박 우현으로 15도 변침하여 0.7마일 안전거리 확보하며 통과하겠습니다. 안전 운항하십시오!"`,
      category: 'NAVIGATION'
    };
  }

  // 3. 어장 / 그물 / 통발 / 양망 / 투망
  if (category === 'FISHING_GEAR') {
    return {
      text: `[${targetVessel.shipName}] "최 선장님, 현재 위치 기준 반경 400m 내에 통발 닻줄 부표 내려놓고 권현망 작업 중입니다. 서쪽으로 300m 여유 두고 우회 통항 부탁드립니다. 협조 감사합니다!"`,
      category: 'FISHING_GEAR'
    };
  }

  // 4. 기상 / 파고 / 시정 / 안개
  if (category === 'WEATHER') {
    return {
      text: `[${targetVessel.shipName}] "현재 이쪽 수역 파고 1.2m에 북동풍 5~7m/s 불고 있습니다. 서쪽 수역에 안개가 약간 끼기 시작했으니 시계 및 레이더 감시 강화하시기 바랍니다. 이상!"`,
      category: 'WEATHER'
    };
  }

  // 5. 조난 / 기관 고장 / 예인
  if (category === 'DISTRESS') {
    return {
      text: `[${targetVessel.shipName}] "선장님, 침착하십시오! 귀 선박 위치 레이더 포착했습니다. 기관 고장이나 침수 위험 있으십니까? 본선 전속력으로 접근 중이니 필요하시면 예인삭 연결 준비하겠습니다. 해경에도 동시 전파하십시오!"`,
      category: 'DISTRESS'
    };
  }

  // 6. 일반 인사 / 무전 체크
  if (category === 'GREETING') {
    return {
      text: `[${targetVessel.shipName}] "플라잉 더치맨호 최재현 선장님, 수신 감도 5/5로 매우 양호합니다! 오늘 조업 무탈하시고 만선 귀항하시길 바랍니다. 이상!"`,
      category: 'GREETING'
    };
  }

  // 7. 완전 엉뚱한 문자
  const nonsenseReplies = [
    `[${targetVessel.shipName}] "치지직... 선장님, 무슨 말씀이신지 잘 모르겠습니다. 통신 혼선이 있거나 메시지가 잘못 발신된 것 같습니다. 선박 안전 항해나 조업 관련 용무로 다시 말씀해 주십시오. 이상!"`,
    `[${targetVessel.shipName}] "플라잉 더치맨호, 수신된 내용이 해상 운항 내용과 전혀 맞지 않아 무슨 뜻인지 이해하기 어렵습니다. 지금 조업 작업 중이오니 선박 통항 및 안전 용건으로 다시 연락 부탁드립니다. 이상!"`,
    `[${targetVessel.shipName}] "여기는 ${targetVessel.shipName}, 죄송하지만 무슨 말씀인지 통 알아들을 수가 없습니다. 선박 간 안전 무선 채널이오니 해상 용건이 아니시면 채널 대기 부탁드립니다. 이상!"`
  ];

  const pick = nonsenseReplies[Math.floor(Math.random() * nonsenseReplies.length)];
  return {
    text: pick,
    category: 'NONSENSE'
  };
}
