import { createContext, useContext, useState, type ReactNode } from 'react';
import type { ScoreResponse } from '@/types';

export interface CompareHistoryItem {
  id: string;
  title: string;
  timestamp: string;
  originalPrompt: string;
  optimizedPrompt: string;
  originalScore: ScoreResponse | null;
  optimizedScore: ScoreResponse | null;
  explanation: string;
}

interface PromptContextType {
  originalPrompt: string;
  optimizedPrompt: string;
  explanation: string;
  originalScore: ScoreResponse | null;
  optimizedScore: ScoreResponse | null;
  setOriginalPrompt: (prompt: string) => void;
  setOptimizedPrompt: (prompt: string) => void;
  setExplanation: (explanation: string) => void;
  setOriginalScore: (score: ScoreResponse | null) => void;
  setOptimizedScore: (score: ScoreResponse | null) => void;
  hasCompareData: boolean;
  saveCompareItem: (item: Partial<CompareHistoryItem>) => void;
}

const PromptContext = createContext<PromptContextType | null>(null);

export function PromptProvider({ children }: { children: ReactNode }) {
  const [originalPrompt, setOriginalPrompt] = useState('');
  const [optimizedPrompt, setOptimizedPrompt] = useState('');
  const [explanation, setExplanation] = useState('');
  const [originalScore, setOriginalScore] = useState<ScoreResponse | null>(null);
  const [optimizedScore, setOptimizedScore] = useState<ScoreResponse | null>(null);

  const hasCompareData = Boolean(originalPrompt && optimizedPrompt);

  const saveCompareItem = (item: Partial<CompareHistoryItem>) => {
    if (!item.originalPrompt || !item.optimizedPrompt) return;
    const newItem: CompareHistoryItem = {
      id: `compare_${Date.now()}`,
      title: item.title || `Prompt Test ${new Date().toLocaleTimeString()}`,
      timestamp: 'Just now',
      originalPrompt: item.originalPrompt,
      optimizedPrompt: item.optimizedPrompt,
      originalScore: item.originalScore || { overall_score: 55, categories: { clarity: 50, specificity: 55, context: 60, output_format: 45, constraints: 50, examples: 40, prompt_complexity: 60, hallucination_risk: 50 }, suggestions: [] },
      optimizedScore: item.optimizedScore || { overall_score: 94, categories: { clarity: 95, specificity: 92, context: 96, output_format: 90, constraints: 94, examples: 90, prompt_complexity: 85, hallucination_risk: 15 }, suggestions: [] },
      explanation: item.explanation || 'Optimized prompt structure, added persona role and output schema bounds.',
    };

    try {
      const existing = localStorage.getItem('promptforge_compare_history');
      const list = existing ? JSON.parse(existing) : [];
      const updated = [newItem, ...list.filter((x: any) => x.originalPrompt !== newItem.originalPrompt)];
      localStorage.setItem('promptforge_compare_history', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to persist compare history item', e);
    }
  };

  return (
    <PromptContext.Provider
      value={{
        originalPrompt,
        optimizedPrompt,
        explanation,
        originalScore,
        optimizedScore,
        setOriginalPrompt,
        setOptimizedPrompt,
        setExplanation,
        setOriginalScore,
        setOptimizedScore,
        hasCompareData,
        saveCompareItem,
      }}
    >
      {children}
    </PromptContext.Provider>
  );
}

export function usePromptContext() {
  const context = useContext(PromptContext);
  if (!context) {
    throw new Error('usePromptContext must be used within a PromptProvider');
  }
  return context;
}
