import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";

const outputPath = path.resolve("docs/presentacao-projeto.pdf");
const outputDir = path.dirname(outputPath);
fs.mkdirSync(outputDir, { recursive: true });

const doc = new PDFDocument({
  size: "A4",
  margin: 54,
  bufferPages: true,
  info: {
    Title: "PresençaEdu — Controle de presença escolar",
    Author: "GitHub Copilot",
    Subject: "Apresentação de projeto para faculdade",
    Keywords: "presença escolar, qr code, geolocalização, autenticação, backup local",
  },
});

const stream = fs.createWriteStream(outputPath);
doc.pipe(stream);

const theme = {
  ink: "#111827",
  muted: "#4b5563",
  accent: "#0f766e",
  accentSoft: "#ccfbf1",
  border: "#d1d5db",
  light: "#f8fafc",
};

const sections = [
  {
    title: "1. Visão geral",
    bullets: [
      "PresençaEdu é um sistema web para controle de presença escolar com foco em simplicidade, segurança e funcionamento local.",
      "O projeto foi pensado para dois perfis: aluno e coordenação.",
      "O aluno registra presença por geolocalização ou QR Code, enquanto a coordenação acompanha tudo em tempo real.",
    ],
  },
  {
    title: "2. Problema que o projeto resolve",
    bullets: [
      "Muitas chamadas escolares ainda são lentas, manuais e difíceis de auditar.",
      "O projeto reduz esse custo ao automatizar o registro e centralizar a conferência da presença.",
      "Também melhora a confiabilidade com validação no servidor e histórico de registros.",
    ],
  },
  {
    title: "3. Como o sistema funciona",
    bullets: [
      "O usuário entra na página inicial e escolhe o perfil de acesso.",
      "Após o login, o sistema cria uma sessão assinada em cookie.",
      "O aluno faz o check-in e o servidor valida a solicitação.",
      "A coordenação acompanha os registros, exporta backups e consulta auditorias.",
    ],
  },
  {
    title: "4. Estrutura técnica",
    bullets: [
      "Interface construída com React e Vite.",
      "Roteamento e funções de servidor organizados com TanStack Router / TanStack Start.",
      "TypeScript é usado para reduzir erros e deixar o código mais previsível.",
      "A interface foi montada com componentes reutilizáveis e estilização com Tailwind.",
      "Vitest cobre os principais helpers do sistema com testes automatizados.",
    ],
  },
  {
    title: "5. Autenticação e perfis",
    bullets: [
      "O login usa uma sessão assinada para evitar falsificação simples de cookies.",
      "A autenticação separa claramente aluno e coordenação.",
      "Rotas internas são protegidas, impedindo acesso indevido.",
      "O aluno entra com matrícula; a coordenação usa senha administrativa.",
    ],
  },
  {
    title: "6. Check-in por geolocalização",
    bullets: [
      "O navegador captura a posição do aluno com geolocalização.",
      "O servidor compara o ponto informado com a localização da escola.",
      "Se o usuário estiver fora do raio permitido, o check-in é rejeitado.",
      "Esse fluxo é útil para validar presença sem depender de QR Code.",
    ],
  },
  {
    title: "7. Check-in por QR Code",
    bullets: [
      "A coordenação exibe um QR dinâmico que muda periodicamente.",
      "O código é validado no servidor para reduzir fraude e reutilização indevida.",
      "O aluno pode escanear o QR pelo celular e confirmar presença rapidamente.",
      "Essa abordagem deixa a chamada mais ágil em sala de aula.",
    ],
  },
  {
    title: "8. Banco local e backups",
    bullets: [
      "O projeto mantém uma base local no navegador para resposta rápida.",
      "É possível exportar os dados em JSON e importar backups depois.",
      "Também existe restauração do seed inicial para testes e demonstração.",
      "Os backups usam versão de schema, o que ajuda em evoluções futuras do formato.",
    ],
  },
  {
    title: "9. Painel da coordenação",
    bullets: [
      "A coordenação tem uma tela própria para filtrar por turma e acompanhar presença em tempo real.",
      "Há opções para exportar CSV, exportar JSON, importar backup e restaurar a base local.",
      "O painel também exibe a auditoria dos eventos relacionados ao QR Code.",
    ],
  },
  {
    title: "10. Auditoria e segurança",
    bullets: [
      "Eventos do QR Code são registrados no servidor para auditoria.",
      "Isso permite rastrear geração do desafio e tentativas de validação.",
      "O sistema consegue identificar códigos inválidos ou expirados.",
      "Esse registro ajuda em suporte e conferência de uso.",
    ],
  },
  {
    title: "11. Testes e validação",
    bullets: [
      "Foram criados testes para banco local, autenticação e QR Code.",
      "Além dos testes automatizados, o fluxo principal foi validado manualmente.",
      "A aplicação também foi compilada com sucesso antes da entrega desta documentação.",
    ],
  },
  {
    title: "12. Pontos fortes do projeto",
    bullets: [
      "Separação clara entre aluno e coordenação.",
      "Validação no servidor para aumentar segurança.",
      "Arquitetura simples de explicar em apresentação acadêmica.",
      "Base pronta para evoluir para um backend persistente.",
    ],
  },
  {
    title: "13. Possíveis melhorias futuras",
    bullets: [
      "Persistir os dados em banco real.",
      "Mover segredos para variáveis de ambiente.",
      "Adicionar logs persistentes e relatórios mais detalhados.",
      "Ampliar integração com calendário, turmas e relatórios exportáveis.",
    ],
  },
  {
    title: "14. Conclusão",
    bullets: [
      "PresençaEdu é uma solução acadêmica funcional para controle de presença escolar.",
      "Ele combina praticidade para o aluno, controle para a coordenação e uma base técnica segura para evolução futura.",
    ],
  },
];

function addFooter() {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i += 1) {
    doc.switchToPage(i);
    const pageHeight = doc.page.height;
    const pageWidth = doc.page.width;
    doc.fontSize(9).fillColor(theme.muted);
    doc.text(`PresençaEdu • Página ${i + 1}`, 54, pageHeight - 36, {
      width: pageWidth - 108,
      align: "center",
    });
  }
}

function drawHeader(title, subtitle) {
  doc.roundedRect(54, 54, doc.page.width - 108, 120, 20).fill(theme.light);
  doc.fillColor(theme.accent).fontSize(28).font("Helvetica-Bold").text(title, 76, 82, {
    width: doc.page.width - 152,
    align: "left",
  });
  doc.fillColor(theme.muted).fontSize(12).font("Helvetica").text(subtitle, 76, 122, {
    width: doc.page.width - 152,
  });
  doc.moveDown(2.5);
}

function addSection(section) {
  if (doc.y > 690) doc.addPage();

  doc.moveDown(0.3);
  doc.fillColor(theme.accent).font("Helvetica-Bold").fontSize(16).text(section.title);
  doc.moveDown(0.3);

  for (const bullet of section.bullets) {
    const bulletHeight = doc.heightOfString(bullet, {
      width: 470,
      align: "left",
      lineGap: 3,
    });

    if (doc.y + bulletHeight + 14 > 760) {
      doc.addPage();
    }

    const startY = doc.y + 4;
    doc.circle(70, startY + 6, 2.5).fill(theme.accent);
    doc.fillColor(theme.ink).font("Helvetica").fontSize(11).text(bullet, 82, doc.y, {
      width: 450,
      lineGap: 3,
      align: "left",
    });
    doc.moveDown(0.5);
  }

  doc.moveDown(0.4);
  doc.strokeColor(theme.border).lineWidth(1).moveTo(54, doc.y).lineTo(doc.page.width - 54, doc.y).stroke();
  doc.moveDown(0.6);
}

// Cover page
doc.rect(0, 0, doc.page.width, doc.page.height).fill("#ffffff");
doc.fillColor(theme.accent).font("Helvetica-Bold").fontSize(34).text("PresençaEdu", 54, 110, {
  align: "center",
});
doc.fillColor(theme.ink).font("Helvetica-Bold").fontSize(20).text("Controle de presença escolar", {
  align: "center",
});
doc.moveDown(1.3);
doc.fillColor(theme.muted).font("Helvetica").fontSize(12).text(
  "Documento de apresentação do projeto para faculdade\nExplicação do funcionamento, arquitetura e principais decisões técnicas.",
  {
    align: "center",
    lineGap: 4,
  },
);
doc.moveDown(2);
doc.roundedRect(96, 250, doc.page.width - 192, 150, 18).fill(theme.light);
doc.fillColor(theme.ink).font("Helvetica-Bold").fontSize(14).text("Pontos que este material cobre:", 120, 275);
doc.fillColor(theme.muted).font("Helvetica").fontSize(11).text(
  [
    "Visão geral do sistema",
    "Fluxo de login e check-in",
    "Banco local, backups e auditoria",
    "Estrutura técnica e testes",
    "Pontos fortes e melhorias futuras",
  ].map((item) => `• ${item}`).join("\n"),
  120,
  305,
  {
    lineGap: 6,
  },
);
doc.addPage();

drawHeader(
  "Apresentação do projeto",
  "Resumo técnico e funcional do PresençaEdu, escrito para usar em exposição oral ou como apoio na apresentação final.",
);

for (const section of sections) {
  addSection(section);
}

addFooter();
doc.end();

stream.on("finish", () => {
  // eslint-disable-next-line no-console
  console.log(`PDF gerado em ${outputPath}`);
});
