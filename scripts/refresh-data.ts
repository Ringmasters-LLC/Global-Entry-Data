import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { XMLParser } from 'fast-xml-parser';

const DATA_DIR = path.resolve(process.cwd(), 'data/canonical');
const UPDATED_AT = new Date().toISOString().split('T')[0];

const LANGUAGES = ['en', 'ja', 'fr', 'de', 'it', 'es', 'zh', 'ar', 'he'];

const SOURCES = {
  CLDR_CODE_MAPPINGS:
    'https://raw.githubusercontent.com/unicode-org/cldr-json/main/cldr-json/cldr-core/supplemental/codeMappings.json',
  CLDR_TERRITORY_INFO:
    'https://raw.githubusercontent.com/unicode-org/cldr-json/main/cldr-json/cldr-core/supplemental/territoryInfo.json',
  CLDR_CURRENCY_DATA:
    'https://raw.githubusercontent.com/unicode-org/cldr-json/main/cldr-json/cldr-core/supplemental/currencyData.json',
  LIBPHONENUMBER_XML:
    'https://raw.githubusercontent.com/google/libphonenumber/master/resources/PhoneNumberMetadata.xml',
};

async function fetchJson(url: string) {
  const res = await fetch(url);
  return res.json();
}

async function fetchText(url: string) {
  const res = await fetch(url);
  return res.text();
}

function loadCanonical(filename: string) {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, filename), 'utf8'));
}

function saveCanonical(filename: string, data: any) {
  fs.writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2) + '\n');
}

async function refresh() {
  console.log('Refreshing data from upstream sources...');

  // 1. Fetch Supplemental
  const [cldrCodes, territoryInfo, currencyData, phoneXml] = await Promise.all([
    fetchJson(SOURCES.CLDR_CODE_MAPPINGS),
    fetchJson(SOURCES.CLDR_TERRITORY_INFO),
    fetchJson(SOURCES.CLDR_CURRENCY_DATA),
    fetchText(SOURCES.LIBPHONENUMBER_XML),
  ]);

  // 2. Fetch Multi-language labels
  const territoryNames: Record<string, any> = {};
  const languageNames: Record<string, any> = {};
  const currencyNames: Record<string, any> = {};

  await Promise.all(
    LANGUAGES.map(async (lang) => {
      const [t, l, c] = await Promise.all([
        fetchJson(
          `https://raw.githubusercontent.com/unicode-org/cldr-json/main/cldr-json/cldr-localenames-full/main/${lang}/territories.json`,
        ),
        fetchJson(
          `https://raw.githubusercontent.com/unicode-org/cldr-json/main/cldr-json/cldr-localenames-full/main/${lang}/languages.json`,
        ),
        fetchJson(
          `https://raw.githubusercontent.com/unicode-org/cldr-json/main/cldr-json/cldr-numbers-full/main/${lang}/currencies.json`,
        ),
      ]);
      territoryNames[lang] = t.main[lang].localeDisplayNames.territories;
      languageNames[lang] = l.main[lang].localeDisplayNames.languages;
      currencyNames[lang] = c.main[lang].numbers.currencies;
    }),
  );

  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
  const phoneObj = parser.parse(phoneXml);
  const territories = phoneObj.phoneNumberMetadata.territories.territory;

  // 3. Map Phone Codes
  const phoneMap = new Map();
  for (const t of territories) {
    const iso2 = t.id;
    const code = t.countryCode;
    if (iso2 && code) {
      if (!phoneMap.has(iso2)) phoneMap.set(iso2, []);
      if (!phoneMap.get(iso2).includes(String(code))) {
        phoneMap.get(iso2).push(String(code));
      }
    }
  }

  // 4. Update Countries
  const countries = loadCanonical('countries.json');
  const codeMappings = cldrCodes.supplemental.codeMappings;

  const updatedCountries = countries.map((c: any) => {
    const upstream = codeMappings[c.iso2];
    const name = territoryNames.en[c.iso2] || c.name;
    return {
      ...c,
      name,
      iso3: upstream?._alpha3 || c.iso3,
      numeric: upstream?._numeric || c.numeric,
      updatedAt: UPDATED_AT,
    };
  });
  saveCanonical('countries.json', updatedCountries);
  console.log('Updated countries.json');

  // 5. Update Phone Codes
  const phoneCodes = loadCanonical('phone-codes.json');
  const updatedPhoneCodes = phoneCodes.map((p: any) => {
    return {
      ...p,
      callingCodes: phoneMap.get(p.iso2) || p.callingCodes,
      updatedAt: UPDATED_AT,
    };
  });
  saveCanonical('phone-codes.json', updatedPhoneCodes);
  console.log('Updated phone-codes.json');

  // 6. Update Localized Country Names
  const updatedLocalizedNames = countries.map((c: any) => {
    const names: Record<string, string> = {};
    LANGUAGES.forEach((lang) => {
      const val = territoryNames[lang][c.iso2];
      if (val) names[lang] = val;
    });
    return {
      iso2: c.iso2,
      names,
      updatedAt: UPDATED_AT,
    };
  });
  saveCanonical('localized-country-names.json', updatedLocalizedNames);
  console.log('Updated localized-country-names.json');

  // 7. Update Country Locales
  const tInfo = territoryInfo.supplemental.territoryInfo;
  const updatedCountryLocales = countries.map((c: any) => {
    const info = tInfo[c.iso2];
    const locales: any[] = [];
    if (info && info.languagePopulation) {
      const sortedLangs = Object.keys(info.languagePopulation).sort((a, b) => {
        const popA = parseFloat(info.languagePopulation[a]._populationPercent || '0');
        const popB = parseFloat(info.languagePopulation[b]._populationPercent || '0');
        return popB - popA;
      });

      sortedLangs.forEach((lang, index) => {
        const pop = info.languagePopulation[lang];
        const locale = lang.includes('_') ? lang.replace('_', '-') : `${lang}-${c.iso2}`;
        locales.push({
          locale,
          official:
            pop._officialStatus === 'official' ||
            pop._officialStatus === 'de_facto_official',
          default: index === 0,
        });
      });
    }
    return {
      iso2: c.iso2,
      locales:
        locales.length > 0 ? locales : [{ locale: 'en-US', official: false, default: true }],
      updatedAt: UPDATED_AT,
    };
  });
  saveCanonical('country-locales.json', updatedCountryLocales);
  console.log('Updated country-locales.json');

  // 8. Update Language Names
  const languages = loadCanonical('languages.json');
  const updatedLanguageNames = languages.map((l: any) => {
    const names: Record<string, string> = {};
    LANGUAGES.forEach((lang) => {
      const val = languageNames[lang][l.code];
      if (val) names[lang] = val;
    });
    return {
      code: l.code,
      names,
      updatedAt: UPDATED_AT,
    };
  });
  saveCanonical('language-names.json', updatedLanguageNames);
  console.log('Updated language-names.json');

  // 9. Update Currencies & Behaviors
  const cData = currencyData.supplemental.currencyData.region;
  const usedCurrencies = new Set<string>();
  const updatedBehaviors = countries.map((c: any) => {
    const regionCurrencies = cData[c.iso2] || [];
    const primary =
      regionCurrencies.find((curr: any) => !curr[Object.keys(curr)[0]]._to) ||
      regionCurrencies[regionCurrencies.length - 1];
    const code = primary ? Object.keys(primary)[0] : 'USD';
    usedCurrencies.add(code);

    return {
      iso2: c.iso2,
      supportsMultiCurrency: false,
      settlementCurrency: code,
      minorUnits: 2,
      updatedAt: UPDATED_AT,
    };
  });
  saveCanonical('currency-behavior.json', updatedBehaviors);
  console.log('Updated currency-behavior.json');

  const updatedCurrencies = Array.from(usedCurrencies).map((code) => {
    return {
      code,
      name: currencyNames.en[code]?.displayName || code,
      symbol: currencyNames.en[code]?.symbol || code,
      updatedAt: UPDATED_AT,
    };
  });
  saveCanonical('currencies.json', updatedCurrencies);
  console.log('Updated currencies.json');

  // 10. Update Market Behavior
  const marketBehavior = loadCanonical('market-behavior.json');
  const updatedMarketBehavior = countries.map((c: any) => {
    const existing = marketBehavior.find((m: any) => m.iso2 === c.iso2);
    return {
      iso2: c.iso2,
      selectableForShipping: existing?.selectableForShipping ?? true,
      selectableForBilling: existing?.selectableForBilling ?? true,
      selectableForPhone: existing?.selectableForPhone ?? true,
      selectableForResidence: existing?.selectableForResidence ?? true,
      updatedAt: UPDATED_AT,
    };
  });
  saveCanonical('market-behavior.json', updatedMarketBehavior);
  console.log('Updated market-behavior.json');

  console.log('\nData refresh complete.');
}

refresh().catch((err) => {
  console.error('Refresh failed:', err);
  process.exit(1);
});
