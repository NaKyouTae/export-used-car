-- 차량 옵션 시드 (idempotent) — 카테고리 없이 평면 리스트
-- 항목: name 중복 시 무시

INSERT INTO option_items (id, name, "nameKo", "displayOrder")
SELECT gen_random_uuid(), v.name, v.name, v.ord
FROM (VALUES
  ('후방카메라', 1),
  ('어라운드뷰', 2),
  ('차선이탈경보', 3),
  ('자동긴급제동', 4),
  ('스마트크루즈컨트롤', 5),
  ('사각지대경보', 6),
  ('스마트키', 7),
  ('통풍시트', 8),
  ('열선시트', 9),
  ('열선스티어링휠', 10),
  ('전동시트', 11),
  ('하이패스', 12),
  ('오토에어컨', 13),
  ('전동트렁크', 14),
  ('내비게이션', 15),
  ('후방디스플레이', 16),
  ('애플카플레이', 17),
  ('안드로이드오토', 18),
  ('블루투스', 19),
  ('무선충전', 20),
  ('선루프', 21),
  ('파노라마선루프', 22),
  ('LED헤드램프', 23),
  ('알로이휠', 24),
  ('가죽시트', 25)
) AS v(name, ord)
WHERE NOT EXISTS (
  SELECT 1 FROM option_items oi WHERE oi.name = v.name
);
