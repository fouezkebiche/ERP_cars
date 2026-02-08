"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, BarChart3, Zap, Users, FileText, CreditCard, Shield } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header Navigation */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">CM</span>
              </div>
              <span className="font-bold text-xl">CarManager</span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="hover:text-accent transition">
                Features
              </a>
              <a href="#pricing" className="hover:text-accent transition">
                Pricing
              </a>
              <a href="#how-it-works" className="hover:text-accent transition">
                How It Works
              </a>
            </nav>
            <div className="flex gap-3">
              <Link href="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-primary hover:bg-primary/90">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-muted">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Manage Your Car Rental Business with <span className="text-accent">Confidence</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            All-in-one platform for vehicle management, customer CRM, smart contracts, payment tracking, and
            comprehensive analytics.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90">
                Start Free Trial <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
              Watch Demo
            </Button>
          </div>
          <div className="rounded-lg overflow-hidden border border-border shadow-lg bg-card">
            <img src="/modern-car-rental-dashboard.jpg" alt="Dashboard Preview" className="w-full h-auto" />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-muted-foreground text-lg">Everything you need to run your rental business efficiently</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap className="w-6 h-6" />,
                title: "Vehicle Management",
                desc: "Track all vehicles, maintenance schedules, and availability in real-time",
              },
              {
                icon: <Users className="w-6 h-6" />,
                title: "Customer CRM",
                desc: "Complete customer profiles with rental history and payment records",
              },
              {
                icon: <FileText className="w-6 h-6" />,
                title: "Smart Contracts",
                desc: "Digital contracts with automated terms and documentation",
              },
              {
                icon: <CreditCard className="w-6 h-6" />,
                title: "Payment Tracking",
                desc: "Monitor payments, invoices, and financial transactions seamlessly",
              },
              {
                icon: <BarChart3 className="w-6 h-6" />,
                title: "Analytics & Reports",
                desc: "Deep insights into revenue, utilization, and business performance",
              },
              {
                icon: <Shield className="w-6 h-6" />,
                title: "Multi-User Access",
                desc: "Role-based permissions for your entire team",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="p-6 rounded-lg border border-border bg-card hover:shadow-lg hover:border-accent transition-all"
              >
                <div className="text-accent mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg">Get started in three simple steps</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { num: "1", title: "Sign Up", desc: "Create your account and set up your company profile" },
              { num: "2", title: "Add Your Fleet", desc: "Add all your vehicles with details and specifications" },
              { num: "3", title: "Start Managing", desc: "Begin creating contracts and managing rentals" },
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
                  {step.num}
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
          <p className="text-muted-foreground text-lg mb-8">Plans starting from 5,000 DZD/month</p>
          <Link href="/pricing">
            <Button size="lg" variant="outline">
              View All Plans
            </Button>
          </Link>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-muted-foreground mb-12">Trusted by 150+ rental companies across Algeria</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: "Elite Rentals", quote: "CarManager has transformed how we operate. Highly recommended!" },
              { name: "Speed Motors", quote: "Best investment for our business. Support team is excellent." },
              { name: "Premium Fleet", quote: "The analytics alone saved us thousands in operational costs." },
            ].map((testimonial, i) => (
              <div key={i} className="p-6 rounded-lg bg-card border border-border">
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, j) => (
                    <span key={j} className="text-accent">
                      ★
                    </span>
                  ))}
                </div>
                <p className="text-sm mb-4">"{testimonial.quote}"</p>
                <p className="font-semibold text-sm">{testimonial.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to transform your rental business?</h2>
          <p className="text-muted-foreground text-lg mb-8">
            Join hundreds of successful companies using CarManager today.
          </p>
          <Link href="/signup">
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              Get Started Free <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <a href="#features" className="text-muted-foreground hover:text-foreground transition block mb-2">
                Features
              </a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition block mb-2">
                Pricing
              </a>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <a href="#" className="text-muted-foreground hover:text-foreground transition block mb-2">
                About
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition block mb-2">
                Contact
              </a>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <a href="#" className="text-muted-foreground hover:text-foreground transition block mb-2">
                Terms
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition block mb-2">
                Privacy
              </a>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Language</h4>
              <button className="text-muted-foreground hover:text-foreground transition block mb-2">English</button>
              <button className="text-muted-foreground hover:text-foreground transition block mb-2">العربية</button>
            </div>
          </div>
          <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted-foreground text-sm">© 2025 CarManager. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="text-muted-foreground hover:text-foreground transition">
                Twitter
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition">
                LinkedIn
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition">
                Facebook
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
