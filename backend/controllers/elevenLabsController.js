const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../config/logger');

/**
 * Get a signed URL from Eleven Labs API
 * GET /api/get-signed-url
 */
exports.getSignedUrl = asyncHandler(async (req, res, next) => {
    try {
        // Validate required environment variables
        if (!process.env.ELEVENLABS_API_KEY) {
            throw new ApiError('Eleven Labs API key is not configured', 500);
        }
        
        if (!process.env.AGENT_ID) {
            throw new ApiError('Eleven Labs Agent ID is not configured', 500);
        }
        
        // Fetch signed URL from Eleven Labs API
        const response = await fetch(
            `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${process.env.AGENT_ID}`,
            {
                headers: {
                    "xi-api-key": process.env.ELEVENLABS_API_KEY,
                },
            }
        );

        // Handle API errors
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            logger.error('Eleven Labs API error:', {
                status: response.status,
                statusText: response.statusText,
                errorData
            });
            
            throw new ApiError(`Failed to get signed URL: ${response.statusText}`, response.status);
        }

        // Parse and return successful response
        const data = await response.json();
        
        if (!data.signed_url) {
            throw new ApiError('No signed URL in the response', 500);
        }
        
        logger.info('Signed URL obtained successfully');
        
        res.status(200).json({
            status: 'success',
            data: {
                signedUrl: data.signed_url,
                expiresAt: data.expires_at || null,
                agentId: process.env.AGENT_ID
            }
        });
    } catch (error) {
        if (error instanceof ApiError) {
            return next(error);
        }
        
        logger.error('Error in get-signed-url endpoint:', error);
        return next(new ApiError('Failed to generate signed URL', 500));
    }
});

/**
 * Handle webhook from Eleven Labs
 * POST /api/elevenlabs/webhook
 */
exports.handleWebhook = asyncHandler(async (req, res, next) => {
    try {
        // Validate webhook payload
        const { event_type, conversation_id, agent_id, user_id, timestamp } = req.body;
        
        if (!event_type || !conversation_id) {
            throw new ApiError('Invalid webhook payload', 400);
        }
        
        // Log webhook event
        logger.info('Eleven Labs webhook received:', { 
            event_type, 
            conversation_id,
            agent_id,
            timestamp: timestamp || new Date().toISOString()
        });
        
        // Process different event types
        switch (event_type) {
            case 'conversation.started':
                // Handle conversation start
                // You might want to create a call record here
                break;
                
            case 'conversation.ended':
                // Handle conversation end
                // You might want to update a call record here
                break;
                
            default:
                logger.info(`Unhandled webhook event type: ${event_type}`);
        }
        
        // Always return success to Eleven Labs
        res.status(200).json({
            status: 'success',
            message: 'Webhook received'
        });
    } catch (error) {
        logger.error('Error processing Eleven Labs webhook:', error);
        
        // Always return 200 for webhooks even on error
        // This prevents Eleven Labs from retrying
        res.status(200).json({
            status: 'error',
            message: 'Webhook processed with errors'
        });
    }
});

/**
 * Test connection to Eleven Labs API
 * GET /api/elevenlabs/test-connection
 */
exports.testConnection = asyncHandler(async (req, res, next) => {
    try {
        // Attempt to call a simple Eleven Labs API endpoint
        const response = await fetch(
            'https://api.elevenlabs.io/v1/user',
            {
                headers: {
                    "xi-api-key": process.env.ELEVENLABS_API_KEY,
                },
            }
        );

        if (!response.ok) {
            throw new ApiError(`Eleven Labs API connection failed: ${response.statusText}`, 500);
        }

        const data = await response.json();
        
        logger.info('Eleven Labs API connection test successful');
        
        res.status(200).json({
            status: 'success',
            message: 'Eleven Labs API connection successful',
            data: {
                subscription: data.subscription || null,
                isConnected: true
            }
        });
    } catch (error) {
        logger.error('Eleven Labs API connection test failed:', error);
        return next(new ApiError('Eleven Labs API connection test failed', 500));
    }
});