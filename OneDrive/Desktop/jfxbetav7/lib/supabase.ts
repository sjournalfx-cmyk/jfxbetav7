import { createClient } from '@supabase/supabase-js';

const env = (import.meta as any).env ?? {};
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const missingEnvError = new Error('Supabase environment variables are not configured.');

const createNoopProxy = (terminalResult: any = undefined): any =>
  new Proxy(() => {}, {
    get: (_target, prop) => {
      if (prop === 'then') return undefined;
      if (prop === 'catch') return undefined;
      if (prop === 'finally') return undefined;
      if (prop === Symbol.toPrimitive) return () => '';
      return createNoopProxy(terminalResult);
    },
    apply: () => terminalResult,
  });

const createNoopQueryBuilder = () => {
  const builder: any = createNoopProxy({
    data: null,
    error: missingEnvError,
    count: 0,
  });

  const terminal = {
    single: async () => ({ data: null, error: missingEnvError }),
    maybeSingle: async () => ({ data: null, error: null }),
    select: () => builder,
    insert: async () => ({ data: null, error: missingEnvError }),
    update: () => builder,
    upsert: async () => ({ data: null, error: missingEnvError }),
    delete: () => builder,
    eq: () => builder,
    neq: () => builder,
    gt: () => builder,
    gte: () => builder,
    lt: () => builder,
    lte: () => builder,
    in: () => builder,
    contains: () => builder,
    overlaps: () => builder,
    order: () => builder,
    limit: () => builder,
    range: () => builder,
    match: () => builder,
    ilike: () => builder,
    like: () => builder,
    is: () => builder,
    filter: () => builder,
    not: () => builder,
    or: () => builder,
    csv: async () => '',
    then: undefined,
  };

  return new Proxy(terminal, {
    get: (target, prop) => {
      if (prop in target) return (target as any)[prop];
      return builder[prop as keyof typeof builder];
    },
  });
};

const createNoopChannel = () => ({
  on: () => createNoopChannel(),
  subscribe: async () => ({ data: null, error: null }),
});

const noopSupabase = {
  auth: {
    getUser: async () => ({ data: { user: null }, error: missingEnvError }),
    getSession: async () => ({ data: { session: null }, error: missingEnvError }),
    signInWithPassword: async () => ({ data: null, error: missingEnvError }),
    signUp: async () => ({ data: null, error: missingEnvError }),
    signOut: async () => ({ data: null, error: null }),
    updateUser: async () => ({ data: null, error: missingEnvError }),
  },
  from: () => createNoopQueryBuilder(),
  storage: {
    from: () => ({
      upload: async () => ({ data: null, error: missingEnvError }),
      remove: async () => ({ data: null, error: missingEnvError }),
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
    }),
  },
  channel: () => createNoopChannel(),
  removeChannel: () => {},
  rpc: async () => ({ data: null, error: missingEnvError }),
} as const;

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (noopSupabase as any);
