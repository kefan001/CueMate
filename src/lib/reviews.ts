import type { Order, ReviewRecord } from '../data/mock';

export interface ReviewWithMeta extends ReviewRecord {
  orderId: string;
  targetId: string;
  targetName: string;
  authorId: string;
  authorName: string;
  displayAuthorName: string;
}

export const USER_REVIEW_TAGS = ['讲解细致', '球技专业', '守时靠谱', '沟通顺畅', '氛围轻松', '走位清晰'] as const;
export const COMPANION_REVIEW_TAGS = ['守时到店', '沟通清楚', '配合度高', '礼貌友好', '复购意愿高', '现场稳定'] as const;

export function getCompanionReviews(orders: Order[], companionId: string): ReviewWithMeta[] {
  return orders
    .filter(order => order.companionId === companionId && order.customerReview)
    .map(order => ({
      ...order.customerReview!,
      orderId: order.id,
      targetId: order.companionId,
      targetName: order.companionName,
      authorId: order.customerId ?? 'unknown_user',
      authorName: order.customerName ?? '匿名用户',
      displayAuthorName: order.customerReview?.anonymous ? '匿名用户' : order.customerName ?? '匿名用户',
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getUserReviews(orders: Order[], customerId: string): ReviewWithMeta[] {
  return orders
    .filter(order => order.customerId === customerId && order.companionReview)
    .map(order => ({
      ...order.companionReview!,
      orderId: order.id,
      targetId: order.customerId ?? customerId,
      targetName: order.customerName ?? '该用户',
      authorId: order.companionId,
      authorName: order.companionName,
      displayAuthorName: order.companionReview?.anonymous ? '匿名陪玩' : order.companionName,
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getReviewSummary(reviews: ReviewRecord[]) {
  const count = reviews.length;
  const average = count ? reviews.reduce((sum, review) => sum + review.rating, 0) / count : 0;
  const distribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(review => review.rating === star).length,
  }));
  const positiveCount = reviews.filter(review => review.rating >= 4).length;
  const tagCounter = new Map<string, number>();

  reviews.forEach(review => {
    review.tags?.forEach(tag => {
      tagCounter.set(tag, (tagCounter.get(tag) ?? 0) + 1);
    });
  });

  const topTags = Array.from(tagCounter.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([tag, tagCount]) => ({ tag, count: tagCount }));

  return {
    count,
    average: count ? Number(average.toFixed(1)) : 0,
    positiveRate: count ? Math.round((positiveCount / count) * 100) : 0,
    distribution,
    topTags,
  };
}
