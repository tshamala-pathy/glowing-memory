from io import BytesIO

from django.conf import settings
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    Image,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

import os


def _get_company_logo():
    """
    Resolve a company logo path for quote PDFs.

    Uses the same convention as ``invoices.utils._get_company_logo`` by first
    checking ``settings.COMPANY_LOGO_PATH`` and then falling back to a default
    logo under ``MEDIA_ROOT/clients/logos/logo.png``.

    Returns:
        str | None: Absolute filesystem path to the logo file, or ``None`` if
        no suitable file can be found.
    """
    logo_path = getattr(settings, "COMPANY_LOGO_PATH", None)
    if logo_path and os.path.exists(logo_path):
        return logo_path
    candidate = os.path.join(settings.MEDIA_ROOT, "clients", "logos", "logo.png")
    if os.path.exists(candidate):
        return candidate
    return None


def generate_quote_pdf(quote):
    """
    Generate a branded PDF document for a quote.

    The PDF includes:

    * Branding header with logo and brand name (if available).
    * Quote metadata (id, created date, status, deadline/timeline).
    * Client details.
    * A single line item based on the estimated amount.
    * An optional project description section.

    Args:
        quote (Quote): Quote instance to render.

    Returns:
        bytes: Binary PDF content suitable for returning in an HTTP response or
        writing to disk.
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=18,
    )

    elements = []
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "QuoteTitle",
        parent=styles["Heading1"],
        fontSize=24,
        textColor=colors.HexColor("#1e40af"),
        spaceAfter=30,
        alignment=TA_LEFT,
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
            pass

    # Title
    elements.append(Paragraph("QUOTE", title_style))
    elements.append(Spacer(1, 0.2 * inch))

    # Quote meta details
    details_data = [
        ["Quote ID:", str(quote.id)],
        ["Created:", quote.created_at.strftime("%B %d, %Y") if quote.created_at else ""],
        ["Status:", quote.status],
    ]
    if quote.deadline:
        details_data.append(["Desired Deadline:", quote.deadline.strftime("%B %d, %Y")])
    if quote.timeline:
        details_data.append(["Timeline:", quote.timeline])

    details_table = Table(details_data, colWidths=[2 * inch, 3 * inch])
    details_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#f3f4f6")),
                ("TEXTCOLOR", (0, 0), (-1, -1), colors.black),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("GRID", (0, 0), (-1, -1), 1, colors.grey),
            ]
        )
    )
    elements.append(details_table)
    elements.append(Spacer(1, 0.3 * inch))

    # Client information
    client_lines = [
        [f"{quote.client_name}", ""],
        [quote.company_name or "", ""],
    ]
    client_lines.append([f"Email: {quote.client_email}", ""])
    if quote.client_phone:
        client_lines.append([f"Phone: {quote.client_phone}", ""])

    client_table = Table(client_lines, colWidths=[3.5 * inch, 1.5 * inch])
    client_table.setStyle(
        TableStyle(
            [
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    elements.append(Paragraph("<b>Client</b>", styles["Heading4"]))
    elements.append(Spacer(1, 0.1 * inch))
    elements.append(client_table)
    elements.append(Spacer(1, 0.3 * inch))

    # Item breakdown (single line item from estimated_amount)
    items_data = [["Description", "Estimated Amount (R)"]]
    description = quote.project_title
    if quote.service_type:
        description = f"{quote.project_title} ({quote.service_type})"
    amount = quote.estimated_amount or 0
    items_data.append(
        [
            description,
            f"{float(amount):,.2f}",
        ]
    )

    items_table = Table(items_data, colWidths=[4 * inch, 1.5 * inch])
    items_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e40af")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("ALIGN", (1, 1), (1, -1), "RIGHT"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, 0), 12),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                ("GRID", (0, 0), (-1, -1), 1, colors.grey),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f9fafb")]),
            ]
        )
    )
    elements.append(items_table)
    elements.append(Spacer(1, 0.3 * inch))

    # Total summary
    totals_data = [
        ["Estimated total:", f"R {float(amount):,.2f}"],
    ]
    totals_table = Table(totals_data, colWidths=[3 * inch, 2 * inch])
    totals_table.setStyle(
        TableStyle(
            [
                ("ALIGN", (0, 0), (0, -1), "RIGHT"),
                ("ALIGN", (1, 0), (1, -1), "RIGHT"),
                ("FONTNAME", (0, 0), (1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (1, 0), 12),
                ("BACKGROUND", (0, 0), (1, 0), colors.HexColor("#dbeafe")),
                ("GRID", (0, 0), (-1, -1), 1, colors.grey),
            ]
        )
    )
    elements.append(totals_table)

    # Optional project description
    if quote.project_description:
        elements.append(Spacer(1, 0.3 * inch))
        elements.append(
            Paragraph(
                "<b>Project Description</b>",
                styles["Heading4"],
            )
        )
        elements.append(
            Paragraph(
                quote.project_description.replace("\n", "<br/>"),
                styles["Normal"],
            )
        )

    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()

