-- Tiger Data (Postgres) schema for T-Quest places
CREATE TABLE IF NOT EXISTS users (
  id            BIGSERIAL PRIMARY KEY,
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  username      TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS places (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  category   TEXT NOT NULL,            -- food | cafe | activity | nightlife
  tags       TEXT[] NOT NULL DEFAULT '{}',
  price      NUMERIC NOT NULL,         -- approx $ per person
  vibes      TEXT[] NOT NULL DEFAULT '{}',
  open       NUMERIC NOT NULL,         -- 24h decimal (11.5 = 11:30am)
  close      NUMERIC NOT NULL,         -- can exceed 24 (26 = 2am)
  age21      BOOLEAN NOT NULL DEFAULT false,
  group_max  INT NOT NULL DEFAULT 6,
  station    TEXT NOT NULL,            -- MBTA parent station id, e.g. place-kencl
  walk       INT NOT NULL,             -- minutes from station
  trending   BOOLEAN NOT NULL DEFAULT false,
  blurb      TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS places_station_idx ON places (station);
CREATE INDEX IF NOT EXISTS places_vibes_idx ON places USING GIN (vibes);
