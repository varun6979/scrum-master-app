import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface OrgMemberProfile {
  id: string;             // org_members.id
  orgId: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  avatarInitials: string;
  avatarColor: string;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  orgMember: OrgMemberProfile | null;
  organization: Organization | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, fullName: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  createOrg: (name: string) => Promise<string | null>;
  joinOrg: (slug: string) => Promise<string | null>;
  refreshOrg: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [orgMember, setOrgMember] = useState<OrgMemberProfile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadOrgForUser(userId: string) {
    const { data } = await supabase
      .from('org_members')
      .select('*, organizations(*)')
      .eq('user_id', userId)
      .limit(1)
      .single();

    if (data) {
      setOrgMember({
        id: data.id,
        orgId: data.org_id,
        userId: data.user_id,
        name: data.name,
        email: data.email ?? '',
        role: data.role,
        avatarInitials: data.avatar_initials,
        avatarColor: data.avatar_color,
      });
      const org = data.organizations as Record<string, string>;
      setOrganization({ id: org.id, name: org.name, slug: org.slug });
    } else {
      setOrgMember(null);
      setOrganization(null);
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const s = data.session;
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        loadOrgForUser(s.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        loadOrgForUser(s.user.id);
      } else {
        setOrgMember(null);
        setOrganization(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string): Promise<string | null> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error?.message ?? null;
  }

  async function signUp(email: string, password: string, fullName: string): Promise<string | null> {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    return error?.message ?? null;
  }

  async function signOut() {
    await supabase.auth.signOut();
    setOrgMember(null);
    setOrganization(null);
  }

  async function createOrg(name: string): Promise<string | null> {
    if (!user) return 'Not authenticated';
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 40) + '-' + Date.now().toString(36);

    const { data: org, error: orgErr } = await supabase
      .from('organizations')
      .insert({ name, slug, created_by: user.id })
      .select()
      .single();

    if (orgErr) return orgErr.message;

    const initials = name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
    const { error: memberErr } = await supabase.from('org_members').insert({
      org_id: org.id,
      user_id: user.id,
      name: user.user_metadata?.full_name ?? email ?? 'Owner',
      email: user.email,
      role: 'owner',
      avatar_initials: initials || 'OW',
      avatar_color: '#6366F1',
      capacity_points: 40,
    });

    if (memberErr) return memberErr.message;

    await loadOrgForUser(user.id);
    return null;
  }

  async function joinOrg(slug: string): Promise<string | null> {
    if (!user) return 'Not authenticated';

    const { data: org, error: orgErr } = await supabase
      .from('organizations')
      .select('*')
      .eq('slug', slug.trim())
      .single();

    if (orgErr || !org) return 'Organization not found. Check the invite code.';

    const initials = (user.user_metadata?.full_name ?? user.email ?? 'U')
      .split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

    const colors = ['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    const { error: memberErr } = await supabase.from('org_members').insert({
      org_id: org.id,
      user_id: user.id,
      name: user.user_metadata?.full_name ?? user.email ?? 'Member',
      email: user.email,
      role: 'developer',
      avatar_initials: initials || 'MB',
      avatar_color: color,
      capacity_points: 40,
    });

    if (memberErr) {
      if (memberErr.code === '23505') return 'You are already a member of this organization.';
      return memberErr.message;
    }

    await loadOrgForUser(user.id);
    return null;
  }

  async function refreshOrg() {
    if (user) await loadOrgForUser(user.id);
  }

  const email = user?.email;

  return (
    <AuthContext.Provider value={{
      session, user, orgMember, organization, loading,
      signIn, signUp, signOut, createOrg, joinOrg, refreshOrg,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
