from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework.test import APIClient

from clients.models import Client
from invoices.models import Invoice
from quotes.models import Quote
from .models import Payment
from .views import _process_payment_complete, _verify_payfast_signature

User = get_user_model()


class PaymentModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='client', email='client@example.com', password='password'
        )
        self.client_profile = Client.objects.get(user=self.user)
        self.quote = Quote.objects.create(
            client=self.client_profile,
            client_name='Client',
            client_email='client@example.com',
            project_title='Pay Project',
            project_description='Desc',
            requirements_accepted=True,
            status='approved',
            estimated_amount=Decimal('999.00'),
        )

    def test_payment_str(self):
        payment = Payment.objects.create(
            client=self.client_profile,
            user=self.user,
            quote=self.quote,
            amount=Decimal('999.00'),
        )
        self.assertIn('999.00', str(payment))

    def test_default_status_pending(self):
        payment = Payment.objects.create(
            client=self.client_profile,
            quote=self.quote,
            amount=Decimal('100.00'),
        )
        self.assertEqual(payment.payment_status, Payment.STATUS_PENDING)


class PayFastSignatureTest(TestCase):
    def test_skips_verification_when_no_passphrase(self):
        self.assertTrue(_verify_payfast_signature({'amount': '100'}, ''))

    @override_settings(PAYFAST_PASSPHRASE='secret')
    def test_rejects_missing_signature_when_passphrase_set(self):
        self.assertFalse(_verify_payfast_signature({'amount': '100'}, 'secret'))


class PaymentFlowTest(TestCase):
    def setUp(self):
        self.client_user = User.objects.create_user(
            username='client', email='client@example.com', password='password'
        )
        self.client_profile = Client.objects.get(user=self.client_user)
        self.client_profile.name = 'ClientCo'
        self.client_profile.save()
        self.quote = Quote.objects.create(
            client=self.client_profile,
            client_name='Client',
            client_email='client@example.com',
            project_title='Pay Project',
            project_description='Desc',
            requirements_accepted=True,
            status='approved',
            estimated_amount=Decimal('1500.00'),
        )
        self.api = APIClient()

    def test_start_pay_requires_authentication(self):
        url = reverse('payment-quote-start-pay', args=[self.quote.id])
        response = self.api.get(url)
        self.assertEqual(response.status_code, 401)

    def test_start_pay_returns_redirect_url(self):
        self.api.force_authenticate(user=self.client_user)
        url = reverse('payment-quote-start-pay', args=[self.quote.id])
        response = self.api.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertIn('redirect_url', response.data)
        self.assertIn('payfast', response.data['redirect_url'].lower())

    def test_start_pay_rejects_non_approved_quote(self):
        self.quote.status = 'pending'
        self.quote.save()
        self.api.force_authenticate(user=self.client_user)
        url = reverse('payment-quote-start-pay', args=[self.quote.id])
        response = self.api.get(url)
        self.assertEqual(response.status_code, 400)

    def test_process_payment_complete_creates_invoice(self):
        payment = Payment.objects.create(
            client=self.client_profile,
            user=self.client_user,
            quote=self.quote,
            amount=Decimal('1500.00'),
        )
        _process_payment_complete(self.quote, payment, provider_reference='test-ref')
        payment.refresh_from_db()
        self.quote.refresh_from_db()
        self.assertEqual(payment.payment_status, Payment.STATUS_PAID)
        self.assertEqual(self.quote.status, 'paid')
        self.assertTrue(Invoice.objects.filter(quote=self.quote).exists())

    def test_payment_quote_returns_success_after_payment_completion(self):
        payment = Payment.objects.create(
            client=self.client_profile,
            user=self.client_user,
            quote=self.quote,
            amount=Decimal('1500.00'),
        )
        _process_payment_complete(self.quote, payment, provider_reference='test-ref')

        self.api.force_authenticate(user=self.client_user)
        response = self.api.get(reverse('payment-quote', args=[self.quote.id]))

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['already_paid'])
        self.assertEqual(response.data['payment_status'], 'paid')

    @override_settings(DEBUG=True)
    def test_simulate_itn_endpoint(self):
        payment = Payment.objects.create(
            client=self.client_profile,
            user=self.client_user,
            quote=self.quote,
            amount=Decimal('1500.00'),
        )
        url = reverse('payments:payfast-simulate-itn')
        response = self.api.get(url, {'quote_id': self.quote.id, 'payment_id': payment.id})
        self.assertEqual(response.status_code, 302)
        payment.refresh_from_db()
        self.assertEqual(payment.payment_status, Payment.STATUS_PAID)
