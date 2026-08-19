# MeaGlow International — Recruitment Website (Static)

This is a simple static website scaffold for MeaGlow International's recruitment services.

Quick start:

1. Open `index.html` in your browser.
2. To edit content, update the HTML files in the project root.

Deploy options:
- Host on GitHub Pages by pushing this folder to a repository and enabling Pages.
- Serve from any static hosting (Netlify, Vercel, S3, etc.).

Next steps you might want me to implement:
- Add a dynamic backend for job submissions and admin UI
- Connect a real contact form endpoint (SMTP or form service)
- Add branding, images and accessibility improvements

Contact
-------

Office: NAIROBI, MFANGANO STREET, INFORMATION HOUSE, 4th FLOOR, ROOM 410

Email: meaglowinternational@gmail.com
Phone: +254 717 837 263 / +254 791 197 115

Map: https://www.google.com/maps/search/?api=1&query=NAIROBI%2C%20MFANGANO%20STREET%2C%20INFORMATION%20HOUSE%2C%204th%20FLOOR%2C%20ROOM%20410

Brand: MeaGlow International — Brighter, Better. Future
Logo: assets/images/logo.jpg

Logo
----

The project includes a placeholder logo at `assets/images/logo.jpg`. Replace it with your branded SVG or PNG (keep the filename or update the header image paths in the HTML files).

Run the admin image uploader (Node.js)
-----------------------------------

1. Install dependencies:

```bash
npm install
```

2. Start the server:

```bash
npm start
```

3. Open the admin UI at: http://localhost:3000/admin

Upload an image and select the target key (e.g. `housekeeping`) — the site will automatically use the uploaded image.

Security note: This admin endpoint is intentionally simple for local use. Add authentication before exposing it publicly.

Deployment (Render / Docker)
----------------------------

Quick steps to deploy on Render (or any container host):

- Create a new GitHub repository and push this project.
- On Render (https://render.com), create a new Web Service, connect your GitHub repo, choose Docker as the environment, and set the build command to `docker build -t meaglow .` and start command to `npm start`.
- Set environment variables on the service: `ADMIN_USER`, `ADMIN_PASS`, and `SESSION_SECRET`.
- IMPORTANT: Make `assets/images/` a persistent disk or use object storage (S3) for uploads. Render's ephemeral filesystem will be lost on redeploy; configure an external storage or mount a persistent disk.

Alternative: Deploy with the provided `Dockerfile` to any container host (DigitalOcean App Platform, Railway, AWS ECS). Ensure `NODE_ENV=production` and provide the environment variables mentioned above.

Custom domain & HTTPS:
- Configure your domain in Render and enable automatic HTTPS. For other hosts, follow their domain/SSL docs.

Notes about uploads:
- For production you must replace the filesystem-based uploads with S3 (or similar). The server code currently writes to `assets/images/` which is suitable for local testing only.


Europe Jobs — Required Documents
--------------------------------

Candidates applying for European positions should prepare the following depending on role:

- All Europe roles: Valid Passport, National ID, Passport-size photos.
- Professional services: Diploma / degree certificates (and translations if needed).
- Germany (skilled workers): ZAB recognition letter where applicable.
- Driver jobs: Valid driving licence for the required vehicle class.
- Homecare / care roles: Training/care certificates and background checks as required.
- Role-specific training or professional licences as listed in job details.



