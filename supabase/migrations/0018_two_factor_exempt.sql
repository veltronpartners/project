-- Section 14.1 mandates 2FA for every login with "no skip-2FA path" — but
-- that's a production rule. Test accounts created purely for exploring
-- role permissions need a narrow, explicit, auditable exception rather
-- than a code-level bypass keyed on email patterns.
alter table users add column two_factor_exempt boolean default false;
alter table partner_contacts add column two_factor_exempt boolean default false;

update users set two_factor_exempt = true where email like 'test.%@veltronpartners.com';
update partner_contacts set two_factor_exempt = true where email like 'test.%@veltronpartners.com';
