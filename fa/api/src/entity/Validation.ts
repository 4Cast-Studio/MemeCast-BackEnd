import { PublicKey } from '@solana/web3.js';
import { verifyMessageSignature } from '@solana/wallet-standard-util';
import bs58 from 'bs58';
import { type FormDataEntryValue } from 'undici';

export class ValidationError extends Error {}

export function validateWallet(wallet: any): string {
  const validatedWallet = validateString(wallet, 'wallet');

  try {
    const walletPublicKey = new PublicKey(validatedWallet);
    const isOnCurve = PublicKey.isOnCurve(walletPublicKey.toBuffer());

    if (!isOnCurve) {
      throw new ValidationError('Invalid wallet');
    }
  } catch (error) {
    throw new ValidationError('Invalid wallet');
  }

  return validatedWallet;
}

export function validateNotUndefinedOrNull(input: any, field: string): any {
  if (input === undefined) {
    throw new ValidationError(`${field} should not be undefined`);
  }

  if (input === null) {
    throw new ValidationError(`${field} should not be null`);
  }

  return input;
}

export function validateNumber(input: any, field: string): number {
  validateNotUndefinedOrNull(input, field);

  if (typeof input === 'number') {
    return input;
  }

  throw new ValidationError(`Expect ${field} to be of type number but found ${typeof input}.`);
}

export type ValidateStringOption = {
  min?: number;
  max?: number;
};

export function validateString(input: any, field: string, option?: ValidateStringOption): string {
  validateNotUndefinedOrNull(input, field);

  const { min, max } = option ?? {};

  if (min != null && input.length < min) {
    throw new ValidationError(`Expect ${field} to be a string with length ${min} or more.`);
  }

  if (max != null && input.length > max) {
    throw new ValidationError(`Expect ${field} to be a string with length ${max} or less.`);
  }

  return input;
}

export function validateStringNonEmpty(input: any, field: string): string {
  return validateString(input, field, { min: 1 });
}

export function validateOptions(input: any, options: any[]): any {
  if (!options.includes(input)) {
    throw new ValidationError(`Expect one of ${String(options)} but found ${String(input)}`);
  }

  return input;
}

export function validateMessageSignature(wallet: string, message: string, signature: string): void {
  const messageBytes = new Uint8Array(Buffer.from(message));

  const isValid = verifyMessageSignature({
    message: messageBytes,
    signedMessage: messageBytes,
    signature: bs58.decode(signature),
    publicKey: bs58.decode(wallet),
  });

  if (!isValid) {
    throw new ValidationError('Invalid signature');
  }
}
