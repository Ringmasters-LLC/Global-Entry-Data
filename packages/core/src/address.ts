import addressFormatData from '../../../data/canonical/address-formats.json';
import administrativeLevelData from '../../../data/canonical/administrative-levels.json';
import addressComponentData from '../../../data/canonical/address-components.json';
import {
  AddressFormat,
  AdministrativeLevelMetadata,
  AdministrativeLevelInfo,
  AddressComponents,
} from './types';

export const addressFormats: AddressFormat[] = addressFormatData as AddressFormat[];
export const administrativeLevels: AdministrativeLevelMetadata[] =
  administrativeLevelData as AdministrativeLevelMetadata[];
export const addressComponents: AddressComponents[] =
  addressComponentData as any as AddressComponents[];

export const getAddressFormat = (iso2: string): AddressFormat | null => {
  return addressFormats.find((a) => a.iso2.toUpperCase() === iso2.toUpperCase()) || null;
};

export const getAddressFields = (iso2: string): string[] => {
  const format = getAddressFormat(iso2);
  return format ? format.fieldOrder : [];
};

export const getAdministrativeLevels = (iso2: string): AdministrativeLevelInfo[] => {
  const meta = administrativeLevels.find(
    (l) => l.iso2.toUpperCase() === iso2.toUpperCase(),
  );
  return meta ? meta.levels : [];
};

export const getAddressComponents = (iso2: string): AddressComponents | null => {
  return (
    addressComponents.find((c) => c.iso2.toUpperCase() === iso2.toUpperCase()) || null
  );
};
