export type Lang = "en" | "ka";

export type VehicleKind =
  | "tow"
  | "carrier"
  | "trailer"
  | "minivan"
  | "truck"
  | "other";

type LocalizedOption = {
  value: string;
  en: string;
  ka: string;
  kind?: VehicleKind;
};

export const CITY_OPTIONS: readonly LocalizedOption[] = [
  { value: "Poti", en: "Poti", ka: "ფოთი" },
  { value: "Tbilisi", en: "Tbilisi", ka: "თბილისი" },
  { value: "Kutaisi", en: "Kutaisi", ka: "ქუთაისი" },
  { value: "Batumi", en: "Batumi", ka: "ბათუმი" },
  { value: "Zugdidi", en: "Zugdidi", ka: "ზუგდიდი" },
  { value: "Gori", en: "Gori", ka: "გორი" },
  { value: "Rustavi", en: "Rustavi", ka: "რუსთავი" },
  { value: "Telavi", en: "Telavi", ka: "თელავი" },
  { value: "Borjomi", en: "Borjomi", ka: "ბორჯომი" },
  { value: "Bakuriani", en: "Bakuriani", ka: "ბაკურიანი" },
  { value: "Gudauri", en: "Gudauri", ka: "გუდაური" },
  { value: "Other", en: "Other", ka: "სხვა" },
] as const;

const EXTRA_CITY_OPTIONS: readonly LocalizedOption[] = [
  { value: "Kobuleti", en: "Kobuleti", ka: "ქობულეთი" },
  { value: "Senaki", en: "Senaki", ka: "სენაკი" },
  { value: "Samtredia", en: "Samtredia", ka: "სამტრედია" },
  { value: "Khashuri", en: "Khashuri", ka: "ხაშური" },
  { value: "Ozurgeti", en: "Ozurgeti", ka: "ოზურგეთი" },
] as const;

export const FILTER_CITY_OPTIONS = CITY_OPTIONS.filter((city) => city.value !== "Other");

export const VEHICLE_OPTIONS: readonly LocalizedOption[] = [
  { value: "Tow truck", en: "Tow truck", ka: "ევაკუატორი", kind: "tow" },
  { value: "Car carrier", en: "Car carrier", ka: "მანქანების გადამზიდი", kind: "carrier" },
  { value: "Trailer", en: "Trailer", ka: "მისაბმელი", kind: "trailer" },
  {
    value: "Minivan (with trailer)",
    en: "Minivan (with trailer)",
    ka: "მიკროავტობუსი + მისაბმელი",
    kind: "minivan",
  },
  { value: "Truck", en: "Truck", ka: "სატვირთო", kind: "truck" },
  { value: "Other", en: "Other", ka: "სხვა", kind: "other" },
] as const;

export const FILTER_VEHICLE_OPTIONS = VEHICLE_OPTIONS.filter(
  (vehicle) => vehicle.kind && vehicle.kind !== "other"
);

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function localizedValue(
  items: readonly LocalizedOption[],
  value: string,
  lang: Lang
) {
  const raw = value.trim();
  const lower = normalize(value);
  const match = items.find(
    (item) =>
      normalize(item.value) === lower ||
      normalize(item.en) === lower ||
      normalize(item.ka) === lower
  );

  if (!match) {
    return raw;
  }

  return lang === "ka" ? match.ka : match.en;
}

export function cityLabel(value: string, lang: Lang) {
  return localizedValue([...CITY_OPTIONS, ...EXTRA_CITY_OPTIONS], value, lang);
}

export function vehicleKind(value: string): VehicleKind {
  const lower = normalize(value);

  if (lower.includes("tow") || lower.includes("ამწე") || lower.includes("ევაკუატორ")) return "tow";
  if (
    lower.includes("carrier") ||
    lower.includes("ავტოვოზ") ||
    lower.includes("გადამზიდ")
  ) return "carrier";
  if (lower.includes("trailer") || lower.includes("მისაბმელ")) return "trailer";
  if (
    lower.includes("minivan") ||
    lower.includes("მინივენ") ||
    lower.includes("მიკროავტობუს")
  ) return "minivan";
  if (lower.includes("truck") || lower.includes("სატვირთო")) return "truck";
  if (lower.includes("other") || lower.includes("სხვა")) return "other";

  return "other";
}

export function vehicleLabel(value: string, lang: Lang) {
  const kind = vehicleKind(value);
  const match = VEHICLE_OPTIONS.find((vehicle) => vehicle.kind === kind);

  if (!match) {
    return value;
  }

  if (kind === "other" && !/(other|სხვა)/i.test(value)) {
    return value;
  }

  return lang === "ka" ? match.ka : match.en;
}

export function languageFromSearch(search: string): Lang {
  return new URLSearchParams(search).get("lang") === "en" ? "en" : "ka";
}
