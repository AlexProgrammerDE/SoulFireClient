import { createContext } from 'react';
import { ProfileRoot } from '@/lib/types.ts';

export const ProfileContext = createContext<ProfileRoot>(null as never);
