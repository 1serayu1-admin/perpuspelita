
-- Atomic function to decrement book available count safely
CREATE OR REPLACE FUNCTION public.decrement_book_available(_book_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  rows_affected int;
BEGIN
  UPDATE public.books
  SET available = available - 1, updated_at = now()
  WHERE id = _book_id AND available > 0;
  
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected > 0;
END;
$$;

-- Atomic function to increment book available count safely
CREATE OR REPLACE FUNCTION public.increment_book_available(_book_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  rows_affected int;
BEGIN
  UPDATE public.books
  SET available = available + 1, updated_at = now()
  WHERE id = _book_id AND available < stock;
  
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected > 0;
END;
$$;
