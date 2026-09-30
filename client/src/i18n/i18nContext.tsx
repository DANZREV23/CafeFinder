// client/src/i18n/i18nContext.tsx
import * as React from "react";
import { enPH, Translations } from "./locales/en-PH";

type Locale = "en-PH";

interface I18nContextType {
  locale: Locale;
  timezone: string;
  t: (key: string, params?: Record<string, string | number>) => string;
  setLocale: (locale: Locale) => void;
  setTimezone: (timezone: string) => void;
  formatDate: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatTime: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatRelativeTime: (date: Date | string | number) => string;
  formatCurrency: (amount: number, currency?: string) => string;
  formatNumber: (num: number, options?: Intl.NumberFormatOptions) => string;
}

const I18nContext = React.createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = React.useState<Locale>("en-PH");
  const [timezone, setTimezone] = React.useState<string>("Asia/Manila");

  const t = React.useCallback((key: string, params?: Record<string, string | number>) => {
    const keys = key.split(".");
    let value: any = enPH;

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }

    if (typeof value !== "string") {
      console.warn(`Translation key is not a string: ${key}`);
      return key;
    }

    if (params) {
      return Object.entries(params).reduce((acc, [k, v]) => {
        return acc.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
      }, value);
    }

    return value;
  }, [locale]);

  const formatDate = React.useCallback((date: Date | string | number, options?: Intl.DateTimeFormatOptions) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat(locale, {
      timeZone: timezone,
      ...options
    }).format(d);
  }, [locale, timezone]);

  const formatTime = React.useCallback((date: Date | string | number, options?: Intl.DateTimeFormatOptions) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat(locale, {
      timeZone: timezone,
      hour: 'numeric',
      minute: 'numeric',
      ...options
    }).format(d);
  }, [locale, timezone]);

  const formatRelativeTime = React.useCallback((date: Date | string | number) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    
    const now = new Date();
    const diffInSeconds = Math.floor((d.getTime() - now.getTime()) / 1000);
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

    if (Math.abs(diffInSeconds) < 60) return rtf.format(diffInSeconds, 'second');
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (Math.abs(diffInMinutes) < 60) return rtf.format(diffInMinutes, 'minute');
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (Math.abs(diffInHours) < 24) return rtf.format(diffInHours, 'hour');
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (Math.abs(diffInDays) < 30) return rtf.format(diffInDays, 'day');
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (Math.abs(diffInMonths) < 12) return rtf.format(diffInMonths, 'month');
    
    return rtf.format(Math.floor(diffInDays / 365), 'year');
  }, [locale]);

  const formatCurrency = React.useCallback((amount: number, currency: string = "PHP") => {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(amount);
  }, [locale]);

  const formatNumber = React.useCallback((num: number, options?: Intl.NumberFormatOptions) => {
    return new Intl.NumberFormat(locale, options).format(num);
  }, [locale]);

  const value = React.useMemo(() => ({
    locale,
    timezone,
    t,
    setLocale,
    setTimezone,
    formatDate,
    formatTime,
    formatRelativeTime,
    formatCurrency,
    formatNumber,
  }), [locale, timezone, t, formatDate, formatTime, formatRelativeTime, formatCurrency, formatNumber]);

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = React.useContext(I18nContext);
  if (context === undefined) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
