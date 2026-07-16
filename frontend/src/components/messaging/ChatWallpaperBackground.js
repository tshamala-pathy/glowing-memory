import React from 'react';

/**
 * Full-bleed chat wallpaper layer (custom photo or tiled preset).
 * Sits behind the message list; bubbles provide text contrast.
 */
const ChatWallpaperBackground = ({ wallpaper }) => {
  if (wallpaper.mode === 'image') {
    return (
      <img
        src={wallpaper.imageUrl}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
        loading="lazy"
        aria-hidden
      />
    );
  }

  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage: wallpaper.backgroundImage,
        backgroundSize: wallpaper.backgroundSize,
        backgroundRepeat: wallpaper.backgroundRepeat,
        backgroundPosition: wallpaper.backgroundPosition,
      }}
      aria-hidden
    />
  );
};

export default ChatWallpaperBackground;
