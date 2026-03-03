from io import BytesIO
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_RIGHT, TA_LEFT, TA_CENTER
from django.conf import settings
import os


def _get_company_logo():
    """
    Resolve a company logo path for invoice branding.

    The lookup strategy is:

    * Use ``settings.COMPANY_LOGO_PATH`` if defined and the file exists.
    * Otherwise, fall back to ``MEDIA_ROOT/clients/logos/logo.png`` if present.

    Returns:
        str | None: Absolute filesystem path to the logo file, or ``None`` if
        no suitable file can be found.
    """
    logo_path = getattr(settings, "COMPANY_LOGO_PATH", None)
    if logo_path and os.path.exists(logo_path):
        return logo_path
    # Fallback: common logo location under MEDIA_ROOT
    candidate = os.path.join(settings.MEDIA_ROOT, "clients", "logos", "logo.png")
    if os.path.exists(candidate):
        return candidate
    return None


def generate_invoice_pdf(invoice):
    """
    Generate a branded PDF representation of an invoice.

    The PDF includes:

    * Invoice metadata (number, issue/due dates, status).
    * Provider and client details.
    * Line items and monetary totals.
    * Optional notes and payment information.

    Args:
        invoice (Invoice): Invoice instance to render.

    Returns:
        bytes: Binary PDF content suitable for returning in an HTTP response or
        writing to disk.
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
    
    # Container for the 'Flowable' objects
    elements = []
    
    # Define styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1e40af'),
        spaceAfter=30,
        alignment=TA_LEFT
    )
    
    # Optional logo + brand header
    logo_path = _get_company_logo()
    if logo_path:
        try:
            logo_img = Image(logo_path, width=1.0 * inch, height=1.0 * inch)
            brand_table = Table(
                [
                    [
                        logo_img,
                        Paragraph(
                            getattr(settings, "BRAND_NAME", "PathyCode"),
                            ParagraphStyle(
                                "BrandName",
                                parent=styles["Heading2"],
                                fontSize=18,
                                textColor=colors.HexColor("#111827"),
                                alignment=TA_RIGHT,
                            ),
                        ),
                    ]
                ],
                colWidths=[1.2 * inch, 3.8 * inch],
            )
            brand_table.setStyle(
                TableStyle(
                    [
                        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                        ("ALIGN", (1, 0), (1, 0), "RIGHT"),
                        ("BOX", (0, 0), (-1, -1), 0, colors.white),
                    ]
                )
            )
            elements.append(brand_table)
            elements.append(Spacer(1, 0.2 * inch))
        except Exception:
            # If logo fails to load, just continue without it
            pass

    # Title
    elements.append(Paragraph("INVOICE", title_style))
    elements.append(Spacer(1, 0.2 * inch))
    
    # Invoice details table
    invoice_data = [
        ['Invoice Number:', invoice.invoice_number],
        ['Issue Date:', invoice.issue_date.strftime('%B %d, %Y')],
        ['Due Date:', invoice.due_date.strftime('%B %d, %Y')],
        ['Status:', invoice.status],
    ]
    
    invoice_table = Table(invoice_data, colWidths=[2*inch, 3*inch])
    invoice_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f3f4f6')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
    ]))
    elements.append(invoice_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Provider and Client information side by side
    provider_data = [
        ['From:', ''],
        [invoice.provider_name, ''],
    ]
    if invoice.provider_address:
        provider_data.append([invoice.provider_address, ''])
    if invoice.provider_phone:
        provider_data.append([f'Phone: {invoice.provider_phone}', ''])
    if invoice.provider_email:
        provider_data.append([f'Email: {invoice.provider_email}', ''])
    if invoice.provider_vat_number:
        provider_data.append([f'VAT: {invoice.provider_vat_number}', ''])
    
    client_data = [
        ['To:', ''],
        [invoice.client_name, ''],
    ]
    if invoice.client_company:
        client_data.append([invoice.client_company, ''])
    if invoice.client_address:
        client_data.append([invoice.client_address, ''])
    if invoice.client_phone:
        client_data.append([f'Phone: {invoice.client_phone}', ''])
    client_data.append([f'Email: {invoice.client_email}', ''])
    if invoice.client_vat_number:
        client_data.append([f'VAT: {invoice.client_vat_number}', ''])
    
    info_table = Table([
        [Table(provider_data, colWidths=[2.5*inch]), Table(client_data, colWidths=[2.5*inch])]
    ], colWidths=[2.5*inch, 2.5*inch])
    
    info_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Items table
    items_data = [['Description', 'Quantity', 'Unit Price', 'Total']]
    for item in invoice.items:
        description = item.get('description', '')
        quantity = item.get('quantity', 0)
        unit_price = float(item.get('price', 0))
        total = quantity * unit_price
        items_data.append([
            description,
            str(quantity),
            f"R {unit_price:,.2f}",
            f"R {total:,.2f}"
        ])
    
    items_table = Table(items_data, colWidths=[3*inch, 1*inch, 1.5*inch, 1.5*inch])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')]),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Totals
    totals_data = [
        ['Subtotal:', f"R {float(invoice.subtotal):,.2f}"],
        [f'VAT ({invoice.vat_rate}%):', f"R {float(invoice.vat_amount):,.2f}"],
        ['Total Amount:', f"R {float(invoice.total_amount):,.2f}"],
        ['Amount Paid:', f"R {float(invoice.amount_paid):,.2f}"],
        ['Amount Due:', f"R {float(invoice.amount_due):,.2f}"],
    ]
    
    totals_table = Table(totals_data, colWidths=[2*inch, 2*inch])
    totals_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTNAME', (0, -1), (1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, -1), (1, -1), 12),
        ('BACKGROUND', (0, -1), (1, -1), colors.HexColor('#dbeafe')),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
    ]))
    elements.append(totals_table)
    
    # Notes
    if invoice.notes:
        elements.append(Spacer(1, 0.3*inch))
        elements.append(Paragraph(f"<b>Notes:</b> {invoice.notes}", styles['Normal']))
    
    # Payment information
    if invoice.payment_method:
        elements.append(Spacer(1, 0.2*inch))
        elements.append(Paragraph(
            f"<b>Payment Method:</b> {invoice.payment_method}",
            styles['Normal']
        ))
        if invoice.payment_reference:
            elements.append(Paragraph(
                f"<b>Payment Reference:</b> {invoice.payment_reference}",
                styles['Normal']
            ))
    
    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()

