# Codex에 처음 붙여넣을 프롬프트

작업 디렉터리는 반드시 다음 경로를 기준으로 사용해.

`E:\Users\keun0\Desktop\fish`

먼저 현재 작업 디렉터리를 확인하고, 다르면 위 경로로 이동해.
사용자가 이미 만든 파일이나 Git 변경사항을 임의로 삭제·초기화하지 마.

그다음 아래 워크플로우 파일을 읽고 지시대로 자동 진행해.

`E:\Users\keun0\Desktop\fish\codex_srs_to_plan\00_START_HERE.md`

이번 작업의 목표는 현재 SRS를 소프트웨어 요구사항 Working SSOT로 사용해 다음 단계까지 완료하는 것이다.

1. `/speckit-constitution`
2. `/speckit-specify`
3. `/speckit-clarify`
4. Stitch MCP를 이용한 UI 구조 탐색 및 디자인 결정
5. 기존 `DESIGN.md`를 읽기 전용 Base Design System으로 사용하고 `DESIGN_DECISIONS.md` 작성
6. `/speckit-plan`
7. Plan 정합성 검토

중요 규칙:

- 가장 먼저 `codex_srs_to_plan/SOURCE_SRS_낚시포인트_v1.0_승인대기.md`를 읽어.
- 프로젝트 루트 `DESIGN.md`가 존재하는지 확인해. 이 파일은 사용자가 직접 넣은 Coinbase 기반 디자인 기준이다. 반드시 읽기 전용으로 사용하고 수정·재작성·덮어쓰기하지 마. 없으면 임의 대체본을 만들지 말고 `BLOCKED_MISSING_BASE_DESIGN`을 보고하고 Design/Plan 전에 중단해.
- 이 SRS는 **Baseline Candidate / 승인대기본**이다. 이번 작업에서는 소프트웨어 동작의 Working SSOT로 사용하되, 문서에 `[결정 필요]`, `Open Decision`, `Should`, `범위 보류`로 남은 항목을 임의로 확정하지 마.
- SRS의 Requirement ID를 변경하거나 의미를 바꾸지 마.
- Must와 Should를 뒤바꾸지 마.
- `금지 데이터가 없음 = 낚시 가능`으로 해석하지 마.
- `오래됨`, `미확인`, `수집실패`, `정보충돌`을 정상 `확인됨`으로 임의 승격하지 마.
- 판단 브리프 정확한 필드, freshness 임계값, POC 지원 포인트셋, 외부 데이터 제공자/API/라이선스, KPI 수치는 임의 확정하지 마.
- 지도/검색/목록 구조는 SRS가 Design 단계로 위임한 항목이므로 Stitch 단계에서 복수안을 비교하고 근거를 남긴 뒤 디자인 결정으로 선택해도 된다. 모든 시안은 프로젝트 루트 `DESIGN.md`를 공통 시각 기준으로 사용하고, 선택 결과는 `DESIGN_DECISIONS.md`에 기록해. 단, 제품 범위를 변경하지 마.
- Stitch MCP가 사용 가능하면 반드시 사용해. 사용 불가능하면 그 사실을 기록하고, 동일한 평가 기준으로 텍스트 와이어프레임과 디자인 결정안을 작성한 뒤 계속 진행해. 사용 불가를 이유로 중단하지 마.
- 사용자가 자리를 비운 상태를 전제로 한다. 사용자 답변을 기다리며 멈추지 말고, 근거가 없으면 `TBD`, `DEFERRED_VALIDATION`, `ARCHITECTURE_TBD` 등으로 명시해 계속 진행해.
- 실제 기능 코드는 구현하지 마.
- `/speckit-tasks`, `/speckit-analyze`, `/speckit-implement`는 실행하지 마.
- Plan 검토까지 완료하면 반드시 멈춰.

각 단계가 완료되면 다음 번호의 MD 파일을 자동으로 읽어 이어서 진행해.

이제 `codex_srs_to_plan/00_START_HERE.md`부터 읽고 시작해.
