const axios = require('axios');
const cloudinary = require('../config/cloudinary');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// ============================================
// 📏 RULE-BASED PROMPT NORMALIZER (NO AI)
// ============================================

/**
 * Extracts the core product from user input for consistent generation
 */
function extractProduct(userInput) {
  let target = userInput;

  // Handle orchestrator formatted input (Subject: {Product})
  const subjectMatch = userInput.match(/Subject: ([^.]+)/i);
  if (subjectMatch) {
    target = subjectMatch[1];
  }

  let cleaned = target.toLowerCase();

  // Mapping of keywords to clean product categories (high priority)
  if (cleaned.includes('cloth') || cleaned.includes('garment') || cleaned.includes('dress')) return 'clothes';
  if (cleaned.includes('chocolate') || cleaned.includes('sweet') || cleaned.includes('candy')) return 'chocolates';
  if (cleaned.includes('mobile') || cleaned.includes('phone')) return 'mobile phones';
  if (cleaned.includes('bakery') || cleaned.includes('cake') || cleaned.includes('bread')) return 'bakery items';
  if (cleaned.includes('grocery') || cleaned.includes('provision')) return 'grocery products';
  if (cleaned.includes('medical') || cleaned.includes('pharmacy') || cleaned.includes('medicine')) return 'medicines';
  if (cleaned.includes('book') || cleaned.includes('stationery')) return 'books and stationery';
  if (cleaned.includes('footwear') || cleaned.includes('shoe')) return 'footwear';
  if (cleaned.includes('jewelry') || cleaned.includes('jewel')) return 'jewelry';

  // Dynamic Extraction: Remove common noise words to find the actual product
  const noise = ['shop', 'store', 'vendor', 'retail', 'small', 'local', 'poster', 'banner', 'advertising', 'design', 'professional', 'marketing', 'selling', 'business', 'creative', 'create', 'make', 'generate', 'image', 'products'];

  noise.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    cleaned = cleaned.replace(regex, '').trim();
  });

  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // Final cleanup: remove trailing/leading punctuation
  cleaned = cleaned.replace(/^[.,\s]+|[.,\s]+$/g, '');

  return cleaned || 'products';
}

/**
 * Generates the final locked prompt structure
 */
function getNormalizedPrompt(userInput) {
  const product = extractProduct(userInput);

  // FIXED TEMPLATE (As requested for stability)
  return `poster of a small local vendor shop selling ${product}, clean retail shop interior, products neatly arranged on shelves and counters, bright natural lighting, simple professional poster layout suitable for local business advertising`;
}

// @desc    Generate AI images using Pollinations AI (Rule-Based Flow)
// @route   POST /api/ai/generate
// @access  Private
exports.generateImage = async (req, res) => {
  try {
    const { prompt: userInput, count = 1 } = req.body;

    if (!userInput) {
      return res.status(400).json({ success: false, message: 'Prompt is required' });
    }

    console.log(`🖼️ STARTING IMAGE GENERATION FLOW: "${userInput}"`);

    // 1. Normalize Prompt (Rule-Based, No Gemini)
    const finalPrompt = getNormalizedPrompt(userInput);
    console.log(`✅ Normalized Prompt: ${finalPrompt}`);

    const images = [];
    const width = 1024;
    const height = 1024;

    // 2. Pollinations Generation Loop
    try {
      for (let i = 0; i < count; i++) {
        console.log(`🎨 Generating image ${i + 1}/${count} with Pollinations AI...`);

        // Use a random seed for true visual variety
        const randomSeed = Math.floor(Math.random() * 1000000);
        // FIXED URL FORMAT
        const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=${width}&height=${height}&seed=${randomSeed}&nologo=true`;

        // 🚀 STABILITY FIX: Let Cloudinary fetch the image directly from the URL.
        // This avoids axios timeout/502 issues on our backend and uses Cloudinary's high-speed network.
        const uploadResult = await cloudinary.uploader.upload(pollinationsUrl, {
          folder: 'pixcraft-generated',
          resource_type: 'image',
        });

        images.push(uploadResult.secure_url);
        console.log(`✅ Image ${i + 1} generated and uploaded via Cloudinary link!`);
      }

      console.log(`✅ ALL IMAGES COMPLETED: ${count} images generated.`);

      res.json({
        success: true,
        images,
        originalPrompt: userInput,
        finalPrompt: finalPrompt,
        note: `Generated ${count} poster(s) using stable rule-based flow.`,
        apiUsed: 'pollinations-stable'
      });

    } catch (pollinationsError) {
      console.error('❌ Pollinations/Cloudinary failed:', pollinationsError.message);

      // 🌈 DYNAMIC FALLBACK: Use LoremFlickr for relevant, varied images
      const product = extractProduct(userInput);
      const seed = userInput.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

      const fallbackImages = [];
      for (let i = 0; i < count; i++) {
        // LoremFlickr returns a random image for the tag, varied by the seed
        fallbackImages.push(`https://loremflickr.com/1024/1024/${encodeURIComponent(product)}?lock=${seed + i}`);
      }

      res.json({
        success: true,
        images: fallbackImages,
        note: 'AI service busy. Using relevant retail placeholders.',
        apiUsed: 'fallback-dynamic',
        product: product
      });
    }

  } catch (error) {
    console.error('Fatal Image generation error:', error);
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

    if (imageBase64) {
      try {
        const uploadResult = await cloudinary.uploader.upload(imageBase64, {
          folder: 'pixcraft-uploads',
          resource_type: 'image',
        });
        processedImageUrl = uploadResult.secure_url;
      } catch (uploadError) {
        return res.status(500).json({ success: false, message: 'Upload failed' });
      }
    }

    // Default to the same safe structure for edits
    const product = extractProduct(prompt || 'products');
    const editPrompt = `High quality professional poster of a ${product} shop, clean lighting, sharp focus`;

    console.log(`🎨 Editing image with prompt: "${editPrompt}"`);

    try {
      const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(editPrompt)}?width=1024&height=1024&seed=${Date.now()}&nologo=true`;

      const editedImageResponse = await axios.get(pollinationsUrl, { responseType: 'arraybuffer' });
      const base64EditedImage = `data:image/jpeg;base64,${Buffer.from(editedImageResponse.data).toString('base64')}`;

      const editedUploadResult = await cloudinary.uploader.upload(base64EditedImage, {
        folder: 'pixcraft-edited',
        resource_type: 'image',
      });

      res.json({
        success: true,
        originalImage: processedImageUrl,
        editedImage: editedUploadResult.secure_url,
        note: 'Image processed using stable rule-based flow.',
        apiUsed: 'pollinations-stable'
      });

    } catch (aiError) {
      console.error('AI editing failed:', aiError.message);
      res.json({
        success: true,
        originalImage: processedImageUrl,
        editedImage: processedImageUrl,
        note: 'AI services busy. Image uploaded successfully.',
        apiUsed: 'upload-only'
      });
    }

  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal error' });
  }
};

// @desc    Generate text using Gemini AI
// @route   POST /api/ai/generate-text
// @access  Private
exports.generateText = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ success: false });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(prompt);
    const response = await result.response;

    res.json({
      success: true,
      text: response.text().trim()
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
