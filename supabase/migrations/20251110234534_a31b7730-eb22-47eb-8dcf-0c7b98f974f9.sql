
-- Restore team member data from backup
UPDATE team_members SET
  name = CASE id
    WHEN '0bb5903e-4c7e-4429-96f5-1e046d62e7b0' THEN 'Martin Sedlmayer'
    WHEN '26cca247-2190-48d5-b42e-449f5a30da4a' THEN 'Iryna Stoyka'
    WHEN '2b3dab46-c559-4754-9fac-048120b2ff1c' THEN 'Jan Švec'
    WHEN '3eb9d044-910b-4a0f-bc84-40077de13db4' THEN 'Ludva'
    WHEN '4da0a68f-b9c2-4a5f-9164-314cb3dcba18' THEN 'Masha Segra'
    WHEN '6e1ed824-ff24-48e1-9dee-d792f88b49e8' THEN 'Tomáš Pavlů'
    WHEN '74af71f4-df4e-4479-9e52-12543abd16ab' THEN 'Antim Tomov'
    WHEN '7ad5bd70-9f0c-40f1-9783-0f02503d8ec9' THEN 'M Tyvodar'
    WHEN '93995cc5-cc63-4955-9d9b-85f4f3579bea' THEN 'Šimon Jína'
    WHEN '9e069429-eaa5-46de-8d0c-c7a597d50cb3' THEN 'Nadja'
    WHEN 'c8b298f5-8a0c-4e1d-bcbc-057c52fbb8ee' THEN 'František Pavlů'
    WHEN 'c9d17ff5-16d1-47c6-94ee-01cef3e94e7b' THEN 'Masha Sr'
  END,
  email = CASE id
    WHEN '0bb5903e-4c7e-4429-96f5-1e046d62e7b0' THEN 'sedlos@nevim.cz'
    WHEN '26cca247-2190-48d5-b42e-449f5a30da4a' THEN 'iras@gmail.com'
    WHEN '2b3dab46-c559-4754-9fac-048120b2ff1c' THEN NULL
    WHEN '3eb9d044-910b-4a0f-bc84-40077de13db4' THEN NULL
    WHEN '4da0a68f-b9c2-4a5f-9164-314cb3dcba18' THEN NULL
    WHEN '6e1ed824-ff24-48e1-9dee-d792f88b49e8' THEN 'tomas.pavlu@psib.cz'
    WHEN '74af71f4-df4e-4479-9e52-12543abd16ab' THEN 'antimtomov12@seznam.cz'
    WHEN '7ad5bd70-9f0c-40f1-9783-0f02503d8ec9' THEN 'mtyvodar@gmail.com'
    WHEN '93995cc5-cc63-4955-9d9b-85f4f3579bea' THEN NULL
    WHEN '9e069429-eaa5-46de-8d0c-c7a597d50cb3' THEN NULL
    WHEN 'c8b298f5-8a0c-4e1d-bcbc-057c52fbb8ee' THEN 'nevim@nevim.cz'
    WHEN 'c9d17ff5-16d1-47c6-94ee-01cef3e94e7b' THEN NULL
  END,
  phone = CASE id
    WHEN '0bb5903e-4c7e-4429-96f5-1e046d62e7b0' THEN '+420 777 627 752'
    WHEN '26cca247-2190-48d5-b42e-449f5a30da4a' THEN '776563068'
    WHEN '2b3dab46-c559-4754-9fac-048120b2ff1c' THEN '+420 702 203 374'
    WHEN '3eb9d044-910b-4a0f-bc84-40077de13db4' THEN NULL
    WHEN '4da0a68f-b9c2-4a5f-9164-314cb3dcba18' THEN NULL
    WHEN '6e1ed824-ff24-48e1-9dee-d792f88b49e8' THEN '+420 773 707 711'
    WHEN '74af71f4-df4e-4479-9e52-12543abd16ab' THEN '+420 777 504 692'
    WHEN '7ad5bd70-9f0c-40f1-9783-0f02503d8ec9' THEN '+420 776 831 794'
    WHEN '93995cc5-cc63-4955-9d9b-85f4f3579bea' THEN NULL
    WHEN '9e069429-eaa5-46de-8d0c-c7a597d50cb3' THEN '+380 68 730 7794'
    WHEN 'c8b298f5-8a0c-4e1d-bcbc-057c52fbb8ee' THEN '+420 704 126 124'
    WHEN 'c9d17ff5-16d1-47c6-94ee-01cef3e94e7b' THEN NULL
  END,
  position = CASE id
    WHEN '0bb5903e-4c7e-4429-96f5-1e046d62e7b0' THEN 'Cleaner'
    WHEN '26cca247-2190-48d5-b42e-449f5a30da4a' THEN 'Cleaner'
    WHEN '2b3dab46-c559-4754-9fac-048120b2ff1c' THEN 'Cleaner'
    WHEN '3eb9d044-910b-4a0f-bc84-40077de13db4' THEN NULL
    WHEN '4da0a68f-b9c2-4a5f-9164-314cb3dcba18' THEN NULL
    WHEN '6e1ed824-ff24-48e1-9dee-d792f88b49e8' THEN 'Cleaner'
    WHEN '74af71f4-df4e-4479-9e52-12543abd16ab' THEN 'Cleaner'
    WHEN '7ad5bd70-9f0c-40f1-9783-0f02503d8ec9' THEN 'Cleaner'
    WHEN '93995cc5-cc63-4955-9d9b-85f4f3579bea' THEN 'Cleaner'
    WHEN '9e069429-eaa5-46de-8d0c-c7a597d50cb3' THEN 'Cleaner'
    WHEN 'c8b298f5-8a0c-4e1d-bcbc-057c52fbb8ee' THEN 'Cleaner'
    WHEN 'c9d17ff5-16d1-47c6-94ee-01cef3e94e7b' THEN 'Cleaner'
  END,
  hourly_rate = CASE id
    WHEN '0bb5903e-4c7e-4429-96f5-1e046d62e7b0' THEN 250.00
    WHEN '26cca247-2190-48d5-b42e-449f5a30da4a' THEN 200.00
    WHEN '2b3dab46-c559-4754-9fac-048120b2ff1c' THEN 300.00
    WHEN '3eb9d044-910b-4a0f-bc84-40077de13db4' THEN 200.00
    WHEN '4da0a68f-b9c2-4a5f-9164-314cb3dcba18' THEN 200.00
    WHEN '6e1ed824-ff24-48e1-9dee-d792f88b49e8' THEN 250.00
    WHEN '74af71f4-df4e-4479-9e52-12543abd16ab' THEN 250.00
    WHEN '7ad5bd70-9f0c-40f1-9783-0f02503d8ec9' THEN 200.00
    WHEN '93995cc5-cc63-4955-9d9b-85f4f3579bea' THEN 250.00
    WHEN '9e069429-eaa5-46de-8d0c-c7a597d50cb3' THEN 200.00
    WHEN 'c8b298f5-8a0c-4e1d-bcbc-057c52fbb8ee' THEN 250.00
    WHEN 'c9d17ff5-16d1-47c6-94ee-01cef3e94e7b' THEN 200.00
  END,
  address = CASE id
    WHEN '0bb5903e-4c7e-4429-96f5-1e046d62e7b0' THEN 'Karolíny Světlé'
    WHEN '26cca247-2190-48d5-b42e-449f5a30da4a' THEN 'Krkonošská 737/12'
    WHEN '2b3dab46-c559-4754-9fac-048120b2ff1c' THEN 'Nad Kadlickou '
    WHEN '3eb9d044-910b-4a0f-bc84-40077de13db4' THEN NULL
    WHEN '4da0a68f-b9c2-4a5f-9164-314cb3dcba18' THEN NULL
    WHEN '6e1ed824-ff24-48e1-9dee-d792f88b49e8' THEN 'Rupre vedle tesca'
    WHEN '74af71f4-df4e-4479-9e52-12543abd16ab' THEN 'B. Němcové 524/11a'
    WHEN '7ad5bd70-9f0c-40f1-9783-0f02503d8ec9' THEN 'Krkonošská 737/12'
    WHEN '93995cc5-cc63-4955-9d9b-85f4f3579bea' THEN NULL
    WHEN '9e069429-eaa5-46de-8d0c-c7a597d50cb3' THEN NULL
    WHEN 'c8b298f5-8a0c-4e1d-bcbc-057c52fbb8ee' THEN 'Rupre, vedle Tesca'
    WHEN 'c9d17ff5-16d1-47c6-94ee-01cef3e94e7b' THEN 'Krkonošská 737/12'
  END,
  hire_date = CASE id
    WHEN '0bb5903e-4c7e-4429-96f5-1e046d62e7b0' THEN '2024-12-18'::date
    WHEN '26cca247-2190-48d5-b42e-449f5a30da4a' THEN '2025-01-10'::date
    WHEN '2b3dab46-c559-4754-9fac-048120b2ff1c' THEN '2024-01-19'::date
    WHEN '3eb9d044-910b-4a0f-bc84-40077de13db4' THEN '2025-10-10'::date
    WHEN '4da0a68f-b9c2-4a5f-9164-314cb3dcba18' THEN '2025-10-28'::date
    WHEN '6e1ed824-ff24-48e1-9dee-d792f88b49e8' THEN '2025-01-02'::date
    WHEN '74af71f4-df4e-4479-9e52-12543abd16ab' THEN '2025-07-01'::date
    WHEN '7ad5bd70-9f0c-40f1-9783-0f02503d8ec9' THEN '2025-06-16'::date
    WHEN '93995cc5-cc63-4955-9d9b-85f4f3579bea' THEN '2025-07-01'::date
    WHEN '9e069429-eaa5-46de-8d0c-c7a597d50cb3' THEN '2025-08-21'::date
    WHEN 'c8b298f5-8a0c-4e1d-bcbc-057c52fbb8ee' THEN '2025-01-02'::date
    WHEN 'c9d17ff5-16d1-47c6-94ee-01cef3e94e7b' THEN '2025-08-27'::date
  END
WHERE id IN (
  '0bb5903e-4c7e-4429-96f5-1e046d62e7b0',
  '26cca247-2190-48d5-b42e-449f5a30da4a',
  '2b3dab46-c559-4754-9fac-048120b2ff1c',
  '3eb9d044-910b-4a0f-bc84-40077de13db4',
  '4da0a68f-b9c2-4a5f-9164-314cb3dcba18',
  '6e1ed824-ff24-48e1-9dee-d792f88b49e8',
  '74af71f4-df4e-4479-9e52-12543abd16ab',
  '7ad5bd70-9f0c-40f1-9783-0f02503d8ec9',
  '93995cc5-cc63-4955-9d9b-85f4f3579bea',
  '9e069429-eaa5-46de-8d0c-c7a597d50cb3',
  'c8b298f5-8a0c-4e1d-bcbc-057c52fbb8ee',
  'c9d17ff5-16d1-47c6-94ee-01cef3e94e7b'
);

-- Re-insert any missing team members (Iryna and M Tyvodar were not in the first query result)
INSERT INTO team_members (id, user_id, name, email, phone, position, hourly_rate, address, hire_date, is_active, created_at, updated_at)
VALUES 
  ('26cca247-2190-48d5-b42e-449f5a30da4a', '8a751222-9ec6-49b7-9f6d-e4d519f325ca', 'Iryna Stoyka', 'iras@gmail.com', '776563068', 'Cleaner', 200.00, 'Krkonošská 737/12', '2025-01-10'::date, true, '2025-09-03 12:52:54.516884+00', '2025-09-16 16:34:15.954127+00'),
  ('7ad5bd70-9f0c-40f1-9783-0f02503d8ec9', '8a751222-9ec6-49b7-9f6d-e4d519f325ca', 'M Tyvodar', 'mtyvodar@gmail.com', '+420 776 831 794', 'Cleaner', 200.00, 'Krkonošská 737/12', '2025-06-16'::date, true, '2025-09-16 15:22:06.019597+00', '2025-09-16 15:22:06.019597+00')
ON CONFLICT (id) DO NOTHING;
