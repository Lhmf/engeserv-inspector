import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const forgotPasswordSchema = z.object({
  email: z.string().email("Informe um email válido."),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 }
    );
  }

  const { email } = parsed.data;

  // Verifica se o usuário existe (mas não revela isso na resposta por segurança)
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true },
  });

  // Em produção, aqui você enviaria um email com token de recuperação
  // Por enquanto, apenas logamos o que seria feito
  if (user) {
    console.log(`[FORGOT_PASSWORD] Solicitação de recuperação para: ${user.email} (${user.name})`);
    // TODO: Implementar envio de email com token JWT de recuperação
    // const resetToken = await createResetToken(user.id);
    // await sendResetEmail(user.email, resetToken);
  }

  // Sempre retorna sucesso para não revelar se o email existe
  return NextResponse.json({
    message: "Se o email estiver cadastrado, enviaremos instruções de recuperação.",
  });
}