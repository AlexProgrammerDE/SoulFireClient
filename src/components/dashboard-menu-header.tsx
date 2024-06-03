import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger
} from "@/components/ui/menubar.tsx";
import {useTheme} from "next-themes";
import {isTauri} from "@/lib/utils.ts";
import {exit} from "@tauri-apps/api/process";
import {AboutPopup} from "@/components/about-popup.tsx";
import {useContext, useState} from "react";
import {useNavigate} from "@tanstack/react-router";
import {ProfileContext} from "@/components/providers/profile-context.tsx";

export const DashboardMenuHeader = () => {
  const {theme, setTheme} = useTheme()
  const [aboutOpen, setAboutOpen] = useState(false)
  const navigate = useNavigate()
  const profile = useContext(ProfileContext)

  const loadProfile = async () => {
  }

  const saveProfile = async () => {

  }

  return (
      <>
        <Menubar data-tauri-drag-region className="rounded-none border-l-0 border-r-0 border-t-0">
          <MenubarMenu>
            <MenubarTrigger>
              <img src="/logo.png" alt="SoulFIre logo" className="h-6"/>
            </MenubarTrigger>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={loadProfile}>
                Load Profile
              </MenubarItem>
              <MenubarItem onClick={saveProfile}>
                Save Profile
              </MenubarItem>
              <MenubarSeparator/>
              <MenubarItem onClick={() => {
                void navigate({
                  to: "/",
                  replace: true
                })
              }}>Log out</MenubarItem>
              {
                  isTauri() && (
                      <MenubarItem onClick={() => exit(0)}>Exit</MenubarItem>
                  )
              }
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>View</MenubarTrigger>
            <MenubarContent>
              <MenubarSub>
                <MenubarSubTrigger>Theme</MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarRadioGroup value={theme} onValueChange={e => setTheme(e)}>
                    <MenubarRadioItem value="system">System</MenubarRadioItem>
                    <MenubarRadioItem value="dark">Dark</MenubarRadioItem>
                    <MenubarRadioItem value="light">Light</MenubarRadioItem>
                  </MenubarRadioGroup>
                </MenubarSubContent>
              </MenubarSub>
              <MenubarSub>
                <MenubarSubTrigger>Terminal</MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarRadioGroup value="default">
                    <MenubarRadioItem value="default">Default</MenubarRadioItem>
                  </MenubarRadioGroup>
                </MenubarSubContent>
              </MenubarSub>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>Help</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>
                Save logs
              </MenubarItem>
              <MenubarSeparator/>
              <MenubarItem onClick={() => setAboutOpen(true)}>About</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
        <AboutPopup open={aboutOpen} setOpen={setAboutOpen}/>
      </>
  )
}
