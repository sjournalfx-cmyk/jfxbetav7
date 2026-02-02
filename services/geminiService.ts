import { GoogleGenerativeAI } from "@google/generative-ai";
import { Trade, UserProfile, Goal, DailyBias } from "../types";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL_NAME = import.meta.env.VITE_GEMINI_MODEL || "gemini-1.5-flash";

const genAI = new GoogleGenerativeAI(API_KEY);

export const geminiService = {
  async generateResponse(
    query: string, 
    trades: Trade[], 
    userProfile: UserProfile | null,
    goals: Goal[] = [],
    dailyBias: DailyBias[] = [],
    isSpecialAnalysis: boolean = false,
    history: { role: 'user' | 'assistant', content: string }[] = [],
    modelName: string = MODEL_NAME
  ) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });

      const totalPnL = trades.reduce((acc, t) => acc + t.pnl, 0);
      const wins = trades.filter(t => t.pnl > 0);
      const winRate = trades.length > 0 ? (wins.length / trades.length) * 100 : 0;
      
      const pairStats: Record<string, number> = {};
      trades.forEach(t => {
        const pair = t.pair.toUpperCase();
        pairStats[pair] = (pairStats[pair] || 0) + t.pnl;
      });
      const bestPair = Object.entries(pairStats).sort((a, b) => b[1] - a[1])[0];
      const worstPair = Object.entries(pairStats).sort((a, b) => a[1] - b[1])[0];

      const mindsetStats: Record<string, { pnl: number, count: number }> = {};
      trades.forEach(t => {
        const m = t.mindset || 'Neutral';
        if (!mindsetStats[m]) mindsetStats[m] = { pnl: 0, count: 0 };
        mindsetStats[m].pnl += t.pnl;
        mindsetStats[m].count += 1;
      });

      const sessionStats: Record<string, number> = {};
      trades.forEach(t => {
        if (t.session) {
          sessionStats[t.session] = (sessionStats[t.session] || 0) + t.pnl;
        }
      });

      const dataSummary = {
        profile: {
          name: userProfile?.name,
          plan: userProfile?.plan,
          experience: userProfile?.experienceLevel,
          riskPerTrade: userProfile?.defaultRR,
        },
        overallPerformance: {
          totalTrades: trades.length,
          totalPnL,
          winRate: `${winRate.toFixed(2)}%`,
          bestPair: bestPair ? `${bestPair[0]} (${bestPair[1].toFixed(2)})` : 'N/A',
          worstPair: worstPair ? `${worstPair[0]} (${worstPair[1].toFixed(2)})` : 'N/A',
        },
        perPairStats: Object.entries(pairStats).reduce((acc, [pair, pnl]) => {
          const pairTrades = trades.filter(t => t.pair.toUpperCase() === pair);
          const pairWins = pairTrades.filter(t => t.pnl > 0).length;
          const pairWinRate = pairTrades.length > 0 ? (pairWins / pairTrades.length) * 100 : 0;
          acc[pair] = {
            pnl,
            trades: pairTrades.length,
            winRate: `${pairWinRate.toFixed(1)}%`,
            avgPnl: (pnl / pairTrades.length).toFixed(2)
          };
          return acc;
        }, {} as Record<string, any>),
        psychology: mindsetStats,
        sessions: sessionStats,
        activeGoals: goals.filter(g => g.status !== 'completed').map(g => g.title),
        recentBias: dailyBias.slice(-3).map(b => ({ date: b.date, bias: b.bias, note: b.notes })),
        recentTrades: trades.slice(-20).map(t => ({
          date: t.date,
          pair: t.pair,
          pnl: t.pnl,
          result: t.result,
          confluence: t.rr,
          notes: t.notes
        }))
      };

      let prompt = "";
      if (isSpecialAnalysis) {
        prompt = `
          You are the JFX Personalized Goal & Improvement Engine. 
          Perform a deep analysis of the provided user data and provide:
          1. [SECTION:LACKS]: Identify exactly where the user is leaking money (symbols, sessions, or mindset).
          2. [SECTION:RECOMMENDATIONS]: Actionable, specific steps to fix the lacks.
          3. [SECTION:GOALS]: Suggest 3 achievable goals for the next 30 days based on their current stats.          
          DATA: ${JSON.stringify(dataSummary)}

          FORMAT:
          - Use a supportive yet direct "Elite Coach" tone.
          - Use Markdown.
          - For the sections above, use the exactly tags [SECTION:NAME] followed by the content.
          - End with exactly these tags: [WIDGET:WINRATE] [WIDGET:MINDSET] [WIDGET:DRAWDOWN]
        `;
      } else {
        prompt = `
          You are JFX Assistant, an elite AI trading mentor and data analyst for the JournalFX platform.
          You have FULL ACCESS to the user's trading journal, analytics, and psychological data.

          USER DATA SUMMARY:
          ${JSON.stringify(dataSummary, null, 2)}

          USER QUERY: "${query}"

          CORE INSTRUCTIONS:
          1. CONVERSATIONAL & PERSONAL: Start greetings by acknowledging the user by name (e.g., "Hey there Phemelo!"). If they say "hi" or "hello", respond warmly and ask how you can help.
          2. ANALYZE DON'T JUST REPEAT: If a user asks "How am I doing?", look at their Win Rate, Drawdown, and Mindset. Provide a synthesis of their current trading state.
          3. BE PROACTIVE: If you see a pattern (e.g., they lose money when "Anxious" or on "GBPUSD"), highlight it immediately.          
          4. WIDGET SYSTEM (TRIGGERING PROTOCOL):
             You MUST trigger widgets whenever they are relevant to the conversation, explicitly requested, or MENTIONED using the @ symbol.
             
             AVAILABLE TAGS & @MENTIONS:
             - [WIDGET:PNL] -> @equitycurve, @pnl, @progress
             - [WIDGET:WINRATE] -> @winrate, @outcomes, @components/analytics/OutcomeDistributionWidget.tsx
             - [WIDGET:MINDSET] -> @mindset, @psychology, @discipline, @components/analytics/PerformanceRadarWidget.tsx
             - [WIDGET:SESSIONS] -> @sessions, @timing, @components/analytics/PerformanceBySession.tsx
             - [WIDGET:PAIR] -> @pairs, @symbols, @assets
             - [WIDGET:DRAWDOWN] -> @drawdown, @risk, @leaks, @components/analytics/DrawdownOverTimeWidget.tsx
             - [WIDGET:TABLE] -> @history, @trades, @list, @components/analytics/ExecutionPerformanceTable.tsx
             - [WIDGET:STRATEGY_EFFICIENCY] -> @strategy, @edge, @consistency
             - [WIDGET:CHART:SYMBOL] -> @chart, @market, @view, @SYMBOL (e.g. @EURUSD, @XAUUSD), @components/analytics/StrategyPerformanceBubbleChart.tsx, @components/analytics/PerformanceByPairWidget.tsx, @components/analytics/SymbolPerformanceWidget.tsx

             RULES:
             - If the user uses an @mention for a symbol (e.g. "@EURUSD", "@XAUUSD"), you MUST include [WIDGET:CHART:SYMBOL] for that specific pair.
             - If the user mentions @components/analytics/PerformanceByPairWidget.tsx, you MUST display a live market chart [WIDGET:CHART:SYMBOL] for their most traded or relevant pair.
             - If the user mentions @components/analytics/StrategyPerformanceBubbleChart.tsx, you MUST display a live market chart [WIDGET:CHART:SYMBOL].
             - For any symbol mention (e.g. @EURUSD) or @components/analytics/SymbolPerformanceWidget.tsx mention, provide a brief analysis of performance on that symbol using the provided perPairStats data.
             - Use the mentions to provide context-aware analysis. Don't just show the widget; explain what the data in THAT widget is telling you about their performance.

          5. GLOBAL TRADING EXPERTISE: 
             You are a world-class trading mentor. 
             - Provide professional definitions, psychological advice, and strategic insights.
             - If the user asks about concepts (Wyckoff, ICT, SMC), explain them expertly.
             - Act as a master of trading psychology and risk management.

          6. ROBUSTNESS RULES:
             - Always prioritize a clean, professional chat experience.
             - Use the tags EXACTLY as shown above.
             - If the user uses multiple @mentions, provide a multi-widget dashboard response.

          7. FORMATTING: Use professional Markdown. 
             - Use **bold** for emphasis and key metrics.
             - Use \`backticks\` for symbols or specific values.
             - Use bullet points ( - ) for lists and analysis.
             - Use > blockquotes for important psychological advice.
             - Use tables if comparing multiple data points.
             - **MENTIONS**: Always use the @mention format (e.g. @EURUSD, @equitycurve) when referring to specific symbols or widgets. This makes them interactive and highlighted in the UI.
             - Keep it structured and easy to read at a glance.

          8. CONVERSATIONAL CONTEXT:
             You must respect the flow of the conversation. If the user refers to "it" or "that chart", look at the history below to understand what they are talking about.
             
             CONVERSATION HISTORY:
             ${history.map(h => `${h.role.toUpperCase()}: ${h.content}`).join('\n')}
        `;
      }

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "I'm experiencing a brief synchronization error with your trading data. Please try again.";
    }
  }
};
