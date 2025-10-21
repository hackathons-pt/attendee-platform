'use client';

import { useFormState } from 'react-dom';
import { castVoteAction, type ActionState } from '@/lib/actions';

const initialState: ActionState = {};

type Props = {
  projectId: string;
  projectName: string;
  disabled?: boolean;
};

export function VoteButton({ projectId, projectName, disabled }: Props) {
  const [state, formAction] = useFormState(castVoteAction, initialState);

  return (
    <form action={formAction} style={{ display: 'inline-flex', flexDirection: 'column', gap: '0.35rem' }}>
      <input name="projectId" type="hidden" value={projectId} />
      <button className="primary" disabled={disabled} type="submit">
        {disabled ? `You voted for ${projectName}` : `Vote for ${projectName}`}
      </button>
      {state.error && <span className="small" style={{ color: '#f87171' }}>{state.error}</span>}
      {state.success && <span className="small" style={{ color: '#34d399' }}>{state.success}</span>}
    </form>
  );
}
