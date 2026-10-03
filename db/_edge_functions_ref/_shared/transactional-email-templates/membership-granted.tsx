/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'UniqSuite'

interface MembershipGrantedProps {
  name?: string
  roleName?: 'pro' | 'premium' | 'xl'
  lang?: 'de' | 'en'
}

const labels = {
  de: {
    subtitle: 'NIS2 Umsetzung & Konformitätsprüfung',
    preview: (role: string) => `Ihre ${role}-Mitgliedschaft ist aktiv — ${SITE_NAME}`,
    heading: (role: string) => `Willkommen als ${role}-Mitglied! 🎉`,
    greeting: (n: string) => `Hallo ${n},`,
    body: (role: string) =>
      `Ihre ${role}-Mitgliedschaft wurde erfolgreich aktiviert. Ab sofort haben Sie Zugang zu allen ${role}-Inhalten auf ${SITE_NAME}.`,
    benefitsTitle: (role: string) => `Ihre ${role}-Vorteile:`,
    benefits: [
      'Vollständige Blog-Artikel ohne Wortbegrenzung',
      'Alle Inhalte freigeschaltet',
      'PDF & Word Export',
    ],
    premiumExtras: ['Erweiterte Implementierungs-Begleitung (bis zu 6h pro Jahr)', 'Prioritäts-Support', 'Erweiterte Berichte'],
    coreExtras: ['Erweiterte Implementierungs-Begleitung (bis zu 3h pro Jahr)'],
    xlExtras: ['Bis zu 10 Nutzer', 'Erweiterte Implementierungs-Begleitung (bis zu 10h pro Jahr)', 'Senior-Ansprechpartner mit Quartals-Strategie-Reviews'],
    cta: 'Jetzt starten →',
    questions: 'Bei Fragen stehen wir Ihnen gerne zur Verfügung.',
    closing: `Ihr ${SITE_NAME} Team`,
  },
  en: {
    subtitle: 'NIS2 Implementation & Compliance',
    preview: (role: string) => `Your ${role} membership is active — ${SITE_NAME}`,
    heading: (role: string) => `Welcome as a ${role} member! 🎉`,
    greeting: (n: string) => `Hello ${n},`,
    body: (role: string) =>
      `Your ${role} membership has been successfully activated. You now have access to all ${role} content on ${SITE_NAME}.`,
    benefitsTitle: (role: string) => `Your ${role} benefits:`,
    benefits: [
      'Full blog articles without word limits',
      'All content unlocked',
      'PDF & Word export',
    ],
    premiumExtras: ['Extended implementation guidance (up to 6h per year)', 'Priority support', 'Advanced reports'],
    coreExtras: ['Extended implementation guidance (up to 3h per year)'],
    xlExtras: ['Up to 10 users', 'Extended implementation guidance (up to 10h per year)', 'Senior account manager with quarterly strategy reviews'],
    cta: 'Get started →',
    questions: 'If you have any questions, we are happy to help.',
    closing: `Your ${SITE_NAME} Team`,
  },
}

const roleToLabel = (role?: string): string => {
  if (role === 'pro') return 'Core'
  if (role === 'xl') return 'XL'
  return 'Enterprise'
}

const MembershipGrantedEmail = ({ name, roleName = 'premium', lang = 'de' }: MembershipGrantedProps) => {
  const l = labels[lang] || labels.de
  const roleLabel = roleToLabel(roleName)
  const displayName = name || (lang === 'de' ? 'Kunde' : 'Customer')
  const benefits = roleName === 'xl'
    ? [...l.benefits, ...l.premiumExtras, ...l.xlExtras]
    : roleName === 'premium'
      ? [...l.benefits, ...l.premiumExtras]
      : [...l.benefits, ...l.coreExtras]

  return (
    <Html lang={lang} dir="ltr">
      <Head>
        <meta name="color-scheme" content="light only" />
        <meta name="supported-color-schemes" content="light only" />
        <style>{`
          :root { color-scheme: light only; supported-color-schemes: light only; }
          a.cws-btn, a.cws-btn span { color: #ffffff !important; text-decoration: none !important; }
          @media (prefers-color-scheme: dark) {
            body, table, td, div, p, h1, h2, h3, span { background-color: inherit !important; }
            .cws-card { background-color: #ffffff !important; }
            .cws-text { color: #374151 !important; }
            .cws-heading { color: #0f172a !important; }
            .cws-muted { color: #6b7280 !important; }
            .cws-info { background-color: #eff6ff !important; }
            .cws-info-text { color: #1e3a8a !important; }
            a.cws-btn { background-color: #1e3a8a !important; color: #ffffff !important; }
          }
          u + .body .cws-card { background-color: #ffffff !important; }
        `}</style>
      </Head>
      <Preview>{l.preview(roleLabel)}</Preview>
      <Body style={main} className="body">
        <Container style={wrapper}>
          <Section style={header}>
            <Text style={logoText}>UniqSuite</Text>
            <Text style={logoSub}>{l.subtitle}</Text>
          </Section>
          <Container style={content} className="cws-card">
            <Heading style={h1} className="cws-heading">{l.heading(roleLabel)}</Heading>
            <Text style={text} className="cws-text">{l.greeting(displayName)}</Text>
            <Text style={text} className="cws-text">{l.body(roleLabel)}</Text>

            <Section style={infoBox} className="cws-info">
              <Text style={benefitsHead} className="cws-info-text">{l.benefitsTitle(roleLabel)}</Text>
              {benefits.map((b, i) => (
                <Text key={i} style={benefitItem} className="cws-text">• {b}</Text>
              ))}
            </Section>

            <Section style={{ textAlign: 'center' as const, padding: '8px 0 24px' }}>
              <table cellPadding={0} cellSpacing={0} border={0} role="presentation" style={{ margin: '0 auto' }}>
                <tbody>
                  <tr>
                    <td align="center" bgcolor="#1e3a8a" style={buttonCell}>
                      <a href="https://uniqsuite.com" className="cws-btn" style={buttonLink}>
                        <span style={{ color: '#ffffff' }}>{l.cta}</span>
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </Section>

            <Text style={text} className="cws-text">{l.questions}</Text>
            <Text style={footer} className="cws-text">{l.closing}</Text>
          </Container>
          <Section style={footerSection}>
            <Text style={footerBrand} className="cws-muted">© 2026 Cyberwerk · UniqSuite</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: MembershipGrantedEmail,
  subject: ((data: Record<string, any>) => {
    const role = roleToLabel(data?.roleName)
    return data?.lang === 'en'
      ? `Your ${role} membership is active — UniqSuite`
      : `Ihre ${role}-Mitgliedschaft ist aktiv — UniqSuite`
  }),
  displayName: 'Membership Granted (DE/EN)',
  previewData: { name: 'Max Mustermann', roleName: 'premium', lang: 'de' },
} satisfies TemplateEntry

const main = { backgroundColor: '#f5f7fa', fontFamily: "'DM Sans', Arial, sans-serif", margin: 0, padding: 0 }
const wrapper = { maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }
const header = {
  backgroundColor: '#1e3a8a',
  background: 'linear-gradient(135deg, #1e3a8a, #0f2557)',
  padding: '32px 40px',
  textAlign: 'center' as const,
  borderRadius: '16px 16px 0 0',
}
const logoText = { margin: '0', color: '#ffffff', fontSize: '24px', fontWeight: '700' as const }
const logoSub = { margin: '8px 0 0', color: '#dbe4f5', fontSize: '14px' }
const content = { backgroundColor: '#ffffff', padding: '40px', borderRadius: '0 0 16px 16px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#0f172a', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#374151', lineHeight: '1.6', margin: '0 0 16px' }
const infoBox = { backgroundColor: '#eff6ff', borderRadius: '12px', padding: '20px 24px', margin: '8px 0 24px' }
const benefitsHead = { margin: '0 0 12px', color: '#1e3a8a', fontSize: '14px', fontWeight: '700' as const }
const benefitItem = { margin: '0 0 6px', color: '#374151', fontSize: '14px', lineHeight: '1.6' }
const buttonCell = { backgroundColor: '#1e3a8a', borderRadius: '10px', padding: '0' }
const buttonLink = {
  display: 'inline-block',
  padding: '14px 32px',
  fontSize: '15px',
  fontWeight: 700 as const,
  color: '#ffffff',
  textDecoration: 'none',
  borderRadius: '10px',
  backgroundColor: '#1e3a8a',
  fontFamily: "'DM Sans', Arial, sans-serif",
}
const footer = { fontSize: '14px', color: '#374151', margin: '16px 0 0' }
const footerSection = { textAlign: 'center' as const, padding: '20px 40px' }
const footerBrand = { fontSize: '12px', color: '#6b7280', margin: '0' }
