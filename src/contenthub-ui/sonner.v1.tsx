import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      closeButton
      style={
        {
          "--normal-bg": "#ffffff",
          "--normal-text": "var(--foreground)",
          "--normal-border": "var(--border)",
          "--success-bg": "#ffffff",
          "--success-text": "var(--foreground)",
          "--success-border": "var(--border)",
          "--success-icon": "#22c55e",
          "--error-bg": "#ffffff",
          "--error-text": "var(--foreground)",
          "--error-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
