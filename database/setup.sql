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

-- Contact Messages (stores contact form submissions)
CREATE TABLE IF NOT EXISTS contact_messages (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  name       text        NOT NULL,
  email      text        NOT NULL,
  phone      text,
  message    text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
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
