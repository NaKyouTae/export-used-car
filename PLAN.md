# Ajucar 서비스 기획안

## 1. 서비스 개요

한국 중고차를 해외 바이어에게 연결하는 B2B/B2C 수출 플랫폼.
셀러가 차량을 등록하고, 해외 바이어가 검색/필터링/찜/문의를 통해 구매로 이어지는 구조.

---

## 2. 인프라 구성

| 구성 요소 | 기술 | 비고 |
|-----------|------|------|
| 프론트(바이어) | Next.js → Vercel | `app/` (port 15000) |
| 프론트(관리자) | Next.js → Vercel | `admin/` (port 19000) |
| 서버 | NestJS → Render (Singapore) | `server/` (port 18090) |
| 데이터베이스 | Supabase PostgreSQL | Prisma ORM |
| 파일 저장소 | Supabase Storage | 차량 이미지 |
| 실시간 채팅 | Supabase Realtime | 바이어-셀러 채팅 |

---

## 3. 도메인 설계

### 3.1 제조사/모델 마스터 (Make & CarModel)

Admin에서 관리하는 제조사 → 모델 계층 구조.
셀러가 차량 등록 시 드롭다운으로 선택.

```
Make (제조사)
├── id                  UUID
├── name                string          // Hyundai, Kia, BMW, Mercedes-Benz, ...
├── nameKo              string?         // 현대, 기아, BMW, 벤츠, ...
├── country             string?         // KR, DE, JP, US, ...
├── logoUrl             string?         // 제조사 로고 이미지 URL
├── displayOrder        int
└── models              CarModel[]

CarModel (모델)
├── id                  UUID
├── makeId              UUID (FK → Make)
├── name                string          // Avante, Sonata, K5, 3 Series, ...
├── nameKo              string?         // 아반떼, 쏘나타, K5, 3시리즈, ...
├── categoryId          UUID? (FK → Category)  // 기본 차종 (Sedan, SUV 등)
├── displayOrder        int
└── cars                Car[]
```

**셀러 차량 등록 시 선택 플로우:**
```
제조사 선택 (Make) → 모델 선택 (CarModel) → 등급 직접 입력 (trim) → 세부등급 직접 입력 (subTrim)
```

### 3.2 자동차 (Car)

```
Car
├── id                  UUID
├── sellerId            UUID (FK → Seller)
├── categoryId          UUID (FK → Category)
├── makeId              UUID (FK → Make)       // 제조사
├── modelId             UUID (FK → CarModel)   // 모델
│
│   ── 기본 정보 ──
├── title               string          // 차량 제목 (예: "아반떼AD 1.6 GDi 경찰차")
├── trim                string?         // 등급 (1.6 GDi, 2.0T, ...) - 직접 입력
├── subTrim             string?         // 세부 등급 (프레스티지, 모던, ...) - 직접 입력
├── year                int             // 연식
├── registrationDate    string?         // 최초 등록일 (예: "2016-07")
├── mileage             int             // 주행거리 (km)
├── fuelType            enum            // GASOLINE, DIESEL, HYBRID, ELECTRIC, LPG
├── transmission        enum            // AUTOMATIC, MANUAL
├── drivetrain          enum            // FWD, RWD, AWD
├── displacement        int?            // 배기량 (cc)
├── color               string?         // 외장 색상
├── plateNumber         string?         // 차량 번호 (마스킹: 38어****)
│
│   ── 가격 ──
├── price               decimal         // 판매 가격 (USD)
├── description         string?         // 셀러 작성 차량 설명 (자유 텍스트)
│
│   ── 상태/통계 ──
├── status              enum            // DRAFT, ACTIVE, RESERVED, SOLD, HIDDEN
├── viewCount           int             // 조회수
├── wishlistCount       int             // 찜 수
├── chatCount           int             // 채팅 문의 수
│
├── createdAt           datetime
└── updatedAt           datetime
```

### 3.3 카테고리 (Category)

```
Category
├── id                  UUID
├── name                string          // Sedan, SUV, Truck, Van, Bus, etc.
├── slug                string          // URL용 (sedan, suv, truck...)
├── displayOrder        int             // 정렬 순서
└── cars                Car[]
```

### 3.4 차량 옵션 (CarOption)

당근마켓처럼 외장/내장/안전/멀티미디어 카테고리로 분류된 옵션 목록.

```
OptionCategory
├── id                  UUID
├── name                string          // Exterior, Interior, Safety, Multimedia
├── slug                string
├── displayOrder        int
└── options             OptionItem[]

OptionItem
├── id                  UUID
├── categoryId          UUID (FK → OptionCategory)
├── name                string          // 예: "LED Headlamp", "Heated Seats", "Rear Camera"
├── nameKo              string?         // 한국어명 (헤드램프(LED), 열선시트, 후방카메라)
└── displayOrder        int

CarOption (다대다 연결)
├── id                  UUID
├── carId               UUID (FK → Car)
├── optionItemId        UUID (FK → OptionItem)
└── unique constraint: (carId, optionItemId)
```

### 3.5 차량 추가 정보 태그 (CarTag)

"실내 금연 차량", "블랙박스 포함", "하이패스 장착" 같은 셀러가 선택하는 태그.

```
Tag
├── id                  UUID
├── name                string          // Non-smoking, Blackbox included, ...
├── nameKo              string?
└── displayOrder        int

CarTag (다대다 연결)
├── id                  UUID
├── carId               UUID (FK → Car)
├── tagId               UUID (FK → Tag)
└── unique constraint: (carId, tagId)
```

### 3.6 성능 점검 (CarInspection)

성능점검기록부 기반 차량 상태 정보.
차량 부위별 교환/판금/용접 이력을 기록.

```
CarInspection
├── id                  UUID
├── carId               UUID (FK → Car)
├── inspectionNumber    string?         // 제시번호
├── inspectionDate      datetime?       // 점검 일자
├── summary             string?         // 요약 (예: "단순교환 무사고")
├── accidentRepairCount int             // 사고 수리 횟수
├── simpleRepairCount   int             // 단순 수리 횟수
└── parts               InspectionPart[]

InspectionPart
├── id                  UUID
├── inspectionId        UUID (FK → CarInspection)
├── partName            string          // 부위명 (예: "Hood", "Front Fender(L)", "Door(FL)")
├── status              enum            // NORMAL, REPLACED, REPAIRED, PAINTED
└── note                string?
```

### 3.7 이미지 (Image)

범용 이미지 테이블. `imageCategory`로 용도를 분류하고, `targetId`로 연결 대상을 참조.
차량 이미지 외에도 셀러 프로필, 사업자등록증 등 다양한 용도로 재사용 가능.

```
Image
├── id                  UUID
├── imageCategory       enum            // CAR_PHOTO, CAR_DOCUMENT, SELLER_PROFILE, SELLER_BUSINESS_LICENSE, ...
├── targetId            string          // 연결 대상 ID (Car ID, Seller ID 등)
├── url                 string          // Supabase Storage URL
├── order               int             // 이미지 순서 (같은 target 내)
├── isThumbnail         boolean         // 대표 이미지 여부
├── createdAt           datetime
└── updatedAt           datetime
```

**imageCategory 종류:**
| 카테고리 | 설명 | targetId 대상 |
|----------|------|---------------|
| `CAR_PHOTO` | 차량 외관/내부 사진 | Car ID |
| `CAR_DOCUMENT` | 차량 관련 서류 (등록증 등) | Car ID |
| `SELLER_PROFILE` | 셀러 프로필 이미지 | Seller ID |
| `SELLER_BUSINESS_LICENSE` | 사업자등록증 이미지 | Seller ID |

### 3.8 셀러 (Seller)

```
Seller
├── id                  UUID
├── email               string (unique)
├── companyName         string          // 상호명
├── contactName         string          // 담당자명
├── phone               string
├── businessNumber      string?         // 사업자 등록번호
├── address             string?         // 사업장 주소
├── isVerified          boolean         // 관리자 승인 여부
├── status              enum            // PENDING, ACTIVE, SUSPENDED
├── cars                Car[]
├── createdAt           datetime
└── updatedAt           datetime
```

### 3.9 바이어 (Buyer)

```
Buyer
├── id                  UUID
├── email               string (unique)
├── name                string
├── phone               string?
├── country             string          // 국가 코드 (NG, KE, UZ, KH...)
├── company             string?         // 회사명
├── wishlist            Wishlist[]      // 찜 목록
├── createdAt           datetime
└── updatedAt           datetime
```

### 3.10 찜 (Wishlist)

```
Wishlist
├── id                  UUID
├── buyerId             UUID (FK → Buyer)
├── carId               UUID (FK → Car)
└── createdAt           datetime

// unique constraint: (buyerId, carId)
```

### 3.11 채팅 (Chat)

```
ChatRoom
├── id                  UUID
├── carId               UUID? (FK → Car)   // 어떤 차량에 대한 문의인지
├── sellerId            UUID (FK → Seller)
├── buyerId             UUID (FK → Buyer)
├── lastMessageAt       datetime?
├── sellerUnreadCount   int             // 셀러 기준 읽지 않은 메시지 수
├── buyerUnreadCount    int             // 바이어 기준 읽지 않은 메시지 수
├── createdAt           datetime
└── messages            ChatMessage[]

ChatMessage
├── id                  UUID
├── roomId              UUID (FK → ChatRoom)
├── senderType          enum            // SELLER, BUYER
├── senderId            UUID
├── content             string
├── isRead              boolean
└── createdAt           datetime
```

**채팅 데이터 관리 전략:**
| 단계 | 전략 | 시점 |
|------|------|------|
| MVP | 단일 테이블 + 커서 페이지네이션 | 지금 |
| 성장기 | 월별 테이블 파티셔닝 (created_at 기준) | 메시지 100만건+ |
| 대규모 | 핫/콜드 분리 (90일 이후 아카이브) | 메시지 1000만건+ |

- 메시지 조회는 항상 **커서 기반** (offset 사용 금지)
- `@@index([roomId, createdAt])`로 채팅방별 시간순 조회 최적화
- `unreadCount`는 ChatRoom에 비정규화하여 목록 조회 시 별도 count 쿼리 방지
- 메시지 읽음 처리 시 `unreadCount` 0으로 리셋

### 3.12 관리자 (Admin)

```
Admin
├── id                  UUID
├── email               string (unique)
├── name                string
├── role                enum            // SUPER, MANAGER
└── createdAt           datetime
```

### 3.13 이메일 인증 (EmailVerification)

비밀번호 없이 이메일 인증번호(OTP)로 로그인/회원가입하는 방식.

```
EmailVerification
├── id                  UUID
├── email               string
├── code                string          // 6자리 인증번호
├── userType            enum            // SELLER, BUYER, ADMIN
├── expiresAt           datetime        // 만료 시각 (발급 후 5분)
├── isUsed              boolean         // 사용 완료 여부
├── createdAt           datetime
```

**인증 플로우:**
1. 사용자가 이메일 입력 → `POST /auth/send-code`
2. 서버가 6자리 인증번호 생성 → 이메일 발송
3. 사용자가 인증번호 입력 → `POST /auth/verify-code`
4. 인증 성공 → JWT 발급 (기존 회원이면 로그인, 신규면 회원가입 플로우 진행)

---

## 4. API 설계

### 4.1 인증 (Auth) - 이메일 인증번호 방식

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/auth/send-code` | 인증번호 발송 `{ email, userType }` |
| POST | `/auth/verify-code` | 인증번호 확인 → 기존 회원이면 JWT 반환 `{ email, code, userType }` |
| POST | `/auth/seller/register` | 셀러 회원가입 (인증 완료 후 추가 정보 입력) |
| POST | `/auth/buyer/register` | 바이어 회원가입 (인증 완료 후 추가 정보 입력) |
| POST | `/auth/refresh` | Access Token 갱신 |

### 4.2 자동차 (Cars)

| Method | Endpoint | 설명 | 권한 |
|--------|----------|------|------|
| GET | `/cars` | 차량 목록 (필터/검색/페이지네이션) | Public |
| GET | `/cars/:id` | 차량 상세 | Public |
| POST | `/cars` | 차량 등록 | Seller |
| PATCH | `/cars/:id` | 차량 수정 | Seller (본인) |
| DELETE | `/cars/:id` | 차량 삭제 | Seller (본인) |
| POST | `/images` | 이미지 업로드 `{ imageCategory, targetId, file }` | Seller/Admin |
| DELETE | `/images/:id` | 이미지 삭제 | Seller (본인)/Admin |
| PATCH | `/images/reorder` | 이미지 순서 변경 `{ imageIds[] }` | Seller (본인)/Admin |

**필터 쿼리 파라미터:**
```
GET /cars?category=suv&makeId=<uuid>&modelId=<uuid>&yearMin=2018&yearMax=2023
         &priceMin=5000&priceMax=20000&fuelType=DIESEL
         &transmission=AUTOMATIC&mileageMax=100000
         &sort=price_asc&page=1&limit=20
```

### 4.3 성능 점검 (Car Inspection)

| Method | Endpoint | 설명 | 권한 |
|--------|----------|------|------|
| GET | `/cars/:id/inspection` | 성능 점검 조회 | Public |
| PUT | `/cars/:id/inspection` | 성능 점검 입력/수정 | Seller (본인) |

> **보험/소유 이력**: 외부 API를 통해 조회. 차량 번호(plateNumber) 기반으로 외부 서비스에서 실시간 조회하여 프론트에서 표시. 자체 DB에 저장하지 않음.

### 4.4 옵션/태그 (Options & Tags)

| Method | Endpoint | 설명 | 권한 |
|--------|----------|------|------|
| GET | `/option-categories` | 옵션 카테고리 + 항목 전체 목록 | Public |
| POST | `/option-categories` | 옵션 카테고리 생성 | Admin |
| POST | `/option-items` | 옵션 항목 추가 | Admin |
| GET | `/tags` | 태그 전체 목록 | Public |
| POST | `/tags` | 태그 생성 | Admin |
| PUT | `/cars/:id/options` | 차량 옵션 일괄 설정 `{ optionItemIds[] }` | Seller (본인) |
| PUT | `/cars/:id/tags` | 차량 태그 일괄 설정 `{ tagIds[] }` | Seller (본인) |

### 4.5 카테고리 (Categories)

| Method | Endpoint | 설명 | 권한 |
|--------|----------|------|------|
| GET | `/categories` | 카테고리 목록 | Public |
| POST | `/categories` | 카테고리 생성 | Admin |
| PATCH | `/categories/:id` | 카테고리 수정 | Admin |
| DELETE | `/categories/:id` | 카테고리 삭제 | Admin |

### 4.6 제조사/모델 (Makes & Models)

| Method | Endpoint | 설명 | 권한 |
|--------|----------|------|------|
| GET | `/makes` | 제조사 목록 | Public |
| GET | `/makes/:id/models` | 특정 제조사의 모델 목록 | Public |
| POST | `/makes` | 제조사 추가 | Admin |
| PATCH | `/makes/:id` | 제조사 수정 | Admin |
| DELETE | `/makes/:id` | 제조사 삭제 | Admin |
| POST | `/makes/:id/models` | 모델 추가 | Admin |
| PATCH | `/car-models/:id` | 모델 수정 | Admin |
| DELETE | `/car-models/:id` | 모델 삭제 | Admin |

### 4.7 찜 (Wishlist)

| Method | Endpoint | 설명 | 권한 |
|--------|----------|------|------|
| GET | `/wishlist` | 내 찜 목록 | Buyer |
| POST | `/wishlist/:carId` | 찜 추가 | Buyer |
| DELETE | `/wishlist/:carId` | 찜 해제 | Buyer |

### 4.8 채팅 (Chat)

| Method | Endpoint | 설명 | 권한 |
|--------|----------|------|------|
| GET | `/chat/rooms` | 내 채팅방 목록 | Seller/Buyer |
| GET | `/chat/rooms/:id/messages` | 메시지 조회 | Seller/Buyer (본인) |
| POST | `/chat/rooms` | 채팅방 생성 (차량 문의 시작) | Buyer |
| POST | `/chat/rooms/:id/messages` | 메시지 전송 | Seller/Buyer (본인) |

> 실시간 메시지 수신은 Supabase Realtime subscription으로 처리

### 4.9 셀러 관리

| Method | Endpoint | 설명 | 권한 |
|--------|----------|------|------|
| GET | `/sellers/me` | 내 정보 | Seller |
| PATCH | `/sellers/me` | 내 정보 수정 | Seller |
| GET | `/sellers/me/cars` | 내 등록 차량 | Seller |

### 4.10 관리자 (Admin)

| Method | Endpoint | 설명 | 권한 |
|--------|----------|------|------|
| GET | `/admin/sellers` | 셀러 목록 | Admin |
| PATCH | `/admin/sellers/:id/verify` | 셀러 승인/반려 | Admin |
| PATCH | `/admin/sellers/:id/status` | 셀러 상태 변경 | Admin |
| GET | `/admin/cars` | 전체 차량 목록 | Admin |
| PATCH | `/admin/cars/:id/status` | 차량 상태 변경 (숨김 등) | Admin |
| GET | `/admin/dashboard` | 대시보드 통계 | Admin |

---

## 5. 페이지 구성

### 5.1 App (바이어용)

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/` | 홈 | 추천 차량, 카테고리 바로가기, 검색 |
| `/cars` | 차량 목록 | 필터/정렬/페이지네이션 |
| `/cars/[id]` | 차량 상세 | 아래 상세 섹션 참고 |
| `/cars/[id]/inspection` | 성능 점검 | 성능점검기록부, 부위별 교환/판금 다이어그램 |
| `/cars/[id]/insurance` | 보험 이력 | 외부 API 조회 결과 표시 (사고/소유자 변경/특수 용도) |
| `/cars/[id]/options` | 옵션 목록 | 외장/내장/안전/멀티미디어 카테고리별 옵션 |
| `/login` | 로그인 | 이메일 입력 → 인증번호 입력 → 로그인/회원가입 분기 |
| `/register` | 회원가입 | 인증 완료 후 추가 정보 입력 (이름, 국가 등) |
| `/wishlist` | 찜 목록 | 찜한 차량 리스트 |
| `/chat` | 채팅 목록 | 채팅방 리스트 |
| `/chat/[roomId]` | 채팅방 | 실시간 채팅 |
| `/mypage` | 마이페이지 | 프로필, 설정 |

### 5.2 Admin (관리자용)

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/` | 대시보드 | 주요 지표 (등록 차량, 셀러, 바이어 수 등) |
| `/login` | 로그인 | 관리자 로그인 |
| `/sellers` | 셀러 관리 | 목록, 승인/반려, 상태 변경 |
| `/cars` | 차량 관리 | 전체 차량 목록, 상태 관리 |
| `/categories` | 카테고리 관리 | CRUD |
| `/makes` | 제조사/모델 관리 | 제조사 CRUD, 모델 CRUD (계층 구조) |
| `/buyers` | 바이어 관리 | 바이어 목록 조회 |

### 5.3 셀러 전용 페이지 (App 내 또는 별도)

> 셀러가 별도 앱이 필요할지, App 내에서 역할 분기할지 결정 필요.
> **권장**: 초기에는 App 내에서 `/seller/*` 경로로 분리

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/seller/login` | 셀러 로그인 | 이메일 인증번호 방식 |
| `/seller/register` | 셀러 회원가입 | 인증 완료 후 상호명, 연락처, 사업자 정보 입력 |
| `/seller/dashboard` | 셀러 대시보드 | 내 차량 현황 |
| `/seller/cars` | 내 차량 관리 | 등록/수정/삭제 |
| `/seller/cars/new` | 차량 등록 | |
| `/seller/cars/[id]/edit` | 차량 수정 | |

---

## 6. 핵심 기능 상세

### 6.1 차량 상세 페이지 (당근마켓 오마주)

차량 상세 페이지는 아래 섹션 순서로 구성:

```
┌─────────────────────────────────┐
│ [< 뒤로] [공유] [더보기]          │  ← 상단 네비게이션
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │      이미지 갤러리 (1/16)     │ │  ← 스와이프, 전체보기
│ └─────────────────────────────┘ │
│                                 │
│ 셀러 프로필 (상호명, 지역)        │  ← 셀러 정보 요약
│                                 │
│ 아반떼AD 1.6 GDi 경찰차          │  ← 차량 제목
│ 17년식 · 18.5만km · 가솔린       │  ← 요약 스펙
│                                 │
│ $5,900                          │  ← 가격
│                                 │
│ ┌─ 보험 이력 요약 ─────────────┐ │
│ │ 사고이력 3회 · 소유자변경 2회   │ │  ← 외부 API 조회 결과
│ │ 전손/침수 없음                 │ │
│ └─────────────────────────────┘ │
│                                 │
│ [성능점검] [보험이력]  ← 탭 버튼   │
│                                 │
│ ── 차량 설명 ──                  │  ← 셀러 작성 자유 텍스트
│ 인수 후 3년 1개월동안 26,380km    │
│ · 타이어 교체 필요: 없음          │
│ · 외판 스크래치: 없음             │
│                                 │
│ ── 추가 정보 ──                  │  ← 태그 칩
│ [Non-smoking] [Blackbox] [ETC]  │
│                                 │
│ ── 상세 정보 ──                  │  ← 스펙 테이블
│ 차종: Sedan                     │
│ 제조사: Hyundai                  │
│ 모델: Avante AD                  │
│ 등급: 1.6 GDi                   │
│ 연식/등록일: 2017 / 2016-07      │
│ 배기량: 1,591cc                  │
│ 연료: Gasoline                   │
│ 변속기: Automatic                │
│ 색상: White                      │
│                                 │
│ ── 옵션 ──  (더보기 →)            │  ← 카테고리별 옵션
│ Exterior: LED Headlamp, ...     │
│ Interior: Heated Seats, ...     │
│ Safety: Rear Camera, ABS, ...   │
│                                 │
│ 4분 전 · 채팅 0 · 관심 0 · 조회 23│ ← 통계
│                                 │
├─────────────────────────────────┤
│ [♡ 찜]        [ 채팅하기 ]        │  ← 하단 고정 바
└─────────────────────────────────┘
```

### 6.2 차량 조회 및 필터링
- 카테고리별 분류 (Sedan, SUV, Truck, Van, Bus 등)
- 다중 필터: 제조사, 연식, 가격대, 연료, 변속기, 주행거리
- 정렬: 최신순, 가격 낮은순/높은순, 주행거리순, 연식순
- 커서 기반 페이지네이션 (무한 스크롤)
- 검색: 차량명, 제조사, 모델명 통합 검색
- 목록 카드에 조회수/찜수/채팅수 표시

### 6.3 차량 등록 (셀러)
- **기본 정보**: 제조사 선택 (Make) → 모델 선택 (CarModel) → 등급 직접 입력 (trim) → 세부등급 직접 입력 (subTrim)
- **이미지**: 다중 업로드 (최대 20장), 순서 변경, 대표 이미지 설정
- **옵션 선택**: 카테고리별 체크박스 (외장/내장/안전/멀티미디어)
- **태그 선택**: 추가 정보 태그 (금연, 블랙박스, 하이패스 등)
- **성능 점검**: 부위별 상태 입력 (정상/교환/판금/도장)
- **설명 작성**: 자유 텍스트 (차량 상태, 특이사항)
- 임시저장(DRAFT) → 게시(ACTIVE)

### 6.4 보험 이력 (외부 API)
- 차량 번호(plateNumber) 기반 외부 API 호출로 실시간 조회
- 사고 횟수/비용, 소유자 변경 이력, 특수 용도, 전손/침수 표시
- 자체 DB에 저장하지 않고 조회 시마다 외부 API 호출 (캐싱 고려)

### 6.5 성능 점검
- 셀러가 직접 입력하는 성능점검기록부
- **성능 점검 탭**: 차량 다이어그램 위에 교환(빨강)/판금(주황) 표시
- 제시번호 표기, 작성일 표시

### 6.6 찜 기능 (바이어)
- 차량 상세 하단 고정 바에서 하트 버튼으로 찜 토글
- 찜 목록 페이지에서 일괄 관리
- 찜 수 실시간 반영 (wishlistCount)

### 6.7 채팅 (바이어 ↔ 셀러)
- 차량 상세 하단 고정 바에서 "채팅하기" → 채팅방 자동 생성
- Supabase Realtime을 통한 실시간 메시지
- 읽음 표시
- 채팅방 목록에서 최근 메시지 미리보기, 차량 썸네일 표시

### 6.8 조회수/관심/채팅 카운트
- 차량 상세 진입 시 viewCount 증가 (중복 방지: IP 또는 세션 기준)
- wishlistCount, chatCount는 관련 액션 시 실시간 갱신
- 목록/상세에서 "N분 전 · 채팅 N · 관심 N · 조회 N" 표시

### 6.9 셀러 관리 (관리자)
- 셀러 가입 신청 → 관리자 승인 후 활성화
- 사업자 등록번호 확인
- 셀러 정지/해제

### 6.10 대시보드 (관리자)
- 총 등록 차량 수, 판매 완료 수
- 셀러/바이어 가입 수
- 일별/월별 등록 추이

### 6.11 반응형 웹 (모바일 + 데스크톱)
- **모바일**: 당근마켓 스타일 — 하단 고정 바, 풀스크린 이미지 갤러리, 스와이프
- **데스크톱**: 좌측 이미지/우측 정보 2컬럼 레이아웃, 사이드바 필터

---

## 7. Prisma 스키마 (초안)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ── 이메일 인증 ──
model EmailVerification {
  id        String   @id @default(uuid())
  email     String
  code      String
  userType  UserType
  expiresAt DateTime
  isUsed    Boolean  @default(false)
  createdAt DateTime @default(now())

  @@index([email, code])
  @@map("email_verifications")
}

enum UserType {
  SELLER
  BUYER
  ADMIN
}

// ── 관리자 ──
model Admin {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  role      AdminRole @default(MANAGER)
  createdAt DateTime @default(now())

  @@map("admins")
}

enum AdminRole {
  SUPER
  MANAGER
}

// ── 셀러 ──
model Seller {
  id             String       @id @default(uuid())
  email          String       @unique
  companyName    String
  contactName    String
  phone          String
  businessNumber String?
  address        String?
  isVerified     Boolean      @default(false)
  status         SellerStatus @default(PENDING)
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  cars      Car[]
  chatRooms ChatRoom[]

  @@map("sellers")
}

enum SellerStatus {
  PENDING
  ACTIVE
  SUSPENDED
}

// ── 바이어 ──
model Buyer {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  phone     String?
  country   String
  company   String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  wishlist  Wishlist[]
  chatRooms ChatRoom[]

  @@map("buyers")
}

// ── 카테고리 ──
model Category {
  id           String @id @default(uuid())
  name         String @unique
  slug         String @unique
  displayOrder Int    @default(0)

  cars      Car[]
  carModels CarModel[]

  @@map("categories")
}

// ── 제조사 ──
model Make {
  id           String     @id @default(uuid())
  name         String     @unique
  nameKo       String?
  country      String?
  logoUrl      String?
  displayOrder Int        @default(0)
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  models CarModel[]
  cars   Car[]

  @@map("makes")
}

// ── 차량 모델 ──
model CarModel {
  id           String    @id @default(uuid())
  makeId       String
  name         String
  nameKo       String?
  categoryId   String?
  displayOrder Int       @default(0)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  make     Make      @relation(fields: [makeId], references: [id])
  category Category? @relation(fields: [categoryId], references: [id])
  cars     Car[]

  @@unique([makeId, name])
  @@map("car_models")
}

// ── 자동차 ──
model Car {
  id               String       @id @default(uuid())
  sellerId         String
  categoryId       String
  makeId           String
  modelId          String
  title            String
  trim             String?
  subTrim          String?
  year             Int
  registrationDate String?      // "2016-07" 형식
  mileage          Int
  fuelType         FuelType
  transmission     Transmission
  drivetrain       Drivetrain?
  displacement     Int?
  color            String?
  plateNumber      String?      // 마스킹 처리된 번호판
  price            Decimal      @db.Decimal(12, 2)
  description      String?
  status           CarStatus    @default(DRAFT)
  viewCount        Int          @default(0)
  wishlistCount    Int          @default(0)
  chatCount        Int          @default(0)
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt

  seller     Seller          @relation(fields: [sellerId], references: [id])
  category   Category        @relation(fields: [categoryId], references: [id])
  make       Make            @relation(fields: [makeId], references: [id])
  carModel   CarModel        @relation(fields: [modelId], references: [id])
  // images는 Image 테이블에서 targetId = Car.id, imageCategory = CAR_* 로 조회
  options    CarOption[]
  tags       CarTag[]
  inspection CarInspection?
  wishlist   Wishlist[]
  chatRooms  ChatRoom[]

  @@index([status, createdAt])
  @@index([categoryId])
  @@index([makeId])
  @@index([modelId])
  @@index([year])
  @@index([price])
  @@map("cars")
}

// ── 차량 옵션 ──
model OptionCategory {
  id           String       @id @default(uuid())
  name         String       @unique
  slug         String       @unique
  displayOrder Int          @default(0)
  items        OptionItem[]

  @@map("option_categories")
}

model OptionItem {
  id           String         @id @default(uuid())
  categoryId   String
  name         String
  nameKo       String?
  displayOrder Int            @default(0)

  category   OptionCategory @relation(fields: [categoryId], references: [id])
  carOptions CarOption[]

  @@map("option_items")
}

model CarOption {
  id           String @id @default(uuid())
  carId        String
  optionItemId String

  car        Car        @relation(fields: [carId], references: [id], onDelete: Cascade)
  optionItem OptionItem @relation(fields: [optionItemId], references: [id])

  @@unique([carId, optionItemId])
  @@map("car_options")
}

// ── 차량 태그 ──
model Tag {
  id           String   @id @default(uuid())
  name         String   @unique
  nameKo       String?
  displayOrder Int      @default(0)
  carTags      CarTag[]

  @@map("tags")
}

model CarTag {
  id    String @id @default(uuid())
  carId String
  tagId String

  car Car @relation(fields: [carId], references: [id], onDelete: Cascade)
  tag Tag @relation(fields: [tagId], references: [id])

  @@unique([carId, tagId])
  @@map("car_tags")
}

// ── 성능 점검 ──
// 보험/소유 이력은 외부 API로 실시간 조회 (자체 DB 저장 안 함)
model CarInspection {
  id                  String           @id @default(uuid())
  carId               String           @unique
  inspectionNumber    String?
  inspectionDate      DateTime?
  summary             String?
  accidentRepairCount Int              @default(0)
  simpleRepairCount   Int              @default(0)
  parts               InspectionPart[]

  car Car @relation(fields: [carId], references: [id], onDelete: Cascade)

  @@map("car_inspections")
}

model InspectionPart {
  id           String         @id @default(uuid())
  inspectionId String
  partName     String
  status       PartStatus     @default(NORMAL)
  note         String?

  inspection CarInspection @relation(fields: [inspectionId], references: [id], onDelete: Cascade)

  @@map("inspection_parts")
}

enum PartStatus {
  NORMAL
  REPLACED
  REPAIRED
  PAINTED
}

enum FuelType {
  GASOLINE
  DIESEL
  HYBRID
  ELECTRIC
  LPG
}

enum Transmission {
  AUTOMATIC
  MANUAL
}

enum Drivetrain {
  FWD
  RWD
  AWD
}

enum CarStatus {
  DRAFT
  ACTIVE
  RESERVED
  SOLD
  HIDDEN
}

// ── 이미지 (범용) ──
model Image {
  id            String        @id @default(uuid())
  imageCategory ImageCategory
  targetId      String        // 연결 대상 ID (Car ID, Seller ID 등)
  url           String        // Supabase Storage URL
  order         Int           @default(0)
  isThumbnail   Boolean       @default(false)
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  @@index([targetId, imageCategory])
  @@map("images")
}

enum ImageCategory {
  CAR_PHOTO
  CAR_DOCUMENT
  SELLER_PROFILE
  SELLER_BUSINESS_LICENSE
}

// ── 찜 ──
model Wishlist {
  id        String   @id @default(uuid())
  buyerId   String
  carId     String
  createdAt DateTime @default(now())

  buyer Buyer @relation(fields: [buyerId], references: [id], onDelete: Cascade)
  car   Car   @relation(fields: [carId], references: [id], onDelete: Cascade)

  @@unique([buyerId, carId])
  @@map("wishlists")
}

// ── 채팅방 ──
model ChatRoom {
  id                String    @id @default(uuid())
  carId             String?
  sellerId          String
  buyerId           String
  lastMessageAt     DateTime?
  sellerUnreadCount Int       @default(0)
  buyerUnreadCount  Int       @default(0)
  createdAt         DateTime  @default(now())

  car      Car?          @relation(fields: [carId], references: [id])
  seller   Seller        @relation(fields: [sellerId], references: [id])
  buyer    Buyer         @relation(fields: [buyerId], references: [id])
  messages ChatMessage[]

  @@unique([carId, sellerId, buyerId])
  @@map("chat_rooms")
}

// ── 채팅 메시지 ──
model ChatMessage {
  id         String     @id @default(uuid())
  roomId     String
  senderType SenderType
  senderId   String
  content    String
  isRead     Boolean    @default(false)
  createdAt  DateTime   @default(now())

  room ChatRoom @relation(fields: [roomId], references: [id], onDelete: Cascade)

  @@index([roomId, createdAt])
  @@map("chat_messages")
}

enum SenderType {
  SELLER
  BUYER
}
```

---

## 8. 구현 우선순위

### Phase 1 - MVP (핵심)
1. DB 스키마 세팅 (Prisma migrate) — 전체 모델
2. 인증 (이메일 OTP + JWT) - 셀러/바이어/관리자
3. 카테고리 CRUD (Admin)
4. 제조사/모델 CRUD + 시드 데이터 (Admin)
5. 옵션 카테고리/항목, 태그 시드 데이터 + CRUD (Admin)
6. 차량 등록/수정/삭제 + 옵션/태그 선택 (Seller)
7. 차량 이미지 업로드 (Supabase Storage)
8. 차량 목록/상세 조회 + 필터링 (Public)
9. App 홈/목록/상세 페이지 (당근마켓 레이아웃)
10. 반응형 웹 (모바일 우선 + 데스크톱)
11. Admin 대시보드/차량관리/셀러관리/제조사모델관리

### Phase 2 - 차량 신뢰 정보
12. 성능 점검 입력/조회 (부위별 다이어그램)
13. 보험/소유 이력 외부 API 연동 (조회 전용)
14. 성능 점검 / 보험 이력 상세 페이지

### Phase 3 - 사용자 기능
15. 바이어 회원가입/로그인
16. 찜 기능 + wishlistCount 실시간 갱신
17. 조회수/채팅수 카운팅
18. 셀러 승인 프로세스
19. 셀러 대시보드

### Phase 4 - 커뮤니케이션
20. 채팅 (Supabase Realtime) + unreadCount 비정규화
21. 읽음 표시 + unreadCount 리셋
22. 채팅방에 차량 썸네일 표시

### Phase 5 - 고도화
23. 검색 최적화 (full-text search)
24. 공유 기능 (SNS/링크)
25. 다국어 지원 (영어 기본, 러시아어, 아랍어 등)
26. 수출 서류 관리 기능
27. 채팅 데이터 파티셔닝/아카이브 (성장 시)

---

## 9. 서버 모듈 구조 (NestJS)

```
server/src/
├── main.ts
├── app.module.ts
├── common/
│   ├── guards/          # JwtAuthGuard, RolesGuard
│   ├── decorators/      # @CurrentUser, @Roles
│   ├── filters/         # HttpExceptionFilter
│   ├── interceptors/    # TransformInterceptor
│   └── dto/             # PaginationDto
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── strategies/      # JwtStrategy
├── cars/
│   ├── cars.module.ts
│   ├── cars.controller.ts
│   ├── cars.service.ts
│   └── dto/
├── car-inspection/
│   ├── car-inspection.module.ts
│   ├── car-inspection.controller.ts
│   └── car-inspection.service.ts
├── options/
│   ├── options.module.ts
│   ├── options.controller.ts
│   └── options.service.ts
├── tags/
│   ├── tags.module.ts
│   ├── tags.controller.ts
│   └── tags.service.ts
├── categories/
│   ├── categories.module.ts
│   ├── categories.controller.ts
│   └── categories.service.ts
├── makes/
│   ├── makes.module.ts
│   ├── makes.controller.ts
│   └── makes.service.ts        # 제조사 + 모델 CRUD
├── sellers/
│   ├── sellers.module.ts
│   ├── sellers.controller.ts
│   └── sellers.service.ts
├── buyers/
│   ├── buyers.module.ts
│   ├── buyers.controller.ts
│   └── buyers.service.ts
├── wishlist/
│   ├── wishlist.module.ts
│   ├── wishlist.controller.ts
│   └── wishlist.service.ts
├── chat/
│   ├── chat.module.ts
│   ├── chat.controller.ts
│   └── chat.service.ts
├── admin/
│   ├── admin.module.ts
│   ├── admin.controller.ts
│   └── admin.service.ts
├── images/
│   ├── images.module.ts
│   ├── images.controller.ts
│   └── images.service.ts    # 범용 이미지 CRUD + Supabase Storage
└── prisma/
    ├── prisma.module.ts
    └── prisma.service.ts
```

---

## 10. 주요 기술 결정 사항

| 항목 | 결정 | 이유 |
|------|------|------|
| 보험/소유 이력 | 외부 API 실시간 조회 | 자체 DB 저장 안 함, 차량 번호 기반 조회, 응답 캐싱 고려 |
| 인증 | 이메일 OTP + JWT | 비밀번호 없이 이메일 인증번호로 로그인, JWT로 세션 유지 |
| 이미지 저장 | Supabase Storage | DB와 동일 인프라, CDN 제공 |
| 실시간 채팅 | Supabase Realtime | 별도 WebSocket 서버 불필요 |
| 채팅 데이터 | 단일 테이블 → 파티셔닝 → 아카이브 | 단계적 확장, MVP는 단일 테이블 + 커서 페이지네이션 |
| 제조사/모델 | Admin 관리 마스터 데이터 | string이 아닌 FK 참조, 일관된 데이터 보장 |
| 페이지네이션 | 커서 기반 | 대량 데이터 성능, 무한스크롤 |
| 가격 단위 | USD | 국제 수출 표준 |
| 언어 | 영어 기본 | 해외 바이어 대상 서비스 |

---

## 11. 프론트엔드 라이브러리

### App (바이어/셀러용) — 커스텀 UI

| 라이브러리 | 용도 |
|-----------|------|
| Tailwind CSS v4 | 스타일링 (설치됨) |
| Framer Motion | 애니메이션, 제스처 (스와이프, 바텀시트, 페이지 전환) |
| Swiper | 이미지 갤러리 슬라이더 (차량 상세 사진) |
| React Hook Form + Zod | 폼 관리/검증 (차량 등록, 회원가입) |
| nuqs | URL 쿼리 상태 관리 (필터/정렬 URL 동기화) |
| react-dropzone | 이미지 다중 업로드 (드래그앤드롭) |
| @dnd-kit/core | 이미지 순서 드래그 정렬 |
| date-fns | 날짜 포맷 (개별 함수 import) |
| clsx + tailwind-merge | 조건부 클래스 조합 |

### Admin (관리자용) — shadcn/ui

| 라이브러리 | 용도 |
|-----------|------|
| Tailwind CSS v4 | 스타일링 (설치됨) |
| shadcn/ui | UI 컴포넌트 (Table, Form, Dialog, Select, Sheet 등) |
| React Hook Form + Zod | 폼 관리/검증 |
| date-fns | 날짜 포맷 |
| clsx + tailwind-merge | 조건부 클래스 조합 |
