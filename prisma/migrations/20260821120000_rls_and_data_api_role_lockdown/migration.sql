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

REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public
FROM anon, authenticated;

REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public
FROM anon, authenticated;

REVOKE ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public
FROM anon, authenticated;

-- Evitar que objetos creados por migraciones futuras recuperen los grants
-- automáticos que Supabase define para los roles de la Data API.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
REVOKE ALL PRIVILEGES ON TABLES FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
REVOKE ALL PRIVILEGES ON SEQUENCES FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
REVOKE ALL PRIVILEGES ON ROUTINES FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE prisma IN SCHEMA public
REVOKE ALL PRIVILEGES ON TABLES FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE prisma IN SCHEMA public
REVOKE ALL PRIVILEGES ON SEQUENCES FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE prisma IN SCHEMA public
REVOKE ALL PRIVILEGES ON ROUTINES FROM anon, authenticated;
