export const NR13_STANDARD_TEXT = {
  inspectionScope: 'A inspeção de segurança foi constituída por exames externo e interno, conforme determinação e prazos máximos estabelecidos para estabelecimentos que não possuem SPIE, observados os requisitos vigentes da Norma NR-13.',
  externalExam: [
    'O vaso deve permanecer instalado em condição segura e identificada.',
    'Deve dispor de saída ampla e permanentemente desobstruída.',
    'Deve dispor de acesso fácil e seguro para as atividades de manutenção, operação e inspeção.',
    'A iluminação e as condições de acesso devem atender às normas vigentes aplicáveis.',
  ],
  identificationPlate: [
    'O vaso de pressão possui placa de identificação legível e visível.',
    'Quando inexistente ou ilegível, deve ser providenciada nova placa em local de fácil visualização, conforme os requisitos aplicáveis da NR-13.',
  ],
  recommendations: [
    'Manter os instrumentos de segurança calibrados, incluindo manômetro e válvula de segurança, conforme a NR-13.',
    'O vaso de pressão não deve ser operado acima da PMTA. Esse procedimento constitui risco grave e iminente.',
    'O registro de segurança deve ser mantido em livro, pasta ou sistema informatizado com confiabilidade equivalente.',
    'Não executar reparos ou serviços de solda em vasos de pressão sem acompanhamento de profissional legalmente habilitado ou do fabricante.',
    'A instalação, manutenção e operação do vaso de pressão devem atender à NR-13 e às condições de segurança aplicáveis.',
    'Cabe ao usuário manter disponível a documentação específica e o projeto de instalação do equipamento.',
    'Manter o reservatório despressurizado ao final do trabalho, quando aplicável.',
  ],
} as const;

export function standardRecommendations() {
  return [...NR13_STANDARD_TEXT.recommendations];
}
