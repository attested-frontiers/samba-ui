import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { MarketMakerMetadata, PaymentPlatforms } from "./types/intents"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function platformToVerifier(
  platform: PaymentPlatforms
): `0x${string}` {
  let address = "0x00";
  switch (platform) {
    case "venmo":
      address = process.env.NEXT_PUBLIC_VENMO_VERIFIER!;
      break;
    case "revolut":
      address = process.env.NEXT_PUBLIC_REVOLUT_VERIFIER!;
      break;
  }
  return address as `0x${string}`;
}

export function getMarketMakerMetadataPayload(
  username: string,
  platform: PaymentPlatforms,
): MarketMakerMetadata {
  return {
    depositData: {
      venmoUsername: platform === "venmo" ? username : undefined,
      revolutUsername: platform === "revolut" ? username : undefined,
    },
    processorName: platform
  }
}