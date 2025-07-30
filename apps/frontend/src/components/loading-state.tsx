import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface LoadingStateProps {
  title: string;
  description: string;
}

export const LoadingState = ({ title, description }: LoadingStateProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-gray-200 bg-white shadow-lg">
        <CardHeader className="flex flex-row items-center gap-3">
          <span className="rounded-full bg-gray-100 p-2 text-gray-600">
            <Loader2 className="h-6 w-6 animate-spin" />
          </span>
          <div>
            <CardTitle className="text-gray-900">{title}</CardTitle>
            <CardDescription className="text-gray-600">{description}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
            <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}