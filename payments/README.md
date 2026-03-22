# Payments App — PayFast Integration

Handles payment for approved quotes via PayFast (South African payment gateway). Clients enter card details on PayFast's secure hosted page; invoice and project are created automatically after successful payment.

## Features

- **PayFast redirect flow**: Client clicks "Pay now" → redirected to PayFast → enters card details → PayFast processes → redirects back
- **ITN (Instant Transaction Notification)**: Server-to-server callback when payment completes; creates Invoice and Project
- **ITN signature verification**: Optional passphrase verification for production (set `PAYFAST_PASSPHRASE`)
- **Local dev simulate-itn**: When `DEBUG=True` and PayFast cannot reach localhost, success page shows "Complete payment locally" button
- **Success/cancel pages**: Django templates with links to frontend portal; cancel page shows "Try again" when `quote_id` present

## Flow

1. Client on `/payment/:quoteId` clicks "Pay now"
2. `POST /api/payment/quote/:id/start-pay/` creates `Payment` (pending), returns `redirect_url`
3. Frontend redirects to PayFast URL; client enters card details on PayFast
4. PayFast processes; redirects user to `return_url` (success) or `cancel_url` (cancelled)
5. PayFast sends ITN `POST` to `notify_url`; backend creates Invoice, marks quote paid; `clients.signals` creates Project
6. Local dev: User clicks "Complete payment locally" on success page → `simulate_itn` runs same logic

## Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/payments/pay/<quote_id>/` | GET | Start payment (session auth), redirect to PayFast |
| `/payments/notify/` | POST | PayFast ITN callback (must be publicly reachable) |
| `/payments/success/` | GET | User redirect after payment; shows simulate button in DEBUG |
| `/payments/cancel/` | GET | User redirect if cancelled; shows "Try again" when quote_id present |
| `/payments/simulate-itn/` | GET | Local dev only: simulate ITN when notify_url unreachable |

## Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `PAYFAST_MERCHANT_ID` | `10000100` | PayFast merchant ID (sandbox) |
| `PAYFAST_MERCHANT_KEY` | `46f0cd694581a` | PayFast merchant key (sandbox) |
| `PAYFAST_PASSPHRASE` | `""` | Passphrase for ITN signature verification; empty = skip |
| `PAYFAST_RETURN_URL` | `{PROJECT_BASE_URL}/payments/success/` | Where user is redirected after payment |
| `PAYFAST_CANCEL_URL` | `{PROJECT_BASE_URL}/payments/cancel/` | Where user is redirected if cancelled |
| `PAYFAST_NOTIFY_URL` | `{PROJECT_BASE_URL}/payments/notify/` | ITN callback; must be publicly reachable |
| `PAYFAST_SANDBOX_URL` | `https://sandbox.payfast.co.za/eng/process` | PayFast sandbox process URL |
| `PROJECT_BASE_URL` | `http://localhost:8000` | Base URL for PayFast URLs |
| `FRONTEND_URL` | `http://localhost:3000` | Frontend URL for success/cancel links |

## Local Development

PayFast's ITN cannot reach `localhost`. Options:

1. **simulate_itn**: After payment, success page shows "Complete payment locally". Click to run Invoice/Project creation.
2. **ngrok**: Run `ngrok http 8000`, set `PROJECT_BASE_URL` to ngrok URL. PayFast ITN will reach your backend.

## Production

- Set `PAYFAST_PASSPHRASE` (from PayFast merchant settings) for ITN signature verification
- Use production PayFast credentials and `PAYFAST_SANDBOX_URL` → production URL
- Ensure `PAYFAST_NOTIFY_URL` is publicly reachable (deploy to a server with public URL)
