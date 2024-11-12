export class OpenAIService {
    constructor(apiKey) {
      this.apiKey = apiKey;
    }
  
    async summarize(text) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'You are a helpful assistant that summarizes HN discussions.'
              },
              {
                role: 'user',
                content: `Please summarize this HN discussion: ${text}`
              }
            ]
          })
        });
        
        const data = await response.json();
        return data.choices[0].message.content;
      } catch (error) {
        console.error('OpenAI API error:', error);
        throw error;
      }
    }
  }