// Edge function muadilleri. supabase.functions.invoke("<ad>", {body}) ->
// POST /functions/<ad>. Her fonksiyon kendi dosyasında; burada bağlanır.
import { Router } from 'express';
import fetchExternalJson from './fetch-external-json.js';
import setIntegrationSecret from './set-integration-secret.js';
import syncIntune from './sync-intune.js';
import syncServicenow from './sync-servicenow.js';
import sendOrgInvitation from './send-org-invitation.js';
import acceptOrgInvitation from './accept-org-invitation.js';
import signupFromInvite from './signup-from-invite.js';
import adminDeleteUser from './admin-delete-user.js';
import adminListUsers from './admin-list-users.js';
import adminCreateUser from './admin-create-user.js';
import adminSetRole from './admin-set-role.js';
import adminSetBan from './admin-set-ban.js';
import adminResetMfa from './admin-reset-mfa.js';
import adminSetLicense from './admin-set-license.js';
import orgTeam from './org-team.js';
import adminSettings from './admin-settings.js';
import websiteAnfrage from './website-anfrage.js';

export const functionsRouter = Router();

const mount = (name, handler) => functionsRouter.post(`/${name}`, handler);

mount('fetch-external-json', fetchExternalJson);
mount('set-integration-secret', setIntegrationSecret);
mount('sync-intune', syncIntune);
mount('sync-servicenow', syncServicenow);
mount('send-org-invitation', sendOrgInvitation);
mount('accept-org-invitation', acceptOrgInvitation);
mount('signup-from-invite', signupFromInvite);
mount('admin-delete-user', adminDeleteUser);
mount('admin-list-users', adminListUsers);
mount('admin-create-user', adminCreateUser);
mount('admin-set-role', adminSetRole);
mount('admin-set-ban', adminSetBan);
mount('admin-reset-mfa', adminResetMfa);
mount('admin-set-license', adminSetLicense);
mount('org-team', orgTeam);
mount('admin-settings', adminSettings);
// Öffentlich: Demo-Anfrage aus der Marketing-Website (eigene Bremse in der Funktion)
mount('website-anfrage', websiteAnfrage);
