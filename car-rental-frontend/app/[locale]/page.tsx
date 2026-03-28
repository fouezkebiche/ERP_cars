"use client"

import Link from "next/link"
import { useParams, useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowRight, BarChart3, Zap, Users, FileText, CreditCard, Shield } from "lucide-react"
import { useTranslations } from "next-intl"
import LanguageSwitcher from "@/components/LanguageSwitcher"

export default function LandingPage() {
  const t = useTranslations()
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const locale = params.locale as string

  const switchLocale = (newLocale: string) => {
    // Replace locale segment in path
    const segments = pathname.split('/')
    segments[1] = newLocale
    router.push(segments.join('/'))
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
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
              <a href="#features" className="hover:text-accent transition">{t('nav.features')}</a>
              <a href="#pricing" className="hover:text-accent transition">{t('nav.pricing')}</a>
              <a href="#how-it-works" className="hover:text-accent transition">{t('nav.howItWorks')}</a>
            </nav>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <Link href={`/${locale}/login`}>
                <Button variant="ghost">{t('nav.signIn')}</Button>
              </Link>
              <Link href={`/${locale}/signup`}>
                <Button className="bg-primary hover:bg-primary/90">{t('nav.getStarted')}</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 md:py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-muted">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            {t('hero.title')} <span className="text-accent">{t('hero.highlight')}</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t('hero.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href={`/${locale}/signup`}>
              <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90">
                {t('hero.startTrial')} <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
              {t('hero.watchDemo')}
            </Button>
          </div>
          <div className="rounded-lg overflow-hidden border border-border shadow-lg bg-card">
            <img src="/modern-car-rental-dashboard.jpg" alt="Dashboard Preview" className="w-full h-auto" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('features.title')}</h2>
            <p className="text-muted-foreground text-lg">{t('features.subtitle')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {([
              { icon: <Zap className="w-6 h-6" />, key: 'vehicle' },
              { icon: <Users className="w-6 h-6" />, key: 'crm' },
              { icon: <FileText className="w-6 h-6" />, key: 'contracts' },
              { icon: <CreditCard className="w-6 h-6" />, key: 'payments' },
              { icon: <BarChart3 className="w-6 h-6" />, key: 'analytics' },
              { icon: <Shield className="w-6 h-6" />, key: 'multiUser' },
            ] as const).map((feature, i) => (
              <div key={i} className="p-6 rounded-lg border border-border bg-card hover:shadow-lg hover:border-accent transition-all">
                <div className="text-accent mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{t(`features.items.${feature.key}.title`)}</h3>
                <p className="text-muted-foreground">{t(`features.items.${feature.key}.desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('howItWorks.title')}</h2>
            <p className="text-muted-foreground text-lg">{t('howItWorks.subtitle')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {(['signup', 'fleet', 'manage'] as const).map((key, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
                  {i + 1}
                </div>
                <h3 className="text-xl font-semibold mb-2">{t(`howItWorks.steps.${key}.title`)}</h3>
                <p className="text-muted-foreground">{t(`howItWorks.steps.${key}.desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('pricing.title')}</h2>
          <p className="text-muted-foreground text-lg mb-8">{t('pricing.subtitle')}</p>
          <Link href={`/${locale}/pricing`}>
            <Button size="lg" variant="outline">{t('pricing.viewPlans')}</Button>
          </Link>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-muted-foreground mb-12">{t('social.trusted')}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {(['elite', 'speed', 'premium'] as const).map((key, i) => (
              <div key={i} className="p-6 rounded-lg bg-card border border-border">
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, j) => <span key={j} className="text-accent">★</span>)}
                </div>
                <p className="text-sm mb-4">"{t(`social.testimonials.${key}.quote`)}"</p>
                <p className="font-semibold text-sm">{t(`social.testimonials.${key}.name`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">{t('cta.title')}</h2>
          <p className="text-muted-foreground text-lg mb-8">{t('cta.subtitle')}</p>
          <Link href={`/${locale}/signup`}>
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              {t('cta.button')} <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold mb-4">{t('footer.product')}</h4>
              <a href="#features" className="text-muted-foreground hover:text-foreground transition block mb-2">{t('nav.features')}</a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition block mb-2">{t('nav.pricing')}</a>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t('footer.company')}</h4>
              <a href="#" className="text-muted-foreground hover:text-foreground transition block mb-2">{t('footer.about')}</a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition block mb-2">{t('footer.contact')}</a>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t('footer.legal')}</h4>
              <a href="#" className="text-muted-foreground hover:text-foreground transition block mb-2">{t('footer.terms')}</a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition block mb-2">{t('footer.privacy')}</a>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t('footer.language')}</h4>
              {[
                { code: 'en', label: 'English' },
                { code: 'fr', label: 'Français' },
                { code: 'ar', label: 'العربية' },
              ].map(({ code, label }) => (
                <button
                  key={code}
                  onClick={() => switchLocale(code)}
                  className={`text-muted-foreground hover:text-foreground transition block mb-2 ${locale === code ? 'font-bold text-foreground' : ''}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted-foreground text-sm">{t('footer.copyright')}</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="text-muted-foreground hover:text-foreground transition">Twitter</a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition">LinkedIn</a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition">Facebook</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}