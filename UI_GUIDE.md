# 엔빵(Nbbang) UI 디자인 가이드

> 랜딩 페이지 및 UI 개발을 위한 종합 디자인 시스템 가이드

## 📋 목차

1. [디자인 철학](#디자인-철학)
2. [색상 시스템](#색상-시스템)
3. [타이포그래피](#타이포그래피)
4. [컴포넌트 스타일](#컴포넌트-스타일)
5. [페이지 구조](#페이지-구조)
6. [반응형 디자인](#반응형-디자인)
7. [애니메이션 & 인터랙션](#애니메이션--인터랙션)

---

## 디자인 철학

### 핵심 원칙

- **간결함**: 불필요한 요소 제거, 핵심 기능에 집중
- **명확성**: 정보 계층 구조를 명확히 구분
- **접근성**: 터치 친화적 버튼 크기 (최소 44px)
- **일관성**: 전체 앱에서 일관된 디자인 언어 사용

### 디자인 키워드

- 모던 (Modern)
- 미니멀 (Minimal)
- 친화적 (Friendly)
- 효율적 (Efficient)

---

## 색상 시스템

### 주요 색상 (Primary Colors)

#### 파란색 계열 (Primary Blue)

- **메인 블루**: `#3182F6`
- **다크 블루**: `#1E6FFF`, `#1D4ED8`, `#2563EB`
- **라이트 블루**: `#1350fe`, `#0d3fc7`
- **배경 블루**: `#f5f8ff`
- **보더 블루**: `#3182F6/30` (30% 투명도)

**사용처**:

- 주요 CTA 버튼
- 링크 및 강조 텍스트
- 아이콘 색상
- 배경 강조 영역

#### 주황색 계열 (Secondary Orange)

- **메인 오렌지**: `#F59E0B`
- **다크 오렌지**: `#D97706`
- **배경 오렌지**: `#fef3c7`
- **텍스트 오렌지**: `#d97706`

**사용처**:

- 간편정산 태그
- 간편정산 버튼
- 경고/주의 요소

#### 보라색 계열 (Tertiary Purple)

- **메인 퍼플**: `#8B5CF6`
- **다크 퍼플**: `#7C3AED`

**사용처**:

- 여행정산 태그
- 여행정산 버튼

#### 카카오톡 색상

- **카카오 옐로우**: `#fee500`, `#FEE500`
- **카카오 다크**: `#fdd835`, `#191f28`
- **카카오 호버**: `#FEE500/90`

**사용처**:

- 카카오톡 공유 버튼
- 카카오 송금 버튼

#### 토스 색상

- **토스 블루**: `#1350fe`, `#0452e7fc`
- **토스 다크**: `#0d3fc7`

**사용처**:

- 토스 송금 버튼
- 토스 관련 UI

### 중성 색상 (Neutral Colors)

#### 텍스트 색상

- **주요 텍스트**: `#191f28`, `#191F28`
- **보조 텍스트**: `#6b7684`, `#8b95a1`, `#8B95A1`
- **약한 텍스트**: `#c7c7cc`, `#717182`
- **회색 텍스트**: `#333D4B`, `#1f2937`, `#0f172a`

#### 배경 색상

- **메인 배경**: `#ffffff`
- **서브 배경**: `#F2F4F6`, `#f2f2f7`
- **호버 배경**: `#f8f9fa`, `#e5e5ea`
- **입력 배경**: `#f2f2f7`, `#f3f3f5`
- **카드 배경**: `#ffffff`
- **오버레이**: `rgba(0, 0, 0, 0.4)` ~ `rgba(0, 0, 0, 0.9)`

#### 테두리 색상

- **기본 테두리**: `#E5E8EB`, `#e6e6e666` (반투명)
- **라이트 테두리**: `#E5E8EB`, `rgba(0, 0, 0, 0.06)`
- **다시드 테두리**: `border-dashed border-[#3182F6]/30`

### 상태 색상 (Status Colors)

#### 성공 (Success)

- **배경**: `#dbeafe`
- **텍스트**: `#1d4ed8`

#### 경고 (Warning)

- **배경**: `#fef3c7`
- **텍스트**: `#d97706`

#### 에러 (Error)

- **배경**: `#ffebee`
- **텍스트**: `#d32f2f`, `#d4183d`

---

## 타이포그래피

### 폰트 패밀리

- **기본 폰트**: `'Noto Sans', sans-serif`
- **코드 폰트**: `source-code-pro, Menlo, Monaco, Consolas, 'Courier New', monospace`

### 폰트 크기

#### 표준 크기

- **XXS**: `0.625rem` (10px) - 매우 작은 텍스트
- **XS**: `0.75rem` (12px) - 작은 텍스트, 캡션
- **S**: `0.8125rem` (13px) - 보조 텍스트
- **M**: `0.9375rem` (15px) - 본문 텍스트
- **L**: `1.0625rem` (17px) - 강조 텍스트
- **LL**: `1.1875rem` (19px) - 소제목
- **XL**: `1.25rem` (20px) - 제목
- **1XL**: `1.375rem` (22px) - 큰 제목
- **2XL**: `1.5rem` (24px) - 헤더
- **3XL**: `1.875rem` (30px) - 대형 헤더

#### 커스텀 크기

- **헤더 (사용자명)**: `20px`
- **미팅 이름**: `14px`
- **날짜**: `13px`
- **태그**: `11px`
- **카운트**: `12px`
- **버튼 텍스트**: `14px` (데스크톱), `15px` (모바일)

### 폰트 굵기

- **Light**: `300`
- **Normal**: `400`
- **Medium**: `500`
- **Semi-bold**: `600`
- **Bold**: `700`

### Letter-spacing

- **헤더**: `-0.3px`
- **날짜**: `-0.2px`
- **태그**: `-0.1px`
- **버튼**: `-0.3px`

### Line-height

- **기본**: `1.5`
- **제목**: `1.25`
- **본문**: `1.5` ~ `1.75`

---

## 컴포넌트 스타일

### 버튼 (Buttons)

#### Primary Button

```css
배경: #3182F6
호버: #1E6FFF
텍스트: #ffffff
패딩: px-4 py-2.5 (모바일), px-4 py-2.5 (데스크톱)
border-radius: 12px (rounded-xl)
최소 높이: 44px (touch-manipulation)
그림자: shadow-sm
전환: transition-colors, active:scale-95
```

#### Secondary Button (카카오톡)

```css
배경: #fee500
호버: #fdd835
텍스트: #191f28
패딩: px-4 py-2.5
border-radius: 12px
최소 높이: 44px
```

#### Tertiary Button (토스)

```css
배경: #1350fe
호버: #0d3fc7
텍스트: #ffffff
패딩: px-4 py-2.5
border-radius: 12px
최소 높이: 44px
```

#### Icon Button

```css
크기: 44px × 44px
배경: #f8f9fa
호버: #e9ecef
border-radius: 12px
색상: #6c757d
```

#### FAB (Floating Action Button)

```css
크기: 64px × 64px
배경: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)
border-radius: 50%
그림자: 0 8px 24px rgba(59, 130, 246, 0.4)
위치: fixed bottom-6 right-6
```

### 카드 (Cards)

#### 기본 카드

```css
배경: #ffffff
패딩: 20px 24px
border-radius: 16px
테두리: 1px solid #e6e6e666
그림자: shadow-sm
호버: translateY(-1px), 그림자 증가
```

#### DraftCard (정산 결과 카드)

```css
배경: #ffffff
테두리: border border-gray-200
border-radius: 16px (rounded-2xl)
그림자: shadow-sm
패딩: p-4
```

#### 강조 카드

```css
배경: #f5f8ff
테두리: border-dashed border-[#3182F6]/30
border-radius: 16px
패딩: p-4
```

### 입력 필드 (Input Fields)

#### 기본 입력

```css
배경: #f2f2f7
호버: #e5e5ea
패딩: px-4 py-3.5
border-radius: 16px
테두리: none
최소 높이: 44px
placeholder: #c7c7cc
```

### 태그 (Tags)

#### 모임정산 태그

```css
배경: #dbeafe
텍스트: #1d4ed8
패딩: 4px 8px
border-radius: 8px
폰트: 11px, font-weight: 600
```

#### 간편정산 태그

```css
배경: #fef3c7
텍스트: #d97706
패딩: 4px 8px
border-radius: 8px
폰트: 11px, font-weight: 600
```

### 배지 (Badges)

#### 카운트 배지

```css
활성: rgba(255,255,255,0.2) 배경, #ffffff 텍스트
비활성: #dee2e6 배경, #495057 텍스트
패딩: 2px 8px
border-radius: 10px
폰트: 12px, font-weight: 700
```

---

## 페이지 구조

### 1. 메인 페이지 (MainPage)

#### 레이아웃

```
┌─────────────────────────────────┐
│ Header (Sticky)                │
│ - 햄버거 메뉴 / 로고            │
│ - 로그인/로그아웃 버튼          │
├─────────────────────────────────┤
│                                 │
│ ChatContainer                   │
│ - 메시지 리스트                 │
│ - 입력 영역                     │
│                                 │
└─────────────────────────────────┘
```

#### 헤더 스타일

```css
배경: #ffffff
테두리: border-b border-[#E5E8EB]
패딩: px-4 md:px-6 lg:px-8 py-3
위치: fixed (모바일), sticky (데스크톱)
z-index: 30 (모바일), 20 (데스크톱)
```

#### 채팅 컨테이너

```css
배경: #ffffff
높이: flex-1 (남은 공간)
오버플로우: hidden
```

### 2. AI 채팅 인터페이스 (ChatContainer)

#### 메시지 버블

**사용자 메시지**

```css
정렬: 오른쪽 (justify-end)
배경: #3182F6
텍스트: #ffffff
border-radius: 16px 16px 4px 16px
패딩: px-4 py-3
```

**AI 메시지**

```css
정렬: 왼쪽 (justify-start)
배경: #ffffff
텍스트: #191f28
테두리: border border-gray-200
border-radius: 16px 16px 16px 4px
패딩: px-4 py-3
아이콘: Sparkles (#3182F6)
```

#### 입력 영역

```css
배경: #ffffff
테두리: border-t border-gray-200
패딩: p-4
```

### 3. 정산 결과 페이지 (ResultPage)

#### 레이아웃

```
┌─────────────────────────────────┐
│ 헤더                            │
├─────────────────────────────────┤
│ 총무 카드                       │
│ - 총무 정보                     │
│ - 받을 금액                     │
├─────────────────────────────────┤
│ 멤버 카드 리스트                │
│ - 멤버별 송금 정보              │
│ - 토스/카카오 송금 버튼          │
└─────────────────────────────────┘
```

#### 멤버 카드

```css
배경: #ffffff
테두리: border border-gray-200
border-radius: 16px
패딩: p-4
```

### 4. 공유 페이지 (SharePage)

#### 레이아웃

```css
배경: #F2F4F6
높이: h-screen
레이아웃: flex flex-col
```

#### 헤더

```css
배경: #ffffff
테두리: border-b border-gray-200
패딩: px-4 py-3
위치: sticky top-0
z-index: 10
```

---

## 반응형 디자인

### 브레이크포인트

- **모바일**: `< 768px` (md 미만)
- **데스크톱**: `≥ 768px` (md 이상)
- **작은 모바일**: `≤ 350px`

### 모바일 최적화

#### 터치 타겟

- **최소 크기**: 44px × 44px
- **버튼 패딩**: 최소 12px
- **간격**: 최소 8px

#### 레이아웃 변경

- **FAB 버튼**: 모바일에서만 표시
- **사이드바**: 오버레이 모달로 표시
- **헤더**: fixed 위치 (모바일)
- **버튼**: 전체 너비 (작은 화면)

### 데스크톱 최적화

#### 레이아웃

- **사이드바**: 항상 표시 (flex 레이아웃)
- **헤더**: sticky 위치
- **버튼**: 인라인 배치
- **최대 너비**: 컨텐츠에 따라 조정

---

## 애니메이션 & 인터랙션

### 전환 효과 (Transitions)

#### 기본 전환

```css
transition-colors: 150ms ease-in-out
transition-all: 200ms ease-in-out
```

#### 버튼 인터랙션

```css
호버: translateY(-2px) 또는 scale(0.98)
클릭: scale(0.95) 또는 scale(0.9)
활성: active:scale-95
```

### 애니메이션

#### 페이지 진입

```css
헤더: opacity 0→1, y -20→0 (0.5s)
리스트: opacity 0→1 (0.5s, delay 0.2s)
버튼: opacity 0→1, y 20→0 (0.5s, delay 0.4s)
```

#### 카드 애니메이션

```css
등장: opacity 0→1, scale 0.8→1 (0.2s)
필터 변경: opacity 0→1, y 20→0 (0.3s)
```

#### 로딩 애니메이션

```css
Shimmer: linear-gradient(90deg, #f0f0f0 0px, #e0e0e0 40px, #f0f0f0 80px)
배경 크기: 1000px 100%
애니메이션: 1.5s infinite
```

#### FAB 토글

```css
Plus 아이콘 회전: 0deg → 45deg
메뉴 등장: opacity 0→1, y 20→0
```

### 인터랙션 패턴

#### 호버 효과

- **카드**: 그림자 증가, translateY(-1px)
- **버튼**: 배경색 변경, 그림자 증가
- **링크**: 색상 변경

#### 클릭 효과

- **버튼**: scale(0.95)
- **카드**: 약간의 피드백

#### 스크롤

- **스무스 스크롤**: behavior: smooth
- **스크롤바**: 숨김 처리 (webkit-scrollbar)

---

## 그림자 (Shadows)

### 레벨

```css
기본: shadow-sm (0 1px 2px rgba(0,0,0,0.05))
중간: shadow-md (0 4px 6px rgba(0,0,0,0.1))
큰: shadow-lg (0 10px 15px rgba(0,0,0,0.1))
매우 큰: shadow-xl (0 20px 25px rgba(0,0,0,0.1))
```

### 커스텀 그림자

```css
카드 호버: 0 4px 16px rgba(0, 0, 0, 0.06)
버튼: 0 8px 24px rgba(색상, 0.25)
FAB: 0 8px 24px rgba(59, 130, 246, 0.4)
```

---

## 아이콘

### 아이콘 라이브러리

- **Lucide React**: 주요 아이콘
- **커스텀 이미지**: 로고, 플랫폼 아이콘

### 아이콘 크기

- **작은**: 12px, 16px
- **중간**: 18px, 20px
- **큰**: 24px

### 주요 아이콘

- **Sparkles**: AI 관련 (#3182F6)
- **Menu**: 햄버거 메뉴
- **LogIn/LogOut**: 인증
- **Copy**: 복사
- **Camera**: 이미지 업로드

---

## 로딩 상태

### 스켈레톤 UI

```css
배경: linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%)
배경 크기: 200% 100%
애니메이션: loading 1.5s infinite
```

### 스피너

```css
크기: 16px × 16px
테두리: 2px solid
색상: 현재 색상
애니메이션: spin
```

---

## 접근성 (Accessibility)

### 터치 타겟

- **최소 크기**: 44px × 44px
- **간격**: 최소 8px

### 색상 대비

- **텍스트/배경**: WCAG AA 기준 준수
- **링크**: 명확한 시각적 구분

### 키보드 네비게이션

- **포커스 표시**: 명확한 아웃라인
- **탭 순서**: 논리적 순서

---

## 유틸리티 클래스

### Tailwind 커스텀

```css
.scroll-hidden: 스크롤바 숨김
.scrollbar-hide: 스크롤바 숨김 (크로스 브라우저)
.bg-skeleton: 로딩 스켈레톤 배경
```

### 커스텀 애니메이션

```css
@keyframes loading: Shimmer 효과;
```

---

## 사용 예시

### Primary Button

```jsx
<button className="px-4 py-2.5 bg-[#3182F6] hover:bg-[#1E6FFF] text-white rounded-xl transition-colors active:scale-95 min-h-[44px]">
    버튼 텍스트
</button>
```

### Card

```jsx
<div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
    카드 내용
</div>
```

### Input

```jsx
<input className="w-full h-14 px-4 bg-[#f2f2f7] rounded-2xl border-none outline-none focus:bg-[#e5e5ea] transition-colors" />
```

---

## 체크리스트

랜딩 페이지 개발 시 확인사항:

- [ ] 색상 팔레트 일관성 유지
- [ ] 버튼 최소 크기 44px × 44px
- [ ] 반응형 디자인 적용
- [ ] 애니메이션 부드러움 확인
- [ ] 접근성 기준 준수
- [ ] 로딩 상태 처리
- [ ] 에러 상태 처리
- [ ] 빈 상태 처리

---

**마지막 업데이트**: 2024년
**버전**: 1.0.0
