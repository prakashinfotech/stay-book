import { PrismaClient, CancellationPolicy, MealPlan, RatePlanType } from '@prisma/client';

// Plan's MODERATE → FLEXIBLE, STRICT → NON_REFUNDABLE (our enum only has those two)
type RoomTemplate = {
  name: string;
  description: string;
  maxOccupancy: number;
  basePrice: number;
  cancellationPolicy: CancellationPolicy;
  mealPlan?: MealPlan;
};

const ROOM_TYPE_MAP: Record<string, RoomTemplate[]> = {
  'Grand Palace Hotel': [
    { name: 'Presidential Suite',  description: 'Opulent 120 sqm suite with private butler, jacuzzi, and panoramic city views.', maxOccupancy: 3, basePrice: 18000, cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Deluxe Double',       description: 'Spacious 45 sqm room with king bed, marble bathroom, and city or pool view.',    maxOccupancy: 2, basePrice: 8500,  cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Standard Twin',       description: '35 sqm room with two single beds, ideal for colleagues or friends.',             maxOccupancy: 2, basePrice: 5500,  cancellationPolicy: CancellationPolicy.FLEXIBLE },
  ],
  'Heritage Haveli': [
    { name: 'Royal Suite',         description: 'The grandest room in the haveli — antique furniture, hand-painted walls, private courtyard.', maxOccupancy: 2, basePrice: 12000, cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Heritage Double',     description: 'A double room with original jharokha windows and Gujarati block-print textiles.',              maxOccupancy: 2, basePrice: 6500,  cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Heritage Single',     description: 'Compact room with traditional Gujarati design, perfect for solo travellers.',                  maxOccupancy: 1, basePrice: 4000,  cancellationPolicy: CancellationPolicy.FLEXIBLE },
  ],
  'The Business Suite': [
    { name: 'Executive Suite',     description: 'Dedicated work area, dual monitors, ergonomic chair, and lounge space.',  maxOccupancy: 2, basePrice: 9500, cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Superior Double',     description: 'Modern room with dedicated high-speed ethernet, work desk, blackout curtains.', maxOccupancy: 2, basePrice: 5500, cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Standard Room',       description: 'Clean, functional room ideal for short business stays.',                  maxOccupancy: 1, basePrice: 3500, cancellationPolicy: CancellationPolicy.NON_REFUNDABLE },
  ],
  'Budget Inn Express': [
    { name: 'Private Room',        description: 'Cozy private room with double bed and locker — privacy at hostel prices.', maxOccupancy: 2, basePrice: 1800, cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Mixed Dorm (6-bed)',  description: '6-bed mixed dormitory with individual reading lights and lockers.',        maxOccupancy: 6, basePrice: 800,  cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Mixed Dorm (10-bed)', description: 'Budget 10-bed dorm for solo backpackers.',                                maxOccupancy: 10, basePrice: 500, cancellationPolicy: CancellationPolicy.FLEXIBLE },
  ],
  'Mountain View Resort': [
    { name: 'Villa Suite',         description: 'Stand-alone villa with private deck, outdoor jacuzzi, and panoramic Himalayan views.', maxOccupancy: 4, basePrice: 22000, cancellationPolicy: CancellationPolicy.FLEXIBLE, mealPlan: MealPlan.BREAKFAST },
    { name: 'Premium Cottage',     description: 'Wooden cottage with stone fireplace, king bed, and private balcony.',                maxOccupancy: 2, basePrice: 12000, cancellationPolicy: CancellationPolicy.FLEXIBLE, mealPlan: MealPlan.BREAKFAST },
    { name: 'Garden Room',         description: 'Warm room with garden access and mountain glimpses — great value.',                  maxOccupancy: 2, basePrice: 7500,  cancellationPolicy: CancellationPolicy.FLEXIBLE },
  ],
  'Snow Peak Cottages': [
    { name: 'Cottage Deluxe',      description: 'Apple orchard-facing cottage with wooden interior and bonfire pit.', maxOccupancy: 3, basePrice: 11000, cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Mountain View Room',  description: 'En-suite room with floor-to-ceiling windows framing snow-capped peaks.', maxOccupancy: 2, basePrice: 7000, cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Standard Cottage',    description: 'Compact cottage, great for solo travellers on a budget.',            maxOccupancy: 2, basePrice: 4500,  cancellationPolicy: CancellationPolicy.FLEXIBLE },
  ],
  'Valley Camp': [
    { name: 'Private Tent Room',       description: 'Glamping private tent with real mattress, sleeping bag, and small heater.',  maxOccupancy: 2, basePrice: 1800, cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Shared Dorm Tent (6-bed)',description: '6-person dorm tent with individual sleeping bags and lockers.',               maxOccupancy: 6, basePrice: 800,  cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Budget Dorm (10-bed)',    description: 'Most affordable Himalayan dorm — for adventurers on a tight budget.',        maxOccupancy: 10, basePrice: 500, cancellationPolicy: CancellationPolicy.FLEXIBLE },
  ],
  'Pine Wood Lodge': [
    { name: 'Deluxe Room',         description: 'Pine-panelled room with attached bathroom, comfortable queen bed, and heater.', maxOccupancy: 2, basePrice: 4500, cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Standard Double',     description: 'Clean standard room with double bed and hot water — great value in Manali.',    maxOccupancy: 2, basePrice: 3000, cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Budget Single',       description: 'Compact single room for solo travellers — functional and affordable.',          maxOccupancy: 1, basePrice: 2000, cancellationPolicy: CancellationPolicy.NON_REFUNDABLE },
  ],
  'Coastal Breeze Resort': [
    { name: 'Beachfront Suite',    description: 'Direct beach access, private plunge pool, and outdoor shower.', maxOccupancy: 3, basePrice: 22000, cancellationPolicy: CancellationPolicy.FLEXIBLE, mealPlan: MealPlan.BREAKFAST },
    { name: 'Pool View Cottage',   description: 'Stylish cottage with private terrace, steps from the infinity pool.', maxOccupancy: 2, basePrice: 12000, cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Garden Room',         description: 'Lush garden-facing room with tropical décor — great value at a premium resort.', maxOccupancy: 2, basePrice: 7500, cancellationPolicy: CancellationPolicy.FLEXIBLE },
  ],
  'Beachfront Villa': [
    { name: 'Full Villa (Exclusive)', description: 'Entire 4-bedroom villa, exclusively yours. Private pool, BBQ, chef on request.', maxOccupancy: 8, basePrice: 35000, cancellationPolicy: CancellationPolicy.NON_REFUNDABLE },
    { name: 'Garden Wing',            description: '2-bedroom wing of the villa with garden and pool access.', maxOccupancy: 4, basePrice: 18000, cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Pool Cabana Room',        description: 'Standalone cabana right by the pool — intimate, breezy, beachside.', maxOccupancy: 2, basePrice: 10000, cancellationPolicy: CancellationPolicy.FLEXIBLE },
  ],
  'Sunset Shack': [
    { name: 'Private Room',        description: 'A breezy private room with direct beach view. Best value private in South Goa.', maxOccupancy: 2, basePrice: 1800, cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Mixed Dorm (6-bed)',  description: '6-bed mixed dorm with tropical vibe, individual curtains, and lockers.',         maxOccupancy: 6, basePrice: 800,  cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Mixed Dorm (10-bed)', description: 'The budget option — open dorm with fan, lockers, and free Goa sunrise access.', maxOccupancy: 10, basePrice: 500, cancellationPolicy: CancellationPolicy.FLEXIBLE },
  ],
  'The Goa Boutique': [
    { name: 'Rooftop Suite',       description: 'Private rooftop suite with direct access to the bar and 360° Anjuna views.', maxOccupancy: 2, basePrice: 9500, cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Boutique Double',     description: 'Art-curated room with local artist installations, pool view, and king bed.',  maxOccupancy: 2, basePrice: 5500, cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Standard Room',       description: 'Clean boutique standard room — minimal, artsy, and comfortable.',            maxOccupancy: 2, basePrice: 3500, cancellationPolicy: CancellationPolicy.FLEXIBLE },
  ],
  // ── New Delhi ──────────────────────────────────────────────────────────────
  'The Imperial New Delhi': [
    { name: 'Imperial Suite',      description: 'Grand colonial suite with butler service, private dining area, and views of Janpath.', maxOccupancy: 3, basePrice: 25000, cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Deluxe King',         description: 'Spacious room with colonial décor, marble bath, and views of the imperial gardens.',   maxOccupancy: 2, basePrice: 12000, cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Classic Double',      description: 'Elegant classic room with twin or double bed, premium linens, and city views.',        maxOccupancy: 2, basePrice: 8000,  cancellationPolicy: CancellationPolicy.FLEXIBLE },
  ],
  'Old Delhi Heritage Inn': [
    { name: 'Mughal Suite',        description: 'Expansive suite with jharokha windows overlooking Old Delhi lanes and a private terrace.', maxOccupancy: 2, basePrice: 10000, cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Heritage Double',     description: 'Room with original 19th-century woodwork, embroidered textiles, and courtyard view.',     maxOccupancy: 2, basePrice: 6000,  cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Heritage Single',     description: 'Compact room with authentic Old Delhi charm, ideal for solo heritage travellers.',        maxOccupancy: 1, basePrice: 3800,  cancellationPolicy: CancellationPolicy.FLEXIBLE },
  ],
  'Delhi Aerocity Business Hotel': [
    { name: 'Executive Suite',     description: 'Spacious airport-view suite with lounge, high-speed fibre, and 24-hour room service.',  maxOccupancy: 2, basePrice: 11000, cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Superior Business',   description: 'Well-appointed room with dedicated desk, dual monitors, and blackout curtains.',        maxOccupancy: 2, basePrice: 6500,  cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Standard Room',       description: 'Comfortable standard room with complimentary airport shuttle access.',                  maxOccupancy: 1, basePrice: 4000,  cancellationPolicy: CancellationPolicy.NON_REFUNDABLE },
  ],
  'Capital Backpackers Karol Bagh': [
    { name: 'Private Room',        description: 'Private double room with locker, fan, and attached bath — budget privacy in Delhi.', maxOccupancy: 2, basePrice: 1500, cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Mixed Dorm (6-bed)',  description: '6-bed air-conditioned dorm with individual lockers and rooftop access.',             maxOccupancy: 6, basePrice: 700,  cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Mixed Dorm (10-bed)', description: 'Most affordable Delhi dorm — fan-cooled with secure lockers.',                       maxOccupancy: 10, basePrice: 450, cancellationPolicy: CancellationPolicy.FLEXIBLE },
  ],
  // ── Bengaluru ──────────────────────────────────────────────────────────────
  'Garden City Palace Bengaluru': [
    { name: 'Infinity Pool Suite', description: 'Top-floor suite with private access to the rooftop infinity pool and butler service.', maxOccupancy: 3, basePrice: 22000, cancellationPolicy: CancellationPolicy.FLEXIBLE, mealPlan: MealPlan.BREAKFAST },
    { name: 'Premier King',        description: 'Spacious room with MG Road views, king bed, and access to the executive lounge.',     maxOccupancy: 2, basePrice: 11000, cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Deluxe Twin',         description: 'Twin-bedded room with modern amenities, ideal for colleagues or friends.',            maxOccupancy: 2, basePrice: 7500,  cancellationPolicy: CancellationPolicy.FLEXIBLE },
  ],
  'Indiranagar Boutique Hotel': [
    { name: 'Art Suite',           description: 'Curated suite with original Bangalore street art, private terrace, and craft minibar.', maxOccupancy: 2, basePrice: 9000, cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Boutique King',       description: 'King room with bespoke furniture, rainfall shower, and 100 Feet Road views.',          maxOccupancy: 2, basePrice: 5500, cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Standard Room',       description: 'Stylish standard room with design touches and excellent location.',                    maxOccupancy: 2, basePrice: 3500, cancellationPolicy: CancellationPolicy.NON_REFUNDABLE },
  ],
  'Whitefield Tech Suites': [
    { name: 'Executive Suite',     description: 'Full kitchenette, living area, dual-monitor desk, and co-working lounge pass.',   maxOccupancy: 2, basePrice: 8000, cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Tech Studio',         description: 'Compact studio with fibre broadband, standing desk, and 4K monitor.',            maxOccupancy: 2, basePrice: 5000, cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Standard Room',       description: 'Clean, well-connected room close to ITPL and Whitefield tech parks.',            maxOccupancy: 1, basePrice: 3200, cancellationPolicy: CancellationPolicy.NON_REFUNDABLE },
  ],
  'Koramangala Hostel Hub': [
    { name: 'Private Pod',         description: 'Enclosed private pod with curtain, reading light, locker, and personal fan.',        maxOccupancy: 1, basePrice: 1200, cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Mixed Dorm (6-bed)',  description: 'Social 6-bed dorm with co-working corner and weekly networking events.',            maxOccupancy: 6, basePrice: 650,  cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Mixed Dorm (10-bed)', description: 'Budget dorm in Bengaluru startup heartland — ideal for digital nomads.',           maxOccupancy: 10, basePrice: 450, cancellationPolicy: CancellationPolicy.FLEXIBLE },
  ],
  // ── Jaipur ─────────────────────────────────────────────────────────────────
  'Pink City Palace Hotel': [
    { name: 'Maharaja Suite',      description: 'Opulent palatial suite with elephant ride inclusion, private pool, and butler.', maxOccupancy: 3, basePrice: 28000, cancellationPolicy: CancellationPolicy.FLEXIBLE, mealPlan: MealPlan.BREAKFAST },
    { name: 'Royal Deluxe',        description: 'Rajasthani-style deluxe room with courtyard views and heritage art.', maxOccupancy: 2, basePrice: 13000, cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Classic Double',      description: 'Comfortable double room with Rajput motifs and access to the rooftop restaurant.', maxOccupancy: 2, basePrice: 7500, cancellationPolicy: CancellationPolicy.FLEXIBLE },
  ],
  'Rajput Heritage Haveli Jaipur': [
    { name: 'Haveli Suite',        description: 'Entire floor of the haveli — frescoed ceilings, private courtyard, and folk entertainment.', maxOccupancy: 4, basePrice: 18000, cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Rajput Room',         description: 'Historically furnished room with hand-painted walls and original brass fixtures.',            maxOccupancy: 2, basePrice: 9000,  cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Heritage Single',     description: 'Intimate single room with traditional décor perfect for solo heritage explorers.',           maxOccupancy: 1, basePrice: 5500,  cancellationPolicy: CancellationPolicy.FLEXIBLE },
  ],
  'Jaipur Garden Resort': [
    { name: 'Resort Villa',        description: 'Standalone garden villa with private plunge pool, Ayurvedic massage, and desert safari.', maxOccupancy: 4, basePrice: 20000, cancellationPolicy: CancellationPolicy.FLEXIBLE, mealPlan: MealPlan.BREAKFAST },
    { name: 'Garden Suite',        description: 'Suite set in lush gardens with outdoor seating, king bed, and yoga mat.',               maxOccupancy: 2, basePrice: 10000, cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Standard Garden',     description: 'Garden-view room with contemporary Rajasthani décor and pool access.',                  maxOccupancy: 2, basePrice: 6500,  cancellationPolicy: CancellationPolicy.FLEXIBLE },
  ],
  'Budget Fort View Inn Jaipur': [
    { name: 'Fort View Room',      description: 'Private room with rooftop terrace offering a stunning view of Amber Fort.', maxOccupancy: 2, basePrice: 1800, cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Mixed Dorm (6-bed)',  description: 'Air-cooled 6-bed dorm near Jaipur station — clean and central.',           maxOccupancy: 6, basePrice: 750,  cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Mixed Dorm (8-bed)',  description: 'Budget dorm with locker storage and helpful staff for city tours.',         maxOccupancy: 8, basePrice: 500,  cancellationPolicy: CancellationPolicy.FLEXIBLE },
  ],
  // ── Rishikesh ──────────────────────────────────────────────────────────────
  'Ganga View Retreat Rishikesh': [
    { name: 'Riverside Suite',     description: 'Private suite with balcony directly overlooking the Ganges — wake up to the sound of the river.', maxOccupancy: 2, basePrice: 8500, cancellationPolicy: CancellationPolicy.FLEXIBLE, mealPlan: MealPlan.BREAKFAST },
    { name: 'Yoga Room',           description: 'Airy double room with yoga mat included, Ganga glimpse, and access to daily classes.',            maxOccupancy: 2, basePrice: 5000, cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Standard Room',       description: 'Clean, minimal room with organic meals included and forest view.',                                maxOccupancy: 2, basePrice: 3200, cancellationPolicy: CancellationPolicy.FLEXIBLE },
  ],
  'Tapovan Yoga Hostel': [
    { name: 'Private Room',        description: 'Peaceful private room with Ganga-side garden access and free morning yoga.', maxOccupancy: 2, basePrice: 1400, cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Mixed Dorm (6-bed)',  description: '6-bed spiritual dorm with shared practice space and campfire evenings.',     maxOccupancy: 6, basePrice: 650,  cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Mixed Dorm (8-bed)',  description: 'Budget Tapovan dorm — minimalist and meditative.',                          maxOccupancy: 8, basePrice: 450,  cancellationPolicy: CancellationPolicy.FLEXIBLE },
  ],
  // ── Varanasi ───────────────────────────────────────────────────────────────
  'Ganges Ghats Heritage Hotel': [
    { name: 'Ganga View Suite',    description: 'Top-floor suite with a private balcony facing the Ganges and a front-row seat to Ganga Aarti.', maxOccupancy: 2, basePrice: 9000, cancellationPolicy: CancellationPolicy.FLEXIBLE, mealPlan: MealPlan.BREAKFAST },
    { name: 'Heritage Room',       description: 'Boutique room with handloom textiles, terracotta accents, and rooftop access.',                maxOccupancy: 2, basePrice: 5500, cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Standard Room',       description: 'Comfortable standard room within walking distance to all major ghats.',                        maxOccupancy: 2, basePrice: 3500, cancellationPolicy: CancellationPolicy.FLEXIBLE },
  ],
  'Holy City Hostel Varanasi': [
    { name: 'Private Room',        description: 'Private double room with Ganga rooftop view and free boat ride token.',  maxOccupancy: 2, basePrice: 1500, cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Mixed Dorm (6-bed)',  description: '6-bed dorm steps from Assi Ghat — spiritual vibes, budget price.',      maxOccupancy: 6, basePrice: 650,  cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Mixed Dorm (8-bed)',  description: 'Most affordable Varanasi dorm — simple, clean, close to old city.',     maxOccupancy: 8, basePrice: 450,  cancellationPolicy: CancellationPolicy.FLEXIBLE },
  ],
  // ── Mumbai ─────────────────────────────────────────────────────────────────
  'Marine Drive Grand Hotel': [
    { name: 'Sea View Suite',      description: 'Corner suite with panoramic Queen\'s Necklace views, infinity pool access, and sunset cocktail hour.', maxOccupancy: 3, basePrice: 30000, cancellationPolicy: CancellationPolicy.FLEXIBLE, mealPlan: MealPlan.BREAKFAST },
    { name: 'Deluxe King',         description: 'King room with sea-facing balcony, marble bath, and premium minibar.',                                maxOccupancy: 2, basePrice: 15000, cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Classic Room',        description: 'Elegant city-view room with 5-star amenities at a more accessible price.',                            maxOccupancy: 2, basePrice: 9000,  cancellationPolicy: CancellationPolicy.FLEXIBLE },
  ],
  'Bandra West Boutique Hotel': [
    { name: 'Rooftop Suite',       description: 'Penthouse suite with private terrace overlooking Bandstand and Worli Sea Link.', maxOccupancy: 2, basePrice: 12000, cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Boutique Double',     description: 'Eclectic room with Mumbai street-art murals, rainfall shower, and café access.',  maxOccupancy: 2, basePrice: 7000,  cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Standard Room',       description: 'Hip minimal room in the heart of Bandra nightlife and dining.',                   maxOccupancy: 2, basePrice: 4500,  cancellationPolicy: CancellationPolicy.NON_REFUNDABLE },
  ],
  'Gateway Colaba Hotel': [
    { name: 'Heritage Suite',      description: 'Colonial suite with views of the Gateway of India and Arabian Sea, butler included.', maxOccupancy: 2, basePrice: 14000, cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Landmark Room',       description: 'Double room with sea glimpse, antique furnishings, and colonial-era charm.',         maxOccupancy: 2, basePrice: 8000,  cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Standard Room',       description: 'Well-located Colaba room with heritage character and modern comforts.',              maxOccupancy: 2, basePrice: 5000,  cancellationPolicy: CancellationPolicy.FLEXIBLE },
  ],
  'Dadar Budget Hostel': [
    { name: 'Private Room',        description: 'Private air-conditioned room in central Dadar — local trains at your doorstep.', maxOccupancy: 2, basePrice: 1600, cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Mixed Dorm (6-bed)',  description: '6-bed AC dorm with individual lockers and street-food map of Dadar.',             maxOccupancy: 6, basePrice: 750,  cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Mixed Dorm (10-bed)', description: 'Budget 10-bed dorm — fan-cooled, central Mumbai, affordable.',                   maxOccupancy: 10, basePrice: 500, cancellationPolicy: CancellationPolicy.FLEXIBLE },
  ],
};

export type RoomTypeMeta = { roomTypeId: string; propertyId: string; ratePlanId: string };

export async function seedRoomTypes(
  prisma:     PrismaClient,
  properties: Array<{ id: string; name: string }>,
): Promise<RoomTypeMeta[]> {
  console.log('🌱 Seeding room types & rate plans...');
  const metas: RoomTypeMeta[] = [];

  for (const property of properties) {
    const templates = ROOM_TYPE_MAP[property.name];
    if (!templates) continue;

    for (const rt of templates) {
      // Check if room type already exists
      const existing = await prisma.roomType.findFirst({
        where: { propertyId: property.id, name: rt.name },
        include: { ratePlans: { where: { planType: RatePlanType.STANDARD } } },
      });

      let roomTypeId: string;
      let ratePlanId: string;

      if (existing) {
        roomTypeId = existing.id;
        ratePlanId = existing.ratePlans[0]?.id ?? '';
      } else {
        const roomType = await prisma.roomType.create({
          data: {
            propertyId:         property.id,
            name:               rt.name,
            description:        rt.description,
            maxOccupancy:       rt.maxOccupancy,
            basePrice:          rt.basePrice,
            cancellationPolicy: rt.cancellationPolicy,
            mealPlan:           rt.mealPlan ?? MealPlan.NONE,
            bedConfig:          {},
          },
        });
        const ratePlan = await prisma.ratePlan.create({
          data: { roomTypeId: roomType.id, planType: RatePlanType.STANDARD, discountPercent: 0, minNights: 1 },
        });
        roomTypeId = roomType.id;
        ratePlanId = ratePlan.id;
      }

      metas.push({ roomTypeId, propertyId: property.id, ratePlanId });
    }
    console.log(`  ✅ ${property.name} → ${templates.length} room types`);
  }

  return metas;
}
