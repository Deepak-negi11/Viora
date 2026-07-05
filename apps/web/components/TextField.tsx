import type { InputHTMLAttributes } from "react";

type TextFieldProps = {
  id: string;
  label: string;
} & InputHTMLAttributes<HTMLInputElement>;

// A labeled input. Any extra props (type, value, onChange...) pass through to <input>.
export function TextField({ id, label, ...inputProps }: TextFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-neutral-300">
        {label}
      </label>
      <input
        id={id}
        name={id}
        className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-100 outline-none focus:border-neutral-400"
        {...inputProps}
      />
    </div>
  );
}
