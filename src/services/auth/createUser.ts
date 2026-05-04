import { supabase } from '@/integrations/supabase/client';

export const createUser = async ({
  email,
  password,
  name,
  role,
  currentUserRole,
}: {
  email: string;
  password: string;
  name: string;
  role: string;
  currentUserRole: string;
}) => {
  // 🔐 Validasi role (PENTING)
  if (currentUserRole !== 'admin' && currentUserRole !== 'global_super_admin') {
    return {
      success: false,
      message: 'Unauthorized',
    };
  }

  // Batasi admin
  if (currentUserRole === 'admin' && role === 'admin') {
    return {
      success: false,
      message: 'Admin tidak bisa membuat admin lain',
    };
  }

  // Create user (sementara pakai signup)
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        role,
      },
    },
  });

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true, data };
};
