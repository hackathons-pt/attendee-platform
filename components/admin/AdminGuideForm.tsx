'use client';

import { useFormState } from 'react-dom';
import { updateGuideAction, type ActionState } from '@/lib/actions';

type Props = {
  events: { id: string; name: string; guideMarkdown: string | null }[];
};

const initialState: ActionState = {};

export function AdminGuideForm({ events }: Props) {
  const [state, formAction] = useFormState(updateGuideAction, initialState);

  return (
    <form action={formAction} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <h2>Update event guide</h2>
        <p className="small">Keep schedules, judging criteria, and resources fresh for attendees.</p>
      </div>
      <div className="form-group">
        <label htmlFor="guide-event">Event</label>
        <select id="guide-event" name="eventId" required>
          <option value="">Select an event</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.name}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="guide-content">Guide content</label>
        <textarea
          id="guide-content"
          name="guideMarkdown"
          placeholder="Use Markdown or plain text to lay out your instructions."
        />
      </div>
      <button className="primary" type="submit">
        Save guide
      </button>
      {state.error ? <p className="small" style={{ color: '#f87171' }}>{state.error}</p> : null}
      {state.success ? <p className="small" style={{ color: '#34d399' }}>{state.success}</p> : null}
    </form>
  );
}
