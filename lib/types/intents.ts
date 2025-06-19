export type PaymentPlatforms = "venmo" | "revolut";
export type ZKP2PCurrencies = "USD" | "EUR" | "GBP";

export type Intent = {
    depositId: string,
    amount: string,
    to: string,
    verifier: string,
    fiatCurrency: string,
    chainId: string
}

export type MarketMakerMetadata = {
    depositData: {
        venmoUsername?: string,
        revolutUsername?: string,
        telegramUsername?: string
    },
    processorName: PaymentPlatforms
}