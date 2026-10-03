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

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <Html lang="de" dir="ltr">
    <Head />
    <Preview>Ihr Login-Link für {siteName}</Preview>
    <Body style={main}>
      <Container style={wrapper}>
        <Section style={header}>
          <Text style={logoText}>🛡️ UniqSuite</Text>
          <Text style={logoSub}>NIS2 Umsetzung & Konformitätsprüfung</Text>
        </Section>
        <Container style={content}>
          <Heading style={h1}>Ihr Login-Link</Heading>
          <Text style={text}>
            Klicken Sie auf den Button unten, um sich bei {siteName} anzumelden.
            Dieser Link ist nur für kurze Zeit gültig.
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={confirmationUrl}>
              Jetzt anmelden →
            </Button>
          </Section>
          <Text style={footer}>
            Falls Sie diesen Link nicht angefordert haben, können Sie diese E-Mail
            ignorieren.
          </Text>
        </Container>
        <Section style={footerSection}>
          <Text style={footerBrand}>© 2026 Cyberwerk · UniqSuite</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

const main = { backgroundColor: '#f5f7fa', fontFamily: "'DM Sans', Arial, sans-serif" }
const wrapper = { maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }
const header = {
  background: 'linear-gradient(135deg, hsl(220, 100%, 30%), hsl(220, 80%, 20%))',
  padding: '32px 40px',
  textAlign: 'center' as const,
  borderRadius: '16px 16px 0 0',
}
const logoText = { margin: '0', color: '#ffffff', fontSize: '24px', fontWeight: '700' as const }
const logoSub = { margin: '8px 0 0', color: 'rgba(255,255,255,0.8)', fontSize: '14px' }
const content = { backgroundColor: '#ffffff', padding: '40px' }
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: 'hsl(220, 40%, 13%)',
  margin: '0 0 20px',
}
const text = {
  fontSize: '15px',
  color: '#55575d',
  lineHeight: '1.6',
  margin: '0 0 20px',
}
const buttonContainer = { textAlign: 'center' as const, padding: '8px 0 24px' }
const button = {
  backgroundColor: 'hsl(220, 100%, 30%)',
  background: 'linear-gradient(135deg, hsl(220, 100%, 30%), hsl(220, 80%, 20%))',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '700' as const,
  borderRadius: '12px',
  padding: '14px 32px',
  textDecoration: 'none',
  display: 'inline-block' as const,
}
const footer = { fontSize: '13px', color: '#999999', margin: '24px 0 0' }
const footerSection = { textAlign: 'center' as const, padding: '20px 40px', backgroundColor: '#f5f7fa', borderTop: '1px solid #e5e7eb' }
const footerBrand = { fontSize: '12px', color: '#9ca3af', margin: '0' }
