import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";
import { AlertCircle, CheckCircle2, AlertTriangle, Info } from "lucide-react";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-center"
      className="toaster group"
      icons={{
        error: <AlertCircle className="h-5 w-5" />,
        success: <CheckCircle2 className="h-5 w-5" />,
        warning: <AlertTriangle className="h-5 w-5" />,
        info: <Info className="h-5 w-5" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:!rounded-2xl group-[.toaster]:!border-2 group-[.toaster]:!px-5 group-[.toaster]:!py-4 group-[.toaster]:!shadow-2xl group-[.toaster]:!font-sans",
          title: "group-[.toast]:!font-display group-[.toast]:!text-base group-[.toast]:!font-semibold group-[.toast]:!tracking-tight",
          description: "group-[.toast]:!text-sm group-[.toast]:!opacity-90 group-[.toast]:!leading-relaxed",
          actionButton: "group-[.toast]:!rounded-lg group-[.toast]:!font-medium",
          cancelButton: "group-[.toast]:!rounded-lg group-[.toast]:!font-medium",
          error:
            "group-[.toaster]:!bg-[hsl(150,20%,12%)] group-[.toaster]:!text-[hsl(40,33%,96%)] group-[.toaster]:!border-[hsl(0,72%,51%)] group-[.toaster]:!shadow-[0_8px_30px_-4px_hsl(150,20%,12%,0.5)]",
          success:
            "group-[.toaster]:!bg-[hsl(145,40%,28%)] group-[.toaster]:!text-[hsl(40,33%,96%)] group-[.toaster]:!border-[hsl(145,40%,22%)] group-[.toaster]:!shadow-[0_8px_30px_-4px_hsl(145,40%,28%,0.4)]",
          warning:
            "group-[.toaster]:!bg-[hsl(150,20%,12%)] group-[.toaster]:!text-[hsl(40,33%,96%)] group-[.toaster]:!border-[hsl(38,60%,50%)] group-[.toaster]:!shadow-[0_8px_30px_-4px_hsl(150,20%,12%,0.5)]",
          info:
            "group-[.toaster]:!bg-[hsl(145,40%,28%)] group-[.toaster]:!text-[hsl(40,33%,96%)] group-[.toaster]:!border-[hsl(145,40%,22%)] group-[.toaster]:!shadow-[0_8px_30px_-4px_hsl(145,40%,28%,0.4)]",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
