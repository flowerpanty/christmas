# 관리자 페이지 설정 가이드

## 🎯 완료된 작업

### 1. 파일 생성
- ✅ `admin.html` - 관리자 대시보드 UI
- ✅ `admin-style.css` - 관리자 페이지 스타일
- ✅ `admin-script.js` - 관리자 페이지 기능
- ✅ `backend.gs` - 업데이트됨 (새로운 상품 구조)
- ✅ `script.js` - 이중 저장 기능 추가

### 2. 기능
- 🔐 비밀번호 로그인 (기본: `nothingmatters2024`)
- 📊 통계 대시보드 (총 주문, 매출, 상태별)
- 🔍 필터링 & 검색 (날짜, 상태, 고객명)
- 📋 주문 상세 보기
- 📥 CSV 다운로드
- 🔄 실시간 새로고침

---

## ⚙️ Google Apps Script 설정 (필수)

### 단계 1: Google Sheets 준비

1. **새 Google Sheets 생성**
   - [Google Sheets](https://sheets.google.com) 접속
   - 새 스프레드시트 생성
   - 이름: `낫띵메터스 주문관리`

2. **헤더 행 추가** (A1부터 시작)
   ```
   주문시간 | 이름 | 이메일 | 전화번호 | 곰돌이 | 트리 | 세트 | 산타꾸러미 | 총금액 | 픽업방법 | 픽업날짜 | 픽업시간 | 입금자 | 입금액 | 메모 | 상태
   ```

### 단계 2: Apps Script 배포

1. **스크립트 에디터 열기**
   - 메뉴: `확장 프로그램` → `Apps Script`

2. **backend.gs 코드 복사**
   - `/Users/nahmsoochan/order/backend.gs` 파일 내용 전체 복사
   - Apps Script 에디터에 붙여넣기
   - 저장 (Ctrl/Cmd + S)

3. **배포하기**
   - 우측 상단 `배포` 버튼 클릭
   - `새 배포` 선택
   - 톱니바퀴 아이콘 클릭 → `웹 앱` 선택
   - 설정:
     - **설명**: "주문 관리 시스템"
     - **다음 사용자로 실행**: 나
     - **액세스 권한**: **누구나** (중요!)
   - `배포` 클릭
   - **웹 앱 URL 복사** (매우 중요!) 📋

   예시: `https://script.google.com/macros/s/AKfycby.../exec`

### 단계 3: URL 설정

#### 3-1. 관리자 페이지에 URL 입력

`admin-script.js` 파일 2번째 줄 수정:

```javascript
const GOOGLE_SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';
```

↓ 변경

```javascript
const GOOGLE_SCRIPT_URL = '복사한_웹앱_URL_여기에_붙여넣기';
```

#### 3-2. 주문 폼에 URL 입력

`script.js` 파일 211번째 줄 수정:

```javascript
const GOOGLE_SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';
```

↓ 변경

```javascript
const GOOGLE_SCRIPT_URL = '복사한_웹앱_URL_여기에_붙여넣기';
```

### 단계 4: 권한 승인

- 처음 배포 시 권한 요청 화면이 나타남
- `권한 검토` → 본인 Google 계정 선택
- `고급` → `프로젝트 이름으로 이동` 클릭
- `허용` 클릭

---

## 🚀 사용 방법

### 관리자 페이지 접속

1. 브라우저에서 `admin.html` 파일 열기
2. 비밀번호 입력: `nothingmatters2024`
3. 로그인 후 주문 내역 확인

### 주문 데이터 흐름

```
고객 주문 제출
    ↓
1️⃣ Google Sheets 저장 (주 저장소)
2️⃣ 이메일 발송 (백업)
    ↓
관리자 페이지에서 확인
```

### 주문 관리

- **필터링**: 날짜별, 상태별로 주문 확인
- **검색**: 고객 이름, 전화번호로 검색
- **상세보기**: 개별 주문 클릭하여 전체 정보 확인
- **상태 변경**: 입금대기 → 입금완료 → 제작중 → 픽업완료
- **CSV 다운로드**: 전체 주문 내역 엑셀로 저장

---

## 🔐 보안

### 비밀번호 변경

`admin-script.js` 1번째 줄:

```javascript
const ADMIN_PASSWORD = 'nothingmatters2024';
```

원하는 비밀번호로 변경하세요.

### 로그아웃

우측 상단 `로그아웃` 버튼 클릭

---

## 🧪 테스트

### 1. 주문 제출 테스트

1. `index.html` 열기
2. 테스트 주문 입력
3. 제출 버튼 클릭

### 2. 데이터 확인

1. Google Sheets에서 주문 확인
2. 이메일 수신 확인
3. 관리자 페이지에서 주문 확인

### 3. 문제 해결

**주문이 Sheets에 저장 안 됨:**
- Apps Script URL이 올바르게 입력되었는지 확인
- Google Sheets가 열려있는지 확인
- 브라우저 콘솔(F12)에서 에러 확인

**관리자 페이지에 주문 안 보임:**
- 새로고침 버튼 클릭
- URL이 올바른지 확인
- 브라우저 콘솔에서 에러 확인

---

## 📱 백업 시스템

Google Sheets가 실패해도 이메일은 계속 발송되므로 주문이 절대 누락되지 않습니다!

- ✅ 주 저장소: Google Sheets
- ✅ 백업: EmailJS (고객 + 관리자 이메일)
- ✅ 크리스마스 시즌 안심!

---

## 🎄 완료!

이제 모든 주문이 자동으로 Google Sheets에 저장되고, 관리자 페이지에서 실시간으로 확인할 수 있습니다.

질문이 있으시면 언제든지 문의하세요!
