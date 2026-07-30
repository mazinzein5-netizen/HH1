import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";

type Theme = "dark" | "light" | "system";
const NEXT: Record<Theme, Theme> = { light: "dark", dark: "system", system: "light" };
const ICON: Record<Theme, React.ReactNode> = {
  light: <Sun className="h-[1.1rem] w-[1.1rem]" />,
  dark: <Moon className="h-[1.1rem] w-[1.1rem]" />,
  system: <Monitor className="h-[1.1rem] w-[1.1rem]" />,
};
const LABEL: Record<Theme, string> = {
  light: "Light theme",
  dark: "Dark theme",
  system: "Follow system",
};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <Button
      variant="outline"
      size="icon"
      className="rounded-full bg-background/50 backdrop-blur border-border/50 text-foreground"
      onClick={() => setTheme(NEXT[theme])}
      aria-label={`Current: ${LABEL[theme]}. Click to switch.`}
    >
      {ICON[theme]}
    </Button>
  );
}
