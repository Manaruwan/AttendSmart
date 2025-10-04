#!/usr/bin/env node

import { build } from 'vite';
import { resolve } from 'path';

const analyze = async () => {
  try {
    console.log('🔍 Analyzing bundle size...');
    
    await build({
      mode: 'production',
      build: {
        rollupOptions: {
          output: {
            manualChunks: (id) => {
              if (id.includes('node_modules')) {
                if (id.includes('react')) return 'react';
                if (id.includes('firebase')) return 'firebase';
                if (id.includes('face-api')) return 'face-api';
                if (id.includes('recharts')) return 'charts';
                return 'vendor';
              }
            }
          }
        },
        reportCompressedSize: true,
        chunkSizeWarningLimit: 1000
      }
    });
    
    console.log('✅ Bundle analysis complete!');
  } catch (error) {
    console.error('❌ Bundle analysis failed:', error);
    process.exit(1);
  }
};

analyze();