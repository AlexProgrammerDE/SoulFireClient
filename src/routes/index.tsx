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
import {useEffect, useState} from "react";
import {LaptopMinimalIcon, LoaderCircleIcon, ServerIcon} from "lucide-react";
import {isTauri} from "@/lib/utils.ts";
import {invoke} from "@tauri-apps/api";
import {listen} from "@tauri-apps/api/event";
import {LOCAL_STORAGE_SERVER_ADDRESS_KEY, LOCAL_STORAGE_SERVER_TOKEN_KEY} from "@/lib/types.ts";

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  return (
      <div className="h-screen w-screen flex container">
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

type LoginType = "INTEGRATED" | "REMOTE"

const LoginForm = () => {
  const navigate = useNavigate()
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      address: "",
      token: ""
    },
  })
  const [loginType, setLoginType] = useState<LoginType | null>(null)
  const [latestLog, setLatestLog] = useState<string>("Preparing to start integrated server...")
  const [integratedServerLoading, setIntegratedServerLoading] = useState(false)
  const isIntegratedServerAvailable = isTauri()

  function redirectWithCredentials(address: string, token: string) {
    localStorage.setItem(LOCAL_STORAGE_SERVER_ADDRESS_KEY, address.trim())
    localStorage.setItem(LOCAL_STORAGE_SERVER_TOKEN_KEY, token.trim())

    void navigate({
      to: "/dashboard",
      replace: true
    })
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
    redirectWithCredentials(values.address, values.token)
  }

  // Hook for loading the integrated server
  useEffect(() => {
    if (loginType === "INTEGRATED" && !integratedServerLoading) {
      setIntegratedServerLoading(true)
      void listen('integrated-server-start-log', (event) => {
        setLatestLog(event.payload as string)
      })
      invoke("run_integrated_server").then(payload => {
        const payloadString = payload as string
        const split = payloadString.split("\n")

        redirectWithCredentials(split[0], split[1])
      })
    }
  }, [loginType, integratedServerLoading, latestLog])

  return (
      <Card className="w-full max-w-[450px] m-auto border-none">
        <CardHeader>
          <CardTitle>Connect to a SoulFire server</CardTitle>
          {
            null === loginType ? (
                <CardDescription>Integrated server runs a bundled server on the client. Remote connects to a remote
                  dedicated SoulFire server.</CardDescription>
            ) : null
          }
          {
            "INTEGRATED" === loginType ? (
                <CardDescription>{latestLog}</CardDescription>
            ) : null
          }
          {
            "REMOTE" === loginType ? (
                <CardDescription>Put in the address and token of the server you want to connect to.</CardDescription>
            ) : null
          }
        </CardHeader>
        {
          null === loginType ? (
              <CardContent className="flex flex-col gap-2">
                <div className="flex flex-col gap-1 w-full">
                  <Button disabled={!isIntegratedServerAvailable} variant="outline" className="flex gap-2 w-full"
                          onClick={() => setLoginType("INTEGRATED")}>
                    <LaptopMinimalIcon className="w-6 h-6"/>
                    <p>Use integrated server</p>
                  </Button>
                  {
                    !isIntegratedServerAvailable ? (
                        <p className="text-xs text-gray-500">Integrated server is not available on this platform.</p>
                    ) : null
                  }
                </div>
                <Button variant="outline" className="flex gap-2 w-full" onClick={() => setLoginType("REMOTE")}>
                  <ServerIcon className="w-6 h-6"/>
                  <p>Connect to remote server</p>
                </Button>
              </CardContent>
          ) : null
        }
        {
          "INTEGRATED" === loginType ? (
              <CardContent className="flex w-full h-32">
                <LoaderCircleIcon className="w-12 h-12 animate-spin m-auto"/>
              </CardContent>
          ) : null
        }
        {
          "REMOTE" === loginType ? (
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
                    <Button variant="outline" onClick={e => {
                      e.preventDefault()
                      setLoginType(null)
                    }}>Back</Button>
                    <Button type="submit">Connect</Button>
                  </CardFooter>
                </form>
              </Form>
          ) : null
        }
      </Card>
  )
}
