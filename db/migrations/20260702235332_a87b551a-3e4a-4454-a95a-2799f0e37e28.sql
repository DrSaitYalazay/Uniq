ALTER TABLE control_iso ALTER CONSTRAINT control_iso_framework_control_id_fkey DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE control_risk ALTER CONSTRAINT control_risk_framework_control_id_fkey DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE risk_control ALTER CONSTRAINT risk_control_framework_control_id_fkey DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE answers ALTER CONSTRAINT answers_framework_control_id_fkey DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE risks ALTER CONSTRAINT risks_primary_control_framework_primary_control_id_fkey DEFERRABLE INITIALLY DEFERRED;

BEGIN;
UPDATE controls        SET framework='BSI' WHERE framework='BSI_AI';
UPDATE control_iso     SET framework='BSI' WHERE framework='BSI_AI';
UPDATE control_risk    SET framework='BSI' WHERE framework='BSI_AI';
UPDATE risk_control    SET framework='BSI' WHERE framework='BSI_AI';
UPDATE answers         SET framework='BSI' WHERE framework='BSI_AI';
UPDATE risks           SET primary_control_framework='BSI' WHERE primary_control_framework='BSI_AI';
DELETE FROM frameworks WHERE code='BSI_AI';
COMMIT;