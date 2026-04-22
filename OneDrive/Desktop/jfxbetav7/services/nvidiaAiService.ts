import { Trade, UserProfile, DailyBias } from "../types";
import { calculateStats } from "../lib/statsUtils";
import { cleanThinkingTags, isInsideThinkingBlock } from "../lib/thinkingCleaner";

const API_KEY = import.meta.env.VITE_NVIDIA_API_KEY || "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";
const BASE_URL = import.meta.env.DEV
  ? "/api/nvidia"
  : (import.meta.env.VITE_NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1");

export const NV_MODELS = {
  deepseek: {
    id: "minimaxai/minimax-m2.5",
    name: "MiniMax M2.5",
    description: "Fast model - SOTA in coding & agentic tasks",
    type: "fast" as const,
  },
  kimi: {
    id: "moonshotai/kimi-k2-thinking",
    name: "Kimi K2 Thinking",
    description: "Best thinking model with 256K context",
    type: "thinking" as const,
  },
};

export type NVModelType = keyof typeof NV_MODELS;

const SPECIALIZED_PROMPTS = {
  psychology: {
    system: "You are a trading psychology expert specializing in emotional state management and mental peak performance.",
    templates: {
      tilt: "Create a comprehensive tilt management protocol for handling trading drawdown. Include: 1) Early warning signs identification 2) Immediate action steps 3) Reset rituals 4) Journaling prompts 5) Return-to-trading criteria",
      mindset: "Analyze the user's trading psychology based on their trade data. Include: 1) Emotional pattern analysis 2) Risk tolerance assessment 3) Confidence calibration 4) Recommended mindset shifts 5) Daily mental warmup routine",
      focus: "Design a focus enhancement protocol. Include: 1) Pre-session preparation ritual 2) Attention anchors 3) Distraction mitigation 4) Peak state triggers 5) Session closure analysis"
    }
  },
  scaling: {
    system: "You are a risk management and capital growth specialist for traders.",
    templates: {
      roadmap: "Design a 90-day capital scaling roadmap. Include: 1) Current risk parameters analysis 2) Phase-by-phase progression 3) Risk-adjusted position sizing 4) Milestone markers 5) Drawdown contingencies",
      risk: "Analyze current risk parameters and suggest optimizations. Include: 1) Current risk per trade assessment 2) Correlation analysis 3) Position sizing recommendations 4) Exposure limits 5) Emergency protocols",
      compound: "Create a compounding strategy. Include: 1) Base capital calculation 2) Growth targets 3) Risk scaling formula 4) Performance thresholds 5) Capital preservation rules"
    }
  },
  analysis: {
    system: "You are an elite trading performance analyst.",
    templates: {
      audit: "Perform a deep performance audit. Include: 1) Win rate analysis by pair/time/emotion 2) Best and worst setups 3) Execution quality assessment 4) Risk management score 5) Key improvement areas 6) Personalized action plan",
      comparison: "Create a before/after performance comparison. Include: 1) Key metric changes 2) Behavioral shifts 3) Strategy evolution 4) Lessons learned 5) Next phase recommendations"
    }
  }
};

async function chatCompletion(
  model: string,
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  onStream?: (text: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const isThinkingModel = model.includes('kimi') || model.includes('thinking');
  
  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      stream: !!onStream,
      max_tokens: 4096,
      temperature: 0.2,
      top_p: 0.9,
      ...(isThinkingModel ? {} : {
        extra_body: {
          thinking: { type: "no_think" },
          chat_template_kwargs: { enable_thinking: false }
        }
      }),
    }),
    signal: signal as any,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`NVIDIA API error: ${response.status} - ${error}`);
  }

  if (onStream && response.body) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";
    let buffer = "";

    while (true) {
      if (signal?.aborted) {
        throw new Error("Generation aborted");
      }
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6);
      if (data === "[DONE]") break;

      try {
        const json = JSON.parse(data);
        const delta = json.choices?.[0]?.delta;
        const content = delta?.content;
        const reasoningContent = delta?.reasoning_content;
        
        // Skip reasoning content entirely - it's internal thinking
        if (reasoningContent) {
          continue;
        }
        
        if (content) {
          fullText += content;
          
          // Only stream if we're not inside a thinking block
          if (!isInsideThinkingBlock(fullText)) {
            const cleaned = cleanThinkingTags(fullText);
            onStream(cleaned);
          }
        }
      } catch {}
    }
  }
  return cleanThinkingTags(fullText);
}

const json = await response.json();
const message = json.choices?.[0]?.message;
const content = message?.content || "";
// Return only the content, not the reasoning_content
return cleanThinkingTags(content);
}

export const nvidiaAiService = {
  async generateResponse(
    query: string,
    trades: Trade[],
    userProfile: UserProfile | null,
    dailyBias: DailyBias[] = [],
    analyticsSnapshot: any = null,
    isSpecialAnalysis: boolean = false,
    history: { role: 'user' | 'assistant', content: string }[] = [],
    modelType: NVModelType = "deepseek",
    isPlanMode: boolean = false,
    onStream?: (text: string) => void,
    signal?: AbortSignal
  ) {
    if (!API_KEY) {
      return "AI not configured. Please add NVIDIA API key.";
    }

    if (signal?.aborted) {
      throw new Error("Generation aborted");
    }

    try {
      const sortedTrades = [...trades].sort((a, b) => {
        const dateTimeA = new Date(`${a.date}T${a.time}`);
        const dateTimeB = new Date(`${b.date}T${b.time}`);
        return dateTimeB.getTime() - dateTimeA.getTime();
      });

      const stats = calculateStats(sortedTrades);
      const last30Days = sortedTrades.filter(t => {
        const tradeDate = new Date(`${t.date}T${t.time}`);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return tradeDate >= thirtyDaysAgo;
      });
      const last7Days = sortedTrades.filter(t => {
        const tradeDate = new Date(`${t.date}T${t.time}`);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return tradeDate >= sevenDaysAgo;
      });
      
      const last30Stats = calculateStats(last30Days);
      const last7Stats = calculateStats(last7Days);

      const emotionData = sortedTrades.reduce((acc: Record<string, { wins: number, losses: number, pnl: number }>, t) => {
        const emotion = t.mindset || 'Neutral';
        if (!acc[emotion]) acc[emotion] = { wins: 0, losses: 0, pnl: 0 };
        if (t.result === 'Win') acc[emotion].wins++;
        else if (t.result === 'Loss') acc[emotion].losses++;
        acc[emotion].pnl += t.pnl;
        return acc;
      }, {});

      const dataSummary = {
        profile: {
          name: userProfile?.name,
          plan: userProfile?.plan,
          experience: userProfile?.experienceLevel,
          riskPerTrade: userProfile?.defaultRR,
          balance: userProfile?.initialBalance,
          currency: userProfile?.currencySymbol,
        },
        performance: {
          totalTrades: stats.totalTrades,
          netProfit: stats.netProfit.toFixed(2),
          winRate: `${stats.winRate.toFixed(2)}%`,
          profitFactor: stats.profitFactor.toFixed(2),
          avgWin: stats.avgWin.toFixed(2),
          avgLoss: stats.avgLoss.toFixed(2),
        },
        last30Days: {
          trades: last30Stats.totalTrades,
          pnl: last30Stats.netProfit.toFixed(2),
          winRate: `${last30Stats.winRate.toFixed(1)}%`,
        },
        last7Days: {
          trades: last7Stats.totalTrades,
          pnl: last7Stats.netProfit.toFixed(2),
          winRate: `${last7Stats.winRate.toFixed(1)}%`,
        },
        emotionAnalysis: emotionData,
        pairStats: Object.entries(stats.pairStats).reduce((acc, [pair, data]) => {
          acc[pair] = { pnl: data.pnl.toFixed(2), trades: data.trades, winRate: `${((data.wins / data.trades) * 100).toFixed(1)}%` };
          return acc;
        }, {} as Record<string, any>),
        recentTrades: sortedTrades.slice(0, 30).map(t => ({
          id: t.ticketId || t.id.slice(0, 8),
          date: t.date,
          pair: t.pair,
          pnl: t.pnl.toFixed(2),
          result: t.result,
          emotion: t.mindset,
          mistake: t.tradingMistake,
          adherence: t.planAdherence
        })),
        last5Trades: sortedTrades.slice(0, 5).map(t => ({
          pair: t.pair,
          direction: t.direction,
          pnl: t.pnl.toFixed(2),
          result: t.result,
          mistake: t.tradingMistake
        }))
      };

      let finalSystemPrompt = "";
      
      if (query.toLowerCase().includes('psychology') || query.toLowerCase().includes('tilt') || query.toLowerCase().includes('mindset') || query.toLowerCase().includes('emotion')) {
        const psychType = query.toLowerCase().includes('tilt') ? 'tilt' : query.toLowerCase().includes('mindset') ? 'mindset' : 'focus';
        finalSystemPrompt = `${SPECIALIZED_PROMPTS.psychology.system}\n\n${SPECIALIZED_PROMPTS.psychology.templates[psychType]}\n\n`;
      } else if (query.toLowerCase().includes('scale') || query.toLowerCase().includes('growth') || query.toLowerCase().includes('compound') || query.toLowerCase().includes('risk') || query.toLowerCase().includes('position')) {
        const scaleType = query.toLowerCase().includes('scale') || query.toLowerCase().includes('growth') ? 'roadmap' : query.toLowerCase().includes('risk') ? 'risk' : 'compound';
        finalSystemPrompt = `${SPECIALIZED_PROMPTS.scaling.system}\n\n${SPECIALIZED_PROMPTS.scaling.templates[scaleType]}\n\n`;
      } else {
        finalSystemPrompt = `You are the JournalFX Elite AI Architect. Your mission is to help ${userProfile?.name?.split(' ')[0] || 'Trader'} achieve peak trading performance.\n\n`;
      }

      finalSystemPrompt += `
CORE PRINCIPLES:
- BE CONCISE. Provide short, actionable insights. Use bullet points for readability.
- FORMAT FOR READABILITY. Use Markdown with short headings, bold labels, bullets, and clear paragraph spacing.
- DEEP ANALYSIS: Use exactly these structured sections for audits:
  [SECTION:SNAPSHOT] (Summarize current performance condition using the real metrics)
  [SECTION:EDGE] (Explain what is working and where the edge is coming from)
  [SECTION:LEAKS] (Explain gaps, execution errors, or behavior leaks)
  [SECTION:PLAYBOOK] (Give a concrete fix plan with rules and operating constraints)
  [SECTION:TARGETS] (Suggest specific, measurable growth targets)

- STRATEGY PLANNING: If isPlanMode is ${isPlanMode}, you are in ARCHITECT MODE. Focus on building strategy blueprints.
  - FAVOR structure over narrative. Produce organized plans with explicit operating rules.
  - If the user requests a strategy or blueprint, prefer section tags such as [SECTION:OVERVIEW], [SECTION:MARKET_FIT], [SECTION:EXECUTION_BLUEPRINT], [SECTION:RISK_FRAMEWORK], [SECTION:ROUTINE], [SECTION:SCORECARD] when asked.
  - USE CHECKLISTS: To define rules, use [WIDGET:CHECKLIST:Title]Rule 1|Rule 2|Rule 3[/WIDGET:CHECKLIST].
  - USE DIAGRAMS: For visual logic, use [WIDGET:MERMAID:FLOWCHART]graph TD; A-->B;[/WIDGET:MERMAID]. Supported: FLOWCHART, SEQUENCE, GANTT, PIE.
WIDGETS:
- DO NOT use interactive chart widgets.
- ONLY use [SECTION:...] and [WIDGET:CHECKLIST/MERMAID] tags. Respond in plain Markdown otherwise.

IMPORTANT:
- Use ONLY the provided TRADING DATA and ANALYTICS SNAPSHOT as source-of-truth for numbers, rankings, and factual claims.
- If a metric is not present in the provided data, say it is unavailable. Do not estimate, assume, invent, or "fill in" missing values.
- When the user asks about analytics, prefer the exact widget-backed numbers from ANALYTICS SNAPSHOT over general summaries.
- NEVER include internal thinking, reasoning traces, or analysis in your response.
- Your response must be clean, final output only - never show your working.
- Never use tags like <system-reminder> or include any thinking/deliberation in your output.
- Never wrap your response in any tags like <thinking>, <thought>, <reflection>, <reasoning>, or <analysis>.
- Never use special markers like ｜begin▁of▁think｜, ｜end▁of▁think｜, or similar Unicode markers.
- Output only your final answer - no analysis, no reasoning, no working shown.
- Start your response directly with the answer, never with thinking or reasoning blocks.

COMMUNICATION STYLE: Concise.
Keep responses compact by default:
- Lead with the answer.
- Prefer 3 to 6 bullets or a short paragraph.
- Skip extra explanation unless the user explicitly asks for detail.
- Avoid repeating the user's question or adding filler.

TRADING DATA:
${JSON.stringify(dataSummary, null, 2)}

ANALYTICS SNAPSHOT:
${JSON.stringify(analyticsSnapshot, null, 2)}

Respond in valid Markdown for elite-level performance coaching.`;

      const modelId = NV_MODELS[modelType].id;
      
      const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
        { role: "system", content: "/no_think" },
        { role: "system", content: finalSystemPrompt }
      ];

      history.forEach(h => {
        messages.push({ role: h.role, content: h.content });
      });
      messages.push({ role: "user", content: query });

      return chatCompletion(modelId, messages, onStream, signal);
    } catch (error: any) {
      console.error("NVIDIA AI Error:", error);
      throw error;
    }
  }
};
