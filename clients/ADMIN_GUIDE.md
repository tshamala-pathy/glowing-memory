# Clients App: How It Works & Admin Panel Guide

This guide explains the **Clients**, **Case Studies**, and **Client Projects** models and how to manage them in the Django Admin panel.

---

## 1. Overview: Three Different Concepts

| Concept | What it is | Used for |
|--------|------------|----------|
| **Client** | A **company or organization** (e.g. "Acme Corp") | Portfolio: logos, industries, “our clients”. Case studies belong to a Client. |
| **Case Study** | A **story** (Problem → Solution → Result) about work for a **Client** (company) | Marketing: proof of experience, testimonials, metrics. |
| **Client Project** | A **project** for a **User** (the person who requested the quote) | Delivery: linked to Quote & Invoice, created when invoice is paid. |

**Important:**  
- **Client** = company (model `Client`).  
- **Client Project’s “client”** = **User** (the person who submitted the quote and pays the invoice). So “Client Projects” are tied to **users**, not to the `Client` model.

---

## 2. Client (Company / Organization)

### What it is
- Represents a **company** you work with: name, logo, industry, short description.
- Used for:
  - “Our clients” section (logos, names).
  - **Case studies** (each case study belongs to one Client).

### Main fields
- **name** – Company name  
- **logo** – Image (optional)  
- **industry** – e.g. Technology, Healthcare  
- **description** – Short text  
- **is_public** – If true, can be shown on the public site  

### How to add in Django Admin

1. Open: **http://127.0.0.1:8000/admin/**
2. Log in as a superuser.
3. Under **CLIENTS**, click **Clients**.
4. Click **Add Client**.
5. Fill in:
   - **Name** (required)
   - **Logo** (optional): upload image
   - **Industry** (optional)
   - **Description** (optional)
   - **Is public**: tick if you want it on the public website
6. Click **Save**.

You can later **edit** or **delete** from the same list. Use **Filters** (e.g. by **Is public**) and **Search** (name, industry, description) to find clients.

---

## 3. Case Study

### What it is
- A **story** about a project for a **Client (company)**:
  - **Problem** – What challenge they had  
  - **Solution** – What you did  
  - **Result** – What was achieved  
- Can include **metrics** (e.g. revenue +50%) and a **testimonial**.
- Used for marketing and “proof” on the website.

### Main fields
- **title** – Case study title  
- **client** – **Client** (company) this story is about  
- **problem** – The problem/challenge  
- **solution** – The solution  
- **result** – The outcome  
- **metrics** – Optional JSON, e.g. `{"revenue": "+50%", "users": "10K"}`  
- **testimonial** – Optional quote from the client  
- **is_public** – If true, shown on the public site  

### How to add in Django Admin

1. Go to **http://127.0.0.1:8000/admin/** → **CLIENTS** → **Case studies**.
2. Click **Add Case Study**.
3. Fill in:
   - **Title** (required)
   - **Client** (required): choose a **Client** (company) from the list.  
     You must have at least one **Client** created first.
   - **Problem** (required)
   - **Solution** (required)
   - **Result** (required)
   - **Metrics** (optional): valid JSON, e.g. `{"revenue": "+50%"}`
   - **Testimonial** (optional)
   - **Is public**: tick to show on the website
4. Click **Save**.

You can **filter** by **Client** and **Is public**, and **search** by title, problem, solution, result.

---

## 4. Client Project

### What it is
- A **project** for a **User** (the person who requested a quote and pays the invoice).
- **Not** linked to the `Client` (company) model; **client** here is a **User**.
- Can be created:
  - **Automatically** when an **Invoice** is marked as **Paid** (see `clients/signals.py`).
  - **Manually** in admin (e.g. for testing or legacy projects).

### Main fields
- **name** – Project name  
- **description** – Project description  
- **client** – **User** (the person who is the client)  
- **status** – Pending / In Progress / Completed  
- **quote** – Optional link to the **Quote**  
- **invoice** – Optional link to the **Invoice**  
- **tech_stack** – e.g. "Django, React"  
- **screenshots** – Optional JSON list of image URLs  
- **repo_url** / **live_url** – Optional links  
- **is_public** – If true, shown on the public projects page  

### How it’s created automatically
1. Client (user) submits a **Quote**.  
2. Admin approves the quote and creates an **Invoice** from it.  
3. When the **Invoice** status is set to **Paid**, a **Client Project** is created and linked to:
   - that **User** (client),
   - the **Quote**,
   - the **Invoice**.

### How to add / edit in Django Admin

1. Go to **http://127.0.0.1:8000/admin/** → **CLIENTS** → **Client projects**.
2. To add one manually: click **Add Client Project**.
3. Fill in:
   - **Name** (required)
   - **Description** (required)
   - **Client** (required): choose a **User** (the person who is the client).  
     This is the user list (e.g. the one who submitted the quote).
   - **Status**: Pending / In Progress / Completed
   - **Quote** (optional): link to a Quote
   - **Invoice** (optional): link to an Invoice (should be Paid if you link it)
   - **Tech stack**, **Screenshots**, **Repo URL**, **Live URL** (optional)
   - **Is public**: tick to show on the public projects page
4. Click **Save**.

In the list you’ll see **Client** (user name/email), **Status**, **Is public**, and links to **Related Quote** and **Related Invoice**. Use **Filters** and **Search** to find projects.

---

## 5. Quick Reference: Where to go in Admin

| What you want to do | In Admin go to |
|---------------------|------------------|
| Add/edit a **company** (client) | **CLIENTS** → **Clients** |
| Add/edit a **case study** (problem/solution/result) | **CLIENTS** → **Case studies** |
| Add/edit a **client project** (project for a user) | **CLIENTS** → **Client projects** |

---

## 6. Relationships (Summary)

```
Client (company)
  └── Case Study (many case studies per client)

User (person who requested quote)
  └── Client Project (many projects per user)
        └── optional: Quote, Invoice
```

- **Case Study** always belongs to one **Client** (company).  
- **Client Project** always belongs to one **User** and can optionally be linked to one **Quote** and one **Invoice**.

---

## 7. Public vs private

- **Client**: `is_public` = show company on the public site (e.g. “Our clients”).  
- **Case Study**: `is_public` = show this story on the public site.  
- **Client Project**: `is_public` = show this project on the public projects page; otherwise only that user and admins see it.

You control visibility by ticking or unticking **Is public** when adding or editing the record in the admin panel.
