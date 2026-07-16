/**
 * Proposal Detail — Full proposal view for client review.
 *
 * Route: /proposal/:id
 * - Fetches proposal via GET /api/quotes/{id}/proposal/
 * - Displays: Project Title, Scope, Deliverables, Timeline, Price, Notes
 * - Buttons: Accept & Pay, Request Changes, Reject
 * - Accept & Pay: calls approve endpoint → redirects to /payment/:id
 * - Request Changes: modal with client_response → POST request-changes
 * - Reject: POST reject endpoint
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { formatCurrency } from '../utils/formatters';
import { getQuoteStatusClass } from '../utils/formatters';

const ProposalDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [showRequestChangesModal, setShowRequestChangesModal] = useState(false);
  const [clientResponse, setClientResponse] = useState('');

  useEffect(() => {
    if (!isAuthenticated || !id) {
      setLoading(false);
      return;
    }
    const fetchProposal = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get(`/quotes/${id}/proposal/`);
        setProposal(data);
      } catch (err) {
        const msg = err.response?.data?.detail || err.response?.status === 404
          ? 'Proposal not found or you do not have access.'
          : 'Failed to load proposal. Please try again.';
        setError(msg);
        setProposal(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProposal();
  }, [isAuthenticated, id]);

  const canAct = (p) => {
    const s = (p?.status || '').toLowerCase();
    return s === 'reviewed' || s === 'replied';
  };

  const handleAcceptAndPay = async () => {
    if (!id || actionLoading) return;
    setActionLoading('approve');
    setError('');
    try {
      await api.post(`/quotes/${id}/approve/`);
      navigate(`/payment/${id}`, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.status?.[0] || err.response?.data?.detail || 'Failed to approve. Please try again.';
      setError(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!id || actionLoading) return;
    if (!window.confirm('Are you sure you want to reject this proposal? This cannot be undone.')) return;
    setActionLoading('reject');
    setError('');
    try {
      await api.post(`/quotes/${id}/reject/`);
      setProposal((prev) => (prev ? { ...prev, status: 'rejected' } : null));
    } catch (err) {
      const msg = err.response?.data?.status?.[0] || err.response?.data?.detail || 'Failed to reject. Please try again.';
      setError(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRequestChanges = async () => {
    if (!id || actionLoading) return;
    setActionLoading('request-changes');
    setError('');
    try {
      await api.post(`/quotes/${id}/request-changes/`, {
        client_response: clientResponse.trim() || undefined,
      });
      setProposal((prev) => (prev ? { ...prev, status: 'changes_requested', client_response: clientResponse } : null));
      setShowRequestChangesModal(false);
      setClientResponse('');
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.detail || 'Failed to submit. Please try again.';
      setError(msg);
    } finally {
      setActionLoading(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--aws-content-bg)] flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white border border-[var(--aws-card-border)] p-8 text-center">
          <h1 className="text-xl font-bold text-[var(--aws-dark)] mb-2">Sign in required</h1>
          <p className="text-[#545b64] mb-6">Please log in to view this proposal.</p>
          <Link to="/login" className="inline-block px-6 py-3 bg-[var(--aws-orange)] text-white font-medium hover:bg-[var(--aws-orange-hover)] transition-colors">
            Log in
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--aws-content-bg)] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-10 h-10 border-2 border-[var(--aws-orange)] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-[#545b64]">Loading proposal...</p>
        </div>
      </div>
    );
  }

  if (error && !proposal) {
    return (
      <div className="min-h-screen bg-[var(--aws-content-bg)] flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white border border-[var(--aws-card-border)] p-8 text-center">
          <div className="w-12 h-12 rounded bg-[#fff4e5] text-[var(--aws-orange)] flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h1 className="text-xl font-bold text-[var(--aws-dark)] mb-2">Unable to load proposal</h1>
          <p className="text-[#545b64] mb-6">{error}</p>
          <Link to="/profile" className="inline-block px-6 py-3 bg-[var(--aws-orange)] text-white font-medium hover:bg-[var(--aws-orange-hover)]">
            Back to Profile
          </Link>
        </div>
      </div>
    );
  }

  const amount = proposal?.estimated_amount ?? proposal?.total_price;
  const hasActions = canAct(proposal);

  return (
    <div className="min-h-screen bg-[var(--aws-content-bg)]">
      <div className="bg-white border-b border-[var(--aws-card-border)] px-4 sm:px-6 py-4">
        <nav className="flex items-center gap-2 text-sm text-[#545b64] mb-2">
          <Link to="/" className="hover:text-[var(--aws-orange)]">Home</Link>
          <span aria-hidden>/</span>
          <Link to="/profile" className="hover:text-[var(--aws-orange)]">Profile</Link>
          <span aria-hidden>/</span>
          <span className="text-[var(--aws-dark)] font-medium">Proposal</span>
        </nav>
        <h1 className="text-2xl font-bold text-[var(--aws-dark)]">Proposal</h1>
        <p className="text-sm text-[#545b64] mt-1">Review the proposal details below.</p>
      </div>

      <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
        {error && (
          <div className="mb-6 p-4 bg-[#fff4e5] border border-[#ffb366] text-[var(--aws-dark)] flex items-center gap-3">
            <svg className="w-5 h-5 text-[var(--aws-orange)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {error}
          </div>
        )}

        <div className="bg-white border border-[var(--aws-card-border)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--aws-card-border)] bg-[#fafafa] flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-[var(--aws-dark)]">
              {proposal?.project_title || proposal?.title || 'Proposal'}
            </h2>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getQuoteStatusClass(proposal?.status)}`}>
              {proposal?.status === 'replied' ? 'Ready for review' : proposal?.status || '—'}
            </span>
          </div>

          <div className="p-6 space-y-6">
            {proposal?.scope && (
              <section>
                <h3 className="text-sm font-semibold text-[#64748b] uppercase tracking-wider mb-2">Scope</h3>
                <p className="text-[var(--aws-dark)] whitespace-pre-wrap">{proposal.scope}</p>
              </section>
            )}

            {proposal?.deliverables && (
              <section>
                <h3 className="text-sm font-semibold text-[#64748b] uppercase tracking-wider mb-2">Deliverables</h3>
                <p className="text-[var(--aws-dark)] whitespace-pre-wrap">{proposal.deliverables}</p>
              </section>
            )}

            {(proposal?.proposal_timeline || proposal?.estimated_delivery_time) && (
              <section>
                <h3 className="text-sm font-semibold text-[#64748b] uppercase tracking-wider mb-2">Timeline</h3>
                <p className="text-[var(--aws-dark)]">{proposal.proposal_timeline || proposal.estimated_delivery_time}</p>
              </section>
            )}

            {(amount != null || proposal?.item_breakdown?.length > 0) && (
              <section>
                <h3 className="text-sm font-semibold text-[#64748b] uppercase tracking-wider mb-2">Price</h3>
                {Array.isArray(proposal?.item_breakdown) && proposal.item_breakdown.length > 0 ? (
                  <ul className="space-y-1 mb-2">
                    {proposal.item_breakdown.map((item, idx) => (
                      <li key={idx} className="flex justify-between text-sm">
                        <span className="text-[var(--aws-dark)]">{item.description}</span>
                        {item.amount != null && <span>{formatCurrency(item.amount)}</span>}
                      </li>
                    ))}
                  </ul>
                ) : null}
                <p className="text-xl font-semibold text-[var(--aws-dark)]">{formatCurrency(amount)}</p>
              </section>
            )}

            {proposal?.admin_response && (
              <section>
                <h3 className="text-sm font-semibold text-[#64748b] uppercase tracking-wider mb-2">Notes</h3>
                <p className="text-[var(--aws-dark)] whitespace-pre-wrap">{proposal.admin_response}</p>
              </section>
            )}

            {proposal?.terms && (
              <section>
                <h3 className="text-sm font-semibold text-[#64748b] uppercase tracking-wider mb-2">Terms</h3>
                <p className="text-[var(--aws-dark)] whitespace-pre-wrap text-sm">{proposal.terms}</p>
              </section>
            )}
          </div>

          {hasActions && (
            <div className="px-6 py-4 border-t border-[var(--aws-card-border)] bg-[#fafafa] flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleAcceptAndPay}
                disabled={!!actionLoading}
                className="px-5 py-2.5 bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {actionLoading === 'approve' ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>Accept & Pay</>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowRequestChangesModal(true)}
                disabled={!!actionLoading}
                className="px-5 py-2.5 bg-amber-600 text-white font-semibold hover:bg-amber-700 disabled:opacity-50 transition-colors"
              >
                Request Changes
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={!!actionLoading}
                className="px-5 py-2.5 bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {actionLoading === 'reject' ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          )}

          {(proposal?.status === 'approved' || proposal?.status === 'Approved') && (
            <div className="px-6 py-4 border-t border-[var(--aws-card-border)] bg-[#fafafa]">
              <Link
                to={`/payment/${id}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--aws-orange)] text-white font-semibold hover:bg-[var(--aws-orange-hover)] transition-colors"
              >
                Pay now
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </Link>
            </div>
          )}
        </div>

        <p className="mt-6 text-center">
          <Link to="/profile" className="text-sm font-medium text-[var(--aws-orange)] hover:underline">← Back to Profile</Link>
        </p>
      </div>

      {/* Request Changes Modal */}
      {showRequestChangesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white border border-[var(--aws-card-border)] w-full max-w-md rounded-lg shadow-xl">
            <div className="px-6 py-4 border-b border-[var(--aws-card-border)]">
              <h3 className="text-lg font-semibold text-[var(--aws-dark)]">Request Changes</h3>
              <p className="text-sm text-[#545b64] mt-1">Describe what you would like changed. The team will review and update the proposal.</p>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-[var(--aws-dark)] mb-2">Your feedback</label>
              <textarea
                value={clientResponse}
                onChange={(e) => setClientResponse(e.target.value)}
                rows={4}
                placeholder="e.g., I need a shorter timeline, or I'd like to add feature X..."
                className="w-full px-4 py-3 border border-[var(--aws-card-border)] rounded-lg focus:ring-2 focus:ring-[var(--aws-orange)] focus:border-transparent resize-none"
              />
            </div>
            <div className="px-6 py-4 border-t border-[var(--aws-card-border)] flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setShowRequestChangesModal(false); setClientResponse(''); setError(''); }}
                className="px-4 py-2 border border-[var(--aws-card-border)] text-[var(--aws-dark)] font-medium hover:bg-[#f8fafc]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRequestChanges}
                disabled={actionLoading === 'request-changes'}
                className="px-4 py-2 bg-amber-600 text-white font-semibold hover:bg-amber-700 disabled:opacity-50"
              >
                {actionLoading === 'request-changes' ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProposalDetail;
