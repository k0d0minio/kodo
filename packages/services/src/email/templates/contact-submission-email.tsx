import { Text } from "@react-email/components";

export type ContactFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  message: string;
};

export const ContactSubmissionEmail = (props: ContactFormValues) => (
  <>
    <Text>A new contact form submission has been received on the website.</Text>
    <Text>
      Name: {props.firstName} {props.lastName}
    </Text>
    <Text>Email: {props.email}</Text>
    <Text>Company: {props.company}</Text>
    <Text>Message: {props.message}</Text>
  </>
);
