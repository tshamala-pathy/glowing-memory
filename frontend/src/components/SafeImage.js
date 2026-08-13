import React, { useEffect, useState } from 'react';
import { SITE_IMAGES } from '../constants/siteImages';

/**
 * Image that falls back to a local asset when the primary src fails to load.
 */
const SafeImage = ({ src, fallback = SITE_IMAGES.fallback, alt = '', ...props }) => {
  const [current, setCurrent] = useState(src || fallback);

  useEffect(() => {
    setCurrent(src || fallback);
  }, [src, fallback]);

  return (
    <img
      {...props}
      src={current}
      alt={alt}
      onError={() => {
        if (current !== fallback) {
          setCurrent(fallback);
        }
      }}
    />
  );
};

export default SafeImage;
