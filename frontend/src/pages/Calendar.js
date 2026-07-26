import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { formatDate, formatDateTime } from '../utils/formatters';
import ClientWorkspaceLayout from '../components/client/ClientWorkspaceLayout';

const TYPE_COLORS = {
  deadline: 'border-l-red-500 bg-red-50/30',
  meeting: 'border-l-blue-500 bg-blue-50/30',
  reminder: 'border-l-amber-500 bg-amber-50/30',
};

const TYPE_LABELS = {
  deadline: 'Deadline',
  meeting: 'Meeting',
  reminder: 'Reminder',
};

const Calendar = () => {
  const { isAuthenticated } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/calendar/');
      setEvents(Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : []);
    } catch {
      setEvents([]);
      setError('We couldn\'t load your calendar. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) load();
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  const grouped = events.reduce((acc, ev) => {
    const day = formatDate(ev.start_at);
    if (!acc[day]) acc[day] = [];
    acc[day].push(ev);
    return acc;
  }, {});

  return (
    <ClientWorkspaceLayout
      title="Calendar"
      description="Deadlines, meetings, and reminders in a clear timeline view."
      actions={
        !loading && events.length > 0 ? (
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {events.length} upcoming
          </span>
        ) : null
      }
    >
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center text-slate-500 shadow-sm">
          Loading events…
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center shadow-sm">
          <p className="text-slate-600">{error}</p>
          <button type="button" onClick={load} className="mt-4 text-sm font-semibold text-slate-900 hover:underline">
            Try again
          </button>
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center shadow-sm">
          <div className="mx-auto w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="font-semibold text-slate-900">No upcoming events</p>
          <p className="text-sm text-slate-500 mt-1">Meetings and deadlines will show up here.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([day, dayEvents]) => (
            <section key={day}>
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-[0.15em] mb-3">{day}</h2>
              <ul className="space-y-2 border-l-2 border-slate-200 ml-2 pl-4">
                {dayEvents.map((ev) => (
                  <li
                    key={ev.id}
                    className={`bg-white rounded-xl border border-slate-200 border-l-4 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow ${
                      TYPE_COLORS[ev.event_type] || 'border-l-slate-400'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="font-semibold text-slate-900">{ev.title}</p>
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        {TYPE_LABELS[ev.event_type] || ev.event_type}
                      </span>
                    </div>
                    {ev.project_name && (
                      <p className="text-xs text-slate-500 mt-1">{ev.project_name}</p>
                    )}
                    {!ev.all_day && (
                      <p className="text-xs text-slate-400 mt-1">{formatDateTime(ev.start_at)}</p>
                    )}
                    {ev.description && (
                      <p className="text-sm text-slate-600 mt-2 leading-relaxed">{ev.description}</p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </ClientWorkspaceLayout>
  );
};

export default Calendar;
