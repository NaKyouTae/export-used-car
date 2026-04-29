# 중고차 수출 플랫폼 (export-used-car)

## 프로젝트 구조

pnpm 모노레포:
- `server/` — NestJS 11 + Prisma 7 (port 18090)
- `app/` — Next.js 16, 바이어/셀러용 (port 15000)
- `admin/` — Next.js 16, 관리자용 (port 19000)

## 기술 스택

### 서버
- NestJS 11, Prisma 7, Supabase PostgreSQL
- 인증: 이메일 OTP + JWT (비밀번호 없음)
- 파일 저장: Supabase Storage (S3 호환, @aws-sdk/client-s3)
- 이메일: Nodemailer (dev에서는 console.log)

### App 프론트엔드 (바이어/셀러)
- Next.js 16 + React 19 + Tailwind CSS v4
- Framer Motion — 애니메이션, 제스처 (스와이프, 바텀시트)
- Swiper — 이미지 갤러리 슬라이더
- React Hook Form + Zod — 폼 관리/검증
- nuqs — URL 쿼리 상태 관리 (필터/정렬)
- react-dropzone — 이미지 다중 업로드
- @dnd-kit/core — 이미지 순서 드래그 정렬
- date-fns — 날짜 포맷
- clsx + tailwind-merge — 조건부 클래스

### Admin 프론트엔드
- Next.js 16 + React 19 + Tailwind CSS v4
- shadcn/ui — UI 컴포넌트 (Table, Form, Dialog, Select 등)
- React Hook Form + Zod — 폼 관리/검증
- date-fns, clsx, tailwind-merge

## 컨벤션

- 모바일 퍼스트 반응형 (당근마켓 오마주)
- BFF 프록시 패턴: 프론트 API Routes → NestJS (httpOnly 쿠키 JWT)
- 커서 기반 페이지네이션 (offset 사용 금지)
- Admin 인증: ADMIN_TOKEN 정적 토큰 (MVP)
- 이미지: 범용 Image 테이블 (imageCategory + targetId)
- 보험/소유 이력: 외부 API 실시간 조회 (자체 DB 저장 안 함)

## 실행

```bash
pnpm dev          # 3개 앱 동시 실행
pnpm dev:server   # 서버만
pnpm dev:app      # App만
pnpm dev:admin    # Admin만
```
