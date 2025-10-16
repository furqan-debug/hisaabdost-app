import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAddLoan, LoanType } from '@/hooks/useLoans';
import { useCurrency } from '@/hooks/use-currency';
import { getCurrencyByCode } from '@/utils/currencyUtils';
import { useScheduledNotifications } from '@/hooks/useScheduledNotifications';

interface AddLoanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddLoanDialog({ open, onOpenChange }: AddLoanDialogProps) {
  const { currencyCode } = useCurrency();
  const currencySymbol = getCurrencyByCode(currencyCode).symbol;
  const [personName, setPersonName] = useState('');
  const [amount, setAmount] = useState('');
  const [loanType, setLoanType] = useState<LoanType>('i_gave');
  const [dueDate, setDueDate] = useState<Date>();
  const [note, setNote] = useState('');
  const [enableInstallments, setEnableInstallments] = useState(false);
  const [installmentCount, setInstallmentCount] = useState('3');
  const [installmentFrequency, setInstallmentFrequency] = useState<'weekly' | 'bi-weekly' | 'monthly'>('monthly');

  const addLoan = useAddLoan();
  const { scheduleLoanReminders } = useScheduledNotifications();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!personName.trim() || !amount || Number(amount) <= 0) {
      return;
    }

    const installments = enableInstallments && Number(installmentCount) > 1
      ? {
          count: Number(installmentCount),
          frequency: installmentFrequency,
        }
      : undefined;

    addLoan.mutate(
      {
        person_name: personName.trim(),
        amount: Number(amount),
        loan_type: loanType,
        due_date: dueDate?.toISOString().split('T')[0],
        note: note.trim() || undefined,
        installments,
      },
      {
        onSuccess: (data) => {
          // Schedule loan reminder notifications if due date is set
          if (dueDate && data) {
            scheduleLoanReminders({
              id: data.id,
              person_name: personName,
              amount: Number(amount),
              due_date: dueDate.toISOString().split('T')[0],
              loan_type: loanType,
            });
          }
          
          setPersonName('');
          setAmount('');
          setLoanType('i_gave');
          setDueDate(undefined);
          setNote('');
          setEnableInstallments(false);
          setInstallmentCount('3');
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Loan / Udhaar</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="person-name">Person Name *</Label>
            <Input
              id="person-name"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              placeholder="Enter person's name"
              maxLength={100}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount *</Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-muted-foreground">
                {currencySymbol}
              </span>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-8"
                placeholder="0.00"
                step="0.01"
                min="0.01"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Type *</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={loanType === 'i_gave' ? 'default' : 'outline'}
                className={cn(
                  'w-full justify-start gap-2',
                  loanType === 'i_gave' && 'bg-green-600 hover:bg-green-700'
                )}
                onClick={() => setLoanType('i_gave')}
              >
                <TrendingUp className="h-4 w-4" />
                I Gave Money
              </Button>
              <Button
                type="button"
                variant={loanType === 'i_took' ? 'default' : 'outline'}
                className={cn(
                  'w-full justify-start gap-2',
                  loanType === 'i_took' && 'bg-red-600 hover:bg-red-700'
                )}
                onClick={() => setLoanType('i_took')}
              >
                <TrendingDown className="h-4 w-4" />
                I Took Money
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Due Date (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !dueDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Note (Optional)</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add any additional details..."
              maxLength={500}
              rows={3}
            />
          </div>

          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="installments"
                checked={enableInstallments}
                onCheckedChange={(checked) => setEnableInstallments(checked as boolean)}
              />
              <Label htmlFor="installments" className="cursor-pointer">
                Split into installments
              </Label>
            </div>

            {enableInstallments && (
              <div className="grid grid-cols-2 gap-3 pl-6">
                <div className="space-y-2">
                  <Label htmlFor="count">Number</Label>
                  <Input
                    id="count"
                    type="number"
                    value={installmentCount}
                    onChange={(e) => setInstallmentCount(e.target.value)}
                    min="2"
                    max="24"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select value={installmentFrequency} onValueChange={(v: any) => setInstallmentFrequency(v)}>
                    <SelectTrigger id="frequency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={addLoan.isPending} className="flex-1">
              {addLoan.isPending ? 'Adding...' : 'Add Loan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
