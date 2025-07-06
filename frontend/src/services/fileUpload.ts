import * as DocumentPicker from 'expo-document-picker'
import * as FileSystem from 'expo-file-system'
import { Platform } from 'react-native'
import { supabase } from '../config/supabase'
import { AudioFile, UploadResult, FileUploadError } from '../types'

export const pickAudioFile = async (): Promise<AudioFile | null> => {
  try {
    if (Platform.OS === 'web') {
      // Web implementation
      return new Promise((resolve) => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'audio/*'
        
        input.onchange = (event: any) => {
          const file = event.target.files?.[0]
          if (file) {
            resolve({
              uri: URL.createObjectURL(file),
              name: file.name,
              size: file.size,
              type: file.type,
              file: file, // Store the actual File object for web
            })
          } else {
            resolve(null)
          }
        }
        
        input.click()
      })
    } else {
      // Mobile implementation
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0]
        return {
          uri: asset.uri,
          name: asset.name,
          size: asset.size || 0,
          type: asset.mimeType || 'audio/mpeg',
        }
      }
      return null
    }
  } catch (error) {
    console.error('Error picking audio file:', error)
    return null
  }
}

export const uploadAudioFile = async (uri: string, fileName: string, file?: File): Promise<UploadResult> => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    console.log('Uploading file for user:', user.id)

    // Include user ID in the file path as required by storage policies
    const filePath = `${user.id}/${Date.now()}-${fileName}`
    console.log('Upload path:', filePath)

    let uploadFile: File | ArrayBuffer

    if (Platform.OS === 'web' && file) {
      // Web: use the File object directly
      uploadFile = file
    } else {
      // Mobile: read file and convert to ArrayBuffer
      const fileInfo = await FileSystem.getInfoAsync(uri)
      if (!fileInfo.exists) {
        throw new Error('File does not exist')
      }

      const fileData = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      })

      // Convert base64 to ArrayBuffer
      const binaryString = atob(fileData)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      uploadFile = bytes.buffer
    }

    const { data, error } = await supabase.storage
      .from('audio-files')
      .upload(filePath, uploadFile, {
        contentType: file?.type || 'audio/mpeg',
        upsert: false,
      })

    if (error) {
      console.error('Upload error:', error)
      const uploadError: FileUploadError = {
        message: error.message,
        code: error.message.includes('size') ? 'FILE_TOO_LARGE' : 'UPLOAD_FAILED'
      }
      throw uploadError
    }

    console.log('Upload successful:', data)

    const { data: { publicUrl } } = supabase.storage
      .from('audio-files')
      .getPublicUrl(data.path)

    return { url: publicUrl, path: data.path }
  } catch (error: any) {
    console.error('Error uploading audio file:', error)
    throw error
  }
}

export const validateAudioFile = (file: AudioFile): { isValid: boolean; error?: string } => {
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  const ALLOWED_TYPES = ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/m4a', 'audio/x-m4a'];

  if (file.size > MAX_FILE_SIZE) {
    return { isValid: false, error: 'File size must be less than 50MB' };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { isValid: false, error: 'Only MP3, MP4, WAV, and M4A files are supported' };
  }

  return { isValid: true };
}