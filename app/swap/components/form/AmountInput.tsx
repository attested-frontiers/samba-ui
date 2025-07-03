import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  currency: string;
  error?: string;
  label?: string;
  placeholder?: string;
  className?: string;
}

export function AmountInput({ 
  value, 
  onChange, 
  currency,
  error,
  label = "Amount",
  placeholder = "0.00",
  className = ""
}: AmountInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Allow only numbers and decimal point
    if (inputValue === '' || /^\d*\.?\d*$/.test(inputValue)) {
      onChange(inputValue);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor="amount">{label}</Label>
      <div className="relative">
        <Input
          id="amount"
          type="text"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className={`text-right pr-12 ${error ? 'border-red-500' : ''}`}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
          {currency}
        </div>
      </div>
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
    </div>
  );
}