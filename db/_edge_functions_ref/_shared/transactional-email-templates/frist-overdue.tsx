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

interface FristOverdueProps {
  ownerName?: string
  measureTitle?: string
  measureRef?: string
  dueDate?: string
  daysOverdue?: number
  appUrl?: string
  isCcRecipient?: boolean
  lang?: 'de' | 'en'
}

const t = {
  de: {
    preview: (d?: number) => `ÜBERFÄLLIG: Maßnahme seit ${d ?? '?'} Tagen überfällig`,
    subject: (d?: number) => `⚠ Überfällig — NIS2-Maßnahme seit ${d ?? '?'} Tagen`,
    greeting: (n?: string) => n ? `Hallo ${n},` : 'Hallo,',
    intro: 'die folgende NIS2-Maßnahme ist überfällig und erfordert sofortige Aufmerksamkeit:',
    introCc: 'als Eskalations-Empfänger werden Sie über folgende überfällige NIS2-Maßnahme informiert:',
    measureLabel: 'Maßnahme:',
    refLabel: 'Referenz:',
    dueLabel: 'War fällig am:',
    overdueLabel: 'Tage überfällig:',
    cta: 'Maßnahme jetzt öffnen',
    actionNote: 'Bitte aktualisieren Sie den Status der Maßnahme oder verschieben Sie das Fälligkeitsdatum mit Begründung.',
    closing: `Mit freundlichen Grüßen,\nIhr ${SITE_NAME}-System`,
    subtitle: 'Überfällig-Eskalation',
  },
  en: {
    preview: (d?: number) => `OVERDUE: measure overdue by ${d ?? '?'} days`,
    subject: (d?: number) => `⚠ Overdue — NIS2 measure ${d ?? '?'} days late`,
    greeting: (n?: string) => n ? `Hi ${n},` : 'Hi,',
    intro: 'the following NIS2 measure is overdue and requires immediate attention:',
    introCc: 'as an escalation recipient, you are being notified about the following overdue NIS2 measure:',
    measureLabel: 'Measure:',
    refLabel: 'Reference:',
    dueLabel: 'Was due on:',
    overdueLabel: 'Days overdue:',
    cta: 'Open measure now',
    actionNote: 'Please update the status of the measure or postpone the due date with a justification.',
    closing: `Best regards,\nThe ${SITE_NAME} system`,
    subtitle: 'Overdue escalation',
  },
}

const FristOverdueEmail = ({
  ownerName,
  measureTitle,
  measureRef,
  dueDate,
  daysOverdue,
  appUrl,
  isCcRecipient,
  lang = 'de',
}: FristOverdueProps) => {
  const l = t[lang] || t.de
  return (
    <Html lang={lang} dir="ltr">
      <Head />
      <Preview>{l.preview(daysOverdue)}</Preview>
      <Body style={main}>
        <Container style={wrapper}>
          <Section style={header}>
            <Text style={logoText}>⚠ UniqSuite</Text>
            <Text style={logoSub}>{l.subtitle}</Text>
          </Section>
          <Container style={content}>
            <Heading style={h1}>{l.greeting(ownerName)}</Heading>
            <Text style={text}>{isCcRecipient ? l.introCc : l.intro}</Text>
            <Section style={alertBox}>
              <Text style={infoRow}><strong>{l.measureLabel}</strong> {measureTitle || '—'}</Text>
              {measureRef && <Text style={infoRow}><strong>{l.refLabel}</strong> {measureRef}</Text>}
              <Text style={infoRow}><strong>{l.dueLabel}</strong> {dueDate || '—'}</Text>
              <Text style={infoRowAccent}><strong>{l.overdueLabel}</strong> {daysOverdue ?? '?'}</Text>
            </Section>
            {appUrl && (
              <Section style={{ textAlign: 'center' as const, margin: '24px 0' }}>
                <Button href={appUrl} style={ctaButton}>{l.cta}</Button>
              </Section>
            )}
            <Text style={text}>{l.actionNote}</Text>
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
  component: FristOverdueEmail,
  subject: ((data: Record<string, any>) => {
    const lang = data?.lang === 'en' ? 'en' : 'de'
    return t[lang].subject(data?.daysOverdue)
  }),
  displayName: 'Frist-Überfällig (DE/EN)',
  previewData: {
    ownerName: 'Max Mustermann',
    measureTitle: 'Zugriffsmanagement — MFA einführen',
    measureRef: 'A.5.15',
    dueDate: '2026-05-01',
    daysOverdue: 3,
    appUrl: 'https://uniqsuite.com/execution',
    isCcRecipient: false,
    lang: 'de',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const wrapper = { maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }
const header = {
  background: 'linear-gradient(135deg, hsl(0, 75%, 35%), hsl(0, 65%, 25%))',
  padding: '32px 40px',
  textAlign: 'center' as const,
  borderRadius: '16px 16px 0 0',
}
const logoText = { margin: '0', color: '#ffffff', fontSize: '24px', fontWeight: '700' as const }
const logoSub = { margin: '8px 0 0', color: 'rgba(255,255,255,0.9)', fontSize: '14px' }
const content = { backgroundColor: '#ffffff', padding: '40px', border: '1px solid #e5e7eb', borderTop: 'none' }
const h1 = { fontSize: '20px', fontWeight: 'bold' as const, color: 'hsl(220, 40%, 13%)', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#374151', lineHeight: '1.6', margin: '0 0 16px' }
const alertBox = {
  backgroundColor: '#fef2f2',
  borderLeft: '4px solid hsl(0, 75%, 45%)',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '0 0 8px',
}
const infoRow = { fontSize: '14px', color: '#374151', lineHeight: '1.6', margin: '0 0 4px' }
const infoRowAccent = { fontSize: '14px', color: 'hsl(0, 75%, 40%)', lineHeight: '1.6', margin: '8px 0 0', fontWeight: '700' as const }
const ctaButton = {
  backgroundColor: 'hsl(0, 75%, 40%)',
  color: '#ffffff',
  padding: '12px 28px',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: '600' as const,
  textDecoration: 'none',
}
const footer = { fontSize: '14px', color: '#374151', margin: '24px 0 0', whiteSpace: 'pre-line' as const }
const footerSection = { textAlign: 'center' as const, padding: '20px 40px', backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb', borderRadius: '0 0 16px 16px' }
const footerBrand = { fontSize: '12px', color: '#9ca3af', margin: '0' }
