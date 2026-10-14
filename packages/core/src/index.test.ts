import { describe, it, expect } from 'vitest';
import {
  getCountry,
  getCountries,
  searchCountries,
  validatePostalCode,
  getCallingCode,
  getAddressFields,
  getMeasurementSystem,
  getPreferredUnits,
  getLocalizedCountryName,
  getLocalizedLanguageName,
  getLocalesByCountry,
  getDefaultLocale,
  getWritingSystem,
  isRtlLocale,
  getAdministrativeLevels,
  getAddressComponents,
  getCurrency,
  getCurrencyBehavior,
  getMarketBehavior,
  sortCountries,
} from './index';

describe('Global Entry Data Core API', () => {
  it('should find a country by iso2', () => {
    const jp = getCountry('JP');
    expect(jp).toBeDefined();
    expect(jp?.name).toBe('Japan');
  });

  it('should search countries by name', () => {
    const results = searchCountries('United States');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((c) => c.iso2 === 'US')).toBe(true);
  });

  it('should validate postal codes', () => {
    expect(validatePostalCode('JP', '100-0001')).toBe(true);
    expect(validatePostalCode('US', '90210')).toBe(true);
  });

  it('should get calling codes', () => {
    expect(getCallingCode('US')).toBe('1');
    expect(getCallingCode('JP')).toBe('81');
  });

  it('should return address fields for country', () => {
    const jpFields = getAddressFields('JP');
    expect(jpFields).toBeDefined();
    expect(Array.isArray(jpFields)).toBe(true);
  });

  describe('Measurement Systems', () => {
    it('should get measurement system for JP', () => {
      const ms = getMeasurementSystem('JP');
      expect(ms).toBeDefined();
      expect(ms?.measurementSystem).toBe('metric');
      expect(ms?.traditionalSystems).toContain('japanese_traditional');
    });

    it('should get preferred units for US', () => {
      const units = getPreferredUnits('US');
      expect(units).toBeDefined();
      expect(units?.temperature).toBe('fahrenheit');
      expect(units?.distance).toBe('mile');
      expect(units?.weight).toBe('pound');
      expect(units?.height).toBe('foot');
      expect(units?.paperSize).toBe('Letter');
    });

    it('should get preferred units for GB (mixed/imperial context)', () => {
      const units = getPreferredUnits('GB');
      expect(units).toBeDefined();
      expect(units?.distance).toBe('mile');
      expect(units?.weight).toBe('kilogram');
    });
  });

  describe('i18n Helpers', () => {
    it('should get localized country names', () => {
      expect(getLocalizedCountryName('JP', 'en')).toBe('Japan');
      expect(getLocalizedCountryName('JP', 'ja')).toBe('日本');
      expect(getLocalizedCountryName('US', 'en')).toBe('United States');
      expect(getLocalizedCountryName('US', 'ja')).toBe('アメリカ合衆国');
      expect(getLocalizedCountryName('CH', 'de')).toBe('Schweiz');
      expect(getLocalizedCountryName('BE', 'fr')).toBe('Belgique');
    });

    it('should get localized language names', () => {
      expect(getLocalizedLanguageName('ja', 'en')).toBe('Japanese');
      expect(getLocalizedLanguageName('ja', 'ja')).toBe('日本語');
      expect(getLocalizedLanguageName('de', 'ja')).toBe('ドイツ語');
    });

    it('should get locales by country', () => {
      const localesCA = getLocalesByCountry('CA');
      expect(localesCA.length).toBeGreaterThan(1);
      expect(localesCA.some((l) => l.locale === 'en-CA')).toBe(true);
      expect(localesCA.some((l) => l.locale === 'fr-CA')).toBe(true);

      const localesCH = getLocalesByCountry('CH');
      expect(localesCH.length).toBeGreaterThan(1);
      expect(localesCH.some((l) => l.locale === 'de-CH')).toBe(true);
    });

    it('should get default locale', () => {
      expect(getDefaultLocale('JP')).toBe('ja-JP');
      expect(getDefaultLocale('US')).toBe('en-US');
    });

    it('should detect RTL locales', () => {
      expect(isRtlLocale('ar')).toBe(true);
      expect(isRtlLocale('ar-AE')).toBe(true);
      expect(isRtlLocale('he-IL')).toBe(true);
      expect(isRtlLocale('en-US')).toBe(false);
    });

    it('should get writing system info', () => {
      const wsJP = getWritingSystem('ja-JP');
      expect(wsJP?.script).toBe('Jpan');
      expect(wsJP?.direction).toBe('ltr');

      const wsHE = getWritingSystem('he');
      expect(wsHE?.script).toBe('Hebr');
      expect(wsHE?.direction).toBe('rtl');
    });
  });

  describe('Address Helpers (Levels & Components)', () => {
    it('should get administrative levels for JP', () => {
      const levels = getAdministrativeLevels('JP');
      expect(levels.length).toBeGreaterThan(0);
      expect(levels[0].label).toBe('Prefecture');
    });

    it('should get address components for US', () => {
      const components = getAddressComponents('US');
      expect(components).toBeDefined();
      expect(components?.components.some((c) => c === 'locality')).toBe(true);
      expect(components?.order).toBe('small_to_large');
    });
  });

  describe('Currency Helpers', () => {
    it('should get currency for JP', () => {
      const currency = getCurrency('JP');
      expect(currency?.code).toBe('JPY');
      expect(currency?.symbol).toBe('¥');
    });

    it('should get currency behavior for US', () => {
      const behavior = getCurrencyBehavior('US');
      expect(behavior?.settlementCurrency).toBe('USD');
      expect(behavior?.minorUnits).toBe(2);
    });
  });

  describe('Market Helpers & Sorting', () => {
    it('should get market behavior for CA', () => {
      const behavior = getMarketBehavior('CA');
      expect(behavior?.selectableForShipping).toBe(true);
    });

    it('should sort countries by popularity (default)', () => {
      const allCountries = getCountries();
      const sorted = sortCountries(allCountries);
      expect(sorted[0].iso2).toBe('US'); // Priority 1
      expect(sorted[1].iso2).toBe('GB'); // Priority 2
      expect(sorted[2].iso2).toBe('JP'); // Priority 3
    });

    it('should sort countries alphabetically by locale', () => {
      const subset = getCountries().filter((c) => ['JP', 'US', 'CA'].includes(c.iso2));
      const sorted = sortCountries(subset, { byPopularity: false, locale: 'ja' });
      // In ja locale: アメリカ合衆国 (US), カナダ (CA), 日本 (JP)
      expect(sorted[0].iso2).toBe('US');
      expect(sorted[1].iso2).toBe('CA');
      expect(sorted[2].iso2).toBe('JP');
    });
  });
});
