"""
Django signals for the clients app.

- Create a Client profile for each new User (one-to-one).
- Create a Project when an invoice is marked as Paid.
"""
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from invoices.models import Invoice
from quotes.models import Quote
from .models import Client, Project
import logging

User = get_user_model()
logger = logging.getLogger(__name__)


@receiver(post_save, sender=User)
def create_client_profile_for_user(sender, instance, created, **kwargs):
    """
    Auto-create a ``Client`` profile when a new user is created.

    When a user signs up, a related ``Client`` instance is created and linked via
    ``Client.user`` (OneToOne). The client portal (quotes, invoices, projects)
    works immediately after login because ``request.user.client_profile`` exists.

    Args:
        sender (Type[User]): The model class that sent the signal.
        instance (User): The user instance that was just saved.
        created (bool): ``True`` if a new record was created.
        **kwargs: Additional signal kwargs (unused).
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
    Automatically create a project when an invoice is marked as paid.

    This ``pre_save`` signal runs before the invoice is persisted so it can
    compare the previous and new status. When the status changes from anything
    other than ``paid`` to ``paid``, a new ``Project`` is created and linked to
    the same client/quote/invoice (if one does not already exist).

    Args:
        sender (Type[Invoice]): The ``Invoice`` model class.
        instance (Invoice): The invoice instance about to be saved.
        **kwargs: Additional signal kwargs (unused).
    """
    # Only process if this is an update (not a new invoice)
    if instance.pk:
        try:
            old_invoice = Invoice.objects.get(pk=instance.pk)
            old_status = old_invoice.status
            new_status = instance.status
            
            # Only create project if status is changing TO "Paid"
            if old_status != 'paid' and new_status == 'paid':
                # Get the quote from the invoice
                quote = instance.quote
                
                if not quote:
                    logger.warning(
                        "Invoice %s has no quote, cannot create project",
                        instance.invoice_number,
                    )
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
                    logger.warning(
                        "No Client for quote %s. Cannot create project for invoice %s",
                        quote.client_email,
                        instance.invoice_number,
                    )
                    return
                if Project.objects.filter(invoice=instance).exists():
                    return
                project = Project.objects.create(
                    name=quote.project_title,
                    description=quote.project_description,
                    client=client,
                    quote=quote,
                    invoice=instance,
                    status='in_progress',
                    tech_stack=quote.service_type or '',
                    is_public=False,
                )
                
        except Invoice.DoesNotExist:
            # This is a new invoice, not an update
            pass
        except Exception as e:
            # Log error but don't fail the invoice save
            logger.error("Error creating project from invoice: %s", e, exc_info=True)


@receiver(pre_save, sender=Project)
def handle_project_completion(sender, instance, **kwargs):
    """
    Handle project completion workflow.

    When a project's status transitions to ``completed`` this signal:

    * Stores a completion timestamp (``completed_at``) if not already set.
    * Sends a best-effort notification email to the client with a testimonial
      request. Errors in email delivery are logged but never block saving.

    Args:
        sender (Type[Project]): The ``Project`` model class.
        instance (Project): The project instance about to be saved.
        **kwargs: Additional signal kwargs (unused).
    """
    if not instance.pk:
        return

    try:
        old = Project.objects.get(pk=instance.pk)
    except Project.DoesNotExist:
        return

    if old.status != "completed" and instance.status == "completed":
        # Set completion timestamp if not already set
        if not instance.completed_at:
            instance.completed_at = timezone.now()

        # Send client notification email (best-effort)
        client = instance.client
        user = getattr(client, "user", None) if client else None
        email = getattr(user, "email", None)
        if email:
            subject = f"Your project '{instance.name}' is now complete"
            message = (
                f"Hello {client.name if client else ''},\n\n"
                f"We're excited to let you know that your project '{instance.name}' "
                "has been marked as completed.\n\n"
                "If you’re happy with the outcome, we’d really appreciate a short testimonial "
                "we can share in our portfolio.\n\n"
                "Thank you for working with PathyCode!\n"
            )
            try:
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=getattr(
                        settings, "DEFAULT_FROM_EMAIL", "noreply@pathycodes.com"
                    ),
                    recipient_list=[email],
                    fail_silently=False,
                )
            except Exception as e:
                logger.error(
                    "Error sending project completion email for project %s: %s",
                    instance.pk,
                    e,
                    exc_info=True,
                )
