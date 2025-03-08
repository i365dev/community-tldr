// Cache prefix for storage
const CACHE_PREFIX = 'tldr_cache_';
// Cache expiration time (24 hours)
const CACHE_EXPIRY = 24 * 60 * 60 * 1000;

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background worker received message:', request);
    
    if (request.type === 'SUMMARIZE') {
        console.log('Processing summarize request...');
        handleSummarize(request.data, sender.tab?.id).then(sendResponse);
        return true; // Keep message channel open for async response
    }
});

// Handle summarization requests
async function handleSummarize(data, tabId) {
    try {
        // Get AI service configuration
        const settings = await chrome.storage.sync.get({
            aiProvider: 'custom',
            apiKey: '',
            endpoint: '',
            model: 'gpt-3.5-turbo',
            summaryLength: 'medium',
            language: 'chinese' // Default language
        });

        console.log('Using AI settings:', {
            provider: settings.aiProvider,
            endpoint: settings.endpoint,
            language: settings.language
        });

        // Call AI service for summarization
        const summary = await callAIService(settings, {
            prompt: data.content,
            temperature: 0.7,
            max_tokens: getSummaryLength(settings.summaryLength)
        });

        return { success: true, data: summary };
    } catch (error) {
        console.error('Summarization error:', error);
        return {
            success: false,
            error: error.message || 'Failed to generate summary'
        };
    }
}

// Get system prompt based on language
function getSystemPrompt(language) {
    switch (language.toLowerCase()) {
        case 'chinese':
            return '你是一个专业的讨论帖总结助手。请以中文总结讨论内容，注重提取关键观点、主要论据和讨论结果。总结应该清晰、准确、全面。回复格式：\n1. 主要观点：\n2. 关键见解：\n3. 讨论结果：';
        case 'japanese':
            return 'あなたは専門的な議論要約アシスタントです。議論の内容を日本語で要約し、重要なポイント、主な論点、議論の結果に焦点を当ててください。要約は明確で、正確で、包括的である必要があります。';
        case 'korean':
            return '당신은 전문적인 토론 요약 도우미입니다. 토론 내용을 한국어로 요약하고, 주요 논점, 주요 논거, 토론 결과를 중심으로 정리해 주세요. 요약은 명확하고 정확하며 포괄적이어야 합니다.';
        case 'quora':
            return 'You are a professional Quora answer summarizer. Please create a concise summary that captures the key information, insights, and evidence from the answer. Format your response as:\n1. Main Points:\n2. Key Insights:\n3. Examples or Evidence:';
        default:
            return 'You are a professional discussion summarizer. Please summarize the discussion clearly, accurately, and comprehensively, focusing on key points, main arguments, and discussion outcomes. Format your response as:\n1. Main Points:\n2. Key Insights:\n3. Discussion Results:';
    }
}

// Call AI service with proper configuration
async function callAIService(settings, requestData) {
    if (!settings.endpoint) {
        throw new Error('AI service endpoint not configured');
    }

    if (!settings.apiKey) {
        throw new Error('API key not configured');
    }

    return await callCustomEndpoint(settings, requestData);
}

// Call custom endpoint with provided settings
async function callCustomEndpoint(settings, requestData) {
    try {
        console.log('Calling custom endpoint:', settings.endpoint);
        
        const response = await fetch(settings.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${settings.apiKey}`
            },
            body: JSON.stringify({
                model: settings.model || 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: getSystemPrompt(settings.language)
                    },
                    {
                        role: 'user',
                        content: requestData.prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: requestData.max_tokens || 500
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'AI service error');
        }

        const result = await response.json();
        console.log('API response:', result);

        // Extract the summary from the response
        return result.choices?.[0]?.message?.content || result.response || result.summary;
    } catch (error) {
        console.error('Custom endpoint error:', error);
        throw error;
    }
}

// Get appropriate token length based on summary length setting
function getSummaryLength(length) {
    switch (length) {
        case 'short':
            return 256;
        case 'medium':
            return 512;
        case 'long':
            return 1024;
        default:
            return 300;
    }
}

// Listen for extension installation
chrome.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === 'install') {
        // Open options page for initial configuration
        chrome.runtime.openOptionsPage();
    }
});
