import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"

interface ErrorStateProps {
    title: string;
    description: string;
}
  
export const ErrorState = ({ title, description }: ErrorStateProps) => {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-red-200 bg-red-50 shadow-lg">
          <CardHeader className="flex flex-row items-center gap-3">
            <span className="rounded-full bg-red-100 p-2 text-red-600">
              <AlertTriangle className="h-6 w-6" />
            </span>
            <div>
              <CardTitle className="text-red-700">{title}</CardTitle>
              <CardDescription className="text-red-600">{description}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-500">If the problem persists, please contact support.</p>
          </CardContent>
        </Card>
      </div>
    )
}