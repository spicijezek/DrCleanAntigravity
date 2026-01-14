import React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface ModalOverlayProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalOverlay({ children, className }: ModalOverlayProps) {
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className={cn("fixed inset-x-0 top-16 sm:top-20 bottom-0 z-[10000] bg-black/50 flex items-start justify-center pt-4 sm:pt-8 p-4 overflow-y-auto", className)}>
      {children}
    </div>,
    document.body
  );
}
