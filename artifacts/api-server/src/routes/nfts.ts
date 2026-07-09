import { Router } from "express";
import { eq, desc, and, isNull, or, sql, isNotNull, inArray, gte } from "drizzle-orm";
import { db, usersTable, nftsTable, nftTradeOffersTable } from "@workspace/db";
import crypto from "crypto";

const router = Router();

// ── 60 NFT Definitions ──────────────────────────────────────────────────────

export const NFT_DEFS = {
  // ─── SIRADAN (Common) ────────────────────────────────────────────────────
  wheat_seed:      { emoji: "🌾", name: "Buğday Tohumu",       rarity: "common" as const,    mintLimit: 50000, sellPrice: 80,   bg: "#4a5568" },
  corn_cob:        { emoji: "🌽", name: "Mısır Koçanı",         rarity: "common" as const,    mintLimit: 45000, sellPrice: 90,   bg: "#4a5568" },
  tomato_vine:     { emoji: "🍅", name: "Domates Dalı",         rarity: "common" as const,    mintLimit: 40000, sellPrice: 110,  bg: "#4a5568" },
  carrot_fresh:    { emoji: "🥕", name: "Taze Havuç",           rarity: "common" as const,    mintLimit: 40000, sellPrice: 100,  bg: "#4a5568" },
  sunflower_seed:  { emoji: "🌻", name: "Ayçiçeği Tohumu",      rarity: "common" as const,    mintLimit: 38000, sellPrice: 120,  bg: "#4a5568" },
  red_apple:       { emoji: "🍎", name: "Kırmızı Elma",         rarity: "common" as const,    mintLimit: 36000, sellPrice: 130,  bg: "#4a5568" },
  cabbage_head:    { emoji: "🥬", name: "Taze Lahana",          rarity: "common" as const,    mintLimit: 35000, sellPrice: 95,   bg: "#4a5568" },
  herb_bunch:      { emoji: "🌿", name: "Şifalı Ot Demeti",     rarity: "common" as const,    mintLimit: 33000, sellPrice: 140,  bg: "#4a5568" },
  wild_mushroom:   { emoji: "🍄", name: "Yabani Mantar",        rarity: "common" as const,    mintLimit: 30000, sellPrice: 160,  bg: "#4a5568" },
  chicken_feather: { emoji: "🪶", name: "Tavuk Tüyü",           rarity: "common" as const,    mintLimit: 28000, sellPrice: 115,  bg: "#4a5568" },
  farm_egg:        { emoji: "🥚", name: "Çiftlik Yumurtası",    rarity: "common" as const,    mintLimit: 26000, sellPrice: 135,  bg: "#4a5568" },
  honey_pot:       { emoji: "🍯", name: "Bal Kovası",           rarity: "common" as const,    mintLimit: 24000, sellPrice: 200,  bg: "#4a5568" },
  seedling:        { emoji: "🌱", name: "Küçük Fide",           rarity: "common" as const,    mintLimit: 22000, sellPrice: 85,   bg: "#4a5568" },
  farm_stone:      { emoji: "🪨", name: "Çiftlik Taşı",         rarity: "common" as const,    mintLimit: 20000, sellPrice: 70,   bg: "#4a5568" },
  bamboo_shoot:    { emoji: "🎋", name: "Bambu Filizi",         rarity: "common" as const,    mintLimit: 18000, sellPrice: 130,  bg: "#4a5568" },
  flower_pot:      { emoji: "🪴", name: "Çiçek Saksısı",        rarity: "common" as const,    mintLimit: 16000, sellPrice: 110,  bg: "#4a5568" },
  rust_key:        { emoji: "🔑", name: "Paslı Anahtar",        rarity: "common" as const,    mintLimit: 15000, sellPrice: 160,  bg: "#4a5568" },
  farm_deed:       { emoji: "📜", name: "Çiftlik Belgesi",       rarity: "common" as const,    mintLimit: 14000, sellPrice: 180,  bg: "#4a5568" },
  wooden_bucket:   { emoji: "🪣", name: "Ahşap Kova",           rarity: "common" as const,    mintLimit: 13000, sellPrice: 130,  bg: "#4a5568" },
  farm_lantern:    { emoji: "🏮", name: "Çiftlik Feneri",        rarity: "common" as const,    mintLimit: 12000, sellPrice: 220,  bg: "#4a5568" },

  // ─── NADİR (Rare) ────────────────────────────────────────────────────────
  sapphire_stone:  { emoji: "💎", name: "Safir Taş",            rarity: "rare" as const,      mintLimit: 5000,  sellPrice: 1500, bg: "#1e3a5f" },
  silver_moon:     { emoji: "🌙", name: "Gümüş Ay Parçası",     rarity: "rare" as const,      mintLimit: 4500,  sellPrice: 1800, bg: "#1e3a5f" },
  crystal_butterfly:{ emoji:"🦋", name: "Kristal Kelebek",      rarity: "rare" as const,      mintLimit: 4000,  sellPrice: 2000, bg: "#1e3a5f" },
  golden_bee:      { emoji: "🐝", name: "Altın Arı",            rarity: "rare" as const,      mintLimit: 3500,  sellPrice: 2400, bg: "#1e3a5f" },
  silver_fox:      { emoji: "🦊", name: "Gümüş Tilki",          rarity: "rare" as const,      mintLimit: 3000,  sellPrice: 2800, bg: "#1e3a5f" },
  rare_shell:      { emoji: "🐚", name: "Nadide Deniz Kabuğu",  rarity: "rare" as const,      mintLimit: 2800,  sellPrice: 2200, bg: "#1e3a5f" },
  thunder_gem:     { emoji: "⚡", name: "Yıldırım Taşı",        rarity: "rare" as const,      mintLimit: 2500,  sellPrice: 3000, bg: "#1e3a5f" },
  oracle_orb:      { emoji: "🔮", name: "Kehanet Küresi",       rarity: "rare" as const,      mintLimit: 2200,  sellPrice: 3300, bg: "#1e3a5f" },
  rainbow_flower:  { emoji: "🌈", name: "Gökkuşağı Çiçeği",    rarity: "rare" as const,      mintLimit: 2000,  sellPrice: 2900, bg: "#1e3a5f" },
  tropical_parrot: { emoji: "🦜", name: "Tropikal Papağan",     rarity: "rare" as const,      mintLimit: 1800,  sellPrice: 3600, bg: "#1e3a5f" },
  golden_turtle:   { emoji: "🐢", name: "Altın Kaplumbağa",     rarity: "rare" as const,      mintLimit: 1600,  sellPrice: 3900, bg: "#1e3a5f" },
  dragon_flower:   { emoji: "🌺", name: "Ejder Çiçeği",         rarity: "rare" as const,      mintLimit: 1400,  sellPrice: 4200, bg: "#1e3a5f" },
  lucky_clover:    { emoji: "🍀", name: "Dört Yapraklı Yonca",  rarity: "rare" as const,      mintLimit: 1200,  sellPrice: 4500, bg: "#1e3a5f" },
  evil_eye_charm:  { emoji: "🪬", name: "Göz Nazarlık",         rarity: "rare" as const,      mintLimit: 1000,  sellPrice: 4800, coinBonus: 150, bg: "#1e3a5f" },
  ice_crystal:     { emoji: "🧊", name: "Saf Buz Kristali",     rarity: "rare" as const,      mintLimit: 900,   sellPrice: 5100, coinBonus: 200, bg: "#1e3a5f" },
  cherry_blossom:  { emoji: "🌸", name: "Kiraz Çiçeği",         rarity: "rare" as const,      mintLimit: 800,   sellPrice: 5400, coinBonus: 200, bg: "#1e3a5f" },
  eagle_feather:   { emoji: "🦅", name: "Kartal Tüyü",          rarity: "rare" as const,      mintLimit: 700,   sellPrice: 5700, coinBonus: 250, bg: "#1e3a5f" },
  magic_cactus:    { emoji: "🌵", name: "Sihirli Kaktüs",       rarity: "rare" as const,      mintLimit: 600,   sellPrice: 6000, coinBonus: 300, bg: "#1e3a5f" },
  sea_trident:     { emoji: "🔱", name: "Deniz Mızrağı",        rarity: "rare" as const,      mintLimit: 500,   sellPrice: 6500, coinBonus: 400, bg: "#1e3a5f" },
  phoenix_feather: { emoji: "🔥", name: "Anka Kuşu Tüyü",       rarity: "rare" as const,      mintLimit: 400,   sellPrice: 7000, coinBonus: 500, bg: "#1e3a5f" },

  // ─── SIRADAN EK (Common +10) ─────────────────────────────────────────────
  pepper_farm:     { emoji: "🌶️", name: "Acı Biber",             rarity: "common" as const,    mintLimit: 35000, sellPrice: 95,   bg: "#4a5568" },
  pumpkin_patch:   { emoji: "🎃", name: "Balkabağı",             rarity: "common" as const,    mintLimit: 32000, sellPrice: 105,  bg: "#4a5568" },
  grapes_vine:     { emoji: "🍇", name: "Üzüm Salkımı",         rarity: "common" as const,    mintLimit: 30000, sellPrice: 125,  bg: "#4a5568" },
  watermelon_farm: { emoji: "🍉", name: "Çiftlik Karpuzu",      rarity: "common" as const,    mintLimit: 28000, sellPrice: 115,  bg: "#4a5568" },
  lemon_grove:     { emoji: "🍋", name: "Taze Limon",           rarity: "common" as const,    mintLimit: 26000, sellPrice: 90,   bg: "#4a5568" },
  strawberry_patch:{ emoji: "🍓", name: "Çilek Tarlası",        rarity: "common" as const,    mintLimit: 24000, sellPrice: 150,  bg: "#4a5568" },
  blueberry_wild:  { emoji: "🫐", name: "Yaban Mersini",        rarity: "common" as const,    mintLimit: 20000, sellPrice: 170,  bg: "#4a5568" },
  pear_fresh:      { emoji: "🍐", name: "Taze Armut",           rarity: "common" as const,    mintLimit: 22000, sellPrice: 100,  bg: "#4a5568" },
  broccoli_fresh:  { emoji: "🥦", name: "Organik Brokoli",      rarity: "common" as const,    mintLimit: 18000, sellPrice: 88,   bg: "#4a5568" },
  pineapple_farm:  { emoji: "🍍", name: "Tropikal Ananas",      rarity: "common" as const,    mintLimit: 19000, sellPrice: 145,  bg: "#4a5568" },

  // ─── NADİR EK (Rare +10) ─────────────────────────────────────────────────
  peacock_tail:    { emoji: "🦚", name: "Tavus Tüyü",           rarity: "rare" as const,      mintLimit: 850,   sellPrice: 4300, bg: "#1e3a5f" },
  coral_branch:    { emoji: "🪸", name: "Nadir Mercan Dalı",    rarity: "rare" as const,      mintLimit: 650,   sellPrice: 5800, coinBonus: 250, bg: "#1e3a5f" },
  wise_owl:        { emoji: "🦉", name: "Bilge Baykuş",         rarity: "rare" as const,      mintLimit: 1100,  sellPrice: 3700, bg: "#1e3a5f" },
  compass_ancient: { emoji: "🧭", name: "Antika Pusula",        rarity: "rare" as const,      mintLimit: 480,   sellPrice: 6200, coinBonus: 350, bg: "#1e3a5f" },
  dolphin_spirit:  { emoji: "🐬", name: "Yunus Ruhu",           rarity: "rare" as const,      mintLimit: 920,   sellPrice: 4100, bg: "#1e3a5f" },
  jellyfish_rare:  { emoji: "🪼", name: "Nadir Denizanası",     rarity: "rare" as const,      mintLimit: 560,   sellPrice: 5300, coinBonus: 300, bg: "#1e3a5f" },
  amber_fossil:    { emoji: "🪲", name: "Kehribar Fosili",      rarity: "rare" as const,      mintLimit: 720,   sellPrice: 4700, bg: "#1e3a5f" },
  white_crane:     { emoji: "🕊️", name: "Beyaz Turna",          rarity: "rare" as const,      mintLimit: 440,   sellPrice: 5900, coinBonus: 400, bg: "#1e3a5f" },
  panda_spirit:    { emoji: "🐼", name: "Panda Ruhu",           rarity: "rare" as const,      mintLimit: 980,   sellPrice: 3900, bg: "#1e3a5f" },
  moon_wolf:       { emoji: "🐺", name: "Ay Kurdu",             rarity: "rare" as const,      mintLimit: 380,   sellPrice: 6800, coinBonus: 500, bg: "#1e3a5f" },

  // ─── EFSANEVİ EK (Legendary +10) ─────────────────────────────────────────
  comet_shard:     { emoji: "☄️", name: "Kuyruklu Yıldız",      rarity: "legendary" as const, mintLimit: 28,    sellPrice: 450000,  coinBonus: 8000,  bg: "#5c3a00" },
  hourglass_anc:   { emoji: "⏳", name: "Antik Kum Saati",      rarity: "legendary" as const, mintLimit: 38,    sellPrice: 320000,  coinBonus: 6000,  bg: "#5c3a00" },
  soul_lantern:    { emoji: "🪔", name: "Ruh Kandili",           rarity: "legendary" as const, mintLimit: 33,    sellPrice: 380000,  coinBonus: 7000,  bg: "#5c3a00" },
  infinity_ring:   { emoji: "💍", name: "Sonsuzluk Yüzüğü",    rarity: "legendary" as const, mintLimit: 25,    sellPrice: 580000,  coinBonus: 10000, bg: "#5c3a00" },
  ankh_amulet:     { emoji: "📿", name: "Ankh Tılsımı",         rarity: "legendary" as const, mintLimit: 42,    sellPrice: 280000,  coinBonus: 5000,  bg: "#5c3a00" },
  nebula_core:     { emoji: "🌀", name: "Nebula Çekirdeği",     rarity: "legendary" as const, mintLimit: 22,    sellPrice: 490000,  coinBonus: 9000,  bg: "#5c3a00" },
  olympus_shield:  { emoji: "🛡️", name: "Olimpus Kalkanı",      rarity: "legendary" as const, mintLimit: 18,    sellPrice: 720000,  coinBonus: 12000, bg: "#5c3a00" },
  void_pearl:      { emoji: "🫧", name: "Void İncisi",           rarity: "legendary" as const, mintLimit: 15,    sellPrice: 840000,  coinBonus: 15000, bg: "#5c3a00" },
  phoenix_core:    { emoji: "❤️‍🔥", name: "Anka Kalbi",           rarity: "legendary" as const, mintLimit: 12,    sellPrice: 960000,  coinBonus: 18000, bg: "#5c3a00" },
  serpent_crown:   { emoji: "🐍", name: "Yılan Tacı",           rarity: "legendary" as const, mintLimit: 8,     sellPrice: 1200000, coinBonus: 25000, bg: "#5c3a00" },

  // ─── EFSANEVİ (Legendary) ────────────────────────────────────────────────
  golden_crown:    { emoji: "👑", name: "Altın Taç",            rarity: "legendary" as const, mintLimit: 300,   sellPrice: 25000,  coinBonus: 500,  bg: "#5c3a00" },
  dragon_egg:      { emoji: "🥚", name: "Ejder Yumurtası",      rarity: "legendary" as const, mintLimit: 250,   sellPrice: 30000,  coinBonus: 600,  bg: "#5c3a00" },
  legend_sword:    { emoji: "⚔️",  name: "Efsane Kılıcı",       rarity: "legendary" as const, mintLimit: 220,   sellPrice: 38000,  coinBonus: 800,  bg: "#5c3a00" },
  supernova:       { emoji: "💥", name: "Süpernova Parçası",    rarity: "legendary" as const, mintLimit: 200,   sellPrice: 42000,  coinBonus: 900,  bg: "#5c3a00" },
  poseidon_spear:  { emoji: "🌊", name: "Poseidon Mızrağı",     rarity: "legendary" as const, mintLimit: 180,   sellPrice: 48000,  coinBonus: 1000, bg: "#5c3a00" },
  unicorn_crystal: { emoji: "🦄", name: "Unicorn Kristali",     rarity: "legendary" as const, mintLimit: 160,   sellPrice: 55000,  coinBonus: 1200, bg: "#5c3a00" },
  volcano_heart:   { emoji: "🌋", name: "Volkan Kalbi",         rarity: "legendary" as const, mintLimit: 140,   sellPrice: 65000,  coinBonus: 1500, bg: "#5c3a00" },
  eternal_eye:     { emoji: "👁️",  name: "Sonsuz Göz",          rarity: "legendary" as const, mintLimit: 120,   sellPrice: 78000,  coinBonus: 1800, bg: "#5c3a00" },
  falling_star:    { emoji: "💫", name: "Düşen Yıldız",         rarity: "legendary" as const, mintLimit: 100,   sellPrice: 90000,  coinBonus: 2000, bg: "#5c3a00" },
  eternal_key:     { emoji: "🗝️",  name: "Ebedi Anahtar",       rarity: "legendary" as const, mintLimit: 90,    sellPrice: 105000, coinBonus: 2500, bg: "#5c3a00" },
  golden_vase:     { emoji: "🏺", name: "Antik Altın Vazo",     rarity: "legendary" as const, mintLimit: 80,    sellPrice: 120000, coinBonus: 3000, bg: "#5c3a00" },
  magic_wand:      { emoji: "🪄", name: "Sihirli Değnek",       rarity: "legendary" as const, mintLimit: 70,    sellPrice: 140000, coinBonus: 3500, bg: "#5c3a00" },
  galaxy_stone:    { emoji: "🌌", name: "Galaksi Taşı",         rarity: "legendary" as const, mintLimit: 60,    sellPrice: 165000, coinBonus: 4000, bg: "#5c3a00" },
  ice_goddess:     { emoji: "❄️",  name: "Buz Tanrıçası",       rarity: "legendary" as const, mintLimit: 50,    sellPrice: 200000, coinBonus: 5000, bg: "#5c3a00" },
  lightning_lord:  { emoji: "⚡", name: "Şimşek Efendisi",     rarity: "legendary" as const, mintLimit: 45,    sellPrice: 240000, coinBonus: 6000, bg: "#5c3a00" },
  black_hole:      { emoji: "🕳️",  name: "Kara Delik Parçası",  rarity: "legendary" as const, mintLimit: 40,    sellPrice: 290000, coinBonus: 7000, bg: "#5c3a00" },
  dragon_heart:    { emoji: "🐲", name: "Ejder Kalbi",          rarity: "legendary" as const, mintLimit: 35,    sellPrice: 350000, coinBonus: 8000, bg: "#5c3a00" },
  sun_stone:       { emoji: "☀️",  name: "Güneş Taşı",          rarity: "legendary" as const, mintLimit: 30,    sellPrice: 420000, coinBonus: 9000, bg: "#5c3a00" },
  world_crystal:   { emoji: "🌐", name: "Dünya Kristali",       rarity: "legendary" as const, mintLimit: 20,    sellPrice: 600000, coinBonus: 12000,bg: "#5c3a00" },
  farm_god:        { emoji: "🌟", name: "Çiftlik Tanrısı",      rarity: "legendary" as const, mintLimit: 10,    sellPrice: 1000000,coinBonus: 20000,bg: "#5c3a00" },

  // ─── SIRADAN EK 2 (Common +15) ───────────────────────────────────────────
  coconut_fresh:   { emoji: "🥥", name: "Taze Hindistan Cevizi", rarity: "common" as const,   mintLimit: 32000, sellPrice: 95,   bg: "#4a5568" },
  mango_ripe:      { emoji: "🥭", name: "Olgun Mango",            rarity: "common" as const,   mintLimit: 30000, sellPrice: 120,  bg: "#4a5568" },
  avocado_fresh:   { emoji: "🥑", name: "Taze Avokado",           rarity: "common" as const,   mintLimit: 28000, sellPrice: 130,  bg: "#4a5568" },
  sweet_potato:    { emoji: "🍠", name: "Tatlı Patates",          rarity: "common" as const,   mintLimit: 26000, sellPrice: 90,   bg: "#4a5568" },
  garlic_bulb:     { emoji: "🧄", name: "Sarımsak Başı",          rarity: "common" as const,   mintLimit: 24000, sellPrice: 85,   bg: "#4a5568" },
  onion_fresh:     { emoji: "🧅", name: "Taze Soğan",             rarity: "common" as const,   mintLimit: 22000, sellPrice: 80,   bg: "#4a5568" },
  cherry_sweet:    { emoji: "🍒", name: "Tatlı Kiraz",            rarity: "common" as const,   mintLimit: 20000, sellPrice: 140,  bg: "#4a5568" },
  peach_ripe:      { emoji: "🍑", name: "Olgun Şeftali",          rarity: "common" as const,   mintLimit: 18000, sellPrice: 145,  bg: "#4a5568" },
  kiwi_fresh:      { emoji: "🥝", name: "Taze Kivi",              rarity: "common" as const,   mintLimit: 16000, sellPrice: 155,  bg: "#4a5568" },
  melon_sweet:     { emoji: "🍈", name: "Tatlı Kavun",            rarity: "common" as const,   mintLimit: 14000, sellPrice: 120,  bg: "#4a5568" },
  chestnut_roast:  { emoji: "🌰", name: "Kestane",                rarity: "common" as const,   mintLimit: 12000, sellPrice: 160,  bg: "#4a5568" },
  tangerine_fresh: { emoji: "🍊", name: "Taze Mandalina",         rarity: "common" as const,   mintLimit: 11000, sellPrice: 105,  bg: "#4a5568" },
  banana_bunch:    { emoji: "🍌", name: "Muz Demeti",             rarity: "common" as const,   mintLimit: 10000, sellPrice: 95,   bg: "#4a5568" },
  bean_bag:        { emoji: "🫘", name: "Fasulye Torbası",        rarity: "common" as const,   mintLimit: 9500,  sellPrice: 150,  bg: "#4a5568" },
  peanut_fresh:    { emoji: "🥜", name: "Taze Fıstık",            rarity: "common" as const,   mintLimit: 9000,  sellPrice: 140,  bg: "#4a5568" },

  // ─── NADİR EK 2 (Rare +15) ───────────────────────────────────────────────
  obsidian_cat:    { emoji: "🐱", name: "Obsidyen Kedi",          rarity: "rare" as const,     mintLimit: 750,   sellPrice: 4600, bg: "#1e3a5f" },
  jade_frog:       { emoji: "🐸", name: "Yeşim Kurbağası",        rarity: "rare" as const,     mintLimit: 680,   sellPrice: 5200, bg: "#1e3a5f" },
  crystal_lizard:  { emoji: "🦎", name: "Kristal Kertenkele",     rarity: "rare" as const,     mintLimit: 620,   sellPrice: 5500, coinBonus: 200, bg: "#1e3a5f" },
  silver_swan:     { emoji: "🦢", name: "Gümüş Kuğu",             rarity: "rare" as const,     mintLimit: 560,   sellPrice: 5800, coinBonus: 250, bg: "#1e3a5f" },
  ice_penguin:     { emoji: "🐧", name: "Buz Pengueni",           rarity: "rare" as const,     mintLimit: 820,   sellPrice: 4400, bg: "#1e3a5f" },
  moon_koala:      { emoji: "🐨", name: "Ay Koalası",             rarity: "rare" as const,     mintLimit: 760,   sellPrice: 4800, bg: "#1e3a5f" },
  storm_bear:      { emoji: "🐻", name: "Fırtına Ayısı",          rarity: "rare" as const,     mintLimit: 700,   sellPrice: 5100, coinBonus: 180, bg: "#1e3a5f" },
  deep_octopus:    { emoji: "🐙", name: "Derin Ahtapot",          rarity: "rare" as const,     mintLimit: 640,   sellPrice: 5400, coinBonus: 200, bg: "#1e3a5f" },
  rainbow_fish:    { emoji: "🐠", name: "Gökkuşağı Balığı",       rarity: "rare" as const,     mintLimit: 590,   sellPrice: 5700, bg: "#1e3a5f" },
  gold_crab:       { emoji: "🦀", name: "Altın Yengeç",           rarity: "rare" as const,     mintLimit: 530,   sellPrice: 6100, coinBonus: 300, bg: "#1e3a5f" },
  river_croco:     { emoji: "🐊", name: "Nehir Timsahı",          rarity: "rare" as const,     mintLimit: 480,   sellPrice: 6400, coinBonus: 350, bg: "#1e3a5f" },
  seal_spirit:     { emoji: "🦭", name: "Fok Ruhu",               rarity: "rare" as const,     mintLimit: 420,   sellPrice: 6700, coinBonus: 400, bg: "#1e3a5f" },
  golden_rooster:  { emoji: "🐓", name: "Altın Horoz",            rarity: "rare" as const,     mintLimit: 860,   sellPrice: 4200, bg: "#1e3a5f" },
  rose_flamingo:   { emoji: "🦩", name: "Pembe Flamingo",         rarity: "rare" as const,     mintLimit: 780,   sellPrice: 4700, bg: "#1e3a5f" },
  thunder_roo:     { emoji: "🦘", name: "Şimşek Kangurusu",       rarity: "rare" as const,     mintLimit: 360,   sellPrice: 7200, coinBonus: 500, bg: "#1e3a5f" },

  // ─── EPİK (Epic) ──────────────────────────────────────────────────────────
  ancient_temple:   { emoji: "🏛️", name: "Antik Tapınak",         rarity: "epic" as const,     mintLimit: 2000,  sellPrice: 22000,  bg: "#4a0808" },
  shadow_dagger:    { emoji: "🗡️", name: "Gölge Hançeri",         rarity: "epic" as const,     mintLimit: 1800,  sellPrice: 24000,  bg: "#4a0808" },
  soul_candle:      { emoji: "🕯️", name: "Ruh Mumu",              rarity: "epic" as const,     mintLimit: 1600,  sellPrice: 26000,  bg: "#4a0808" },
  chaos_bomb:       { emoji: "💣", name: "Kaos Bombası",           rarity: "epic" as const,     mintLimit: 1400,  sellPrice: 28000,  bg: "#4a0808" },
  titan_axe:        { emoji: "🪓", name: "Titan Baltası",          rarity: "epic" as const,     mintLimit: 1200,  sellPrice: 30000,  bg: "#4a0808" },
  fate_lock:        { emoji: "🔐", name: "Kader Kilidi",           rarity: "epic" as const,     mintLimit: 1100,  sellPrice: 32000,  bg: "#4a0808" },
  full_moon_stone:  { emoji: "🌕", name: "Dolunay Taşı",          rarity: "epic" as const,     mintLimit: 1000,  sellPrice: 34000,  bg: "#4a0808" },
  crescent_talisman:{ emoji: "🌛", name: "Hilal Tılsımı",         rarity: "epic" as const,     mintLimit: 900,   sellPrice: 36000,  bg: "#4a0808" },
  moon_spirit:      { emoji: "🌝", name: "Ay Ruhu",               rarity: "epic" as const,     mintLimit: 800,   sellPrice: 38000,  bg: "#4a0808" },
  sun_spirit:       { emoji: "🌞", name: "Güneş Ruhu",            rarity: "epic" as const,     mintLimit: 750,   sellPrice: 40000,  bg: "#4a0808" },
  thunder_storm:    { emoji: "🌩️", name: "Gök Gürültüsü",         rarity: "epic" as const,     mintLimit: 700,   sellPrice: 43000,  bg: "#4a0808" },
  tornado_fury:     { emoji: "🌪️", name: "Kasırga Ruhu",          rarity: "epic" as const,     mintLimit: 650,   sellPrice: 46000,  bg: "#4a0808" },
  sacred_shrine:    { emoji: "⛩️", name: "Kutsal Tapınak",        rarity: "epic" as const,     mintLimit: 600,   sellPrice: 49000,  bg: "#4a0808" },
  shadow_castle:    { emoji: "🏯", name: "Gölge Kalesi",          rarity: "epic" as const,     mintLimit: 550,   sellPrice: 52000,  bg: "#4a0808" },
  power_fortress:   { emoji: "🏰", name: "Güç Kalesi",            rarity: "epic" as const,     mintLimit: 500,   sellPrice: 55000,  bg: "#4a0808" },
  dragon_tower:     { emoji: "🗼", name: "Ejder Kulesi",           rarity: "epic" as const,     mintLimit: 450,   sellPrice: 58000,  bg: "#4a0808" },
  cosmic_vessel:    { emoji: "🛸", name: "Kozmik Gemi",           rarity: "epic" as const,     mintLimit: 420,   sellPrice: 61000,  bg: "#4a0808" },
  legend_rocket:    { emoji: "🚀", name: "Efsane Roketi",         rarity: "epic" as const,     mintLimit: 400,   sellPrice: 64000,  bg: "#4a0808" },
  fate_mask:        { emoji: "🎭", name: "Kader Maskesi",         rarity: "epic" as const,     mintLimit: 380,   sellPrice: 67000,  bg: "#4a0808" },
  chaos_arena:      { emoji: "🎪", name: "Kaos Arenası",          rarity: "epic" as const,     mintLimit: 360,   sellPrice: 70000,  bg: "#4a0808" },
  ancient_carousel: { emoji: "🎠", name: "Antik Çark",            rarity: "epic" as const,     mintLimit: 340,   sellPrice: 73000,  bg: "#4a0808" },
  fortune_wheel:    { emoji: "🎡", name: "Kader Çarkı",           rarity: "epic" as const,     mintLimit: 320,   sellPrice: 76000,  bg: "#4a0808" },
  dawn_crystal:     { emoji: "🌄", name: "Şafak Kristali",        rarity: "epic" as const,     mintLimit: 300,   sellPrice: 79000,  bg: "#4a0808" },
  city_spirit:      { emoji: "🌆", name: "Şehir Ruhu",            rarity: "epic" as const,     mintLimit: 280,   sellPrice: 82000,  bg: "#4a0808" },
  dragon_card:      { emoji: "🎴", name: "Ejder Kartı",           rarity: "epic" as const,     mintLimit: 260,   sellPrice: 85000,  bg: "#4a0808" },
  fate_tile:        { emoji: "🀄", name: "Kader Taşı",            rarity: "epic" as const,     mintLimit: 240,   sellPrice: 87000,  bg: "#4a0808" },
  wild_joker:       { emoji: "🃏", name: "Vahşi Joker",           rarity: "epic" as const,     mintLimit: 220,   sellPrice: 89000,  bg: "#4a0808" },
  ancient_idol:     { emoji: "🗿", name: "Taş Tanrı",             rarity: "epic" as const,     mintLimit: 200,   sellPrice: 91000,  bg: "#4a0808" },
  dragon_tooth:     { emoji: "🦷", name: "Ejder Dişi",            rarity: "epic" as const,     mintLimit: 190,   sellPrice: 92500,  bg: "#4a0808" },
  titan_bone:       { emoji: "🦴", name: "Titan Kemiği",          rarity: "epic" as const,     mintLimit: 180,   sellPrice: 94000,  bg: "#4a0808" },
  chance_dice:      { emoji: "🎲", name: "Kader Zarı",            rarity: "epic" as const,     mintLimit: 170,   sellPrice: 95000,  bg: "#4a0808" },
  epic_boomerang:   { emoji: "🪃", name: "Epik Bumerang",         rarity: "epic" as const,     mintLimit: 160,   sellPrice: 96000,  bg: "#4a0808" },
  titan_fist:       { emoji: "🥊", name: "Titan Yumruğu",         rarity: "epic" as const,     mintLimit: 150,   sellPrice: 97000,  bg: "#4a0808" },
  glory_ribbon:     { emoji: "🎗️", name: "Şeref Kurdelesi",       rarity: "epic" as const,     mintLimit: 140,   sellPrice: 97500,  bg: "#4a0808" },
  titan_core:       { emoji: "🔋", name: "Titan Çekirdeği",       rarity: "epic" as const,     mintLimit: 130,   sellPrice: 98000,  bg: "#4a0808" },
  life_elixir:      { emoji: "💊", name: "Hayat İksiri",          rarity: "epic" as const,     mintLimit: 120,   sellPrice: 98500,  bg: "#4a0808" },
  alchemist_vial:   { emoji: "🧪", name: "Simyacı Tüpü",         rarity: "epic" as const,     mintLimit: 110,   sellPrice: 99000,  bg: "#4a0808" },
  mystic_note:      { emoji: "🎵", name: "Mistik Melodi",         rarity: "epic" as const,     mintLimit: 100,   sellPrice: 99200,  bg: "#4a0808" },
  cosmic_signal:    { emoji: "📡", name: "Kozmik Sinyal",         rarity: "epic" as const,     mintLimit: 90,    sellPrice: 99400,  bg: "#4a0808" },
  divine_canvas:    { emoji: "🖼️", name: "İlahi Tuval",           rarity: "epic" as const,     mintLimit: 80,    sellPrice: 99600,  bg: "#4a0808" },
  eternal_coffin:   { emoji: "⚰️", name: "Ebedi Sandık",          rarity: "epic" as const,     mintLimit: 70,    sellPrice: 99700,  bg: "#4a0808" },
  thunder_guitar:   { emoji: "🎸", name: "Gök Gitarı",            rarity: "epic" as const,     mintLimit: 60,    sellPrice: 99800,  bg: "#4a0808" },
  war_drum:         { emoji: "🥁", name: "Savaş Davulu",          rarity: "epic" as const,     mintLimit: 50,    sellPrice: 99900,  bg: "#4a0808" },
  war_horn:         { emoji: "🎺", name: "Savaş Borusu",          rarity: "epic" as const,     mintLimit: 40,    sellPrice: 100000, bg: "#4a0808" },
  fate_flute:       { emoji: "🪈", name: "Kader Flütü",           rarity: "epic" as const,     mintLimit: 30,    sellPrice: 100000, bg: "#4a0808" },

  // ─── ÖZEL (Special) ───────────────────────────────────────────────────────
  mystic_seal:     { emoji: "🔯", name: "Mistik Mühür",           rarity: "special" as const,  mintLimit: 450,   sellPrice: 8500,  bg: "#3b1f6e" },
  shooting_star:   { emoji: "🌠", name: "Kayan Yıldız",           rarity: "special" as const,  mintLimit: 400,   sellPrice: 9000,  bg: "#3b1f6e" },
  cosmic_eye:      { emoji: "🧿", name: "Kozmik Göz",             rarity: "special" as const,  mintLimit: 360,   sellPrice: 9500,  bg: "#3b1f6e" },
  alchemy_flask:   { emoji: "⚗️", name: "Simya Şişesi",           rarity: "special" as const,  mintLimit: 320,   sellPrice: 10000, bg: "#3b1f6e" },
  ancient_map:     { emoji: "🗺️", name: "Antika Harita",          rarity: "special" as const,  mintLimit: 285,   sellPrice: 10500, bg: "#3b1f6e" },
  void_magnet:     { emoji: "🧲", name: "Void Mıknatısı",         rarity: "special" as const,  mintLimit: 255,   sellPrice: 11000, bg: "#3b1f6e" },
  spirit_bow:      { emoji: "🏹", name: "Ruh Yayı",               rarity: "special" as const,  mintLimit: 230,   sellPrice: 11500, bg: "#3b1f6e" },
  sacred_bell:     { emoji: "🔔", name: "Kutsal Çan",             rarity: "special" as const,  mintLimit: 210,   sellPrice: 12000, bg: "#3b1f6e" },
  dragon_scale:    { emoji: "🐉", name: "Ejder Pulu",             rarity: "special" as const,  mintLimit: 190,   sellPrice: 12500, bg: "#3b1f6e" },
  dark_moon_shard: { emoji: "🌑", name: "Karanlık Ay Kırığı",     rarity: "special" as const,  mintLimit: 172,   sellPrice: 13000, bg: "#3b1f6e" },
  lunar_blade:     { emoji: "🌓", name: "Ay Bıçağı",              rarity: "special" as const,  mintLimit: 155,   sellPrice: 13500, bg: "#3b1f6e" },
  jade_scorpion:   { emoji: "🦂", name: "Yeşim Akrebi",           rarity: "special" as const,  mintLimit: 140,   sellPrice: 14000, bg: "#3b1f6e" },
  lion_heart_sp:   { emoji: "🦁", name: "Aslan Kalbi",            rarity: "special" as const,  mintLimit: 126,   sellPrice: 14500, bg: "#3b1f6e" },
  tiger_soul:      { emoji: "🐯", name: "Kaplan Ruhu",            rarity: "special" as const,  mintLimit: 114,   sellPrice: 15000, bg: "#3b1f6e" },
  crimson_leaf:    { emoji: "🍁", name: "Kızıl Yaprak",           rarity: "special" as const,  mintLimit: 102,   sellPrice: 15500, bg: "#3b1f6e" },
  destiny_mark:    { emoji: "🎯", name: "Kader İşareti",          rarity: "special" as const,  mintLimit: 92,    sellPrice: 16000, bg: "#3b1f6e" },
  life_strand:     { emoji: "🧬", name: "Yaşam Zinciri",          rarity: "special" as const,  mintLimit: 83,    sellPrice: 16500, bg: "#3b1f6e" },
  star_gazer:      { emoji: "🔭", name: "Yıldız Gezgini",         rarity: "special" as const,  mintLimit: 74,    sellPrice: 17000, bg: "#3b1f6e" },
  golden_rosette:  { emoji: "🏵️", name: "Altın Rozet",            rarity: "special" as const,  mintLimit: 66,    sellPrice: 17500, bg: "#3b1f6e" },
  summit_gem:      { emoji: "🗻", name: "Zirve Mücevheri",        rarity: "special" as const,  mintLimit: 58,    sellPrice: 18000, bg: "#3b1f6e" },
  void_crystal:    { emoji: "💠", name: "Void Kristali",           rarity: "special" as const,  mintLimit: 52,    sellPrice: 18500, bg: "#3b1f6e" },
  angel_wing:      { emoji: "🪽", name: "Melek Kanadı",           rarity: "special" as const,  mintLimit: 46,    sellPrice: 19000, bg: "#3b1f6e" },
  spirit_guardian: { emoji: "🧸", name: "Ruh Koruyucu",           rarity: "special" as const,  mintLimit: 40,    sellPrice: 19500, bg: "#3b1f6e" },
  crescent_blade:  { emoji: "🌜", name: "Hilal Bıçağı",           rarity: "special" as const,  mintLimit: 34,    sellPrice: 20500, bg: "#3b1f6e" },
  soul_heart:      { emoji: "🫀", name: "Ruh Kalbi",              rarity: "special" as const,  mintLimit: 28,    sellPrice: 22000, bg: "#3b1f6e" },

  // ─── EFSANEVİ EK 2 (Legendary +10) ─────────────────────────────────────
  sacred_tree:     { emoji: "🌳", name: "Kutsal Ağaç",            rarity: "legendary" as const, mintLimit: 30,    sellPrice: 550000,  coinBonus: 10000, bg: "#5c3a00" },
  earth_gem:       { emoji: "🌍", name: "Dünya Mücevheri",        rarity: "legendary" as const, mintLimit: 22,    sellPrice: 680000,  coinBonus: 12000, bg: "#5c3a00" },
  prime_star:      { emoji: "⭐", name: "Asıl Yıldız",            rarity: "legendary" as const, mintLimit: 18,    sellPrice: 780000,  coinBonus: 14000, bg: "#5c3a00" },
  cosmic_mind:     { emoji: "🧠", name: "Kozmik Zihin",           rarity: "legendary" as const, mintLimit: 8,     sellPrice: 1500000, coinBonus: 30000, bg: "#5c3a00" },
  genesis_spark:   { emoji: "🎆", name: "Yaratılış Kıvılcımı",   rarity: "legendary" as const, mintLimit: 12,    sellPrice: 1200000, coinBonus: 25000, bg: "#5c3a00" },
  eternity_burst:  { emoji: "🧨", name: "Sonsuzluk Patlaması",   rarity: "legendary" as const, mintLimit: 20,    sellPrice: 720000,  coinBonus: 13000, bg: "#5c3a00" },
  terra_crystal:   { emoji: "🌏", name: "Terra Kristali",         rarity: "legendary" as const, mintLimit: 25,    sellPrice: 630000,  coinBonus: 11000, bg: "#5c3a00" },
  harvest_moon:    { emoji: "🎑", name: "Hasat Ayı",              rarity: "legendary" as const, mintLimit: 35,    sellPrice: 480000,  coinBonus: 8500,  bg: "#5c3a00" },
  atlas_peak:      { emoji: "🏔️", name: "Atlas Zirvesi",          rarity: "legendary" as const, mintLimit: 16,    sellPrice: 900000,  coinBonus: 16000, bg: "#5c3a00" },
  divine_blessing: { emoji: "🫶", name: "İlahi Bereket",          rarity: "legendary" as const, mintLimit: 14,    sellPrice: 1100000, coinBonus: 20000, bg: "#5c3a00" },
} as const;

export type NftType = keyof typeof NFT_DEFS;

// ── Case Definitions ──────────────────────────────────────────────────────────
//
// Drop rate design rules:
//  • farm_case  : efsanevi çok nadir (0.5%) — temel kasa, yaygın ürünler ağırlıklı
//  • crystal_case: nadir (rare) ağırlıklı ama pahalı rares item içi ağırlıklandırma ile
//                  daha az çıkar; efsanevi sadece %2
//  • special/epic/legend: Coin ile alınır, oranlar kademeli yükselir
//
// İçi ağırlıklandırma (sellPriceWeight) ayrıca her rarity havuzu içinde
// ucuz item'ları pahalılara göre çok daha sık düşürür.

export const CASE_DEFS = {
  farm_case: {
    name: "Çiftlik Kasası",
    emoji: "📦",
    price: 75,
    currency: "tl" as const,
    description: "Temel çiftlik NFT'leri",
    bgGradient: "linear-gradient(135deg, #2d5a1b, #4a8c2a)",
    // Beklenen değer ~1.1-1.2x fiyat — bkz. RARITY_SELL_PRICE_DIVISOR notu.
    drops: { common: 0.92, rare: 0.065, epic: 0.00, special: 0.012, legendary: 0.003 },
  },
  crystal_case: {
    name: "Kristal Kasa",
    emoji: "💠",
    price: 350,
    currency: "tl" as const,
    description: "Nadir ve değerli NFT'ler",
    bgGradient: "linear-gradient(135deg, #1a3a6b, #2d6bb5)",
    drops: { common: 0.50, rare: 0.38, epic: 0.03, special: 0.08, legendary: 0.01 },
  },
  special_case: {
    name: "Özel Kasa",
    emoji: "🔮",
    price: 750,
    currency: "coins" as const,
    description: "Nadir özel koleksiyon NFT'leri",
    bgGradient: "linear-gradient(135deg, #3b1f6e, #6d28d9)",
    drops: { common: 0.30, rare: 0.40, epic: 0.08, special: 0.19, legendary: 0.03 },
  },
  epic_case: {
    name: "Epik Kasa",
    emoji: "🔥",
    price: 1200,
    currency: "coins" as const,
    description: "Güçlü epik NFT'ler",
    bgGradient: "linear-gradient(135deg, #4a0808, #991b1b)",
    drops: { common: 0.10, rare: 0.25, epic: 0.52, special: 0.10, legendary: 0.03 },
  },
  legend_case: {
    name: "Efsane Kasası",
    emoji: "🏆",
    price: 1500,
    currency: "coins" as const,
    description: "En nadir efsanevi NFT'ler",
    bgGradient: "linear-gradient(135deg, #5c3000, #b8860b)",
    drops: { common: 0.05, rare: 0.15, epic: 0.35, special: 0.30, legendary: 0.15 },
  },
} as const;

// ── Rarity payout scale ────────────────────────────────────────────────────
// NFT_DEFS.sellPrice values below are "vitrin" / kolleksiyon değerleridir —
// nadir/epik/özel/efsanevi kalemler kasa fiyatlarına kıyasla çok yüksekti
// (örn. 75 TL'lik bir kasa ortalamada binlerce TL'lik nadir eşya veriyordu).
// Kasadan çıkan/satılan gerçek TL karşılığı bu bölücülerle ölçeklenir; vitrin
// ve pazar ekranlarında görünen isim/emoji/nadirlik aynı kalır, sadece bir
// NFT'nin sisteme SATIŞ değeri (ve dolayısıyla kasa beklenen değeri) düşer.
// Bölücüleri değiştirirsen CASE_DEFS.drops oranlarını da EV/fiyat oranına
// göre yeniden kontrol et.
const RARITY_SELL_PRICE_DIVISOR: Record<"common" | "rare" | "epic" | "special" | "legendary", number> = {
  common: 1.6,
  rare: 20,
  epic: 150,
  special: 50,
  legendary: 800,
};

function scaledSellPrice(rarity: keyof typeof RARITY_SELL_PRICE_DIVISOR, rawSellPrice: number): number {
  return Math.max(1, Math.round(rawSellPrice / RARITY_SELL_PRICE_DIVISOR[rarity]));
}

export type CaseType = keyof typeof CASE_DEFS;

// ── In-memory Market Price Simulation ────────────────────────────────────────

const HISTORY_LEN = 24;

interface PricePoint { price: number; ts: number }

// Initialize price history for each NFT type with 24 starting points
const priceHistory = new Map<NftType, PricePoint[]>(
  (Object.entries(NFT_DEFS) as [NftType, typeof NFT_DEFS[NftType]][]).map(([key, def]) => {
    const base = scaledSellPrice(def.rarity, def.sellPrice);
    const now = Date.now();
    const history: PricePoint[] = [];
    let price: number = base;
    for (let i = HISTORY_LEN - 1; i >= 0; i--) {
      const drift = (Math.random() - 0.48) * 0.06; // slight upward bias
      price = Math.max(1, Math.round(price * (1 + drift)));
      history.push({ price, ts: now - i * 20000 });
    }
    return [key, history];
  })
);

// Fluctuate prices every 15 seconds
setInterval(() => {
  (Object.keys(NFT_DEFS) as NftType[]).forEach(key => {
    const hist = priceHistory.get(key)!;
    const last = hist[hist.length - 1].price;
    const drift = (Math.random() - 0.48) * 0.08;
    const newPrice = Math.max(1, Math.round(last * (1 + drift)));
    hist.push({ price: newPrice, ts: Date.now() });
    if (hist.length > HISTORY_LEN) hist.shift();
  });
}, 15000);

function getCurrentPrice(key: NftType): number {
  const hist = priceHistory.get(key);
  if (!hist || hist.length === 0) return 10;
  return hist[hist.length - 1].price;
}

// ── Helper: grant an NFT ─────────────────────────────────────────────────────

export async function grantNft(telegramId: string, nftType: NftType): Promise<void> {
  const existing = await db.query.nftsTable.findFirst({
    where: and(eq(nftsTable.ownerTelegramId, telegramId), eq(nftsTable.nftType, nftType)),
  });
  if (existing) return;
  const def = NFT_DEFS[nftType];
  await db.insert(nftsTable).values({
    id: crypto.randomUUID(),
    ownerTelegramId: telegramId,
    nftType,
    rarity: def.rarity,
    name: def.name,
    emoji: def.emoji,
    mintNumber: Math.floor(Math.random() * def.mintLimit) + 1,
    isListedForTrade: false,
    listPrice: null,
  }).onConflictDoNothing();
}

// ── Within-rarity drop weight ─────────────────────────────────────────────────
// Kontroller YÜKSEKTEN DÜŞÜĞE sıralanmıştır — bu sayede daha yüksek bir eşik
// yanlışlıkla önceki dalda yakalanmaz.
//
//  Fiyat aralığı          → ağırlık   (açıklama)
//  ≥ 500 000 TL           →  1×   ultra-nadir legendary
//  ≥ 200 000 TL           →  2×   çok nadir legendary
//  ≥  70 000 TL           →  3×   nadir legendary + pahalı epic
//  ≥  40 000 TL           →  5×   orta legendary + orta epic
//  ≥  22 000 TL           → 10×   ucuz legendary + ucuz epic (22k-40k)
//  ≥  16 000 TL           →  2×   pahalı special
//  ≥  12 000 TL           →  4×   orta special
//  ≥   8 000 TL           →  8×   ucuz special
//  ≥   7 000 TL           →  1×   pahalı rare (7k+)
//  ≥   5 000 TL           →  2×   nadir rare (5-7k)
//  ≥   3 500 TL           →  4×   orta rare (3.5-5k)
//  ≥   2 000 TL           →  7×   ucuz-orta rare (2-3.5k)
//  < 2 000 TL             → 12×   en ucuz rare + tüm common'lar
function sellPriceWeight(sellPrice: number): number {
  if (sellPrice >= 500_000) return 1;
  if (sellPrice >= 200_000) return 2;
  if (sellPrice >= 70_000)  return 3;
  if (sellPrice >= 40_000)  return 5;
  if (sellPrice >= 22_000)  return 10;
  // Special tier (8.5k – 22k)
  if (sellPrice >= 16_000)  return 2;
  if (sellPrice >= 12_000)  return 4;
  if (sellPrice >= 8_000)   return 8;
  // Rare tier (1.5k – 7.2k)
  if (sellPrice >= 7_000)   return 1;
  if (sellPrice >= 5_000)   return 2;
  if (sellPrice >= 3_500)   return 4;
  if (sellPrice >= 2_000)   return 7;
  // Common + en ucuz rares
  return 12;
}

function pickRandomNft(rarity: "common" | "rare" | "epic" | "special" | "legendary"): NftType {
  const pool = (Object.entries(NFT_DEFS) as [NftType, typeof NFT_DEFS[NftType]][])
    .filter(([, def]) => def.rarity === rarity);

  // Güvenlik: "special" vb. boş kalırsa rare'e geri dön
  if (pool.length === 0) return pickRandomNft("rare");

  // Ağırlıklı rastgele seçim — pahalı item'lar daha nadir düşer
  const totalWeight = pool.reduce((sum, [, def]) => sum + sellPriceWeight(def.sellPrice), 0);
  let rand = Math.random() * totalWeight;
  for (const [key, def] of pool) {
    rand -= sellPriceWeight(def.sellPrice);
    if (rand <= 0) return key;
  }
  return pool[pool.length - 1][0];
}

function rollRarity(drops: { common: number; rare: number; epic?: number; special: number; legendary: number }): "common" | "rare" | "epic" | "special" | "legendary" {
  const r = Math.random();
  if (r < drops.legendary) return "legendary";
  if (r < drops.legendary + (drops.epic ?? 0)) return "epic";
  if (r < drops.legendary + (drops.epic ?? 0) + drops.special) return "special";
  if (r < drops.legendary + (drops.epic ?? 0) + drops.special + drops.rare) return "rare";
  return "common";
}

function serializeNft(n: typeof nftsTable.$inferSelect) {
  const def = NFT_DEFS[n.nftType as NftType];
  return {
    id: n.id,
    ownerTelegramId: n.ownerTelegramId,
    nftType: n.nftType,
    rarity: n.rarity,
    name: n.name,
    emoji: n.emoji,
    mintNumber: n.mintNumber,
    isListedForTrade: n.isListedForTrade,
    listPrice: n.listPrice ?? null,
    sellPrice: def ? scaledSellPrice(def.rarity, def.sellPrice) : 10,
    marketPrice: getCurrentPrice(n.nftType as NftType),
    createdAt: n.createdAt.toISOString(),
  };
}

// Restricted drop table used when an NFT case is granted "for free" (e.g. bought
// with a small amount of Coins in the Coin Shop) instead of paid with real TL/Stars
// value. Common-only: a "rare" NFT here can sell for 1,500-7,000+ TL, which used
// to make this a cheap way to mint a real-money windfall for a handful of Coins
// (roughly the cost of a few Telegram Stars). Any rare-or-better odds are reserved
// for cases users actually pay meaningful TL/Coins for via /nfts/cases/open.
const FREE_CASE_DROPS = { common: 1, rare: 0, epic: 0, special: 0, legendary: 0 };

// ── Public helper: mint a free NFT from a case (no TL cost) ─────────────────
export async function mintFreeNftFromCase(
  telegramId: string,
  caseType: CaseType,
): Promise<{
  id: string; ownerTelegramId: string; nftType: string; rarity: string;
  name: string; emoji: string; mintNumber: number; isListedForTrade: boolean;
  listPrice: null; sellPrice: number; marketPrice: number; createdAt: string;
}> {
  const caseDef = CASE_DEFS[caseType];
  const rarity   = rollRarity(FREE_CASE_DROPS);
  const nftType  = pickRandomNft(rarity);
  const nftDef   = NFT_DEFS[nftType];
  const mintNumber = Math.floor(Math.random() * nftDef.mintLimit) + 1;
  const nftId    = crypto.randomUUID();
  const now      = new Date();

  await db.insert(nftsTable).values({
    id: nftId,
    ownerTelegramId: telegramId,
    nftType,
    rarity: nftDef.rarity,
    name: nftDef.name,
    emoji: nftDef.emoji,
    mintNumber,
    isListedForTrade: false,
    listPrice: null,
  });

  return {
    id: nftId,
    ownerTelegramId: telegramId,
    nftType,
    rarity: nftDef.rarity,
    name: nftDef.name,
    emoji: nftDef.emoji,
    mintNumber,
    isListedForTrade: false,
    listPrice: null,
    sellPrice: scaledSellPrice(nftDef.rarity, nftDef.sellPrice),
    marketPrice: getCurrentPrice(nftType),
    createdAt: now.toISOString(),
  };
}

// ── Routes ───────────────────────────────────────────────────────────────────

// GET /nfts/cases
router.get("/cases", (_req, res): void => {
  const entries = Object.entries(NFT_DEFS) as [NftType, typeof NFT_DEFS[NftType]][];
  const byRarity = (rarity: string) => entries.filter(([, d]) => d.rarity === rarity).map(([key, d]) => {
    const raw = d as typeof d & { coinBonus?: number };
    return {
      key,
      ...d,
      sellPrice: scaledSellPrice(d.rarity, d.sellPrice),
      ...(typeof raw.coinBonus === "number"
        ? { coinBonus: Math.max(1, Math.round(raw.coinBonus / RARITY_SELL_PRICE_DIVISOR[d.rarity])) }
        : {}),
    };
  });
  const result = (Object.entries(CASE_DEFS) as [CaseType, typeof CASE_DEFS[CaseType]][]).map(([id, def]) => ({
    id,
    ...def,
    nftPool: {
      common: byRarity("common"),
      rare: byRarity("rare"),
      epic: byRarity("epic"),
      special: byRarity("special"),
      legendary: byRarity("legendary"),
    },
  }));
  res.json(result);
});

// GET /nfts/market/prices — current prices + history for all NFT types
router.get("/market/prices", (_req, res): void => {
  const result = (Object.entries(NFT_DEFS) as [NftType, typeof NFT_DEFS[NftType]][]).map(([key, def]) => {
    const hist = priceHistory.get(key)!;
    const current = hist[hist.length - 1].price;
    const prev = hist[hist.length - 2]?.price ?? current;
    const change = prev > 0 ? ((current - prev) / prev) * 100 : 0;
    const allTimeHigh = Math.max(...hist.map(h => h.price));
    const allTimeLow = Math.min(...hist.map(h => h.price));
    return {
      nftType: key,
      emoji: def.emoji,
      name: def.name,
      rarity: def.rarity,
      basePrice: scaledSellPrice(def.rarity, def.sellPrice),
      currentPrice: current,
      change: Math.round(change * 100) / 100,
      history: hist.map(h => h.price),
      allTimeHigh,
      allTimeLow,
    };
  });
  res.json(result);
});

// POST /nfts/cases/open
router.post("/cases/open", async (req, res): Promise<void> => {
  const { telegramId, caseType } = req.body as { telegramId: string; caseType: CaseType };
  if (!telegramId || !caseType || !CASE_DEFS[caseType]) {
    res.status(400).json({ error: "telegramId and valid caseType required" });
    return;
  }
  const caseDef = CASE_DEFS[caseType];
  const rarity = rollRarity(caseDef.drops);
  const nftType = pickRandomNft(rarity);
  const nftDef = NFT_DEFS[nftType];
  const mintNumber = Math.floor(Math.random() * nftDef.mintLimit) + 1;
  const nftId = crypto.randomUUID();
  const now = new Date();
  const isCoins = caseDef.currency === "coins";
  // Coin bonus for special/legendary/rare NFTs that have one defined — scaled by
  // the same rarity divisor as sellPrice, since converting Coins to TL is possible
  // (see COIN_TO_TL_RATE in stars.ts) and this bonus must stay in line with it.
  const rawCoinBonus: number = ("coinBonus" in nftDef && typeof (nftDef as { coinBonus?: number }).coinBonus === "number")
    ? (nftDef as { coinBonus: number }).coinBonus
    : 0;
  const coinBonus: number = rawCoinBonus > 0 ? Math.max(1, Math.round(rawCoinBonus / RARITY_SELL_PRICE_DIVISOR[nftDef.rarity])) : 0;

  try {
    await db.transaction(async (tx) => {
      // Deduct case cost (TL or Coins)
      const updated = isCoins
        ? await tx
            .update(usersTable)
            .set({ coins: sql`${usersTable.coins} - ${caseDef.price}` })
            .where(and(eq(usersTable.telegramId, telegramId), sql`${usersTable.coins} >= ${caseDef.price}`))
            .returning({ telegramId: usersTable.telegramId })
        : await tx
            .update(usersTable)
            .set({ balance: sql`${usersTable.balance} - ${caseDef.price}` })
            .where(and(eq(usersTable.telegramId, telegramId), sql`${usersTable.balance} >= ${caseDef.price}`))
            .returning({ telegramId: usersTable.telegramId });
      if (updated.length === 0) {
        const user = await tx.query.usersTable.findFirst({ where: eq(usersTable.telegramId, telegramId), columns: { telegramId: true } });
        throw new Error(user ? "INSUFFICIENT_BALANCE" : "USER_NOT_FOUND");
      }
      // Grant NFT
      await tx.insert(nftsTable).values({
        id: nftId, ownerTelegramId: telegramId, nftType, rarity: nftDef.rarity,
        name: nftDef.name, emoji: nftDef.emoji, mintNumber, isListedForTrade: false, listPrice: null,
      });
      // Credit bonus coins if NFT has a coinBonus
      if (coinBonus > 0) {
        await tx
          .update(usersTable)
          .set({ coins: sql`${usersTable.coins} + ${coinBonus}` })
          .where(eq(usersTable.telegramId, telegramId));
      }
    });
  } catch (e: any) {
    if (e.message === "USER_NOT_FOUND") res.status(404).json({ error: "Kullanıcı bulunamadı" });
    else if (e.message === "INSUFFICIENT_BALANCE") res.status(402).json({ error: isCoins ? "Yetersiz coin! Görevlerden ve çevirmeceden coin kazan." : "Yetersiz TL bakiyesi. Çiftliğini geliştir!" });
    else res.status(500).json({ error: "Kasa açılamadı" });
    return;
  }
  res.json({
    id: nftId, ownerTelegramId: telegramId, nftType, rarity: nftDef.rarity,
    name: nftDef.name, emoji: nftDef.emoji, mintNumber, isListedForTrade: false,
    listPrice: null, sellPrice: scaledSellPrice(nftDef.rarity, nftDef.sellPrice), marketPrice: getCurrentPrice(nftType),
    createdAt: now.toISOString(),
    bonusCoins: coinBonus > 0 ? coinBonus : undefined,
  });
});

// POST /nfts/sell — sell to system for fixed price
router.post("/sell", async (req, res): Promise<void> => {
  const { telegramId, nftId } = req.body as { telegramId: string; nftId: string };
  if (!telegramId || !nftId) { res.status(400).json({ error: "required" }); return; }
  let earnedTl = 0; let nftType = "";
  try {
    await db.transaction(async (tx) => {
      const deleted = await tx.delete(nftsTable)
        .where(and(eq(nftsTable.id, nftId), eq(nftsTable.ownerTelegramId, telegramId)))
        .returning();
      if (deleted.length === 0) throw new Error("NOT_FOUND");
      const nft = deleted[0];
      const def = NFT_DEFS[nft.nftType as NftType];
      earnedTl = def ? scaledSellPrice(def.rarity, def.sellPrice) : 10; nftType = nft.nftType;
      await tx.update(usersTable).set({ balance: sql`${usersTable.balance} + ${earnedTl}` }).where(eq(usersTable.telegramId, telegramId));
    });
  } catch (e: any) {
    if (e.message === "NOT_FOUND") res.status(404).json({ error: "NFT bulunamadı" });
    else res.status(500).json({ error: "Satış başarısız" });
    return;
  }
  res.json({ success: true, earnedTl, nftType });
});

// POST /nfts/list-for-sale — list NFT on exchange with a TL price
router.post("/list-for-sale", async (req, res): Promise<void> => {
  const { telegramId, nftId, price } = req.body as { telegramId: string; nftId: string; price: number | null };
  if (!telegramId || !nftId) { res.status(400).json({ error: "required" }); return; }
  const nft = await db.query.nftsTable.findFirst({ where: and(eq(nftsTable.id, nftId), eq(nftsTable.ownerTelegramId, telegramId)) });
  if (!nft) { res.status(404).json({ error: "NFT bulunamadı" }); return; }
  const listPrice = price && price > 0 ? Math.round(price) : null;
  const updated = await db.update(nftsTable)
    .set({ listPrice, isListedForTrade: listPrice !== null })
    .where(eq(nftsTable.id, nftId))
    .returning();
  res.json(serializeNft(updated[0]));
});

// POST /nfts/buy — buy a market-listed NFT with TL
router.post("/buy", async (req, res): Promise<void> => {
  const { telegramId, nftId } = req.body as { telegramId: string; nftId: string };
  if (!telegramId || !nftId) { res.status(400).json({ error: "required" }); return; }
  let paidTl = 0;
  try {
    await db.transaction(async (tx) => {
      const nft = await tx.query.nftsTable.findFirst({ where: and(eq(nftsTable.id, nftId), isNotNull(nftsTable.listPrice)) });
      if (!nft || !nft.listPrice) throw new Error("NOT_LISTED");
      if (nft.ownerTelegramId === telegramId) throw new Error("OWN_NFT");
      paidTl = nft.listPrice;
      // Deduct buyer balance
      const deducted = await tx.update(usersTable)
        .set({ balance: sql`${usersTable.balance} - ${paidTl}` })
        .where(and(eq(usersTable.telegramId, telegramId), sql`${usersTable.balance} >= ${paidTl}`))
        .returning({ telegramId: usersTable.telegramId });
      if (deducted.length === 0) throw new Error("INSUFFICIENT_BALANCE");
      // Credit seller
      await tx.update(usersTable)
        .set({ balance: sql`${usersTable.balance} + ${paidTl}` })
        .where(eq(usersTable.telegramId, nft.ownerTelegramId));
      // Transfer NFT
      await tx.update(nftsTable)
        .set({ ownerTelegramId: telegramId, isListedForTrade: false, listPrice: null })
        .where(eq(nftsTable.id, nftId));
      // Update market price (sale price influences market)
      const hist = priceHistory.get(nft.nftType as NftType);
      if (hist) {
        hist.push({ price: paidTl, ts: Date.now() });
        if (hist.length > HISTORY_LEN) hist.shift();
      }
    });
  } catch (e: any) {
    if (e.message === "NOT_LISTED") res.status(404).json({ error: "Bu NFT satışta değil" });
    else if (e.message === "OWN_NFT") res.status(400).json({ error: "Kendi NFT'ini satın alamazsın" });
    else if (e.message === "INSUFFICIENT_BALANCE") res.status(402).json({ error: "Yetersiz TL bakiyesi" });
    else res.status(500).json({ error: "Satın alma başarısız" });
    return;
  }
  res.json({ success: true, paidTl });
});

// GET /nfts/user/:telegramId
router.get("/user/:telegramId", async (req, res): Promise<void> => {
  const nfts = await db.query.nftsTable.findMany({
    where: eq(nftsTable.ownerTelegramId, req.params.telegramId),
    orderBy: [desc(nftsTable.createdAt)],
  });
  res.json(nfts.map(serializeNft));
});

// POST /nfts/list-trade (legacy — keep for backward compat)
router.post("/list-trade", async (req, res): Promise<void> => {
  const { telegramId, nftId, list } = req.body as { telegramId: string; nftId: string; list: boolean };
  if (!telegramId || !nftId || typeof list !== "boolean") { res.status(400).json({ error: "required" }); return; }
  const nft = await db.query.nftsTable.findFirst({ where: and(eq(nftsTable.id, nftId), eq(nftsTable.ownerTelegramId, telegramId)) });
  if (!nft) { res.status(404).json({ error: "NFT not found" }); return; }
  const updated = await db.update(nftsTable).set({ isListedForTrade: list, listPrice: list ? nft.listPrice : null }).where(eq(nftsTable.id, nftId)).returning();
  res.json(serializeNft(updated[0]));
});

// GET /nfts/market — all NFTs listed for sale on exchange
router.get("/market", async (_req, res): Promise<void> => {
  const listed = await db.query.nftsTable.findMany({
    where: isNotNull(nftsTable.listPrice),
    orderBy: [desc(nftsTable.createdAt)],
    limit: 200,
  });
  res.json(listed.map(serializeNft));
});

// GET /nfts/showcase — NFTs from recently active users (for live community strip)
// Pass ?exclude=telegramId to hide the current user's own NFTs
router.get("/showcase", async (req, res): Promise<void> => {
  // Accept only a plain string to avoid SQL type errors with arrays/objects
  const excludeRaw = req.query.exclude;
  const excludeId = typeof excludeRaw === "string" && excludeRaw.length > 0 ? excludeRaw : null;
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

  // Get recently active users (logged in within 2 hours), excluding current user
  const activeUsers = await db
    .select({ telegramId: usersTable.telegramId, firstName: usersTable.firstName })
    .from(usersTable)
    .where(
      excludeId
        ? and(gte(usersTable.lastLoginAt, twoHoursAgo), sql`${usersTable.telegramId} != ${excludeId}`)
        : gte(usersTable.lastLoginAt, twoHoursAgo)
    )
    .limit(100);

  let nfts: (typeof nftsTable.$inferSelect)[] = [];

  if (activeUsers.length > 0) {
    const activeIds = activeUsers.map((u) => u.telegramId);
    nfts = await db.query.nftsTable.findMany({
      where: inArray(nftsTable.ownerTelegramId, activeIds),
      orderBy: [desc(nftsTable.createdAt)],
      limit: 40,
    });
  }

  // Pad with recent NFTs if we don't have enough (still excluding current user)
  if (nfts.length < 10) {
    const recent = await db.query.nftsTable.findMany({
      where: excludeId ? sql`${nftsTable.ownerTelegramId} != ${excludeId}` : undefined,
      orderBy: [desc(nftsTable.createdAt)],
      limit: 40,
    });
    const existing = new Set(nfts.map((n) => n.id));
    for (const n of recent) {
      if (!existing.has(n.id)) nfts.push(n);
      if (nfts.length >= 30) break;
    }
  }

  // Sort: legendary → epic → special → rare → common
  const rarityOrder: Record<string, number> = { legendary: 0, epic: 1, special: 2, rare: 3, common: 4 };
  nfts.sort((a, b) => (rarityOrder[a.rarity] ?? 3) - (rarityOrder[b.rarity] ?? 3));
  nfts = nfts.slice(0, 20);

  // Enrich with owner names
  const ownerIds = [...new Set(nfts.map((n) => n.ownerTelegramId))];
  const ownerRows =
    ownerIds.length > 0
      ? await db
          .select({ telegramId: usersTable.telegramId, firstName: usersTable.firstName })
          .from(usersTable)
          .where(inArray(usersTable.telegramId, ownerIds))
      : [];
  const ownerMap = new Map(ownerRows.map((o) => [o.telegramId, o.firstName]));

  res.json(
    nfts.map((n) => ({
      id: n.id,
      nftType: n.nftType,
      rarity: n.rarity,
      name: n.name,
      emoji: n.emoji,
      ownerName: ownerMap.get(n.ownerTelegramId) ?? "Çiftçi",
    })),
  );
});

// POST /nfts/trade/offer
router.post("/trade/offer", async (req, res): Promise<void> => {
  const { offererTelegramId, offeredNftId, targetTelegramId, wantedNftType } = req.body as { offererTelegramId: string; offeredNftId: string; targetTelegramId?: string; wantedNftType?: string };
  if (!offererTelegramId || !offeredNftId) { res.status(400).json({ error: "required" }); return; }
  const nft = await db.query.nftsTable.findFirst({ where: and(eq(nftsTable.id, offeredNftId), eq(nftsTable.ownerTelegramId, offererTelegramId)) });
  if (!nft) { res.status(404).json({ error: "NFT not found" }); return; }
  const id = crypto.randomUUID();
  await db.insert(nftTradeOffersTable).values({ id, offererTelegramId, offeredNftId, targetTelegramId: targetTelegramId ?? null, wantedNftType: wantedNftType ?? null, status: "pending" });
  res.json({ id, offererTelegramId, offeredNftId, targetTelegramId: targetTelegramId ?? null, wantedNftType: wantedNftType ?? null, status: "pending", createdAt: new Date().toISOString(), offeredNft: serializeNft(nft) });
});

// GET /nfts/trade/offers/:telegramId
router.get("/trade/offers/:telegramId", async (req, res): Promise<void> => {
  const { telegramId } = req.params;
  const offers = await db.query.nftTradeOffersTable.findMany({ where: and(eq(nftTradeOffersTable.status, "pending"), or(eq(nftTradeOffersTable.targetTelegramId, telegramId), isNull(nftTradeOffersTable.targetTelegramId))), orderBy: [desc(nftTradeOffersTable.createdAt)], limit: 50 });
  const enriched = await Promise.all(offers.map(async (o) => {
    const offeredNft = await db.query.nftsTable.findFirst({ where: eq(nftsTable.id, o.offeredNftId) });
    return { id: o.id, offererTelegramId: o.offererTelegramId, offeredNftId: o.offeredNftId, targetTelegramId: o.targetTelegramId, wantedNftType: o.wantedNftType, status: o.status, createdAt: o.createdAt.toISOString(), offeredNft: offeredNft ? serializeNft(offeredNft) : null };
  }));
  res.json(enriched);
});

// POST /nfts/trade/accept
router.post("/trade/accept", async (req, res): Promise<void> => {
  const { telegramId, offerId, acceptorNftId } = req.body as { telegramId: string; offerId: string; acceptorNftId: string };
  if (!telegramId || !offerId || !acceptorNftId) { res.status(400).json({ error: "required" }); return; }
  const offer = await db.query.nftTradeOffersTable.findFirst({ where: and(eq(nftTradeOffersTable.id, offerId), eq(nftTradeOffersTable.status, "pending")) });
  if (!offer) { res.status(404).json({ error: "Offer not found" }); return; }
  const acceptorNft = await db.query.nftsTable.findFirst({ where: and(eq(nftsTable.id, acceptorNftId), eq(nftsTable.ownerTelegramId, telegramId)) });
  if (!acceptorNft) { res.status(404).json({ error: "Your NFT not found" }); return; }
  await db.transaction(async (tx) => {
    await tx.update(nftsTable).set({ ownerTelegramId: telegramId, isListedForTrade: false, listPrice: null }).where(eq(nftsTable.id, offer.offeredNftId));
    await tx.update(nftsTable).set({ ownerTelegramId: offer.offererTelegramId, isListedForTrade: false, listPrice: null }).where(eq(nftsTable.id, acceptorNftId));
    await tx.update(nftTradeOffersTable).set({ status: "accepted", resolvedAt: new Date() }).where(eq(nftTradeOffersTable.id, offerId));
  });
  res.json({ success: true });
});

export default router;
