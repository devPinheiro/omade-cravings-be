import { Request, Response } from 'express';
import { NewsletterService } from '../services/NewsletterService';

const newsletterService = new NewsletterService();

export class NewsletterController {
  async subscribe(req: Request, res: Response) {
    try {
      const { email } = req.body as { email: string };
      const result = await newsletterService.subscribe(email);

      return res.status(201).json({
        success: true,
        message: result.alreadySubscribed
          ? 'You are already subscribed to our newsletter.'
          : 'Successfully subscribed to the newsletter.',
        data: result,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to subscribe';
      return res.status(400).json({
        success: false,
        message,
      });
    }
  }
}
