"use client";

import {
  Button,
  InputEmail,
  InputPhone,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TextareaMessage,
} from "@kodo/ui";
import { Heading, Text, Column } from "@once-ui-system/core";
import { useState } from "react";

const services = [
  "Custom Software Development",
  "AI Solutions & Consulting",
  "Full Stack Development",
  "Frontend Development",
  "Backend Development",
  "DevOps & Infrastructure",
  "Technical Consulting",
  "Other",
];

export default function ContactForm() {
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    service: "",
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

  const validatePhone = (phone: string): boolean => {
    if (phone === "") {
      return true; // Phone is optional
    }
    // Basic phone validation - allows various formats
    const phonePattern = /^[\d\s\-\+\(\)]+$/;
    return phonePattern.test(phone) && phone.replace(/\D/g, "").length >= 7;
  };

  const validateField = (name: string, value: string): string => {
    if (name === "phone") {
      if (value && !validatePhone(value)) {
        return "Please enter a valid phone number.";
      }
      return ""; // Phone is optional
    }
    if (!value.trim()) {
      return `${name.charAt(0).toUpperCase() + name.slice(1)} is required.`;
    }
    if (name === "email" && !validateEmail(value)) {
      return "Please enter a valid email address.";
    }
    return "";
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
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

  const handleServiceChange = (value: string) => {
    setFormData((prev) => ({ ...prev, service: value }));
    
    // Clear error for service when user selects
    if (errors.service) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.service;
        return newErrors;
      });
    }
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
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
          email: "",
          phone: "",
          service: "",
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
          Have a question or want to work together? Fill out the form below and I&apos;ll get back to you as soon as possible.
        </Text>
      
      <form onSubmit={handleSubmit}>
        <Column gap="m">
          <div>
            <InputEmail
              id="email"
              name="email"
              placeholder="Email"
              required
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              errorMessage={errors.email}
              disabled={isSubmitting}
            />
            {errors.email && (
              <Text
                id="email-error"
                variant="body-default-s"
                style={{ color: "var(--feedback-error-strong)", marginTop: "4px" }}
              >
                {errors.email}
              </Text>
            )}
          </div>
          
          <div>
            <InputPhone
              id="phone"
              name="phone"
              placeholder="Phone (optional)"
              value={formData.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              errorMessage={errors.phone}
              disabled={isSubmitting}
            />
            {errors.phone && (
              <Text
                id="phone-error"
                variant="body-default-s"
                style={{ color: "var(--feedback-error-strong)", marginTop: "4px" }}
              >
                {errors.phone}
              </Text>
            )}
          </div>

          <div>
            <Select
              value={formData.service}
              onValueChange={handleServiceChange}
              disabled={isSubmitting}
              required
            >
              <SelectTrigger
                aria-invalid={!!errors.service}
                aria-errormessage={errors.service ? "service-error" : undefined}
              >
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service} value={service}>
                    {service}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.service && (
              <Text
                id="service-error"
                variant="body-default-s"
                style={{ color: "var(--feedback-error-strong)", marginTop: "4px" }}
              >
                {errors.service}
              </Text>
            )}
          </div>
          
          <div>
            <TextareaMessage
              id="message"
              name="message"
              placeholder="Message"
              required
              value={formData.message}
              onChange={handleChange}
              onBlur={handleBlur}
              errorMessage={errors.message}
              disabled={isSubmitting}
              rows={6}
            />
            {errors.message && (
              <Text
                id="message-error"
                variant="body-default-s"
                style={{ color: "var(--feedback-error-strong)", marginTop: "4px" }}
              >
                {errors.message}
              </Text>
            )}
          </div>
          
          {submitStatus === "success" && (
            <Text
              variant="body-default-s"
              style={{ color: "var(--feedback-success-strong)" }}
            >
              {submitMessage}
            </Text>
          )}
          
          {submitStatus === "error" && (
            <Text
              variant="body-default-s"
              style={{ color: "var(--feedback-error-strong)" }}
            >
              {submitMessage}
            </Text>
          )}
          
          <Button
            type="submit"
            size="default"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Sending..." : "Send Message"}
          </Button>
        </Column>
      </form>
    </Column>
  );
}

