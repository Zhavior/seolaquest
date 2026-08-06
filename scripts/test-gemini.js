const { GoogleGenAI } = require('@google/genai');

(async () => {
  try {
    console.log('GoogleGenAI loaded');
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('apiKey present:', !!apiKey);
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    const ai = new GoogleGenAI({ apiKey });

    const res = await ai.models.generateContent({
      model,
      contents: [
        {
          role: 'user',
          parts: [{ text: 'ping' }],
        },
      ],
    });

    console.log('text field:', res.text);
  } catch (e) {
    console.error('direct test error:', e.message);
  }
})();
