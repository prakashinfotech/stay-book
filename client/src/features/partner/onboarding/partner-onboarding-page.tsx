import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { propertiesApi } from '../../../api/properties.api';
import { partnerApi } from '../../../api/partner.api';
import { getApiError } from '../../../utils/error';
import PartnerLayout from '../partner-layout';

// ── Types ─────────────────────────────────────────────────────────────────────

type WizardPhase = 'CATEGORY' | 'SUBCATEGORY' | 'WIZARD';

interface BedRow { roomLabel: string; bedType: string; count: number }
interface PhotoRow { url: string; tag: string }

interface WizardState {
  // Pre-wizard
  propertyCategory: string;
  propertySubCategory: string;
  // Step 1
  isListedElsewhere: boolean | null;
  name: string;
  address: string;
  city: string;
  stateName: string;
  postcode: string;
  category: string;
  starRating: number;
  // Step 2
  roomTypeName: string;
  maxOccupancy: number;
  bedrooms: number;
  livingRooms: number;
  bathrooms: number;
  beds: BedRow[];
  amenities: string[];
  breakfast: 'INCLUDED' | 'EXTRA_CHARGE' | 'NOT_OFFERED';
  description: string;
  bookingMode: 'INSTANT' | 'REQUEST';
  // Step 3
  imageUrls: PhotoRow[];
  // Step 4
  basePrice: string;
  nonRefundable: boolean;
  weeklyDiscount: boolean;
  allowLongStays: boolean;
  availabilitySync: 'MANUAL' | 'ICAL' | 'CHANNEL_MANAGER';
  // Step 5
  entityType: 'INDIVIDUAL' | 'BUSINESS';
  legalFirstName: string;
  legalLastName: string;
  dob: string;
  phone: string;
  gstRegistered: boolean;
  gstNumber: string;
  pan: string;
  aadhaar: string;
  // Step 6
  contractFirstName: string;
  contractLastName: string;
  contractPhone: string;
  contractAddress: string;
  listingAs: 'INDIVIDUAL' | 'BUSINESS';
  certify: boolean;
}

const INITIAL: WizardState = {
  propertyCategory: '', propertySubCategory: '',
  isListedElsewhere: null,
  name: '', address: '', city: '', stateName: '', postcode: '',
  category: 'HOTEL', starRating: 3,
  bedrooms: 1, livingRooms: 1, bathrooms: 1,
  beds: [{ roomLabel: 'Bedroom 1', bedType: 'Double', count: 1 }],
  roomTypeName: 'Standard Room', maxOccupancy: 2,
  amenities: [], breakfast: 'NOT_OFFERED', description: '', bookingMode: 'INSTANT',
  imageUrls: [{ url: '', tag: 'Exterior' }],
  basePrice: '', nonRefundable: false, weeklyDiscount: false,
  allowLongStays: false, availabilitySync: 'MANUAL',
  entityType: 'INDIVIDUAL', legalFirstName: '', legalLastName: '',
  dob: '', phone: '', gstRegistered: false, gstNumber: '', pan: '', aadhaar: '',
  contractFirstName: '', contractLastName: '', contractPhone: '',
  contractAddress: '', listingAs: 'INDIVIDUAL', certify: false,
};

// ── Constants ─────────────────────────────────────────────────────────────────

const STEPS = ['Basic Info', 'Property Setup', 'Photos', 'Pricing', 'Legal', 'Review'];

const ROOM_TYPE_OPTIONS = [
  'Standard Room', 'Deluxe Room', 'Suite', 'Single Room', 'Double Room',
  'Twin Room', 'Family Room', 'Studio', 'Executive Room', 'Penthouse',
];

const AMENITY_LIST = [
  'WiFi', 'Parking', 'AC', 'Pool', 'Kitchen', 'Gym', 'Elevator', 'Breakfast',
  'TV', 'Washer', 'Dryer', 'Safe', 'Balcony', 'Garden',
];

const BED_TYPES = ['Double', 'Twin', 'Single', 'King', 'Sofa bed', 'Bunk'];

const PHOTO_TAGS = ['Exterior', 'Living Room', 'Bedroom', 'Bathroom', 'Kitchen', 'Other'];

const SELECT_CLS = 'w-full rounded-xl border border-line px-4 py-2.5 pr-10 text-sm text-ink focus:outline-none focus:border-primary-600 appearance-none bg-surface transition-colors';
const SELECT_COMPACT_CLS = 'rounded-lg border border-line px-2 py-1.5 pr-8 text-sm text-ink focus:outline-none focus:border-primary-600 appearance-none bg-surface transition-colors';

const SUBCATEGORY_MAP: Record<string, { label: string; icon: string }[]> = {
  APARTMENT: [
    { label: 'One apartment', icon: '🏢' },
    { label: 'Multiple apartments', icon: '🏙' },
  ],
  HOME: [
    { label: 'One home / villa', icon: '🏠' },
    { label: 'Multiple homes', icon: '🏘' },
  ],
  HOTEL: [
    { label: 'Hotel', icon: '🏨' },
    { label: 'Guesthouse / B&B', icon: '🛏' },
  ],
  ALTERNATIVE: [
    { label: 'Cabin', icon: '🏕' },
    { label: 'Houseboat', icon: '⛵' },
    { label: 'Other', icon: '✨' },
  ],
};

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh','Puducherry',
];

// ── Shared sub-components ─────────────────────────────────────────────────────

function FieldRow({ label, hint, error, children }: {
  label: string; hint?: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink mb-1">{label}</label>
      {hint && <p className="text-xs text-muted/70 mb-1.5">{hint}</p>}
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = 'text', maxLength }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
  type?: string; maxLength?: number;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      className="w-full rounded-xl border border-line px-4 py-2.5 text-sm text-ink placeholder-muted/70 focus:outline-none focus:border-primary-600 transition-colors"
    />
  );
}

function Stepper({ value, onChange, min = 0, max = 20 }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-8 h-8 rounded-full border border-line flex items-center justify-center text-muted hover:border-primary-600 hover:text-primary-600 transition-colors text-lg font-bold disabled:opacity-30"
        disabled={value <= min}
      >−</button>
      <span className="w-6 text-center text-sm font-semibold text-ink">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-8 h-8 rounded-full border border-line flex items-center justify-center text-muted hover:border-primary-600 hover:text-primary-600 transition-colors text-lg font-bold disabled:opacity-30"
        disabled={value >= max}
      >+</button>
    </div>
  );
}

function Toggle({ checked, onChange, label, description }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; description?: string;
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-line hover:border-line transition-colors">
      <div>
        <p className="text-sm font-medium text-ink">{label}</p>
        {description && <p className="text-xs text-muted mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-primary-600' : 'bg-gray-200'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-surface rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}

function SelectWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
        <svg className="w-4 h-4 text-muted/70" viewBox="0 0 20 20" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m6 8 4 4 4-4" />
        </svg>
      </span>
    </div>
  );
}

function AlertModal({ type, message, onClose }: {
  type: 'error' | 'success'; message: string; onClose: () => void;
}) {
  const isSuccess = type === 'success';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-sm rounded-2xl bg-surface shadow-2xl p-6 text-center">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isSuccess ? 'bg-green-100' : 'bg-red-100'}`}>
          <span className="text-3xl">{isSuccess ? '🎉' : '⚠️'}</span>
        </div>
        <p className={`text-base font-bold mb-1 ${isSuccess ? 'text-green-800' : 'text-red-700'}`}>
          {isSuccess ? 'All done!' : 'Hold on'}
        </p>
        <p className="text-sm text-muted mb-5">{message}</p>
        <button
          onClick={onClose}
          className={`w-full py-2.5 rounded-xl text-sm font-bold transition-colors ${
            isSuccess ? 'bg-primary-600 text-white hover:bg-primary-700' : 'bg-red-600 text-white hover:bg-red-700'
          }`}
        >
          {isSuccess ? 'Go to Dashboard →' : 'OK, let me fix it'}
        </button>
      </div>
    </div>
  );
}

// ── Phase A: Category Selection ───────────────────────────────────────────────

const CATEGORIES = [
  { id: 'APARTMENT', icon: '🏢', label: 'Apartment', desc: 'A self-contained flat or unit' },
  { id: 'HOME',      icon: '🏠', label: 'Home / Villa', desc: 'A standalone house or villa' },
  { id: 'HOTEL',     icon: '🏨', label: 'Hotel / B&B', desc: 'A commercial accommodation' },
  { id: 'ALTERNATIVE', icon: '🏕', label: 'Alternative', desc: 'Cabin, houseboat, tent, etc.' },
];

function CategoryScreen({ onSelect }: { onSelect: (cat: string) => void }) {
  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">What type of property are you listing?</h1>
        <p className="text-muted mt-2">Choose the option that best describes your property.</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelect(cat.id)}
            className="text-left p-6 rounded-2xl border-2 border-line hover:border-primary-600 hover:bg-primary-500/10/30 transition-all group"
          >
            <div className="text-4xl mb-3">{cat.icon}</div>
            <p className="text-base font-bold text-ink group-hover:text-primary-600">{cat.label}</p>
            <p className="text-sm text-muted mt-1">{cat.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Phase B: Sub-Category Selection ──────────────────────────────────────────

function SubCategoryScreen({
  category, onSelect, onBack,
}: { category: string; onSelect: (sub: string) => void; onBack: () => void }) {
  const options = SUBCATEGORY_MAP[category] ?? [];
  const cat = CATEGORIES.find(c => c.id === category);
  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <button onClick={onBack} className="text-sm text-muted hover:text-ink mb-4 flex items-center gap-1">
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Which best describes your {cat?.label}?</h1>
        <p className="text-muted mt-2">Be as accurate as possible — guests will see this.</p>
      </div>
      <div className="space-y-3">
        {options.map(opt => (
          <button
            key={opt.label}
            type="button"
            onClick={() => onSelect(opt.label)}
            className="w-full text-left p-5 rounded-2xl border-2 border-line hover:border-primary-600 hover:bg-primary-500/10/30 transition-all flex items-center gap-4 group"
          >
            <span className="text-3xl">{opt.icon}</span>
            <span className="text-base font-semibold text-ink group-hover:text-primary-600">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Step 1: Basic Info ────────────────────────────────────────────────────────

function Step1({ s, set, errors }: {
  s: WizardState;
  set: (p: Partial<WizardState>) => void;
  errors: Partial<Record<string, string>>;
}) {
  return (
    <div className="space-y-5">
      {/* Cross-listing check */}
      <div className="p-4 rounded-xl bg-primary-500/10 border border-primary-500/30">
        <p className="text-sm font-medium text-ink mb-3">
          Is your property already listed on Airbnb, Vrbo, or similar platforms?
        </p>
        <div className="flex gap-4">
          {[{ val: false, label: 'No, this is my first listing' }, { val: true, label: 'Yes, it is listed elsewhere' }].map(opt => (
            <label key={String(opt.val)} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="isListedElsewhere"
                checked={s.isListedElsewhere === opt.val}
                onChange={() => set({ isListedElsewhere: opt.val })}
                className="accent-primary-600"
              />
              <span className="text-sm text-ink">{opt.label}</span>
            </label>
          ))}
        </div>
        {s.isListedElsewhere && (
          <p className="text-xs text-primary-600 mt-2">
            You can sync your calendar via iCal in the Pricing step to prevent double-bookings.
          </p>
        )}
      </div>

      <FieldRow label="Property name *" error={errors.name}>
        <TextInput value={s.name} onChange={v => set({ name: v })} placeholder="e.g. The Grand Manali Retreat" />
      </FieldRow>

      <FieldRow label="Street address *" error={errors.address}>
        <TextInput value={s.address} onChange={v => set({ address: v })} placeholder="Full street address" />
      </FieldRow>

      <div className="grid grid-cols-3 gap-3">
        <FieldRow label="City *" error={errors.city}>
          <TextInput value={s.city} onChange={v => set({ city: v })} placeholder="City" />
        </FieldRow>
        <FieldRow label="State">
          <SelectWrapper>
            <select
              value={s.stateName}
              onChange={e => set({ stateName: e.target.value })}
              className={SELECT_CLS}
            >
              <option value="">Select state</option>
              {INDIAN_STATES.map(st => <option key={st} value={st}>{st}</option>)}
            </select>
          </SelectWrapper>
        </FieldRow>
        <FieldRow label="Postcode">
          <TextInput value={s.postcode} onChange={v => set({ postcode: v })} placeholder="6-digit" maxLength={6} />
        </FieldRow>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FieldRow label="Category *">
          <SelectWrapper>
            <select
              value={s.category}
              onChange={e => set({ category: e.target.value })}
              className={SELECT_CLS}
            >
              {['HOTEL', 'APARTMENT', 'VILLA', 'HOSTEL', 'OTHER'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </SelectWrapper>
        </FieldRow>
        <FieldRow label="Star rating">
          <SelectWrapper>
            <select
              value={s.starRating}
              onChange={e => set({ starRating: Number(e.target.value) })}
              className={SELECT_CLS}
            >
              {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} star{n !== 1 ? 's' : ''}</option>)}
            </select>
          </SelectWrapper>
        </FieldRow>
      </div>
    </div>
  );
}

// ── Step 2: Property Setup ────────────────────────────────────────────────────

function Step2({ s, set, errors }: {
  s: WizardState;
  set: (p: Partial<WizardState>) => void;
  errors: Partial<Record<string, string>>;
}) {
  const toggleAmenity = (a: string) => {
    set({ amenities: s.amenities.includes(a) ? s.amenities.filter(x => x !== a) : [...s.amenities, a] });
  };

  const updateBed = (i: number, patch: Partial<BedRow>) => {
    const next = [...s.beds];
    next[i] = { ...next[i], ...patch };
    set({ beds: next });
  };

  const addBedRow = () => {
    const idx = s.beds.length + 1;
    set({ beds: [...s.beds, { roomLabel: `Bedroom ${idx}`, bedType: 'Single', count: 1 }] });
  };

  const removeBedRow = (i: number) => set({ beds: s.beds.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-6">
      {/* Room type identity — required */}
      <div className="p-4 rounded-xl bg-primary-500/10 border border-primary-500/30 space-y-4">
        <p className="text-sm font-semibold text-primary-600">Primary room type <span className="text-red-500">*</span></p>
        <div className="grid grid-cols-2 gap-4">
          <FieldRow label="Room type *" error={errors.roomTypeName}>
            <SelectWrapper>
              <select
                value={s.roomTypeName}
                onChange={e => set({ roomTypeName: e.target.value })}
                className={SELECT_CLS}
              >
                <option value="">— Select room type —</option>
                {ROOM_TYPE_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </SelectWrapper>
          </FieldRow>
          <FieldRow label="Max guests *" hint="Total guests this room can accommodate">
            <Stepper value={s.maxOccupancy} onChange={v => set({ maxOccupancy: v })} min={1} max={20} />
          </FieldRow>
        </div>
      </div>

      {/* Room counts */}
      <div>
        <p className="text-sm font-semibold text-ink mb-3">Room configuration</p>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Bedrooms', key: 'bedrooms' as const },
            { label: 'Living rooms', key: 'livingRooms' as const },
            { label: 'Bathrooms', key: 'bathrooms' as const },
          ].map(({ label, key }) => (
            <div key={key} className="p-4 rounded-xl border border-line text-center">
              <p className="text-xs text-muted mb-3">{label}</p>
              <Stepper value={s[key]} onChange={v => set({ [key]: v })} min={1} />
            </div>
          ))}
        </div>
      </div>

      {/* Bed configuration */}
      <div>
        <p className="text-sm font-semibold text-ink mb-3">Bed setup</p>
        <div className="space-y-2">
          {s.beds.map((bed, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-line bg-surface-elev">
              <input
                type="text"
                value={bed.roomLabel}
                onChange={e => updateBed(i, { roomLabel: e.target.value })}
                className="flex-1 min-w-0 bg-transparent text-sm text-ink font-medium focus:outline-none border-b border-dashed border-line focus:border-primary-600"
              />
              <SelectWrapper>
                <select
                  value={bed.bedType}
                  onChange={e => updateBed(i, { bedType: e.target.value })}
                  className={SELECT_COMPACT_CLS}
                >
                  {BED_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </SelectWrapper>
              <Stepper value={bed.count} onChange={v => updateBed(i, { count: v })} min={1} max={10} />
              {s.beds.length > 1 && (
                <button type="button" onClick={() => removeBedRow(i)} className="text-red-400 hover:text-red-600 text-lg px-1">×</button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addBedRow}
          className="mt-2 text-sm text-primary-600 hover:underline font-medium"
        >
          + Add bed type
        </button>
      </div>

      {/* Amenities */}
      <div>
        <p className="text-sm font-semibold text-ink mb-3">Amenities</p>
        <div className="flex flex-wrap gap-2">
          {AMENITY_LIST.map(a => (
            <button
              key={a}
              type="button"
              onClick={() => toggleAmenity(a)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                s.amenities.includes(a)
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-surface text-ink border-line hover:border-primary-600'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Breakfast */}
      <FieldRow label="Breakfast & dining">
        <div className="space-y-2">
          {[
            { val: 'INCLUDED', label: 'Breakfast included in room price' },
            { val: 'EXTRA_CHARGE', label: 'Breakfast available at extra charge' },
            { val: 'NOT_OFFERED', label: 'Breakfast not offered' },
          ].map(opt => (
            <label key={opt.val} className="flex items-center gap-3 p-3 rounded-xl border border-line cursor-pointer hover:border-primary-600 transition-colors">
              <input
                type="radio"
                name="breakfast"
                value={opt.val}
                checked={s.breakfast === opt.val}
                onChange={() => set({ breakfast: opt.val as WizardState['breakfast'] })}
                className="accent-primary-600"
              />
              <span className="text-sm text-ink">{opt.label}</span>
            </label>
          ))}
        </div>
      </FieldRow>

      {/* Description */}
      <FieldRow label="Description">
        <textarea
          value={s.description}
          onChange={e => set({ description: e.target.value })}
          rows={3}
          maxLength={2000}
          placeholder="Describe your property — what makes it special?"
          className="w-full rounded-xl border border-line px-4 py-2.5 text-sm text-ink placeholder-muted/70 focus:outline-none focus:border-primary-600 resize-none"
        />
      </FieldRow>
    </div>
  );
}

// ── Step 3: Photos ────────────────────────────────────────────────────────────

function isUnsplashPageUrl(url: string): boolean {
  return /^https?:\/\/unsplash\.com\/photos\//i.test(url.trim());
}

function isValidIndianPhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone.replace(/\s/g, ''));
}

function PhotoRow_({ photo, index, total, onUpdate, onRemove }: {
  photo: PhotoRow; index: number; total: number;
  onUpdate: (patch: Partial<PhotoRow>) => void;
  onRemove: () => void;
}) {
  const url = photo.url.trim();
  const isPageUrl = isUnsplashPageUrl(url);

  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <input
          type="text"
          value={photo.url}
          onChange={e => onUpdate({ url: e.target.value })}
          placeholder={`Photo ${index + 1} — direct image URL (https://images.unsplash.com/...)`}
          className={`flex-1 rounded-xl border px-4 py-2.5 text-sm text-ink placeholder-muted/70 focus:outline-none transition-colors ${
            isPageUrl ? 'border-orange-400 focus:border-orange-500' : 'border-line focus:border-primary-600'
          }`}
        />
        <SelectWrapper>
          <select
            value={photo.tag}
            onChange={e => onUpdate({ tag: e.target.value })}
            className="rounded-xl border border-line px-3 py-2.5 pr-9 text-sm text-ink focus:outline-none focus:border-primary-600 appearance-none bg-surface transition-colors"
          >
            {PHOTO_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </SelectWrapper>
        {total > 1 && (
          <button type="button" onClick={onRemove} className="shrink-0 text-red-400 hover:text-red-600 px-2 text-lg">×</button>
        )}
      </div>

      {/* Unsplash page URL warning */}
      {isPageUrl && (
        <div className="flex items-start gap-2 text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
          <span className="shrink-0 mt-0.5">⚠</span>
          <span>
            This looks like an Unsplash <em>page</em> URL, not a direct image URL. Open the photo on Unsplash, right-click the image → "Copy image address" and paste that instead. Direct URLs start with <strong>https://images.unsplash.com/</strong>.
          </span>
        </div>
      )}

      {/* Preview */}
      {url && !isPageUrl && (
        <div className="relative">
          <img
            src={url}
            alt={`preview ${index + 1}`}
            className="w-full h-32 object-cover rounded-xl border border-line"
            style={{ display: 'none' }}
            onLoad={e => {
              const el = e.target as HTMLImageElement;
              el.style.display = 'block';
              const sib = el.nextElementSibling as HTMLElement | null;
              if (sib) sib.style.display = 'none';
            }}
            onError={e => {
              const el = e.target as HTMLImageElement;
              el.style.display = 'none';
              const sib = el.nextElementSibling as HTMLElement | null;
              if (sib) sib.style.display = 'flex';
            }}
          />
          {/* Load-fail placeholder */}
          <div
            className="w-full h-32 rounded-xl border border-red-200 bg-red-50 items-center justify-center flex-col gap-1 hidden"
          >
            <span className="text-red-400 text-2xl">🖼</span>
            <span className="text-xs text-red-500 font-medium">Image failed to load — check the URL</span>
          </div>
        </div>
      )}
    </div>
  );
}

function Step3({ s, set, errors }: {
  s: WizardState;
  set: (p: Partial<WizardState>) => void;
  errors: Partial<Record<string, string>>;
}) {
  const update = (i: number, patch: Partial<PhotoRow>) => {
    const next = [...s.imageUrls]; next[i] = { ...next[i], ...patch }; set({ imageUrls: next });
  };
  const addRow  = () => set({ imageUrls: [...s.imageUrls, { url: '', tag: 'Other' }] });
  const removeRow = (i: number) => set({ imageUrls: s.imageUrls.filter((_, idx) => idx !== i) });
  const filled = s.imageUrls.filter(p => p.url.trim() && !isUnsplashPageUrl(p.url)).length;

  return (
    <div className="space-y-4">
      <div className="bg-primary-500/10 border border-primary-500/30 rounded-xl p-4">
        <p className="text-sm font-semibold text-primary-700 mb-2">📷 Use direct image URLs</p>
        <ul className="text-xs text-primary-600 space-y-1">
          <li>✅ <strong>Picsum (free, always works):</strong> <code className="bg-primary-500/15 px-1 rounded">https://picsum.photos/seed/room1/800/600</code></li>
          <li>✅ <strong>Unsplash direct:</strong> <code className="bg-primary-500/15 px-1 rounded">https://images.unsplash.com/photo-ID?w=800&h=600&fit=crop</code></li>
          <li>✅ Any direct .jpg / .png / .webp URL</li>
          <li>❌ <strong>Unsplash page URL</strong> <code className="bg-primary-500/15 px-1 rounded">unsplash.com/photos/...</code> — right-click the photo and choose "Copy image address" instead</li>
        </ul>
      </div>

      {s.imageUrls.map((photo, i) => (
        <PhotoRow_
          key={i}
          photo={photo}
          index={i}
          total={s.imageUrls.length}
          onUpdate={patch => update(i, patch)}
          onRemove={() => removeRow(i)}
        />
      ))}

      <button type="button" onClick={addRow} className="text-sm text-primary-600 hover:underline font-medium">
        + Add another photo
      </button>

      <p className={`text-xs font-medium ${filled < 1 ? 'text-orange-500' : 'text-green-600'}`}>
        {filled} photo{filled !== 1 ? 's' : ''} added {filled >= 1 ? '✓' : '— add at least 1'}
      </p>

      {errors.imageUrls && (
        <p className="text-xs text-red-500 font-medium">{errors.imageUrls}</p>
      )}
    </div>
  );
}

// ── Step 4: Pricing & Calendar ────────────────────────────────────────────────

function Step4({ s, set, errors }: {
  s: WizardState;
  set: (p: Partial<WizardState>) => void;
  errors: Partial<Record<string, string>>;
}) {
  return (
    <div className="space-y-6">
      {/* Booking mode */}
      <div>
        <p className="text-sm font-semibold text-ink mb-3">Booking mode</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { val: 'INSTANT', label: 'Instant booking', desc: 'Guests book instantly without waiting for approval.', recommended: true },
            { val: 'REQUEST', label: 'Request to book', desc: 'You review and approve each booking request.' },
          ].map(opt => (
            <label
              key={opt.val}
              className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                s.bookingMode === opt.val ? 'border-primary-600 bg-primary-500/10/40' : 'border-line hover:border-line'
              }`}
            >
              <input
                type="radio"
                name="bookingMode"
                value={opt.val}
                checked={s.bookingMode === opt.val}
                onChange={() => set({ bookingMode: opt.val as WizardState['bookingMode'] })}
                className="sr-only"
              />
              {opt.recommended && (
                <span className="absolute top-2 right-2 text-[10px] font-bold bg-accent-500 text-gray-900 px-2 py-0.5 rounded-full">
                  Recommended
                </span>
              )}
              <p className="text-sm font-semibold text-ink">{opt.label}</p>
              <p className="text-xs text-muted mt-1">{opt.desc}</p>
            </label>
          ))}
        </div>
      </div>

      {/* Base price */}
      <FieldRow label="Base price per night *" error={errors.basePrice}>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted">₹</span>
          <input
            type="number"
            min={0}
            value={s.basePrice}
            onChange={e => set({ basePrice: e.target.value })}
            placeholder="e.g. 2500"
            className="w-full rounded-xl border border-line pl-8 pr-4 py-2.5 text-sm text-ink placeholder-muted/70 focus:outline-none focus:border-primary-600 transition-colors"
          />
        </div>
      </FieldRow>

      {/* Rate plans */}
      <div>
        <p className="text-sm font-semibold text-ink mb-3">Rate plans</p>
        <div className="space-y-3">
          {/* Standard — always on */}
          <div className="p-4 rounded-xl border border-line bg-surface-elev">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-ink">Standard rate</p>
                <p className="text-xs text-muted mt-0.5">Flexible — free cancellation up to 1 day before check-in</p>
              </div>
              <span className="text-xs font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">Always active</span>
            </div>
          </div>

          <Toggle
            checked={s.nonRefundable}
            onChange={v => set({ nonRefundable: v })}
            label="Non-refundable rate (−10%)"
            description="Guests get a 10% discount and cannot cancel. Boosts conversion for price-sensitive guests."
          />

          <Toggle
            checked={s.weeklyDiscount}
            onChange={v => set({ weeklyDiscount: v })}
            label="Weekly stays rate (−15%)"
            description="Guests staying 7+ nights get a 15% discount. Encourages longer bookings."
          />
        </div>
      </div>

      {/* Long stays */}
      <Toggle
        checked={s.allowLongStays}
        onChange={v => set({ allowLongStays: v })}
        label="Allow stays exceeding 30 nights"
        description="Enable this to appear in long-stay searches (digital nomads, extended business trips)."
      />

      {/* Availability sync */}
      <FieldRow label="Availability sync">
        <div className="space-y-2">
          {[
            { val: 'MANUAL', label: 'Manage dates manually', desc: 'Block/unblock dates yourself in the Availability tab.' },
            { val: 'ICAL', label: 'Connect via iCal link', desc: 'Paste your Airbnb / Vrbo iCal URL to sync calendars automatically.' },
            { val: 'CHANNEL_MANAGER', label: 'Connect a channel manager', desc: 'Use a third-party channel manager to sync all platforms.' },
          ].map(opt => (
            <label key={opt.val} className="flex items-start gap-3 p-3 rounded-xl border border-line cursor-pointer hover:border-primary-600 transition-colors">
              <input
                type="radio"
                name="availabilitySync"
                value={opt.val}
                checked={s.availabilitySync === opt.val}
                onChange={() => set({ availabilitySync: opt.val as WizardState['availabilitySync'] })}
                className="mt-0.5 accent-primary-600"
              />
              <div>
                <p className="text-sm font-medium text-ink">{opt.label}</p>
                <p className="text-xs text-muted">{opt.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </FieldRow>
    </div>
  );
}

// ── Step 5: Legal Info ────────────────────────────────────────────────────────

function Step5({ s, set }: { s: WizardState; set: (p: Partial<WizardState>) => void }) {
  return (
    <div className="space-y-5">
      <div className="p-3 bg-primary-500/10 border border-primary-500/30 rounded-xl text-xs text-primary-600">
        KYC information is required for regulatory compliance. All data is encrypted at rest and never shared publicly.
      </div>

      {/* Entity type */}
      <FieldRow label="Ownership type">
        <div className="grid grid-cols-2 gap-3">
          {[
            { val: 'INDIVIDUAL', label: 'Individual', icon: '👤', desc: 'You own this property personally' },
            { val: 'BUSINESS', label: 'Business', icon: '🏢', desc: 'A company or registered entity owns it' },
          ].map(opt => (
            <label
              key={opt.val}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                s.entityType === opt.val ? 'border-primary-600 bg-primary-500/10/40' : 'border-line hover:border-line'
              }`}
            >
              <input
                type="radio"
                name="entityType"
                value={opt.val}
                checked={s.entityType === opt.val}
                onChange={() => set({ entityType: opt.val as WizardState['entityType'] })}
                className="sr-only"
              />
              <div className="text-2xl mb-1">{opt.icon}</div>
              <p className="text-sm font-semibold text-ink">{opt.label}</p>
              <p className="text-xs text-muted mt-0.5">{opt.desc}</p>
            </label>
          ))}
        </div>
      </FieldRow>

      {/* KYC */}
      <div>
        <p className="text-sm font-semibold text-ink mb-1">Owner verification</p>
        <p className="text-xs text-muted/70 mb-3">Required for all owners holding a ≥25% stake in the property.</p>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <FieldRow label="First name">
              <TextInput value={s.legalFirstName} onChange={v => set({ legalFirstName: v })} placeholder="Legal first name" />
            </FieldRow>
            <FieldRow label="Last name">
              <TextInput value={s.legalLastName} onChange={v => set({ legalLastName: v })} placeholder="Legal last name" />
            </FieldRow>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FieldRow label="Date of birth">
              <input
                type="date"
                value={s.dob}
                onChange={e => set({ dob: e.target.value })}
                max={new Date(Date.now() - 18 * 365.25 * 86400000).toISOString().split('T')[0]}
                className="w-full rounded-xl border border-line px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-primary-600 transition-colors"
              />
            </FieldRow>
            <FieldRow label="Phone number *">
              <TextInput
                value={s.phone}
                onChange={v => set({ phone: v.replace(/\D/g, '').slice(0, 10) })}
                placeholder="10-digit mobile"
                type="tel"
                maxLength={10}
              />
              <p className="text-xs text-muted/70 mt-1">10-digit mobile number</p>
            </FieldRow>
          </div>
        </div>
      </div>

      {/* India tax */}
      <div>
        <p className="text-sm font-semibold text-ink mb-3">India tax & compliance</p>
        <div className="space-y-3">
          {/* GST */}
          <FieldRow label="GST registration">
            <div className="flex gap-4">
              {[{ val: true, label: 'Yes, I am GST registered' }, { val: false, label: 'No' }].map(opt => (
                <label key={String(opt.val)} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gstRegistered"
                    checked={s.gstRegistered === opt.val}
                    onChange={() => set({ gstRegistered: opt.val })}
                    className="accent-primary-600"
                  />
                  <span className="text-sm text-ink">{opt.label}</span>
                </label>
              ))}
            </div>
          </FieldRow>
          {s.gstRegistered && (
            <FieldRow label="GST number" hint="15-character alphanumeric GST identification number">
              <TextInput
                value={s.gstNumber}
                onChange={v => set({ gstNumber: v.toUpperCase() })}
                placeholder="22AAAAA0000A1Z5"
                maxLength={15}
              />
            </FieldRow>
          )}

          {/* PAN */}
          <FieldRow label="PAN number" hint="10-character Permanent Account Number (e.g. ABCDE1234F)">
            <TextInput
              value={s.pan}
              onChange={v => set({ pan: v.toUpperCase() })}
              placeholder="ABCDE1234F"
              maxLength={10}
            />
          </FieldRow>

          {/* Aadhaar */}
          <FieldRow label="Aadhaar number" hint="12-digit Unique Identification Number">
            <TextInput
              value={s.aadhaar}
              onChange={v => set({ aadhaar: v.replace(/\D/g, '').slice(0, 12) })}
              placeholder="XXXX XXXX XXXX"
              type="text"
            />
            {s.aadhaar.length > 0 && s.aadhaar.length < 12 && (
              <p className="text-xs text-orange-500 mt-1">{s.aadhaar.length}/12 digits entered</p>
            )}
          </FieldRow>
        </div>
      </div>
    </div>
  );
}

// ── Step 6: Review & Complete ─────────────────────────────────────────────────

function Step6({
  s, set, onPublish, onDraft, isPending,
}: {
  s: WizardState;
  set: (p: Partial<WizardState>) => void;
  onPublish: () => void;
  onDraft: () => void;
  isPending: boolean;
}) {
  const Section = ({ title, items }: { title: string; items: [string, string][] }) => (
    <div>
      <h3 className="text-xs font-bold text-muted mb-2 uppercase tracking-widest">{title}</h3>
      <div className="bg-surface-elev rounded-xl p-4 space-y-2">
        {items.map(([k, v]) => (
          <div key={k} className="flex justify-between text-sm">
            <span className="text-muted shrink-0">{k}</span>
            <span className="text-ink font-medium text-right max-w-[60%] truncate">{v || '—'}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const phoneValid = s.contractPhone.trim() === '' || isValidIndianPhone(s.contractPhone);
  const canPublish = s.contractFirstName.trim() && s.contractPhone.trim() && isValidIndianPhone(s.contractPhone) && s.certify;

  return (
    <div className="space-y-6">
      {/* Summary sections */}
      <Section title="Basic Info" items={[
        ['Name', s.name],
        ['Address', `${s.address}, ${s.city}${s.stateName ? ', ' + s.stateName : ''}`],
        ['Type', `${s.propertyCategory} — ${s.propertySubCategory}`],
        ['Category', s.category],
        ['Stars', `${s.starRating} ★`],
      ]} />
      <Section title="Property Setup" items={[
        ['Rooms', `${s.bedrooms} bed · ${s.livingRooms} living · ${s.bathrooms} bath`],
        ['Beds', s.beds.map(b => `${b.count}× ${b.bedType}`).join(', ')],
        ['Amenities', s.amenities.join(', ') || 'None'],
        ['Breakfast', s.breakfast],
        ['Booking', s.bookingMode],
      ]} />
      <Section title="Pricing" items={[
        ['Base price', s.basePrice ? `₹${Number(s.basePrice).toLocaleString('en-IN')}/night` : ''],
        ['Non-refundable', s.nonRefundable ? 'Yes (−10%)' : 'No'],
        ['Weekly discount', s.weeklyDiscount ? 'Yes (−15%)' : 'No'],
        ['Long stays', s.allowLongStays ? 'Allowed' : 'Not allowed'],
        ['Calendar sync', s.availabilitySync],
      ]} />
      <Section title="Legal / KYC" items={[
        ['Entity', s.entityType],
        ['Owner', `${s.legalFirstName} ${s.legalLastName}`.trim()],
        ['Date of Birth', s.dob || '—'],
        ['Phone', s.phone || '—'],
        ['PAN', s.pan || '—'],
        ['Aadhaar', s.aadhaar || '—'],
        ['GST', s.gstRegistered ? (s.gstNumber || 'Yes') : 'Not registered'],
      ]} />

      {/* Contracting party */}
      <div>
        <h3 className="text-xs font-bold text-muted mb-2 uppercase tracking-widest">Contracting Party</h3>
        <div className="space-y-3 p-4 rounded-xl border border-line">
          <div className="grid grid-cols-2 gap-3">
            <FieldRow label="First name *">
              <TextInput value={s.contractFirstName} onChange={v => set({ contractFirstName: v })} placeholder="First name" />
            </FieldRow>
            <FieldRow label="Last name">
              <TextInput value={s.contractLastName} onChange={v => set({ contractLastName: v })} placeholder="Last name" />
            </FieldRow>
          </div>
          <FieldRow label="Contact phone *">
            <TextInput type="tel" value={s.contractPhone} onChange={v => set({ contractPhone: v })} placeholder="e.g. 9876543210" />
            {s.contractPhone.trim() && !phoneValid && (
              <p className="text-xs text-red-500 mt-1">Enter a valid Indian mobile number (10 digits, starting with 6–9)</p>
            )}
          </FieldRow>
          <FieldRow label="Primary residence address">
            <TextInput value={s.contractAddress} onChange={v => set({ contractAddress: v })} placeholder="Your home address" />
          </FieldRow>
        </div>
      </div>

      {/* Agreement */}
      <div>
        <h3 className="text-xs font-bold text-muted mb-2 uppercase tracking-widest">Agreement</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { val: 'INDIVIDUAL', label: 'I am listing as an Individual', icon: '👤' },
            { val: 'BUSINESS',   label: 'I am listing as a Business / Company', icon: '🏢' },
          ].map(opt => (
            <label
              key={opt.val}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                s.listingAs === opt.val ? 'border-primary-600 bg-primary-500/10/40' : 'border-line hover:border-line'
              }`}
            >
              <input
                type="radio"
                name="listingAs"
                value={opt.val}
                checked={s.listingAs === opt.val}
                onChange={() => set({ listingAs: opt.val as WizardState['listingAs'] })}
                className="sr-only"
              />
              <div className="text-xl mb-1">{opt.icon}</div>
              <p className="text-sm font-medium text-ink">{opt.label}</p>
            </label>
          ))}
        </div>
      </div>

      {/* Certification */}
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={s.certify}
          onChange={e => set({ certify: e.target.checked })}
          className="mt-0.5 accent-primary-600 w-4 h-4 shrink-0"
        />
        <span className="text-sm text-ink">
          I confirm that this is a legitimate property listing and that I have the authority to list it on StayBook. I agree to the{' '}
          <span className="text-primary-600 font-medium">Partner Terms & Conditions</span> and acknowledge the{' '}
          <strong>12% platform commission</strong>.
        </span>
      </label>

      {/* CTAs */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onDraft}
          disabled={isPending}
          className="flex-1 px-5 py-3 border border-line text-ink text-sm font-medium rounded-xl hover:border-gray-400 transition-colors disabled:opacity-60"
        >
          {isPending ? 'Saving…' : "I'm not ready — Save as draft"}
        </button>
        <button
          type="button"
          onClick={onPublish}
          disabled={!canPublish || isPending}
          title={!canPublish ? 'Fill contracting details and accept terms to publish' : undefined}
          className="flex-1 px-6 py-3 bg-accent-500 text-gray-900 text-sm font-bold rounded-xl hover:bg-accent-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Publishing…' : 'Open for bookings →'}
        </button>
      </div>
    </div>
  );
}

// ── Main wizard ───────────────────────────────────────────────────────────────

export default function PartnerOnboardingPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [phase, setPhase]         = useState<WizardPhase>('CATEGORY');
  const [step, setStep]           = useState(0);
  const [state, setState]         = useState<WizardState>(INITIAL);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({});
  const [alert, setAlert]         = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  const set = (patch: Partial<WizardState>) => {
    setState(s => ({ ...s, ...patch }));
    setFieldErrors(prev => {
      const cleared = { ...prev };
      Object.keys(patch).forEach(k => delete cleared[k]);
      return cleared;
    });
  };

  const validateStep = (): string | null => {
    if (step === 0) {
      const errs: Record<string, string> = {};
      if (!state.name.trim())    errs.name    = 'Property name is required';
      if (!state.address.trim()) errs.address = 'Street address is required';
      if (!state.city.trim())    errs.city    = 'City is required';
      if (Object.keys(errs).length) { setFieldErrors(errs); return errs.name ?? errs.address ?? errs.city ?? 'Please fix the errors above'; }
    }
    if (step === 1) {
      if (!state.roomTypeName.trim()) {
        setFieldErrors({ roomTypeName: 'Please select a room type' });
        return 'Please select a room type';
      }
    }
    if (step === 2) {
      const valid = state.imageUrls.filter(p => p.url.trim() && !isUnsplashPageUrl(p.url));
      if (valid.length < 1) {
        setFieldErrors({ imageUrls: 'Please add at least 1 valid direct image URL (Unsplash page links won\'t work)' });
        return 'Please add at least 1 valid direct image URL';
      }
    }
    if (step === 3) {
      if (!state.basePrice || Number(state.basePrice) <= 0) {
        setFieldErrors({ basePrice: 'Base price must be greater than 0' });
        return 'Base price must be greater than 0';
      }
    }
    return null;
  };

  const next = () => {
    const err = validateStep();
    if (err) { setAlert({ type: 'error', message: err }); return; }
    setStep(s => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const TAG_MAP: Record<string, 'EXTERIOR' | 'BEDROOM' | 'BATHROOM' | 'DINING' | 'COMMON'> = {
    Exterior: 'EXTERIOR', Bedroom: 'BEDROOM', Bathroom: 'BATHROOM',
    Kitchen: 'DINING', 'Living Room': 'COMMON', Other: 'COMMON',
  };

  const createMutation = useMutation({
    mutationFn: async (asDraft: boolean) => {
      // 1. Create the property
      const res: { data?: { id?: string } } = await propertiesApi.create({
        name:        state.name,
        address:     state.address,
        city:        state.city,
        postcode:    state.postcode,
        category:    state.category,
        starRating:  state.starRating,
        amenities:   state.amenities,
        description: state.description,
        bookingMode: state.bookingMode,
        lat:         23.0503,
        lng:         72.5311,
      });
      const pid = res.data?.id;
      if (!pid) throw new Error('Property creation failed — no ID returned');

      // 2. Save images (filter empty URLs)
      const validImages = state.imageUrls
        .filter(p => p.url.trim())
        .map((p, idx) => ({ url: p.url.trim(), tag: TAG_MAP[p.tag] ?? 'COMMON', sortOrder: idx }));
      if (validImages.length > 0) {
        await propertiesApi.addImages(pid, validImages);
      }

      // 3. Create the primary room type
      const mealPlan = state.breakfast === 'INCLUDED' ? 'BREAKFAST' : 'NONE';
      const cancellationPolicy = state.nonRefundable ? 'NON_REFUNDABLE' : 'FLEXIBLE';
      await propertiesApi.addRoomType(pid, {
        name:               state.roomTypeName || 'Standard Room',
        maxOccupancy:       state.maxOccupancy,
        basePrice:          Number(state.basePrice),
        mealPlan:           mealPlan as 'NONE' | 'BREAKFAST',
        cancellationPolicy: cancellationPolicy as 'FLEXIBLE' | 'NON_REFUNDABLE',
        bedConfig:          { beds: state.beds },
      });

      // 4. Save KYC information
      await partnerApi.upsertLegal(pid, {
        entityType: state.entityType,
        firstName: state.legalFirstName,
        lastName: state.legalLastName,
        dateOfBirth: state.dob,
        phone: state.phone,
        pan: state.pan || undefined,
        aadhaar: state.aadhaar || undefined,
        gst: state.gstRegistered ? state.gstNumber : undefined,
      });

      // 5. Publish if not saving as draft
      if (!asDraft) await propertiesApi.publish(pid);
    },
    onSuccess: (_data, asDraft) => {
      qc.invalidateQueries({ queryKey: ['partner-properties'] });
      qc.invalidateQueries({ queryKey: ['partner-summary'] });
      setAlert({
        type: 'success',
        message: asDraft
          ? 'Saved as draft! You can publish later from the dashboard.'
          : 'Your property is now live and visible to customers!',
      });
    },
    onError: (e) => setAlert({ type: 'error', message: getApiError(e) }),
  });

  // ── Phase screens ────────────────────────────────────────────────────────

  if (phase === 'CATEGORY') {
    return (
      <PartnerLayout title="List Your Property">
        <CategoryScreen
          onSelect={cat => {
            set({ propertyCategory: cat });
            setPhase('SUBCATEGORY');
          }}
        />
      </PartnerLayout>
    );
  }

  if (phase === 'SUBCATEGORY') {
    return (
      <PartnerLayout title="List Your Property">
        <SubCategoryScreen
          category={state.propertyCategory}
          onSelect={sub => {
            set({ propertySubCategory: sub });
            setPhase('WIZARD');
          }}
          onBack={() => setPhase('CATEGORY')}
        />
      </PartnerLayout>
    );
  }

  // ── Wizard ───────────────────────────────────────────────────────────────

  return (
    <PartnerLayout title="Add New Property">
      {alert && (
        <AlertModal
          type={alert.type}
          message={alert.message}
          onClose={() => {
            if (alert.type === 'success') navigate('/partner/dashboard');
            else setAlert(null);
          }}
        />
      )}

      {/* Progress stepper */}
      <div className="flex items-center mb-8 overflow-x-auto pb-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center shrink-0">
            <div
              className={`flex items-center gap-2 ${i < step ? 'cursor-pointer' : ''}`}
              onClick={() => { if (i < step) setStep(i); }}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                i < step  ? 'bg-primary-600 border-primary-600 text-white' :
                i === step ? 'border-primary-600 text-primary-600 bg-surface' :
                             'border-line text-muted/70 bg-surface'
              }`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-sm font-medium hidden sm:block ${
                i === step ? 'text-primary-600' : i < step ? 'text-ink' : 'text-muted/70'
              }`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-8 h-0.5 mx-2 ${i < step ? 'bg-primary-600' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step card */}
      <div className="bg-surface rounded-2xl border border-line shadow-sm p-8 max-w-2xl">
        <h2 className="text-lg font-bold text-ink mb-6">
          Step {step + 1} of {STEPS.length}: {STEPS[step]}
        </h2>

        {step === 0 && <Step1 s={state} set={set} errors={fieldErrors} />}
        {step === 1 && <Step2 s={state} set={set} errors={fieldErrors} />}
        {step === 2 && <Step3 s={state} set={set} errors={fieldErrors} />}
        {step === 3 && <Step4 s={state} set={set} errors={fieldErrors} />}
        {step === 4 && <Step5 s={state} set={set} />}
        {step === 5 && (
          <Step6
            s={state}
            set={set}
            onPublish={() => createMutation.mutate(false)}
            onDraft={() => createMutation.mutate(true)}
            isPending={createMutation.isPending}
          />
        )}

        {/* Nav buttons (hidden on Step 6 — CTAs are inline there) */}
        {step < STEPS.length - 1 && (
          <div className="flex justify-between mt-8 pt-6 border-t border-line">
            <button
              onClick={() => {
                if (step === 0) { setPhase('SUBCATEGORY'); }
                else setStep(s => Math.max(s - 1, 0));
              }}
              className="px-5 py-2.5 text-sm font-medium text-muted hover:text-gray-900 transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={next}
              className="px-6 py-2.5 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 transition-colors"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </PartnerLayout>
  );
}
