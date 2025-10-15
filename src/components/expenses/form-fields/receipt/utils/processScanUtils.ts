
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logReceiptScanned } from '@/utils/appsflyerTracking';

export interface ScanResult {
  success: boolean;
  items?: Array<{
    description: string;
    amount: string;
    date?: string;
    category?: string;
    paymentMethod?: string;
  }>;
  merchant?: string;
  date?: string;  
  total?: string;
  tax?: string;
  subtotal?: string;
  tip?: string;
  error?: string;
  warning?: string;
  isTimeout?: boolean;
}

/**
 * Validates if a date string is a valid date
 */
function isValidDate(dateString?: string): boolean {
  if (!dateString || 
      dateString.toLowerCase().includes('unclear') || 
      dateString.toLowerCase().includes('unknown') ||
      dateString.toLowerCase().includes('invalid')) {
    return false;
  }
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Process scan results and save expenses to database
 */
export async function processScanResults(
  scanResults: ScanResult,
  autoSave: boolean = true,
  onCapture?: (expenseDetails: any) => void,
  setOpen?: (open: boolean) => void
): Promise<boolean> {
  console.log(`💾 ProcessScanResults: Starting with ${scanResults.items?.length || 0} items`);
  
  if (!scanResults.success || !scanResults.items || scanResults.items.length === 0) {
    console.error('❌ ProcessScanResults: Invalid scan results');
    toast.error('No valid items found in receipt');
    return false;
  }

  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ ProcessScanResults: User not authenticated');
      toast.error('You must be logged in to save expenses');
      return false;
    }

    console.log(`👤 ProcessScanResults: Processing for user ${user.id}`);

    // Prepare expenses for database insertion with better error handling
    const expensesToInsert = scanResults.items.map(item => {
      // Validate amount
      let amount = 0;
      try {
        amount = parseFloat(item.amount);
        if (isNaN(amount) || amount <= 0) {
          console.warn(`Invalid amount for item: ${item.description}, setting to 0`);
          amount = 0;
        }
      } catch (error) {
        console.warn(`Error parsing amount for item: ${item.description}`, error);
        amount = 0;
      }

      const expense = {
        user_id: user.id,
        amount: amount,
        description: item.description.trim() || 'Store Purchase',
        date: isValidDate(item.date) ? item.date : 
              (isValidDate(scanResults.date) ? scanResults.date : 
               new Date().toISOString().split('T')[0]),
        category: item.category || 'Other',
        payment: item.paymentMethod || 'Card',
        notes: scanResults.merchant ? `From ${scanResults.merchant}` : null,
        is_recurring: false,
        receipt_url: null
      };

      console.log(`📝 ProcessScanResults: Prepared expense:`, {
        description: expense.description,
        amount: expense.amount,
        category: expense.category,
        date: expense.date
      });

      return expense;
    }).filter(expense => expense.amount > 0); // Only include expenses with valid amounts

    // Add tax as separate item if present
    if (scanResults.tax) {
      const taxAmount = parseFloat(scanResults.tax);
      if (!isNaN(taxAmount) && taxAmount > 0) {
        expensesToInsert.push({
          user_id: user.id,
          amount: taxAmount,
          description: 'Sales Tax',
          date: isValidDate(scanResults.date) ? scanResults.date : 
                new Date().toISOString().split('T')[0],
          category: 'Other',
          payment: scanResults.items?.[0]?.paymentMethod || 'Card',
          notes: scanResults.merchant ? `Tax from ${scanResults.merchant}` : 'Tax from receipt',
          is_recurring: false,
          receipt_url: null
        });
        console.log(`📝 ProcessScanResults: Added tax item: ${taxAmount}`);
      }
    }

    if (expensesToInsert.length === 0) {
      console.error('❌ ProcessScanResults: No valid expenses to insert');
      toast.error('No valid expenses could be created from the receipt');
      return false;
    }

    console.log(`💰 ProcessScanResults: Inserting ${expensesToInsert.length} expenses...`);

    // Insert all expenses at once
    const { data: insertedExpenses, error } = await supabase
      .from('expenses')
      .insert(expensesToInsert)
      .select();

    if (error) {
      console.error('❌ ProcessScanResults: Database insertion error:', error);
      toast.error(`Failed to save expenses: ${error.message}`);
      return false;
    }

    if (!insertedExpenses || insertedExpenses.length === 0) {
      console.error('❌ ProcessScanResults: No expenses were inserted');
      toast.error('Failed to save expenses to database');
      return false;
    }

    console.log(`✅ ProcessScanResults: Successfully inserted ${insertedExpenses.length} expenses`);

    // Show success message
    const totalAmount = expensesToInsert.reduce((sum, expense) => sum + expense.amount, 0);
    
    // Track receipt scan in AppsFlyer
    logReceiptScanned(scanResults.merchant || 'Unknown', totalAmount);
    
    toast.success(`Added ${insertedExpenses.length} expenses totaling ${totalAmount.toFixed(2)}`, {
      description: scanResults.warning || `From ${scanResults.merchant || 'receipt'}`
    });

    // Call onCapture for the first item if provided (for backward compatibility)
    if (onCapture && scanResults.items.length > 0) {
      const firstItem = scanResults.items[0];
      onCapture({
        description: firstItem.description,
        amount: firstItem.amount,
        date: firstItem.date || scanResults.date || new Date().toISOString().split('T')[0],
        category: firstItem.category || 'Other',
        paymentMethod: firstItem.paymentMethod || 'Card'
      });
    }

    // Dispatch multiple events to ensure UI updates everywhere
    console.log('📡 ProcessScanResults: Dispatching UI refresh events...');
    
    const eventDetail = {
      timestamp: Date.now(),
      source: 'receipt-scan',
      expenseCount: insertedExpenses.length,
      totalAmount: totalAmount
    };

    // Dispatch events with different names to catch all listeners
    const events = [
      'expenses-updated',
      'expense-added',
      'expense-refresh',
      'receipt-scanned',
      'finny-expense-added'
    ];

    events.forEach(eventName => {
      window.dispatchEvent(new CustomEvent(eventName, { detail: eventDetail }));
    });

    // Additional delayed events to ensure all components update
    setTimeout(() => {
      events.forEach(eventName => {
        window.dispatchEvent(new CustomEvent(eventName, { detail: eventDetail }));
      });
    }, 100);

    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('expenses-updated', { detail: eventDetail }));
    }, 500);

    console.log('📡 ProcessScanResults: All refresh events dispatched');

    return true;

  } catch (error) {
    console.error('💥 ProcessScanResults: Unexpected error:', error);
    toast.error(`Failed to process receipt: ${error.message || 'Unknown error'}`);
    return false;
  }
}
