CREATE TABLE IF NOT EXISTS public.ai_quotas (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    daily_limit integer NOT NULL DEFAULT 10,
    questions_used integer NOT NULL DEFAULT 0,
    last_reset_date date NOT NULL DEFAULT CURRENT_DATE,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

ALTER TABLE public.ai_quotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own quota" ON public.ai_quotas
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.decrement_ai_quota(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_quota public.ai_quotas;
    v_today date := CURRENT_DATE;
BEGIN
    SELECT * INTO v_quota FROM public.ai_quotas WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        INSERT INTO public.ai_quotas (user_id, daily_limit, questions_used, last_reset_date)
        VALUES (p_user_id, 10, 1, v_today)
        RETURNING * INTO v_quota;
        
        RETURN json_build_object('success', true, 'remaining', v_quota.daily_limit - v_quota.questions_used);
    END IF;

    IF v_quota.last_reset_date < v_today THEN
        UPDATE public.ai_quotas 
        SET questions_used = 1, last_reset_date = v_today, updated_at = now()
        WHERE id = v_quota.id
        RETURNING * INTO v_quota;
        
        RETURN json_build_object('success', true, 'remaining', v_quota.daily_limit - v_quota.questions_used);
    END IF;

    IF v_quota.questions_used >= v_quota.daily_limit THEN
        RETURN json_build_object('success', false, 'error', 'Quota exceeded');
    END IF;

    UPDATE public.ai_quotas 
    SET questions_used = questions_used + 1, updated_at = now()
    WHERE id = v_quota.id
    RETURNING * INTO v_quota;

    RETURN json_build_object('success', true, 'remaining', v_quota.daily_limit - v_quota.questions_used);
END;
$$;
