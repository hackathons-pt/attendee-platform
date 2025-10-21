'use client';

import { useFormState } from 'react-dom';
import { createProjectAction, type ActionState } from '@/lib/actions';

export type ParticipantInfo = {
  id: string;
  name?: string | null;
  email?: string | null;
};

const initialState: ActionState = {};

type Props = {
  eventId: string;
  eventName: string;
  participants: ParticipantInfo[];
};

export function ProjectSubmissionForm({ eventId, eventName, participants }: Props) {
  const [state, formAction] = useFormState(createProjectAction, initialState);

  return (
    <form action={formAction} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <input name="eventId" type="hidden" value={eventId} />
      <div>
        <h2>Ship a project</h2>
        <p className="small">
          Submit your team&apos;s build for <strong>{eventName}</strong>. You&apos;ll need the user IDs for every participant on your
          team — they&apos;re shown below for everyone who has linked this event.
        </p>
      </div>
      <div className="form-group">
        <label htmlFor={`name-${eventId}`}>Project name</label>
        <input id={`name-${eventId}`} name="name" placeholder="Cosmic Radios" required type="text" />
      </div>
      <div className="form-group">
        <label htmlFor={`github-${eventId}`}>GitHub URL</label>
        <input id={`github-${eventId}`} name="githubUrl" placeholder="https://github.com/hackclub/..." required type="url" />
      </div>
      <div className="form-group">
        <label htmlFor={`playable-${eventId}`}>Playable URL</label>
        <input id={`playable-${eventId}`} name="playableUrl" placeholder="https://your-project.live" required type="url" />
      </div>
      <div className="form-group">
        <label htmlFor={`participants-${eventId}`}>Participant user IDs</label>
        <textarea
          id={`participants-${eventId}`}
          name="participants"
          placeholder="uid-1, uid-2, uid-3"
          required
        />
        <p className="small">
          Separate multiple IDs with commas or line breaks. Everyone listed must have already linked the event.
        </p>
      </div>
      <button className="primary" type="submit">
        Ship it
      </button>
      {state.error ? <p className="small" style={{ color: '#f87171' }}>{state.error}</p> : null}
      {state.success ? <p className="small" style={{ color: '#34d399' }}>{state.success}</p> : null}
      <div>
        <h3 style={{ marginBottom: '0.5rem' }}>Linked participants</h3>
        <ul className="list">
          {participants.length === 0 ? (
            <li className="small">Nobody has linked this event yet.</li>
          ) : (
            participants.map((participant) => (
              <li key={participant.id}>
                <strong>{participant.id}</strong>
                <div className="small">
                  {participant.name ? participant.name : 'Unnamed'} · {participant.email ?? 'no email on file'}
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </form>
  );
}
