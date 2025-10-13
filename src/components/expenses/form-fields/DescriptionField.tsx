
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface DescriptionFieldProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export function DescriptionField({ value, onChange, label = "Description" }: DescriptionFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="description">{label}</Label>
      <Input
        id="description"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="What did you spend on?"
        required
        autoComplete="on"
        autoCorrect="on"
        autoCapitalize="words"
        spellCheck={true}
        className="focus:ring-2 focus:ring-primary"
        onFocus={(e) => {
          // Ensure input is visible on mobile when keyboard appears
          setTimeout(() => {
            e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100);
        }}
      />
    </div>
  );
}
