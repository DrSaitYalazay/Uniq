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

interface Props {
  userEmail?: string
  displayName?: string
  provider?: string
  createdAt?: string
}

const NewUserSignupEmail = ({ userEmail, displayName, provider, createdAt }: Props) => {
  const when = createdAt ? new Date(createdAt).toLocaleString('de-DE') : new Date().toLocaleString('de-DE')
  return (
    <Html lang="de" dir="ltr">
      <Head />
      <Preview>Neue Registrierung: {userEmail}</Preview>
      <Body style={main}>
        <Container style={wrapper}>
          <Section style={header}>
            <Text style={logoText}>UniqSuite · Admin</Text>
          </Section>
          <Container style={content}>
            <Heading style={h1}>Neue Benutzerregistrierung</Heading>
            <Text style={text}>Ein neuer Account wurde gerade erstellt.</Text>
            <Section style={infoBox}>
              <Text style={row}><b>Name:</b> {displayName || '—'}</Text>
              <Text style={row}><b>E-Mail:</b> {userEmail}</Text>
              <Text style={row}><b>Anmeldemethode:</b> {provider || 'email'}</Text>
              <Text style={row}><b>Zeitpunkt:</b> {when}</Text>
            </Section>
            <Text style={muted}>
              Sie können diese Registrierung im Admin-Panel einsehen.
            </Text>
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
  component: NewUserSignupEmail,
  subject: (d: Record<string, unknown>) => `Neue Registrierung: ${(d.userEmail as string) || 'UniqSuite'}`,
  to: 'info@cyberwerksuite.com',
  displayName: 'Admin: Neue Registrierung',
  previewData: {
    userEmail: 'neuer.nutzer@example.com',
    displayName: 'Neuer Nutzer',
    provider: 'google',
    createdAt: new Date().toISOString(),
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const wrapper = { margin: '0 auto', maxWidth: '600px', padding: '0' }
const header = { padding: '24px 25px', textAlign: 'center' as const }
const logoText = { fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: 0 }
const content = { padding: '20px 25px', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px' }
const h1 = { fontSize: '22px', color: '#0f172a', margin: '0 0 12px' }
const text = { fontSize: '15px', color: '#374151', lineHeight: '22px' }
const infoBox = { backgroundColor: '#f8fafc', padding: '14px 16px', borderRadius: '8px', margin: '14px 0' }
const row = { fontSize: '14px', color: '#0f172a', margin: '4px 0' }
const muted = { fontSize: '13px', color: '#6b7280', marginTop: '14px' }
const footerSection = { padding: '16px 25px', textAlign: 'center' as const }
const footerBrand = { fontSize: '12px', color: '#9ca3af', margin: 0 }
