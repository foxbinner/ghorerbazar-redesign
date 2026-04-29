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
