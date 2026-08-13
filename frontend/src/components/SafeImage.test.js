import { fireEvent, render } from '@testing-library/react';
import SafeImage from './SafeImage';

describe('SafeImage', () => {
  it('renders the primary src', () => {
    const { getByAltText } = render(
      <SafeImage src="/pricing-hero.png" fallback="/blog/hero-reading-learning.jpg" alt="Hero" />
    );
    expect(getByAltText('Hero')).toHaveAttribute('src', '/pricing-hero.png');
  });

  it('falls back when the primary image fails', () => {
    const { getByAltText } = render(
      <SafeImage src="/missing.png" fallback="/blog/hero-reading-learning.jpg" alt="Hero" />
    );
    const img = getByAltText('Hero');
    fireEvent.error(img);
    expect(img).toHaveAttribute('src', '/blog/hero-reading-learning.jpg');
  });

  it('uses fallback when src is empty', () => {
    const { getByAltText } = render(
      <SafeImage src="" fallback="/pathycode-logo.png" alt="Logo" />
    );
    expect(getByAltText('Logo')).toHaveAttribute('src', '/pathycode-logo.png');
  });
});
