import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import embeddingService from '@/services/embeddingService';

const geminiKey = process.env.GEMINI_API_KEY;
const isMockMode = process.env.MOCK_MODE === 'true';
const isLiveGemini = !isMockMode && geminiKey && geminiKey !== 'your_gemini_key' && geminiKey.trim() !== '';

let geminiClient = null;
if (isLiveGemini) {
  geminiClient = new GoogleGenerativeAI(geminiKey);
}

export async function POST(req) {
  try {
    const { messages, userMessage } = await req.json();

    if (!userMessage || !userMessage.text) {
      return NextResponse.json({ error: 'Missing userMessage content' }, { status: 400 });
    }

    const textToEmbed = userMessage.text;
    const embedding = await embeddingService.generateEmbedding(textToEmbed);
    const matches = await embeddingService.findSimilarIncidents(embedding, 0.75, 1);

    const replyMessages = [];

    // 1. If dynamic similarity matching detects a reincarnation, trigger a SRE Co-Pilot alert!
    if (matches && matches.length > 0) {
      const bestMatch = matches[0];
      replyMessages.push({
        timestamp: new Date().toISOString(),
        user_name: "sre-bot",
        text: `⚠️ *SRE Co-Pilot Warning*: High semantic similarity (${Math.round(bestMatch.similarity * 100)}% match) detected against historical incident *${bestMatch.incident_id}* (${bestMatch.title}). The original remediation ticket *LIN-101* was deprioritized in backlog. Suggest auditing pool thresholds.`
      });
    }

    // 2. Generate simulated SRE dialogue to keep the war room alive and interactive
    const cleanMsgText = textToEmbed.toLowerCase();
    
    if (cleanMsgText.includes('pool') || cleanMsgText.includes('database') || cleanMsgText.includes('db')) {
      replyMessages.push({
        timestamp: new Date(Date.now() + 500).toISOString(),
        user_name: "Developer Captain",
        text: "I see. Checking the Sentry logs now. Yes, we are hitting ConnectionPoolTimeoutException! Let's check pool parameters. SRE Pirate, should we scale the connection limits to 150?"
      });
      replyMessages.push({
        timestamp: new Date(Date.now() + 1000).toISOString(),
        user_name: "SRE Pirate",
        text: "I'm on it. I'll execute the configuration update to scale connections. Prepare the commit to push the pool max to 150."
      });
    } else if (cleanMsgText.includes('redis') || cleanMsgText.includes('cache') || cleanMsgText.includes('eviction')) {
      replyMessages.push({
        timestamp: new Date(Date.now() + 500).toISOString(),
        user_name: "SRE Pirate",
        text: "Redis eviction metrics just spiked. The volatile-lru policy is dropping sessions. Let me increase the maxmemory threshold as a hotfix."
      });
    } else if (cleanMsgText.includes('oom') || cleanMsgText.includes('memory') || cleanMsgText.includes('leak')) {
      replyMessages.push({
        timestamp: new Date(Date.now() + 500).toISOString(),
        user_name: "Developer Captain",
        text: "Heap usage is growing linearly. Auth controller instance pods are leaking. I will verify if we have open streams that aren't being closed."
      });
    } else if (cleanMsgText.includes('status') || cleanMsgText.includes('latency')) {
      replyMessages.push({
        timestamp: new Date(Date.now() + 500).toISOString(),
        user_name: "sre-bot",
        text: "📈 *Datadog telemetry update*: API gateway p99 latencies are at *1850ms* (threshold 200ms). Web check is failing."
      });
    } else {
      // General response
      if (isLiveGemini) {
        try {
          const model = geminiClient.getGenerativeModel({ model: 'gemini-1.5-flash' });
          const prompt = `You are a helpful SRE bot in WeMakeDevs incident war room chat. Respond briefly and objectively (1-2 sentences) in a collaborative team tone to this message: "${textToEmbed}"`;
          const result = await model.generateContent(prompt);
          replyMessages.push({
            timestamp: new Date().toISOString(),
            user_name: "sre-bot",
            text: result.response.text().trim()
          });
        } catch (e) {
          // ignore and fall through
        }
      }

      if (replyMessages.length === 0) {
        replyMessages.push({
          timestamp: new Date().toISOString(),
          user_name: "sre-bot",
          text: "Copy that. Telemetry monitors are active. Let's dig deeper into Sentry exceptions or recent deployment commits."
        });
      }
    }

    return NextResponse.json({
      success: true,
      replies: replyMessages
    });
  } catch (err) {
    console.error('❌ War Room Chat API failed:', err);
    return NextResponse.json({ error: 'Internal Server Error', message: err.message }, { status: 500 });
  }
}
