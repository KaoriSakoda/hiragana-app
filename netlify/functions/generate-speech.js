// netlify/functions/generate-speech.js
const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  try {
    // POSTメソッド以外は許可しない
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method Not Allowed' })
      };
    }
    
    // リクエストボディを解析
    const requestBody = JSON.parse(event.body);
    const { text, voice, speed, instructions } = requestBody;
    
    // Netlifyの環境変数からAPIキーを取得
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'API Key not configured' })
      };
    }
    
    // OpenAI APIにリクエスト
    const ttsModel = 'tts-1-hd'; // もしくは自分がアクセスできる最新のモデル
    
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: ttsModel,
        input: text,
        voice: voice || 'nova',
        speed: parseFloat(speed) || 1.0,
        response_format: "mp3",
        instructions: instructions || ''
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: `API Error: ${errorText}` })
      };
    }
    
    // バイナリデータを取得
    const audioBuffer = await response.buffer();
    
    // Base64エンコードしてクライアントに返す
    const base64Audio = audioBuffer.toString('base64');
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        audio: base64Audio,
        format: 'mp3'
      })
    };
    
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
