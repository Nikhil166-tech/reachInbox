const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function testGeminiAPI() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  console.log('🔧 Testing Gemini API...');
  
  if (!apiKey || apiKey === 'mock') {
    console.log('🎭 Using mock mode - no API key needed');
    return;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Try different model names
    const models = ['gemini-pro', 'gemini-1.0-pro', 'models/gemini-pro'];
    
    for (const modelName of models) {
      try {
        console.log(`🔄 Testing model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Say "API is working" if this works');
        const response = await result.response;
        const text = response.text();
        console.log(`✅ SUCCESS with ${modelName}:`, text);
        return;
      } catch (modelError) {
        console.log(`   ❌ ${modelName} failed:`, modelError.message);
      }
    }
    
    console.log('❌ All model attempts failed');
    
  } catch (error) {
    console.error('❌ Gemini API Test Failed:', error.message);
    console.log('💡 Recommendation: Use MOCK MODE for demo');
  }
}

testGeminiAPI();