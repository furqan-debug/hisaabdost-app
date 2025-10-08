
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export class MonthlyIncomeService {
  /**
   * Get monthly income for a specific month
   */
  static async getMonthlyIncome(
    userId: string, 
    monthDate: Date, 
    familyId?: string | null, 
    isPersonalMode?: boolean
  ): Promise<number> {
    const monthKey = format(monthDate, 'yyyy-MM');
    
    try {
      console.log("Fetching monthly income for:", userId, monthKey, "Mode:", isPersonalMode ? 'personal' : `family: ${familyId}`);
      
      // Execute query based on family context - separate queries to avoid TS type issues
      let monthlyIncomeData: any = null;
      let monthlyError: any = null;
      
      if (isPersonalMode) {
        // Personal mode: user's data only, no family
        const result = await supabase
          .from('monthly_incomes')
          .select('income_amount')
          .eq('user_id', userId)
          .is('family_id', null)
          .eq('month_year', monthKey)
          .maybeSingle();
        monthlyIncomeData = result.data;
        monthlyError = result.error;
      } else if (familyId) {
        // Family mode: family's data only
        const familyIdValue = String(familyId);
        // @ts-ignore - TypeScript has issues with deep type inference on family_id filtering
        const result = await supabase
          .from('monthly_incomes')
          .select('income_amount')
          .eq('family_id', familyIdValue)
          .eq('month_year', monthKey)
          .maybeSingle();
        monthlyIncomeData = result.data;
        monthlyError = result.error;
      } else {
        // Fallback: user's data
        const result = await supabase
          .from('monthly_incomes')
          .select('income_amount')
          .eq('user_id', userId)
          .eq('month_year', monthKey)
          .maybeSingle();
        monthlyIncomeData = result.data;
        monthlyError = result.error;
      }
        
      if (!monthlyError && monthlyIncomeData?.income_amount) {
        console.log("Found monthly income:", monthlyIncomeData.income_amount);
        return Number(monthlyIncomeData.income_amount);
      }
      
      // Fallback to profiles table ONLY for personal mode and current month
      if (isPersonalMode) {
        const currentMonth = format(new Date(), 'yyyy-MM');
        if (monthKey === currentMonth) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('monthly_income')
            .eq('id', userId)
            .maybeSingle();
            
          if (!profileError && profileData?.monthly_income) {
            // Copy to monthly_incomes table for future use
            await this.setMonthlyIncome(userId, monthDate, Number(profileData.monthly_income), null, true);
            return Number(profileData.monthly_income);
          }
        }
      }
      
      return 0;
    } catch (error) {
      console.error('Error fetching monthly income:', error);
      return 0;
    }
  }

  /**
   * Set monthly income for a specific month
   */
  static async setMonthlyIncome(
    userId: string, 
    monthDate: Date, 
    amount: number, 
    familyId?: string | null,
    isPersonalMode?: boolean
  ): Promise<boolean> {
    const monthKey = format(monthDate, 'yyyy-MM');
    
    try {
      console.log("Setting monthly income:", userId, monthKey, amount, "Family:", familyId, "Personal mode:", isPersonalMode);
      
      // Build upsert data based on context
      const upsertData: any = {
        user_id: userId,
        month_year: monthKey,
        income_amount: amount,
        updated_at: new Date().toISOString()
      };
      
      // Add family_id only when in family mode
      if (!isPersonalMode && familyId) {
        upsertData.family_id = familyId;
      }
      
      // Perform manual upsert to avoid ON CONFLICT with partial unique indexes
      // 1) Try UPDATE first
      let updateQuery = supabase
        .from('monthly_incomes')
        .update({
          income_amount: amount,
          updated_at: new Date().toISOString(),
        })
        .eq('month_year', monthKey);

      if (isPersonalMode) {
        updateQuery = updateQuery.eq('user_id', userId).is('family_id', null);
      } else if (familyId) {
        updateQuery = updateQuery.eq('family_id', String(familyId));
      } else {
        // Fallback to user context if personal mode not specified
        updateQuery = updateQuery.eq('user_id', userId);
      }

      const { data: updatedRows, error: updateError } = await updateQuery.select('id');
      if (updateError) {
        console.error('Error updating monthly income (update step):', updateError);
        return false;
      }

      let operationSucceeded = Array.isArray(updatedRows) && updatedRows.length > 0;

      // 2) If no rows updated, INSERT
      if (!operationSucceeded) {
        const { error: insertError } = await supabase
          .from('monthly_incomes')
          .insert(upsertData);

        if (insertError) {
          console.error('Error inserting monthly income (insert step):', insertError);
          return false;
        }
      }

      // Only update profiles table if in personal mode and current month
      const currentMonth = format(new Date(), 'yyyy-MM');
      if (isPersonalMode && monthKey === currentMonth) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ monthly_income: amount })
          .eq('id', userId);
          
        if (profileError) {
          console.warn('Could not update profiles table:', profileError);
        }
      }

      // Trigger UI refresh
      window.dispatchEvent(new CustomEvent('income-updated', { 
        detail: { userId, monthKey, amount, familyId, isPersonalMode } 
      }));

      return true;
    } catch (error) {
      console.error('Error setting monthly income:', error);
      return false;
    }
  }

  /**
   * Get all monthly incomes for a user
   */
  static async getAllMonthlyIncomes(userId: string): Promise<Record<string, number>> {
    try {
      const { data, error } = await supabase
        .from('monthly_incomes')
        .select('month_year, income_amount')
        .eq('user_id', userId)
        .order('month_year', { ascending: false });

      if (error) {
        console.error('Error fetching all monthly incomes:', error);
        return {};
      }

      const incomes: Record<string, number> = {};
      data?.forEach(item => {
        incomes[item.month_year] = Number(item.income_amount);
      });

      return incomes;
    } catch (error) {
      console.error('Error fetching all monthly incomes:', error);
      return {};
    }
  }
}
