import type { SupabaseClient } from "@supabase/supabase-js";
import { asLimitError } from "@/lib/limits";
import { SAMPLE_DEBTS, SAMPLE_EXPENSES, SAMPLE_INCOME } from "@/lib/sample-data";
import type { BudgetItem, Debt, DebtInput, Profile, Strategy, Workspace } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

function currentMonth(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${month}-01`;
}

function mapDebt(row: {
  id: string;
  name: string;
  category: string;
  balance: number | string;
  original_balance: number | string;
  interest_rate: number | string;
  min_payment: number | string;
  due_day: number;
  color: string;
}): Debt {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    balance: Number(row.balance),
    originalBalance: Number(row.original_balance),
    interestRate: Number(row.interest_rate),
    minimumPayment: Number(row.min_payment),
    dueDay: row.due_day,
    color: row.color,
  };
}

function mapProfile(row: {
  id: string;
  language_code: string;
  currency_code: string;
  preferred_strategy: Strategy;
}): Profile {
  return {
    id: row.id,
    languageCode: row.language_code,
    currencyCode: row.currency_code,
    preferredStrategy: row.preferred_strategy,
  };
}

async function syncDebtPaymentLine(
  supabase: SupabaseClient,
  expenseId: string,
  debts: Debt[],
) {
  const { data: type } = await supabase
    .from("expense_type")
    .select("id")
    .eq("is_debt", true)
    .maybeSingle();
  if (!type) return;
  const amount = debts.reduce((sum, debt) => sum + debt.minimumPayment, 0);
  await supabase
    .from("expense_spending")
    .update({ amount })
    .eq("expense_id", expenseId)
    .eq("expense_type_id", type.id);
}

export async function getWorkspace(supabase: SupabaseClient = createClient()): Promise<Workspace> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Not signed in.");

  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select("id, language_code, currency_code, preferred_strategy")
    .eq("id", auth.user.id)
    .single();
  if (profileError || !profileRow) {
    throw new Error("Profile missing. Apply backend/supabase/migrations/0001_init.sql.");
  }

  const { data: debtRows, error: debtError } = await supabase
    .from("debt_entity")
    .select("id, name, category, balance, original_balance, interest_rate, min_payment, due_day, color")
    .order("created_at");
  if (debtError) throw new Error(debtError.message);
  const debts = (debtRows ?? []).map(mapDebt);

  const month = currentMonth();
  let { data: expense } = await supabase
    .from("expense")
    .select("id, income, month")
    .eq("month", month)
    .maybeSingle();

  if (!expense) {
    const { data: created, error } = await supabase
      .from("expense")
      .insert({ user_id: auth.user.id, month, income: 0 })
      .select("id, income, month")
      .single();
    if (error || !created) throw new Error(error?.message ?? "Could not create this month's budget.");
    expense = created;

    const { data: types } = await supabase.from("expense_type").select("id");
    if (types?.length) {
      await supabase.from("expense_spending").insert(
        types.map((type) => ({ expense_id: expense!.id, expense_type_id: type.id, amount: 0 })),
      );
    }
  }

  const { data: spending, error: spendError } = await supabase
    .from("expense_spending")
    .select("id, amount, expense_type_id, expense_type (id, key, icon, is_debt, sort_order)")
    .eq("expense_id", expense.id);
  if (spendError) throw new Error(spendError.message);

  const items: BudgetItem[] = (spending ?? [])
    .map((row) => {
      const type = Array.isArray(row.expense_type) ? row.expense_type[0] : row.expense_type;
      if (!type) return null;
      return {
        id: row.id,
        typeId: type.id,
        key: type.key,
        icon: type.icon,
        isDebt: type.is_debt,
        amount: Number(row.amount),
      };
    })
    .filter((item): item is BudgetItem => item !== null)
    .sort((a, b) => a.key.localeCompare(b.key));

  const order = ["rent", "groceries", "transport", "phone", "entertainment", "healthcare", "debt_payments", "personal_care"];
  items.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));

  return {
    profile: mapProfile(profileRow),
    debts,
    income: Number(expense.income),
    expenseId: expense.id,
    month: expense.month,
    items,
    isAnonymous: Boolean(auth.user.is_anonymous),
  };
}

export async function updateStrategy(strategy: Strategy) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Not signed in.");
  const { error } = await supabase
    .from("profiles")
    .update({ preferred_strategy: strategy })
    .eq("id", auth.user.id);
  if (error) throw asLimitError(error);
}

export async function updateLanguage(languageCode: string) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Not signed in.");
  const { error } = await supabase
    .from("profiles")
    .update({ language_code: languageCode })
    .eq("id", auth.user.id);
  if (error) throw new Error(error.message);
}

export async function updateCurrency(currencyCode: string) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Not signed in.");
  const { error } = await supabase
    .from("profiles")
    .update({ currency_code: currencyCode })
    .eq("id", auth.user.id);
  if (error) throw new Error(error.message);
}

export async function saveDebt(input: DebtInput, id?: string) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Not signed in.");
  const payload = {
    name: input.name,
    category: input.category,
    balance: input.balance,
    original_balance: Math.max(input.originalBalance, input.balance),
    interest_rate: input.interestRate,
    min_payment: input.minimumPayment,
    due_day: input.dueDay,
    color: input.color,
  };
  const query = id
    ? supabase.from("debt_entity").update(payload).eq("id", id)
    : supabase.from("debt_entity").insert({ ...payload, user_id: auth.user.id });
  const { error } = await query;
  if (error) throw asLimitError(error);
  await syncMinimums(supabase);
}

export async function deleteDebt(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("debt_entity").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await syncMinimums(supabase);
}

export async function logPayment(debtId: string, amount: number, paidOn: string) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Not signed in.");
  const { data: debt, error: debtError } = await supabase
    .from("debt_entity")
    .select("balance")
    .eq("id", debtId)
    .single();
  if (debtError || !debt) throw new Error(debtError?.message ?? "Debt not found.");
  const balance = Number(debt.balance);
  if (amount <= 0 || amount > balance) throw new Error("Payment must be greater than zero and not more than the balance.");

  const { error } = await supabase.from("payments").insert({
    user_id: auth.user.id,
    debt_id: debtId,
    amount,
    paid_on: paidOn,
  });
  if (error) throw asLimitError(error);

  const { error: updateError } = await supabase
    .from("debt_entity")
    .update({ balance: Math.max(0, balance - amount) })
    .eq("id", debtId);
  if (updateError) throw new Error(updateError.message);
}

export async function updateIncome(expenseId: string, income: number) {
  const supabase = createClient();
  const { error } = await supabase.from("expense").update({ income }).eq("id", expenseId);
  if (error) throw new Error(error.message);
}

export async function updateBudgetAmount(spendingId: string, amount: number) {
  const supabase = createClient();
  const { error } = await supabase.from("expense_spending").update({ amount }).eq("id", spendingId);
  if (error) throw new Error(error.message);
}

async function syncMinimums(supabase: SupabaseClient) {
  const workspace = await getWorkspace(supabase);
  await syncDebtPaymentLine(supabase, workspace.expenseId, workspace.debts);
}

export async function insertSampleData() {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Not signed in.");

  const { error: debtError } = await supabase.from("debt_entity").insert(
    SAMPLE_DEBTS.map((debt) => ({
      user_id: auth.user!.id,
      name: debt.name,
      category: debt.category,
      balance: debt.balance,
      original_balance: debt.originalBalance,
      interest_rate: debt.interestRate,
      min_payment: debt.minimumPayment,
      due_day: debt.dueDay,
      color: debt.color,
    })),
  );
  if (debtError) throw asLimitError(debtError);

  const workspace = await getWorkspace(supabase);
  await supabase.from("expense").update({ income: SAMPLE_INCOME }).eq("id", workspace.expenseId);

  for (const item of workspace.items) {
    if (item.isDebt) continue;
    const amount = SAMPLE_EXPENSES[item.key];
    if (amount === undefined) continue;
    await supabase.from("expense_spending").update({ amount }).eq("id", item.id);
  }

  const debts = (await getWorkspace(supabase)).debts;
  await syncDebtPaymentLine(supabase, workspace.expenseId, debts);
}

export async function signUp(
  email: string,
  password: string,
  languageCode: string,
  currencyCode: string,
  captchaToken?: string,
) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      ...(captchaToken ? { captchaToken } : {}),
      data: { language_code: languageCode, currency_code: currencyCode },
    },
  });
  if (error) throw asLimitError(error);
  return data;
}

export async function startDemo(languageCode: string, currencyCode: string, captchaToken?: string) {
  const supabase = createClient();
  const { data: existing } = await supabase.auth.getUser();

  if (existing.user && !existing.user.is_anonymous) {
    return "account" as const;
  }

  if (!existing.user) {
    const { error } = await supabase.auth.signInAnonymously({
      options: {
        ...(captchaToken ? { captchaToken } : {}),
        data: { language_code: languageCode, currency_code: currencyCode },
      },
    });
    if (error) throw asLimitError(error);
  }

  await seedDemoIfEmpty();
  return "demo" as const;
}

export async function seedDemoIfEmpty() {
  const supabase = createClient();
  const { count, error } = await supabase
    .from("debt_entity")
    .select("id", { count: "exact", head: true });
  if (error) throw asLimitError(error);
  if ((count ?? 0) > 0) return;
  await insertSampleData();
}

export async function claimDemoAccount(email: string, password: string) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user?.is_anonymous) throw new Error("Not a demo session.");
  const { data, error } = await supabase.auth.updateUser({ email, password });
  if (error) throw asLimitError(error);
  return data;
}

export async function signIn(email: string, password: string) {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
}

export async function signOut() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}
