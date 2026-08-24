#!/bin/bash
# ============================================================================
#  출시 전 점검
#
#  사용법:  bash launch-check.sh
#
#  예시 데이터가 남아 있는지 검사합니다.
#  ★ 표시는 실제 도메인에 올리기 전에 반드시 고쳐야 하는 항목입니다.
# ============================================================================
cd "$(dirname "$0")"
BLOCK=0; WARN=0

blocker() { echo "  ★ $1"; BLOCK=$((BLOCK+1)); }
warn()    { echo "  · $1"; WARN=$((WARN+1)); }
has()     { grep -q "$1" $2 2>/dev/null; }

echo
echo "════════════════════════════════════════════════════════════"
echo "  KGSA 홈페이지 출시 전 점검"
echo "════════════════════════════════════════════════════════════"
echo
echo "[1] 실존 회사·기관 이름이 들어간 예시 데이터"
echo "    (동의 없이 올리면 그 회사에 피해가 갑니다)"
has '파인애플 Pineapple' assets/js/data.js && \
  warn "후원업체가 가상의 예시입니다 (파인애플·베어피크 등). 실제 계약처로 교체하세요 — data.js 의 KGSA_SPONSORS"

# 조직명 오기 검사
grep -rq 'KSAG' --include='*.html' --include='*.js' . 2>/dev/null && \
  blocker "옛 이름 'KSAG' 가 남아 있습니다 — 정식 명칭은 KGSA 입니다"

echo
echo "[2] 지어낸 숫자·연혁"
has '250+명' pages/about.html && blocker "회원 수·설립연도 등이 예시입니다 — about.html 사이드바"
has 'KGSA 창립, 첫 신입생' pages/about.html && blocker "연혁이 예시입니다 — about.html"
has '실제 회칙 전문으로 교체' pages/about.html && warn "회칙이 요약 예시입니다 — about.html"

echo
echo "[3] 연락처"
[ "$(grep -c 'href="#"' assets/js/main.js)" -gt 0 ] && \
  warn "SNS 주소가 비어 있습니다 — 운영 → 연락처 탭에서 넣으세요 (Supabase 연결 후)"
has 'kgsa@colorado.edu' assets/js/main.js && \
  warn "대표 메일이 kgsa@colorado.edu 입니다. 실제로 받는 주소인지 확인하세요"

echo
echo "[4] 생활정보 수치"
has '\$1,400~' pages/info.html && warn "렌트 시세가 예시입니다 — info.html"
has '번호는 반드시 최신 정보로' pages/info.html && warn "긴급 연락처 확인 필요 — info.html"

echo
echo "[5] 행사"
has '장소 추후 공지' assets/js/data.js && \
  warn "정기 총회 장소·시간이 미정입니다 — data.js 의 KGSA_EVENTS"
has '가을학기 개강 환영 BBQ' assets/js/data.js && \
  blocker "공지 예시글이 실제 행사 일정과 충돌합니다 (있지도 않은 8/29 BBQ 공지) — data.js 의 KGSA_POSTS"

echo
echo "[6] 도메인 · 배포"
if [ -f CNAME ]; then
  echo "  ✓ 도메인: $(cat CNAME)"
else
  blocker "도메인 미설정 — 'bash set-domain.sh 산도메인.org' 를 실행하세요"
fi
has 'YOUR-DOMAIN.org' index.html && \
  blocker "공유 미리보기 주소가 자리표시자입니다 (카톡 링크 카드가 안 뜹니다)"

echo
echo "[7] 게시판 백엔드 (선택)"
if grep -q 'url:     ""' assets/js/supabase-config.js 2>/dev/null; then
  warn "Supabase 미설정 — 게시판이 읽기 전용(예시 데이터)으로 동작합니다"
  warn "  켜려면: supabase/설치방법.md"
else
  echo "  ✓ Supabase 설정됨"
  # 실제 anonKey 값만 검사합니다 (파일 안내 주석에도 'service_role' 이라는
  # 단어가 등장하므로, 파일 전체를 grep 하면 항상 오탐이 납니다).
  anon_val=$(grep -E '^\s*anonKey:' assets/js/supabase-config.js | sed -E 's/.*"([^"]*)".*/\1/')
  if [[ "$anon_val" == sb_secret_* ]]; then
    blocker "service_role 키(sb_secret_...)가 들어 있습니다! 즉시 anon/publishable 키로 바꾸고 Supabase 에서 키를 재발급하세요"
  elif [[ "$anon_val" == *.*.* ]]; then
    # 예전 방식 JWT 키 — 가운데 payload 조각을 디코드해서 role 클레임을 확인합니다
    payload=$(echo "$anon_val" | cut -d. -f2)
    padded=$(python3 -c "import sys,base64; s=sys.argv[1]; print(base64.urlsafe_b64decode(s+'='*(-len(s)%4)).decode('utf-8','ignore'))" "$payload" 2>/dev/null)
    if echo "$payload$padded" | grep -q '"role"\s*:\s*"service_role"'; then
      blocker "service_role 키가 들어 있습니다! 즉시 anon 키로 바꾸고 Supabase 에서 키를 재발급하세요"
    fi
  fi
fi

echo
echo "[8] 폼 연결"
has 'README의 .폼 연결' pages/join.html && warn "가입 폼이 데모 모드입니다 (제출해도 아무 데도 안 갑니다) — README 5장"
has 'README의 .폼 연결' pages/contact.html && warn "문의 폼이 데모 모드입니다 — README 5장"

echo
echo "════════════════════════════════════════════════════════════"
if [ $BLOCK -eq 0 ]; then
  echo "  ★ 반드시 고쳐야 할 항목: 없음 — 출시 가능합니다"
else
  echo "  ★ 반드시 고쳐야 할 항목: ${BLOCK}건 — 아직 올리지 마세요"
fi
echo "  · 권장 항목: ${WARN}건"
echo "════════════════════════════════════════════════════════════"
echo
