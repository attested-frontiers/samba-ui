import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface RecipientInputProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  error?: string;
  className?: string;
}

export function RecipientInput({ 
  value, 
  onChange, 
  label,
  placeholder = "Enter recipient",
  error,
  className = ""
}: RecipientInputProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={label.toLowerCase().replace(/\s+/g, '-')}>{label}</Label>
      <Input
        id={label.toLowerCase().replace(/\s+/g, '-')}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={error ? 'border-red-500' : ''}
      />
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
    </div>
  );
}