#!/bin/bash
# ============================================================================
#  도메인 설정 스크립트
#
#  사용법:  bash set-domain.sh cukgsa.org
#
#  하는 일:
#   1) 모든 페이지의 og:url / canonical / og:image 주소를 새 도메인으로 교체
#   2) sitemap.xml, robots.txt 의 주소 교체
#   3) GitHub Pages용 CNAME 파일 생성
#
#  도메인을 바꿔도 여러 번 다시 실행할 수 있습니다.
# ============================================================================
set -e
cd "$(dirname "$0")"

NEW="$1"
if [ -z "$NEW" ]; then
  echo "사용법: bash set-domain.sh cukgsa.org"
  echo "        (https:// 없이 도메인만 적어 주세요)"
  exit 1
fi

# https://, 끝 슬래시 제거
NEW="${NEW#http://}"; NEW="${NEW#https://}"; NEW="${NEW%/}"

# 현재 설정된 도메인 찾기 (없으면 최초 플레이스홀더)
if [ -f CNAME ]; then OLD="$(tr -d '[:space:]' < CNAME)"; else OLD="YOUR-DOMAIN.org"; fi

if [ "$OLD" = "$NEW" ]; then
  echo "이미 $NEW 로 설정돼 있습니다."
  exit 0
fi

echo "도메인 변경:  $OLD  ->  $NEW"

FILES=$(find . -name '*.html' -not -path './.git/*'; echo ./sitemap.xml; echo ./robots.txt)
for f in $FILES; do
  [ -f "$f" ] || continue
  if grep -q "$OLD" "$f" 2>/dev/null; then
    sed -i '' "s|$OLD|$NEW|g" "$f" 2>/dev/null || sed -i "s|$OLD|$NEW|g" "$f"
    echo "  수정  $f"
  fi
done

printf '%s\n' "$NEW" > CNAME
echo "  생성  ./CNAME  ($NEW)"
echo
echo "완료했습니다. 이제 GitHub 저장소에 올리면 됩니다."
echo "GitHub → Settings → Pages → Custom domain 에 $NEW 를 입력하고"
echo "'Enforce HTTPS' 를 켜 주세요."
