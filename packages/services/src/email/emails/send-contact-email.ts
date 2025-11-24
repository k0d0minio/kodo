import { resend } from "../instance";
import { ContactSubmissionEmail } from "../templates/contact-submission-email";

export type ContactFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  message: string;
};

export const sendContactEmail = async (data: ContactFormValues) => {
  try {
    const res = await resend.emails.send({
      to: "Aidan Marshall <contact@aidanm.com>",
      from: "Aidan Marshall <contact@aidanm.com>",
      subject: "New Contact Form Submission",
      react: ContactSubmissionEmail(data),
    });
    return { success: res.data?.id != null };
  } catch (error) {
    console.error("Resend email error", error);
    return { success: false };
  }
};
