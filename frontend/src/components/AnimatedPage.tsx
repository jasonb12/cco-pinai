import React from 'react';
import { Platform } from 'react-native';
import { motion, AnimatePresence } from 'framer-motion';
import { YStack } from 'tamagui';
import { pageTransitionVariants } from '../utils/animations';

interface AnimatedPageProps {
  children: React.ReactNode;
  isVisible?: boolean;
  className?: string;
}

export const AnimatedPage: React.FC<AnimatedPageProps> = ({ 
  children, 
  isVisible = true,
  className 
}) => {
  // On web, use full Framer Motion animations
  if (Platform.OS === 'web') {
    return (
      <AnimatePresence mode="wait">
        {isVisible && (
          <motion.div
            key="page"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageTransitionVariants}
            className={className}
            style={{ 
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <YStack flex={1}>
              {children}
            </YStack>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // On mobile, use Tamagui's built-in animations
  return (
    <YStack 
      flex={1} 
      animation="bouncy"
      enterStyle={{ opacity: 0, scale: 0.9 }}
      exitStyle={{ opacity: 0, scale: 0.9 }}
    >
      {children}
    </YStack>
  );
};

export default AnimatedPage;