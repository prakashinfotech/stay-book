import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { propertiesApi } from '../../../api/properties.api';
import { partnerApi } from '../../../api/partner.api';
import { getApiError } from '../../../utils/error';
import { useModal } from '../../../hooks/useModal';
import NotificationModal from '../../../components/ui/NotificationModal';
import Spinner from '../../../components/ui/Spinner';
import ErrorBanner from '../../../components/ui/ErrorBanner';
import PartnerLayout from '../partner-layout';
import { partnerLegalSchema } from '../partner-legal.schema';

const AMENITY_LIST = [
  'WiFi', 'Parking', 'AC', 'Pool', 'Kitchen', 'Gym', 'Elevator', 'Breakfast',
  'TV', 'Washer', 'Dryer', 'Safe', 'Balcony', 'Garden',
];

const CATEGORIES = ['HOTEL', 'APARTMENT', 'VILLA', 'HOSTEL', 'OTHER'];

const ROOM_TYPE_OPTIONS = [
  'Standard Room', 'Deluxe Room', 'Suite', 'Single Room', 'Double Room',
  'Twin Room', 'Family Room', 'Studio', 'Executive Room', 'Penthouse',
];

interface EditState {
  name: string;
  address: string;
  city: string;
  postcode: string;
  category: string;
  starRating: number;
  description: string;
  amenities: string[];
  bookingMode: 'INSTANT' | 'REQUEST';
}

interface KycState {
  entityType: 'INDIVIDUAL' | 'BUSINESS';
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  pan: string;
  aadhaar: string;
  gst: string;
  phone: string;
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink mb-1">{label}</label>
      {children}
    </div>
  );
}

const INPUT_CLS = 'w-full rounded-xl border border-line px-4 py-2.5 text-sm text-ink placeholder-gray-400 focus:outline-none focus:border-primary-600 transition-colors';

export default function PartnerPropertyEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'details' | 'kyc'>('details');
  const { modal: notifModal, show: showNotif, close: closeNotif } = useModal();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['property', id],
    queryFn: () => propertiesApi.getById(id!),
    enabled: !!id,
    staleTime: 0,
  });

  const property = data?.data;

  const [form, setForm] = useState<EditState>({
    name: '', address: '', city: '', postcode: '', category: 'HOTEL',
    starRating: 3, description: '', amenities: [], bookingMode: 'INSTANT',
  });

  useEffect(() => {
    if (!property) return;
    setForm({
      name:        property.name        ?? '',
      address:     property.address     ?? '',
      city:        property.city        ?? '',
      postcode:    property.postcode    ?? '',
      category:    property.category    ?? 'HOTEL',
      starRating:  property.starRating  ?? 3,
      description: property.description ?? '',
      amenities:   Array.isArray(property.amenities) ? property.amenities as string[] : [],
      bookingMode: (property.bookingMode ?? 'INSTANT') as 'INSTANT' | 'REQUEST',
    });
  }, [property]);

  const patch = (p: Partial<EditState>) => setForm(s => ({ ...s, ...p }));

  const toggleAmenity = (a: string) => {
    patch({ amenities: form.amenities.includes(a) ? form.amenities.filter(x => x !== a) : [...form.amenities, a] });
  };

  const validateKycForm = (): boolean => {
    const result = partnerLegalSchema.safeParse(kycForm);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((error) => {
        const path = error.path[0] as string;
        errors[path] = error.message;
      });
      setKycErrors(errors);
      return false;
    }
    setKycErrors({});
    return true;
  };

  const saveMutation = useMutation({
    mutationFn: () =>
      propertiesApi.update(id!, {
        name:        form.name,
        address:     form.address,
        city:        form.city,
        postcode:    form.postcode,
        category:    form.category,
        starRating:  form.starRating,
        description: form.description,
        amenities:   form.amenities,
        bookingMode: form.bookingMode,
      }),
    onSuccess: () => {
      showNotif({ type: 'success', title: 'Success', message: 'Property details updated successfully!' });
      qc.invalidateQueries({ queryKey: ['partner-properties'] });
      qc.invalidateQueries({ queryKey: ['property', id] });
      setTimeout(() => navigate('/partner/dashboard'), 2000);
    },
    onError: (e) => showNotif({ type: 'error', title: 'Error', message: getApiError(e) }),
  });

  const [showRtForm, setShowRtForm] = useState(false);
  const [rtForm, setRtForm] = useState({ name: '', maxOccupancy: 2, basePrice: '' });

  const { data: kycData } = useQuery({
    queryKey: ['legal', id],
    queryFn: () => partnerApi.getLegal(id!),
    enabled: !!id,
  });

  const [kycForm, setKycForm] = useState<KycState>({
    entityType: 'INDIVIDUAL',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    pan: '',
    aadhaar: '',
    gst: '',
    phone: '',
  });

  const [kycErrors, setKycErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (kycData?.data) {
      const k = kycData.data;
      setKycForm({
        entityType: k.entityType || 'INDIVIDUAL',
        firstName: k.firstName || '',
        lastName: k.lastName || '',
        dateOfBirth: k.dateOfBirth || '',
        pan: k.pan || '',
        aadhaar: k.aadhaar || '',
        gst: k.gst || '',
        phone: k.phone || '',
      });
    }
  }, [kycData]);

  const addRtMutation = useMutation({
    mutationFn: () => propertiesApi.addRoomType(id!, {
      name:               rtForm.name,
      maxOccupancy:       rtForm.maxOccupancy,
      basePrice:          Number(rtForm.basePrice),
      mealPlan:           'NONE',
      cancellationPolicy: 'FLEXIBLE',
      bedConfig:          {},
    }),
    onSuccess: () => {
      showNotif({ type: 'success', title: 'Success', message: 'Room type added successfully!' });
      setShowRtForm(false);
      setRtForm({ name: '', maxOccupancy: 2, basePrice: '' });
      qc.invalidateQueries({ queryKey: ['property', id] });
      qc.invalidateQueries({ queryKey: ['partner-properties'] });
    },
    onError: (e) => showNotif({ type: 'error', title: 'Error', message: getApiError(e) }),
  });

  const saveKycMutation = useMutation({
    mutationFn: () => partnerApi.upsertLegal(id!, kycForm),
    onSuccess: () => {
      showNotif({ type: 'success', title: 'Success', message: 'KYC information submitted for review!' });
      qc.invalidateQueries({ queryKey: ['legal', id] });
    },
    onError: (e) => showNotif({ type: 'error', title: 'Validation Error', message: getApiError(e) }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim())    { showNotif({ type: 'error', title: 'Validation', message: 'Property name is required' }); return; }
    if (!form.address.trim()) { showNotif({ type: 'error', title: 'Validation', message: 'Street address is required' }); return; }
    if (!form.city.trim())    { showNotif({ type: 'error', title: 'Validation', message: 'City is required' }); return; }
    saveMutation.mutate();
  };

  if (isLoading) return (
    <PartnerLayout title="Edit Property" backTo="/partner/dashboard">
      <div className="flex justify-center py-16"><Spinner size="lg" /></div>
    </PartnerLayout>
  );

  if (isError || !property) return (
    <PartnerLayout title="Edit Property" backTo="/partner/dashboard">
      <ErrorBanner message={getApiError(error)} />
    </PartnerLayout>
  );

  const isKycApproved = kycData?.data?.kycStatus === 'KYC_APPROVED';
  const isKycEditable = !isKycApproved;

  return (
    <PartnerLayout title={`Edit: ${property.name}`} backTo="/partner/dashboard">
      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 border-b border-line">
        <button
          type="button"
          onClick={() => setActiveTab('details')}
          className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'details'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          Property Details
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('kyc')}
          className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'kyc'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          Legal / KYC
          {kycData?.data && (
            <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-full ${
              kycData.data.kycStatus === 'KYC_APPROVED' ? 'bg-green-100 text-green-700' :
              kycData.data.kycStatus === 'KYC_REJECTED' ? 'bg-red-100 text-red-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>
              {kycData.data.kycStatus === 'KYC_APPROVED' ? '✓' :
               kycData.data.kycStatus === 'KYC_REJECTED' ? '✗' : '◐'}
            </span>
          )}
        </button>
      </div>

      {/* Property Details Tab */}
      {activeTab === 'details' && (
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">

        {/* Basic info */}
        <div className="bg-surface rounded-2xl border border-line shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-bold text-ink uppercase tracking-widest">Basic Info</h2>

          <FieldRow label="Property name *">
            <input
              className={INPUT_CLS}
              value={form.name}
              onChange={e => patch({ name: e.target.value })}
              placeholder="e.g. The Grand Manali Retreat"
            />
          </FieldRow>

          <FieldRow label="Street address *">
            <input
              className={INPUT_CLS}
              value={form.address}
              onChange={e => patch({ address: e.target.value })}
              placeholder="Full street address"
            />
          </FieldRow>

          <div className="grid grid-cols-2 gap-4">
            <FieldRow label="City *">
              <input className={INPUT_CLS} value={form.city} onChange={e => patch({ city: e.target.value })} placeholder="City" />
            </FieldRow>
            <FieldRow label="Postcode">
              <input className={INPUT_CLS} value={form.postcode} onChange={e => patch({ postcode: e.target.value })} placeholder="6-digit" maxLength={6} />
            </FieldRow>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FieldRow label="Category">
              <select
                value={form.category}
                onChange={e => patch({ category: e.target.value })}
                className={INPUT_CLS}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </FieldRow>
            <FieldRow label="Star rating">
              <select
                value={form.starRating}
                onChange={e => patch({ starRating: Number(e.target.value) })}
                className={INPUT_CLS}
              >
                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} star{n !== 1 ? 's' : ''}</option>)}
              </select>
            </FieldRow>
          </div>
        </div>

        {/* Description + booking mode */}
        <div className="bg-surface rounded-2xl border border-line shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-bold text-ink uppercase tracking-widest">Property Details</h2>

          <FieldRow label="Description">
            <textarea
              value={form.description}
              onChange={e => patch({ description: e.target.value })}
              rows={4}
              maxLength={2000}
              placeholder="Describe your property…"
              className={`${INPUT_CLS} resize-none`}
            />
          </FieldRow>

          <FieldRow label="Booking mode">
            <div className="grid grid-cols-2 gap-3">
              {[
                { val: 'INSTANT', label: 'Instant booking', desc: 'Guests book without waiting', recommended: true },
                { val: 'REQUEST', label: 'Request to book', desc: 'You approve each booking' },
              ].map(opt => (
                <label
                  key={opt.val}
                  className={`relative p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    form.bookingMode === opt.val ? 'border-primary-600 bg-primary-500/10/40' : 'border-line hover:border-line'
                  }`}
                >
                  <input
                    type="radio" name="bookingMode" value={opt.val}
                    checked={form.bookingMode === opt.val}
                    onChange={() => patch({ bookingMode: opt.val as 'INSTANT' | 'REQUEST' })}
                    className="sr-only"
                  />
                  {opt.recommended && (
                    <span className="absolute top-1.5 right-1.5 text-[9px] font-bold bg-accent-500 text-gray-900 px-1.5 py-0.5 rounded-full">
                      Recommended
                    </span>
                  )}
                  <p className="text-sm font-semibold text-ink">{opt.label}</p>
                  <p className="text-xs text-muted mt-0.5">{opt.desc}</p>
                </label>
              ))}
            </div>
          </FieldRow>
        </div>

        {/* Amenities */}
        <div className="bg-surface rounded-2xl border border-line shadow-sm p-6">
          <h2 className="text-sm font-bold text-ink uppercase tracking-widest mb-4">Amenities</h2>
          <div className="flex flex-wrap gap-2">
            {AMENITY_LIST.map(a => (
              <button
                key={a}
                type="button"
                onClick={() => toggleAmenity(a)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                  form.amenities.includes(a)
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-surface text-ink border-line hover:border-primary-600'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Room Types */}
        <div className="bg-surface rounded-2xl border border-line shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-ink uppercase tracking-widest">Room Types</h2>
            <button
              type="button"
              onClick={() => setShowRtForm(v => !v)}
              className="text-xs text-primary-600 font-semibold hover:underline"
            >
              {showRtForm ? 'Cancel' : '+ Add room type'}
            </button>
          </div>

          {(property.roomTypes?.length ?? 0) === 0 && !showRtForm && (
            <p className="text-sm text-muted/70">No room types yet — add at least one so customers can book.</p>
          )}

          <div className="space-y-2">
            {property.roomTypes?.map((rt: any) => (
              <div key={rt.id} className="flex items-center justify-between py-2 border-b border-line last:border-0">
                <div>
                  <p className="text-sm font-medium text-ink">{rt.name}</p>
                  <p className="text-xs text-muted/70">Max {rt.maxOccupancy} guests · ₹{Number(rt.basePrice).toLocaleString('en-IN')}/night</p>
                </div>
              </div>
            ))}
          </div>

          {showRtForm && (
            <div className="mt-4 pt-4 border-t border-line space-y-3">
              <FieldRow label="Room type *">
                <select
                  className={INPUT_CLS}
                  value={rtForm.name}
                  onChange={e => setRtForm(f => ({ ...f, name: e.target.value }))}
                >
                  <option value="">— Select room type —</option>
                  {ROOM_TYPE_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </FieldRow>
              <div className="grid grid-cols-2 gap-4">
                <FieldRow label="Max occupancy">
                  <input
                    type="number" min={1} max={30}
                    className={INPUT_CLS}
                    value={rtForm.maxOccupancy}
                    onChange={e => setRtForm(f => ({ ...f, maxOccupancy: Number(e.target.value) }))}
                  />
                </FieldRow>
                <FieldRow label="Base price (₹/night) *">
                  <input
                    type="number" min={1}
                    className={INPUT_CLS}
                    placeholder="e.g. 2500"
                    value={rtForm.basePrice}
                    onChange={e => setRtForm(f => ({ ...f, basePrice: e.target.value }))}
                  />
                </FieldRow>
              </div>
              <button
                type="button"
                disabled={addRtMutation.isPending}
                onClick={() => {
                  if (!rtForm.name.trim()) { showNotif({ type: 'error', title: 'Validation', message: 'Room type name is required' }); return; }
                  if (!rtForm.basePrice || Number(rtForm.basePrice) <= 0) { showNotif({ type: 'error', title: 'Validation', message: 'Enter a valid base price (greater than 0)' }); return; }
                  addRtMutation.mutate();
                }}
                className="px-5 py-2 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-60"
              >
                {addRtMutation.isPending ? 'Adding…' : 'Add room type'}
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/partner/dashboard')}
            className="px-6 py-2.5 border border-line text-ink text-sm font-medium rounded-xl hover:border-gray-400 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="px-8 py-2.5 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-60"
          >
            {saveMutation.isPending ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
      )}

      {/* Notification Modal */}
      <NotificationModal modal={notifModal} onClose={closeNotif} />

      {/* KYC Tab */}
      {activeTab === 'kyc' && (
      <div className="max-w-2xl space-y-6">
        <div className="bg-surface rounded-2xl border border-line shadow-sm p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-sm font-bold text-ink uppercase tracking-widest">Legal / KYC Information</h2>
              <p className="text-xs text-muted/70 mt-1">Required before publishing property</p>
            </div>
            {kycData?.data && (
              <div className={`text-xs font-semibold px-3 py-1 rounded-full ${
                kycData.data.kycStatus === 'KYC_APPROVED' ? 'bg-green-100 text-green-700' :
                kycData.data.kycStatus === 'KYC_REJECTED' ? 'bg-red-100 text-red-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {kycData.data.kycStatus === 'KYC_APPROVED' ? '✓ Approved' :
                 kycData.data.kycStatus === 'KYC_REJECTED' ? '✗ Rejected' : '◐ Pending Review'}
              </div>
            )}
          </div>

          {kycData?.data?.kycStatus === 'KYC_APPROVED' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-700">
              <p className="font-semibold">✓ KYC Approved</p>
              <p className="mt-1">Your KYC has been reviewed and approved by admin. You can now publish properties.</p>
            </div>
          )}

          {kycData?.data?.kycStatus === 'KYC_REJECTED' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
              <p className="font-semibold">✗ KYC Rejected</p>
              <p className="mt-2 font-medium">Reason: {kycData.data.kycRejectionReason}</p>
              <p className="mt-2">Please update your information and resubmit for review.</p>
            </div>
          )}

          {!kycData?.data && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
              <p className="font-semibold">Required: KYC Not Submitted</p>
              <p className="mt-1">Submit your KYC information to enable property publishing.</p>
            </div>
          )}

          <div className={`space-y-4 pt-4 border-t border-line ${!isKycEditable ? 'opacity-75' : ''}`}>
            <div className="grid grid-cols-2 gap-4">
              <FieldRow label="Entity type">
                <div>
                  <select
                    value={kycForm.entityType}
                    onChange={e => isKycEditable && setKycForm(f => ({ ...f, entityType: e.target.value as 'INDIVIDUAL' | 'BUSINESS' }))}
                    disabled={!isKycEditable}
                    className={`${INPUT_CLS} ${!isKycEditable ? 'bg-gray-50 cursor-not-allowed' : ''} ${kycErrors.entityType ? 'border-red-500 focus:border-red-500' : ''}`}
                  >
                    <option value="INDIVIDUAL">Individual</option>
                    <option value="BUSINESS">Business</option>
                  </select>
                  {kycErrors.entityType && <p className="text-xs text-red-600 mt-1">{kycErrors.entityType}</p>}
                </div>
              </FieldRow>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FieldRow label="First name">
                <div>
                  <input
                    disabled={!isKycEditable}
                    className={`${INPUT_CLS} ${!isKycEditable ? 'bg-gray-50 cursor-not-allowed' : ''} ${kycErrors.firstName ? 'border-red-500 focus:border-red-500' : ''}`}
                    value={kycForm.firstName}
                    onChange={e => isKycEditable && setKycForm(f => ({ ...f, firstName: e.target.value }))}
                    placeholder="First name"
                  />
                  {kycErrors.firstName && <p className="text-xs text-red-600 mt-1">{kycErrors.firstName}</p>}
                </div>
              </FieldRow>
              <FieldRow label="Last name">
                <div>
                  <input
                    disabled={!isKycEditable}
                    className={`${INPUT_CLS} ${!isKycEditable ? 'bg-gray-50 cursor-not-allowed' : ''} ${kycErrors.lastName ? 'border-red-500 focus:border-red-500' : ''}`}
                    value={kycForm.lastName}
                    onChange={e => isKycEditable && setKycForm(f => ({ ...f, lastName: e.target.value }))}
                    placeholder="Last name"
                  />
                  {kycErrors.lastName && <p className="text-xs text-red-600 mt-1">{kycErrors.lastName}</p>}
                </div>
              </FieldRow>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FieldRow label="Date of birth *">
                <div>
                  <input
                    type="date"
                    disabled={!isKycEditable}
                    className={`${INPUT_CLS} ${!isKycEditable ? 'bg-gray-50 cursor-not-allowed' : ''} ${kycErrors.dateOfBirth ? 'border-red-500 focus:border-red-500' : ''}`}
                    value={kycForm.dateOfBirth}
                    onChange={e => isKycEditable && setKycForm(f => ({ ...f, dateOfBirth: e.target.value }))}
                  />
                  {kycErrors.dateOfBirth ? (
                    <p className="text-xs text-red-600 mt-1">{kycErrors.dateOfBirth}</p>
                  ) : (
                    <p className="text-xs text-muted/70 mt-1">Must be in the past (born before today)</p>
                  )}
                </div>
              </FieldRow>
              <FieldRow label="Phone *">
                <div>
                  <input
                    type="tel"
                    disabled={!isKycEditable}
                    className={`${INPUT_CLS} ${!isKycEditable ? 'bg-gray-50 cursor-not-allowed' : ''} ${kycErrors.phone ? 'border-red-500 focus:border-red-500' : ''}`}
                    value={kycForm.phone}
                    onChange={e => isKycEditable && setKycForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                  />
                  {kycErrors.phone ? (
                    <p className="text-xs text-red-600 mt-1">{kycErrors.phone}</p>
                  ) : (
                    <p className="text-xs text-muted/70 mt-1">10-digit mobile number</p>
                  )}
                </div>
              </FieldRow>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FieldRow label="PAN">
                <div>
                  <input
                    disabled={!isKycEditable}
                    className={`${INPUT_CLS} ${!isKycEditable ? 'bg-gray-50 cursor-not-allowed' : ''} ${kycErrors.pan ? 'border-red-500 focus:border-red-500' : ''}`}
                    value={kycForm.pan}
                    onChange={e => isKycEditable && setKycForm(f => ({ ...f, pan: e.target.value.toUpperCase() }))}
                    placeholder="e.g. ABCDE1234F"
                    maxLength={10}
                  />
                  {kycErrors.pan ? (
                    <p className="text-xs text-red-600 mt-1">{kycErrors.pan}</p>
                  ) : (
                    <p className="text-xs text-muted/70 mt-1">Format: 5 letters + 4 numbers + 1 letter (e.g., DFSSD1234F)</p>
                  )}
                </div>
              </FieldRow>
              <FieldRow label="Aadhaar">
                <div>
                  <input
                    disabled={!isKycEditable}
                    className={`${INPUT_CLS} ${!isKycEditable ? 'bg-gray-50 cursor-not-allowed' : ''} ${kycErrors.aadhaar ? 'border-red-500 focus:border-red-500' : ''}`}
                    value={kycForm.aadhaar}
                    onChange={e => isKycEditable && setKycForm(f => ({ ...f, aadhaar: e.target.value.replace(/\D/g, '').slice(0, 12) }))}
                    placeholder="e.g. 213321313213"
                    maxLength={12}
                  />
                  {kycErrors.aadhaar ? (
                    <p className="text-xs text-red-600 mt-1">{kycErrors.aadhaar}</p>
                  ) : (
                    <p className="text-xs text-muted/70 mt-1">12-digit Aadhaar number</p>
                  )}
                </div>
              </FieldRow>
            </div>

            {kycForm.entityType === 'BUSINESS' && (
              <FieldRow label="GST (if registered)">
                <div>
                  <input
                    disabled={!isKycEditable}
                    className={`${INPUT_CLS} ${!isKycEditable ? 'bg-gray-50 cursor-not-allowed' : ''} ${kycErrors.gst ? 'border-red-500 focus:border-red-500' : ''}`}
                    value={kycForm.gst}
                    onChange={e => isKycEditable && setKycForm(f => ({ ...f, gst: e.target.value.toUpperCase() }))}
                    placeholder="GST number"
                    maxLength={15}
                  />
                  {kycErrors.gst && <p className="text-xs text-red-600 mt-1">{kycErrors.gst}</p>}
                </div>
              </FieldRow>
            )}
          </div>

          {isKycEditable && (
            <button
              type="button"
              disabled={saveKycMutation.isPending}
              onClick={() => {
                if (!validateKycForm()) {
                  showNotif({ type: 'error', title: 'Validation Error', message: 'Please check all fields and try again' });
                  return;
                }
                saveKycMutation.mutate();
              }}
              className="px-5 py-2 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-60"
            >
              {saveKycMutation.isPending ? 'Submitting…' : kycData?.data ? 'Update KYC' : 'Submit KYC'}
            </button>
          )}

          {isKycApproved && (
            <div className="text-xs text-muted/70 italic">
              KYC is approved and locked. Contact admin if you need to make changes.
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/partner/dashboard')}
            className="px-6 py-2.5 border border-line text-ink text-sm font-medium rounded-xl hover:border-gray-400 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
      )}
    </PartnerLayout>
  );
}
