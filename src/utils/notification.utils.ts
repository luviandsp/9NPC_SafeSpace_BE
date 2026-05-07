import { db } from '../db/index.js';
import { notification, admin } from '../db/schema.js';

interface CreateNotificationParams {
  recipientId: string;
  recipientRole: 'USER' | 'ADMIN';
  type: string;
  title: string;
  message: string;
  relatedId?: string;
}

export async function createNotification(
  params: CreateNotificationParams,
): Promise<void> {
  try {
    await db.insert(notification).values({
      recipientId: params.recipientId,
      recipientRole: params.recipientRole,
      type: params.type,
      title: params.title,
      message: params.message,
      relatedId: params.relatedId,
    });
  } catch (error) {
    console.error('Gagal membuat notifikasi:', error);
  }
}

interface CreateNotificationsForAdminsParams {
  type: string;
  title: string;
  message: string;
  relatedId?: string;
}

export async function createNotificationsForAdmins(
  params: CreateNotificationsForAdminsParams,
): Promise<void> {
  try {
    const admins = await db.select({ id: admin.id }).from(admin);

    if (admins.length === 0) return;

    await db.insert(notification).values(
      admins.map((a) => ({
        recipientId: a.id,
        recipientRole: 'ADMIN' as const,
        type: params.type,
        title: params.title,
        message: params.message,
        relatedId: params.relatedId,
      })),
    );
  } catch (error) {
    console.error('Gagal membuat notifikasi untuk admin:', error);
  }
}
