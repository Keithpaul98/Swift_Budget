"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Privacy Matters</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-4">
          <p className="text-muted-foreground">Last updated: March 2026</p>

          <h3 className="text-lg font-semibold">1. Information We Collect</h3>
          <p className="text-sm text-muted-foreground">
            SwiftBudget collects the following information when you create an account:
          </p>
          <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-1">
            <li>Email address (for authentication and communication)</li>
            <li>Username (for display purposes)</li>
            <li>Profile image (optional, stored securely)</li>
            <li>Financial data you enter (transactions, budgets, categories, projects)</li>
          </ul>

          <h3 className="text-lg font-semibold">2. How We Use Your Information</h3>
          <p className="text-sm text-muted-foreground">Your information is used to:</p>
          <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-1">
            <li>Provide and maintain the SwiftBudget service</li>
            <li>Display your financial data and analytics</li>
            <li>Send you important account notifications</li>
            <li>Respond to your support inquiries</li>
          </ul>

          <h3 className="text-lg font-semibold">3. Data Storage & Security</h3>
          <p className="text-sm text-muted-foreground">
            Your data is stored securely using Supabase, which provides encryption at rest and in transit.
            Row Level Security (RLS) ensures that only you can access your own data. We do not sell, share, 
            or provide your data to third parties.
          </p>

          <h3 className="text-lg font-semibold">4. Data Retention</h3>
          <p className="text-sm text-muted-foreground">
            Your data is retained for as long as your account is active. You may request deletion of your 
            account and associated data by contacting us at keithpaul.dev@gmail.com.
          </p>

          <h3 className="text-lg font-semibold">5. Your Rights</h3>
          <p className="text-sm text-muted-foreground">You have the right to:</p>
          <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-1">
            <li>Access your personal data</li>
            <li>Export your transaction data (CSV)</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data</li>
          </ul>

          <h3 className="text-lg font-semibold">6. Cookies</h3>
          <p className="text-sm text-muted-foreground">
            SwiftBudget uses essential cookies for authentication and session management only. 
            We do not use tracking or advertising cookies.
          </p>

          <h3 className="text-lg font-semibold">7. Contact</h3>
          <p className="text-sm text-muted-foreground">
            For privacy-related inquiries, contact us at keithpaul.dev@gmail.com.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
