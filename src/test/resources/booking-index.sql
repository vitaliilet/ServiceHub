CREATE UNIQUE INDEX IF NOT EXISTS ux_booking_confirmed_slot
    ON public.booking (specialist_id, booking_date, booking_time)
    WHERE status = 'CONFIRMED';