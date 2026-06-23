-- 차량 옵션 시드 (idempotent)
-- 카테고리: slug 기준 충돌 시 무시 / 항목: (categoryId, name) 중복 시 무시

-- 1) 옵션 카테고리
INSERT INTO option_categories (id, name, slug, "displayOrder") VALUES
  (gen_random_uuid(), '안전', 'safety', 1),
  (gen_random_uuid(), '편의', 'convenience', 2),
  (gen_random_uuid(), '멀티미디어', 'multimedia', 3),
  (gen_random_uuid(), '내·외장', 'interior-exterior', 4)
ON CONFLICT (slug) DO NOTHING;

-- 2) 옵션 항목 (카테고리는 slug로 매핑)
INSERT INTO option_items (id, "categoryId", name, "nameKo", "displayOrder")
SELECT gen_random_uuid(), c.id, v.name, v.name, v.ord
FROM (VALUES
  -- 안전
  ('safety', '후방카메라', 1),
  ('safety', '어라운드뷰', 2),
  ('safety', '차선이탈경보', 3),
  ('safety', '자동긴급제동', 4),
  ('safety', '스마트크루즈컨트롤', 5),
  ('safety', '사각지대경보', 6),
  -- 편의
  ('convenience', '스마트키', 1),
  ('convenience', '통풍시트', 2),
  ('convenience', '열선시트', 3),
  ('convenience', '열선스티어링휠', 4),
  ('convenience', '전동시트', 5),
  ('convenience', '하이패스', 6),
  ('convenience', '오토에어컨', 7),
  ('convenience', '전동트렁크', 8),
  -- 멀티미디어
  ('multimedia', '내비게이션', 1),
  ('multimedia', '후방디스플레이', 2),
  ('multimedia', '애플카플레이', 3),
  ('multimedia', '안드로이드오토', 4),
  ('multimedia', '블루투스', 5),
  ('multimedia', '무선충전', 6),
  -- 내·외장
  ('interior-exterior', '선루프', 1),
  ('interior-exterior', '파노라마선루프', 2),
  ('interior-exterior', 'LED헤드램프', 3),
  ('interior-exterior', '알로이휠', 4),
  ('interior-exterior', '가죽시트', 5)
) AS v(cat_slug, name, ord)
JOIN option_categories c ON c.slug = v.cat_slug
WHERE NOT EXISTS (
  SELECT 1 FROM option_items oi
  WHERE oi."categoryId" = c.id AND oi.name = v.name
);
