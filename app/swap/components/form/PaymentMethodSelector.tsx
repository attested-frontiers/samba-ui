import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { paymentMethods } from '../../types/swap';

interface PaymentMethodSelectorProps {
  value: string;
  onChange: (value: string) => void;
  availableCurrencies?: string[];
  placeholder?: string;
  className?: string;
}

export function PaymentMethodSelector({ 
  value, 
  onChange, 
  availableCurrencies = ['USD'],
  placeholder = "Select payment method",
  className = ""
}: PaymentMethodSelectorProps) {
  const filteredMethods = paymentMethods.filter(method => 
    method.availableCurrencies.some(currency => 
      availableCurrencies.includes(currency)
    )
  );

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {filteredMethods.map((method) => (
          <SelectItem key={method.id} value={method.id}>
            <div className="flex items-center gap-2">
              <span>{method.logo}</span>
              <span>{method.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}