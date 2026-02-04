-- =====================================================
-- STEP 1: Drop the unique constraint on user_id
-- =====================================================
ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS clients_user_id_unique;

-- =====================================================
-- STEP 2: Insert/restore all clients from backup
-- =====================================================
INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    '02d344a3-0030-4f6b-b742-9868177a43c5',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'MEDEA THERAPY spol. s r.o.',
    'medeatherapy@seznam.cz',
    '+420 602 249 067',
    NULL,
    'Na Pískovně 565 /9',
    'Liberec',
    '460 01',
    NULL,
    0.00,
    '2025-11-06 00:34:15.486184+00',
    '2025-11-06 00:34:15.486184+00',
    '2025-11-06',
    'company',
    '27267229',
    'MEDEA THERAPY spol. s r.o.',
    'Jana Vlková',
    'Recommendation',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    '085051fa-8d78-43cf-90ca-590a4627e5bc',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'Vladimíra Lipovská',
    'vladkalipovska@gmail.com',
    '+420 603 911 005',
    NULL,
    'Školní 125',
    'Chrastava',
    '463 31',
    NULL,
    0.00,
    '2025-11-06 01:10:30.359371+00',
    '2025-11-06 01:10:30.359371+00',
    '2025-11-06',
    'person',
    NULL,
    NULL,
    NULL,
    'Google',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    '087db108-7409-47b2-a043-343934d20488',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'Dagmar Prošková',
    'dproskova@gmail.com',
    '+420 602 410 933',
    NULL,
    'Sametová 733',
    'Liberec',
    '460 06',
    NULL,
    0.00,
    '2025-11-06 00:57:13.007939+00',
    '2025-11-06 00:57:13.007939+00',
    '2025-11-06',
    'person',
    NULL,
    NULL,
    NULL,
    'Google',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    '0c6b93cc-045d-4218-95c6-83c8f75b28a8',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'Michaela Čejková',
    'maiky.cejkova@seznam.cz',
    '+420 603 799 521',
    NULL,
    'Jáchymovská',
    'Liberec',
    '460 10',
    NULL,
    0.00,
    '2025-11-06 00:39:43.883684+00',
    '2025-11-06 00:41:16.16525+00',
    '2025-11-06',
    'person',
    NULL,
    NULL,
    NULL,
    'Google',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    '0ee94139-8bc3-4074-a570-f3aea9f3a971',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'Jindra Lisalová',
    NULL,
    '+420 777 137 736',
    NULL,
    'Husova 1201/65',
    'Liberec',
    '460 01',
    NULL,
    0.00,
    '2025-11-06 00:09:10.363945+00',
    '2025-11-06 00:09:10.363945+00',
    '2024-11-06',
    'person',
    NULL,
    NULL,
    NULL,
    'Recommendation',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    '10b1473b-cf52-4902-b53f-8a7f554019de',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'Denisa Veroňková',
    'denisaveronkova@seznam.cz',
    '+420 737 538 367',
    NULL,
    'Gagarinova 801/55',
    'Liberec',
    '46006',
    NULL,
    0.00,
    '2025-11-05 23:42:49.385732+00',
    '2025-11-05 23:57:48.341852+00',
    '2025-11-05',
    'person',
    NULL,
    NULL,
    NULL,
    'Google',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    '151ffe1b-147e-48cc-8475-6b563fa93afe',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'Gabriela Čechová',
    'czechova@gmail.com',
    '+420 731 197 482',
    NULL,
    'Na Okruhu 871/3',
    'Liberec',
    '460 01',
    NULL,
    0.00,
    '2025-11-06 02:06:14.513114+00',
    '2025-11-06 02:06:14.513114+00',
    '2025-11-06',
    'person',
    NULL,
    NULL,
    NULL,
    'Google',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    '169d1762-4907-45b3-89bf-acc405bcc6dd',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'Jana Tóthová',
    'tothova.j.jana@gmail.com',
    '+420 725 586 980',
    NULL,
    'Kubánská 379/5',
    'Liberec',
    '460 05',
    NULL,
    0.00,
    '2025-11-06 01:52:44.927125+00',
    '2025-11-06 01:52:44.927125+00',
    '2025-11-06',
    'person',
    NULL,
    NULL,
    NULL,
    'Google',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    '18c3a498-9f09-4024-aa3c-f0b9e5ca30aa',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'Vlado Vrbica',
    NULL,
    '+420 773 337 709',
    NULL,
    'Buková 186',
    'Liberec',
    '460 14',
    NULL,
    0.00,
    '2025-11-05 23:35:00.538716+00',
    '2025-11-05 23:35:28.567603+00',
    '2024-10-10',
    'person',
    NULL,
    NULL,
    NULL,
    'Recommendation',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    '18df4771-00af-452d-ba7c-2e39179d9d93',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'Michaela Šubrová',
    'michaela.subrova@icloud.com',
    '+420 774 833 546',
    NULL,
    'Na Perštýně 677',
    'Liberec',
    '460 01',
    NULL,
    0.00,
    '2025-11-06 02:21:20.565399+00',
    '2025-11-06 02:21:20.565399+00',
    '2025-11-06',
    'person',
    NULL,
    NULL,
    NULL,
    'Google',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    '1c2fa392-a4a8-4c16-81c1-98322e1712e4',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'Anna Štěpánková',
    'andulka.stepanek@seznam.cz',
    '+420 722 772 265',
    NULL,
    'Pavlovická 541/10',
    'Liberec',
    '460 01',
    NULL,
    0.00,
    '2025-11-06 01:42:38.931781+00',
    '2025-11-06 01:42:38.931781+00',
    '2025-11-06',
    'person',
    NULL,
    NULL,
    NULL,
    'Google',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    '1d552219-e767-4915-8903-94a7d1355620',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'Ivana Šimková',
    'is226@seznam.cz',
    '+420 728 113 033',
    NULL,
    'Truhlářská 530/19',
    'Liberec',
    '46001',
    NULL,
    0.00,
    '2025-11-05 23:50:02.624948+00',
    '2025-11-05 23:50:02.624948+00',
    '2024-11-04',
    'person',
    NULL,
    NULL,
    NULL,
    'Google',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    '1da34b87-10ff-4fe3-b5a3-7da80e4d69bb',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'Jaroslav Polívka',
    'hpolivkova@email.cz',
    '+420 774 486 727 (ž)',
    NULL,
    'S. K. Neumanna 526/37',
    'Mladá Boleslav',
    '293 01',
    NULL,
    0.00,
    '2025-12-04 08:35:02.944467+00',
    '2025-12-04 08:35:02.944467+00',
    '2025-12-04',
    'company',
    '66422868',
    'Jaroslav Polívka',
    NULL,
    'Google',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    '29fcd78c-af9f-4bf8-ada9-df2b6687b5fd',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'Sabina Will',
    NULL,
    '+420 608 526 464',
    NULL,
    'Na Americe 484',
    'Liberec, Mníšek',
    '463 31',
    NULL,
    0.00,
    '2025-11-06 01:47:07.930764+00',
    '2025-11-06 01:47:07.930764+00',
    '2025-11-06',
    'person',
    NULL,
    NULL,
    NULL,
    'Google',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    '37837a04-1530-4992-8346-8cd87d15042c',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'Adam Beneš',
    NULL,
    '+420 774 285 232',
    NULL,
    '1. Máje 354/45',
    'Liberec',
    '46007',
    NULL,
    0.00,
    '2025-11-05 23:33:46.161399+00',
    '2025-11-05 23:33:46.161399+00',
    '2024-10-05',
    'person',
    NULL,
    NULL,
    NULL,
    'Cold Call',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    '3de13cea-ffc0-4ec2-8ed6-9cb4a6a7fb10',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'Jana Váňová',
    NULL,
    '+420 739 801 926',
    NULL,
    'Pražská 604/105',
    'Jablonec n. Nisou',
    NULL,
    NULL,
    0.00,
    '2025-11-06 02:14:15.236027+00',
    '2025-11-06 02:14:15.236027+00',
    '2025-11-06',
    'person',
    NULL,
    NULL,
    NULL,
    'Google',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    '3edda98f-e94b-42d0-8272-a5a8424e51c5',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'Matěj Kukla',
    NULL,
    '+420 602 134 387',
    NULL,
    'Svatoplukova 450/24',
    'Liberec',
    '460 01',
    NULL,
    1500.00,
    '2025-11-11 15:44:38.415299+00',
    '2026-01-17 16:36:26.446356+00',
    '2025-11-11',
    'person',
    NULL,
    NULL,
    NULL,
    'Google',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    '456880c5-8adc-48d9-badf-01c611295c0e',
    'c1627fc7-4165-4d16-a27b-7149d51a32b7',
    'Gen Test',
    'igtestfeature01@gmail.com',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    0.00,
    '2025-11-04 15:03:38.298421+00',
    '2025-11-04 15:03:38.298421+00',
    NULL,
    'person',
    NULL,
    NULL,
    NULL,
    'App',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    '4ea0d301-e39e-4f9c-8e76-d854890e863f',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'Martina Zdvořáková',
    NULL,
    '+420 606 262 351',
    NULL,
    'Na Stráni 122',
    'Jablonné v Podještědí',
    '471 25',
    NULL,
    0.00,
    '2025-11-06 02:17:01.900975+00',
    '2025-11-06 02:17:22.948022+00',
    '2025-11-06',
    'person',
    NULL,
    NULL,
    NULL,
    'Recommendation',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    '4f6ef2cc-01bd-497f-bdff-2dc819ffa6e4',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'Karolína Voleská',
    'karolina.voleska@tul.cz',
    '+420 737 248 704',
    NULL,
    'Na Mlýnku',
    'Liberec',
    '460 01',
    NULL,
    0.00,
    '2025-11-06 01:41:02.956822+00',
    '2025-11-06 01:41:02.956822+00',
    '2025-11-06',
    'person',
    NULL,
    NULL,
    NULL,
    'Google',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    '5a8263fb-f45c-4a9d-8a42-061a68877a4c',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'Proma agency s.r.o.',
    'prochazka@full-net.cz',
    '733 109 764',
    NULL,
    'Ještědská 516 /46',
    'Liberec',
    '460 07',
    NULL,
    0.00,
    '2025-11-05 23:18:52.775876+00',
    '2025-11-05 23:18:52.775876+00',
    '2025-11-05',
    'company',
    '03461971',
    'Proma agency s.r.o.',
    'Martin Procházka',
    'Cold Call',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    '62dd338a-8771-427d-acd1-7b5ea0f1ea53',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'Robert Vítek',
    'vitek@km-prona.cz',
    '+420 606 630 823',
    NULL,
    'Pomněnková 826',
    'Liberec',
    '463 03',
    NULL,
    0.00,
    '2025-11-06 01:05:32.697764+00',
    '2025-11-06 01:05:32.697764+00',
    '2025-11-06',
    'person',
    NULL,
    NULL,
    NULL,
    'Google',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    '63c66e30-1e71-4510-ae5c-75c85257a323',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'pan Laurin',
    NULL,
    '+420 607 685 771',
    NULL,
    'Svatoplukova',
    'Liberec',
    '460 01',
    NULL,
    0.00,
    '2025-11-06 00:23:15.008873+00',
    '2025-11-06 00:30:32.705001+00',
    '2024-11-06',
    'person',
    NULL,
    NULL,
    NULL,
    'Google',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    '653aa971-7ce6-443d-997f-de4b6be99453',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'p. Ronová',
    NULL,
    '+420 724 055 529',
    NULL,
    'Oldřichova 208/20',
    'Liberec',
    '460 07',
    'tel: (p. Augustinová)',
    0.00,
    '2025-11-06 02:35:42.33799+00',
    '2025-12-08 14:19:50.261718+00',
    '2025-11-06',
    'person',
    NULL,
    NULL,
    NULL,
    'Google',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    '65d9453c-fcde-4a3b-9f91-f5e8ea0a4a7a',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'Roman Maňák',
    'manak831@gmail.com',
    '+420 733 110 959',
    NULL,
    'Žitná 662',
    'Liberec',
    '46006',
    NULL,
    0.00,
    '2025-11-06 00:44:35.979291+00',
    '2025-11-06 00:44:35.979291+00',
    '2025-11-06',
    'person',
    NULL,
    NULL,
    NULL,
    'Google',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    '683e06ee-c6f4-4d45-b4a7-ffbbf59eb6ce',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'STATUTÁRNÍ MĚSTO LIBEREC',
    'zdenkova.lucie@vratislavice.cz',
    '+420 603 766 230',
    NULL,
    'nám. Dr. E. Beneše 1 /1',
    'Liberec',
    '460 01',
    NULL,
    0.00,
    '2025-11-06 00:20:34.334101+00',
    '2025-11-06 00:30:44.495342+00',
    '2024-11-06',
    'company',
    '00262978',
    'STATUTÁRNÍ MĚSTO LIBEREC',
    'Lucie Zdeňková (ředitelka)',
    'Google',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    '6a272218-9ffc-4a04-b365-94ffe0cfb20d',
    'a9fea72d-acae-4692-b739-d9701d51ce96',
    'Malvína',
    'malvinauklid@seznam.cz',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    0.00,
    '2025-11-13 09:04:54.592819+00',
    '2025-11-13 09:04:54.592819+00',
    NULL,
    'person',
    NULL,
    NULL,
    NULL,
    'App',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    '715b2ab2-116e-495d-a5ed-4b89c9bf5208',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'Jiří Šubr',
    'info@subrjiri.cz',
    '+420 728 366 005',
    NULL,
    'Sněhurčina 712/77',
    'Liberec',
    '460 15',
    NULL,
    0.00,
    '2025-11-06 02:07:18.713623+00',
    '2025-11-06 02:07:18.713623+00',
    '2025-11-06',
    'person',
    NULL,
    NULL,
    NULL,
    'Google',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    '75e1bed9-532b-4446-84ec-1663f7eb1879',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'Jana Tomešová',
    'jana.tomesova@volny.cz',
    '+420 602 559 658',
    NULL,
    'Jánošíkova 232/6',
    'Liberec',
    '460 01',
    NULL,
    0.00,
    '2025-11-06 00:04:19.072955+00',
    '2025-11-06 00:04:19.072955+00',
    '2024-11-01',
    'person',
    NULL,
    NULL,
    NULL,
    'Google',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    '77c04b5c-4bd0-42cd-8aa0-dac2df7e065f',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'Lenka Pencáková',
    'pencakova.lenka@gmail.com',
    '+420 605 011 050',
    NULL,
    'Lužická 692/1',
    'Liberec',
    '460 01',
    NULL,
    0.00,
    '2025-11-06 02:31:52.735339+00',
    '2025-11-08 16:17:06.648711+00',
    '2025-11-06',
    'person',
    NULL,
    NULL,
    NULL,
    'Google',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    '7fe2b285-6107-4e35-83ef-c215a1243864',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'Kateřina Dušková',
    'katerina.duskova@gmail.com',
    '+420 777 037 165',
    NULL,
    'Riegrova 1384/10a',
    'Liberec',
    '460 01',
    NULL,
    0.00,
    '2025-12-02 18:20:59.211769+00',
    '2025-12-02 18:20:59.211769+00',
    '2025-12-02',
    'person',
    NULL,
    NULL,
    NULL,
    'Google',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    '81cd4af9-6730-46cf-8fa5-1bf20d4533e5',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'Ondřej Beneš',
    'ondrejbenes@mall.com',
    '+420 777 535 744',
    NULL,
    'Tálínská 695',
    'Liberec',
    '460 08',
    NULL,
    0.00,
    '2025-11-06 02:15:16.554096+00',
    '2025-11-06 02:15:16.554096+00',
    '2025-11-06',
    'person',
    NULL,
    NULL,
    NULL,
    'Google',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    '820d7b3a-8130-4fc6-be14-91fa4e9f13ed',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'Ivana Menčíková',
    NULL,
    '+420 722 967 904',
    NULL,
    'Lounská 498/7',
    'Liberec',
    '460 07',
    NULL,
    0.00,
    '2025-11-18 14:48:45.081983+00',
    '2025-11-20 13:27:43.514127+00',
    '2025-11-18',
    'person',
    NULL,
    NULL,
    NULL,
    'Google',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    '8456743e-9e92-486c-8af4-1e0c63b5151a',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'Helena Polívková',
    'hpolivkova@seznam.cz',
    '+420 774 486 727',
    NULL,
    'Riegrova 1384/10a',
    'Liberec',
    '460 01',
    NULL,
    0.00,
    '2025-12-02 18:04:24.597877+00',
    '2025-12-02 18:04:24.597877+00',
    '2025-12-02',
    'person',
    NULL,
    NULL,
    NULL,
    'Google',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    '87c983a5-9253-4b12-8ef7-b1d473ce6ef7',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'Viktorie Lukášková',
    NULL,
    '+420 721 046 848',
    NULL,
    'Jeronýmova 567/22c',
    'Liberec',
    '460 07',
    NULL,
    0.00,
    '2025-11-06 01:45:32.010301+00',
    '2025-11-06 01:45:32.010301+00',
    '2025-11-06',
    'person',
    NULL,
    NULL,
    NULL,
    'Recommendation',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    '8a03f204-4467-4e41-8c7f-024f74f99164',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'Oskar Zappe',
    'oskar.zappe@gmail.com',
    '+420 608 335 686',
    NULL,
    'Volgogradská',
    'Liberec',
    '460 07',
    NULL,
    0.00,
    '2025-11-06 01:26:27.387934+00',
    '2025-11-06 01:26:27.387934+00',
    '2025-11-06',
    'person',
    NULL,
    NULL,
    NULL,
    'Google',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    '90f0371a-9b96-46e2-9e25-f655f5b0da3f',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'Pavlína Křelinová',
    NULL,
    '+420 721 787 721',
    NULL,
    'Liliová 1427/3',
    'Liberec',
    '460 01',
    NULL,
    0.00,
    '2025-11-06 00:14:43.259733+00',
    '2025-11-06 00:30:59.604987+00',
    '2024-11-06',
    'person',
    NULL,
    NULL,
    NULL,
    'Recommendation',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    '937af09a-bc6f-4a09-a422-37cd2b104124',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'Pavel Kováč',
    NULL,
    '+420 721 265 956',
    NULL,
    'Hvězdná 481/1',
    'Liberec',
    '460 05',
    NULL,
    0.00,
    '2025-11-06 01:58:37.234917+00',
    '2025-11-06 01:58:37.234917+00',
    '2025-11-06',
    'person',
    NULL,
    NULL,
    NULL,
    'Google',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    '93ef5104-a7c2-467a-aaa7-48ff9cbf23ba',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'DH Liberec, o.p.s.',
    'provoz@domov-harcov.cz',
    '+420 771 520 990',
    NULL,
    'Vlčí vrch 323',
    'Liberec',
    '460 15',
    NULL,
    0.00,
    '2025-11-06 01:14:40.153946+00',
    '2025-11-06 01:14:40.153946+00',
    '2025-11-06',
    'company',
    '27298523',
    'DH Liberec, o.p.s.',
    'p. Markalousová',
    'Google',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    '96bc8125-f485-445b-af82-534e55c52b49',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'Josef Kantůrek',
    'jkanturek@seznam.cz',
    '+420 604 119 137 (p. Kantůrková)',
    NULL,
    'Husitská 142/51',
    'Liberec',
    '460 07',
    NULL,
    0.00,
    '2025-11-24 11:47:07.820331+00',
    '2025-11-24 11:47:07.820331+00',
    '2025-11-24',
    'person',
    NULL,
    NULL,
    NULL,
    'Google',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    '9dd7a925-f6b7-4f96-b913-3c8f554e0698',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'Karel Fisher',
    'carlosinocarlos73@gmail.com',
    '725 914 588',
    NULL,
    'Pražská 5',
    'Liberec',
    '460 05',
    NULL,
    0.00,
    '2025-11-05 23:30:36.229051+00',
    '2025-11-05 23:31:30.081721+00',
    '2024-10-05',
    'person',
    NULL,
    NULL,
    NULL,
    'Cold Call',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    '9f12db81-45e1-46fb-b048-698f889d5887',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    '3DImplant s.r.o.',
    'info@3DI.cz',
    '+420 608 999 871',
    NULL,
    'Za pruhy 243 /2',
    'Praha',
    '140 00',
    NULL,
    0.00,
    '2025-11-06 02:03:31.06507+00',
    '2025-11-06 02:03:31.06507+00',
    '2025-11-06',
    'company',
    '07223501',
    '3DImplant s.r.o.',
    'Dominika Skalická',
    'Google',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    'a21441c3-2078-44db-b861-3635ad5486ec',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'Laura Levko',
    'laura.levko@doctrina.cz',
    '+420 737 825 146',
    NULL,
    'Gollova 555/3',
    'Liberec',
    '460 01',
    NULL,
    0.00,
    '2025-11-06 02:19:35.01813+00',
    '2025-11-06 02:19:35.01813+00',
    '2025-11-06',
    'person',
    NULL,
    NULL,
    NULL,
    'Google',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    'a40024e5-3541-42f9-a800-92c01c633e11',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'Jan Kovařík',
    NULL,
    NULL,
    NULL,
    'Zápy 335',
    'Zápy',
    '250 61',
    NULL,
    0.00,
    '2025-11-06 00:37:19.039907+00',
    '2025-11-06 00:37:19.039907+00',
    '2025-11-06',
    'person',
    NULL,
    NULL,
    NULL,
    'Google',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    'ab5847f9-2a36-42bd-a4b0-e203286a7fae',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'PENDENT s.r.o.',
    'pencakova.lenka@gmail.com',
    '+420 605 011 050',
    NULL,
    'Zelené údolí 1186',
    'Liberec',
    '46006',
    NULL,
    0.00,
    '2025-12-09 09:43:34.091183+00',
    '2026-01-16 11:10:16.548088+00',
    '2025-12-09',
    'company',
    '23744634',
    NULL,
    'Lenka Pencáková',
    'Recommendation (Milan Krčil - Malíř)',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    'b0352542-6566-45a0-9bc8-917469d1ee69',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'Petra Jeziorski',
    'peta.gotzova@gmail.com',
    '+420 602 116 129',
    NULL,
    'Bezová 230/10',
    'Liberec',
    '460 01',
    NULL,
    0.00,
    '2025-11-06 02:10:23.586761+00',
    '2025-11-06 02:10:23.586761+00',
    '2025-11-06',
    'person',
    NULL,
    NULL,
    NULL,
    'Google',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    'b0530864-0dd3-4364-8e4d-abee3a6e92c4',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'Finance Charvát s.r.o.',
    'finance.charvat@gmail.com',
    '+420 774 719 529',
    NULL,
    'Mechová 3621 /3',
    'Jablonec nad Nisou',
    '466 04',
    NULL,
    0.00,
    '2025-11-05 23:08:01.33669+00',
    '2025-11-05 23:08:01.33669+00',
    '2024-09-21',
    'company',
    '21312991',
    'Finance Charvát s.r.o.',
    'Miroslav Charvát',
    'Recommendation',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    'b24e1bc5-2f14-4300-aeb8-2ffbd5280d8e',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'Lenka Gregorová',
    'gregorova.leni@email.cz',
    '+420 777 787 224',
    NULL,
    'Terronská 1054/5',
    'Liberec',
    '460 01',
    NULL,
    0.00,
    '2025-11-18 14:45:22.418979+00',
    '2025-11-18 14:45:22.418979+00',
    '2025-11-18',
    'person',
    NULL,
    NULL,
    NULL,
    'Google',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    'b27d116b-6fe3-4f15-ba1a-01336c68c269',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'Hana Ježková',
    'kavarnaujezka@seznam.cz',
    '+420 605 967 123',
    NULL,
    '183',
    'Kryštofovo Údolí',
    '460 01',
    NULL,
    0.00,
    '2025-11-06 01:17:59.576736+00',
    '2025-11-06 01:17:59.576736+00',
    '2025-11-06',
    'company',
    '88770443',
    'Hana Ježková',
    'Hana Ježková',
    'Google',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    'b6b853e5-f29f-46ed-9975-0447ca7e987f',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'p. Kuželková',
    NULL,
    '+420 723 725 493',
    NULL,
    'Lipová 597/9',
    'Liberec',
    '460 01',
    NULL,
    0.00,
    '2025-11-06 02:00:01.538937+00',
    '2025-11-06 02:00:01.538937+00',
    '2025-11-06',
    'person',
    NULL,
    NULL,
    NULL,
    'Google',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    'bb2670d0-4c0b-4f1c-ab17-27ec78f36ac1',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'p. Veselá',
    NULL,
    '+420 774 575 485',
    NULL,
    'Svojsíkova',
    'Liberec',
    '460 01',
    NULL,
    0.00,
    '2025-11-06 01:04:03.775712+00',
    '2025-11-06 01:04:03.775712+00',
    '2025-11-06',
    'person',
    NULL,
    NULL,
    NULL,
    'Google',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    'bb44c89c-e6d6-417b-b0fa-1b8501781cf0',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'Marie Kopalová',
    NULL,
    '+420 601 583 271',
    NULL,
    'Liliová 1427/3',
    'Liberec',
    '460 01',
    NULL,
    0.00,
    '2025-11-06 00:10:44.953806+00',
    '2025-11-06 00:10:44.953806+00',
    '2024-11-17',
    'person',
    NULL,
    NULL,
    NULL,
    'Google',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    'bb7b5cca-60c9-40b1-aa97-638d623dd75b',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'Virtuální bydlení s.r.o.',
    'romana@virtualnibydleni.cz',
    '+420 737 807 356',
    NULL,
    'Malá Štěpánská 1932 /3',
    'Praha',
    '120 00',
    NULL,
    0.00,
    '2025-11-06 01:12:19.488752+00',
    '2025-11-06 01:12:19.488752+00',
    '2025-11-06',
    'company',
    '06116248',
    'Virtuální bydlení s.r.o.',
    'Romana Funkeová',
    'Google',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    'bc16921d-d60f-49ca-97f1-7f9e3a8b78c7',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'Lenka Brožová',
    'lenka-brozova@centrum.cz',
    '+420 721 002 786',
    NULL,
    'Venušina 989/3',
    'Liberec',
    '460 01',
    NULL,
    0.00,
    '2025-11-06 02:12:12.801503+00',
    '2025-11-06 02:12:12.801503+00',
    '2025-11-06',
    'person',
    NULL,
    NULL,
    NULL,
    'Google',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    'bceb0148-fa50-402a-b7af-7872ceb087ad',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'Apar Rayamajhi',
    NULL,
    '+420 604 374 887',
    NULL,
    'Svatoplukova 650/12',
    'Liberec',
    '460 01',
    NULL,
    0.00,
    '2025-11-06 01:37:13.057998+00',
    '2025-11-06 01:37:13.057998+00',
    '2025-11-06',
    'person',
    NULL,
    NULL,
    NULL,
    'Google',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    'bf3baa2d-56b7-4876-a209-f30ecae742dc',
    '451662d3-eb7b-4ae2-9b49-0182a21cf2b2',
    'Pepik Kešu',
    'pepikkesu@seznam.cz',
    '+420 777 645 611',
    '2003-01-17',
    'Boženy Němcové 524/11a',
    'Liberec',
    '460 05',
    NULL,
    0.00,
    '2025-11-07 19:52:09.964959+00',
    '2025-11-07 19:57:01.349621+00',
    NULL,
    'person',
    NULL,
    NULL,
    NULL,
    'App',
    NULL,
    true,
    true,
    true,
    'vyhněte se prosím extra silným prostředkům',
    'nezvonit, zavolat! a na konci zamknout dům.'
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    'c3f9ac51-bfdf-4f52-9c36-7bf99e0f33f5',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'Základní škola, Liberec, Aloisina výšina 642, příspěvková organizace',
    'sekretariat@zs-aloisinavysina.cz',
    '+420 721 228 970',
    NULL,
    'Aloisina výšina 642 /51',
    'Liberec',
    '460 15',
    NULL,
    0.00,
    '2025-11-06 01:20:02.575865+00',
    '2025-11-06 01:20:02.575865+00',
    '2025-11-06',
    'company',
    '65100280',
    'Základní škola, Liberec, Aloisina výšina 642, příspěvková organizace',
    'Jaroslav Vykoukal',
    'Recommendation',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    'c549279c-4e99-432c-a99c-ecd43d95b068',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'Martina Vydrová',
    NULL,
    '+420 728 831 645',
    NULL,
    'Jeřmanická',
    'Liberec',
    '463 12',
    NULL,
    0.00,
    '2025-11-06 01:08:49.572186+00',
    '2025-11-06 01:08:49.572186+00',
    '2025-11-06',
    'person',
    NULL,
    NULL,
    NULL,
    'Google',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    'c6d24163-5e0d-4a29-8dce-be4dd98430a0',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'Jiří Merz',
    'jiri.merz@gmail.com',
    '+420 777 787 212',
    NULL,
    'Na kopci 1200/23',
    'Liberec',
    '460 14',
    NULL,
    0.00,
    '2025-11-06 00:07:42.001303+00',
    '2025-11-06 00:07:42.001303+00',
    '2024-11-08',
    'person',
    NULL,
    NULL,
    NULL,
    'Google',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    'ca546d61-d354-4828-9980-acce420d13c4',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'Michal Nepraš',
    NULL,
    '+420 734 298 691',
    NULL,
    'Gutenbergova 281/7',
    'Liberec',
    '460 05',
    NULL,
    0.00,
    '2025-11-06 00:53:24.346723+00',
    '2025-11-06 00:53:24.346723+00',
    '2025-11-06',
    'person',
    NULL,
    NULL,
    NULL,
    'AI',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    'ceffdd5e-a628-47bf-b0ec-54fcb14c6d09',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'KREP s.r.o.',
    'petr.kobler@gmail.com',
    '+420 777 775 586',
    NULL,
    'Krátká 827 /9',
    'Prostějov',
    '796 01',
    NULL,
    0.00,
    '2025-11-06 00:30:14.456814+00',
    '2025-11-06 00:30:14.456814+00',
    '2025-01-24',
    'company',
    '14300176',
    'KREP s.r.o.',
    'Petr Kobler',
    'Google',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    'd25b7dcb-a9b0-488b-b1fa-897c64f43b5f',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'p. Konečná',
    NULL,
    '+420 730 900 961',
    NULL,
    'Vackova 382',
    'Liberec',
    '463 12',
    NULL,
    0.00,
    '2025-11-05 23:36:46.985076+00',
    '2025-11-05 23:36:46.985076+00',
    '2024-10-17',
    'person',
    NULL,
    NULL,
    NULL,
    'Google',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    'd414224b-ac6c-4da6-be92-ed1235acbdd8',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'Jakub Jedlička',
    NULL,
    '+420 605 380 630',
    NULL,
    'Volgogradská 214',
    'Liberec',
    '460 07',
    NULL,
    0.00,
    '2025-11-05 23:47:27.878486+00',
    '2025-11-05 23:48:01.277012+00',
    '2025-11-05',
    'person',
    NULL,
    NULL,
    NULL,
    'Recommendation',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    'd9cc544a-93ec-4f22-8b44-9cbf20142e66',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'Boutique Apartments Liberec s.r.o.',
    NULL,
    '+420 608 018 359',
    NULL,
    'nám. Dr. E. Beneše 557 /29',
    'Liberec',
    '460 01',
    NULL,
    0.00,
    '2025-11-06 00:48:46.328622+00',
    '2025-11-06 00:48:46.328622+00',
    '2025-11-06',
    'company',
    '09285296',
    'Boutique Apartments Liberec s.r.o.',
    'Lenka Warehouse',
    'Google',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    'db09529d-3bee-4182-bc88-3ef185870a53',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'Františka Elstnerová',
    NULL,
    '+420 736 164 876',
    NULL,
    'Jáchymovská',
    'Liberec',
    NULL,
    NULL,
    0.00,
    '2025-11-06 00:28:02.028298+00',
    '2025-11-06 00:30:26.126741+00',
    '2024-11-06',
    'person',
    NULL,
    NULL,
    NULL,
    'Google',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    'dca36f02-d06f-418e-9d7e-58437a40ad20',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'p. Kabrielová',
    NULL,
    '+420 723 213 400',
    NULL,
    'Mánesova 198/8',
    'Liberec',
    '460 10',
    NULL,
    0.00,
    '2025-11-06 01:38:57.663467+00',
    '2025-11-06 01:38:57.663467+00',
    '2025-11-06',
    'person',
    NULL,
    NULL,
    NULL,
    'Recommendation',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    'e54e3e2d-46c9-423d-94e2-edd379af375a',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'Stepan Tomov',
    'stepan.tomov5@seznam.cz',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    0.00,
    '2025-11-04 15:00:03.817414+00',
    '2025-11-04 15:00:03.817414+00',
    NULL,
    'person',
    NULL,
    NULL,
    NULL,
    'App',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    'e7cc5e94-7a99-4702-9930-423cd0f23235',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'PADAS CZ s.r.o.',
    'dagmar.stefkova@padas.cz',
    '+420 774 884 961',
    NULL,
    'Hodkovická 470',
    'Liberec',
    '463 12',
    NULL,
    0.00,
    '2025-11-06 01:22:27.963401+00',
    '2025-11-06 01:23:15.679056+00',
    '2025-11-06',
    'company',
    '64945626',
    'PADAS CZ s.r.o.',
    'Dana Vitáková (IDIADA)',
    'Recommendation',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    'e88ceace-541c-42d0-8512-1ea6ecaa6106',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'Marie Pokorná',
    'maruhani@seznam.cz',
    '+420 608 362 252',
    NULL,
    'Rozdvojená 124',
    'Liberec',
    '463 12',
    NULL,
    0.00,
    '2025-11-06 01:28:54.321252+00',
    '2025-11-06 01:28:54.321252+00',
    '2025-11-06',
    'person',
    NULL,
    NULL,
    NULL,
    'Google',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    'ea118447-95cf-4ba1-9607-53991f6cb796',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'Hana Kalábová',
    'hana2kalabova@seznam.cz',
    '+420 608 248 606',
    NULL,
    'Švermova (Gallas)',
    'Liberec',
    '460 10',
    NULL,
    0.00,
    '2025-11-06 00:17:05.646914+00',
    '2025-11-06 00:30:50.424749+00',
    '2024-11-06',
    'person',
    NULL,
    NULL,
    NULL,
    'Google',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    'ecd2debe-b670-4b91-ae6a-68415b6745d7',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'Eva Čeřovská',
    'cerovska@seznam.cz',
    '+420 602 342 308',
    NULL,
    'Polední 213',
    'Liberec',
    '460 01',
    NULL,
    0.00,
    '2025-11-06 00:05:52.161534+00',
    '2025-11-06 00:05:52.161534+00',
    '2025-11-07',
    'person',
    NULL,
    NULL,
    NULL,
    'Google',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    'f0ecfe42-db91-471b-944b-682a452ff6fb',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'Ramon Vargas Almonte',
    'ramonvargasalmonte@email.cz',
    '+420 606 630 823',
    NULL,
    'náměstí Tržní 833/10',
    'Liberec',
    '460 01',
    NULL,
    0.00,
    '2025-11-06 01:07:02.997612+00',
    '2025-11-06 01:07:02.997612+00',
    '2025-11-06',
    'person',
    NULL,
    NULL,
    NULL,
    'Recommendation',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    'f33d8c9c-98ee-4c03-bcc9-9bd66c4b5ffc',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'Evžen Svoboda',
    'monti.evzen@seznam.cz',
    '+420 606 606 767',
    NULL,
    'Jáchymovská 253/5',
    'Liberec',
    '460 10',
    NULL,
    0.00,
    '2025-11-06 02:18:30.285149+00',
    '2025-11-06 02:18:30.285149+00',
    '2025-11-06',
    'person',
    NULL,
    NULL,
    NULL,
    'Google',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    'f70ee1cc-4d73-4426-8752-51d51aab4dff',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'CarTec Liberec, s.r.o.',
    'rybar@bmwliberec.cz',
    '+420 739 583 496',
    NULL,
    'Obchodní 622',
    'Liberec',
    '460 01',
    NULL,
    0.00,
    '2025-11-06 00:12:55.466366+00',
    '2025-11-06 00:12:55.466366+00',
    '2024-11-14',
    'company',
    '27343723',
    'CarTec Liberec, s.r.o.',
    'Marek Rybář',
    'Recommendation',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    'fdc4fecf-1adc-4225-a500-9a4e734a3c32',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'Czechia Electronics s.r.o.',
    'vanakova@mobilplus.cz',
    '+420 776 200 042',
    NULL,
    'Nad alejí 1881 /29',
    'Praha',
    '162 00',
    NULL,
    0.00,
    '2025-11-06 01:00:51.533024+00',
    '2025-11-06 01:00:51.533024+00',
    '2025-11-06',
    'company',
    '08884161',
    'Czechia Electronics s.r.o.',
    'Zuzana Vanakova',
    'Google',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    'fed33e8f-b8ab-4379-be9f-29fe398a307f',
    '8a751222-9ec6-49b7-9f6d-e4d519f325ca',
    'Věra Matyášová',
    'vera.matyasova@seznam.cz',
    '737 541 611',
    NULL,
    'Jáchymovská 271/26',
    'Liberec',
    '460 10',
    NULL,
    0.00,
    '2025-11-05 23:45:23.270246+00',
    '2025-11-05 23:45:23.270246+00',
    '2024-10-18',
    'person',
    NULL,
    NULL,
    NULL,
    'Google',
    NULL,
    false,
    false,
    false,
    NULL,
    NULL
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;

-- =====================================================
-- STEP 3: Reassign jobs to their correct clients
-- =====================================================
UPDATE public.jobs SET client_id = '37837a04-1530-4992-8346-8cd87d15042c' WHERE id = '0005c74b-5057-4c57-bd71-b4b99801f663';
UPDATE public.jobs SET client_id = 'c6d24163-5e0d-4a29-8dce-be4dd98430a0' WHERE id = '0489c88a-4cce-4158-bed2-d5e79fe77a1a';
UPDATE public.jobs SET client_id = '37837a04-1530-4992-8346-8cd87d15042c' WHERE id = '0499efb3-9411-4428-ab3b-b95eeb70caa2';
UPDATE public.jobs SET client_id = '683e06ee-c6f4-4d45-b4a7-ffbbf59eb6ce' WHERE id = '04cef334-5ba4-4439-90a6-448d7ba9e19e';
UPDATE public.jobs SET client_id = '0ee94139-8bc3-4074-a570-f3aea9f3a971' WHERE id = '05f47dae-5918-469a-a1f9-c042bea433cd';
UPDATE public.jobs SET client_id = '653aa971-7ce6-443d-997f-de4b6be99453' WHERE id = '0607d3ac-23eb-4df8-8b26-4d39c1fcbad0';
UPDATE public.jobs SET client_id = '9dd7a925-f6b7-4f96-b913-3c8f554e0698' WHERE id = '084eb818-9f25-4cb0-b7f0-ae69a4396d20';
UPDATE public.jobs SET client_id = '715b2ab2-116e-495d-a5ed-4b89c9bf5208' WHERE id = '0ab13833-038b-4c38-a71b-1312da78c3ad';
UPDATE public.jobs SET client_id = '683e06ee-c6f4-4d45-b4a7-ffbbf59eb6ce' WHERE id = '115a0837-2f6a-48da-bf21-79413a99ac53';
UPDATE public.jobs SET client_id = '62dd338a-8771-427d-acd1-7b5ea0f1ea53' WHERE id = '11edaffc-7153-4acc-ac20-d89554f0c585';
UPDATE public.jobs SET client_id = '18df4771-00af-452d-ba7c-2e39179d9d93' WHERE id = '135ea17a-2246-435b-971e-b490d831abf9';
UPDATE public.jobs SET client_id = '62dd338a-8771-427d-acd1-7b5ea0f1ea53' WHERE id = '141a3f34-2b56-4ca4-a55f-be5ab03f038d';
UPDATE public.jobs SET client_id = '683e06ee-c6f4-4d45-b4a7-ffbbf59eb6ce' WHERE id = '163d9262-425f-4218-a654-8db0ad2bba53';
UPDATE public.jobs SET client_id = 'a40024e5-3541-42f9-a800-92c01c633e11' WHERE id = '1692e0d3-119e-4188-94d1-5793adbdef70';
UPDATE public.jobs SET client_id = '715b2ab2-116e-495d-a5ed-4b89c9bf5208' WHERE id = '16b7066f-6c03-4175-baf2-98d76764cf40';
UPDATE public.jobs SET client_id = '9dd7a925-f6b7-4f96-b913-3c8f554e0698' WHERE id = '17539892-e9c8-4bf9-93a6-7c1eae8a2b8c';
UPDATE public.jobs SET client_id = '3edda98f-e94b-42d0-8272-a5a8424e51c5' WHERE id = '17952bee-c725-4ed8-a01c-85202a31417d';
UPDATE public.jobs SET client_id = '37837a04-1530-4992-8346-8cd87d15042c' WHERE id = '1809c22c-aa64-4d06-8004-16680afc01fa';
UPDATE public.jobs SET client_id = '9dd7a925-f6b7-4f96-b913-3c8f554e0698' WHERE id = '19372bbc-4ee2-45b5-a225-1036a518bb38';
UPDATE public.jobs SET client_id = '1d552219-e767-4915-8903-94a7d1355620' WHERE id = '1afca0ce-ae22-435e-8dbe-4ae6264c98b6';
UPDATE public.jobs SET client_id = '715b2ab2-116e-495d-a5ed-4b89c9bf5208' WHERE id = '1e3e15f1-c6b4-4f66-8e18-50718216df7b';
UPDATE public.jobs SET client_id = '81cd4af9-6730-46cf-8fa5-1bf20d4533e5' WHERE id = '1f1b7aeb-6447-4cf8-9473-78b04e59b228';
UPDATE public.jobs SET client_id = '820d7b3a-8130-4fc6-be14-91fa4e9f13ed' WHERE id = '1f755db2-8484-4740-a0e0-45fe2dde34f2';
UPDATE public.jobs SET client_id = 'ca546d61-d354-4828-9980-acce420d13c4' WHERE id = '2156e935-ab46-4698-8039-7bc458b9a086';
UPDATE public.jobs SET client_id = 'db09529d-3bee-4182-bc88-3ef185870a53' WHERE id = '23477e12-0b30-4139-8418-a7fb0cc17d92';
UPDATE public.jobs SET client_id = '81cd4af9-6730-46cf-8fa5-1bf20d4533e5' WHERE id = '236b623a-a5e5-4aa1-8994-5156668f93ef';
UPDATE public.jobs SET client_id = 'a40024e5-3541-42f9-a800-92c01c633e11' WHERE id = '23d236f4-44aa-4d74-8d5c-c66031f3fff9';
UPDATE public.jobs SET client_id = '37837a04-1530-4992-8346-8cd87d15042c' WHERE id = '23f677f5-4165-4910-bce9-d845e4209efd';
UPDATE public.jobs SET client_id = 'ab5847f9-2a36-42bd-a4b0-e203286a7fae' WHERE id = '25eb18d4-3143-42b9-a0f9-a20bf61b47d5';
UPDATE public.jobs SET client_id = 'c6d24163-5e0d-4a29-8dce-be4dd98430a0' WHERE id = '27536332-d88c-4d17-a94f-9c7fa3573d96';
UPDATE public.jobs SET client_id = '9dd7a925-f6b7-4f96-b913-3c8f554e0698' WHERE id = '2cd5dd8b-8edf-4672-8cbe-c2510fb800a3';
UPDATE public.jobs SET client_id = 'ceffdd5e-a628-47bf-b0ec-54fcb14c6d09' WHERE id = '2e68f76b-53ea-4215-b3ca-261876dafa0c';
UPDATE public.jobs SET client_id = 'd9cc544a-93ec-4f22-8b44-9cbf20142e66' WHERE id = '2ff8b0c0-22e6-49af-9aab-7f4bb7d3c56d';
UPDATE public.jobs SET client_id = '37837a04-1530-4992-8346-8cd87d15042c' WHERE id = '313565c5-8be5-4ecb-bcd5-c8e20f673dd9';
UPDATE public.jobs SET client_id = 'f70ee1cc-4d73-4426-8752-51d51aab4dff' WHERE id = '315e9e4a-7f83-4c33-b8a5-33772d7e14b5';
UPDATE public.jobs SET client_id = '9dd7a925-f6b7-4f96-b913-3c8f554e0698' WHERE id = '33bc264d-693c-4719-af13-516119deadd4';
UPDATE public.jobs SET client_id = '37837a04-1530-4992-8346-8cd87d15042c' WHERE id = '34473cea-91c5-4d9c-89c2-f8973c17f7bf';
UPDATE public.jobs SET client_id = 'b0530864-0dd3-4364-8e4d-abee3a6e92c4' WHERE id = '344c0a58-7349-4d8e-8138-b026d259f33b';
UPDATE public.jobs SET client_id = '5a8263fb-f45c-4a9d-8a42-061a68877a4c' WHERE id = '34c214fa-2b63-448e-8b40-e8c1895e2cf3';
UPDATE public.jobs SET client_id = 'c6d24163-5e0d-4a29-8dce-be4dd98430a0' WHERE id = '35f1a915-0841-4c84-b3fd-22f66f3e489c';
UPDATE public.jobs SET client_id = '37837a04-1530-4992-8346-8cd87d15042c' WHERE id = '369a4dde-6078-42f3-a81b-ed207635ab64';
UPDATE public.jobs SET client_id = '1d552219-e767-4915-8903-94a7d1355620' WHERE id = '37abfe6b-1238-42c2-b1cc-15e8d1d32f64';
UPDATE public.jobs SET client_id = '77c04b5c-4bd0-42cd-8aa0-dac2df7e065f' WHERE id = '39b7cf85-fa32-4155-8f66-0e64b2fb154d';
UPDATE public.jobs SET client_id = 'c6d24163-5e0d-4a29-8dce-be4dd98430a0' WHERE id = '3a781408-7881-46dd-9863-c29dba6437c0';
UPDATE public.jobs SET client_id = 'c6d24163-5e0d-4a29-8dce-be4dd98430a0' WHERE id = '3b4670b2-7828-4d5b-b8cf-0018293fd3a0';
UPDATE public.jobs SET client_id = '9dd7a925-f6b7-4f96-b913-3c8f554e0698' WHERE id = '3de8c787-93c0-49c1-85d5-eb9a7f90c624';
UPDATE public.jobs SET client_id = '9dd7a925-f6b7-4f96-b913-3c8f554e0698' WHERE id = '3df435f4-60a8-47f3-8c7e-f9015667c204';
UPDATE public.jobs SET client_id = 'ceffdd5e-a628-47bf-b0ec-54fcb14c6d09' WHERE id = '3dfc756e-7f2d-41d3-b720-9666daf0c9d5';
UPDATE public.jobs SET client_id = 'b0530864-0dd3-4364-8e4d-abee3a6e92c4' WHERE id = '3f748b29-d81b-403c-b1da-3ea3d99250c5';
UPDATE public.jobs SET client_id = '151ffe1b-147e-48cc-8475-6b563fa93afe' WHERE id = '405389ab-483b-43ae-9132-0d7804a45496';
UPDATE public.jobs SET client_id = 'd9cc544a-93ec-4f22-8b44-9cbf20142e66' WHERE id = '40bb902e-1997-4b4b-92b9-b78fe6913328';
UPDATE public.jobs SET client_id = '9dd7a925-f6b7-4f96-b913-3c8f554e0698' WHERE id = '410ec2cc-6353-437e-8bf6-42fcd1f07b3e';
UPDATE public.jobs SET client_id = '37837a04-1530-4992-8346-8cd87d15042c' WHERE id = '41800f81-4801-40d1-914a-6d950b6000a8';
UPDATE public.jobs SET client_id = '085051fa-8d78-43cf-90ca-590a4627e5bc' WHERE id = '4281f0a2-13ec-4763-b821-ace4b09e709c';
UPDATE public.jobs SET client_id = '37837a04-1530-4992-8346-8cd87d15042c' WHERE id = '43020df9-8a64-451a-a3ce-b57640de8377';
UPDATE public.jobs SET client_id = 'e54e3e2d-46c9-423d-94e2-edd379af375a' WHERE id = '47d8eee9-798a-48dd-9863-10ee3efdf334';
UPDATE public.jobs SET client_id = '3edda98f-e94b-42d0-8272-a5a8424e51c5' WHERE id = '4a7437a8-3da3-4e6a-9273-a78caa78fb3a';
UPDATE public.jobs SET client_id = 'e7cc5e94-7a99-4702-9930-423cd0f23235' WHERE id = '4bd1d3dd-708b-491e-8667-38a8e1527686';
UPDATE public.jobs SET client_id = '169d1762-4907-45b3-89bf-acc405bcc6dd' WHERE id = '4bebd3a4-03bf-4225-bc01-17e48761398f';
UPDATE public.jobs SET client_id = '9dd7a925-f6b7-4f96-b913-3c8f554e0698' WHERE id = '4bf56344-7458-41b8-8c3c-663993ae28d3';
UPDATE public.jobs SET client_id = 'bb44c89c-e6d6-417b-b0fa-1b8501781cf0' WHERE id = '4c3d6e89-da6b-447c-9610-4411da6dfbf8';
UPDATE public.jobs SET client_id = 'dca36f02-d06f-418e-9d7e-58437a40ad20' WHERE id = '4c47d070-ae71-49d1-9cb9-bb8764f230d6';
UPDATE public.jobs SET client_id = 'bb44c89c-e6d6-417b-b0fa-1b8501781cf0' WHERE id = '4c9a81ec-0303-43a5-99e9-c9d162e93e3c';
UPDATE public.jobs SET client_id = '87c983a5-9253-4b12-8ef7-b1d473ce6ef7' WHERE id = '4ca04dbe-ac23-4361-b678-6d55d5071029';
UPDATE public.jobs SET client_id = '96bc8125-f485-445b-af82-534e55c52b49' WHERE id = '4d48bf19-65c9-4aae-a50c-c0dcd712e46f';
UPDATE public.jobs SET client_id = 'ceffdd5e-a628-47bf-b0ec-54fcb14c6d09' WHERE id = '4dc8988a-848c-4434-94e8-44234a39cdf6';
UPDATE public.jobs SET client_id = '683e06ee-c6f4-4d45-b4a7-ffbbf59eb6ce' WHERE id = '4f22eae3-16f6-42aa-8d3d-9c5dd32f60da';
UPDATE public.jobs SET client_id = '4ea0d301-e39e-4f9c-8e76-d854890e863f' WHERE id = '50658c5d-c007-41ea-b4a3-08433125e16c';
UPDATE public.jobs SET client_id = '96bc8125-f485-445b-af82-534e55c52b49' WHERE id = '506e8c04-2c62-4c3c-bbe0-123ca699b425';
UPDATE public.jobs SET client_id = '37837a04-1530-4992-8346-8cd87d15042c' WHERE id = '507e137a-0195-4749-b993-c539b842b733';
UPDATE public.jobs SET client_id = 'b0352542-6566-45a0-9bc8-917469d1ee69' WHERE id = '51523a0d-604b-4ee0-ab10-8360c882fa16';
UPDATE public.jobs SET client_id = 'c6d24163-5e0d-4a29-8dce-be4dd98430a0' WHERE id = '54809dd5-cbfb-44cb-a780-cdea41b2148f';
UPDATE public.jobs SET client_id = '0c6b93cc-045d-4218-95c6-83c8f75b28a8' WHERE id = '552f0d1a-288e-4f32-ab96-1dc4e87f1553';
UPDATE public.jobs SET client_id = '9f12db81-45e1-46fb-b048-698f889d5887' WHERE id = '555440c4-d16d-46b3-9e99-10ed9d83a671';
UPDATE public.jobs SET client_id = 'b0530864-0dd3-4364-8e4d-abee3a6e92c4' WHERE id = '5a34d74c-a156-46f3-aee1-aa6fe8d3437a';
UPDATE public.jobs SET client_id = '151ffe1b-147e-48cc-8475-6b563fa93afe' WHERE id = '5add99d6-154f-499a-a3f7-ce31f218f00a';
UPDATE public.jobs SET client_id = 'a21441c3-2078-44db-b861-3635ad5486ec' WHERE id = '5b6e636e-3fb7-4e67-b783-17b881aec275';
UPDATE public.jobs SET client_id = '715b2ab2-116e-495d-a5ed-4b89c9bf5208' WHERE id = '5c432e48-80d9-4320-a21b-4246da7bf45e';
UPDATE public.jobs SET client_id = '37837a04-1530-4992-8346-8cd87d15042c' WHERE id = '5c661a8f-62e5-4150-9921-4926fe9eaf05';
UPDATE public.jobs SET client_id = '4f6ef2cc-01bd-497f-bdff-2dc819ffa6e4' WHERE id = '5cfc12b5-9e30-4b68-93d0-c7ba2008f001';
UPDATE public.jobs SET client_id = '9dd7a925-f6b7-4f96-b913-3c8f554e0698' WHERE id = '5d32738f-f6c1-4fa2-b856-45d56073b0fc';
UPDATE public.jobs SET client_id = '02d344a3-0030-4f6b-b742-9868177a43c5' WHERE id = '5d4b762f-45a5-47fb-9ec7-45e6d04d4d37';
UPDATE public.jobs SET client_id = 'a21441c3-2078-44db-b861-3635ad5486ec' WHERE id = '5d85139a-1e51-4c74-aca6-95f3d1a04a7f';
UPDATE public.jobs SET client_id = '9dd7a925-f6b7-4f96-b913-3c8f554e0698' WHERE id = '5e4ef16a-4d51-4c8d-9a28-6e8ed7c34b61';
UPDATE public.jobs SET client_id = '62dd338a-8771-427d-acd1-7b5ea0f1ea53' WHERE id = '5ee0a3ed-bf17-46e1-b383-8662fae6d4c1';
UPDATE public.jobs SET client_id = 'bc16921d-d60f-49ca-97f1-7f9e3a8b78c7' WHERE id = '5f29790f-e4b7-4cf7-915a-1fa8528042c9';
UPDATE public.jobs SET client_id = '1d552219-e767-4915-8903-94a7d1355620' WHERE id = '5fdbfee0-3e86-4650-8d4f-b00dbcf5763f';
UPDATE public.jobs SET client_id = '90f0371a-9b96-46e2-9e25-f655f5b0da3f' WHERE id = '5fdd153a-c171-404a-9d51-f01835cf26b6';
UPDATE public.jobs SET client_id = 'c6d24163-5e0d-4a29-8dce-be4dd98430a0' WHERE id = '60d401ed-f90c-47f6-9ea0-f121720e7596';
UPDATE public.jobs SET client_id = 'a21441c3-2078-44db-b861-3635ad5486ec' WHERE id = '61f481a1-a570-4d56-a5bf-55b675fe81ea';
UPDATE public.jobs SET client_id = 'b0530864-0dd3-4364-8e4d-abee3a6e92c4' WHERE id = '655b0328-1fa8-430a-9d8d-233c6cd5ac5d';
UPDATE public.jobs SET client_id = 'ecd2debe-b670-4b91-ae6a-68415b6745d7' WHERE id = '66025baf-736e-43e0-9d95-b41eeb485c0c';
UPDATE public.jobs SET client_id = '37837a04-1530-4992-8346-8cd87d15042c' WHERE id = '6673bf80-1cec-468e-a198-19fdffce4026';
UPDATE public.jobs SET client_id = '9dd7a925-f6b7-4f96-b913-3c8f554e0698' WHERE id = '67a07a6c-a366-4778-8e20-1f761027d711';
UPDATE public.jobs SET client_id = '9dd7a925-f6b7-4f96-b913-3c8f554e0698' WHERE id = '69555ecd-f37d-4b2d-b873-42ef2b9a1aec';
UPDATE public.jobs SET client_id = '37837a04-1530-4992-8346-8cd87d15042c' WHERE id = '69cca6de-6853-4cbb-8ca1-45bed7ebd452';
UPDATE public.jobs SET client_id = '1d552219-e767-4915-8903-94a7d1355620' WHERE id = '69fd797b-77c9-46e6-bf02-85fbd84ce1af';
UPDATE public.jobs SET client_id = '9dd7a925-f6b7-4f96-b913-3c8f554e0698' WHERE id = '6a7896db-2d56-4fdc-85f1-ac8f20276d22';
UPDATE public.jobs SET client_id = '37837a04-1530-4992-8346-8cd87d15042c' WHERE id = '6e14d4b6-f2db-486f-aec3-dede36f8794f';
UPDATE public.jobs SET client_id = '37837a04-1530-4992-8346-8cd87d15042c' WHERE id = '6f1326a3-23f7-468e-b166-fa6300b50f26';

-- =====================================================
-- STEP 4: Add partial unique index (allows NULL user_id)
-- =====================================================
DROP INDEX IF EXISTS idx_clients_user_id_unique;
CREATE UNIQUE INDEX idx_clients_user_id_unique ON public.clients (user_id) WHERE user_id IS NOT NULL;

-- Total clients to restore: 76
-- Total jobs to reassign: 100
