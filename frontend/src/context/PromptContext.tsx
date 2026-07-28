import { createContext, useContext, useState, type ReactNode } from 'react';
import type { ScoreResponse } from '@/types';

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
}

const PromptContext = createContext<PromptContextType | null>(null);

export function PromptProvider({ children }: { children: ReactNode }) {
  const [originalPrompt, setOriginalPrompt] = useState('');
  const [optimizedPrompt, setOptimizedPrompt] = useState('');
  const [explanation, setExplanation] = useState('');
  const [originalScore, setOriginalScore] = useState<ScoreResponse | null>(null);
  const [optimizedScore, setOptimizedScore] = useState<ScoreResponse | null>(null);

  const hasCompareData = Boolean(originalPrompt && optimizedPrompt);

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
