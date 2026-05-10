'use client';
import { motion } from 'framer-motion';

export default function LoadingState() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, #0a0e27 0%, #1a1d3a 100%)'
    }}>
      <motion.div
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        style={{ 
          color: '#6B9BD1', 
          fontSize: '14px',
          fontWeight: '500',
          letterSpacing: '1px'
        }}
      >
        Loading organizational topology...
      </motion.div>
    </div>
  );
}
