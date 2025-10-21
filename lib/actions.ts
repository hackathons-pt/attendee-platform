'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import prisma from './prisma';
import { auth } from './auth';

const adminEmail = 'fonz@hackclub.com';

type ActionState = {
  success?: string;
  error?: string;
};

const joinEventSchema = z.object({
  code: z.string().trim().min(4, 'Event code is required')
});

export async function linkEventAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'You need to sign in to link an event.' };
  }

  const parsed = joinEventSchema.safeParse({ code: formData.get('code') });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid event code.' };
  }

  const invite = await prisma.eventInvite.findUnique({
    where: { code: parsed.data.code },
    include: { event: true }
  });

  if (!invite?.event) {
    return { error: 'We could not find an event with that code.' };
  }

  await prisma.eventParticipant.upsert({
    where: {
      userId_eventId: {
        userId: session.user.id,
        eventId: invite.eventId
      }
    },
    update: {},
    create: {
      userId: session.user.id,
      eventId: invite.eventId
    }
  });

  revalidatePath('/');
  return { success: `You have joined ${invite.event.name}.` };
}

const projectSchema = z.object({
  eventId: z.string().cuid(),
  name: z.string().trim().min(3, 'Project name is required'),
  githubUrl: z.string().trim().url('Enter a valid GitHub URL'),
  playableUrl: z.string().trim().url('Enter a valid playable URL'),
  participants: z
    .string()
    .transform((value) =>
      value
        .split(/[,\n]/)
        .map((entry) => entry.trim())
        .filter(Boolean)
    )
    .refine((list) => list.length > 0, 'List at least one participant ID')
});

export async function createProjectAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'You need to sign in before submitting a project.' };
  }

  const parsed = projectSchema.safeParse({
    eventId: formData.get('eventId'),
    name: formData.get('name'),
    githubUrl: formData.get('githubUrl'),
    playableUrl: formData.get('playableUrl'),
    participants: formData.get('participants') ?? ''
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Check your submission details.' };
  }

  const [event, participantRecord] = await Promise.all([
    prisma.event.findUnique({
      where: { id: parsed.data.eventId },
      include: { participants: true }
    }),
    prisma.eventParticipant.findUnique({
      where: {
        userId_eventId: {
          userId: session.user.id,
          eventId: parsed.data.eventId
        }
      }
    })
  ]);

  if (!event || !participantRecord) {
    return { error: 'You must join the event before shipping a project.' };
  }

  const participantIds = new Set(event.participants.map((p) => p.userId));
  const invalidMembers = parsed.data.participants.filter((id) => !participantIds.has(id));
  if (invalidMembers.length > 0) {
    return {
      error: `These participant IDs are not linked to the event yet: ${invalidMembers.join(', ')}`
    };
  }

  const project = await prisma.project.create({
    data: {
      eventId: parsed.data.eventId,
      name: parsed.data.name,
      githubUrl: parsed.data.githubUrl,
      playableUrl: parsed.data.playableUrl,
      createdById: session.user.id,
      participants: {
        createMany: {
          data: parsed.data.participants.map((id) => ({ userId: id }))
        }
      }
    }
  });

  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath(`/events/${project.eventId}`);
  return { success: 'Project submitted successfully!' };
}

const voteSchema = z.object({
  projectId: z.string().cuid()
});

export async function castVoteAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Sign in to vote for a project.' };
  }

  const parsed = voteSchema.safeParse({ projectId: formData.get('projectId') });
  if (!parsed.success) {
    return { error: 'Invalid project selection.' };
  }

  const project = await prisma.project.findUnique({
    where: { id: parsed.data.projectId },
    include: { event: { include: { participants: true } } }
  });

  if (!project) {
    return { error: 'Project not found.' };
  }

  const participant = project.event.participants.find((p) => p.userId === session.user.id);
  if (!participant) {
    return { error: 'You can only vote in events that you have joined.' };
  }

  await prisma.vote.upsert({
    where: {
      eventId_voterId: {
        eventId: project.eventId,
        voterId: session.user.id
      }
    },
    update: {
      projectId: project.id
    },
    create: {
      eventId: project.eventId,
      projectId: project.id,
      voterId: session.user.id
    }
  });

  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath(`/events/${project.eventId}`);
  return { success: `Your vote for ${project.name} has been saved.` };
}

const eventSchema = z.object({
  name: z.string().trim().min(3, 'Name is required'),
  guideMarkdown: z.string().trim().optional()
});

export async function createEventAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (session?.user?.email !== adminEmail) {
    return { error: 'Only the admin can create events.' };
  }

  const parsed = eventSchema.safeParse({
    name: formData.get('name'),
    guideMarkdown: formData.get('guideMarkdown') ?? undefined
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Unable to create event.' };
  }

  const event = await prisma.event.create({
    data: {
      name: parsed.data.name,
      guideMarkdown: parsed.data.guideMarkdown
    }
  });

  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath(`/events/${event.id}`);
  return { success: 'Event created.' };
}

const inviteSchema = z.object({
  eventId: z.string().cuid()
});

export async function generateInviteAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (session?.user?.email !== adminEmail) {
    return { error: 'Only the admin can generate invite codes.' };
  }

  const parsed = inviteSchema.safeParse({
    eventId: formData.get('eventId')
  });

  if (!parsed.success) {
    return { error: 'Choose an event first.' };
  }

  let expiresAt: Date | undefined;
  const rawExpires = formData.get('expiresAt');
  if (typeof rawExpires === 'string' && rawExpires.trim().length > 0) {
    const parsedDate = new Date(rawExpires);
    if (Number.isNaN(parsedDate.getTime())) {
      return { error: 'Invalid expiration date.' };
    }
    expiresAt = parsedDate;
  }

  const code = `HACK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  await prisma.eventInvite.create({
    data: {
      code,
      eventId: parsed.data.eventId,
      createdById: session.user?.id,
      expiresAt
    }
  });

  revalidatePath('/admin');
  return { success: `Invite code generated: ${code}` };
}

const announcementSchema = z.object({
  eventId: z.string().cuid(),
  title: z.string().trim().min(3, 'Title is required'),
  content: z.string().trim().min(3, 'Content is required')
});

export async function publishAnnouncementAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (session?.user?.email !== adminEmail) {
    return { error: 'Only the admin can publish announcements.' };
  }

  const parsed = announcementSchema.safeParse({
    eventId: formData.get('eventId'),
    title: formData.get('title'),
    content: formData.get('content')
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Unable to post announcement.' };
  }

  await prisma.announcement.create({
    data: {
      eventId: parsed.data.eventId,
      title: parsed.data.title,
      content: parsed.data.content,
      createdById: session.user?.id
    }
  });

  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath(`/events/${parsed.data.eventId}`);
  return { success: 'Announcement posted.' };
}

const guideSchema = z.object({
  eventId: z.string().cuid(),
  guideMarkdown: z.string().trim().optional()
});

export async function updateGuideAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (session?.user?.email !== adminEmail) {
    return { error: 'Only the admin can update the guide.' };
  }

  const parsed = guideSchema.safeParse({
    eventId: formData.get('eventId'),
    guideMarkdown: formData.get('guideMarkdown') ?? undefined
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Unable to update guide.' };
  }

  await prisma.event.update({
    where: { id: parsed.data.eventId },
    data: { guideMarkdown: parsed.data.guideMarkdown }
  });

  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath(`/events/${parsed.data.eventId}`);
  return { success: 'Guide updated.' };
}

const winnerSchema = z.object({
  eventId: z.string().cuid(),
  projectId: z.string().cuid()
});

export async function declareWinnerAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (session?.user?.email !== adminEmail) {
    return { error: 'Only the admin can declare a winner.' };
  }

  const parsed = winnerSchema.safeParse({
    eventId: formData.get('eventId'),
    projectId: formData.get('projectId')
  });

  if (!parsed.success) {
    return { error: 'Select a project to declare as winner.' };
  }

  const project = await prisma.project.findUnique({ where: { id: parsed.data.projectId } });
  if (!project || project.eventId !== parsed.data.eventId) {
    return { error: 'That project is not part of the selected event.' };
  }

  await prisma.event.update({
    where: { id: parsed.data.eventId },
    data: { winningProjectId: parsed.data.projectId }
  });

  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath(`/events/${parsed.data.eventId}`);
  return { success: 'Winner declared.' };
}

export type { ActionState };
