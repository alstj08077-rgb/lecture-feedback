# 비대면 강의 경험 설문조사 - 배포 가이드

## 📂 파일 구성

```
lecture-feedback/
├── index.html        ← 시작 페이지 (그룹 랜덤 배정)
├── groupA.html       ← 그룹 A 설문지
├── groupB.html       ← 그룹 B 설문지 (로고)
├── groupC.html       ← 그룹 C 설문지 (위치 변경)
├── postA.html        ← 그룹 A 사후 인지
├── postB.html        ← 그룹 B 사후 인지
├── postC.html        ← 그룹 C 사후 인지
├── debrief.html      ← 디브리핑 (안내문)
├── style.css         ← 디자인
├── tracker.js        ← 측정 로직
├── apps-script.gs    ← 구글 시트 저장 코드
├── logo.png          ← (학생이 추가) 국민대 로고
└── README.md
```

---

## 🚀 배포 4단계

### ⓪ 시작 전 준비
- 국민대 로고 이미지 준비 → 파일명 `logo.png`로 저장 (대소문자 정확히!)

---

### ① 구글 시트 + Apps Script 만들기

#### 1-1. 새 구글 시트 만들기
1. https://sheets.google.com 접속
2. "빈 스프레드시트" 클릭
3. URL 보면 `https://docs.google.com/spreadsheets/d/`**여기긴문자열**`/edit` 이렇게 되어있음
4. **가운데 긴 문자열을 복사** (이게 시트 ID)

#### 1-2. Apps Script 열기
1. 시트 상단 메뉴 **확장 프로그램 > Apps Script** 클릭
2. 새 창이 열림. 기본 코드(`function myFunction() {}`)를 **다 지우기** (`Ctrl + A` → `Delete`)
3. `apps-script.gs` 파일 내용을 **통째로 복사해서 붙여넣기**

#### 1-3. 시트 ID 입력
코드 맨 위쪽 13번째 줄쯤에 있는:
```js
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
```
이걸 **방금 복사한 시트 ID로 변경**:
```js
const SPREADSHEET_ID = '1Lyhro_Pz5UxRurYosUZzZ4Omyroe-9f_Ku2QFVwezPE';
```

`Ctrl + S` 저장 (이름은 아무거나)

#### 1-4. 권한 승인 & 테스트
1. 상단 함수 드롭다운 **`doPost`** 를 **`testAppend`** 로 변경
2. ▶️ "실행" 클릭
3. "권한 검토" 창 뜨면:
   - 본인 구글 계정 선택
   - "고급" 클릭
   - "안전하지 않은 페이지로 이동" 클릭
   - "허용" 클릭
4. 시트 탭으로 돌아가서 `responses` 탭에 데이터 한 줄 있으면 ✅ 성공

#### 1-5. 웹 앱 배포
1. Apps Script 우측 상단 **"배포" > "새 배포"** 클릭
2. ⚙️ 톱니바퀴 → **"웹 앱"** 선택
3. 설정:
   - 설명: *설문 데이터 수신* (아무거나)
   - 다음 사용자로 실행: **"나"**
   - 액세스 권한: **⚠️ "모든 사용자"** (꼭!)
4. "배포" 클릭 → 권한 한 번 더 승인
5. **"웹 앱 URL"이 표시됨 → 이 URL을 어딘가 메모장에 복사해두기!**

> ⚠️ URL은 `https://script.google.com/macros/s/AKfycb.../exec` 이런 형식이어야 해요

---

### ② tracker.js에 URL 입력

1. `tracker.js` 파일을 **메모장**으로 열기
2. 맨 위 6번째 줄:
   ```js
   const APPS_SCRIPT_URL = 'YOUR_APPS_SCRIPT_URL_HERE';
   ```
3. **`YOUR_APPS_SCRIPT_URL_HERE` 부분을 본인 URL로 변경**:
   ```js
   const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycb.../exec';
   ```
   - ⚠️ 작은따옴표 `'` 는 절대 지우지 마세요
   - ⚠️ URL 끝에 공백 들어가지 않게 주의
4. 저장

---

### ③ GitHub에 업로드

#### 3-1. GitHub 계정 (이미 있으면 패스)
- https://github.com 가입

#### 3-2. 새 저장소 만들기
1. 우측 상단 + → "New repository"
2. **Repository name**: `lecture-feedback` (또는 본인이 원하는 이름)
3. **Public** 선택
4. "Create repository" 클릭

#### 3-3. 파일 전부 업로드
1. 저장소 화면에서 **"uploading an existing file"** 클릭
2. `lecture-feedback` 폴더 안의 **모든 파일을 드래그해서 업로드**:
   - `index.html`
   - `groupA.html`, `groupB.html`, `groupC.html`
   - `postA.html`, `postB.html`, `postC.html`
   - `debrief.html`
   - `style.css`
   - `tracker.js` (URL 수정한 거!)
   - `logo.png`
   - (`apps-script.gs`와 `README.md`는 안 올려도 됨)
3. 아래쪽 **"Commit changes"** 클릭

#### 3-4. GitHub Pages 활성화
1. 저장소 상단 **"Settings"** 클릭
2. 왼쪽 메뉴 **"Pages"** 클릭
3. Branch: **`main`**, Folder: **`/ (root)`** 선택 → **"Save"**
4. 1~2분 기다리고 페이지 새로고침
5. 위쪽에 초록색 박스 **"Your site is live at https://닉네임.github.io/lecture-feedback/"** 표시됨

✅ **이 URL이 학생 설문 사이트 주소!**

---

### ④ 테스트

#### 4-1. 본인이 직접 테스트
1. **시크릿 모드**로 위 URL 접속 (`Ctrl + Shift + N`)
2. 설문 끝까지 다 풀기
3. 사후 인지 페이지에서 **"다음" 버튼 누르는 순간** 데이터 저장됨
4. 디브리핑 페이지 도착하면 끝
5. 구글 시트 새로고침 → 데이터 한 줄 들어왔는지 확인

#### 4-2. 모바일 테스트 (중요!)
1. 폰의 **크롬** 또는 **사파리** 앱 열기
2. URL 직접 입력해서 접속
3. 끝까지 진행
4. PC에서 시트 확인

---

## ✅ 정상 작동 흐름

```
링크 클릭
   ↓
랜덤으로 그룹 A/B/C 페이지 표시
   ↓
설문 작성 후 "설문 제출" 클릭
   ↓
사후 인지 페이지로 이동
   ↓
사후 인지 답변 후 "다음" 클릭
   ↓ 🔥 여기서 시트에 저장 🔥
   ↓
디브리핑 페이지 (안내만)
   ↓
끝
```

---

## 🆘 문제 해결

### Q. 시트에 데이터가 안 들어와요
1. **`tracker.js`의 URL이 본인 Apps Script URL인지** 확인 (가장 흔한 원인!)
2. **Apps Script 배포 시 "모든 사용자"** 선택했는지 확인
3. Apps Script 코드 수정 후엔 **"배포 > 배포 관리 > 수정 > 새 버전 > 배포"** 다시 해야 함

### Q. 모바일 카톡 인앱 브라우저에서 안 돼요
- 카톡으로 보낸 링크는 **우측 상단 ⋮ 점 3개 → "다른 브라우저로 열기"** 누르고 진행
- 참여자에게 이 안내를 멘트에 포함시키면 좋음

### Q. 같은 사람이 두 번 응답하면?
- 자동으로 차단됨 (participant_id 중복 검증)

### Q. 사이트가 안 떠요
- GitHub 저장소가 **Public**인지 확인
- GitHub Pages **Save** 누른 뒤 1~2분 기다림
- 폴더명/파일명에 한글이나 공백 없는지 확인

---

## 📊 데이터 분석

구글 시트 `responses` 시트에서 핵심 컬럼:

| 컬럼 | 의미 |
|---|---|
| `group` | 배정된 그룹 (A/B/C) — 분석 기준 |
| `consent_required` | 필수 동의 결과 |
| `consent_opt2` | 더보기 약관 동의 — **읽었으면 "비동의"** (해제 측정) |
| `more_clicked` | 더보기 클릭 여부 |
| `tos_dwell_sec` | 약관 영역 체류 시간 (초) |
| `tos_scroll_max_pct` | 약관 영역 최대 스크롤 깊이 (%) |
| `total_duration_sec` | 전체 응답 시간 (초) |
| `post_postQ1` | 사후 인지: 약관 내용 인지 정확도 |
| `post_postQ2` | 사후 인지: 끝까지 읽었다는 자기보고 |

그룹별로 정렬해서 비교하시면 됩니다.

---

**잘 안 되면 언제든 도움 요청하세요! 🙏**
