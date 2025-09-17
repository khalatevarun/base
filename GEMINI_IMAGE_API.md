# Gemini API Image Editing Endpoints

This document describes the new image editing functionality integrated with Google's Gemini AI API.

## Overview

The Base platform now includes AI-powered image analysis and editing guidance using Google's Gemini API. While Gemini doesn't directly edit images, it provides detailed analysis and professional editing instructions.

## API Endpoints

### 1. Image Analysis

**Endpoint:** `POST /image/analyze`

**Description:** Analyzes an uploaded image using Gemini AI to provide detailed insights about the image content, composition, and characteristics.

**Request:**
```http
POST /image/analyze
Content-Type: multipart/form-data

image: [image file] (jpg, jpeg, png, gif, webp)
```

**Response:**
```json
{
  "success": true,
  "analysis": "Detailed analysis of the image content...",
  "filename": "example.jpg",
  "size": 1024000
}
```

**Example Usage:**
```bash
curl -X POST \
  -F "image=@/path/to/your/image.jpg" \
  http://localhost:3000/image/analyze
```

### 2. Image Edit Instructions

**Endpoint:** `POST /image/edit`

**Description:** Provides detailed editing instructions based on user requirements and image analysis using Gemini AI.

**Request:**
```http
POST /image/edit
Content-Type: multipart/form-data

image: [image file] (jpg, jpeg, png, gif, webp)
instruction: "Description of desired edits"
```

**Response:**
```json
{
  "success": true,
  "description": "Detailed editing instructions and recommendations...",
  "editedImageUrl": null
}
```

**Example Usage:**
```bash
curl -X POST \
  -F "image=@/path/to/your/image.jpg" \
  -F "instruction=Make the sky more dramatic and add warm lighting" \
  http://localhost:3000/image/edit
```

## Configuration

### Environment Variables

Create a `.env` file in the `uploadService` directory with the following variables:

```env
# Cloudflare R2 Configuration (existing)
ACCOUNT_ENDPOINT=your_cloudflare_r2_endpoint
ACCOUNT_ACCESS_ID=your_access_key_id
ACCOUNT_SECRET_KEY=your_secret_access_key

# Google Gemini API Configuration (new)
GEMINI_API_KEY=your_gemini_api_key_here
```

### Getting a Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the API key to your `.env` file

## Frontend Integration

The platform now includes a dedicated Image Editor interface accessible from the main dashboard:

- **Image Upload:** Drag and drop or select image files (up to 10MB)
- **Image Analysis:** Get detailed AI analysis of your images
- **Edit Instructions:** Receive professional editing guidance based on your requirements
- **Intuitive UI:** Clean, modern interface with real-time previews

## File Upload Limits

- **Maximum file size:** 10MB
- **Supported formats:** JPG, JPEG, PNG, GIF, WebP
- **Storage:** Files are processed in memory and not permanently stored

## Error Handling

All endpoints include comprehensive error handling:

```json
{
  "error": "Error message",
  "details": "Detailed error information"
}
```

Common errors:
- Missing image file (400)
- Unsupported file format (400)
- File too large (400)
- Invalid Gemini API key (500)
- API rate limits exceeded (500)

## Technical Implementation

### Key Components

1. **Gemini AI Integration** (`src/utils/gemini.ts`)
   - Image analysis using Gemini 1.5 Flash model
   - Professional editing instruction generation
   - Error handling and API communication

2. **Multer File Upload** 
   - Memory storage for temporary processing
   - File type validation
   - Size limits enforcement

3. **Frontend Image Editor** (`src/ImageEditor.tsx`)
   - React component with file upload
   - Tabbed interface for analysis vs. editing
   - Real-time image preview

### Dependencies Added

```json
{
  "@google/generative-ai": "^0.24.1",
  "multer": "^2.0.2",
  "@types/multer": "^2.0.0"
}
```

## Usage Examples

### 1. Analyze a Portrait Photo
```javascript
const formData = new FormData();
formData.append('image', imageFile);

fetch('/image/analyze', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(data => console.log(data.analysis));
```

### 2. Get Editing Instructions
```javascript
const formData = new FormData();
formData.append('image', imageFile);
formData.append('instruction', 'Make this look more professional for LinkedIn');

fetch('/image/edit', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(data => console.log(data.description));
```

## Future Enhancements

- Integration with actual image editing APIs (like Adobe Photoshop API)
- Batch processing capabilities
- Image generation using Gemini
- Advanced editing features and filters
- Integration with cloud storage for processed images

## Development

### Running the Service

```bash
# Development mode
cd uploadService
npm run dev

# Production mode
npm run build
npm start
```

### Testing the Frontend

```bash
cd frontend
npm run dev
```

The image editor will be available at the main application URL with a dedicated "AI Image Editor" button.