import { LucideIcon } from 'lucide-react';

export interface TourStep {
  id: string;
  targetId: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  icon?: LucideIcon;
}

export interface TourState {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
}

export interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}
