---
name: bkend-storage
description: |
  bkend.ai file storage expert skill.
  Covers single/multiple/multipart file upload via Presigned URL,
  file download (CDN vs Presigned), 4 visibility levels (public/private/protected/shared),
  bucket management, and file metadata.

  Triggers: file upload, download, presigned, bucket, storage, CDN, image,
  파일 업로드, 다운로드, 버킷, 스토리지, 이미지,
  ファイルアップロード, ダウンロード, バケット, ストレージ,
  文件上传, 下载, 存储桶, 存储,
  carga de archivos, descarga, almacenamiento, cubo,
  telechargement, televersement, stockage, seau,
  Datei-Upload, Download, Speicher, Bucket,
  caricamento file, download, archiviazione, bucket

  Do NOT use for: authentication (use bkend-auth), database queries (use bkend-data),
  MCP setup (use bkend-mcp)

user-invocable: true
argument-hint: ""

allowed-tools:
  - read_file
  - write_file
  - replace
  - glob
  - grep_search
  - run_shell_command
  - web_fetch

imports: []

agents:
  backend: bkend-expert

context: session
memory: project
pdca-phase: all
---

# bkend-storage: File Storage Expert Skill

> Complete file storage management for bkend.ai projects using S3-based Presigned URLs

## 1. Overview

bkend.ai provides a fully managed file storage service built on **S3-compatible object storage** with a **Presigned URL** upload pattern and **CDN** delivery for public files.

Key characteristics:

- **S3-based storage** with Presigned URL upload pattern
- **CDN delivery** for public file access
- **4 visibility levels**: public, private, protected, shared
- **Multipart upload** support for large files
- **File metadata** management via REST API

> **IMPORTANT**: There are no MCP tools for storage operations. All file storage interactions use the **REST API only**.

## 2. Single File Upload (3-Step Pattern)

Every file upload follows a strict 3-step process: get a presigned URL, upload the file binary, then register the metadata.

### Step 1: Request a Presigned URL

```http
POST /v1/files/presigned-url
Content-Type: application/json

{
  "fileName": "profile-photo.jpg",
  "contentType": "image/jpeg",
  "visibility": "public",
  "tableName": "users",
  "recordId": "rec_abc123"
}
```

- `fileName` (required): Original file name
- `contentType` (required): MIME type of the file
- `visibility` (required): One of `public`, `private`, `protected`, `shared`
- `tableName` (optional): Associate file with a specific table
- `recordId` (optional): Associate file with a specific record

Response:

```json
{
  "success": true,
  "data": {
    "presignedUrl": "https://s3.amazonaws.com/bucket/...",
    "fileKey": "projects/proj_001/files/abc123/profile-photo.jpg"
  }
}
```

### Step 2: Upload File Binary to Presigned URL

```http
PUT {presignedUrl}
Content-Type: image/jpeg

<file binary data>
```

Upload the raw file binary directly to the presigned URL returned in Step 1. The `Content-Type` header must match the `contentType` from Step 1.

### Step 3: Register File Metadata

```http
POST /v1/files
Content-Type: application/json

{
  "fileKey": "projects/proj_001/files/abc123/profile-photo.jpg",
  "fileName": "profile-photo.jpg",
  "contentType": "image/jpeg",
  "size": 245678,
  "visibility": "public"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "file_xyz789",
    "fileKey": "projects/proj_001/files/abc123/profile-photo.jpg",
    "fileName": "profile-photo.jpg",
    "contentType": "image/jpeg",
    "size": 245678,
    "visibility": "public",
    "url": "https://cdn.bkend.ai/projects/proj_001/files/abc123/profile-photo.jpg",
    "createdBy": "usr_abc",
    "createdAt": "2025-01-15T09:30:00Z"
  }
}
```

## 3. Multiple File Upload

For uploading multiple files, follow the same 3-step pattern for each file. Use the batch endpoint to request multiple presigned URLs at once:

```http
POST /v1/files/presigned-urls
Content-Type: application/json

{
  "files": [
    {
      "fileName": "photo-1.jpg",
      "contentType": "image/jpeg",
      "visibility": "public"
    },
    {
      "fileName": "photo-2.png",
      "contentType": "image/png",
      "visibility": "public"
    },
    {
      "fileName": "document.pdf",
      "contentType": "application/pdf",
      "visibility": "private"
    }
  ]
}
```

Response:

```json
{
  "success": true,
  "data": [
    {
      "fileName": "photo-1.jpg",
      "presignedUrl": "https://s3.amazonaws.com/...",
      "fileKey": "projects/proj_001/files/abc/photo-1.jpg"
    },
    {
      "fileName": "photo-2.png",
      "presignedUrl": "https://s3.amazonaws.com/...",
      "fileKey": "projects/proj_001/files/def/photo-2.png"
    },
    {
      "fileName": "document.pdf",
      "presignedUrl": "https://s3.amazonaws.com/...",
      "fileKey": "projects/proj_001/files/ghi/document.pdf"
    }
  ]
}
```

Then upload each file binary to its presigned URL (Step 2) and register each file's metadata (Step 3).

## 4. Multipart Upload (Large Files)

For large files, use multipart upload to split the file into smaller parts and upload them individually.

### 4.1 Initialize Multipart Upload

```http
POST /v1/files/multipart/init
Content-Type: application/json

{
  "fileName": "large-video.mp4",
  "contentType": "video/mp4",
  "visibility": "private"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "uploadId": "upload_abc123",
    "fileKey": "projects/proj_001/files/xyz/large-video.mp4"
  }
}
```

### 4.2 Get Presigned URL for Each Part

```http
POST /v1/files/multipart/presigned-url
Content-Type: application/json

{
  "uploadId": "upload_abc123",
  "fileKey": "projects/proj_001/files/xyz/large-video.mp4",
  "partNumber": 1
}
```

Response:

```json
{
  "success": true,
  "data": {
    "presignedUrl": "https://s3.amazonaws.com/...",
    "partNumber": 1
  }
}
```

### 4.3 Upload Each Part

```http
PUT {presignedUrl}
Content-Type: application/octet-stream

<part binary data>
```

The response includes an `ETag` header that must be saved for the completion step.

### 4.4 Complete Multipart Upload

After all parts are uploaded, finalize the upload:

```http
POST /v1/files/multipart/complete
Content-Type: application/json

{
  "uploadId": "upload_abc123",
  "fileKey": "projects/proj_001/files/xyz/large-video.mp4",
  "parts": [
    { "partNumber": 1, "etag": "\"abc123\"" },
    { "partNumber": 2, "etag": "\"def456\"" },
    { "partNumber": 3, "etag": "\"ghi789\"" }
  ]
}
```

### 4.5 Abort Multipart Upload

Cancel an in-progress multipart upload:

```http
POST /v1/files/multipart/abort
Content-Type: application/json

{
  "uploadId": "upload_abc123",
  "fileKey": "projects/proj_001/files/xyz/large-video.mp4"
}
```

## 5. File Download

### 5.1 CDN Download (Public Files)

Public files are served via CDN for fast global delivery:

```
GET https://cdn.bkend.ai/{fileKey}
```

Example:

```
GET https://cdn.bkend.ai/projects/proj_001/files/abc123/profile-photo.jpg
```

No authentication is required for public CDN URLs.

### 5.2 Presigned Download (Private Files)

Private, protected, and shared files require a presigned download URL:

```http
GET /v1/files/{fileId}/download
```

Response:

```json
{
  "success": true,
  "data": {
    "downloadUrl": "https://s3.amazonaws.com/...?X-Amz-Signature=...",
    "expiresIn": 3600
  }
}
```

The presigned download URL is temporary and expires after the specified `expiresIn` duration (in seconds).

## 6. Visibility Levels

bkend.ai supports 4 visibility levels that control who can access uploaded files:

| Visibility | Access | CDN Available | Description |
|------------|--------|---------------|-------------|
| `public` | Anyone | Yes | Accessible to everyone via CDN URL. No authentication required. |
| `private` | Owner only | No | Only the file owner (uploader) can access via presigned download. |
| `protected` | Authenticated users | No | Any authenticated user in the project can access via presigned download. |
| `shared` | Specified users | No | Only users explicitly granted access can download via presigned URL. |

Choosing the right visibility:

- **`public`**: Profile pictures, product images, public assets
- **`private`**: Personal documents, private exports, user-specific files
- **`protected`**: Internal team documents, shared project resources
- **`shared`**: Files shared with specific collaborators

## 7. File Metadata Management

### 7.1 Get File Metadata

```http
GET /v1/files/:fileId
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "file_xyz789",
    "fileKey": "projects/proj_001/files/abc123/profile-photo.jpg",
    "fileName": "profile-photo.jpg",
    "contentType": "image/jpeg",
    "size": 245678,
    "visibility": "public",
    "url": "https://cdn.bkend.ai/projects/proj_001/files/abc123/profile-photo.jpg",
    "tableName": "users",
    "recordId": "rec_abc123",
    "createdBy": "usr_abc",
    "createdAt": "2025-01-15T09:30:00Z",
    "updatedAt": "2025-01-15T09:30:00Z"
  }
}
```

### 7.2 Update File Metadata

```http
PUT /v1/files/:fileId
Content-Type: application/json

{
  "fileName": "new-file-name.jpg",
  "visibility": "private"
}
```

### 7.3 Delete File

```http
DELETE /v1/files/:fileId
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "file_xyz789",
    "deleted": true
  }
}
```

### 7.4 List Files

```http
GET /v1/files?tableName=users&recordId=rec_abc123&visibility=public&limit=20&cursor=file_last_id
```

Query parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| `tableName` | string | Filter by associated table |
| `recordId` | string | Filter by associated record |
| `visibility` | string | Filter by visibility level |
| `limit` | int | Number of results (max 100) |
| `cursor` | string | Cursor for pagination |

## 8. Frontend Upload Pattern

Use the 3-step pattern with `bkendFetch` in your frontend code:

```typescript
// lib/storage.ts
import { bkendFetch } from '@/lib/bkend';

interface UploadOptions {
  fileName: string;
  contentType: string;
  visibility: 'public' | 'private' | 'protected' | 'shared';
  tableName?: string;
  recordId?: string;
}

export async function uploadFile(file: File, options: UploadOptions) {
  // Step 1: Get presigned URL
  const presignedRes = await bkendFetch('/v1/files/presigned-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: options.fileName,
      contentType: options.contentType,
      visibility: options.visibility,
      tableName: options.tableName,
      recordId: options.recordId,
    }),
  });
  const { presignedUrl, fileKey } = (await presignedRes.json()).data;

  // Step 2: Upload file binary to presigned URL
  await fetch(presignedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': options.contentType },
    body: file,
  });

  // Step 3: Register file metadata
  const registerRes = await bkendFetch('/v1/files', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileKey,
      fileName: options.fileName,
      contentType: options.contentType,
      size: file.size,
      visibility: options.visibility,
    }),
  });
  const registeredFile = (await registerRes.json()).data;

  return registeredFile;
}

// Usage
const file = document.querySelector<HTMLInputElement>('#file-input')?.files?.[0];
if (file) {
  const result = await uploadFile(file, {
    fileName: file.name,
    contentType: file.type,
    visibility: 'public',
    tableName: 'users',
    recordId: 'rec_abc123',
  });
  console.log('Uploaded:', result.url);
}
```

## 9. Image Upload with Preview (React Component)

```tsx
// components/ImageUpload.tsx
'use client';

import { useState, useCallback } from 'react';
import { uploadFile } from '@/lib/storage';

interface ImageUploadProps {
  onUpload: (fileData: { id: string; url: string; fileName: string }) => void;
  visibility?: 'public' | 'private' | 'protected' | 'shared';
  tableName?: string;
  recordId?: string;
}

export function ImageUpload({
  onUpload,
  visibility = 'public',
  tableName,
  recordId,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      // Show preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload
      setUploading(true);
      setError(null);

      try {
        const result = await uploadFile(file, {
          fileName: file.name,
          contentType: file.type,
          visibility,
          tableName,
          recordId,
        });

        onUpload({
          id: result.id,
          url: result.url,
          fileName: result.fileName,
        });
      } catch (err) {
        setError('Upload failed. Please try again.');
        setPreview(null);
      } finally {
        setUploading(false);
      }
    },
    [visibility, tableName, recordId, onUpload]
  );

  return (
    <div className="image-upload">
      <label className="upload-label">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
        />
        {preview ? (
          <img src={preview} alt="Preview" className="upload-preview" />
        ) : (
          <div className="upload-placeholder">
            <span>Click to upload image</span>
          </div>
        )}
      </label>

      {uploading && <p className="upload-status">Uploading...</p>}
      {error && <p className="upload-error">{error}</p>}
    </div>
  );
}
```

## 10. Error Codes

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `FILE_TOO_LARGE` | 413 | File exceeds the maximum allowed size |
| `INVALID_FILE_TYPE` | 400 | The file MIME type is not allowed |
| `PRESIGNED_URL_EXPIRED` | 400 | The presigned URL has expired before upload completed |
| `FILE_NOT_FOUND` | 404 | The specified file ID does not exist |

Error response format:

```json
{
  "success": false,
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "File size exceeds the maximum limit of 100MB",
    "details": {
      "maxSize": 104857600,
      "actualSize": 157286400
    }
  }
}
```

## Quick Reference

### Common Workflows

1. **Upload a single file** -> 3-step: presigned URL, PUT binary, register metadata
2. **Upload multiple files** -> Batch presigned URLs, then Step 2 & 3 for each
3. **Upload large files** -> Multipart: init, get part URLs, upload parts, complete
4. **Access public files** -> CDN URL: `https://cdn.bkend.ai/{fileKey}`
5. **Access private files** -> Presigned download: `GET /v1/files/{fileId}/download`
6. **Update file visibility** -> `PUT /v1/files/:fileId` with new visibility
7. **Delete a file** -> `DELETE /v1/files/:fileId`
8. **List files for a record** -> `GET /v1/files?tableName=x&recordId=y`
