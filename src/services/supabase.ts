import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL;

const supabaseKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'As variáveis do Supabase não foram configuradas no arquivo .env.'
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      // No Android/iOS usamos AsyncStorage.
      // No navegador o Supabase utiliza o
      // armazenamento web padrão.
      ...(Platform.OS !== 'web'
        ? {
            storage: AsyncStorage,
          }
        : {}),

      autoRefreshToken: true,
      persistSession: true,

      // O projeto não está usando callback OAuth
      // pela URL.
      detectSessionInUrl: false,
    },
  }
);