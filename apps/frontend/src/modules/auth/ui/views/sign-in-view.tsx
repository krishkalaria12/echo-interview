"use client";

import { z } from "zod";
import { OctagonAlertIcon } from "lucide-react";
import { FaGoogle, FaGithub } from "react-icons/fa";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Alert,
    AlertTitle,
} from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
    Card, 
    CardContent 
} from "@/components/ui/card";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

const formSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1, { message: "Password is required" }),
});

export const SignInView = () => {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [isPending, setIsPending] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const onSubmit = async (data: z.infer<typeof formSchema>) => {
        setError(null);
        setIsPending(true);
        await authClient.signIn.email(
            {
                email: data.email,
                password: data.password,
            },
            {
                onSuccess: () => {
                    setError(null);
                    router.push("/");
                },
                onError: ({ error }) => {
                    setError(error.message);
                },
                onSettled: () => {
                    setIsPending(false);
                },
            }
        )
    };

    const handleSocialSignIn = async (provider: "google" | "github") => {
        setError(null);
        setIsPending(true);
        await authClient.signIn.social(
            {
                provider,
                callbackURL: "/",
            },
            {
                onSuccess: () => {
                    setError(null);
                },
                onError: ({ error }) => {
                    setError(error.message);
                },
                onSettled: () => {
                    setIsPending(false);
                },
            }
        )
    };

    return (
        <div className="flex flex-col gap-6">
            <Card className="overflow-hidden p-0">
                <CardContent className="grid p-0 md:grid-cols-2">
                <Form {...form}>
                    <form 
                        className="p-6 md:p-8"
                        onSubmit={form.handleSubmit(onSubmit)}
                    >
                        <div className="flex flex-col gap-6">
                            <div className="flex flex-col items-center text-center">
                                <h1 className="text-2xl font-bold">
                                    Welcome back
                                </h1>
                                <p className="text-muted-foreground text-balance">
                                    Login to your account
                                </p>
                            </div>
                            <div className="grid gap-3">
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input 
                                                    placeholder="you@example.com" 
                                                    {...field}
                                                    type="email"
                                                    disabled={isPending}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid gap-3">
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Password</FormLabel>
                                            <FormControl>
                                                <Input 
                                                    placeholder="********" 
                                                    {...field}
                                                    type="password"
                                                    disabled={isPending}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            {!!error && (
                                <Alert className="bg-destructive/10" variant="destructive">
                                    <OctagonAlertIcon className="h-4 w-4 text-destructive" />
                                    <AlertTitle>Error</AlertTitle>
                                </Alert>
                            )}
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isPending}
                            >
                                {isPending ? "Signing in..." : "Sign in"}
                            </Button>
                            <div 
                                className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                                <span className="bg-card text-muted-foreground relative z-10 px-2">
                                    Or continue with
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Button 
                                    variant="outline" 
                                    type="button" 
                                    className="w-full"
                                    onClick={() => {
                                        handleSocialSignIn("google");
                                    }}
                                >
                                    <FaGoogle className="mr-2" />
                                    Google
                                </Button>
                                <Button 
                                    variant="outline" 
                                    type="button" 
                                    className="w-full"
                                    onClick={() => {
                                        handleSocialSignIn("github");
                                    }}
                                >
                                    <FaGithub className="mr-2" />
                                    Github
                                </Button>
                            </div>
                            <div className="text-center text-sm">
                                Don&apos;t have an account?{" "}
                                <Link 
                                    href="/sign-up" 
                                    className="underline underline-offset-4">
                                    Sign up
                                </Link>
                            </div>
                        </div>
                    </form>
                </Form>


                <div className="bg-gradient-to-green-900 relative hidden md:flex flex-col gap-y-4 items-center justify-center">
                    <img src="/logo/logo.svg" alt="Image" className="h-[92px] w-[92px]" />
                    <p className="text-2xl font-semibold text-black">
                    Echo Interviews
                    </p>
                </div>
                </CardContent>
            </Card>

            <div 
                className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
                By clicking continue, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
            </div>
        </div>
    );
};