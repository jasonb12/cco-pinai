import React from 'react';
import { Platform } from 'react-native';
import { motion } from 'framer-motion';
import { Card, CardProps } from 'tamagui';
import { zoomVariants, cardHoverVariants } from '../utils/animations';

interface AnimatedCardProps extends CardProps {
  children: React.ReactNode;
  enableHover?: boolean;
  enableZoom?: boolean;
  onPress?: () => void;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({ 
  children, 
  enableHover = true,
  enableZoom = true,
  onPress,
  ...cardProps 
}) => {
  const variants = enableHover ? cardHoverVariants : zoomVariants;
  
  // On web, use full Framer Motion functionality
  if (Platform.OS === 'web') {
    return (
      <motion.div
        initial="initial"
        whileHover={enableHover || enableZoom ? "hover" : undefined}
        whileTap={onPress ? "tap" : undefined}
        variants={variants}
        onClick={onPress}
        style={{ 
          cursor: onPress ? 'pointer' : 'default',
          display: 'flex',
          width: '100%'
        }}
      >
        <Card
          {...cardProps}
          style={{
            width: '100%',
            ...cardProps.style
          }}
        >
          {children}
        </Card>
      </motion.div>
    );
  }

  // On mobile, use Tamagui's built-in animations
  return (
    <Card
      {...cardProps}
      animation="bouncy"
      pressStyle={{ scale: 0.95 }}
      hoverStyle={{ scale: 1.02 }}
      onPress={onPress}
      style={{
        width: '100%',
        ...cardProps.style
      }}
    >
      {children}
    </Card>
  );
};

export default AnimatedCard;