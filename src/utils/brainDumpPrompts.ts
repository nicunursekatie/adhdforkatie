// Rotating brain-dump prompts. The point is to bypass the blank-page freeze:
// a concrete question is far easier to answer than "what's on your mind?".
export interface BrainDumpPrompt {
  category: 'Work' | 'Home' | 'Personal' | 'Administrative';
  text: string;
}

export const BRAIN_DUMP_PROMPTS: BrainDumpPrompt[] = [
  { category: 'Work', text: 'What deadline is quietly stressing you out?' },
  { category: 'Work', text: 'Who are you waiting on a reply from?' },
  { category: 'Work', text: "What did you say you'd 'get to later'?" },
  { category: 'Work', text: 'What meeting needs prep or follow-up?' },
  { category: 'Work', text: 'What have you been avoiding opening?' },

  { category: 'Home', text: 'What around the house has been bugging you?' },
  { category: 'Home', text: "What's running low that you need to restock?" },
  { category: 'Home', text: 'What needs fixing, cleaning, or returning?' },
  { category: 'Home', text: 'What appointment do you need to book?' },

  { category: 'Personal', text: 'Who have you been meaning to text back?' },
  { category: 'Personal', text: 'What would make tomorrow-you grateful?' },
  { category: 'Personal', text: "What's a tiny thing you keep forgetting?" },
  { category: 'Personal', text: 'What have you been wanting to do for fun?' },
  { category: 'Personal', text: 'What is your body asking you for?' },

  { category: 'Administrative', text: 'What bill, form, or renewal is lurking?' },
  { category: 'Administrative', text: 'What email needs a yes/no decision?' },
  { category: 'Administrative', text: 'What do you need to cancel or unsubscribe from?' },
  { category: 'Administrative', text: 'What paperwork is half-finished?' },
];
