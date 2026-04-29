-- =============================================================
-- GhorerBazar -- FULL RESET + SETUP
-- WARNING: Drops everything and rebuilds from scratch.
-- Run in Supabase SQL Editor on a new or existing project.
-- =============================================================


-- =============================================================
-- STEP 1: DROP EVERYTHING
-- =============================================================

DROP FUNCTION IF EXISTS phone_exists(text) CASCADE;
DROP FUNCTION IF EXISTS get_email_by_phone(text) CASCADE;
DROP FUNCTION IF EXISTS create_profile(uuid, text, text, text) CASCADE;

DROP TABLE IF EXISTS wishlists        CASCADE;
DROP TABLE IF EXISTS orders           CASCADE;
DROP TABLE IF EXISTS profiles         CASCADE;
DROP TABLE IF EXISTS products         CASCADE;
DROP TABLE IF EXISTS categories       CASCADE;
DROP TABLE IF EXISTS brands           CASCADE;
DROP TABLE IF EXISTS site_settings    CASCADE;
DROP TABLE IF EXISTS contact_messages CASCADE;


-- =============================================================
-- STEP 2: SCHEMA + RLS + GRANTS + RPCs
-- =============================================================
-- =============================================================
-- GhorerBazar — Complete Supabase Setup
-- Run this once in Supabase SQL Editor to set up a fresh project
-- =============================================================
-- After running this file:
--   1. Create an admin user in Supabase Auth Dashboard
--      Email: admin@ghorerbazar.com
--      Copy the UUID → replace ADMIN_USER_ID below
--   2. Update site_settings rows (bkash_number, nagad_number, etc.)
--   3. Enable Email OTP in Supabase Auth settings
-- =============================================================

-- =============================================================
-- 1. EXTENSIONS
-- =============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- =============================================================
-- 2. TABLES
-- =============================================================

-- Products
CREATE TABLE IF NOT EXISTS products (
  id                uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  product_name      text        NOT NULL,
  slug              text        NOT NULL UNIQUE,
  item_category     text,
  item_category2    text,
  item_brand        text,
  original_price    numeric(10,2) NOT NULL DEFAULT 0,
  discount_price    numeric(10,2),
  product_flag      text,
  product_flags     text[]      DEFAULT '{}',
  image_url         text,
  image_url_02      text,
  image_url_03      text,
  product_images    text[]      DEFAULT '{}',
  short_description text,
  description       text,
  is_active         boolean     NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  name       text        NOT NULL UNIQUE,
  slug       text,
  image_url  text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Brands
CREATE TABLE IF NOT EXISTS brands (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  name        text        NOT NULL UNIQUE,
  slug        text,
  image_url   text,
  description text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Profiles (mirrors auth.users metadata for persistence)
CREATE TABLE IF NOT EXISTS profiles (
  id         uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name       text,
  phone      text,
  email      text,
  avatar     text,
  district   text,
  upazilla   text,
  address    text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  order_number   text        NOT NULL,
  name           text        NOT NULL,
  phone          text        NOT NULL,
  district       text        NOT NULL,
  thana          text,
  address        text        NOT NULL,
  notes          text,
  items          jsonb       NOT NULL DEFAULT '[]',
  subtotal       numeric(10,2) NOT NULL DEFAULT 0,
  discount       numeric(10,2) NOT NULL DEFAULT 0,
  delivery_fee   numeric(10,2) NOT NULL DEFAULT 0,
  total          numeric(10,2) NOT NULL DEFAULT 0,
  payment_type   text        NOT NULL DEFAULT 'cod',
  payment_method text,
  txn_id         text,
  txn_phone      text,
  status         text        NOT NULL DEFAULT 'pending',
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- Wishlists
CREATE TABLE IF NOT EXISTS wishlists (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_slug text        NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_slug)
);

-- Site Settings (key-value store for admin-configurable values)
CREATE TABLE IF NOT EXISTS site_settings (
  key        text        PRIMARY KEY,
  value      text        NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed default site settings
INSERT INTO site_settings (key, value) VALUES
  ('announcement',     'Free delivery on orders above 1000 BDT | 100% Authentic Products'),
  ('announcement_on',  'true'),
  ('threshold',        '1000'),
  ('discount_amount',  '0'),
  ('phone',            '09642922922'),
  ('whatsapp',         '8809642922922'),
  ('email',            'support@ghorerbazar.com'),
  ('address',          'Dhaka, Bangladesh'),
  ('bkash_number',     '01XXXXXXXXX'),
  ('nagad_number',     '01XXXXXXXXX')
ON CONFLICT (key) DO NOTHING;

-- Contact Messages (stores contact form submissions)
CREATE TABLE IF NOT EXISTS contact_messages (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  name       text        NOT NULL,
  email      text        NOT NULL,
  phone      text,
  message    text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);


-- =============================================================
-- 3. ROW LEVEL SECURITY
-- =============================================================

ALTER TABLE products     ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories   ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands       ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders       ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists         ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages  ENABLE ROW LEVEL SECURITY;

-- Products: public read, authenticated write
CREATE POLICY "Public read products"
  ON products FOR SELECT USING (true);

CREATE POLICY "Auth insert products"
  ON products FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Auth update products"
  ON products FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Auth delete products"
  ON products FOR DELETE USING (auth.role() = 'authenticated');

-- Categories: public read, authenticated write
CREATE POLICY "Public read categories"
  ON categories FOR SELECT USING (true);

CREATE POLICY "Auth write categories"
  ON categories FOR ALL USING (auth.role() = 'authenticated');

-- Brands: public read, authenticated write
CREATE POLICY "Public read brands"
  ON brands FOR SELECT USING (true);

CREATE POLICY "Auth write brands"
  ON brands FOR ALL USING (auth.role() = 'authenticated');

-- Profiles: users manage their own
CREATE POLICY "Users read own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Orders: anyone can insert (guest checkout), users see own, admin sees all
CREATE POLICY "Anyone insert orders"
  ON orders FOR INSERT WITH CHECK (true);

CREATE POLICY "Users read own orders"
  ON orders FOR SELECT
  USING (user_id = auth.uid());

-- Admin orders: admin panel uses supabaseAdmin (service_role key) which bypasses RLS entirely.
-- No separate authenticated-user update policy is needed — any such policy would allow
-- any logged-in customer to update any order's status, which is a security risk.

-- Wishlists: authenticated users manage their own
CREATE POLICY "Users manage own wishlist"
  ON wishlists FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Site settings: public read, service role write only
CREATE POLICY "Public read site_settings"
  ON site_settings FOR SELECT USING (true);

-- (Writes go through service role key which bypasses RLS — no write policy needed)

-- Contact messages: anyone can submit, only service role can read
CREATE POLICY "Anyone insert contact_messages"
  ON contact_messages FOR INSERT WITH CHECK (true);


-- =============================================================
-- 4. GRANTS
-- =============================================================

GRANT SELECT ON products, categories, brands, site_settings TO anon;
GRANT SELECT, INSERT ON orders TO anon;
GRANT INSERT ON contact_messages TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON wishlists, profiles TO authenticated;
GRANT ALL ON products, categories, brands, orders, profiles, wishlists, site_settings, contact_messages TO service_role;


-- =============================================================
-- 5. RPCs (Security Definer — run as DB owner, bypass RLS)
-- =============================================================

-- Check if a phone number is already registered
CREATE OR REPLACE FUNCTION phone_exists(p_phone text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE phone = p_phone
  );
$$;

-- Resolve phone number to email for login flow
CREATE OR REPLACE FUNCTION get_email_by_phone(p_phone text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM profiles WHERE phone = p_phone LIMIT 1;
$$;

-- Create profile row after signup (bypasses RLS so anon can insert)
CREATE OR REPLACE FUNCTION create_profile(
  p_id    uuid,
  p_name  text,
  p_phone text,
  p_email text
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO profiles (id, name, phone, email)
  VALUES (p_id, p_name, p_phone, p_email)
  ON CONFLICT (id) DO NOTHING;
$$;

-- Grant RPC execute rights
GRANT EXECUTE ON FUNCTION phone_exists(text)                           TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_email_by_phone(text)                     TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_profile(uuid, text, text, text)       TO anon, authenticated;


-- =============================================================
-- 6. INDEXES (performance)
-- =============================================================

CREATE INDEX IF NOT EXISTS idx_products_slug        ON products (slug);
CREATE INDEX IF NOT EXISTS idx_products_category    ON products (item_category);
CREATE INDEX IF NOT EXISTS idx_products_category2   ON products (item_category2);
CREATE INDEX IF NOT EXISTS idx_products_brand       ON products (item_brand);
CREATE INDEX IF NOT EXISTS idx_products_flag        ON products (product_flag);
CREATE INDEX IF NOT EXISTS idx_products_active      ON products (is_active);
CREATE INDEX IF NOT EXISTS idx_orders_user_id       ON orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status        ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at    ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id    ON wishlists (user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_phone       ON profiles (phone);
CREATE INDEX IF NOT EXISTS idx_contact_created_at   ON contact_messages (created_at DESC);


-- =============================================================
-- DONE
-- =============================================================
-- Next steps:
-- 1. Go to Supabase Auth → Users → Create user
--    Email: admin@ghorerbazar.com, set a strong password
-- 2. Copy that user's UUID
-- 3. Uncomment and run the admin orders policy above with the real UUID
-- 4. Update .env with your new project's VITE_SUPABASE_URL,
--    VITE_SUPABASE_ANON_KEY, and VITE_SUPABASE_SERVICE_ROLE_KEY
-- 5. In Auth settings: enable Email OTP (magic link / OTP)
-- =============================================================

-- =============================================================
-- STEP 3: SEED DATA -- Categories & Brands
-- =============================================================
-- Categories (9)
INSERT INTO categories (name, slug, image_url) VALUES
  ('Beverage', 'beverage', 'https://backoffice.ghorerbazar.com/category_images/AZG2N1774766442.png'),
  ('Dates', 'dates', 'https://backoffice.ghorerbazar.com/category_images/wgCR01774766402.png'),
  ('Flours & Lentils', 'flours-lentils', 'https://backoffice.ghorerbazar.com/category_images/Lo11M1774766468.png'),
  ('Functional Food', 'functional-food', 'https://backoffice.ghorerbazar.com/category_images/JxBh61774766494.png'),
  ('Honey', 'honey', 'https://backoffice.ghorerbazar.com/category_images/KbWCe1774766391.png'),
  ('Nuts & Seeds', 'nuts-seeds', 'https://backoffice.ghorerbazar.com/category_images/5u39t1774766425.png'),
  ('Oil & Ghee', 'oil-ghee', 'https://backoffice.ghorerbazar.com/category_images/Zf99g1774766372.png'),
  ('Rice', 'rice', 'https://backoffice.ghorerbazar.com/category_images/Emr6I1774766667.png'),
  ('Spices', 'spices', 'https://backoffice.ghorerbazar.com/category_images/hXyU71774766413.png')
ON CONFLICT (name) DO UPDATE SET slug = EXCLUDED.slug, image_url = EXCLUDED.image_url;

-- Brands (5)
INSERT INTO brands (name, slug, image_url, description) VALUES
  ('GhorerBazar', 'ghorerbazar', 'https://backoffice.ghorerbazar.com/brand_images/7hNKq1768887947.png', NULL),
  ('Glarvest', 'glarvest', 'https://backoffice.ghorerbazar.com/brand_images/RNTIU1763611802.png', NULL),
  ('Honeyraj', 'honeyraj', 'https://backoffice.ghorerbazar.com/brand_images/lCfRt1759553456.png', NULL),
  ('Khejuri', 'khejuri', 'https://backoffice.ghorerbazar.com/brand_images/8Gpl21757919440.png', NULL),
  ('Shosti food', 'shosti-food', 'https://backoffice.ghorerbazar.com/brand_images/8matO1757919401.png', NULL)
ON CONFLICT (name) DO UPDATE SET slug = EXCLUDED.slug, image_url = EXCLUDED.image_url, description = EXCLUDED.description;

-- =============================================================
-- STEP 4: SEED DATA -- 75 Products
-- =============================================================
-- 75 products
INSERT INTO products (
  slug, product_name, item_category, item_category2, item_brand,
  original_price, discount_price, product_flag, product_flags,
  image_url, image_url_02, image_url_03, product_images,
  short_description, description, is_active
) VALUES
  ('african-organic-wild-honey-250g', 'African Organic Wild Honey 250g', 'Honey', NULL, 'Honeyraj', 625, NULL, 'New Arrival', '{"New Arrival"}', 'https://backoffice.ghorerbazar.com/productImages/htkho1767418769.jpg', 'https://backoffice.ghorerbazar.com/productImages/1766992293j4Wyv.jpg', NULL, '{"https://backoffice.ghorerbazar.com/productImages/htkho1767418769.jpg","https://backoffice.ghorerbazar.com/productImages/1766992293j4Wyv.jpg"}', 'Discover the pure taste of Africa with Organic Wild Honey, harvested from the untouched wilderness where wild bees thrive on diverse native blossoms. Collected with care using traditional and sustainable beekeeping methods, this honey is 100% natural, unprocessed, and organic—preserving all of nature’s goodness.', 'Discover the pure taste of Africa with Organic Wild Honey, harvested from the untouched wilderness where wild bees thrive on diverse native blossoms. Collected with care using traditional and sustainable beekeeping methods, this honey is 100% natural, unprocessed, and organic—preserving all of nature’s goodness.

Rich in natural enzymes, antioxidants, and essential nutrients, Organic Wild Honey is more than just a sweetener—it’s a wholesome source of energy and wellness. Its distinct floral aroma and deep, golden flavor make it perfect for everyday use, whether drizzled over breakfast, stirred into tea, or enjoyed straight from the spoon.

**African Organic Wild Honey is certified to EU and USDA NOP organic standards.**

Nutritional Benefits:
Boosts immunity – Its natural antibacterial properties help prevent infections.
Soothes sore throat and cough – A traditional remedy for maintaining respiratory health.
Aids digestion – Improves gut health and helps relieve stomach discomfort.
Enhances energy – A great source of natural carbohydrates that provide long-lasting energy.
Supports skin and wound healing – Used in natural skincare, it keeps the skin moisturized and aids the healing process.', true),
  ('local-maghi-sarisha-oil-5-ltr', 'Deshi Mustard Oil 5 liter', 'Oil & Ghee', NULL, 'Shosti food', 1550, NULL, 'Best Selling', '{"Best Selling"}', 'https://backoffice.ghorerbazar.com/productImages/vkVdH1767248022.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767248022I4Jdh.jpg', 'https://backoffice.ghorerbazar.com/productImages/176724802268K5B.jpg', '{"https://backoffice.ghorerbazar.com/productImages/vkVdH1767248022.jpg","https://backoffice.ghorerbazar.com/productImages/1767248022I4Jdh.jpg","https://backoffice.ghorerbazar.com/productImages/176724802268K5B.jpg"}', NULL, '**Ghorerbazar Wooden Cold-Pressed Maghi Mustard Oil**
Bring back the authentic taste of tradition with Ghorerbazar Wooden Ghani Cold-Pressed First Extract Maghi Mustard Oil. Using a traditional tamarind-wood ghani (wooden press), mustard seeds are crushed with wood-on-wood friction at low pressure, keeping heat minimal. This ensures the oil remains pure, nutrient-rich, and naturally aromatic.

**Key Features:**
100% Pure Maghi Mustard Oil.
First-press cold extraction in wooden ghani.
No chemicals, no additives.
Rich golden color with natural aroma.
Enhances flavor and nutrition in cooking

**Health Benefits:**
Aids digestion and helps maintain healthy weight.
Rich in Omega-3 & Omega-6 fatty acids that support heart health and reduce cholesterol.
Warm oil massage helps relieve joint pain and stiffness.
Strengthens immunity and overall wellness.

**Usage & Storage:**
Perfect for frying, bharta, curries, and pickles.
Store in an airtight bottle in a cool, dry place.
No preservatives and no refrigeration needed.', true),
  ('ajwa-premium-dates-1kg-jumbo', 'Ajwa Premium Dates 1kg (Jumbo)', 'Dates', NULL, 'Khejuri', 2500, 2250, 'Offered Items', '{"Offered Items"}', 'https://backoffice.ghorerbazar.com/productImages/GgBwT1775107212.webp', 'https://backoffice.ghorerbazar.com/productImages/1771322234lhUcd.webp', 'https://backoffice.ghorerbazar.com/productImages/1771322234KlfGY.webp', '{"https://backoffice.ghorerbazar.com/productImages/GgBwT1775107212.webp","https://backoffice.ghorerbazar.com/productImages/1771322234lhUcd.webp","https://backoffice.ghorerbazar.com/productImages/1771322234KlfGY.webp"}', NULL, 'Ajwa Premium Dates are carefully sourced from the sacred city of Al Madinah in Saudi Arabia, a region celebrated for cultivating the world’s finest dates. Each Ajwa date is meticulously hand-picked at the perfect stage of ripeness to ensure superior quality, uniform size, and a naturally deep, dark brown to black hue. These dates are 100% natural and free from any artificial colors, flavors, or preservatives, retaining their authentic taste and rich nutritional goodness. With a soft yet firm texture and a mildly sweet, fruity flavor, Ajwa Dates provide a truly delightful and wholesome experience. Whether enjoyed as a healthy snack, presented as a thoughtful gift, or served during special occasions such as Ramadan, their distinctive taste and quality make them stand out. Versatile in use, Ajwa Dates can also be added to desserts, smoothies, salads, or energy mixes for a natural touch of sweetness and nourishment. Nutritional Benefits: * Rich in Dietary Fibre – Supports healthy digestion and helps maintain bowel regularity. * High in Natural Energy – Contains natural sugars like glucose, fructose, and sucrose that provide an instant energy boost. * Packed with Essential Minerals – A good source of potassium, magnesium, calcium, and iron for overall body function and vitality. * Loaded with Antioxidants – Helps protect cells from oxidative stress and supports heart health. * Promotes Bone Strength – The presence of minerals such as calcium and phosphorus contribute to strong and healthy bones. * Supports Heart Health – Low in fat and cholesterol-free, Ajwa Dates aid in maintaining healthy cholesterol levels. * Boosts Immunity – Natural nutrients, vitamins, and antioxidants enhance the body’s immune defense system. * Improves Brain Function – Rich in natural compounds that may help enhance memory and cognitive performance.', true),
  ('black-seed-honey-500g', 'Black Seed Honey 500g', 'Honey', NULL, 'Honeyraj', 800, 720, 'Offered Items', '{"Offered Items"}', 'https://backoffice.ghorerbazar.com/productImages/JdeWl1767418564.jpg', 'https://backoffice.ghorerbazar.com/productImages/17670011109tVEr.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767001110y3xs1.jpg', '{"https://backoffice.ghorerbazar.com/productImages/JdeWl1767418564.jpg","https://backoffice.ghorerbazar.com/productImages/17670011109tVEr.jpg","https://backoffice.ghorerbazar.com/productImages/1767001110y3xs1.jpg"}', NULL, 'Black Seed Honey is a unique and premium-quality honey collected by bees from the nectar of Nigella sativa flowers. Known for its strong taste, aroma, color, and remarkable health benefits, it is also called “Black Seed Honey.” Produced in small batches, it preserves its natural richness and purity.

Nutritional & Health Benefits:

-Boosts immunity
-Supports digestion, relieves acidity & constipation
-Provides energy and improves sleep quality
-Effective for cold, cough & sore throat
-Beneficial for skin and beauty care

Storage: Store in a cool, dry place. Keep away from direct sunlight and do not refrigerate.', true),
  ('lal-chal-10kg', 'Lal Chal 10kg', 'Rice', NULL, 'GhorerBazar', 1150, NULL, 'Best Selling', '{"Best Selling"}', 'https://backoffice.ghorerbazar.com/productImages/Xz5mr1767441942.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767441942Q7ZuP.jpg', NULL, '{"https://backoffice.ghorerbazar.com/productImages/Xz5mr1767441942.jpg","https://backoffice.ghorerbazar.com/productImages/1767441942Q7ZuP.jpg"}', NULL, '**Red Ganjia Rice – Semi-Polished, Fiber-Rich & Traditionally Prepared**

**Red Ganjia rice** is made from the **Aman variety of Ganjia paddy** . It is **semi-cooked, fiber-rich** , and prepared using **traditional methods (Chatal process)** . One of the biggest advantages of red rice is its **high fiber content** , which is beneficial for health. It helps **lower cholesterol, aids digestion, and supports weight management** . For those trying to reduce weight, red rice is a healthier choice compared to white rice. Additionally, red rice helps **maintain healthy blood sugar levels** , making it suitable for people with diabetes.

Health Benefits:

**High in fiber:** Keeps you full for longer, reducing overall food intake, and promotes a healthy digestive system, which aids in weight management.

**Heart health:** Contains **selenium** , which supports cardiovascular health.

**Low Glycemic Index (GI):** Sugar is released slowly after digestion, preventing sudden spikes in blood sugar and allowing better absorption and utilization.

How to Cook Red Rice:

**Rinse:** Wash the rice thoroughly to remove dust and excess moisture.

**Soak (optional):** Soak for 30 minutes to 1 hour before cooking. This reduces cooking time and preserves nutrients.

**Cooking:** Use **2–2.5 cups of water per 1 cup of rice** (adjust based on quantity). Cook on low heat for **15–20 minutes** if you want soft, fully cooked rice.

**For weight management:** Avoid excessive oil; cook simply and healthily.

**Daily intake:** As part of a balanced diet, a **moderate portion daily** provides protein, fiber, and essential nutrients.

Storage Instructions:

**Keep in a dry, cool place:** Protect rice from moisture and temperature fluctuations.

**Use airtight containers:** Helps maintain quality by preventing exposure to air and moisture.

**Store in the dark:** Protect from light and heat, which can degrade flavor and nutrients.

**Keep away from strong odors:** Prevents the rice from absorbing unwanted smells.

**Seal the packet properly:** After opening, reseal tightly to avoid air and moisture entering.

**Red Ganjia rice** is a wholesome, nutritious choice for a healthy lifestyle, supporting digestion, weight management, and overall wellness', true),
  ('natural-wild-honeycomb-1200gm', 'Natural Wild Honeycomb-1200gm', 'Honey', NULL, 'Honeyraj', 3600, 3240, 'Offered Items', '{"Offered Items"}', 'https://backoffice.ghorerbazar.com/productImages/KWqrt1767532494.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767532494sYat2.jpg', 'https://backoffice.ghorerbazar.com/productImages/17675324940gkYM.jpg', '{"https://backoffice.ghorerbazar.com/productImages/KWqrt1767532494.jpg","https://backoffice.ghorerbazar.com/productImages/1767532494sYat2.jpg","https://backoffice.ghorerbazar.com/productImages/17675324940gkYM.jpg"}', NULL, 'Honey with its yellowish-brown wax comb is what is essentially known as **Honeycomb** . When you chew and eat the entire comb along with the natural honey inside—much like chewing chocolate—you experience the pure, freshly harvested taste of honey. If one were to name the world’s most delicious and sweetest food, “honey” would undoubtedly come first. The aroma, flavor, and nutritional qualities present in this completely natural honey are rarely found in such abundance elsewhere. Since every organic product is healthy and highly beneficial for well-being, **Ghorer Bazar** brings you the traditional **Honeycomb** .

Collected from the deep forests of distant Turkey, this **organic honeycomb** has made the world of honey truly unparalleled. An irresistible taste combined with authentic Turkish honey comes together in this honeycomb. In terms of purity, it stands ahead of all others, as this organically produced honey is collected directly using scientific and well-regulated methods.

This Turkish honeycomb is often referred to as a **nutritional powerhouse** . Honeycombs weighing 1.1 kg, 1.2 kg, 1.3 kg, and 1.4 kg contain a rich blend of vitamins, minerals, and antioxidants. These nutrients help enhance physical performance and efficiency while increasing essential elements such as potassium, calcium, and iron in the body.

Consuming this honey regularly helps prevent sudden weakness and reduces fatigue. Turkish honey with comb—also known as Turkish honeycomb—is truly a masterpiece of nature. Produced in the vast, natural forests of Turkey, rich in heritage and diversity, this honey stands unique in its qualities. According to nutritionists, many physical problems and ailments can be addressed with this honey, and it is considered a strong support for overall good health. For example, it:

Helps boost immunity when consumed regularly

Helps improve blood circulation

Helps reduce skin blemishes

Helps improve digestion

Helps keep the body energetic and revitalized

As this Turkish honeycomb is intensely sweet, it should be consumed in very small quantities. Doing so will help maintain good health. Excessive consumption, however, may cause physical reactions.', true),
  ('honey-nuts-800gm', 'Honey Nuts 800gm', 'Nuts & Seeds', NULL, 'GhorerBazar', 1500, NULL, NULL, '{}', 'https://backoffice.ghorerbazar.com/productImages/4BTRl1767443347.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767443347zoXcO.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767443347aiCH4.jpg', '{"https://backoffice.ghorerbazar.com/productImages/4BTRl1767443347.jpg","https://backoffice.ghorerbazar.com/productImages/1767443347zoXcO.jpg","https://backoffice.ghorerbazar.com/productImages/1767443347aiCH4.jpg"}', NULL, 'The relationship between nuts and honey may seem new, but their history goes back a long way. According to researchers, along with fruits, vegetables, and meat, nuts have long been in demand as a food source. Their high nutritional value is one of the key reasons behind this demand. Nuts can also be stored for long periods without special care, which historically gave them a prestigious place in the human diet. In ancient times, both the Greeks and the Romans used nuts as medicine.

However, discussions around “honey nuts” likely became popular after the COVID-19 pandemic. With the rapid rise of online-based businesses during that time, the name “honey nuts” reached people more widely.

People often believe that healthy food tastes bland—but Ghorerbazar’s Honey Nuts will change that perception. Made from natural honey and a mix of premium-grade nuts, Ghorerbazar Honey Nuts deliver a delicious and nutritious snack. Although many types of honey nuts are available in the market, ours stand out because they do not contain raisins, dates, seeds, or similar fillers. As a result, the taste is exceptionally rich and enjoyable.

**Ingredients:**
Almonds.
Walnuts.
Cashews.
Peanuts.
White sesame.
Sunflower seeds.
Pistachios.
Dates.
Figs.
Apricots.

**Benefits of Honey Nuts:**
Nutritionist Nahida Ahmed from Dhaka’s Farazi Hospital explains that nuts play a vital role in improving heart health. The omega-3 fats found in nuts are beneficial for the heart and help reduce the risk of cardiovascular diseases. Nuts are also rich in calcium, vitamins, and iron, which strengthen immunity and support overall physical development.

According to nutritionists, the calcium, vitamins, and iron present in nuts help boost immunity, strengthen bones, improve blood circulation, enhance memory, and reduce mental stress.

On the other hand, honey is considered a powerful natural remedy in Ayurvedic and Unani medicine. It helps strengthen the body’s immune system and offers many additional health benefits, including reducing heart disease risk, improving blood circulation by dilating blood vessels, and supporting healthy heart function.', true),
  ('laal-atta-2kg', 'Laal Atta 2kg', 'Flours & Lentils', NULL, 'GhorerBazar', 200, NULL, NULL, '{}', 'https://backoffice.ghorerbazar.com/productImages/tFQxp1767439453.jpg', NULL, NULL, '{"https://backoffice.ghorerbazar.com/productImages/tFQxp1767439453.jpg"}', NULL, '**Red Flour from Local Wheat: Committed to Your Healthy Living**

After rice, **wheat** is the second most important staple crop in Bangladesh. Although wheat is a key agricultural crop in the country, domestic production is low, so imports from China and the USA are needed to meet demand.

However, **GhorerBazar Red Flour** is made from **locally grown wheat** , which stands out in **taste and quality** compared to other flours in the market.

White flour contains a high amount of sugar, which is not beneficial for the body. In contrast, **red flour made from whole, locally sourced wheat** supports the activity of over **300 enzymes** in our body. After milling, GhorerBazar red flour is carefully **monitored and purified** under strict supervision.

Compared to white flour, **local red flour is far more nutritious** , rich in fiber, minerals, and vitamins, which help fight diseases and prevent health problems. For example:

**Helps manage diabetes** : Keeps blood sugar in check and even aids in prevention.

**Controls appetite and supports weight management.**

**Boosts immunity** : Rich in phytonutrients that strengthen the body’s defense system.

**Supports digestion** and overall body strength.

**Promotes healthy skin.**

**Contains antioxidants** that help in cancer prevention.

The **taste of local red wheat flour** is unique and different from other red flours in the market. Since it is produced from locally sourced wheat seeds and follows strict, **pure production methods** (no additives or mixes), the flavor may feel unusual at first. However, the **authentic taste of pure, high-quality flour** can never match the cheap, mass-produced alternatives in the market.

Always **verify and choose 100% pure local wheat flour** before purchase. Stay healthy.', true),
  ('almond-1kg', 'Almond 1kg', 'Nuts & Seeds', NULL, 'Shosti food', 1500, NULL, NULL, '{}', 'https://backoffice.ghorerbazar.com/productImages/IvsiP1767095664.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767095664LAwVr.jpg', NULL, '{"https://backoffice.ghorerbazar.com/productImages/IvsiP1767095664.jpg","https://backoffice.ghorerbazar.com/productImages/1767095664LAwVr.jpg"}', NULL, 'Almonds, one of the world’s most popular and nutritious nuts, are rich in vitamins, minerals, and antioxidants that offer numerous health benefits. Their naturally sweet taste and impressive nutritional profile have made almonds an ideal snack and a widely used food ingredient.

Health Benefits of Almonds

Rich in Nutrients:
Almonds are packed with essential vitamins, minerals, and healthy fats, including Vitamin E, magnesium, and dietary fiber.

Supports Heart Health:
The monounsaturated fats in almonds help lower bad cholesterol levels, reducing the risk of heart disease.

Helps in Weight Management:
Almonds are high in protein and fiber, promoting fullness and helping to control weight.

Boosts Brain Function:
The Vitamin E in almonds may improve brain performance and help prevent age-related memory decline.

Strengthens Bones:
Almonds contain high levels of magnesium and calcium, both of which support strong and healthy bones.

Helps Control Blood Sugar:
Almonds help regulate blood sugar levels, making them beneficial for individuals with diabetes.

Improves Skin Health:
The antioxidants in almonds, especially Vitamin E, protect the skin from oxidative damage and promote a healthy, glowing complexion.

Supports Digestion:
The fiber in almonds supports healthy digestion and helps prevent constipation.

Boosts Immunity:
Almonds are rich in antioxidants that strengthen the immune system and help the body fight infections.

Ways to Use Almonds

As a Snack:
Almonds can be eaten on their own as a healthy snack, providing energy and nutrition.

In Smoothies:
Adding almonds to smoothies enhances their texture and nutritional value.

In Baking:
Almonds are commonly used in baking—cakes, cookies, muffins, and bread—for added flavor and crunch.

In Salads:
Sliced or chopped almonds can be sprinkled over salads for extra crunch and nutrients.

Almond Milk:
Almonds are used to make almond milk, a popular dairy-free milk alternative.

In Cooking:
Almonds are often used in savory dishes such as curries or rice recipes to add a nutty flavor.

Nut Butter:
Processed almonds are turned into almond butter—a creamy, nutritious spread for toast or sandwiches.

As a Garnish:
Almonds are used as a garnish for a variety of dishes, from desserts to main courses, enhancing both flavor and presentation.

Skin & Hair Care:
Almond oil is widely used in skincare products for its moisturizing and nourishing properties.

How to Store Almonds

Keep in a Cool, Dry Place:
Store almonds in a cool, dry place to maintain their quality. Heat and moisture can spoil them.

Use an Airtight Container:
To preserve freshness, store almonds in an airtight container to prevent airflow and moisture from getting in.', true),
  ('deshi-mustard-oil-2ltr', 'Deshi Mustard Oil 2 liter', 'Oil & Ghee', NULL, 'Shosti food', 620, NULL, NULL, '{}', 'https://backoffice.ghorerbazar.com/productImages/xZ5261767248563.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767248563HgAST.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767248563zYO5Y.jpg', '{"https://backoffice.ghorerbazar.com/productImages/xZ5261767248563.jpg","https://backoffice.ghorerbazar.com/productImages/1767248563HgAST.jpg","https://backoffice.ghorerbazar.com/productImages/1767248563zYO5Y.jpg"}', NULL, '**Ghorerbazar Wooden Cold-Pressed Maghi Mustard Oil**
Bring back the authentic taste of tradition with Ghorerbazar Wooden Ghani Cold-Pressed First Extract Maghi Mustard Oil. Using a traditional tamarind-wood ghani (wooden press), mustard seeds are crushed with wood-on-wood friction at low pressure, keeping heat minimal. This ensures the oil remains pure, nutrient-rich, and naturally aromatic.

**Key Features:**
100% Pure Maghi Mustard Oil.
First-press cold extraction in wooden ghani.
No chemicals, no additives.
Rich golden color with natural aroma.
Enhances flavor and nutrition in cooking

**Health Benefits:**
Aids digestion and helps maintain healthy weight.
Rich in Omega-3 & Omega-6 fatty acids that support heart health and reduce cholesterol.
Warm oil massage helps relieve joint pain and stiffness.
Strengthens immunity and overall wellness.

**Usage & Storage:**
Perfect for frying, bharta, curries, and pickles.
Store in an airtight bottle in a cool, dry place.
No preservatives and no refrigeration needed.', true),
  ('almond-500gm', 'Almond 500gm', 'Nuts & Seeds', NULL, 'Shosti food', 750, NULL, NULL, '{}', 'https://backoffice.ghorerbazar.com/productImages/T6QIT1767095834.jpg', 'https://backoffice.ghorerbazar.com/productImages/17670958342DaVH.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767096125RPzJ0.jpg', '{"https://backoffice.ghorerbazar.com/productImages/T6QIT1767095834.jpg","https://backoffice.ghorerbazar.com/productImages/17670958342DaVH.jpg","https://backoffice.ghorerbazar.com/productImages/1767096125RPzJ0.jpg"}', NULL, 'Almonds, one of the world’s most popular and nutritious nuts, are rich in vitamins, minerals, and antioxidants that offer numerous health benefits. Their naturally sweet taste and impressive nutritional profile have made almonds an ideal snack and a widely used food ingredient.

**Health Benefits of Almonds**

Rich in Nutrients:
Almonds are packed with essential vitamins, minerals, and healthy fats, including Vitamin E, magnesium, and dietary fiber.

Supports Heart Health:
The monounsaturated fats in almonds help lower bad cholesterol levels, reducing the risk of heart disease.

Helps in Weight Management:
Almonds are high in protein and fiber, promoting fullness and helping to control weight.

Boosts Brain Function:
The Vitamin E in almonds may improve brain performance and help prevent age-related memory decline.

Strengthens Bones:
Almonds contain high levels of magnesium and calcium, both of which support strong and healthy bones.

Helps Control Blood Sugar:
Almonds help regulate blood sugar levels, making them beneficial for individuals with diabetes.

Improves Skin Health:
The antioxidants in almonds, especially Vitamin E, protect the skin from oxidative damage and promote a healthy, glowing complexion.

Supports Digestion:
The fiber in almonds supports healthy digestion and helps prevent constipation.

Boosts Immunity:
Almonds are rich in antioxidants that strengthen the immune system and help the body fight infections.

**Ways to Use Almonds**

As a Snack:
Almonds can be eaten on their own as a healthy snack, providing energy and nutrition.

In Smoothies:
Adding almonds to smoothies enhances their texture and nutritional value.

In Baking:
Almonds are commonly used in baking—cakes, cookies, muffins, and bread—for added flavor and crunch.

In Salads:
Sliced or chopped almonds can be sprinkled over salads for extra crunch and nutrients.

Almond Milk:
Almonds are used to make almond milk, a popular dairy-free milk alternative.

In Cooking:
Almonds are often used in savory dishes such as curries or rice recipes to add a nutty flavor.

Nut Butter:
Processed almonds are turned into almond butter—a creamy, nutritious spread for toast or sandwiches.

As a Garnish:
Almonds are used as a garnish for a variety of dishes, from desserts to main courses, enhancing both flavor and presentation.

Skin & Hair Care:
Almond oil is widely used in skincare products for its moisturizing and nourishing properties.

**How to Store Almonds**

Keep in a Cool, Dry Place:
Store almonds in a cool, dry place to maintain their quality. Heat and moisture can spoil them.

Use an Airtight Container:
To preserve freshness, store almonds in an airtight container to prevent airflow and moisture from getting in.', true),
  ('walnut-500gm', 'Walnut 500gm', 'Nuts & Seeds', NULL, 'Shosti food', 900, NULL, NULL, '{}', 'https://backoffice.ghorerbazar.com/productImages/HsQQ51767096867.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767096867NPatl.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767096867nEXaL.jpg', '{"https://backoffice.ghorerbazar.com/productImages/HsQQ51767096867.jpg","https://backoffice.ghorerbazar.com/productImages/1767096867NPatl.jpg","https://backoffice.ghorerbazar.com/productImages/1767096867nEXaL.jpg"}', NULL, 'Walnut, commonly known as Akhrot, is a highly popular tree nut valued for its rich nutritional profile and unique flavor. The scientific name of the walnut tree is Juglans regia. Although it originated in the regions of Central Asia, walnuts are now grown worldwide, especially in North America, Europe, and Mediterranean regions.

The shell of a walnut is hard and grooved, while the edible part inside is a wrinkled seed, usually light brown or beige. Walnuts have a mild, slightly bitter taste and are widely used in salads, desserts, and various cooked dishes. They can be eaten raw, roasted, or in the form of walnut butter.

**Health Benefits of Walnuts**

Walnuts are well-known for their numerous health benefits. These nuts are not only delicious but also packed with nutrients that support overall wellness. Here are some of the major benefits:

**Rich in Omega-3 Fatty Acids**

Walnuts are an excellent source of omega-3 fatty acids, especially alpha-linolenic acid (ALA). These healthy fats are vital for brain function and heart health. Omega-3 helps reduce inflammation and lowers the risk of chronic diseases like heart disease.

**Supports Heart Health**

Walnuts help reduce bad cholesterol (LDL) and increase good cholesterol (HDL). This supports cardiovascular health and reduces the risk of heart attack and stroke. The polyunsaturated fats in walnuts help maintain healthy blood vessels.

**Improves Brain Health**

Due to their high omega-3 content, walnuts help boost brain performance and may reduce the risk of age-related conditions such as memory decline and Alzheimer’s disease. Their antioxidants also protect brain cells from oxidative stress.

**Rich in Antioxidants**

Walnuts contain powerful antioxidants like Vitamin E, polyphenols, and melatonin. These help fight free radicals, reduce oxidative stress, and lower the risk of long-term health issues like cancer and premature aging.

**Aids in Weight Management**

Although walnuts are calorie-dense, consuming them in moderation may support weight control. Their healthy fats, protein, and fiber help keep you full longer, reducing overeating.

**Promotes Digestive Health**

Walnuts are a good source of dietary fiber, which helps regulate bowel movements and supports a healthy gut microbiome—an essential factor for overall health.

**Ways to Use Walnuts As a Snack**

Walnuts can be eaten raw or roasted as a quick and healthy snack. They provide healthy fats, protein, and fiber that help curb hunger.

**In Baking**

Walnuts are commonly used in baked goods such as cakes, cookies, muffins, brownies, and banana bread. They add a crunchy texture and nutty flavor.

**In Salads**

Sprinkle walnuts over green salads, fruit salads, or grain-based salads to enhance taste and texture. They pair well with leafy greens, apples, pears, and cheeses like feta or goat cheese.

**In Smoothies**

Adding a handful of walnuts to smoothies boosts their nutritional value, creates a creamy texture, and adds healthy fats and fiber. They blend well with both fruit and green smoothies.

**In Cooking**

Walnuts can be used in savory dishes such as curries, pasta sauces, and casseroles. They add richness and pair well with vegetables, grains, and meat.

**Storage Tips for Walnuts**

Store in a Cool, Dry Place:
Walnuts should be kept in a cool, dry place. Heat and humidity can damage their quality and cause them to go rancid.

Use an Airtight Container:
Keep walnuts in an airtight container to prevent moisture and air exposure, ensuring they stay fresh for a longer period.', true),
  ('chili-morich-powder-500g', 'Chili (Morich) Powder 500g', 'Spices', NULL, 'GhorerBazar', 400, NULL, NULL, '{}', 'https://backoffice.ghorerbazar.com/productImages/j32Ba1767262660.jpg', 'https://backoffice.ghorerbazar.com/productImages/17672626606HDFi.jpg', 'https://backoffice.ghorerbazar.com/productImages/17672626602WKlN.jpg', '{"https://backoffice.ghorerbazar.com/productImages/j32Ba1767262660.jpg","https://backoffice.ghorerbazar.com/productImages/17672626606HDFi.jpg","https://backoffice.ghorerbazar.com/productImages/17672626602WKlN.jpg"}', NULL, 'Sri Lanka is globally renowned for producing some of the finest quality chilies. The fertile soil, favorable climate, and natural cultivation methods give the chilies their distinctive pungency, vibrant red color, and captivating aroma.

Ghorerbazar carefully sources these premium Sri Lankan chilies, sun-dries them naturally, and grinds them under strict supervision. They are then hygienically bottled and packaged to preserve their authentic taste, aroma, and nutritional value.

**Health Benefits of Red Chilli Powder:**

-Aids digestion, reduces gas and constipation
-Helps regulate blood pressure
-Reduces inflammation and pain
-Supports weight management
-Boosts brain function and memory
-Strengthens immunity
-Beneficial for skin and hair care', true),
  ('lichu-fuler-modhu-250gm', 'Lichu Flower Honey 250g', 'Honey', NULL, 'GhorerBazar', 300, NULL, NULL, '{}', 'https://backoffice.ghorerbazar.com/productImages/ykmIX1767418655.jpg', 'https://backoffice.ghorerbazar.com/productImages/1766997039dvakv.jpg', 'https://backoffice.ghorerbazar.com/productImages/17674186552KEN3.jpg', '{"https://backoffice.ghorerbazar.com/productImages/ykmIX1767418655.jpg","https://backoffice.ghorerbazar.com/productImages/1766997039dvakv.jpg","https://backoffice.ghorerbazar.com/productImages/17674186552KEN3.jpg"}', NULL, '**Lychee Flower Honey**

Lychee flower honey is typically light yellow in color. However, during collection, the color may vary from light to dark depending on the percentage of lychee nectar, its source, and its density. This honey is extremely delicious, offering a taste and aroma similar to fresh lychee fruit. In natural honeycombs, variations in flavor can also occur due to the blending of nectar from different flowers.

The consistency of this honey can range from thick to thin. When the density is low (more liquid), foam may form, whereas higher-density honey usually does not produce foam. One of the unique characteristics of lychee flower honey is that it may partially or fully crystallize over time. This crystallization depends on the honey’s density and the proportion of nectar from different flowers.

**Benefits of Lychee Flower Honey:**

Lychee flower honey is rich in nutrients and offers numerous health benefits beyond its use in cooking.

Helps improve digestion and supports overall stomach health
Effective in relieving cold, cough, mucus, and sore throat
Supports the management of high blood pressure
Promotes healthy bones and teeth
Helps reduce mental stress, anxiety, and tension
Beneficial for skin issues such as acne, eczema, oiliness, and dryness', true),
  ('cashew-nuts-medium-size-250g', 'Cashew Nuts Medium Size 250g', 'Nuts & Seeds', NULL, 'Shosti food', 550, NULL, NULL, '{}', 'https://backoffice.ghorerbazar.com/productImages/U970T1767096491.jpg', 'https://backoffice.ghorerbazar.com/productImages/176709649165c6E.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767096491JqyMZ.jpg', '{"https://backoffice.ghorerbazar.com/productImages/U970T1767096491.jpg","https://backoffice.ghorerbazar.com/productImages/176709649165c6E.jpg","https://backoffice.ghorerbazar.com/productImages/1767096491JqyMZ.jpg"}', NULL, 'Nuts are naturally beneficial for the body. Beyond adding flavor to food, the health benefits of nuts can help address a variety of physical problems. And when it comes to cashews, there is no question about their value. Nutritionists say cashews are rich in fiber and essential nutrients such as manganese, phosphorus, zinc, and copper. They also contain Vitamin K, Vitamin B6, and other vital nutrients. This is why cashews can be highly beneficial for those dealing with various health issues or following a diet for weight loss.

**Health Benefits of Cashew Nuts**

Strengthens bones, prevents bone loss, and helps relieve muscle pain.

Helps relieve constipation and supports healthy digestion.

Boosts the body’s immune system.

Improves blood health. Copper deficiency in the blood can lead to iron deficiency, which causes anemia—regular consumption of cashews helps reduce this problem.

The vitamins in cashews keep the skin smooth, reduce signs of aging, and help lighten dark circles under the eyes.

**How to Eat Cashews for Better Benefits**

1. Soaked in Milk Overnight
Soak cashews in milk overnight. Eating cashews soaked in milk helps prevent age-related bone loss. Both cashews and milk contain Vitamin K, minerals, and Vitamin B6, which support strong bone formation.

2. For Constipation Relief
For those suffering from long-term constipation, cashews soaked in milk can be an excellent remedy. Cashews are rich in fiber, which eases constipation and supports digestive health.

3. To Strengthen Immunity
Due to poor food choices, unhealthy lifestyle habits, and environmental changes, our immune system often becomes weak. To strengthen immunity and help the body fight diseases, soaked cashews can be very helpful.

4. For Healthy Blood
Cashews are rich in copper, which helps treat blood-related issues. A lack of copper can lead to iron deficiency and eventually anemia. Eating cashews soaked in milk regularly may help reduce this problem.', true),
  ('african-organic-wild-honey-1kg', 'African Organic Wild Honey 1kg', 'Honey', NULL, 'Honeyraj', 2500, 2200, 'Offered Items', '{"Offered Items"}', 'https://backoffice.ghorerbazar.com/productImages/6ctmE1775107173.jpg', 'https://backoffice.ghorerbazar.com/productImages/1766992764eeudd.jpg', 'https://backoffice.ghorerbazar.com/productImages/17669927648bnGe.jpg', '{"https://backoffice.ghorerbazar.com/productImages/6ctmE1775107173.jpg","https://backoffice.ghorerbazar.com/productImages/1766992764eeudd.jpg","https://backoffice.ghorerbazar.com/productImages/17669927648bnGe.jpg"}', NULL, 'Discover the pure taste of Africa with Organic Wild Honey, harvested from the untouched wilderness where wild bees thrive on diverse native blossoms. Collected with care using traditional and sustainable beekeeping methods, this honey is 100% natural, unprocessed, and organic—preserving all of nature’s goodness.

Rich in natural enzymes, antioxidants, and essential nutrients, Organic Wild Honey is more than just a sweetener—it’s a wholesome source of energy and wellness. Its distinct floral aroma and deep, golden flavor make it perfect for everyday use, whether drizzled over breakfast, stirred into tea, or enjoyed straight from the spoon.

**African Organic Wild Honey is certified to EU and USDA NOP organic standards.**

Nutritional Benefits:
Boosts immunity – Its natural antibacterial properties help prevent infections.
Soothes sore throat and cough – A traditional remedy for maintaining respiratory health.
Aids digestion – Improves gut health and helps relieve stomach discomfort.
Enhances energy – A great source of natural carbohydrates that provide long-lasting energy.
Supports skin and wound healing – Used in natural skincare, it keeps the skin moisturized and aids the healing process.', true),
  ('walnut-250gm', 'Walnut 250gm', 'Nuts & Seeds', NULL, 'Shosti food', 500, NULL, NULL, '{}', 'https://backoffice.ghorerbazar.com/productImages/mGGzp1767587913.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767587913AJRUU.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767587913xgBm0.jpg', '{"https://backoffice.ghorerbazar.com/productImages/mGGzp1767587913.jpg","https://backoffice.ghorerbazar.com/productImages/1767587913AJRUU.jpg","https://backoffice.ghorerbazar.com/productImages/1767587913xgBm0.jpg"}', NULL, 'Walnut, commonly known as Akhrot, is a highly popular tree nut valued for its rich nutritional profile and unique flavor. The scientific name of the walnut tree is Juglans regia. Although it originated in the regions of Central Asia, walnuts are now grown worldwide, especially in North America, Europe, and Mediterranean regions.

The shell of a walnut is hard and grooved, while the edible part inside is a wrinkled seed, usually light brown or beige. Walnuts have a mild, slightly bitter taste and are widely used in salads, desserts, and various cooked dishes. They can be eaten raw, roasted, or in the form of walnut butter.

**Health Benefits of Walnuts**

Walnuts are well-known for their numerous health benefits. These nuts are not only delicious but also packed with nutrients that support overall wellness. Here are some of the major benefits:

**Rich in Omega-3 Fatty Acids**

Walnuts are an excellent source of omega-3 fatty acids, especially alpha-linolenic acid (ALA). These healthy fats are vital for brain function and heart health. Omega-3 helps reduce inflammation and lowers the risk of chronic diseases like heart disease.

**Supports Heart Health**

Walnuts help reduce bad cholesterol (LDL) and increase good cholesterol (HDL). This supports cardiovascular health and reduces the risk of heart attack and stroke. The polyunsaturated fats in walnuts help maintain healthy blood vessels.

**Improves Brain Health**

Due to their high omega-3 content, walnuts help boost brain performance and may reduce the risk of age-related conditions such as memory decline and Alzheimer’s disease. Their antioxidants also protect brain cells from oxidative stress.

**Rich in Antioxidants**

Walnuts contain powerful antioxidants like Vitamin E, polyphenols, and melatonin. These help fight free radicals, reduce oxidative stress, and lower the risk of long-term health issues like cancer and premature aging.

**Aids in Weight Management**

Although walnuts are calorie-dense, consuming them in moderation may support weight control. Their healthy fats, protein, and fiber help keep you full longer, reducing overeating.

**Promotes Digestive Health**

Walnuts are a good source of dietary fiber, which helps regulate bowel movements and supports a healthy gut microbiome—an essential factor for overall health.

**Ways to Use Walnuts As a Snack**

Walnuts can be eaten raw or roasted as a quick and healthy snack. They provide healthy fats, protein, and fiber that help curb hunger.

**In Baking**

Walnuts are commonly used in baked goods such as cakes, cookies, muffins, brownies, and banana bread. They add a crunchy texture and nutty flavor.

**In Salads**

Sprinkle walnuts over green salads, fruit salads, or grain-based salads to enhance taste and texture. They pair well with leafy greens, apples, pears, and cheeses like feta or goat cheese.

**In Smoothies**

Adding a handful of walnuts to smoothies boosts their nutritional value, creates a creamy texture, and adds healthy fats and fiber. They blend well with both fruit and green smoothies.

**In Cooking**

Walnuts can be used in savory dishes such as curries, pasta sauces, and casseroles. They add richness and pair well with vegetables, grains, and meat.

**Storage Tips for Walnuts**

Store in a Cool, Dry Place:
Walnuts should be kept in a cool, dry place. Heat and humidity can damage their quality and cause them to go rancid.

Use an Airtight Container:
Keep walnuts in an airtight container to prevent moisture and air exposure, ensuring they stay fresh for a longer period.', true),
  ('cashew-nuts-medium-size-1kg', 'Cashew Nuts Medium Size 1kg', 'Nuts & Seeds', NULL, 'Shosti food', 2000, NULL, NULL, '{}', 'https://backoffice.ghorerbazar.com/productImages/xmShY1767096349.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767096349gwn6Z.jpg', NULL, '{"https://backoffice.ghorerbazar.com/productImages/xmShY1767096349.jpg","https://backoffice.ghorerbazar.com/productImages/1767096349gwn6Z.jpg"}', NULL, 'Nuts are naturally beneficial for the body. Beyond adding flavor to food, the health benefits of nuts can help address a variety of physical problems. And when it comes to cashews, there is no question about their value. Nutritionists say cashews are rich in fiber and essential nutrients such as manganese, phosphorus, zinc, and copper. They also contain Vitamin K, Vitamin B6, and other vital nutrients. This is why cashews can be highly beneficial for those dealing with various health issues or following a diet for weight loss.

**Health Benefits of Cashew Nuts**

Strengthens bones, prevents bone loss, and helps relieve muscle pain.

Helps relieve constipation and supports healthy digestion.

Boosts the body’s immune system.

Improves blood health. Copper deficiency in the blood can lead to iron deficiency, which causes anemia—regular consumption of cashews helps reduce this problem.

The vitamins in cashews keep the skin smooth, reduce signs of aging, and help lighten dark circles under the eyes.

**How to Eat Cashews for Better Benefits**

1. Soaked in Milk Overnight
Soak cashews in milk overnight. Eating cashews soaked in milk helps prevent age-related bone loss. Both cashews and milk contain Vitamin K, minerals, and Vitamin B6, which support strong bone formation.

2. For Constipation Relief
For those suffering from long-term constipation, cashews soaked in milk can be an excellent remedy. Cashews are rich in fiber, which eases constipation and supports digestive health.

3. To Strengthen Immunity
Due to poor food choices, unhealthy lifestyle habits, and environmental changes, our immune system often becomes weak. To strengthen immunity and help the body fight diseases, soaked cashews can be very helpful.

4. For Healthy Blood
Cashews are rich in copper, which helps treat blood-related issues. A lack of copper can lead to iron deficiency and eventually anemia. Eating cashews soaked in milk regularly may help reduce this problem.', true),
  ('local-kalijira-oil-250ml', 'Local Kalijira Oil 250ml', 'Oil & Ghee', NULL, 'GhorerBazar', 625, NULL, NULL, '{}', 'https://backoffice.ghorerbazar.com/productImages/B9QpI1767100108.jpg', 'https://backoffice.ghorerbazar.com/productImages/17671001091nKKP.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767100109kkkuH.jpg', '{"https://backoffice.ghorerbazar.com/productImages/B9QpI1767100108.jpg","https://backoffice.ghorerbazar.com/productImages/17671001091nKKP.jpg","https://backoffice.ghorerbazar.com/productImages/1767100109kkkuH.jpg"}', NULL, 'Black Seed (Kalojira) Oil
Alongside black seeds themselves, the oil extracted from them offers remarkable health benefits. Black seeds are rich in phosphorus, iron, and other essential nutrients. They also contain cancer-fighting carotenoids, immunity-boosting compounds, and agents that help prevent acidic disorders.

Black seeds contain nearly a hundred beneficial nutrients. Regular consumption of black seeds strengthens the body’s immunity and plays a vital role in maintaining overall health. The honey from black seed flowers is considered premium worldwide, and black seed oil is equally beneficial for the body. Today, black seed capsules are also available in the market.

**Purity and Preparation:**
After harvesting black seeds from farmers’ fields, the seeds are carefully selected for purity and dryness. Following a long and meticulous process, the seeds are crushed using machines under supervision. The extracted oil is then bottled and delivered to you as pure black seed oil from Ghorer Bazar.

**Health Benefits of Black Seed Oil:**

Rich in antioxidants

May help regulate blood pressure and blood fat

Supports asthma and diabetes management

Aids in weight management and cognitive function

Beneficial for skin and overall beauty care

**How to Consume Black Seed Oil:**

Mix 1 teaspoon of black seed oil in a glass of lukewarm water and drink.

Mix 1 teaspoon of oil with 4 teaspoons of honey or tulsi (holy basil) juice.

Combine 1 teaspoon of oil with 3 teaspoons of orange juice or mint juice.

Add black seed oil to dishes just before removing from heat.

Use it as a substitute for mustard or other oils in salads, mashed dishes, or popcorn.

**Special Advantages of Black Seed Oil:**

Boosts immunity

Enhances memory

Reduces the risk of heart disease

Eliminates stomach bacteria and gas

Helps control diabetes

Relieves joint pain

Strengthens teeth

Promotes healthy skin and reduces arthritis and muscle pain

**Precautions:**

Not recommended during pregnancy

Avoid giving to children under 2 years old

Never consume fake or artificially produced black seed oil

Always ensure the oil is fresh, pure, and properly processed

Old or rancid black seed oil can be harmful to health', true),
  ('ajwa-premium-dates-500g-jumbo', 'Ajwa Premium Dates 500g (Jumbo)', 'Dates', NULL, 'Khejuri', 1250, NULL, NULL, '{}', 'https://backoffice.ghorerbazar.com/productImages/7Oe7x1771921145.webp', 'https://backoffice.ghorerbazar.com/productImages/1771921145ehDHp.webp', NULL, '{"https://backoffice.ghorerbazar.com/productImages/7Oe7x1771921145.webp","https://backoffice.ghorerbazar.com/productImages/1771921145ehDHp.webp"}', NULL, 'Ajwa Premium Dates are carefully sourced from the sacred city of Al Madinah in Saudi Arabia, a region celebrated for cultivating the world’s finest dates. Each Ajwa date is meticulously hand-picked at the perfect stage of ripeness to ensure superior quality, uniform size, and a naturally deep, dark brown to black hue. These dates are 100% natural and free from any artificial colors, flavors, or preservatives, retaining their authentic taste and rich nutritional goodness. With a soft yet firm texture and a mildly sweet, fruity flavor, Ajwa Dates provide a truly delightful and wholesome experience. Whether enjoyed as a healthy snack, presented as a thoughtful gift, or served during special occasions such as Ramadan, their distinctive taste and quality make them stand out. Versatile in use, Ajwa Dates can also be added to desserts, smoothies, salads, or energy mixes for a natural touch of sweetness and nourishment. Nutritional Benefits: * Rich in Dietary Fibre – Supports healthy digestion and helps maintain bowel regularity. * High in Natural Energy – Contains natural sugars like glucose, fructose, and sucrose that provide an instant energy boost. * Packed with Essential Minerals – A good source of potassium, magnesium, calcium, and iron for overall body function and vitality. * Loaded with Antioxidants – Helps protect cells from oxidative stress and supports heart health. * Promotes Bone Strength – The presence of minerals such as calcium and phosphorus contribute to strong and healthy bones. * Supports Heart Health – Low in fat and cholesterol-free, Ajwa Dates aid in maintaining healthy cholesterol levels. * Boosts Immunity – Natural nutrients, vitamins, and antioxidants enhance the body’s immune defense system. * Improves Brain Function – Rich in natural compounds that may help enhance memory and cognitive performance.', true),
  ('moringa-powder-500gm', 'Moringa Powder 500gm', 'Functional Food', NULL, 'GhorerBazar', 900, NULL, NULL, '{}', 'https://backoffice.ghorerbazar.com/productImages/weti11767439804.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767439804Xlz7j.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767439804BPIXL.jpg', '{"https://backoffice.ghorerbazar.com/productImages/weti11767439804.jpg","https://backoffice.ghorerbazar.com/productImages/1767439804Xlz7j.jpg","https://backoffice.ghorerbazar.com/productImages/1767439804BPIXL.jpg"}', NULL, '**Moringa Powder / Sajna Leaf Powder 🌿 – Nature’s Superfood**

The stem of the **Sajna (Moringa) plant** is widely used as a vegetable, but consuming its leaves has an even longer tradition. Recently, the use of **Sajna leaf powder** has grown due to its remarkable nutritional benefits. Sajna leaves are often eaten as a vegetable. This drought-tolerant plant thrives in tropical and semi-arid regions. While it reproduces through seeds, in Bangladesh, propagation is mainly done via **cuttings or branches** . The best time for planting Sajna is during **summer** , especially from mid-April to the end of the month.

Why Sajna Leaf Powder is a Superfood

Sajna leaf powder is **not just a medicinal herb** —it’s a superfood. It replenishes the body with essential nutrients when there is a deficiency, helping the body recover faster from illnesses. Regular consumption of Sajna leaf powder ensures your body gets all the essential nutrients it needs, preventing diseases from taking hold. Over time, you will **feel physically stronger and healthier** .

Health Benefits of Moringa / Sajna Leaf Powder

**Rich in nutrients:** Contains all essential nutrients needed by the human body, including plant-based protein and high amounts of iron.

**Retains nutrition when powdered:** Drying the leaves into powder preserves its nutritional value.

**Supports weight management:** Helps control body weight effectively.

**Diabetes management:** Plays a vital role in maintaining healthy blood sugar levels.

**Regulates body fat:** Helps control fat accumulation in the body.

**Boosts energy:** Acts as a natural nutrient reservoir, providing vitality.

**Relieves sinus problems:** Consuming as a warm drink can ease sinus issues.

**Strengthens immunity:** Nutrients in the leaves significantly improve the body’s defense system.

**Promotes better sleep:** Drinking Sajna leaf powder before bedtime encourages restful sleep.

How Moringa / Sajna Leaf Powder is Made

Produced from **carefully selected hill-grown Sajna leaves** .

The entire process is carried out **safely under strict supervision by skilled artisans** .

When stored properly, the powder **remains fresh for up to one year** .

Only **clean leaves free of dust and stems** are used.

Sajna leaf powder is a natural, safe, and effective way to **boost overall health, immunity, and vitality** .', true),
  ('walnut-1kg', 'Walnut 1kg', 'Nuts & Seeds', NULL, 'Shosti food', 1800, NULL, NULL, '{}', 'https://backoffice.ghorerbazar.com/productImages/7ruzF1767591190.jpg', 'https://backoffice.ghorerbazar.com/productImages/17675911909F7Dc.jpg', NULL, '{"https://backoffice.ghorerbazar.com/productImages/7ruzF1767591190.jpg","https://backoffice.ghorerbazar.com/productImages/17675911909F7Dc.jpg"}', NULL, 'Walnut, commonly known as Akhrot, is a highly popular tree nut valued for its rich nutritional profile and unique flavor. The scientific name of the walnut tree is Juglans regia. Although it originated in the regions of Central Asia, walnuts are now grown worldwide, especially in North America, Europe, and Mediterranean regions.

The shell of a walnut is hard and grooved, while the edible part inside is a wrinkled seed, usually light brown or beige. Walnuts have a mild, slightly bitter taste and are widely used in salads, desserts, and various cooked dishes. They can be eaten raw, roasted, or in the form of walnut butter.

**Health Benefits of Walnuts**

Walnuts are well-known for their numerous health benefits. These nuts are not only delicious but also packed with nutrients that support overall wellness. Here are some of the major benefits:

**Rich in Omega-3 Fatty Acids**

Walnuts are an excellent source of omega-3 fatty acids, especially alpha-linolenic acid (ALA). These healthy fats are vital for brain function and heart health. Omega-3 helps reduce inflammation and lowers the risk of chronic diseases like heart disease.

**Supports Heart Health**

Walnuts help reduce bad cholesterol (LDL) and increase good cholesterol (HDL). This supports cardiovascular health and reduces the risk of heart attack and stroke. The polyunsaturated fats in walnuts help maintain healthy blood vessels.

**Improves Brain Health**

Due to their high omega-3 content, walnuts help boost brain performance and may reduce the risk of age-related conditions such as memory decline and Alzheimer’s disease. Their antioxidants also protect brain cells from oxidative stress.

**Rich in Antioxidants**

Walnuts contain powerful antioxidants like Vitamin E, polyphenols, and melatonin. These help fight free radicals, reduce oxidative stress, and lower the risk of long-term health issues like cancer and premature aging.

**Aids in Weight Management**

Although walnuts are calorie-dense, consuming them in moderation may support weight control. Their healthy fats, protein, and fiber help keep you full longer, reducing overeating.

**Promotes Digestive Health**

Walnuts are a good source of dietary fiber, which helps regulate bowel movements and supports a healthy gut microbiome—an essential factor for overall health.

**Ways to Use Walnuts As a Snack**

Walnuts can be eaten raw or roasted as a quick and healthy snack. They provide healthy fats, protein, and fiber that help curb hunger.

**In Baking**

Walnuts are commonly used in baked goods such as cakes, cookies, muffins, brownies, and banana bread. They add a crunchy texture and nutty flavor.

**In Salads**

Sprinkle walnuts over green salads, fruit salads, or grain-based salads to enhance taste and texture. They pair well with leafy greens, apples, pears, and cheeses like feta or goat cheese.

**In Smoothies**

Adding a handful of walnuts to smoothies boosts their nutritional value, creates a creamy texture, and adds healthy fats and fiber. They blend well with both fruit and green smoothies.

**In Cooking**

Walnuts can be used in savory dishes such as curries, pasta sauces, and casseroles. They add richness and pair well with vegetables, grains, and meat.

**Storage Tips for Walnuts**

Store in a Cool, Dry Place:
Walnuts should be kept in a cool, dry place. Heat and humidity can damage their quality and cause them to go rancid.

Use an Airtight Container:
Keep walnuts in an airtight container to prevent moisture and air exposure, ensuring they stay fresh for a longer period.', true),
  ('sreemangals-tea-gold-500g', 'Sreemangal’s Tea Gold 500g', 'Beverage', NULL, 'GhorerBazar', 300, NULL, NULL, '{}', 'https://backoffice.ghorerbazar.com/productImages/gXpJj1767441387.jpg', 'https://backoffice.ghorerbazar.com/productImages/176744138712ZzG.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767441387mqxP3.jpg', '{"https://backoffice.ghorerbazar.com/productImages/gXpJj1767441387.jpg","https://backoffice.ghorerbazar.com/productImages/176744138712ZzG.jpg","https://backoffice.ghorerbazar.com/productImages/1767441387mqxP3.jpg"}', NULL, '**Special Tea Gold – 100% Pure & Chemical-Free**
**Special Tea Gold** is **100% pure, completely chemical-free** , and safe for daily consumption. It contains **no artificial colors or flavors** —a truly pure tea that meets all your everyday tea needs. Crafted from **carefully selected leaves** , this tea is especially favored for **milk tea** . Its **aromatic fragrance, rich liquor, and full-bodied flavor** deliver the perfect tea experience in every sip.

Health Benefits:

**Rich in antioxidants:** Protects the body from harmful free radicals.

**Reduces stress & refreshes the mind:** Its aroma and taste help calm the mind and ease mental fatigue.

**Supports digestion and metabolism:** Properly processed leaves improve digestive processes and support metabolism.

**100% safe and healthy:** Pure and chemical-free, suitable for all ages.

Storage Instructions:

Keep in a **dry, cool place** .

Use **airtight containers** .

Keep away from **direct light** .

Store **away from strong odors** .

Avoid **frequent temperature changes** .

Enjoy **Special Tea Gold** daily for a refreshing, healthy, and aromatic tea experience.', true),
  ('gawa-ghee-400gm', 'Gawa Ghee 400gm', 'Oil & Ghee', NULL, 'GhorerBazar', 720, NULL, NULL, '{}', 'https://backoffice.ghorerbazar.com/productImages/hTKy21767012358.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767012358zwtm5.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767012358HatVa.jpg', '{"https://backoffice.ghorerbazar.com/productImages/hTKy21767012358.jpg","https://backoffice.ghorerbazar.com/productImages/1767012358zwtm5.jpg","https://backoffice.ghorerbazar.com/productImages/1767012358HatVa.jpg"}', NULL, 'Experience the authentic taste of tradition with Shosti Pure Cow Ghee, sourced from the renowned Pabna region of Bangladesh. Crafted by skilled artisans with generations of expertise, our ghee is prepared with utmost care—bringing you purity, nutrition, and rich flavor in every spoonful.

Key Features

100% Pure & Natural Cow Ghee

Made with traditional methods from fresh milk

Rich in vitamins A, D, E & K for overall wellness

Contains CLA & Butyric Acid—supports digestion, immunity & heart health

Perfect for polao, biryani, bharta, or simply with hot rice

Airtight glass jar packaging ensures freshness & long shelf life

Usage & Storage

Use as a cooking ingredient, natural health booster, or flavor enhancer.

Store in a cool, dry place in an airtight container.

No refrigeration required if kept sealed.

Always use a clean, dry spoon.', true),
  ('kashmiri-sidr-honey-250g', 'Kashmiri Sidr Honey 250g', 'Honey', NULL, 'GhorerBazar', 625, NULL, NULL, '{}', 'https://backoffice.ghorerbazar.com/productImages/QdxZW1771328171.png', NULL, NULL, '{"https://backoffice.ghorerbazar.com/productImages/QdxZW1771328171.png"}', NULL, 'Kashmiri Sidr honey is a high-quality and sought-after honey produced in the pristine valleys of Kashmir, a region in northern India known for its breathtaking natural beauty. This honey is celebrated for its unique taste, remarkable health benefits, and cultural significance. Kashmiri Sidr honey is renowned for its potential health benefits including digestive issues, sore throats, and respiratory conditions. It is also believed to have antimicrobial and anti-inflammatory properties. Benefits and advantages: * Maintains general health. * Anti-bacterial, anti-fungal. * Highly beneficial and healthy Dietary supplement. * Boosts the immune system. * Suitable for those who have respiratory disorders. * Richness in Minerals and Vitamins. * It is a great substitute for sugar. * It helps heal wounds. * Natural Anti-oxidant. Safety Reminder * Is not recommended for infants under 1 year old. * Our products are not intended to diagnose, treat, cure, or prevent any disease or health condition safety precautions. * All products are 100% natural but may cause allergies to some people with sensitive conditions. If allergies occur please stop using the product immediately. Country Origin: India', true),
  ('pistachio-250g', 'Pistachio 250g', 'Nuts & Seeds', NULL, 'Shosti food', 1050, NULL, NULL, '{}', 'https://backoffice.ghorerbazar.com/productImages/X8nZd1767250549.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767250549oFcAg.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767250549l3iVk.jpg', '{"https://backoffice.ghorerbazar.com/productImages/X8nZd1767250549.jpg","https://backoffice.ghorerbazar.com/productImages/1767250549oFcAg.jpg","https://backoffice.ghorerbazar.com/productImages/1767250549l3iVk.jpg"}', NULL, NULL, true),
  ('lychee-flower-honey-8g-x-24-pcs-box', 'Lychee Flower Honey 8g X 24 pcs (BOX)', 'Honey', NULL, 'Honeyraj', 240, NULL, NULL, '{}', 'https://backoffice.ghorerbazar.com/productImages/tpOaP1776075938.png', NULL, NULL, '{"https://backoffice.ghorerbazar.com/productImages/tpOaP1776075938.png"}', NULL, '**Lychee Flower Honey**

Lychee flower honey is typically light yellow in color. However, during collection, the color may vary from light to dark depending on the percentage of lychee nectar, its source, and its density. This honey is extremely delicious, offering a taste and aroma similar to fresh lychee fruit. In natural honeycombs, variations in flavor can also occur due to the blending of nectar from different flowers.

The consistency of this honey can range from thick to thin. When the density is low (more liquid), foam may form, whereas higher-density honey usually does not produce foam. One of the unique characteristics of lychee flower honey is that it may partially or fully crystallize over time. This crystallization depends on the honey’s density and the proportion of nectar from different flowers.

**Benefits of Lychee Flower Honey:**

Lychee flower honey is rich in nutrients and offers numerous health benefits beyond its use in cooking.

Helps improve digestion and supports overall stomach health
Effective in relieving cold, cough, mucus, and sore throat
Supports the management of high blood pressure
Promotes healthy bones and teeth
Helps reduce mental stress, anxiety, and tension
Beneficial for skin issues such as acne, eczema, oiliness, and dryness', true),
  ('methi-500g', 'Methi 500g', 'Spices', NULL, 'Shosti food', 250, NULL, NULL, '{}', 'https://backoffice.ghorerbazar.com/productImages/TsuAa1767259209.jpg', 'https://backoffice.ghorerbazar.com/productImages/17672592096Ec4Y.jpg', 'https://backoffice.ghorerbazar.com/productImages/17672592097ag3d.jpg', '{"https://backoffice.ghorerbazar.com/productImages/TsuAa1767259209.jpg","https://backoffice.ghorerbazar.com/productImages/17672592096Ec4Y.jpg","https://backoffice.ghorerbazar.com/productImages/17672592097ag3d.jpg"}', NULL, 'Fenugreek seeds have been used since ancient times as both a spice and a natural remedy. In rural areas, fenugreek leaves are consumed as a leafy vegetable, while its seeds are one of the key ingredients in the famous Bengali spice mix Panch Phoron. With a slightly bitter yet aromatic flavor, fenugreek is valued for its medicinal properties.

Fenugreek water is widely known to regulate high blood pressure, improve metabolism, and support weight management. The glucomannan fiber slows down sugar absorption in the intestine, while amino acids stimulate insulin release from the pancreas, making it beneficial for diabetics.

**Nutritional Benefits:**

-Aids digestion
-Controls blood sugar levels
-Lowers cholesterol
-Helps in weight management
-Reduces skin blemishes
-Boosts immunity
-Promotes hair growth

**Uses:**
Ideal for curries, pickles, and Panch Phoron. Soaked fenugreek water can be consumed regularly for better digestion, controlled sugar levels, and overall wellness.', true),
  ('cardamom-100g', 'Cardamom 100g', 'Spices', NULL, 'Shosti food', 750, NULL, NULL, '{}', 'https://backoffice.ghorerbazar.com/productImages/bkc581767261015.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767261015OKYhi.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767261015jUyFu.jpg', '{"https://backoffice.ghorerbazar.com/productImages/bkc581767261015.jpg","https://backoffice.ghorerbazar.com/productImages/1767261015OKYhi.jpg","https://backoffice.ghorerbazar.com/productImages/1767261015jUyFu.jpg"}', NULL, 'Green cardamom is a popular spice that is found in almost every kitchen. Known for its rich aroma and flavor, it enhances a wide variety of dishes. Beyond cooking, cardamom has significant medicinal properties and health benefits. It contains protein, carbohydrates, cholesterol, fiber, niacin, riboflavin, pyridoxine, thiamine, electrolytes, sodium, potassium, calcium, magnesium, zinc, and vitamins A and C.

**Nutritional Benefits:**

-Relieves cold, cough, respiratory problems, and improves blood circulation.
-Helps control high blood pressure.
-Prevents blood clot formation.
-Rich in antioxidants that support heart health.
-Fights oral problems like gum infection, mouth ulcers, and bad breath.
-Proven to be beneficial against colorectal cancer.
-Effective for digestive issues and stomach problems.

**Uses:**
Cardamom is widely used in biryani, pulao, sweets, milk-based desserts, and tea to enhance aroma and taste. In Ayurvedic medicine, it is valued for treating respiratory issues, improving digestion, and maintaining oral health.', true),
  ('shosti-ghee-500gm', 'Gawa Ghee 500gm', 'Oil & Ghee', NULL, 'Shosti food', 900, 850, 'Offered Items', '{"Offered Items"}', 'https://backoffice.ghorerbazar.com/productImages/l4UhS1767097338.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767012196bamWM.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767097338fuEOi.jpg', '{"https://backoffice.ghorerbazar.com/productImages/l4UhS1767097338.jpg","https://backoffice.ghorerbazar.com/productImages/1767012196bamWM.jpg","https://backoffice.ghorerbazar.com/productImages/1767097338fuEOi.jpg"}', NULL, 'Experience the authentic taste of tradition with Shosti Pure Cow Ghee, sourced from the renowned Pabna region of Bangladesh. Crafted by skilled artisans with generations of expertise, our ghee is prepared with utmost care—bringing you purity, nutrition, and rich flavor in every spoonful.

**Key Features:**
100% Pure & Natural Cow Ghee.
Made with traditional methods from fresh milk.
Rich in vitamins A, D, E & K for overall wellness.
Contains CLA & Butyric Acid—supports digestion, immunity & heart health.
Perfect for polao, biryani, bharta, or simply with hot rice.
Airtight glass jar packaging ensures freshness & long shelf life

**Usage & Storage:**
Use as a cooking ingredient, natural health booster, or flavor enhancer.
Store in a cool, dry place in an airtight container.
No refrigeration required if kept sealed.
Always use a clean, dry spoon.', true),
  ('sundarban-honey-8g-x-24-pcs-box', 'Sundarban Honey 8g X 24 pcs (BOX)', 'Honey', NULL, 'Honeyraj', 432, NULL, NULL, '{}', 'https://backoffice.ghorerbazar.com/productImages/omV471776075964.png', NULL, NULL, '{"https://backoffice.ghorerbazar.com/productImages/omV471776075964.png"}', NULL, 'Sourced from the world’s largest mangrove forest, the Sundarbans, this honey is 100% natural and pure. The nectar is collected by bees from diverse wildflowers such as Khalsi, Keora, Bain, Garan, Geoa, and Sundari, giving Sundarban honey its unique taste, color, and exceptional qualities. No chemicals or artificial preservatives are used in this honey. Its color may range from golden to deep brown, and its thickness varies naturally depending on the season and floral sources.

**Benefits:**
Boosts immunity – Rich in antioxidants that protect the body from infections.
Effective for cough and sore throat – Natural anti-inflammatory properties soothe the throat.
Improves digestion – Enzyme-rich honey supports the digestive system.
Natural source of energy – Glucose and fructose provide instant energy.
Beneficial for skin and hair – Vitamins and minerals enhance skin radiance and strengthen hair.
Supports heart health – Regular consumption improves blood circulation and reduces the risk of heart disease.
Helps manage diabetes – In moderation, it supports blood sugar regulation.
Promotes wound healing – Acts as a natural antiseptic to aid faster recovery.

**Country of Origin: Sundarban (Bangladesh)**', true),
  ('glarvest-organic-matcha-green-tea-100gm', 'Glarvest Organic Matcha Green Tea 100gm', 'Beverage', NULL, 'Glarvest', 1500, NULL, NULL, '{}', 'https://backoffice.ghorerbazar.com/productImages/lUcpq1771491205.webp', NULL, NULL, '{"https://backoffice.ghorerbazar.com/productImages/lUcpq1771491205.webp"}', NULL, 'Matcha is a shade-grown, all-natural powdered green tea made from the finest tea leaves, as a health and nutrition product for thousands of years. It is rich in necessary nutrients for the human body. Our ceremonial matcha is made from Yabukita cultivar, renowned for its iridescent green colour, natural sweetness, elegant floral aroma, bitterness and smooth, lingering finish. Benefits of Matcha: * High in antioxidants. * Boosts metabolism and fat burning. * Enhances mental focus and calmness. * Supports heart health. * Aids detoxification. * May reduce cancer risk. * Strengthens the immune system. * Provides sustained energy. * Improves skin health. * Helps regulate blood sugar levels. * Supports oral health. * Enhances mood and reduces stress. * Promotes healthy digestion Certification: * USDA ORGANIC * EUOrganic Features: * Gluten Free * NON-GMO Country Origin: China', true),
  ('glarvest-organic-extra-virgin-olive-oil-5000-ml', 'Glarvest Organic Extra Virgin Olive Oil 5000 ml', 'Oil & Ghee', NULL, 'Glarvest', 11000, NULL, NULL, '{}', 'https://backoffice.ghorerbazar.com/productImages/eeiO51767097933.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767097933Pc4he.jpg', NULL, '{"https://backoffice.ghorerbazar.com/productImages/eeiO51767097933.jpg","https://backoffice.ghorerbazar.com/productImages/1767097933Pc4he.jpg"}', NULL, 'Organic Extra Virgin Olive Oil is a premium, cold-pressed oil made from organically grown olives that are harvested and processed without the use of synthetic pesticides, fertilizers, or chemical refining. It is the highest grade of olive oil, extracted solely by mechanical means to preserve its natural aroma, flavor, and nutrients. This golden-green oil is rich in monounsaturated fatty acids, particularly oleic acid, and contains valuable antioxidants such as polyphenols, vitamin E, and vitamin K. These nutrients not only contribute to its distinctive taste but also provide numerous health benefits. Because it is unrefined and minimally processed, organic extra virgin olive oil retains its purity and nutritional integrity, making it an ideal choice for both cooking and direct consumption. Its smooth texture and fresh, fruity notes make it a staple in Mediterranean diets and a symbol of natural wellness.

Health Benefits:
Promotes Heart Health – Lowers bad (LDL) cholesterol, raises good (HDL) cholesterol, and supports healthy blood pressure.
Rich in Antioxidants – Contains polyphenols and vitamin E that protect cells from oxidative damage.
Reduces Inflammation – Natural compounds like oleocanthal act as anti-inflammatory agents.
Controls Blood Sugar – Helps regulate glucose levels and improve insulin sensitivity, reducing the risk of type 2 diabetes.
Supports Brain Health – Protects brain cells, enhances memory, and may lower the risk of Alzheimer’s disease.
Aids Digestion – Promotes healthy digestion, supports bile production, and protects the stomach lining.
May Help Prevent Cancer – Antioxidant and anti-inflammatory effects may lower the risk of certain cancers.
Boosts Immunity – Strengthens the body’s natural defense system.
Improves Skin Health – Vitamin E and healthy fats keep skin soft, smooth, and youthful.
Supports Joint and Bone Health – Anti-inflammatory properties may help reduce joint pain and improve bone strength.', true),
  ('honey-nuts-500gm', 'Honey Nuts 500gm', 'Nuts & Seeds', NULL, 'GhorerBazar', 1000, NULL, 'Best Selling', '{"Best Selling"}', 'https://backoffice.ghorerbazar.com/productImages/1ubAo1767443414.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767094465VptE0.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767443414lPCDG.jpg', '{"https://backoffice.ghorerbazar.com/productImages/1ubAo1767443414.jpg","https://backoffice.ghorerbazar.com/productImages/1767094465VptE0.jpg","https://backoffice.ghorerbazar.com/productImages/1767443414lPCDG.jpg"}', NULL, 'The relationship between nuts and honey may seem new, but their history goes back a long way. According to researchers, along with fruits, vegetables, and meat, nuts have long been in demand as a food source. Their high nutritional value is one of the key reasons behind this demand. Nuts can also be stored for long periods without special care, which historically gave them a prestigious place in the human diet. In ancient times, both the Greeks and the Romans used nuts as medicine.

However, discussions around “honey nuts” likely became popular after the COVID-19 pandemic. With the rapid rise of online-based businesses during that time, the name “honey nuts” reached people more widely.

People often believe that healthy food tastes bland—but Ghorerbazar’s Honey Nuts will change that perception. Made from natural honey and a mix of premium-grade nuts, Ghorerbazar Honey Nuts deliver a delicious and nutritious snack. Although many types of honey nuts are available in the market, ours stand out because they do not contain raisins, dates, seeds, or similar fillers. As a result, the taste is exceptionally rich and enjoyable.

**Ingredients:**
Almonds.
Walnuts.
Cashews.
Peanuts.
White sesame.
Sunflower seeds.
Pistachios.
Dates.
Figs.
Apricots.

**Benefits of Honey Nuts:**
Nutritionist Nahida Ahmed from Dhaka’s Farazi Hospital explains that nuts play a vital role in improving heart health. The omega-3 fats found in nuts are beneficial for the heart and help reduce the risk of cardiovascular diseases. Nuts are also rich in calcium, vitamins, and iron, which strengthen immunity and support overall physical development.

According to nutritionists, the calcium, vitamins, and iron present in nuts help boost immunity, strengthen bones, improve blood circulation, enhance memory, and reduce mental stress.

On the other hand, honey is considered a powerful natural remedy in Ayurvedic and Unani medicine. It helps strengthen the body’s immune system and offers many additional health benefits, including reducing heart disease risk, improving blood circulation by dilating blood vessels, and supporting healthy heart function.', true),
  ('sundarban-honey-500gm', 'Sundarban Honey 500 gm', 'Honey', NULL, 'Honeyraj', 1250, 1100, 'Offered Items', '{"Offered Items"}', 'https://backoffice.ghorerbazar.com/productImages/jaJ6i1767418800.jpg', 'https://backoffice.ghorerbazar.com/productImages/1766990134l6jVJ.jpg', 'https://backoffice.ghorerbazar.com/productImages/1766990134SA7qG.jpg', '{"https://backoffice.ghorerbazar.com/productImages/jaJ6i1767418800.jpg","https://backoffice.ghorerbazar.com/productImages/1766990134l6jVJ.jpg","https://backoffice.ghorerbazar.com/productImages/1766990134SA7qG.jpg"}', NULL, 'Sourced from the world’s largest mangrove forest, the Sundarbans, this honey is 100% natural and pure. The nectar is collected by bees from diverse wildflowers such as Khalsi, Keora, Bain, Garan, Geoa, and Sundari, giving Sundarban honey its unique taste, color, and exceptional qualities. No chemicals or artificial preservatives are used in this honey. Its color may range from golden to deep brown, and its thickness varies naturally depending on the season and floral sources.

**Benefits:**
Boosts immunity – Rich in antioxidants that protect the body from infections.
Effective for cough and sore throat – Natural anti-inflammatory properties soothe the throat.
Improves digestion – Enzyme-rich honey supports the digestive system.
Natural source of energy – Glucose and fructose provide instant energy.
Beneficial for skin and hair – Vitamins and minerals enhance skin radiance and strengthen hair.
Supports heart health – Regular consumption improves blood circulation and reduces the risk of heart disease.
Helps manage diabetes – In moderation, it supports blood sugar regulation.
Promotes wound healing – Acts as a natural antiseptic to aid faster recovery.

**Country of Origin: Sundarban (Bangladesh)**', true),
  ('gawa-ghee-1kg', 'Gawa Ghee 1kg', 'Oil & Ghee', NULL, 'Shosti food', 1800, 1700, 'Offered Items', '{"Offered Items"}', 'https://backoffice.ghorerbazar.com/productImages/VvzII1767097227.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767011507JHs0z.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767097227mZrd9.jpg', '{"https://backoffice.ghorerbazar.com/productImages/VvzII1767097227.jpg","https://backoffice.ghorerbazar.com/productImages/1767011507JHs0z.jpg","https://backoffice.ghorerbazar.com/productImages/1767097227mZrd9.jpg"}', NULL, 'Experience the authentic taste of tradition with Shosti Pure Cow Ghee, sourced from the renowned Pabna region of Bangladesh. Crafted by skilled artisans with generations of expertise, our ghee is prepared with utmost care—bringing you purity, nutrition, and rich flavor in every spoonful.

**Key Features:**

100% Pure & Natural Cow Ghee.
Made with traditional methods from fresh milk.
Rich in vitamins A, D, E & K for overall wellness.
Contains CLA & Butyric Acid—supports digestion, immunity & heart health.
Perfect for polao, biryani, bharta, or simply with hot rice.
Airtight glass jar packaging ensures freshness & long shelf life.

**Usage & Storage:**
Use as a cooking ingredient, natural health booster, or flavor enhancer.
Store in a cool, dry place in an airtight container.
No refrigeration required if kept sealed.
Always use a clean, dry spoon.', true),
  ('deshi-mustard-oil-500ml', 'Deshi Mustard Oil 500 ml', 'Oil & Ghee', NULL, 'Shosti food', 155, NULL, 'Best Selling', '{"Best Selling"}', 'https://backoffice.ghorerbazar.com/productImages/Nloeg1767248447.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767248447ZOVEE.jpg', 'https://backoffice.ghorerbazar.com/productImages/17672484470asdz.jpg', '{"https://backoffice.ghorerbazar.com/productImages/Nloeg1767248447.jpg","https://backoffice.ghorerbazar.com/productImages/1767248447ZOVEE.jpg","https://backoffice.ghorerbazar.com/productImages/17672484470asdz.jpg"}', NULL, '**Ghorerbazar Wooden Cold-Pressed Maghi Mustard Oil**
Bring back the authentic taste of tradition with Ghorerbazar Wooden Ghani Cold-Pressed First Extract Maghi Mustard Oil. Using a traditional tamarind-wood ghani (wooden press), mustard seeds are crushed with wood-on-wood friction at low pressure, keeping heat minimal. This ensures the oil remains pure, nutrient-rich, and naturally aromatic.

**Key Features:**
100% Pure Maghi Mustard Oil.
First-press cold extraction in wooden ghani.
No chemicals, no additives.
Rich golden color with natural aroma.
Enhances flavor and nutrition in cooking

**Health Benefits:**
Aids digestion and helps maintain healthy weight.
Rich in Omega-3 & Omega-6 fatty acids that support heart health and reduce cholesterol.
Warm oil massage helps relieve joint pain and stiffness.
Strengthens immunity and overall wellness.

**Usage & Storage:**
Perfect for frying, bharta, curries, and pickles.
Store in an airtight bottle in a cool, dry place.
No preservatives and no refrigeration needed.', true),
  ('black-seed-honey-1kg', 'Black Seed Honey 1kg', 'Honey', NULL, 'Honeyraj', 1600, 1440, 'Offered Items', '{"Offered Items"}', 'https://backoffice.ghorerbazar.com/productImages/fAewT1767418525.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767001234wJSfG.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767001234kHDLr.jpg', '{"https://backoffice.ghorerbazar.com/productImages/fAewT1767418525.jpg","https://backoffice.ghorerbazar.com/productImages/1767001234wJSfG.jpg","https://backoffice.ghorerbazar.com/productImages/1767001234kHDLr.jpg"}', NULL, 'Black Seed Honey is a unique and premium-quality honey collected by bees from the nectar of Nigella sativa flowers. Known for its strong taste, aroma, color, and remarkable health benefits, it is also called “Black Seed Honey.” Produced in small batches, it preserves its natural richness and purity.

**Nutritional & Health Benefits:** Boosts immunity
Supports digestion, relieves acidity & constipation
Provides energy and improves sleep quality
Effective for cold, cough & sore throat
Beneficial for skin and beauty care

**Storage: Store in a cool, dry place. Keep away from direct sunlight and do not refrigerate.**', true),
  ('lichu-fuler-modhu-500-gm', 'Lichu Flower Honey 500g', 'Honey', NULL, 'Honeyraj', 600, 500, 'Offered Items', '{"Offered Items"}', 'https://backoffice.ghorerbazar.com/productImages/TtgOl1767418640.jpg', 'https://backoffice.ghorerbazar.com/productImages/17669970121Ng2u.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767418640CoxfU.jpg', '{"https://backoffice.ghorerbazar.com/productImages/TtgOl1767418640.jpg","https://backoffice.ghorerbazar.com/productImages/17669970121Ng2u.jpg","https://backoffice.ghorerbazar.com/productImages/1767418640CoxfU.jpg"}', NULL, '**Lychee Flower Honey**

Lychee flower honey is typically light yellow in color. However, during collection, the color may vary from light to dark depending on the percentage of lychee nectar, its source, and its density. This honey is extremely delicious, offering a taste and aroma similar to fresh lychee fruit. In natural honeycombs, variations in flavor can also occur due to the blending of nectar from different flowers.

The consistency of this honey can range from thick to thin. When the density is low (more liquid), foam may form, whereas higher-density honey usually does not produce foam. One of the unique characteristics of lychee flower honey is that it may partially or fully crystallize over time. This crystallization depends on the honey’s density and the proportion of nectar from different flowers.

**Benefits of Lychee Flower Honey:**

Lychee flower honey is rich in nutrients and offers numerous health benefits beyond its use in cooking.

Helps improve digestion and supports overall stomach health
Effective in relieving cold, cough, mucus, and sore throat
Supports the management of high blood pressure
Promotes healthy bones and teeth
Helps reduce mental stress, anxiety, and tension
Beneficial for skin issues such as acne, eczema, oiliness, and dryness', true),
  ('chinigura-aromatic-rice-1kg', 'Chinigura Aromatic Rice 1kg', 'Rice', NULL, 'GhorerBazar', 175, NULL, 'Best Selling', '{"Best Selling"}', 'https://backoffice.ghorerbazar.com/productImages/0LySu1767442263.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767442263FD1Mp.jpg', NULL, '{"https://backoffice.ghorerbazar.com/productImages/0LySu1767442263.jpg","https://backoffice.ghorerbazar.com/productImages/1767442263FD1Mp.jpg"}', NULL, 'GhorerBazar Chinigura Aromatic Rice is sourced directly from rural farmers of Dinajpur. This rice offers premium quality with its vacuum-packed packaging, that’s why, the rice stays fresh and retains that signature aromatic fragrance that enhances various dishes like Biriyani, Polau, Firni, Kheer, and Khichuri. It''s great for creating flavorful and aromatic meals.', true),
  ('sundarban-honey', 'Sundarban Honey 1kg', 'Honey', NULL, 'Honeyraj', 2500, 2200, 'Offered Items', '{"Offered Items"}', 'https://backoffice.ghorerbazar.com/productImages/CvT2N1767414529.jpg', 'https://backoffice.ghorerbazar.com/productImages/1766990565HvYzd.jpg', 'https://backoffice.ghorerbazar.com/productImages/1766990565DXkvT.jpg', '{"https://backoffice.ghorerbazar.com/productImages/CvT2N1767414529.jpg","https://backoffice.ghorerbazar.com/productImages/1766990565HvYzd.jpg","https://backoffice.ghorerbazar.com/productImages/1766990565DXkvT.jpg"}', NULL, 'Sourced from the world’s largest mangrove forest, the Sundarbans, this honey is 100% natural and pure. The nectar is collected by bees from diverse wildflowers such as Khalsi, Keora, Bain, Garan, Geoa, and Sundari, giving Sundarban honey its unique taste, color, and exceptional qualities. No chemicals or artificial preservatives are used in this honey. Its color may range from golden to deep brown, and its thickness varies naturally depending on the season and floral sources.

**Benefits:**
Boosts immunity – Rich in antioxidants that protect the body from infections.
Effective for cough and sore throat – Natural anti-inflammatory properties soothe the throat.
Improves digestion – Enzyme-rich honey supports the digestive system.
Natural source of energy – Glucose and fructose provide instant energy.
Beneficial for skin and hair – Vitamins and minerals enhance skin radiance and strengthen hair.
Supports heart health – Regular consumption improves blood circulation and reduces the risk of heart disease.
Helps manage diabetes – In moderation, it supports blood sugar regulation.
Promotes wound healing – Acts as a natural antiseptic to aid faster recovery.

**Country of Origin: Sundarban (Bangladesh)**', true),
  ('deshi-mustard-oil-1ltr', 'Deshi Mustard Oil 1 liter', 'Oil & Ghee', NULL, 'Shosti food', 310, NULL, 'Best Selling', '{"Best Selling"}', 'https://backoffice.ghorerbazar.com/productImages/ETt5J1767248095.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767248095dbv4Y.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767248095vrPdI.jpg', '{"https://backoffice.ghorerbazar.com/productImages/ETt5J1767248095.jpg","https://backoffice.ghorerbazar.com/productImages/1767248095dbv4Y.jpg","https://backoffice.ghorerbazar.com/productImages/1767248095vrPdI.jpg"}', NULL, '**Ghorerbazar Wooden Cold-Pressed Maghi Mustard Oil**
Bring back the authentic taste of tradition with Ghorerbazar Wooden Ghani Cold-Pressed First Extract Maghi Mustard Oil. Using a traditional tamarind-wood ghani (wooden press), mustard seeds are crushed with wood-on-wood friction at low pressure, keeping heat minimal. This ensures the oil remains pure, nutrient-rich, and naturally aromatic.

**Key Features:**
100% Pure Maghi Mustard Oil.
First-press cold extraction in wooden ghani.
No chemicals, no additives.
Rich golden color with natural aroma.
Enhances flavor and nutrition in cooking

**Health Benefits:**
Aids digestion and helps maintain healthy weight.
Rich in Omega-3 & Omega-6 fatty acids that support heart health and reduce cholesterol.
Warm oil massage helps relieve joint pain and stiffness.
Strengthens immunity and overall wellness.

**Usage & Storage:**
Perfect for frying, bharta, curries, and pickles.
Store in an airtight bottle in a cool, dry place.
No preservatives and no refrigeration needed.', true),
  ('lichu-flower-honey-1kg', 'Lichu Flower Honey 1kg', 'Honey', NULL, 'Honeyraj', 1200, 1000, 'Offered Items', '{"Offered Items"}', 'https://backoffice.ghorerbazar.com/productImages/A14zf1767418585.jpg', 'https://backoffice.ghorerbazar.com/productImages/1766999533UKPFu.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767418602zRoU5.jpg', '{"https://backoffice.ghorerbazar.com/productImages/A14zf1767418585.jpg","https://backoffice.ghorerbazar.com/productImages/1766999533UKPFu.jpg","https://backoffice.ghorerbazar.com/productImages/1767418602zRoU5.jpg"}', NULL, '**Lychee Flower Honey**

Lychee flower honey is typically light yellow in color. However, during collection, the color may vary from light to dark depending on the percentage of lychee nectar, its source, and its density. This honey is extremely delicious, offering a taste and aroma similar to fresh lychee fruit. In natural honeycombs, variations in flavor can also occur due to the blending of nectar from different flowers.

The consistency of this honey can range from thick to thin. When the density is low (more liquid), foam may form, whereas higher-density honey usually does not produce foam. One of the unique characteristics of lychee flower honey is that it may partially or fully crystallize over time. This crystallization depends on the honey’s density and the proportion of nectar from different flowers.

**Benefits of Lychee Flower Honey:**

Lychee flower honey is rich in nutrients and offers numerous health benefits beyond its use in cooking.

Helps improve digestion and supports overall stomach health
Effective in relieving cold, cough, mucus, and sore throat
Supports the management of high blood pressure
Promotes healthy bones and teeth
Helps reduce mental stress, anxiety, and tension
Beneficial for skin issues such as acne, eczema, oiliness, and dryness', true),
  ('crystal-honey-1kg', 'Crystal Honey 1kg', 'Honey', NULL, 'GhorerBazar', 1100, 1000, 'Offered Items', '{"Offered Items"}', 'https://backoffice.ghorerbazar.com/productImages/ObvIi1767855359.jpg', NULL, NULL, '{"https://backoffice.ghorerbazar.com/productImages/ObvIi1767855359.jpg"}', NULL, 'Crystal honey crystallization is a natural process. It does not affect the quality of honey in any way. However, many people feel uncomfortable consuming crystallized honey because of its grainy texture. That is why Ghorerbazar’s “Crystal Honey” is automatically processed using modern technology while preserving its natural nutrients. As a result, Ghorerbazar’s “Crystal Honey” is completely grain-free.

Features of Crystal Honey:

Crystal/Cream Honey is 100% natural honey.

Like liquid honey, crystal/cream honey contains the same nutritional value.

Compared to other honey, crystal/cream honey is sweeter in taste and has a slightly sharp aroma.

With rising temperatures after winter, crystal honey may partially or completely turn into liquid.

The ideal storage temperature for crystal honey is 18°C.

Benefits of Crystal Honey:

Protects your family from the harmful effects of sugar-rich foods.

The nutrients present in crystal honey help boost the human immune system.

Provides a quick and healthy snack solution.

Offers an easy solution for safe and nutritious food.

Ways to Consume Crystal Honey:

**With smoothies:** Use cream/crystal honey instead of sugar in any type of smoothie.

**For desserts:** Use cream/crystal honey to sweeten desserts instead of sugar.

**With tea:** Using cream/crystal honey adds natural sweetness to tea.

**With lukewarm water:** Adding cream/crystal honey makes tasteless lukewarm water naturally sweet.

**Spread on bread/toast:** Use natural cream/crystal honey as a healthy alternative to jam or jelly for breakfast.

**With pancakes:** Pour cream/crystal honey over pancakes to enhance sweetness.

**With paratha:** Use fresh cream/crystal honey to sweeten hot parathas without sugar.

Why Buy from Ghorerbazar?

“Ghorerbazar” is committed to ensuring 100% pure and safe food supply.

Our goal is not to sell products with exaggerated claims, but to collect safe food from remote areas and deliver it to customers while preserving nutritional value.

One of the country’s most trusted organizations, consistently working to ensure safe food supply based on consumer needs.

Our crystal honey is completely grain-free, rich in nutrients, and unmatched in taste.

**BSTI Approved.**', true),
  ('african-organic-wild-honey-500g', 'African Organic Wild Honey 500g', 'Honey', NULL, 'Honeyraj', 1250, 1100, 'Offered Items', '{"Offered Items"}', 'https://backoffice.ghorerbazar.com/productImages/g7Qx11775107164.jpg', 'https://backoffice.ghorerbazar.com/productImages/1766992386ucm4A.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767418750WWOOj.jpg', '{"https://backoffice.ghorerbazar.com/productImages/g7Qx11775107164.jpg","https://backoffice.ghorerbazar.com/productImages/1766992386ucm4A.jpg","https://backoffice.ghorerbazar.com/productImages/1767418750WWOOj.jpg"}', NULL, 'Discover the pure taste of Africa with Organic Wild Honey, harvested from the untouched wilderness where wild bees thrive on diverse native blossoms. Collected with care using traditional and sustainable beekeeping methods, this honey is 100% natural, unprocessed, and organic—preserving all of nature’s goodness.

Rich in natural enzymes, antioxidants, and essential nutrients, Organic Wild Honey is more than just a sweetener—it’s a wholesome source of energy and wellness. Its distinct floral aroma and deep, golden flavor make it perfect for everyday use, whether drizzled over breakfast, stirred into tea, or enjoyed straight from the spoon.

**African Organic Wild Honey is certified to EU and USDA NOP organic standards.**

Nutritional Benefits:
Boosts immunity – Its natural antibacterial properties help prevent infections.
Soothes sore throat and cough – A traditional remedy for maintaining respiratory health.
Aids digestion – Improves gut health and helps relieve stomach discomfort.
Enhances energy – A great source of natural carbohydrates that provide long-lasting energy.
Supports skin and wound healing – Used in natural skincare, it keeps the skin moisturized and aids the healing process.', true),
  ('safawikalmi-dates-a-grade-1kg', 'Safawi/kalmi Dates (A Grade) 1kg', 'Dates', NULL, 'Khejuri', 1300, 1170, 'Offered Items', '{"Offered Items"}', 'https://backoffice.ghorerbazar.com/productImages/IyJYh1776762485.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767097703tvZOn.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767097703GWZWv.jpg', '{"https://backoffice.ghorerbazar.com/productImages/IyJYh1776762485.jpg","https://backoffice.ghorerbazar.com/productImages/1767097703tvZOn.jpg","https://backoffice.ghorerbazar.com/productImages/1767097703GWZWv.jpg"}', NULL, 'Premium Kalmi (Safawi) Dates from Madinah, Saudi Arabia
Renowned for their superior quality, Madinah’s Kalmi (Safawi) dates are unmatched in taste, nutrition, and quality. With their deep dark color, soft yet slightly chewy texture, and perfectly balanced natural sweetness, these dates are recognized as some of the most popular in the world.

**Key Features:**

Origin: Madinah, Saudi Arabia

Taste: Naturally sweet, perfectly balanced

Color & Size: Deep dark brown, medium-sized

Nature: Naturally prepared, no artificial additives

Ideal for: Iftar, following Sunnah, and daily consumption

**Nutritional Benefits:**
Kalmi/Safawi dates are rich in fiber, natural sugars, iron, potassium, and antioxidants. They provide energy, aid digestion, and help maintain overall health.

**Ways to Enjoy:**

Eat on an empty stomach for Iftar

As a healthy snack or light breakfast

Add to milk, smoothies, or desserts

Perfect for gifting or charity

**Storage Instructions:**
Keep in a cool, dry place. For long-lasting freshness, store in an airtight container or in the refrigerator.', true),
  ('cashew-nut-medium-size-500gm', 'Cashew Nuts Medium Size 500gm', 'Nuts & Seeds', NULL, 'Shosti food', 1000, NULL, 'Best Selling', '{"Best Selling"}', 'https://backoffice.ghorerbazar.com/productImages/6e55t1767441512.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767441512mNLyp.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767441513ovexX.jpg', '{"https://backoffice.ghorerbazar.com/productImages/6e55t1767441512.jpg","https://backoffice.ghorerbazar.com/productImages/1767441512mNLyp.jpg","https://backoffice.ghorerbazar.com/productImages/1767441513ovexX.jpg"}', NULL, 'Nuts are naturally beneficial for the body. Beyond adding flavor to food, the health benefits of nuts can help address a variety of physical problems. And when it comes to cashews, there is no question about their value. Nutritionists say cashews are rich in fiber and essential nutrients such as manganese, phosphorus, zinc, and copper. They also contain Vitamin K, Vitamin B6, and other vital nutrients. This is why cashews can be highly beneficial for those dealing with various health issues or following a diet for weight loss.

**Health Benefits of Cashew Nuts**

Strengthens bones, prevents bone loss, and helps relieve muscle pain.

Helps relieve constipation and supports healthy digestion.

Boosts the body’s immune system.

Improves blood health. Copper deficiency in the blood can lead to iron deficiency, which causes anemia—regular consumption of cashews helps reduce this problem.

The vitamins in cashews keep the skin smooth, reduce signs of aging, and help lighten dark circles under the eyes.

**How to Eat Cashews for Better Benefits**

1. Soaked in Milk Overnight
Soak cashews in milk overnight. Eating cashews soaked in milk helps prevent age-related bone loss. Both cashews and milk contain Vitamin K, minerals, and Vitamin B6, which support strong bone formation.

2. For Constipation Relief
For those suffering from long-term constipation, cashews soaked in milk can be an excellent remedy. Cashews are rich in fiber, which eases constipation and supports digestive health.

3. To Strengthen Immunity
Due to poor food choices, unhealthy lifestyle habits, and environmental changes, our immune system often becomes weak. To strengthen immunity and help the body fight diseases, soaked cashews can be very helpful.

4. For Healthy Blood
Cashews are rich in copper, which helps treat blood-related issues. A lack of copper can lead to iron deficiency and eventually anemia. Eating cashews soaked in milk regularly may help reduce this problem.', true),
  ('honey-special-combo-pack-4-types-honey-2', 'Honey Special Combo Pack (4 types Honey)', 'Honey', NULL, 'Honeyraj', 1950, 1700, 'Offered Items', '{"Offered Items"}', 'https://backoffice.ghorerbazar.com/productImages/OxAWv1770619134.jpeg', 'https://backoffice.ghorerbazar.com/productImages/1770619135DPdPn.jpg', NULL, '{"https://backoffice.ghorerbazar.com/productImages/OxAWv1770619134.jpeg","https://backoffice.ghorerbazar.com/productImages/1770619135DPdPn.jpg"}', NULL, '**🍯 Premium Natural Honey Collection (250g Each)**

Our exclusive honey collection is sourced from some of the finest natural regions of Bangladesh and beyond. Each variant is 100% pure, chemical-free, and rich in natural nutrients.

**🌿 Sundarban Honey (250g)**
Harvested from the pristine mangrove forests of the Sundarbans, this honey is rich in natural minerals and antioxidants. It has a light, pleasant taste and supports overall immunity.

**🌱 Black Seed Honey (250g)**
Black Seed Flower Honey is naturally collected from the nectar of black seed (Nigella sativa) flowers. This honey is 100% pure and rich in natural antioxidants and essential nutrients. Known for its immune-boosting properties, it helps support digestion, increase energy levels, and promote overall wellness.

**🍒 Litchi Honey (250g)**
Collected from litchi flower nectar, this honey has a naturally sweet taste with a mild fruity aroma. Perfect for tea, beverages, and desserts.

**🌍 Kashmiri Sidr Honey (250g)**
Sourced from the rare Sidr trees of the Kashmir region, this premium honey has a thick texture and deep, rich flavor. Highly valued for its energy-boosting and wellness benefits.

👉 An ideal choice for daily natural health and vitality.', true),
  ('egyptian-medjool-large-1kg', 'Egyptian Medjool Large 1kg', 'Dates', NULL, 'Khejuri', 2200, 1980, 'Offered Items', '{"Offered Items"}', 'https://backoffice.ghorerbazar.com/productImages/YOL6J1767074338.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767608253jd2dS.jpg', NULL, '{"https://backoffice.ghorerbazar.com/productImages/YOL6J1767074338.jpg","https://backoffice.ghorerbazar.com/productImages/1767608253jd2dS.jpg"}', NULL, 'Grown in the fertile lands of the Middle East, Ghorer Bazar Medjool Dates are premium-quality, naturally sweet, and delightfully soft. Known as the "King of Dates," Medjool dates are rich in fiber, potassium, and essential nutrients—making them a healthy alternative to refined sugar and an ideal natural energy booster.

**Key Features:**

-Large, plump, and juicy Medjool dates
-Naturally sweet with a rich caramel-like flavor
-Excellent source of dietary fiber, potassium, magnesium & antioxidants
-100% natural, with no preservatives or added sugar
-Perfect for snacking, baking, or adding to smoothies & desserts

**Usage Ideas:**

-Enjoy as a wholesome snack anytime
-Stuff with nuts or cheese for a gourmet delight
-Blend into smoothies, shakes, or energy bars
-Use as a natural sweetener in baking and cooking', true),
  ('gawa-ghee-250gm', 'Gawa Ghee 250gm', 'Oil & Ghee', NULL, 'GhorerBazar', 450, NULL, 'Best Selling', '{"Best Selling"}', 'https://backoffice.ghorerbazar.com/productImages/PpKUt1767012456.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767012456dvhNF.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767012456XA242.jpg', '{"https://backoffice.ghorerbazar.com/productImages/PpKUt1767012456.jpg","https://backoffice.ghorerbazar.com/productImages/1767012456dvhNF.jpg","https://backoffice.ghorerbazar.com/productImages/1767012456XA242.jpg"}', NULL, 'Experience the authentic taste of tradition with Shosti Pure Cow Ghee, sourced from the renowned Pabna region of Bangladesh. Crafted by skilled artisans with generations of expertise, our ghee is prepared with utmost care—bringing you purity, nutrition, and rich flavor in every spoonful.

Key Features

100% Pure & Natural Cow Ghee

Made with traditional methods from fresh milk

Rich in vitamins A, D, E & K for overall wellness

Contains CLA & Butyric Acid—supports digestion, immunity & heart health

Perfect for polao, biryani, bharta, or simply with hot rice

Airtight glass jar packaging ensures freshness & long shelf life

Usage & Storage

Use as a cooking ingredient, natural health booster, or flavor enhancer.

Store in a cool, dry place in an airtight container.

No refrigeration required if kept sealed.

Always use a clean, dry spoon.', true),
  ('gawa-ghee-200gm', 'Gawa Ghee 200gm', 'Oil & Ghee', NULL, 'GhorerBazar', 360, NULL, 'New Arrival', '{"New Arrival"}', 'https://backoffice.ghorerbazar.com/productImages/RH0a31767012545.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767012545GXJXl.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767012545d68FC.jpg', '{"https://backoffice.ghorerbazar.com/productImages/RH0a31767012545.jpg","https://backoffice.ghorerbazar.com/productImages/1767012545GXJXl.jpg","https://backoffice.ghorerbazar.com/productImages/1767012545d68FC.jpg"}', NULL, 'Experience the authentic taste of tradition with Shosti Pure Cow Ghee, sourced from the renowned Pabna region of Bangladesh. Crafted by skilled artisans with generations of expertise, our ghee is prepared with utmost care—bringing you purity, nutrition, and rich flavor in every spoonful.

Key Features

100% Pure & Natural Cow Ghee

Made with traditional methods from fresh milk

Rich in vitamins A, D, E & K for overall wellness

Contains CLA & Butyric Acid—supports digestion, immunity & heart health

Perfect for polao, biryani, bharta, or simply with hot rice

Airtight glass jar packaging ensures freshness & long shelf life

Usage & Storage

Use as a cooking ingredient, natural health booster, or flavor enhancer.

Store in a cool, dry place in an airtight container.

No refrigeration required if kept sealed.

Always use a clean, dry spoon.', true),
  ('sundarban-honey-250gm', 'Sundarban Honey 250gm', 'Honey', NULL, 'Honeyraj', 625, NULL, 'New Arrival', '{"New Arrival"}', 'https://backoffice.ghorerbazar.com/productImages/wPcmU1767418820.jpg', 'https://backoffice.ghorerbazar.com/productImages/1766989915hRKJr.jpg', 'https://backoffice.ghorerbazar.com/productImages/1766989915PdMZu.jpg', '{"https://backoffice.ghorerbazar.com/productImages/wPcmU1767418820.jpg","https://backoffice.ghorerbazar.com/productImages/1766989915hRKJr.jpg","https://backoffice.ghorerbazar.com/productImages/1766989915PdMZu.jpg"}', NULL, 'Sourced from the world’s largest mangrove forest, the Sundarbans, this honey is 100% natural and pure. The nectar is collected by bees from diverse wildflowers such as Khalsi, Keora, Bain, Garan, Geoa, and Sundari, giving Sundarban honey its unique taste, color, and exceptional qualities. No chemicals or artificial preservatives are used in this honey. Its color may range from golden to deep brown, and its thickness varies naturally depending on the season and floral sources.

**Benefits:**
Boosts immunity – Rich in antioxidants that protect the body from infections.
Effective for cough and sore throat – Natural anti-inflammatory properties soothe the throat.
Improves digestion – Enzyme-rich honey supports the digestive system.
Natural source of energy – Glucose and fructose provide instant energy.
Beneficial for skin and hair – Vitamins and minerals enhance skin radiance and strengthen hair.
Supports heart health – Regular consumption improves blood circulation and reduces the risk of heart disease.
Helps manage diabetes – In moderation, it supports blood sugar regulation.
Promotes wound healing – Acts as a natural antiseptic to aid faster recovery.

**Country of Origin: Sundarban (Bangladesh)**', true),
  ('masoor-dal-1kg', 'Masoor Dal 1 Kg', 'Flours & Lentils', NULL, 'GhorerBazar', 170, NULL, 'New Arrival', '{"New Arrival"}', 'https://backoffice.ghorerbazar.com/productImages/lcmXO1767438477.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767438477Qg4kM.jpg', 'https://backoffice.ghorerbazar.com/productImages/17674384771Dy8G.jpg', '{"https://backoffice.ghorerbazar.com/productImages/lcmXO1767438477.jpg","https://backoffice.ghorerbazar.com/productImages/1767438477Qg4kM.jpg","https://backoffice.ghorerbazar.com/productImages/17674384771Dy8G.jpg"}', NULL, NULL, true),
  ('sukkari-mufattal-malaki-dates-1kg', 'Sukkari Mufattal Malaki Dates 1kg', 'Dates', NULL, 'Khejuri', 1500, 1350, 'Offered Items', '{"Offered Items"}', 'https://backoffice.ghorerbazar.com/productImages/VpK6Q1776762386.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767443187i4qdE.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767443187hjO7G.jpg', '{"https://backoffice.ghorerbazar.com/productImages/VpK6Q1776762386.jpg","https://backoffice.ghorerbazar.com/productImages/1767443187i4qdE.jpg","https://backoffice.ghorerbazar.com/productImages/1767443187hjO7G.jpg"}', NULL, '**Saudi Premium Sukkari Mufattal Malaki Dates – Naturally Sweet & Soft**

**Sukkari Mufattal Malaki dates** from Saudi Arabia are **premium quality and traditionally cultivated** , offering a unique taste and exceptional quality. Naturally sweet, soft, and juicy, these dates **melt in your mouth** , making them an ideal daily nutritious snack. Carefully selected from high-quality farms, they are perfect for meeting your daily energy and nutrition needs.

Key Features:

**Origin:** Saudi Arabia

**Taste:** Extremely sweet and mild

**Texture:** Soft, juicy, and aromatic

**Processing:** Naturally processed with **no artificial additives**

**Usage:** Ideal for **Iftar, snacking, or gifting**

Nutritional Benefits:

Rich in **natural sugars, fiber, vitamins, and minerals**

Provides **instant energy**

Supports **digestion**

Helps keep the body **active and refreshed**

How to Use:

Eat **directly as a snack**

Add to **milk, smoothies, or desserts**

Perfect as a **gift pack**

Storage Instructions:

Store in a **cool, dry place**

Use **airtight containers** to maintain freshness for longer periods

**Enjoy the natural sweetness and nutrition of premium Sukkari dates every day!**', true),
  ('black-seed-honey-250g', 'Black Seed Honey 250g', 'Honey', NULL, 'Honeyraj', 400, NULL, 'New Arrival', '{"New Arrival"}', 'https://backoffice.ghorerbazar.com/productImages/4mXh51767258754.jpg', 'https://backoffice.ghorerbazar.com/productImages/17672587547oaCM.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767258754yc6W6.jpg', '{"https://backoffice.ghorerbazar.com/productImages/4mXh51767258754.jpg","https://backoffice.ghorerbazar.com/productImages/17672587547oaCM.jpg","https://backoffice.ghorerbazar.com/productImages/1767258754yc6W6.jpg"}', NULL, 'Black Seed Honey is a unique and premium-quality honey collected by bees from the nectar of Nigella sativa flowers. Known for its strong taste, aroma, color, and remarkable health benefits, it is also called “Black Seed Honey.” Produced in small batches, it preserves its natural richness and purity.

**Nutritional & Health Benefits:**

-Boosts immunity
-Supports digestion, relieves acidity & constipation
-Provides energy and improves sleep quality
-Effective for cold, cough & sore throat
-Beneficial for skin and beauty care

**Storage:** Store in a cool, dry place. Keep away from direct sunlight and do not refrigerate.', true),
  ('shahi-masala-250gm', 'Shahi Masala 250gm', 'Spices', NULL, 'GhorerBazar', 750, 700, 'Offered Items', '{"Offered Items"}', 'https://backoffice.ghorerbazar.com/productImages/aSOoS1767779077.jpg', NULL, NULL, '{"https://backoffice.ghorerbazar.com/productImages/aSOoS1767779077.jpg"}', NULL, '**Shahi Masala – Royal Flavor in Every Dish**

Bring **royal taste** to any dish with just one spice – **Ghorerbazar’s Shahi Masala** . Made from the finest handpicked spices in a hygienic environment, this masala blends sweet cumin, coriander, cloves, cardamom, cinnamon, nutmeg, mace, kababchini, bay leaf, royal cumin, red basil, ginger, black pepper, white pepper, star anise, poppy seeds, premium cardamom, cumin, and 19 other select ingredients. The result is a rich, authentic taste reminiscent of freshly ground masalas.

Cooking is no longer a worry – every meal becomes **easy and flavorful** . From Tehari to Kacchi Biryani, fish to meat dishes, **Shahi Masala** ensures the perfect taste in every recipe. Ghorerbazar’s Shahi Masala is the **all-rounder of spices** .

**Ingredients (19 in total):**

Sweet cumin

Coriander

Cloves

Cardamom

Cinnamon

Nutmeg

Mace

Kababchini

Bay leaf

Royal cumin

Red basil

Ginger

Black pepper

White pepper

Star anise

Poppy seeds

Premium cardamom

Cumin

And more select spices

**Why Choose Ghorerbazar Shahi Masala:**

One masala for **all types of cooking** – Kacchi, Mezban, Kalabhuna, or Jhol dishes

**Quick and easy solution** for everyday meals

Just one spoon of this masala makes your dish **special and aromatic**

All essential ingredients for special cooking **blended perfectly in one masala**

Elevate your daily cooking with **Ghorerbazar Shahi Masala** – the ultimate spice for rich, royal flavor!', true),
  ('black-garlic-500gm', 'Black Garlic 500gm', 'Functional Food', NULL, 'Glarvest', 1500, 1400, 'Offered Items', '{"Offered Items"}', 'https://backoffice.ghorerbazar.com/productImages/Dw3b71767608178.jpg', 'https://backoffice.ghorerbazar.com/productImages/176751335835x1i.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767608178xgOR0.jpg', '{"https://backoffice.ghorerbazar.com/productImages/Dw3b71767608178.jpg","https://backoffice.ghorerbazar.com/productImages/176751335835x1i.jpg","https://backoffice.ghorerbazar.com/productImages/1767608178xgOR0.jpg"}', NULL, 'Black Garlic is a special food ingredient made by fermenting fresh white garlic under controlled temperature (60–90°C) and humidity (80–90%) for about 40–60 days. During this long aging process, the garlic undergoes the Maillard reaction, which turns the cloves black and transforms their taste into a sweet, tangy, soft, and slightly fruity flavor. The pungency and strong odor of raw garlic are greatly reduced, making black garlic much easier to digest for those who find fresh garlic harsh on the stomach.

Like fresh garlic, black garlic is also believed to have numerous health benefits. In fact, it contains significantly higher levels of antioxidants compared to raw garlic. Antioxidants are compounds that protect our cells from the harmful effects of free radicals.

Key Benefits of Black Garlic:
Heart Health – Helps regulate blood pressure, lowers bad cholesterol (LDL), and increases good cholesterol (HDL).
Rich in Antioxidants – Neutralizes free radicals, protects cells, and delays aging.
Diabetes Management – Stabilizes blood sugar levels and improves insulin efficiency.
Cancer Prevention – May help inhibit abnormal cell growth and reduce tumor risk.
Boosts Immunity – Protects against viral, bacterial, and fungal infections.
Liver Detoxification – Flushes out toxins and supports liver health.
Anti-Inflammatory Properties – Reduces inflammation, joint pain, and arthritis symptoms.
Brain Health – Supports memory and cognitive function with neuroprotective effects.
Skin & Hair Care – Enhances skin radiance and helps reduce hair loss.
Energy & Endurance – Acts as a natural energy booster, reducing fatigue and improving stamina.

**Country Origin: China**', true),
  ('almond-250g', 'Almond 250g', 'Nuts & Seeds', NULL, 'Shosti food', 400, NULL, 'Best Selling', '{"Best Selling"}', 'https://backoffice.ghorerbazar.com/productImages/tdtHB1767096113.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767096113UY5yu.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767096113kjlAS.jpg', '{"https://backoffice.ghorerbazar.com/productImages/tdtHB1767096113.jpg","https://backoffice.ghorerbazar.com/productImages/1767096113UY5yu.jpg","https://backoffice.ghorerbazar.com/productImages/1767096113kjlAS.jpg"}', NULL, 'Almonds, one of the world’s most popular and nutritious nuts, are rich in vitamins, minerals, and antioxidants that offer numerous health benefits. Their naturally sweet taste and impressive nutritional profile have made almonds an ideal snack and a widely used food ingredient.

Health Benefits of Almonds

Rich in Nutrients:
Almonds are packed with essential vitamins, minerals, and healthy fats, including Vitamin E, magnesium, and dietary fiber.

Supports Heart Health:
The monounsaturated fats in almonds help lower bad cholesterol levels, reducing the risk of heart disease.

Helps in Weight Management:
Almonds are high in protein and fiber, promoting fullness and helping to control weight.

Boosts Brain Function:
The Vitamin E in almonds may improve brain performance and help prevent age-related memory decline.

Strengthens Bones:
Almonds contain high levels of magnesium and calcium, both of which support strong and healthy bones.

Helps Control Blood Sugar:
Almonds help regulate blood sugar levels, making them beneficial for individuals with diabetes.

Improves Skin Health:
The antioxidants in almonds, especially Vitamin E, protect the skin from oxidative damage and promote a healthy, glowing complexion.

Supports Digestion:
The fiber in almonds supports healthy digestion and helps prevent constipation.

Boosts Immunity:
Almonds are rich in antioxidants that strengthen the immune system and help the body fight infections.

Ways to Use Almonds

As a Snack:
Almonds can be eaten on their own as a healthy snack, providing energy and nutrition.

In Smoothies:
Adding almonds to smoothies enhances their texture and nutritional value.

In Baking:
Almonds are commonly used in baking—cakes, cookies, muffins, and bread—for added flavor and crunch.

In Salads:
Sliced or chopped almonds can be sprinkled over salads for extra crunch and nutrients.

Almond Milk:
Almonds are used to make almond milk, a popular dairy-free milk alternative.

In Cooking:
Almonds are often used in savory dishes such as curries or rice recipes to add a nutty flavor.

Nut Butter:
Processed almonds are turned into almond butter—a creamy, nutritious spread for toast or sandwiches.

As a Garnish:
Almonds are used as a garnish for a variety of dishes, from desserts to main courses, enhancing both flavor and presentation.

Skin & Hair Care:
Almond oil is widely used in skincare products for its moisturizing and nourishing properties.

How to Store Almonds

Keep in a Cool, Dry Place:
Store almonds in a cool, dry place to maintain their quality. Heat and moisture can spoil them.

Use an Airtight Container:
To preserve freshness, store almonds in an airtight container to prevent airflow and moisture from getting in.', true),
  ('ajwa-premium-dates-large-1kg', 'Ajwa Premium Dates Large 1kg', 'Dates', NULL, 'Khejuri', 2200, 1980, 'Offered Items', '{"Offered Items"}', 'https://backoffice.ghorerbazar.com/productImages/brZpn1776762573.webp', 'https://backoffice.ghorerbazar.com/productImages/1767097262gksUj.jpg', 'https://backoffice.ghorerbazar.com/productImages/1776762573OOtvY.webp', '{"https://backoffice.ghorerbazar.com/productImages/brZpn1776762573.webp","https://backoffice.ghorerbazar.com/productImages/1767097262gksUj.jpg","https://backoffice.ghorerbazar.com/productImages/1776762573OOtvY.webp"}', NULL, 'Ajwa Premium Dates are carefully sourced from the sacred city of Al Madinah in Saudi Arabia, a region celebrated for cultivating the world’s finest dates. Each Ajwa date is meticulously hand-picked at the perfect stage of ripeness to ensure superior quality, uniform size, and a naturally deep, dark brown to black hue. These dates are 100% natural and free from any artificial colors, flavors, or preservatives, retaining their authentic taste and rich nutritional goodness. With a soft yet firm texture and a mildly sweet, fruity flavor, Ajwa Dates provide a truly delightful and wholesome experience. Whether enjoyed as a healthy snack, presented as a thoughtful gift, or served during special occasions such as Ramadan, their distinctive taste and quality make them stand out. Versatile in use, Ajwa Dates can also be added to desserts, smoothies, salads, or energy mixes for a natural touch of sweetness and nourishment.

Nutritional Benefits:
Rich in Dietary Fibre – Supports healthy digestion and helps maintain bowel regularity.
High in Natural Energy – Contains natural sugars like glucose, fructose, and sucrose that provide an instant energy boost.
Packed with Essential Minerals – A good source of potassium, magnesium, calcium, and iron for overall body function and vitality.
Loaded with Antioxidants – Helps protect cells from oxidative stress and supports heart health.
Promotes Bone Strength – The presence of minerals such as calcium and phosphorus contribute to strong and healthy bones.
Supports Heart Health – Low in fat and cholesterol-free, Ajwa Dates aid in maintaining healthy cholesterol levels.
Boosts Immunity – Natural nutrients, vitamins, and antioxidants enhance the body’s immune defense system.
Improves Brain Function – Rich in natural compounds that may help enhance memory and cognitive performance.', true),
  ('turmeric-holud-powder-500g', 'Turmeric (Holud) Powder 500g', 'Spices', NULL, 'GhorerBazar', 295, NULL, 'New Arrival', '{"New Arrival"}', 'https://backoffice.ghorerbazar.com/productImages/GuI2U1767262030.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767262030FxDSb.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767262030p0gVi.jpg', '{"https://backoffice.ghorerbazar.com/productImages/GuI2U1767262030.jpg","https://backoffice.ghorerbazar.com/productImages/1767262030FxDSb.jpg","https://backoffice.ghorerbazar.com/productImages/1767262030p0gVi.jpg"}', NULL, 'Ghorer Bazar Turmeric Powder is made from the finest quality Binni Turmeric, naturally grown in the hilly regions of Bangladesh. Sun-dried, carefully processed, bottled, and packed under strict supervision, this pure turmeric contains no artificial colors, chemicals, or preservatives. Its natural golden color and unique aroma bring a truly authentic taste to every dish.

**Benefits:**

-Turmeric Powder is extremely healthy.
-Turmeric Powder contains curcumin with strong medicinal properties, which helps in weight loss.
-Turmeric Powder boosts metabolism and prevents fat accumulation, thereby reducing the risk of obesity.
-Turmeric Powder enhances skin beauty, prevents acne, and also helps reduce dandruff.
-Turmeric Powder controls excess oil on the face.
-Turmeric Powder alleviates digestive problems.
-Turmeric improves the efficiency of the digestive system and reduces excess gastric acid in the stomach.
-In addition, turmeric contains anti-inflammatory compounds that help reduce arthritis pain and protect bone cells.', true),
  ('natural-honeycomb-450g', 'Natural Honeycomb- 450g', 'Honey', NULL, 'Honeyraj', 1200, NULL, 'New Arrival', '{"New Arrival"}', 'https://backoffice.ghorerbazar.com/productImages/mSAej1767532120.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767532120r0n04.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767532120QnuFx.jpg', '{"https://backoffice.ghorerbazar.com/productImages/mSAej1767532120.jpg","https://backoffice.ghorerbazar.com/productImages/1767532120r0n04.jpg","https://backoffice.ghorerbazar.com/productImages/1767532120QnuFx.jpg"}', NULL, 'Honeycomb is essentially honey with a yellowish-brown wax comb. When you chew and eat the entire comb—along with the natural honey inside—just like chocolate, you get the purest, freshest taste of honey. If one were to name the world’s most delicious and sweetest food, “honey” would surely come first. The aroma, taste, and nutritional qualities found in this completely natural honey are present in a richness rarely found elsewhere. Because honey is inherently healthy and highly beneficial for the body, Ghorer Bazar brings you the traditional **Honeycomb** .

Collected from the deep forests of distant China, this honeycomb has made the world of honey truly exceptional. An irresistible taste combined with authentic Chinese honey comes together in this honeycomb. In terms of purity, it stands far ahead of all others.

Consuming this honey regularly helps prevent sudden weakness and reduces feelings of fatigue in the body. Chinese honey with comb—also known as China honeycomb—is truly a masterpiece of nature. Produced in the vast, natural forests of China, rich in heritage and diversity, this honey is unique in its qualities. According to nutritionists, many physical problems and ailments can be addressed with this honey, and it is considered a strong support for good health. For example:

Helps boost immunity when consumed regularly

Helps improve blood circulation

Helps reduce skin blemishes

Helps improve digestion

Helps keep the body energetic and lively

Since this honeycomb is quite sweet (intensely sweet), it should be consumed in very small amounts. Doing so will help you stay healthy. Otherwise, consuming it in excess may cause physical reactions.', true),
  ('safawikalmi-dates-a-grade-500g', 'Safawi/kalmi Dates (A Grade) 500g', 'Dates', NULL, 'Khejuri', 700, 665, 'Offered Items', '{"Offered Items"}', 'https://backoffice.ghorerbazar.com/productImages/lLEg51774852853.jpeg', 'https://backoffice.ghorerbazar.com/productImages/1772361818dalwi.jpg', NULL, '{"https://backoffice.ghorerbazar.com/productImages/lLEg51774852853.jpeg","https://backoffice.ghorerbazar.com/productImages/1772361818dalwi.jpg"}', NULL, 'Premium Kalmi (Safawi) Dates from Madinah, Saudi Arabia
Renowned for their superior quality, Madinah’s Kalmi (Safawi) dates are unmatched in taste, nutrition, and quality. With their deep dark color, soft yet slightly chewy texture, and perfectly balanced natural sweetness, these dates are recognized as some of the most popular in the world.

**Key Features:**

Origin: Madinah, Saudi Arabia

Taste: Naturally sweet, perfectly balanced

Color & Size: Deep dark brown, medium-sized

Nature: Naturally prepared, no artificial additives

Ideal for: Iftar, following Sunnah, and daily consumption

**Nutritional Benefits:**
Kalmi/Safawi dates are rich in fiber, natural sugars, iron, potassium, and antioxidants. They provide energy, aid digestion, and help maintain overall health.

**Ways to Enjoy:**

Eat on an empty stomach for Iftar

As a healthy snack or light breakfast

Add to milk, smoothies, or desserts

Perfect for gifting or charity

**Storage Instructions:**
Keep in a cool, dry place. For long-lasting freshness, store in an airtight container or in the refrigerator.', true),
  ('egyptian-medjool-medium-1kg', 'Egyptian Medjool Medium 1kg', 'Dates', NULL, 'Khejuri', 2000, 1810, 'Offered Items', '{"Offered Items"}', 'https://backoffice.ghorerbazar.com/productImages/MrMvb1767439554.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767439554rel7F.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767608240Ixly1.jpg', '{"https://backoffice.ghorerbazar.com/productImages/MrMvb1767439554.jpg","https://backoffice.ghorerbazar.com/productImages/1767439554rel7F.jpg","https://backoffice.ghorerbazar.com/productImages/1767608240Ixly1.jpg"}', NULL, 'Grown in the fertile lands of the Middle East, Ghorer Bazar Medjool Dates are premium-quality, naturally sweet, and delightfully soft. Known as the "King of Dates," Medjool dates are rich in fiber, potassium, and essential nutrients—making them a healthy alternative to refined sugar and an ideal natural energy booster.

**Key Features:**

-Large, plump, and juicy Medjool dates
-Naturally sweet with a rich caramel-like flavor
-Excellent source of dietary fiber, potassium, magnesium & antioxidants
-100% natural, with no preservatives or added sugar
-Perfect for snacking, baking, or adding to smoothies & desserts

**Usage Ideas:**

-Enjoy as a wholesome snack anytime
-Stuff with nuts or cheese for a gourmet delight
-Blend into smoothies, shakes, or energy bars
-Use as a natural sweetener in baking and cooking', true),
  ('ajwa-premium-dates-500g-large', 'Ajwa Premium Dates 500g (Large)', 'Dates', NULL, 'Khejuri', 1100, NULL, 'New Arrival', '{"New Arrival"}', 'https://backoffice.ghorerbazar.com/productImages/3VEFg1771303741.webp', 'https://backoffice.ghorerbazar.com/productImages/1771303741sw4j7.webp', 'https://backoffice.ghorerbazar.com/productImages/1771303741w4ycE.webp', '{"https://backoffice.ghorerbazar.com/productImages/3VEFg1771303741.webp","https://backoffice.ghorerbazar.com/productImages/1771303741sw4j7.webp","https://backoffice.ghorerbazar.com/productImages/1771303741w4ycE.webp"}', NULL, 'Ajwa Premium Dates are carefully sourced from the sacred city of Al Madinah in Saudi Arabia, a region celebrated for cultivating the world’s finest dates. Each Ajwa date is meticulously hand-picked at the perfect stage of ripeness to ensure superior quality, uniform size, and a naturally deep, dark brown to black hue. These dates are 100% natural and free from any artificial colors, flavors, or preservatives, retaining their authentic taste and rich nutritional goodness. With a soft yet firm texture and a mildly sweet, fruity flavor, Ajwa Dates provide a truly delightful and wholesome experience. Whether enjoyed as a healthy snack, presented as a thoughtful gift, or served during special occasions such as Ramadan, their distinctive taste and quality make them stand out. Versatile in use, Ajwa Dates can also be added to desserts, smoothies, salads, or energy mixes for a natural touch of sweetness and nourishment.

Nutritional Benefits:
Rich in Dietary Fibre – Supports healthy digestion and helps maintain bowel regularity.
High in Natural Energy – Contains natural sugars like glucose, fructose, and sucrose that provide an instant energy boost.
Packed with Essential Minerals – A good source of potassium, magnesium, calcium, and iron for overall body function and vitality.
Loaded with Antioxidants – Helps protect cells from oxidative stress and supports heart health.
Promotes Bone Strength – The presence of minerals such as calcium and phosphorus contribute to strong and healthy bones.
Supports Heart Health – Low in fat and cholesterol-free, Ajwa Dates aid in maintaining healthy cholesterol levels.
Boosts Immunity – Natural nutrients, vitamins, and antioxidants enhance the body’s immune defense system.
Improves Brain Function – Rich in natural compounds that may help enhance memory and cognitive performance.', true),
  ('shahi-masala-500gm', 'Shahi Masala 500gm', 'Spices', NULL, 'GhorerBazar', 1500, 1400, 'Offered Items', '{"Offered Items"}', 'https://backoffice.ghorerbazar.com/productImages/TrEmJ1767101265.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767101265jk1dr.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767101265W2gAn.jpg', '{"https://backoffice.ghorerbazar.com/productImages/TrEmJ1767101265.jpg","https://backoffice.ghorerbazar.com/productImages/1767101265jk1dr.jpg","https://backoffice.ghorerbazar.com/productImages/1767101265W2gAn.jpg"}', NULL, '**Shahi Masala – Royal Flavor in Every Dish**

Bring **royal taste** to any dish with just one spice – **Ghorerbazar’s Shahi Masala** . Made from the finest handpicked spices in a hygienic environment, this masala blends sweet cumin, coriander, cloves, cardamom, cinnamon, nutmeg, mace, kababchini, bay leaf, royal cumin, red basil, ginger, black pepper, white pepper, star anise, poppy seeds, premium cardamom, cumin, and 19 other select ingredients. The result is a rich, authentic taste reminiscent of freshly ground masalas.

Cooking is no longer a worry – every meal becomes **easy and flavorful** . From Tehari to Kacchi Biryani, fish to meat dishes, **Shahi Masala** ensures the perfect taste in every recipe. Ghorerbazar’s Shahi Masala is the **all-rounder of spices** .

**Ingredients (19 in total):**

Sweet cumin

Coriander

Cloves

Cardamom

Cinnamon

Nutmeg

Mace

Kababchini

Bay leaf

Royal cumin

Red basil

Ginger

Black pepper

White pepper

Star anise

Poppy seeds

Premium cardamom

Cumin

And more select spices

**Why Choose Ghorerbazar Shahi Masala:**

One masala for **all types of cooking** – Kacchi, Mezban, Kalabhuna, or Jhol dishes

**Quick and easy solution** for everyday meals

Just one spoon of this masala makes your dish **special and aromatic**

All essential ingredients for special cooking **blended perfectly in one masala**

Elevate your daily cooking with **Ghorerbazar Shahi Masala** – the ultimate spice for rich, royal flavor!', true),
  ('egyptian-medjool-dates-1kg-jumbo', 'Egyptian Medjool Dates 1kg (Jumbo)', 'Dates', NULL, 'Khejuri', 2500, 2200, 'Offered Items', '{"Offered Items"}', 'https://backoffice.ghorerbazar.com/productImages/ecZQt1767074219.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767608261fvsow.jpg', NULL, '{"https://backoffice.ghorerbazar.com/productImages/ecZQt1767074219.jpg","https://backoffice.ghorerbazar.com/productImages/1767608261fvsow.jpg"}', NULL, 'Grown in the fertile lands of the Middle East, Ghorer Bazar Medjool Dates are premium-quality, naturally sweet, and delightfully soft. Known as the **"King of Dates"** Medjool dates are rich in fiber, potassium, and essential nutrients—making them a healthy alternative to refined sugar and an ideal natural energy booster.

**Key Features:**
Large, plump, and juicy Medjool dates.
Naturally sweet with a rich caramel-like flavor.
Excellent source of dietary fiber, potassium, magnesium & antioxidants.
100% natural, with no preservatives or added sugar.
Perfect for snacking, baking, or adding to smoothies & desserts.

**Usage Ideas:**
Enjoy as a wholesome snack anytime.
Stuff with nuts or cheese for a gourmet delight.
Blend into smoothies, shakes, or energy bars.
Use as a natural sweetener in baking and cooking.', true),
  ('egyptian-medjool-dates-1-kg-super-jumbo', 'Egyptian Medjool Dates – 1 kg (Super Jumbo)', 'Dates', NULL, 'Khejuri', 2700, 2430, 'Offered Items', '{"Offered Items"}', 'https://backoffice.ghorerbazar.com/productImages/Uek0c1770272989.jpg', 'https://backoffice.ghorerbazar.com/productImages/1770272989mDbnL.jpg', 'https://backoffice.ghorerbazar.com/productImages/1770272989vygLJ.jpg', '{"https://backoffice.ghorerbazar.com/productImages/Uek0c1770272989.jpg","https://backoffice.ghorerbazar.com/productImages/1770272989mDbnL.jpg","https://backoffice.ghorerbazar.com/productImages/1770272989vygLJ.jpg"}', NULL, '**Egyptian Medjool Dates**

Medjool dates are known as the “king of dates.” They are one of the oldest cultivated fruits in the world. The origin of Medjool dates is in North Africa, possibly Morocco, where they were once reserved exclusively for royal families. Medjool dates are large in size, have juicy flesh, and are naturally sweet with a caramel-like flavor. Because of these qualities, they are highly valued worldwide.

Dates are not only delicious but also packed with health benefits. That’s why health-conscious people consider dates a superfood. For those who prefer to avoid processed sugar or sweets, dates are an excellent natural alternative. There are nearly 3,000 varieties of dates around the world. Dates contain carbohydrates, fiber, protein, vitamin B, vitamin K, calcium, iron, magnesium, potassium, zinc, manganese, and many other essential nutrients.

You can include dates in your daily diet. Dates are rich in iron and can be eaten every day. If you eat at least two dates daily, many diseases will stay far away. According to nutritionists, dates contain almost all the iron the body needs.

**Benefits of Dates:**

Dates are good for blood vessels. Eating dates helps keep arteries clean and ensures smooth blood circulation, reducing the risk of heart disease and stroke.

Dates are rich in vitamins, minerals, calcium, and potassium. The antioxidants in dates boost the body’s immune system.

Research shows that regular consumption of an adequate amount of dates helps keep the liver healthy and strong.

Dates contain vitamin A, which is very beneficial for eye health. Vitamin A keeps the cornea healthy. Dates also contain lutein and zeaxanthin, which protect the eyes.

Each date contains about 20–25 mg of magnesium, which helps reduce high blood pressure.

People suffering from anemia can eat dates daily. Dates fulfill about 11% of the daily iron requirement of a healthy person.

Dates help prevent indigestion. They relieve constipation and heartburn. The amino acids and fiber in dates aid digestion.

Dates act as a natural remedy for anemia. Being rich in iron, they help replenish iron deficiency and protect against anemia.

The lutein and zeaxanthin in dates help maintain a healthy retina.

Regular consumption of dates helps prevent dry skin and relieves various skin problems. Dates are also beneficial in controlling skin wrinkles.

Dates fulfill nearly 11% of a healthy person’s daily iron requirement, which is why they can be eaten every day.', true),
  ('natural-honeycomb-1kg', 'Natural Honeycomb- 1kg', 'Honey', NULL, 'Honeyraj', 2500, 2250, 'Offered Items', '{"Offered Items"}', 'https://backoffice.ghorerbazar.com/productImages/8ZFYk1767532058.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767532058Gjbbr.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767532058pDqe9.jpg', '{"https://backoffice.ghorerbazar.com/productImages/8ZFYk1767532058.jpg","https://backoffice.ghorerbazar.com/productImages/1767532058Gjbbr.jpg","https://backoffice.ghorerbazar.com/productImages/1767532058pDqe9.jpg"}', NULL, 'Honeycomb is essentially honey with a yellowish-brown wax comb. When you chew and eat the entire comb—along with the natural honey inside—just like chocolate, you get the purest, freshest taste of honey. If one were to name the world’s most delicious and sweetest food, “honey” would surely come first. The aroma, taste, and nutritional qualities found in this completely natural honey are present in a richness rarely found elsewhere. Because honey is inherently healthy and highly beneficial for the body, Ghorer Bazar brings you the traditional **Honeycomb** .

Collected from the deep forests of distant China, this honeycomb has made the world of honey truly exceptional. An irresistible taste combined with authentic Chinese honey comes together in this honeycomb. In terms of purity, it stands far ahead of all others.

Consuming this honey regularly helps prevent sudden weakness and reduces feelings of fatigue in the body. Chinese honey with comb—also known as China honeycomb—is truly a masterpiece of nature. Produced in the vast, natural forests of China, rich in heritage and diversity, this honey is unique in its qualities. According to nutritionists, many physical problems and ailments can be addressed with this honey, and it is considered a strong support for good health. For example:

Helps boost immunity when consumed regularly

Helps improve blood circulation

Helps reduce skin blemishes

Helps improve digestion

Helps keep the body energetic and lively

Since this honeycomb is quite sweet (intensely sweet), it should be consumed in very small amounts. Doing so will help you stay healthy. Otherwise, consuming it in excess may cause physical reactions.', true),
  ('black-cumin-kalojira-500gm', 'Black Cumin (Kalojira) 500gm', 'Nuts & Seeds', NULL, 'GhorerBazar', 500, NULL, 'New Arrival', '{"New Arrival"}', 'https://backoffice.ghorerbazar.com/productImages/zG2Lz1767441659.jpg', 'https://backoffice.ghorerbazar.com/productImages/17674416594cl2L.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767441659h8quK.jpg', '{"https://backoffice.ghorerbazar.com/productImages/zG2Lz1767441659.jpg","https://backoffice.ghorerbazar.com/productImages/17674416594cl2L.jpg","https://backoffice.ghorerbazar.com/productImages/1767441659h8quK.jpg"}', NULL, '**Black Cumin Seeds (Kalojira) – The Universal Remedy**

**Black cumin (Kalojira)** has been valued since ancient times as a preventive and protective remedy for various ailments. Each gram of black cumin contains essential nutrients such as **protein, vitamin B, niacin, calcium, iron, phosphorus, copper, zinc, and folacin** .

Widely used in **Ayurvedic, Unani, traditional herbal, and folk medicine** , black cumin is one of Bangladesh’s important minor spice crops. Originally from the **Eastern Mediterranean region** , this medicinal plant is extensively used across **South and Southeast Asia** . Black cumin is typically added to foods as a tempering spice and is also used to enhance the flavor and aroma of beverages.

Health Benefits of Black Cumin:

**Supports overall vitality:** Regular consumption keeps all body organs refreshed and active.

**Boosts immunity:** Strengthens the body’s natural defense system.

**Helps manage diabetes:** Lowers blood glucose levels in diabetic patients.

**Enhances memory and cognitive function.**

**Relieves headaches.**

**Reduces joint pain and arthritis discomfort.**

**Supports heart health.**

**Helps relieve bronchitis, asthma, and cough.**

Black cumin’s **immunity-boosting properties are unparalleled** , present in both its seeds and oil. Using black cumin seeds or oil **regularly enhances the body’s resistance to disease** and helps maintain overall wellness.', true),
  ('honeyraj-mixed-flower-honey-with-honeycomb-250g', 'Mixed Flower Honey with Comb 250g', 'Honey', NULL, 'Honeyraj', 500, 375, 'Offered Items', '{"Offered Items"}', 'https://backoffice.ghorerbazar.com/productImages/XCftg1767531570.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767531570vzaku.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767531570tN4Qu.jpg', '{"https://backoffice.ghorerbazar.com/productImages/XCftg1767531570.jpg","https://backoffice.ghorerbazar.com/productImages/1767531570vzaku.jpg","https://backoffice.ghorerbazar.com/productImages/1767531570tN4Qu.jpg"}', NULL, 'Honeyraj Mixed Flower Honey with Honeycomb 500gm', true),
  ('cinnamon-200g', 'Cinnamon 200g', 'Spices', NULL, 'Shosti food', 400, NULL, 'New Arrival', '{"New Arrival"}', 'https://backoffice.ghorerbazar.com/productImages/SaUyH1767261091.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767261091iFZCq.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767261091NdjlU.jpg', '{"https://backoffice.ghorerbazar.com/productImages/SaUyH1767261091.jpg","https://backoffice.ghorerbazar.com/productImages/1767261091iFZCq.jpg","https://backoffice.ghorerbazar.com/productImages/1767261091NdjlU.jpg"}', NULL, 'Cinnamon is an exceptionally flavorful spice, treasured worldwide for its distinctive taste. In the Indian subcontinent, the Middle East, Southwest Asia, Africa, and parts of the Mediterranean, it is widely used in spicy and savory dishes. In contrast, in Europe and America, cinnamon is more commonly used to add a unique flavor to sweets and desserts.

Cultivation of cinnamon dates back thousands of years. Historical records show that as early as 2500 BC, it was used as medicine in China. In ancient Egypt, cinnamon was used to prepare remedies for respiratory problems and to preserve meat. By the 17th century, cinnamon had become one of the most profitable spices for the Dutch East India Company, allowing it to dominate kitchens across the world.

**Nutritional Benefits:**

Rich in powerful antioxidants.

Contains potent anti-inflammatory properties.

Fights bacterial and fungal infections.

Helps regulate blood sugar levels.

Supports heart health.

May help prevent memory-related diseases.

Provides relief from arthritis pain.', true),
  ('cashew-nuts-large-size-500gm', 'Cashew Nuts Large Size 500gm', 'Nuts & Seeds', NULL, 'Shosti food', 1150, 1090, 'Offered Items', '{"Offered Items"}', 'https://backoffice.ghorerbazar.com/productImages/hNP4z1767438156.jpg', NULL, NULL, '{"https://backoffice.ghorerbazar.com/productImages/hNP4z1767438156.jpg"}', NULL, 'Nuts are naturally beneficial for the body. Beyond adding flavor to food, the health benefits of nuts can help address a variety of physical problems. And when it comes to cashews, there is no question about their value. Nutritionists say cashews are rich in fiber and essential nutrients such as manganese, phosphorus, zinc, and copper. They also contain Vitamin K, Vitamin B6, and other vital nutrients. This is why cashews can be highly beneficial for those dealing with various health issues or following a diet for weight loss.

**Health Benefits of Cashew Nuts**

Strengthens bones, prevents bone loss, and helps relieve muscle pain.

Helps relieve constipation and supports healthy digestion.

Boosts the body’s immune system.

Improves blood health. Copper deficiency in the blood can lead to iron deficiency, which causes anemia—regular consumption of cashews helps reduce this problem.

The vitamins in cashews keep the skin smooth, reduce signs of aging, and help lighten dark circles under the eyes.

**How to Eat Cashews for Better Benefits**

1. Soaked in Milk Overnight
Soak cashews in milk overnight. Eating cashews soaked in milk helps prevent age-related bone loss. Both cashews and milk contain Vitamin K, minerals, and Vitamin B6, which support strong bone formation.

2. For Constipation Relief
For those suffering from long-term constipation, cashews soaked in milk can be an excellent remedy. Cashews are rich in fiber, which eases constipation and supports digestive health.

3. To Strengthen Immunity
Due to poor food choices, unhealthy lifestyle habits, and environmental changes, our immune system often becomes weak. To strengthen immunity and help the body fight diseases, soaked cashews can be very helpful.

4. For Healthy Blood
Cashews are rich in copper, which helps treat blood-related issues. A lack of copper can lead to iron deficiency and eventually anemia. Eating cashews soaked in milk regularly may help reduce this problem.', true),
  ('natural-honeycomb-1600gm-briefcase', 'Natural Honeycomb-1600gm (Briefcase)', 'Honey', NULL, 'Honeyraj', 4000, 3600, 'Offered Items', '{"Offered Items"}', 'https://backoffice.ghorerbazar.com/productImages/aJbHf1767531809.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767531809x5eJf.jpg', 'https://backoffice.ghorerbazar.com/productImages/17675318096b8Zk.jpg', '{"https://backoffice.ghorerbazar.com/productImages/aJbHf1767531809.jpg","https://backoffice.ghorerbazar.com/productImages/1767531809x5eJf.jpg","https://backoffice.ghorerbazar.com/productImages/17675318096b8Zk.jpg"}', NULL, 'Honeycomb is essentially honey with a yellowish-brown wax comb. When you chew and eat the entire comb—along with the natural honey inside—just like chocolate, you get the purest, freshest taste of honey. If one were to name the world’s most delicious and sweetest food, “honey” would surely come first. The aroma, taste, and nutritional qualities found in this completely natural honey are present in a richness rarely found elsewhere. Because honey is inherently healthy and highly beneficial for the body, Ghorer Bazar brings you the traditional **Honeycomb** .

Collected from the deep forests of distant China, this honeycomb has made the world of honey truly exceptional. An irresistible taste combined with authentic Chinese honey comes together in this honeycomb. In terms of purity, it stands far ahead of all others.

Consuming this honey regularly helps prevent sudden weakness and reduces feelings of fatigue in the body. Chinese honey with comb—also known as China honeycomb—is truly a masterpiece of nature. Produced in the vast, natural forests of China, rich in heritage and diversity, this honey is unique in its qualities. According to nutritionists, many physical problems and ailments can be addressed with this honey, and it is considered a strong support for good health. For example:

Helps boost immunity when consumed regularly

Helps improve blood circulation

Helps reduce skin blemishes

Helps improve digestion

Helps keep the body energetic and lively

Since this honeycomb is quite sweet (intensely sweet), it should be consumed in very small amounts. Doing so will help you stay healthy. Otherwise, consuming it in excess may cause physical reactions.', true),
  ('natural-honeycomb-1800g-briefcase', 'Natural Honeycomb-1800g (Briefcase)', 'Honey', NULL, 'Honeyraj', 4500, 4050, 'Offered Items', '{"Offered Items"}', 'https://backoffice.ghorerbazar.com/productImages/SvuQG1767531952.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767531952n01UV.jpg', 'https://backoffice.ghorerbazar.com/productImages/1767531952ID5v1.jpg', '{"https://backoffice.ghorerbazar.com/productImages/SvuQG1767531952.jpg","https://backoffice.ghorerbazar.com/productImages/1767531952n01UV.jpg","https://backoffice.ghorerbazar.com/productImages/1767531952ID5v1.jpg"}', NULL, 'Honeycomb is essentially honey with a yellowish-brown wax comb. When you chew and eat the entire comb—along with the natural honey inside—just like chocolate, you get the purest, freshest taste of honey. If one were to name the world’s most delicious and sweetest food, “honey” would surely come first. The aroma, taste, and nutritional qualities found in this completely natural honey are present in a richness rarely found elsewhere. Because honey is inherently healthy and highly beneficial for the body, Ghorer Bazar brings you the traditional **Honeycomb** .

Collected from the deep forests of distant China, this honeycomb has made the world of honey truly exceptional. An irresistible taste combined with authentic Chinese honey comes together in this honeycomb. In terms of purity, it stands far ahead of all others.

Consuming this honey regularly helps prevent sudden weakness and reduces feelings of fatigue in the body. Chinese honey with comb—also known as China honeycomb—is truly a masterpiece of nature. Produced in the vast, natural forests of China, rich in heritage and diversity, this honey is unique in its qualities. According to nutritionists, many physical problems and ailments can be addressed with this honey, and it is considered a strong support for good health. For example:

Helps boost immunity when consumed regularly

Helps improve blood circulation

Helps reduce skin blemishes

Helps improve digestion

Helps keep the body energetic and lively

Since this honeycomb is quite sweet (intensely sweet), it should be consumed in very small amounts. Doing so will help you stay healthy. Otherwise, consuming it in excess may cause physical reactions.', true),
  ('glarvest-organic-longjing-green-tea-100gm', 'Glarvest Organic Longjing Green Tea 100gm', 'Beverage', NULL, 'Glarvest', 1400, NULL, 'Best Selling', '{"Best Selling"}', 'https://backoffice.ghorerbazar.com/productImages/N5YD71771491292.png', NULL, NULL, '{"https://backoffice.ghorerbazar.com/productImages/N5YD71771491292.png"}', NULL, 'Glarvest Organic Longjing Green Tea (100 GM) Produced from the Longjing town in China, this tea is known for its particular shape. The leaves are hand-smoothed by pan-frying. This whole proceedings have been monetized by Chinese tea masters who have numerous years of work experience. The leaves go through negligible oxidation. So when it’s steeped in a tea cup, It produces an exquisite yellow-green variety of liquid and an enticing hot smell. Longjing Green Tea is rich in vitamin C and has a high concentration of healthy catching. Health Benefits: * This tea boosts metabolism, burns fat, aids weight loss. * High catching and polyphenol content in this tea reduces cancer risk. * Theanine in tea balances caffeine, easing stress and anxiety. * Tea lowers blood pressure, controls cholesterol and reduces heart disease risk. Brewing Suggestions: * Begin by flushing teacup with hot water. * Take 1 teaspoon of Organic Longjing green tea and spot them in the teacup. * Fill the teacup with water around 175 degrees Fahrenheit. * Let the tea steep for 2 to 3 minutes. * Eliminate the tea leaves and enjoy your cup of tea! Certification: USDA ORGANIC BRC FOOd HACCP Country Origin: China', true)
ON CONFLICT (slug) DO NOTHING;

-- =============================================================
-- DONE. Next steps:
-- 1. Auth > Users > Create admin@ghorerbazar.com user
-- 2. Copy UUID and run:
--    CREATE POLICY 'Admin full access orders'
--      ON orders FOR ALL
--      USING (auth.uid() = 'YOUR-UUID')
--      WITH CHECK (auth.uid() = 'YOUR-UUID');
-- 3. Update .env with your new project VITE_SUPABASE_URL,
--    VITE_SUPABASE_ANON_KEY, VITE_SUPABASE_SERVICE_ROLE_KEY
-- 4. Auth Settings > enable Email OTP
-- =============================================================