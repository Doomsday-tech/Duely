import React from 'react';
import { ExpiryStatus } from '../api/types';

interface StatusBadgeProps {
  status: ExpiryStatus | string;
  humanRemaining?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  humanRemaining,
  size = 'md',
}) => {
  const normStatus = status?.toUpperCase() || 'ACTIVE';

  let dotColor = 'bg-[#78716C]';
  let textColor = 'text-[#57534E]';
  let defaultLabel = 'Active';

  switch (normStatus) {
    case 'OVERDUE':
    case 'EXPIRED':
      dotColor = 'bg-[#A8382B]';
      textColor = 'text-[#A8382B] font-medium';
      defaultLabel = humanRemaining || 'Overdue';
      break;

    case 'URGENT':
      dotColor = 'bg-[#B45309]';
      textColor = 'text-[#B45309] font-medium';
      defaultLabel = humanRemaining ? `Expires in ${humanRemaining}` : 'Urgent';
      break;

    case 'DUE_SOON':
      dotColor = 'bg-[#854D0E]';
      textColor = 'text-[#854D0E] font-medium';
      defaultLabel = humanRemaining ? `Expires in ${humanRemaining}` : 'Due soon';
      break;

    case 'RENEWED':
      dotColor = 'bg-[#2D5A43]';
      textColor = 'text-[#2D5A43] font-medium';
      defaultLabel = humanRemaining || 'Renewed';
      break;

    case 'ACTIVE':
    default:
      dotColor = 'bg-[#A8A29E]';
      textColor = 'text-[#57534E]';
      defaultLabel = humanRemaining || 'Active';
      break;
  }

  const isSmall = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 select-none ${
        isSmall ? 'text-xs' : 'text-[13px]'
      } ${textColor}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
      <span>{defaultLabel}</span>
    </span>
  );
};
