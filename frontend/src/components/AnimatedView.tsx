import React from 'react';
import { View, Platform } from 'react-native';
import { motion, AnimatePresence } from 'framer-motion';
import { YStack } from 'tamagui';

interface AnimatedViewProps {
  children: React.ReactNode;
  variants?: any;
  initial?: any;
  animate?: any;
  exit?: any;
  whileHover?: any;
  whileTap?: any;
  style?: any;
  className?: string;
}

// Cross-platform animated view component
export const AnimatedView: React.FC<AnimatedViewProps> = ({ 
  children, 
  variants,
  initial,
  animate,
  exit,
  whileHover,
  whileTap,
  style,
  className,
  ...props 
}) => {
  // On web, use motion.div for full functionality
  if (Platform.OS === 'web') {
    return (
      <motion.div
        variants={variants}
        initial={initial}
        animate={animate}
        exit={exit}
        whileHover={whileHover}
        whileTap={whileTap}
        style={style}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    );
  }

  // On mobile, use Tamagui's YStack with basic animations
  return (
    <YStack
      animation="bouncy"
      scale={whileTap ? 0.95 : 1}
      opacity={initial?.opacity || 1}
      style={style}
      {...props}
    >
      {children}
    </YStack>
  );
};

export default AnimatedView;