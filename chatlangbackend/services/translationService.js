// services/translationService.js
const langCodeMap = {
    'eng': 'en', 'spa': 'es', 'fra': 'fr',
    'deu': 'de', 'hin': 'hi', 'cmn': 'zh',
    'por': 'pt', 'rus': 'ru', 'jpn': 'ja',
    'ara': 'ar', 'ita': 'it',
};

// Language codes needed for the MyMemory API
const myMemoryCodes = {
    'English': 'en', 'Spanish': 'es', 'French': 'fr',
    'German': 'de', 'Hindi': 'hi', 'Mandarin': 'zh',
    'Portuguese': 'pt', 'Russian': 'ru', 'Japanese': 'ja',
    'Arabic': 'ar', 'Italian': 'it',
};

async function translateText(text, sourceLang, targetLang) {
    const sourceCode = myMemoryCodes[sourceLang];
    const targetCode = myMemoryCodes[targetLang];

    if (!sourceCode || !targetCode || sourceCode === targetCode) {
        return text;
    }
    
    const langPair = `${sourceCode}|${targetCode}`;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.responseData && data.responseData.translatedText) {
            return data.responseData.translatedText;
        }
        return text;
    } catch (error) {
        console.error('Translation API error:', error);
        return text;
    }
}

// This should now be module.exports again since we removed "type": "module"
module.exports = { translateText };