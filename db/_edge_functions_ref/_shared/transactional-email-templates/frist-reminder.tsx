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

interface FristReminderProps {
  ownerName?: string
  measureTitle?: string
  measureRef?: string
  dueDate?: string
  daysUntilDue?: number
  appUrl?: string
  lang?: 'de' | 'en'
}

const t = {
  de: {
    preview: (d?: number) => `Frist in ${d ?? '?'} Tagen — Maßnahme erfordert Ihre Aufmerksamkeit`,
    subject: (d?: number) => `Erinnerung: Maßnahme fällig in ${d ?? '?'} Tagen`,
    greeting: (n?: string) => n ? `Hallo ${n},` : 'Hallo,',
    intro: 'die folgende NIS2-Maßnahme ist Ihnen zugewiesen und wird in Kürze fällig:',
    measureLabel: 'Maßnahme:',
    refLabel: 'Referenz:',
    dueLabel: 'Fällig am:',
    daysLabel: 'Tage bis Frist:',
    cta: 'Maßnahme im Tool öffnen',
    footerNote: 'Diese Erinnerung erhalten Sie 1× pro Maßnahme. Bitte planen Sie die Umsetzung oder aktualisieren Sie den Status im Tool.',
    closing: `Mit freundlichen Grüßen,\nIhr ${SITE_NAME}-System`,
    subtitle: 'Frist-Erinnerung',
  },
  en: {
    preview: (d?: number) => `Deadline in ${d ?? '?'} days — measure needs your attention`,
    subject: (d?: number) => `Reminder: measure due in ${d ?? '?'} days`,
    greeting: (n?: string) => n ? `Hi ${n},` : 'Hi,',
    intro: 'the following NIS2 measure is assigned to you and will be due soon:',
    measureLabel: 'Measure:',
    refLabel: 'Reference:',
    dueLabel: 'Due on:',
    daysLabel: 'Days remaining:',
    cta: 'Open measure in the app',
    footerNote: 'You receive this reminder once per measure. Please schedule the work or update the status in the app.',
    closing: `Best regards,\nThe ${SITE_NAME} system`,
    subtitle: 'Deadline reminder',
  },
}

const FristReminderEmail = ({
  ownerName,
  measureTitle,
  measureRef,
  dueDate,
  daysUntilDue,
  appUrl,
  lang = 'de',
}: FristReminderProps) => {
  const l = t[lang] || t.de
  return (
    <Html lang={lang} dir="ltr">
      <Head />
      <Preview>{l.preview(daysUntilDue)}</Preview>
      <Body style={main}>
        <Container style={wrapper}>
          <Section style={header}>
            <Text style={logoText}>🛡️ UniqSuite</Text>
            <Text style={logoSub}>{l.subtitle}</Text>
          </Section>
          <Container style={content}>
            <Heading style={h1}>{l.greeting(ownerName)}</Heading>
            <Text style={text}>{l.intro}</Text>
            <Section style={infoBox}>
              <Text style={infoRow}><strong>{l.measureLabel}</strong> {measureTitle || '—'}</Text>
              {measureRef && <Text style={infoRow}><strong>{l.refLabel}</strong> {measureRef}</Text>}
              <Text style={infoRow}><strong>{l.dueLabel}</strong> {dueDate || '—'}</Text>
              <Text style={infoRowAccent}><strong>{l.daysLabel}</strong> {daysUntilDue ?? '?'}</Text>
            </Section>
            {appUrl && (
              <Section style={{ textAlign: 'center' as const, margin: '24px 0' }}>
                <Button href={appUrl} style={ctaButton}>{l.cta}</Button>
              </Section>
            )}
            <Text style={muted}>{l.footerNote}</Text>
            <Text style={footer}>{l.closing}</Text>
          </Container>
          <Section style={footerSection}>
            <Text style={footerBrand}>© 2026 Cyberwerk · UniqSuite</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: FristReminderEmail,
  subject: ((data: Record<string, any>) => {
    const lang = data?.lang === 'en' ? 'en' : 'de'
    return t[lang].subject(data?.daysUntilDue)
  }),
  displayName: 'Frist-Erinnerung (DE/EN)',
  previewData: {
    ownerName: 'Max Mustermann',
    measureTitle: 'Zugriffsmanagement — MFA einführen',
    measureRef: 'A.5.15',
    dueDate: '2026-06-30',
    daysUntilDue: 30,
    appUrl: 'https://uniqsuite.com/execution',
    lang: 'de',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const wrapper = { maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }
const header = {
  background: 'linear-gradient(135deg, hsl(220, 100%, 30%), hsl(220, 80%, 20%))',
  padding: '32px 40px',
  textAlign: 'center' as const,
  borderRadius: '16px 16px 0 0',
}
const logoText = { margin: '0', color: '#ffffff', fontSize: '24px', fontWeight: '700' as const }
const logoSub = { margin: '8px 0 0', color: 'rgba(255,255,255,0.85)', fontSize: '14px' }
const content = { backgroundColor: '#ffffff', padding: '40px', border: '1px solid #e5e7eb', borderTop: 'none' }
const h1 = { fontSize: '20px', fontWeight: 'bold' as const, color: 'hsl(220, 40%, 13%)', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#374151', lineHeight: '1.6', margin: '0 0 16px' }
const infoBox = {
  backgroundColor: '#f0f4ff',
  borderLeft: '4px solid hsl(220, 100%, 35%)',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '0 0 8px',
}
const infoRow = { fontSize: '14px', color: '#374151', lineHeight: '1.6', margin: '0 0 4px' }
const infoRowAccent = { fontSize: '14px', color: 'hsl(220, 100%, 30%)', lineHeight: '1.6', margin: '8px 0 0', fontWeight: '600' as const }
const ctaButton = {
  backgroundColor: 'hsl(220, 100%, 30%)',
  color: '#ffffff',
  padding: '12px 28px',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: '600' as const,
  textDecoration: 'none',
}
const muted = { fontSize: '12px', color: '#6b7280', lineHeight: '1.5', margin: '24px 0 0', fontStyle: 'italic' as const }
const footer = { fontSize: '14px', color: '#374151', margin: '16px 0 0', whiteSpace: 'pre-line' as const }
const footerSection = { textAlign: 'center' as const, padding: '20px 40px', backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb', borderRadius: '0 0 16px 16px' }
const footerBrand = { fontSize: '12px', color: '#9ca3af', margin: '0' }
