'use client';

import { useFormState } from 'react-dom';
import { publishAnnouncementAction, type ActionState } from '@/lib/actions';

type Props = {
  events: { id: string; name: string }[];
};

const initialState: ActionState = {};

export function AdminAnnouncementForm({ events }: Props) {
  const [state, formAction] = useFormState(publishAnnouncementAction, initialState);

  return (
    <form action={formAction} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <h2>Send an announcement</h2>
        <p className="small">Announcements appear instantly on the attendee dashboard.</p>
      </div>
      <div className="form-group">
        <label htmlFor="announcement-event">Event</label>
        <select id="announcement-event" name="eventId" required>
          <option value="">Select an event</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.name}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="announcement-title">Title</label>
        <input id="announcement-title" name="title" placeholder="Judging kicks off soon" required type="text" />
      </div>
      <div className="form-group">
        <label htmlFor="announcement-content">Message</label>
        <textarea
          id="announcement-content"
          name="content"
          placeholder="Drop important updates, reminders, or links here."
          required
        />
      </div>
      <button className="primary" type="submit">
        Publish announcement
      </button>
      {state.error ? <p className="small" style={{ color: '#f87171' }}>{state.error}</p> : null}
      {state.success ? <p className="small" style={{ color: '#34d399' }}>{state.success}</p> : null}
    </form>
  );
}
