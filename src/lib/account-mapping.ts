export const NORMALIZED_ACCOUNT_FIELDS = [
  { value: "revenue", label: "Revenue" },
  { value: "cogs", label: "COGS" },
  { value: "payroll", label: "Payroll" },
  { value: "rent", label: "Rent" },
  { value: "marketing", label: "Marketing" },
  { value: "insurance", label: "Insurance" },
  { value: "utilities", label: "Utilities" },
  { value: "other_operating_expenses", label: "Other operating expenses" },
  { value: "owner_salary", label: "Owner salary / distributions" },
  { value: "addbacks", label: "One-time add-backs" },
  { value: "interest", label: "Interest" },
  { value: "income_taxes", label: "Taxes" },
  { value: "depreciation", label: "Depreciation" },
  { value: "amortization", label: "Amortization" },
  { value: "net_income", label: "Net income" },
  { value: "assets", label: "Assets" },
  { value: "liabilities", label: "Liabilities" },
  { value: "debt", label: "Debt" },
  { value: "ignore", label: "Ignore" },
  { value: "unmapped", label: "Unmapped" },
] as const;

export type NormalizedAccountField = (typeof NORMALIZED_ACCOUNT_FIELDS)[number]["value"];
export type SourceSystem = "xero" | "quickbooks" | "csv" | "manual";

export type AccountMappingInput = {
  sourceSystem: SourceSystem;
  sourceAccountId?: string | null;
  sourceAccountName: string;
  sourceAccountType?: string | null;
  year?: number;
  amount?: number;
  normalizedField?: NormalizedAccountField;
};

export type SavedAccountMapping = {
  source_system: string;
  source_account_id: string | null;
  source_account_name: string;
  normalized_field: string;
};

export type MappedAccount = AccountMappingInput & {
  normalizedField: NormalizedAccountField;
  confidence: "saved" | "auto" | "unmapped";
};

export type FinancialRollup = {
  year: number;
  revenue?: number;
  cogs?: number;
  operating_expenses?: number;
  owner_salary?: number;
  addbacks?: number;
  depreciation?: number;
  amortization?: number;
  interest?: number;
  income_taxes?: number;
  net_income?: number;
  assets?: number;
  liabilities?: number;
  debt?: number;
};

const FIELD_ROLLUP: Record<NormalizedAccountField, keyof Omit<FinancialRollup, "year"> | null> = {
  revenue: "revenue",
  cogs: "cogs",
  payroll: "operating_expenses",
  rent: "operating_expenses",
  marketing: "operating_expenses",
  insurance: "operating_expenses",
  utilities: "operating_expenses",
  other_operating_expenses: "operating_expenses",
  owner_salary: "owner_salary",
  addbacks: "addbacks",
  interest: "interest",
  income_taxes: "income_taxes",
  depreciation: "depreciation",
  amortization: "amortization",
  net_income: "net_income",
  assets: "assets",
  liabilities: "liabilities",
  debt: "debt",
  ignore: null,
  unmapped: null,
};

const EXPENSE_LIKE_FIELDS = new Set<NormalizedAccountField>([
  "cogs",
  "payroll",
  "rent",
  "marketing",
  "insurance",
  "utilities",
  "other_operating_expenses",
  "owner_salary",
  "addbacks",
  "interest",
  "income_taxes",
  "depreciation",
  "amortization",
]);

export function accountMappingKey(input: {
  sourceSystem: string;
  sourceAccountId?: string | null;
  sourceAccountName: string;
}) {
  const idOrName = input.sourceAccountId?.trim() || normalizeAccountName(input.sourceAccountName);
  return `${input.sourceSystem}:${idOrName}`;
}

export function normalizeAccountName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export function autoMapAccount(input: {
  sourceAccountName: string;
  sourceAccountType?: string | null;
}): NormalizedAccountField {
  const name = normalizeAccountName(input.sourceAccountName);
  const type = normalizeAccountName(input.sourceAccountType ?? "");
  const text = `${name} ${type}`;

  if (/\b(interest income|interest received)\b/.test(text)) return "revenue";
  if (/\b(revenue|sales|income|turnover|service fees?|product sales)\b/.test(text)) {
    return "revenue";
  }
  if (/\b(cogs|cost of goods|cost of sales|direct costs?|purchases?)\b/.test(text)) return "cogs";
  if (
    /\b(owner|officer|shareholder).*\b(salary|compensation|draw|distribution)\b/.test(text) ||
    /\b(salary|compensation|draw|distribution).*\b(owner|officer|shareholder)\b/.test(text)
  ) {
    return "owner_salary";
  }
  if (/\b(payroll|wages?|salar(y|ies)|contract labor|staff costs?)\b/.test(text)) {
    return "payroll";
  }
  if (/\b(rent|lease|occupancy)\b/.test(text)) return "rent";
  if (/\b(marketing|advertising|promotion|seo|lead gen)\b/.test(text)) return "marketing";
  if (/\binsurance\b/.test(text)) return "insurance";
  if (/\b(utilities|electric|gas|water|phone|internet|telecom)\b/.test(text)) return "utilities";
  if (/\b(add.?back|one.?time|non.?recurring|personal expense)\b/.test(text)) return "addbacks";
  if (/\b(interest|finance cost|bank charges?)\b/.test(text)) return "interest";
  if (/\b(income tax|tax expense|corporation tax|taxes)\b/.test(text)) return "income_taxes";
  if (/\bdepreciation\b/.test(text)) return "depreciation";
  if (/\bamorti[sz]ation\b/.test(text)) return "amortization";
  if (/\b(net income|net profit|profit for the year|profit for the period)\b/.test(text)) {
    return "net_income";
  }
  if (/\b(total assets?|assets?)\b/.test(text)) return "assets";
  if (/\b(total liabilities|accounts payable|liabilities)\b/.test(text)) return "liabilities";
  if (/\b(loan|borrowing|note payable|mortgage|line of credit|debt)\b/.test(text)) return "debt";
  if (/\b(expense|overhead|administrative|general|selling)\b/.test(text)) {
    return "other_operating_expenses";
  }

  return "unmapped";
}

export function applySavedMappings(
  accounts: AccountMappingInput[],
  savedMappings: SavedAccountMapping[],
): MappedAccount[] {
  const saved = new Map(
    savedMappings.map((m) => [
      accountMappingKey({
        sourceSystem: m.source_system,
        sourceAccountId: m.source_account_id,
        sourceAccountName: m.source_account_name,
      }),
      m.normalized_field as NormalizedAccountField,
    ]),
  );

  return accounts.map((account) => {
    const savedField = saved.get(accountMappingKey(account));
    if (savedField) {
      return { ...account, normalizedField: savedField, confidence: "saved" };
    }
    const normalizedField =
      account.normalizedField ?? autoMapAccount(account);
    return {
      ...account,
      normalizedField,
      confidence: normalizedField === "unmapped" ? "unmapped" : "auto",
    };
  });
}

export function rollupMappedAccounts(accounts: MappedAccount[]): FinancialRollup[] {
  const byYear = new Map<number, FinancialRollup>();

  for (const account of accounts) {
    if (!account.year || account.amount == null) continue;
    const rollupField = FIELD_ROLLUP[account.normalizedField];
    if (!rollupField) continue;

    const row = byYear.get(account.year) ?? { year: account.year };
    const amount = EXPENSE_LIKE_FIELDS.has(account.normalizedField)
      ? Math.abs(account.amount)
      : account.amount;
    row[rollupField] = Number(row[rollupField] ?? 0) + amount;
    byYear.set(account.year, row);
  }

  return Array.from(byYear.values()).sort((a, b) => a.year - b.year);
}

export function countUnmappedAccounts(accounts: MappedAccount[]) {
  return new Set(
    accounts
      .filter((account) => account.normalizedField === "unmapped")
      .map((account) => accountMappingKey(account)),
  ).size;
}
