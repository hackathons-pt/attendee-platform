'use client';

import { useFormState } from 'react-dom';
import { declareWinnerAction, type ActionState } from '@/lib/actions';

type ProjectOption = {
  id: string;
  name: string;
};

type EventWithProjects = {
  id: string;
  name: string;
  projects: ProjectOption[];
};

const initialState: ActionState = {};

type Props = {
  events: EventWithProjects[];
};

export function AdminDeclareWinnerForm({ events }: Props) {
  const [state, formAction] = useFormState(declareWinnerAction, initialState);

  return (
    <form action={formAction} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <h2>Declare the winning project</h2>
        <p className="small">Lock in the champion — this badge shows up instantly for attendees.</p>
      </div>
      <div className="form-group">
        <label htmlFor="winner-event">Event</label>
        <select id="winner-event" name="eventId" required>
          <option value="">Select an event</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.name}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="winner-project">Project</label>
        <select id="winner-project" name="projectId" required>
          <option value="">Pick a project</option>
          {events.flatMap((event) => (
            <optgroup key={event.id} label={event.name}>
              {event.projects.length === 0 ? (
                <option disabled value={`${event.id}-none`}>
                  No projects yet
                </option>
              ) : (
                event.projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))
              )}
            </optgroup>
          ))}
        </select>
      </div>
      <button className="primary" type="submit">
        Crown winner
      </button>
      {state.error ? <p className="small" style={{ color: '#f87171' }}>{state.error}</p> : null}
      {state.success ? <p className="small" style={{ color: '#34d399' }}>{state.success}</p> : null}
    </form>
  );
}
