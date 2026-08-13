"""
Branded CSV export helpers — company name, tagline, and document context.
"""
import csv

from django.conf import settings
from django.http import HttpResponse
from django.utils import timezone


def get_brand_meta():
    """
    Read company branding strings from Django settings.

    Returns:
        dict: ``company_name`` and ``tagline`` keys populated from
        ``BRAND_NAME`` and ``COMPANY_TAGLINE`` (with sensible defaults).
    """
    return {
        'company_name': getattr(settings, 'BRAND_NAME', 'PathyCode'),
        'tagline': getattr(settings, 'COMPANY_TAGLINE', 'Business & financial operations'),
    }


def write_branded_csv_header(writer, export_title, description=None):
    """
    Write company branding and export metadata rows before column headers.

    Args:
        writer: ``csv.writer`` instance bound to the HTTP response or buffer.
        export_title (str): Human-readable export name (e.g. ``Clients Export``).
        description (str, optional): Short summary shown on the second metadata row.
    """
    brand = get_brand_meta()
    writer.writerow(['Company', brand['company_name']])
    if brand.get('tagline'):
        writer.writerow(['Tagline', brand['tagline']])
    writer.writerow(['Export', export_title])
    if description:
        writer.writerow(['Description', description])
    writer.writerow(['Generated', timezone.now().strftime('%Y-%m-%d %H:%M')])
    writer.writerow([])


def branded_csv_response(filename, export_title, description=None):
    """
    Create an ``HttpResponse`` with a UTF-8 BOM and branded CSV header.

    Args:
        filename (str): Download filename (e.g. ``clients.csv``).
        export_title (str): Title embedded in the CSV header block.
        description (str, optional): Optional description row in the header block.

    Returns:
        tuple: ``(HttpResponse, csv.writer)`` — response is ready for data rows.
    """
    response = HttpResponse(content_type='text/csv; charset=utf-8')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    response.write('\ufeff')
    writer = csv.writer(response)
    write_branded_csv_header(writer, export_title, description)
    return response, writer
