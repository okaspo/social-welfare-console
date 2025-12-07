-- Create officers table
create table officers (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  role text not null check (role in ('director', 'auditor', 'councilor')),
  position text,
  appointed_at date not null,
  term_expires_at date not null,
  active boolean default true
);

-- Turn on Row Level Security
alter table officers enable row level security;

-- Create policies (Allow full access for now for simplicity, or restricted)
-- For this MVP, we allow anonymous read/write if the key is anon (NOT RECOMMENDED for production but fine for MVP demo)
create policy "Enable all access for all users"
on officers
for all
using (true)
with check (true);

-- Insert Mock Data
insert into officers (name, role, position, appointed_at, term_expires_at) values
('山田 太郎', 'director', '理事長', '2023-06-25', '2025-06-24'),
('鈴木 花子', 'director', '業務執行理事', '2023-06-25', '2025-06-24'),
('佐藤 次郎', 'director', '理事', '2023-06-25', '2025-06-24'),
('田中 三郎', 'director', '理事', '2023-06-25', '2025-06-24'),
('高橋 史郎', 'director', '理事', '2023-06-25', '2025-06-24'),
('伊藤 監査', 'auditor', '監事', '2023-06-25', '2027-06-24'),
('渡辺 評議', 'councilor', '評議員', '2021-06-25', '2025-06-24');
