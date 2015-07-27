CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';

CREATE TABLE dataset (
    id character varying(255) NOT NULL,
    site character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    description text NOT NULL,
    category character varying(255),
    icon character varying(255),
    "order" integer NOT NULL,
    reviewers character varying(255)[],
    translations jsonb,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);

CREATE TABLE entry (
    id uuid NOT NULL,
    site character varying(255) NOT NULL,
    year integer NOT NULL,
    place character varying(255) NOT NULL,
    dataset character varying(255) NOT NULL,
    answers jsonb NOT NULL,
    comments jsonb,
    characteristics jsonb,
    "submissionNotes" text,
    reviewed boolean DEFAULT false,
    "reviewResult" boolean DEFAULT false,
    "reviewComments" text,
    details text,
    "isCurrent" boolean NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "submitterId" uuid,
    "reviewerId" uuid
);

CREATE TABLE place (
    id character varying(255) NOT NULL,
    site character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255),
    region character varying(255),
    continent character varying(255),
    reviewers character varying(255)[],
    translations jsonb,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);

CREATE TABLE question (
    id character varying(255) NOT NULL,
    site character varying(255) NOT NULL,
    question character varying(255) NOT NULL,
    description text NOT NULL,
    type character varying(255) NOT NULL,
    placeholder character varying(255) NOT NULL,
    score integer NOT NULL,
    "order" integer NOT NULL,
    icon character varying(255) NOT NULL,
    dependants text[],
    translations jsonb,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);

CREATE TABLE registry (
    id character varying(255) NOT NULL,
    settings jsonb NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);

CREATE TABLE site (
    id character varying(255) NOT NULL,
    settings jsonb NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);

CREATE TABLE "user" (
    id uuid NOT NULL,
    emails character varying(255)[] NOT NULL,
    providers jsonb NOT NULL,
    "firstName" character varying(255),
    "lastName" character varying(255),
    "homePage" character varying(255),
    photo character varying(255),
    anonymous boolean DEFAULT false NOT NULL,
    "authenticationHash" character varying(255),
    "authenticationSalt" character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);

ALTER TABLE ONLY dataset
    ADD CONSTRAINT dataset_pkey PRIMARY KEY (id, site);

ALTER TABLE ONLY entry
    ADD CONSTRAINT entry_pkey PRIMARY KEY (id);

ALTER TABLE ONLY place
    ADD CONSTRAINT place_pkey PRIMARY KEY (id, site);

ALTER TABLE ONLY question
    ADD CONSTRAINT question_pkey PRIMARY KEY (id, site);

ALTER TABLE ONLY registry
    ADD CONSTRAINT registry_pkey PRIMARY KEY (id);

ALTER TABLE ONLY site
    ADD CONSTRAINT site_pkey PRIMARY KEY (id);

ALTER TABLE ONLY "user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);

ALTER TABLE ONLY entry
    ADD CONSTRAINT "entry_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "user"(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY entry
    ADD CONSTRAINT "entry_submitterId_fkey" FOREIGN KEY ("submitterId") REFERENCES "user"(id) ON UPDATE CASCADE ON DELETE SET NULL;
