"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function TermsOfServicePage() {
  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <FileText className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Terms of Service</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Terms & Conditions</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-4">
          <p className="text-muted-foreground">Last updated: March 2026</p>

          <h3 className="text-lg font-semibold">1. Acceptance of Terms</h3>
          <p className="text-sm text-muted-foreground">
            By accessing and using SwiftBudget, you agree to be bound by these Terms of Service. 
            If you do not agree to these terms, please do not use the application.
          </p>

          <h3 className="text-lg font-semibold">2. Description of Service</h3>
          <p className="text-sm text-muted-foreground">
            SwiftBudget is a personal finance tracking application that allows users to record 
            transactions, manage budgets, categorize spending, and track financial projects. 
            The service is provided &quot;as is&quot; for personal, non-commercial use.
          </p>

          <h3 className="text-lg font-semibold">3. User Accounts</h3>
          <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-1">
            <li>You must provide accurate information when creating an account</li>
            <li>You are responsible for maintaining the security of your password</li>
            <li>You are responsible for all activity under your account</li>
            <li>You must notify us immediately of any unauthorized use</li>
          </ul>

          <h3 className="text-lg font-semibold">4. User Data</h3>
          <p className="text-sm text-muted-foreground">
            You retain ownership of all data you enter into SwiftBudget. We do not claim 
            any rights to your financial data. You may export or delete your data at any time.
          </p>

          <h3 className="text-lg font-semibold">5. Acceptable Use</h3>
          <p className="text-sm text-muted-foreground">You agree not to:</p>
          <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-1">
            <li>Use the service for any illegal purpose</li>
            <li>Attempt to gain unauthorized access to the system</li>
            <li>Interfere with or disrupt the service</li>
            <li>Upload malicious files or content</li>
          </ul>

          <h3 className="text-lg font-semibold">6. Limitation of Liability</h3>
          <p className="text-sm text-muted-foreground">
            SwiftBudget is provided for informational and personal tracking purposes only. 
            It is not a substitute for professional financial advice. We are not liable for 
            any financial decisions made based on information displayed in the application.
          </p>

          <h3 className="text-lg font-semibold">7. Service Availability</h3>
          <p className="text-sm text-muted-foreground">
            We strive to maintain high availability but do not guarantee uninterrupted access. 
            The service may be temporarily unavailable for maintenance or updates.
          </p>

          <h3 className="text-lg font-semibold">8. Changes to Terms</h3>
          <p className="text-sm text-muted-foreground">
            We reserve the right to modify these terms at any time. Continued use of the 
            service after changes constitutes acceptance of the new terms.
          </p>

          <h3 className="text-lg font-semibold">9. Contact</h3>
          <p className="text-sm text-muted-foreground">
            For questions about these terms, contact us at keithpaul.dev@gmail.com.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
