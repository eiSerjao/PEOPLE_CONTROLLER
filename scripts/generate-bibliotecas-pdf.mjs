import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";

const outputPath = path.resolve("docs/bibliotecas-do-projeto.pdf");
const outputDir = path.dirname(outputPath);
fs.mkdirSync(outputDir, { recursive: true });

const doc = new PDFDocument({
  size: "A4",
  margin: 54,
  bufferPages: true,
  info: {
    Title: "PresençaEdu — Bibliotecas utilizadas",
    Author: "GitHub Copilot",
    Subject: "Lista de bibliotecas do projeto",
    Keywords: "bibliotecas, react, vite, tanstack, radix, tailwind, testes",
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
    title: "1. Base da aplicação",
    bullets: [
      "react: biblioteca principal para construir a interface.",
      "react-dom: integração do React com o navegador.",
      "vite: ferramenta de build e servidor de desenvolvimento.",
      "@vitejs/plugin-react: integração do Vite com React.",
      "vite-tsconfig-paths: resolução de caminhos com base no tsconfig.",
    ],
  },
  {
    title: "2. Roteamento e fluxo do app",
    bullets: [
      "@tanstack/react-router: roteamento principal e proteção de páginas.",
      "@tanstack/react-start: suporte ao fluxo full-stack e funções de servidor.",
      "@tanstack/router-plugin: integração do roteamento com o processo de build.",
      "@cloudflare/vite-plugin: suporte ao ambiente de deploy/execução compatível com Cloudflare.",
    ],
  },
  {
    title: "3. Estado, dados e formulários",
    bullets: [
      "@tanstack/react-query: consulta e sincronização de dados.",
      "react-hook-form: formulários com menos estado manual.",
      "@hookform/resolvers: integração entre formulários e validação.",
      "zod: validação forte de dados de entrada e schemas.",
      "date-fns: manipulação e formatação de datas.",
    ],
  },
  {
    title: "4. Componentes e interface",
    bullets: [
      "@radix-ui/react-accordion: acordeões.",
      "@radix-ui/react-alert-dialog: diálogos de alerta e confirmação.",
      "@radix-ui/react-aspect-ratio: controle de proporção.",
      "@radix-ui/react-avatar: avatar de usuário.",
      "@radix-ui/react-checkbox: caixas de seleção.",
      "@radix-ui/react-collapsible: blocos recolhíveis.",
      "@radix-ui/react-context-menu: menus contextuais.",
      "@radix-ui/react-dialog: diálogos modais.",
      "@radix-ui/react-dropdown-menu: menus suspensos.",
      "@radix-ui/react-hover-card: cartões ao passar o mouse.",
      "@radix-ui/react-label: rótulos acessíveis.",
      "@radix-ui/react-menubar: barra de menus.",
      "@radix-ui/react-navigation-menu: navegação avançada.",
      "@radix-ui/react-popover: popovers.",
      "@radix-ui/react-progress: barras de progresso.",
      "@radix-ui/react-radio-group: grupos de rádio.",
      "@radix-ui/react-scroll-area: áreas roláveis.",
      "@radix-ui/react-select: selects customizados.",
      "@radix-ui/react-separator: separadores visuais.",
      "@radix-ui/react-slider: sliders.",
      "@radix-ui/react-slot: composição de componentes via slot.",
      "@radix-ui/react-switch: switches.",
      "@radix-ui/react-tabs: abas.",
      "@radix-ui/react-toggle: botões de alternância.",
      "@radix-ui/react-toggle-group: grupos de alternância.",
      "@radix-ui/react-tooltip: tooltips.",
      "class-variance-authority: variantes de estilo para componentes.",
      "clsx: composição condicional de classes CSS.",
      "tailwind-merge: união inteligente de classes do Tailwind.",
      "tailwindcss: sistema de utilidades CSS.",
      "@tailwindcss/vite: integração do Tailwind com o Vite.",
      "tw-animate-css: utilitários de animação.",
      "sonner: notificações toast.",
      "lucide-react: ícones vetoriais.",
      "cmdk: interface de comando/pesquisa.",
      "input-otp: campo de OTP/pin.",
      "react-day-picker: seleção de datas.",
      "react-resizable-panels: painéis redimensionáveis.",
      "recharts: gráficos e visualização de dados.",
      "embla-carousel-react: carrossel/slider.",
      "vaul: drawers e painéis deslizantes.",
      "qrcode: geração de QR Code.",
    ],
  },
  {
    title: "5. Testes e qualidade",
    bullets: [
      "vitest: suíte de testes.",
      "@types/node: tipagens do Node.js.",
      "@types/react: tipagens do React.",
      "@types/react-dom: tipagens do React DOM.",
      "@types/qrcode: tipagens do pacote QR Code.",
      "typescript: linguagem principal do projeto.",
      "typescript-eslint: integração entre TypeScript e ESLint.",
      "eslint: análise estática de código.",
      "@eslint/js: base oficial de regras do ESLint.",
      "eslint-config-prettier: evita conflitos com Prettier.",
      "eslint-plugin-prettier: executa Prettier dentro do ESLint.",
      "eslint-plugin-react-hooks: regras para hooks do React.",
      "eslint-plugin-react-refresh: suporte ao hot reload do React.",
      "globals: lista de variáveis globais comuns.",
      "prettier: formatação automática.",
    ],
  },
  {
    title: "6. Observação sobre a base do projeto",
    bullets: [
      "Além dessas bibliotecas, o projeto usa código próprio em src/lib, src/routes e src/components para implementar autenticação, armazenamento local, check-in por QR e painel da coordenação.",
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
doc.fillColor(theme.accent).font("Helvetica-Bold").fontSize(30).text("Bibliotecas do PresençaEdu", 54, 110, {
  align: "center",
});
doc.fillColor(theme.ink).font("Helvetica-Bold").fontSize(18).text("Resumo das bibliotecas usadas no projeto", {
  align: "center",
});
doc.moveDown(1.3);
doc.fillColor(theme.muted).font("Helvetica").fontSize(12).text(
  "Documento de apoio para apresentação acadêmica, organizado por categoria para facilitar a explicação técnica do projeto.",
  {
    align: "center",
    lineGap: 4,
  },
);
doc.moveDown(2);
doc.roundedRect(96, 250, doc.page.width - 192, 150, 18).fill(theme.light);
doc.fillColor(theme.ink).font("Helvetica-Bold").fontSize(14).text("O que este material mostra:", 120, 275);
doc.fillColor(theme.muted).font("Helvetica").fontSize(11).text(
  [
    "Bibliotecas de interface",
    "Bibliotecas de roteamento e dados",
    "Ferramentas de validação e testes",
    "Pacotes de build e desenvolvimento",
    "Resumo da base do projeto",
  ].map((item) => `• ${item}`).join("\n"),
  120,
  305,
  {
    lineGap: 6,
  },
);
doc.addPage();

drawHeader(
  "Bibliotecas utilizadas",
  "Visão organizada das dependências e ferramentas que sustentam a interface, a validação, o roteamento e a entrega do PresençaEdu.",
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
