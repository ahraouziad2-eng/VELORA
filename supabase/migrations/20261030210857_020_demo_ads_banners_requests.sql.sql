/*
# Demo equipment, services, banners, requests, favorites and notifications

1. Plain-English summary
- Adds 8 equipment rental ads (tractor, harvester, pump, plow, seeder, trailer, sprayer, baler) with brand, model, daily rate, condition, driver option, and provider.
- Adds 8 agricultural service ads with approximate price, years of experience, rating, and review count.
- Adds 3 to 4 gallery photos per ad.
- Adds 4 home-page slider banners with Arabic titles and internal links.
- Adds 5 sample requests in pending, accepted, and rejected states, linked to demo lands.
- Adds 4 favorites and 5 notifications for the sample account.

2. Modified tables
- advertisements, advertisement_images, banners, rental_requests, partnership_requests, favorites, notifications: sample rows only, flagged is_demo = true.

3. Security
- No policies or grants are changed by this migration.

4. Notes
- Every sample row is removed by purge_demo_data().
- Sample requests, favorites, and notifications belong to a sample account and appear only for that account.
*/

INSERT INTO advertisements (id, poster_id, title, description, category, price, price_unit, brand, model, item_condition, with_driver, years_experience, rating_avg, rating_count, views_count, wilaya, contact_info, image_url, status, is_demo, created_at, updated_at)
SELECT
  ('ad000000-0000-4000-8000-0000000000' || lpad(v.n::text, 2, '0'))::uuid,
  ('5e000000-0000-4000-8000-0000000000' || lpad(v.p::text, 2, '0'))::uuid,
  v.title, v.description, v.category, v.price, v.price_unit, v.brand, v.model, v.cond, v.driver,
  v.years, v.rating, COALESCE(v.rcount, 0), v.views, pr.wilaya, pr.phone, '', 'PUBLISHED', true,
  now() - make_interval(days => v.days), now() - make_interval(days => v.days)
FROM (VALUES
  (1, 1, 'جرار John Deere 5075E للكراء بسطيف', 'جرار بقوة 75 حصاناً بحالة ممتازة، مجهز بمحراث وآلة حرث ثقيلة. يُكرى باليوم مع تسليم وإرجاع في موقع المزرعة.', 'EQUIPMENT', 12000, 'لليوم', 'John Deere', '5075E', 'ممتازة', false, NULL::int, NULL::numeric, NULL::int, 310, 6),
  (2, 2, 'حصادة New Holland للكراء مع السائق', 'حصادة قمح بحالة جيدة، تأتي مع سائق خبير بالحصاد لعدة مواسم. مناسبة للمساحات الكبيرة من الحبوب.', 'EQUIPMENT', 35000, 'لليوم', 'New Holland', 'TC5.90', 'جيدة', true, NULL::int, NULL::numeric, NULL::int, 205, 9),
  (3, 4, 'مضخة مياه Pedrollo للري بالتقطير', 'مضخة مياه قوية لري البساتين والبيوت البلاستيكية، تعمل بالكهرباء وبأنبوب تغذية بقطر 2 بوصة. تُكرى مع دليل تركيب مبسط.', 'EQUIPMENT', 1500, 'لليوم', 'Pedrollo', 'PKm 60', 'ممتازة', false, NULL::int, NULL::numeric, NULL::int, 148, 4),
  (4, 8, 'محراث قرصي Kuhn للكراء', 'محراث قرصي بثلاثة أقراص، مناسب للتربة الثقيلة والحرث العميق. يُكرى باليوم ويحتاج جراراً بقوة 90 حصاناً على الأقل.', 'EQUIPMENT', 6000, 'لليوم', 'Kuhn', 'Optimer 3', 'جيدة', false, NULL::int, NULL::numeric, NULL::int, 97, 12),
  (5, 3, 'آلة بذر Amazone للحبوب', 'آلة بذر دقيقة للقمح والشعير بعرض 3 أمتار، مع ضبط كمية البذور حسب الحقل. تُكرى باليوم بحالة جيدة جداً.', 'EQUIPMENT', 4000, 'لليوم', 'Amazone', 'Cataya 3000', 'جيدة', false, NULL::int, NULL::numeric, NULL::int, 133, 8),
  (6, 5, 'مقطورة زراعية 8 طن للكراء', 'مقطورة قوية بقاع معدني ومفرغ جانبي، مناسبة لنقل الحبوب والأعلاف والبطاطا. تُكرى باليوم مع ربط بالجرار.', 'EQUIPMENT', 3000, 'لليوم', 'Fliegl', 'DPW 180', 'جيدة', false, NULL::int, NULL::numeric, NULL::int, 118, 15),
  (7, 6, 'رشاش ظهري كهربائي للمبيدات', 'رشاش بخزان 20 لتراً وبطارية تكفي ليوم عمل كامل، مناسب للبساتين والخضروات. يُكرى مع كمامة وقفازات.', 'EQUIPMENT', 800, 'لليوم', 'Solo', '425', 'ممتازة', false, NULL::int, NULL::numeric, NULL::int, 84, 5),
  (8, 7, 'آلة حزم Claas Markant للتبن', 'آلة حزم مربعة لتجميع التبن والبرسيم، بحالة ممتازة وتُكرى مع سائقها. مناسبة للمواسم الكبيرة.', 'EQUIPMENT', 25000, 'لليوم', 'Claas', 'Markant 55', 'ممتازة', true, NULL::int, NULL::numeric, NULL::int, 169, 7),
  (9, 1, 'حرث الأراضي بالجرار', 'خدمة حرث بالجرار والمحراث لجميع أنواع التربة في سطيف والهضاب، مع تسوية الأرض قبل البذر. السعر تقريبي ويختلف حسب طبيعة الحقل.', 'SERVICES', 2500, 'للهكتار', NULL, NULL, NULL, NULL, 9, 4.7, 38, 180, 2),
  (10, 5, 'ري وصيانة شبكات السقي', 'تركيب وصيانة شبكات الري بالتقطير والرش، مع فحص المضخات وتغيير القطع المعطلة. نعمل بالمنطقة منذ سنوات ونقدم استشارة مجانية.', 'SERVICES', 3000, 'للزيارة', NULL, NULL, NULL, NULL, 12, 4.8, 54, 240, 5),
  (11, 3, 'حصاد القمح بالحصادة', 'خدمة حصاد بحصادة حديثة للقمح والشعير، مع نقل الحبوب إلى المخزن. الأسعار تقريبية حسب المساحة وبُعد الحقل.', 'SERVICES', 4500, 'للهكتار', NULL, NULL, NULL, NULL, 7, 4.6, 71, 150, 7),
  (12, 2, 'استشارة فلاحية في الزراعة والتسميد', 'استشارة في اختيار البذور والتسميد والمعالجة، مع زيارة للحقل وتحليل بسيط للتربة. مفيدة لأصحاب الأراضي الجدد.', 'SERVICES', 2000, 'للساعة', NULL, NULL, NULL, NULL, 15, 4.9, 26, 96, 3),
  (13, 7, 'تقليم أشجار الزيتون', 'تقليم علمي لأشجار الزيتون والمثمرة لتحسين الإنتاج، مع تنظيف البستان وجمع الأغصان. نعمل بفريق من أربعة عمال.', 'SERVICES', 300, 'للشجرة', NULL, NULL, NULL, NULL, 6, 4.5, 19, 120, 10),
  (14, 4, 'رش ومعالجة المزروعات', 'رش المبيدات والأسمدة الورقية بمعدات حديثة وبالجرعة الصحيحة، مع الالتزام بتعليمات السلامة. الخدمة تشمل البساتين والحقول.', 'SERVICES', 3500, 'للهكتار', NULL, NULL, NULL, NULL, 8, 4.4, 33, 110, 12),
  (15, 6, 'نقل المنتجات الفلاحية', 'نقل الخضروات والحبوب والتمور بشاحنات مبردة وغير مبردة من بجاية إلى الأسواق الكبرى. نضمن وصول المنتج في وقته.', 'SERVICES', 12000, 'للرحلة', NULL, NULL, NULL, NULL, 5, 4.3, 22, 75, 14),
  (16, 8, 'تركيب البيوت البلاستيكية', 'تركيب بيوت بلاستيكية متوسطة وكبيرة مع نظام الري والتهوية، ونقدم الضمان على الهيكل. نعمل في مستغانم والولايات المجاورة.', 'SERVICES', 450000, 'للبيت الواحد', NULL, NULL, NULL, NULL, 11, 4.8, 44, 60, 18)
) AS v(n, p, title, description, category, price, price_unit, brand, model, cond, driver, years, rating, rcount, views, days)
JOIN profiles pr ON pr.id = ('5e000000-0000-4000-8000-0000000000' || lpad(v.p::text, 2, '0'))::uuid;

INSERT INTO advertisement_images (advertisement_id, image_url, is_primary, is_demo)
SELECT
  ('ad000000-0000-4000-8000-0000000000' || lpad(v.n::text, 2, '0'))::uuid,
  'https://images.pexels.com/photos/' || v.p || '/pexels-photo-' || v.p || '.jpeg?auto=compress&cs=tinysrgb&w=' || (CASE WHEN v.k = 1 THEN 800 ELSE 1400 END),
  v.k = 1,
  true
FROM (VALUES
  (1,34632627,1),(1,37634578,2),(1,8586455,3),
  (2,27054126,1),(2,27037415,2),(2,14976214,3),(2,18431220,4),
  (3,28240873,1),(3,34935520,2),(3,36797458,3),
  (4,37314899,1),(4,37311051,2),(4,25945067,3),
  (5,16407472,1),(5,7457180,2),(5,37386690,3),
  (6,26730197,1),(6,30248663,2),(6,8019123,3),
  (7,33881124,1),(7,34182297,2),(7,17765487,3),
  (8,32184712,1),(8,8073972,2),(8,34948665,3),
  (9,37634578,1),(9,37311051,2),(9,7457180,3),
  (10,14973439,1),(10,14783299,2),(10,35093531,3),
  (11,14502034,1),(11,17468843,2),(11,33031012,3),
  (12,11053137,1),(12,34965367,2),(12,11688197,3),
  (13,39108345,1),(13,38907686,2),(13,31667164,3),
  (14,27624218,1),(14,12532707,2),(14,20075896,3),
  (15,35291292,1),(15,10745250,2),(15,33339087,3),
  (16,96392,1),(16,36213916,2),(16,16678083,3)
) AS v(n, p, k);

UPDATE advertisements a
SET image_url = (SELECT ai.image_url FROM advertisement_images ai WHERE ai.advertisement_id = a.id AND ai.is_primary LIMIT 1)
WHERE a.is_demo = true AND a.image_url = '';

INSERT INTO banners (title, subtitle, image_url, link_url, display_order, is_active, is_demo)
VALUES
  ('أضف إعلانك مجاناً', 'وصّل منتجاتك وخدماتك إلى آلاف الفلاحين في كل الولايات', '/images/banner-services.webp', '/ads', 1, true, true),
  ('استأجر معدات فلاحية بسهولة', 'جرارات وحصادات ومضخات بأسعار يومية واضحة', '/images/banner-equipment.webp', '/ads', 2, true, true),
  ('ابحث عن شريك فلاحي', 'شراكات في الحبوب والزيتون والبيوت البلاستيكية', '/images/banner-partnership.webp', '/explore', 3, true, true),
  ('اكتشف أراضي جديدة', 'أراضي للبيع والكراء والشراكة مع صور وخرائط', '/images/banner-lands.webp', '/explore', 4, true, true);

INSERT INTO rental_requests (land_id, requester_id, proposed_terms, duration_months, budget, notes, status, is_demo, created_at, updated_at)
VALUES
  ('a1000000-0000-4000-8000-000000000006', '5e000000-0000-4000-8000-000000000008', 'كراء سنوي مع دفع نصف المبلغ مسبقاً', 12, 420000, 'أرغب في زراعة النخيل وتجديد الري بالتقطير.', 'PENDING', true, now() - interval '2 days', now() - interval '2 days'),
  ('a1000000-0000-4000-8000-000000000007', '5e000000-0000-4000-8000-000000000008', 'كراء موسمي لزراعة القمح الصلب', 24, 1800000, 'لدي خبرة سابقة في زراعة الحبوب بالري المحوري.', 'ACCEPTED', true, now() - interval '9 days', now() - interval '5 days'),
  ('a1000000-0000-4000-8000-000000000009', '5e000000-0000-4000-8000-000000000008', 'كراء لموسم واحد مع حق التجديد', 12, 3750000, 'أريد تجربة زراعة البقوليات على مساحة كبيرة.', 'REJECTED', true, now() - interval '14 days', now() - interval '10 days');

INSERT INTO partnership_requests (land_id, requester_id, proposed_terms, duration_months, notes, status, is_demo, created_at, updated_at)
VALUES
  ('a1000000-0000-4000-8000-000000000010', '5e000000-0000-4000-8000-000000000008', 'مساهمة في البذور والأسمدة مقابل 50% من المحصول', 12, 'جاهزة للبدء مع بداية الموسم المقبل.', 'PENDING', true, now() - interval '3 days', now() - interval '3 days'),
  ('a1000000-0000-4000-8000-000000000011', '5e000000-0000-4000-8000-000000000008', 'تمويل الغراس والري مقابل 40% من الإنتاج', 36, 'لدي خبرة في غرس الزيتون وصيانة الري.', 'ACCEPTED', true, now() - interval '20 days', now() - interval '12 days');

INSERT INTO favorites (user_id, land_id, is_demo, created_at)
VALUES
  ('5e000000-0000-4000-8000-000000000008', 'a1000000-0000-4000-8000-000000000001', true, now() - interval '4 days'),
  ('5e000000-0000-4000-8000-000000000008', 'a1000000-0000-4000-8000-000000000004', true, now() - interval '8 days'),
  ('5e000000-0000-4000-8000-000000000008', 'a1000000-0000-4000-8000-000000000008', true, now() - interval '15 days'),
  ('5e000000-0000-4000-8000-000000000008', 'a1000000-0000-4000-8000-000000000013', true, now() - interval '21 days');

INSERT INTO notifications (user_id, type, title, body, is_read, is_demo, created_at)
VALUES
  ('5e000000-0000-4000-8000-000000000008', 'REQUEST_UPDATE', 'تم قبول طلب الكراء', 'وافق المالك على طلبك لكراء أرض مسقية 12 هكتاراً بتيارت.', false, true, now() - interval '1 day'),
  ('5e000000-0000-4000-8000-000000000008', 'REQUEST_UPDATE', 'تم رفض طلب الكراء', 'للأسف لم يُقبل طلبك لكراء أرض شاسعة بمستغانم هذه المرة.', true, true, now() - interval '10 days'),
  ('5e000000-0000-4000-8000-000000000008', 'NEW_MESSAGE', 'رسالة جديدة من مالك الأرض', 'أرسل لك مالك بستان الزيتون بجيجل سؤالاً حول موعد المعاينة.', false, true, now() - interval '2 days'),
  ('5e000000-0000-4000-8000-000000000008', 'LAND_APPROVED', 'تم نشر الأرض بنجاح', 'تمت مراجعة وثائق أرضك وأصبحت ظاهرة للزوار.', true, true, now() - interval '6 days'),
  ('5e000000-0000-4000-8000-000000000008', 'welcome', 'مرحباً بك في VELORA', 'ابدأ بتصفح الأراضي والمعدات والخدمات الفلاحية القريبة منك.', true, true, now() - interval '30 days');
