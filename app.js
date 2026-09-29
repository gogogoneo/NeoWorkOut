// ---------- Service worker registration ----------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js?v=42", { updateViaCache: "none" }).catch(() => {});
  });
}

// ---------- Data ----------
const WEEKDAY_MAP = ["일", "월", "화", "수", "목", "금", "토"];
// v37: 운동 선택 상단에 유산소 선택을 명확히 표시하고 캐시 갱신 문제를 수정했습니다.
// 기존 upper/lower 저장 키를 유지해 사용자 설정을 보존합니다.
const DAY_TYPE = { 월: "upper", 화: "lower", 수: "upper", 목: "lower", 금: "upper", 토: "lower", 일: "rest" };

const DAY_INFO = {
  upper: { label: "A 프로그램", duration: 0, calories: 0, color: "#F5C518" },
  lower: { label: "B 프로그램", duration: 0, calories: 0, color: "#3E8FB0" },
  rest: { label: "완전 휴식", duration: 0, calories: 0, color: "#545C6B" },
};

const EXERCISES = {
  upper: [
    // 가슴: 우선순위 높음, 각 3세트
    { id: "bench", name: "벤치프레스", unit: "kg", tip: "견갑을 뒤로 모아 고정하고 가슴을 살짝 들어 바를 가슴 쪽으로 천천히 내렸다가 밀어올리세요. 팔꿈치는 몸통에서 약 45도, 손목은 바 아래에 둡니다.", breath: "밀어올릴 때 숨을 내쉬고, 내릴 때 들이쉬세요", substitutes: [{ name: "푸시업", unit: "bodyweight", tip: "몸을 일직선으로 유지하고 가슴이 바닥에 가까워질 때까지 내려갔다 밀어올리세요.", breath: "밀어올릴 때 내쉬고, 내릴 때 들이쉬세요", sets: [{ value:null,reps:15,rest:60},{value:null,reps:12,rest:60},{value:null,reps:10,rest:60}] }], sets: [
      { value: 50, reps: 12, rest: 90 }, { value: 60, reps: 10, rest: 90 }, { value: 65, reps: 6, rest: 120 }
    ] },
    { id: "dips", name: "어시스트 머신 딥스", unit: "kg", tip: "가슴 자극을 위해 상체를 약간 앞으로 기울이고, 어깨가 과하게 내려가지 않는 범위에서 내려갔다 밀어올리세요. 어시스트 숫자가 클수록 쉬워집니다.", breath: "밀어올릴 때 내쉬고, 내려갈 때 들이쉬세요", substitutes: [{ name:"벤치 딥스",unit:"bodyweight",tip:"어깨가 불편하지 않은 범위에서 천천히 수행하세요.",breath:"밀어올릴 때 내쉬고, 내려갈 때 들이쉬세요",sets:[{value:null,reps:12,rest:60},{value:null,reps:12,rest:60},{value:null,reps:10,rest:60}]}], sets: [
      { value: 40, reps: 12, rest: 90 }, { value: 35, reps: 12, rest: 90 }, { value: 35, reps: 10, rest: 90 }
    ] },
    { id: "incline", name: "인클라인 프레스", unit: "kg", tip: "벤치를 약 30도로 세우고 덤벨을 가슴 윗부분 옆으로 천천히 내렸다가 위로 밀어올리세요. 어깨가 들리지 않게 견갑을 고정하고 가슴 상부 수축에 집중합니다.", breath: "밀어올릴 때 내쉬고, 내릴 때 들이쉬세요", substitutes: [{name:"인클라인 푸시업",unit:"bodyweight",tip:"손을 벤치에 올리고 몸을 일직선으로 유지하며 가슴을 벤치 쪽으로 내렸다가 밀어올리세요.",breath:"밀 때 내쉬고, 내릴 때 들이쉬세요",sets:[{value:null,reps:15,rest:60},{value:null,reps:12,rest:60},{value:null,reps:10,rest:60}]}], sets: [
      { value: 10, reps: 12, rest: 90 }, { value: 12, reps: 12, rest: 90 }, { value: 12, reps: 10, rest: 90 }
    ] },
    { id: "flye", name: "덤벨 플라이", unit: "kg", tip: "평벤치에 누워 팔꿈치를 살짝 굽힌 채 고정하고 양팔을 큰 아치로 벌렸다가 가슴 앞에서 모으세요. 무게보다 가슴의 스트레칭과 수축을 우선합니다.", breath: "벌릴 때 들이쉬고, 모을 때 내쉬세요", substitutes: [{name:"와이드 푸시업",unit:"bodyweight",tip:"손 간격을 어깨보다 넓게 잡고 가슴이 충분히 늘어나는 범위까지 천천히 내려갔다 밀어올리세요.",breath:"내릴 때 들이쉬고, 밀 때 내쉬세요",sets:[{value:null,reps:15,rest:60},{value:null,reps:15,rest:60},{value:null,reps:12,rest:60}]}], sets: [
      { value: 8, reps: 12, rest: 60 }, { value: 10, reps: 12, rest: 60 }, { value: 10, reps: 10, rest: 60 }
    ] },

    // 등: 수평 당기기 + 수직 당기기, 각 3세트
    { id: "cablerow", name: "시티드 케이블 로우", unit: "kg", tip: "허리를 세우고 손잡이를 배꼽 방향으로 당기며 견갑을 뒤로 모으세요. 상체 반동을 최소화합니다.", breath: "당길 때 내쉬고, 돌아갈 때 들이쉬세요", substitutes: [{name:"밴드 로우",unit:"bodyweight",tip:"밴드를 고정하고 팔꿈치를 뒤로 보내며 견갑을 모으세요.",breath:"당길 때 내쉬고, 풀 때 들이쉬세요",sets:[{value:null,reps:15,rest:60},{value:null,reps:12,rest:60},{value:null,reps:12,rest:60}]}], sets: [
      { value: 30, reps: 12, rest: 90 }, { value: 35, reps: 10, rest: 90 }, { value: 40, reps: 8, rest: 90 }
    ] },
    { id: "assisted_chinup", name: "어시스티드 풀업", unit: "kg", tip: "오버그립으로 어깨너비보다 살짝 넓게 잡고 먼저 어깨를 아래로 눌러 견갑을 안정시킵니다. 가슴을 살짝 들고 팔꿈치를 아래로 끌어내린다는 느낌으로 몸을 당기세요. 보조 중량은 8~12회를 반동 없이 수행할 수 있게 맞추고, 내려갈 때 팔을 충분히 펴 광배근이 늘어나는 느낌을 유지합니다.", breath: "몸을 당겨 올릴 때 내쉬고, 천천히 내려갈 때 들이쉬세요", substitutes: [], sets: [
      { value: 30, reps: 12, rest: 90 }, { value: 30, reps: 10, rest: 90 }, { value: 30, reps: 8, rest: 90 }
    ] },
    // 기존 랫풀다운은 교체 후에도 선택 운동으로 보존 (기본 OFF)
    { id: "latpull", name: "랫풀다운", unit: "kg", tip: "가슴을 살짝 들고 바를 쇄골 쪽으로 당기세요. 몸을 뒤로 크게 젖히지 말고 팔보다 광배근으로 당긴다는 느낌을 유지합니다.", breath: "당길 때 내쉬고, 올릴 때 들이쉬세요", substitutes: [{name:"밴드 랫풀다운",unit:"bodyweight",tip:"밴드를 머리 위에 고정하고 팔꿈치를 옆구리 쪽으로 끌어내리세요.",breath:"당길 때 내쉬고, 올릴 때 들이쉬세요",sets:[{value:null,reps:15,rest:60},{value:null,reps:12,rest:60},{value:null,reps:12,rest:60}]}], sets: [
      { value: 35, reps: 12, rest: 90 }, { value: 40, reps: 10, rest: 90 }, { value: 45, reps: 8, rest: 90 }
    ] },

    // 하체: 각 3세트
    { id: "legpress", name: "레그프레스", unit: "kg", tip: "발을 발판 중앙에 어깨너비 정도로 두고 무릎과 발끝 방향을 맞춥니다. 무릎을 완전히 잠그지 않고 허리가 뜨지 않는 깊이까지만 내려갑니다.", breath: "밀어낼 때 내쉬고, 내릴 때 들이쉬세요", substitutes: [{name:"맨몸 스쿼트",unit:"bodyweight",tip:"무릎과 발끝 방향을 맞추고 엉덩이를 뒤로 보내며 앉았다 일어서세요.",breath:"일어설 때 내쉬고, 앉을 때 들이쉬세요",sets:[{value:null,reps:20,rest:60},{value:null,reps:20,rest:60},{value:null,reps:15,rest:60}]}], sets: [
      { value: 50, reps: 12, rest: 90 }, { value: 50, reps: 12, rest: 90 }, { value: 50, reps: 12, rest: 90 }
    ] },
    { id: "rdl", name: "RDL", unit: "kg", tip: "무릎은 살짝 굽힌 상태로 고정하고 엉덩이를 뒤로 최대한 밀며 덤벨을 다리에 가깝게 내려갑니다. 허리는 중립을 유지하고 햄스트링이 충분히 늘어나는 지점까지만 내려간 뒤, 엉덩이를 앞으로 밀며 둔근을 수축해 일어섭니다.", breath: "내려갈 때 들이쉬며 복압을 잡고, 일어설 때 내쉬세요", substitutes: [{name:"싱글레그 데드리프트(맨몸)",unit:"bodyweight",tip:"균형을 잡으며 엉덩이를 뒤로 보내고 허리를 중립으로 유지하세요.",breath:"일어설 때 내쉬고, 내려갈 때 들이쉬세요",sets:[{value:null,reps:12,rest:60},{value:null,reps:12,rest:60},{value:null,reps:10,rest:60}]}], sets: [
      { value: 18, reps: 12, rest: 90 }, { value: 18, reps: 12, rest: 90 }, { value: 18, reps: 10, rest: 90 }
    ] },
    { id: "legextension", name: "레그 익스텐션", unit: "kg", tip: "등과 엉덩이를 패드에 붙이고 무릎 축을 기구 회전축에 맞춥니다. 반동 없이 무릎을 펴 허벅지 앞쪽을 수축하고, 무릎을 세게 잠그지 않은 채 천천히 내려옵니다.", breath: "다리를 펼 때 내쉬고, 천천히 굽힐 때 들이쉬세요", substitutes: [], sets: [
      { value: 20, reps: 12, rest: 60 }, { value: 20, reps: 12, rest: 60 }, { value: 20, reps: 12, rest: 60 }
    ] },
    { id: "legcurl", name: "레그 컬", unit: "kg", tip: "무릎 관절의 위치를 기구 회전축에 맞추고 골반과 상체를 패드에 고정합니다. 발뒤꿈치를 엉덩이 쪽으로 당기며 햄스트링을 수축하고, 돌아올 때 반동 없이 천천히 버팁니다.", breath: "다리를 굽힐 때 내쉬고, 천천히 펼 때 들이쉬세요", substitutes: [], sets: [
      { value: 20, reps: 12, rest: 60 }, { value: 20, reps: 12, rest: 60 }, { value: 20, reps: 12, rest: 60 }
    ] },
    // 선택 하체: 기본 OFF, 필요할 때 운동 선택에서 켜기
    { id: "squat", name: "바벨 스쿼트", unit: "kg", tip: "발을 어깨너비 정도로 두고 발끝과 무릎 방향을 맞춥니다. 가슴과 허리의 중립을 유지하며 엉덩이와 무릎을 함께 굽혀 내려가고, 발바닥 전체로 바닥을 밀며 일어섭니다. 무릎이 안쪽으로 모이지 않게 합니다.", breath: "내려가기 전 숨을 들이마셔 복압을 잡고, 일어서며 내쉬세요", substitutes: [{name:"맨몸 스쿼트",unit:"bodyweight",tip:"무릎과 발끝 방향을 맞추고 발바닥 전체로 지지하며 앉았다 일어서세요.",breath:"앉을 때 들이쉬고, 일어설 때 내쉬세요",sets:[{value:null,reps:15,rest:60},{value:null,reps:15,rest:60},{value:null,reps:12,rest:60}]}], sets: [
      { value: 20, reps: 12, rest: 90 }, { value: 20, reps: 12, rest: 90 }, { value: 20, reps: 12, rest: 90 }
    ] },
    { id: "bulgarian", name: "불가리안 스쿼트 (다리당)", unit: "bodyweight", tip: "뒷발을 벤치에 걸고 앞발에 체중을 실어 천천히 내려갔다 일어서세요. 무릎과 발끝 방향을 맞추고 균형이 흔들리지 않는 범위에서 수행합니다.", breath: "일어설 때 내쉬고, 내려갈 때 들이쉬세요", substitutes: [{name:"제자리 런지",unit:"bodyweight",tip:"한 발을 앞에 두고 제자리에서 천천히 내려갔다 일어서세요.",breath:"일어설 때 내쉬고, 내려갈 때 들이쉬세요",sets:[{value:null,reps:12,rest:60},{value:null,reps:12,rest:60},{value:null,reps:10,rest:60}]}], sets: [
      { value: null, reps: 10, rest: 60 }, { value: null, reps: 10, rest: 60 }, { value: null, reps: 10, rest: 60 }
    ] },
    { id: "calfraise", name: "카프 레이즈", unit: "kg", tip: "발볼로 지지하고 뒤꿈치를 충분히 내린 뒤 최대한 높이 올리세요. 꼭대기에서 잠깐 멈추고 반동 없이 천천히 반복합니다.", breath: "올릴 때 내쉬고, 내릴 때 들이쉬세요", substitutes: [{name:"맨몸 카프 레이즈",unit:"bodyweight",tip:"계단 끝이나 평지에서 뒤꿈치를 천천히 올렸다 내리며 종아리 수축을 느끼세요.",breath:"올릴 때 내쉬고, 내릴 때 들이쉬세요",sets:[{value:null,reps:20,rest:45},{value:null,reps:20,rest:45},{value:null,reps:20,rest:45}]}], sets: [
      { value: 30, reps: 15, rest: 45 }, { value: 30, reps: 15, rest: 45 }, { value: 30, reps: 15, rest: 45 }
    ] },

    // 어깨·팔: 모든 운동 3세트
    { id: "ohp", name: "OHP", unit: "kg", tip: "코어에 힘을 주고 허리가 과하게 젖혀지지 않도록 합니다. 덤벨을 귀 옆에서 머리 위로 밀어올립니다.", breath: "밀어올릴 때 내쉬고, 내릴 때 들이쉬세요", substitutes: [{name:"파이크 푸시업",unit:"bodyweight",tip:"엉덩이를 높인 역V 자세에서 머리를 바닥 쪽으로 내렸다 밀어올리세요.",breath:"밀 때 내쉬고, 내릴 때 들이쉬세요",sets:[{value:null,reps:12,rest:60},{value:null,reps:10,rest:60}]}], sets: [
      { value: 8, reps: 12, rest: 60 }, { value: 8, reps: 10, rest: 60 }, { value: 8, reps: 10, rest: 60 }
    ] },
    { id: "lateral", name: "사레레", unit: "kg", tip: "팔꿈치를 살짝 굽히고 팔꿈치가 먼저 올라간다는 느낌으로 어깨 높이 정도까지 들어올립니다. 반동을 최소화합니다.", breath: "올릴 때 내쉬고, 내릴 때 들이쉬세요", substitutes: [{name:"밴드 레터럴 레이즈",unit:"bodyweight",tip:"밴드를 밟고 같은 궤적으로 천천히 들어올리세요.",breath:"올릴 때 내쉬고, 내릴 때 들이쉬세요",sets:[{value:null,reps:15,rest:45},{value:null,reps:15,rest:45}]}], sets: [
      { value: 6, reps: 12, rest: 45 }, { value: 6, reps: 12, rest: 45 }, { value: 6, reps: 12, rest: 45 }
    ] },
    { id: "reardelt", name: "리어 델트 플라이", unit: "kg", tip: "상체를 숙이고 몸통을 고정한 뒤 팔을 옆으로 벌립니다. 반동보다 후면 어깨 수축에 집중합니다.", breath: "벌릴 때 내쉬고, 모을 때 들이쉬세요", substitutes: [{name:"맨몸 리어델트 레이즈",unit:"bodyweight",tip:"상체를 숙인 뒤 무게 없이 팔을 벌리며 후면 어깨를 수축하세요.",breath:"벌릴 때 내쉬고, 모을 때 들이쉬세요",sets:[{value:null,reps:15,rest:45},{value:null,reps:15,rest:45}]}], sets: [
      { value: 5, reps: 12, rest: 45 }, { value: 5, reps: 12, rest: 45 }, { value: 5, reps: 12, rest: 45 }
    ] },
    // 팔: 같은 케이블 스테이션에서 삼두 2종목 + 이두 1종목을 연속 수행
    { id: "triceps_pushdown", name: "케이블 트라이셉스 푸시다운", unit: "kg", tip: "팔꿈치를 몸통 옆에 고정하고 어깨가 들리지 않게 한 뒤 손잡이를 아래로 끝까지 밀어 삼두를 수축하세요. 올라올 때 팔꿈치가 앞으로 움직이지 않게 합니다.", breath: "아래로 밀 때 내쉬고, 천천히 돌아올 때 들이쉬세요", substitutes: [{name:"밴드 트라이셉스 푸시다운",unit:"bodyweight",tip:"팔꿈치를 옆구리에 고정하고 밴드를 아래로 밀어 삼두를 수축하세요.",breath:"밀 때 내쉬고, 돌아올 때 들이쉬세요",sets:[{value:null,reps:15,rest:45},{value:null,reps:12,rest:45},{value:null,reps:12,rest:45}]}], sets: [
      { value: 20, reps: 15, rest: 45 }, { value: 25, reps: 12, rest: 45 }, { value: 25, reps: 12, rest: 45 }
    ] },
    { id: "triceps_overhead", name: "오버헤드 케이블 트라이셉스 익스텐션", unit: "kg", tip: "케이블을 등 뒤에서 잡고 팔꿈치를 머리 옆에 고정한 채 팔을 펴세요. 허리가 과하게 젖지 않도록 코어를 잡고 삼두 장두의 늘어남과 수축을 느낍니다.", breath: "팔을 펼 때 내쉬고, 굽혀 돌아올 때 들이쉬세요", substitutes: [{name:"덤벨 오버헤드 트라이셉스 익스텐션",unit:"kg",tip:"팔꿈치를 머리 옆에 고정하고 덤벨을 머리 뒤로 내렸다가 팔을 펴세요.",breath:"펼 때 내쉬고, 내릴 때 들이쉬세요",sets:[{value:8,reps:15,rest:45},{value:8,reps:12,rest:45},{value:8,reps:12,rest:45}]}], sets: [
      { value: 15, reps: 15, rest: 45 }, { value: 20, reps: 12, rest: 45 }, { value: 20, reps: 12, rest: 45 }
    ] },
    { id: "bicep", name: "케이블 이두 컬", unit: "kg", tip: "케이블을 아래쪽에 두고 팔꿈치를 몸통 옆에 고정한 채 손잡이를 말아 올리세요. 어깨나 허리 반동 없이 이두 수축을 느끼고 내려갈 때도 천천히 버팁니다.", breath: "말아 올릴 때 내쉬고, 천천히 내릴 때 들이쉬세요", substitutes: [{name:"덤벨 이두 컬",unit:"kg",tip:"팔꿈치를 몸통 옆에 고정하고 반동 없이 들어올린 뒤 천천히 내리세요.",breath:"들어올릴 때 내쉬고, 내릴 때 들이쉬세요",sets:[{value:6,reps:15,rest:45},{value:6,reps:12,rest:45},{value:6,reps:12,rest:45}]}], sets: [
      { value: 10, reps: 15, rest: 45 }, { value: 10, reps: 12, rest: 45 }, { value: 10, reps: 12, rest: 45 }
    ] },

    // 기존 덤벨 이두 컬은 케이블 이두 컬로 교체했지만 선택 운동으로 보존 (기본 OFF)
    { id: "dumbbell_bicep", name: "덤벨 이두 컬", unit: "kg", tip: "팔꿈치를 몸통 옆에 고정하고 어깨와 허리의 반동 없이 덤벨을 말아 올리세요. 꼭대기에서 이두를 수축하고 내려갈 때 천천히 버팁니다.", breath: "들어올릴 때 내쉬고, 천천히 내릴 때 들이쉬세요", substitutes: [], sets: [
      { value: 6, reps: 15, rest: 45 }, { value: 6, reps: 12, rest: 45 }, { value: 6, reps: 12, rest: 45 }
    ] },

    // 코어: 기존 선호 운동 유지. 우드초퍼는 선택 운동으로 기본 해제.
    { id: "hangingraise", name: "행잉 니 레이즈", unit: "bodyweight", tip: "반동 없이 골반을 말아 무릎을 배 쪽으로 끌어올립니다. 그립이 먼저 지치면 코어 운동 중 앞쪽에 배치하세요.", breath: "올릴 때 내쉬고, 내릴 때 들이쉬세요", substitutes: [{name:"라잉 레그레이즈",unit:"bodyweight",tip:"허리가 뜨지 않게 복부에 힘을 주고 다리를 천천히 올렸다 내립니다.",breath:"올릴 때 내쉬고, 내릴 때 들이쉬세요",sets:[{value:null,reps:15,rest:45},{value:null,reps:15,rest:45}]}], sets: [
      { value: null, reps: 12, rest: 45 }, { value: null, reps: 12, rest: 45 }, { value: null, reps: 12, rest: 45 }, { value: null, reps: 12, rest: 45 }
    ] },
    { id: "cablecrunch", name: "케이블 크런치", unit: "kg", tip: "엉덩이 위치를 크게 움직이지 않고 갈비뼈를 골반 쪽으로 말아 복부를 수축하세요. 팔로 로프를 당기지 않습니다.", breath: "말아 내릴 때 내쉬고, 펼 때 들이쉬세요", substitutes: [{name:"맨몸 크런치",unit:"bodyweight",tip:"허리를 바닥에 붙이고 복부로 상체를 짧게 말아올립니다.",breath:"올릴 때 내쉬고, 내릴 때 들이쉬세요",sets:[{value:null,reps:20,rest:45},{value:null,reps:20,rest:45}]}], sets: [
      { value: 60, reps: 20, rest: 45 }, { value: 60, reps: 20, rest: 45 }, { value: 60, reps: 20, rest: 45 }, { value: 60, reps: 20, rest: 45 }
    ] },
    { id: "woodchop", name: "케이블 우드초퍼", unit: "kg", tip: "케이블을 양손으로 잡고 몸통을 회전해 대각선 방향으로 당깁니다. 팔로만 당기지 말고 복사근과 몸통 회전에 집중하세요. 좌우 동일하게 수행합니다.", breath: "당길 때 내쉬고, 돌아올 때 들이쉬세요", substitutes: [{name:"러시안 트위스트",unit:"bodyweight",tip:"상체를 약간 뒤로 기울이고 좌우로 천천히 회전하세요.",breath:"회전할 때 내쉬고, 중앙에서 들이쉬세요",sets:[{value:null,reps:16,rest:45},{value:null,reps:16,rest:45},{value:null,reps:16,rest:45},{value:null,reps:16,rest:45}]}], sets: [
      { value: 20, reps: 15, rest: 45 }, { value: 25, reps: 12, rest: 45 }, { value: 30, reps: 10, rest: 45 }
    ] },
    { id: "plank", name: "플랭크", unit: "sec", defaultWorkSec: 40, tip: "팔꿈치를 어깨 아래에 두고 머리부터 발끝까지 일직선을 유지합니다. 허리가 처지지 않도록 복부와 엉덩이에 힘을 주세요.", breath: "숨을 참지 말고 편안하게 이어가세요", substitutes: [{name:"버드독",unit:"sec",defaultWorkSec:40,tip:"네발 자세에서 반대 팔과 다리를 뻗고 몸통이 흔들리지 않게 유지하세요.",breath:"편안하게 호흡하세요",sets:[{value:40,reps:null,rest:40},{value:40,reps:null,rest:40}]}], sets: [
      { value: 40, reps: null, rest: 40 }, { value: 40, reps: null, rest: 40 }, { value: 40, reps: null, rest: 40 }, { value: 40, reps: null, rest: 40 }
    ] },
  ],
  lower: [
    { id: "hangingraise_cardio", name: "행잉 니 레이즈", unit: "bodyweight", tip: "반동 없이 골반을 말아 무릎을 배 쪽으로 끌어올립니다. 허리가 과하게 흔들리지 않게 복부 힘으로 천천히 수행하세요.", breath: "올릴 때 내쉬고, 내릴 때 들이쉬세요", sets: [
      { value: null, reps: 12, rest: 45 }, { value: null, reps: 12, rest: 45 }
    ] },
    { id: "cablecrunch_cardio", name: "케이블 크런치", unit: "kg", tip: "엉덩이 위치를 크게 움직이지 않고 갈비뼈를 골반 쪽으로 말아 복부를 수축하세요. 팔로 로프를 당기지 않습니다.", breath: "말아 내릴 때 내쉬고, 펼 때 들이쉬세요", sets: [
      { value: 60, reps: 20, rest: 45 }, { value: 60, reps: 20, rest: 45 }
    ] },
    { id: "plank_cardio", name: "플랭크", unit: "sec", defaultWorkSec: 40, tip: "팔꿈치를 어깨 아래에 두고 머리부터 발끝까지 일직선을 유지합니다. 허리가 처지지 않도록 복부와 엉덩이에 힘을 주세요.", breath: "숨을 참지 말고 편안하게 이어가세요", sets: [
      { value: 40, reps: null, rest: 40 }, { value: 40, reps: null, rest: 40 }
    ] },
  ],
  rest: [],
};

// v30: 유산소 날에도 전신 웨이트의 근력 운동을 선택해서 추가할 수 있습니다.
// 코어는 유산소 날 전용 항목이 이미 있으므로 중복 추가하지 않습니다.
const CARDIO_OPTIONAL_WEIGHT_IDS = [
  "bench", "dips", "incline", "flye", "cablerow", "assisted_chinup", "latpull",
  "legpress", "rdl", "legextension", "legcurl", "squat", "bulgarian", "calfraise", "ohp", "lateral", "reardelt",
  "triceps_pushdown", "triceps_overhead", "bicep", "dumbbell_bicep"
];
EXERCISES.lower.push(
  ...EXERCISES.upper.filter((ex) => CARDIO_OPTIONAL_WEIGHT_IDS.includes(ex.id))
);

const CARDIO_OPTIONS = {
  upper: [],
  lower: [
    {
      key: "treadmill40",
      label: "웨이트 후 트레드밀 40분 (빠른 걷기)",
      type: "treadmill",
      phases: [
        { key: "main", label: "경사 빠른 걷기 인터벌", seconds: 39 * 60, fields: { highIncline: 7, highSpeed: 6, highSeconds: 2 * 60, lowIncline: 4, lowSpeed: 6, lowSeconds: 1 * 60, reps: 13 } },
        { key: "finish", label: "마무리 걷기", seconds: 1 * 60, fields: { incline: 2, speed: 5.5 } },
      ],
    },
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
      key: "hybrid",
      label: "하이브리드 60분 (걷기 + 러닝)",
      type: "mixed",
      phases: [
        { key: "walk30", label: "경사 인터벌 걷기", type: "treadmill", seconds: 30 * 60, fields: { highIncline: 6, highSpeed: 6, highSeconds: 2 * 60, lowIncline: 4, lowSpeed: 6, lowSeconds: 1 * 60, reps: 10 } },
        { key: "run20", label: "연속 러닝", type: "treadmill", seconds: 20 * 60, fields: { incline: 0, speed: 8 } },
        { key: "finish10", label: "마무리 걷기", type: "treadmill", seconds: 10 * 60, fields: { incline: 2, speed: 5.5 } },
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

// v33: 웨이트 데이에도 유산소를 선택할 수 있도록 동일한 유산소 옵션을 제공합니다.
CARDIO_OPTIONS.upper = CARDIO_OPTIONS.lower;

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
  selectedExerciseId: null, // 목록에서 선택한 운동만 상세 표시
  selectedCardioKey: null, // 유산소 데이에서 선택한 유산소 유형만 상세 표시
  returnListTarget: null, // 상세 진입 전 목록에서 눌렀던 항목
  pendingListScroll: null, // 목록 복귀 후 스크롤할 항목
  queue: null, // remaining exercise ids to auto-run after current one (block mode)
  sessionStart: null,
  elapsedHandle: null,
  voiceEnabled: lsGet("wt_voice_enabled", true),
  selection: lsGet("wt_exercise_selection", {}), // { [dayType]: { [exId]: boolean } }
  selectionOpen: false,
  cardioChoice: lsGet("wt_cardio_choice", {}), // { [dayType]: optionKey }
  cardioSelection: lsGet("wt_cardio_selection", {}), // { [dayType]: { [optionKey]: boolean } }
  cardioConfig: lsGet("wt_cardio_config", {}), // weekday-scoped cardio fields
  cardioNames: lsGet("wt_cardio_names", {}), // { "요일:optionKey": custom name }
  cardioEditOpen: {}, // { "dayType:optionKey": boolean }
  tipOverrides: lsGet("wt_exercise_tip_overrides", {}), // { "exId" or "exId:sub": { name, tip, breath } }
  tipEditOpen: {},
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

const DEFAULT_UNSELECTED = ["flye", "woodchop", "squat", "bulgarian", "calfraise", "latpull", "dumbbell_bicep"];

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
  // 사용자 설정 보존: 이미 저장된 선택/순서가 있으면 업데이트 시 덮어쓰지 않습니다.
  state.selection = { ...state.selection, upper: state.selection.upper || {} };
  state.order = { ...state.order, upper: (state.order.upper && state.order.upper.length) ? state.order.upper : EXERCISES.upper.map((e) => e.id) };
  lsSet("wt_exercise_configs", state.configs);
  lsSet("wt_exercise_selection", state.selection);
  lsSet("wt_exercise_order", state.order);
  lsSet(VERSION_KEY, VERSION);
})();

// v19: 유산소 데이에 코어 3종목을 추가하고 기본 순서를 초기화합니다.
(function migrateCardioCore() {
  const VERSION_KEY = "wt_program_version";
  const VERSION = 19;
  if (lsGet(VERSION_KEY, 0) >= VERSION) return;
  const migratedConfigs = { ...state.configs };
  EXERCISES.lower.forEach((ex) => {
    if (!migratedConfigs[ex.id]) migratedConfigs[ex.id] = { workSec: ex.defaultWorkSec || DEFAULT_WORK_SECONDS, sets: ex.sets.map((set) => ({ ...set })) };
  });
  state.configs = migratedConfigs;
  // 사용자 설정 보존: 이미 저장된 선택/순서가 있으면 업데이트 시 덮어쓰지 않습니다.
  state.selection = { ...state.selection, lower: state.selection.lower || {} };
  state.order = { ...state.order, lower: (state.order.lower && state.order.lower.length) ? state.order.lower : EXERCISES.lower.map((e) => e.id) };
  lsSet("wt_exercise_configs", state.configs);
  lsSet("wt_exercise_selection", state.selection);
  lsSet("wt_exercise_order", state.order);
  lsSet(VERSION_KEY, VERSION);
})();

// v30: 기존 유산소 날 설정은 그대로 보존하면서 새 웨이트 선택 항목과 순서만 뒤에 추가합니다.
(function migrateCardioOptionalWeightsV30() {
  const VERSION_KEY = "wt_program_version";
  const VERSION = 30;
  if (lsGet(VERSION_KEY, 0) >= VERSION) return;
  const natural = EXERCISES.lower.map((e) => e.id);
  const oldOrder = Array.isArray(state.order.lower) ? state.order.lower.filter((id) => natural.includes(id)) : [];
  const missing = natural.filter((id) => !oldOrder.includes(id));
  state.order = { ...state.order, lower: [...oldOrder, ...missing] };
  const lowerSel = { ...(state.selection.lower || {}) };
  CARDIO_OPTIONAL_WEIGHT_IDS.forEach((id) => {
    if (!Object.prototype.hasOwnProperty.call(lowerSel, id)) lowerSel[id] = false;
  });
  state.selection = { ...state.selection, lower: lowerSel };
  lsSet("wt_exercise_order", state.order);
  lsSet("wt_exercise_selection", state.selection);
  lsSet(VERSION_KEY, VERSION);
})();

// v31: 하체 선택 운동 확장 + 새 주간 일정 적용. 기존 중량/횟수 설정은 보존합니다.
(function migrateLowerBodyV31() {
  const VERSION_KEY = "wt_program_version";
  const VERSION = 31;
  if (lsGet(VERSION_KEY, 0) >= VERSION) return;

  const newIds = ["legextension", "legcurl", "squat"];
  const byId = Object.fromEntries(EXERCISES.upper.map((ex) => [ex.id, ex]));
  const migratedConfigs = { ...state.configs };
  newIds.forEach((id) => {
    const ex = byId[id];
    if (ex && !migratedConfigs[id]) {
      migratedConfigs[id] = { workSec: ex.defaultWorkSec || DEFAULT_WORK_SECONDS, sets: ex.sets.map((set) => ({ ...set })) };
    }
  });
  state.configs = migratedConfigs;

  const upperSel = { ...(state.selection.upper || {}) };
  // 사용자가 요청한 현재 하체 4종은 ON, 나머지 하체 선택 운동은 OFF.
  ["legpress", "rdl", "legextension", "legcurl"].forEach((id) => { upperSel[id] = true; });
  ["squat", "bulgarian", "calfraise"].forEach((id) => { upperSel[id] = false; });
  state.selection = { ...state.selection, upper: upperSel };

  const naturalUpper = EXERCISES.upper.map((e) => e.id);
  const oldUpperOrder = Array.isArray(state.order.upper) ? state.order.upper.filter((id) => naturalUpper.includes(id)) : [];
  const missingUpper = naturalUpper.filter((id) => !oldUpperOrder.includes(id));
  state.order = { ...state.order, upper: [...oldUpperOrder, ...missingUpper] };

  // 유산소 날의 선택 가능 웨이트 목록에도 새 하체 운동을 추가하되 기본 OFF 유지.
  const lowerSel = { ...(state.selection.lower || {}) };
  newIds.forEach((id) => { if (!Object.prototype.hasOwnProperty.call(lowerSel, id)) lowerSel[id] = false; });
  state.selection = { ...state.selection, lower: lowerSel };
  const naturalLower = EXERCISES.lower.map((e) => e.id);
  const oldLowerOrder = Array.isArray(state.order.lower) ? state.order.lower.filter((id) => naturalLower.includes(id)) : [];
  const missingLower = naturalLower.filter((id) => !oldLowerOrder.includes(id));
  state.order = { ...state.order, lower: [...oldLowerOrder, ...missingLower] };

  lsSet("wt_exercise_configs", state.configs);
  lsSet("wt_exercise_selection", state.selection);
  lsSet("wt_exercise_order", state.order);
  lsSet(VERSION_KEY, VERSION);
})();


// v38: 웨이트 후 40분 빠른 걷기 트레드밀 옵션 추가. 기존 저장값은 변경하지 않습니다.
(function migrateTreadmill40V38() {
  const VERSION_KEY = "wt_program_version";
  const VERSION = 38;
  if (lsGet(VERSION_KEY, 0) >= VERSION) return;
  lsSet(VERSION_KEY, VERSION);
})();

// v39: 월~토 설정을 요일별로 완전히 독립 저장. 일요일은 휴식.
(function migratePerWeekdayV39() {
  const VERSION_KEY = "wt_program_version";
  const VERSION = 39;
  if (lsGet(VERSION_KEY, 0) >= VERSION) return;
  const days = ["월","화","수","목","금","토"];
  const typeFor = { 월:"upper", 화:"lower", 수:"upper", 목:"lower", 금:"upper", 토:"lower" };
  const newSel = { ...state.selection };
  const newOrder = { ...state.order };
  const newCardioSel = { ...state.cardioSelection };
  const newChoice = { ...state.cardioChoice };
  const newCfg = { ...state.configs };
  const newCardioCfg = { ...state.cardioConfig };
  days.forEach((day) => {
    const type = typeFor[day];
    if (!newSel[day]) newSel[day] = { ...(state.selection[type] || {}) };
    if (!newOrder[day]) newOrder[day] = [ ...(state.order[type] || EXERCISES[type].map(e=>e.id)) ];
    if (!newCardioSel[day]) newCardioSel[day] = { ...(state.cardioSelection[type] || {}) };
    const oldChoice = state.cardioChoice[`${type}:${day}`] || state.cardioChoice[type];
    if (!newChoice[day] && oldChoice) newChoice[day] = oldChoice;
    EXERCISES[type].forEach((ex) => {
      [ex.id, `${ex.id}:sub`].forEach((base) => {
        if (!newCfg[`${day}:${base}`] && state.configs[base]) newCfg[`${day}:${base}`] = JSON.parse(JSON.stringify(state.configs[base]));
      });
    });
    (CARDIO_OPTIONS[type] || []).forEach((opt) => (opt.phases || []).forEach((ph) => {
      const oldKey = `${type}:${opt.key}:${ph.key}`;
      const newKey = `${day}:${opt.key}:${ph.key}`;
      if (!newCardioCfg[newKey] && state.cardioConfig[oldKey]) newCardioCfg[newKey] = { ...state.cardioConfig[oldKey] };
    }));
  });
  state.selection = newSel; state.order = newOrder; state.cardioSelection = newCardioSel;
  state.cardioChoice = newChoice; state.configs = newCfg; state.cardioConfig = newCardioCfg;
  lsSet("wt_exercise_selection", newSel); lsSet("wt_exercise_order", newOrder);
  lsSet("wt_cardio_selection", newCardioSel); lsSet("wt_cardio_choice", newChoice);
  lsSet("wt_exercise_configs", newCfg); lsSet("wt_cardio_config", newCardioCfg);
  lsSet(VERSION_KEY, VERSION);
})();

// v42: v40의 강제 초기화 버그 복구.
// 핵심 원칙: 저장값이 있으면 절대 기본값으로 덮지 않습니다.
// v40이 만든 '정확한 초기 패턴'만 감지해서, 남아 있는 v39 이전 upper/lower 저장값으로 되돌립니다.
(function recoverFromV40ResetV42(){
  const K="wt_program_version", V=42;
  if (lsGet(K,0) >= V) return;
  const typeFor={월:"upper",화:"lower",수:"upper",목:"lower",금:"upper",토:"lower"};
  const A=["bench","incline","cablerow","legpress","legcurl","lateral","reardelt","hangingraise","cablecrunch","plank"];
  const B=["dips","assisted_chinup","rdl","legextension","ohp","triceps_pushdown","bicep","hangingraise_cardio","cablecrunch_cardio","plank_cardio"];
  const resetMap={월:A,수:A,금:A,화:B,목:B,토:B};
  const sameArray=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((v,i)=>v===b[i]);
  const sameSelection=(obj,on,natural)=>{
    if(!obj) return false;
    return natural.every(id=>Boolean(obj[id])===on.includes(id));
  };
  const clone=x=>JSON.parse(JSON.stringify(x));

  ["월","화","수","목","금","토"].forEach(day=>{
    const type=typeFor[day], on=resetMap[day], natural=EXERCISES[type].map(e=>e.id);
    const resetOrder=[...on,...natural.filter(id=>!on.includes(id))];
    const legacySel=state.selection[type];
    const legacyOrder=state.order[type];

    // v40이 정확히 만든 선택/순서일 때만 구 저장값을 복원합니다.
    if(legacySel && sameSelection(state.selection[day],on,natural)) state.selection[day]=clone(legacySel);
    if(Array.isArray(legacyOrder) && sameArray(state.order[day],resetOrder)) state.order[day]=[...legacyOrder];

    // v40은 ON 운동의 요일별 세트값을 기본값으로 덮었습니다.
    // 같은 운동의 구형 저장값(base key)이 남아 있으면 그것을 우선 복원합니다.
    on.forEach(id=>{
      const ex=EXERCISES[type].find(e=>e.id===id); if(!ex) return;
      const dayKey=`${day}:${id}`;
      const legacy=state.configs[id];
      if(legacy && state.configs[dayKey]) {
        const def=getDefaultConfig(ex); def.sets=def.sets.slice(0,3); while(def.sets.length<3) def.sets.push({...def.sets[def.sets.length-1]});
        if(JSON.stringify(state.configs[dayKey])===JSON.stringify(def)) state.configs[dayKey]=clone(legacy);
      }
    });

    // v40이 유산소 선택을 treadmill40 하나로 강제한 경우에만 구 선택값 복원.
    const opts=(CARDIO_OPTIONS[type]||[]).map(o=>o.key);
    const csel=state.cardioSelection[day]||{};
    const looksReset=opts.length>0 && opts.every(k=>Boolean(csel[k])===(k==="treadmill40"));
    if(looksReset && state.cardioSelection[type]) state.cardioSelection[day]=clone(state.cardioSelection[type]);
    const legacyChoice=state.cardioChoice[type] || state.cardioChoice[`${type}:${day}`];
    if(state.cardioChoice[day]==="treadmill40" && legacyChoice) state.cardioChoice[day]=legacyChoice;

    // v40이 덮은 유산소 구간값도 기존 type 기반 값이 남아 있을 때만 복원.
    (CARDIO_OPTIONS[type]||[]).forEach(opt=>(opt.phases||[]).forEach(ph=>{
      const dk=`${day}:${opt.key}:${ph.key}`, lk=`${type}:${opt.key}:${ph.key}`;
      if(state.cardioConfig[lk] && state.cardioConfig[dk]) state.cardioConfig[dk]={...state.cardioConfig[lk]};
    }));
  });

  state.cardioNames = state.cardioNames || {};
  lsSet("wt_exercise_selection",state.selection);
  lsSet("wt_exercise_order",state.order);
  lsSet("wt_exercise_configs",state.configs);
  lsSet("wt_cardio_selection",state.cardioSelection);
  lsSet("wt_cardio_choice",state.cardioChoice);
  lsSet("wt_cardio_config",state.cardioConfig);
  lsSet("wt_cardio_names",state.cardioNames);
  lsSet(K,V);
})();

// v33: 모든 요일에서 웨이트/유산소 선택 가능. 기존 저장값은 변경하지 않습니다.
(function migrateEverydayChoiceV33() {
  const VERSION_KEY = "wt_program_version";
  const VERSION = 33;
  if (lsGet(VERSION_KEY, 0) >= VERSION) return;
  lsSet(VERSION_KEY, VERSION);
})();

function weekdayKey() { return getDayLabel(state.selectedDate); }

function isSelected(dayType, exId) {
  const stored = state.selection[weekdayKey()];
  if (stored && Object.prototype.hasOwnProperty.call(stored, exId)) return stored[exId];
  // 유산소 날에 추가된 웨이트 항목은 기본 OFF. 사용자가 원하는 날/항목만 켭니다.
  if (dayType === "lower" && CARDIO_OPTIONAL_WEIGHT_IDS.includes(exId)) return false;
  return !DEFAULT_UNSELECTED.includes(exId);
}

function toggleSelection(dayType, exId) {
  const wk = weekdayKey();
  const next = { ...state.selection, [wk]: { ...(state.selection[wk] || {}), [exId]: !isSelected(dayType, exId) } };
  state.selection = next;
  lsSet("wt_exercise_selection", next);
  render();
}

function getOrder(dayType) {
  const natural = EXERCISES[dayType].map((e) => e.id);
  const stored = state.order[weekdayKey()];
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
  const wk = weekdayKey();
  const updated = { ...state.order, [wk]: next };
  state.order = updated;
  lsSet("wt_exercise_order", updated);
  render();
}

function isCardioSelected(dayType, optionKey) {
  const stored = state.cardioSelection[weekdayKey()];
  if (stored && stored[optionKey] !== undefined) return !!stored[optionKey];
  return true; // 기존 사용자: 유산소 선택 항목을 처음에는 모두 보이게 유지
}

function toggleCardioSelection(dayType, optionKey) {
  const next = {
    ...state.cardioSelection,
    [weekdayKey()]: { ...(state.cardioSelection[weekdayKey()] || {}), [optionKey]: !isCardioSelected(dayType, optionKey) }
  };
  state.cardioSelection = next;
  lsSet("wt_cardio_selection", next);
  const selected = (CARDIO_OPTIONS[dayType] || []).filter((o) => isCardioSelected(dayType, o.key));
  if (selected.length && !selected.some((o) => o.key === getCardioChoice(dayType))) {
    setCardioChoiceFor(dayType, selected[0].key);
  }
  render();
}

function cardioChoiceStorageKey(dayType) {
  return weekdayKey();
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
  return `${weekdayKey()}:${optionKey}:${phaseKey}`;
}

function getCardioFields(dayType, optionKey, phase) {
  const key = cardioFieldKey(dayType, optionKey, phase.key);
  const stored = state.cardioConfig[key];
  return stored ? { ...phase.fields, ...stored } : phase.fields;
}

function getCardioDurationSeconds(dayType, optionKey, phase) {
  const key = cardioFieldKey(dayType, optionKey, phase.key);
  const stored = state.cardioConfig[key] || {};
  const mins = Number(stored.durationMin);
  if (Number.isFinite(mins) && mins > 0) return Math.round(mins * 60);
  return phase.seconds;
}

function updateCardioDuration(dayType, optionKey, phaseKey, rawValue) {
  const key = cardioFieldKey(dayType, optionKey, phaseKey);
  const mins = rawValue === "" ? "" : Number(rawValue);
  const next = { ...state.cardioConfig, [key]: { ...(state.cardioConfig[key] || {}), durationMin: mins } };
  state.cardioConfig = next;
  lsSet("wt_cardio_config", next);
  render();
}

function updateCardioField(dayType, optionKey, phaseKey, fieldName, rawValue) {
  const key = cardioFieldKey(dayType, optionKey, phaseKey);
  const next = { ...state.cardioConfig, [key]: { ...(state.cardioConfig[key] || {}), [fieldName]: rawValue === "" ? "" : Number(rawValue) } };
  state.cardioConfig = next;
  lsSet("wt_cardio_config", next);
  render();
}

function cardioNameKey(optionKey) { return `${weekdayKey()}:${optionKey}`; }
function getCardioName(opt) { return state.cardioNames[cardioNameKey(opt.key)] || opt.label; }
function saveCardioName(optionKey, name) {
  const key = cardioNameKey(optionKey);
  const next = { ...state.cardioNames };
  if (String(name || "").trim()) next[key] = String(name).trim(); else delete next[key];
  state.cardioNames = next; lsSet("wt_cardio_names", next); render();
}

function estimateWorkout(dayType, exercises, cardioOpt) {
  // Dynamic estimate from the user's current weekday settings.
  // Calories are estimates, not measurements. If no saved profile weight exists,
  // keep the legacy 70 kg fallback so older installs continue to work.
  const weight = Number((state.profile && state.profile.weight) || state.profileForm.weight || 70) || 70;
  const kcalFromMet = (met, sec) => Math.max(0, Number(met) || 0) * 3.5 * weight / 200 * (Math.max(0, Number(sec) || 0) / 60);

  let activeSec = 0, restSec = 0, transitionSec = 0;
  exercises.forEach((ex) => {
    const cfg = getConfig(ex);
    const sets = getEffectiveSets(ex, cfg);
    sets.forEach((st, i) => {
      activeSec += Math.max(0, Number(cfg.workSec || DEFAULT_WORK_SECONDS));
      if (i < sets.length - 1) restSec += Math.max(0, Number(st.rest || 0));
    });
    if (sets.length) transitionSec += 45; // 기구 이동/세팅 예상시간
  });

  // Do not count all rest/setup time as vigorous lifting. Active sets use 5 MET,
  // inter-set rest 1.8 MET, and equipment transitions 2.0 MET.
  const strengthKcal = kcalFromMet(5.0, activeSec) + kcalFromMet(1.8, restSec) + kcalFromMet(2.0, transitionSec);

  const treadmillMet = (speedKmh, inclinePct) => {
    const speed = Math.max(0, Number(speedKmh) || 0);
    const grade = Math.max(0, Number(inclinePct) || 0) / 100;
    const mmin = speed * 1000 / 60;
    // ACSM walking equation for walking speeds; running equation for faster running.
    const vo2 = speed <= 7.0
      ? 0.1 * mmin + 1.8 * mmin * grade + 3.5
      : 0.2 * mmin + 0.9 * mmin * grade + 3.5;
    return Math.max(1, vo2 / 3.5);
  };

  let cardioSec = 0, cardioKcal = 0;
  if (cardioOpt) {
    cardioOpt.phases.forEach((ph) => {
      const sec = getCardioDurationSeconds(dayType, cardioOpt.key, ph);
      cardioSec += sec;
      const f = getCardioFields(dayType, cardioOpt.key, ph);
      const typ = ph.type || cardioOpt.type;

      if (typ === "treadmill") {
        // Interval phases are calculated from high/low settings in their actual time ratio.
        const hiDur = Number(f.highSeconds);
        const loDur = Number(f.lowSeconds);
        const hasInterval = Number.isFinite(hiDur) && hiDur > 0 && Number.isFinite(loDur) && loDur > 0 &&
          (f.highIncline != null || f.lowIncline != null || f.highSpeed != null || f.lowSpeed != null);
        if (hasInterval) {
          const cycle = hiDur + loDur;
          const hiSec = sec * hiDur / cycle;
          const loSec = sec - hiSec;
          cardioKcal += kcalFromMet(treadmillMet(f.highSpeed ?? f.speed ?? 6, f.highIncline ?? f.incline ?? 0), hiSec);
          cardioKcal += kcalFromMet(treadmillMet(f.lowSpeed ?? f.speed ?? 6, f.lowIncline ?? f.incline ?? 0), loSec);
        } else {
          cardioKcal += kcalFromMet(treadmillMet(f.speed ?? 6, f.incline ?? 0), sec);
        }
      } else if (typ === "stairs") {
        cardioKcal += kcalFromMet(8.0, sec);
      } else if (typ === "bike") {
        cardioKcal += kcalFromMet(6.5, sec);
      } else {
        cardioKcal += kcalFromMet(5.0, sec);
      }
    });
  }

  const totalSec = activeSec + restSec + transitionSec + cardioSec;
  return {
    minutes: Math.max(0, Math.round(totalSec / 60)),
    calories: Math.max(0, Math.round(strengthKcal + cardioKcal))
  };
}
function copyWeekdaySettings(sourceDay, targets) {
  const srcType = DAY_TYPE[sourceDay];
  targets.forEach((day) => {
    if (!DAY_TYPE[day] || day === "일") return;
    state.selection[day] = JSON.parse(JSON.stringify(state.selection[sourceDay] || {}));
    state.order[day] = JSON.parse(JSON.stringify(state.order[sourceDay] || []));
    state.cardioSelection[day] = JSON.parse(JSON.stringify(state.cardioSelection[sourceDay] || {}));
    if (state.cardioChoice[sourceDay]) state.cardioChoice[day] = state.cardioChoice[sourceDay];
    Object.keys(state.configs).filter(k=>k.startsWith(sourceDay+":" )).forEach(k=>{ state.configs[day+k.slice(sourceDay.length)] = JSON.parse(JSON.stringify(state.configs[k])); });
    Object.keys(state.cardioConfig).filter(k=>k.startsWith(sourceDay+":" )).forEach(k=>{ state.cardioConfig[day+k.slice(sourceDay.length)] = JSON.parse(JSON.stringify(state.cardioConfig[k])); });
    Object.keys(state.cardioNames).filter(k=>k.startsWith(sourceDay+":" )).forEach(k=>{ state.cardioNames[day+k.slice(sourceDay.length)] = state.cardioNames[k]; });
  });
  lsSet("wt_exercise_selection",state.selection); lsSet("wt_exercise_order",state.order); lsSet("wt_cardio_selection",state.cardioSelection); lsSet("wt_cardio_choice",state.cardioChoice); lsSet("wt_exercise_configs",state.configs); lsSet("wt_cardio_config",state.cardioConfig); lsSet("wt_cardio_names",state.cardioNames);
}

function setExerciseOrder(dayType, ids) {
  const natural = EXERCISES[dayType].map(e=>e.id); const cleaned = ids.filter(id=>natural.includes(id));
  const next=[...cleaned,...natural.filter(id=>!cleaned.includes(id))]; state.order={...state.order,[weekdayKey()]:next}; lsSet("wt_exercise_order",state.order); render();
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
function tipOverrideKey(ex) {
  return state.substituted[ex.id] ? `${ex.id}:sub` : ex.id;
}

function getExDisplay(ex) {
  const base = state.substituted[ex.id] && ex.substitutes && ex.substitutes[0]
    ? { ...ex, ...ex.substitutes[0] }
    : ex;
  const ov = state.tipOverrides[tipOverrideKey(ex)];
  return ov ? { ...base, name: ov.name ?? base.name, tip: ov.tip ?? base.tip, breath: ov.breath ?? base.breath } : base;
}

function saveTipOverride(ex, name, tip, breath) {
  const key = tipOverrideKey(ex);
  state.tipOverrides = { ...state.tipOverrides, [key]: { name, tip, breath } };
  lsSet("wt_exercise_tip_overrides", state.tipOverrides);
}

function resetTipOverride(ex) {
  const key = tipOverrideKey(ex);
  const next = { ...state.tipOverrides };
  delete next[key];
  state.tipOverrides = next;
  lsSet("wt_exercise_tip_overrides", next);
}

function escapeHTML(v) {
  return String(v ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
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
  const base = state.substituted[ex.id] ? `${ex.id}:sub` : ex.id;
  return `${weekdayKey()}:${base}`;
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

// v25: 전 운동 3세트 + 케이블 팔 3종목 추가. 기존 사용자의 중량/횟수/휴식값은 유지하고 세트 수만 3개로 맞춥니다.
(function migrateV25ThreeSetsAndCableArms() {
  const VERSION_KEY = "wt_program_version";
  const VERSION = 25;
  if (lsGet(VERSION_KEY, 0) >= VERSION) return;
  const migrated = { ...state.configs };
  ["upper", "lower"].forEach((dayType) => {
    EXERCISES[dayType].forEach((ex) => {
      const defaults = ex.sets.map((x) => ({ ...x })).slice(0, 3);
      while (defaults.length < 3) defaults.push({ ...(defaults[defaults.length - 1] || { value:null, reps:12, rest:45 }) });
      const old = migrated[ex.id];
      if (old && Array.isArray(old.sets) && old.sets.length) {
        const oldSets = old.sets.slice(0, 3);
        oldSets.forEach((set, i) => {
          defaults[i] = { ...defaults[i], ...set };
        });
        while (oldSets.length < 3) {
          const source = oldSets[oldSets.length - 1] || defaults[oldSets.length];
          defaults[oldSets.length] = { ...defaults[oldSets.length], ...source };
          oldSets.push(source);
        }
      }
      migrated[ex.id] = { workSec: (old && old.workSec) || ex.defaultWorkSec || DEFAULT_WORK_SECONDS, sets: defaults };
    });
  });
  state.configs = migrated;
  // 플라이는 루틴에서는 기본 제외. 사용자가 이미 직접 ON/OFF를 저장했다면 그 선택은 존중합니다.
  state.selection = { ...state.selection, upper: { ...(state.selection.upper || {}) } };
  if (state.selection.upper.flye === undefined) state.selection.upper.flye = false;
  // 기존 순서는 유지하되 새 팔 운동은 리어델트 뒤, 이두 앞에 끼워 넣습니다.
  const baseOrder = (state.order.upper && state.order.upper.length) ? [...state.order.upper] : EXERCISES.upper.map((e) => e.id);
  const validIds = new Set(EXERCISES.upper.map((e) => e.id));
  let order = baseOrder.filter((id) => validIds.has(id) && id !== "triceps_pushdown" && id !== "triceps_overhead");
  let anchor = order.indexOf("bicep");
  if (anchor < 0) anchor = order.length;
  order.splice(anchor, 0, "triceps_pushdown", "triceps_overhead");
  state.order = { ...state.order, upper: order };
  lsSet("wt_exercise_configs", state.configs);
  lsSet("wt_exercise_selection", state.selection);
  lsSet("wt_exercise_order", state.order);
  lsSet(VERSION_KEY, VERSION);
})();

// v26: 랫풀다운을 어시스티드 친업으로 교체. 기존 랫풀다운/덤벨 컬은 삭제하지 않고 OFF로 보존.
(function migrateToV26() {
  const VERSION_KEY = "wt_program_version";
  const VERSION = 26;
  if (lsGet(VERSION_KEY, 0) >= VERSION) return;

  state.selection = { ...state.selection, upper: { ...(state.selection.upper || {}) } };
  state.selection.upper.assisted_chinup = true;
  state.selection.upper.latpull = false;
  state.selection.upper.dumbbell_bicep = false;

  // 기존 사용자의 랫풀다운 위치에 친업을 넣고, OFF 운동은 목록에 남겨 선택 화면에서 다시 켤 수 있게 유지.
  const validIds = new Set(EXERCISES.upper.map((e) => e.id));
  let order = (state.order.upper && state.order.upper.length) ? [...state.order.upper] : EXERCISES.upper.map((e) => e.id);
  order = order.filter((id) => validIds.has(id) && id !== "assisted_chinup" && id !== "dumbbell_bicep");
  let latIndex = order.indexOf("latpull");
  if (latIndex < 0) {
    const rowIndex = order.indexOf("cablerow");
    latIndex = rowIndex >= 0 ? rowIndex + 1 : 0;
  }
  order.splice(latIndex, 0, "assisted_chinup");
  const bicepIndex = order.indexOf("bicep");
  order.splice(bicepIndex >= 0 ? bicepIndex + 1 : order.length, 0, "dumbbell_bicep");
  state.order = { ...state.order, upper: order };

  lsSet("wt_exercise_selection", state.selection);
  lsSet("wt_exercise_order", state.order);
  lsSet(VERSION_KEY, VERSION);
})();

// ---------- Voice guidance ----------
// Android/Chrome의 Web Speech API는 긴 문장을 한 번에 읽거나 여러 utterance를
// 한꺼번에 큐에 넣으면 중간에 멈추는 경우가 있다. 짧은 조각을 하나씩 onend로
// 이어 읽고, 현재 utterance 참조를 유지해 GC로 음성이 끊기는 현상을 줄인다.
let voiceRunId = 0;
let activeUtterance = null;
let voiceChunks = [];

function splitSpeechText(text) {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  // 문장부호 기준으로 먼저 나누고, 너무 긴 문장은 쉼표 기준으로 한 번 더 나눈다.
  const sentences = normalized.match(/[^.!?]+[.!?]?/g) || [normalized];
  const chunks = [];
  sentences.forEach((raw) => {
    const sentence = raw.trim();
    if (!sentence) return;
    if (sentence.length <= 70) {
      chunks.push(sentence);
      return;
    }
    const parts = sentence.replace(/([,，])/g, "$1|").split("|").map((x) => x.trim()).filter(Boolean);
    let buf = "";
    parts.forEach((part) => {
      if (buf && (buf + " " + part).length > 70) {
        chunks.push(buf.trim());
        buf = part;
      } else {
        buf = buf ? `${buf} ${part}` : part;
      }
    });
    if (buf.trim()) chunks.push(buf.trim());
  });
  return chunks;
}

function stopSpeech() {
  voiceRunId += 1;
  voiceChunks = [];
  activeUtterance = null;
  try {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  } catch (e) {}
}

function speakNextChunk(runId, koVoice) {
  if (runId !== voiceRunId || !state.voiceEnabled || !window.speechSynthesis) return;
  const chunk = voiceChunks.shift();
  if (!chunk) {
    activeUtterance = null;
    return;
  }

  const u = new SpeechSynthesisUtterance(chunk);
  activeUtterance = u;
  u.lang = "ko-KR";
  u.rate = 0.96;
  u.pitch = 1.0;
  if (koVoice) u.voice = koVoice;

  u.onend = () => {
    if (runId !== voiceRunId) return;
    activeUtterance = null;
    // Android에서 다음 utterance를 즉시 넣을 때 누락되는 경우가 있어 아주 짧게 띄운다.
    setTimeout(() => speakNextChunk(runId, koVoice), 80);
  };
  u.onerror = (event) => {
    if (runId !== voiceRunId) return;
    activeUtterance = null;
    // cancel/interrupted는 새 안내가 시작된 정상 상황일 수 있다.
    if (event && (event.error === "canceled" || event.error === "interrupted")) return;
    setTimeout(() => speakNextChunk(runId, koVoice), 120);
  };

  try { window.speechSynthesis.speak(u); } catch (e) {
    activeUtterance = null;
    setTimeout(() => speakNextChunk(runId, koVoice), 120);
  }
}

function speak(text) {
  if (!state.voiceEnabled) return;
  try {
    if (!window.speechSynthesis) return;
    stopSpeech();
    const chunks = splitSpeechText(text);
    if (!chunks.length) return;
    const runId = voiceRunId;
    voiceChunks = chunks;

    // 일부 Android 기기는 voices가 늦게 로드되므로, 없어도 ko-KR lang으로 바로 재생한다.
    const voices = window.speechSynthesis.getVoices() || [];
    const koVoice = voices.find((v) => v.lang === "ko-KR") || voices.find((v) => v.lang && v.lang.startsWith("ko"));
    setTimeout(() => speakNextChunk(runId, koVoice), 80);
  } catch (e) {}
}

function toggleVoice() {
  state.voiceEnabled = !state.voiceEnabled;
  lsSet("wt_voice_enabled", state.voiceEnabled);
  if (!state.voiceEnabled) stopSpeech();
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
  state.selectedExerciseId = null;
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
    const dt=getDayType(dateStr); const exs=getOrderedExercises(dt).filter(ex=>isSelected(dt,ex.id)); const opts=(CARDIO_OPTIONS[dt]||[]).filter(o=>isCardioSelected(dt,o.key)); const opt=opts.find(o=>o.key===getCardioChoice(dt))||opts[0]||null; state.summary[dateStr] = { calories: estimateWorkout(dt,exs,opt).calories };
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

  // 상세 화면에서 목록으로 돌아왔을 때, 방금 선택했던 항목 위치로 복귀한다.
  if (state.pendingListScroll) {
    const target = state.pendingListScroll;
    state.pendingListScroll = null;
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-listtarget="${target}"]`);
      if (el) el.scrollIntoView({ behavior: "auto", block: "center" });
    });
  }
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

  const tipKey = tipOverrideKey(ex);
  const isTipEditing = !!state.tipEditOpen[tipKey];
  const hasCustomTip = Object.prototype.hasOwnProperty.call(state.tipOverrides, tipKey);
  const tipHTML = isTipEditing
    ? `<div style="background:#14161A;border:1px solid #333944;border-radius:8px;padding:10px;margin-bottom:10px">
        <div style="font-size:12px;color:#8A93A3;margin-bottom:5px">🏷️ 운동 이름</div>
        <input data-tipfield="${ex.id}|name" enterkeyhint="next" value="${escapeHTML(disp.name || "")}" style="width:100%;box-sizing:border-box;background:#0F1115;border:1px solid #333944;border-radius:6px;color:#ECEEF2;padding:8px;font-size:14px;margin-bottom:8px">
        <div style="font-size:12px;color:#8A93A3;margin-bottom:5px">💡 운동 팁</div>
        <textarea data-tipfield="${ex.id}|tip" enterkeyhint="next" style="width:100%;min-height:92px;box-sizing:border-box;background:#0F1115;border:1px solid #333944;border-radius:6px;color:#ECEEF2;padding:8px;font-size:14px;line-height:1.5;resize:vertical">${escapeHTML(disp.tip || "")}</textarea>
        <div style="font-size:12px;color:#8A93A3;margin:8px 0 5px">🫁 호흡</div>
        <textarea data-tipfield="${ex.id}|breath" enterkeyhint="done" style="width:100%;min-height:58px;box-sizing:border-box;background:#0F1115;border:1px solid #333944;border-radius:6px;color:#ECEEF2;padding:8px;font-size:14px;line-height:1.5;resize:vertical">${escapeHTML(disp.breath || "")}</textarea>
        <div style="display:flex;gap:7px;margin-top:8px">
          <button data-savetip="${ex.id}" style="flex:1;background:#F5C518;border:none;border-radius:6px;padding:8px;font-weight:700;color:#14161A;cursor:pointer">저장</button>
          ${hasCustomTip ? `<button data-resettip="${ex.id}" style="background:#262B34;border:1px solid #333944;border-radius:6px;padding:8px 10px;color:#B8BFC9;cursor:pointer">기본값</button>` : ""}
          <button data-canceltip="${ex.id}" style="background:none;border:1px solid #333944;border-radius:6px;padding:8px 10px;color:#8A93A3;cursor:pointer">취소</button>
        </div>
      </div>`
    : `<div style="background:#14161A;border:1px solid #262B34;border-radius:8px;padding:8px 10px;margin-bottom:10px;font-size:14px;color:#B8BFC9;line-height:1.5">
        ${disp.tip ? `💡 ${escapeHTML(disp.tip)}` : "💡 팁 없음"}
        ${disp.breath ? `<div style="margin-top:6px;color:#8FBFA8">🫁 호흡: ${escapeHTML(disp.breath)}</div>` : ""}
        ${!isActive ? `<button data-edittip="${ex.id}" style="margin-top:8px;background:none;border:1px solid #333944;border-radius:6px;padding:5px 9px;color:#B8BFC9;font-size:12px;cursor:pointer">✏️ 운동 정보 수정${hasCustomTip ? " · 사용자 설정" : ""}</button>` : ""}
      </div>`;

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

function exerciseOverviewHTML(exercises) {
  return `<div class="card" style="overflow:hidden">
    <div style="padding:12px 14px;border-bottom:1px solid #262B34;display:flex;justify-content:space-between;align-items:center">
      <div style="font-size:15px;font-weight:700">오늘 운동 목록</div>
      <div style="font-size:12px;color:#8A93A3">운동을 누르면 상세 화면</div>
    </div>
    ${exercises.map((ex, i) => {
      const disp = getExDisplay(ex);
      const cfg = getConfig(ex);
      const effSets = getEffectiveSets(ex, cfg);
      const doneCount = effSets.filter((_, idx) => state.completed[`${ex.id}-${idx}`]).length;
      const done = doneCount === effSets.length;
      return `<button data-openexercise="${ex.id}" data-listtarget="exercise:${ex.id}" style="width:100%;background:transparent;border:none;border-bottom:${i === exercises.length - 1 ? 'none' : '1px solid #262B34'};padding:13px 14px;color:#ECEEF2;display:flex;align-items:center;gap:11px;text-align:left;cursor:pointer">
        <div class="mono" style="width:24px;color:${done ? '#4CAF7D' : '#F5C518'};font-size:14px">${done ? '✓' : pad(i + 1)}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:16px;font-weight:700">${disp.name}</div>
          <div style="font-size:12px;color:#8A93A3;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${buildSummary(ex)}${doneCount && !done ? ` · ${doneCount}/${effSets.length} 완료` : ''}</div>
        </div>
        <span style="color:#8A93A3;font-size:18px">›</span>
      </button>`;
    }).join('')}
  </div>`;
}

// v33: 실제 선택 운동 + 사용 가능한 유산소 구성에 따라 데이 이름을 자동 표시합니다.
function getDynamicDayLabel(dayType, exercises) {
  if (dayType === "rest") return "완전 휴식";
  return dayType === "upper" ? "A 프로그램" : "B 프로그램";
}

function dayHTML() {
  const dayType = getDayType(state.selectedDate);
  const allExercises = getOrderedExercises(dayType);
  const exercises = allExercises.filter((ex) => isSelected(dayType, ex.id));
  const info = { ...DAY_INFO[dayType], label: getDynamicDayLabel(dayType, exercises) };
  const totalSets = exercises.reduce((a, ex) => a + getConfig(ex).sets.length, 0);
  const doneSets = Object.values(state.completed).filter(Boolean).length;
  const dateObj = parseLocalDate(state.selectedDate);
  const dateLabel = `${dateObj.getMonth() + 1}월 ${dateObj.getDate()}일 (${getDayLabel(state.selectedDate)})`;
  const blockRunning = !!state.activeExerciseId;
  const selectedExercise = state.selectedExerciseId ? exercises.find((ex) => ex.id === state.selectedExerciseId) : null;
  const coreDoneSets = dayType === "lower" ? exercises.reduce((n, ex) => n + getEffectiveSets(ex, getConfig(ex)).filter((_, idx) => state.completed[`${ex.id}-${idx}`]).length, 0) : doneSets;
  const progressHTML = dayType === "upper"
    ? `<div style="margin-top:14px;height:6px;background:#262B34;border-radius:3px;overflow:hidden"><div style="width:${totalSets ? (doneSets / totalSets) * 100 : 0}%;height:100%;background:#4CAF7D;transition:width .3s"></div></div><div style="font-size:12px;color:#8A93A3;margin-top:6px">${doneSets} / ${totalSets} 세트 완료</div>`
    : dayType === "lower"
      ? `<div style="margin-top:14px;font-size:12px;color:#8A93A3">선택운동 ${coreDoneSets}/${totalSets} 세트 · 유산소 ${state.completed.cardio ? '<span style="color:#4CAF7D">✓ 완료</span>' : '미완료'}</div>`
      : `<div style="margin-top:14px;font-size:12px;color:#8A93A3">회복일 · 운동 기록 없음</div>`;

  const selectionHTML = (dayType === "upper" || dayType === "lower") ? `
    <div class="card" style="background:#1B2229;border:1px solid #3E8FB0">
      <div data-toggleselection style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;cursor:pointer">
        <div style="font-size:14px;font-weight:800;color:#F5C518">운동 선택 · 순서 편집</div>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:12px;color:#8A93A3">웨이트·코어 ${exercises.length}/${allExercises.length} · 유산소 ${(CARDIO_OPTIONS[dayType] || []).filter((o) => isCardioSelected(dayType, o.key)).length}/${(CARDIO_OPTIONS[dayType] || []).length}</span>
          <span style="color:#8A93A3">${state.selectionOpen ? "⌃" : "⌄"}</span>
        </div>
      </div>
      ${
        state.selectionOpen
          ? `<div style="padding:0 14px 12px;display:flex;flex-direction:column;gap:8px">
              ${(CARDIO_OPTIONS[dayType] || []).length ? `<div style="margin:2px 0 4px;padding:10px 0;border-bottom:1px solid #3A3F49;font-size:13px;font-weight:800;color:#3E8FB0">유산소 운동 선택</div>${(CARDIO_OPTIONS[dayType] || []).map((opt) => { const checked = isCardioSelected(dayType, opt.key); return `<label data-togglecardiosel="${opt.key}" style="display:flex;align-items:center;gap:10px;cursor:pointer;padding:9px 0;border-bottom:1px solid #262B34"><div style="width:20px;height:20px;border-radius:5px;flex-shrink:0;border:${checked ? "none" : "1px solid #545C6B"};background:${checked ? "#3E8FB0" : "transparent"};display:flex;align-items:center;justify-content:center">${checked ? '<span style="color:#14161A;font-size:12px">✓</span>' : ""}</div><div style="font-size:14px;font-weight:700;color:${checked ? "#ECEEF2" : "#8A93A3"}">${getCardioName(opt)}</div></label>`; }).join("")}<div style="margin:10px 0 2px;font-size:13px;font-weight:800;color:#4CAF7D">웨이트 · 코어 운동 선택</div>` : ""}
              ${allExercises
                .map((ex, idx) => {
                  const checked = isSelected(dayType, ex.id);
                  return `<div data-sortrow="${ex.id}" style="display:flex;align-items:flex-start;gap:10px;padding:6px 0;border-bottom:1px solid #262B34">
                      <label data-toggleselex="${ex.id}" style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;flex:1">
                        <div style="width:20px;height:20px;margin-top:1px;border-radius:5px;flex-shrink:0;border:${checked ? "none" : "1px solid #545C6B"};background:${checked ? "#4CAF7D" : "transparent"};display:flex;align-items:center;justify-content:center">${checked ? '<span style="color:#14161A;font-size:12px">✓</span>' : ""}</div>
                        <div style="flex:1">
                          <div style="font-size:14px;font-weight:600;color:${checked ? "#ECEEF2" : "#8A93A3"}">${getExDisplay(ex).name}</div>
                          <div style="font-size:12px;color:#8A93A3;margin-top:2px">${buildSummary(ex)}</div>
                        </div>
                      </label>
                      <div style="display:flex;align-items:center;gap:2px;flex-shrink:0">
                        <button data-draghandle="${ex.id}" aria-label="${getExDisplay(ex).name} 순서 드래그" style="width:36px;height:44px;background:none;border:none;color:#8A93A3;touch-action:none;cursor:grab;font-size:22px">≡</button>
                        <div style="display:flex;flex-direction:column"><button data-moveex="${ex.id}|-1" ${idx === 0 ? "disabled" : ""} style="width:24px;height:20px;background:none;border:none;color:${idx === 0 ? "#3A3F49" : "#8A93A3"};font-size:12px">⌃</button><button data-moveex="${ex.id}|1" ${idx === allExercises.length - 1 ? "disabled" : ""} style="width:24px;height:20px;background:none;border:none;color:${idx === allExercises.length - 1 ? "#3A3F49" : "#8A93A3"};font-size:12px">⌄</button></div>
                      </div>
                    </div>`;
                })
                .join("")}
              <div style="margin-top:10px;padding-top:12px;border-top:1px solid #3A3F49">
                <div style="font-size:13px;font-weight:800;margin-bottom:8px">요일 설정 복사</div>
                <div style="display:flex;gap:6px;flex-wrap:wrap">${["월","화","수","목","금","토"].filter(d=>d!==weekdayKey()).map(d=>`<label style="font-size:13px"><input type="checkbox" data-copytarget="${d}"> ${d}</label>`).join("")}</div>
                <button data-copysettings style="margin-top:9px;background:#262B34;border:1px solid #545C6B;border-radius:8px;color:#ECEEF2;padding:9px 12px;font-weight:700">현재 ${weekdayKey()}요일 설정 복사</button>
              </div>
            </div>`
          : ""
      }
    </div>` : "";

  const allCardioOptions = CARDIO_OPTIONS[dayType] || [];
  const cardioOptions = allCardioOptions.filter((o) => isCardioSelected(dayType, o.key));
  const cardioChoiceKey = cardioOptions.length ? getCardioChoice(dayType) : null;
  const activeCardioOption = cardioOptions.length ? (cardioOptions.find((o) => o.key === cardioChoiceKey) || cardioOptions[0]) : null;
  const cardioPhases = activeCardioOption ? activeCardioOption.phases : [];
  const cardioType = activeCardioOption ? activeCardioOption.type : null;
  const estimate = estimateWorkout(dayType, exercises, activeCardioOption);
  info.duration = estimate.minutes; info.calories = estimate.calories;
  const cardioEditKey = `${dayType}:${cardioChoiceKey || "none"}`;
  const isCardioEditOpen = !!state.cardioEditOpen[cardioEditKey];
  const cardioFieldStyle = "width:64px;background:#14161A;border:1px solid #333944;border-radius:6px;color:#ECEEF2;padding:5px 4px;font-family:ui-monospace,monospace;font-size:13px;text-align:center;display:block;margin-top:3px";
  const cardioTabsHTML =
    cardioOptions.length > 1 && !(dayType === "lower" && state.selectedCardioKey)
      ? `<div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap">
          ${cardioOptions
            .map(
              (opt, i) =>
                `<button data-cardiotab="${opt.key}" style="background:${opt.key === cardioChoiceKey ? "#F5C518" : "#262B34"};color:${opt.key === cardioChoiceKey ? "#14161A" : "#ECEEF2"};border:1px solid #333944;border-radius:999px;padding:5px 10px;font-size:12px;font-weight:600;cursor:pointer">${i + 1}순위 · ${getCardioName(opt)}</button>`
            )
            .join("")}
        </div>`
      : "";

  const cardioEditFieldHTML = (phase, fields, isMain) => {
    if (!isCardioEditOpen) return "";
    const inp = (label, fieldName, value) =>
      `<label style="font-size:11px;color:#8A93A3">${label}<input type="number" data-cardiofield="${dayType}|${cardioChoiceKey}|${phase.key}|${fieldName}" value="${value}" style="${cardioFieldStyle}" /></label>`;
    const durationSeconds = getCardioDurationSeconds(dayType, cardioChoiceKey, phase);
    const durationInput = `<label style="font-size:11px;color:#F5C518">시간(분)<input type="number" min="1" step="1" data-cardioduration="${dayType}|${cardioChoiceKey}|${phase.key}" value="${Math.round(durationSeconds / 60)}" style="${cardioFieldStyle}" /></label>`;
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
    return `<div style="display:flex;gap:8px;flex-wrap:wrap;padding:8px 4px 0">${durationInput}${inputs}</div>`;
  };

  const cardioDayOverviewHTML = (dayType === "lower" || dayType === "upper") ? `<div class="card" style="overflow:hidden">
    <div style="padding:12px 14px;border-bottom:1px solid #262B34;display:flex;justify-content:space-between;align-items:center">
      <div style="font-size:15px;font-weight:700">오늘 운동 목록</div>
      <div style="font-size:12px;color:#8A93A3">웨이트·코어·유산소 선택</div>
    </div>
    ${exercises.map((ex, i) => {
      const cfg = getConfig(ex); const disp = getExDisplay(ex); const effSets = getEffectiveSets(ex, cfg); const doneCount = effSets.filter((_, idx) => state.completed[`${ex.id}-${idx}`]).length; const done = doneCount === effSets.length;
      return `<button data-openexercise="${ex.id}" data-listtarget="exercise:${ex.id}" style="width:100%;background:transparent;border:none;border-bottom:1px solid #262B34;padding:13px 14px;color:#ECEEF2;display:flex;align-items:center;gap:11px;text-align:left;cursor:pointer"><div class="mono" style="width:24px;color:${done ? '#4CAF7D' : '#F5C518'};font-size:14px">${done ? '✓' : pad(i + 1)}</div><div style="flex:1"><div style="font-size:16px;font-weight:700">${disp.name}</div><div style="font-size:12px;color:#8A93A3;margin-top:3px">${buildSummary(ex)}</div></div><span style="color:#8A93A3;font-size:18px">›</span></button>`;
    }).join('')}
    ${cardioOptions.map((opt, i) => `<button data-opencardio="${opt.key}" data-listtarget="cardio:${opt.key}" style="width:100%;background:transparent;border:none;border-bottom:${i === cardioOptions.length - 1 ? 'none' : '1px solid #262B34'};padding:13px 14px;color:#ECEEF2;display:flex;align-items:center;gap:11px;text-align:left;cursor:pointer"><div class="mono" style="width:24px;color:${state.completed.cardio && getCardioChoice(dayType) === opt.key ? '#4CAF7D' : '#3E8FB0'};font-size:14px">${state.completed.cardio && getCardioChoice(dayType) === opt.key ? '✓' : pad(exercises.length + i + 1)}</div><div style="flex:1"><div style="font-size:16px;font-weight:700">${getCardioName(opt)}</div><div style="font-size:12px;color:#8A93A3;margin-top:3px">탭하면 상세 보기</div></div><span style="color:#8A93A3;font-size:18px">›</span></button>`).join('')}
  </div>` : "";

  const cardioHTML = activeCardioOption ? `
    <div class="card" style="padding:14px;margin-top:4px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
        <div class="mono" style="font-size:14px;color:#3E8FB0;width:22px">${pad(exercises.length + 1)}</div>
        <div style="font-weight:700;font-size:16px;flex:1">유산소</div>
        <button data-togglecardioedit="${cardioEditKey}" style="background:none;border:none;color:#8A93A3;font-size:13px;cursor:pointer">${isCardioEditOpen ? "완료" : "✏️ 수정"}</button>
      </div>
      ${cardioTabsHTML}
      ${isCardioEditOpen ? `<label style="display:block;font-size:12px;color:#8A93A3;margin-bottom:8px">유산소 운동명<input data-cardioname="${cardioChoiceKey}" value="${escapeHTML(getCardioName(activeCardioOption))}" enterkeyhint="done" style="width:100%;box-sizing:border-box;margin-top:4px;background:#14161A;border:1px solid #333944;border-radius:7px;color:#ECEEF2;padding:9px;font-size:16px"></label>` : ""}
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
                <div class="mono" style="display:flex;align-items:center;gap:6px;color:#3E8FB0">${formatTime(getCardioDurationSeconds(dayType, cardioChoiceKey, p))} ▶</div>
              </button>
              ${cardioEditFieldHTML(p, fields, isMain)}
            </div>`;
          })
          .join("")}
      </div>
      <button data-startcardio="all" style="width:100%;margin-top:12px;background:#3E8FB0;border:none;border-radius:10px;padding:13px;font-size:15px;font-weight:700;color:#14161A;cursor:pointer">▶ ${getCardioName(activeCardioOption)} 전체 자동 진행</button>
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
      ${dayType === "upper" && !selectedExercise && !state.selectedCardioKey ? `
        <div style="padding:0 16px;display:flex;flex-direction:column;gap:10px">
          ${cardioDayOverviewHTML}
          ${exercises.length > 0 ? `<button data-blockstart="all" ${blockRunning ? "disabled" : ""} style="width:100%;background:${blockRunning ? "#1E222A" : "#F5C518"};border:none;border-radius:10px;padding:13px;font-size:15px;font-weight:700;color:${blockRunning ? "#8A93A3" : "#14161A"};cursor:${blockRunning ? "default" : "pointer"}">▶ 웨이트 전체 자동 진행</button>` : ""}
        </div>` : ''}
      ${(dayType === "upper" || dayType === "lower") && selectedExercise ? `
        <div style="padding:0 16px;display:flex;flex-direction:column;gap:10px">
          <button id="backToExerciseList" style="background:#1E222A;border:1px solid #333944;border-radius:9px;padding:10px 12px;color:#ECEEF2;font-size:14px;text-align:left;cursor:pointer">‹ 오늘 운동 목록으로</button>
          ${exerciseCardHTML(selectedExercise, exercises.indexOf(selectedExercise))}
        </div>` : ''}
      ${dayType === "lower" && !selectedExercise && !state.selectedCardioKey ? `<div style="padding:0 16px;display:flex;flex-direction:column;gap:10px">${cardioDayOverviewHTML}</div>` : ''}
      ${(dayType === "upper" || dayType === "lower") && state.selectedCardioKey ? `<div style="padding:0 16px;display:flex;flex-direction:column;gap:10px"><button id="backToExerciseList" style="background:#1E222A;border:1px solid #333944;border-radius:9px;padding:10px 12px;color:#ECEEF2;font-size:14px;text-align:left;cursor:pointer">‹ 오늘 운동 목록으로</button>${cardioHTML}</div>` : ''}
      <div style="padding:0 16px;display:flex;flex-direction:column;gap:10px">
        ${dayType === "rest" ? cardioHTML : ''}
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
    // 마지막 세트가 끝난 단독 운동은 불필요한 휴식 없이 오늘 운동 목록으로 즉시 복귀한다.
    if (t.nextSetIdx == null && (!state.queue || state.queue.length === 0)) {
      speak("이 운동을 완료했습니다.");
      state.activeExerciseId = null;
      state.queue = null;
      state.timer = null;
      state.pendingListScroll = state.returnListTarget || `exercise:${t.exId}`;
      state.returnListTarget = null;
      state.selectedExerciseId = null;
      state.selectedCardioKey = null;
      normalizeHistoryToWorkoutList();
    } else if (t.restSec > 0) {
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
      state.pendingListScroll = state.returnListTarget || `cardio:${t.optionKey}`;
      state.returnListTarget = null;
      state.selectedExerciseId = null;
      state.selectedCardioKey = null;
      normalizeHistoryToWorkoutList();
      speak("오늘 유산소를 완료했습니다. 수고하셨습니다.");
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
  const phaseSeconds = getCardioDurationSeconds(getDayType(state.selectedDate), option.key, phase);
  speak(`${phase.label}입니다. ${Math.round(phaseSeconds / 60)}분간 진행하세요.`);
  clearInterval(state.timerHandle);
  state.timer = {
    kind: "cardioProgram",
    label: `${option.label} · ${phase.label}`,
    optionKey: option.key,
    phaseIndex,
    remaining: phaseSeconds,
    total: phaseSeconds,
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
    state.selectedExerciseId = null;
    state.selectedCardioKey = null;
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

// Keep browser history aligned with the visible workout list.
// When a detail workout ends (or the user explicitly returns), the current
// history entry must become the list instead of leaving completed exercises
// behind in the Android Back-button stack.
function normalizeHistoryToWorkoutList() {
  try {
    history.replaceState({ view: "day", date: state.selectedDate, subview: "list" }, "", "");
  } catch (e) {}
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
        history.pushState({ view: "day", date: dateStr, subview: "list" }, "", "");
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
    state.selectedExerciseId = null;
    state.selectedCardioKey = null;
    state.view = "calendar";
    history.pushState({ view: "calendar" }, "", "");
    render();
  };

  document.getElementById("toggleVoice").onclick = toggleVoice;

  document.getElementById("resetDay").onclick = () => {
    state.completed = {};
    saveProgress();
    updateSummary(state.selectedDate, false);
    state.sessionStart = null;
    state.activeExerciseId = null;
    state.queue = null;
    state.selectedExerciseId = null;
    state.selectedCardioKey = null;
    clearInterval(state.elapsedHandle);
    clearInterval(state.timerHandle);
    state.timer = null;
    render();
  };

  document.querySelectorAll("[data-openexercise]").forEach((el) => {
    el.onclick = () => {
      state.selectedCardioKey = null;
      state.selectedExerciseId = el.getAttribute("data-openexercise");
      state.returnListTarget = `exercise:${state.selectedExerciseId}`;
      state.expanded[state.selectedExerciseId] = true;
      history.pushState({ view: "day", date: state.selectedDate, subview: "exercise", exerciseId: state.selectedExerciseId }, "", "");
      render();
      window.scrollTo(0, 0);
    };
  });

  document.querySelectorAll("[data-opencardio]").forEach((el) => {
    el.onclick = () => {
      const key = el.getAttribute("data-opencardio");
      const dayType = getDayType(state.selectedDate);
      state.selectedExerciseId = null;
      state.selectedCardioKey = key;
      state.returnListTarget = `cardio:${key}`;
      history.pushState({ view: "day", date: state.selectedDate, subview: "cardio", cardioKey: key }, "", "");
      setCardioChoiceFor(dayType, key);
      window.scrollTo(0, 0);
    };
  });

  const backToExerciseList = document.getElementById("backToExerciseList");
  if (backToExerciseList) backToExerciseList.onclick = () => {
    state.pendingListScroll = state.returnListTarget;
    state.returnListTarget = null;
    state.selectedExerciseId = null;
    state.selectedCardioKey = null;
    normalizeHistoryToWorkoutList();
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

  document.querySelectorAll("[data-togglecardiosel]").forEach((el) => {
    el.onclick = () => {
      const optionKey = el.getAttribute("data-togglecardiosel");
      const dayType = getDayType(state.selectedDate);
      toggleCardioSelection(dayType, optionKey);
    };
  });

  const copyBtn=document.querySelector("[data-copysettings]");
  if(copyBtn) copyBtn.onclick=()=>{ const targets=[...document.querySelectorAll("[data-copytarget]:checked")].map(x=>x.getAttribute("data-copytarget")); if(!targets.length){ alert("복사할 요일을 선택하세요."); return; } if(confirm(`${weekdayKey()}요일 설정을 ${targets.join(", ")}요일에 덮어쓸까요?`)){ copyWeekdaySettings(weekdayKey(),targets); render(); } };

  // v41: 모바일에서도 확실히 동작하도록 document 단위 Pointer Events로 드래그 정렬.
  // 드래그 중 손가락의 Y좌표와 각 행의 중앙점을 비교해 DOM 순서를 즉시 바꿉니다.
  document.querySelectorAll("[data-draghandle]").forEach((handle)=>{
    handle.onpointerdown=(e)=>{
      if (e.button !== undefined && e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      const row=handle.closest("[data-sortrow]");
      if(!row) return;
      const pointerId=e.pointerId;
      let moved=false;
      const startY=e.clientY;
      handle.style.opacity=".55";
      handle.style.cursor="grabbing";
      row.style.background="#242C35";
      row.style.borderRadius="8px";

      const onMove=(ev)=>{
        if(ev.pointerId!==pointerId) return;
        ev.preventDefault();
        if(Math.abs(ev.clientY-startY)>4) moved=true;
        const rows=[...document.querySelectorAll("[data-sortrow]")].filter(r=>r!==row);
        if(!rows.length) return;
        let before=null;
        for(const r of rows){
          const b=r.getBoundingClientRect();
          if(ev.clientY < b.top + b.height/2){ before=r; break; }
        }
        const parent=row.parentNode;
        if(before) parent.insertBefore(row,before);
        else {
          const last=rows[rows.length-1];
          if(last && last.parentNode===parent) parent.insertBefore(row,last.nextSibling);
        }
      };
      const done=(ev)=>{
        if(ev.pointerId!==pointerId) return;
        document.removeEventListener("pointermove",onMove);
        document.removeEventListener("pointerup",done);
        document.removeEventListener("pointercancel",done);
        handle.style.opacity="1";
        handle.style.cursor="grab";
        row.style.background="";
        row.style.borderRadius="";
        if(moved){
          const dt=getDayType(state.selectedDate);
          const ids=[...document.querySelectorAll("[data-sortrow]")].map(r=>r.getAttribute("data-sortrow"));
          const natural=getOrder(dt);
          const merged=[...ids,...natural.filter(x=>!ids.includes(x))];
          state.order={...state.order,[weekdayKey()]:merged};
          lsSet("wt_exercise_order",state.order);
        }
        render();
      };
      document.addEventListener("pointermove",onMove,{passive:false});
      document.addEventListener("pointerup",done);
      document.addEventListener("pointercancel",done);
    };
  });

  document.querySelectorAll("[data-tipfield]").forEach((el)=>{ el.addEventListener("keydown",(e)=>{ if(e.key!=="Enter")return; if(el.tagName==="TEXTAREA" && !e.ctrlKey) return; e.preventDefault(); const fields=[...document.querySelectorAll("[data-tipfield]")]; const i=fields.indexOf(el); if(i>=0&&i<fields.length-1) fields[i+1].focus(); else el.blur(); }); });
  const cardioName=document.querySelector("[data-cardioname]"); if(cardioName){ cardioName.onchange=()=>saveCardioName(cardioName.getAttribute("data-cardioname"),cardioName.value); }

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

  document.querySelectorAll("[data-edittip]").forEach((el) => {
    el.onclick = () => {
      const exId = el.getAttribute("data-edittip");
      const dayType = getDayType(state.selectedDate);
      const ex = EXERCISES[dayType].find((e) => e.id === exId);
      if (!ex) return;
      state.tipEditOpen = { ...state.tipEditOpen, [tipOverrideKey(ex)]: true };
      render();
    };
  });

  document.querySelectorAll("[data-canceltip]").forEach((el) => {
    el.onclick = () => {
      const exId = el.getAttribute("data-canceltip");
      const dayType = getDayType(state.selectedDate);
      const ex = EXERCISES[dayType].find((e) => e.id === exId);
      if (!ex) return;
      state.tipEditOpen = { ...state.tipEditOpen, [tipOverrideKey(ex)]: false };
      render();
    };
  });

  document.querySelectorAll("[data-savetip]").forEach((el) => {
    el.onclick = () => {
      const exId = el.getAttribute("data-savetip");
      const dayType = getDayType(state.selectedDate);
      const ex = EXERCISES[dayType].find((e) => e.id === exId);
      if (!ex) return;
      const nameEl = document.querySelector(`[data-tipfield="${exId}|name"]`);
      const tipEl = document.querySelector(`[data-tipfield="${exId}|tip"]`);
      const breathEl = document.querySelector(`[data-tipfield="${exId}|breath"]`);
      const base = state.substituted[ex.id] && ex.substitutes && ex.substitutes[0] ? { ...ex, ...ex.substitutes[0] } : ex;
      saveTipOverride(ex, nameEl && nameEl.value.trim() ? nameEl.value.trim() : base.name, tipEl ? tipEl.value.trim() : "", breathEl ? breathEl.value.trim() : "");
      state.tipEditOpen = { ...state.tipEditOpen, [tipOverrideKey(ex)]: false };
      render();
    };
  });

  document.querySelectorAll("[data-resettip]").forEach((el) => {
    el.onclick = () => {
      const exId = el.getAttribute("data-resettip");
      const dayType = getDayType(state.selectedDate);
      const ex = EXERCISES[dayType].find((e) => e.id === exId);
      if (!ex) return;
      const key = tipOverrideKey(ex);
      resetTipOverride(ex);
      state.tipEditOpen = { ...state.tipEditOpen, [key]: false };
      render();
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
      if (phase) startCardioPhaseTimer(phase.label, getCardioDurationSeconds(dayType, getCardioChoice(dayType), phase));
    };
  });

  document.querySelectorAll("[data-cardiotab]").forEach((el) => {
    el.onclick = () => {
      const key = el.getAttribute("data-cardiotab");
      const dayType = getDayType(state.selectedDate);
      state.selectedCardioKey = key;
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

  document.querySelectorAll("[data-cardioduration]").forEach((el) => {
    el.onchange = () => {
      const [dayType, optionKey, phaseKey] = el.getAttribute("data-cardioduration").split("|");
      updateCardioDuration(dayType, optionKey, phaseKey, el.value);
    };
  });

  const skipBtn = document.getElementById("skipTimer");
  if (skipBtn) skipBtn.onclick = skipActiveTimer;

  const pauseBtn = document.getElementById("pauseTimer");
  if (pauseBtn) pauseBtn.onclick = togglePause;
}

// ---------- Browser back-button navigation ----------
window.addEventListener("popstate", (e) => {
  const wasDetail = !!(state.selectedExerciseId || state.selectedCardioKey);
  const hs = e.state || {};
  clearInterval(state.timerHandle);
  state.timer = null;

  if (wasDetail) {
    // Android/browser Back from any unfinished exercise/cardio detail always
    // returns directly to today's workout list, never to an older exercise.
    state.view = "day";
    state.selectedExerciseId = null;
    state.selectedCardioKey = null;
    if (state.returnListTarget) state.pendingListScroll = state.returnListTarget;
    state.returnListTarget = null;
    normalizeHistoryToWorkoutList();
    render();
    return;
  }

  if (hs.view === "day" && hs.date) {
    state.selectedDate = hs.date;
    loadDayState();
    state.view = "day";
    state.selectedExerciseId = null;
    state.selectedCardioKey = null;

    if (hs.subview === "exercise" && hs.exerciseId) {
      state.selectedExerciseId = hs.exerciseId;
      state.returnListTarget = `exercise:${hs.exerciseId}`;
    } else if (hs.subview === "cardio" && hs.cardioKey) {
      state.selectedCardioKey = hs.cardioKey;
      state.returnListTarget = `cardio:${hs.cardioKey}`;
    } else {
      if (state.pendingListScroll == null && state.returnListTarget) state.pendingListScroll = state.returnListTarget;
      state.returnListTarget = null;
    }
  } else {
    clearInterval(state.elapsedHandle);
    state.view = "calendar";
    state.selectedExerciseId = null;
    state.selectedCardioKey = null;
  }
  render();
});

// ---------- Init ----------
loadDayState();
state.view = "day";
history.replaceState({ view: "day", date: state.selectedDate, subview: "list" }, "", "");
render();
