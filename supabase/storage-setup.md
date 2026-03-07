# Supabase Storage Setup for Profile Images

Follow these steps to create a storage bucket for profile images:

## 1. Create Storage Bucket

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/xziymrzqhgbvjmbccjtc
2. Click **"Storage"** in the left sidebar
3. Click **"New bucket"**
4. Enter the following:
   - **Name:** `avatars`
   - **Public bucket:** ✅ Check this box (so images are publicly accessible)
   - **File size limit:** 2MB
   - **Allowed MIME types:** Leave empty (or add: `image/jpeg, image/png, image/gif, image/webp`)
5. Click **"Create bucket"**

## 2. Set Storage Policies (Optional - for extra security)

If you want to restrict who can upload/delete images:

1. Click on the **"avatars"** bucket
2. Go to **"Policies"** tab
3. Click **"New policy"**

### Upload Policy (Allow authenticated users to upload their own images):
```sql
CREATE POLICY "Users can upload their own profile images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'profile-images'
  AND auth.uid()::text = (storage.filename(name))[1]
);
```

### Delete Policy (Allow users to delete their own images):
```sql
CREATE POLICY "Users can delete their own profile images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = 'profile-images'
  AND auth.uid()::text = (storage.filename(name))[1]
);
```

### Public Read Policy (Allow everyone to view images):
```sql
CREATE POLICY "Public can view profile images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
```

## 3. Verify Setup

1. Go back to **Storage → avatars**
2. You should see an empty bucket
3. The profile page will now be able to upload images!

## Notes

- Images are stored in the path: `profile-images/{user_id}-{timestamp}.{ext}`
- Max file size: 2MB
- Supported formats: JPG, PNG, GIF, WebP
- Public bucket means images are accessible via public URL (needed for displaying avatars)
