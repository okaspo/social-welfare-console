-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES (Public profile info for each user)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text not null,
  corporation_name text,
  corporation_type text default 'social_welfare', -- social_welfare, npo, medical
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS: Profiles
alter table public.profiles enable row level security;
create policy "Users can view their own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);

-- OFFICERS (Directors, Auditors, Councilors)
create table public.officers (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null, -- The admin user who owns this data
  name text not null,
  role text not null, -- director, auditor, councilor, selection_committee
  term_start date,
  term_end date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS: Officers
alter table public.officers enable row level security;
create policy "Users can view their own officers" on public.officers for select using (auth.uid() = user_id);
create policy "Users can insert their own officers" on public.officers for insert with check (auth.uid() = user_id);
create policy "Users can update their own officers" on public.officers for update using (auth.uid() = user_id);
create policy "Users can delete their own officers" on public.officers for delete using (auth.uid() = user_id);

-- MEETINGS (Board / Councilor Meetings)
create table public.meetings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  title text not null,
  date date not null,
  type text not null, -- board, councilor
  quorum_required integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS: Meetings
alter table public.meetings enable row level security;
create policy "Users can view their own meetings" on public.meetings for select using (auth.uid() = user_id);
create policy "Users can insert their own meetings" on public.meetings for insert with check (auth.uid() = user_id);
create policy "Users can update their own meetings" on public.meetings for update using (auth.uid() = user_id);

-- ATTENDANCE RECORDS
create table public.attendance_records (
  id uuid default uuid_generate_v4() primary key,
  meeting_id uuid references public.meetings(id) on delete cascade not null,
  officer_id uuid references public.officers(id) on delete cascade not null,
  status text not null, -- attended, absent, online
  is_signed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(meeting_id, officer_id)
);

-- RLS: Attendance
alter table public.attendance_records enable row level security;
create policy "Users can view attendance for their meetings" on public.attendance_records for select using (
  exists ( select 1 from public.meetings where id = attendance_records.meeting_id and user_id = auth.uid() )
);
create policy "Users can manage attendance for their meetings" on public.attendance_records for all using (
  exists ( select 1 from public.meetings where id = attendance_records.meeting_id and user_id = auth.uid() )
);

-- FUNCTION: Handle New User Signup (Trigger)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, corporation_name)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'corporation_name');
  return new;
end;
$$ language plpgsql security definer;

-- KEY TRIGGER: Automatically create profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
-- KNOWLEDGE LIBRARY (Common Knowledge / RAG Source)
create table public.knowledge_items (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  content text not null, -- The actual text chunk
  category text, -- e.g., 'law', 'internal_rule', 'faq'
  tags text[], -- Array of text tags
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS: Knowledge Items (Admins can manage, Users can read - generic policy for now)
alter table public.knowledge_items enable row level security;
-- For now, allow generic access logic (refine later based on admin role)
create policy "Allow read access to all authenticated users" on public.knowledge_items for select using (auth.role() = 'authenticated');
create policy "Allow all access to admin users" on public.knowledge_items for all using (auth.role() = 'authenticated'); -- Simplified for prototype

-- SYSTEM PROMPTS (Dynamic AI Instructions)
create table public.system_prompts (
  id uuid default uuid_generate_v4() primary key,
  name text not null default 'default', -- intended for versioning or variants
  content text not null,
  is_active boolean default false,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS: System Prompts
alter table public.system_prompts enable row level security;
create policy "Allow read access to authenticated users" on public.system_prompts for select using (auth.role() = 'authenticated');
create policy "Allow all access to admin users" on public.system_prompts for all using (auth.role() = 'authenticated');
