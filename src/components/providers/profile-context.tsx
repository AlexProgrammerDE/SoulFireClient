import {createContext} from "react";
import {DEFAULT_PROFILE, ProfileRoot} from "@/lib/types.ts";

export const ProfileContext = createContext<ProfileRoot>(DEFAULT_PROFILE)
