/**
 * ==============================================================================
 * Relational Workflow & DAG Service
 * ==============================================================================
 * Manages full lifecycle of workflow sessions, nodes, dependencies, and Level 3 memory:
 * - Direct integration with Supabase `workflow_sessions`, `workflow_nodes`, and `workflow_node_dependencies`
 * - Enforces Row Level Security (RLS)
 * - Exposes real-time subscription helpers for live UI updates
 * ==============================================================================
 */

import { supabase } from '../lib/supabase';

/**
 * Creates a new workflow session (Mother Agent root session)
 * @param {Object} params
 * @param {string} [params.title='Untitled Project']
 * @param {string} [params.mode='research']
 * @param {Object} [params.globalContext={}]
 * @returns {Promise<{ session: Object | null, error: string | null }>}
 */
export async function createWorkflowSession({ title = 'Untitled Project', mode = 'research', globalContext = {} }) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Authentication required to create a workflow session.');

    const { data, error } = await supabase
      .from('workflow_sessions')
      .insert({
        user_id: user.id,
        title,
        mode,
        status: 'interviewing',
        confidence_score: 35,
        global_context: globalContext,
      })
      .select()
      .single();

    if (error) throw error;
    return { session: data, error: null };
  } catch (err) {
    console.error('Error creating workflow session:', err);
    return { session: null, error: err.message };
  }
}

/**
 * Fetches a workflow session by ID
 * @param {string} sessionId
 * @returns {Promise<{ session: Object | null, error: string | null }>}
 */
export async function getWorkflowSession(sessionId) {
  try {
    const { data, error } = await supabase
      .from('workflow_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) throw error;
    return { session: data, error: null };
  } catch (err) {
    return { session: null, error: err.message };
  }
}

/**
 * Updates a workflow session record
 * @param {string} sessionId
 * @param {Object} updates
 * @returns {Promise<{ session: Object | null, error: string | null }>}
 */
export async function updateWorkflowSession(sessionId, updates) {
  try {
    const { data, error } = await supabase
      .from('workflow_sessions')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;
    return { session: data, error: null };
  } catch (err) {
    return { session: null, error: err.message };
  }
}

/**
 * Creates a workflow node (Root manager depth=0 or Child worker depth>=1)
 * @param {Object} params
 * @returns {Promise<{ node: Object | null, error: string | null }>}
 */
export async function createWorkflowNode({
  sessionId,
  parentId = null,
  nodeType = 'worker',
  executionMode = 'parallel',
  title,
  depth = 1,
  orderIndex = 0,
  systemPrompt = '',
  inputContext = {},
  modelUsed = 'gemini-2.5-flash',
}) {
  try {
    const { data, error } = await supabase
      .from('workflow_nodes')
      .insert({
        session_id: sessionId,
        parent_id: parentId,
        node_type: nodeType,
        execution_mode: executionMode,
        title,
        depth,
        order_index: orderIndex,
        status: 'pending',
        system_prompt: systemPrompt,
        input_context: inputContext,
        model_used: modelUsed,
      })
      .select()
      .single();

    if (error) throw error;
    return { node: data, error: null };
  } catch (err) {
    console.error('Error creating workflow node:', err);
    return { node: null, error: err.message };
  }
}

/**
 * Fetches all nodes belonging to a session ordered by depth and order_index
 * @param {string} sessionId
 * @returns {Promise<{ nodes: Array, error: string | null }>}
 */
export async function getWorkflowNodes(sessionId) {
  try {
    const { data, error } = await supabase
      .from('workflow_nodes')
      .select('*')
      .eq('session_id', sessionId)
      .order('depth', { ascending: true })
      .order('order_index', { ascending: true });

    if (error) throw error;
    return { nodes: data || [], error: null };
  } catch (err) {
    return { nodes: [], error: err.message };
  }
}

/**
 * Updates a workflow node (status, output_payload, conversation_history, etc.)
 * @param {string} nodeId
 * @param {Object} updates
 * @returns {Promise<{ node: Object | null, error: string | null }>}
 */
export async function updateWorkflowNode(nodeId, updates) {
  try {
    const { data, error } = await supabase
      .from('workflow_nodes')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', nodeId)
      .select()
      .single();

    if (error) throw error;
    return { node: data, error: null };
  } catch (err) {
    return { node: null, error: err.message };
  }
}

/**
 * Appends a message to a node's Level 3 conversation history
 * @param {string} nodeId
 * @param {Object} message - { role: 'user'|'assistant', content: string, timestamp: string }
 * @returns {Promise<{ success: boolean, error: string | null }>}
 */
export async function appendNodeMessage(nodeId, message) {
  try {
    const { data: node, error: fetchErr } = await supabase
      .from('workflow_nodes')
      .select('conversation_history')
      .eq('id', nodeId)
      .single();

    if (fetchErr) throw fetchErr;

    const existingHistory = Array.isArray(node.conversation_history) ? node.conversation_history : [];
    const updatedHistory = [...existingHistory, message];

    const { error: updateErr } = await supabase
      .from('workflow_nodes')
      .update({
        conversation_history: updatedHistory,
        updated_at: new Date().toISOString(),
      })
      .eq('id', nodeId);

    if (updateErr) throw updateErr;
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Establishes a real-time subscription to nodes in a session
 * @param {string} sessionId
 * @param {Function} onUpdate - Callback invoked on INSERT/UPDATE/DELETE events
 * @returns {Object} Supabase Realtime channel subscription
 */
export function subscribeToSessionNodes(sessionId, onUpdate) {
  return supabase
    .channel(`nodes:${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'workflow_nodes',
        filter: `session_id=eq.${sessionId}`,
      },
      (payload) => {
        onUpdate(payload);
      }
    )
    .subscribe();
}
