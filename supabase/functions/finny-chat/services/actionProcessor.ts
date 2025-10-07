
// Import Supabase client type
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

// Import action handlers
import { addExpense, updateExpense, deleteExpense } from "../actions/expenseActions.ts";
import { setBudget, deleteBudget } from "../actions/budgetActions.ts";
import { setGoal, updateGoal, deleteGoal } from "../actions/goalActions.ts";
import { addWalletFunds } from "../actions/walletActions.ts";
import { setIncome } from "../actions/incomeActions.ts";

// Process user actions
export async function processAction(
  actionData: any,
  userId: string,
  supabase: SupabaseClient
): Promise<string> {
  try {
    console.log('Processing action:', actionData);

    switch (actionData.type) {
      case 'add_expense':
        return await addExpense(actionData, userId, supabase);
      
      case 'update_expense':
        return await updateExpense(actionData, userId, supabase);
      
      case 'delete_expense':
        return await deleteExpense(actionData, userId, supabase);
      
      case 'set_budget':
        return await setBudget(actionData, userId, supabase);
      
      case 'update_budget':
        return await updateBudget(actionData, userId, supabase);
      
      case 'delete_budget':
        return await deleteBudget(actionData, userId, supabase);
      
      case 'set_goal':
        return await setGoal(actionData, userId, supabase);
      
      case 'update_goal':
        return await updateGoal(actionData, userId, supabase);
      
      case 'delete_goal':
        return await deleteGoal(actionData, userId, supabase);
      
      case 'add_wallet_funds':
        return await addWalletFunds(actionData, userId, supabase);
      
      case 'set_income':
        return await setIncome(actionData, userId, supabase, actionData.family_id, actionData.is_personal_mode);
      
      case 'update_income':
        return await setIncome(actionData, userId, supabase, actionData.family_id, actionData.is_personal_mode); // Use same function as set_income
      
      default:
        return `I'm not sure how to handle that action type: ${actionData.type}`;
    }
  } catch (error) {
    console.error('Error processing action:', error);
    return `Something went wrong while processing that action: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

async function updateBudget(actionData: any, userId: string, supabase: SupabaseClient): Promise<string> {
  const { category, amount, period } = actionData;
  
  const updateData: any = {};
  if (amount !== undefined) updateData.amount = parseFloat(amount);
  if (period !== undefined) updateData.period = period;
  
  const { data, error } = await supabase
    .from('budgets')
    .update(updateData)
    .eq('user_id', userId)
    .eq('category', category)
    .select()
    .single();

  if (error) {
    console.error('Error updating budget:', error);
    return `I couldn't update that budget: ${error.message}`;
  }

  // Log budget update activity
  try {
    await supabase
      .from('activity_logs')
      .insert({
        user_id: userId,
        action_type: 'budget',
        action_description: `Updated ${category} budget${period ? ` for ${period}` : ''}`,
        amount: amount || data.amount,
        category: category,
        metadata: { budget_id: data.id }
      });
  } catch (logError) {
    console.error('Failed to log budget update activity:', logError);
  }

  // Trigger UI refresh
  await triggerDataRefresh('budget-updated', { category, amount, userId });

  return `✅ Updated your ${category} budget`;
}

// Helper function to trigger UI refresh
async function triggerDataRefresh(eventType: string, data: any) {
  // This will be used by the client to refresh data
  console.log(`Triggering ${eventType} refresh:`, data);
}
