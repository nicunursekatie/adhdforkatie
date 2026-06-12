import { EnergyLevel, EmotionalWeight, Urgency, AppSettings } from '../types';

// ---------------------------------------------------------------------------
// Fuzzy Task Breakdown engine. Turns a vague, overwhelming task into concrete,
// startable steps. Uses your own OpenAI key if you've added one (Settings),
// and otherwise falls back to a built-in heuristic so it ALWAYS produces
// something — the feature never hard-depends on AI.
// ---------------------------------------------------------------------------

export interface BreakdownInput {
  title: string;
  idealOutcome?: string;
  blockers?: string;
  timeConstraints?: string;
  people?: string;
  infoNeeded?: string;
  decisions?: string;
  waitingOn?: string;
}

export interface GeneratedStep {
  title: string;
  description?: string;
  estimatedMinutes?: number;
  energyRequired?: EnergyLevel;
  emotionalWeight?: EmotionalWeight;
  urgency?: Urgency;
}

const SYSTEM_PROMPT = `You are an executive-function coach for someone with ADHD.
Break a vague, overwhelming task into 4-6 specific, concrete, *startable* next actions.
Rules:
- Each step is a single physical or digital action someone could start in the next few minutes.
- Address the stated blockers directly. If information is missing, add a step to gather it.
- If a decision is needed, split it into a "research options" step and a separate "decide" step.
- Include communication steps (email/text/call) when other people are involved.
- Give a realistic estimatedMinutes for each step.
- Assign energyRequired ("low" | "medium" | "high") and emotionalWeight ("easy" | "neutral" | "stressful" | "dreading").
Respond ONLY with strict JSON of the form:
{"steps":[{"title":"...","description":"...","estimatedMinutes":15,"energyRequired":"low","emotionalWeight":"easy"}]}`;

function buildUserPrompt(input: BreakdownInput): string {
  const lines = [`Task: ${input.title}`];
  if (input.idealOutcome) lines.push(`Ideal outcome: ${input.idealOutcome}`);
  if (input.blockers) lines.push(`Blockers: ${input.blockers}`);
  if (input.timeConstraints) lines.push(`Time constraints: ${input.timeConstraints}`);
  if (input.people) lines.push(`People involved: ${input.people}`);
  if (input.infoNeeded) lines.push(`Information needed: ${input.infoNeeded}`);
  if (input.decisions) lines.push(`Decisions to make: ${input.decisions}`);
  if (input.waitingOn) lines.push(`Waiting on: ${input.waitingOn}`);
  return lines.join('\n');
}

export interface BreakdownResult {
  steps: GeneratedStep[];
  usedAI: boolean;
}

export async function breakdownTask(
  input: BreakdownInput,
  ai: AppSettings['ai']
): Promise<BreakdownResult> {
  if (ai.apiKey) {
    try {
      const steps = await callOpenAI(input, ai);
      if (steps.length) return { steps, usedAI: true };
    } catch {
      // fall through to heuristic
    }
  }
  return { steps: heuristicBreakdown(input), usedAI: false };
}

async function callOpenAI(input: BreakdownInput, ai: AppSettings['ai']): Promise<GeneratedStep[]> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ai.apiKey}`,
    },
    body: JSON.stringify({
      model: ai.model || 'gpt-4o-mini',
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(input) },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}`);
  const json = await res.json();
  const content = json.choices?.[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(content);
  const steps = Array.isArray(parsed.steps) ? parsed.steps : [];
  return steps.map(normalizeStep).filter((s: GeneratedStep) => s.title);
}

function normalizeStep(s: Record<string, unknown>): GeneratedStep {
  const energy = String(s.energyRequired ?? '').toLowerCase();
  const emotion = String(s.emotionalWeight ?? '').toLowerCase();
  return {
    title: String(s.title ?? '').trim(),
    description: s.description ? String(s.description) : undefined,
    estimatedMinutes: typeof s.estimatedMinutes === 'number' ? s.estimatedMinutes : undefined,
    energyRequired: ['low', 'medium', 'high'].includes(energy) ? (energy as EnergyLevel) : undefined,
    emotionalWeight: ['easy', 'neutral', 'stressful', 'dreading'].includes(emotion)
      ? (emotion as EmotionalWeight)
      : undefined,
  };
}

// Offline fallback: assemble concrete steps from whatever the user told us.
function heuristicBreakdown(input: BreakdownInput): GeneratedStep[] {
  const steps: GeneratedStep[] = [];

  steps.push({
    title: `Write down what "done" looks like for: ${input.title}`,
    description: input.idealOutcome || 'Define a clear finish line so you know when to stop.',
    estimatedMinutes: 5,
    energyRequired: 'low',
    emotionalWeight: 'easy',
  });

  if (input.infoNeeded) {
    steps.push({
      title: `Gather the info you need: ${input.infoNeeded}`,
      estimatedMinutes: 15,
      energyRequired: 'low',
      emotionalWeight: 'neutral',
    });
  }

  if (input.blockers) {
    steps.push({
      title: `Clear the blocker: ${input.blockers}`,
      description: 'Take the single smallest action that reduces this blocker.',
      estimatedMinutes: 15,
      energyRequired: 'medium',
      emotionalWeight: 'stressful',
    });
  }

  if (input.decisions) {
    steps.push({
      title: `Research options for: ${input.decisions}`,
      estimatedMinutes: 20,
      energyRequired: 'medium',
      emotionalWeight: 'neutral',
    });
    steps.push({
      title: `Decide: ${input.decisions}`,
      estimatedMinutes: 10,
      energyRequired: 'medium',
      emotionalWeight: 'stressful',
    });
  }

  if (input.people || input.waitingOn) {
    const who = input.people || input.waitingOn;
    steps.push({
      title: `Send a quick message to ${who}`,
      description: 'A short note to ask, update, or unblock.',
      estimatedMinutes: 10,
      energyRequired: 'low',
      emotionalWeight: 'neutral',
    });
  }

  steps.push({
    title: `Do the first concrete 15 minutes of "${input.title}"`,
    description: 'Set a timer. Starting is the win — you can stop at 15.',
    estimatedMinutes: 15,
    energyRequired: 'medium',
    emotionalWeight: 'neutral',
  });

  return steps;
}
