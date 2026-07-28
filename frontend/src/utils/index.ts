export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

export function estimateCost(tokens: number, pricePerMillionTokens: number = 0.15): string {
  const cost = (tokens / 1_000_000) * pricePerMillionTokens;
  if (cost < 0.0001) return '<$0.0001';
  return `$${cost.toFixed(4)}`;
}

export function truncateText(text: string, maxLength: number = 120): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export const PATTERN_LABELS: Record<string, string> = {
  zero_shot: 'Zero-Shot',
  few_shot: 'Few-Shot',
  react: 'ReAct',
  chain_of_thought: 'Chain of Thought',
  self_reflection: 'Self-Reflection',
  role_based: 'Role-Based',
  json_output: 'JSON Output',
};

export const CATEGORIES = [
  'Coding',
  'Marketing',
  'Writing',
  'SQL',
  'Customer Support',
  'Data Analysis',
  'Creative',
  'Education',
  'Business',
  'Other',
];
