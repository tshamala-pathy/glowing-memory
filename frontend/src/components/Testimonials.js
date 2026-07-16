import React, { useState, useEffect } from 'react';
import api, { getMediaUrl } from '../services/api';
import UserAvatar from './UserAvatar';

const StarIcon = ({ filled }) => (
  <svg className={`w-5 h-5 shrink-0 ${filled ? 'text-amber-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const response = await api.get('/testimonials/');
      const data = response.data.results || response.data || [];
      const list = Array.isArray(data) ? data : [];
      setTestimonials(list);
    } catch {
      setTestimonials([]);
    } finally {
      setLoading(false);
    }
  };

  const approved = testimonials.filter((t) => t.is_approved);

  if (loading || approved.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            What Our Clients Say
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Don&apos;t just take our word for it — hear from our satisfied clients.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {approved.slice(0, 6).map((t, i) => (
            <div
              key={t.id}
              className="group bg-white rounded-2xl shadow-lg border border-slate-100 p-6 lg:p-8 hover:shadow-xl hover:border-slate-200 transition-all duration-300"
            >
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon key={star} filled={star <= (t.rating || 0)} />
                ))}
              </div>

              <blockquote className="text-slate-600 leading-relaxed line-clamp-4 mb-6">
                &ldquo;{t.testimonial}&rdquo;
              </blockquote>

              <div className="flex items-center gap-4">
                <UserAvatar
                  src={getMediaUrl(t.image)}
                  name={t.name}
                  size="lg"
                  ring
                  className="ring-slate-100"
                />
                <div>
                  <div className="font-semibold text-slate-900">{t.name}</div>
                  {(t.position || t.company) && (
                    <div className="text-sm text-slate-500">
                      {[t.position, t.company].filter(Boolean).join(' at ')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
