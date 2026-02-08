import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  prefix?: string;
  suffix?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, prefix, suffix, ...props }, ref) => {
    return (
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-0 flex items-center justify-center h-full px-3 text-sm font-medium text-gray-500 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg min-w-[40px]">
            {prefix}
          </span>
        )}
        {icon && (
          <span className="absolute left-3 text-gray-400">
            {icon}
          </span>
        )}
        <input
          type={type}
          className={cn(
            "flex h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-900 transition-all duration-200",
            "placeholder:text-gray-400",
            "focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50",
            "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
            prefix && "pl-12 rounded-l-none",
            suffix && "pr-12 rounded-r-none",
            icon && "pl-10",
            className
          )}
          ref={ref}
          {...props}
        />
        {suffix && (
          <span className="absolute right-0 flex items-center justify-center h-full px-3 text-sm font-medium text-gray-500 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg min-w-[40px]">
            {suffix}
          </span>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
