-- REB-24: Track whether owner financials are cash-basis, accrual-basis, or unknown.
alter table public.businesses
  add column if not exists accounting_basis text not null default 'unknown'
  check (accounting_basis in ('cash', 'accrual', 'unknown'));

comment on column public.businesses.accounting_basis is
  'Owner-identified accounting basis for valuation data-quality review: cash, accrual, or unknown.';
