import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface ImageEditRequest {
    instruction: string;
    imageBuffer: Buffer;
    mimeType: string;
}

export interface ImageEditResponse {
    success: boolean;
    editedImageUrl?: string;
    description?: string;
    error?: string;
}

/**
 * Edit an image using Gemini API
 * Note: Gemini API currently supports image analysis and description generation,
 * but does not directly edit images. This function demonstrates how to analyze
 * images and provide editing instructions that could be used with other image editing services.
 */
export async function editImageWithGemini(request: ImageEditRequest): Promise<ImageEditResponse> {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        // Convert buffer to base64 for Gemini API
        const base64Image = request.imageBuffer.toString('base64');
        
        const imagePart = {
            inlineData: {
                data: base64Image,
                mimeType: request.mimeType,
            },
        };

        // Create a prompt for image analysis and editing suggestions
        const prompt = `Analyze this image and provide detailed editing instructions based on the user's request: "${request.instruction}". 
        Please provide:
        1. Current image analysis
        2. Specific editing steps to achieve the requested changes
        3. Recommended tools or techniques
        4. Expected outcome description
        
        Format your response as a structured guide.`;

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        return {
            success: true,
            description: text,
            editedImageUrl: undefined // Gemini doesn't directly edit images
        };

    } catch (error) {
        console.error('Error editing image with Gemini:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

/**
 * Analyze an image using Gemini API
 */
export async function analyzeImage(imageBuffer: Buffer, mimeType: string): Promise<string> {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const base64Image = imageBuffer.toString('base64');
        
        const imagePart = {
            inlineData: {
                data: base64Image,
                mimeType: mimeType,
            },
        };

        const prompt = "Analyze this image and describe what you see in detail.";

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        return response.text();

    } catch (error) {
        console.error('Error analyzing image with Gemini:', error);
        throw error;
    }
}