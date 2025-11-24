"use client";

import { Button, Column, Heading, Input, Text } from "@once-ui-system/core";
import { useState } from "react";

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [submitMessage, setSubmitMessage] = useState("");

  const validateEmail = (email: string): boolean => {
    if (email === "") {
      return false;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  };

  const validateField = (name: string, value: string): string => {
    if (!value.trim()) {
      return `${name.charAt(0).toUpperCase() + name.slice(1)} is required.`;
    }
    if (name === "email" && !validateEmail(value)) {
      return "Please enter a valid email address.";
    }
    return "";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    if (error) {
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate all fields
    const newErrors: Record<string, string> = {};
    Object.entries(formData).forEach(([key, value]) => {
      const error = validateField(key, value);
      if (error) {
        newErrors[key] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus("idle");
    setSubmitMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitStatus("success");
        setSubmitMessage("Thank you! Your message has been sent successfully.");
        setFormData({
          name: "",
          email: "",
          subject: "",
          message: "",
        });
        setErrors({});
      } else {
        setSubmitStatus("error");
        setSubmitMessage(data.error || "Something went wrong. Please try again.");
      }
    } catch (error) {
      setSubmitStatus("error");
      setSubmitMessage("Failed to send message. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Column gap="m">
      <Heading variant="display-strong-xs" marginBottom="s">
        Send a Message
      </Heading>
      <Text variant="body-default-l" onBackground="neutral-weak" marginBottom="l">
        Have a question or want to work together? Fill out the form below and I&apos;ll get back to
        you as soon as possible.
      </Text>

      <form onSubmit={handleSubmit}>
        <Column gap="m">
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="Name"
            required
            value={formData.name}
            onChange={handleChange}
            onBlur={handleBlur}
            errorMessage={errors.name}
            disabled={isSubmitting}
          />

          <Input
            id="email"
            name="email"
            type="email"
            placeholder="Email"
            required
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            errorMessage={errors.email}
            disabled={isSubmitting}
          />

          <Input
            id="subject"
            name="subject"
            type="text"
            placeholder="Subject"
            required
            value={formData.subject}
            onChange={handleChange}
            onBlur={handleBlur}
            errorMessage={errors.subject}
            disabled={isSubmitting}
          />

          <textarea
            id="message"
            name="message"
            placeholder="Message"
            required
            value={formData.message}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isSubmitting}
            rows={6}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              border: errors.message
                ? "1px solid var(--feedback-error-border-strong)"
                : "1px solid var(--neutral-alpha-medium)",
              backgroundColor: "var(--page-background)",
              color: "var(--neutral-on-background-strong)",
              fontFamily: "var(--font-body)",
              fontSize: "14px",
              resize: "vertical",
            }}
          />
          {errors.message && (
            <Text variant="body-default-s" style={{ color: "var(--feedback-error-strong)" }}>
              {errors.message}
            </Text>
          )}

          {submitStatus === "success" && (
            <Text variant="body-default-s" style={{ color: "var(--feedback-success-strong)" }}>
              {submitMessage}
            </Text>
          )}

          {submitStatus === "error" && (
            <Text variant="body-default-s" style={{ color: "var(--feedback-error-strong)" }}>
              {submitMessage}
            </Text>
          )}

          <Button type="submit" size="m" fillWidth disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Send Message"}
          </Button>
        </Column>
      </form>
    </Column>
  );
}
