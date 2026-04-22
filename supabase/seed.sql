insert into public.users (email, password, name, role) values
('admin@wams.local', '$2a$10$u9WgQxXQhD6Jm2S1N0sLQ.p6xoY7p.1QnvYjg3zvK3xWdYHnCYlQG', 'System Admin', 'administrator')
on conflict (email) do nothing;

insert into public.dealers (name, company_name, email, phone, credit_limit) values
('Amit Shah', 'Metro Dealers', 'dealer1@wams.local', '9000000001', 50000),
('Priya Nair', 'Prime Distributors', 'dealer2@wams.local', '9000000002', 70000)
on conflict (email) do nothing;

insert into public.suppliers (name, contact_person, email, phone, category, rating) values
('Steel Works Pvt Ltd', 'Rakesh', 'supplier1@wams.local', '9100000001', 'metal', 4.5),
('Chem Parts Corp', 'Anita', 'supplier2@wams.local', '9100000002', 'chemical', 4.2)
on conflict (email) do nothing;
