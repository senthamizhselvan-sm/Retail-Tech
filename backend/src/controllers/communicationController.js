const mongoose = require('mongoose');

// Conversation history storage
const conversationHistory = new Map();

// Check MongoDB connection
const isMongoConnected = () => {
    return mongoose.connection.readyState === 1;
};

// Get InventoryItem model safely
const getInventoryModel = () => {
    try {
        return require('../models/InventoryItem');
    } catch (error) {
        console.log('⚠️ InventoryItem model not found, using fallback');
        return null;
    }
};

// Get MemoryDatabase safely
const getMemoryDB = () => {
    try {
        return require('../config/memoryDb');
    } catch (error) {
        console.log('⚠️ MemoryDB not found, using fallback');
        return null;
    }
};

// ============================================
// MAIN: GENERATE AI REPLY
// ============================================
exports.generateAIReply = async (req, res) => {
    console.log('\n🎯 ===== AI REPLY REQUEST RECEIVED =====');

    try {
        const { context, category, language, customerInfo, smartMode = true } = req.body;
        const businessId = req.user?.id || req.user?._id;

        console.log('📝 Request:', { context, category, language, smartMode });

        // Validate
        if (!context || !context.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Customer query is required'
            });
        }

        // Check Gemini API Key
        if (!process.env.GEMINI_API_KEY) {
            console.error('❌ GEMINI_API_KEY missing!');
            return res.status(500).json({
                success: false,
                message: 'AI service not configured. Add GEMINI_API_KEY to .env file'
            });
        }

        // ===== TIME & SHOP INFO =====
        const now = new Date();
        const currentHour = now.getHours();
        const currentTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

        const shopTimings = {
            opening: '9:00 AM',
            closing: '10:00 PM',
            openingHour: 9,
            closingHour: 22
        };

        const isShopOpen = currentHour >= shopTimings.openingHour && currentHour < shopTimings.closingHour;
        const hoursLeft = isShopOpen ? shopTimings.closingHour - currentHour : 0;

        console.log(`🕐 Current: ${currentTime}, Shop: ${isShopOpen ? 'OPEN' : 'CLOSED'}`);

        // ===== FETCH INVENTORY (Smart Mode) =====
        let inventoryData = [];
        let inventoryContext = '';

        if (smartMode) {
            console.log('🧠 SMART MODE: Fetching inventory...');

            try {
                const InventoryItem = getInventoryModel();
                const MemoryDatabase = getMemoryDB();

                if (InventoryItem && isMongoConnected()) {
                    inventoryData = await InventoryItem.find({ businessId })
                        .select('productName quantity unit sellingPrice costPrice mrp minStockLevel')
                        .lean();
                    console.log(`✅ MongoDB: ${inventoryData.length} products`);
                } else if (MemoryDatabase) {
                    const memoryDb = MemoryDatabase.getInstance();
                    const allInventory = memoryDb.get('inventory') || [];
                    inventoryData = allInventory.filter(item => item.businessId === businessId);
                    console.log(`✅ Memory: ${inventoryData.length} products`);
                }

                // Format inventory for AI
                if (inventoryData.length > 0) {
                    const lines = inventoryData.map(item => {
                        let line = `${item.productName}`;

                        // Stock status
                        if (item.quantity === 0) {
                            line += ' - OUT OF STOCK ❌';
                        } else if (item.quantity <= (item.minStockLevel || 5)) {
                            line += ` - LOW STOCK ⚠️ (${item.quantity} ${item.unit || 'units'})`;
                        } else {
                            line += ` - IN STOCK ✅ (${item.quantity} ${item.unit || 'units'})`;
                        }

                        // Price
                        const price = item.sellingPrice || item.mrp || item.costPrice;
                        if (price) {
                            line += ` @ ₹${price}/${item.unit || 'piece'}`;
                        }

                        return line;
                    });

                    inventoryContext = `
SHOP INVENTORY (${inventoryData.length} products):
${lines.join('\n')}
`;
                } else {
                    inventoryContext = 'No products in inventory.';
                }

            } catch (error) {
                console.error('⚠️ Inventory fetch error:', error.message);
                inventoryContext = 'Unable to fetch inventory.';
            }
        }

        const prompt = `You are Kumar, a friendly Indian shop owner replying to WhatsApp messages.

${smartMode ? inventoryContext : ''}

SHOP INFO:
- Timings: ${shopTimings.opening} - ${shopTimings.closing}
- Status: ${isShopOpen ? `OPEN (closes in ${hoursLeft}h)` : 'CLOSED'}
- Current time: ${currentTime}

CUSTOMER ASKS:
"${context}"

LANGUAGE: ${language === 'tamil' ? 'Tamil' : language === 'hindi' ? 'Hindi' : 'English'}

REPLY AS SHOP OWNER:
- Be natural and friendly 😊
- Use real inventory data if Smart Mode
- Keep it SHORT (2-3 sentences)
- Add emojis: 😊 👍 ✅ ❌

EXAMPLES:

Q: "Is masala available?"
A: "Hello! 😊 Yes, masala available. 15 packets @ ₹25/packet. How many you need? 👍"

Q: "Closing time?"
A: "We close at ${shopTimings.closing}. ${isShopOpen ? 'Still open!' : 'Opens tomorrow 9 AM'} 😊"

Q: "Rice price?"
A: "Rice ₹60/kg sir. Good quality 💯"

NOW REPLY (in ${language}):`;

        let aiReply;
        try {
            console.log('🤖 Calling Gemini...');
            const { GoogleGenerativeAI } = require('@google/generative-ai');
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({
                model: "gemini-flash-latest",
                generationConfig: {
                    temperature: 0.8,
                    maxOutputTokens: 500,
                }
            });

            const result = await model.generateContent(prompt);
            aiReply = result.response.text().trim();
            console.log('✅ Gemini Success');
        } catch (geminiError) {
            console.error('⚠️ Gemini API error:', geminiError.message);
            console.log('🔄 Using Smart Fallback...');

            // Intelligence fallback system
            aiReply = generateFallbackReply(context, category, language, inventoryData, isShopOpen, shopTimings, customerInfo);
        }

        console.log('✅ Reply:', aiReply);

        // Save conversation
        const businessIdKey = businessId || 'default';
        if (!conversationHistory.has(businessIdKey)) {
            conversationHistory.set(businessIdKey, []);
        }
        conversationHistory.get(businessIdKey).unshift({
            query: context,
            reply: aiReply,
            category,
            language,
            smartMode,
            timestamp: new Date()
        });

        console.log('✅ ===== SUCCESS =====\n');

        return res.json({
            success: true,
            reply: aiReply,
            metadata: {
                language,
                category,
                smartMode,
                hasInventoryData: inventoryData.length > 0,
                inventoryItemsUsed: inventoryData.length,
                shopOpen: isShopOpen,
                isFallback: !aiReply.includes('Kumar'), // Simple check
                timestamp: new Date()
            }
        });

    } catch (error) {
        console.error('❌ FATAL ERROR:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Failed to process request',
            error: error.message
        });
    }
};

/**
 * INTELLIGENT FALLBACK REPLY GENERATOR
 * Used when Gemini API is unavailable
 */
function generateFallbackReply(query, category, language, inventory, isOpen, timings, customerInfo) {
    const name = customerInfo?.name ? customerInfo.name : '';
    const namePrefix = name ? (language === 'tamil' ? `வணக்கம் ${name}! ` : language === 'hindi' ? `नमस्ते ${name}! ` : `Hello ${name}! `) : '';

    // 1. Stock & Price Queries
    if (category === 'price' || category === 'availability' || query.toLowerCase().includes('available') || query.toLowerCase().includes('price')) {
        const lowerQuery = query.toLowerCase();
        const foundItem = inventory.find(item => lowerQuery.includes(item.productName.toLowerCase()));

        if (foundItem) {
            if (language === 'tamil') {
                return `${namePrefix}ஆம், ${foundItem.productName} கையிருப்பில் உள்ளது. ✅ ஸ்டாக்: ${foundItem.quantity} ${foundItem.unit || 'units'}. விலை: ₹${foundItem.sellingPrice || foundItem.mrp}/unit. உங்களுக்கு எத்தனை தேவை? 😊`;
            } else if (language === 'hindi') {
                return `${namePrefix}हाँ, ${foundItem.productName} स्टॉक में है. ✅ स्टॉक: ${foundItem.quantity} ${foundItem.unit || 'units'}. कीमत: ₹${foundItem.sellingPrice || foundItem.mrp}/unit. आपको कितना चाहिए? 😊`;
            }
            return `${namePrefix}Hello! Yes, ${foundItem.productName} is in stock. ✅ Current stock: ${foundItem.quantity} ${foundItem.unit || 'units'}. Price: ₹${foundItem.sellingPrice || foundItem.mrp}/piece. How many do you need? 😊`;
        }
    }

    // 2. Shop Timings
    if (query.toLowerCase().includes('time') || query.toLowerCase().includes('open') || query.toLowerCase().includes('close')) {
        if (language === 'tamil') {
            return `${namePrefix}எங்கள் கடை ${timings.opening} முதல் ${timings.closing} வரை திறந்திருக்கும். ${isOpen ? 'இப்போது கடை திறந்துள்ளது, வரலாம்! 😊' : 'இப்போது கடை மூடப்பட்டுள்ளது. நாளை காலை வரவும். 🙏'}`;
        }
        return `${namePrefix}Our shop timings are ${timings.opening} to ${timings.closing}. ${isOpen ? 'We are open now, please visit! 😊' : 'We are closed now. We will open again tomorrow morning. 🙏'}`;
    }

    // 3. Generic Fallbacks
    if (language === 'tamil') {
        return `${namePrefix}உங்கள் கேள்விக்கு நன்றி. எங்களை நேரில் தொடர்பு கொள்ளவும் அல்லது விரைவில் மீண்டும் அழைக்கவும். 😊`;
    } else if (language === 'hindi') {
        return `${namePrefix}आपके सवाल के लिए धन्यवाद. कृपया हमसे सीधे संपर्क करें. 😊`;
    }

    return `${namePrefix}Thank you for your query! I'm Kumar. Please visit our shop or contact us directly for more details. We are happy to help you! 😊`;
}

// ===== GET INVENTORY SUMMARY =====
exports.getInventorySummary = async (req, res) => {
    try {
        const businessId = req.user?.id || req.user?._id;
        let inventoryData = [];

        const InventoryItem = getInventoryModel();
        const MemoryDatabase = getMemoryDB();

        if (InventoryItem && isMongoConnected()) {
            inventoryData = await InventoryItem.find({ businessId })
                .select('productName quantity minStockLevel sellingPrice')
                .lean();
        } else if (MemoryDatabase) {
            const memoryDb = MemoryDatabase.getInstance();
            const allInventory = memoryDb.get('inventory') || [];
            inventoryData = allInventory.filter(item => item.businessId === businessId);
        }

        const summary = {
            totalProducts: inventoryData.length,
            lowStockCount: inventoryData.filter(i => i.quantity > 0 && i.quantity <= (i.minStockLevel || 5)).length,
            outOfStockCount: inventoryData.filter(i => i.quantity === 0).length,
            totalValue: inventoryData.reduce((sum, i) => sum + ((i.sellingPrice || 0) * i.quantity), 0)
        };

        return res.json({ success: true, summary });

    } catch (error) {
        console.error('Inventory summary error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get summary'
        });
    }
};

// ===== PROCESS VOICE QUERY =====
exports.processVoiceQuery = async (req, res) => {
    try {
        const { transcript } = req.body;

        let category = 'general';
        const lower = (transcript || '').toLowerCase();

        if (lower.includes('price') || lower.includes('விலை')) category = 'price';
        else if (lower.includes('available') || lower.includes('கிடைக்கும்')) category = 'availability';
        else if (lower.includes('time') || lower.includes('close')) category = 'delivery';

        return res.json({ success: true, category, transcript });
    } catch (error) {
        return res.status(500).json({ success: false });
    }
};

// ===== GET CONVERSATION HISTORY =====
exports.getConversationHistory = async (req, res) => {
    try {
        const businessId = req.user?.id || req.user?._id;
        const history = conversationHistory.get(businessId) || [];
        return res.json({ success: true, history: history.slice(0, 10), total: history.length });
    } catch (error) {
        return res.status(500).json({ success: false });
    }
};

// ===== SAVE CONVERSATION =====
exports.saveConversation = async (req, res) => {
    try {
        const businessId = req.user?.id || req.user?._id;
        if (!conversationHistory.has(businessId)) {
            conversationHistory.set(businessId, []);
        }
        conversationHistory.get(businessId).unshift({ ...req.body, timestamp: new Date() });
        return res.json({ success: true });
    } catch (error) {
        return res.status(500).json({ success: false });
    }
};

// ===== GET SMART SUGGESTIONS =====
exports.getSmartSuggestions = async (req, res) => {
    try {
        return res.json({ success: true, suggestions: [] });
    } catch (error) {
        return res.status(500).json({ success: false });
    }
};
