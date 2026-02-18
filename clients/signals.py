"""
Django signals for the clients app.

- Create a Client profile for each new User (one-to-one).
- Create a Project when an invoice is marked as Paid.
"""
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from invoices.models import Invoice
from quotes.models import Quote
from .models import Client, Project

User = get_user_model()


@receiver(post_save, sender=User)
def create_client_profile_for_user(sender, instance, created, **kwargs):
    """
    Auto-create a Client profile when a new user is created (e.g. on registration).

    When a user signs up, a related Client instance is created and linked via
    Client.user (OneToOne). The client portal (quotes, invoices, projects) works
    immediately after login because request.user.client_profile exists.
    """
    if not created:
        return
    if Client.objects.filter(user=instance).exists():
        return
    name = (
        (instance.get_full_name() or "").strip()
        or (getattr(instance, "email", None) or "")
        or (getattr(instance, "username", None) or "")
        or "Client"
    ) or "Client"
    Client.objects.create(user=instance, name=name)


@receiver(pre_save, sender=Invoice)
def create_project_on_invoice_paid(sender, instance, **kwargs):
    """
    Automatically create a Client Project when an invoice is marked as PAID.
    
    This signal fires BEFORE the invoice is saved, so we can check if the status
    is changing from non-Paid to Paid.
    
    Business Rules:
    - Project is only created when invoice status changes to "Paid"
    - Project is linked to the quote's Client (quote.client or resolved via quote.client_email)
    - Project inherits name and description from quote
    """
    # Only process if this is an update (not a new invoice)
    if instance.pk:
        try:
            old_invoice = Invoice.objects.get(pk=instance.pk)
            old_status = old_invoice.status
            new_status = instance.status
            
            # Only create project if status is changing TO "Paid"
            if old_status != 'Paid' and new_status == 'Paid':
                # Get the quote from the invoice
                quote = instance.quote
                
                if not quote:
                    print(f"Warning: Invoice {instance.invoice_number} has no quote, cannot create project")
                    return
                
                # Resolve Client: use quote.client, or find by quote.client_email (User -> client_profile)
                client = quote.client if quote.client_id else None
                if not client:
                    try:
                        user = User.objects.get(email=quote.client_email)
                        client = getattr(user, 'client_profile', None) or Client.objects.filter(user=user).first()
                    except User.DoesNotExist:
                        pass
                if not client:
                    print(f"Warning: No Client for quote {quote.client_email}. Cannot create project for invoice {instance.invoice_number}")
                    return
                if Project.objects.filter(invoice=instance).exists():
                    return
                project = Project.objects.create(
                    name=quote.project_title,
                    description=quote.project_description,
                    client=client,
                    quote=quote,
                    invoice=instance,
                    status='pending',
                    tech_stack=quote.service_type or '',
                    is_public=False,
                )
                
        except Invoice.DoesNotExist:
            # This is a new invoice, not an update
            pass
        except Exception as e:
            # Log error but don't fail the invoice save
            print(f"Error creating project from invoice: {e}")
