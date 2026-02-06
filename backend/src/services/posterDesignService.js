 const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const cleanGeminiJson = (rawText) => {
  if (!rawText) return '';
  const withoutFence = rawText.replace(/```json\n?|```\n?/g, '').trim();
  const firstBrace = withoutFence.indexOf('{');
  const lastBrace = withoutFence.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1) {
    return withoutFence;
  }
  return withoutFence.slice(firstBrace, lastBrace + 1);
};

const getFallbackDesign = ({ product, discount, festival, brandColors, language, style }) => {
  const fallbackPrimary = brandColors.length >= 2 ? brandColors[1] : '#764ba2';
  const fallbackBackground = brandColors.length >= 1 ? brandColors[0] : '#667eea';
  const safeFestival = festival || 'Festival';

  return {
    layout: 'center',
    colors: {
      background: fallbackBackground,
      backgroundGradient: [fallbackBackground, fallbackPrimary],
      primary: fallbackPrimary,
      accent: '#FFD700',
      textColor: '#FFFFFF'
    },
    headline: {
      text: `${safeFestival.toUpperCase()} SALE!`,
      fontSize: 72,
      fontFamily: 'Poppins'
    },
    subheading: {
      text: product || 'Special Offers',
      fontSize: 36
    },
    discount: {
      text: `${discount || 0}% OFF`,
      position: 'top-right',
      badgeColor: '#FF6B35'
    },
    callToAction: language === 'tamil' ? 'இப்போது வாங்குங்கள்' : language === 'hindi' ? 'अभी खरीदें' : 'SHOP NOW',
    decorativeElements: [
      {
        type: 'circle',
        color: fallbackPrimary,
        position: { x: 150, y: 150 },
        size: { width: 300, height: 300 },
        opacity: 0.2
      }
    ],
    culturalSymbols: [],
    fontPairs: {
      heading: 'Poppins',
      body: 'Open Sans'
    }
  };
};

const generatePosterDesign = async ({
  product,
  discount,
  festival,
  brandColors = [],
  language = 'english',
  style = 'modern'
}) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `You are an expert Indian retail poster designer. Create a poster design specification for:

Product: ${product}
Offer: ${discount}% OFF
Festival/Event: ${festival}
Brand Colors: ${brandColors.length > 0 ? brandColors.join(', ') : 'Auto-suggest'}
Language: ${language}
Style: ${style}

Instructions:
- Design should be eye-catching for small Indian retail shops
- Use culturally appropriate colors and symbols for ${festival}
- Include traditional and modern elements
- Text should be bold and readable from distance
- Generate headline in ${language === 'tamil' ? 'Tamil and English' : language === 'hindi' ? 'Hindi and English' : 'English only'}

Return ONLY valid JSON (no markdown, no explanation):
{
  "layout": "center" | "left" | "diagonal",
  "colors": {
    "background": "#HEX",
    "backgroundGradient": ["#HEX1", "#HEX2"],
    "primary": "#HEX",
    "accent": "#HEX",
    "textColor": "#FFFFFF"
  },
  "headline": {
    "text": "Main headline text",
    "tamilText": "தமிழ் வரி",
    "fontSize": 80,
    "fontFamily": "Poppins"
  },
  "subheading": {
    "text": "Supporting text",
    "fontSize": 40
  },
  "discount": {
    "text": "${discount}% OFF",
    "position": "top-right" | "center" | "top-left",
    "badgeColor": "#HEX"
  },
  "callToAction": "SHOP NOW",
  "decorativeElements": [
    {
      "type": "circle" | "rectangle" | "triangle",
      "color": "#HEX",
      "position": {"x": 100, "y": 100},
      "size": {"width": 200, "height": 200},
      "opacity": 0.3
    }
  ],
  "culturalSymbols": [
    {
      "emoji": "🪔",
      "position": {"x": 50, "y": 50},
      "size": 60
    }
  ],
  "fontPairs": {
    "heading": "Poppins",
    "body": "Open Sans"
  }
}`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    const cleaned = cleanGeminiJson(response);
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('Gemini design generation error:', error);
    return getFallbackDesign({ product, discount, festival, brandColors, language, style });
  }
};

const generateThreeVariants = async (inputData) => {
  const styles = ['modern', 'traditional', 'bold'];
  const variants = await Promise.all(
    styles.map(async (style) => {
      const design = await generatePosterDesign({ ...inputData, style });
      return {
        style,
        design,
        metadata: {
          style,
          generatedAt: new Date()
        }
      };
    })
  );
  return variants;
};

module.exports = {
  generatePosterDesign,
  generateThreeVariants
};
