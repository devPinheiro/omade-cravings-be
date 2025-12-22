import { Router, Request, Response } from 'express';
import { cloudinary } from '../config/cloudinary';

const router = Router();

interface SignatureRequest {
  upload_preset: string;
  folder: string;
}

interface SignatureResponse {
  signature: string;
  timestamp: number;
  api_key: string;
  upload_preset: string;
  folder: string;
}

/**
 * @swagger
 * /api/cloudinary/sign:
 *   post:
 *     tags: [Cloudinary]
 *     summary: Generate Cloudinary upload signature
 *     description: Generate a signature for secure client-side Cloudinary uploads
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - upload_preset
 *               - folder
 *             properties:
 *               upload_preset:
 *                 type: string
 *                 description: Cloudinary upload preset name
 *                 example: "products"
 *               folder:
 *                 type: string
 *                 description: Cloudinary folder path
 *                 example: "products"
 *     responses:
 *       200:
 *         description: Signature generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 signature:
 *                   type: string
 *                   description: Generated signature hash
 *                   example: "abc123def456ghi789"
 *                 timestamp:
 *                   type: number
 *                   description: Unix timestamp
 *                   example: 1640995200
 *                 api_key:
 *                   type: string
 *                   description: Cloudinary API key
 *                   example: "123456789012345"
 *                 upload_preset:
 *                   type: string
 *                   description: Upload preset name
 *                   example: "products"
 *                 folder:
 *                   type: string
 *                   description: Folder path
 *                   example: "products"
 *       400:
 *         description: Invalid request parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Missing required parameters"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to generate signature"
 */
router.post('/sign', (req: Request<{}, SignatureResponse, SignatureRequest>, res: Response<SignatureResponse | { success: boolean; message: string }>) => {
  try {
    const { upload_preset, folder } = req.body;

    // Validate required parameters
    if (!upload_preset || !folder) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: upload_preset and folder are required'
      });
    }

    // Generate timestamp
    const timestamp = Math.round(Date.now() / 1000);
    
    // Parameters to sign (exclude file and api_key)
    const params = {
      timestamp: timestamp,
      upload_preset: upload_preset,
      folder: folder
    };
    
    // Get API secret from environment
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!apiSecret) {
      return res.status(500).json({
        success: false,
        message: 'Cloudinary API secret not configured'
      });
    }

    // Get API key from environment
    const apiKey = process.env.CLOUDINARY_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: 'Cloudinary API key not configured'
      });
    }
    
    // Create signature using Cloudinary's utility method
    const signature = cloudinary.utils.api_sign_request(params, apiSecret);
    
    // Return signature data
    res.json({
      signature,
      timestamp,
      api_key: apiKey,
      upload_preset,
      folder
    });

  } catch (error) {
    console.error('Cloudinary signature generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate signature'
    });
  }
});

export { router as cloudinaryRoutes };