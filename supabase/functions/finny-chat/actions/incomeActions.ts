
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

export async function setIncome(
  action: any,
  userId: string,
  supabase: SupabaseClient,
  familyId?: string | null,
  isPersonalMode?: boolean
): Promise<string> {
  console.log(`Setting monthly income to: ${action.amount}, familyId: ${familyId}, isPersonalMode: ${isPersonalMode}`);
  
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
  
  try {
    const upsertData: any = {
      user_id: userId,
      month_year: currentMonth,
      income_amount: parseFloat(action.amount),
      updated_at: new Date().toISOString()
    };

    // Add family_id based on context
    if (!isPersonalMode && familyId) {
      upsertData.family_id = familyId;
    }

    // Manual upsert to work with partial unique indexes
    // 1) Try UPDATE first
    let updateQuery = supabase
      .from('monthly_incomes')
      .update({
        income_amount: parseFloat(action.amount),
        updated_at: new Date().toISOString(),
      })
      .eq('month_year', currentMonth);

    if (isPersonalMode) {
      updateQuery = updateQuery.eq('user_id', userId).is('family_id', null);
    } else if (familyId) {
      updateQuery = updateQuery.eq('family_id', String(familyId));
    } else {
      updateQuery = updateQuery.eq('user_id', userId);
    }

    const { data: updatedRows, error: updateError } = await updateQuery.select('id');
    if (updateError) {
      console.error('Monthly income update error (update step):', updateError);
      throw updateError;
    }

    const didUpdate = Array.isArray(updatedRows) && updatedRows.length > 0;

    // 2) If no rows updated, INSERT
    if (!didUpdate) {
      const { error: insertError } = await supabase
        .from('monthly_incomes')
        .insert(upsertData);

      if (insertError) {
        console.error('Monthly income update error (insert step):', insertError);
        throw insertError;
      }
    }

    // Only update profiles table if in personal mode and current month
    if (isPersonalMode) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          monthly_income: parseFloat(action.amount)
        })
        .eq('id', userId);

      if (profileError) {
        console.warn("Profile income update warning:", profileError);
      }
    }

    const context = isPersonalMode ? 'your personal' : `your family's`;
    console.log(`Income updated successfully for month: ${currentMonth}, context: ${context}`);
    return `I've set ${context} monthly income to ${action.amount} for ${currentMonth}.`;
  } catch (error) {
    console.error("Error setting income:", error);
    return `I couldn't set your income: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}
