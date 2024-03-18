import {
    Menubar,
    MenubarContent,
    MenubarItem,
    MenubarMenu, MenubarRadioGroup, MenubarRadioItem, MenubarSeparator,
    MenubarShortcut, MenubarSub, MenubarSubContent, MenubarSubTrigger,
    MenubarTrigger
} from "@/components/ui/menubar.tsx";
import {useTheme} from "next-themes";

export const DashboardMenuHeader = () => {
    const { theme, setTheme } = useTheme()
    console.log(theme)

    return (
        <Menubar data-tauri-drag-region className="my-4">
            <MenubarMenu>
                <MenubarTrigger>File</MenubarTrigger>
                <MenubarContent>
                    <MenubarItem>
                        Load Profile <MenubarShortcut>⌘L</MenubarShortcut>
                    </MenubarItem>
                    <MenubarItem>
                        Save Profile <MenubarShortcut>⌘S</MenubarShortcut>
                    </MenubarItem>
                    <MenubarSeparator/>
                    <MenubarItem>Exit</MenubarItem>
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
                    <MenubarItem>About</MenubarItem>
                </MenubarContent>
            </MenubarMenu>
        </Menubar>
    )
}
