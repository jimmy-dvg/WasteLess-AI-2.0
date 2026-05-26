DROP TABLE IF EXISTS taxonomy_category_cleanup_targets;
--> statement-breakpoint
DROP TABLE IF EXISTS taxonomy_label_cleanup_map;
--> statement-breakpoint
DROP TABLE IF EXISTS storage_label_cleanup_map;
--> statement-breakpoint
CREATE TEMP TABLE taxonomy_label_cleanup_map (
  legacy_name text NOT NULL,
  english_name text NOT NULL,
  fallback_color varchar(24) NOT NULL
);
--> statement-breakpoint
INSERT INTO taxonomy_label_cleanup_map (legacy_name, english_name, fallback_color)
VALUES
  ('Плодове', 'Fruit', '#f97316'),
  ('РџР»РѕРґРѕРІРµ', 'Fruit', '#f97316'),
  ('Зеленчуци', 'Vegetables', '#22c55e'),
  ('Р—РµР»РµРЅС‡СѓС†Рё', 'Vegetables', '#22c55e'),
  ('Месо', 'Meat & seafood', '#ef4444'),
  ('Месо и риба', 'Meat & seafood', '#ef4444'),
  ('Месо и морски дарове', 'Meat & seafood', '#ef4444'),
  ('РњРµСЃРѕ', 'Meat & seafood', '#ef4444'),
  ('РњРµСЃРѕ Рё СЂРёР±Р°', 'Meat & seafood', '#ef4444'),
  ('РњРµСЃРѕ Рё РјРѕСЂСЃРєРё РґР°СЂРѕРІРµ', 'Meat & seafood', '#ef4444'),
  ('Млечни', 'Dairy & eggs', '#38bdf8'),
  ('Млечни и яйца', 'Dairy & eggs', '#38bdf8'),
  ('Млечни продукти', 'Dairy & eggs', '#38bdf8'),
  ('Млечни продукти и яйца', 'Dairy & eggs', '#38bdf8'),
  ('РњР»РµС‡РЅРё', 'Dairy & eggs', '#38bdf8'),
  ('РњР»РµС‡РЅРё Рё СЏР№С†Р°', 'Dairy & eggs', '#38bdf8'),
  ('РњР»РµС‡РЅРё РїСЂРѕРґСѓРєС‚Рё', 'Dairy & eggs', '#38bdf8'),
  ('РњР»РµС‡РЅРё РїСЂРѕРґСѓРєС‚Рё Рё СЏР№С†Р°', 'Dairy & eggs', '#38bdf8'),
  ('Зърнени', 'Grains & bakery', '#eab308'),
  ('Зърнени и пекарна', 'Grains & bakery', '#eab308'),
  ('Зърнени и хлебни', 'Grains & bakery', '#eab308'),
  ('Хляб и зърнени', 'Grains & bakery', '#eab308'),
  ('Пекарна', 'Grains & bakery', '#eab308'),
  ('Р—СЉСЂРЅРµРЅРё', 'Grains & bakery', '#eab308'),
  ('Р—СЉСЂРЅРµРЅРё Рё РїРµРєР°СЂРЅР°', 'Grains & bakery', '#eab308'),
  ('Р—СЉСЂРЅРµРЅРё Рё С…Р»РµР±РЅРё', 'Grains & bakery', '#eab308'),
  ('РҐР»СЏР± Рё Р·СЉСЂРЅРµРЅРё', 'Grains & bakery', '#eab308'),
  ('РџРµРєР°СЂРЅР°', 'Grains & bakery', '#eab308'),
  ('Подправки', 'Spices & herbs', '#a855f7'),
  ('Подправки и билки', 'Spices & herbs', '#a855f7'),
  ('РџРѕРґРїСЂР°РІРєРё', 'Spices & herbs', '#a855f7'),
  ('РџРѕРґРїСЂР°РІРєРё Рё Р±РёР»РєРё', 'Spices & herbs', '#a855f7'),
  ('Напитки', 'Drinks', '#06b6d4'),
  ('РќР°РїРёС‚РєРё', 'Drinks', '#06b6d4'),
  ('Замразени', 'Frozen', '#60a5fa'),
  ('Замразени храни', 'Frozen', '#60a5fa'),
  ('Р—Р°РјСЂР°Р·РµРЅРё', 'Frozen', '#60a5fa'),
  ('Р—Р°РјСЂР°Р·РµРЅРё С…СЂР°РЅРё', 'Frozen', '#60a5fa'),
  ('Консерви', 'Canned & jars', '#64748b'),
  ('Консерви и буркани', 'Canned & jars', '#64748b'),
  ('Буркани', 'Canned & jars', '#64748b'),
  ('РљРѕРЅСЃРµСЂРІРё', 'Canned & jars', '#64748b'),
  ('РљРѕРЅСЃРµСЂРІРё Рё Р±СѓСЂРєР°РЅРё', 'Canned & jars', '#64748b'),
  ('Р‘СѓСЂРєР°РЅРё', 'Canned & jars', '#64748b');
--> statement-breakpoint
CREATE TEMP TABLE taxonomy_category_cleanup_targets AS
WITH legacy_categories AS (
  SELECT
    category.id,
    category.user_id,
    category.household_id,
    label_map.english_name,
    label_map.fallback_color
  FROM "categories" category
  JOIN taxonomy_label_cleanup_map label_map
    ON lower(trim(category.name)) = lower(trim(label_map.legacy_name))
),
resolved_targets AS (
  SELECT
    legacy.id AS legacy_id,
    COALESCE(existing_english.id, canonical_legacy.id) AS target_id,
    legacy.english_name,
    legacy.fallback_color
  FROM legacy_categories legacy
  LEFT JOIN LATERAL (
    SELECT target.id
    FROM "categories" target
    WHERE lower(trim(target.name)) = lower(trim(legacy.english_name))
      AND target.user_id IS NOT DISTINCT FROM legacy.user_id
      AND target.household_id IS NOT DISTINCT FROM legacy.household_id
    ORDER BY target.id
    LIMIT 1
  ) existing_english ON true
  JOIN LATERAL (
    SELECT target.id
    FROM legacy_categories target
    WHERE lower(trim(target.english_name)) = lower(trim(legacy.english_name))
      AND target.user_id IS NOT DISTINCT FROM legacy.user_id
      AND target.household_id IS NOT DISTINCT FROM legacy.household_id
    ORDER BY target.id
    LIMIT 1
  ) canonical_legacy ON true
)
SELECT *
FROM resolved_targets;
--> statement-breakpoint
UPDATE "products" product
SET
  category_id = target.target_id,
  updated_at = now()
FROM taxonomy_category_cleanup_targets target
WHERE product.category_id = target.legacy_id
  AND target.legacy_id <> target.target_id;
--> statement-breakpoint
UPDATE "categories" category
SET
  name = target.english_name,
  color = COALESCE(category.color, target.fallback_color),
  updated_at = now()
FROM (
  SELECT DISTINCT ON (target_id)
    target_id,
    english_name,
    fallback_color
  FROM taxonomy_category_cleanup_targets
  WHERE legacy_id = target_id
  ORDER BY target_id
) target
WHERE category.id = target.target_id
  AND category.name IS DISTINCT FROM target.english_name;
--> statement-breakpoint
DELETE FROM "categories" category
USING taxonomy_category_cleanup_targets target
WHERE category.id = target.legacy_id
  AND target.legacy_id <> target.target_id
  AND NOT EXISTS (
    SELECT 1
    FROM "products" product
    WHERE product.category_id = category.id
  );
--> statement-breakpoint
UPDATE "shopping_list_items" item
SET
  category = label_map.english_name,
  updated_at = now()
FROM taxonomy_label_cleanup_map label_map
WHERE lower(trim(item.category)) = lower(trim(label_map.legacy_name))
  AND item.category IS DISTINCT FROM label_map.english_name;
--> statement-breakpoint
UPDATE "barcode_products" barcode_product
SET
  category = label_map.english_name,
  updated_at = now()
FROM taxonomy_label_cleanup_map label_map
WHERE lower(trim(barcode_product.category)) = lower(trim(label_map.legacy_name))
  AND barcode_product.category IS DISTINCT FROM label_map.english_name;
--> statement-breakpoint
CREATE TEMP TABLE storage_label_cleanup_map (
  legacy_name text NOT NULL,
  english_name text NOT NULL
);
--> statement-breakpoint
INSERT INTO storage_label_cleanup_map (legacy_name, english_name)
VALUES
  ('fridge', 'Fridge'),
  ('freezer', 'Freezer'),
  ('pantry', 'Pantry'),
  ('cupboard', 'Cupboard'),
  ('cellar', 'Pantry'),
  ('counter', 'Other'),
  ('other', 'Other'),
  ('Хладилник', 'Fridge'),
  ('хладилник', 'Fridge'),
  ('РҐР»Р°РґРёР»РЅРёРє', 'Fridge'),
  ('С…Р»Р°РґРёР»РЅРёРє', 'Fridge'),
  ('Фризер', 'Freezer'),
  ('фризер', 'Freezer'),
  ('Р¤СЂРёР·РµСЂ', 'Freezer'),
  ('С„СЂРёР·РµСЂ', 'Freezer'),
  ('Килер', 'Pantry'),
  ('килер', 'Pantry'),
  ('РљРёР»РµСЂ', 'Pantry'),
  ('РєРёР»РµСЂ', 'Pantry'),
  ('Шкаф', 'Cupboard'),
  ('шкаф', 'Cupboard'),
  ('РЁРєР°С„', 'Cupboard'),
  ('С€РєР°С„', 'Cupboard'),
  ('Друго', 'Other'),
  ('друго', 'Other'),
  ('Р”СЂСѓРіРѕ', 'Other'),
  ('РґСЂСѓРіРѕ', 'Other');
--> statement-breakpoint
UPDATE "products" product
SET
  storage_location = label_map.english_name,
  updated_at = now()
FROM storage_label_cleanup_map label_map
WHERE lower(trim(product.storage_location)) = lower(trim(label_map.legacy_name))
  AND product.storage_location IS DISTINCT FROM label_map.english_name;
--> statement-breakpoint
UPDATE "inventory_items" item
SET
  location = label_map.english_name,
  updated_at = now()
FROM storage_label_cleanup_map label_map
WHERE lower(trim(item.location)) = lower(trim(label_map.legacy_name))
  AND item.location IS DISTINCT FROM label_map.english_name;
--> statement-breakpoint
DROP TABLE IF EXISTS taxonomy_category_cleanup_targets;
--> statement-breakpoint
DROP TABLE IF EXISTS taxonomy_label_cleanup_map;
--> statement-breakpoint
DROP TABLE IF EXISTS storage_label_cleanup_map;
