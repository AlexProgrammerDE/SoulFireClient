import { createContext, ReactNode, useState } from 'react';
import { ProfileRoot } from '@/lib/types.ts';

export const ProfileContext = createContext<{
  profile: ProfileRoot;
  setProfile: (profile: ProfileRoot) => void;
}>(null as never);

export default function ProfileProvider({
  children,
  instanceProfile,
}: {
  children: ReactNode;
  instanceProfile: ProfileRoot;
}) {
  const [profile, setProfile] = useState(instanceProfile);

  return (
    <ProfileContext.Provider
      value={{
        profile,
        setProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}
