# Production-Grade Web Development & Security Instructions
## Modern, Accessible, and Secure Website Architecture (HTML, CSS, JavaScript)

This document provides the authoritative, updated engineering specification and implementation guide for building, securing, deploying, and maintaining modern static and backend-augmented websites.

---

## 1. Architectural Strategy & Responsibilities

### 1.1 Separation of Concerns Matrix

| Layer | Technologies | Responsibilities | Security Boundary? |
| :--- | :--- | :--- | :--- |
| **Frontend (Client-Side)** | Semantic HTML5, Modern CSS (Custom Properties, Flexbox, Grid), Modular JavaScript (ES6+) | UI structure, responsive presentation, user interactions, instant validation feedback, accessibility (a11y). | **NO.** Client code can be inspected, altered, or bypassed by cURL, scripts, or disabled JS. Never store secrets, API tokens, or enforce permissions solely in browser JS. |
| **Backend (Server-Side)** | Node.js / Express, Python, Go, or Managed Services | Input sanitization, business logic, session generation, database transactions, authentication, authorization. | **YES.** Server-side checks are mandatory and immutable. |
| **Transport & Host** | Nginx / Caddy, HTTPS (TLS 1.3), Automated DNS | SSL termination, HTTP security headers, rate limiting, gzip/brotli compression, error routing. | **YES.** Protects data in transit and restricts origin access. |

### 1.2 Core Client-Side Security Rules
1. **Zero Secret Storage**: Never embed API keys, passwords, database credentials, or private access tokens in client-side HTML, CSS, or JS bundles.
2. **Never Use `eval()`**: Avoid dynamic evaluation of strings (`eval()`, `new Function()`, `setTimeout(string)`).
3. **Prevent DOM XSS**: Avoid assigning untrusted user input to `.innerHTML`. Always use `.textContent` or safe DOM creation methods (`document.createElement()`, template elements).
4. **Treat Client Validation as UX Only**: Browser-side checks guide genuine users; server-side validation protects the system.
5. **No Sensitive Auth in `localStorage`**: Avoid storing sensitive authentication credentials or JWT tokens in `localStorage` where they are vulnerable to XSS. Prefer `HttpOnly`, `Secure`, `SameSite=Strict` cookies.

---

## 2. Directory & File Structure

A clean, predictable directory layout prevents accidental exposure of sensitive files and ensures seamless deployment:

```text
my-local-site/
├── index.html              # Homepage / landing page
├── contact.html            # Accessible contact form with UX validation
├── privacy.html            # Privacy Policy (GDPR / CCPA disclosures)
├── terms.html              # Terms of Service & acceptable use
├── 404.html                # Custom Not Found error page
├── 500.html                # Custom Server Error fallback page
├── sitemap.xml             # Search engine crawl map
├── robots.txt              # Search engine crawler permissions
├── .gitignore              # Excludes logs, secrets, and environment files
├── css/
│   ├── style.css           # Global stylesheet (variables, reset, typography)
│   └── components/         # Optional modular stylesheets (forms, navigation)
├── js/
│   ├── main.js             # Core interactive logic (navigation, accessible toggles)
│   └── validation.js       # Form validation & error announcement
├── assets/
│   ├── images/             # Optimized WebP/SVG images
│   ├── icons/              # Favicons and SVG iconography
│   └── fonts/              # Self-hosted web fonts (WOFF2)
└── nginx/
    ├── conf.d/
    │   └── site.conf       # Virtual host configuration with security headers
    └── ssl/
        ├── cert.pem        # TLS certificate chain
        └── key.pem         # Private key (restricted permissions: 600)
```

---

## 3. Semantic & Accessible HTML Foundation

Every page must be built on semantic HTML5, ensuring WCAG 2.1 AA accessibility and optimal SEO.

### 3.1 Base Skeleton (`index.html`)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Local Site – High-Performance & Secure Architecture</title>
  <meta name="description" content="A modern, responsive, and secure website built with semantic HTML5, CSS3, and JavaScript.">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://my-site.local/">

  <!-- Open Graph & Social Sharing -->
  <meta property="og:title" content="My Local Site – Secure Architecture">
  <meta property="og:description" content="A modern, responsive, and secure website built with semantic HTML5.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://my-site.local/">
  <meta property="og:image" content="https://my-site.local/assets/images/og-share.png">
  <meta name="twitter:card" content="summary_large_image">

  <!-- Content Security Policy Fallback (Meta Tag) -->
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; object-src 'none'; base-uri 'self';">

  <link rel="stylesheet" href="/css/style.css">
  <link rel="icon" href="/assets/icons/favicon.ico" sizes="any">
  <link rel="icon" href="/assets/icons/icon.svg" type="image/svg+xml">
</head>
<body>
  <!-- Accessible Skip Link for Keyboard Users -->
  <a href="#main-content" class="skip-link">Skip to main content</a>

  <header class="site-header">
    <div class="container header-inner">
      <a href="/" class="brand-logo" aria-label="My Local Site Homepage">My Local Site</a>
      <nav aria-label="Primary Navigation">
        <ul class="nav-list">
          <li><a href="/" aria-current="page">Home</a></li>
          <li><a href="/contact.html">Contact</a></li>
          <li><a href="/privacy.html">Privacy</a></li>
          <li><a href="/terms.html">Terms</a></li>
        </ul>
      </nav>
    </div>
  </header>

  <main id="main-content" class="site-main" tabindex="-1">
    <div class="container">
      <h1>Welcome to My Local Site</h1>
      <p class="lead">A clean, high-performance web foundation designed for security and accessibility.</p>
    </div>
  </main>

  <footer class="site-footer">
    <div class="container">
      <p>&copy; 2026 My Local Site. All rights reserved.</p>
      <nav aria-label="Footer Navigation">
        <a href="/privacy.html">Privacy Policy</a>
        <a href="/terms.html">Terms of Service</a>
      </nav>
    </div>
  </footer>

  <script src="/js/main.js" defer></script>
</body>
</html>
```

---

## 4. Client-Side UX Validation & Accessible Forms

### 4.1 Contact Form Markup (`contact.html`)

```html
<main id="main-content" class="site-main" tabindex="-1">
  <div class="container form-container">
    <h1>Contact Our Team</h1>
    <p>Please fill out the form below. All required fields are marked.</p>

    <!-- Error Summary Container with ARIA Live Announcement -->
    <div id="form-errors" class="alert-box error" role="alert" aria-live="assertive" hidden></div>
    <div id="form-success" class="alert-box success" role="status" aria-live="polite" hidden></div>

    <form id="contact-form" action="/api/contact" method="post" novalidate>
      <div class="form-group">
        <label for="contact-name">Name <span aria-hidden="true">*</span></label>
        <input 
          type="text" 
          id="contact-name" 
          name="name" 
          autocomplete="name" 
          required 
          aria-describedby="name-error"
          aria-required="true"
        >
        <span id="name-error" class="field-error" aria-live="polite"></span>
      </div>

      <div class="form-group">
        <label for="contact-email">Email Address <span aria-hidden="true">*</span></label>
        <input 
          type="email" 
          id="contact-email" 
          name="email" 
          autocomplete="email" 
          required 
          aria-describedby="email-error"
          aria-required="true"
        >
        <span id="email-error" class="field-error" aria-live="polite"></span>
      </div>

      <div class="form-group">
        <label for="contact-message">Message <span aria-hidden="true">*</span></label>
        <textarea 
          id="contact-message" 
          name="message" 
          rows="6" 
          required 
          aria-describedby="message-error"
          aria-required="true"
          minlength="10"
        ></textarea>
        <span id="message-error" class="field-error" aria-live="polite"></span>
      </div>

      <button type="submit" class="btn btn-primary" id="submit-btn">Send Message</button>
    </form>
  </div>
</main>
```

### 4.2 Robust Client Validation Script (`js/main.js`)

```javascript
document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#contact-form');
  if (!form) return;

  const errorBox = document.querySelector('#form-errors');
  const successBox = document.querySelector('#form-success');
  const submitBtn = document.querySelector('#submit-btn');

  // Input references
  const nameInput = form.querySelector('#contact-name');
  const emailInput = form.querySelector('#contact-email');
  const messageInput = form.querySelector('#contact-message');

  // Clear errors on user input
  [nameInput, emailInput, messageInput].forEach(input => {
    input.addEventListener('input', () => {
      input.removeAttribute('aria-invalid');
      const errSpan = document.getElementById(`${input.name}-error`);
      if (errSpan) errSpan.textContent = '';
      if (errorBox) errorBox.hidden = true;
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Clear previous alerts
    errorBox.hidden = true;
    errorBox.textContent = '';
    if (successBox) successBox.hidden = true;

    const errors = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Validate Name
    if (!nameInput.value.trim()) {
      errors.push({ field: nameInput, message: 'Please enter your name.' });
    }

    // Validate Email
    if (!emailInput.value.trim()) {
      errors.push({ field: emailInput, message: 'Please enter your email address.' });
    } else if (!emailRegex.test(emailInput.value.trim())) {
      errors.push({ field: emailInput, message: 'Please enter a valid email format (e.g., user@example.com).' });
    }

    // Validate Message
    if (!messageInput.value.trim()) {
      errors.push({ field: messageInput, message: 'Please provide a message.' });
    } else if (messageInput.value.trim().length < 10) {
      errors.push({ field: messageInput, message: 'Message must be at least 10 characters long.' });
    }

    // If validation fails
    if (errors.length > 0) {
      errorBox.textContent = errors.map(err => err.message).join(' ');
      errorBox.hidden = false;

      // Mark individual fields invalid and show field message
      errors.forEach(err => {
        err.field.setAttribute('aria-invalid', 'true');
        const errSpan = document.getElementById(`${err.field.name}-error`);
        if (errSpan) errSpan.textContent = err.message;
      });

      // Focus first erroneous field
      errors[0].field.focus();
      return;
    }

    // Submit state UX
    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Sending...';

    try {
      // Example backend transmission (replace with your endpoint)
      const response = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameInput.value.trim(),
          email: emailInput.value.trim(),
          message: messageInput.value.trim()
        })
      });

      if (!response.ok) throw new Error('Network error or server rejected submission');

      form.reset();
      if (successBox) {
        successBox.textContent = 'Thank you! Your message has been sent successfully.';
        successBox.hidden = false;
      }
    } catch (err) {
      errorBox.textContent = 'Unable to send message right now. Please try again later.';
      errorBox.hidden = false;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
});
```

---

## 5. File Upload Handling: Client-Side UX vs Server Security

When implementing file uploads, apply this multi-layered defense model:

### 5.1 Client-Side UX Helper (Instant Feedback)

```javascript
// File Upload UX Layer
const fileInput = document.querySelector('#file-upload');
const uploadStatus = document.querySelector('#upload-status');

if (fileInput) {
  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;

    const MAX_SIZE = 5 * 1024 * 1024; // 5 Megabytes
    const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

    if (file.size > MAX_SIZE) {
      showUploadError('The selected file exceeds 5 MB. Please select a smaller file.');
      fileInput.value = '';
      return;
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      showUploadError('Only JPEG, PNG, and PDF files are permitted.');
      fileInput.value = '';
      return;
    }

    clearUploadError();
  });
}

function showUploadError(msg) {
  if (uploadStatus) {
    uploadStatus.textContent = msg;
    uploadStatus.hidden = false;
    uploadStatus.setAttribute('role', 'alert');
  }
}

function clearUploadError() {
  if (uploadStatus) {
    uploadStatus.hidden = true;
    uploadStatus.textContent = '';
  }
}
```

### 5.2 Server-Side Mandatory Security Requirements
Client-side checks are trivially bypassed using cURL or API tools. The backend server must enforce:
1. **Magic Bytes Validation**: Check the binary signature of the file buffer (e.g., via `file-type` in Node.js) rather than trusting the user-supplied `Content-Type` header or file extension.
2. **Strict Size Limits**: Enforce maximum payload limits in both reverse proxy (`client_max_body_size 5M;` in Nginx) and application server middleware.
3. **Storage Outside Web Root**: Store uploaded files in an isolated directory outside the public web root (e.g., `/var/app/uploads/` or an S3-compatible private object store).
4. **Filename Sanitization**: Generate random UUID filenames (`uuidv4() + extension`) rather than using the original user filename to prevent path traversal (`../../etc/passwd`) and remote code execution (`shell.php`).
5. **Execution Denial**: Ensure the upload directory does not permit script execution (`noexec` mount or Nginx rules denying PHP/Node/Python execution).

---

## 6. Comprehensive Defense-in-Depth Security

### 6.1 Content Security Policy (CSP) & HTTP Headers

For static hosting environments or Nginx reverse proxies, configure strict HTTP headers:

```nginx
# /etc/nginx/conf.d/site.conf
server {
    listen 443 ssl http2;
    server_name my-site.local;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    root /var/www/my-local-site;
    index index.html;

    # Defense-in-Depth Security Headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()" always;

    # Content Security Policy (Adjust domains as required)
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none';" always;

    # Custom Error Pages
    error_page 404 /404.html;
    error_page 500 502 503 504 /500.html;

    location = /404.html {
        internal;
    }

    location = /500.html {
        internal;
    }

    # Restrict hidden files (.git, .env)
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
```

### 6.2 Server-Side Input Sanitization & Parameterized Queries
If you extend the application with a Node.js / Express backend:
- **Zod Schema Validation**:
  ```typescript
  import { z } from 'zod';

  export const ContactSchema = z.object({
    name: z.string().trim().min(1, 'Name is required').max(100),
    email: z.string().trim().email('Invalid email address').max(255),
    message: z.string().trim().min(10, 'Message must be at least 10 characters').max(2000)
  });
  ```
- **Parameterized SQL Queries**: Never concatenate inputs into queries:
  ```typescript
  // CORRECT: Parameterized query (SQLite / Postgres)
  const stmt = db.prepare('INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)');
  stmt.run(data.name, data.email, data.message);

  // WRONG (Vulnerable to SQL Injection):
  // db.run(`INSERT INTO contacts VALUES ('${data.name}', '${data.email}')`);
  ```
- **Cookie Security**:
  ```javascript
  res.cookie('session_id', token, {
    httpOnly: true,     // Prevents JavaScript access (mitigates XSS)
    secure: true,       // Enforces HTTPS transmission
    sameSite: 'strict', // Mitigates CSRF
    maxAge: 3600000     // 1 hour
  });
  ```

---

## 7. Responsive & Accessible CSS Architecture

### 7.1 Modern CSS Rules (`css/style.css`)

```css
/* Custom Properties & Design Tokens */
:root {
  --font-family-base: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --color-bg: #f8fafc;
  --color-surface: #ffffff;
  --color-text: #0f172a;
  --color-text-muted: #64748b;
  --color-primary: #1d4ed8;
  --color-primary-hover: #1e40af;
  --color-error: #b91c1c;
  --color-error-bg: #fef2f2;
  --color-success: #15803d;
  --color-success-bg: #f0fdf4;
  --border-radius: 8px;
  --max-width: 1200px;
}

/* CSS Reset & Defaults */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--font-family-base);
  background-color: var(--color-bg);
  color: var(--color-text);
  line-height: 1.6;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Accessible Skip Link */
.skip-link {
  position: absolute;
  top: -100px;
  left: 1rem;
  background: var(--color-primary);
  color: #fff;
  padding: 0.75rem 1.25rem;
  z-index: 9999;
  border-radius: var(--border-radius);
  text-decoration: none;
  font-weight: 600;
  transition: top 0.2s ease;
}
.skip-link:focus {
  top: 1rem;
  outline: 3px solid #000;
}

/* Container */
.container {
  width: 100%;
  max-width: var(--max-width);
  margin-inline: auto;
  padding-inline: 1.5rem;
}

/* Site Layout */
.site-header {
  background: var(--color-surface);
  border-bottom: 1px solid #e2e8f0;
  padding-block: 1rem;
}

.header-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-list {
  display: flex;
  list-style: none;
  gap: 1.5rem;
}

.nav-list a {
  color: var(--color-text);
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem;
  border-radius: 4px;
}

.nav-list a:hover,
.nav-list a[aria-current="page"] {
  color: var(--color-primary);
}

.site-main {
  flex: 1;
  padding-block: 3rem;
}

/* Form Styling & Accessible Focus */
.form-container {
  max-width: 600px;
}

.form-group {
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
}

label {
  font-weight: 600;
  margin-bottom: 0.35rem;
  display: block;
}

input, textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: var(--border-radius);
  font-family: inherit;
  font-size: 1rem;
  background-color: var(--color-surface);
}

input:focus-visible, textarea:focus-visible, button:focus-visible {
  outline: 3px solid var(--color-primary);
  outline-offset: 2px;
}

input[aria-invalid="true"], textarea[aria-invalid="true"] {
  border-color: var(--color-error);
  background-color: var(--color-error-bg);
}

.field-error {
  color: var(--color-error);
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.alert-box {
  padding: 1rem;
  border-radius: var(--border-radius);
  margin-bottom: 1.5rem;
  font-weight: 500;
}
.alert-box.error {
  background-color: var(--color-error-bg);
  color: var(--color-error);
  border: 1px solid #fca5a5;
}
.alert-box.success {
  background-color: var(--color-success-bg);
  color: var(--color-success);
  border: 1px solid #86efac;
}

/* Minimum Tap Target Height */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  min-width: 44px;
  padding: 0.75rem 1.5rem;
  border-radius: var(--border-radius);
  border: none;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
}
.btn-primary {
  background-color: var(--color-primary);
  color: #fff;
}
.btn-primary:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Site Footer */
.site-footer {
  background: var(--color-surface);
  border-top: 1px solid #e2e8f0;
  padding-block: 2rem;
  text-align: center;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}
```

---

## 8. SEO, Metadata & Discovery

### 8.1 `robots.txt`
```text
User-agent: *
Allow: /

Sitemap: https://my-site.local/sitemap.xml
```

### 8.2 `sitemap.xml`
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://my-site.local/</loc>
    <lastmod>2026-03-01</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://my-site.local/contact.html</loc>
    <lastmod>2026-03-01</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://my-site.local/privacy.html</loc>
    <lastmod>2026-03-01</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://my-site.local/terms.html</loc>
    <lastmod>2026-03-01</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>
```

---

## 9. Automated Backups & System Maintenance

### 9.1 Daily Automated Backup Script (`backup.sh`)

```bash
#!/usr/bin/env bash
set -euo pipefail

# Configuration
BACKUP_SRC="/var/www/my-local-site"
BACKUP_DEST="/var/backups/my-local-site"
TIMESTAMP="$(date +'%Y%m%d_%H%M%S')"
ARCHIVE_NAME="site_backup_${TIMESTAMP}.tar.gz"
RETENTION_DAYS=30

mkdir -p "${BACKUP_DEST}"

# Archive web files and configuration
tar --exclude="${BACKUP_SRC}/.git" \
    --exclude="${BACKUP_SRC}/node_modules" \
    -czf "${BACKUP_DEST}/${ARCHIVE_NAME}" \
    -C "$(dirname "${BACKUP_SRC}")" "$(basename "${BACKUP_SRC}")"

echo "[SUCCESS] Backup created at: ${BACKUP_DEST}/${ARCHIVE_NAME}"

# Purge backups older than RETENTION_DAYS
find "${BACKUP_DEST}" -name "site_backup_*.tar.gz" -mtime +"${RETENTION_DAYS}" -delete
echo "[SUCCESS] Purged archives older than ${RETENTION_DAYS} days."
```

Configure daily cron job (`crontab -e`):
```cron
0 2 * * * /usr/local/bin/backup.sh >> /var/log/backup.log 2>&1
```

---

## 10. Pre-Launch Verification Checklist

Execute this checklist before deploying to production:

- [ ] **Security Headers**: Verify `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and `Strict-Transport-Security` via `curl -I https://my-site.local/`.
- [ ] **Secret Audit**: Confirm zero secrets, API keys, or database credentials exist in git history or client bundles.
- [ ] **Form Validation**: Test submit behavior with empty values, malformed emails, and character limits; verify screen reader announcements (`role="alert"`).
- [ ] **Mobile & Responsive**: Test viewports at 360px, 768px, 1024px, and 1440px with no horizontal overflow.
- [ ] **Accessibility (a11y)**:
  - Color contrast ratio >= 4.5:1 for normal text and >= 3:1 for large text.
  - Visible keyboard focus rings (`:focus-visible`) on all interactive controls.
  - Skip link functions properly on initial Tab press.
  - Form controls have associated `<label>` tags.
- [ ] **SEO & Metadata**: Validate `sitemap.xml`, `robots.txt`, canonical URLs, and Open Graph tags.
- [ ] **Error Pages**: Verify custom `404.html` and `500.html` return proper HTTP status codes.
- [ ] **Performance**: Ensure Google Lighthouse scores >= 90 across Performance, Accessibility, Best Practices, and SEO.
