# NOIR — 비공개 로컬 AI 캐릭터 채팅

내 Windows PC(RTX 4070 12GB)를 서버로 쓰는 **1인 전용** AI 캐릭터 채팅 웹앱입니다.
대화·캐릭터·설정은 모두 PC 안의 SQLite 파일에 저장되며, 외부 상용 AI API를 쓰지 않습니다(Ollama 로컬 모델 사용).

> 현재 **1단계(핵심 채팅)** 까지 구현·테스트되었습니다. 장기 기억, 이미지, 음성, PWA, Tailscale 접속은 다음 단계입니다.
> 진행 상황은 [`docs/DEV_LOG.md`](docs/DEV_LOG.md) 를 보세요.

## 1. 준비물 (Windows)

| 항목 | 버전 | 비고 |
|---|---|---|
| Node.js | 22 LTS 권장 (20.9 이상) | https://nodejs.org |
| Ollama | 최신 | https://ollama.com/download |
| NVIDIA 드라이버 | 최신 Game Ready/Studio | Ollama 가 CUDA 를 자동 사용 |
| Git | 선택 | 저장소를 받을 때 |

먼저 PC 상태를 확인하세요 (읽기 전용, 아무것도 바꾸지 않음):

```powershell
cd noir-chat
powershell -ExecutionPolicy Bypass -File scripts\windows\diagnose.ps1
```

`diagnose-report.txt` 가 생성됩니다. 이 내용을 다음 개발 대화에 붙여 넣으면 PC 에 맞춘 조정이 가능합니다.

## 2. 모델 설치 (12GB VRAM 기준)

PowerShell 에서:

```powershell
ollama pull qwen2.5:14b      # 약 9GB, 한국어 양호 — 기본 추천
ollama pull gemma3:12b       # 약 8GB, 한국어 자연스러움
ollama pull exaone3.5:7.8b   # 약 5GB, 한국어 특화(LG), 빠름
```

- 모델 파일 크기가 **약 9.5GB 이하**면 컨텍스트 8K 와 함께 GPU 에 완전히 올라갑니다. 그보다 크면 일부가 CPU 로 넘어가 매우 느려집니다(설정 화면에 표시).
- 성인 표현의 실제 수위는 **모델마다 다릅니다.** 일반 instruct 모델은 노골적 묘사를 거절할 수 있습니다. 다른 모델은 Ollama 라이브러리나 Hugging Face GGUF(`ollama create` + Modelfile)로 직접 추가할 수 있으며, 앱은 설치된 모든 모델을 자동으로 목록에 보여 줍니다.
- 선택 권장: VRAM 절약을 위해 Windows 환경 변수 `OLLAMA_FLASH_ATTENTION=1`, `OLLAMA_KV_CACHE_TYPE=q8_0` 를 설정하면 같은 VRAM 으로 더 긴 컨텍스트를 쓸 수 있습니다(Ollama 재시작 필요).

## 3. 실행

가장 간단한 방법: `scripts\windows\start.bat` 더블클릭
(처음 한 번 `npm ci` + 빌드 후 실행, 브라우저가 자동으로 열립니다.)

수동 실행:

```powershell
npm ci
npm run build
npm run start      # http://127.0.0.1:3210
```

처음 접속하면 **초기 설정** 화면에서 비밀번호(10자 이상)를 만들고 만 19세 이상임을 확인합니다.
그 다음 설정 → 기본 모델 선택 → 캐릭터 만들기 → 대화하기.

> 서버는 기본적으로 `127.0.0.1` 에만 바인딩되어 **이 PC 에서만** 접속됩니다. 휴대폰 접속(Tailscale HTTPS)은 다음 단계에서 승인을 받고 설정합니다.

## 4. 기능 (1단계)

- 단일 사용자 비밀번호 로그인 (scrypt 해시, HttpOnly 세션 쿠키, 30일 슬라이딩 만료, 15분 8회 실패 시 잠금, 모든 기기 로그아웃)
- 캐릭터: 이름·나이·성별·한 줄 소개·외모·성격·말투·배경·세계관·관계·첫 인사말·말투 예시·추가 지침·전용 모델·temperature·프로필 이미지
- `{{user}}`, `{{char}}` 치환
- Ollama 실시간 스트리밍, 중단, 다시 생성, 이어서 말하기, 메시지 수정/삭제, 수정 후 재생성
- 대화별 모델 변경, 대화 여러 개(캐릭터별), 제목 변경
- 컨텍스트 한도 자동 관리(오래된 메시지부터 제외하고 안내 표시)
- 생성 중 연결이 끊겨도 부분 응답 저장, 대화당 동시 생성 1개(GPU 보호)
- 설정: Ollama 주소/상태/설치 모델/VRAM 적합도, num_ctx, 응답 길이, temperature, top_p, repeat_penalty, keep_alive, VRAM 비우기
- 수위: 전역 **성인 모드** + 캐릭터별 **성인 롤플레이 허용** 두 스위치가 모두 켜져야 성인 지침 적용

### 콘텐츠 경계 (변경 불가)
- 모든 캐릭터는 **만 19세 이상**이어야 저장됩니다.
- 성인 롤플레이 캐릭터의 설정에 미성년자를 암시하는 표현(예: "17살", "여고생")이 있으면 저장이 거부됩니다. "3살 연상", "고등학생 때부터 알던 사이" 같은 표현은 허용됩니다.
- 시스템 프롬프트에 미성년자·실존 인물·비동의 미화 금지가 항상 포함됩니다.

## 5. 데이터 · 백업

- 모든 데이터: `noir-chat\data\` (`noir.db`, `avatars\`). Git 에 올라가지 않습니다.
- 지금 백업하는 법: 앱을 종료한 뒤 `data` 폴더를 통째로 복사. (앱 내 백업/복원은 다음 단계)
- 비밀번호 분실: `npm run reset-password` (PC 에서 직접 실행, 모든 기기 로그아웃)

## 6. 개발 / 테스트

```bash
npm run test:unit   # 안전 규칙 단위 테스트
npm run build && npm run test:e2e   # 가짜 Ollama + 실제 서버로 65개 통합 테스트
```

`scripts/mock-ollama.mjs` 는 실제 Ollama 와 같은 스트리밍 프로토콜의 테스트용 서버입니다.

## 7. 구조

```
src/lib/        db(SQLite·마이그레이션) auth settings ollama prompt generate repo safety files api
src/app/api/    auth · characters · conversations · messages · ollama · settings · files
src/app/        login · setup · (main)/{홈, characters, chat, settings}
src/components/ ChatView CharacterForm SettingsView …
scripts/        mock-ollama · e2e-test · reset-password · windows/{diagnose.ps1, start.bat}
```
