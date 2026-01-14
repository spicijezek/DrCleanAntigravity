# Implementation Plan: Client Dashboard Refactoring & UI/UX Improvements

## Objective
Modernize and optimize the Client Dashboard to meet the "premium" and "rich aesthetic" requirements while improving code maintainability and performance.

## Strategy
1. **Refactor Data Fetching**: Replace the complex `useEffect`-based data fetching with `React Query` hooks. This improves cache management, loading states, and automatic background updates.
2. **Componentization**: Break down the monolithic `ClientDashboard.tsx` into smaller, focused components.
3. **UI/UX Enhancements**: 
   - Implement smooth transitions using `tailwindcss-animate`.
   - improved typography and spacing.
   - Add glassmorphism effects where appropriate.

## Detailed Tasks

### 1. Create Data Hooks
Create a reusable hook `useClientDashboardData` in `src/hooks/useClientDashboardData.ts` that handles:
- Fetching client profile.
- Fetching bookings with related data (team members, checklists, invoices).
- Fetching loyalty credits.
- Fetching notifications.
- Real-time subscriptions (optional, or integrated via `invalidateQueries`).

### 2. Extract Components
Create the following components in `src/components/client/dashboard/`:
- `BookingStatusTimeline.tsx`: The status progress bar logic.
- `BookingCard.tsx`: The main card for each booking.
- `StaffAssignment.tsx`: The section showing assigned team members.
- `DashboardHeader.tsx`: Welcome message and summary.

### 3. Refactor `ClientDashboard.tsx`
- Replace internal state and effects with the new hook.
- Render the extracted components.
- clean up the render logic.

### 4. Visual Polish
- Apply `backdrop-blur` and subtle gradients to cards.
- enhance the status timeline with smoother animations.
