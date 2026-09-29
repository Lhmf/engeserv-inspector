import { useState } from "react";
import { useRouter } from "next/navigation";
import { portalLogin } from "@/portal/lib/portal-auth";

export default function LoginPage() {
  const [primeiroNome, setPrimeiroNome] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async () => {
    setError(null);
    setLoading(true);

    try {
      const result = await portalLogin(primeiroNome, cnpj);

      if (result.success) {
        // Login bem-sucedido — redirecionar para dashboard
        router.replace("/portal");
      } else {
        setError(result.error);
      }
    } catch (err: any) {
      setError("Erro ao processar login. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-center text-foreground">
            Bem-vindo ao Portal EngeServ
          </h2>
          <p className="text-sm text-muted-foreground text-center">
            Acesse sua área privada de inspeções e laudos.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded bg-destructive/20 text-destructive text-sm text-center">
            {error}
          </div>
        )}

        <form
          onSubmit={e => {
            e.preventDefault();
            handleLogin();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Primeiro nome do cliente
            </label>
            <input
              value={primeiroNome}
              onChange={(e) => setPrimeiroNome(e.target.value)}
              type="text"
              placeholder="Ex: Prando"
              className="flex-1 rounded border-input bg-background p-2 text-sm focus-outline"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              CNPJ
            </label>
            <input
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
              type="text"
              placeholder="Ex: 12.345.678/0001-90 ou 12345678000190"
              className="flex-1 rounded border-input bg-background p-2 text-sm focus-outline"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-70 transition-opacity">
            {loading ? "Entrando..." : "Acessar Portal"}
          </button>
        </form>
      </div>
    </div>
  );
}