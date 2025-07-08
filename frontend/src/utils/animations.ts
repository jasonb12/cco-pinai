import { Variants } from 'framer-motion';

// Smooth zoom animation variants
export const zoomVariants: Variants = {
  initial: { scale: 1 },
  hover: { 
    scale: 1.05,
    transition: { 
      type: "spring", 
      stiffness: 400, 
      damping: 17 
    }
  },
  tap: { 
    scale: 0.95,
    transition: { 
      type: "spring", 
      stiffness: 400, 
      damping: 17 
    }
  }
};

// Shared element-like transition variants
export const pageTransitionVariants: Variants = {
  initial: { 
    opacity: 0, 
    scale: 0.8,
    y: 20
  },
  animate: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1]
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.8,
    y: -20,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 0.2, 1]
    }
  }
};

// Card hover animation variants
export const cardHoverVariants: Variants = {
  initial: { 
    scale: 1,
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
  },
  hover: { 
    scale: 1.02,
    boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
    transition: { 
      type: "spring", 
      stiffness: 300, 
      damping: 20 
    }
  }
};

// Staggered list animation variants
export const listVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const listItemVariants: Variants = {
  initial: { 
    opacity: 0, 
    y: 20,
    scale: 0.9
  },
  animate: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  }
};

// Button press animation variants
export const buttonVariants: Variants = {
  initial: { scale: 1 },
  hover: { 
    scale: 1.05,
    transition: { 
      type: "spring", 
      stiffness: 400, 
      damping: 17 
    }
  },
  tap: { 
    scale: 0.95,
    transition: { 
      type: "spring", 
      stiffness: 600, 
      damping: 20 
    }
  }
};

// Modal/drawer animation variants
export const modalVariants: Variants = {
  initial: { 
    opacity: 0,
    scale: 0.8,
    y: 100
  },
  animate: { 
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  },
  exit: { 
    opacity: 0,
    scale: 0.8,
    y: 100,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 0.2, 1]
    }
  }
};

// Floating action button variants
export const fabVariants: Variants = {
  initial: { 
    scale: 1,
    rotate: 0
  },
  hover: { 
    scale: 1.1,
    rotate: 90,
    transition: { 
      type: "spring", 
      stiffness: 400, 
      damping: 17 
    }
  },
  tap: { 
    scale: 0.9,
    transition: { 
      type: "spring", 
      stiffness: 600, 
      damping: 20 
    }
  }
};

// Notification/toast animation variants
export const notificationVariants: Variants = {
  initial: { 
    opacity: 0,
    y: -50,
    scale: 0.8
  },
  animate: { 
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  },
  exit: { 
    opacity: 0,
    y: -50,
    scale: 0.8,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 0.2, 1]
    }
  }
};