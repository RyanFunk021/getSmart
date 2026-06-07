import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are an expert reading comprehension assessment designer with a background in cognitive science. You create questions that test genuine understanding — inference, analysis, and synthesis — not just surface recall. Your questions reveal whether a reader truly understood the material, not just whether they saw the words.

Always respond with valid JSON only. No prose before or after the JSON.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { passage_id } = await req.json();
    if (!passage_id) {
      return new Response(JSON.stringify({ error: 'passage_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check cache first
    const { data: cached } = await supabase
      .from('passage_ai_cache')
      .select('*')
      .eq('passage_id', passage_id)
      .single();

    if (cached) {
      return new Response(JSON.stringify({
        free_recall_prompt: cached.questions.free_recall_prompt,
        questions: cached.questions.questions,
        concept_map: cached.concept_map,
        topics: cached.questions.topics ?? [],
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Load passage
    const { data: passage, error: passageError } = await supabase
      .from('passages')
      .select('*')
      .eq('id', passage_id)
      .single();

    if (passageError || !passage) {
      return new Response(JSON.stringify({ error: 'Passage not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY')!,
    });

    const userPrompt = `Passage title: ${passage.title}
Subject: ${passage.subject}
Difficulty level: ${passage.difficulty}/10

Passage text:
${passage.body}

Generate a structured comprehension assessment as JSON with this exact structure:
{
  "free_recall_prompt": "An open-ended prompt asking the reader to write down everything they remember from the passage without looking back",
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice",
      "question": "What is the central argument or main idea of this passage?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option that matches",
      "explanation": "2-3 sentence explanation referencing specific passage content",
      "concept_tags": ["main idea", "thesis"],
      "difficulty": 4,
      "passage_evidence": "Exact quote from passage supporting the answer"
    },
    {
      "id": "q2",
      "type": "multiple_choice",
      "question": "Question about a specific key detail that supports the main argument",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Correct option text",
      "explanation": "Explanation",
      "concept_tags": ["detail"],
      "difficulty": 3,
      "passage_evidence": "Relevant quote"
    },
    {
      "id": "q3",
      "type": "inference",
      "question": "Based on the passage, what can we infer about [relevant topic]?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Correct inference",
      "explanation": "Why this inference follows from the evidence",
      "concept_tags": ["inference", "critical thinking"],
      "difficulty": 6,
      "passage_evidence": "Quote that supports the inference"
    },
    {
      "id": "q4",
      "type": "multiple_choice",
      "question": "As used in the passage, what does [specific term] most closely mean?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Correct definition",
      "explanation": "Contextual explanation",
      "concept_tags": ["vocabulary"],
      "difficulty": 4,
      "passage_evidence": "Sentence containing the term"
    },
    {
      "id": "q5",
      "type": "inference",
      "question": "A critical evaluation or application question about the passage's implications or limitations",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Best answer",
      "explanation": "Why this answer reflects the strongest critical reading",
      "concept_tags": ["critical thinking", "evaluation"],
      "difficulty": 8,
      "passage_evidence": "Supporting quote"
    }
  ],
  "concept_map": {
    "nodes": [
      {"id": "main", "label": "Central concept (5 words max)", "type": "main_idea"},
      {"id": "c1", "label": "Supporting concept 1", "type": "concept"},
      {"id": "c2", "label": "Supporting concept 2", "type": "concept"},
      {"id": "d1", "label": "Key detail", "type": "detail"},
      {"id": "d2", "label": "Key detail", "type": "detail"}
    ],
    "edges": [
      {"from": "main", "to": "c1", "relationship": "involves"},
      {"from": "main", "to": "c2", "relationship": "leads to"},
      {"from": "c1", "to": "d1", "relationship": "demonstrated by"},
      {"from": "c2", "to": "d2", "relationship": "shown by"}
    ]
  },
  "topics": ["3 to 5 topic tags as strings"]
}

Requirements:
- Scale all question difficulty to passage difficulty ${passage.difficulty}/10
- Wrong answer options should be plausible, not obviously incorrect
- Free recall prompt should be specific enough to guide writing but open enough to allow full recall
- Concept map should have 4-8 nodes capturing the key ideas and their logical relationships
- All passage_evidence must be verbatim quotes from the passage`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: [{
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Passage title: ${passage.title}\n\nPassage text:\n${passage.body}`,
            cache_control: { type: 'ephemeral' },
          },
          { type: 'text', text: userPrompt },
        ],
      }],
    });

    const content = response.content[0];
    if (content.type !== 'text') throw new Error('Unexpected response type');

    const jsonText = content.text.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '');
    const parsed = JSON.parse(jsonText);

    // Store in cache
    await supabase.from('passage_ai_cache').insert({
      passage_id,
      questions: {
        free_recall_prompt: parsed.free_recall_prompt,
        questions: parsed.questions,
        topics: parsed.topics,
      },
      concept_map: parsed.concept_map,
    });

    // Update passage topics if empty
    if (passage.topics.length === 0 && parsed.topics?.length > 0) {
      await supabase.from('passages').update({ topics: parsed.topics }).eq('id', passage_id);
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('generate-questions error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
