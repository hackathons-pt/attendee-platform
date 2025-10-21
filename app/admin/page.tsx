import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { SignOutButton } from '@/components/AuthButtons';
import { AdminCreateEventForm } from '@/components/admin/AdminCreateEventForm';
import { AdminInviteForm } from '@/components/admin/AdminInviteForm';
import { AdminAnnouncementForm } from '@/components/admin/AdminAnnouncementForm';
import { AdminGuideForm } from '@/components/admin/AdminGuideForm';
import { AdminDeclareWinnerForm } from '@/components/admin/AdminDeclareWinnerForm';

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(value);
}

export default async function AdminPage() {
  const session = await getServerSession();

  if (!session?.user?.email) {
    return (
      <section className="card" style={{ textAlign: 'center' }}>
        <h1>Admin dashboard</h1>
        <p>Sign in with your hackathons.pt account to manage events.</p>
      </section>
    );
  }

  const isAdmin = session.user.email === 'fonz@hackclub.com';

  if (!isAdmin) {
    return (
      <section className="card" style={{ textAlign: 'center' }}>
        <h1>Admin dashboard</h1>
        <p>This space is reserved for fonz@hackclub.com.</p>
      </section>
    );
  }

  const events = await prisma.event.findMany({
    include: {
      invites: {
        orderBy: { createdAt: 'desc' }
      },
      participants: {
        include: {
          user: true
        }
      },
      projects: {
        include: {
          votes: true,
          participants: {
            include: {
              user: true
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      },
      announcements: {
        orderBy: { createdAt: 'desc' }
      },
      winningProject: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  type AdminEvent = Awaited<ReturnType<typeof prisma.event.findMany>>[number];

  const eventOptions = events.map((event: AdminEvent) => ({
    id: event.id,
    name: event.name
  }));

  const guideOptions = events.map((event: AdminEvent) => ({
    id: event.id,
    name: event.name,
    guideMarkdown: event.guideMarkdown ?? ''
  }));

  const winnerOptions = events.map((event: AdminEvent) => ({
    id: event.id,
    name: event.name,
    projects: event.projects.map((project) => ({
      id: project.id,
      name: project.name
    }))
  }));

  return (
    <div className="grid" style={{ gap: '2rem' }}>
      <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <div>
            <h1 style={{ marginBottom: '0.5rem' }}>Organizer HQ</h1>
            <p className="small">Signed in as {session.user.email}</p>
          </div>
          <SignOutButton />
        </div>
        <p>
          Run the entire hackathon from one place — create events, share codes, keep everyone in the loop, and announce the
          winner when judging wraps up.
        </p>
      </section>

      <AdminCreateEventForm />
      <AdminInviteForm events={eventOptions} />
      <AdminAnnouncementForm events={eventOptions} />
      <AdminGuideForm events={guideOptions} />
      <AdminDeclareWinnerForm events={winnerOptions} />

      {events.length === 0 ? (
        <section className="card" style={{ textAlign: 'center' }}>
          <h2>No events yet</h2>
          <p>Create your first event to get started.</p>
        </section>
      ) : (
        events.map((event) => {
          const leaderboard = [...event.projects]
            .map((project) => ({
              id: project.id,
              name: project.name,
              votes: project.votes.length
            }))
            .sort((a, b) => b.votes - a.votes);

          return (
            <section key={event.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <header>
                <h2 style={{ marginBottom: '0.25rem' }}>{event.name}</h2>
                <div className="small">
                  Participants: {event.participants.length} · Projects: {event.projects.length}
                </div>
                {event.winningProject ? (
                  <div className="badge" style={{ marginTop: '0.5rem' }}>🏆 Winner: {event.winningProject.name}</div>
                ) : null}
              </header>

              <section>
                <h3>Recent invite codes</h3>
                {event.invites.length === 0 ? (
                  <p className="small">No codes generated yet.</p>
                ) : (
                  <ul className="list">
                    {event.invites.slice(0, 5).map((invite) => (
                      <li key={invite.id}>
                        <strong>{invite.code}</strong>
                        <div className="small">Created {formatDate(invite.createdAt)}</div>
                        {invite.expiresAt ? (
                          <div className="small">Expires {formatDate(invite.expiresAt)}</div>
                        ) : (
                          <div className="small">Never expires</div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <h3>Event guide</h3>
                {event.guideMarkdown ? (
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
                ) : (
                  <p className="small">No guide has been published.</p>
                )}
              </section>

              <section>
                <h3>Leaderboard</h3>
                {leaderboard.length === 0 ? (
                  <p className="small">Projects will appear here once attendees ship their builds.</p>
                ) : (
                  <ul className="list">
                    {leaderboard.map((project, index) => (
                      <li key={project.id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>
                            {index + 1}. {project.name}
                          </span>
                          <span className="badge">{project.votes} votes</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <h3>Latest announcements</h3>
                {event.announcements.length === 0 ? (
                  <p className="small">No announcements have been published.</p>
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
            </section>
          );
        })
      )}
    </div>
  );
}
