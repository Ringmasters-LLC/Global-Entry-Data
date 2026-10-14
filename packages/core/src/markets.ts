import marketBehaviorData from '../../../data/canonical/market-behavior.json';
import countryDisplayOrderData from '../../../data/canonical/country-display-order.json';
import { MarketBehavior, CountryDisplayOrder, Country, SortOptions } from './types';
import { getLocalizedCountryName } from './locales';

export const marketBehaviors: MarketBehavior[] = marketBehaviorData as MarketBehavior[];
export const countryDisplayOrders: CountryDisplayOrder[] =
  countryDisplayOrderData as CountryDisplayOrder[];

export const getMarketBehavior = (iso2: string): MarketBehavior | null => {
  return (
    marketBehaviors.find((b) => b.iso2.toUpperCase() === iso2.toUpperCase()) || null
  );
};

export const sortCountries = (
  countries: Country[],
  options: SortOptions = {},
): Country[] => {
  const { locale, byPopularity = true, byRegion = false } = options;

  return [...countries].sort((a, b) => {
    const orderA = countryDisplayOrders.find((o) => o.iso2 === a.iso2);
    const orderB = countryDisplayOrders.find((o) => o.iso2 === b.iso2);

    // 1. Popularity/Priority sort
    if (byPopularity) {
      const priorityA = orderA?.priority ?? 100;
      const priorityB = orderB?.priority ?? 100;
      if (priorityA !== priorityB) return priorityA - priorityB;
    }

    // 2. Region sort
    if (byRegion) {
      const regionA = orderA?.region ?? 'ZZ';
      const regionB = orderB?.region ?? 'ZZ';
      if (regionA !== regionB) return regionA.localeCompare(regionB);
    }

    // 3. Alphabetical sort (localized if possible)
    const nameA = locale ? getLocalizedCountryName(a.iso2, locale) || a.name : a.name;
    const nameB = locale ? getLocalizedCountryName(b.iso2, locale) || b.name : b.name;

    return nameA.localeCompare(nameB, locale);
  });
};
