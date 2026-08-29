/**
 * ==============================================================================
 * System Command Parser
 * ==============================================================================
 * Extracts hidden AI commands fenced with %%%SYSTEM_CMD%%%:
 * - Strips technical JSON blocks from user view (Rule 14)
 * - Returns clean text for message display and structured commands payload
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

  const match = text.match(/%%%SYSTEM_CMD%%%([\s\S]*?)%%%SYSTEM_CMD%%%/);
  if (!match) {
    // If stream is still partial with unclosed %%%SYSTEM_CMD%%%, strip the trailing opening tag
    const partialClean = text.replace(/%%%SYSTEM_CMD%%%[\s\S]*$/, '').trimEnd();
    return { cleanText: partialClean, commands: null };
  }

  const cleanText = text.replace(/%%%SYSTEM_CMD%%%[\s\S]*?%%%SYSTEM_CMD%%%/, '').trim();
  let commands = null;

  try {
    commands = JSON.parse(match[1].trim());
  } catch (err) {
    console.warn('[SystemCmd] Failed to parse JSON block:', err);
  }

  return { cleanText, commands };
}
