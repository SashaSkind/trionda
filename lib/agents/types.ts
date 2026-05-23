import type { AgentTraceEvent } from '@/lib/types';

export type AgentTraceEmitter = (
  agent: AgentTraceEvent['agent'],
  phase: string,
  detail?: string
) => void;
