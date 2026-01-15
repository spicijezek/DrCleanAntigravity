# Supabase to Cloudinary Migration Guide

This guide describes how to migrate your existing files from Supabase Storage to Cloudinary and update your database records so the application continues to work seamlessly without costing $25/month.

## Step 1: Download existing files from Supabase

1. Go to your **Supabase Dashboard** -> **Storage**.
2. For each bucket (`avatars`, `room_photos`, `educational_content`, `protocols`, `invoices`):
   - Select all files.
   - Use the **Download** button to get them to your computer.

## Step 2: Upload files to Cloudinary

1. Log in to your **Cloudinary** console.
2. You can upload files manually through the **Media Explorer**.
3. **Important**: Since we are using an unsigned preset (`DrClean`), make sure your Cloudinary settings allow these uploads and that you don't mind them being public.
4. Once uploaded, note the **Secure URL** for each file.

## Step 3: Update Database Records

After uploading files to Cloudinary, you need to update the paths in your database to the new full URLs. Run the following SQL commands in your **Supabase SQL Editor**:

### 1. Update Profile Avatars
```sql
UPDATE profiles 
SET avatar_url = 'https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/v123456789/your_file.jpg'
WHERE user_id = 'USER_ID_HERE';
```

### 2. Update Invoices (PDFs)
```sql
UPDATE invoices
SET pdf_path = 'https://res.cloudinary.com/YOUR_CLOUD_NAME/raw/upload/v123456789/invoice_123.pdf'
WHERE id = 'INVOICE_ID_HERE';
```

### 3. Update Protocols
```sql
UPDATE protocols
SET file_path = 'https://res.cloudinary.com/YOUR_CLOUD_NAME/raw/upload/v123456789/protocol_123.pdf'
WHERE id = 'PROTOCOL_ID_HERE';
```

### 4. Update Educational Content
```sql
UPDATE educational_content
SET file_url = 'https://res.cloudinary.com/YOUR_CLOUD_NAME/raw/upload/v123456789/content_123.pdf'
WHERE id = 'CONTENT_ID_HERE';
```

> [!TIP]
> **Pro Tip**: If you have many files, it's easier to use a script or simply start with a clean slate for historical files if they aren't critical. New uploads will now automatically go to Cloudinary.

## Step 4: Final Cleanup

1. Once you have verified that everything works (new uploads work and old migrated files are accessible):
2. **Delete all files and buckets** in Supabase Storage.
3. Verify your usage is **below 1GB**.
4. Go to **Organization Settings** -> **Subscription** and downgrade/revert to the **Free Tier**.
