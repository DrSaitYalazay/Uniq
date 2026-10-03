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

interface OrgInvitationProps {
  inviterName?: string
  orgName?: string
  acceptUrl?: string
  lang?: 'de' | 'en'
}

const t = {
  de: {
    preview: (org: string) => `Einladung zu ${org} auf UniqSuite`,
    title: 'Sie wurden eingeladen',
    body: (inviter: string, org: string) =>
      `${inviter} hat Sie eingeladen, dem Team ${org} auf UniqSuite beizutreten.`,
    instruction:
      'Klicken Sie auf den Button unten, um die Einladung anzunehmen. Falls Sie noch kein Konto haben, können Sie eines erstellen.',
    cta: 'Einladung annehmen',
    expires:
      'Diese Einladung läuft in 14 Tagen ab. Falls Sie diese E-Mail nicht erwartet haben, können Sie sie ignorieren.',
    subtitle: 'NIS2 Umsetzung & Konformitätsprüfung',
    linkLabel: 'Oder Link kopieren:',
  },
  en: {
    preview: (org: string) => `Invitation to join ${org} on UniqSuite`,
    title: "You've been invited",
    body: (inviter: string, org: string) =>
      `${inviter} invited you to join the team ${org} on UniqSuite.`,
    instruction:
      "Click the button below to accept the invitation. If you don't have an account yet, you can create one.",
    cta: 'Accept invitation',
    expires:
      "This invitation expires in 14 days. If you weren't expecting this email, you can safely ignore it.",
    subtitle: 'NIS2 Implementation & Compliance',
    linkLabel: 'Or copy this link:',
  },
}

const OrgInvitationEmail = ({
  inviterName = 'A team member',
  orgName = 'an organization',
  acceptUrl = '#',
  lang = 'de',
}: OrgInvitationProps) => {
  const l = t[lang] || t.de
  return (
    <Html lang={lang} dir="ltr">
      <Head>
        {/* Force light color scheme so Gmail/iOS dark mode does not invert palette */}
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
            a.cws-btn { background-color: #1e3a8a !important; color: #ffffff !important; }
          }
          u + .body .cws-card { background-color: #ffffff !important; }
        `}</style>
      </Head>
      <Preview>{l.preview(orgName)}</Preview>
      <Body style={main} className="body">
        <Container style={wrapper}>
          <Section style={header}>
            <Text style={logoText}>UniqSuite</Text>
            <Text style={logoSub}>{l.subtitle}</Text>
          </Section>
          <Container style={content} className="cws-card">
            <Heading style={h1} className="cws-heading">{l.title}</Heading>
            <Text style={text} className="cws-text">{l.body(inviterName, orgName)}</Text>
            <Text style={text} className="cws-text">{l.instruction}</Text>

            {/* Bulletproof button — table-based for Outlook + dark-mode-safe */}
            <Section style={buttonContainer}>
              <table cellPadding={0} cellSpacing={0} border={0} role="presentation" style={{ margin: '0 auto' }}>
                <tbody>
                  <tr>
                    <td align="center" bgcolor="#1e3a8a" style={buttonCell}>
                      <a href={acceptUrl} className="cws-btn" style={buttonLink}>
                        <span style={{ color: '#ffffff' }}>{l.cta}</span>
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </Section>

            <Text style={footer} className="cws-muted">{l.expires}</Text>
            <Text style={linkLabelStyle} className="cws-muted">{l.linkLabel}</Text>
            <Text style={linkFallback}>
              <a href={acceptUrl} style={{ color: '#1e3a8a', wordBreak: 'break-all' }}>{acceptUrl}</a>
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
  component: OrgInvitationEmail,
  subject: ((data: Record<string, any>) =>
    (data?.lang === 'en')
      ? `Invitation to join ${data?.orgName ?? 'a team'} on UniqSuite`
      : `Einladung zu ${data?.orgName ?? 'einem Team'} auf UniqSuite`
  ),
  displayName: 'Organization Invitation (DE/EN)',
  previewData: { inviterName: 'Max Mustermann', orgName: 'Acme GmbH', acceptUrl: 'https://uniqsuite.com/accept-invite?token=demo', lang: 'de' },
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
const buttonContainer = { textAlign: 'center' as const, padding: '8px 0 24px' }
const buttonCell = {
  backgroundColor: '#1e3a8a',
  borderRadius: '10px',
  padding: '0',
}
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
const footer = { fontSize: '13px', color: '#6b7280', margin: '24px 0 0' }
const linkLabelStyle = { fontSize: '12px', color: '#6b7280', margin: '16px 0 4px' }
const linkFallback = { fontSize: '12px', margin: '0', wordBreak: 'break-all' as const }
const footerSection = { textAlign: 'center' as const, padding: '20px 40px' }
const footerBrand = { fontSize: '12px', color: '#9ca3af', margin: '0' }
