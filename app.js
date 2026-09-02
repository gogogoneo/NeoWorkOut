// ---------- Service worker registration ----------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}

// ---------- Data ----------
const WEEKDAY_MAP = ["일", "월", "화", "수", "목", "금", "토"];
// 새 루틴: 월·수·금 전신 웨이트 / 화·목·토 유산소 / 일 완전 휴식
// 기존 내부 키(upper/lower/rest)는 저장 데이터 호환성을 위해 유지합니다.
const DAY_TYPE = { 월: "upper", 화: "lower", 수: "upper", 목: "lower", 금: "upper", 토: "lower", 일: "rest" };

const DAY_INFO = {
  upper: { label: "전신 웨이트", duration: 90, calories: 520, color: "#F5C518" },
  lower: { label: "유산소 60분", duration: 60, calories: 480, color: "#3E8FB0" },
  rest: { label: "완전 휴식", duration: 0, calories: 0, color: "#545C6B" },
};

const EXERCISES = {
  upper: [
    // 가슴: 우선순위 높음, 각 3세트
    { id: "bench", name: "바벨 벤치프레스", unit: "kg", tip: "견갑을 뒤로 모아 고정하고 가슴을 살짝 들어 바를 가슴 쪽으로 천천히 내렸다가 밀어올리세요. 팔꿈치는 몸통에서 약 45도, 손목은 바 아래에 둡니다.", breath: "밀어올릴 때 숨을 내쉬고, 내릴 때 들이쉬세요", substitutes: [{ name: "푸시업", unit: "bodyweight", tip: "몸을 일직선으로 유지하고 가슴이 바닥에 가까워질 때까지 내려갔다 밀어올리세요.", breath: "밀어올릴 때 내쉬고, 내릴 때 들이쉬세요", sets: [{ value:null,reps:15,rest:60},{value:null,reps:12,rest:60},{value:null,reps:10,rest:60}] }], sets: [
      { value: 50, reps: 12, rest: 90 }, { value: 60, reps: 10, rest: 90 }, { value: 65, reps: 6, rest: 120 }
    ] },
    { id: "dips", name: "어시스트 머신 딥스", unit: "kg", tip: "가슴 자극을 위해 상체를 약간 앞으로 기울이고, 어깨가 과하게 내려가지 않는 범위에서 내려갔다 밀어올리세요. 어시스트 숫자가 클수록 쉬워집니다.", breath: "밀어올릴 때 내쉬고, 내려갈 때 들이쉬세요", substitutes: [{ name:"벤치 딥스",unit:"bodyweight",tip:"어깨가 불편하지 않은 범위에서 천천히 수행하세요.",breath:"밀어올릴 때 내쉬고, 내려갈 때 들이쉬세요",sets:[{value:null,reps:12,rest:60},{value:null,reps:12,rest:60},{value:null,reps:10,rest:60}]}], sets: [
      { value: 40, reps: 12, rest: 90 }, { value: 35, reps: 12, rest: 90 }, { value: 35, reps: 10, rest: 90 }
    ] },
    { id: "incline", name: "인클라인 덤벨프레스", unit: "kg", tip: "벤치를 약 30도로 세우고 덤벨을 가슴 윗부분 옆으로 천천히 내렸다가 위로 밀어올리세요. 어깨가 들리지 않게 견갑을 고정하고 가슴 상부 수축에 집중합니다.", breath: "밀어올릴 때 내쉬고, 내릴 때 들이쉬세요", substitutes: [{name:"인클라인 푸시업",unit:"bodyweight",tip:"손을 벤치에 올리고 몸을 일직선으로 유지하며 가슴을 벤치 쪽으로 내렸다가 밀어올리세요.",breath:"밀 때 내쉬고, 내릴 때 들이쉬세요",sets:[{value:null,reps:15,rest:60},{value:null,reps:12,rest:60},{value:null,reps:10,rest:60}]}], sets: [
      { value: 10, reps: 12, rest: 90 }, { value: 12, reps: 12, rest: 90 }, { value: 12, reps: 10, rest: 90 }
    ] },
    { id: "flye", name: "덤벨 플라이", unit: "kg", tip: "평벤치에 누워 팔꿈치를 살짝 굽힌 채 고정하고 양팔을 큰 아치로 벌렸다가 가슴 앞에서 모으세요. 무게보다 가슴의 스트레칭과 수축을 우선합니다.", breath: "벌릴 때 들이쉬고, 모을 때 내쉬세요", substitutes: [{name:"와이드 푸시업",unit:"bodyweight",tip:"손 간격을 어깨보다 넓게 잡고 가슴이 충분히 늘어나는 범위까지 천천히 내려갔다 밀어올리세요.",breath:"내릴 때 들이쉬고, 밀 때 내쉬세요",sets:[{value:null,reps:15,rest:60},{value:null,reps:15,rest:60},{value:null,reps:12,rest:60}]}], sets: [
      { value: 8, reps: 12, rest: 60 }, { value: 10, reps: 12, rest: 60 }, { value: 10, reps: 10, rest: 60 }
    ] },

    // 등: 수평 당기기 + 수직 당기기, 각 3세트
    { id: "cablerow", name: "시티드 케이블 로우", unit: "kg", tip: "허리를 세우고 손잡이를 배꼽 방향으로 당기며 견갑을 뒤로 모으세요. 상체 반동을 최소화합니다.", breath: "당길 때 내쉬고, 돌아갈 때 들이쉬세요", substitutes: [{name:"밴드 로우",unit:"bodyweight",tip:"밴드를 고정하고 팔꿈치를 뒤로 보내며 견갑을 모으세요.",breath:"당길 때 내쉬고, 풀 때 들이쉬세요",sets:[{value:null,reps:15,rest:60},{value:null,reps:12,rest:60},{value:null,reps:12,rest:60}]}], sets: [
      { value: 30, reps: 12, rest: 90 }, { value: 35, reps: 10, rest: 90 }, { value: 40, reps: 8, rest: 90 }
    ] },
    { id: "latpull", name: "랫풀다운", unit: "kg", tip: "가슴을 살짝 들고 바를 쇄골 쪽으로 당기세요. 몸을 뒤로 크게 젖히지 말고 팔보다 광배근으로 당긴다는 느낌을 유지합니다.", breath: "당길 때 내쉬고, 올릴 때 들이쉬세요", substitutes: [{name:"밴드 랫풀다운",unit:"bodyweight",tip:"밴드를 머리 위에 고정하고 팔꿈치를 옆구리 쪽으로 끌어내리세요.",breath:"당길 때 내쉬고, 올릴 때 들이쉬세요",sets:[{value:null,reps:15,rest:60},{value:null,reps:12,rest:60},{value:null,reps:12,rest:60}]}], sets: [
      { value: 35, reps: 12, rest: 90 }, { value: 40, reps: 10, rest: 90 }, { value: 45, reps: 8, rest: 90 }
    ] },

    // 하체: 각 3세트
    { id: "legpress", name: "레그프레스", unit: "kg", tip: "발을 발판 중앙에 어깨너비 정도로 두고 무릎과 발끝 방향을 맞춥니다. 무릎을 완전히 잠그지 않고 허리가 뜨지 않는 깊이까지만 내려갑니다.", breath: "밀어낼 때 내쉬고, 내릴 때 들이쉬세요", substitutes: [{name:"맨몸 스쿼트",unit:"bodyweight",tip:"무릎과 발끝 방향을 맞추고 엉덩이를 뒤로 보내며 앉았다 일어서세요.",breath:"일어설 때 내쉬고, 앉을 때 들이쉬세요",sets:[{value:null,reps:20,rest:60},{value:null,reps:20,rest:60},{value:null,reps:15,rest:60}]}], sets: [
      { value: 50, reps: 12, rest: 90 }, { value: 50, reps: 12, rest: 90 }, { value: 50, reps: 12, rest: 90 }
    ] },
    { id: "rdl", name: "덤벨 루마니안 데드리프트", unit: "kg", tip: "무릎은 살짝 굽히고 엉덩이를 뒤로 보내며 덤벨을 정강이 가까이 내립니다. 햄스트링이 충분히 늘어나면 엉덩이 힘으로 일어섭니다. 등이 말리지 않게 합니다.", breath: "일어설 때 내쉬고, 내려갈 때 들이쉬세요", substitutes: [{name:"싱글레그 데드리프트(맨몸)",unit:"bodyweight",tip:"균형을 잡으며 엉덩이를 뒤로 보내고 허리를 중립으로 유지하세요.",breath:"일어설 때 내쉬고, 내려갈 때 들이쉬세요",sets:[{value:null,reps:12,rest:60},{value:null,reps:12,rest:60},{value:null,reps:10,rest:60}]}], sets: [
      { value: 18, reps: 12, rest: 90 }, { value: 18, reps: 12, rest: 90 }, { value: 18, reps: 10, rest: 90 }
    ] },
    // 선택 하체: 기본 OFF, 필요할 때 운동 선택에서 켜기
    { id: "bulgarian", name: "불가리안 스쿼트 (다리당)", unit: "bodyweight", tip: "뒷발을 벤치에 걸고 앞발에 체중을 실어 천천히 내려갔다 일어서세요. 무릎과 발끝 방향을 맞추고 균형이 흔들리지 않는 범위에서 수행합니다.", breath: "일어설 때 내쉬고, 내려갈 때 들이쉬세요", substitutes: [{name:"제자리 런지",unit:"bodyweight",tip:"한 발을 앞에 두고 제자리에서 천천히 내려갔다 일어서세요.",breath:"일어설 때 내쉬고, 내려갈 때 들이쉬세요",sets:[{value:null,reps:12,rest:60},{value:null,reps:12,rest:60},{value:null,reps:10,rest:60}]}], sets: [
      { value: null, reps: 10, rest: 60 }, { value: null, reps: 10, rest: 60 }, { value: null, reps: 10, rest: 60 }
    ] },
    { id: "calfraise", name: "카프 레이즈", unit: "kg", tip: "발볼로 지지하고 뒤꿈치를 충분히 내린 뒤 최대한 높이 올리세요. 꼭대기에서 잠깐 멈추고 반동 없이 천천히 반복합니다.", breath: "올릴 때 내쉬고, 내릴 때 들이쉬세요", substitutes: [{name:"맨몸 카프 레이즈",unit:"bodyweight",tip:"계단 끝이나 평지에서 뒤꿈치를 천천히 올렸다 내리며 종아리 수축을 느끼세요.",breath:"올릴 때 내쉬고, 내릴 때 들이쉬세요",sets:[{value:null,reps:20,rest:45},{value:null,reps:20,rest:45},{value:null,reps:20,rest:45}]}], sets: [
      { value: 30, reps: 15, rest: 45 }, { value: 30, reps: 15, rest: 45 }, { value: 30, reps: 15, rest: 45 }
    ] },

    // 어깨·이두: 복합운동에서 보조 자극을 받으므로 직접 운동은 각 2세트
    { id: "ohp", name: "덤벨 오버헤드프레스", unit: "kg", tip: "코어에 힘을 주고 허리가 과하게 젖혀지지 않도록 합니다. 덤벨을 귀 옆에서 머리 위로 밀어올립니다.", breath: "밀어올릴 때 내쉬고, 내릴 때 들이쉬세요", substitutes: [{name:"파이크 푸시업",unit:"bodyweight",tip:"엉덩이를 높인 역V 자세에서 머리를 바닥 쪽으로 내렸다 밀어올리세요.",breath:"밀 때 내쉬고, 내릴 때 들이쉬세요",sets:[{value:null,reps:12,rest:60},{value:null,reps:10,rest:60}]}], sets: [
      { value: 8, reps: 12, rest: 60 }, { value: 8, reps: 10, rest: 60 }
    ] },
    { id: "lateral", name: "레터럴 레이즈", unit: "kg", tip: "팔꿈치를 살짝 굽히고 팔꿈치가 먼저 올라간다는 느낌으로 어깨 높이 정도까지 들어올립니다. 반동을 최소화합니다.", breath: "올릴 때 내쉬고, 내릴 때 들이쉬세요", substitutes: [{name:"밴드 레터럴 레이즈",unit:"bodyweight",tip:"밴드를 밟고 같은 궤적으로 천천히 들어올리세요.",breath:"올릴 때 내쉬고, 내릴 때 들이쉬세요",sets:[{value:null,reps:15,rest:45},{value:null,reps:15,rest:45}]}], sets: [
      { value: 6, reps: 12, rest: 45 }, { value: 6, reps: 12, rest: 45 }
    ] },
    { id: "reardelt", name: "리어 델트 플라이", unit: "kg", tip: "상체를 숙이고 몸통을 고정한 뒤 팔을 옆으로 벌립니다. 반동보다 후면 어깨 수축에 집중합니다.", breath: "벌릴 때 내쉬고, 모을 때 들이쉬세요", substitutes: [{name:"맨몸 리어델트 레이즈",unit:"bodyweight",tip:"상체를 숙인 뒤 무게 없이 팔을 벌리며 후면 어깨를 수축하세요.",breath:"벌릴 때 내쉬고, 모을 때 들이쉬세요",sets:[{value:null,reps:15,rest:45},{value:null,reps:15,rest:45}]}], sets: [
      { value: 5, reps: 12, rest: 45 }, { value: 5, reps: 12, rest: 45 }
    ] },
    { id: "bicep", name: "덤벨 이두 컬", unit: "kg", tip: "팔꿈치를 몸통 옆에 고정하고 반동 없이 들어올립니다. 내려갈 때도 천천히 저항을 유지하세요.", breath: "들어올릴 때 내쉬고, 내릴 때 들이쉬세요", substitutes: [{name:"밴드 이두 컬",unit:"bodyweight",tip:"팔꿈치를 고정하고 밴드를 천천히 당겼다 돌아갑니다.",breath:"당길 때 내쉬고, 돌아갈 때 들이쉬세요",sets:[{value:null,reps:15,rest:45},{value:null,reps:12,rest:45}]}], sets: [
      { value: 6, reps: 15, rest: 45 }, { value: 6, reps: 12, rest: 45 }
    ] },

    // 코어: 기존 선호 운동 유지. 우드초퍼는 선택 운동으로 기본 해제.
    { id: "hangingraise", name: "행잉 니 레이즈", unit: "bodyweight", tip: "반동 없이 골반을 말아 무릎을 배 쪽으로 끌어올립니다. 그립이 먼저 지치면 코어 운동 중 앞쪽에 배치하세요.", breath: "올릴 때 내쉬고, 내릴 때 들이쉬세요", substitutes: [{name:"라잉 레그레이즈",unit:"bodyweight",tip:"허리가 뜨지 않게 복부에 힘을 주고 다리를 천천히 올렸다 내립니다.",breath:"올릴 때 내쉬고, 내릴 때 들이쉬세요",sets:[{value:null,reps:15,rest:45},{value:null,reps:15,rest:45}]}], sets: [
      { value: null, reps: 12, rest: 45 }, { value: null, reps: 12, rest: 45 }
    ] },
    { id: "cablecrunch", name: "케이블 크런치", unit: "kg", tip: "엉덩이 위치를 크게 움직이지 않고 갈비뼈를 골반 쪽으로 말아 복부를 수축하세요. 팔로 로프를 당기지 않습니다.", breath: "말아 내릴 때 내쉬고, 펼 때 들이쉬세요", substitutes: [{name:"맨몸 크런치",unit:"bodyweight",tip:"허리를 바닥에 붙이고 복부로 상체를 짧게 말아올립니다.",breath:"올릴 때 내쉬고, 내릴 때 들이쉬세요",sets:[{value:null,reps:20,rest:45},{value:null,reps:20,rest:45}]}], sets: [
      { value: 60, reps: 20, rest: 45 }, { value: 60, reps: 20, rest: 45 }
    ] },
    { id: "woodchop", name: "케이블 우드초퍼", unit: "kg", tip: "케이블을 양손으로 잡고 몸통을 회전해 대각선 방향으로 당깁니다. 팔로만 당기지 말고 복사근과 몸통 회전에 집중하세요. 좌우 동일하게 수행합니다.", breath: "당길 때 내쉬고, 돌아올 때 들이쉬세요", substitutes: [{name:"러시안 트위스트",unit:"bodyweight",tip:"상체를 약간 뒤로 기울이고 좌우로 천천히 회전하세요.",breath:"회전할 때 내쉬고, 중앙에서 들이쉬세요",sets:[{value:null,reps:16,rest:45},{value:null,reps:16,rest:45},{value:null,reps:16,rest:45},{value:null,reps:16,rest:45}]}], sets: [
      { value: 20, reps: 15, rest: 45 }, { value: 25, reps: 12, rest: 45 }, { value: 30, reps: 10, rest: 45 }, { value: 30, reps: 10, rest: 45 }
    ] },
    { id: "plank", name: "플랭크", unit: "sec", defaultWorkSec: 40, tip: "팔꿈치를 어깨 아래에 두고 머리부터 발끝까지 일직선을 유지합니다. 허리가 처지지 않도록 복부와 엉덩이에 힘을 주세요.", breath: "숨을 참지 말고 편안하게 이어가세요", substitutes: [{name:"버드독",unit:"sec",defaultWorkSec:40,tip:"네발 자세에서 반대 팔과 다리를 뻗고 몸통이 흔들리지 않게 유지하세요.",breath:"편안하게 호흡하세요",sets:[{value:40,reps:null,rest:40},{value:40,reps:null,rest:40}]}], sets: [
      { value: 40, reps: null, rest: 40 }, { value: 40, reps: null, rest: 40 }
    ] },
  ],
  lower: [],
  rest: [],
};

const CARDIO_OPTIONS = {
  upper: [],
  lower: [
    {
      key: "treadmill",
      label: "트레드밀 60분",
      type: "treadmill",
      phases: [
        { key: "main", label: "경사 인터벌", seconds: 30 * 60, fields: { highIncline: 6, highSpeed: 6, highSeconds: 2 * 60, lowIncline: 4, lowSpeed: 6, lowSeconds: 1 * 60, reps: 10 } },
        { key: "steady", label: "고정 걷기", seconds: 20 * 60, fields: { incline: 5, speed: 6 } },
        { key: "finish", label: "마무리 걷기", seconds: 10 * 60, fields: { incline: 4, speed: 6 } },
      ],
    },
    {
      key: "mixed5050",
      label: "트레드밀 30분 + 스텝밀 30분",
      type: "mixed",
      phases: [
        { key: "treadmill30", label: "트레드밀", type: "treadmill", seconds: 30 * 60, fields: { highIncline: 6, highSpeed: 6, highSeconds: 2 * 60, lowIncline: 4, lowSpeed: 6, lowSeconds: 1 * 60, reps: 10 } },
        { key: "stairs30", label: "스텝밀", type: "stairs", seconds: 30 * 60, fields: { highLevel: 6, highSeconds: 2 * 60, lowLevel: 4, lowSeconds: 1 * 60, reps: 10 } },
      ],
    },
    {
      key: "stairs",
      label: "천국의 계단 60분",
      type: "stairs",
      phases: [
        { key: "warmup", label: "워밍업", seconds: 10 * 60, fields: { level: 3 } },
        { key: "main", label: "본운동", seconds: 39 * 60, fields: { highLevel: 6, highSeconds: 2 * 60, lowLevel: 4, lowSeconds: 1 * 60, reps: 13 } },
        { key: "cooldown", label: "마무리", seconds: 11 * 60, fields: { level: 3 } },
      ],
    },
  ],
  rest: [],
};

// ---------- Helpers ----------
const pad = (n) => String(n).padStart(2, "0");
const toDateStr = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
const parseLocalDate = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const getDayLabel = (s) => WEEKDAY_MAP[parseLocalDate(s).getDay()];
const getDayType = (s) => DAY_TYPE[getDayLabel(s)];
const formatTime = (t) => `${pad(Math.floor(t / 60))}:${pad(Math.floor(t % 60))}`;
const isUniform = (sets) => sets.every((s) => s.value === sets[0].value);
const todayStr = () => { const d = new Date(); return toDateStr(d.getFullYear(), d.getMonth(), d.getDate()); };

function lsGet(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch (e) { return fallback; }
}
function lsSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
}

// ---------- State ----------
const DEFAULT_WORK_SECONDS = 20;

const state = {
  view: "calendar",
  calYear: new Date().getFullYear(),
  calMonth: new Date().getMonth(),
  selectedDate: todayStr(),
  configs: lsGet("wt_exercise_configs", {}),
  summary: lsGet("wt_summary", {}),
  completed: {},
  expanded: {},
  timer: null, // { kind: 'setWork'|'setRest', exId, setIdx, nextSetIdx, isLastSet, remaining, total } | { label, remaining, total } for cardio
  timerHandle: null,
  activeExerciseId: null,
  activeSetIdx: 0,
  queue: null, // remaining exercise ids to auto-run after current one (block mode)
  sessionStart: null,
  elapsedHandle: null,
  voiceEnabled: lsGet("wt_voice_enabled", true),
  selection: lsGet("wt_exercise_selection", {}), // { [dayType]: { [exId]: boolean } }
  selectionOpen: false,
  cardioChoice: lsGet("wt_cardio_choice", {}), // { [dayType]: optionKey }
  cardioConfig: lsGet("wt_cardio_config", {}), // { "dayType:optionKey:phaseKey": { field: value } }
  cardioEditOpen: {}, // { "dayType:optionKey": boolean }
  substituted: lsGet("wt_substituted", {}), // { [exId]: true }
  profile: lsGet("wt_profile", null),
  profileFormOpen: false,
  profileForm: lsGet("wt_profile_form", {
    height: 170,
    weight: 70,
    age: 30,
    gender: "male",
    experience: "중급",
    minutes: 60,
    goal: "건강유지",
    issues: [],
  }),

  order: lsGet("wt_exercise_order", {}), // { [dayType]: [exId, exId, ...] }
};

const DEFAULT_UNSELECTED = ["woodchop", "bulgarian", "calfraise"];

// v16 루틴 마이그레이션: 기존에 저장된 중량은 가능한 범위에서 유지하되
// 새 3세트/2세트 구성에 맞춰 세트 수와 선택 상태를 한 번 정리합니다.
(function migrateToFullBodyCardioSplit() {
  const VERSION_KEY = "wt_program_version";
  const VERSION = 16;
  if (lsGet(VERSION_KEY, 0) >= VERSION) return;

  const migratedConfigs = { ...state.configs };
  EXERCISES.upper.forEach((ex) => {
    const old = state.configs[ex.id];
    const desired = ex.sets.map((set) => ({ ...set }));
    if (old && Array.isArray(old.sets) && old.sets.length) {
      const source = old.sets.length > desired.length ? old.sets.slice(-desired.length) : old.sets;
      source.forEach((set, i) => {
        if (!desired[i]) return;
        desired[i] = {
          ...desired[i],
          value: set.value !== undefined ? set.value : desired[i].value,
          reps: set.reps !== undefined ? set.reps : desired[i].reps,
          rest: set.rest !== undefined ? set.rest : desired[i].rest,
        };
      });
    }
    migratedConfigs[ex.id] = { workSec: ex.defaultWorkSec || DEFAULT_WORK_SECONDS, sets: desired };
  });
  state.configs = migratedConfigs;
  state.selection = { ...state.selection, upper: {} };
  state.order = { ...state.order, upper: EXERCISES.upper.map((e) => e.id) };
  lsSet("wt_exercise_configs", state.configs);
  lsSet("wt_exercise_selection", state.selection);
  lsSet("wt_exercise_order", state.order);
  lsSet(VERSION_KEY, VERSION);
})();

function isSelected(dayType, exId) {
  const stored = state.selection[dayType];
  if (stored && Object.prototype.hasOwnProperty.call(stored, exId)) return stored[exId];
  return !DEFAULT_UNSELECTED.includes(exId);
}

function toggleSelection(dayType, exId) {
  const next = { ...state.selection, [dayType]: { ...(state.selection[dayType] || {}), [exId]: !isSelected(dayType, exId) } };
  state.selection = next;
  lsSet("wt_exercise_selection", next);
  render();
}

function getOrder(dayType) {
  const natural = EXERCISES[dayType].map((e) => e.id);
  const stored = state.order[dayType];
  if (!stored) return natural;
  const known = stored.filter((id) => natural.includes(id));
  const missing = natural.filter((id) => !known.includes(id));
  return [...known, ...missing];
}

function getOrderedExercises(dayType) {
  const byId = {};
  EXERCISES[dayType].forEach((e) => {
    byId[e.id] = e;
  });
  return getOrder(dayType)
    .map((id) => byId[id])
    .filter(Boolean);
}

function moveExercise(dayType, exId, dir) {
  const cur = getOrder(dayType);
  const idx = cur.indexOf(exId);
  const swapIdx = idx + dir;
  if (idx === -1 || swapIdx < 0 || swapIdx >= cur.length) return;
  const next = [...cur];
  [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
  const updated = { ...state.order, [dayType]: next };
  state.order = updated;
  lsSet("wt_exercise_order", updated);
  render();
}

function cardioChoiceStorageKey(dayType) {
  return dayType === "lower" ? `${dayType}:${getDayLabel(state.selectedDate)}` : dayType;
}

function getCardioChoice(dayType) {
  const options = CARDIO_OPTIONS[dayType] || [];
  if (!options.length) return null;
  const storageKey = cardioChoiceStorageKey(dayType);
  if (state.cardioChoice[storageKey]) return state.cardioChoice[storageKey];
  // 기본 배치: 화/토 트레드밀, 목 트레드밀 30분 + 스텝밀 30분
  if (dayType === "lower" && getDayLabel(state.selectedDate) === "목") return "mixed5050";
  return options[0].key;
}

function setCardioChoiceFor(dayType, key) {
  const storageKey = cardioChoiceStorageKey(dayType);
  const next = { ...state.cardioChoice, [storageKey]: key };
  state.cardioChoice = next;
  lsSet("wt_cardio_choice", next);
  render();
}

function cardioFieldKey(dayType, optionKey, phaseKey) {
  return `${dayType}:${optionKey}:${phaseKey}`;
}

function getCardioFields(dayType, optionKey, phase) {
  const key = cardioFieldKey(dayType, optionKey, phase.key);
  const stored = state.cardioConfig[key];
  return stored ? { ...phase.fields, ...stored } : phase.fields;
}

function updateCardioField(dayType, optionKey, phaseKey, fieldName, rawValue) {
  const key = cardioFieldKey(dayType, optionKey, phaseKey);
  const next = { ...state.cardioConfig, [key]: { ...(state.cardioConfig[key] || {}), [fieldName]: rawValue === "" ? "" : Number(rawValue) } };
  state.cardioConfig = next;
  lsSet("wt_cardio_config", next);
  render();
}

function buildCardioDetail(type, fields, isMain) {
  if (type === "treadmill") {
    if (isMain) {
      return `경사 ${fields.highIncline}%·${fields.highSpeed}km/h ${Math.round(fields.highSeconds / 60)}분 ↔ 경사 ${fields.lowIncline}%·${fields.lowSpeed}km/h ${Math.round(fields.lowSeconds / 60)}분, ${fields.reps}회 반복`;
    }
    return `경사 ${fields.incline}% · 시속 ${fields.speed}km`;
  }
  if (type === "bike") {
    if (isMain) {
      return `${fields.highWatts}W ${Math.round(fields.highSeconds / 60)}분 ↔ ${fields.lowWatts}W ${Math.round(fields.lowSeconds / 60)}분, ${fields.reps}회 반복`;
    }
    return `${fields.watts}W`;
  }
  if (type === "stairs") {
    if (isMain) {
      return `레벨 ${fields.highLevel} ${Math.round(fields.highSeconds / 60)}분 ↔ 레벨 ${fields.lowLevel} ${Math.round(fields.lowSeconds / 60)}분, ${fields.reps}회 반복`;
    }
    return `레벨 ${fields.level}`;
  }
  return "";
}

function toggleSubstitute(exId) {
  const next = { ...state.substituted, [exId]: !state.substituted[exId] };
  state.substituted = next;
  lsSet("wt_substituted", next);
  render();
}

// 대체 운동이 켜져 있으면 이름/팁/호흡/세트 구성을 대체 운동 데이터로 교체 (id는 그대로 유지)
function getExDisplay(ex) {
  if (state.substituted[ex.id] && ex.substitutes && ex.substitutes[0]) {
    return { ...ex, ...ex.substitutes[0] };
  }
  return ex;
}

function computeCalorieTarget(p) {
  const bmr =
    p.gender === "male"
      ? 10 * p.weight + 6.25 * p.height - 5 * p.age + 5
      : 10 * p.weight + 6.25 * p.height - 5 * p.age - 161;
  const tdee = bmr * 1.4;
  let target = tdee;
  if (p.goal === "체중감량") target = tdee - 500;
  else if (p.goal === "근육증강") target = tdee + 300;
  return Math.round(target);
}

function applyProfile(p) {
  const factor = p.experience === "초보" ? 0.7 : p.experience === "고급" ? 1.15 : 1.0;
  const newConfigs = { ...state.configs };
  Object.values(EXERCISES)
    .flat()
    .forEach((ex) => {
      if (ex.unit === "kg") {
        const scaledSets = ex.sets.map((s) => ({
          ...s,
          value: s.value != null ? Math.max(1, Math.round(s.value * factor)) : s.value,
        }));
        newConfigs[ex.id] = { workSec: ex.defaultWorkSec || DEFAULT_WORK_SECONDS, sets: scaledSets };
      }
    });

  const disableIds = [];
  if (p.issues.includes("허리디스크")) disableIds.push("rdl", "hangingraise");
  if (p.issues.includes("무릎")) disableIds.push("legpress");
  if (p.minutes <= 30) disableIds.push("flye", "ohp", "lateral", "reardelt");
  else if (p.minutes <= 45) disableIds.push("flye");

  const newSelection = { ...state.selection };
  ["upper", "lower", "rest"].forEach((dt) => {
    const dayObj = { ...(newSelection[dt] || {}) };
    disableIds.forEach((id) => {
      dayObj[id] = false;
    });
    newSelection[dt] = dayObj;
  });

  state.configs = newConfigs;
  state.selection = newSelection;
  lsSet("wt_exercise_configs", newConfigs);
  lsSet("wt_exercise_selection", newSelection);

  const calorieTarget = computeCalorieTarget(p);
  const nextProfile = { ...p, calorieTarget };
  state.profile = nextProfile;
  lsSet("wt_profile", nextProfile);
  state.profileFormOpen = false;
  render();
}

// migrate legacy per-exercise weight-only storage into configs
(function migrateLegacyWeights() {
  try {
    const oldWeights = lsGet("wt_custom_weights", null);
    if (!oldWeights) return;
    let changed = false;
    Object.keys(oldWeights).forEach((id) => {
      if (oldWeights[id] === "" || oldWeights[id] == null) return;
      if (!state.configs[id]) state.configs[id] = {};
      if (state.configs[id].weight === undefined) {
        state.configs[id].weight = Number(oldWeights[id]);
        changed = true;
      }
    });
    if (changed) lsSet("wt_exercise_configs", state.configs);
  } catch (e) {}
})();

// ---------- Exercise config helpers ----------
function configKey(ex) {
  return state.substituted[ex.id] ? `${ex.id}:sub` : ex.id;
}

function getDefaultConfig(ex) {
  const disp = getExDisplay(ex);
  return {
    workSec: disp.defaultWorkSec || DEFAULT_WORK_SECONDS,
    sets: disp.sets.map((s) => ({ value: s.value, reps: s.reps, rest: s.rest })),
  };
}

function getConfig(ex) {
  const stored = state.configs[configKey(ex)];
  const def = getDefaultConfig(ex);
  if (!stored) return def;
  return {
    workSec: stored.workSec != null && stored.workSec !== "" ? stored.workSec : def.workSec,
    sets: stored.sets && stored.sets.length ? stored.sets : def.sets,
  };
}

function getEffectiveSets(ex, cfg) {
  return (cfg || getConfig(ex)).sets;
}

function buildSummary(ex) {
  const disp = getExDisplay(ex);
  const cfg = getConfig(ex);
  const effSets = getEffectiveSets(ex, cfg);
  const valuesArr = effSets.map((s) => s.value);
  const valuesUniform = valuesArr.every((v) => v === valuesArr[0]);
  const repsArr = effSets.map((s) => s.reps);
  const repsUniform = repsArr.every((r) => r === repsArr[0]);
  const restArr = effSets.map((s) => s.rest);
  const restUniform = restArr.every((r) => r === restArr[0]);
  const repsText = disp.unit === "sec" ? "" : ` · ${repsUniform ? `${repsArr[0]}회` : `${repsArr.join("→")}회`}`;
  const weightText =
    disp.unit === "kg"
      ? `${valuesUniform ? valuesArr[0] : valuesArr.join("→")}kg`
      : disp.unit === "bodyweight"
      ? "맨몸"
      : "";
  const restText = ` · 휴식${restUniform ? `${restArr[0]}` : restArr.join("→")}초`;
  return `${weightText}${repsText} · ${effSets.length}세트${restText}`;
}

function saveExerciseConfig(exId, nextConfig) {
  state.configs = { ...state.configs, [exId]: nextConfig };
  lsSet("wt_exercise_configs", state.configs);
}

function updateWorkSec(ex, rawValue) {
  const cfg = getConfig(ex);
  saveExerciseConfig(configKey(ex), { ...cfg, workSec: rawValue === "" ? "" : Number(rawValue) });
  render();
}

function updateSetField(ex, setIdx, field, rawValue) {
  const cfg = getConfig(ex);
  const newSets = cfg.sets.map((s, i) => (i === setIdx ? { ...s, [field]: rawValue === "" ? "" : Number(rawValue) } : s));
  saveExerciseConfig(configKey(ex), { ...cfg, sets: newSets });
  render();
}

function trimCompletedForExercise(exId) {
  let changed = false;
  Object.keys(state.completed).forEach((k) => {
    if (k.startsWith(`${exId}-`)) {
      delete state.completed[k];
      changed = true;
    }
  });
  if (changed) saveProgress();
}

function addSet(ex) {
  const cfg = getConfig(ex);
  const last = cfg.sets[cfg.sets.length - 1];
  saveExerciseConfig(configKey(ex), { ...cfg, sets: [...cfg.sets, { ...last }] });
  render();
}

function removeSet(ex, setIdx) {
  const cfg = getConfig(ex);
  if (cfg.sets.length <= 1) return;
  const newSets = cfg.sets.filter((_, i) => i !== setIdx);
  saveExerciseConfig(configKey(ex), { ...cfg, sets: newSets });
  trimCompletedForExercise(ex.id);
  render();
}

// ---------- Voice guidance ----------
function speak(text) {
  if (!state.voiceEnabled) return;
  try {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const sentences = text
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    setTimeout(() => {
      try {
        const voices = window.speechSynthesis.getVoices();
        const koVoice = voices.find((v) => v.lang === "ko-KR") || voices.find((v) => v.lang && v.lang.startsWith("ko"));
        sentences.forEach((sentence) => {
          const u = new SpeechSynthesisUtterance(sentence);
          u.lang = "ko-KR";
          u.rate = 1.0;
          if (koVoice) u.voice = koVoice;
          window.speechSynthesis.speak(u);
        });
      } catch (e) {}
    }, 60);
  } catch (e) {}
}

// Chrome/Android는 speechSynthesis가 일정 시간 후 멈춰버리는 버그가 있어
// 주기적으로 pause/resume을 걸어서 음성 안내가 끊기지 않게 함
setInterval(() => {
  try {
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    }
  } catch (e) {}
}, 12000);

function toggleVoice() {
  state.voiceEnabled = !state.voiceEnabled;
  lsSet("wt_voice_enabled", state.voiceEnabled);
  if (!state.voiceEnabled && window.speechSynthesis) {
    try { window.speechSynthesis.cancel(); } catch (e) {}
  }
  render();
}

function announceSet(ex, setIdx) {
  const disp = getExDisplay(ex);
  const effSets = getEffectiveSets(ex);
  const set = effSets[setIdx];
  let detail;
  if (disp.unit === "kg") {
    detail = `${set.value}킬로 ${set.reps}회입니다`;
  } else if (disp.unit === "bodyweight") {
    detail = `맨몸 ${set.reps}회입니다`;
  } else {
    detail = `${set.value}초 유지입니다`;
  }
  if (setIdx === 0) {
    const tipPart = disp.tip ? ` ${disp.tip}` : "";
    const breathPart = disp.breath ? ` 숨은, ${disp.breath}.` : "";
    speak(`${disp.name}입니다.${tipPart}${breathPart} ${detail}.`);
  } else {
    speak(`${detail}.`);
  }
}

function announceRest(seconds) {
  speak(`${seconds}초 휴식입니다.`);
}

function loadDayState() {
  state.completed = lsGet(`wt_progress_${state.selectedDate}`, {});
  state.sessionStart = null;
  state.activeExerciseId = null;
  state.activeSetIdx = 0;
  state.queue = null;
  clearInterval(state.timerHandle);
  state.timer = null;
  clearInterval(state.elapsedHandle);
}

function saveProgress() {
  lsSet(`wt_progress_${state.selectedDate}`, state.completed);
}

function updateSummary(dateStr, isComplete) {
  if (isComplete) {
    state.summary[dateStr] = { calories: DAY_INFO[getDayType(dateStr)].calories };
  } else {
    delete state.summary[dateStr];
  }
  lsSet("wt_summary", state.summary);
}

// ---------- Render: root ----------
function render() {
  const app = document.getElementById("app");
  app.innerHTML = state.view === "calendar" ? calendarHTML() : dayHTML();
  attachHandlers();
}

// ---------- Calendar view ----------
function calendarHTML() {
  const year = state.calYear, month = state.calMonth;
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const monthKeys = Object.keys(state.summary).filter((k) => k.startsWith(`${year}-${pad(month + 1)}`));
  const completedDays = monthKeys.length;
  const totalCalories = monthKeys.reduce((a, k) => a + (state.summary[k]?.calories || 0), 0);

  const cellsHTML = cells.map((d, i) => {
    if (d === null) return `<div></div>`;
    const dateStr = toDateStr(year, month, d);
    const dType = DAY_TYPE[getDayLabel(dateStr)];
    const summary = state.summary[dateStr];
    const isToday = dateStr === todayStr();
    return `<button class="calCell ${isToday ? "today" : ""}" data-date="${dateStr}">
        <span class="mono" style="font-size:13px">${d}</span>
        <div style="width:5px;height:5px;border-radius:50%;background:${DAY_INFO[dType].color}"></div>
        ${summary ? `<span class="mono" style="font-size:9px;color:#4CAF7D">${summary.calories}kcal</span>` : ""}
      </button>`;
  }).join("");

  return `
    <div style="padding:20px 16px 32px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <div style="font-size:12px;letter-spacing:2px;color:#8A93A3;font-weight:700">WEEKLY PROGRAM</div>
          <div style="font-family:Arial Black, sans-serif;font-size:23px;margin:2px 0 16px">운동 달력</div>
        </div>
        <button id="openProfileForm" style="background:#1E222A;border:1px solid #333944;border-radius:8px;padding:8px 12px;color:#ECEEF2;font-size:12px;cursor:pointer">👤 프로필로 재구성</button>
      </div>
      ${
        state.profile
          ? `<div style="background:#1E222A;border:1px solid #262B34;border-radius:10px;padding:10px 14px;margin-bottom:12px;font-size:13px;color:#8A93A3">
              ${state.profile.gender === "male" ? "남성" : "여성"} · ${state.profile.age}세 · ${state.profile.height}cm · ${state.profile.weight}kg · ${state.profile.experience} · ${state.profile.goal} — 목표 칼로리 <span style="color:#F5C518;font-weight:700">${state.profile.calorieTarget.toLocaleString()}kcal/일</span>
            </div>`
          : ""
      }
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
        <button class="navBtn" id="prevMonth">‹</button>
        <div class="mono" style="font-size:17px;font-weight:700">${year}년 ${month + 1}월</div>
        <button class="navBtn" id="nextMonth">›</button>
      </div>
      <div class="card" style="padding:10px 14px;margin-bottom:16px;display:flex;justify-content:space-between">
        <div style="font-size:13px;color:#8A93A3">이번 달 완료 <span style="color:#4CAF7D;font-weight:700">${completedDays}일</span></div>
        <div style="font-size:13px;color:#8A93A3">총 소모 <span style="color:#F5C518;font-weight:700">약 ${totalCalories.toLocaleString()}kcal</span></div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:6px">
        ${WEEKDAY_MAP.map((w) => `<div style="text-align:center;font-size:12px;color:#8A93A3;padding:4px 0">${w}</div>`).join("")}
      </div>
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px">${cellsHTML}</div>
      <div style="display:flex;gap:14px;margin-top:16px;font-size:12px;color:#8A93A3">
        <span style="display:flex;align-items:center;gap:4px"><span style="width:6px;height:6px;border-radius:50%;background:${DAY_INFO.upper.color};display:inline-block"></span> 전신 웨이트</span>
        <span style="display:flex;align-items:center;gap:4px"><span style="width:6px;height:6px;border-radius:50%;background:${DAY_INFO.lower.color};display:inline-block"></span> 유산소</span>
        <span style="display:flex;align-items:center;gap:4px"><span style="width:6px;height:6px;border-radius:50%;background:${DAY_INFO.rest.color};display:inline-block"></span> 휴식</span>
      </div>
    </div>
    ${profileFormModalHTML()}`;
}

function profileFormModalHTML() {
  if (!state.profileFormOpen) return "";
  const f = state.profileForm;
  const pickerRow = (label, options, key) => `
    <div style="margin-bottom:14px">
      <div style="font-size:12px;color:#8A93A3;margin-bottom:6px">${label}</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        ${options
          .map(
            (opt) =>
              `<button data-profilefield="${key}|${opt}" style="background:${String(f[key]) === String(opt) ? "#F5C518" : "#262B34"};color:${String(f[key]) === String(opt) ? "#14161A" : "#ECEEF2"};border:1px solid #333944;border-radius:8px;padding:7px 12px;font-size:13px;font-weight:600;cursor:pointer">${opt}</button>`
          )
          .join("")}
      </div>
    </div>`;
  const numberField = (label, key) => `
    <div style="margin-bottom:14px">
      <div style="font-size:12px;color:#8A93A3;margin-bottom:6px">${label}</div>
      <input type="number" data-profilenum="${key}" value="${f[key]}" style="width:100%;background:#14161A;border:1px solid #333944;border-radius:8px;color:#ECEEF2;padding:10px 12px;font-family:ui-monospace,monospace;font-size:15px" />
    </div>`;
  const issueOptions = ["허리디스크", "고혈압", "무릎", "없음"];
  return `
    <div style="position:fixed;inset:0;background:rgba(0,0,0,0.75);display:flex;align-items:center;justify-content:center;z-index:100;padding:20px">
      <div style="background:#1E222A;border:1px solid #333944;border-radius:14px;padding:20px;max-width:400px;width:100%;max-height:85vh;overflow-y:auto">
        <div style="font-size:18px;font-weight:700;margin-bottom:14px">프로필로 루틴 재구성</div>
        ${numberField("키(cm)", "height")}
        ${numberField("몸무게(kg)", "weight")}
        ${numberField("나이", "age")}
        ${pickerRow("성별", ["male", "female"], "gender")}
        ${pickerRow("운동 경험", ["초보", "중급", "고급"], "experience")}
        ${pickerRow("하루 가능 시간", [30, 45, 60, 90], "minutes")}
        ${pickerRow("목적", ["건강유지", "체중감량", "근육증강"], "goal")}
        <div style="margin-bottom:14px">
          <div style="font-size:12px;color:#8A93A3;margin-bottom:6px">특이사항 (해당되는 것 모두 선택)</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            ${issueOptions
              .map(
                (opt) =>
                  `<button data-profileissue="${opt}" style="background:${f.issues.includes(opt) ? "#D6534A" : "#262B34"};color:#ECEEF2;border:1px solid #333944;border-radius:8px;padding:7px 12px;font-size:13px;font-weight:600;cursor:pointer">${opt}</button>`
              )
              .join("")}
          </div>
        </div>
        <div style="display:flex;gap:8px;margin-top:8px">
          <button id="profileCancelBtn" style="flex:1;background:#262B34;border:1px solid #333944;border-radius:10px;padding:12px;color:#ECEEF2;font-size:14px;cursor:pointer">취소</button>
          <button id="profileApplyBtn" style="flex:2;background:#F5C518;border:none;border-radius:10px;padding:12px;color:#14161A;font-size:15px;font-weight:700;cursor:pointer">적용하기</button>
        </div>
      </div>
    </div>`;
}

// ---------- Day view ----------
function exerciseCardHTML(ex, index) {
  const disp = getExDisplay(ex);
  const isSubbed = !!state.substituted[ex.id];
  const isOpen = state.expanded[ex.id] !== false;
  const cfg = getConfig(ex);
  const effSets = getEffectiveSets(ex, cfg);
  const doneCount = effSets.filter((_, idx) => state.completed[`${ex.id}-${idx}`]).length;
  const exDone = doneCount === effSets.length;
  const isActive = state.activeExerciseId === ex.id;
  const isResting = isActive && state.timer && state.timer.kind === "setRest" && state.timer.exId === ex.id;

  const valuesArr = effSets.map((s) => s.value);
  const valuesUniform = valuesArr.every((v) => v === valuesArr[0]);
  const repsArr = effSets.map((s) => s.reps);
  const repsUniform = repsArr.every((r) => r === repsArr[0]);
  const restArr = effSets.map((s) => s.rest);
  const restUniform = restArr.every((r) => r === restArr[0]);
  const repsText = disp.unit === "sec" ? "" : ` · ${repsUniform ? `${repsArr[0]}회` : `${repsArr.join("→")}회`}`;
  const weightText =
    disp.unit === "kg"
      ? `${valuesUniform ? valuesArr[0] : valuesArr.join("→")}kg`
      : disp.unit === "bodyweight"
      ? "맨몸"
      : "";
  const restText = ` · 휴식${restUniform ? `${restArr[0]}` : restArr.join("→")}초`;
  const summaryText = `${weightText}${repsText} · ${effSets.length}세트${restText}`;

  const tipHTML = disp.tip
    ? `<div style="background:#14161A;border:1px solid #262B34;border-radius:8px;padding:8px 10px;margin-bottom:10px;font-size:14px;color:#B8BFC9;line-height:1.5">💡 ${disp.tip}${disp.breath ? `<div style="margin-top:6px;color:#8FBFA8">🫁 호흡: ${disp.breath}</div>` : ""}</div>`
    : "";

  const subBtnHTML =
    ex.substitutes && ex.substitutes.length > 0 && !isActive
      ? `<button data-togglesub="${ex.id}" style="display:flex;align-items:center;gap:6px;background:${isSubbed ? "#3E8FB0" : "#262B34"};border:1px solid #333944;border-radius:6px;padding:6px 10px;color:${isSubbed ? "#14161A" : "#ECEEF2"};font-size:13px;cursor:pointer;margin-bottom:10px">🔁 ${isSubbed ? "원래 운동으로 되돌리기" : `대체 운동으로 (${ex.substitutes[0].name})`}</button>`
      : "";

  const fieldStyle = "width:100%;background:#14161A;border:1px solid #333944;border-radius:6px;color:#ECEEF2;padding:6px 4px;font-family:ui-monospace,monospace;font-size:14px;text-align:center";

  let setsHTML = "";
  if (!isActive) {
    const headerHTML =
      disp.unit !== "sec"
        ? `<div style="display:flex;font-size:11px;color:#8A93A3;margin-bottom:4px;padding-left:46px">
            <div style="flex:1;text-align:center">${disp.unit === "kg" ? "무게(kg)" : ""}</div>
            <div style="flex:1;text-align:center">회수</div>
            <div style="flex:1;text-align:center">휴식(초)</div>
            <div style="width:22px"></div>
          </div>`
        : "";
    const rowsHTML = effSets
      .map(
        (s, idx) => `
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
          <div style="width:40px;font-size:12px;color:#8A93A3;flex-shrink:0">${idx + 1}세트</div>
          ${disp.unit === "kg" ? `<input type="number" data-setfield="${ex.id}|${idx}|value" value="${s.value ?? ""}" style="${fieldStyle}" />` : ""}
          ${disp.unit !== "sec" ? `<input type="number" data-setfield="${ex.id}|${idx}|reps" value="${s.reps ?? ""}" style="${fieldStyle}" />` : ""}
          <input type="number" data-setfield="${ex.id}|${idx}|rest" value="${s.rest ?? ""}" style="${fieldStyle}" />
          <button data-removeset="${ex.id}|${idx}" ${effSets.length <= 1 ? "disabled" : ""} style="width:22px;height:22px;flex-shrink:0;background:none;border:none;color:${effSets.length <= 1 ? "#3A3F49" : "#8A93A3"};cursor:${effSets.length <= 1 ? "default" : "pointer"};font-size:16px">✕</button>
        </div>`
      )
      .join("");
    setsHTML = `<div style="margin-bottom:12px">
        ${headerHTML}
        ${rowsHTML}
        <div style="display:flex;gap:8px;align-items:center;margin-top:8px">
          <button data-addset="${ex.id}" style="background:#262B34;border:1px solid #333944;border-radius:6px;padding:6px 10px;color:#ECEEF2;font-size:13px;cursor:pointer">+ 세트 추가</button>
          <label style="font-size:12px;color:#8A93A3;display:flex;align-items:center;gap:6px;margin-left:auto">운동시간(초)<input type="number" data-workfor="${ex.id}" value="${cfg.workSec ?? ""}" style="width:50px;background:#14161A;border:1px solid #333944;border-radius:6px;color:#ECEEF2;padding:4px 6px;font-family:ui-monospace,monospace;font-size:13px;text-align:center" /></label>
        </div>
      </div>`;
  }

  let bodyHTML = "";
  if (isActive && isResting) {
    bodyHTML = `<div style="text-align:center;padding:16px 0;color:#8A93A3;font-size:15px">SET ${state.activeSetIdx + 1} 완료 · 휴식 중 · 하단 진행바 참고</div>`;
  } else if (isActive) {
    const s = effSets[state.activeSetIdx];
    let targetText = "";
    if (disp.unit === "kg") targetText = `${s.value}kg × ${s.reps}회`;
    else if (disp.unit === "bodyweight") targetText = `맨몸 × ${s.reps}회`;
    else targetText = `${s.value}초 유지`;
    bodyHTML = `
      <div style="text-align:center;padding:6px 0">
        <div style="font-size:13px;color:#8A93A3;letter-spacing:1px">SET ${state.activeSetIdx + 1} / ${effSets.length} · 진행 중</div>
        <div class="mono" style="font-size:29px;font-weight:700;color:#F5C518;margin-top:4px">${targetText}</div>
        <div style="font-size:13px;color:#8A93A3;margin-top:4px">${cfg.workSec}초 자동 진행 · 하단 진행바 참고</div>
      </div>`;
  } else if (exDone) {
    bodyHTML = `<div style="display:flex;align-items:center;justify-content:space-between">
        <span style="font-size:15px;color:#4CAF7D;display:flex;align-items:center;gap:6px">✓ 완료</span>
        <button data-resetex="${ex.id}" style="background:none;border:none;color:#8A93A3;font-size:14px;cursor:pointer">다시하기</button>
      </div>`;
  } else {
    bodyHTML = `<div style="display:flex;gap:8px">
        <button data-startex="${ex.id}" style="flex:1;background:#262B34;border:1px solid #333944;border-radius:8px;padding:12px;font-size:15px;font-weight:600;color:#ECEEF2;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px">▶ ${doneCount > 0 ? `이어하기 (${doneCount}/${effSets.length})` : "이 운동만"}</button>
        <button data-startblockfrom="${ex.id}" ${state.activeExerciseId ? "disabled" : ""} style="flex:1;background:${state.activeExerciseId ? "#1E222A" : "#3E8FB0"};border:none;border-radius:8px;padding:12px;font-size:15px;font-weight:600;color:${state.activeExerciseId ? "#8A93A3" : "#14161A"};cursor:${state.activeExerciseId ? "default" : "pointer"};display:flex;align-items:center;justify-content:center;gap:6px">⏩ 여기부터 자동진행</button>
      </div>`;
  }

  return `<div class="card" style="border-color:${exDone ? "#4CAF7D" : isActive ? "#F5C518" : "#262B34"}">
      <div style="display:flex;align-items:center;gap:10px;padding:12px 14px;cursor:pointer" data-toggleexpand="${ex.id}">
        <div class="mono" style="font-size:15px;color:#F5C518;width:24px">${pad(index + 1)}</div>
        <div style="flex:1">
          <div style="font-weight:700;font-size:17px">${disp.name}${isSubbed ? '<span style="margin-left:6px;font-size:11px;color:#3E8FB0;border:1px solid #3E8FB0;border-radius:4px;padding:1px 5px">대체됨</span>' : ""}</div>
          <div style="font-size:13px;color:#8A93A3;margin-top:2px">${summaryText}</div>
        </div>
        ${exDone ? '<span style="color:#4CAF7D">✓</span>' : ""}
        <span style="color:#8A93A3">${isOpen ? "⌃" : "⌄"}</span>
      </div>
      ${isOpen ? `<div style="padding:0 14px 14px">${tipHTML}${subBtnHTML}${setsHTML}${bodyHTML}</div>` : ""}
    </div>`;
}

function dayHTML() {
  const dayType = getDayType(state.selectedDate);
  const allExercises = getOrderedExercises(dayType);
  const exercises = allExercises.filter((ex) => isSelected(dayType, ex.id));
  const info = DAY_INFO[dayType];
  const totalSets = exercises.reduce((a, ex) => a + getConfig(ex).sets.length, 0);
  const doneSets = Object.values(state.completed).filter(Boolean).length;
  const dateObj = parseLocalDate(state.selectedDate);
  const dateLabel = `${dateObj.getMonth() + 1}월 ${dateObj.getDate()}일 (${getDayLabel(state.selectedDate)})`;
  const blockRunning = !!state.activeExerciseId;
  const progressHTML = dayType === "upper"
    ? `<div style="margin-top:14px;height:6px;background:#262B34;border-radius:3px;overflow:hidden"><div style="width:${totalSets ? (doneSets / totalSets) * 100 : 0}%;height:100%;background:#4CAF7D;transition:width .3s"></div></div><div style="font-size:12px;color:#8A93A3;margin-top:6px">${doneSets} / ${totalSets} 세트 완료</div>`
    : dayType === "lower"
      ? `<div style="margin-top:14px;font-size:12px;color:${state.completed.cardio ? "#4CAF7D" : "#8A93A3"}">${state.completed.cardio ? "✓ 오늘 유산소 60분 완료" : "유산소 60분을 완료하면 달력에 기록됩니다."}</div>`
      : `<div style="margin-top:14px;font-size:12px;color:#8A93A3">회복일 · 운동 기록 없음</div>`;

  const selectionHTML = dayType === "upper" ? `
    <div class="card">
      <div data-toggleselection style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;cursor:pointer">
        <div style="font-size:14px;font-weight:700">운동 선택</div>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:12px;color:#8A93A3">${exercises.length}/${allExercises.length}개 선택됨</span>
          <span style="color:#8A93A3">${state.selectionOpen ? "⌃" : "⌄"}</span>
        </div>
      </div>
      ${
        state.selectionOpen
          ? `<div style="padding:0 14px 12px;display:flex;flex-direction:column;gap:8px">
              ${allExercises
                .map((ex, idx) => {
                  const checked = isSelected(dayType, ex.id);
                  return `<div style="display:flex;align-items:flex-start;gap:10px;padding:6px 0;border-bottom:1px solid #262B34">
                      <label data-toggleselex="${ex.id}" style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;flex:1">
                        <div style="width:20px;height:20px;margin-top:1px;border-radius:5px;flex-shrink:0;border:${checked ? "none" : "1px solid #545C6B"};background:${checked ? "#4CAF7D" : "transparent"};display:flex;align-items:center;justify-content:center">${checked ? '<span style="color:#14161A;font-size:12px">✓</span>' : ""}</div>
                        <div style="flex:1">
                          <div style="font-size:14px;font-weight:600;color:${checked ? "#ECEEF2" : "#8A93A3"}">${ex.name}</div>
                          <div style="font-size:12px;color:#8A93A3;margin-top:2px">${buildSummary(ex)}</div>
                        </div>
                      </label>
                      <div style="display:flex;flex-direction:column;gap:2px;flex-shrink:0">
                        <button data-moveex="${ex.id}|-1" ${idx === 0 ? "disabled" : ""} style="width:24px;height:20px;background:none;border:none;color:${idx === 0 ? "#3A3F49" : "#8A93A3"};cursor:${idx === 0 ? "default" : "pointer"};font-size:12px">⌃</button>
                        <button data-moveex="${ex.id}|1" ${idx === allExercises.length - 1 ? "disabled" : ""} style="width:24px;height:20px;background:none;border:none;color:${idx === allExercises.length - 1 ? "#3A3F49" : "#8A93A3"};cursor:${idx === allExercises.length - 1 ? "default" : "pointer"};font-size:12px">⌄</button>
                      </div>
                    </div>`;
                })
                .join("")}
            </div>`
          : ""
      }
    </div>` : "";

  const cardioOptions = CARDIO_OPTIONS[dayType] || [];
  const cardioChoiceKey = cardioOptions.length ? getCardioChoice(dayType) : null;
  const activeCardioOption = cardioOptions.length ? (cardioOptions.find((o) => o.key === cardioChoiceKey) || cardioOptions[0]) : null;
  const cardioPhases = activeCardioOption ? activeCardioOption.phases : [];
  const cardioType = activeCardioOption ? activeCardioOption.type : null;
  const cardioEditKey = `${dayType}:${cardioChoiceKey || "none"}`;
  const isCardioEditOpen = !!state.cardioEditOpen[cardioEditKey];
  const cardioFieldStyle = "width:64px;background:#14161A;border:1px solid #333944;border-radius:6px;color:#ECEEF2;padding:5px 4px;font-family:ui-monospace,monospace;font-size:13px;text-align:center;display:block;margin-top:3px";
  const cardioTabsHTML =
    cardioOptions.length > 1
      ? `<div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap">
          ${cardioOptions
            .map(
              (opt, i) =>
                `<button data-cardiotab="${opt.key}" style="background:${opt.key === cardioChoiceKey ? "#F5C518" : "#262B34"};color:${opt.key === cardioChoiceKey ? "#14161A" : "#ECEEF2"};border:1px solid #333944;border-radius:999px;padding:5px 10px;font-size:12px;font-weight:600;cursor:pointer">${i + 1}순위 · ${opt.label}</button>`
            )
            .join("")}
        </div>`
      : "";

  const cardioEditFieldHTML = (phase, fields, isMain) => {
    if (!isCardioEditOpen) return "";
    const inp = (label, fieldName, value) =>
      `<label style="font-size:11px;color:#8A93A3">${label}<input type="number" data-cardiofield="${dayType}|${cardioChoiceKey}|${phase.key}|${fieldName}" value="${value}" style="${cardioFieldStyle}" /></label>`;
    let inputs = "";
    const phaseType = phase.type || cardioType;
    if (phaseType === "treadmill") {
      inputs = isMain
        ? inp("고강도 경사(%)", "highIncline", fields.highIncline) + inp("고강도 속도", "highSpeed", fields.highSpeed) + inp("저강도 경사(%)", "lowIncline", fields.lowIncline) + inp("저강도 속도", "lowSpeed", fields.lowSpeed)
        : inp("경사(%)", "incline", fields.incline) + inp("속도(km/h)", "speed", fields.speed);
    } else if (phaseType === "bike") {
      inputs = isMain ? inp("고강도 W", "highWatts", fields.highWatts) + inp("저강도 W", "lowWatts", fields.lowWatts) : inp("목표 W", "watts", fields.watts);
    } else if (phaseType === "stairs") {
      inputs = isMain ? inp("고강도 레벨", "highLevel", fields.highLevel) + inp("저강도 레벨", "lowLevel", fields.lowLevel) : inp("레벨", "level", fields.level);
    }
    return `<div style="display:flex;gap:8px;flex-wrap:wrap;padding:8px 4px 0">${inputs}</div>`;
  };

  const cardioHTML = activeCardioOption ? `
    <div class="card" style="padding:14px;margin-top:4px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
        <div class="mono" style="font-size:14px;color:#3E8FB0;width:22px">${pad(exercises.length + 1)}</div>
        <div style="font-weight:700;font-size:16px;flex:1">유산소</div>
        <button data-togglecardioedit="${cardioEditKey}" style="background:none;border:none;color:#8A93A3;font-size:13px;cursor:pointer">${isCardioEditOpen ? "완료" : "✏️ 수정"}</button>
      </div>
      ${cardioTabsHTML}
      <div style="display:flex;flex-direction:column;gap:8px">
        ${cardioPhases
          .map((p) => {
            const fields = getCardioFields(dayType, cardioChoiceKey, p);
            const phaseType = p.type || cardioType;
            const isMain = p.key === "main" || fields.highIncline != null || fields.highLevel != null || fields.highWatts != null;
            const detail = buildCardioDetail(phaseType, fields, isMain);
            return `<div>
              <button data-cardio="${p.key}" style="display:flex;justify-content:space-between;align-items:center;background:#262B34;border:1px solid #333944;border-radius:8px;padding:10px 12px;color:#ECEEF2;cursor:pointer;text-align:left;width:100%">
                <div>
                  <div style="font-size:14px;font-weight:600">${p.label}</div>
                  <div style="font-size:12px;color:#8A93A3">${detail}</div>
                </div>
                <div class="mono" style="display:flex;align-items:center;gap:6px;color:#3E8FB0">${formatTime(p.seconds)} ▶</div>
              </button>
              ${cardioEditFieldHTML(p, fields, isMain)}
            </div>`;
          })
          .join("")}
      </div>
      <button data-startcardio="all" style="width:100%;margin-top:12px;background:#3E8FB0;border:none;border-radius:10px;padding:13px;font-size:15px;font-weight:700;color:#14161A;cursor:pointer">▶ ${activeCardioOption.label} 전체 자동 진행</button>
      ${state.completed.cardio ? '<div style="margin-top:10px;color:#4CAF7D;font-size:13px;font-weight:700">✓ 오늘 유산소 완료</div>' : ''}
    </div>` : dayType === "rest" ? `
      <div class="card" style="padding:24px 18px;text-align:center">
        <div style="font-size:28px;margin-bottom:8px">😴</div>
        <div style="font-size:18px;font-weight:700">오늘은 완전 휴식</div>
        <div style="font-size:13px;color:#8A93A3;margin-top:8px;line-height:1.6">웨이트와 유산소를 쉬고 회복에 집중하세요.</div>
      </div>` : "";

  return `
    <div style="padding-bottom:${state.timer ? 110 : 24}px">
      <div style="padding:20px 16px 12px;border-bottom:1px solid #262B34">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <button class="navBtn" id="backToCal" style="width:auto;padding:4px 10px;display:inline-flex;gap:4px;font-size:13px">‹ 달력</button>
          <button id="toggleVoice" style="width:auto;padding:4px 10px;display:inline-flex;gap:4px;font-size:13px;background:#1E222A;border:1px solid #262B34;border-radius:8px;color:${state.voiceEnabled ? "#F5C518" : "#8A93A3"};cursor:pointer;align-items:center">${state.voiceEnabled ? "🔊" : "🔇"} 음성 안내 ${state.voiceEnabled ? "켜짐" : "꺼짐"}</button>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div>
            <div style="font-size:12px;letter-spacing:2px;color:#8A93A3;font-weight:700">${dateLabel.toUpperCase()}</div>
            <div style="font-family:Arial Black, sans-serif;font-size:23px;margin-top:2px">${info.label}</div>
          </div>
          <div style="text-align:right">
            <div class="mono" id="elapsedDisplay" style="font-size:21px;color:#F5C518">${formatTime(0)}</div>
            <div style="font-size:11px;color:#8A93A3">운동 경과시간</div>
          </div>
        </div>
        <div style="display:flex;gap:8px;margin-top:12px">
          <div class="card" style="flex:1;padding:8px 10px;font-size:12px;color:#8A93A3">권장 소요시간 <span style="color:#ECEEF2;font-weight:700">${info.duration}분</span></div>
          <div class="card" style="flex:1;padding:8px 10px;font-size:12px;color:#8A93A3;display:flex;align-items:center;gap:4px">🔥 예상 소모 <span style="color:#ECEEF2;font-weight:700">약 ${info.calories}kcal</span></div>
        </div>
        ${progressHTML}
      </div>
      <div style="height:14px"></div>
      <div style="padding:0 16px;margin-bottom:10px">
        ${selectionHTML}
      </div>
      <div style="padding:0 16px;display:flex;flex-direction:column;gap:8px">
        ${exercises.length > 0 ? `<button data-blockstart="all" ${blockRunning ? "disabled" : ""} style="width:100%;background:${blockRunning ? "#1E222A" : "#F5C518"};border:none;border-radius:10px;padding:14px;font-size:16px;font-weight:700;color:${blockRunning ? "#8A93A3" : "#14161A"};cursor:${blockRunning ? "default" : "pointer"};display:flex;align-items:center;justify-content:center;gap:8px">▶ ${info.label} 오늘 운동 전체 자동 진행 (${exercises.length}종목)</button>` : ""}
        ${dayType === "upper" ? '<div style="font-size:12px;color:#8A93A3;text-align:center;margin-top:-2px">세트별 작업과 휴식시간을 자동으로 이어서 진행합니다. 아래에서 운동 하나씩 시작할 수도 있어요.</div>' : ''}
      </div>
      <div style="height:4px"></div>
      <div style="padding:0 16px;display:flex;flex-direction:column;gap:10px">
        ${exercises.map((ex, i) => exerciseCardHTML(ex, i)).join("")}
        ${cardioHTML}
        <button id="resetDay" style="margin-top:6px;margin-bottom:20px;background:transparent;border:1px solid #333944;color:#8A93A3;border-radius:8px;padding:10px;font-size:13px;display:flex;align-items:center;justify-content:center;gap:6px;cursor:pointer">↺ 이 날짜 기록 초기화</button>
      </div>
      ${state.timer ? timerBarHTML() : ""}
    </div>`;
}

function timerBarHTML() {
  const t = state.timer;
  const isSetTimer = t.kind === "setWork" || t.kind === "setRest";
  let label = "";
  if (isSetTimer) {
    const dayType = getDayType(state.selectedDate);
    const ex = EXERCISES[dayType].find((e) => e.id === t.exId);
    const setNum = t.setIdx + 1;
    if (t.kind === "setWork") label = `${ex ? ex.name : ""} · SET ${setNum} 진행 중`;
    else label = t.isLastSet ? "다음 운동 전 휴식" : `${ex ? ex.name : ""} · SET ${setNum} 휴식`;
  } else {
    label = t.label || "";
  }
  const elapsed = t.total - t.remaining;
  const display = isSetTimer ? `${elapsed}초` : formatTime(t.remaining);
  const fillPct = isSetTimer ? (elapsed / t.total) * 100 : (t.remaining / t.total) * 100;
  const color = t.remaining <= 5 ? "#D6534A" : t.kind === "setRest" ? "#3E8FB0" : "#F5C518";
  return `<div class="restBar" id="restBar">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="font-size:13px;color:#8A93A3;letter-spacing:1px">${label.toUpperCase()}${state.paused ? " · 일시정지" : ""}</span>
        <div style="display:flex;gap:14px">
          <button id="pauseTimer" style="background:none;border:none;color:${state.paused ? "#F5C518" : "#8A93A3"};font-size:13px;cursor:pointer">${state.paused ? "▶ 재개" : "❙❙ 일시정지"}</button>
          <button id="skipTimer" style="background:none;border:none;color:#8A93A3;font-size:13px;cursor:pointer">건너뛰기</button>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:14px">
        <div class="mono" id="timerRemaining" style="font-size:33px;font-weight:700;color:${color};min-width:90px">${display}</div>
        <div style="flex:1;height:8px;background:#333944;border-radius:4px;overflow:hidden">
          <div id="timerBarFill" style="width:${fillPct}%;height:100%;background:${color};transition:width 1s linear"></div>
        </div>
      </div>
    </div>`;
}

// ---------- Timer logic ----------
function makeWorkTimer(ex, setIdx) {
  const cfg = getConfig(ex);
  const effSets = getEffectiveSets(ex, cfg);
  const set = effSets[setIdx];
  const nextSetIdx = setIdx + 1 < effSets.length ? setIdx + 1 : null;
  return { kind: "setWork", exId: ex.id, setIdx, restSec: set.rest, nextSetIdx, isLastSet: nextSetIdx === null, remaining: cfg.workSec, total: cfg.workSec };
}

function markSetComplete(exId, setIdx) {
  state.completed[`${exId}-${setIdx}`] = true;
  saveProgress();
  const dayType = getDayType(state.selectedDate);
  const totalSets = EXERCISES[dayType].filter((ex) => isSelected(dayType, ex.id)).reduce((a, ex) => a + getConfig(ex).sets.length, 0);
  const doneSets = Object.values(state.completed).filter(Boolean).length;
  updateSummary(state.selectedDate, doneSets === totalSets);
}

function updateTimerBarDOM() {
  const t = state.timer;
  if (!t) return;
  const isSetTimer = t.kind === "setWork" || t.kind === "setRest";
  const elapsed = t.total - t.remaining;
  const display = isSetTimer ? `${elapsed}초` : formatTime(t.remaining);
  const fillPct = isSetTimer ? (elapsed / t.total) * 100 : (t.remaining / t.total) * 100;
  const color = t.remaining <= 5 ? "#D6534A" : t.kind === "setRest" ? "#3E8FB0" : "#F5C518";
  const remEl = document.getElementById("timerRemaining");
  const fillEl = document.getElementById("timerBarFill");
  if (remEl) { remEl.textContent = display; remEl.style.color = color; }
  if (fillEl) { fillEl.style.width = `${fillPct}%`; fillEl.style.background = color; }
}

function startTimerInterval() {
  clearInterval(state.timerHandle);
  state.paused = false;
  state.timerHandle = setInterval(() => {
    if (state.paused) return;
    state.timer.remaining -= 1;
    if (state.timer.remaining <= 0) {
      clearInterval(state.timerHandle);
      finishActiveTimer();
      return;
    }
    updateTimerBarDOM();
  }, 1000);
}

function togglePause() {
  if (!state.timer) return;
  if (state.paused) {
    startTimerInterval();
  } else {
    state.paused = true;
    clearInterval(state.timerHandle);
  }
  render();
}

function handleSetTimerFinish(t) {
  const dayType = getDayType(state.selectedDate);
  const exercises = EXERCISES[dayType];

  const startNextInQueueOrStop = () => {
    if (state.queue && state.queue.length > 0) {
      const nextId = state.queue.shift();
      const nextEx = exercises.find((e) => e.id === nextId);
      if (!nextEx) {
        state.activeExerciseId = null;
        state.timer = null;
        return;
      }
      const setCount = getConfig(nextEx).sets.length;
      let idx = 0;
      while (idx < setCount && state.completed[`${nextEx.id}-${idx}`]) idx++;
      if (idx >= setCount) idx = 0;
      state.activeExerciseId = nextEx.id;
      state.activeSetIdx = idx;
      announceSet(nextEx, idx);
      state.timer = makeWorkTimer(nextEx, idx);
    } else {
      speak("운동을 마쳤습니다. 수고하셨습니다.");
      state.activeExerciseId = null;
      state.queue = null;
      state.timer = null;
    }
  };

  if (t.kind === "setWork") {
    markSetComplete(t.exId, t.setIdx);
    if (t.restSec > 0) {
      announceRest(t.restSec);
      state.timer = { kind: "setRest", exId: t.exId, setIdx: t.setIdx, nextSetIdx: t.nextSetIdx, isLastSet: t.nextSetIdx === null, remaining: t.restSec, total: t.restSec };
    } else if (t.nextSetIdx != null) {
      const ex = exercises.find((e) => e.id === t.exId);
      state.activeSetIdx = t.nextSetIdx;
      announceSet(ex, t.nextSetIdx);
      state.timer = makeWorkTimer(ex, t.nextSetIdx);
    } else {
      startNextInQueueOrStop();
    }
  } else if (t.kind === "setRest") {
    if (t.nextSetIdx != null) {
      const ex = exercises.find((e) => e.id === t.exId);
      state.activeExerciseId = t.exId;
      state.activeSetIdx = t.nextSetIdx;
      announceSet(ex, t.nextSetIdx);
      state.timer = makeWorkTimer(ex, t.nextSetIdx);
    } else {
      startNextInQueueOrStop();
    }
  }
}

function finishActiveTimer() {
  const t = state.timer;
  if (navigator.vibrate) {
    try { navigator.vibrate(200); } catch (e) {}
  }
  if (t && (t.kind === "setWork" || t.kind === "setRest")) {
    handleSetTimerFinish(t);
  } else if (t && t.kind === "cardioProgram") {
    const dayType = getDayType(state.selectedDate);
    const option = (CARDIO_OPTIONS[dayType] || []).find((o) => o.key === t.optionKey);
    const nextIdx = t.phaseIndex + 1;
    if (option && nextIdx < option.phases.length) {
      startCardioProgramPhase(option, nextIdx, false);
    } else {
      state.completed.cardio = true;
      saveProgress();
      updateSummary(state.selectedDate, true);
      state.timer = null;
      speak("오늘 유산소 60분을 완료했습니다. 수고하셨습니다.");
    }
  } else {
    state.timer = null;
  }
  render();
  if (state.timer) startTimerInterval();
}

function startCardioPhaseTimer(label, seconds) {
  startElapsedClock();
  speak(`${label}입니다. ${Math.round(seconds / 60)}분간 진행하세요.`);
  clearInterval(state.timerHandle);
  state.timer = { kind: "cardioSingle", label, remaining: seconds, total: seconds };
  render();
  startTimerInterval();
}

function startCardioProgramPhase(option, phaseIndex, shouldRender = true) {
  const phase = option.phases[phaseIndex];
  if (!phase) return;
  startElapsedClock();
  speak(`${phase.label}입니다. ${Math.round(phase.seconds / 60)}분간 진행하세요.`);
  clearInterval(state.timerHandle);
  state.timer = {
    kind: "cardioProgram",
    label: `${option.label} · ${phase.label}`,
    optionKey: option.key,
    phaseIndex,
    remaining: phase.seconds,
    total: phase.seconds,
  };
  if (shouldRender) render();
  startTimerInterval();
}

function startCardioProgram() {
  const dayType = getDayType(state.selectedDate);
  const options = CARDIO_OPTIONS[dayType] || [];
  const option = options.find((o) => o.key === getCardioChoice(dayType)) || options[0];
  if (!option) return;
  state.completed.cardio = false;
  saveProgress();
  updateSummary(state.selectedDate, false);
  startCardioProgramPhase(option, 0);
}

function skipActiveTimer() {
  clearInterval(state.timerHandle);
  finishActiveTimer();
}

function startExercise(ex) {
  startElapsedClock();
  state.queue = null;
  const setCount = getConfig(ex).sets.length;
  let idx = 0;
  while (idx < setCount && state.completed[`${ex.id}-${idx}`]) idx++;
  if (idx >= setCount) idx = 0;
  state.activeExerciseId = ex.id;
  state.activeSetIdx = idx;
  announceSet(ex, idx);
  state.timer = makeWorkTimer(ex, idx);
  render();
  startTimerInterval();
}

function startBlock(list) {
  if (!list.length) return;
  startElapsedClock();
  const first = list[0];
  const restIds = list.slice(1).map((e) => e.id);
  const setCount = getConfig(first).sets.length;
  let idx = 0;
  while (idx < setCount && state.completed[`${first.id}-${idx}`]) idx++;
  if (idx >= setCount) idx = 0;
  state.queue = restIds;
  state.activeExerciseId = first.id;
  state.activeSetIdx = idx;
  announceSet(first, idx);
  state.timer = makeWorkTimer(first, idx);
  render();
  startTimerInterval();
}

function startBlockFrom(exId) {
  const dayType = getDayType(state.selectedDate);
  const exercises = getOrderedExercises(dayType).filter((e) => isSelected(dayType, e.id));
  const idx = exercises.findIndex((e) => e.id === exId);
  if (idx === -1) return;
  startBlock(exercises.slice(idx));
}

function resetExercise(ex) {
  const setCount = getConfig(ex).sets.length;
  for (let idx = 0; idx < setCount; idx++) delete state.completed[`${ex.id}-${idx}`];
  saveProgress();
  const dayType = getDayType(state.selectedDate);
  const totalSets = EXERCISES[dayType].filter((e) => isSelected(dayType, e.id)).reduce((a, e) => a + getConfig(e).sets.length, 0);
  const doneSets = Object.values(state.completed).filter(Boolean).length;
  updateSummary(state.selectedDate, doneSets === totalSets);
  if (state.activeExerciseId === ex.id) {
    state.activeExerciseId = null;
    state.queue = null;
    clearInterval(state.timerHandle);
    state.timer = null;
    state.paused = false;
  }
  render();
}

function startElapsedClock() {
  if (state.sessionStart !== null) return;
  state.sessionStart = Date.now();
  clearInterval(state.elapsedHandle);
  state.elapsedHandle = setInterval(() => {
    const el = document.getElementById("elapsedDisplay");
    if (el) el.textContent = formatTime(Math.floor((Date.now() - state.sessionStart) / 1000));
  }, 1000);
}

// ---------- Event handling ----------
function attachHandlers() {
  if (state.view === "calendar") {
    document.getElementById("prevMonth").onclick = () => {
      state.calMonth -= 1;
      if (state.calMonth < 0) { state.calMonth = 11; state.calYear -= 1; }
      render();
    };
    document.getElementById("nextMonth").onclick = () => {
      state.calMonth += 1;
      if (state.calMonth > 11) { state.calMonth = 0; state.calYear += 1; }
      render();
    };
    document.querySelectorAll("[data-date]").forEach((el) => {
      el.onclick = () => {
        const dateStr = el.getAttribute("data-date");
        state.selectedDate = dateStr;
        loadDayState();
        state.view = "day";
        history.pushState({ view: "day", date: dateStr }, "", "");
        render();
      };
    });

    const openProfileBtn = document.getElementById("openProfileForm");
    if (openProfileBtn) openProfileBtn.onclick = () => { state.profileFormOpen = true; render(); };

    const profileCancelBtn = document.getElementById("profileCancelBtn");
    if (profileCancelBtn) profileCancelBtn.onclick = () => { state.profileFormOpen = false; render(); };

    const profileApplyBtn = document.getElementById("profileApplyBtn");
    if (profileApplyBtn) profileApplyBtn.onclick = () => applyProfile(state.profileForm);

    document.querySelectorAll("[data-profilefield]").forEach((el) => {
      el.onclick = () => {
        const [key, val] = el.getAttribute("data-profilefield").split("|");
        const numVal = Number(val);
        state.profileForm = { ...state.profileForm, [key]: isNaN(numVal) || val === "" ? val : numVal };
        lsSet("wt_profile_form", state.profileForm);
        render();
      };
    });

    document.querySelectorAll("[data-profilenum]").forEach((el) => {
      el.onchange = () => {
        const key = el.getAttribute("data-profilenum");
        state.profileForm = { ...state.profileForm, [key]: Number(el.value) };
        lsSet("wt_profile_form", state.profileForm);
      };
    });

    document.querySelectorAll("[data-profileissue]").forEach((el) => {
      el.onclick = () => {
        const opt = el.getAttribute("data-profileissue");
        const f = state.profileForm;
        let nextIssues;
        if (opt === "없음") {
          nextIssues = ["없음"];
        } else {
          const withoutNone = f.issues.filter((i) => i !== "없음");
          nextIssues = withoutNone.includes(opt) ? withoutNone.filter((i) => i !== opt) : [...withoutNone, opt];
        }
        state.profileForm = { ...f, issues: nextIssues };
        lsSet("wt_profile_form", state.profileForm);
        render();
      };
    });

    return;
  }

  // day view
  document.getElementById("backToCal").onclick = () => {
    history.back();
  };

  document.getElementById("toggleVoice").onclick = toggleVoice;

  document.getElementById("resetDay").onclick = () => {
    state.completed = {};
    saveProgress();
    updateSummary(state.selectedDate, false);
    state.sessionStart = null;
    state.activeExerciseId = null;
    state.queue = null;
    clearInterval(state.elapsedHandle);
    clearInterval(state.timerHandle);
    state.timer = null;
    render();
  };

  document.querySelectorAll("[data-toggleexpand]").forEach((el) => {
    el.onclick = () => {
      const id = el.getAttribute("data-toggleexpand");
      state.expanded[id] = state.expanded[id] === false ? true : false;
      render();
    };
  });

  document.querySelectorAll("[data-togglesub]").forEach((el) => {
    el.onclick = () => {
      const id = el.getAttribute("data-togglesub");
      toggleSubstitute(id);
    };
  });

  const selToggleEl = document.querySelector("[data-toggleselection]");
  if (selToggleEl) {
    selToggleEl.onclick = () => {
      state.selectionOpen = !state.selectionOpen;
      render();
    };
  }

  document.querySelectorAll("[data-toggleselex]").forEach((el) => {
    el.onclick = () => {
      const exId = el.getAttribute("data-toggleselex");
      const dayType = getDayType(state.selectedDate);
      toggleSelection(dayType, exId);
    };
  });

  document.querySelectorAll("[data-moveex]").forEach((el) => {
    el.onclick = () => {
      const [exId, dir] = el.getAttribute("data-moveex").split("|");
      const dayType = getDayType(state.selectedDate);
      moveExercise(dayType, exId, Number(dir));
    };
  });

  document.querySelectorAll("[data-startex]").forEach((el) => {
    el.onclick = () => {
      const dayType = getDayType(state.selectedDate);
      const ex = EXERCISES[dayType].find((e) => e.id === el.getAttribute("data-startex"));
      if (ex) startExercise(ex);
    };
  });

  document.querySelectorAll("[data-startblockfrom]").forEach((el) => {
    el.onclick = () => {
      startBlockFrom(el.getAttribute("data-startblockfrom"));
    };
  });

  document.querySelectorAll("[data-resetex]").forEach((el) => {
    el.onclick = () => {
      const dayType = getDayType(state.selectedDate);
      const ex = EXERCISES[dayType].find((e) => e.id === el.getAttribute("data-resetex"));
      if (ex) resetExercise(ex);
    };
  });

  document.querySelectorAll("[data-blockstart]").forEach((el) => {
    el.onclick = () => {
      const dayType = getDayType(state.selectedDate);
      const exercises = getOrderedExercises(dayType).filter((e) => isSelected(dayType, e.id));
      startBlock(exercises);
    };
  });

  document.querySelectorAll("[data-setfield]").forEach((el) => {
    el.onchange = () => {
      const [exId, idx, field] = el.getAttribute("data-setfield").split("|");
      const dayType = getDayType(state.selectedDate);
      const ex = EXERCISES[dayType].find((e) => e.id === exId);
      if (ex) updateSetField(ex, Number(idx), field, el.value);
    };
  });

  document.querySelectorAll("[data-workfor]").forEach((el) => {
    el.onchange = () => {
      const exId = el.getAttribute("data-workfor");
      const dayType = getDayType(state.selectedDate);
      const ex = EXERCISES[dayType].find((e) => e.id === exId);
      if (ex) updateWorkSec(ex, el.value);
    };
  });

  document.querySelectorAll("[data-addset]").forEach((el) => {
    el.onclick = () => {
      const exId = el.getAttribute("data-addset");
      const dayType = getDayType(state.selectedDate);
      const ex = EXERCISES[dayType].find((e) => e.id === exId);
      if (ex) addSet(ex);
    };
  });

  document.querySelectorAll("[data-removeset]").forEach((el) => {
    el.onclick = () => {
      const [exId, idx] = el.getAttribute("data-removeset").split("|");
      const dayType = getDayType(state.selectedDate);
      const ex = EXERCISES[dayType].find((e) => e.id === exId);
      if (ex) removeSet(ex, Number(idx));
    };
  });

  const startCardioAllBtn = document.querySelector("[data-startcardio=\"all\"]");
  if (startCardioAllBtn) startCardioAllBtn.onclick = startCardioProgram;

  document.querySelectorAll("[data-cardio]").forEach((el) => {
    el.onclick = () => {
      const key = el.getAttribute("data-cardio");
      const dayType = getDayType(state.selectedDate);
      const opt = CARDIO_OPTIONS[dayType].find((o) => o.key === getCardioChoice(dayType)) || CARDIO_OPTIONS[dayType][0];
      const phase = opt.phases.find((p) => p.key === key);
      if (phase) startCardioPhaseTimer(phase.label, phase.seconds);
    };
  });

  document.querySelectorAll("[data-cardiotab]").forEach((el) => {
    el.onclick = () => {
      const key = el.getAttribute("data-cardiotab");
      const dayType = getDayType(state.selectedDate);
      setCardioChoiceFor(dayType, key);
    };
  });

  const cardioEditToggleEl = document.querySelector("[data-togglecardioedit]");
  if (cardioEditToggleEl) {
    cardioEditToggleEl.onclick = () => {
      const key = cardioEditToggleEl.getAttribute("data-togglecardioedit");
      state.cardioEditOpen = { ...state.cardioEditOpen, [key]: !state.cardioEditOpen[key] };
      render();
    };
  }

  document.querySelectorAll("[data-cardiofield]").forEach((el) => {
    el.onchange = () => {
      const [dayType, optionKey, phaseKey, fieldName] = el.getAttribute("data-cardiofield").split("|");
      updateCardioField(dayType, optionKey, phaseKey, fieldName, el.value);
    };
  });

  const skipBtn = document.getElementById("skipTimer");
  if (skipBtn) skipBtn.onclick = skipActiveTimer;

  const pauseBtn = document.getElementById("pauseTimer");
  if (pauseBtn) pauseBtn.onclick = togglePause;
}

// ---------- Browser back-button navigation ----------
window.addEventListener("popstate", (e) => {
  const s = e.state;
  if (s && s.view === "day" && s.date) {
    state.selectedDate = s.date;
    loadDayState();
    state.view = "day";
  } else {
    clearInterval(state.timerHandle);
    clearInterval(state.elapsedHandle);
    state.timer = null;
    state.view = "calendar";
  }
  render();
});

// ---------- Init ----------
loadDayState();
history.replaceState({ view: "calendar" }, "", "");
render();
