"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-toastify"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Wallet, Lock, Loader2 } from "lucide-react"

export function CreatorLoginComponent() {
  const [solAddress, setSolAddress] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!solAddress.trim()) {
      toast.error("Please enter your SOL address")
      return
    }
    setIsLoading(true)
    try {
      // Soft login — store the wallet locally and route to the dashboard.
      // Full SIWS flow lives behind /api/auth/nonce + /api/auth/verify (phase 1).
      if (typeof window !== "undefined") {
        window.localStorage.setItem("dashh_wallet", solAddress.trim())
      }
      toast.success("Signed in")
      router.push("/creatordashboard")
    } catch (err) {
      console.error(err)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleConnectPhantom = async () => {
    if (typeof window === "undefined") return
    const { solana }: any = window
    if (!solana?.isPhantom) {
      toast.info("Install Phantom Wallet to continue", {
        onClick: () => window.open("https://phantom.app/", "_blank"),
      })
      return
    }
    try {
      const resp = await solana.connect()
      setSolAddress(resp.publicKey.toString())
      toast.success("Wallet connected")
    } catch (err) {
      console.error(err)
      toast.error("Failed to connect Phantom")
    }
  }

  const handleForgotPassword = () => {
    toast.info("Password-less login: use your Phantom wallet to sign in.")
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-900 text-white border-gray-800">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Creator Login</CardTitle>
          <CardDescription className="text-gray-400 text-center">
            Enter your SOL address to access your creator dashboard
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sol-address" className="text-gray-300">SOL Address</Label>
              <div className="relative">
                <Wallet className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
                <Input
                  id="sol-address"
                  placeholder="Enter your SOL address"
                  value={solAddress}
                  onChange={(e) => setSolAddress(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleConnectPhantom}
                className="w-full mt-2 bg-transparent border-gray-700 text-gray-200 hover:bg-gray-800"
              >
                Connect Phantom instead
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">Password (optional)</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
                <Input
                  id="password"
                  type="password"
                  placeholder="Leave blank if using Phantom"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in…
                </>
              ) : (
                "Log In"
              )}
            </Button>
          </CardFooter>
        </form>
        <div className="text-center pb-6">
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-sm text-purple-400 hover:text-purple-300"
          >
            Forgot password?
          </button>
        </div>
      </Card>
    </div>
  )
}
