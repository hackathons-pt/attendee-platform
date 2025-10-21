'use client';

import { useFormState } from 'react-dom';
import { createEventAction, type ActionState } from '@/lib/actions';

const initialState: ActionState = {};

export function AdminCreateEventForm() {
  const [state, formAction] = useFormState(createEventAction, initialState);

  return (
    <form action={formAction} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <h2>Create a new event</h2>
        <p className="small">Spin up an event for your attendees. You can add guides and announcements later.</p>
      </div>
      <div className="form-group">
        <label htmlFor="admin-event-name">Event name</label>
        <input id="admin-event-name" name="name" placeholder="Hack Night @ HQ" required type="text" />
      </div>
      <div className="form-group">
        <label htmlFor="admin-event-guide">Welcome guide (optional)</label>
        <textarea
          id="admin-event-guide"
          name="guideMarkdown"
          placeholder="Share your schedule, resources, judging criteria, or anything else attendees need."
        />
      </div>
      <button className="primary" type="submit">
        Create event
      </button>
      {state.error ? <p className="small" style={{ color: '#f87171' }}>{state.error}</p> : null}
      {state.success ? <p className="small" style={{ color: '#34d399' }}>{state.success}</p> : null}
    </form>
  );
}
