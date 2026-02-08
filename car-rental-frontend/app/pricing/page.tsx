"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Check, ArrowLeft } from "lucide-react"

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </Link>
        </div>
      </header>

      {/* Pricing Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Simple, Transparent Pricing</h1>
            <p className="text-xl text-muted-foreground">Choose the perfect plan for your rental business</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {[
              {
                name: "Basic",
                price: "5,000",
                desc: "For small agencies",
                features: [
                  "Up to 20 vehicles",
                  "Basic reporting",
                  "Email support",
                  "Single user account",
                  "Mobile app access",
                ],
                cta: "Get Started",
              },
              {
                name: "Professional",
                price: "15,000",
                desc: "For growing agencies",
                popular: true,
                features: [
                  "Up to 100 vehicles",
                  "Advanced analytics",
                  "Priority email & chat support",
                  "Multi-branch support",
                  "Up to 5 user accounts",
                  "Mobile app access",
                  "Custom reports",
                  "API access",
                ],
                cta: "Get Started",
              },
              {
                name: "Enterprise",
                price: "Custom",
                desc: "For large operations",
                features: [
                  "Unlimited vehicles",
                  "Custom integrations",
                  "Dedicated account manager",
                  "24/7 priority support",
                  "Unlimited user accounts",
                  "On-premise deployment",
                  "Custom features",
                  "SLA guarantee",
                ],
                cta: "Contact Sales",
              },
            ].map((plan, i) => (
              <div
                key={i}
                className={`rounded-lg border-2 p-8 flex flex-col transition-all ${
                  plan.popular
                    ? "border-accent bg-gradient-to-b from-accent/10 to-background scale-105"
                    : "border-border bg-card hover:border-accent"
                }`}
              >
                {plan.popular && (
                  <span className="inline-block w-fit px-3 py-1 rounded-full bg-accent text-accent-foreground text-sm font-semibold mb-4">
                    POPULAR
                  </span>
                )}
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-muted-foreground mb-6">{plan.desc}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.price !== "Custom" && <span className="text-muted-foreground"> DZD/month</span>}
                </div>
                <Button
                  className={`w-full mb-8 ${
                    plan.popular
                      ? "bg-accent hover:bg-accent/90 text-accent-foreground"
                      : "bg-primary hover:bg-primary/90"
                  }`}
                >
                  {plan.cta}
                </Button>
                <div className="space-y-3 flex-1">
                  {plan.features.map((feature, j) => (
                    <div key={j} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Comparison Table */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-8 text-center">Feature Comparison</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-4 px-4 font-semibold">Feature</th>
                    <th className="text-center py-4 px-4 font-semibold">Basic</th>
                    <th className="text-center py-4 px-4 font-semibold">Professional</th>
                    <th className="text-center py-4 px-4 font-semibold">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: "Vehicle Management", basic: true, pro: true, ent: true },
                    { feature: "Customer CRM", basic: true, pro: true, ent: true },
                    { feature: "Contract Management", basic: false, pro: true, ent: true },
                    { feature: "Payment Processing", basic: false, pro: true, ent: true },
                    { feature: "Advanced Analytics", basic: false, pro: true, ent: true },
                    { feature: "Multi-branch Support", basic: false, pro: true, ent: true },
                    { feature: "API Access", basic: false, pro: false, ent: true },
                    { feature: "Dedicated Support", basic: false, pro: false, ent: true },
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-border hover:bg-muted/50">
                      <td className="py-4 px-4">{row.feature}</td>
                      <td className="text-center py-4 px-4">
                        {row.basic ? <Check className="w-5 h-5 text-accent mx-auto" /> : "—"}
                      </td>
                      <td className="text-center py-4 px-4">
                        {row.pro ? <Check className="w-5 h-5 text-accent mx-auto" /> : "—"}
                      </td>
                      <td className="text-center py-4 px-4">
                        {row.ent ? <Check className="w-5 h-5 text-accent mx-auto" /> : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* FAQ */}
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {[
                {
                  q: "Can I change plans anytime?",
                  a: "Yes, upgrade or downgrade your plan at any time. Changes take effect immediately.",
                },
                {
                  q: "Do you offer discounts for annual billing?",
                  a: "Yes, save 20% when you pay annually instead of monthly.",
                },
                {
                  q: "What payment methods do you accept?",
                  a: "We accept credit cards, bank transfers, and popular payment methods in Algeria.",
                },
                {
                  q: "Is there a free trial?",
                  a: "Yes, all plans come with a 14-day free trial. No credit card required.",
                },
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-lg border border-border">
                  <h4 className="font-semibold mb-2">{item.q}</h4>
                  <p className="text-muted-foreground text-sm">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-muted-foreground mb-8">Join hundreds of rental companies already using CarManager.</p>
          <Link href="/signup">
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              Start Your Free Trial
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
