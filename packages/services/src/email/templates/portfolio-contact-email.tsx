import { Text } from "@react-email/components";

export type PortfolioContactFormValues = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export const PortfolioContactEmail = (props: PortfolioContactFormValues) => (
  <>
    <Text>A new contact form submission has been received on the website.</Text>
    <Text>
      <strong>Name:</strong> {props.name}
    </Text>
    <Text>
      <strong>Email:</strong> {props.email}
    </Text>
    <Text>
      <strong>Subject:</strong> {props.subject}
    </Text>
    <Text>
      <strong>Message:</strong>
    </Text>
    <Text>{props.message}</Text>
  </>
);

