'use client';

import { forwardRef, InputHTMLAttributes } from 'react';

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const InputField = forwardRef<HTMLInputElement, InputFieldProps>(function InputField(
  { label, error, className = '', ...props },
  ref
) {
  return (
    <label className="flex flex-col gap-2 text-sm">
      <span className="font-medium text-moss">{label}</span>
      <input
        ref={ref}
        className={`rounded-md border border-stone bg-white px-3 py-2 text-base text-charcoal shadow-sm transition focus:border-evergreen focus:ring-2 focus:ring-olive-tint/60 ${
          error ? 'border-[#C7563D] focus:ring-[#F2B8A4]' : ''
        } ${className}`}
        {...props}
      />
      {error && <span className="text-xs font-medium text-[#B42318]">{error}</span>}
    </label>
  );
});

export default InputField;
