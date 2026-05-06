import { Request, Response, NextFunction } from 'express';
import { db } from '../db/index.js';
import { notification } from '../db/schema.js';
import { and, eq, sql } from 'drizzle-orm';
import {
  listNotificationsSchema,
  notificationIdSchema,
} from '../utils/validators/notification.validator.js';

function getRecipientRole(req: Request): 'USER' | 'ADMIN' {
  return req.user!.user_metadata?.role === 'ADMIN' ? 'ADMIN' : 'USER';
}

export const listNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { page, limit, unread } = listNotificationsSchema.parse(req.query);
  const recipientId = req.user!.id;
  const recipientRole = getRecipientRole(req);
  const offset = (page - 1) * limit;

  try {
    const baseWhere = and(
      eq(notification.recipientId, recipientId),
      eq(notification.recipientRole, recipientRole),
      unread ? eq(notification.isRead, false) : undefined,
    );

    const [notifications, [totalResult]] = await Promise.all([
      db
        .select()
        .from(notification)
        .where(baseWhere)
        .orderBy(sql`${notification.createdAt} desc`)
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(notification)
        .where(baseWhere),
    ]);

    const total = totalResult.count;
    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,
      message: 'Notifikasi berhasil diambil',
      data: notifications,
      pagination: {
        size: limit,
        page,
        total,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const markRead = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { id } = notificationIdSchema.parse(req.params);
  const recipientId = req.user!.id;

  try {
    const existing = await db.query.notification.findFirst({
      where: eq(notification.id, id),
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Notifikasi tidak ditemukan',
      });
    }

    if (existing.recipientId !== recipientId) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses ke notifikasi ini',
      });
    }

    const [updated] = await db
      .update(notification)
      .set({ isRead: true })
      .where(eq(notification.id, id))
      .returning();

    return res.status(200).json({
      success: true,
      message: 'Notifikasi berhasil ditandai sebagai dibaca',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const markAllRead = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const recipientId = req.user!.id;
  const recipientRole = getRecipientRole(req);

  try {
    const result = await db
      .update(notification)
      .set({ isRead: true })
      .where(
        and(
          eq(notification.recipientId, recipientId),
          eq(notification.recipientRole, recipientRole),
          eq(notification.isRead, false),
        ),
      )
      .returning({ id: notification.id });

    return res.status(200).json({
      success: true,
      message: 'Semua notifikasi berhasil ditandai sebagai dibaca',
      data: { count: result.length },
    });
  } catch (error) {
    next(error);
  }
};

export const unreadCount = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const recipientId = req.user!.id;
  const recipientRole = getRecipientRole(req);

  try {
    const [result] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(notification)
      .where(
        and(
          eq(notification.recipientId, recipientId),
          eq(notification.recipientRole, recipientRole),
          eq(notification.isRead, false),
        ),
      );

    return res.status(200).json({
      success: true,
      message: 'Jumlah notifikasi belum dibaca berhasil diambil',
      data: { count: result.count },
    });
  } catch (error) {
    next(error);
  }
};
