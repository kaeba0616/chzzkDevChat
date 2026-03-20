# Project: chzzkDevChat

치지직(Chzzk) 라이브 방송 시청자가 채팅으로 아이디어를 제안하면, 스트리머가 대시보드에서 선택하여 Claude Code에 직접 전달하는 시스템입니다.

## 워크플로우
시청자 `!아이디어` 채팅 → 웹 대시보드에 리스트 표시 → 스트리머 선택 → Claude Code에 전달 → Claude가 코딩 수행

## Tech Stack
- **Runtime**: Bun (TypeScript 네이티브, 내장 HTTP/WebSocket)
- **Packages**: `chzzk` (kimcore, 치지직 채팅 TS 라이브러리), `@modelcontextprotocol/sdk` (MCP 채널)

## Architecture
단일 Bun 프로세스에서 3가지 서브시스템 운영:
- **MCP Channel Server**: stdio를 통해 Claude Code 세션과 통신
- **치지직 채팅 리스너**: `!아이디어` 프리픽스 채팅 필터링
- **웹 대시보드**: HTTP + WebSocket (port 8789)

## 설정 방법
1. `.env` 파일에 치지직 쿠키 및 채널 ID 설정
2. `bun install`

## 실행 방법
```bash
claude --dangerously-load-development-channels server:chzzk-ideas
# Claude Code가 .mcp.json을 읽고 bun ./server.ts를 자동 실행
# 대시보드: http://localhost:8789
# OBS 오버레이: http://localhost:8789/?obs=true
```

## 주요 파일
- `server.ts`: MCP 채널 + 치지직 리스너 + 웹 대시보드 통합 서버
- `dashboard.html.ts`: 대시보드 HTML/CSS/JS (export string)
- `types.ts`: 공유 타입 (Idea, WireMessage)
- `.mcp.json`: Claude Code MCP 서버 등록
- `.env`: NID_AUT, NID_SES, CHZZK_CHANNEL_ID

## Rules & Guidelines
1. **console.log 금지**: stdout은 MCP stdio 전용. 모든 로깅은 `process.stderr.write()` 사용
2. **Security**: API Key는 `.env` 파일 사용, 채팅 입력 XSS 방지
3. **Response Conciseness**: 방송 채팅 특성상 응답은 핵심 위주로 요약
4. **대시보드는 localhost 전용**: 외부 노출 없음 (127.0.0.1)
