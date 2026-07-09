--
-- PostgreSQL database dump
--

\restrict N598oG69dWdOTJU8LzYSvOv8CaXjNUQH8DykZ8pX6NgEwRnL43xohOQvwFbykoq

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: nft_rarity; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.nft_rarity AS ENUM (
    'common',
    'rare',
    'special',
    'legendary'
);


--
-- Name: trade_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.trade_status AS ENUM (
    'pending',
    'accepted',
    'rejected',
    'cancelled'
);


--
-- Name: vault_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.vault_status AS ENUM (
    'locked',
    'mature',
    'claimed'
);


--
-- Name: withdrawal_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.withdrawal_status AS ENUM (
    'pending',
    'approved',
    'rejected'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: achievements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.achievements (
    id integer NOT NULL,
    user_telegram_id text NOT NULL,
    achievement_key text NOT NULL,
    earned_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: achievements_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.achievements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: achievements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.achievements_id_seq OWNED BY public.achievements.id;


--
-- Name: nft_trade_offers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nft_trade_offers (
    id text NOT NULL,
    offerer_telegram_id text NOT NULL,
    offered_nft_id text NOT NULL,
    target_telegram_id text,
    wanted_nft_type text,
    status public.trade_status DEFAULT 'pending'::public.trade_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    resolved_at timestamp with time zone
);


--
-- Name: nfts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nfts (
    id text NOT NULL,
    owner_telegram_id text NOT NULL,
    nft_type text NOT NULL,
    rarity public.nft_rarity NOT NULL,
    name text NOT NULL,
    emoji text NOT NULL,
    mint_number integer DEFAULT 0 NOT NULL,
    is_listed_for_trade boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    list_price integer
);


--
-- Name: referrals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.referrals (
    id integer NOT NULL,
    referrer_telegram_id text NOT NULL,
    referred_telegram_id text NOT NULL,
    coins_earned integer DEFAULT 500 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: referrals_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.referrals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: referrals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.referrals_id_seq OWNED BY public.referrals.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    telegram_id text NOT NULL,
    first_name text NOT NULL,
    username text,
    coins numeric(18,2) DEFAULT '0'::numeric NOT NULL,
    balance numeric(18,2) DEFAULT '0'::numeric NOT NULL,
    farm_state jsonb DEFAULT '{"cow": 1, "wheat": 1, "chicken": 1}'::jsonb,
    streak_count integer DEFAULT 0 NOT NULL,
    last_login_at timestamp with time zone,
    last_spin_at timestamp with time zone,
    total_referrals integer DEFAULT 0 NOT NULL,
    referred_by text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: vault_deposits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vault_deposits (
    id text NOT NULL,
    user_telegram_id text NOT NULL,
    coins_deposited numeric(18,0) NOT NULL,
    lock_days integer NOT NULL,
    multiplier numeric(4,2) NOT NULL,
    coins_to_receive numeric(18,0) NOT NULL,
    matures_at timestamp with time zone NOT NULL,
    status public.vault_status DEFAULT 'locked'::public.vault_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    claimed_at timestamp with time zone
);


--
-- Name: withdrawals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.withdrawals (
    id text NOT NULL,
    user_telegram_id text NOT NULL,
    amount numeric(10,2) NOT NULL,
    method text NOT NULL,
    status public.withdrawal_status DEFAULT 'pending'::public.withdrawal_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    processed_at timestamp with time zone
);


--
-- Name: achievements id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.achievements ALTER COLUMN id SET DEFAULT nextval('public.achievements_id_seq'::regclass);


--
-- Name: referrals id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals ALTER COLUMN id SET DEFAULT nextval('public.referrals_id_seq'::regclass);


--
-- Data for Name: achievements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.achievements (id, user_telegram_id, achievement_key, earned_at) FROM stdin;
1	demo_user	first_upgrade	2026-07-07 16:36:12.700191+00
2	8796950502	first_upgrade	2026-07-07 16:51:52.456578+00
3	8652151076	first_upgrade	2026-07-07 16:55:49.345582+00
4	8706543922	first_upgrade	2026-07-07 21:11:17.598494+00
5	8652151076	task_channel_join	2026-07-08 07:03:58.452979+00
9	8796950502	task_channel_join	2026-07-08 08:18:49.101516+00
16	8706543922	task_share	2026-07-08 09:27:52.476894+00
17	8706543922	task_channel_join	2026-07-08 09:28:05.342558+00
\.


--
-- Data for Name: nft_trade_offers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.nft_trade_offers (id, offerer_telegram_id, offered_nft_id, target_telegram_id, wanted_nft_type, status, created_at, resolved_at) FROM stdin;
\.


--
-- Data for Name: nfts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.nfts (id, owner_telegram_id, nft_type, rarity, name, emoji, mint_number, is_listed_for_trade, created_at, list_price) FROM stdin;
ab1854b0-ea88-45a4-91be-e1a864e89b3e	demo_user	corn_cob	common	Mısır Koçanı	🌽	36260	f	2026-07-07 17:04:38.399026+00	\N
06771ea1-d5b3-4135-9465-4ea78288f5b2	demo_user	farm_stone	common	Çiftlik Taşı	🪨	8672	f	2026-07-07 17:04:47.242254+00	\N
f5b951d1-b5ba-41f8-9b8b-616aa1d2b8c7	demo_user	golden_bee	rare	Altın Arı	🐝	1117	f	2026-07-07 17:08:29.720197+00	\N
6f05ce67-38fd-41ed-b42c-fa40d3b45fc1	demo_user	farm_pioneer	common	Farm Pioneer	🌟	4004	f	2026-07-07 16:30:58.028386+00	\N
02fc34a2-c070-4499-82f5-2f6d686c858b	demo_user	flower_pot	common	Çiçek Saksısı	🪴	1554	f	2026-07-07 17:21:53.833811+00	\N
3c3bcb7a-44af-454f-bdf7-2cfb587e78f0	demo_user	farm_lantern	common	Çiftlik Feneri	🏮	7175	f	2026-07-07 17:23:42.453152+00	\N
afda88e4-0b55-443d-9965-aca796cf03c5	demo_user	wheat_seed	common	Buğday Tohumu	🌾	6272	f	2026-07-07 17:56:38.674215+00	\N
13ef6011-4c2c-4071-a16b-67ad1ce9ee28	demo_user	chicken_feather	common	Tavuk Tüyü	🪶	13982	f	2026-07-07 18:21:13.601649+00	\N
0db6421e-f092-4859-8bca-d7c269073cb9	demo_user	chicken_feather	common	Tavuk Tüyü	🪶	5607	f	2026-07-07 18:39:55.262214+00	\N
7059938b-ec69-4f0e-9171-da4abbd00ec4	demo_user	carrot_fresh	common	Taze Havuç	🥕	4868	f	2026-07-07 18:49:25.530467+00	\N
4f3a1c80-9dc3-4025-b79a-c45a4ba94565	demo_user	rainbow_flower	rare	Gökkuşağı Çiçeği	🌈	25	f	2026-07-07 19:12:54.880838+00	\N
71713ff7-b10f-4d04-9bf9-a4a00cb4339a	8652151076	evil_eye_charm	rare	Göz Nazarlık	🪬	232	t	2026-07-07 20:49:55.587964+00	5209
2bf82246-28f2-4eb0-af4b-0371082144d3	8796950502	silver_moon	rare	Gümüş Ay Parçası	🌙	3884	f	2026-07-07 22:14:04.913368+00	\N
8face3ad-a0f2-4955-a627-ba5677edb857	8796950502	magic_wand	legendary	Sihirli Değnek	🪄	45	f	2026-07-07 22:14:18.8963+00	\N
29070618-d75e-4371-93e0-4e0515396631	8796950502	eternal_eye	legendary	Sonsuz Göz	👁️	24	f	2026-07-07 22:14:28.635364+00	\N
8124a8b3-0fd6-46a2-a063-7aa369773500	8796950502	void_pearl	legendary	Void İncisi	🫧	12	f	2026-07-07 22:14:41.508128+00	\N
409ada7b-1ce6-499d-808f-87d7d3fbfcf1	8796950502	crescent_blade	special	Hilal Bıçağı	🌜	28	f	2026-07-07 22:14:49.506232+00	\N
f7d2ecbd-5c5f-4499-bca6-65103231a223	8796950502	dragon_heart	legendary	Ejder Kalbi	🐲	4	f	2026-07-07 22:14:59.101836+00	\N
c64a3a70-5500-40bd-8f58-8118f9a942a4	8796950502	cosmic_mind	legendary	Kozmik Zihin	🧠	2	f	2026-07-07 22:15:07.434422+00	\N
b4685a6a-4575-47e1-93d1-7ec67e722956	8796950502	dragon_heart	legendary	Ejder Kalbi	🐲	17	f	2026-07-07 22:15:17.970662+00	\N
a2decf03-7ace-42c1-b06d-64bba51bcf7e	8796950502	angel_wing	special	Melek Kanadı	🪽	2	f	2026-07-07 22:46:06.991469+00	\N
9a549dbe-88c6-42aa-84c3-1927a49b8314	8796950502	phoenix_core	legendary	Anka Kalbi	❤️‍🔥	3	f	2026-07-07 22:46:45.509121+00	\N
547c55aa-ca6f-4eef-9d1e-052184210975	8796950502	legend_sword	legendary	Efsane Kılıcı	⚔️	1	f	2026-07-07 22:46:53.450353+00	\N
c32cc9c3-9a35-4e39-8b67-5ff1472c94e9	8796950502	wise_owl	rare	Bilge Baykuş	🦉	1040	f	2026-07-07 22:47:03.997083+00	\N
29222ecb-d642-44ae-a3c0-4158ee2e64c5	8796950502	void_crystal	special	Void Kristali	💠	7	f	2026-07-07 22:47:12.240394+00	\N
51cbbd80-9659-4421-81a4-b2a47c10bff0	8796950502	destiny_mark	special	Kader İşareti	🎯	64	f	2026-07-07 22:47:22.954713+00	\N
1303f111-89c8-40bc-94fe-c0618c7d035b	8796950502	poseidon_spear	legendary	Poseidon Mızrağı	🌊	97	f	2026-07-07 22:47:30.062473+00	\N
f5ed9e37-21aa-4752-a359-2b415f0d6d2c	8652151076	golden_bee	rare	Altın Arı	🐝	1239	f	2026-07-08 07:08:04.027591+00	\N
c51ce889-0869-43dc-9b64-a9454a2b01b1	chain_a	mystic_seal	special	Mistik Mühür	🔯	403	f	2026-07-08 07:39:09.580437+00	\N
5c7195a4-e448-4b1d-99a5-f17a9ad2a4a8	chain_b	mystic_seal	special	Mistik Mühür	🔯	342	f	2026-07-08 07:39:09.648202+00	\N
703eb511-5c9c-4a28-a592-43414d90a28a	ref_test_a	mystic_seal	special	Mistik Mühür	🔯	389	f	2026-07-08 08:21:51.159355+00	\N
066852f9-b237-4f7b-90a0-f188e1b0155a	ref_test_b	mystic_seal	special	Mistik Mühür	🔯	72	f	2026-07-08 08:22:00.885876+00	\N
0d0c8224-11fc-42df-8ec8-34e10ec2063e	test_referrer_1	mystic_seal	special	Mistik Mühür	🔯	356	f	2026-07-08 09:07:55.461947+00	\N
\.


--
-- Data for Name: referrals; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.referrals (id, referrer_telegram_id, referred_telegram_id, coins_earned, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (telegram_id, first_name, username, coins, balance, farm_state, streak_count, last_login_at, last_spin_at, total_referrals, referred_by, created_at) FROM stdin;
8392479231	Chalpus Yeniden	yenidenchalpus	0.00	0.00	{"cow": 1, "wheat": 1, "chicken": 1}	1	2026-07-07 20:53:53.524+00	\N	0	\N	2026-07-07 20:53:27.214559+00
8969600828	Mehmet	B4jJuva	220.00	0.00	{"cow": 1, "wheat": 1, "chicken": 1}	1	2026-07-07 15:28:36.205+00	2026-07-07 15:28:33.014+00	0	\N	2026-07-07 15:28:26.501384+00
8674827531	Umut	Geofdes	220.00	0.00	{"cow": 1, "wheat": 1, "chicken": 1}	1	2026-07-07 15:29:52.728+00	2026-07-07 15:29:49.414+00	0	\N	2026-07-07 15:29:43.586675+00
8652151076	SHARONUZ	Sharonuz	165.00	100.00	{"cow": 0, "wheat": 1, "chicken": 0}	2	2026-07-09 10:33:18.396+00	2026-07-08 08:24:36.945+00	0	\N	2026-07-07 16:53:23.814499+00
7739413359	Hey sleever	HeySleever	0.00	0.00	{"cow": 1, "wheat": 1, "chicken": 1}	1	2026-07-07 21:09:38.802+00	\N	0	\N	2026-07-07 21:09:38.815122+00
demo_user	Demo Çiftçi	\N	65.00	35.00	{"cow": 0, "wheat": 1, "chicken": 0}	2	2026-07-09 10:57:15.559+00	2026-07-07 18:39:03.113+00	0	\N	2026-07-07 14:54:36.57566+00
8796950502	.	B4Jva	55.00	755.00	{"cow": 0, "wheat": 1, "chicken": 0}	1	2026-07-08 08:27:06.838+00	2026-07-07 15:26:17.545+00	0	\N	2026-07-07 15:12:12.977766+00
8502942099	𓃵⋆˙𝗗𝗼𝘂𝗯𝗹𝗲 𝗘𝘀𝗽𝗿𝗲𝘀𝘀𝗼 ⋆˙𓃵	DoubleEspresso74	0.00	0.00	{"cow": 1, "wheat": 1, "chicken": 1}	1	2026-07-07 22:41:16.503+00	\N	0	\N	2026-07-07 22:40:46.776103+00
8706543922	Bjhh	Veksozs	100.00	15.00	{"cow": 0, "wheat": 1, "chicken": 0}	2	2026-07-08 09:31:08.223+00	\N	0	\N	2026-07-07 21:10:12.230846+00
\.


--
-- Data for Name: vault_deposits; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vault_deposits (id, user_telegram_id, coins_deposited, lock_days, multiplier, coins_to_receive, matures_at, status, created_at, claimed_at) FROM stdin;
\.


--
-- Data for Name: withdrawals; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.withdrawals (id, user_telegram_id, amount, method, status, created_at, processed_at) FROM stdin;
\.


--
-- Name: achievements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.achievements_id_seq', 17, true);


--
-- Name: referrals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.referrals_id_seq', 5, true);


--
-- Name: achievements achievements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.achievements
    ADD CONSTRAINT achievements_pkey PRIMARY KEY (id);


--
-- Name: nft_trade_offers nft_trade_offers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nft_trade_offers
    ADD CONSTRAINT nft_trade_offers_pkey PRIMARY KEY (id);


--
-- Name: nfts nfts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nfts
    ADD CONSTRAINT nfts_pkey PRIMARY KEY (id);


--
-- Name: referrals referrals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (telegram_id);


--
-- Name: vault_deposits vault_deposits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vault_deposits
    ADD CONSTRAINT vault_deposits_pkey PRIMARY KEY (id);


--
-- Name: withdrawals withdrawals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.withdrawals
    ADD CONSTRAINT withdrawals_pkey PRIMARY KEY (id);


--
-- Name: referrals_referred_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX referrals_referred_unique ON public.referrals USING btree (referred_telegram_id);


--
-- PostgreSQL database dump complete
--

\unrestrict N598oG69dWdOTJU8LzYSvOv8CaXjNUQH8DykZ8pX6NgEwRnL43xohOQvwFbykoq

