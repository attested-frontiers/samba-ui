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

export const formatDecimalString = (decimalString: string, decimals: number = 6): string => {
  // Pad with leading zeros if needed
  const padded = decimalString.padStart(decimals + 1, '0');

  // Split into whole and decimal parts
  const wholePart = padded.slice(0, -decimals) || '0';
  const decimalPart = padded.slice(-decimals);

  // Take only first 2 digits of decimal part
  const formattedDecimal = decimalPart.slice(0, 2);

  return `${wholePart}.${formattedDecimal}`;
};

export function checkExtensionVersion(installedVersion: string): boolean {

  const parseVersion = (version: string) => {
    return version.split('.').map(num => parseInt(num, 10));
  };

  const expectedVersion = process.env.NEXT_PUBLIC_PEERAUTH_EXTENSION_VERSION!;

  const expectedParts = parseVersion(expectedVersion);
  const installedParts = parseVersion(installedVersion);
  
  // Ensure we have exactly 3 parts for each version
  if (expectedParts.length !== 3 || installedParts.length !== 3) {
    throw new Error('Version strings must be in x.y.z format');
  }
  
  const [expX, expY, expZ] = expectedParts;
  const [instX, instY, instZ] = installedParts;
  
  // Compare major version (x)
  if (instX > expX) {
    return true; // Higher major version is always acceptable
  } else if (instX < expX) {
    return false; // Lower major version is not acceptable
  }
  
  // Major versions are equal, compare minor version (y)
  if (instY > expY) {
    return true; // Higher minor version is acceptable
  } else if (instY < expY) {
    return false; // Lower minor version is not acceptable
  }
  
  // Major and minor versions are equal, compare patch version (z)
  if (instZ >= expZ) {
    return true; // Equal or higher patch version is acceptable
  } else {
    return false; // Lower patch version is not acceptable
  }
}