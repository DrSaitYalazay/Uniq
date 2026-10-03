/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as contactConfirmation } from './contact-confirmation.tsx'
import { template as bootcampConfirmation } from './bootcamp-confirmation.tsx'
import { template as orgInvitation } from './org-invitation.tsx'
import { template as membershipGranted } from './membership-granted.tsx'
import { template as fristReminder } from './frist-reminder.tsx'
import { template as fristOverdue } from './frist-overdue.tsx'
import { template as orgInviteAccepted } from './org-invite-accepted.tsx'
import { template as newUserSignup } from './new-user-signup.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'contact-confirmation': contactConfirmation,
  'bootcamp-confirmation': bootcampConfirmation,
  'org-invitation': orgInvitation,
  'membership-granted': membershipGranted,
  'frist-reminder': fristReminder,
  'frist-overdue': fristOverdue,
  'org-invite-accepted': orgInviteAccepted,
  'new-user-signup': newUserSignup,
}
