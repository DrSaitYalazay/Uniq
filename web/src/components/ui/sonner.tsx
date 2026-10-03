import { useEffect, useState } from "react";
import { Toaster as Sonner, toast } from "sonner";
import { isDarkActive, subscribeThemeMode } from "@/lib/themeMode";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  // Folgt dem CWS-Modus (themeMode), nicht next-themes — dort ist kein Provider gemountet.
  const [theme, setTheme] = useState<"light" | "dark">(() => (isDarkActive() ? "dark" : "light"));
  useEffect(() => subscribeThemeMode((_m, d) => setTheme(d ? "dark" : "light")), []);

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
