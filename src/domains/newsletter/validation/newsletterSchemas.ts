import * as yup from 'yup';

const emailSchema = yup
  .string()
  .email('Invalid email format')
  .required('Email is required')
  .max(255, 'Email is too long')
  .transform((value) => value?.toLowerCase().trim());

export const subscribeNewsletterSchema = yup.object({
  body: yup.object({
    email: emailSchema,
  }),
});
