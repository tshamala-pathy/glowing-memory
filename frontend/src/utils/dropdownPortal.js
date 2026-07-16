import { useCallback, useEffect, useState } from 'react';

/**
 * Fixed-position rect for a dropdown anchored to a button/input (escapes overflow clipping).
 */
export function getDropdownRect(anchorEl, { minWidth = 280, maxWidth = 448, align = 'left', zIndex = 9999 } = {}) {
  if (!anchorEl) return null;
  const rect = anchorEl.getBoundingClientRect();
  const width = Math.min(Math.max(rect.width, minWidth), maxWidth, window.innerWidth - 16);
  let left = align === 'right' ? rect.right - width : rect.left;
  left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
  return {
    position: 'fixed',
    top: rect.bottom + 8,
    left,
    width,
    zIndex,
  };
}

export function useDropdownPosition(anchorRef, isOpen, options = {}) {
  const [style, setStyle] = useState(null);

  const update = useCallback(() => {
    if (!isOpen || !anchorRef.current) {
      setStyle(null);
      return;
    }
    setStyle(getDropdownRect(anchorRef.current, options));
  }, [anchorRef, isOpen, options.align, options.minWidth, options.maxWidth, options.zIndex]);

  useEffect(() => {
    update();
    if (!isOpen) return undefined;
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [isOpen, update]);

  return style;
}
