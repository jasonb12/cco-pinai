import { authService } from './authService';

// Re-export the OAuth methods from authService to maintain compatibility
export const signInWithApple = () => authService.signInWithApple();
export const signInWithGoogle = () => authService.signInWithGoogle();
export const signOut = () => authService.signOut();