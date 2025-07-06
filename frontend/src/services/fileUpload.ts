import * as DocumentPicker from 'expo-document-picker'
import * as FileSystem from 'expo-file-system'
import { supabase } from '../config/supabase'
import { AudioFile, UploadResult, FileUploadError } from '../types'

export const pickAudioFile = async (): Promise<AudioFile | null> => {
  try {
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
  } catch (error) {
    console.error('Error picking audio file:', error)
    return null
  }
}

export const uploadAudioFile = async (uri: string, fileName: string): Promise<UploadResult> => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri)
    if (!fileInfo.exists) {
      throw new Error('File does not exist')
    }

    const fileData = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    })

    const { data, error } = await supabase.storage
      .from('audio-files')
      .upload(`${Date.now()}-${fileName}`, 
        Buffer.from(fileData, 'base64'), 
        {
          contentType: 'audio/mpeg',
          upsert: false,
        }
      )

    if (error) {
      const uploadError: FileUploadError = {
        message: error.message,
        code: error.message.includes('size') ? 'FILE_TOO_LARGE' : 'UPLOAD_FAILED'
      }
      throw uploadError
    }

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
  const ALLOWED_TYPES = ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/m4a'];

  if (file.size > MAX_FILE_SIZE) {
    return { isValid: false, error: 'File size must be less than 50MB' };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { isValid: false, error: 'Only MP3, MP4, WAV, and M4A files are supported' };
  }

  return { isValid: true };
}