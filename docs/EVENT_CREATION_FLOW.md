# Event Creation Flow Documentation

This document describes the complete flow for creating an event in the PiggyBank app, including all form fields organized by event type.

---

## 📋 Overview

The event creation process consists of **3 steps**:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   STEP 1        │     │   STEP 2        │     │   STEP 3        │
│   Event Type    │ ──▶ │   Event Details │ ──▶ │   Select Guests │
│                 │     │                 │     │                 │
│  📁 event-type  │     │ 📁 event-details│     │ 📁 select-guests│
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## 🎯 Step 1: Select Event Type

**File:** `app/create-event/event-type.tsx`

The user chooses from the following event types:

| Event Type | Icon | Description |
|------------|------|-------------|
| `birthday` | 🎂 | Birthday celebration |
| `barMitzvah` | 📖 | Bar Mitzvah ceremony (coming-of-age for boys) |

### Available Event Types (from `types/events.ts`)
```typescript
export type EventType = "birthday" | "barMitzvah" | "batMitzvah" | "other";
```

> **Note:** Currently only `birthday` and `barMitzvah` are visible in the UI.

---

## 📝 Step 2: Event Details

**File:** `app/create-event/event-details.tsx`

This step collects detailed information about the event. The form fields displayed vary based on the event type selected in Step 1.

### Form Data Structure

```typescript
interface EventFormData {
    age: string;                    // Turning age (birthday only)
    eventName: string;              // Event title (required)
    eventCategory?: EventCategory;  // "party" | "formal" (Bar/Bat Mitzvah only)
    partyType?: string;             // Type of party
    otherPartyType?: string;        // Custom party type
    attireType?: string;            // Dress code for parties
    footwearType?: string;          // Footwear recommendation
    theme?: string;                 // Party theme
    parking?: string;               // Parking instructions
    kosherType?: string;            // Kosher level
    mealType?: string;              // Dairy/Meat/Pareve
    vegetarianType?: string;        // Vegetarian options
    date: string;                   // Event date (required)
    time: string;                   // Event time (required)
    address1: string;               // Venue name (required)
    address2: string;               // Street address
}
```

---

## 🎂 Birthday Event Form

When `eventType === "birthday"`, the following fields are shown:

### Required Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `age` | Text Input | The age the child is turning | `16` |
| `eventName` | Text Input | Name of the event | "Emma's Sweet 16 Birthday" |
| `date` | Date Picker | Event date | "2026-02-15" |
| `time` | Time Picker | Event time | "04:00 PM" |
| `address1` | Google Places | Venue name | "Jump Zone Trampoline Park" |

### Optional Event Details

The user can toggle "Fill in details now" to show/hide these optional fields:

#### 🎊 Party Type (Single Select)
| Option | Icon | Description |
|--------|------|-------------|
| `pool` | 🏊 | Pool Party |
| `beach` | 🏖️ | Beach Party |
| `garden` | 🌳 | Garden Party |
| `indoor` | 🏠 | Indoor Party |
| `restaurant` | 🍽️ | Restaurant |
| `rooftop` | 🌆 | Rooftop |
| `other` | ✏️ | Other (shows text input for custom type) |

#### 👕 Attire Type (Single Select)
| Option | Icon | Description |
|--------|------|-------------|
| `casual` | 👕 | Everyday wear |
| `swimwear` | 🩱 | Pool/Beach attire |
| `costume` | 🎭 | Themed outfit |

#### 👟 Footwear (Single Select)
| Option | Icon | Description |
|--------|------|-------------|
| `sneakers` | 👟 | Sneakers |
| `slides` | 🩴 | Slides/Sandals |
| `any` | ✨ | Any footwear |

#### 🎭 Party Theme (Text Input with Suggestions)
Suggestions:
- 🏆 Sports
- 🏰 Inflatables
- 🏊 Pool
- 🎭 Costumes
- 🦸 Superheroes

#### ✡️ Kosher Type (Single Select)
| Option | Icon | Description |
|--------|------|-------------|
| `kosher-style` | 🍴 | Kosher Style |
| `kosher` | ✡️ | Kosher |
| `glatt-kosher` | Ⓤ | Glatt Kosher |
| `not-kosher` | 🍽️ | Not Kosher |

#### 🍽️ Meal Type (Single Select) - *Only shown when kosher option is selected*
| Option | Icon | Description |
|--------|------|-------------|
| `dairy` | 🧀 | Dairy meal |
| `meat` | 🥩 | Meat meal |
| `pareve` | 🥗 | Pareve (neutral) |

#### 🌱 Vegetarian Options (Single Select)
| Option | Icon | Description |
|--------|------|-------------|
| `none` | 🍴 | Regular menu |
| `vegetarian` | 🥗 | Vegetarian (no meat) |
| `vegan` | 🌱 | Vegan (plant-based) |

#### 🅿️ Parking Instructions (Text Input)
Example: "Free valet, Street parking available..."

---

## 📖 Bar Mitzvah Event Form

When `eventType === "barMitzvah"` (or `"batMitzvah"`), the form adapts based on event category.

### Event Category Selection

First, the user selects what type of celebration they're planning:

| Category | Icon | Description | Affects Form |
|----------|------|-------------|--------------|
| `formal` | 🕎 | The Ceremony (Synagogue) | Shows dress code field |
| `party` | 🎉 | The Party (Celebration) | Shows party options (same as birthday) |

### Required Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `eventName` | Text Input | Name of the event | "Sarah's Bat Mitzvah" |
| `date` | Date Picker | Event date | "2026-03-20" |
| `time` | Time Picker | Event time | "10:00 AM" |
| `address1` | Google Places | Venue name | "Temple Beth Israel" |

### For Formal Events (`eventCategory === "formal"`)

Shows a **Dress Code** text input instead of party options:
- Example: "Black tie, Cocktail, Business casual..."

### For Party Events (`eventCategory === "party"`)

Shows the **same party options as Birthday**:
- Party Type
- Attire Type  
- Footwear
- Party Theme
- Kosher Type
- Meal Type (if kosher selected)
- Vegetarian Options
- Parking Instructions

---

## 👥 Step 3: Select Guests

**File:** `app/create-event/select-guests.tsx`

The user adds guests from their phone contacts.

### Guest Data Structure

```typescript
interface Guest {
    id: string;           // Unique identifier
    name: string;         // Guest name
    phone: string;        // Phone number
    status: GuestStatus;  // 'added' | 'invited' | 'confirmed' | 'paid'
    addedAt?: Date;
    invitedAt?: Date;
    confirmedAt?: Date;
    paidAt?: Date;
    paymentAmount?: number;
    paymentId?: string;
}
```

### Guest Status Flow

```
┌─────────┐     ┌──────────┐     ┌───────────┐     ┌────────┐
│  added  │ ──▶ │ invited  │ ──▶ │ confirmed │ ──▶ │  paid  │
└─────────┘     └──────────┘     └───────────┘     └────────┘
    │                │                 │               │
    │                │                 │               │
  Guest          SMS sent         RSVP'd yes      Payment
  added to                                        received
  list
```

### Features

1. **Contact Search** - Search through phone contacts
2. **Contact Permissions** - Requests access to contacts
3. **Add/Remove Guests** - Tap to add, X to remove
4. **Skip Option** - Can skip and add guests later
5. **Contact Limit** - Shows first 50 contacts, use search for more

### Buttons

| Button | Action |
|--------|--------|
| **Create Event & Review** | Creates event with selected guests |
| **Skip for now** | Creates event without guests (can add later) |

---

## 🗄️ Data Storage

When the event is created, the following happens:

1. **Event Document** is created in Firestore `events` collection
2. **User Document** is updated (eventsCreated counter)
3. **Cloud Function** (if configured) creates a Stripe Connect account

### Complete Event Object

```typescript
interface Event {
    // Identifiers
    id: string;
    creatorId: string;
    creatorName: string;
    creatorEmail: string | null;
    
    // Event Type & Details
    eventType: EventType;
    eventName: string;
    eventCategory?: EventCategory;
    age?: string;
    
    // Party Details (optional)
    partyType?: string;
    otherPartyType?: string;
    attireType?: string;
    footwearType?: string;
    theme?: string;
    customTheme?: string;
    parking?: string;
    
    // Dietary
    kosherType?: string;
    mealType?: string;
    vegetarianType?: string;
    
    // Date & Location
    date: string;
    time: string;
    address1: string;
    address2: string;
    
    // AI Poster
    posterUrl?: string;
    posterPrompt?: string;
    
    // Guests
    guests: Guest[];
    totalGuests: number;
    guestStats: GuestStats;
    
    // Stripe
    stripeAccountId?: string;
    
    // Status
    status: 'draft' | 'active' | 'completed' | 'cancelled';
    
    // Timestamps
    createdAt: Date;
    updatedAt: Date;
}
```

---

## 📱 Form Flow Diagram by Event Type

### Birthday Flow
```
Event Type: birthday
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│                    EVENT DETAILS                          │
├──────────────────────────────────────────────────────────┤
│  ✅ Age (required)                                        │
│  ✅ Event Name (required)                                 │
│  ☐ Toggle: Show Event Details                             │
│     ├── Party Type (pool/beach/garden/indoor/etc)        │
│     ├── Attire Type (casual/swimwear/costume)            │
│     ├── Footwear (sneakers/slides/any)                   │
│     ├── Party Theme                                       │
│     ├── Kosher Type                                       │
│     ├── Meal Type (if kosher)                            │
│     └── Vegetarian Options                               │
│  ✅ Date (required)                                       │
│  ✅ Time (required)                                       │
│  ✅ Location (required)                                   │
│  ☐ Parking Instructions                                   │
└──────────────────────────────────────────────────────────┘
       │
       ▼
   Select Guests
```

### Bar/Bat Mitzvah Flow
```
Event Type: barMitzvah / batMitzvah
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│                    EVENT DETAILS                          │
├──────────────────────────────────────────────────────────┤
│  ✅ Event Name (required)                                 │
│  ☐ Event Category Selection:                              │
│     ├── 🕎 Formal (Ceremony)                             │
│     │      └── Shows: Dress Code text input              │
│     │                                                     │
│     └── 🎉 Party (Celebration)                           │
│            └── Shows: Same party options as Birthday     │
│                                                           │
│  ☐ Toggle: Show Event Details                             │
│     └── (Fields based on category selection)             │
│  ✅ Date (required)                                       │
│  ✅ Time (required)                                       │
│  ✅ Location (required)                                   │
│  ☐ Parking Instructions                                   │
└──────────────────────────────────────────────────────────┘
       │
       ▼
   Select Guests
```

---

## 📁 File Structure

```
app/create-event/
├── _layout.tsx           # Stack navigation layout
├── event-type.tsx        # Step 1: Event type selection
├── event-details.tsx     # Step 2: Event details form
└── select-guests.tsx     # Step 3: Guest selection

types/
└── events.ts             # TypeScript types & Firestore converters

src/lib/
└── eventService.ts       # Event CRUD operations
```

---

## 🎨 UI/UX Notes

- **Progress Bar**: Shows progress through the 3-step flow
- **Animations**: Fade-in effects and progress bar animations
- **Validation**: Required fields are validated before proceeding
- **Error Messages**: Displayed with ⚠️ icon below fields
- **Toggle for Optional Fields**: "Fill in details now" toggle to show/hide optional fields
- **Color Scheme**: 
  - Step 1 (Event Type): Yellow header (#FBBF24)
  - Step 2 (Details): Green header (#06D6A0)
  - Step 3 (Guests): Purple header (#8B5CF6)
- **Date/Time Pickers**: Native iOS inline pickers in modal
- **Location**: Google Places autocomplete integration

