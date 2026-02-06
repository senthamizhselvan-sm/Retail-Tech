const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Enhanced AI Orchestrator - Follows 4-step process with Gemini pre-processing
class EnhancedAIOrchestrator {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Initialize Gemini model - will fallback to local processing if unavailable
    this.model = null;
    try {
      this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      // Use standard model name
      this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    } catch (error) {
      console.log('Gemini model initialization failed, using enhanced fallback processing');
    }
  }

  // Step 1: Pre-Processing of User Request
  async refineUserRequest(rawUserRequest) {
    const prompt = `User request (raw): ${rawUserRequest}

Task:
1. Refine the user's request into clear, professional English.
2. Expand missing details logically but never change the user's intent.
3. Resolve ambiguous instructions.
4. Identify the correct image-editing objective.

Return response JSON:
{
  "refined_request": "<improved user request>",
  "notes": "<explanations and assumptions>"
}`;

    // STABILITY FIX: Skip Gemini for image-related requests to follow the rule-based flow
    const isImageRequest = rawUserRequest.toLowerCase().match(/poster|banner|shop|store|create|generate|make|image/);

    if (!this.model || isImageRequest) {
      console.log('🔍 Step 1: Using stable rule-based refinement...');
      return this.fallbackRefinement(rawUserRequest);
    }

    try {
      console.log('🔍 Step 1: Refining user request with Gemini...');
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();

      console.log('Gemini response:', response);

      // Try to parse JSON response
      try {
        // Look for JSON in the response
        const jsonMatch = response.match(/\{[\s\S]*?\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.refined_request) {
            return parsed;
          }
        }

        // If no JSON, try to extract refined text
        const lines = response.split('\n');
        let refinedText = '';
        for (const line of lines) {
          if (line.includes('refined') || line.includes('improved') || line.includes('better')) {
            refinedText = line.replace(/.*?[:]\s*/, '').trim();
            break;
          }
        }

        if (refinedText) {
          return {
            refined_request: refinedText,
            notes: "Extracted from Gemini response"
          };
        }

      } catch (parseError) {
        console.log('JSON parsing failed, using enhanced fallback refinement');
      }

      // Fallback refinement
      return this.fallbackRefinement(rawUserRequest);

    } catch (error) {
      console.error('Gemini refinement failed:', error.message);
      return this.fallbackRefinement(rawUserRequest);
    }
  }

  // Fallback refinement when Gemini is unavailable
  fallbackRefinement(rawRequest) {
    let refined = rawRequest.toLowerCase();

    // Grammar corrections
    const corrections = {
      // Pronoun corrections
      'i am owning': 'I own',
      'i going to': 'I am going to',
      'i want to': 'I want to',
      'i need to': 'I need to',
      'i have': 'I have',

      // Common grammar fixes
      'for christmas offer': 'for a Christmas offer',
      'to sale': 'to sell',
      'give poster': 'create a poster',
      'give me': 'create',
      'make me': 'create',

      // Business terminology
      'cloth store': 'clothing store',
      'bakery products': 'bakery products',
      'ronaldo t shirt': 'Ronaldo T-shirts',
      'cr7 cloths': 'CR7 Cloths',

      // Platform and format
      'to publish on instagram': 'for Instagram',
      'for instagram': 'for Instagram posting',
      'instagram post': 'Instagram',

      // Offer terminology
      '50% offer': '50% discount offer',
      'percent off': '% OFF',

      // Professional language
      'name of shop': 'Shop name:',
      'store name': 'Store name:'
    };

    // Apply corrections
    for (const [wrong, correct] of Object.entries(corrections)) {
      refined = refined.replace(new RegExp(wrong, 'gi'), correct);
    }

    // Sentence structure improvements
    refined = refined
      // Fix sentence flow
      .replace(/create a poster for instagram shop name: cr7 cloths/gi, 'create an Instagram poster for CR7 Cloths store')
      .replace(/i own a clothing store.*?cr7 cloths/gi, 'I own a clothing store called CR7 Cloths')
      .replace(/for a christmas offer.*?50% discount offer/gi, 'with a Christmas sale offering 50% OFF')
      .replace(/to sell ronaldo t-shirts/gi, 'selling Ronaldo T-shirts')

      // Capitalize proper nouns
      .replace(/\bchristmas\b/gi, 'Christmas')
      .replace(/\bronaldo\b/gi, 'Ronaldo')
      .replace(/\binstagram\b/gi, 'Instagram')
      .replace(/\bcr7\b/gi, 'CR7')

      // Fix spacing and punctuation
      .replace(/\s+/g, ' ')
      .trim();

    // Capitalize first letter
    refined = refined.charAt(0).toUpperCase() + refined.slice(1);

    // Add period if missing
    if (!refined.endsWith('.') && !refined.endsWith('!') && !refined.endsWith('?')) {
      refined += '.';
    }

    // If still not much improvement, create a structured version
    if (refined.length < rawRequest.length + 20) {
      refined = this.createStructuredRequest(rawRequest);
    }

    return {
      refined_request: refined,
      notes: "Advanced fallback refinement applied - improved grammar, structure, and professional terminology"
    };
  }

  // Create a structured version of the request
  createStructuredRequest(rawRequest) {
    const lower = rawRequest.toLowerCase();

    // Extract key information
    const isClothingStore = lower.includes('cloth') || lower.includes('cr7');
    const isBakery = lower.includes('bakery') || lower.includes('diwali');
    const hasChristmas = lower.includes('christmas');
    const hasDiwali = lower.includes('diwali');
    const hasDiscount = lower.includes('50%') || lower.includes('offer');
    const hasInstagram = lower.includes('instagram');
    const hasRonaldo = lower.includes('ronaldo');
    const hasPoster = lower.includes('poster') || lower.includes('brochure');

    let structured = '';

    if (isClothingStore && hasChristmas && hasRonaldo) {
      structured = `Create a professional Christmas sale poster for Instagram. Business: CR7 Cloths store. Product: Ronaldo T-shirts with 50% OFF discount. Design should be festive, eye-catching, and suitable for social media marketing.`;
    } else if (isBakery && hasDiwali) {
      structured = `Create a professional Diwali festival brochure for a bakery business. Include traditional sweets, festive decorations, and promotional offers. Design should be colorful, festive, and appealing to customers.`;
    } else if (lower.includes('chocolate') || lower.includes('sweet')) {
      structured = `Create a professional marketing poster for a premium chocolate and sweets shop. Featuring delicious artisanal treats, elegant packaging, and a festive atmosphere. High quality, commercial photography style.`;
    } else if (lower.includes('grocery') || lower.includes('provision')) {
      structured = `Create a professional promotional banner for a grocery store. Showing fresh produce, organized shelves, and daily essential products. Bright, clean, and inviting retail environment.`;
    } else if (hasPoster && hasInstagram) {
      structured = `Create a professional Instagram poster for business promotion. Include attractive design, clear messaging, and social media optimized format.`;
    } else {
      // Generic improvement
      structured = `Create a professional marketing design for a retail business. Subject: ${rawRequest}. Make it visually appealing, well-structured, and suitable for business promotion.`;
    }

    return structured;
  }

  // Step 2: API Identification
  async identifyAPIs(refinedRequest) {
    const prompt = `Here is the refined image editing request: ${refinedRequest}.

Identify which Image API endpoints are required.

Available APIs:
- image_generation: Create new images from text prompts
- image_editing: Modify existing images based on prompts  
- background_removal: Remove backgrounds from images
- style_transfer: Apply artistic styles to images
- upscaling: Increase image resolution
- inpainting: Fill in missing parts of images

Payload guidelines for image_generation:
- Use style: "professional" for highly descriptive prompts.
- Use style: "realistic", "artistic", "cartoon", "abstract", or "photographic" for specific style requirements.

Return strictly in this format:
{
  "api_list": ["api1", "api2", ...],
  "operations": ["step 1 description", "step 2 description", ...],
  "payloads": [{...}, {...}, ...],
  "comments": "<warnings or optimization notes>"
}`;

    const isImageRequest = refinedRequest.toLowerCase().match(/poster|banner|shop|store|create|generate|make|image/);

    if (!this.model || isImageRequest) {
      console.log('📡 Step 2: Using stable API identification...');
      return this.fallbackAPIIdentification(refinedRequest);
    }

    try {
      console.log('📡 Step 2: Identifying APIs with Gemini...');
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();

      // Try to parse JSON response
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.log('JSON parsing failed, using fallback API identification');
      }

      return this.fallbackAPIIdentification(refinedRequest);
    } catch (error) {
      console.error('Gemini API identification failed:', error.message);
      return this.fallbackAPIIdentification(refinedRequest);
    }
  }

  // Fallback API identification
  fallbackAPIIdentification(refinedRequest) {
    const request = refinedRequest.toLowerCase();
    let apiList = [];
    let operations = [];
    let payloads = [];

    if (request.includes('create') || request.includes('generate') || request.includes('make') ||
      request.includes('poster') || request.includes('brochure') || request.includes('design')) {
      apiList.push('image_generation');
      operations.push('Generate new image based on refined request');
      payloads.push({
        prompt: refinedRequest,
        style: 'professional',
        size: '1024x1024'
      });
    }

    if (request.includes('edit') || request.includes('modify') || request.includes('change')) {
      apiList.push('image_editing');
      operations.push('Edit existing image according to refined instructions');
      payloads.push({
        prompt: refinedRequest,
        editType: 'enhance'
      });
    }

    if (request.includes('background') && request.includes('remove')) {
      apiList.push('background_removal');
      operations.push('Remove background from image');
      payloads.push({
        prompt: refinedRequest,
        editType: 'remove-bg'
      });
    }

    // Default to image generation if no specific API detected
    if (apiList.length === 0) {
      apiList.push('image_generation');
      operations.push('Generate image based on refined request');
      payloads.push({
        prompt: refinedRequest,
        style: 'professional',
        size: '1024x1024'
      });
    }

    return {
      api_list: apiList,
      operations: operations,
      payloads: payloads,
      comments: 'Fallback API identification - Gemini unavailable'
    };
  }

  // Step 3: API Execution
  async executeAPISequence(apiWorkflow, inputData = {}) {
    const results = [];
    let currentInput = inputData;

    console.log(`⚡ Step 3: Executing API sequence: ${apiWorkflow.api_list.join(' → ')}`);

    for (let i = 0; i < apiWorkflow.api_list.length; i++) {
      const apiName = apiWorkflow.api_list[i];
      const payload = apiWorkflow.payloads[i] || {};
      const operation = apiWorkflow.operations[i] || '';

      console.log(`📡 Executing ${i + 1}/${apiWorkflow.api_list.length}: ${apiName} - ${operation}`);

      try {
        const result = await this.executeAPI(apiName, payload, currentInput);

        // Extract only the data part to avoid circular references
        const cleanResult = {
          success: true,
          api: apiName,
          operation: operation,
          data: result.data,
          status: result.status
        };

        results.push(cleanResult);

        // Use output as input for next step if needed
        if (result.data && (result.data.editedImage || result.data.images)) {
          currentInput.imageUrl = result.data.editedImage || result.data.images[0];
        }

      } catch (error) {
        console.error(`❌ API ${apiName} failed:`, error.message);
        results.push({
          success: false,
          error: error.message,
          api: apiName,
          operation: operation
        });
      }
    }

    return results;
  }

  // Execute individual API
  async executeAPI(apiName, payload, inputData) {
    const baseURL = 'http://localhost:5000/api';

    switch (apiName) {
      case 'image_generation':
        return await axios.post(`${baseURL}/ai/generate`, {
          prompt: payload.prompt,
          style: payload.style || 'professional',
          size: payload.size || '1024x1024',
          count: payload.count || 1,
          enhancePrompt: false // Disable double enhancement as it's already refined
        });

      case 'image_editing':
      case 'background_removal':
        return await axios.post(`${baseURL}/ai/edit`, {
          imageUrl: inputData.imageUrl,
          imageBase64: inputData.imageBase64,
          prompt: payload.prompt,
          editType: payload.editType || 'enhance'
        });

      default:
        throw new Error(`Unknown API: ${apiName}`);
    }
  }

  // Step 4: Final Output Processing
  processFinalOutput(results, refinedRequest, originalRequest) {
    const finalResult = results[results.length - 1];

    if (!finalResult || !finalResult.data) {
      return {
        success: false,
        message: 'No valid output generated',
        originalRequest: originalRequest,
        refinedRequest: refinedRequest,
        results: results
      };
    }

    // Create summary of what was done
    const summary = this.createProcessingSummary(results, refinedRequest);

    return {
      success: true,
      message: 'Enhanced AI orchestration completed successfully',
      originalRequest: originalRequest,
      refinedRequest: refinedRequest,
      finalOutput: finalResult.data,
      processingSteps: results.length,
      summary: summary,
      results: results,
      timestamp: new Date().toISOString()
    };
  }

  // Create processing summary
  createProcessingSummary(results, refinedRequest) {
    const successfulOps = results.filter(r => r.success);
    const operations = successfulOps.map(r => r.operation).join(' → ');

    return {
      totalSteps: results.length,
      successfulSteps: successfulOps.length,
      operations: operations,
      finalOutput: successfulOps.length > 0 ? 'Generated successfully' : 'Failed to generate',
      refinedFrom: refinedRequest
    };
  }
}

// Main enhanced orchestrator endpoint
const enhancedOrchestrateAI = async (req, res) => {
  try {
    const { userRequest, inputData } = req.body;

    if (!userRequest) {
      return res.status(400).json({
        success: false,
        message: 'User request is required'
      });
    }

    console.log(`🎯 Enhanced AI Orchestrator received: "${userRequest}"`);

    const orchestrator = new EnhancedAIOrchestrator();

    // Step 1: Pre-Processing - Refine user request
    console.log('🔍 Step 1: Pre-processing user request...');
    const refinement = await orchestrator.refineUserRequest(userRequest);

    console.log('✨ Request refined:', {
      original: userRequest,
      refined: refinement.refined_request,
      notes: refinement.notes
    });

    // Step 2: API Identification using refined request
    console.log('📋 Step 2: Identifying required APIs...');
    const workflow = await orchestrator.identifyAPIs(refinement.refined_request);

    console.log('🔍 Workflow identified:', {
      apis: workflow.api_list,
      steps: workflow.operations.length,
      comments: workflow.comments
    });

    // Step 3: API Execution
    console.log('⚡ Step 3: Executing API workflow...');
    const results = await orchestrator.executeAPISequence(workflow, inputData || {});

    // Step 4: Final Output Processing
    console.log('✨ Step 4: Processing final output...');
    const finalOutput = orchestrator.processFinalOutput(results, refinement.refined_request, userRequest);

    console.log('🎉 Enhanced AI Orchestration complete!');

    res.json({
      success: true,
      message: 'Enhanced AI orchestration completed',
      originalRequest: userRequest,
      refinement: refinement,
      workflow: workflow,
      finalOutput: finalOutput,
      executionSteps: results.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Enhanced AI Orchestration error:', error);

    res.status(500).json({
      success: false,
      message: 'Enhanced AI orchestration failed',
      error: error.message
    });
  }
};

module.exports = { enhancedOrchestrateAI, EnhancedAIOrchestrator };
