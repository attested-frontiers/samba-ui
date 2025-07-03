import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { currencies } from '../../types/swap';

interface CurrencySelectorProps {
  value: string;
  onChange: (value: string) => void;
  availableCurrencies?: string[];
  placeholder?: string;
  className?: string;
}

export function CurrencySelector({ 
  value, 
  onChange, 
  availableCurrencies = currencies.map(c => c.code),
  placeholder = "Select currency",
  className = ""
}: CurrencySelectorProps) {
  const filteredCurrencies = currencies.filter(currency => 
    availableCurrencies.includes(currency.code)
  );

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {filteredCurrencies.map((currency) => (
          <SelectItem key={currency.code} value={currency.code}>
            <div className="flex items-center gap-2">
              <span>{currency.flag}</span>
              <span>{currency.code}</span>
              <span className="text-gray-500">- {currency.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}