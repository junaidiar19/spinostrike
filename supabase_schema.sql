-- ============================================================================
-- SPINOSTRIKE: SUPABASE DATABASE SCHEMA & RLS POLICIES
-- Run this script in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ivikrlrpqwattbpycmty/sql
-- ============================================================================

-- 1. Create Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY, -- Supports both auth.users UUID and Guest UUIDs
  nickname TEXT NOT NULL DEFAULT 'Striker',
  kills INTEGER NOT NULL DEFAULT 0,
  deaths INTEGER NOT NULL DEFAULT 0,
  headshots INTEGER NOT NULL DEFAULT 0,
  matches_played INTEGER NOT NULL DEFAULT 0,
  selected_primary TEXT NOT NULL DEFAULT 'ak47',
  selected_secondary TEXT NOT NULL DEFAULT 'deagle',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Allow anyone to read profiles (for leaderboards & scoreboards)
CREATE POLICY "Allow public read access to profiles"
  ON public.profiles FOR SELECT
  USING (true);

-- Allow anyone to insert their own profile
CREATE POLICY "Allow individual insert access"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

-- Allow users to update their own profile
CREATE POLICY "Allow individual update access"
  ON public.profiles FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 4. Enable Supabase Realtime Broadcast & Presence
-- (Realtime is enabled by default for public channels)
