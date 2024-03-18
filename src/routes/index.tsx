import {createFileRoute, useNavigate} from '@tanstack/react-router'
import {z} from "zod";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from "@/components/ui/form.tsx";
import {Input} from "@/components/ui/input.tsx";
import {Button} from "@/components/ui/button.tsx";
import {isTauri} from "@/lib/utils.ts";
import {exit} from "@tauri-apps/api/process";

export const Route = createFileRoute('/')({
    component: Index,
})

function Index() {
    return (
        <div className="min-h-screen w-screen flex container">
            <LoginForm/>
        </div>
    )
}

const formSchema = z.object({
    address: z.string()
        .min(1, "Address is required")
        .max(255, "Address is too long")
        .url("Address must be a valid URL"),
    token: z.string()
        .min(1, "Token is required")
        .max(255, "Token is too long"),
})

const LoginForm = () => {
    const navigate = useNavigate()
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            address: "",
            token: ""
        },
    })

    function onSubmit(values: z.infer<typeof formSchema>) {
        localStorage.setItem("server-address", values.address.trim())
        localStorage.setItem("server-token", values.token.trim())

        navigate({
            to: "/dashboard",
            replace: true
        }).then()
    }

    return (
        <Card className="w-[350px] m-auto">
            <CardHeader>
                <CardTitle>Connect to a SoulFire server</CardTitle>
                <CardDescription>SoulFire requires you to connect to a server for you to control using the
                    client.</CardDescription>
            </CardHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="address"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Address</FormLabel>
                                    <FormControl>
                                        <Input placeholder="http://localhost:38765" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        Address of the server you want to connect to.
                                    </FormDescription>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="token"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Token</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Secret token" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        Token to authenticate with the server.
                                    </FormDescription>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        {
                            isTauri() ? (
                                <Button variant="outline" onClick={e => {
                                    e.preventDefault()
                                    exit(0).then(console.log)
                                }}>Exit</Button>
                            ) : <div></div> // To prevent the connect-button from being pushed to the left
                        }
                        <Button type="submit">Connect</Button>
                    </CardFooter>
                </form>
            </Form>
        </Card>
    )
}
