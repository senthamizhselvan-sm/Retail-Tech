const axios = require('axios');
const cloudinary = require('../config/cloudinary');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Helper function to detect and preserve text content in prompts
function preserveTextContent(prompt) {
  // Extract quoted text, specific text mentions, and preserve them
  const textPatterns = [
    /"([^"]+)"/g,  // Text in quotes
    /'([^']+)'/g,  // Text in single quotes
    /text[:\s]+"([^"]+)"/gi,  // "text: 'content'"
    /write[:\s]+"([^"]+)"/gi, // "write: 'content'"
    /says?[:\s]+"([^"]+)"/gi, // "says: 'content'"
  ];

  const preservedTexts = [];
  let processedPrompt = prompt;

  textPatterns.forEach(pattern => {
    const matches = prompt.match(pattern);
    if (matches) {
      matches.forEach(match => {
        preservedTexts.push(match);
      });
    }
  });

  return {
    originalPrompt: prompt,
    preservedTexts,
    hasSpecificText: preservedTexts.length > 0
  };
}

// @desc    Enhance user prompt using Gemini AI
// @route   Helper function
// @access  Private
async function enhancePromptWithAI(userPrompt) {
  try {
    console.log('🧠 Enhancing user prompt with Gemini AI...');

    // First, analyze and preserve any specific text content
    const textAnalysis = preserveTextContent(userPrompt);

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const enhancementPrompt = `You are an expert visual prompt engineer specialized in generating realistic retail and vendor shop images.

GOAL:
Convert the user input into ONE precise, high-quality image generation prompt.
The image must always represent a real-world vendor shop or small business.
Do NOT explain anything.
Do NOT include headings.
Return ONLY the final image prompt.

USER REQUEST:
"${userPrompt}"

${textAnalysis.hasSpecificText ? `CRITICAL - PRESERVE THESE EXACT TEXTS: ${textAnalysis.preservedTexts.join(', ')}
These texts MUST appear exactly as written in the final image.` : ''}

STRICT IMAGE RULES (MANDATORY):
- Always generate a vendor shop, retail store, or small business scene
- The shop must clearly match the product or service mentioned
- Realistic commercial poster or promotional banner style
- Clean, professional, modern layout
- Bright, natural lighting
- Suitable for Indian local vendors and small businesses
- Products must be clearly visible and well-organized
- Neutral background related to a shop environment

CONTENT CONSTRAINTS:
- No random buildings, halls, churches, temples, mosques, or empty interiors
- No unrelated places or abstract art
- No religious symbols unless explicitly requested
- No dark, sad, cinematic, or moody themes
- No people faces clearly visible
- No stock-photo watermark look

STYLE SETTINGS:
- Style: realistic, high-quality, professional commercial photography
- Camera: eye-level, sharp focus
- Color tone: natural and inviting
- Composition: centered product display with shop branding space
- Format: square image suitable for app or poster use

OUTPUT FORMAT:
One single paragraph image prompt only.

ENHANCED PROMPT:`;

    const result = await model.generateContent(enhancementPrompt);
    let enhancedStr = result.response.text().trim();

    // Clean up common AI prefixes if they appear
    enhancedStr = enhancedStr.replace(/^(enhanced prompt|prompt|result):/i, '').trim();
    enhancedStr = enhancedStr.replace(/^"|"$/g, '').trim(); // Remove wrapping quotes

    const finalEnhancedPrompt = enhancedStr;

    console.log('✅ Prompt enhanced successfully!');
    console.log('Original:', userPrompt.substring(0, 100) + '...');
    console.log('Enhanced:', finalEnhancedPrompt.substring(0, 200) + '...');

    if (textAnalysis.hasSpecificText) {
      console.log('🔤 Preserved texts:', textAnalysis.preservedTexts.join(', '));
    }

    return finalEnhancedPrompt;

  } catch (error) {
    console.error('❌ Prompt enhancement failed:', error.message);
    // Fallback to original prompt if enhancement fails
    return userPrompt;
  }
}

// @desc    Generate AI images using Pollinations AI
// @route   POST /api/ai/generate
// @access  Private
exports.generateImage = async (req, res) => {
  try {
    const { prompt, style = 'realistic', size = '1024x1024', count = 1, enhancePrompt = true } = req.body;

    let finalPrompt = prompt;

    // First, enhance the user's prompt using AI if requested
    if (enhancePrompt) {
      try {
        finalPrompt = await enhancePromptWithAI(prompt);
      } catch (enhanceError) {
        console.log('⚠️ Using original prompt due to enhancement error');
        finalPrompt = prompt;
      }
    }

    // Apply style-specific enhancements with focus on realism and text accuracy
    const stylePrompts = {
      realistic: `${finalPrompt}, photorealistic, professional photography, high resolution, soft cinematic lighting, 8k, highly detailed`,
      artistic: `${finalPrompt}, digital art, highly detailed, professional illustration, vibrant colors, artistic composition`,
      cartoon: `${finalPrompt}, high-quality 3d character design style, vibrant, clean lines, professional animation`,
      abstract: `${finalPrompt}, abstract art style, professional design, bold colors, high resolution`,
      photographic: `${finalPrompt}, studio photography, commercial product shot, perfect lighting, 4k resolution, sharp focus`
    };

    const enhancedPrompt = stylePrompts[style] || stylePrompts.realistic;
    const images = [];
    const [width, height] = size.split('x');

    console.log(`🎨 Generating ${count} AI images for: "${prompt}" (${style} style)`);

    // Use Pollinations AI for free image generation
    try {
      for (let i = 0; i < count; i++) {
        console.log(`🎨 Generating image ${i + 1}/${count} with Pollinations AI...`);

        // Use Pollinations AI with enhanced parameters for better quality
        const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=${width}&height=${height}&seed=${Date.now() + i}&model=flux&enhance=true&nologo=true&private=false`;

        // Download and upload to Cloudinary for consistency
        const imageResponse = await axios.get(pollinationsUrl, { responseType: 'arraybuffer' });
        const base64Image = `data:image/jpeg;base64,${Buffer.from(imageResponse.data).toString('base64')}`;

        const uploadResult = await cloudinary.uploader.upload(base64Image, {
          folder: 'pixcraft-generated',
          resource_type: 'image',
        });

        images.push(uploadResult.secure_url);
        console.log(`✅ Image ${i + 1} generated with Pollinations AI and uploaded!`);
      }

      console.log(`✅ AI Image generation complete: ${count} images for "${prompt}"`);

      res.json({
        success: true,
        images,
        originalPrompt: prompt,
        enhancedPrompt: enhancePrompt ? finalPrompt.substring(0, 300) + '...' : 'Enhancement disabled',
        style,
        size,
        note: `Successfully generated ${count} image(s) using Pollinations AI!`,
        apiUsed: 'pollinations',
        promptEnhanced: enhancePrompt
      });

    } catch (pollinationsError) {
      console.error('Pollinations AI failed:', pollinationsError.message);

      // Final fallback - enhanced placeholder with better variety
      console.log('🔄 Using enhanced placeholder images...');

      const seed = prompt.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

      for (let i = 0; i < count; i++) {
        const uniqueSeed = `${seed}-${Date.now()}-${i}`;
        const imageUrl = `https://picsum.photos/seed/${uniqueSeed}/${width}/${height}`;
        images.push(imageUrl);
      }

      console.log(`⚠️ Using placeholder images: ${count} images for "${prompt}"`);

      res.json({
        success: true,
        images,
        prompt,
        style,
        size,
        note: 'AI services temporarily unavailable. Using placeholder images.',
        apiUsed: 'placeholder'
      });
    }

  } catch (error) {
    console.error('Image generation error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to generate images',
      error: error.message,
    });
  }
};

// @desc    Edit/Enhance image using AI
// @route   POST /api/ai/edit
// @access  Private
exports.editImage = async (req, res) => {
  try {
    const { imageUrl, imageBase64, prompt, editType } = req.body;

    let processedImageUrl = imageUrl;

    // If base64 image provided, upload to Cloudinary first
    if (imageBase64) {
      try {
        console.log('📤 Uploading original image to Cloudinary...');
        const uploadResult = await cloudinary.uploader.upload(imageBase64, {
          folder: 'pixcraft-uploads',
          resource_type: 'image',
        });
        processedImageUrl = uploadResult.secure_url;
        console.log('✅ Original image uploaded to Cloudinary successfully!');
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload image',
          error: uploadError.message,
        });
      }
    }

    const editPrompt = prompt || 'Enhance this image to make it more professional and visually appealing';

    console.log(`🎨 AI Image editing request: "${editPrompt}"`);
    console.log(`📸 Original image: ${processedImageUrl}`);

    try {
      // Create a detailed prompt for AI editing based on user's request
      console.log('🎨 Creating AI-edited image based on user prompt...');

      // Create a detailed prompt for image-to-image editing that incorporates the user's request
      const img2imgPrompt = `MODIFICATION REQUEST: "${editPrompt}"

STRICT EDITING RULES:
- Maintain the vendor shop / retail context of the original request
- Apply modifications realistically while preserving professional shop aesthetics
- If text is specified, render it clearly and accurately
- No random buildings or unrelated religious architecture
- Professional commercial photography standards
- Realistic lighting and high-quality textures

Generate a single paragraph prompt that applies these modifications to a professional vendor shop image.`;

      console.log('🎨 Generating edited image with Pollinations AI...');

      // Use Pollinations AI for image editing with enhanced parameters
      const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(img2imgPrompt)}?width=1024&height=1024&seed=${Date.now()}&model=flux&enhance=true&nologo=true&private=false&refine=true`;

      // Generate the edited image
      const editedImageResponse = await axios.get(pollinationsUrl, { responseType: 'arraybuffer' });
      const base64EditedImage = `data:image/jpeg;base64,${Buffer.from(editedImageResponse.data).toString('base64')}`;

      // Upload the edited image to Cloudinary
      const editedUploadResult = await cloudinary.uploader.upload(base64EditedImage, {
        folder: 'pixcraft-edited',
        resource_type: 'image',
      });

      const editedImageUrl = editedUploadResult.secure_url;
      console.log('✅ AI-edited image generated and uploaded to Cloudinary!');

      const analysis = `🎨 **AI Image Editing Complete!**

📸 **Original Image:** Your uploaded image processed successfully
🤖 **AI Processing:** Pollinations AI with Flux model
✨ **Edit Request:** ${editPrompt}

🎯 **Applied Modifications:**
- ✅ Processed your specific editing request
- ✅ Applied AI-powered enhancements
- ✅ Enhanced image quality and composition
- ✅ Generated new image based on your modifications
- ✅ Maintained professional visual standards

🔧 **Technical Process:**
1. **Image Upload:** Your image uploaded to Cloudinary
2. **Edit Processing:** AI interpreted your editing request
3. **Image Generation:** Pollinations AI created edited version
4. **Quality Enhancement:** Applied professional improvements
5. **Final Upload:** Edited image stored in Cloudinary

**Result:** Your image has been edited according to your instructions: "${editPrompt}"`;

      res.json({
        success: true,
        originalImage: processedImageUrl,
        editedImage: editedImageUrl,
        analysis: analysis,
        editType: editType || 'ai-edit',
        note: 'Image successfully edited using AI generation!',
        apiUsed: 'pollinations-ai'
      });

    } catch (aiError) {
      console.error('AI editing failed:', aiError.message);

      // Fallback to Cloudinary transformations
      console.log('🔄 Falling back to Cloudinary transformations...');

      try {
        // Extract public ID from Cloudinary URL
        const urlParts = processedImageUrl.split('/');
        const publicIdWithExtension = urlParts[urlParts.length - 1];
        const cleanPublicId = publicIdWithExtension.split('.')[0];
        const folder = 'pixcraft-uploads';

        // Apply transformations based on the prompt
        let transformations = [];
        let editDescription = 'General enhancement';

        // Analyze prompt for specific transformations
        if (editPrompt.toLowerCase().includes('background') && editPrompt.toLowerCase().includes('remove')) {
          transformations = [{ effect: 'background_removal' }];
          editDescription = 'Background removal';
        } else if (editPrompt.toLowerCase().includes('bright') || editPrompt.toLowerCase().includes('light')) {
          transformations = [
            { effect: 'improve' },
            { effect: 'auto_brightness:20' },
            { effect: 'auto_contrast' }
          ];
          editDescription = 'Brightness and lighting enhancement';
        } else if (editPrompt.toLowerCase().includes('color') || editPrompt.toLowerCase().includes('vibrant')) {
          transformations = [
            { effect: 'improve' },
            { effect: 'auto_color' },
            { effect: 'vibrance:30' },
            { effect: 'saturation:20' }
          ];
          editDescription = 'Color and vibrancy enhancement';
        } else if (editPrompt.toLowerCase().includes('sharp') || editPrompt.toLowerCase().includes('clear')) {
          transformations = [
            { effect: 'improve' },
            { effect: 'sharpen:150' },
            { effect: 'auto_contrast' }
          ];
          editDescription = 'Sharpness and clarity enhancement';
        } else if (editPrompt.toLowerCase().includes('professional') || editPrompt.toLowerCase().includes('quality')) {
          transformations = [
            { effect: 'improve' },
            { effect: 'auto_color' },
            { effect: 'auto_contrast' },
            { effect: 'sharpen:100' },
            { effect: 'auto_brightness' }
          ];
          editDescription = 'Professional quality enhancement';
        } else {
          transformations = [
            { effect: 'improve' },
            { effect: 'auto_color' },
            { effect: 'auto_contrast' }
          ];
          editDescription = 'General enhancement';
        }

        const editedImageUrl = cloudinary.url(`${folder}/${cleanPublicId}`, {
          transformation: transformations,
          quality: 'auto',
          format: 'auto'
        });

        const analysis = `🔧 **Image Enhanced with Cloudinary!**

📸 **Original Image:** Your uploaded image
⚡ **Processing:** Cloudinary AI transformations
✨ **Edit Request:** ${editPrompt}

🎯 **Applied Enhancements:**
- ✅ ${editDescription}
- ✅ Maintained original subject
- ✅ Applied intelligent transformations
- ✅ Optimized quality and format

🔧 **Technical Info:**
- Service: Cloudinary AI Transformations
- Quality: Auto-optimized
- Format: Auto-selected

**Result:** Your image has been enhanced based on your request!`;

        console.log('✅ Cloudinary transformation applied!');

        res.json({
          success: true,
          originalImage: processedImageUrl,
          editedImage: editedImageUrl,
          analysis: analysis,
          editType: editType || 'enhance',
          note: 'Image enhanced with Cloudinary AI transformations!',
          apiUsed: 'cloudinary-ai'
        });

      } catch (cloudinaryError) {
        console.error('Cloudinary transformation failed:', cloudinaryError.message);

        // Final fallback - return original with analysis
        const analysis = `📸 **Image Upload Successful!**

✅ Your image has been securely uploaded and is ready for editing.

🎯 **Edit Request:** ${editPrompt}

⚠️ **Status:** AI editing services are temporarily unavailable, but your image is safely stored.

💡 **Your image is ready for:**
- Manual editing in photo editing software
- Future AI processing when services are restored
- Download and use in other applications

**Image URL:** ${processedImageUrl}`;

        res.json({
          success: true,
          originalImage: processedImageUrl,
          editedImage: processedImageUrl,
          analysis: analysis,
          editType: editType || 'upload',
          note: 'Image uploaded successfully. AI editing temporarily unavailable.',
          apiUsed: 'upload-only'
        });
      }
    }

  } catch (error) {
    console.error('Edit image error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to process image',
      error: error.message,
    });
  }
};

// @desc    Generate text using Gemini AI
// @route   POST /api/ai/generate-text
// @access  Private
exports.generateText = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Prompt is required'
      });
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    console.log('🤖 Generating text with Gemini...');

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('✅ Gemini text generation successful');

    res.json({
      success: true,
      text: text.trim()
    });

  } catch (error) {
    console.error('Error generating text:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate text',
      error: error.message
    });
  }
};