'use client';

import { useFormState } from 'react-dom';
import { generateInviteAction, type ActionState } from '@/lib/actions';

type Props = {
  events: { id: string; name: string }[];
};

const initialState: ActionState = {};

export function AdminInviteForm({ events }: Props) {
  const [state, formAction] = useFormState(generateInviteAction, initialState);

  return (
    <form action={formAction} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <h2>Generate an invite code</h2>
        <p className="small">Share the generated code with attendees so they can link the event to their account.</p>
      </div>
      <div className="form-group">
        <label htmlFor="invite-event">Event</label>
        <select id="invite-event" name="eventId" required>
          <option value="">Select an event</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.name}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="invite-expires">Expiration (optional)</label>
        <input id="invite-expires" name="expiresAt" type="datetime-local" />
        <p className="small">Leave blank for a code that never expires.</p>
      </div>
      <button className="primary" type="submit">
        Generate code
      </button>
      {state.error ? <p className="small" style={{ color: '#f87171' }}>{state.error}</p> : null}
      {state.success ? <p className="small" style={{ color: '#34d399' }}>{state.success}</p> : null}
    </form>
  );
}
