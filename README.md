# chzzkDevChat

치지직(Chzzk) 라이브 방송 시청자가 채팅으로 아이디어를 제안하면, 스트리머가 웹 대시보드에서 선택하여 Claude Code에 직접 전달하는 시스템입니다. 시청자 투표 기능도 지원합니다.

## 워크플로우

```
시청자 "!아이디어 할일 앱 만들어줘"
    → 웹 대시보드에 리스트 표시
    → 스트리머가 선택 클릭
    → Claude Code 세션에 전달
    → Claude가 코딩 수행
    → 선택지가 나오면 시청자 투표로 결정
```

## 아키텍처

단일 Bun 프로세스에서 3가지 서브시스템을 운영합니다:

```
[치지직 채팅 WebSocket] --(!아이디어, !투표)--> [In-Memory State]
                                                     |
                                 WebSocket <-------->|
                                     |               |
                             [웹 대시보드/OBS]        |
                             (설정, 아이디어, 투표)    |
                                     |               v
                                 [MCP Channel Server] --stdio--> [Claude Code 세션]
```

## 설치

```bash
# 1. 레포 클론
git clone https://github.com/kaeba0616/chzzkDevChat.git
cd chzzkDevChat

# 2. Bun 설치 (없는 경우)
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc

# 3. 의존성 설치
bun install
```

## 설정

### MCP 서버 등록

`~/.mcp.json`에 추가하면 **어떤 프로젝트 디렉토리에서든** 사용할 수 있습니다:

```json
{
  "mcpServers": {
    "chzzk-ideas": {
      "command": "bun",
      "args": ["/절대경로/chzzkDevChat/server.ts"]
    }
  }
}
```

> `args`의 경로를 본인이 클론한 위치에 맞게 수정하세요.

### 치지직 채널 연결

`.env` 파일 수정 없이 **대시보드 웹 UI에서 설정**할 수 있습니다:

1. 대시보드 접속 후 **"설정"** 버튼 클릭
2. 치지직 채널 ID 입력 (채널 URL에서 확인: `chzzk.naver.com/live/채널ID`)
3. **"저장 및 연결"** 클릭

> 성인 인증이 필요 없는 방송이면 쿠키(NID_AUT, NID_SES)는 비워두세요.

## 실행

코딩 작업을 수행할 프로젝트 디렉토리에서:

```bash
cd ~/dev/my-project
claude --dangerously-load-development-channels server:chzzk-ideas
```

Claude Code가 서버를 자동 실행합니다. 별도로 서버를 띄울 필요 없습니다.

> **주의**: 사전에 `~/.mcp.json`에 절대경로로 MCP 서버를 등록해야 합니다 (위 [MCP 서버 등록](#mcp-서버-등록) 참고).

- **대시보드**: http://localhost:8789
- **OBS 오버레이**: http://localhost:8789/?obs=true

## 사용법

### 아이디어 수집

1. 대시보드에서 **"아이디어 수집 시작"** 클릭 (기본 꺼짐)
2. 시청자가 채팅에 `!아이디어 뱀 게임 만들어줘` 입력
3. 대시보드에 아이디어 실시간 표시
4. **"Claude에 전달"** 클릭 → Claude가 코딩 시작
5. 끝나면 **"아이디어 수집 중지"** 클릭

### 시청자 투표

Claude가 선택지를 제시하면:

1. 대시보드에서 **"투표 생성"** 클릭
2. 질문과 선택지 입력 → **"투표 시작"**
3. 시청자가 채팅에 `!투표 1`, `!투표 2` 등으로 투표 (1인 1표)
4. 대시보드에서 실시간 프로그레스 바 확인
5. **"투표 종료"** 클릭 → 결과가 Claude에 전달 → 최다 득표 선택지로 진행

## 테스트

방송 없이도 테스트용 API로 확인할 수 있습니다:

```bash
# 아이디어 추가
curl -X POST localhost:8789/test-idea -d "뱀 게임 만들어줘"

# 투표 생성
curl -X POST localhost:8789/test-create-vote \
  -H "Content-Type: application/json" \
  -d '{"question":"프레임워크 선택","options":["React","Vue","Svelte"]}'

# 투표하기
curl -X POST localhost:8789/test-vote -d "1"
curl -X POST localhost:8789/test-vote -d "3"
```

## Tech Stack

- **Runtime**: [Bun](https://bun.sh)
- **Language**: TypeScript
- **Packages**: [chzzk](https://github.com/kimcore/chzzk) (치지직 채팅), [@modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk) (MCP 채널)

## 파일 구조

```
├── server.ts           # MCP 채널 + 치지직 리스너 + 웹 대시보드 + 설정 API
├── dashboard.html.ts   # 대시보드 HTML/CSS/JS (설정, 아이디어, 투표)
├── types.ts            # 공유 타입 정의
├── .mcp.json           # Claude Code MCP 서버 등록
├── config.json         # 설정 파일 (대시보드에서 자동 생성, git 미포함)
└── CLAUDE.md           # Claude Code 프로젝트 지침
```

### 치지직 재연결

앱 실행 후 방송을 시작한 경우, 대시보드 상단 치지직 상태 옆 **"재연결"** 버튼을 클릭하면 채팅에 연결됩니다.

## 주의사항

- 치지직 쿠키(`NID_AUT`, `NID_SES`)는 만료될 수 있음 — 대시보드 설정에서 재입력
- 대시보드는 localhost 전용 (`127.0.0.1`) — 외부 노출 없음
- 이전 서버 프로세스가 남아있으면 포트 충돌 발생 — Claude Code 재시작 전 확인
- 방송 시작 전에 앱을 실행하면 채팅 연결이 안 됨 — 방송 시작 후 **"재연결"** 버튼 사용
