// Utility to generate completely fictitious Korean names for maritime captains, crew, and callers
// (Completely eliminates any real personal names, generating randomized natural Korean names)

const familyNames = ['이', '박', '정', '최', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황', '안', '송', '전', '홍', '고', '문', '양', '손', '배', '백'];
const firstNames1 = ['진', '도', '준', '현', '성', '태', '우', '민', '재', '원', '지', '승', '동', '하', '선', '영', '시', '규', '상', '경', '유', '호'];
const firstNames2 = ['우', '현', '혁', '진', '호', '양', '석', '서', '윤', '준', '민', '수', '훈', '빈', '욱', '환', '찬', '원', '율', '하', '은'];

export function generateRandomKoreanName(): string {
  const family = familyNames[Math.floor(Math.random() * familyNames.length)];
  const n1 = firstNames1[Math.floor(Math.random() * firstNames1.length)];
  const n2 = firstNames2[Math.floor(Math.random() * firstNames2.length)];
  return `${family}${n1}${n2}`;
}

export const sampleCaptainNames = [
  '이진우 선장',
  '박도현 선장',
  '정성호 선장',
  '강태양 선장',
  '최동하 선장',
  '한지혁 선장',
  '오승민 선장',
  '서원준 선장',
  '윤재호 선장',
  '송하늘 선장'
];

export const sampleCrewMembers = [
  { name: '이진우', role: '선장 (Captain)', condition: '정상', fatigueScore: 18 },
  { name: '박도현', role: '기관장 (Chief Engineer)', condition: '정상', fatigueScore: 24 },
  { name: '정현수', role: '1등 항해사 (First Mate)', condition: '주의', fatigueScore: 62 },
  { name: '강민혁', role: '갑판장 (Boatswain)', condition: '정상', fatigueScore: 35 },
  { name: '한지우', role: '갑판원 (Deckhand)', condition: '주의 (경미한 멀미)', fatigueScore: 58 },
  { name: '최원준', role: '조리장 (Cook)', condition: '정상', fatigueScore: 20 }
];

export function getRandomCallerName(): string {
  const pool = [
    '이진우 (바다호 선장)',
    '박도현 (해성호 선장)',
    '정성호 (동진호 선주)',
    '강태양 (태평양호 선장)',
    '최동하 (만선호 선장)',
    '한지혁 (영광호 선장)',
    '윤재호 (남해호 기관장)'
  ];
  return pool[Math.floor(Math.random() * pool.length)];
}
