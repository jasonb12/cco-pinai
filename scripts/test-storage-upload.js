#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testStorageUpload() {
    console.log('🧪 Testing Supabase storage upload...\n');

    // Create a test file if it doesn't exist
    const testFilePath = path.join(__dirname, '../test-audio.m4a');
    if (!fs.existsSync(testFilePath)) {
        console.log('❌ Test audio file not found at:', testFilePath);
        console.log('Create one with: say "Test audio" -o test-audio.m4a');
        return;
    }

    const fileBuffer = fs.readFileSync(testFilePath);
    const fileName = `test-${Date.now()}.m4a`;
    
    // Test 1: Upload without user context (should fail due to policies)
    console.log('Test 1: Upload without authentication (should fail)');
    const filePath1 = `public/${fileName}`;
    const { data: data1, error: error1 } = await supabase.storage
        .from('audio-files')
        .upload(filePath1, fileBuffer, {
            contentType: 'audio/x-m4a',
            upsert: false
        });

    if (error1) {
        console.log('✅ Expected failure:', error1.message);
    } else {
        console.log('⚠️  Unexpected success - policies might not be working');
    }

    // Test 2: Upload with simulated user context
    console.log('\nTest 2: Upload with service role (bypasses RLS)');
    
    // First create a test user or use existing
    const testUserId = 'test-user-' + Date.now();
    const filePath2 = `${testUserId}/${fileName}`;
    
    const { data: data2, error: error2 } = await supabase.storage
        .from('audio-files')
        .upload(filePath2, fileBuffer, {
            contentType: 'audio/x-m4a',
            upsert: false
        });

    if (error2) {
        console.log('❌ Upload failed:', error2.message);
    } else {
        console.log('✅ Upload successful!');
        console.log('📁 File path:', filePath2);
        
        // Get public URL
        const { data: urlData } = supabase.storage
            .from('audio-files')
            .getPublicUrl(filePath2);
        
        console.log('🔗 Public URL:', urlData.publicUrl);
        
        // Clean up - delete test file
        const { error: deleteError } = await supabase.storage
            .from('audio-files')
            .remove([filePath2]);
        
        if (!deleteError) {
            console.log('🧹 Test file cleaned up');
        }
    }

    // Test 3: Check bucket configuration
    console.log('\nTest 3: Verify bucket configuration');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
        console.log('❌ Could not list buckets:', bucketsError.message);
    } else {
        const audioBucket = buckets.find(b => b.id === 'audio-files');
        if (audioBucket) {
            console.log('✅ Audio bucket found:', audioBucket);
        } else {
            console.log('❌ Audio bucket not found');
        }
    }
}

testStorageUpload().catch(console.error);