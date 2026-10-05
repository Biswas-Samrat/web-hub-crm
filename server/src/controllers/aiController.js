const { GoogleGenerativeAI } = require('@google/generative-ai');
const Conversation = require('../models/Conversation');
const { AppError } = require('../middleware/errorHandler');

// ─── Heuristic Fallback Analyzer ─────────────────────────────────────────────
const generateHeuristicInsights = (messages) => {
  const allText = messages.map(m => m.content || '').join('\n');
  const myMessages = messages.filter(m => m.sender === 'me').map(m => m.content || '');
  const theirMessages = messages.filter(m => m.sender === 'them').map(m => m.content || '');
  
  // 1. Price extraction
  const priceRegex = /(?:£|\$|€|BDT|Tk\.?|USD|GBP|EUR)?\s*(\d{2,6}(?:,\d{3})*(?:\.\d{2})?)\s*(?:£|\$|€|BDT|Tk\.?|USD|GBP|EUR|pounds|dollars|taka)?/gi;
  const pricesFound = [];
  const currencyMatch = allText.match(/£|GBP|pounds/i) ? 'GBP' :
                        allText.match(/\$|USD|dollars/i) ? 'USD' :
                        allText.match(/€|EUR|euros/i) ? 'EUR' :
                        allText.match(/BDT|Tk|taka/i) ? 'BDT' : 'GBP';

  messages.forEach(msg => {
    const text = msg.content || '';
    let match;
    const regex = new RegExp('(?:[£$€]|BDT|Tk)?\\s*(\\d+(?:,\\d{3})*(?:\\.\\d{2})?)\\s*(?:[£$€]|BDT|Tk|pounds|dollars|taka|gbp|usd)?', 'gi');
    while ((match = regex.exec(text)) !== null) {
      const num = parseFloat(match[1].replace(/,/g, ''));
      if (num >= 10 && num <= 100000) {
        pricesFound.push({
          amount: num,
          currency: currencyMatch,
          context: text.length > 80 ? text.substring(0, 80) + '...' : text,
        });
      }
    }
  });

  // Unique prices
  const uniquePrices = pricesFound.filter((v, i, a) => a.findIndex(t => t.amount === v.amount) === i);
  const finalPrice = uniquePrices.length > 0 ? uniquePrices[uniquePrices.length - 1] : null;

  // 2. Sentiment analysis
  const lowerAll = allText.toLowerCase();
  const positiveWords = ['great', 'perfect', 'awesome', 'sounds good', 'interested', 'yes', 'deal', 'love', 'thanks', 'sure', 'start', 'ready', 'proceed'];
  const negativeWords = ['no', 'too expensive', 'expensive', 'cannot', 'not now', 'busy', 'later', 'cancel', 'bad', 'poor', 'stop'];
  
  let posScore = 0;
  let negScore = 0;
  positiveWords.forEach(w => { if (lowerAll.includes(w)) posScore++; });
  negativeWords.forEach(w => { if (lowerAll.includes(w)) negScore++; });

  let sentiment = 'neutral';
  if (posScore > negScore + 1) sentiment = 'positive';
  else if (negScore > posScore + 1) sentiment = 'negative';
  else if (posScore > 0 && negScore > 0) sentiment = 'mixed';

  // 3. Client Interest level
  let clientInterestLevel = 'medium';
  if (posScore >= 3 && theirMessages.length >= 2) clientInterestLevel = 'very_high';
  else if (posScore >= 2) clientInterestLevel = 'high';
  else if (negScore >= 2) clientInterestLevel = 'low';

  // 4. Topics detection
  const topics = [];
  if (lowerAll.includes('website') || lowerAll.includes('web')) topics.push('Website Development');
  if (lowerAll.includes('redesign') || lowerAll.includes('update')) topics.push('Website Redesign');
  if (lowerAll.includes('price') || lowerAll.includes('cost') || lowerAll.includes('budget') || uniquePrices.length > 0) topics.push('Pricing & Budget');
  if (lowerAll.includes('demo') || lowerAll.includes('sample') || lowerAll.includes('link')) topics.push('Demo Presentation');
  if (lowerAll.includes('domain') || lowerAll.includes('hosting')) topics.push('Hosting & Domain');
  if (lowerAll.includes('seo') || lowerAll.includes('google') || lowerAll.includes('rank')) topics.push('SEO & Traffic');
  if (lowerAll.includes('logo') || lowerAll.includes('design') || lowerAll.includes('brand')) topics.push('Branding & Design');
  if (lowerAll.includes('time') || lowerAll.includes('deadline') || lowerAll.includes('day') || lowerAll.includes('week')) topics.push('Timeline & Delivery');
  if (topics.length === 0) topics.push('General Inquiry', 'Lead Engagement');

  // 5. Action Items
  const actionItems = [];
  const lastMsg = messages[messages.length - 1];
  if (lastMsg && lastMsg.sender === 'them') {
    actionItems.push(`Reply to client's latest message: "${lastMsg.content.substring(0, 50)}..."`);
  } else {
    actionItems.push('Follow up with client to check feedback');
  }
  if (uniquePrices.length > 0) {
    actionItems.push(`Confirm agreed quote of ${currencyMatch}${finalPrice ? finalPrice.amount : uniquePrices[0].amount}`);
  }
  if (lowerAll.includes('demo')) {
    actionItems.push('Prepare and send customized website demo preview');
  }
  actionItems.push('Schedule a follow-up call or message on Facebook Messenger');

  // 6. Summary
  const firstMsg = messages[0]?.content || '';
  const lastMsgText = lastMsg?.content || '';
  let summary = `Conversation with ${messages.length} messages. Discussed ${topics.slice(0, 3).join(', ')}.`;
  if (finalPrice) {
    summary += ` Budget/quote discussed: ${currencyMatch}${finalPrice.amount}.`;
  }
  if (lastMsg) {
    summary += ` Last message from ${lastMsg.sender === 'me' ? 'you' : 'client'}: "${lastMsgText.substring(0, 80)}".`;
  }

  return {
    summary,
    pricesDiscussed: uniquePrices,
    finalPrice,
    keyTopics: topics,
    sentiment,
    actionItems,
    clientInterestLevel,
  };
};

// ─── Analyze conversation with Gemini AI (with smart fallback) ───────────────
const analyzeConversation = async (req, res, next) => {
  try {
    const { clientId } = req.params;

    const conversation = await Conversation.findOne({
      userId: req.user._id,
      clientId,
    });

    if (!conversation || conversation.messages.length === 0) {
      return next(new AppError('No conversation found or conversation is empty. Please add messages first.', 404));
    }

    let insights = null;
    const apiKey = process.env.GEMINI_API_KEY;

    // Try Gemini API if API key is present
    if (apiKey && apiKey.trim().length > 5) {
      try {
        const conversationText = conversation.messages
          .map((msg) => {
            const date = new Date(msg.messageDate || msg.createdAt).toLocaleString();
            const senderLabel = msg.sender === 'me' ? 'Me' : 'Client';
            if (msg.messageType !== 'text' && msg.mediaUrl) {
              return `[${date}] ${senderLabel}: [${msg.messageType}: ${msg.mediaName || msg.mediaUrl}] ${msg.content || ''}`;
            }
            return `[${date}] ${senderLabel}: ${msg.content}`;
          })
          .join('\n');

        const prompt = `You are a high-level CRM conversation intelligence AI. Analyze this Facebook Messenger sales conversation and output ONLY valid JSON matching this schema:
{
  "summary": "Concise 2-3 sentence executive summary of what was discussed, client needs, and current status",
  "pricesDiscussed": [
    { "amount": 250, "currency": "GBP", "context": "Initial quote for 5-page site" }
  ],
  "finalPrice": { "amount": 250, "currency": "GBP", "context": "Agreed price" },
  "keyTopics": ["Website Redesign", "Mobile Optimization", "Pricing"],
  "sentiment": "positive",
  "actionItems": [
    "Send demo preview link",
    "Follow up in 24 hours"
  ],
  "clientInterestLevel": "high"
}
Allowed sentiment values: "positive", "neutral", "negative", "mixed".
Allowed clientInterestLevel values: "very_low", "low", "medium", "high", "very_high".

Conversation:
${conversationText}`;

        const genAI = new GoogleGenerativeAI(apiKey);
        const modelNames = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];
        
        let responseText = null;
        for (const mName of modelNames) {
          try {
            const model = genAI.getGenerativeModel({
              model: mName,
              generationConfig: { responseMimeType: 'application/json' },
            });
            const result = await model.generateContent(prompt);
            responseText = result.response.text();
            if (responseText) break;
          } catch (modelErr) {
            console.warn(`Model ${mName} attempt failed:`, modelErr.message);
          }
        }

        if (responseText) {
          let cleaned = responseText.trim();
          if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
          if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
          if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
          insights = JSON.parse(cleaned.trim());
        }
      } catch (geminiError) {
        console.warn('Gemini API call encountered an issue, falling back to smart NLP engine:', geminiError.message);
      }
    }

    // Fallback to intelligent rule-based / NLP analyzer if Gemini not available
    if (!insights || !insights.summary) {
      insights = generateHeuristicInsights(conversation.messages);
    }

    // Format & save insights
    conversation.aiInsights = {
      summary: insights.summary || 'Conversation analyzed successfully.',
      pricesDiscussed: (insights.pricesDiscussed || []).map((p) => ({
        amount: Number(p.amount) || 0,
        currency: p.currency || 'GBP',
        context: p.context || '',
      })),
      finalPrice: insights.finalPrice
        ? {
            amount: Number(insights.finalPrice.amount) || 0,
            currency: insights.finalPrice.currency || 'GBP',
            context: insights.finalPrice.context || '',
          }
        : undefined,
      keyTopics: Array.isArray(insights.keyTopics) ? insights.keyTopics : [],
      sentiment: ['positive', 'neutral', 'negative', 'mixed'].includes(insights.sentiment) ? insights.sentiment : 'neutral',
      actionItems: Array.isArray(insights.actionItems) ? insights.actionItems : [],
      clientInterestLevel: ['very_low', 'low', 'medium', 'high', 'very_high'].includes(insights.clientInterestLevel) ? insights.clientInterestLevel : 'medium',
      analyzedAt: new Date(),
    };

    await conversation.save();

    res.json({
      success: true,
      insights: conversation.aiInsights,
    });
  } catch (error) {
    console.error('Conversation analysis error:', error);
    next(new AppError(error.message || 'AI analysis failed', 500));
  }
};

module.exports = {
  analyzeConversation,
};

