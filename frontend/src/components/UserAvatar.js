import React from 'react';
import { getInitials } from '../utils/userAvatar';

/**
 * Circular avatar — profile photo or initials fallback.
 */
const UserAvatar = ({
  src,
  name,
  email,
  size = 'md',
  className = '',
  ring = false,
}) => {
  const sizes = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-2xl',
  };
  const sizeClass = sizes[size] || sizes.md;
  const ringClass = ring ? 'ring-2 ring-white shadow-sm' : '';

  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={`${sizeClass} rounded-full object-cover shrink-0 ${ringClass} ${className}`.trim()}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full bg-blue-600 flex items-center justify-center font-semibold text-white shrink-0 ${ringClass} ${className}`.trim()}
      aria-hidden
    >
      {getInitials(name, email)}
    </div>
  );
};

export default UserAvatar;
