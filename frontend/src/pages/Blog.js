import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api, { getMediaUrl } from '../services/api';
import { formatDate } from '../utils/formatters';

const publicUrl = process.env.PUBLIC_URL || '';

/** Served from /public/blog so hero images always load (some Unsplash IDs 404 as hotlinks). */
const IMAGES = {
  /** Wide banner — reading & books */
  heroMain: `${publicUrl}/blog/hero-reading-learning.jpg`,
  /** Side hero — laptop & writing */
  heroSide: `${publicUrl}/blog/hero-writing-desk.jpg`,
  stripA: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=82',
  stripB: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=800&q=82',
  stripC: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=800&q=82',
  empty: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1600&q=85',
  /** End-of-page band — ideas & editorial context */
  footerMore: `${publicUrl}/blog/footer-more-insights.jpg`,
};

/** When a post has no featured image (or load fails) — URLs verified to resolve */
const POST_PLACEHOLDERS = [
  'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=1200&q=82',
  'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=82',
  'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=82',
  'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1200&q=82',
  'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1200&q=82',
  'https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&w=1200&q=82',
];

const placeholderForPost = (postId) => POST_PLACEHOLDERS[Number(postId) % POST_PLACEHOLDERS.length];

const getExcerpt = (body, maxLen = 150) => {
  if (!body || typeof body !== 'string') return '';
  const text = body.replace(/<[^>]*>/g, '').trim();
  return text.length > maxLen ? `${text.substring(0, maxLen).trim()}...` : text;
};

const Blog = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page };
      if (selectedCategory) params.category = selectedCategory;
      if (searchQuery) params.search = searchQuery;
      const response = await api.get('/blog/', { params });
      const postsData = response.data.results || response.data || [];
      setPosts(Array.isArray(postsData) ? postsData : []);
      setHasNext(!!response.data.next);
      setHasPrev(!!response.data.previous);
      if (page === 1 && !selectedCategory && !searchQuery) {
        const unique = [...new Set((response.data.results || response.data || []).map((p) => p.category).filter(Boolean))];
        setCategories(unique);
      }
      setError('');
    } catch (err) {
      if (err?.isNetworkError) {
        setError('Cannot connect to server. Please try again later.');
      } else {
        setError(err.response?.data?.detail || err.message || 'Failed to fetch blog posts.');
      }
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, page, searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div className="space-y-4">
              <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
              <div className="h-12 w-full max-w-md animate-pulse rounded-lg bg-slate-200" />
              <div className="h-20 max-w-lg animate-pulse rounded-lg bg-slate-100" />
            </div>
            <div className="aspect-[4/3] animate-pulse rounded-2xl bg-slate-200" />
          </div>
          <div className="mt-8 grid grid-cols-3 gap-3 sm:gap-4">
            {[1, 2, 3].map((k) => (
              <div key={k} className="aspect-[5/3] animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((k) => (
              <div key={k} className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                <div className="aspect-[4/3] bg-slate-100" />
                <div className="space-y-3 p-5">
                  <div className="h-4 w-1/3 rounded bg-slate-100" />
                  <div className="h-6 rounded bg-slate-100" />
                  <div className="h-14 rounded bg-slate-50" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <svg className="h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="mb-2 text-xl font-bold text-slate-900">Something went wrong</h2>
          <p className="mb-6 text-sm text-slate-600">{error}</p>
          <button
            type="button"
            onClick={fetchPosts}
            className="rounded-xl bg-slate-800 px-6 py-2.5 font-medium text-white transition hover:bg-slate-900"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      {/* Intro: copy + large photos (no dark overlay hero) */}
      <header className="border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">Journal</p>
              <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">Blog &amp; Insights</h1>
              <p className="mt-4 max-w-lg text-lg leading-relaxed text-slate-600">
                Stay updated with our latest insights, tutorials, and industry news.
              </p>
            </div>
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-slate-100 shadow-lg ring-1 ring-slate-200/80">
              <img
                src={IMAGES.heroSide}
                alt="Writing and ideas at a desk"
                className="absolute inset-0 h-full w-full object-cover"
                loading="eager"
                decoding="async"
                width={800}
                height={600}
              />
            </div>
          </div>

          {/* Photo strip — extra context without heavy styling */}
          <div className="mt-10 grid grid-cols-3 gap-3 sm:mt-12 sm:gap-4">
            <img
              src={IMAGES.stripA}
              alt=""
              className="aspect-[5/3] w-full rounded-xl object-cover ring-1 ring-slate-200/80"
              loading="lazy"
              decoding="async"
              aria-hidden
            />
            <img
              src={IMAGES.stripB}
              alt=""
              className="aspect-[5/3] w-full rounded-xl object-cover ring-1 ring-slate-200/80"
              loading="lazy"
              decoding="async"
              aria-hidden
            />
            <img
              src={IMAGES.stripC}
              alt=""
              className="aspect-[5/3] w-full rounded-xl object-cover ring-1 ring-slate-200/80"
              loading="lazy"
              decoding="async"
              aria-hidden
            />
          </div>

          {/* Wide banner image under intro */}
          <div className="mt-8 overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200/80 sm:mt-10">
            <img
              src={IMAGES.heroMain}
              alt="Reading and learning"
              className="block h-48 w-full object-cover object-center sm:h-56 md:h-64"
              loading="eager"
              decoding="async"
              width={1600}
              height={400}
            />
          </div>
        </div>
      </header>

      <div className="border-b border-slate-100 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
          <label htmlFor="blog-search" className="sr-only">
            Search blog posts
          </label>
          <div className="relative max-w-xl">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </span>
            <input
              id="blog-search"
              type="search"
              autoComplete="off"
              placeholder="Search posts by title, body, category, or tags…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2.5 pl-11 pr-10 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            />
            {searchInput ? (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-700"
                aria-label="Clear search"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {categories.length > 0 && (
        <section className="sticky top-16 z-20 border-b border-slate-100 bg-white/95 backdrop-blur-sm">
          <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setSelectedCategory('')}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                  selectedCategory === ''
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All posts
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                    selectedCategory === cat ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {posts.length === 0 ? (
          searchQuery || selectedCategory ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-8 py-12 text-center shadow-sm sm:px-12">
              <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">No posts match your filters</h2>
              <p className="mx-auto mt-3 max-w-md text-slate-600">
                Try different keywords, clear the search box, or pick &quot;All posts&quot; to see everything.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setSelectedCategory('');
                }}
                className="mt-8 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Clear search &amp; filters
              </button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="grid md:grid-cols-2">
                <div className="relative min-h-[240px]">
                  <img
                    src={IMAGES.empty}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                    aria-hidden
                  />
                </div>
                <div className="flex flex-col justify-center p-8 md:p-12">
                  <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">No posts yet</h2>
                  <p className="mt-4 leading-relaxed text-slate-600">
                    We&apos;re preparing new articles and tutorials. Check back soon, or explore the rest of the site in
                    the meantime.
                  </p>
                  <Link
                    to="/"
                    className="mt-8 inline-flex w-fit items-center rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-800"
                  >
                    Back to home
                  </Link>
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => {
              const fallback = placeholderForPost(post.id);
              const imgSrc = post.featured_image ? getMediaUrl(post.featured_image) : fallback;
              return (
                <Link
                  key={post.id}
                  to={`/blog/${post.id}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                    <img
                      src={imgSrc}
                      alt=""
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = fallback;
                      }}
                    />
                    {post.category && (
                      <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-800 shadow-sm">
                        {post.category}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        {formatDate(post.created_at)}
                      </span>
                    </div>
                    <h2 className="mb-2 line-clamp-2 text-lg font-bold text-slate-900 group-hover:underline sm:text-xl">
                      {post.title}
                    </h2>
                    <p className="mb-4 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-600 sm:text-base">
                      {getExcerpt(post.body)}
                    </p>
                    {post.tags && Array.isArray(post.tags) && post.tags.length > 0 && (
                      <div className="mb-4 flex flex-wrap gap-2">
                        {post.tags.slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                            {typeof tag === 'object' ? tag.name || tag : tag}
                          </span>
                        ))}
                        {post.tags.length > 3 && (
                          <span className="rounded-md bg-slate-50 px-2.5 py-1 text-xs text-slate-500">
                            +{post.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                    <span className="mt-auto text-sm font-semibold text-slate-900">
                      Read article →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {(hasNext || hasPrev) && posts.length > 0 && (
          <div className="mt-12 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!hasPrev}
              className="rounded-full border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
            >
              Previous
            </button>
            <span className="text-sm font-medium text-slate-500">Page {page}</span>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasNext}
              className="rounded-full border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
            >
              Next
            </button>
          </div>
        )}
      </section>

      <section className="border-t border-slate-200 bg-slate-50" aria-labelledby="blog-more-heading">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="grid md:grid-cols-2 md:items-stretch">
              <div className="relative min-h-[220px] bg-slate-100 md:min-h-[320px]">
                <img
                  src={IMAGES.footerMore}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                  width={1200}
                  height={800}
                />
              </div>
              <div className="flex flex-col justify-center p-8 sm:p-10 md:p-12">
                <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">About these articles</p>
                <h2 id="blog-more-heading" className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Context behind every post
                </h2>
                <p className="mt-4 leading-relaxed text-slate-600">
                  Here you&apos;ll find how-tos, product notes, and industry perspective in one place. Each piece is meant
                  to be useful on its own—browse by category when you want a theme, or use tags inside an article to
                  follow threads across posts. Open any story for the full write-up, links, and updates as we publish
                  more.
                </p>
                <ul className="mt-6 space-y-2 text-sm text-slate-600">
                  <li className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" aria-hidden />
                    <span>Categories group topics; tags connect ideas across articles.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" aria-hidden />
                    <span>New posts appear here first—check back or reach out if you want something covered.</span>
                  </li>
                </ul>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    to="/newsletter"
                    className="inline-flex items-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Newsletter
                  </Link>
                  <Link
                    to="/contact"
                    className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                  >
                    Contact us
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Blog;
