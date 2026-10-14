import currencyData from '../../../data/canonical/currencies.json';
import currencyBehaviorData from '../../../data/canonical/currency-behavior.json';
import { Currency, CurrencyBehavior } from './types';

export const currencies: Currency[] = currencyData as Currency[];
export const currencyBehaviors: CurrencyBehavior[] = currencyBehaviorData as CurrencyBehavior[];

export const getCurrency = (iso2: string): Currency | null => {
  const behavior = getCurrencyBehavior(iso2);
  if (!behavior) return null;
  return (
    currencies.find(
      (c) => c.code.toUpperCase() === behavior.settlementCurrency.toUpperCase(),
    ) || null
  );
};

export const getCurrencyBehavior = (iso2: string): CurrencyBehavior | null => {
  return (
    currencyBehaviors.find((b) => b.iso2.toUpperCase() === iso2.toUpperCase()) || null
  );
};
