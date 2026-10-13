'use client';

import React from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useTheme } from '@/context/ThemeContext';

export function ToastProvider() {
  const { theme } = useTheme();

  return (
    <ToastContainer
      position="top-right"
      autoClose={3500}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme={theme}
      toastClassName="font-sans text-xs sm:text-sm shadow-lg rounded-xl border border-border"
    />
  );
}
