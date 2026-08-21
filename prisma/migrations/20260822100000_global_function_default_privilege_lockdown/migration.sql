-- PostgreSQL concede EXECUTE sobre funciones nuevas a PUBLIC mediante un
-- privilegio por defecto global. Un REVOKE limitado a un esquema no anula ese
-- default global, por lo que debe retirarse para cada rol creador.
DO $privileges$
DECLARE
  owner_role text;
BEGIN
  FOREACH owner_role IN ARRAY ARRAY['postgres', 'prisma']
  LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = owner_role) THEN
      EXECUTE format(
        'ALTER DEFAULT PRIVILEGES FOR ROLE %I REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC',
        owner_role
      );
    END IF;
  END LOOP;
END
$privileges$;
