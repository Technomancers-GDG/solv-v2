# Design System Color Palette & Styling Guide

## Overview
The common components now feature a cohesive, premium human-designed color system with improved typography, spacing, and interactions. The design balances modern aesthetics with professional functionality.

---

## Color Palette

### Primary Colors
- **Primary Dark**: `#0F4C81` - Used for hover states and emphasis
- **Primary**: `#1068B8` - Main brand color for buttons, links, and accents
- **Primary Light**: `#E8F1FC` - Light background for highlighted cards

### Semantic Colors
- **Success**: `#059669` - Success states, positive actions
- **Success Light**: `#D1F4E8` - Success background
- **Warning**: `#B45309` - Warning/cautionary states
- **Warning Light**: `#FEF3C7` - Warning background
- **Error**: `#DC2626` - Error/danger states
- **Error Light**: `#FEE2E2` - Error background

### Neutral Colors
- **Neutral 50**: `#F9FAFB` - Lightest gray, backgrounds
- **Neutral 100**: `#F3F4F6` - Very light backgrounds
- **Neutral 200**: `#E5E7EB` - Borders, dividers
- **Neutral 300**: `#D1D5DB` - Secondary borders
- **Neutral 400**: `#9CA3AF` - Placeholder text
- **Neutral 500**: `#6B7280` - Secondary text, captions
- **Neutral 600**: `#4B5563` - Medium text
- **Neutral 700**: `#374151` - Dark text
- **Neutral 800**: `#1F2937` - Darker text
- **Neutral 900**: `#111827` - Darkest text

---

## Component Styling Guide

### Header (`Header.jsx`, `Header.css`)
- **Background**: Gradient (white to neutral-50)
- **Logo**: Blue gradient with shadow
- **Buttons**: Elevated with smooth transitions
- **Key Features**:
  - Premium spacing (18-36px)
  - Smooth hover animations
  - Status indicators with pulse effects
  - Professional branding badge

### AI Decision Widgets (`AIDecisionWidgets.jsx`, `AIDecisionWidgets.css`)
- **Decision Panel**: Gradient background with layered shadows
- **Impact Items**: Green-bordered with success light backgrounds
- **Route Comparison**: Side-by-side cards with directional arrows
- **Key Features**:
  - Flash animation for new decisions (warning color)
  - Smooth hover transitions
  - Color-coded confidence badges
  - Improved list styling with icons

### Tab Navigation (`TabNavigation.jsx`, `TabNavigation.css`)
- **Active Tab**: Blue gradient underline
- **Live Indicator**: Green pulse animation
- **Key Features**:
  - Modern underline indicator
  - Smooth color transitions
  - Connected status pulse

### Language Switcher (`LanguageSwitcher.jsx`, `LanguageSwitcher.css`)
- **Inactive**: White background with subtle borders
- **Active**: Blue gradient with shadow
- **Key Features**:
  - Smooth transitions
  - Professional rounded corners
  - Hover elevation effect

### Loading Spinner (`LoadingSpinner.jsx`, `LoadingSpinner.css`)
- **Spinner**: Premium rotating ring with gradient border
- **Key Features**:
  - Smooth rotation animation
  - Subtle shadow effect
  - Professional appearance

### Status Pill (`StatusPill.jsx`, `StatusPill.css`)
- **Design**: Gradient background with shadows
- **Key Features**:
  - Clean label-value layout
  - Professional spacing
  - Subtle hover effects

### UI Primitives (`UiPrimitives.jsx`, `UiPrimitives.css`)

#### Panel
- Gradient background with improved shadows
- Border animations on hover
- Professional padding and spacing

#### Metric Card (KPI Tile)
- Gradient backgrounds
- Large, bold metric values
- Color-coded metrics (glow-* classes)
- Context information with trending

#### Progress Bar
- Gradient fill
- Subtle glow effect
- Smooth animations

#### Form Fields
- Clean, modern borders
- Focus ring with color
- Smooth transitions
- Professional typography

---

## Key Design Principles

### 1. **Gradients & Layers**
- Used strategically for visual hierarchy
- Subtle 135-degree gradients on backgrounds
- Layered shadows for depth

### 2. **Typography**
- **Headings**: Bold, letter-spacing for emphasis
- **Labels**: Uppercase, minimal, professional
- **Body**: Clean line-height (1.6-1.7) for readability
- **Weights**: 500 (regular), 600 (semibold), 700 (bold), 800 (extra-bold)

### 3. **Spacing**
- Consistent 8px grid system
- 18-28px padding on containers
- 10-20px gaps between elements
- Breathing room in all directions

### 4. **Transitions**
- `cubic-bezier(0.4, 0, 0.2, 1)` for smooth easing
- 200-300ms duration for interactions
- Consistent animation language

### 5. **Shadows**
- Layered shadows for depth: `0 4px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)`
- Subtle hover elevation
- Consistent across all components

### 6. **Borders**
- 1-1.5px borders for definition
- Rounded corners: 8-12px (components), 20-22px (pills)
- Color-coded for semantic meaning

---

## Usage Examples

### Color Variables in CSS
```css
background: linear-gradient(135deg, #FFFFFF 0%, var(--neutral-50) 100%);
border: 1px solid var(--neutral-200);
color: var(--primary);
box-shadow: 0 4px 12px rgba(16, 104, 184, 0.15);
```

### Semantic States
- **Success**: `var(--success)` + `var(--success-light)`
- **Warning**: `var(--warning)` + `var(--warning-light)`
- **Error**: `var(--error)` + `var(--error-light)`
- **Neutral**: `var(--neutral-500)` through `var(--neutral-900)`

---

## Browser & Accessibility
- **Scrollbar Styling**: Custom webkit scrollbar with hover effects
- **Focus States**: 3px outline with 2px offset
- **Contrast**: WCAG AA compliant color combinations
- **Motion**: Respects prefers-reduced-motion preferences

---

## Files Updated
- ✅ `Header.css` - Premium header styling
- ✅ `AIDecisionWidgets.css` - Decision panels and route comparison
- ✅ `UiPrimitives.css` - Core UI components
- ✅ `TabNavigation.css` - Tab system with indicators
- ✅ `LanguageSwitcher.css` - Language selection
- ✅ `LoadingSpinner.css` - Loading animation
- ✅ `StatusPill.css` - Status badges
- ✅ `styles.css` - Global color variables

All JSX files have been updated with proper CSS imports.
