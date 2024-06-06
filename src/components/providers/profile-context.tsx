import {createContext, ReactNode, useState} from "react";
import {DEFAULT_PROFILE, ProfileRoot} from "@/lib/types.ts";

export const ProfileContext = createContext<{
  profile: ProfileRoot
  setProfile: (profile: ProfileRoot) => void
}>(null as never)

export default function ProfileProvider({children}: { children: ReactNode }) {
  const [profile, setProfile] = useState(DEFAULT_PROFILE)

  return <ProfileContext.Provider value={{
    profile,
    setProfile
  }}>
    {children}
  </ProfileContext.Provider>
}
