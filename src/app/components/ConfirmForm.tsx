"use client";

export default function ConfirmForm({
  action,
  confirmMessage,
  hiddenFields,
  label,
  className,
}: {
  action: (formData: FormData) => void | Promise<void>;
  confirmMessage: string;
  hiddenFields: Record<string, string | number>;
  label: string;
  className?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(confirmMessage)) e.preventDefault();
      }}
    >
      {Object.entries(hiddenFields).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}
      <button type="submit" className={className ?? "btn-secondary btn-sm"}>
        {label}
      </button>
    </form>
  );
}
