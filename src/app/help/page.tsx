"use client";

// =============================================================================
// Help & FAQ Page
// =============================================================================
// Frequently asked questions and user guide
// =============================================================================

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  BookOpen,
  DollarSign,
  Target,
  FolderKanban,
  Tags,
  User,
} from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  {
    category: "Getting Started",
    question: "How do I create my first transaction?",
    answer: "Go to the Transactions page, click 'Add Transaction', fill in the amount, description, category, and date, then click 'Add Transaction'. Your transaction will appear in the list and update your dashboard statistics.",
  },
  {
    category: "Getting Started",
    question: "What's the difference between income and expense?",
    answer: "Income is money you receive (salary, freelance work, etc.), while expenses are money you spend (food, rent, transport, etc.). Your balance is calculated as Income minus Expenses.",
  },
  {
    category: "Categories",
    question: "Can I create custom categories?",
    answer: "Yes! Go to the Categories page and click 'Add Category'. You can create custom categories for both income and expenses. Default categories (like Salary, Food, Transport) cannot be edited or deleted.",
  },
  {
    category: "Categories",
    question: "How do I edit or delete a category?",
    answer: "On the Categories page, you'll see edit and delete icons next to your custom categories. Click the pencil icon to edit or the trash icon to delete. Note: Default categories are protected and cannot be modified.",
  },
  {
    category: "Budget Goals",
    question: "What are budget goals?",
    answer: "Budget goals help you set spending limits for specific categories or your overall spending. For example, you can set a goal to spend no more than MK 50,000 on Food per month. The system will track your progress and alert you when you reach your threshold.",
  },
  {
    category: "Budget Goals",
    question: "How do budget alerts work?",
    answer: "When creating a budget goal, you set an alert threshold (default 80%). When your spending reaches this percentage of your budget, you'll see a warning. If you exceed 100%, you'll see a red alert showing you're over budget.",
  },
  {
    category: "Projects",
    question: "What are projects used for?",
    answer: "Projects help you group related transactions together. For example, you can create a 'Wedding Planning' or 'Home Renovation' project to track all expenses related to that specific goal, even if they span multiple categories.",
  },
  {
    category: "Projects",
    question: "What's the difference between project budgets and budget goals?",
    answer: "Budget Goals track monthly spending limits by category (e.g., 'Don't spend more than MK 50,000 on Food this month'). Project Budgets track the total cost of a specific project across all categories (e.g., 'Wedding budget: MK 500,000 total').",
  },
  {
    category: "Dashboard",
    question: "How often does the dashboard update?",
    answer: "The dashboard updates in real-time whenever you add, edit, or delete a transaction. Charts and statistics automatically recalculate based on your current data.",
  },
  {
    category: "Dashboard",
    question: "What do the charts show?",
    answer: "The Income vs Expenses chart shows your financial trend over the last 6 months. The Spending by Category pie chart shows your top expense categories for the current month.",
  },
  {
    category: "Profile",
    question: "How do I upload a profile picture?",
    answer: "Go to your Profile page, click 'Upload Image', select a JPG, PNG, or GIF file (max 2MB), and it will automatically upload to your profile. Your avatar will update in the navigation bar immediately.",
  },
  {
    category: "Profile",
    question: "Can I change my email?",
    answer: "Currently, email addresses cannot be changed as they are tied to your authentication account. You can change your username and notification preferences on the Profile page.",
  },
  {
    category: "Data & Privacy",
    question: "Is my financial data secure?",
    answer: "Yes! Your data is stored securely in Supabase with Row Level Security (RLS) policies. This means you can only access your own data, and all connections are encrypted. Your password is never stored in plain text.",
  },
  {
    category: "Data & Privacy",
    question: "Can I export my data?",
    answer: "Data export functionality is planned for a future update. For now, you can view all your transactions on the Transactions page with search and filter options.",
  },
];

export default function HelpPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const categories = Array.from(new Set(faqs.map((faq) => faq.category)));

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Getting Started":
        return <BookOpen className="h-5 w-5" />;
      case "Categories":
        return <Tags className="h-5 w-5" />;
      case "Budget Goals":
        return <Target className="h-5 w-5" />;
      case "Projects":
        return <FolderKanban className="h-5 w-5" />;
      case "Dashboard":
        return <DollarSign className="h-5 w-5" />;
      case "Profile":
        return <User className="h-5 w-5" />;
      default:
        return <HelpCircle className="h-5 w-5" />;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <HelpCircle className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Help & FAQ</h1>
          <p className="text-muted-foreground">
            Find answers to common questions about SwiftBudget
          </p>
        </div>
      </div>

      {/* Quick Start Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Quick Start Guide
          </CardTitle>
          <CardDescription>Get started with SwiftBudget in 4 easy steps</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
              1
            </div>
            <div>
              <h3 className="font-semibold">Add Your First Transaction</h3>
              <p className="text-sm text-muted-foreground">
                Go to Transactions → Add Transaction. Record your income or expenses with a category and date.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
              2
            </div>
            <div>
              <h3 className="font-semibold">Create Custom Categories</h3>
              <p className="text-sm text-muted-foreground">
                Visit Categories to add categories specific to your needs (e.g., "Entertainment", "Gym").
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
              3
            </div>
            <div>
              <h3 className="font-semibold">Set Budget Goals</h3>
              <p className="text-sm text-muted-foreground">
                Go to Budget Goals and set monthly spending limits to track your budget and get alerts.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
              4
            </div>
            <div>
              <h3 className="font-semibold">Monitor Your Dashboard</h3>
              <p className="text-sm text-muted-foreground">
                Check your Dashboard regularly to see charts, statistics, and track your financial progress.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ by Category */}
      {categories.map((category) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getCategoryIcon(category)}
              {category}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {faqs
              .filter((faq) => faq.category === category)
              .map((faq, index) => {
                const globalIndex = faqs.indexOf(faq);
                const isOpen = openIndex === globalIndex;

                return (
                  <div key={globalIndex} className="border-b last:border-0">
                    <Button
                      variant="ghost"
                      className="w-full justify-between p-4 h-auto text-left font-normal hover:bg-accent"
                      onClick={() => toggleFAQ(globalIndex)}
                    >
                      <span className="font-medium">{faq.question}</span>
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4 shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 shrink-0" />
                      )}
                    </Button>
                    {isOpen && (
                      <div className="px-4 pb-4 text-sm text-muted-foreground">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
          </CardContent>
        </Card>
      ))}

      {/* Still Need Help */}
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <HelpCircle className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">Still need help?</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Can't find what you're looking for? Contact us and we'll be happy to assist you.
          </p>
          <a href="/contact">
            <Button className="mt-4">Contact Support</Button>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
