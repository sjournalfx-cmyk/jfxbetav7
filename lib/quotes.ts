import { getSASTDateTime } from './timeUtils';

export const TRADING_QUOTES = [
  { text: "The goal of a successful trader is to make the best trades. Money is secondary.", author: "Alexander Elder" },
  { text: "Trading doesn't just reveal your character, it also builds it if you stay in the game long enough.", author: "Yvan Byeajee" },
  { text: "The hard work in trading comes in the preparation. The actual process of trading, however, should be effortless.", author: "Jack Schwager" },
  { text: "In trading, you have to be defensive and aggressive at the same time. If you are not aggressive, you are not going to make money; and if you are not defensive, you are not going to keep money.", author: "Ray Dalio" },
  { text: "The core of my strategy is risk management.", author: "Paul Tudor Jones" },
  { text: "Your objective should be to find an opportunity where risk-reward ratio is best.", author: "Jaymin Shah" },
  { text: "Doubt is not a pleasant condition, but certainty is absurd.", author: "Voltaire" },
  { text: "A peak performance trader is totally committed to being the best and doing whatever it takes to be the best.", author: "Van K. Tharp" },
  { text: "Losses are necessary, as long as they are associated with a technique to help you learn from them.", author: "David Servan-Schreiber" },
  { text: "The secret to being successful from a trading perspective is to have an indefatigable and undying thirst for knowledge.", author: "Paul Tudor Jones" },
  { text: "Journaling is the only way to track your progress and identify your mistakes.", author: "Unknown" },
  { text: "Amateurs trade for the excitement. Professionals trade for the money.", author: "Unknown" },
  { text: "If you can't follow your rules, you can't follow your plan. If you can't follow your plan, you shouldn't be trading.", author: "Unknown" },
  { text: "The market is a device for transferring money from the impatient to the patient.", author: "Warren Buffett" },
  { text: "Focus on the process, not the outcome.", author: "Unknown" },
  { text: "Your discipline determines your destiny.", author: "Unknown" },
  { text: "The best trades are the ones that are easiest to take.", author: "Unknown" },
  { text: "Don't focus on making money, focus on protecting what you have.", author: "Paul Tudor Jones" },
  { text: "The trend is your friend until the end when it bends.", author: "Ed Seykota" },
  { text: "Patterns just have to work enough of the time to give you an edge.", author: "Unknown" },
  { text: "Trading is 10% strategy, 90% psychology.", author: "Unknown" },
  { text: "A trade is not a win or a loss until it's closed. A journal is not a book until it's written.", author: "Unknown" },
  { text: "Reviewing your journal is where the real growth happens.", author: "Unknown" },
  { text: "Consistency in your routine leads to consistency in your results.", author: "Unknown" },
  { text: "Treat trading as a business, not a hobby.", author: "Unknown" },
  { text: "The market doesn't owe you anything.", author: "Unknown" },
  { text: "Every mistake is a lesson. If you don't journal it, you're doomed to repeat it.", author: "Unknown" },
  { text: "Success in trading comes from having an edge and the discipline to follow it.", author: "Unknown" },
  { text: "Cut your losses short and let your winners run.", author: "David Ricardo" },
  { text: "Expect the unexpected and always have a plan.", author: "Unknown" },
  { text: "Risk only what you can afford to lose.", author: "Unknown" }
];

export const getQuoteOfDay = (date: Date = new Date()) => {
  const { date: sastDate } = getSASTDateTime(date);
  
  // Use the day of the year from SAST components to ensure rotation at SAST midnight
  const [year, month, day] = sastDate.split('-').map(Number);
  const startOfYear = new Date(year, 0, 0);
  const current = new Date(year, month - 1, day);
  const diff = current.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  const index = dayOfYear % TRADING_QUOTES.length;
  return TRADING_QUOTES[index];
};