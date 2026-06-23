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
INSERT INTO car_models (id, "makeId", name, "nameKo", "displayOrder", "createdAt", "updatedAt")
SELECT gen_random_uuid(), mk.id, v.name, v.name_ko, v.ord, now(), now()
FROM (VALUES
  -- ── 현대 (Hyundai) ──
  ('Hyundai','Grandeur','그랜저',1),
  ('Hyundai','Sonata','쏘나타',2),
  ('Hyundai','Avante','아반떼',3),
  ('Hyundai','i30','i30',4),
  ('Hyundai','Veloster','벨로스터',5),
  ('Hyundai','Accent','엑센트',6),
  ('Hyundai','Santa Fe','싼타페',7),
  ('Hyundai','Tucson','투싼',8),
  ('Hyundai','Palisade','팰리세이드',9),
  ('Hyundai','Kona','코나',10),
  ('Hyundai','Venue','베뉴',11),
  ('Hyundai','Casper','캐스퍼',12),
  ('Hyundai','Ioniq 5','아이오닉 5',13),
  ('Hyundai','Ioniq 6','아이오닉 6',14),
  ('Hyundai','Nexo','넥쏘',15),
  ('Hyundai','Staria','스타리아',16),
  ('Hyundai','Starex','스타렉스',17),
  ('Hyundai','Porter','포터',18),
  -- ── 기아 (Kia) ──
  ('Kia','Morning','모닝',1),
  ('Kia','Ray','레이',2),
  ('Kia','K3','K3',3),
  ('Kia','K5','K5',4),
  ('Kia','K7','K7',5),
  ('Kia','K8','K8',6),
  ('Kia','K9','K9',7),
  ('Kia','Stinger','스팅어',8),
  ('Kia','Stonic','스토닉',9),
  ('Kia','Seltos','셀토스',10),
  ('Kia','Sportage','스포티지',11),
  ('Kia','Sorento','쏘렌토',12),
  ('Kia','Mohave','모하비',13),
  ('Kia','Niro','니로',14),
  ('Kia','Soul','쏘울',15),
  ('Kia','EV6','EV6',16),
  ('Kia','EV9','EV9',17),
  ('Kia','Carnival','카니발',18),
  ('Kia','Bongo','봉고',19),
  -- ── 제네시스 (Genesis) ──
  ('Genesis','G70','G70',1),
  ('Genesis','G80','G80',2),
  ('Genesis','G90','G90',3),
  ('Genesis','GV60','GV60',4),
  ('Genesis','GV70','GV70',5),
  ('Genesis','GV80','GV80',6),
  ('Genesis','EQ900','EQ900',7),
  -- ── 쉐보레 (Chevrolet) ──
  ('Chevrolet','Spark','스파크',1),
  ('Chevrolet','Aveo','아베오',2),
  ('Chevrolet','Cruze','크루즈',3),
  ('Chevrolet','Malibu','말리부',4),
  ('Chevrolet','Impala','임팔라',5),
  ('Chevrolet','Trax','트랙스',6),
  ('Chevrolet','Trailblazer','트레일블레이저',7),
  ('Chevrolet','Equinox','이쿼녹스',8),
  ('Chevrolet','Captiva','캡티바',9),
  ('Chevrolet','Traverse','트래버스',10),
  ('Chevrolet','Orlando','올란도',11),
  ('Chevrolet','Colorado','콜로라도',12),
  ('Chevrolet','Camaro','카마로',13),
  ('Chevrolet','Bolt','볼트',14),
  -- ── 르노코리아 (Renault Korea) ──
  ('Renault Korea','SM3','SM3',1),
  ('Renault Korea','SM5','SM5',2),
  ('Renault Korea','SM6','SM6',3),
  ('Renault Korea','SM7','SM7',4),
  ('Renault Korea','QM3','QM3',5),
  ('Renault Korea','QM5','QM5',6),
  ('Renault Korea','QM6','QM6',7),
  ('Renault Korea','XM3','XM3',8),
  ('Renault Korea','Grand Koleos','그랑콜레오스',9),
  ('Renault Korea','Master','마스터',10),
  ('Renault Korea','Twizy','트위지',11),
  -- ── KG모빌리티 (KG Mobility) ──
  ('KG Mobility','Tivoli','티볼리',1),
  ('KG Mobility','Korando','코란도',2),
  ('KG Mobility','Korando Sports','코란도 스포츠',3),
  ('KG Mobility','Rexton','렉스턴',4),
  ('KG Mobility','Rexton Sports','렉스턴 스포츠',5),
  ('KG Mobility','Torres','토레스',6),
  ('KG Mobility','Torres EVX','토레스 EVX',7),
  ('KG Mobility','Musso','무쏘',8),
  ('KG Mobility','Actyon','액티언',9),
  ('KG Mobility','Rodius','로디우스',10),
  ('KG Mobility','Chairman','체어맨',11),
  -- ── BMW ──
  ('BMW','1 Series','1시리즈',1),
  ('BMW','2 Series','2시리즈',2),
  ('BMW','3 Series','3시리즈',3),
  ('BMW','4 Series','4시리즈',4),
  ('BMW','5 Series','5시리즈',5),
  ('BMW','6 Series','6시리즈',6),
  ('BMW','7 Series','7시리즈',7),
  ('BMW','8 Series','8시리즈',8),
  ('BMW','X1','X1',9),
  ('BMW','X3','X3',10),
  ('BMW','X4','X4',11),
  ('BMW','X5','X5',12),
  ('BMW','X6','X6',13),
  ('BMW','X7','X7',14),
  ('BMW','Z4','Z4',15),
  ('BMW','i4','i4',16),
  ('BMW','iX','iX',17),
  -- ── Mercedes-Benz ──
  ('Mercedes-Benz','A-Class','A클래스',1),
  ('Mercedes-Benz','C-Class','C클래스',2),
  ('Mercedes-Benz','E-Class','E클래스',3),
  ('Mercedes-Benz','S-Class','S클래스',4),
  ('Mercedes-Benz','CLA','CLA',5),
  ('Mercedes-Benz','CLS','CLS',6),
  ('Mercedes-Benz','GLA','GLA',7),
  ('Mercedes-Benz','GLB','GLB',8),
  ('Mercedes-Benz','GLC','GLC',9),
  ('Mercedes-Benz','GLE','GLE',10),
  ('Mercedes-Benz','GLS','GLS',11),
  ('Mercedes-Benz','G-Class','G클래스',12),
  ('Mercedes-Benz','EQE','EQE',13),
  ('Mercedes-Benz','EQS','EQS',14),
  ('Mercedes-Benz','V-Class','V클래스',15),
  -- ── Audi ──
  ('Audi','A3','A3',1),
  ('Audi','A4','A4',2),
  ('Audi','A5','A5',3),
  ('Audi','A6','A6',4),
  ('Audi','A7','A7',5),
  ('Audi','A8','A8',6),
  ('Audi','Q3','Q3',7),
  ('Audi','Q5','Q5',8),
  ('Audi','Q7','Q7',9),
  ('Audi','Q8','Q8',10),
  ('Audi','e-tron','e-트론',11),
  ('Audi','TT','TT',12),
  ('Audi','R8','R8',13),
  -- ── Volkswagen ──
  ('Volkswagen','Polo','폴로',1),
  ('Volkswagen','Golf','골프',2),
  ('Volkswagen','Jetta','제타',3),
  ('Volkswagen','Passat','파사트',4),
  ('Volkswagen','Arteon','아테온',5),
  ('Volkswagen','T-Roc','티록',6),
  ('Volkswagen','Tiguan','티구안',7),
  ('Volkswagen','Touareg','투아렉',8),
  ('Volkswagen','ID.4','ID.4',9),
  -- ── Porsche ──
  ('Porsche','911','911',1),
  ('Porsche','718 Boxster','718 박스터',2),
  ('Porsche','718 Cayman','718 카이맨',3),
  ('Porsche','Panamera','파나메라',4),
  ('Porsche','Macan','마칸',5),
  ('Porsche','Cayenne','카이엔',6),
  ('Porsche','Taycan','타이칸',7),
  -- ── Tesla ──
  ('Tesla','Model 3','모델 3',1),
  ('Tesla','Model Y','모델 Y',2),
  ('Tesla','Model S','모델 S',3),
  ('Tesla','Model X','모델 X',4),
  -- ── Toyota ──
  ('Toyota','Corolla','코롤라',1),
  ('Toyota','Camry','캠리',2),
  ('Toyota','Avalon','아발론',3),
  ('Toyota','Prius','프리우스',4),
  ('Toyota','RAV4','라브4',5),
  ('Toyota','Highlander','하이랜더',6),
  ('Toyota','Sienna','시에나',7),
  ('Toyota','Land Cruiser','랜드크루저',8),
  ('Toyota','Supra','수프라',9),
  -- ── Lexus ──
  ('Lexus','IS','IS',1),
  ('Lexus','ES','ES',2),
  ('Lexus','GS','GS',3),
  ('Lexus','LS','LS',4),
  ('Lexus','UX','UX',5),
  ('Lexus','NX','NX',6),
  ('Lexus','RX','RX',7),
  ('Lexus','GX','GX',8),
  ('Lexus','LX','LX',9),
  ('Lexus','RC','RC',10),
  ('Lexus','LC','LC',11),
  -- ── Honda ──
  ('Honda','Civic','시빅',1),
  ('Honda','Accord','어코드',2),
  ('Honda','CR-V','CR-V',3),
  ('Honda','HR-V','HR-V',4),
  ('Honda','Pilot','파일럿',5),
  ('Honda','Odyssey','오딧세이',6),
  -- ── Nissan ──
  ('Nissan','Altima','알티마',1),
  ('Nissan','Maxima','맥시마',2),
  ('Nissan','Sentra','센트라',3),
  ('Nissan','Rogue','로그',4),
  ('Nissan','Murano','무라노',5),
  ('Nissan','Pathfinder','패스파인더',6),
  ('Nissan','GT-R','GT-R',7),
  -- ── Ford ──
  ('Ford','Mustang','머스탱',1),
  ('Ford','Focus','포커스',2),
  ('Ford','Taurus','토러스',3),
  ('Ford','Escape','이스케이프',4),
  ('Ford','Explorer','익스플로러',5),
  ('Ford','Bronco','브롱코',6),
  ('Ford','F-150','F-150',7),
  ('Ford','Ranger','레인저',8)
) AS v(make_name, name, name_ko, ord)
JOIN makes mk ON mk.name = v.make_name
WHERE NOT EXISTS (
  SELECT 1 FROM car_models cm WHERE cm."makeId" = mk.id AND cm.name = v.name
);

-- ───────────────────────────── 4) 옵션 (option_categories / option_items) ─────────────────────────────
-- 4-1) 옵션 카테고리
INSERT INTO option_categories (id, name, slug, "displayOrder") VALUES
  (gen_random_uuid(), '안전', 'safety', 1),
  (gen_random_uuid(), '편의', 'convenience', 2),
  (gen_random_uuid(), '멀티미디어', 'multimedia', 3),
  (gen_random_uuid(), '내·외장', 'interior-exterior', 4)
ON CONFLICT (slug) DO NOTHING;

-- 4-2) 옵션 항목 (요청 16개 — name/nameKo 모두 한글)
INSERT INTO option_items (id, "categoryId", name, "nameKo", "displayOrder")
SELECT gen_random_uuid(), c.id, v.name, v.name, v.ord
FROM (VALUES
  -- 안전
  ('safety',            '차선이탈경보시스템',          1),
  ('safety',            '어라운드뷰',                2),
  ('safety',            '오토파킹',                  3),
  -- 편의
  ('convenience',       '스마트키',                  1),
  ('convenience',       '크루즈컨트롤',               2),
  ('convenience',       '전자식주차브레이크(EPB)',      3),
  ('convenience',       '오토홀드',                  4),
  ('convenience',       '전동시트',                  5),
  ('convenience',       '메모리시트',                6),
  ('convenience',       '파워트렁크',                7),
  ('convenience',       '4WD',                     8),
  -- 멀티미디어
  ('multimedia',        '내비게이션',                1),
  ('multimedia',        '헤드업디스플레이(HUD)',        2),
  -- 내·외장
  ('interior-exterior', '알루미늄휠',                1),
  ('interior-exterior', '가죽시트',                  2),
  ('interior-exterior', '썬루프',                    3)
) AS v(cat_slug, name, ord)
JOIN option_categories c ON c.slug = v.cat_slug
WHERE NOT EXISTS (
  SELECT 1 FROM option_items oi
  WHERE oi."categoryId" = c.id AND oi.name = v.name
);
