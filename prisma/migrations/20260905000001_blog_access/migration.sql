-- Blog access is mediated by the server; drafts are not a public Data API.
ALTER TABLE "BlogPost" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "BlogPost" FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN REVOKE ALL ON "BlogPost" FROM anon; END IF;
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN REVOKE ALL ON "BlogPost" FROM authenticated; END IF;
END $$;
