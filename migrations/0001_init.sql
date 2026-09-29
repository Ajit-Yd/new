CREATE TABLE IF NOT EXISTS owners (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  slug TEXT NOT NULL,
  json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS owners_email ON owners (email);
CREATE INDEX IF NOT EXISTS owners_slug ON owners (slug);
