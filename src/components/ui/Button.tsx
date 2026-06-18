import * as React from "react"

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'outline' | 'ghost' | 'destructive', size?: 'default' | 'sm' | 'lg' }>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none ring-offset-white"
    
    const variants = {
      default: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm",
      outline: "border border-gray-300 hover:bg-gray-100 text-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800",
      ghost: "hover:bg-gray-100 hover:text-gray-900 text-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-white",
      destructive: "bg-red-500 text-white hover:bg-red-600 shadow-sm",
    }
    
    const sizes = {
      default: "h-10 py-2 px-4",
      sm: "h-9 px-3 rounded-md",
      lg: "h-11 px-8 rounded-md",
    }

    const classes = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className || ''}`

    return (
      <button
        className={classes}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
