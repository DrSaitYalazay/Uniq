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

interface ContactConfirmationProps {
  name?: string
  lang?: 'de' | 'en'
}

const t = {
  de: {
    preview: `Ihre Nachricht wurde empfangen — ${SITE_NAME}`,
    thankYou: (n?: string) => n ? `Vielen Dank, ${n}!` : 'Vielen Dank für Ihre Nachricht!',
    body: 'Wir haben Ihre Nachricht erhalten und werden uns so schnell wie möglich bei Ihnen melden.',
    tip: '💡 In der Zwischenzeit können Sie unsere Plattform erkunden und mit der NIS2-Konformitätsprüfung beginnen — kostenlos und unverbindlich.',
    closing: `Mit freundlichen Grüßen,\nIhr ${SITE_NAME} Team`,
    subtitle: 'NIS2 Umsetzung & Konformitätsprüfung',
  },
  en: {
    preview: `Your message has been received — ${SITE_NAME}`,
    thankYou: (n?: string) => n ? `Thank you, ${n}!` : 'Thank you for your message!',
    body: 'We have received your message and will get back to you as soon as possible.',
    tip: '💡 In the meantime, explore our platform and start your NIS2 compliance check — free and without obligation.',
    closing: `Best regards,\nYour ${SITE_NAME} Team`,
    subtitle: 'NIS2 Implementation & Compliance',
  },
}

const ContactConfirmationEmail = ({ name, lang = 'de' }: ContactConfirmationProps) => {
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
            .cws-info { background-color: #eff6ff !important; color: #1e3a8a !important; }
            .cws-info-text { color: #1e3a8a !important; }
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
            <Text style={text} className="cws-text">{l.body}</Text>
            <Section style={infoBox} className="cws-info">
              <Text style={infoText} className="cws-info-text">{l.tip}</Text>
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
  component: ContactConfirmationEmail,
  subject: ((data: Record<string, any>) =>
    (data?.lang === 'en')
      ? 'Your message has been received — UniqSuite'
      : 'Ihre Nachricht wurde empfangen — UniqSuite'
  ),
  displayName: 'Contact Confirmation (DE/EN)',
  previewData: { name: 'Max Mustermann', lang: 'de' },
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
const infoBox = { backgroundColor: '#eff6ff', borderRadius: '12px', padding: '20px 24px', margin: '0 0 24px' }
const infoText = { fontSize: '14px', color: '#1e3a8a', lineHeight: '1.6', margin: '0' }
const footer = { fontSize: '14px', color: '#374151', margin: '24px 0 0', whiteSpace: 'pre-line' as const }
const footerSection = { textAlign: 'center' as const, padding: '20px 40px' }
const footerBrand = { fontSize: '12px', color: '#6b7280', margin: '0' }
