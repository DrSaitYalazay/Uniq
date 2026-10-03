BEGIN;
UPDATE controls        SET framework='ISO27001' WHERE framework='ISO27001_AI';
UPDATE control_iso     SET framework='ISO27001' WHERE framework='ISO27001_AI';
UPDATE control_risk    SET framework='ISO27001' WHERE framework='ISO27001_AI';
UPDATE risk_control    SET framework='ISO27001' WHERE framework='ISO27001_AI';
UPDATE answers         SET framework='ISO27001' WHERE framework='ISO27001_AI';
UPDATE risks           SET primary_control_framework='ISO27001' WHERE primary_control_framework='ISO27001_AI';
DELETE FROM frameworks WHERE code='ISO27001_AI';
COMMIT;