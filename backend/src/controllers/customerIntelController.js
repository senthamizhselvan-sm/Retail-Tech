const CustomerQuery = require('../models/CustomerQuery');
const BusinessProfile = require('../models/BusinessProfile');
const GrowthEngine = require('../services/growthEngine');

// @desc    Record a customer query
// @route   POST /api/customer/query
// @access  Private
exports.recordQuery = async (req, res) => {
  try {
    const userId = req.user.id;
    const { questionType, language = 'en' } = req.body;
    
    const validTypes = ['price', 'availability', 'discount', 'delivery', 'quality', 'general'];
    if (!validTypes.includes(questionType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid question type'
      });
    }
    
    // Find existing query or create new one
    let query = await CustomerQuery.findOne({ userId, questionType });
    
    if (query) {
      query.count += 1;
      query.lastAskedAt = new Date();
      query.language = language;
    } else {
      query = new CustomerQuery({
        userId,
        questionType,
        count: 1,
        language,
        responseTemplate: this.getDefaultTemplate(questionType, language)
      });
    }
    
    await query.save();
    
    // Record action for growth tracking
    await GrowthEngine.recordAction(userId, 'customer_template');
    
    res.json({
      success: true,
      message: 'Query recorded successfully',
      query
    });
    
  } catch (error) {
    console.error('Record query error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record query',
      error: error.message
    });
  }
};

// @desc    Get customer query summary
// @route   GET /api/customer/summary
// @access  Private
exports.getQuerySummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = '30' } = req.query; // days
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));
    
    // Get all queries for user
    const queries = await CustomerQuery.find({ userId, isActive: true })
      .sort({ count: -1 });
    
    // Get business profile for templates
    const profile = await BusinessProfile.findOne({ userId });
    
    // Calculate summary statistics
    const totalQueries = queries.reduce((sum, q) => sum + q.count, 0);
    const mostAskedType = queries.length > 0 ? queries[0].questionType : null;
    
    // Generate response templates for each query type
    const templates = {};
    queries.forEach(query => {
      templates[query.questionType] = {
        template: this.getContextualTemplate(query.questionType, profile),
        count: query.count,
        lastAsked: query.lastAskedAt,
        language: query.language
      };
    });
    
    res.json({
      success: true,
      data: {
        summary: {
          totalQueries,
          uniqueTypes: queries.length,
          mostAskedType,
          period: parseInt(period)
        },
        queries,
        templates,
        profile: {
          shopName: profile?.shopName || 'Your Shop',
          preferredLanguage: profile?.preferredLanguage || 'en'
        }
      }
    });
    
  } catch (error) {
    console.error('Query summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get query summary',
      error: error.message
    });
  }
};

// @desc    Get response templates by language
// @route   GET /api/customer/templates/:language
// @access  Private
exports.getTemplatesByLanguage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { language } = req.params;
    
    const validLanguages = ['en', 'ta', 'hi'];
    if (!validLanguages.includes(language)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid language'
      });
    }
    
    // Get business profile for personalization
    const profile = await BusinessProfile.findOne({ userId });
    
    // Generate templates for all question types
    const questionTypes = ['price', 'availability', 'discount', 'delivery', 'quality', 'general'];
    const templates = {};
    
    questionTypes.forEach(type => {
      templates[type] = {
        template: this.getLocalizedTemplate(type, language, profile),
        situation: this.getTemplateSituation(type),
        usage: this.getTemplateUsage(type)
      };
    });
    
    res.json({
      success: true,
      data: {
        language,
        templates,
        shopName: profile?.shopName || 'Your Shop'
      }
    });
    
  } catch (error) {
    console.error('Templates by language error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get templates',
      error: error.message
    });
  }
};

// @desc    Update response template
// @route   PUT /api/customer/template/:questionType
// @access  Private
exports.updateTemplate = async (req, res) => {
  try {
    const userId = req.user.id;
    const { questionType } = req.params;
    const { responseTemplate, language = 'en' } = req.body;
    
    let query = await CustomerQuery.findOne({ userId, questionType });
    
    if (!query) {
      query = new CustomerQuery({
        userId,
        questionType,
        language,
        responseTemplate
      });
    } else {
      query.responseTemplate = responseTemplate;
      query.language = language;
    }
    
    await query.save();
    
    res.json({
      success: true,
      message: 'Template updated successfully',
      query
    });
    
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update template',
      error: error.message
    });
  }
};

// Helper functions for templates
exports.getDefaultTemplate = (questionType, language = 'en') => {
  const templates = {
    en: {
      price: 'Hello! The price for {product} is ₹{price}. We offer the best quality at competitive rates. Thank you!',
      availability: 'Yes, {product} is available! We have fresh stock. You can visit our shop or we can arrange delivery.',
      discount: 'Our prices are already very competitive! For bulk orders above ₹{amount}, we can offer {discount}% discount.',
      delivery: 'We can deliver within {time} hours. Delivery charge is ₹{charge} for orders above ₹{minimum}.',
      quality: 'We guarantee 100% quality! All products are fresh and checked. If any issue, we provide full replacement.',
      general: 'Hello! Welcome to our shop. How can I help you today? We have fresh stock of all items.'
    },
    ta: {
      price: 'வணக்கம்! {product} விலை ₹{price}. நல்ல தரத்தில் குறைந்த விலையில் கிடைக்கும். நன்றி!',
      availability: 'ஆம், {product} கிடைக்கும்! புதிய ஸ்டாக் உள்ளது. கடைக்கு வரலாம் அல்லது டெலிவரி செய்யலாம்.',
      discount: 'எங்கள் விலை ஏற்கனவே மிகவும் குறைவு! ₹{amount} க்கு மேல் ஆர்டர் செய்தால் {discount}% தள்ளுபடி.',
      delivery: '{time} மணி நேரத்தில் டெலிவரி செய்யலாம். ₹{minimum} க்கு மேல் ₹{charge} டெலிவரி சார்ஜ்.',
      quality: '100% தரம் உத்தரவாதம்! எல்லா பொருட்களும் புதியது மற்றும் சரிபார்க்கப்பட்டது.',
      general: 'வணக்கம்! எங்கள் கடைக்கு வரவேற்கிறோம். இன்று என்ன வேண்டும்?'
    },
    hi: {
      price: 'नमस्ते! {product} की कीमत ₹{price} है। अच्छी गुणवत्ता में उपलब्ध है। धन्यवाद!',
      availability: 'हाँ, {product} उपलब्ध है! हमारे पास ताजा स्टॉक है। दुकान आ सकते हैं या डिलीवरी करा सकते हैं।',
      discount: 'हमारी कीमतें पहले से ही बहुत अच्छी हैं! ₹{amount} से ज्यादा के ऑर्डर पर {discount}% छूट।',
      delivery: '{time} घंटे में डिलीवरी हो जाएगी। ₹{minimum} से ज्यादा के ऑर्डर पर ₹{charge} डिलीवरी चार्ज।',
      quality: '100% गुणवत्ता की गारंटी! सभी उत्पाद ताजे और जांचे हुए हैं।',
      general: 'नमस्ते! हमारी दुकान में आपका स्वागत है। आज क्या चाहिए?'
    }
  };
  
  return templates[language]?.[questionType] || templates.en[questionType];
};

exports.getContextualTemplate = (questionType, profile) => {
  const shopName = profile?.shopName || 'our shop';
  const language = profile?.preferredLanguage || 'en';
  
  return this.getDefaultTemplate(questionType, language).replace('{shop}', shopName);
};

exports.getLocalizedTemplate = (questionType, language, profile) => {
  return this.getDefaultTemplate(questionType, language);
};

exports.getTemplateSituation = (questionType) => {
  const situations = {
    price: 'Customer asking for product price',
    availability: 'Customer checking if product is in stock',
    discount: 'Customer requesting discount or bulk pricing',
    delivery: 'Customer asking about delivery options',
    quality: 'Customer inquiring about product quality',
    general: 'General greeting or inquiry'
  };
  
  return situations[questionType] || 'General customer inquiry';
};

exports.getTemplateUsage = (questionType) => {
  const usage = {
    price: 'Replace {product} and {price} with actual values',
    availability: 'Replace {product} with the actual product name',
    discount: 'Replace {amount} and {discount} with actual values',
    delivery: 'Replace {time}, {charge}, and {minimum} with actual values',
    quality: 'Use as-is for quality assurance inquiries',
    general: 'Use for welcoming customers to your shop'
  };
  
  return usage[questionType] || 'Customize as needed for your business';
};

// Route-expected methods
// @desc    Get reply templates
// @route   GET /api/customer/templates
// @access  Private
exports.getReplyTemplates = async (req, res) => {
  try {
    const userId = req.user.id;
    const { language = 'en' } = req.query;
    
    const profile = await BusinessProfile.findOne({ userId });
    const questionTypes = ['price', 'availability', 'discount', 'delivery', 'quality', 'general'];
    
    const templates = {};
    questionTypes.forEach(type => {
      templates[type] = {
        template: this.getLocalizedTemplate(type, language, profile),
        situation: this.getTemplateSituation(type),
        usage: this.getTemplateUsage(type)
      };
    });
    
    res.json({
      success: true,
      templates,
      language,
      shopName: profile?.shopName || 'Your Shop'
    });
    
  } catch (error) {
    console.error('Get reply templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get reply templates',
      error: error.message
    });
  }
};

// @desc    Save customer query
// @route   POST /api/customer/query
// @access  Private
exports.saveCustomerQuery = exports.recordQuery;

// @desc    Get customer queries
// @route   GET /api/customer/queries
// @access  Private
exports.getCustomerQueries = exports.getQuerySummary;

// @desc    Get contextual suggestions
// @route   GET /api/customer/suggestions
// @access  Private
exports.getContextualSuggestions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { queryType, language = 'en' } = req.query;
    
    const profile = await BusinessProfile.findOne({ userId });
    
    // Generate contextual suggestions based on query type
    const suggestions = this.generateContextualSuggestions(queryType, language, profile);
    
    res.json({
      success: true,
      suggestions,
      queryType,
      language
    });
    
  } catch (error) {
    console.error('Contextual suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get contextual suggestions',
      error: error.message
    });
  }
};

exports.generateContextualSuggestions = (queryType, language, profile) => {
  const suggestions = {
    en: {
      price: [
        'Our prices are competitive and fair',
        'We offer the best value for money',
        'Quality products at reasonable rates'
      ],
      availability: [
        'Fresh stock available daily',
        'We can arrange if not in stock',
        'Call ahead to confirm availability'
      ],
      discount: [
        'Bulk orders get special pricing',
        'Regular customers get loyalty discounts',
        'Festival offers available'
      ]
    },
    ta: {
      price: [
        'எங்கள் விலை நியாயமானது',
        'நல்ல தரத்தில் குறைந்த விலை',
        'போட்டி விலையில் கிடைக்கும்'
      ],
      availability: [
        'தினமும் புதிய ஸ்டாக்',
        'இல்லாவிட்டால் ஏற்பாடு செய்யலாம்',
        'முன்பே போன் செய்து கேட்கலாம்'
      ]
    },
    hi: [
      'हमारी कीमतें उचित हैं',
      'अच्छी गुणवत्ता में उपलब्ध',
      'प्रतिस्पर्धी दरों में मिलता है'
    ]
  };
  
  return suggestions[language]?.[queryType] || suggestions.en[queryType] || suggestions.en.price;
};
