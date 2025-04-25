# 전자책 뷰어 (Ebook Viewer)

Vue.js와 Vite를 사용하여 만든 간단한 전자책 뷰어 애플리케이션입니다.

## 기능

- 페이지별 콘텐츠 표시
- 이미지 지원
- 이전/다음 페이지 네비게이션
- 반응형 디자인

## 설치 방법

1. 프로젝트를 클론합니다:
```bash
git clone [프로젝트-URL]
```

2. 프로젝트 디렉토리로 이동합니다:
```bash
cd ebookv1
```

3. 의존성 패키지를 설치합니다:
```bash
npm install
```

## 실행 방법

개발 서버를 시작합니다:
```bash
npm run dev
```

## 빌드 방법

프로덕션용 빌드를 생성합니다:
```bash
npm run build
```

## 프로젝트 구조

```
src/
  ├── components/
  │   └── EbookViewer.vue  # 전자책 뷰어 메인 컴포넌트
  ├── App.vue              # 메인 애플리케이션 컴포넌트
  └── main.js              # 애플리케이션 진입점
```

## 사용자 정의

- `src/components/EbookViewer.vue` 파일에서 페이지 내용을 수정할 수 있습니다.
- 각 페이지는 title, content, image 속성을 가진 객체로 구성됩니다.
- 스타일은 각 컴포넌트의 `<style>` 섹션에서 수정할 수 있습니다.

## 라이센스

MIT





## 실행 방법

- `ebookv1_ppteditdownload` 경로에서
```bash
npm install
```

- `ebookv1_ppteditdownload/server` 경로에서
```bash
npm install
node .\pptParser.js
```

- `ebookv1_ppteditdownload` 경로에서
```bash
npm run dev
```
