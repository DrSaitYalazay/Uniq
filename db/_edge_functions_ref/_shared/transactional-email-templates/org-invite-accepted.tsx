/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text, Button,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  ownerName?: string
  memberEmail?: string
  memberName?: string
  orgName?: string
  manageUrl?: string
  lang?: 'de' | 'en'
}

const Email = ({ ownerName, memberEmail, memberName, orgName, manageUrl, lang = 'de' }: Props) => {
  const de = lang === 'de'
  const greet = ownerName || (de ? 'Hallo' : 'Hello')
  const who = memberName ? `${memberName} (${memberEmail})` : memberEmail
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
            a.cws-btn { background-color: #1e3a8a !important; color: #ffffff !important; }
          }
          u + .body .cws-card { background-color: #ffffff !important; }
        `}</style>
      </Head>
      <Preview>{de ? `Neues Teammitglied: ${memberEmail}` : `New team member: ${memberEmail}`}</Preview>
      <Body style={main} className="body">
        <Container style={wrapper}>
          <Section style={header}>
            <Text style={logoText}>UniqSuite</Text>
            <Text style={logoSub}>{de ? 'Team-Verwaltung' : 'Team management'}</Text>
          </Section>
          <Container style={content} className="cws-card">
            <Heading style={h1} className="cws-heading">{de ? 'Einladung angenommen ✅' : 'Invitation accepted ✅'}</Heading>
            <Text style={text} className="cws-text">{de ? `Hallo ${greet},` : `Hi ${greet},`}</Text>
            <Text style={text} className="cws-text">
              {de
                ? `${who} hat Ihre Einladung zu ${orgName} angenommen und ist jetzt Mitglied Ihres Teams.`
                : `${who} accepted your invitation to ${orgName} and is now a member of your team.`}
            </Text>
            {manageUrl && (
              <Section style={{ textAlign: 'center' as const, padding: '8px 0 24px' }}>
                <table cellPadding={0} cellSpacing={0} border={0} role="presentation" style={{ margin: '0 auto' }}>
                  <tbody>
                    <tr>
                      <td align="center" bgcolor="#1e3a8a" style={buttonCell}>
                        <a href={manageUrl} className="cws-btn" style={buttonLink}>
                          <span style={{ color: '#ffffff' }}>{de ? 'Team verwalten →' : 'Manage team →'}</span>
                        </a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </Section>
            )}
            <Text style={footer} className="cws-text">{de ? 'Ihr UniqSuite Team' : 'Your UniqSuite Team'}</Text>
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
  component: Email,
  subject: ((data: Record<string, any>) =>
    data?.lang === 'en'
      ? `${data?.memberEmail || 'A new member'} joined ${data?.orgName || 'your team'}`
      : `${data?.memberEmail || 'Ein neues Mitglied'} ist ${data?.orgName || 'Ihrem Team'} beigetreten`),
  displayName: 'Org Invitation Accepted (DE/EN)',
  previewData: { ownerName: 'Sait', memberEmail: 'neu@example.com', orgName: 'Cyberwerk', manageUrl: 'https://uniqsuite.com/settings', lang: 'de' },
} satisfies TemplateEntry

const main = { backgroundColor: '#f5f7fa', fontFamily: "'DM Sans', Arial, sans-serif", margin: 0, padding: 0 }
const wrapper = { maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }
const header = {
  backgroundColor: '#1e3a8a',
  background: 'linear-gradient(135deg, #1e3a8a, #0f2557)',
  padding: '32px 40px', textAlign: 'center' as const, borderRadius: '16px 16px 0 0',
}
const logoText = { margin: '0', color: '#ffffff', fontSize: '24px', fontWeight: '700' as const }
const logoSub = { margin: '8px 0 0', color: '#dbe4f5', fontSize: '14px' }
const content = { backgroundColor: '#ffffff', padding: '40px', borderRadius: '0 0 16px 16px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#0f172a', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#374151', lineHeight: '1.6', margin: '0 0 16px' }
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
