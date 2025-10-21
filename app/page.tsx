import Link from 'next/link';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { SignInButton, SignOutButton } from '@/components/AuthButtons';
import { EventJoinForm } from '@/components/EventJoinForm';
import { ProjectSubmissionForm, type ParticipantInfo } from '@/components/ProjectSubmissionForm';
import { VoteButton } from '@/components/VoteButton';

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(value);
}

export default async function HomePage() {
  const session = await getServerSession();

  if (!session?.user?.id) {
    return (
      <section className="card" style={{ textAlign: 'center' }}>
        <h1>Hackathons.pt Attendee HQ</h1>
        <p>
          Link your hackathons.pt account to join events, get announcements in real-time, ship your project, and vote on your
          favorites.
        </p>
        <SignInButton />
      </section>
    );
  }

  const [events, userVotes] = await Promise.all([
    prisma.event.findMany({
      where: {
        participants: { some: { userId: session.user.id } }
      },
      include: {
        participants: {
          include: {
            user: true
          }
        },
        announcements: {
          orderBy: { createdAt: 'desc' }
        },
        projects: {
          include: {
            participants: {
              include: {
                user: true
              }
            },
            votes: true
          },
          orderBy: { createdAt: 'asc' }
        },
        winningProject: {
          include: {
            participants: {
              include: { user: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    }),
    prisma.vote.findMany({
      where: {
        voterId: session.user.id
      }
    })
  ]);

  const voteLookup = new Map(userVotes.map((vote) => [vote.eventId, vote.projectId]));

  return (
    <div className="grid" style={{ gap: '2rem' }}>
      <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <div>
            <h1 style={{ marginBottom: '0.5rem' }}>Hey {session.user.name ?? 'there'}!</h1>
            <p className="small">Signed in as {session.user.email}</p>
          </div>
          <SignOutButton />
        </div>
        <p>
          You&apos;re ready to join events, follow announcements, submit your build, and vote on your favorite projects. Everything
          stays in sync with the hackathons.pt admin dashboard automatically.
        </p>
        <div className="small">
          Are you the organizer? Visit the <Link href="/admin">admin dashboard</Link> to create events, share codes, post
          updates, and close the show by declaring a winner.
        </div>
      </section>

      <EventJoinForm />

      {events.length === 0 ? (
        <section className="card" style={{ textAlign: 'center' }}>
          <h2>No events yet</h2>
          <p>Use an invite code from your organizer to link an event to your account.</p>
        </section>
      ) : (
        events.map((event) => {
          const participants: ParticipantInfo[] = event.participants.map((participant) => ({
            id: participant.userId,
            name: participant.user?.name,
            email: participant.user?.email
          }));

          const userVote = voteLookup.get(event.id);
          return (
            <section key={event.id} className="grid" style={{ gap: '1.5rem' }}>
              <article className="card">
                <header style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                    <h2 style={{ margin: 0 }}>{event.name}</h2>
                    {event.winningProject ? (
                      <span className="badge">Winner · {event.winningProject.name}</span>
                    ) : null}
                  </div>
                  <div className="small">
                    Linked participants: {event.participants.length} · Projects shipped: {event.projects.length}
                  </div>
                </header>

                {event.guideMarkdown ? (
                  <section style={{ marginTop: '1rem' }}>
                    <h3>Event guide</h3>
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
                  <h3>Announcements</h3>
                  {event.announcements.length === 0 ? (
                    <p className="small">No announcements just yet.</p>
                  ) : (
                    <ul className="list">
                      {event.announcements.slice(0, 5).map((announcement) => (
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
                  <h3>Projects</h3>
                  {event.projects.length === 0 ? (
                    <p className="small">No submissions yet. Be the first one to ship!</p>
                  ) : (
                    <ul className="list">
                      {event.projects.map((project) => {
                        const voteCount = project.votes.length;
                        const isWinner = event.winningProjectId === project.id;
                        const isUserVote = userVote === project.id;
                        return (
                          <li key={project.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                              <div>
                                <h4 style={{ margin: 0 }}>{project.name}</h4>
                                <div className="small">Votes: {voteCount}</div>
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
                                disabled={isUserVote}
                                projectId={project.id}
                                projectName={project.name}
                              />
                            </div>
                            <div>
                              <div className="small" style={{ marginBottom: '0.5rem' }}>Participants</div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {project.participants.length === 0 ? (
                                  <span className="small">No participants listed.</span>
                                ) : (
                                  project.participants.map((participant) => (
                                    <span className="badge" key={participant.userId}>
                                      {participant.userId}
                                    </span>
                                  ))
                                )}
                              </div>
                            </div>
                            {isWinner ? <div className="badge">🏆 Declared winner</div> : null}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              </article>

              <ProjectSubmissionForm eventId={event.id} eventName={event.name} participants={participants} />
            </section>
          );
        })
      )}
    </div>
  );
}
