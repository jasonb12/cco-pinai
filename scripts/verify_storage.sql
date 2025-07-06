-- Verification Script for Storage Setup
-- Run this in Supabase SQL Editor to verify storage was set up correctly

-- 1. Check if storage bucket exists
SELECT 
    'Storage Bucket Check' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'audio-files')
        THEN '✅ audio-files bucket exists'
        ELSE '❌ audio-files bucket NOT found'
    END as status;

-- 2. Check bucket configuration
SELECT 
    'Bucket Configuration' as check_type,
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE id = 'audio-files';

-- 3. Check storage policies
SELECT 
    'Storage Policies' as check_type,
    name as policy_name,
    action as policy_action,
    CASE 
        WHEN name LIKE '%upload%' THEN 'INSERT - Upload policy'
        WHEN name LIKE '%view%' THEN 'SELECT - View policy'
        WHEN name LIKE '%update%' THEN 'UPDATE - Update policy'
        WHEN name LIKE '%delete%' THEN 'DELETE - Delete policy'
        ELSE action::text
    END as policy_type
FROM storage.policies 
WHERE bucket_id = 'audio-files'
ORDER BY action;

-- 4. Count of policies (should be 4)
SELECT 
    'Policy Count Check' as check_type,
    COUNT(*) as policy_count,
    CASE 
        WHEN COUNT(*) = 4 THEN '✅ All 4 policies present'
        WHEN COUNT(*) > 0 THEN '⚠️  Found ' || COUNT(*) || ' policies (expected 4)'
        ELSE '❌ No policies found'
    END as status
FROM storage.policies 
WHERE bucket_id = 'audio-files';

-- 5. Summary
SELECT 
    'Summary' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'audio-files')
             AND (SELECT COUNT(*) FROM storage.policies WHERE bucket_id = 'audio-files') = 4
        THEN '✅ Storage setup is complete and correct!'
        ELSE '❌ Storage setup needs attention'
    END as status;