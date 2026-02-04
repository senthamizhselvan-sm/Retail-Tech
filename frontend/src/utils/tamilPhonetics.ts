// Phonetic variations for common Tamil words
export const tamilPhoneticMap: Record<string, string[]> = {
  'soap': ['சோப்', 'சோப', 'சோப்பு', 'சோபு', 'சோப்பூ', 'சோபூ'],
  'rice': ['அரிசி', 'அரிச்சி', 'அரிசீ', 'அரிஸி', 'அரிஸீ'],
  'milk': ['பால்', 'பாலு', 'மில்க்', 'மில்கு'],
  'sugar': ['சர்க்கரை', 'சர்கரை', 'சக்கரை', 'சுகர்', 'சுகார்'],
  'salt': ['உப்பு', 'உப்', 'உப்பூ', 'உப்பு'],
  'oil': ['எண்ணெய்', 'எண்ணெ', 'ஆயில்', 'எண்ணை'],
  'masala': ['மசாலா', 'மசால', 'மாசலா', 'மசால்'],
  'battery': ['பேட்டரி', 'பட்டரி', 'பேட்டரீ', 'பேட்டரை', 'பேட்டரீ'],
  'biscuit': ['பிஸ்கட்', 'பிஸ்கெட்', 'பிஸ்கட', 'பிஸ்கெட'],
  'diary milk': ['டெய்ரி மில்க்', 'டேரி மில்க்', 'டைரி மில்க்', 'டைரி']
};

export const tamilNumberPhonetics: Record<string, number> = {
  'ஒன்று': 1, 'ஒன்னு': 1, 'ஒண்ணு': 1, 'ஒன்னூ': 1,
  'இரண்டு': 2, 'ரெண்டு': 2, 'இரெண்டு': 2, 'ரெண்டூ': 2,
  'மூன்று': 3, 'மூணு': 3, 'மூன்னு': 3,
  'நான்கு': 4, 'நான்கூ': 4, 'நாலு': 4, 'நாலூ': 4,
  'ஐந்து': 5, 'அஞ்சு': 5, 'ஐஞ்சு': 5,
  'ஆறு': 6, 'ஆரு': 6, 'ஆறூ': 6,
  'ஏழு': 7, 'ஏழ': 7, 'ஏழூ': 7,
  'எட்டு': 8, 'எட்டூ': 8,
  'ஒன்பது': 9, 'ஒம்பது': 9, 'ஒன்பதூ': 9,
  'பத்து': 10, 'பத்தூ': 10, 'பதிது': 10,
  'பதினொன்று': 11, 'பதினோரு': 11,
  'பன்னிரண்டு': 12, 'பன்னீரெண்டு': 12,
  'இருபது': 20, 'இருபதூ': 20,
  'முப்பது': 30, 'முப்பதூ': 30,
  'நாற்பது': 40, 'நாற்பதூ': 40,
  'ஐம்பது': 50, 'ஐம்பதூ': 50
};

export const tamilActionWords: Record<string, string> = {
  'சேர்': 'add', 'சேர': 'add', 'சேரு': 'add', 'கூட்டு': 'add',
  'விற்பனை': 'sold', 'விற்று': 'sold', 'விற்ற': 'sold', 'விற்றது': 'sold',
  'விற்றான்': 'sold', 'விற்றேன்': 'sold',
  'குறை': 'reduce', 'குறைக்க': 'reduce', 'எடு': 'reduce',
  'புதிய': 'new', 'பொருள்': 'product'
};

// Helper function to find best phonetic match
export const findPhoneticMatch = (tamilWord: string, inventory: any[]): string | null => {
  const cleanWord = tamilWord.trim();

  // Direct search in phonetic map
  for (const [englishName, tamilVariations] of Object.entries(tamilPhoneticMap)) {
    if (tamilVariations.some(variation => variation === cleanWord)) {
      // Check if this product exists in inventory
      const found = inventory.find(item =>
        item.productName.toLowerCase() === englishName.toLowerCase()
      );
      if (found) return found.productName;
    }
  }

  // Fuzzy match - check if any variation partially matches
  for (const [englishName, tamilVariations] of Object.entries(tamilPhoneticMap)) {
    if (tamilVariations.some(variation =>
      variation.includes(cleanWord) || cleanWord.includes(variation)
    )) {
      const found = inventory.find(item =>
        item.productName.toLowerCase() === englishName.toLowerCase()
      );
      if (found) return found.productName;
    }
  }

  return null;
};

// Extract number from Tamil text
export const extractTamilNumber = (text: string): number | null => {
  if (!text) return null;
  // Check for digit
  const digitMatch = text.match(/\d+/);
  if (digitMatch) return parseInt(digitMatch[0], 10);

  // Check Tamil number words
  for (const [word, num] of Object.entries(tamilNumberPhonetics)) {
    if (text.includes(word)) return num;
  }

  return null;
};

// Extract action from Tamil text
export const extractTamilAction = (text: string): string | null => {
  if (!text) return null;
  for (const [tamilWord, englishAction] of Object.entries(tamilActionWords)) {
    if (text.includes(tamilWord)) return englishAction;
  }
  return null;
};