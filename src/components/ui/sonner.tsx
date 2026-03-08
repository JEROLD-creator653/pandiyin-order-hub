import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-center"
      className="toaster group"
      style={{ ['--normal-bg' as string]: 'hsl(40 30% 98%)', ['--normal-text' as string]: 'hsl(150 20% 12%)' }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:!bg-[hsl(40,30%,98%)] group-[.toaster]:!text-[hsl(150,20%,12%)] group-[.toaster]:!border-[hsl(38,20%,85%)] group-[.toaster]:shadow-xl group-[.toaster]:rounded-xl group-[.toaster]:px-5 group-[.toaster]:py-4",
          description: "group-[.toast]:!text-[hsl(150,10%,45%)]",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-lg",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-lg",
          error:
            "group-[.toaster]:!bg-[hsl(0,72%,51%)] group-[.toaster]:!text-[hsl(40,33%,96%)] group-[.toaster]:!border-[hsl(0,72%,41%)]",
          success:
            "group-[.toaster]:!bg-[hsl(145,40%,28%)] group-[.toaster]:!text-[hsl(40,33%,96%)] group-[.toaster]:!border-[hsl(145,40%,22%)]",
          warning:
            "group-[.toaster]:!bg-[hsl(38,60%,50%)] group-[.toaster]:!text-[hsl(40,33%,96%)] group-[.toaster]:!border-[hsl(38,60%,40%)]",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
