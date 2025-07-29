import React from 'react'

interface AuthLayoutProps {
    children: React.ReactNode
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className='w-full max-w-sm sm:max-w-3xl'>
        {children}
      </div>
    </div>
  )
}

export default AuthLayout