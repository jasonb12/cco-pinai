import { supabase } from '../config/supabase'
import { AudioFile, UploadResult, FileUploadError } from '../types'

export const pickAudioFile = async (): Promise<AudioFile | null> => {
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

    // For web, we need the actual File object
    if (!file) {
      // If no file object, try to fetch from the URI
      const response = await fetch(uri)
      const blob = await response.blob()
      file = new File([blob], fileName, { type: 'audio/mpeg' })
    }

    const { data, error } = await supabase.storage
      .from('audio-files')
      .upload(filePath, file, {
        contentType: file.type || 'audio/mpeg',
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