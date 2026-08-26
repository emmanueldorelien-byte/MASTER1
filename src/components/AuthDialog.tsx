import { useState, type ReactNode, type ComponentProps } from "react";
import { toast } from "sonner";
import {
  Mail,
  Lock,
  User,
  Phone,
  Loader2,
  LogIn,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "../hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface AuthDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultTab?: "login" | "register";
  trigger?: ReactNode;
  className?: string;
}

type FormSubmitEvent = Parameters<NonNullable<ComponentProps<"form">["onSubmit"]>>[0];

export function AuthDialog({
  open,
  onOpenChange,
  defaultTab = "login",
  trigger,
  className,
}: AuthDialogProps) {
  const auth = useAuth();
  const [tab, setTab] = useState<"login" | "register">(defaultTab);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const isValidEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const resetForms = () => {
    setEmail("");
    setPassword("");
    setFullName("");
    setWhatsapp("");
    setConfirmPassword("");
  };

  const handleLogin = async (e: FormSubmitEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error("Modpas la dwe gen omwen 6 karaktè.");
      return;
    }

    setIsLoading(true);
    try {
      await auth.login(email, password);
      toast.success("Koneksyon reyisi! 🎉", {
        icon: <LogIn />,
      });
      resetForms();
      onOpenChange?.(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err ?? "Koneksyon an echwe.");
      toast.error("Koneksyon an echwe.", {
        description: msg,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: FormSubmitEvent) => {
    e.preventDefault();

    if (!isValidEmail(email)) {
      toast.error("Imel la pa valid. Tanpri antre yon imel kòrèk.");
      return;
    }

    if (password.length < 6) {
      toast.error("Modpas la dwe gen omwen 6 karaktè.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Modpas yo pa matche. Tanpri verifye yo.");
      return;
    }

    setIsLoading(true);
    try {
      await auth.register(email, password, fullName, whatsapp || undefined);
      toast.success("Kont kreye avèk siksè! 🎉", {
        description: "Byenveni nan Masterclass AI.",
      });
      resetForms();
      onOpenChange?.(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err ?? "Kreye kont lan echwe.");
      toast.error("Kreye kont lan echwe.", {
        description: msg,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isOpen = open ?? false;
  const handleOpenChange = onOpenChange ?? (() => {});
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent
        className={cn(
          "glass rounded-3xl sm:max-w-md p-0 overflow-hidden",
          className,
        )}
      >
        <div
          className="h-1 w-full"
          style={{ backgroundImage: "var(--gradient-neon)" }}
        />
        <div className="p-6 sm:p-8">
          <DialogHeader className="text-center mb-6">
            <DialogTitle className="font-display text-2xl sm:text-3xl">
              <span className="text-gradient-neon glow-title">
                {tab === "login" ? "Konekte" : "Kreye Kont"}
              </span>
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-2">
              {tab === "login"
                ? "Antre nan kont ou pou aksè Masterclass AI"
                : "Rejistre ou jodi a pou kòmanse aprann"}
            </p>
          </DialogHeader>

          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as "login" | "register")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-6 h-11 bg-muted/80 p-1 rounded-xl">
              <TabsTrigger
                value="login"
                className="h-9 rounded-lg data-[state=active]:shadow-[var(--glow-neon)]"
              >
                <LogIn className="size-4 mr-2" />
                Konekte
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className="h-9 rounded-lg data-[state=active]:shadow-[var(--glow-neon)]"
              >
                <User className="size-4 mr-2" />
                Enskri
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2.5">
                  <Label htmlFor="login-email">
                    <Mail className="inline size-5 mr-1.5 text-accent -translate-y-0.5" />
                    Imel
                  </Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="ou@imel.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>

                <div className="space-y-2.5">
                  <Label htmlFor="login-password">
                    <Lock className="inline size-5 mr-1.5 text-accent -translate-y-0.5" />
                    Modpas
                  </Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Modpas ou"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  variant="neon"
                  size="xl"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin size-5 mr-2" />
                  ) : (
                    <LogIn className="size-5 mr-2" />
                  )}
                  Konekte
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-6">
                <div className="space-y-2.5">
                  <Label htmlFor="register-name">
                    <User className="inline size-5 mr-1.5 text-accent -translate-y-0.5" />
                    Non ak Siyati
                  </Label>
                  <Input
                    id="register-name"
                    type="text"
                    placeholder="Non ak Siyati"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    autoComplete="name"
                    required
                  />
                </div>

                <div className="space-y-2.5">
                  <Label htmlFor="register-whatsapp">
                    <Phone className="inline size-5 mr-1.5 text-accent -translate-y-0.5" />
                    WhatsApp <span className="text-muted-foreground font-normal">(opsyonèl)</span>
                  </Label>
                  <Input
                    id="register-whatsapp"
                    type="tel"
                    placeholder="+509 ..."
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    autoComplete="tel"
                  />
                </div>

                <div className="space-y-2.5">
                  <Label htmlFor="register-email">
                    <Mail className="inline size-5 mr-1.5 text-accent -translate-y-0.5" />
                    Imel
                  </Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="ou@imel.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>

                <div className="space-y-2.5">
                  <Label htmlFor="register-password">
                    <Lock className="inline size-5 mr-1.5 text-accent -translate-y-0.5" />
                    Modpas
                  </Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="Modpas ou"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </div>

                <div className="space-y-2.5">
                  <Label htmlFor="register-confirm">
                    <Lock className="inline size-5 mr-1.5 text-accent -translate-y-0.5" />
                    Konfime Modpas
                  </Label>
                  <Input
                    id="register-confirm"
                    type="password"
                    placeholder="Konfime modpas ou"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  variant="neon"
                  size="xl"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin size-5 mr-2" />
                  ) : (
                    <User className="size-5 mr-2" />
                  )}
                  Kreye kont
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
