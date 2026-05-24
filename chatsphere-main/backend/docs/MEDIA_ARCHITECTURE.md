# Media Architecture

1) Storage
- Use S3-compatible storage (AWS S3, DigitalOcean Spaces) or Cloudinary for images/videos.
- Store only metadata in DB (`mediaUrl`, `mediaType`, `size`, `width`, `height`, `duration`).

2) Upload flow
- Client uploads to backend which returns a pre-signed URL for direct upload to storage, or upload via backend for small files.
- After upload, backend validates and persists metadata and triggers background processing (thumbnail, transcode).

3) CDN
- Serve media via CDN with short caching policies for thumbnails and long caching for immutable object keys.

4) Processing
- Use background jobs (BullMQ) to transcode videos, generate thumbnails, and create multiple sizes.

5) Security
- Validate MIME types and sizes.
- Generate signed URLs for private media when access control is required.
