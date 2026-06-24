-- ════════════════════════════════════════════════════════════════════
-- 차량 분류 시드 (차종 / 제조사 / 모델 / 옵션)  — 수동 실행용
--   실행:  psql "$DATABASE_URL" -f prisma/seed-taxonomy.sql
--   name = 영문(노출/유니크), nameKo = 한글
--   idempotent: 여러 번 실행해도 중복 INSERT 안 됨 (ON CONFLICT / NOT EXISTS)
-- ════════════════════════════════════════════════════════════════════

-- ───────────────────────────── 1) 차종 (categories) ─────────────────────────────
INSERT INTO categories (id, name, slug, "displayOrder") VALUES
  (gen_random_uuid(), 'Light/Compact', 'light-compact', 1),
  (gen_random_uuid(), 'Sedan', 'sedan', 2),
  (gen_random_uuid(), 'Large Sedan', 'large-sedan', 3),
  (gen_random_uuid(), 'SUV/RV', 'suv-rv', 4),
  (gen_random_uuid(), 'Van/Truck', 'van-truck', 5),
  (gen_random_uuid(), 'Etc', 'etc', 6)
ON CONFLICT (slug) DO NOTHING;

-- ───────────────────────────── 2) 제조사 (makes) ─────────────────────────────
INSERT INTO makes (id, name, "nameKo", country, "displayOrder", "createdAt", "updatedAt")
SELECT gen_random_uuid(), v.name, v.name_ko, v.country, v.ord, now(), now()
FROM (VALUES
  -- 국산차
  ('Hyundai',        '현대',          'South Korea',     1),
  ('Kia',            '기아',          'South Korea',     2),
  ('Genesis',        '제네시스',       'South Korea',     3),
  ('Chevrolet',      '쉐보레',         'South Korea',     4),
  ('Renault Korea',  '르노코리아',      'South Korea',     5),
  ('KG Mobility',    'KG모빌리티',      'South Korea',     6),
  -- 수입차 (독일)
  ('BMW',            'BMW',           'Germany',         20),
  ('Mercedes-Benz',  '메르세데스-벤츠',  'Germany',         21),
  ('Audi',           '아우디',         'Germany',         22),
  ('Volkswagen',     '폭스바겐',        'Germany',         23),
  ('Porsche',        '포르쉐',         'Germany',         24),
  -- 수입차 (미국)
  ('Tesla',          '테슬라',         'USA',             30),
  ('Ford',           '포드',          'USA',             31),
  ('Lincoln',        '링컨',          'USA',             32),
  ('Jeep',           '지프',          'USA',             33),
  ('Cadillac',       '캐딜락',         'USA',             34),
  ('Chrysler',       '크라이슬러',      'USA',             35),
  ('Dodge',          '닷지',          'USA',             36),
  -- 수입차 (일본)
  ('Toyota',         '토요타',         'Japan',           40),
  ('Lexus',          '렉서스',         'Japan',           41),
  ('Honda',          '혼다',          'Japan',           42),
  ('Nissan',         '닛산',          'Japan',           43),
  ('Infiniti',       '인피니티',        'Japan',           44),
  ('Mazda',          '마쓰다',         'Japan',           45),
  ('Mitsubishi',     '미쓰비시',        'Japan',           46),
  -- 수입차 (영국/프랑스/스웨덴)
  ('MINI',           '미니',          'United Kingdom',  50),
  ('Jaguar',         '재규어',         'United Kingdom',  51),
  ('Land Rover',     '랜드로버',        'United Kingdom',  52),
  ('Bentley',        '벤틀리',         'United Kingdom',  53),
  ('Rolls-Royce',    '롤스로이스',      'United Kingdom',  54),
  ('Aston Martin',   '애스턴마틴',      'United Kingdom',  55),
  ('Peugeot',        '푸조',          'France',          56),
  ('Citroen',        '시트로엥',        'France',          57),
  ('Renault',        '르노',          'France',          58),
  ('Volvo',          '볼보',          'Sweden',          59),
  -- 수입차 (이탈리아)
  ('Ferrari',        '페라리',         'Italy',           60),
  ('Lamborghini',    '람보르기니',      'Italy',           61),
  ('Maserati',       '마세라티',        'Italy',           62)
) AS v(name, name_ko, country, ord)
WHERE NOT EXISTS (SELECT 1 FROM makes m WHERE m.name = v.name);

-- ───────────────────────────── 3) 모델 (car_models) ─────────────────────────────
-- 모델마다 차종(category) slug 를 함께 매핑해 car_models.categoryId 를 채운다.
--   → 판매자가 차량 등록 시 모델을 고르면 차종이 자동 입력됨
--     (app/src/app/seller/cars/new/page.tsx 의 model.categoryId 사용)
--   cat_slug 는 1) 차종(categories) 의 slug 와 동일해야 함:
--     light-compact / sedan / large-sedan / suv-rv / van-truck / etc
DROP TABLE IF EXISTS _model_seed;
CREATE TEMP TABLE _model_seed (make_name text, name text, name_ko text, cat_slug text, ord int);
INSERT INTO _model_seed (make_name, name, name_ko, cat_slug, ord) VALUES
  -- ── 현대 (Hyundai) ──
  ('Hyundai','Grandeur','그랜저','large-sedan',1),
  ('Hyundai','Sonata','쏘나타','sedan',2),
  ('Hyundai','Avante','아반떼','sedan',3),
  ('Hyundai','i30','i30','sedan',4),
  ('Hyundai','Veloster','벨로스터','etc',5),
  ('Hyundai','Accent','엑센트','light-compact',6),
  ('Hyundai','Santa Fe','싼타페','suv-rv',7),
  ('Hyundai','Tucson','투싼','suv-rv',8),
  ('Hyundai','Palisade','팰리세이드','suv-rv',9),
  ('Hyundai','Kona','코나','suv-rv',10),
  ('Hyundai','Venue','베뉴','suv-rv',11),
  ('Hyundai','Casper','캐스퍼','light-compact',12),
  ('Hyundai','Ioniq 5','아이오닉 5','suv-rv',13),
  ('Hyundai','Ioniq 6','아이오닉 6','sedan',14),
  ('Hyundai','Nexo','넥쏘','suv-rv',15),
  ('Hyundai','Staria','스타리아','van-truck',16),
  ('Hyundai','Starex','스타렉스','van-truck',17),
  ('Hyundai','Porter','포터','van-truck',18),
  -- ── 기아 (Kia) ──
  ('Kia','Morning','모닝','light-compact',1),
  ('Kia','Ray','레이','light-compact',2),
  ('Kia','K3','K3','sedan',3),
  ('Kia','K5','K5','sedan',4),
  ('Kia','K7','K7','large-sedan',5),
  ('Kia','K8','K8','large-sedan',6),
  ('Kia','K9','K9','large-sedan',7),
  ('Kia','Stinger','스팅어','sedan',8),
  ('Kia','Stonic','스토닉','suv-rv',9),
  ('Kia','Seltos','셀토스','suv-rv',10),
  ('Kia','Sportage','스포티지','suv-rv',11),
  ('Kia','Sorento','쏘렌토','suv-rv',12),
  ('Kia','Mohave','모하비','suv-rv',13),
  ('Kia','Niro','니로','suv-rv',14),
  ('Kia','Soul','쏘울','suv-rv',15),
  ('Kia','EV6','EV6','suv-rv',16),
  ('Kia','EV9','EV9','suv-rv',17),
  ('Kia','Carnival','카니발','van-truck',18),
  ('Kia','Bongo','봉고','van-truck',19),
  -- ── 제네시스 (Genesis) ──
  ('Genesis','G70','G70','sedan',1),
  ('Genesis','G80','G80','large-sedan',2),
  ('Genesis','G90','G90','large-sedan',3),
  ('Genesis','GV60','GV60','suv-rv',4),
  ('Genesis','GV70','GV70','suv-rv',5),
  ('Genesis','GV80','GV80','suv-rv',6),
  ('Genesis','EQ900','EQ900','large-sedan',7),
  -- ── 쉐보레 (Chevrolet) ──
  ('Chevrolet','Spark','스파크','light-compact',1),
  ('Chevrolet','Aveo','아베오','light-compact',2),
  ('Chevrolet','Cruze','크루즈','sedan',3),
  ('Chevrolet','Malibu','말리부','sedan',4),
  ('Chevrolet','Impala','임팔라','large-sedan',5),
  ('Chevrolet','Trax','트랙스','suv-rv',6),
  ('Chevrolet','Trailblazer','트레일블레이저','suv-rv',7),
  ('Chevrolet','Equinox','이쿼녹스','suv-rv',8),
  ('Chevrolet','Captiva','캡티바','suv-rv',9),
  ('Chevrolet','Traverse','트래버스','suv-rv',10),
  ('Chevrolet','Orlando','올란도','suv-rv',11),
  ('Chevrolet','Colorado','콜로라도','van-truck',12),
  ('Chevrolet','Camaro','카마로','etc',13),
  ('Chevrolet','Bolt','볼트','light-compact',14),
  -- ── 르노코리아 (Renault Korea) ──
  ('Renault Korea','SM3','SM3','sedan',1),
  ('Renault Korea','SM5','SM5','sedan',2),
  ('Renault Korea','SM6','SM6','sedan',3),
  ('Renault Korea','SM7','SM7','large-sedan',4),
  ('Renault Korea','QM3','QM3','suv-rv',5),
  ('Renault Korea','QM5','QM5','suv-rv',6),
  ('Renault Korea','QM6','QM6','suv-rv',7),
  ('Renault Korea','XM3','XM3','suv-rv',8),
  ('Renault Korea','Grand Koleos','그랑콜레오스','suv-rv',9),
  ('Renault Korea','Master','마스터','van-truck',10),
  ('Renault Korea','Twizy','트위지','etc',11),
  -- ── KG모빌리티 (KG Mobility) ──
  ('KG Mobility','Tivoli','티볼리','suv-rv',1),
  ('KG Mobility','Korando','코란도','suv-rv',2),
  ('KG Mobility','Korando Sports','코란도 스포츠','van-truck',3),
  ('KG Mobility','Rexton','렉스턴','suv-rv',4),
  ('KG Mobility','Rexton Sports','렉스턴 스포츠','van-truck',5),
  ('KG Mobility','Torres','토레스','suv-rv',6),
  ('KG Mobility','Torres EVX','토레스 EVX','suv-rv',7),
  ('KG Mobility','Musso','무쏘','van-truck',8),
  ('KG Mobility','Actyon','액티언','suv-rv',9),
  ('KG Mobility','Rodius','로디우스','van-truck',10),
  ('KG Mobility','Chairman','체어맨','large-sedan',11),
  -- ── BMW ──
  ('BMW','1 Series','1시리즈','sedan',1),
  ('BMW','2 Series','2시리즈','sedan',2),
  ('BMW','3 Series','3시리즈','sedan',3),
  ('BMW','4 Series','4시리즈','etc',4),
  ('BMW','5 Series','5시리즈','sedan',5),
  ('BMW','6 Series','6시리즈','etc',6),
  ('BMW','7 Series','7시리즈','large-sedan',7),
  ('BMW','8 Series','8시리즈','etc',8),
  ('BMW','X1','X1','suv-rv',9),
  ('BMW','X3','X3','suv-rv',10),
  ('BMW','X4','X4','suv-rv',11),
  ('BMW','X5','X5','suv-rv',12),
  ('BMW','X6','X6','suv-rv',13),
  ('BMW','X7','X7','suv-rv',14),
  ('BMW','Z4','Z4','etc',15),
  ('BMW','i4','i4','sedan',16),
  ('BMW','iX','iX','suv-rv',17),
  -- ── Mercedes-Benz ──
  ('Mercedes-Benz','A-Class','A클래스','sedan',1),
  ('Mercedes-Benz','C-Class','C클래스','sedan',2),
  ('Mercedes-Benz','E-Class','E클래스','sedan',3),
  ('Mercedes-Benz','S-Class','S클래스','large-sedan',4),
  ('Mercedes-Benz','CLA','CLA','sedan',5),
  ('Mercedes-Benz','CLS','CLS','large-sedan',6),
  ('Mercedes-Benz','GLA','GLA','suv-rv',7),
  ('Mercedes-Benz','GLB','GLB','suv-rv',8),
  ('Mercedes-Benz','GLC','GLC','suv-rv',9),
  ('Mercedes-Benz','GLE','GLE','suv-rv',10),
  ('Mercedes-Benz','GLS','GLS','suv-rv',11),
  ('Mercedes-Benz','G-Class','G클래스','suv-rv',12),
  ('Mercedes-Benz','EQE','EQE','sedan',13),
  ('Mercedes-Benz','EQS','EQS','large-sedan',14),
  ('Mercedes-Benz','V-Class','V클래스','van-truck',15),
  -- ── Audi ──
  ('Audi','A3','A3','sedan',1),
  ('Audi','A4','A4','sedan',2),
  ('Audi','A5','A5','etc',3),
  ('Audi','A6','A6','sedan',4),
  ('Audi','A7','A7','large-sedan',5),
  ('Audi','A8','A8','large-sedan',6),
  ('Audi','Q3','Q3','suv-rv',7),
  ('Audi','Q5','Q5','suv-rv',8),
  ('Audi','Q7','Q7','suv-rv',9),
  ('Audi','Q8','Q8','suv-rv',10),
  ('Audi','e-tron','e-트론','suv-rv',11),
  ('Audi','TT','TT','etc',12),
  ('Audi','R8','R8','etc',13),
  -- ── Volkswagen ──
  ('Volkswagen','Polo','폴로','light-compact',1),
  ('Volkswagen','Golf','골프','sedan',2),
  ('Volkswagen','Jetta','제타','sedan',3),
  ('Volkswagen','Passat','파사트','sedan',4),
  ('Volkswagen','Arteon','아테온','large-sedan',5),
  ('Volkswagen','T-Roc','티록','suv-rv',6),
  ('Volkswagen','Tiguan','티구안','suv-rv',7),
  ('Volkswagen','Touareg','투아렉','suv-rv',8),
  ('Volkswagen','ID.4','ID.4','suv-rv',9),
  -- ── Porsche ──
  ('Porsche','911','911','etc',1),
  ('Porsche','718 Boxster','718 박스터','etc',2),
  ('Porsche','718 Cayman','718 카이맨','etc',3),
  ('Porsche','Panamera','파나메라','large-sedan',4),
  ('Porsche','Macan','마칸','suv-rv',5),
  ('Porsche','Cayenne','카이엔','suv-rv',6),
  ('Porsche','Taycan','타이칸','sedan',7),
  -- ── Tesla ──
  ('Tesla','Model 3','모델 3','sedan',1),
  ('Tesla','Model Y','모델 Y','suv-rv',2),
  ('Tesla','Model S','모델 S','large-sedan',3),
  ('Tesla','Model X','모델 X','suv-rv',4),
  -- ── Toyota ──
  ('Toyota','Corolla','코롤라','sedan',1),
  ('Toyota','Camry','캠리','sedan',2),
  ('Toyota','Avalon','아발론','large-sedan',3),
  ('Toyota','Prius','프리우스','sedan',4),
  ('Toyota','RAV4','라브4','suv-rv',5),
  ('Toyota','Highlander','하이랜더','suv-rv',6),
  ('Toyota','Sienna','시에나','van-truck',7),
  ('Toyota','Land Cruiser','랜드크루저','suv-rv',8),
  ('Toyota','Supra','수프라','etc',9),
  -- ── Lexus ──
  ('Lexus','IS','IS','sedan',1),
  ('Lexus','ES','ES','sedan',2),
  ('Lexus','GS','GS','sedan',3),
  ('Lexus','LS','LS','large-sedan',4),
  ('Lexus','UX','UX','suv-rv',5),
  ('Lexus','NX','NX','suv-rv',6),
  ('Lexus','RX','RX','suv-rv',7),
  ('Lexus','GX','GX','suv-rv',8),
  ('Lexus','LX','LX','suv-rv',9),
  ('Lexus','RC','RC','etc',10),
  ('Lexus','LC','LC','etc',11),
  -- ── Honda ──
  ('Honda','Civic','시빅','sedan',1),
  ('Honda','Accord','어코드','sedan',2),
  ('Honda','CR-V','CR-V','suv-rv',3),
  ('Honda','HR-V','HR-V','suv-rv',4),
  ('Honda','Pilot','파일럿','suv-rv',5),
  ('Honda','Odyssey','오딧세이','van-truck',6),
  -- ── Nissan ──
  ('Nissan','Altima','알티마','sedan',1),
  ('Nissan','Maxima','맥시마','large-sedan',2),
  ('Nissan','Sentra','센트라','sedan',3),
  ('Nissan','Rogue','로그','suv-rv',4),
  ('Nissan','Murano','무라노','suv-rv',5),
  ('Nissan','Pathfinder','패스파인더','suv-rv',6),
  ('Nissan','GT-R','GT-R','etc',7),
  -- ── Ford ──
  ('Ford','Mustang','머스탱','etc',1),
  ('Ford','Focus','포커스','sedan',2),
  ('Ford','Taurus','토러스','large-sedan',3),
  ('Ford','Escape','이스케이프','suv-rv',4),
  ('Ford','Explorer','익스플로러','suv-rv',5),
  ('Ford','Bronco','브롱코','suv-rv',6),
  ('Ford','F-150','F-150','van-truck',7),
  ('Ford','Ranger','레인저','van-truck',8);

-- 3-1) 없는 모델만 삽입 (categoryId 포함). cat_slug 오타 시 categoryId 만 NULL (행은 유지)
INSERT INTO car_models (id, "makeId", name, "nameKo", "categoryId", "displayOrder", "createdAt", "updatedAt")
SELECT gen_random_uuid(), mk.id, s.name, s.name_ko, cat.id, s.ord, now(), now()
FROM _model_seed s
JOIN makes mk ON mk.name = s.make_name
LEFT JOIN categories cat ON cat.slug = s.cat_slug
WHERE NOT EXISTS (
  SELECT 1 FROM car_models cm WHERE cm."makeId" = mk.id AND cm.name = s.name
);

-- 3-2) 이미 있던 모델(categoryId 가 비어 있던 행)만 보정. 관리자가 수동 지정한 값은 건드리지 않음
UPDATE car_models cm
SET "categoryId" = cat.id, "updatedAt" = now()
FROM _model_seed s
JOIN makes mk ON mk.name = s.make_name
JOIN categories cat ON cat.slug = s.cat_slug
WHERE cm."makeId" = mk.id
  AND cm.name = s.name
  AND cm."categoryId" IS NULL;

DROP TABLE _model_seed;

-- ───────────────────────────── 4) 옵션 (option_items, 카테고리 없는 평면 리스트) ─────────────────────────────
-- 옵션 항목 (요청 16개 — name/nameKo 모두 한글)
INSERT INTO option_items (id, name, "nameKo", "displayOrder")
SELECT gen_random_uuid(), v.name, v.name, v.ord
FROM (VALUES
  ('차선이탈경보시스템',          1),
  ('어라운드뷰',                2),
  ('오토파킹',                  3),
  ('스마트키',                  4),
  ('크루즈컨트롤',               5),
  ('전자식주차브레이크(EPB)',      6),
  ('오토홀드',                  7),
  ('전동시트',                  8),
  ('메모리시트',                9),
  ('파워트렁크',                10),
  ('4WD',                     11),
  ('내비게이션',                12),
  ('헤드업디스플레이(HUD)',        13),
  ('알루미늄휠',                14),
  ('가죽시트',                  15),
  ('썬루프',                    16)
) AS v(name, ord)
WHERE NOT EXISTS (
  SELECT 1 FROM option_items oi WHERE oi.name = v.name
);
