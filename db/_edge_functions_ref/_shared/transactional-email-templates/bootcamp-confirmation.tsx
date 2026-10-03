/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
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

interface BootcampConfirmationProps {
  name?: string
  company?: string
  preferredMonth?: string
  lang?: 'de' | 'en'
}

const t = {
  de: {
    preview: `Bootcamp-Bewerbung erhalten — ${SITE_NAME}`,
    subtitle: 'NIS2 Umsetzung & Konformitätsprüfung',
    thankYou: (n?: string) => n ? `Vielen Dank, ${n}!` : 'Vielen Dank für Ihre Bewerbung!',
    body: (c?: string) => `Wir haben Ihre Bewerbung für das **NIS2 Implementation Bootcamp** erhalten${c ? ` (${c})` : ''}.`,
    detailsTitle: '📋 Ihre Angaben:',
    format: '• Format: 2-tägiger Live-Workshop (16 Stunden)',
    month: (m: string) => `• Gewünschter Monat: ${m}`,
    method: '• Methodik: Hands-on mit echtem System',
    nextSteps: 'Unser Team wird Ihre Bewerbung prüfen und sich innerhalb von 2–3 Werktagen mit den nächsten Schritten bei Ihnen melden.',
    tip: '💡 Tipp: Erkunden Sie in der Zwischenzeit die UniqSuite-Plattform und beginnen Sie mit der kostenlosen Betroffenheitsprüfung.',
    closing: `Mit freundlichen Grüßen,\nIhr ${SITE_NAME} Team`,
    subject: `Bootcamp-Bewerbung erhalten — ${SITE_NAME}`,
  },
  en: {
    preview: `Bootcamp application received — ${SITE_NAME}`,
    subtitle: 'NIS2 Implementation & Compliance',
    thankYou: (n?: string) => n ? `Thank you, ${n}!` : 'Thank you for your application!',
    body: (c?: string) => `We have received your application for the **NIS2 Implementation Bootcamp**${c ? ` (${c})` : ''}.`,
    detailsTitle: '📋 Your Details:',
    format: '• Format: 2-day live workshop (16 hours)',
    month: (m: string) => `• Preferred month: ${m}`,
    method: '• Methodology: Hands-on with a real system',
    nextSteps: 'Our team will review your application and get back to you within 2–3 business days with the next steps.',
    tip: '💡 Tip: In the meantime, explore the UniqSuite platform and start your free impact assessment.',
    closing: `Best regards,\nYour ${SITE_NAME} Team`,
    subject: `Bootcamp application received — ${SITE_NAME}`,
  },
}

const BootcampConfirmationEmail = ({ name, company, preferredMonth, lang = 'de' }: BootcampConfirmationProps) => {
  const l = t[lang] || t.de
  return (
    <Html lang={lang} dir="ltr">
      <Head>
        <meta name="color-scheme" content="light only" />
        <meta name="supported-color-schemes" content="light only" />
        <style>{`
          :root { color-scheme: light only; supported-color-schemes: light only; }
          @media (prefers-color-scheme: dark) {
            body, table, td, div, p, h1, h2, h3, span { background-color: inherit !important; }
            .cws-card { background-color: #ffffff !important; }
            .cws-text { color: #374151 !important; }
            .cws-heading { color: #0f172a !important; }
            .cws-muted { color: #6b7280 !important; }
            .cws-info { background-color: #eff6ff !important; }
            .cws-info-text { color: #1e3a8a !important; }
            .cws-tip { background-color: #fffbeb !important; }
            .cws-tip-text { color: #92400e !important; }
          }
          u + .body .cws-card { background-color: #ffffff !important; }
        `}</style>
      </Head>
      <Preview>{l.preview}</Preview>
      <Body style={main} className="body">
        <Container style={wrapper}>
          <Section style={header}>
            <Text style={logoText}>UniqSuite</Text>
            <Text style={logoSub}>{l.subtitle}</Text>
          </Section>
          <Container style={content} className="cws-card">
            <Heading style={h1} className="cws-heading">{l.thankYou(name)}</Heading>
            <Text style={text} className="cws-text">
              {l.body(company)}
            </Text>
            <Section style={detailsBox} className="cws-info">
              <Text style={detailsTitle} className="cws-info-text">{l.detailsTitle}</Text>
              <Text style={detailsText} className="cws-text">
                {l.format}{'\n'}
                {preferredMonth ? `${l.month(preferredMonth)}\n` : ''}
                {l.method}
              </Text>
            </Section>
            <Text style={text} className="cws-text">{l.nextSteps}</Text>
            <Section style={infoBox} className="cws-tip">
              <Text style={infoText} className="cws-tip-text">{l.tip}</Text>
            </Section>
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
  component: BootcampConfirmationEmail,
  subject: ((data: Record<string, any>) =>
    (data?.lang === 'en')
      ? `Bootcamp application received — ${SITE_NAME}`
      : `Bootcamp-Bewerbung erhalten — ${SITE_NAME}`
  ),
  displayName: 'Bootcamp Confirmation (DE/EN)',
  previewData: { name: 'Dr. Anna Schmidt', company: 'Muster GmbH', preferredMonth: 'September 2026', lang: 'de' },
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
const text = { fontSize: '15px', color: '#374151', lineHeight: '1.6', margin: '0 0 20px' }
const detailsBox = { backgroundColor: '#eff6ff', borderRadius: '12px', padding: '20px 24px', margin: '0 0 24px' }
const detailsTitle = { fontSize: '14px', fontWeight: '700' as const, color: '#1e3a8a', margin: '0 0 12px' }
const detailsText = { fontSize: '14px', color: '#374151', lineHeight: '1.8', margin: '0', whiteSpace: 'pre-line' as const }
const infoBox = { backgroundColor: '#fffbeb', borderRadius: '12px', padding: '20px 24px', margin: '0 0 24px' }
const infoText = { fontSize: '14px', color: '#92400e', lineHeight: '1.6', margin: '0' }
const footer = { fontSize: '14px', color: '#374151', margin: '24px 0 0', whiteSpace: 'pre-line' as const }
const footerSection = { textAlign: 'center' as const, padding: '20px 40px' }
const footerBrand = { fontSize: '12px', color: '#6b7280', margin: '0' }
