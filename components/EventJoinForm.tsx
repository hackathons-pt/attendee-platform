'use client';

import { useFormState } from 'react-dom';
import type { ActionState } from '@/lib/actions';
import { linkEventAction } from '@/lib/actions';

const initialState: ActionState = {};

export function EventJoinForm() {
  const [state, formAction] = useFormState(linkEventAction, initialState);

  return (
    <form action={formAction} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <h2>Link an event</h2>
        <p className="small">Enter the code shared by your organizer to connect this platform to your event.</p>
      </div>
      <div className="form-group">
        <label htmlFor="code">Event code</label>
        <input id="code" name="code" placeholder="HACK-ABC123" required type="text" />
      </div>
      <button className="primary" type="submit">
        Link event
      </button>
      {state.error ? <p className="small" style={{ color: '#f87171' }}>{state.error}</p> : null}
      {state.success ? <p className="small" style={{ color: '#34d399' }}>{state.success}</p> : null}
    </form>
  );
}
