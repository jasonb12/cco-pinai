-- Verification Script for Storage Setup (Fixed for Supabase)
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

-- 3. Check RLS policies on storage.objects table
SELECT 
    'Storage RLS Policies' as check_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
    AND tablename = 'objects'
    AND policyname LIKE '%audio%'
ORDER BY policyname;

-- 4. Count of policies
SELECT 
    'Policy Count' as check_type,
    COUNT(*) as total_policies,
    COUNT(CASE WHEN policyname LIKE '%audio%' THEN 1 END) as audio_policies
FROM pg_policies 
WHERE schemaname = 'storage' 
    AND tablename = 'objects';

-- 5. List all storage.objects policies (to see what's there)
SELECT 
    'All Storage Object Policies' as check_type,
    policyname as policy_name,
    cmd as operation,
    CASE 
        WHEN policyname LIKE '%upload%' THEN 'INSERT'
        WHEN policyname LIKE '%view%' THEN 'SELECT'
        WHEN policyname LIKE '%update%' THEN 'UPDATE'
        WHEN policyname LIKE '%delete%' THEN 'DELETE'
        ELSE cmd::text
    END as policy_type
FROM pg_policies 
WHERE schemaname = 'storage' 
    AND tablename = 'objects'
ORDER BY policyname;

-- 6. Summary
SELECT 
    'Summary' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'audio-files')
        THEN '✅ Storage bucket exists!'
        ELSE '❌ Storage bucket not found'
    END as status;