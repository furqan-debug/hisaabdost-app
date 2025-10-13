
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

console.log('🚀 Starting React application...');

// Register Service Worker for offline functionality
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      console.log('🔧 Registering Service Worker...');
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker registered successfully:', registration);
      
      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          console.log('🔄 New Service Worker version found');
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('⭐ New Service Worker installed and ready');
            }
          });
        }
      });
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
    }
  });
} else if ('serviceWorker' in navigator) {
  console.info('ℹ️ Skipping Service Worker registration in development');
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error('❌ Root element not found');
  throw new Error('Failed to find the root element');
}

console.log('✅ Root element found, creating React root...');

try {
  const root = createRoot(rootElement);
  
  root.render(<App />);
  
  console.log('✅ App rendered successfully');
} catch (error) {
  console.error('❌ Error rendering app:', error);
  throw error;
}
