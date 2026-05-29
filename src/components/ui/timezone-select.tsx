/**
 * TimezoneSelect — pixel-faithful Blueprint v6.15 reimplementation.
 *
 * A specialized Select for picking IANA timezone strings. Reuses the Select + useQueryList
 * engine, Popover, Menu/MenuItem, Button, and Icon from this library.
 *
 * ## Blueprint spec
 * @see packages/datetime/src/components/timezone-select/timezoneSelect.tsx (Blueprint v6.15)
 *
 * ## Item layout (matches Blueprint's renderItem)
 * Each menu item shows:
 *   left:  "<label>, <longName>" — e.g. "New York, Eastern Standard Time"
 *   right: "<shortName>"         — e.g. "EST" (muted label, right-aligned)
 *
 * The default button shows composite format: "New York (EST) -05:00"
 *
 * ## Timezone list
 * Uses a curated list matching Blueprint's TIMEZONE_ITEMS (timezoneItems.ts v6.15), with
 * offsets computed via Intl.DateTimeFormat for the given `date`. This avoids the date-fns-tz
 * dependency. Offsets are date-sensitive (DST is accounted for).
 *
 * ## Portal + dark-mode
 * Delegates to Select → Popover, which wraps portaled content in a div.dark.
 * Pass `dark={dark}` (from DarkContext) so portaled items render in dark theme.
 *
 * @see https://blueprintjs.com/docs/#datetime/timezone-select
 */

import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { Select } from "./select";
import { MenuItem } from "./menu";
import { Button } from "./button";
import { Icon } from "./icon";
import type { SelectProps } from "./select";

/* ============================================================
 * Timezone data types
 * ============================================================ */

export interface TimezoneItem {
    /** IANA timezone code — e.g. "America/New_York" */
    ianaCode: string;
    /** Human-readable city/region label — e.g. "New York" */
    label: string;
    /** Current UTC offset string — e.g. "-05:00" */
    offset: string;
    /** Long timezone name — e.g. "Eastern Standard Time" */
    longName: string;
    /** Short timezone abbreviation — e.g. "EST" */
    shortName: string;
}

/* ============================================================
 * Static timezone list (Blueprint's TIMEZONE_ITEMS, label+ianaCode only)
 * Offsets and names are computed dynamically from Intl.DateTimeFormat.
 * ============================================================ */

const STATIC_ZONES: Array<{ label: string; ianaCode: string }> = [
    { label: "UTC", ianaCode: "Etc/UTC" },
    { label: "Niue", ianaCode: "Pacific/Niue" },
    { label: "Pago Pago", ianaCode: "Pacific/Pago_Pago" },
    { label: "Hawaii Time", ianaCode: "Pacific/Honolulu" },
    { label: "Rarotonga", ianaCode: "Pacific/Rarotonga" },
    { label: "Tahiti", ianaCode: "Pacific/Tahiti" },
    { label: "Marquesas", ianaCode: "Pacific/Marquesas" },
    { label: "Alaska", ianaCode: "America/Anchorage" },
    { label: "Gambier", ianaCode: "Pacific/Gambier" },
    { label: "Los Angeles", ianaCode: "America/Los_Angeles" },
    { label: "Tijuana", ianaCode: "America/Tijuana" },
    { label: "Vancouver", ianaCode: "America/Vancouver" },
    { label: "Whitehorse", ianaCode: "America/Whitehorse" },
    { label: "Pitcairn", ianaCode: "Pacific/Pitcairn" },
    { label: "Denver", ianaCode: "America/Denver" },
    { label: "Arizona", ianaCode: "America/Phoenix" },
    { label: "Chihuahua, Mazatlan", ianaCode: "America/Mazatlan" },
    { label: "Dawson Creek", ianaCode: "America/Dawson_Creek" },
    { label: "Edmonton", ianaCode: "America/Edmonton" },
    { label: "Hermosillo", ianaCode: "America/Hermosillo" },
    { label: "Yellowknife", ianaCode: "America/Yellowknife" },
    { label: "Belize", ianaCode: "America/Belize" },
    { label: "Chicago", ianaCode: "America/Chicago" },
    { label: "Mexico City", ianaCode: "America/Mexico_City" },
    { label: "Regina", ianaCode: "America/Regina" },
    { label: "Tegucigalpa", ianaCode: "America/Tegucigalpa" },
    { label: "Winnipeg", ianaCode: "America/Winnipeg" },
    { label: "Costa Rica", ianaCode: "America/Costa_Rica" },
    { label: "El Salvador", ianaCode: "America/El_Salvador" },
    { label: "Galapagos", ianaCode: "Pacific/Galapagos" },
    { label: "Guatemala", ianaCode: "America/Guatemala" },
    { label: "Managua", ianaCode: "America/Managua" },
    { label: "America Cancun", ianaCode: "America/Cancun" },
    { label: "Bogota", ianaCode: "America/Bogota" },
    { label: "Easter Island", ianaCode: "Pacific/Easter" },
    { label: "New York", ianaCode: "America/New_York" },
    { label: "Iqaluit", ianaCode: "America/Iqaluit" },
    { label: "Toronto", ianaCode: "America/Toronto" },
    { label: "Guayaquil", ianaCode: "America/Guayaquil" },
    { label: "Havana", ianaCode: "America/Havana" },
    { label: "Jamaica", ianaCode: "America/Jamaica" },
    { label: "Lima", ianaCode: "America/Lima" },
    { label: "Nassau", ianaCode: "America/Nassau" },
    { label: "Panama", ianaCode: "America/Panama" },
    { label: "Port-au-Prince", ianaCode: "America/Port-au-Prince" },
    { label: "Rio Branco", ianaCode: "America/Rio_Branco" },
    { label: "Halifax", ianaCode: "America/Halifax" },
    { label: "Barbados", ianaCode: "America/Barbados" },
    { label: "Bermuda", ianaCode: "Atlantic/Bermuda" },
    { label: "Boa Vista", ianaCode: "America/Boa_Vista" },
    { label: "Caracas", ianaCode: "America/Caracas" },
    { label: "Curacao", ianaCode: "America/Curacao" },
    { label: "Grand Turk", ianaCode: "America/Grand_Turk" },
    { label: "Guyana", ianaCode: "America/Guyana" },
    { label: "La Paz", ianaCode: "America/La_Paz" },
    { label: "Manaus", ianaCode: "America/Manaus" },
    { label: "Martinique", ianaCode: "America/Martinique" },
    { label: "Port of Spain", ianaCode: "America/Port_of_Spain" },
    { label: "Porto Velho", ianaCode: "America/Porto_Velho" },
    { label: "Puerto Rico", ianaCode: "America/Puerto_Rico" },
    { label: "Santo Domingo", ianaCode: "America/Santo_Domingo" },
    { label: "Thule", ianaCode: "America/Thule" },
    { label: "St. Johns", ianaCode: "America/St_Johns" },
    { label: "Araguaina", ianaCode: "America/Araguaina" },
    { label: "Asuncion", ianaCode: "America/Asuncion" },
    { label: "Belem", ianaCode: "America/Belem" },
    { label: "Buenos Aires", ianaCode: "America/Argentina/Buenos_Aires" },
    { label: "Campo Grande", ianaCode: "America/Campo_Grande" },
    { label: "Cayenne", ianaCode: "America/Cayenne" },
    { label: "Cuiaba", ianaCode: "America/Cuiaba" },
    { label: "Fortaleza", ianaCode: "America/Fortaleza" },
    { label: "Godthab", ianaCode: "America/Godthab" },
    { label: "Maceio", ianaCode: "America/Maceio" },
    { label: "Miquelon", ianaCode: "America/Miquelon" },
    { label: "Montevideo", ianaCode: "America/Montevideo" },
    { label: "Palmer", ianaCode: "Antarctica/Palmer" },
    { label: "Paramaribo", ianaCode: "America/Paramaribo" },
    { label: "Punta Arenas", ianaCode: "America/Punta_Arenas" },
    { label: "Recife", ianaCode: "America/Recife" },
    { label: "Rothera", ianaCode: "Antarctica/Rothera" },
    { label: "Salvador", ianaCode: "America/Bahia" },
    { label: "Santiago", ianaCode: "America/Santiago" },
    { label: "Stanley", ianaCode: "Atlantic/Stanley" },
    { label: "Noronha", ianaCode: "America/Noronha" },
    { label: "Sao Paulo", ianaCode: "America/Sao_Paulo" },
    { label: "South Georgia", ianaCode: "Atlantic/South_Georgia" },
    { label: "Azores", ianaCode: "Atlantic/Azores" },
    { label: "Cape Verde", ianaCode: "Atlantic/Cape_Verde" },
    { label: "Scoresbysund", ianaCode: "America/Scoresbysund" },
    { label: "Abidjan", ianaCode: "Africa/Abidjan" },
    { label: "Accra", ianaCode: "Africa/Accra" },
    { label: "Bissau", ianaCode: "Africa/Bissau" },
    { label: "Canary Islands", ianaCode: "Atlantic/Canary" },
    { label: "Casablanca", ianaCode: "Africa/Casablanca" },
    { label: "Danmarkshavn", ianaCode: "America/Danmarkshavn" },
    { label: "Dublin", ianaCode: "Europe/Dublin" },
    { label: "El Aaiun", ianaCode: "Africa/El_Aaiun" },
    { label: "Faeroe", ianaCode: "Atlantic/Faroe" },
    { label: "GMT (no daylight saving)", ianaCode: "Etc/GMT" },
    { label: "Lisbon", ianaCode: "Europe/Lisbon" },
    { label: "London", ianaCode: "Europe/London" },
    { label: "Monrovia", ianaCode: "Africa/Monrovia" },
    { label: "Reykjavik", ianaCode: "Atlantic/Reykjavik" },
    { label: "Algiers", ianaCode: "Africa/Algiers" },
    { label: "Amsterdam", ianaCode: "Europe/Amsterdam" },
    { label: "Andorra", ianaCode: "Europe/Andorra" },
    { label: "Berlin", ianaCode: "Europe/Berlin" },
    { label: "Brussels", ianaCode: "Europe/Brussels" },
    { label: "Budapest", ianaCode: "Europe/Budapest" },
    { label: "Belgrade", ianaCode: "Europe/Belgrade" },
    { label: "Prague", ianaCode: "Europe/Prague" },
    { label: "Ceuta", ianaCode: "Africa/Ceuta" },
    { label: "Copenhagen", ianaCode: "Europe/Copenhagen" },
    { label: "Gibraltar", ianaCode: "Europe/Gibraltar" },
    { label: "Lagos", ianaCode: "Africa/Lagos" },
    { label: "Luxembourg", ianaCode: "Europe/Luxembourg" },
    { label: "Madrid", ianaCode: "Europe/Madrid" },
    { label: "Malta", ianaCode: "Europe/Malta" },
    { label: "Monaco", ianaCode: "Europe/Monaco" },
    { label: "Ndjamena", ianaCode: "Africa/Ndjamena" },
    { label: "Oslo", ianaCode: "Europe/Oslo" },
    { label: "Paris", ianaCode: "Europe/Paris" },
    { label: "Rome", ianaCode: "Europe/Rome" },
    { label: "Stockholm", ianaCode: "Europe/Stockholm" },
    { label: "Tirane", ianaCode: "Europe/Tirane" },
    { label: "Tunis", ianaCode: "Africa/Tunis" },
    { label: "Vienna", ianaCode: "Europe/Vienna" },
    { label: "Warsaw", ianaCode: "Europe/Warsaw" },
    { label: "Zurich", ianaCode: "Europe/Zurich" },
    { label: "Amman", ianaCode: "Asia/Amman" },
    { label: "Athens", ianaCode: "Europe/Athens" },
    { label: "Beirut", ianaCode: "Asia/Beirut" },
    { label: "Bucharest", ianaCode: "Europe/Bucharest" },
    { label: "Cairo", ianaCode: "Africa/Cairo" },
    { label: "Chisinau", ianaCode: "Europe/Chisinau" },
    { label: "Damascus", ianaCode: "Asia/Damascus" },
    { label: "Gaza", ianaCode: "Asia/Gaza" },
    { label: "Helsinki", ianaCode: "Europe/Helsinki" },
    { label: "Jerusalem", ianaCode: "Asia/Jerusalem" },
    { label: "Johannesburg", ianaCode: "Africa/Johannesburg" },
    { label: "Khartoum", ianaCode: "Africa/Khartoum" },
    { label: "Kyiv", ianaCode: "Europe/Kiev" },
    { label: "Maputo", ianaCode: "Africa/Maputo" },
    { label: "Kaliningrad", ianaCode: "Europe/Kaliningrad" },
    { label: "Nicosia", ianaCode: "Asia/Nicosia" },
    { label: "Riga", ianaCode: "Europe/Riga" },
    { label: "Sofia", ianaCode: "Europe/Sofia" },
    { label: "Tallinn", ianaCode: "Europe/Tallinn" },
    { label: "Tripoli", ianaCode: "Africa/Tripoli" },
    { label: "Vilnius", ianaCode: "Europe/Vilnius" },
    { label: "Windhoek", ianaCode: "Africa/Windhoek" },
    { label: "Baghdad", ianaCode: "Asia/Baghdad" },
    { label: "Istanbul", ianaCode: "Europe/Istanbul" },
    { label: "Minsk", ianaCode: "Europe/Minsk" },
    { label: "Moscow", ianaCode: "Europe/Moscow" },
    { label: "Nairobi", ianaCode: "Africa/Nairobi" },
    { label: "Qatar", ianaCode: "Asia/Qatar" },
    { label: "Riyadh", ianaCode: "Asia/Riyadh" },
    { label: "Tehran", ianaCode: "Asia/Tehran" },
    { label: "Baku", ianaCode: "Asia/Baku" },
    { label: "Dubai", ianaCode: "Asia/Dubai" },
    { label: "Mahe", ianaCode: "Indian/Mahe" },
    { label: "Mauritius", ianaCode: "Indian/Mauritius" },
    { label: "Samara", ianaCode: "Europe/Samara" },
    { label: "Reunion", ianaCode: "Indian/Reunion" },
    { label: "Tbilisi", ianaCode: "Asia/Tbilisi" },
    { label: "Yerevan", ianaCode: "Asia/Yerevan" },
    { label: "Kabul", ianaCode: "Asia/Kabul" },
    { label: "Aqtau", ianaCode: "Asia/Aqtau" },
    { label: "Aqtobe", ianaCode: "Asia/Aqtobe" },
    { label: "Ashgabat", ianaCode: "Asia/Ashgabat" },
    { label: "Dushanbe", ianaCode: "Asia/Dushanbe" },
    { label: "Karachi", ianaCode: "Asia/Karachi" },
    { label: "Kerguelen", ianaCode: "Indian/Kerguelen" },
    { label: "Maldives", ianaCode: "Indian/Maldives" },
    { label: "Tashkent", ianaCode: "Asia/Tashkent" },
    { label: "Yekaterinburg", ianaCode: "Asia/Yekaterinburg" },
    { label: "Calcutta", ianaCode: "Asia/Calcutta" },
    { label: "Colombo", ianaCode: "Asia/Colombo" },
    { label: "Katmandu", ianaCode: "Asia/Katmandu" },
    { label: "Almaty", ianaCode: "Asia/Almaty" },
    { label: "Bishkek", ianaCode: "Asia/Bishkek" },
    { label: "Chagos", ianaCode: "Indian/Chagos" },
    { label: "Dhaka", ianaCode: "Asia/Dhaka" },
    { label: "Omsk", ianaCode: "Asia/Omsk" },
    { label: "Thimphu", ianaCode: "Asia/Thimphu" },
    { label: "Urumqi", ianaCode: "Asia/Urumqi" },
    { label: "Cocos", ianaCode: "Indian/Cocos" },
    { label: "Rangoon", ianaCode: "Asia/Rangoon" },
    { label: "Bangkok", ianaCode: "Asia/Bangkok" },
    { label: "Christmas", ianaCode: "Indian/Christmas" },
    { label: "Davis", ianaCode: "Antarctica/Davis" },
    { label: "Ho Chi Minh", ianaCode: "Asia/Ho_Chi_Minh" },
    { label: "Hovd", ianaCode: "Asia/Hovd" },
    { label: "Jakarta", ianaCode: "Asia/Jakarta" },
    { label: "Krasnoyarsk", ianaCode: "Asia/Krasnoyarsk" },
    { label: "Brunei", ianaCode: "Asia/Brunei" },
    { label: "Choibalsan", ianaCode: "Asia/Choibalsan" },
    { label: "Hong Kong", ianaCode: "Asia/Hong_Kong" },
    { label: "Irkutsk", ianaCode: "Asia/Irkutsk" },
    { label: "Kuala Lumpur", ianaCode: "Asia/Kuala_Lumpur" },
    { label: "Macau", ianaCode: "Asia/Macau" },
    { label: "Makassar", ianaCode: "Asia/Makassar" },
    { label: "Manila", ianaCode: "Asia/Manila" },
    { label: "Shanghai", ianaCode: "Asia/Shanghai" },
    { label: "Singapore", ianaCode: "Asia/Singapore" },
    { label: "Taipei", ianaCode: "Asia/Taipei" },
    { label: "Ulaanbaatar", ianaCode: "Asia/Ulaanbaatar" },
    { label: "Casey", ianaCode: "Antarctica/Casey" },
    { label: "Dili", ianaCode: "Asia/Dili" },
    { label: "Jayapura", ianaCode: "Asia/Jayapura" },
    { label: "Pyongyang", ianaCode: "Asia/Pyongyang" },
    { label: "Seoul", ianaCode: "Asia/Seoul" },
    { label: "Tokyo", ianaCode: "Asia/Tokyo" },
    { label: "Yakutsk", ianaCode: "Asia/Yakutsk" },
    { label: "Adelaide", ianaCode: "Australia/Adelaide" },
    { label: "Darwin", ianaCode: "Australia/Darwin" },
    { label: "Brisbane", ianaCode: "Australia/Brisbane" },
    { label: "DumontDUrville", ianaCode: "Antarctica/DumontDUrville" },
    { label: "Guam", ianaCode: "Pacific/Guam" },
    { label: "Hobart", ianaCode: "Australia/Hobart" },
    { label: "Lindeman", ianaCode: "Australia/Lindeman" },
    { label: "Melbourne", ianaCode: "Australia/Melbourne" },
    { label: "Port Moresby", ianaCode: "Pacific/Port_Moresby" },
    { label: "Sydney", ianaCode: "Australia/Sydney" },
    { label: "Vladivostok", ianaCode: "Asia/Vladivostok" },
    { label: "Lord Howe", ianaCode: "Australia/Lord_Howe" },
    { label: "Bougainville", ianaCode: "Pacific/Bougainville" },
    { label: "Efate", ianaCode: "Pacific/Efate" },
    { label: "Guadalcanal", ianaCode: "Pacific/Guadalcanal" },
    { label: "Kosrae", ianaCode: "Pacific/Kosrae" },
    { label: "Magadan", ianaCode: "Asia/Magadan" },
    { label: "Noumea", ianaCode: "Pacific/Noumea" },
    { label: "Ponape", ianaCode: "Pacific/Pohnpei" },
    { label: "Sakhalin", ianaCode: "Asia/Sakhalin" },
    { label: "Auckland", ianaCode: "Pacific/Auckland" },
    { label: "Fiji", ianaCode: "Pacific/Fiji" },
    { label: "Funafuti", ianaCode: "Pacific/Funafuti" },
    { label: "Kwajalein", ianaCode: "Pacific/Kwajalein" },
    { label: "Majuro", ianaCode: "Pacific/Majuro" },
    { label: "Nauru", ianaCode: "Pacific/Nauru" },
    { label: "Sredneklymsk", ianaCode: "Asia/Srednekolymsk" },
    { label: "Tarawa", ianaCode: "Pacific/Tarawa" },
    { label: "Wake", ianaCode: "Pacific/Wake" },
    { label: "Wallis", ianaCode: "Pacific/Wallis" },
    { label: "Chatham", ianaCode: "Pacific/Chatham" },
    { label: "Apia", ianaCode: "Pacific/Apia" },
    { label: "Enderbury", ianaCode: "Pacific/Enderbury" },
    { label: "Fakaofo", ianaCode: "Pacific/Fakaofo" },
    { label: "Tongatapu", ianaCode: "Pacific/Tongatapu" },
    { label: "Kamchatka", ianaCode: "Asia/Kamchatka" },
    { label: "Kiritimati", ianaCode: "Pacific/Kiritimati" },
];

/* ============================================================
 * Offset computation via Intl.DateTimeFormat (no date-fns-tz dep)
 * ============================================================ */

/**
 * Compute the UTC offset string (e.g. "+05:30") for a timezone at a given date.
 * Uses Intl.DateTimeFormat with timeZoneName:"shortOffset" to get "GMT±X:XX",
 * then normalizes to "+HH:MM" / "-HH:MM" / "+00:00" format.
 */
function computeOffset(ianaCode: string, date: Date): string {
    try {
        const formatter = new Intl.DateTimeFormat("en-US", {
            timeZone: ianaCode,
            timeZoneName: "shortOffset",
        });
        const parts = formatter.formatToParts(date);
        const tzPart = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT+0";
        // tzPart is like "GMT", "GMT+5", "GMT-8", "GMT+5:30"
        const match = tzPart.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
        if (!match) return "+00:00";
        const sign = match[1] as "+" | "-";
        const hours = match[2].padStart(2, "0");
        const minutes = (match[3] ?? "00").padStart(2, "0");
        return `${sign}${hours}:${minutes}`;
    } catch {
        return "+00:00";
    }
}

/**
 * Get the short timezone abbreviation (e.g. "EST", "PST") for a zone at a date.
 * Returns the shortOffset string as fallback (e.g. "GMT-5") if no common abbreviation.
 */
function computeShortName(ianaCode: string, date: Date): string {
    try {
        const formatter = new Intl.DateTimeFormat("en-US", {
            timeZone: ianaCode,
            timeZoneName: "short",
        });
        const parts = formatter.formatToParts(date);
        return parts.find((p) => p.type === "timeZoneName")?.value ?? "";
    } catch {
        return "";
    }
}

/**
 * Get the long timezone name (e.g. "Eastern Standard Time") for a zone at a date.
 */
function computeLongName(ianaCode: string, date: Date): string {
    try {
        const formatter = new Intl.DateTimeFormat("en-US", {
            timeZone: ianaCode,
            timeZoneName: "long",
        });
        const parts = formatter.formatToParts(date);
        return parts.find((p) => p.type === "timeZoneName")?.value ?? "";
    } catch {
        return "";
    }
}

/** Enrich the static zone list with computed offset/shortName/longName for the given date. */
function buildTimezoneItems(date: Date): TimezoneItem[] {
    return STATIC_ZONES.map(({ label, ianaCode }) => ({
        ianaCode,
        label,
        offset: computeOffset(ianaCode, date),
        shortName: computeShortName(ianaCode, date),
        longName: computeLongName(ianaCode, date),
    }));
}

/* ============================================================
 * Initial (empty-query) timezone list — Blueprint shows a minimal
 * representative subset when no query is typed.
 * Matches Blueprint's MINIMAL_TIMEZONE_ITEMS.
 * ============================================================ */

// Exactly Blueprint 6.15's MINIMAL_TIMEZONE_ITEMS (timezoneItems.ts → minimalTimezonesWithoutOffset),
// in the same order. Three entries use the older IANA aliases that our allItems data carries:
// Asia/Calcutta (≙ Asia/Kolkata), Asia/Katmandu (≙ Asia/Kathmandu), Asia/Rangoon (≙ Asia/Yangon).
const MINIMAL_IANA_CODES = [
    "Etc/UTC",
    "Pacific/Pago_Pago",
    "Pacific/Honolulu",
    "Pacific/Marquesas",
    "America/Anchorage",
    "America/Los_Angeles",
    "America/Denver",
    "America/Mexico_City",
    "America/New_York",
    "America/Puerto_Rico",
    "America/St_Johns",
    "America/Argentina/Buenos_Aires",
    "America/Sao_Paulo",
    "Atlantic/Cape_Verde",
    "Europe/Paris",
    "Africa/Cairo",
    "Europe/Moscow",
    "Asia/Tehran",
    "Asia/Dubai",
    "Asia/Karachi",
    "Asia/Calcutta",
    "Asia/Katmandu",
    "Asia/Dhaka",
    "Asia/Rangoon",
    "Asia/Jakarta",
    "Asia/Manila",
    "Asia/Tokyo",
    "Australia/Brisbane",
    "Australia/Adelaide",
    "Australia/Sydney",
    "Pacific/Nauru",
    "Pacific/Auckland",
    "Pacific/Kiritimati",
];

/* ============================================================
 * Composite display format (matches Blueprint's TimezoneDisplayFormat.COMPOSITE)
 * ============================================================ */

/**
 * Format a timezone item as a composite string for the button trigger.
 * Blueprint composite: "New York (EST) -05:00" or "UTC +00:00" (no abbr if it's an offset alias).
 */
function formatComposite(item: TimezoneItem): string {
    const { label, shortName, offset } = item;
    // If shortName contains + or - (is a GMT-offset alias like "GMT-8"), omit it
    // If shortName === label, omit it too (redundant)
    if (/[+-]/.test(shortName) || shortName === label || !shortName) {
        return `${label} ${offset}`;
    }
    return `${label} (${shortName}) ${offset}`;
}

/* ============================================================
 * Filter predicate (matches Blueprint's filterItems intent, but safe)
 *
 * Blueprint's original uses RegExp(userQuery) which risks ReDoS on adversarial
 * input. We use a safe substring/token search instead:
 *   - Normalize query and each field to lower-case
 *   - Split query on whitespace/separators; ALL tokens must match at least one field
 * This gives equivalent UX (e.g. "new york" finds "America/New_York") without RegExp.
 * ============================================================ */

function matchesQuery(query: string, item: TimezoneItem): boolean {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    // Split on spaces and underscores so "new york" → ["new","york"]
    const tokens = q.split(/[\s_/]+/).filter(Boolean);
    const fields = [
        item.ianaCode.toLowerCase(),
        item.label.toLowerCase(),
        item.longName.toLowerCase(),
        item.shortName.toLowerCase(),
    ];
    // Every token must appear in at least one field (AND logic across tokens)
    return tokens.every((token) => fields.some((field) => field.includes(token)));
}

function filterTimezones(query: string, items: TimezoneItem[]): TimezoneItem[] {
    if (!query) return items;
    return items.filter((item) => matchesQuery(query, item));
}

/* ============================================================
 * TimezoneSelect props
 * ============================================================ */

export interface TimezoneSelectProps {
    /**
     * The currently selected IANA timezone code, e.g. "America/New_York".
     * Use with `onChange` for controlled mode. Can be undefined for unselected state.
     */
    value?: string;

    /**
     * Default value for uncontrolled mode.
     */
    defaultValue?: string;

    /**
     * Callback invoked when the user selects a timezone.
     * @param timezone — the IANA timezone code
     */
    onChange?: (timezone: string) => void;

    /**
     * The date to use when computing timezone offsets. Offsets are DST-sensitive.
     * @default now
     */
    date?: Date;

    /**
     * Whether to show the local (system) timezone at the top of the initial list
     * (before any query is typed).
     * @default false
     */
    showLocalTimezone?: boolean;

    /**
     * Whether the component is non-interactive.
     * @default false
     */
    disabled?: boolean;

    /**
     * Whether the Select should fill its container width.
     * @default false
     */
    fill?: boolean;

    /**
     * Placeholder text shown in the trigger button when no timezone is selected.
     * @default "Select timezone..."
     */
    placeholder?: string;

    /**
     * Extra props passed to the trigger Button. Ignored if custom children are provided.
     */
    buttonProps?: Omit<React.ComponentProps<typeof Button>, "children" | "disabled" | "fill">;

    /**
     * Extra props passed to the filter InputGroup inside the popover.
     */
    inputProps?: Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "size">;

    /**
     * Extra props passed to the Popover.
     * Use `popoverProps={{ open: true }}` to force the popover open for gallery/harness use.
     */
    popoverProps?: SelectProps<TimezoneItem>["popoverProps"];

    /**
     * Whether to include a filter input in the popover.
     * @default true
     */
    filterable?: boolean;

    /**
     * Dark mode — required for portaled popover to render in dark theme.
     * @default false
     */
    dark?: boolean;

    /**
     * Custom trigger element. If provided, `buttonProps`, `placeholder`, and the default
     * Button trigger are not used.
     */
    children?: ReactNode;

    /** Additional CSS class on the root element. */
    className?: string;
}

/* ============================================================
 * TimezoneSelect component
 * ============================================================ */

/**
 * TimezoneSelect — a filterable Select for picking an IANA timezone.
 *
 * Renders a trigger button (default) or custom children that open a filterable
 * popover list of timezone items. Each item shows the city/region label and its
 * UTC offset.
 *
 * @example
 * ```tsx
 * const [tz, setTz] = useState("America/New_York");
 * <TimezoneSelect value={tz} onChange={setTz} dark={dark} />
 * ```
 */
export function TimezoneSelect({
    value,
    defaultValue,
    onChange,
    date: dateProp,
    showLocalTimezone = false,
    disabled = false,
    fill = false,
    placeholder = "Select timezone...",
    buttonProps,
    inputProps,
    popoverProps,
    filterable = true,
    dark = false,
    children,
    className,
}: TimezoneSelectProps) {
    // Controlled/uncontrolled value
    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = useState<string | undefined>(defaultValue);
    const selectedIana = isControlled ? value : internalValue;

    // The date for offset computation; default to now
    const date = useMemo(() => dateProp ?? new Date(), [dateProp]);

    // All timezone items with computed offsets
    const allItems = useMemo(() => buildTimezoneItems(date), [date]);

    // Initial (empty-query) items — Blueprint's "minimal" subset + optional local timezone
    const initialItems = useMemo(() => {
        // Map over MINIMAL_IANA_CODES (not filter allItems) so the order matches Blueprint's
        // MINIMAL_TIMEZONE_ITEMS exactly, not allItems' geographic order.
        const minimalItems = MINIMAL_IANA_CODES.map((code) =>
            allItems.find((tz) => tz.ianaCode === code),
        ).filter((tz): tz is TimezoneItem => tz != null);
        if (!showLocalTimezone) return minimalItems;
        // Detect local timezone
        let localIana: string | undefined;
        try {
            localIana = Intl.DateTimeFormat().resolvedOptions().timeZone;
        } catch {
            localIana = undefined;
        }
        if (!localIana) return minimalItems;
        const localItem = allItems.find((tz) => tz.ianaCode === localIana);
        if (!localItem) return minimalItems;
        // Blueprint shows local as "Current timezone" longName, placed first
        const localAsFirst: TimezoneItem = { ...localItem, longName: "Current timezone" };
        return [localAsFirst, ...minimalItems.filter((tz) => tz.ianaCode !== localIana)];
    }, [allItems, showLocalTimezone]);

    // Track query to know whether to show full list or minimal list
    const [query, setQuery] = useState("");

    const items = query ? allItems : initialItems;

    const selectedItem = useMemo(
        () => (selectedIana ? allItems.find((tz) => tz.ianaCode === selectedIana) ?? null : null),
        [selectedIana, allItems],
    );

    const handleItemSelect = useCallback(
        (item: TimezoneItem) => {
            if (!isControlled) {
                setInternalValue(item.ianaCode);
            }
            onChange?.(item.ianaCode);
        },
        [isControlled, onChange],
    );

    const handleQueryChange = useCallback((q: string) => {
        setQuery(q);
    }, []);

    // The trigger button (default, unless custom children are provided)
    const triggerButton = children ?? (
        <Button
            endIcon={<Icon icon="caret-down" size={16} />}
            disabled={disabled}
            fill={fill}
            {...buttonProps}
        >
            {selectedItem ? (
                formatComposite(selectedItem)
            ) : (
                <span className="text-foreground-muted">{placeholder}</span>
            )}
        </Button>
    );

    return (
        <Select<TimezoneItem>
            items={items}
            itemListPredicate={filterable ? filterTimezones : undefined}
            itemRenderer={(item, { modifiers, handleClick }) => (
                <MenuItem
                    key={item.ianaCode}
                    text={`${item.label}, ${item.longName}`}
                    label={item.shortName}
                    active={modifiers.active}
                    disabled={modifiers.disabled}
                    onClick={handleClick}
                />
            )}
            onItemSelect={handleItemSelect}
            selectedItem={selectedItem}
            onQueryChange={handleQueryChange}
            filterable={filterable}
            placeholder="Search for timezones..."
            disabled={disabled}
            fill={fill}
            resetOnClose
            resetOnSelect
            noResults={<MenuItem disabled text="No matching timezones." />}
            inputProps={inputProps}
            popoverProps={popoverProps as SelectProps<TimezoneItem>["popoverProps"]}
            dark={dark}
            className={className}
        >
            {triggerButton}
        </Select>
    );
}

TimezoneSelect.displayName = "TimezoneSelect";

/* ============================================================
 * Export the timezone data utilities for gallery/testing use
 * ============================================================ */

export { buildTimezoneItems, formatComposite, MINIMAL_IANA_CODES, type TimezoneItem as TimezoneItemType };
