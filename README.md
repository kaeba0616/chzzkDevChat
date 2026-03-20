# chzzkDevChat

치지직(Chzzk) 라이브 방송 시청자가 채팅으로 아이디어를 제안하면, 스트리머가 웹 대시보드에서 선택하여 Claude Code에 직접 전달하는 시스템입니다.

## 워크플로우

```
시청자 "!아이디어 할일 앱 만들어줘"
    → 웹 대시보드에 리스트 표시
    → 스트리머가 선택 클릭
    → Claude Code 세션에 전달
    → Claude가 코딩 수행
```

## 아키텍처

단일 Bun 프로세스에서 3가지 서브시스템을 운영합니다:

```
[치지직 채팅 WebSocket] --(!아이디어 필터)--> [In-Memory Ideas]
                                                  |
                              WebSocket <-------->|
                                  |               |
                          [웹 대시보드/OBS]        |
                          (스트리머가 선택 클릭)    |
                                  |               v
                              [MCP Channel Server] --stdio--> [Claude Code 세션]
```

## 설치

```bash
# Bun 설치 (없는 경우)
curl -fsSL https://bun.sh/install | bash

# 의존성 설치
bun install
```

## 설정

`.env` 파일에 치지직 인증 정보를 입력합니다:

```env
# 네이버 로그인 후 브라우저 개발자 도구 > Application > Cookies에서 확인
NID_AUT=your_nid_aut_here
NID_SES=your_nid_ses_here

# 치지직 채널 페이지 URL에서 확인 (예: chzzk.naver.com/live/xxxx)
CHZZK_CHANNEL_ID=your_channel_id_here
```

## 실행

```bash
claude --dangerously-load-development-channels server:chzzk-ideas
```

Claude Code가 `.mcp.json`을 읽고 `bun ./server.ts`를 자동 실행합니다.

- **대시보드**: http://localhost:8789
- **OBS 오버레이**: http://localhost:8789/?obs=true

## 사용법

1. 시청자가 채팅에 `!아이디어 원하는 내용`을 입력
2. 대시보드에 아이디어가 실시간으로 표시됨
3. 스트리머가 "Claude에 전달" 버튼 클릭
4. Claude Code 세션에 `<channel>` 태그로 아이디어가 도착
5. Claude가 아이디어를 읽고 코딩 작업 수행

## Tech Stack

- **Runtime**: [Bun](https://bun.sh)
- **Language**: TypeScript
- **Packages**: [chzzk](https://github.com/kimcore/chzzk) (치지직 채팅), [@modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk) (MCP 채널)

## 파일 구조

```
├── server.ts           # MCP 채널 + 치지직 리스너 + 웹 대시보드
├── dashboard.html.ts   # 대시보드 HTML/CSS/JS
├── types.ts            # 공유 타입 정의
├── .mcp.json           # Claude Code MCP 서버 등록
├── .env                # 인증 정보 (git 미포함)
└── CLAUDE.md           # Claude Code 프로젝트 지침
```

## 주의사항

- 치지직 쿠키(`NID_AUT`, `NID_SES`)는 만료될 수 있음 — 대시보드에서 연결 상태 확인
- 대시보드는 localhost 전용 (`127.0.0.1`) — 외부 노출 없음
- `stdout`은 MCP stdio 전용이므로 `console.log` 사용 금지
