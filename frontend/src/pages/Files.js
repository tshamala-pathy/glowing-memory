import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { formatRelativeTime } from '../utils/formatters';
import ClientWorkspaceLayout from '../components/client/ClientWorkspaceLayout';

const Files = () => {
  const { isAuthenticated } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');
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
    setUploadSuccess('');
    const form = new FormData();
    form.append('file', file);
    form.append('name', file.name);

    try {
      await api.post('/files/', form);
      await load();
      setUploadSuccess(`"${file.name}" uploaded successfully.`);
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  if (!isAuthenticated) return null;

  const uploadAction = (
    <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold cursor-pointer transition-colors shadow-sm">
      <input ref={inputRef} type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
      </svg>
      {uploading ? 'Uploading…' : 'Upload file'}
    </label>
  );

  return (
    <ClientWorkspaceLayout
      title="Files"
      description="Upload, download, and preview shared project attachments."
      actions={uploadAction}
    >
      {uploadSuccess && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {uploadSuccess}
        </div>
      )}
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center text-slate-500 shadow-sm">
          Loading files…
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center shadow-sm">
          <p className="text-slate-600">{error}</p>
          <button type="button" onClick={load} className="mt-4 text-sm font-semibold text-slate-900 hover:underline">
            Try again
          </button>
        </div>
      ) : files.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center shadow-sm">
          <div className="mx-auto w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="font-semibold text-slate-900">No files yet</p>
          <p className="text-sm text-slate-500 mt-1">Upload a document to share it with the team.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {files.map((f) => (
            <li
              key={f.id}
              className="flex items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 hover:shadow-md transition-shadow shadow-sm"
            >
              <div className="min-w-0 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{f.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {formatRelativeTime(f.uploaded_at)} · {f.uploaded_by_name || 'You'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                {f.previewable && f.file_url && (
                  <a
                    href={f.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Preview
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => handleDownload(f.id, f.name)}
                  className="px-3 py-1.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Download
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </ClientWorkspaceLayout>
  );
};

export default Files;
