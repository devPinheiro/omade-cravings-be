import { NewsletterSubscriber } from '../../../models/NewsletterSubscriber';

export class NewsletterService {
  /**
   * Subscribe an email to the newsletter. Idempotent: if already subscribed, returns success.
   */
  async subscribe(email: string): Promise<{ subscribed: boolean; alreadySubscribed: boolean }> {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      throw new Error('Email is required');
    }

    const existing = await NewsletterSubscriber.findOne({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return { subscribed: true, alreadySubscribed: true };
    }

    await NewsletterSubscriber.create({ email: normalizedEmail });
    return { subscribed: true, alreadySubscribed: false };
  }
}
