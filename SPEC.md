# Global Entry Data Spec

## 1. Purpose

GED is a **behavior metadata layer**. It normalizes global reference patterns into stable, typed, developer-facing entry models. It does not own "truth" but integrates domain authorities for checkout, CRMs, and SaaS onboarding.

## 2. Global Entry Philosophy

Core thesis: Most global software is domestic assumption with international patches. GED starts from global variance first.

- **Synthesis Layer**: Normalize complex upstream standards (CLDR, libaddressinput, libphonenumber) into human-readable behavior.
- **Integration over Ownership**: Use domain authorities where they exist; normalize for developers.
- **No US-default address model.**
- No forced postal-code requirement.
- No forced state/province requirement.
- No forced first-name/last-name assumption.
- One calling code may map to many territories.
- Territory is not always the same as sovereign country.
- Address order differs by country.
- Postal-code usefulness differs by country.
- Validation strictness depends on use case.
- Data confidence must be explicit.
- Do not present uncertainty as certainty. Use confidence levels.

## 3. Decoupling From US Defaults

Core principle: Do not start from a US address, identity, commerce, or naming model. Model global variation directly.

- **Locale is not country.**
- **Country is not market.**
- **Country is not currency.**
- **Country is not language.**
- **Country is not phone numbering region.**
- **Country is not legal jurisdiction in all cases.**
- **Address is not street/city/state/ZIP globally.**
- **Name is not first/middle/last globally.**
- **Postal code is not globally required.**
- **State/province is not globally required.**
- **English alphabetical sorting is not globally neutral.**
- **Gregorian/MM-DD-YYYY is not globally neutral.**
- **US customary units are not globally neutral.**
- **One dropdown cannot serve shipping, billing, residence, citizenship, and phone country equally.**

## 4. Non-Goals (Core)

No full global postal-code database in core. No geocoding. No address verification. No shipping-grade validation. No tax/legal compliance. No runtime network dependencies. No paid APIs.

## 5. Target Consumers

Web forms. Booking systems. WordPress plugins. Mobile apps. Admin tools. Offline-first applications.

## 6. Data Sets

- **Country Lists**: ISO 3166-1 alpha-2, names.
- **Phone Codes**: E.164 calling codes.
- **Postal Rules**: Format strings, regex validation.
- **Currencies**: ISO 4217 codes, symbols, names.
- **Languages**: ISO 639-1 codes, names.
- **Timezone Defaults**: Primary IANA zone per country.
- **Address Formats**: Field ordering, labels, requirement rules.
- **Form Behavior**: UI/UX rules for entry.
- **Territory Types**: Classification (sovereign, dependent, etc.).
- **Entry Profiles**: Context-specific rules (CRM vs Checkout).
- **Name Formats**: Cultural ordering, single name support, honorifics.
- **Locale Writing**: Script, direction (LTR/RTL), recommended scripts.
- **Country Locales**: Mapping of countries to official and default locales.
- **Administrative Levels**: Hierarchy labels (prefecture, emirate) and requirements.
- **Address Components**: Granular field ordering (large-to-small vs small-to-large).
- **Currency Behavior**: Multi-currency support, settlement vs cash, minor units.
- **Measurement Systems**: Preferred units (metric, imperial) per country.
- **Date/Time Formats**: Preferred patterns, week start, alternate calendars.
- **Market Behavior**: Selectability for shipping, billing, phone, residence.
- **Localized Country Names**: Multi-language translations for iso2 codes.
- **Country Display Order**: Sorting rules (alphabetical, popular, regional).

## 7. Package Outputs

- NPM package (@ringmasters/global-entry-data).
- JSON files (canonical source).
- TSV files (machine-friendly web grab).
- CSV files (spreadsheet import).
- TXT files (simple copy-paste list).
- MD files (documentation, GitHub browsing, agent context).
- SQLite database (database import).
- SQL scripts (database import).
- TypeScript definitions.
- ESM and CJS bundles.
- JSON Schemas.

## 8. Public API

```ts
// Countries & Territories
getCountries(): Country[]
getCountry(iso2: string): Country | null
getCountryByIso3(iso3: string): Country | null
searchCountries(query: string): Country[]
getTerritoryType(iso2: string): string | null

// Phone
getCallingCode(iso2: string): string | null
getCountriesByCallingCode(code: string): string[]
getPhoneMetadata(iso2: string): PhoneMetadata | null

// Postal
getPostalRule(iso2: string): PostalRule | null
validatePostalCode(iso2: string, value: string): boolean
getPostalCodeBehavior(iso2: string, profile: string): PostalBehavior

// Address & Admin Levels
getAddressFormat(iso2: string): AddressFormat | null
getAddressFields(iso2: string): string[]
getAdministrativeLevels(iso2: string): AdministrativeLevelInfo[]
getAddressComponents(iso2: string): AddressComponents | null

// Locales & i18n
getLocalesByCountry(iso2: string): LocaleMetadata[]
getDefaultLocale(iso2: string): string | null
getWritingSystem(locale: string): WritingSystem | null
isRtlLocale(locale: string): boolean
getLocalizedCountryName(iso2: string, locale: string): string | null
getLocalizedLanguageName(code: string, locale: string): string | null
getLanguages(iso2: string): Language[]

// DateTime & Timezone
getDateTimeFormat(locale: string): DateTimeFormat | null
getWeekStart(locale: string): string | null
getCalendarPreferences(locale: string): CalendarPreferences | null
getTimezoneDefaults(iso2: string): string[]
getTimezones(iso2: string): TimezoneMetadata | null

// Currency
getCurrency(iso2: string): Currency | null
getCurrencyBehavior(iso2: string): CurrencyBehavior | null

// Units
getMeasurementSystem(iso2: string): MeasurementSystem | null
getPreferredUnits(iso2: string): PreferredUnits | null

// Forms & UX
getFormBehavior(iso2: string): FormBehavior
getEntryRules(iso2: string, profile: string): EntryRules
getNameFormat(iso2: string): NameFormat | null

// Markets & Sorting
getMarketBehavior(iso2: string): MarketBehavior | null
sortCountries(countries: Country[], options?: SortOptions): Country[]
```

## 9. Schema Rules

- Every country requires `iso2`.
- `iso2` must be unique.
- Calling codes must map to at least one country.
- All postal regex must compile.
- Postal examples must pass their regex.
- All JSON must validate against local schemas.
- Generated files must have deterministic row ordering.
- Every record requires source metadata and `updatedAt`.

## 10. Internationalization (i18n) Architecture

i18n is core architecture, not a cosmetic layer.

### 10.1 Core Principles

- **Separate country, locale, language, script, timezone, currency, market, and display behavior.**
- **Must Not Do**:
  - Do not treat country as locale.
  - Do not treat language as country.
  - Do not hardcode English country names.
  - Do not assume Latin script or LTR layout.
  - Do not assume Gregorian-only display.

### 10.2 i18n Core Modules

- **localized-country-names.json**: Country names by locale.
- **country-locales.json**: Official/default/common locales by country.
- **locale-writing.json**: Script, direction, native-script behavior.
- **date-time-formats.json**: Date pattern, time cycle, week start, calendar preference.
- **country-display-order.json**: Sorting rules by locale/market.
- **language-names.json**: Localized language names.

## 11. Risk Controls (Consolidated)

- **Source Policy**: CLDR-compatible. Track source per row.
- **No Official Authority**: Never claim to be official authority for CLDR, finance, or media.
- **Separation of Concerns**: Live/time-sensitive data (rates, schedules) must be adapters, not static JSON truth.
- **No fit guarantees** for lifestyle; **no investment advice** for finance; **no emergency infrastructure** for hazards/media.

## 12. Developer User Stories

- Developer can render Japan as 日本 for ja locale.
- Developer can detect that ar locales are RTL.
- Developer can distinguish CA has en-CA and fr-CA.
- Developer can detect that CH has multiple official locales.
- Developer can sort country picker by user locale.
- Developer can detect Hong Kong is not forced into one language or postal-code assumption.
