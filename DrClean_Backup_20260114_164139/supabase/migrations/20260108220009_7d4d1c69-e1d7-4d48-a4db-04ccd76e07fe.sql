-- Fix the rating constraint to allow 0 for declined feedback
ALTER TABLE public.booking_feedback DROP CONSTRAINT IF EXISTS booking_feedback_rating_check;
ALTER TABLE public.booking_feedback ADD CONSTRAINT booking_feedback_rating_check 
  CHECK ((declined = true AND rating = 0) OR (declined = false AND rating >= 1 AND rating <= 10));