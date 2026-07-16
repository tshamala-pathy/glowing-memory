import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { formatRelativeTime } from '../utils/formatters';

const Files = () => {
  const { isAuthenticated } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/files/');
      setFiles(Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : []);
    } catch {
      setFiles([]);
      setError('We couldn\'t load your files. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) load();
  }, [isAuthenticated]);

  const handleDownload = async (id, name) => {
    try {
      const res = await api.get(`/files/${id}/download/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = name || 'download';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch { /* ignore */ }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const form = new FormData();
    form.append('file', file);
    form.append('name', file.name);

    try {
      await api.post('/files/', form);
      await load();
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Shared Files</h1>
            <p className="text-slate-600 text-sm mt-1">Upload, download, and preview project attachments.</p>
          </div>
          <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-slate-800 text-white rounded-xl font-medium cursor-pointer hover:opacity-90">
            <input ref={inputRef} type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
            {uploading ? 'Uploading…' : 'Upload file'}
          </label>
        </div>
        {loading ? (
          <div className="text-center py-16 text-slate-500">Loading files…</div>
        ) : error ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
            <p className="text-slate-600">{error}</p>
            <button type="button" onClick={load} className="mt-4 text-sm font-semibold text-blue-700 hover:underline">Try again</button>
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200 text-slate-500">No files yet</div>
        ) : (
          <ul className="space-y-3">
            {files.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-4 bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 truncate">{f.name}</p>
                  <p className="text-xs text-slate-500">{formatRelativeTime(f.uploaded_at)} · {f.uploaded_by_name || 'You'}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {f.previewable && f.file_url && (
                    <a href={f.file_url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">Preview</a>
                  )}
                  <button type="button" onClick={() => handleDownload(f.id, f.name)} className="text-sm font-medium text-slate-700 hover:text-blue-700">Download</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Files;
