ARAM Fearless Draft v0.15.33 · 새 PC 첫 실행 안내

- 대상: Windows 10/11 64-bit (x64)
- 별도 Node.js / Python / Electron 설치 불필요
- 첫 실행에는 인터넷 연결 필요
- Electron 44.2.0 Windows x64 런타임 약 158MB를 공식 GitHub에서 1회 다운로드
- 캐시 위치: %LOCALAPPDATA%\ARAM Fearless Draft AutoUpdate
- 이후 실행에서는 기존 Electron 캐시 재사용
- Riot Client는 앱 화면 자체를 여는 데 필수는 아니지만 AutoSync / LIVE / Riot Grade 수집에는 로그인 상태가 필요

Windows 보안 경고:
현재 EXE는 상용 코드서명 인증서로 서명하지 않았으므로 새 PC에서 Microsoft Defender SmartScreen / Unknown Publisher 경고가 나타날 수 있다. 신뢰하는 파일인지 확인한 후 Windows의 추가 정보 > 실행 절차가 필요할 수 있다.

새 PC의 로컬 데이터:
즐겨찾기, Player Profile 누적값, Riot Grade 기록 등은 빈 상태에서 시작한다. 앱 기능/UI/173챔 데이터/평가 엔진은 같은 v0.15.33이다.

현재 새 PC 배포용 EXE SHA-256:
fc9c87eb9d483c8da92ccb9c17a2513454474c6888abcf70d9eff02fafb7afeb  ARAM_Fearless_Draft_v0.15.33_windows_x64.exe

중요:
과거 v0.15.9 standalone EXE는 신규 사용자에게 배포하지 않는다. 현재 v0.15.33 전체 앱을 내장한 새 portable EXE를 사용한다.
