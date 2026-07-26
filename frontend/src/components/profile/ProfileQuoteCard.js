import React from 'react';
import { Link } from 'react-router-dom';
import { formatDate, formatCurrency, getQuoteStatusClass, getQuoteStatusLabel } from '../../utils/formatters';

const PROPOSAL_STATUSES = new Set([
  'reviewed',
  'replied',
  'approved',
  'paid',
  'changes_requested',
  'invoiced',
]);

const truncate = (text, max = 140) => {
  if (!text) return '';
  const cleaned = String(text).trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max).trim()}…`;
};

const quoteAmount = (quote) => quote?.total_price ?? quote?.estimated_amount ?? null;

const isProposalReady = (quote) => {
  const status = (quote?.status || '').toLowerCase();
  return (
    PROPOSAL_STATUSES.has(status)
    || Boolean(quote?.scope?.trim())
    || Boolean(quote?.admin_response?.trim())
    || quoteAmount(quote) != null
  );
};

const ProfileQuoteCard = ({ quote, actionLoading, onApprove, onDecline }) => {
  const status = (quote?.status || '').toLowerCase();
  const title = quote?.title || quote?.project_title || 'Quote request';
  const amount = quoteAmount(quote);
  const proposalReady = isProposalReady(quote);
  const canReview = status === 'reviewed' || status === 'replied';
  const canPay = status === 'approved';
  const isClosed = status === 'paid' || status === 'invoiced';
  const isDeclined = status === 'rejected' || status === 'declined';

  const summaryText = quote?.scope?.trim()
    || (proposalReady ? truncate(quote?.admin_response, 120) : truncate(quote?.description, 120));

  const timeline = quote?.proposal_timeline || quote?.estimated_delivery_time;

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-900/[0.04] transition hover:border-amber-200/70 hover:shadow-md">
      <div className="flex flex-col gap-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/90 to-amber-50/40 px-5 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h3 className="text-lg font-bold tracking-tight text-slate-900">{title}</h3>
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${getQuoteStatusClass(quote?.status)}`}
            >
              {getQuoteStatusLabel(quote?.status)}
            </span>
          </div>
          <p className="mt-1.5 text-xs font-medium text-slate-500">
            Submitted {formatDate(quote?.created_at)}
            {quote?.responded_at && proposalReady ? ` · Proposal ${formatDate(quote.responded_at)}` : ''}
          </p>
        </div>
        {amount != null && (
          <div className="sm:text-right shrink-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Proposed total</p>
            <p className="text-xl font-bold tabular-nums text-teal-950">{formatCurrency(amount)}</p>
          </div>
        )}
      </div>

      <div className="space-y-4 px-5 py-5 sm:px-6">
        {proposalReady ? (
          <dl className="grid gap-3 sm:grid-cols-2">
            {summaryText && (
              <div className="sm:col-span-2 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
                <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Scope summary</dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-slate-700 line-clamp-2">{summaryText}</dd>
              </div>
            )}
            {timeline && (
              <div className="rounded-xl border border-slate-100 bg-white px-4 py-3">
                <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Timeline</dt>
                <dd className="mt-1 text-sm font-medium text-slate-800">{timeline}</dd>
              </div>
            )}
            {quote?.deliverables?.trim() && (
              <div className="rounded-xl border border-slate-100 bg-white px-4 py-3">
                <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Deliverables</dt>
                <dd className="mt-1 text-sm text-slate-700 line-clamp-2 whitespace-pre-line">{quote.deliverables}</dd>
              </div>
            )}
          </dl>
        ) : (
          <div className="rounded-xl border border-amber-100 bg-amber-50/50 px-4 py-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800">Your brief</p>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-700 line-clamp-3">
              {truncate(quote?.description, 220) || 'No project description provided.'}
            </p>
            <p className="mt-3 text-xs font-medium text-amber-900/80">
              Our team is reviewing your request. You&apos;ll receive a formal proposal here when it&apos;s ready.
            </p>
          </div>
        )}

        {status === 'changes_requested' && quote?.client_response?.trim() && (
          <div className="rounded-xl border border-sky-100 bg-sky-50/60 px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-sky-800">Your change request</p>
            <p className="mt-1.5 text-sm text-slate-700 line-clamp-2">{quote.client_response}</p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          {(canReview || isClosed || status === 'changes_requested' || (proposalReady && !isDeclined)) && (
            <Link
              to={`/proposal/${quote.id}`}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-500"
            >
              {isClosed ? 'View proposal' : 'Review proposal'}
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}

          {canReview && (
            <>
              <button
                type="button"
                onClick={() => onApprove?.(quote.id)}
                disabled={actionLoading === quote.id}
                className="inline-flex items-center justify-center rounded-xl border border-teal-200 bg-white px-4 py-2.5 text-sm font-semibold text-teal-800 shadow-sm transition hover:bg-teal-50 disabled:opacity-50"
              >
                {actionLoading === quote.id ? 'Working…' : 'Quick approve'}
              </button>
              <button
                type="button"
                onClick={() => onDecline?.(quote.id)}
                disabled={actionLoading === quote.id}
                className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-50 disabled:opacity-50"
              >
                Decline
              </button>
            </>
          )}

          {canPay && (
            <Link
              to={`/payment/${quote.id}`}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:from-amber-400 hover:to-amber-500"
            >
              Accept &amp; pay
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </Link>
          )}

          {isClosed && (
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Payment complete
            </span>
          )}

          {isDeclined && (
            <span className="text-xs font-medium text-slate-500">This proposal was declined.</span>
          )}
        </div>
      </div>
    </article>
  );
};

export default ProfileQuoteCard;
