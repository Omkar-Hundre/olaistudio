/**
 * ==============================================================================
 * System Command Parser
 * ==============================================================================
 * Extracts hidden AI commands fenced with %%%SYSTEM_CMD%%%:
 * - Strips technical JSON blocks and code fences from user view (Rule 14)
 * - Resilient JSON decoding with fallback regex extraction
 * ==============================================================================
 */

/**
 * Parses hidden system command block from AI output text
 * @param {string} text 
 * @returns {{ cleanText: string, commands: Object | null }}
 */
export function parseSystemCommands(text) {
  if (!text || typeof text !== 'string') {
    return { cleanText: text || '', commands: null };
  }

  const match = text.match(/%%%SYSTEM_CMD%%%([\s\S]*?)(?:%%%SYSTEM_CMD%%%|$)/);
  if (!match) {
    return { cleanText: text, commands: null };
  }

  const cleanText = text.replace(/%%%SYSTEM_CMD%%%[\s\S]*$/, '').trim();
  let rawJson = match[1].trim();

  // Strip markdown code fences if LLM wrapped in ```json ... ```
  rawJson = rawJson.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  let commands = null;
  try {
    commands = JSON.parse(rawJson);
  } catch {
    // Regex extraction fallback if JSON contains formatting hiccups
    try {
      const titleMatch = rawJson.match(/"suggested_title"\s*:\s*"([^"]+)"/);
      const confMatch = rawJson.match(/"confidence_score"\s*:\s*(\d+)/);
      const branchMatch = rawJson.match(/"current_branch"\s*:\s*"([^"]+)"/);
      const ctaMatch = rawJson.match(/"cta_label"\s*:\s*"([^"]+)"/);
      const readyMatch = rawJson.match(/"ready_for_vision"\s*:\s*(true|false)/i);

      if (titleMatch || confMatch || branchMatch) {
        commands = {
          suggested_title: titleMatch ? titleMatch[1] : undefined,
          confidence_score: confMatch ? parseInt(confMatch[1], 10) : undefined,
          current_branch: branchMatch ? branchMatch[1] : undefined,
          cta_label: ctaMatch ? ctaMatch[1] : undefined,
          ready_for_vision: readyMatch ? readyMatch[1].toLowerCase() === 'true' : false,
        };
      }
    } catch {}
  }

  return { cleanText, commands };
}
