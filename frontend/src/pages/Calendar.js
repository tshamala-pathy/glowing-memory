import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { formatDate, formatDateTime } from '../utils/formatters';

const TYPE_COLORS = {
  deadline: 'border-l-red-500',
  meeting: 'border-l-blue-500',
  reminder: 'border-l-amber-500',
};

const Calendar = () => {
  const { isAuthenticated } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      try {
        const { data } = await api.get('/calendar/');
        setEvents(data?.results ?? data ?? []);
      } catch {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  const grouped = events.reduce((acc, ev) => {
    const day = formatDate(ev.start_at);
    if (!acc[day]) acc[day] = [];
    acc[day].push(ev);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900">Calendar</h1>
        <p className="text-slate-600 text-sm mt-1 mb-8">Deadlines, meetings, and reminders in timeline view.</p>
        {loading ? (
          <p className="text-center py-16 text-slate-500">Loading events…</p>
        ) : events.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200 text-slate-500">No upcoming events</div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([day, dayEvents]) => (
              <div key={day}>
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">{day}</h2>
                <ul className="space-y-2 border-l-2 border-slate-200 ml-2 pl-4">
                  {dayEvents.map((ev) => (
                    <li
                      key={ev.id}
                      className={`bg-white rounded-lg border border-slate-200 border-l-4 p-4 shadow-sm hover:shadow-md transition-shadow ${TYPE_COLORS[ev.event_type] || 'border-l-slate-400'}`}
                    >
                      <p className="font-semibold text-slate-900">{ev.title}</p>
                      <p className="text-xs text-slate-500 mt-1 capitalize">{ev.event_type}{ev.project_name ? ` · ${ev.project_name}` : ''}</p>
                      {!ev.all_day && <p className="text-xs text-slate-400 mt-1">{formatDateTime(ev.start_at)}</p>}
                      {ev.description && <p className="text-sm text-slate-600 mt-2">{ev.description}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Calendar;
