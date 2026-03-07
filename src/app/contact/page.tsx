"use client";

// =============================================================================
// Contact Us Page
// =============================================================================
// Contact form for user inquiries and support
// Sends emails via EmailJS to keithpaul.dev@gmail.com
// =============================================================================

import { useState } from "react";
import emailjs from "@emailjs/browser";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Mail,
  MessageSquare,
  Send,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Send email using EmailJS
      const result = await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
        {
          from_name: formData.name,
          from_email: formData.email,
          subject: formData.subject,
          message: formData.message,
          to_email: "keithpaul.dev@gmail.com",
        },
        process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!
      );

      if (result.status === 200) {
        setSubmitting(false);
        setSubmitted(true);

        // Reset form after 3 seconds
        setTimeout(() => {
          setFormData({ name: "", email: "", subject: "", message: "" });
          setSubmitted(false);
        }, 3000);
      }
    } catch (err: any) {
      console.error("EmailJS Error:", err);
      setError("Failed to send message. Please try again or email us directly at keithpaul.dev@gmail.com");
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-600" />
            <h2 className="mt-4 text-2xl font-bold">Message Sent!</h2>
            <p className="mt-2 text-muted-foreground">
              Thank you for contacting us. We'll get back to you as soon as possible.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Mail className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Contact Us</h1>
          <p className="text-muted-foreground">
            Have a question or need help? We're here for you.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Contact Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Send us a message</CardTitle>
            <CardDescription>
              Fill out the form below and we'll respond within 24 hours
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p>{error}</p>
                </div>
              )}
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    disabled={submitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  type="text"
                  placeholder="What is this regarding?"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  required
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <textarea
                  id="message"
                  placeholder="Tell us more about your inquiry..."
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  required
                  disabled={submitting}
                  rows={6}
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Message
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Contact Info & FAQ Link */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Quick Help
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold">Check our FAQ</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Most common questions are answered in our Help section.
                </p>
                <a href="/help">
                  <Button variant="outline" className="mt-2 w-full">
                    Visit Help Center
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-semibold">Email</p>
                <p className="text-muted-foreground">support@swiftbudget.com</p>
              </div>
              <div>
                <p className="font-semibold">Response Time</p>
                <p className="text-muted-foreground">Within 24 hours</p>
              </div>
              <div>
                <p className="font-semibold">Support Hours</p>
                <p className="text-muted-foreground">Monday - Friday, 9AM - 5PM</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Common Inquiries</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
                <p className="text-muted-foreground">Account & Profile Issues</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
                <p className="text-muted-foreground">Transaction Management</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
                <p className="text-muted-foreground">Budget Goals & Tracking</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
                <p className="text-muted-foreground">Feature Requests</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
                <p className="text-muted-foreground">Technical Support</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
