"""
Generate PathyCode full-project architecture PDF.

Usage (from repo root):
    python docs/generate_project_overview_pdf.py

Output:
    docs/PathyCode-Project-Overview.pdf
"""
import io
import os
import sys
from datetime import datetime
from pathlib import Path

# Django setup
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'PathyCodeback.settings')

import django  # noqa: E402

django.setup()

from django.conf import settings  # noqa: E402
from reportlab.lib import colors  # noqa: E402
from reportlab.lib.enums import TA_CENTER, TA_LEFT  # noqa: E402
from reportlab.lib.pagesizes import A4  # noqa: E402
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet  # noqa: E402
from reportlab.lib.units import inch  # noqa: E402
from reportlab.platypus import (  # noqa: E402
    Image,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

OUT_PATH = ROOT / 'docs' / 'PathyCode-Project-Overview.pdf'
DIAGRAM_PATH = ROOT / 'docs' / 'pathycode-architecture-diagram.png'

C = {
    'primary': colors.HexColor('#0f172a'),
    'primary_light': colors.HexColor('#1e293b'),
    'accent': colors.HexColor('#d97706'),
    'teal': colors.HexColor('#0d9488'),
    'teal_light': colors.HexColor('#ecfdf5'),
    'muted': colors.HexColor('#64748b'),
    'border': colors.HexColor('#e2e8f0'),
    'row_alt': colors.HexColor('#f8fafc'),
    'white': colors.white,
}

DJANGO_APPS = [
    ('users', 'Auth, JWT, profile, activity log'),
    ('clients', 'Client entity, paid projects, case studies, files'),
    ('quotes', 'Quote requests & proposal workflow'),
    ('invoices', 'Invoices, PDF export, financial dashboard'),
    ('payments', 'PayFast gateway (redirect + ITN)'),
    ('projects', 'Public marketing portfolio'),
    ('services', 'Service catalog & pricing'),
    ('blog', 'Blog posts & categories'),
    ('contact', 'Contact form submissions'),
    ('newsletter', 'Email subscriptions'),
    ('testimonials', 'Client testimonials (approval)'),
    ('about', 'About page content (singleton)'),
    ('messaging', 'Client–admin project threads'),
    ('notifications', 'In-app notification events'),
    ('files', 'Shared file uploads'),
    ('tasks', 'Work tasks on client projects'),
    ('calendar_events', 'Calendar & reminders'),
]

API_GROUPS = [
    ('/api/users/', 'Register, login, JWT, profile, password reset'),
    ('/api/quotes/', 'Quote CRUD & workflow actions'),
    ('/api/invoices/', 'Invoices, dashboard, PDF, mark paid'),
    ('/api/payment/quote/<id>/', 'Payment page & PayFast start'),
    ('/api/clients/', 'Clients, projects, tasks, case studies'),
    ('/api/projects/', 'Portfolio showcase'),
    ('/api/messaging/', 'Threads & messages'),
    ('/api/notifications/', 'In-app notifications'),
    ('/payments/', 'PayFast notify, success, cancel'),
]

PUBLIC_PAGES = [
    'Home, About, Services, Pricing, Contact',
    'Projects, Public portfolio, Request quote',
    'Login, Register, Terms & Privacy, Newsletter',
]

CLIENT_PAGES = [
    'Profile (hub), Client portal, Payment',
    'My projects, Files, Tasks, Calendar',
    'Messages, Activity log, Blog, Search',
    'Clients list, Case studies (auth required)',
]

ADMIN_PAGES = [
    'Dashboard, Financial dashboard, Tasks',
    'Quotes, Invoices, Clients, Client projects',
    'Users, Messaging, Content (blog, services, about)',
    'Testimonials, Newsletter, Contact inbox',
]

WORKFLOW_STEPS = [
    ('1', 'Quote submitted', 'Client requests work — status: pending'),
    ('2', 'Admin review', 'Scope, price, timeline — status: reviewed'),
    ('3', 'Client approval', 'Client approves or rejects proposal'),
    ('4', 'PayFast payment', 'Online payment in ZAR'),
    ('5', 'Invoice created', 'Auto-generated from approved quote'),
    ('6', 'Project started', 'Client project created — delivery begins'),
]


def _logo_path():
    from invoices.utils import _get_company_logo
    return _get_company_logo()


def _section_title(text, styles):
    return Paragraph(
        text,
        ParagraphStyle(
            'SectionTitle',
            parent=styles['Heading2'],
            fontSize=14,
            textColor=C['primary'],
            spaceBefore=14,
            spaceAfter=8,
            fontName='Helvetica-Bold',
        ),
    )


def _body(text, styles, size=9, color=None):
    return Paragraph(
        text,
        ParagraphStyle(
            'Body',
            parent=styles['Normal'],
            fontSize=size,
            leading=size + 4,
            textColor=color or C['muted'],
        ),
    )


def _table(data, col_widths, header=True):
    style = [
        ('GRID', (0, 0), (-1, -1), 0.5, C['border']),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]
    if header:
        style.extend([
            ('BACKGROUND', (0, 0), (-1, 0), C['primary']),
            ('TEXTCOLOR', (0, 0), (-1, 0), C['white']),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ])
        for i in range(1, len(data)):
            if i % 2 == 0:
                style.append(('BACKGROUND', (0, i), (-1, i), C['row_alt']))
    tbl = Table(data, colWidths=col_widths, repeatRows=1 if header else 0)
    tbl.setStyle(TableStyle(style))
    return tbl


def _layer_diagram(styles):
    """Visual stack diagram drawn with ReportLab tables."""
    layers = [
        (C['accent'], 'PRESENTATION', 'React 19 · React Router · Tailwind · Axios\nPublic site · Client portal · Admin dashboard'),
        (C['teal'], 'API LAYER', 'Django REST Framework · JWT auth · CORS\n/api/* endpoints · PayFast /payments/*'),
        (C['primary_light'], 'BUSINESS LOGIC', '17 Django apps: quotes, invoices, clients, payments,\nmessaging, notifications, files, tasks, calendar…'),
        (colors.HexColor('#334155'), 'DATA', 'SQLite (dev) / PostgreSQL (prod) · Media uploads\nJWT tokens · Activity & audit logs'),
    ]
    rows = []
    for bg, title, desc in layers:
        rows.append([
            Paragraph(
                f'<b><font color="#ffffff">{title}</font></b><br/>'
                f'<font size="8" color="#e2e8f0">{desc.replace(chr(10), "<br/>")}</font>',
                ParagraphStyle('Layer', parent=styles['Normal'], fontSize=9, leading=12),
            )
        ])
    tbl = Table(rows, colWidths=[6.5 * inch])
    cmds = []
    for i, (bg, _, _) in enumerate(layers):
        cmds.append(('BACKGROUND', (0, i), (-1, i), bg))
        cmds.append(('LEFTPADDING', (0, i), (-1, i), 14))
        cmds.append(('RIGHTPADDING', (0, i), (-1, i), 14))
        cmds.append(('TOPPADDING', (0, i), (-1, i), 10))
        cmds.append(('BOTTOMPADDING', (0, i), (-1, i), 10))
    tbl.setStyle(TableStyle(cmds))
    return tbl


def _workflow_diagram(styles):
    cells = []
    for num, title, desc in WORKFLOW_STEPS:
        cells.append([
            Paragraph(
                f'<para align="center"><b><font size="14" color="#ffffff">{num}</font></b></para>',
                styles['Normal'],
            ),
            Paragraph(f'<b>{title}</b><br/><font size="8" color="#64748b">{desc}</font>', styles['Normal']),
        ])
    tbl = Table(cells, colWidths=[0.55 * inch, 5.95 * inch])
    style_cmds = [
        ('GRID', (0, 0), (-1, -1), 0.5, C['border']),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]
    for i in range(len(WORKFLOW_STEPS)):
        style_cmds.append(('BACKGROUND', (0, i), (0, i), C['teal']))
        if i % 2 == 0:
            style_cmds.append(('BACKGROUND', (1, i), (1, i), C['teal_light']))
    tbl.setStyle(TableStyle(style_cmds))
    return tbl


def _role_matrix(styles):
    data = [
        ['Role', 'Access', 'Key capabilities'],
        ['Guest', 'Public pages', 'Browse, contact, register, view pricing'],
        ['Client', 'Profile + portal', 'Quotes, pay, projects, files, messages'],
        ['Staff', 'Partial admin', 'Financial dashboard, tasks'],
        ['Superuser', 'Full /admin', 'All CRUD, users, quotes, invoices, content'],
    ]
    return _table(data, [1.1 * inch, 1.4 * inch, 4.0 * inch])


def _folder_tree(styles):
    tree = """<font face="Courier" size="8" color="#334155">
glowing-memory/<br/>
├── PathyCodeback/          Django project (settings, urls, csv_export)<br/>
├── frontend/src/<br/>
│   ├── pages/              Home, Profile, Admin*, Payment…<br/>
│   ├── components/         Navbar, SiteFooter, adminPageUi<br/>
│   ├── contexts/           AuthContext<br/>
│   └── services/api.js     Axios + JWT interceptors<br/>
├── users/ quotes/ invoices/ payments/ clients/ …  (17 apps)<br/>
├── media/                  Uploaded files<br/>
└── docs/                   Architecture docs + this PDF<br/>
</font>"""
    box = Table([[Paragraph(tree, styles['Normal'])]], colWidths=[6.5 * inch])
    box.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), C['row_alt']),
        ('BOX', (0, 0), (-1, -1), 1, C['border']),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
    ]))
    return box


def build_pdf():
    brand = getattr(settings, 'BRAND_NAME', 'PathyCode')
    tagline = getattr(settings, 'COMPANY_TAGLINE', 'Business & financial operations')
    generated = datetime.now().strftime('%Y-%m-%d %H:%M')

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=0.65 * inch,
        leftMargin=0.65 * inch,
        topMargin=0.55 * inch,
        bottomMargin=0.55 * inch,
        title=f'{brand} — Project Architecture Overview',
        author=brand,
    )
    styles = getSampleStyleSheet()
    story = []

    # Cover banner
    logo = _logo_path()
    left = Paragraph(f'<b><font size="22" color="#ffffff">{brand}</font></b>', styles['Normal'])
    if logo and os.path.exists(logo):
        try:
            left = Image(logo, width=0.9 * inch, height=0.9 * inch)
        except Exception:
            pass

    cover = Table(
        [[
            left,
            Paragraph(
                f'<para align="right"><b><font size="18" color="#ffffff">Project Architecture</font></b><br/>'
                f'<font size="10" color="#cbd5e1">{tagline}</font><br/>'
                f'<font size="9" color="#94a3b8">Full-stack overview · Structure · Workflows</font></para>',
                styles['Normal'],
            ),
        ]],
        colWidths=[1.2 * inch, 5.3 * inch],
    )
    cover.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), C['primary']),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 16),
        ('RIGHTPADDING', (0, 0), (-1, -1), 16),
        ('TOPPADDING', (0, 0), (-1, -1), 18),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 18),
    ]))
    story.append(cover)
    story.append(Spacer(1, 0.15 * inch))

    desc = Table([[
        Paragraph(
            'This document describes the <b>PathyCode Platform</b> — a Django + React application '
            'for digital agency operations: marketing site, client portal, quotes, PayFast payments, '
            'invoicing, project delivery, and admin finance tooling.',
            ParagraphStyle('Desc', parent=styles['Normal'], fontSize=9, leading=13, textColor=colors.HexColor('#334155')),
        )
    ]], colWidths=[6.5 * inch])
    desc.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#fffbeb')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#fde68a')),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(desc)

    # Executive summary cards
    story.append(_section_title('Executive Summary', styles))
    summary = Table([
        [
            Paragraph('<para align="center"><b><font size="16" color="#0d9488">17</font></b><br/><font size="8">Django apps</font></para>', styles['Normal']),
            Paragraph('<para align="center"><b><font size="16" color="#d97706">3</font></b><br/><font size="8">User tiers</font></para>', styles['Normal']),
            Paragraph('<para align="center"><b><font size="16" color="#0f172a">JWT</font></b><br/><font size="8">Authentication</font></para>', styles['Normal']),
            Paragraph('<para align="center"><b><font size="16" color="#0f172a">PayFast</font></b><br/><font size="8">Payments (ZAR)</font></para>', styles['Normal']),
        ]
    ], colWidths=[1.625 * inch] * 4)
    summary.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), C['white']),
        ('BOX', (0, 0), (-1, -1), 1, C['border']),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, C['border']),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
    ]))
    story.append(summary)

    # Tech stack
    story.append(_section_title('Technology Stack', styles))
    stack_data = [
        ['Layer', 'Technologies'],
        ['Backend', 'Django 5.2 · DRF 3.16 · SimpleJWT · django-filter · ReportLab'],
        ['Frontend', 'React 19 · React Router 7 · Tailwind 3 · Axios · Bootstrap 5'],
        ['Database', 'SQLite (dev) · PostgreSQL via env (production)'],
        ['Payments', 'PayFast (redirect + ITN webhook)'],
        ['Deploy', 'Gunicorn · CORS · python-decouple env config'],
    ]
    story.append(_table(stack_data, [1.3 * inch, 5.2 * inch]))

    # Architecture diagram
    story.append(_section_title('System Architecture (Layer Diagram)', styles))
    story.append(_body('Four-tier structure from browser to database:', styles))
    story.append(Spacer(1, 6))
    story.append(_layer_diagram(styles))

    if DIAGRAM_PATH.exists():
        story.append(Spacer(1, 12))
        story.append(_section_title('Visual Architecture Map', styles))
        story.append(_body('High-level component and workflow structure:', styles))
        story.append(Spacer(1, 6))
        story.append(Image(str(DIAGRAM_PATH), width=6.5 * inch, height=3.66 * inch))

    story.append(PageBreak())

    # Repository structure
    story.append(_section_title('Repository Structure', styles))
    story.append(_folder_tree(styles))

    # Django apps
    story.append(_section_title('Django Applications', styles))
    app_data = [['App', 'Purpose']] + list(DJANGO_APPS)
    story.append(_table(app_data, [1.2 * inch, 5.3 * inch]))

    # API routes
    story.append(_section_title('Primary API Route Groups', styles))
    api_data = [['Prefix', 'Description']] + list(API_GROUPS)
    story.append(_table(api_data, [2.0 * inch, 4.5 * inch]))

    story.append(PageBreak())

    # Frontend structure
    story.append(_section_title('Frontend Page Structure', styles))
    fe_data = [
        ['Tier', 'Pages / routes'],
        ['Public', '. '.join(PUBLIC_PAGES)],
        ['Client (auth)', '. '.join(CLIENT_PAGES[:3])],
        ['Client (auth)', '. '.join(CLIENT_PAGES[3:])],
        ['Admin', '. '.join(ADMIN_PAGES[:2])],
        ['Admin', '. '.join(ADMIN_PAGES[2:])],
    ]
    tbl = _table(fe_data, [1.1 * inch, 5.4 * inch])
    story.append(tbl)

    # Roles
    story.append(_section_title('User Roles & Access Control', styles))
    story.append(_role_matrix(styles))

    # Workflow
    story.append(_section_title('Revenue Workflow: Quote → Payment → Project', styles))
    story.append(_body(
        'Primary monetization path. Payment via PayFast creates an invoice and auto-starts a client project.',
        styles,
    ))
    story.append(Spacer(1, 6))
    story.append(_workflow_diagram(styles))

    story.append(Spacer(1, 10))
    story.append(_body(
        '<b>Note:</b> Two Project models exist — <i>clients.Project</i> (paid client work) and '
        '<i>projects.Project</i> (marketing portfolio). The payment workflow creates <i>clients.Project</i>.',
        styles,
        color=colors.HexColor('#334155'),
    ))

    # Monetization
    story.append(_section_title('Monetization Model', styles))
    money_data = [
        ['Stream', 'How it works', 'Status'],
        ['Project fees', 'Quotes with admin-set price → PayFast payment', 'Live'],
        ['Tiered pricing', 'Starter R8k+ · Professional R25k+ · Enterprise custom', 'Marketing'],
        ['Invoicing', 'PDF invoices, VAT tracking, financial dashboard', 'Live'],
        ['Maintenance', 'Post-launch support (manual / future recurring)', 'Partial'],
        ['SaaS platform', 'Not multi-tenant — single business use', 'N/A'],
    ]
    story.append(_table(money_data, [1.2 * inch, 3.5 * inch, 1.8 * inch]))

    # Integrations
    story.append(_section_title('Key Integrations', styles))
    int_data = [
        ['Integration', 'Purpose'],
        ['PayFast', 'Card/EFT payments, ITN callbacks, sandbox + production'],
        ['Email (SMTP)', 'Password reset, notifications (console in dev)'],
        ['Media storage', 'Local MEDIA_ROOT — logos, project images, attachments'],
        ['JWT', '60-min access token, 7-day refresh, auto-refresh in Axios'],
    ]
    story.append(_table(int_data, [1.5 * inch, 5.0 * inch]))

    # Footer
    story.append(Spacer(1, 20))
    footer = Table([[
        Paragraph(
            f'<para align="center"><font size="8" color="#94a3b8">'
            f'Generated {generated} · {brand} · Confidential internal document<br/>'
            f'Repository: glowing-memory · docs/PathyCode-Project-Overview.pdf</font></para>',
            styles['Normal'],
        )
    ]], colWidths=[6.5 * inch])
    story.append(footer)

    doc.build(story)
    OUT_PATH.write_bytes(buffer.getvalue())
    return OUT_PATH


if __name__ == '__main__':
    path = build_pdf()
    print(f'PDF written to: {path}')
