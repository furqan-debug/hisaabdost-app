import { ExpenseFormData } from "@/hooks/useExpenseForm";
import { CategorySelect } from "../category/CategorySelect";
import { DateField } from "../form-fields/DateField";

interface CategorySectionProps {
  formData: ExpenseFormData;
  onFieldChange: <K extends keyof ExpenseFormData>(field: K, value: ExpenseFormData[K]) => void;
}

export function CategorySection({
  formData,
  onFieldChange
}: CategorySectionProps) {
  return (
    <div className="space-y-4">
      <DateField value={formData.date} onChange={value => onFieldChange('date', value)} />
      <CategorySelect value={formData.category} onChange={value => onFieldChange('category', value)} />
    </div>
  );
}