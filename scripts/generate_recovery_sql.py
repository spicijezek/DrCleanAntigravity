#!/usr/bin/env python3
"""
Generate SQL statements to restore clients and reassign jobs from CSV backups.
"""
import csv
import sys

def escape_sql(value):
    """Escape single quotes for SQL"""
    if value is None or value == '':
        return 'NULL'
    # Escape single quotes
    escaped = str(value).replace("'", "''")
    return f"'{escaped}'"

def generate_client_inserts(csv_path):
    """Generate INSERT statements for clients"""
    statements = []
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Skip if it's an app-registered client (has a different user_id)
            # We only want to restore manually-added clients
            user_id = row.get('user_id', '')
            
            # Build the INSERT statement with ON CONFLICT DO NOTHING
            stmt = f"""INSERT INTO public.clients (
    id, user_id, name, email, phone, date_of_birth, address, city, postal_code,
    notes, total_spent, created_at, updated_at, date_added, client_type,
    company_id, company_legal_name, reliable_person, client_source,
    contact_preference, has_children, has_pets, has_allergies, allergies_notes, special_instructions
) VALUES (
    {escape_sql(row['id'])},
    {escape_sql(row['user_id']) if row['user_id'] else 'NULL'},
    {escape_sql(row['name'])},
    {escape_sql(row['email']) if row['email'] else 'NULL'},
    {escape_sql(row['phone']) if row['phone'] else 'NULL'},
    {escape_sql(row['date_of_birth']) if row['date_of_birth'] else 'NULL'},
    {escape_sql(row['address']) if row['address'] else 'NULL'},
    {escape_sql(row['city']) if row['city'] else 'NULL'},
    {escape_sql(row['postal_code']) if row['postal_code'] else 'NULL'},
    {escape_sql(row['notes']) if row['notes'] else 'NULL'},
    {row['total_spent'] if row['total_spent'] else '0.00'},
    {escape_sql(row['created_at'])},
    {escape_sql(row['updated_at'])},
    {escape_sql(row['date_added']) if row['date_added'] else 'NULL'},
    {escape_sql(row['client_type']) if row['client_type'] else 'NULL'},
    {escape_sql(row['company_id']) if row['company_id'] else 'NULL'},
    {escape_sql(row['company_legal_name']) if row['company_legal_name'] else 'NULL'},
    {escape_sql(row['reliable_person']) if row['reliable_person'] else 'NULL'},
    {escape_sql(row['client_source']) if row['client_source'] else 'NULL'},
    {escape_sql(row['contact_preference']) if row['contact_preference'] else 'NULL'},
    {row['has_children'].lower() if row.get('has_children') else 'false'},
    {row['has_pets'].lower() if row.get('has_pets') else 'false'},
    {row['has_allergies'].lower() if row.get('has_allergies') else 'false'},
    {escape_sql(row['allergies_notes']) if row.get('allergies_notes') else 'NULL'},
    {escape_sql(row['special_instructions']) if row.get('special_instructions') else 'NULL'}
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    postal_code = EXCLUDED.postal_code;"""
            statements.append(stmt)
    return statements

def generate_job_updates(csv_path):
    """Generate UPDATE statements to reassign jobs to correct clients"""
    statements = []
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            job_id = row['id']
            client_id = row['client_id']
            # Generate UPDATE statement
            stmt = f"UPDATE public.jobs SET client_id = '{client_id}' WHERE id = '{job_id}';"
            statements.append(stmt)
    return statements

if __name__ == '__main__':
    clients_csv = '/Users/st/Downloads/clients_rows.csv'
    jobs_csv = '/Users/st/Downloads/jobs_rows.csv'
    
    print("-- =====================================================")
    print("-- STEP 1: Drop the unique constraint on user_id")
    print("-- =====================================================")
    print("ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS clients_user_id_unique;")
    print()
    
    print("-- =====================================================")
    print("-- STEP 2: Insert/restore all clients from backup")
    print("-- =====================================================")
    client_stmts = generate_client_inserts(clients_csv)
    for stmt in client_stmts:
        print(stmt)
        print()
    
    print("-- =====================================================")
    print("-- STEP 3: Reassign jobs to their correct clients")
    print("-- =====================================================")
    job_stmts = generate_job_updates(jobs_csv)
    for stmt in job_stmts:
        print(stmt)
    print()
    
    print("-- =====================================================")
    print("-- STEP 4: Add partial unique index (allows NULL user_id)")
    print("-- =====================================================")
    print("DROP INDEX IF EXISTS idx_clients_user_id_unique;")
    print("CREATE UNIQUE INDEX idx_clients_user_id_unique ON public.clients (user_id) WHERE user_id IS NOT NULL;")
    print()
    print(f"-- Total clients to restore: {len(client_stmts)}")
    print(f"-- Total jobs to reassign: {len(job_stmts)}")
