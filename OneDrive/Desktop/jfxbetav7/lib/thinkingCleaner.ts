export function cleanThinkingTags(text: string): string {
  if (!text) return '';
  
  let result = text;
  
  // Kimi K2 Thinking format with full-width pipe ｜ and special characters
  // These use Unicode full-width pipe (U+FF5C) and lower one-eighth block (U+2581)
  result = result.replace(/<｜begin▁of▁think｜>[\s\S]*?<｜end▁of▁think｜>/gi, '');
  result = result.replace(/<｜begin▁of▁thought｜>[\s\S]*?<｜end▁of▁thought｜>/gi, '');
  result = result.replace(/<｜tool▁calls▁begin｜>[\s\S]*?<｜tool▁calls▁end｜>/gi, '');
  
  // Standard thinking tags
  result = result.replace(/<think\b[^>]*>[\s\S]*?<\/think>/gi, '');
  result = result.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');
  result = result.replace(/<thought>[\s\S]*?<\/thought>/gi, '');
  result = result.replace(/<reflection>[\s\S]*?<\/reflection>/gi, '');
  result = result.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '');
  result = result.replace(/<analysis>[\s\S]*?<\/analysis>/gi, '');
  
  // Developer/dev tags
  result = result.replace(/｜developer｜[\s\S]*?｜dev｜/gi, '');
  result = result.replace(/<\|developer\|>[\s\S]*?<\|dev\|>/gi, '');
  
  // NVIDIA partial format (when tag is cut off)
  result = result.replace(/ialized thinking[\s\S]*?<\/thinking>/gi, '');
  result = result.replace(/ialized thought[\s\S]*?<\/thought>/gi, '');
  
  // System reminders
  result = result.replace(/<system-reminder>[\s\S]*?<\/system-reminder>/gi, '');
  
  // Opening tags without closing (partial/incomplete)
  result = result.replace(/<think\b[^>]*>/gi, '');
  result = result.replace(/<thinking>/gi, '');
  result = result.replace(/<thought>/gi, '');
  result = result.replace(/<reflection>/gi, '');
  result = result.replace(/<reasoning>/gi, '');
  result = result.replace(/<analysis>/gi, '');
  
  // Closing tags without opening
  result = result.replace(/<\/think>/gi, '');
  result = result.replace(/<\/thinking>/gi, '');
  result = result.replace(/<\/thought>/gi, '');
  result = result.replace(/<\/reflection>/gi, '');
  result = result.replace(/<\/reasoning>/gi, '');
  result = result.replace(/<\/analysis>/gi, '');
  
  // Standalone partial markers
  result = result.replace(/ialized thinking\n/gi, '');
  result = result.replace(/\nialized thinking/gi, '');
  result = result.replace(/ialized thinking/gi, '');
  result = result.replace(/ialized thought/gi, '');
  
  // Standalone Unicode markers (Kimi format partials)
  result = result.replace(/｜developer｜/gi, '');
  result = result.replace(/｜dev｜/gi, '');
  result = result.replace(/<｜begin▁of▁think｜>/gi, '');
  result = result.replace(/<｜end▁of▁think｜>/gi, '');
  result = result.replace(/<｜begin▁of▁thought｜>/gi, '');
  result = result.replace(/<｜end▁of▁thought｜>/gi, '');
  result = result.replace(/<｜tool▁calls▁begin｜>/gi, '');
  result = result.replace(/<｜tool▁calls▁end｜>/gi, '');
  
  // Alternative pipe characters (regular | instead of full-width ｜)
  result = result.replace(/<\|begin_of_think\|>[\s\S]*?<\|end_of_think\|>/gi, '');
  result = result.replace(/<\|begin_of_thought\|>[\s\S]*?<\|end_of_thought\|>/gi, '');
  result = result.replace(/<\|begin_of_think\|>/gi, '');
  result = result.replace(/<\|end_of_think\|>/gi, '');
  result = result.replace(/<\|begin_of_thought\|>/gi, '');
  result = result.replace(/<\|end_of_thought\|>/gi, '');
  
  // Clean up multiple newlines
  result = result.replace(/\n{3,}/g, '\n\n');
  
  return result.trim();
}

export function isInsideThinkingBlock(text: string): boolean {
  const openTags = [
    '<think>',
    '<thinking>', '<thought>', '<reflection>', '<reasoning>', '<analysis>',
    '<｜begin▁of▁think｜>', '<｜begin▁of▁thought｜>',
    '<|begin_of_think|>', '<|begin_of_thought|>'
  ];
  
  const closeTags = [
    '</think>',
    '</thinking>', '</thought>', '</reflection>', '</reasoning>', '</analysis>',
    '<｜end▁of▁think｜>', '<｜end▁of▁thought｜>',
    '<|end_of_think|>', '<|end_of_thought|>'
  ];
  
  const textLower = text.toLowerCase();
  
  for (let i = 0; i < openTags.length; i++) {
    const openTag = openTags[i].toLowerCase();
    const closeTag = closeTags[i].toLowerCase();
    
    const lastOpen = textLower.lastIndexOf(openTag);
    const lastClose = textLower.lastIndexOf(closeTag);
    
    if (lastOpen > lastClose) {
      return true;
    }
  }
  
  return false;
}

export function stripStreamingThinking(content: string, accumulated: string): string {
  // If we're inside a thinking block, return empty string
  if (isInsideThinkingBlock(accumulated)) {
    return '';
  }
  
  // Check if this chunk starts a thinking block
  const thinkingStarters = [
    '<think', '<thinking', '<thought', '<reflect', '<reason', '<analy',
    '<｜', '<|', 'ialized'
  ];
  
  const contentLower = content.toLowerCase();
  for (const starter of thinkingStarters) {
    if (contentLower.includes(starter)) {
      // This chunk contains thinking tag start, clean it
      return '';
    }
  }
  
  return content;
}
