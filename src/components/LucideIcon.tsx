import React from 'react';
import * as Icons from 'lucide-react';

interface LucideIconProps {
  name: string;
  className?: string;
  size?: number;
}

export default function LucideIcon({ name, className = '', size = 20 }: LucideIconProps) {
  // Map string names to official Lucide component names
  const IconComponent = (Icons as any)[name] || Icons.Scissors;

  return <IconComponent className={className} size={size} />;
}
