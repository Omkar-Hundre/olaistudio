/**
 * ==============================================================================
 * Live Supabase Database Session & Memory Inspector
 * ==============================================================================
 * Connects directly to Supabase and inspects REAL stored conversation sessions,
 * root workflow nodes, raw hidden commands, and vision plans.
 * ==============================================================================
 */

try {
  if (typeof process !== 'undefined' && process.loadEnvFile) {
    process.loadEnvFile();
  }
} catch (e) {}

import { supabase } from '../src/lib/supabase.js';
import { parseSystemCommands } from '../src/utils/systemCommandParser.js';
import { estimateTokens } from '../src/utils/tokenBudget.js';

async function inspectDatabaseSessions() {
  console.log('\n' + '═'.repeat(78));
  console.log('  🔍 LIVE SUPABASE DATABASE SESSION & MEMORY INSPECTOR');
  console.log('═'.repeat(78) + '\n');

  const { data: sessions, error: sessionErr } = await supabase
    .from('workflow_sessions')
    .select('*')
    .order('created_at', { ascending: false });

  if (sessionErr) {
    console.error('❌ Failed to fetch workflow_sessions:', sessionErr.message);
    return;
  }

  if (!sessions || sessions.length === 0) {
    console.log('ℹ️ No active workflow_sessions found in database.');
    return;
  }

  console.log(`Found ${sessions.length} recorded session(s) in public.workflow_sessions:\n`);

  for (let i = 0; i < sessions.length; i++) {
    const s = sessions[i];
    console.log(`┌─────────────────────────────────────────────────────────────────────────────`);
    console.log(`│ [SESSION ${i + 1}/${sessions.length}] ID: ${s.id}`);
    console.log(`│ Title: "${s.title}" | Mode: ${s.mode} | Status: ${s.status} | Confidence: ${s.confidence_score}%`);
    console.log(`│ Created: ${s.created_at} | Updated: ${s.updated_at}`);
    console.log(`└─────────────────────────────────────────────────────────────────────────────`);

    // Fetch associated root node
    const { data: nodes, error: nodeErr } = await supabase
      .from('workflow_nodes')
      .select('*')
      .eq('session_id', s.id)
      .order('created_at', { ascending: true });

    if (nodeErr) {
      console.log(`  ❌ Failed to fetch nodes for session: ${nodeErr.message}`);
      continue;
    }

    if (nodes && nodes.length > 0) {
      const rootNode = nodes[0];
      const history = rootNode.conversation_history || [];
      const hidden = rootNode.hidden_commands || {};

      console.log(`  📦 Level 2 Node Memory (Node ID: ${rootNode.id}):`);
      console.log(`     • History Turns: ${history.length} messages (${JSON.stringify(history).length} chars | ~${estimateTokens(JSON.stringify(history))} tokens)`);
      console.log(`     • Credits Consumed: ${rootNode.credits_consumed || 0}`);
      console.log(`     • Hidden Commands Stored: ${Object.keys(hidden).length > 0 ? 'YES' : 'NONE'}`);

      console.log('\n  💬 Verbatim Stored Message Turns:');
      history.forEach((m, idx) => {
        const roleIcon = m.role === 'user' ? '👤 USER' : '🤖 AI  ';
        const textSnippet = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
        const charLen = textSnippet.length;
        console.log(`     [Turn ${idx + 1}] ${roleIcon} (${charLen} chars | ~${estimateTokens(textSnippet)} tokens):`);
        
        // Print first 4 lines of message
        const lines = textSnippet.split('\n');
        lines.slice(0, 4).forEach(l => console.log(`       │ ${l}`));
        if (lines.length > 4) console.log(`       │ ... [${lines.length - 4} more lines]`);
      });

      if (hidden && Object.keys(hidden).length > 0) {
        console.log('\n  ⚙️ Hidden Commands Payload Stored in DB:');
        console.log(`     • Suggested Title: "${hidden.suggested_title || 'N/A'}"`);
        console.log(`     • Questions Count: ${hidden.questions?.length || 0}`);
        if (hidden.questions && hidden.questions.length > 0) {
          hidden.questions.forEach((q, qIdx) => {
            console.log(`       ${qIdx + 1}. ${q.question || q.question_text}`);
            if (q.options) {
              q.options.forEach((opt, oIdx) => console.log(`          - Option ${oIdx + 1}: ${opt}`));
            }
          });
        }
      }
    }

    if (s.vision_content) {
      console.log(`\n  🌟 Level 3 Master Plan Stored in DB (${s.vision_content.length} chars | ~${estimateTokens(s.vision_content)} tokens):`);
      const vLines = s.vision_content.split('\n');
      vLines.slice(0, 8).forEach(l => console.log(`     │ ${l}`));
      if (vLines.length > 8) console.log(`     │ ... [${vLines.length - 8} more lines]`);
    } else {
      console.log(`\n  🌟 Level 3 Master Plan: Not yet generated (Alignment at ${s.confidence_score}%)`);
    }

    console.log('\n' + '─'.repeat(78) + '\n');
  }
}

inspectDatabaseSessions();
