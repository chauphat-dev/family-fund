import React from 'react';
import { cn } from './Card';

const variants = {
  // Transfer request & Task common
  0: { label: 'Pending', classes: 'bg-accent-amber/20 text-accent-amber border-accent-amber/30' },
  // Task submitted
  1: { label: 'Submitted', classes: 'bg-accent-blue/20 text-accent-blue border-accent-blue/30' },
  // Task/Transfer Approved
  2: { label: 'Approved', classes: 'bg-accent-emerald/20 text-accent-emerald border-accent-emerald/30' },
  // Task/Transfer Rejected
  3: { label: 'Rejected', classes: 'bg-accent-rose/20 text-accent-rose border-accent-rose/30' },
};

// Map Transfer Request status to variant keys (since 1 is approved, 2 is rejected)
const getVariantKey = (type, status) => {
  if (type === 'transfer' && status === 1) return 2; // Approved
  if (type === 'transfer' && status === 2) return 3; // Rejected
  return status;
};

const StatusBadge = ({ status, type = 'task', className }) => {
  const key = getVariantKey(type, status);
  const variant = variants[key] || variants[0];

  return (
    <span className={cn(
      "px-2.5 py-1 text-xs font-semibold rounded-full border",
      variant.classes,
      className
    )}>
      {variant.label}
    </span>
  );
};

export default StatusBadge;
