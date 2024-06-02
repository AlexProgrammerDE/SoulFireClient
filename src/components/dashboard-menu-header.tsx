import {
    Menubar,
    MenubarContent,
    MenubarItem,
    MenubarMenu, MenubarRadioGroup, MenubarRadioItem, MenubarSeparator,
    MenubarShortcut, MenubarSub, MenubarSubContent, MenubarSubTrigger,
    MenubarTrigger
} from "@/components/ui/menubar.tsx";
import {useTheme} from "next-themes";
import {isTauri} from "@/lib/utils.ts";
import {exit} from "@tauri-apps/api/process";
import {AboutPopup} from "@/components/about-popup.tsx";
import { useState } from "react";

export const DashboardMenuHeader = () => {
    const { theme, setTheme } = useTheme()
    const [aboutOpen, setAboutOpen] = useState(false)

    return (
        <>
            <Menubar data-tauri-drag-region className="rounded-none">
                <MenubarMenu>
                    <MenubarTrigger>File</MenubarTrigger>
                    <MenubarContent>
                        <MenubarItem>
                            Load Profile <MenubarShortcut>⌘L</MenubarShortcut>
                        </MenubarItem>
                        <MenubarItem>
                            Save Profile <MenubarShortcut>⌘S</MenubarShortcut>
                        </MenubarItem>
                        {
                            isTauri() && (
                                <>
                                    <MenubarSeparator/>
                                    <MenubarItem onClick={() => exit(0)}>Exit</MenubarItem>
                                </>
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
