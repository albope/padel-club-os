-- La aplicación accede a PostgreSQL mediante el rol dedicado `prisma`.
-- Los roles de la Data API no necesitan acceso a ninguna tabla de la aplicación.
DO $rls$
DECLARE
  target_table record;
BEGIN
  FOR target_table IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format(
      'ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',
      target_table.tablename
    );
  END LOOP;
END
$rls$;

-- Los roles de Supabase no existen en un PostgreSQL genérico (por ejemplo, el
-- servicio efímero de CI). Aplicar los revokes solo cuando el rol esté presente.
DO $privileges$
DECLARE
  data_api_role text;
  owner_role text;
BEGIN
  FOREACH data_api_role IN ARRAY ARRAY['anon', 'authenticated']
  LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = data_api_role) THEN
      EXECUTE format(
        'REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM %I',
        data_api_role
      );
      EXECUTE format(
        'REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM %I',
        data_api_role
      );
      EXECUTE format(
        'REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public FROM %I',
        data_api_role
      );

      -- Evitar que objetos creados por migraciones futuras recuperen los
      -- grants automáticos de Supabase para los roles de la Data API.
      FOREACH owner_role IN ARRAY ARRAY['postgres', 'prisma']
      LOOP
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = owner_role) THEN
          EXECUTE format(
            'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public REVOKE ALL PRIVILEGES ON TABLES FROM %I',
            owner_role,
            data_api_role
          );
          EXECUTE format(
            'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public REVOKE ALL PRIVILEGES ON SEQUENCES FROM %I',
            owner_role,
            data_api_role
          );
          EXECUTE format(
            'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public REVOKE ALL PRIVILEGES ON FUNCTIONS FROM %I',
            owner_role,
            data_api_role
          );
        END IF;
      END LOOP;
    END IF;
  END LOOP;
END
$privileges$;
