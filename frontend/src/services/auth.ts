import * as AuthSession from 'expo-auth-session'
import * as WebBrowser from 'expo-web-browser'
import { supabase } from '../config/supabase'
import { Platform } from 'react-native'
import { AuthError } from '../types'

WebBrowser.maybeCompleteAuthSession()

const redirectTo = AuthSession.makeRedirectUri({
  scheme: 'audio-transcript-mcp',
  path: 'auth',
})

export const signInWithApple = async (): Promise<{ data: any; error: AuthError | null }> => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo,
        skipBrowserRedirect: Platform.OS !== 'web',
      },
    })

    if (error) throw error
    
    if (Platform.OS !== 'web') {
      const url = data?.url
      if (url) {
        const result = await WebBrowser.openAuthSessionAsync(url, redirectTo)
        if (result.type === 'success') {
          const { url: responseUrl } = result
          const parsedUrl = new URL(responseUrl)
          const accessToken = parsedUrl.searchParams.get('access_token')
          const refreshToken = parsedUrl.searchParams.get('refresh_token')
          
          if (accessToken && refreshToken) {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })
          }
        }
      }
    }
    
    return { data, error: null }
  } catch (error: any) {
    return { 
      data: null, 
      error: { 
        message: error.message || 'Failed to sign in with Apple',
        status: error.status 
      } 
    }
  }
}

export const signInWithGoogle = async (): Promise<{ data: any; error: AuthError | null }> => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: Platform.OS === 'web' ? `${window.location.origin}/auth` : redirectTo,
        skipBrowserRedirect: false,
      },
    })

    if (error) throw error
    
    // For web, the redirect will handle the auth
    // For mobile, handle the response
    if (Platform.OS !== 'web') {
      const url = data?.url
      if (url) {
        const result = await WebBrowser.openAuthSessionAsync(url, redirectTo)
        if (result.type === 'success') {
          const { url: responseUrl } = result
          const parsedUrl = new URL(responseUrl)
          const accessToken = parsedUrl.searchParams.get('access_token')
          const refreshToken = parsedUrl.searchParams.get('refresh_token')
          
          if (accessToken && refreshToken) {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })
          }
        }
      }
    }
    
    return { data, error: null }
  } catch (error: any) {
    return { 
      data: null, 
      error: { 
        message: error.message || 'Failed to sign in with Google',
        status: error.status 
      } 
    }
  }
}

export const signOut = async (): Promise<{ error: AuthError | null }> => {
  try {
    const { error } = await supabase.auth.signOut()
    return { error: error ? { message: error.message } : null }
  } catch (error: any) {
    return { 
      error: { 
        message: error.message || 'Failed to sign out',
        status: error.status 
      } 
    }
  }
}