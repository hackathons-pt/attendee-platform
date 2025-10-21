import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { VoteButton } from '@/components/VoteButton';
import { ProjectSubmissionForm, type ParticipantInfo } from '@/components/ProjectSubmissionForm';

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(value);
}

type EventPageProps = {
  params: {
    id: string;
  };
};

export default async function EventPage({ params }: EventPageProps) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return (
      <section className="card" style={{ textAlign: 'center' }}>
        <h1>Join the party</h1>
        <p>Sign in with your hackathons.pt account to access event details.</p>
      </section>
    );
  }

  const [event, userVote] = await Promise.all([
    prisma.event.findUnique({
      where: { id: params.id },
      include: {
        participants: {
          include: { user: true }
        },
        announcements: {
          orderBy: { createdAt: 'desc' }
        },
        projects: {
          include: {
            participants: true,
            votes: true
          },
          orderBy: { createdAt: 'asc' }
        },
        winningProject: true
      }
    }),
    prisma.vote.findUnique({
      where: {
        eventId_voterId: {
          eventId: params.id,
          voterId: session.user.id
        }
      }
    })
  ]);

  if (!event) {
    notFound();
  }

  const isParticipant = event.participants.some((participant: any) => participant.userId === session.user.id);
  const isAdmin = session.user.email === 'fonz@hackclub.com';

  if (!isParticipant && !isAdmin) {
    return (
      <section className="card" style={{ textAlign: 'center' }}>
        <h1>Access restricted</h1>
        <p>You need to link this event with a valid code before you can view the details.</p>
      </section>
    );
  }

  const participantInfos: ParticipantInfo[] = event.participants.map((participant: any) => ({
    id: participant.userId,
    name: participant.user?.name,
    email: participant.user?.email
  }));

  return (
    <div className="grid" style={{ gap: '1.5rem' }}>
      <article className="card">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <div>
            <h1 style={{ marginBottom: '0.5rem' }}>{event.name}</h1>
            <div className="small">Participants: {event.participants.length} · Projects: {event.projects.length}</div>
          </div>
          {event.winningProject ? <span className="badge">🏆 Winner: {event.winningProject.name}</span> : null}
        </header>

        {event.guideMarkdown ? (
          <section style={{ marginTop: '1.5rem' }}>
            <h2>Event guide</h2>
            <div
              style={{
                background: 'rgba(15,23,42,0.55)',
                border: '1px solid rgba(148,163,184,0.25)',
                borderRadius: '1rem',
                padding: '1rem',
                whiteSpace: 'pre-wrap',
                fontFamily: '"Fira Code", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
              }}
            >
              {event.guideMarkdown}
            </div>
          </section>
        ) : null}

        <section style={{ marginTop: '1.5rem' }}>
          <h2>Announcements</h2>
          {event.announcements.length === 0 ? (
            <p className="small">Nothing announced yet.</p>
          ) : (
            <ul className="list">
              {event.announcements.map((announcement: any) => (
                <li key={announcement.id}>
                  <strong>{announcement.title}</strong>
                  <div className="small">{formatDate(announcement.createdAt)}</div>
                  <p style={{ marginTop: '0.75rem' }}>{announcement.content}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section style={{ marginTop: '1.5rem' }}>
          <h2>Projects</h2>
          {event.projects.length === 0 ? (
            <p className="small">No submissions yet.</p>
          ) : (
            <ul className="list">
              {event.projects.map((project: any) => (
                <li key={project.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <div>
                      <h3 style={{ margin: 0 }}>{project.name}</h3>
                      <div className="small">Votes: {project.votes.length}</div>
                      <div className="small" style={{ marginTop: '0.5rem', display: 'flex', gap: '0.75rem' }}>
                        <a href={project.githubUrl} rel="noreferrer" target="_blank">
                          GitHub ↗
                        </a>
                        <a href={project.playableUrl} rel="noreferrer" target="_blank">
                          Playable ↗
                        </a>
                      </div>
                    </div>
                    <VoteButton
                      disabled={!isParticipant || userVote?.projectId === project.id}
                      projectId={project.id}
                      projectName={project.name}
                    />
                  </div>
                  <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {project.participants.map((participant: any) => (
                      <span className="badge" key={participant.userId}>
                        {participant.userId}
                      </span>
                    ))}
                  </div>
                  {event.winningProjectId === project.id ? (
                    <div className="badge" style={{ marginTop: '0.75rem' }}>🏆 Declared winner</div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </article>

      <ProjectSubmissionForm eventId={event.id} eventName={event.name} participants={participantInfos} />
    </div>
  );
}
