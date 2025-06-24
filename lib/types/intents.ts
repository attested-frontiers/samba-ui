export type PaymentPlatforms = "venmo" | "revolut";
export type ZKP2PCurrencies = "USD" | "EUR" | "GBP";

export type Intent = {
    depositId: string,
    amount: string,
    to: string,
    verifier: string,
    fiatCurrency: string,
    chainId: string,
}

export type Quote = {
  fiatAmount: string;
  fiatAmountFormatted: string;
  tokenAmount: string;
  tokenAmountFormatted: string;
  paymentMethod: string;
  payeeAddress: string;
  conversionRate: string;
  intent: {
    depositId: number;
    amount: string;
    payeeDetails: string;
    processorName: string;
    toAddress: string;
    fiatCurrencyCode: string;
    chainId: string;
  };
}

export type QuoteResponse = {
    intent: Quote,
    details: PayeeDetailsResponse
}

export type PayeeDetailsResponse = {
    id: number,
    processorName: PaymentPlatforms,
    depositData: {
        venmoUsername?: string,
        revolutUsername?: string,
        telegramUsername?: string
    }
    hashedOnchainId: string,
    createdAt: string
}


export type IntentSignalRequest = {
  processorName: string;
  depositId: string;
  tokenAmount: string;
  payeeDetails: string;
  toAddress: string;
  fiatCurrencyCode: string;
  chainId: string;
};

export type SignalIntentResponse = {
  success: boolean;
  message: string;
  responseObject: {
    depositData: Record<string, any>;
    signedIntent: string;
    intentData: {
      depositId: string;
      tokenAmount: string;
      recipientAddress: string;
      verifierAddress: string;
      currencyCodeHash: string;
      gatingServiceSignature: string;
    };
  };
  statusCode: number;
};

export type QuoteRequest = {
    paymentPlatform: PaymentPlatforms,
    fiatCurrency: ZKP2PCurrencies,
    user: string,
    amount: string
}


export type MarketMakerMetadata = {
    depositData: {
        venmoUsername?: string,
        revolutUsername?: string,
        telegramUsername?: string
    },
    processorName: PaymentPlatforms
}

export type DepositResponse = {
  id: number;
  processorName: string;
  hashedOnchainId: string;
  createdAt: string;
};
