# Media Handling (Images & Files)

This document explains how user-uploaded media (images, files) are stored, served, and displayed across the Django backend and React frontend.

## Overview

- **Backend (Django):** Stores files under `MEDIA_ROOT`, serves them at `MEDIA_URL` in development, and returns **absolute URLs** in API responses so the frontend can load images from the API origin.
- **Frontend (React):** Uses a single helper `getMediaUrl(url)` to normalize media URLs (relative or absolute) so images display correctly when the app is served from a different origin (e.g. React on `localhost:3000`, API on `localhost:8000`).

## Backend

### Configuration (PathyCodeback/settings.py)

- **MEDIA_URL:** `/media/` — URL path for media requests.
- **MEDIA_ROOT:** Project root `media/` directory — where uploaded files are stored.
- **PROJECT_BASE_URL:** Base URL of the API (e.g. `http://localhost:8000`). Used by serializers to build absolute URLs when the request object is not available (e.g. in scripts or background tasks).

At startup, Django creates these subdirectories under `MEDIA_ROOT` if they do not exist: `projects/`, `blog/`, `about/`, `clients/logos/`, `testimonials/`.

### Serving Media in Development

In **PathyCodeback/urls.py**, when `DEBUG` is True, Django serves media files with:

```python
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

So a file stored as `media/projects/photo.jpg` is served at `http://localhost:8000/media/projects/photo.jpg`.

**Production:** Do not rely on Django to serve media. Use a web server (e.g. nginx) or a storage backend (e.g. S3) and set `MEDIA_URL` / `MEDIA_ROOT` (or `DEFAULT_FILE_STORAGE`) accordingly. Ensure `PROJECT_BASE_URL` matches the public API base URL.

### API Responses: Absolute Media URLs

All serializers that expose image or file fields build **absolute** URLs so the frontend can use them in `<img src="...">` or equivalent:

| App / Model      | Field(s)           | How URL is built |
|------------------|--------------------|-------------------|
| **projects**     | Project.image      | `to_representation`: `request.build_absolute_uri(image.url)` or `PROJECT_BASE_URL + path` |
| **blog**         | BlogPost.featured_image | Same pattern in `to_representation` |
| **testimonials** | Testimonial.image  | `get_image()`: request or `PROJECT_BASE_URL` + path |
| **about**        | AboutUs.image      | `get_image()`: request or `PROJECT_BASE_URL` + path |
| **clients**      | Client.logo        | `get_logo()`: request host or `PROJECT_BASE_URL` + path |
| **clients**      | CaseStudy (client_logo) | `get_client_logo()`: same as Client.logo |
| **clients**      | Project.screenshots | `to_representation`: each list item converted via `_build_absolute_media_url()` |

Serializers receive the current `request` from the view (via `get_serializer_context()`). If `request` is missing, they fall back to `PROJECT_BASE_URL` so responses still contain absolute URLs.

## Frontend

### getMediaUrl (frontend/src/services/api.js)

```javascript
getMediaUrl(url)
```

- **Purpose:** Turn a media URL from the API (relative or absolute) into a single, loadable URL for the current environment.
- **Behavior:**
  - `null` / `undefined` / non-string → returns `null`.
  - Already `http://` or `https://` → returns as-is (and replaces `0.0.0.0` with `localhost` if present).
  - Otherwise treats as relative and prepends the API base (e.g. `http://localhost:8000`), so `/media/...` becomes `http://localhost:8000/media/...`.

**Usage:** For any image or file URL coming from the API, use `getMediaUrl(...)` in `src` (or equivalent) so it works when the frontend and API origins differ.

### Where Media Is Used

- **Projects (portfolio):** `Projects.js`, `ProjectDetail.js`, `AdminProjects.js` — `project.image` with `getMediaUrl(project.image)`.
- **Blog:** `Blog.js`, `BlogDetail.js`, `AdminBlog.js` — `post.featured_image` with `getMediaUrl(post.featured_image)`.
- **Testimonials:** `Testimonials.js`, `AdminTestimonials.js` — `testimonial.image` with `getMediaUrl(testimonial.image)`.
- **About:** `About.js`, `AboutSection.js`, `AdminAbout.js` — `aboutData.image` with `getMediaUrl(aboutData.image)`.
- **Clients:** `Clients.js`, `AdminClients.js` — `client.logo` with `getMediaUrl(client.logo)`.
- **Case studies:** `CaseStudies.js` — `caseStudy.client_logo` with `getMediaUrl(caseStudy.client_logo)`.
- **Client projects:** `ClientProjects.js`, `PublicProjects.js` — `project.screenshots[0]` with `getMediaUrl(project.screenshots[0])` (screenshots are returned as absolute URLs from the API).

## Checklist for New Media Fields

1. **Backend:** In the serializer, expose the field as an absolute URL (e.g. `SerializerMethodField` or `to_representation` using `request.build_absolute_uri(...)` or `PROJECT_BASE_URL`).
2. **Frontend:** Use `getMediaUrl(apiValue)` for any `src` or href that points to that media.
3. **Upload:** If the frontend uploads files (e.g. multipart form), the API should save to the correct `upload_to` path and return the same absolute-URL logic in the response.

## Troubleshooting

- **Images don’t load (404):** Confirm the file exists under `MEDIA_ROOT` and that `DEBUG` is True so `static(..., document_root=MEDIA_ROOT)` is in use. Check the URL in the browser and compare to the path on disk.
- **Wrong host (e.g. 0.0.0.0):** Backend replaces `0.0.0.0` with `localhost` in logo URLs; frontend `getMediaUrl` also normalizes `0.0.0.0` in full URLs.
- **CORS:** If the frontend and API are on different origins, CORS must allow the API origin. For `<img>` tags, the browser typically still loads the image; for fetch/XHR of media, CORS headers are required.
- **Broken after adding a new app:** Ensure the app’s serializer builds absolute URLs and the frontend uses `getMediaUrl()` for that field.
