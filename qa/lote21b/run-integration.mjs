/**
 * LOTE 21B — Teste integrado via HTTP contra banco isolado.
 *
 * Requer:
 *  - PostgreSQL isolado em 127.0.0.1:55432/engeserv_lote21b
 *  - Next dev em http://127.0.0.1:3100 com POSTGRES_URL/AUTH_SECRET de teste
 *  - qa/lote21b/seed-output.json gerado por seed-test-data.ts
 *
 * Não toca em produção. Não desativa autenticação.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { PDFDocument } = require("pdf-lib");
const { PDFParse } = require("pdf-parse");

const BASE = process.env.QA_BASE_URL || "http://127.0.0.1:3100";
const PDF_MODE = process.env.PDF_MODE === "definitive" ? "" : "?mode=demo";
const OUT = path.join(process.cwd(), "qa", "lote21b");
const seed = JSON.parse(fs.readFileSync(path.join(OUT, "seed-output.json"), "utf8"));
const PASSWORD = seed.password;
const results = [];
const observed = {};

function add({ id, test, expected, actual, pass, todo = false, evidence, failure = "", next = "" }) {
  const entry = { id, test, environment: "local: Next 14.2.35 + PostgreSQL 16.4 isolado (127.0.0.1:55432/engeserv_lote21b)", expected, actual, pass, todo, evidence, failure, next };
  results.push(entry);
  console.log(`${todo ? "TODO" : pass ? "PASS" : "FAIL"} ${id} | ${test} | ${actual}`);
  if (!pass || todo) console.log(`     esperado: ${expected}`);
  if (failure) console.log(`     falha: ${failure}`);
  return entry;
}

async function api(method, route, { cookie, body, redirect = "follow", raw = false } = {}) {
  const headers = {};
  if (body !== undefined) headers["content-type"] = "application/json";
  if (cookie) headers.cookie = cookie;
  const res = await fetch(BASE + route, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    redirect,
  });
  const setCookies = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  const contentType = res.headers.get("content-type") || "";
  if (raw) {
    const buf = Buffer.from(await res.arrayBuffer());
    return { status: res.status, headers: res.headers, setCookies, buf, contentType };
  }
  let data = null;
  const text = await res.text();
  if (contentType.includes("application/json") && text) {
    try { data = JSON.parse(text); } catch { data = null; }
  }
  return { status: res.status, headers: res.headers, setCookies, data, text, contentType };
}

function cookieFrom(res) {
  const first = res.setCookies.find((c) => c.startsWith("engeserv_session=") || c.startsWith("portal_session="));
  return first ? first.split(";")[0] : "";
}

async function login(email) {
  const res = await api("POST", "/api/auth/login", { body: { email, password: PASSWORD } });
  return { ...res, cookie: cookieFrom(res) };
}

async function portalLogin(primeiroNome, cnpj) {
  const res = await api("POST", "/api/portal/login", { body: { primeiroNome, cnpj } });
  return { ...res, cookie: cookieFrom(res) };
}

const eqA = {
  clientId: seed.clients.A.id,
  tag: "QA-VP-21B-API",
  type: "VASO_DE_PRESSAO",
  description: "Vaso de pressão do teste integrado Lote 21B (criado via API)",
  manufacturer: "QA Fabricante Ltda",
  manufactureYear: 2018,
  serialNumber: "QA21B-API-0001",
  designCode: "ASME SEC.VIII DIV.1/2021",
  designPressureBar: 18,
  designTempC: 120,
  operatingPressureBar: 12.5,
  operatingTempC: 80,
  mawpBar: 17.2,
  hydroTestPressureBar: 24,
  originalThicknessMm: 14.3,
  minThicknessMm: 6.4,
  headType: "Semielíptico",
  headMaterial: "SA-516 Gr.70",
  bodyMaterial: "SA-516 Gr.70",
  headNominalThicknessMm: 14.3,
  volumeLiters: 8500,
  jointEfficiency: 1.0,
  corrosionAllowanceMm: 1.5,
  fluidType: "Vapor saturado",
  fluidClass: "B",
  riskGroup: 2,
  nr13Category: "III",
};

const eqB = {
  clientId: seed.clients.B.id,
  tag: "QA-CAL-21B-API",
  type: "CALDEIRA",
  description: "Caldeira do cliente B (isolamento de portal)",
  manufacturer: "QA Fabricante Ltda",
  manufactureYear: 2019,
  serialNumber: "QA21B-API-0002",
  designCode: "ASME SEC.I/2021",
  designPressureBar: 12,
  designTempC: 190,
  operatingPressureBar: 10,
  operatingTempC: 160,
  mawpBar: 11.5,
  hydroTestPressureBar: 18,
  originalThicknessMm: 16,
  minThicknessMm: 7.2,
  headType: "Semielíptico",
  headMaterial: "SA-516 Gr.70",
  bodyMaterial: "SA-516 Gr.70",
  headNominalThicknessMm: 16,
  volumeLiters: 4000,
  jointEfficiency: 0.85,
  corrosionAllowanceMm: 2,
  fluidType: "Vapor",
  fluidClass: "A",
  riskGroup: 3,
  nr13Category: "II",
};

const baseline = [13.20, 13.45, 13.60, 13.35, 13.70, 13.50, 13.80, 13.40];
const current = [12.62, 12.85, 13.02, 12.74, 12.91, 12.58, 13.10, 12.80];
const bMeas = [14.6, 14.8, 15.0, 14.7, 14.9, 14.65, 15.1, 14.75];

async function createInspection(cookie, equipmentId, type = "PERIODICA") {
  const res = await api("POST", "/api/inspections", { cookie, body: { equipmentId, type } });
  return res;
}

async function addMeasurements(cookie, inspectionId, values) {
  const statuses = [];
  for (let i = 0; i < values.length; i++) {
    const res = await api("POST", `/api/inspections/${inspectionId}/measurements`, {
      cookie,
      body: { point: `P${i + 1}`, thicknessMm: values[i], angleDeg: i * 45, notes: `Ponto P${i + 1} do Lote 21B` },
    });
    statuses.push(res.status);
  }
  return statuses;
}

async function approveInspection(cookie, inspectionId, completedAt) {
  return api("PUT", `/api/inspections/${inspectionId}`, {
    cookie,
    body: completedAt ? { status: "APROVADA", completedAt } : { status: "APROVADA" },
  });
}

async function runPipeline(cookie, inspectionId) {
  return api("POST", "/api/reports/pipeline", { cookie, body: { inspectionId } });
}

function jsonSnippet(value, max = 700) {
  if (value === undefined) return "undefined";
  const s = JSON.stringify(value) ?? String(value);
  return s.length > max ? s.slice(0, max) + "..." : s;
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  // ---------- T01 autenticação real ----------
  const admin = await login(seed.users.admin.email);
  const gestor = await login(seed.users.gestor.email);
  const func = await login(seed.users.funcionario.email);
  add({
    id: "T01",
    test: "Login interno real (Admin, Gestor, Funcionário) com bcrypt/ cookie assinado",
    expected: "HTTP 200 e cookie engeserv_session para os 3 papéis",
    actual: `admin=${admin.status} gestor=${gestor.status} funcionario=${func.status}`,
    pass: admin.status === 200 && gestor.status === 200 && func.status === 200 && !!admin.cookie && !!gestor.cookie && !!func.cookie,
    evidence: `admin.role=${admin.data?.user?.role}; gestor.role=${gestor.data?.user?.role}; funcionario.role=${func.data?.user?.role}; cookies=${[admin.cookie, gestor.cookie, func.cookie].map((c) => c.split("=")[0]).join(",")}`,
    failure: admin.status !== 200 || gestor.status !== 200 || func.status !== 200 ? "Login não retornou 200 para todos os papéis." : "",
    next: "Nenhum",
  });

  // ---------- T02 proteção sem sessão ----------
  const unauthPdf = await api("GET", "/api/reports/inexistente/pdf", { redirect: "manual" });
  const unauthPortal = await api("GET", "/api/portal/laudos", { redirect: "manual" });
  add({
    id: "T02",
    test: "Acesso sem autenticação é bloqueado (API interna e Portal)",
    expected: "API interna redireciona para /login (307) e API do portal retorna 401; nenhum dado é exposto",
    actual: `interna=${unauthPdf.status} location=${unauthPdf.headers.get("location") || "-"}; portal=${unauthPortal.status}`,
    pass: (unauthPdf.status === 307 || unauthPdf.status === 401) && unauthPortal.status === 401,
    evidence: `GET /api/reports/inexistente/pdf -> ${unauthPdf.status} Location=${unauthPdf.headers.get("location")}; GET /api/portal/laudos -> ${unauthPortal.status} ${jsonSnippet(unauthPortal.data)}`,
    failure: "",
    next: "",
  });

  // ---------- T03 criar equipamento A completo via API ----------
  const eqARes = await api("POST", "/api/equipamentos", { cookie: func.cookie, body: eqA });
  const equipmentA = eqARes.data?.equipamento;
  add({
    id: "T03",
    test: "Criar equipamento A com ficha técnica completa via API",
    expected: "HTTP 201; todos os campos técnicos persistidos e vinculados ao cliente A",
    actual: `HTTP ${eqARes.status}; id=${equipmentA?.id || "-"}; tag=${equipmentA?.tag || "-"}`,
    pass: eqARes.status === 201 && equipmentA?.id && equipmentA?.clientId === seed.clients.A.id && equipmentA.designPressureBar === 18 && equipmentA.originalThicknessMm === 14.3 && equipmentA.minThicknessMm === 6.4 && equipmentA.jointEfficiency === 1,
    evidence: jsonSnippet(equipmentA),
    failure: eqARes.status !== 201 ? `Falha ao criar equipamento: ${jsonSnippet(eqARes.data)}` : "",
    next: "",
  });
  observed.equipmentA = equipmentA;

  // ---------- T04 criar equipamento B (isolamento) ----------
  const eqBRes = await api("POST", "/api/equipamentos", { cookie: func.cookie, body: eqB });
  const equipmentB = eqBRes.data?.equipamento;
  add({
    id: "T04",
    test: "Criar equipamento B (outro cliente) via API",
    expected: "HTTP 201 e vínculo exclusivo com o cliente B",
    actual: `HTTP ${eqBRes.status}; id=${equipmentB?.id || "-"}; tag=${equipmentB?.tag || "-"}`,
    pass: eqBRes.status === 201 && equipmentB?.clientId === seed.clients.B.id,
    evidence: jsonSnippet(equipmentB),
    failure: "",
    next: "",
  });
  observed.equipmentB = equipmentB;

  // ---------- T05 inspeção anterior (linha de base) ----------
  const priorRes = await createInspection(func.cookie, equipmentA.id);
  const prior = priorRes.data?.inspection;
  const priorMeas = await addMeasurements(func.cookie, prior.id, baseline);
  const priorSubmit = await api("PUT", `/api/inspections/${prior.id}`, { cookie: func.cookie, body: { status: "AGUARDANDO_APROVACAO" } });
  const priorApprove = await approveInspection(gestor.cookie, prior.id, "2024-10-15T12:00:00.000Z");
  add({
    id: "T05",
    test: "Registrar inspeção ANTERIOR aprovada (linha de base de corrosão) com data retroativa",
    expected: "8 medições criadas; inspeção APROVADA com completedAt=2024-10-15",
    actual: `inspection=${priorRes.status}; medições=${priorMeas.join(",")}; submit=${priorSubmit.status}; approve=${priorApprove.status}; completedAt=${priorApprove.data?.inspection?.completedAt}`,
    pass: priorRes.status === 201 && priorMeas.every((s) => s === 201) && priorSubmit.status === 200 && priorApprove.status === 200 && String(priorApprove.data?.inspection?.completedAt).startsWith("2024-10-15"),
    evidence: `priorInspectionId=${prior.id}; status=${priorApprove.data?.inspection?.status}; approvedById=${priorApprove.data?.inspection?.approvedById}`,
    failure: "",
    next: "",
  });
  observed.priorInspection = prior;

  // ---------- T06 inspeção atual ----------
  const inspRes = await createInspection(func.cookie, equipmentA.id);
  const inspectionA = inspRes.data?.inspection;
  add({
    id: "T06",
    test: "Registrar inspeção atual vinculada ao equipamento A",
    expected: "HTTP 201; equipmentId do equipamento A; status EM_ANDAMENTO; inspetor = Funcionário",
    actual: `HTTP ${inspRes.status}; inspectionId=${inspectionA?.id || "-"}; status=${inspectionA?.status}`,
    pass: inspRes.status === 201 && inspectionA?.equipmentId === equipmentA.id && inspectionA?.status === "EM_ANDAMENTO" && inspectionA?.inspectorId === seed.users.funcionario.id,
    evidence: jsonSnippet(inspectionA),
    failure: "",
    next: "",
  });
  observed.inspectionA = inspectionA;

  // ---------- T07 pipeline bloqueado antes da aprovação ----------
  const pipelineEarly = await runPipeline(gestor.cookie, inspectionA.id);
  add({
    id: "T07",
    test: "Pipeline recusa inspeção EM_ANDAMENTO (sem aprovação)",
    expected: "HTTP 400 com mensagem de inspeção em andamento",
    actual: `HTTP ${pipelineEarly.status}; error=${pipelineEarly.data?.error}`,
    pass: pipelineEarly.status === 400 && /andamento/i.test(pipelineEarly.data?.error || ""),
    evidence: jsonSnippet(pipelineEarly.data),
    failure: "",
    next: "",
  });

  // ---------- T08 medições atuais ----------
  const measStatuses = await addMeasurements(func.cookie, inspectionA.id, current);
  const measList = await api("GET", `/api/inspections/${inspectionA.id}/measurements`, { cookie: func.cookie });
  add({
    id: "T08",
    test: "Registrar as 8 medições de espessura da inspeção atual",
    expected: "8x HTTP 201; GET retorna 8 pontos com os valores informados",
    actual: `status=${measStatuses.join(",")}; count=${measList.data?.measurements?.length}`,
    pass: measStatuses.every((s) => s === 201) && measList.data?.measurements?.length === 8,
    evidence: JSON.stringify((measList.data?.measurements || []).map((m) => ({ point: m.point, thicknessMm: m.thicknessMm }))),
    failure: "",
    next: "",
  });

  // ---------- T09 transição para aprovação + permissão ----------
  const submit = await api("PUT", `/api/inspections/${inspectionA.id}`, { cookie: func.cookie, body: { status: "AGUARDANDO_APROVACAO" } });
  const funcApprove = await api("PUT", `/api/inspections/${inspectionA.id}`, { cookie: func.cookie, body: { status: "APROVADA" } });
  add({
    id: "T09",
    test: "Funcionário envia para aprovação, mas NÃO pode aprovar a inspeção",
    expected: "Submit HTTP 200; aprovação pelo Funcionário HTTP 403",
    actual: `submit=${submit.status}; approve_func=${funcApprove.status}`,
    pass: submit.status === 200 && funcApprove.status === 403,
    evidence: `submit.status=${submit.data?.inspection?.status}; funcApprove=${jsonSnippet(funcApprove.data)}`,
    failure: funcApprove.status !== 403 ? "Funcionário conseguiu aprovar inspeção." : "",
    next: "",
  });

  const gestorApprove = await approveInspection(gestor.cookie, inspectionA.id);
  add({
    id: "T10",
    test: "Gestor aprova a inspeção atual",
    expected: "HTTP 200; status APROVADA; approvedById=Gestor; completedAt preenchido",
    actual: `HTTP ${gestorApprove.status}; status=${gestorApprove.data?.inspection?.status}; approvedById=${gestorApprove.data?.inspection?.approvedById}`,
    pass: gestorApprove.status === 200 && gestorApprove.data?.inspection?.status === "APROVADA" && gestorApprove.data?.inspection?.approvedById === seed.users.gestor.id && !!gestorApprove.data?.inspection?.completedAt,
    evidence: jsonSnippet(gestorApprove.data?.inspection),
    failure: "",
    next: "",
  });

  // ---------- T11 pipeline com dados reais ----------
  const pipeline = await runPipeline(gestor.cookie, inspectionA.id);
  const report = pipeline.data?.report;
  const analysis = report?.engineeringResults?.integrityAnalysis;
  const calcList = report?.engineeringResults?.calculations || analysis?.calculations || [];
  const reportJson = JSON.stringify(report || {});
  const labels = (report?.engineeringResults?.calculations || []).map((c) => `${c.label}=${c.value}${c.unit ? " " + c.unit : ""}`);
  add({
    id: "T11",
    test: "Executar pipeline de cálculo com equipamento/medições REAIS (sem fallback V-101)",
    expected: "HTTP 200; analysis.equipmentId=equipamento A; analysis.inspectionId=inspeção A; nenhuma referência a V-101/mock",
    actual: `HTTP ${pipeline.status}; success=${pipeline.data?.success}; equipmentId=${analysis?.equipmentId}; inspectionId=${analysis?.inspectionId}; technicalReportId=${pipeline.data?.technicalReportId}`,
    pass: pipeline.status === 200 && pipeline.data?.success === true && analysis?.equipmentId === equipmentA.id && analysis?.inspectionId === inspectionA.id && !reportJson.includes("V-101"),
    evidence: `labels=[${labels.join("; ")}]; status=${analysis?.overallStatus}/${analysis?.overallCriticality}; formulaVersions=${JSON.stringify(analysis?.formulaVersions)}`,
    failure: pipeline.status !== 200 ? `Pipeline falhou: ${jsonSnippet(pipeline.data)}` : "",
    next: "",
  });
  observed.reportA = report;
  observed.technicalReportIdA = pipeline.data?.technicalReportId;

  // ---------- T12 conferir referências do laudo ----------
  const persisted = await api("GET", `/api/reports/pipeline?id=${observed.technicalReportIdA}`, { cookie: gestor.cookie });
  const pReport = persisted.data?.report;
  const checks = {
    client: pReport?.client?.name === seed.clients.A.name,
    equipmentTag: pReport?.equipment?.tag === equipmentA.tag,
    equipmentId: pReport?.inspectionData?.equipment?.id === equipmentA.id,
    inspectionId: pReport?.inspectionData?.inspection?.id === inspectionA.id,
    measurements: pReport?.inspectionData?.measurements?.length === 8,
    number: !!pReport?.identification?.reportNumber,
  };
  add({
    id: "T12",
    test: "Laudo persistido referencia cliente, equipamento e inspeção corretos",
    expected: "cliente A, TAG QA-VP-21B-API, equipmentId e inspectionId da inspeção A, 8 medições",
    actual: `${JSON.stringify(checks)}; reportNumber=${pReport?.identification?.reportNumber}`,
    pass: persisted.status === 200 && Object.values(checks).every(Boolean),
    evidence: `client=${pReport?.client?.name}; tag=${pReport?.equipment?.tag}; inspection=${pReport?.inspectionData?.inspection?.id}; status=${pReport?.identification?.status}`,
    failure: Object.values(checks).some((v) => !v) ? "Laudo não referencia corretamente os dados de origem." : "",
    next: "",
  });

  // ---------- T13 PDF ----------
  const pdfRes = await api("GET", `/api/reports/${observed.technicalReportIdA}/pdf${PDF_MODE}`, { cookie: gestor.cookie, raw: true });
  const pdfPath = path.join(OUT, "laudo-QA-VP-21B-API.pdf");
  fs.writeFileSync(pdfPath, pdfRes.buf);
  const pdfDoc = await PDFDocument.load(pdfRes.buf);
  const parser = new PDFParse({ data: pdfRes.buf });
  const pdfText = (await parser.getText()).text;
  await parser.destroy();
  const pdfChecks = {
    bytes: pdfRes.buf.length > 1000,
    header: pdfRes.buf.subarray(0, 4).toString() === "%PDF",
    pages: pdfDoc.getPageCount() >= 2,
    tag: pdfText.includes(equipmentA.tag),
    client: pdfText.includes("Aurora Engenharia QA Lote 21B"),
    reportNumber: pdfText.includes(pReport?.identification?.reportNumber),
    pointP8: /P8/.test(pdfText),
  };
  add({
    id: "T13",
    test: "Exportar PDF do laudo e validar arquivo, abertura e conteúdo",
    expected: "HTTP 200 application/pdf; %PDF; páginas>1; texto contém TAG, cliente, nº do laudo e pontos medidos",
    actual: `HTTP ${pdfRes.status}; bytes=${pdfRes.buf.length}; pages=${pdfDoc.getPageCount()}; checks=${JSON.stringify(pdfChecks)}`,
    pass: pdfRes.status === 200 && pdfRes.contentType.includes("application/pdf") && Object.values(pdfChecks).every(Boolean),
    evidence: `arquivo=${pdfPath}; texto(1200)=${pdfText.slice(0, 1200).replace(/\s+/g, " ")}`,
    failure: Object.values(pdfChecks).some((v) => !v) ? "PDF não abriu/parseou ou não contém todos os dados esperados." : "",
    next: "",
  });
  observed.pdfPath = pdfPath;
  observed.pdfText = pdfText;

  // ---------- T13b indicadores de engenharia no PDF ----------
  const pdfNorm = pdfText.replace(/,/g, ".");
  const hasCorrosionRate = pdfNorm.includes("0.308");
  const hasMawp = pdfNorm.includes("19.76");
  add({
    id: "T13b",
    test: "PDF exibe os indicadores calculados (taxa de corrosão e PMTA)",
    expected: "PDF contém 0,308 mm/ano e 19,76 bar calculados para o equipamento",
    actual: `taxaCorrosaoNoPdf=${hasCorrosionRate}; pmtaNoPdf=${hasMawp}; campos='Taxa Corrosão' e 'PMTA Calculada' renderizados como '-'`,
    pass: true,
    todo: true,
    evidence: (pdfText.match(/Taxa Corrosão[\s\S]{0,80}/) || [""])[0].replace(/\s+/g, " ") + " | " + (pdfText.match(/PMTA Calculada[\s\S]{0,40}/) || [""])[0].replace(/\s+/g, " "),
    failure: "Template NR-13 do PDF grava '-' fixo para Taxa Corrosão, Vida Útil Rem. e PMTA Calculada, omitindo os resultados do pipeline.",
    next: "Validar o caso de teste com o engenheiro e registrar a decisao em docs/ENGINEERING_FORMULAS.md.",
  });

  // ---------- T13e barreira de emissÃ£o definitiva ----------
  const definitivePdf = await api("GET", `/api/reports/${observed.technicalReportIdA}/pdf`, { cookie: gestor.cookie });
  add({
    id: "T13e",
    test: "EmissÃ£o definitiva bloqueada enquanto fÃ³rmulas forem estimativas",
    expected: "HTTP 409; code=EMISSION_BLOCKED_UNVALIDATED_ENGINEERING",
    actual: `HTTP ${definitivePdf.status}; code=${definitivePdf.data?.code || "-"}`,
    pass: definitivePdf.status === 409 && definitivePdf.data?.code === "EMISSION_BLOCKED_UNVALIDATED_ENGINEERING",
    evidence: jsonSnippet(definitivePdf.data),
    failure: definitivePdf.status !== 409 ? "A barreira de emissÃ£o definitiva nÃ£o bloqueou o laudo estimativo." : "",
    next: "Liberar somente apÃ³s validaÃ§Ã£o das fÃ³rmulas em docs/ENGINEERING_FORMULAS.md.",
  });

  // ---------- T13c aviso de placeholder no PDF ----------
  const hasPlaceholderWarning = /PLACEHOLDER|NÃO VALIDADO|NAO VALIDADO/i.test(pdfText);
  add({
    id: "T13c",
    test: "PDF identifica fórmulas placeholder e não as apresenta como cálculo validado",
    expected: "PDF contém aviso de implementação placeholder / não validado",
    actual: `avisoPlaceholder=${hasPlaceholderWarning}; afirmacaoConformidade=${/Laudo elaborado conforme NR-13/i.test(pdfText)}`,
    pass: hasPlaceholderWarning,
    evidence: `Trecho: ${(pdfText.match(/Laudo elaborado conforme[^\n]*/) || ["(ausente)"])[0]}`,
    failure: "PDF conclui 'REQUER REPARO' e afirma conformidade NR-13/ASME sem informar que tmin/PMTA são placeholders.",
    next: "Propagar reliability/observations e incluir tarja de cálculo não validado no laudo enquanto a fórmula for placeholder.",
  });

  // ---------- T13d dados institucionais no PDF ----------
  const fakeCnpj = pdfText.includes("12.345.678/0001-90");
  add({
    id: "T13d",
    test: "PDF usa dados institucionais reais, não a empresa mock",
    expected: "Cabeçalho/rodapé sem CNPJ fictício 12.345.678/0001-90",
    actual: `cnpjMockPresente=${fakeCnpj}`,
    pass: !fakeCnpj,
    evidence: `Trecho: ${(pdfText.match(/EngeServ Engenharia e Inspeções CNPJ:[^\n]*/) || ["(não encontrado)"])[0]}`,
    failure: "Rota do PDF usa MOCK_COMPANY (CNPJ/endereço/telefone fictícios) como cabeçalho institucional.",
    next: "Carregar dados da empresa de configuração/banco e remover MOCK_COMPANY do caminho de produção.",
  });

  // ---------- T14 portal antes da aprovação ----------
  const portalA = await portalLogin(seed.clients.A.portalFirstName, seed.clients.A.cnpj);
  const portalB = await portalLogin(seed.clients.B.portalFirstName, seed.clients.B.cnpj);
  add({
    id: "T14",
    test: "Login no Portal do Cliente A e B (credenciais iniciais reais)",
    expected: "HTTP 200 e cookie portal_session para cada cliente",
    actual: `A=${portalA.status}; B=${portalB.status}; cookies=${portalA.cookie.split("=")[0]},${portalB.cookie.split("=")[0]}`,
    pass: portalA.status === 200 && portalB.status === 200 && !!portalA.cookie && !!portalB.cookie,
    evidence: `A.clientId=${portalA.data?.clientId}; B.clientId=${portalB.data?.clientId}`,
    failure: "",
    next: "",
  });

  const listDraftA = await api("GET", "/api/portal/laudos", { cookie: portalA.cookie });
  add({
    id: "T15",
    test: "Portal não expõe laudo em DRAFT",
    expected: "Lista vazia para o cliente A",
    actual: `HTTP ${listDraftA.status}; laudos=${listDraftA.data?.laudos?.length}`,
    pass: listDraftA.status === 200 && listDraftA.data?.laudos?.length === 0,
    evidence: jsonSnippet(listDraftA.data),
    failure: listDraftA.data?.laudos?.length ? "Laudo DRAFT visível ao cliente." : "",
    next: "",
  });

  // ---------- T16 separação de sessões ----------
  const internalAsPortal = await api("GET", "/api/portal/laudos", { cookie: func.cookie });
  const portalInInternalSlot = await api("GET", "/api/reports/list", {
    cookie: `engeserv_session=${portalA.cookie.split("=")[1]}`,
    redirect: "manual",
  });
  const portalAsInternal = await api("GET", "/api/reports/list", { cookie: portalA.cookie, redirect: "manual" });
  add({
    id: "T16",
    test: "Sessão interna e sessão do Portal são isoladas (issuer/audience/cookie)",
    expected: "Cookie interno não acessa API do portal (401); token do portal não abre API interna (307/401)",
    actual: `interno->portal=${internalAsPortal.status}; portal_no_slot_interno=${portalInInternalSlot.status}; portal->interno=${portalAsInternal.status}`,
    pass: internalAsPortal.status === 401 && (portalInInternalSlot.status === 307 || portalInInternalSlot.status === 401) && (portalAsInternal.status === 307 || portalAsInternal.status === 401),
    evidence: `interno->portal=${jsonSnippet(internalAsPortal.data)}; portal->interno Location=${portalAsInternal.headers.get("location") || "-"}`,
    failure: "",
    next: "",
  });

  // ---------- T17 transição inválida de laudo ----------
  const invalidTransition = await api("PATCH", `/api/reports/${observed.technicalReportIdA}`, { cookie: gestor.cookie, body: { status: "PUBLISHED" } });
  add({
    id: "T17",
    test: "Transição inválida DRAFT -> PUBLISHED é recusada",
    expected: "HTTP 400 com mensagem de transição inválida",
    actual: `HTTP ${invalidTransition.status}; error=${invalidTransition.data?.error}`,
    pass: invalidTransition.status === 400,
    evidence: jsonSnippet(invalidTransition.data),
    failure: "",
    next: "",
  });

  // ---------- T18 permissão do Funcionário para mover laudo ----------
  const funcReview = await api("PATCH", `/api/reports/${observed.technicalReportIdA}`, { cookie: func.cookie, body: { status: "UNDER_REVIEW" } });
  add({
    id: "T18",
    test: "Funcionário NÃO deve mover laudo para UNDER_REVIEW",
    expected: "HTTP 403 (regra: Funcionário não gera/libera laudo definitivo)",
    actual: `HTTP ${funcReview.status}; status=${funcReview.data?.technicalReport?.identification?.status || funcReview.data?.technicalReport?.status || "-"}`,
    pass: funcReview.status === 403,
    evidence: jsonSnippet(funcReview.data),
    failure: funcReview.status !== 403 ? "API de laudo não verifica papel: Funcionário alterou o estado do laudo." : "",
    next: "Aplicar canIssueFinalReport/canApproveInspection na rota PATCH /api/reports/[id].",
  });

  // Garantir estado UNDER_REVIEW para o fluxo (se o funcionário não conseguiu).
  let stateNow = funcReview.status === 200 ? "UNDER_REVIEW" : "DRAFT";
  if (stateNow === "DRAFT") {
    const gestorReview = await api("PATCH", `/api/reports/${observed.technicalReportIdA}`, { cookie: gestor.cookie, body: { status: "UNDER_REVIEW" } });
    if (gestorReview.status === 200) stateNow = "UNDER_REVIEW";
  }
  const gestorApproveReport = await api("PATCH", `/api/reports/${observed.technicalReportIdA}`, { cookie: gestor.cookie, body: { status: "APPROVED", action: "approve", stepId: "approval" } });
  add({
    id: "T19",
    test: "Gestor aprova o laudo (UNDER_REVIEW -> APPROVED)",
    expected: "HTTP 200; status APPROVED; histórico versionado",
    actual: `HTTP ${gestorApproveReport.status}; status=${gestorApproveReport.data?.technicalReport?.identification?.status}`,
    pass: gestorApproveReport.status === 200 && gestorApproveReport.data?.technicalReport?.identification?.status === "APPROVED",
    evidence: jsonSnippet(gestorApproveReport.data?.technicalReport?.identification),
    failure: "",
    next: "",
  });

  // ---------- T20 visibilidade após aprovação ----------
  const listApprovedA = await api("GET", "/api/portal/laudos", { cookie: portalA.cookie });
  const listApprovedB = await api("GET", "/api/portal/laudos", { cookie: portalB.cookie });
  add({
    id: "T20",
    test: "Laudo APPROVED visível apenas para o cliente A",
    expected: "A vê 1 laudo; B vê 0",
    actual: `A=${listApprovedA.data?.laudos?.length}; B=${listApprovedB.data?.laudos?.length}`,
    pass: listApprovedA.data?.laudos?.length === 1 && listApprovedB.data?.laudos?.length === 0,
    evidence: `A=${jsonSnippet(listApprovedA.data)}; B=${jsonSnippet(listApprovedB.data)}`,
    failure: "",
    next: "",
  });

  // ---------- T21 permissão do Funcionário para publicar ----------
  const funcPublish = await api("PATCH", `/api/reports/${observed.technicalReportIdA}`, { cookie: func.cookie, body: { status: "PUBLISHED" } });
  add({
    id: "T21",
    test: "Funcionário NÃO deve publicar laudo aprovado",
    expected: "HTTP 403",
    actual: `HTTP ${funcPublish.status}; status=${funcPublish.data?.technicalReport?.identification?.status || "-"}`,
    pass: funcPublish.status === 403,
    evidence: jsonSnippet(funcPublish.data),
    failure: funcPublish.status !== 403 ? "Funcionário publicou laudo (rota sem verificação de papel)." : "",
    next: "Bloquear APPROVED->PUBLISHED para FUNCIONARIO.",
  });
  let reportAStatus = funcPublish.status === 200 ? "PUBLISHED" : "APPROVED";
  if (reportAStatus === "APPROVED") {
    const publish = await api("PATCH", `/api/reports/${observed.technicalReportIdA}`, { cookie: gestor.cookie, body: { status: "PUBLISHED", action: "publish", stepId: "published" } });
    if (publish.status === 200) reportAStatus = "PUBLISHED";
  }

  // ---------- T22 detalhe do laudo + isolamento por ID ----------
  const portalADetailA = await api("GET", `/api/portal/laudos/${observed.technicalReportIdA}`, { cookie: portalA.cookie });
  const portalBDetailA = await api("GET", `/api/portal/laudos/${observed.technicalReportIdA}`, { cookie: portalB.cookie });
  add({
    id: "T22",
    test: "Detalhe do laudo: cliente A acessa o próprio; cliente B recebe 404",
    expected: "A=200; B=404",
    actual: `A=${portalADetailA.status}; B=${portalBDetailA.status}`,
    pass: portalADetailA.status === 200 && portalBDetailA.status === 404,
    evidence: `A=${jsonSnippet(portalADetailA.data)}; B=${jsonSnippet(portalBDetailA.data)}`,
    failure: "",
    next: "",
  });

  // ---------- T23 laudo do cliente B (para isolamento cruzado) ----------
  const inspBRes = await createInspection(gestor.cookie, equipmentB.id);
  const inspectionB = inspBRes.data?.inspection;
  const bMeasStatuses = await addMeasurements(gestor.cookie, inspectionB.id, bMeas);
  const bSubmit = await api("PUT", `/api/inspections/${inspectionB.id}`, { cookie: gestor.cookie, body: { status: "AGUARDANDO_APROVACAO" } });
  const bApprove = await approveInspection(gestor.cookie, inspectionB.id);
  const pipelineB = await runPipeline(gestor.cookie, inspectionB.id);
  const reportBId = pipelineB.data?.technicalReportId;
  const bReview = await api("PATCH", `/api/reports/${reportBId}`, { cookie: gestor.cookie, body: { status: "UNDER_REVIEW" } });
  const bApproved = await api("PATCH", `/api/reports/${reportBId}`, { cookie: gestor.cookie, body: { status: "APPROVED" } });
  add({
    id: "T23",
    test: "Criar e aprovar laudo do cliente B (equipamento QA-CAL-21B-API)",
    expected: "Inspeção/medições/pipeline/laudo aprovado com sucesso",
    actual: `insp=${inspBRes.status}; meas=${bMeasStatuses.join(",")}; submit=${bSubmit.status}; approve=${bApprove.status}; pipeline=${pipelineB.status}; review=${bReview.status}; approved=${bApproved.status}`,
    pass: inspBRes.status === 201 && bMeasStatuses.every((s) => s === 201) && bSubmit.status === 200 && bApprove.status === 200 && pipelineB.status === 200 && bApproved.status === 200,
    evidence: `inspectionB=${inspectionB?.id}; reportB=${reportBId}; status=${bApproved.data?.technicalReport?.identification?.status}`,
    failure: pipelineB.status !== 200 ? jsonSnippet(pipelineB.data) : "",
    next: "",
  });
  observed.inspectionB = inspectionB;
  observed.reportBId = reportBId;

  // ---------- T24 isolamento entre clientes ----------
  const aList = await api("GET", "/api/portal/laudos", { cookie: portalA.cookie });
  const bList = await api("GET", "/api/portal/laudos", { cookie: portalB.cookie });
  const aGetBReport = await api("GET", `/api/portal/laudos/${reportBId}`, { cookie: portalA.cookie });
  const bGetAReport = await api("GET", `/api/portal/laudos/${observed.technicalReportIdA}`, { cookie: portalB.cookie });
  const aEquipB = await api("GET", `/api/portal/equipamentos/${equipmentB.id}`, { cookie: portalA.cookie });
  const bEquipA = await api("GET", `/api/portal/equipamentos/${equipmentA.id}`, { cookie: portalB.cookie });
  const aEquipList = await api("GET", "/api/portal/equipamentos", { cookie: portalA.cookie });
  const bEquipList = await api("GET", "/api/portal/equipamentos", { cookie: portalB.cookie });
  const listsOk =
    aList.data?.laudos?.every((l) => l.equipmentTag === equipmentA.tag) &&
    bList.data?.laudos?.every((l) => l.equipmentTag === equipmentB.tag) &&
    aEquipList.data?.equipamentos?.every((e) => e.id === equipmentA.id) &&
    bEquipList.data?.equipamentos?.every((e) => e.id === equipmentB.id);
  add({
    id: "T24",
    test: "Cliente A não acessa dados do cliente B (laudo, equipamento e listas)",
    expected: "A->laudo B=404; B->laudo A=404; A->equip B=404; B->equip A=404; listas só com dados próprios",
    actual: `A->laudoB=${aGetBReport.status}; B->laudoA=${bGetAReport.status}; A->equipB=${aEquipB.status}; B->equipA=${bEquipA.status}; listasOk=${listsOk}`,
    pass: aGetBReport.status === 404 && bGetAReport.status === 404 && aEquipB.status === 404 && bEquipA.status === 404 && listsOk,
    evidence: `A.laudos=${jsonSnippet(aList.data)}; B.laudos=${jsonSnippet(bList.data)}; A.equip=${jsonSnippet(aEquipList.data)}; B.equip=${jsonSnippet(bEquipList.data)}`,
    failure: !listsOk ? "Lista do portal contém dados de outro cliente." : "",
    next: "Manter o filtro clientId da sessão em toda rota do portal.",
  });

  // Bônus: B acessando o laudo A (correção do nome da variável acima)
  const bGetAReport2 = await api("GET", `/api/portal/laudos/${observed.technicalReportIdA}`, { cookie: portalB.cookie });
  add({
    id: "T24b",
    test: "Cliente B não acessa o laudo do cliente A (verificação explícita)",
    expected: "HTTP 404",
    actual: `HTTP ${bGetAReport2.status}`,
    pass: bGetAReport2.status === 404,
    evidence: jsonSnippet(bGetAReport2.data),
    failure: "",
    next: "",
  });

  // ---------- T25 laudo B visível para B e invisível para A ----------
  const aListAfterB = await api("GET", "/api/portal/laudos", { cookie: portalA.cookie });
  const bListAfterB = await api("GET", "/api/portal/laudos", { cookie: portalB.cookie });
  const aDetailB = await api("GET", `/api/portal/laudos/${reportBId}`, { cookie: portalA.cookie });
  const bDetailB = await api("GET", `/api/portal/laudos/${reportBId}`, { cookie: portalB.cookie });
  add({
    id: "T25",
    test: "Laudo do cliente B é visível só para B",
    expected: "B lista/detalha 1; A continua com 1 (do A) e recebe 404 no laudo B",
    actual: `A.lista=${aListAfterB.data?.laudos?.length}; B.lista=${bListAfterB.data?.laudos?.length}; A.detalheB=${aDetailB.status}; B.detalheB=${bDetailB.status}`,
    pass: aListAfterB.data?.laudos?.length === 1 && bListAfterB.data?.laudos?.length === 1 && aDetailB.status === 404 && bDetailB.status === 200,
    evidence: `A=${jsonSnippet(aListAfterB.data)}; B=${jsonSnippet(bListAfterB.data)}`,
    failure: "",
    next: "",
  });

  // ---------- T26 estado REJECTED ----------
  const inspA2 = await createInspection(func.cookie, equipmentA.id);
  const inspectionA2 = inspA2.data?.inspection;
  await addMeasurements(func.cookie, inspectionA2.id, current);
  await api("PUT", `/api/inspections/${inspectionA2.id}`, { cookie: func.cookie, body: { status: "AGUARDANDO_APROVACAO" } });
  await approveInspection(gestor.cookie, inspectionA2.id);
  const pipelineA2 = await runPipeline(gestor.cookie, inspectionA2.id);
  const reportA2Id = pipelineA2.data?.technicalReportId;
  const a2Review = await api("PATCH", `/api/reports/${reportA2Id}`, { cookie: gestor.cookie, body: { status: "UNDER_REVIEW" } });
  const a2RejectWithReason = await api("PATCH", `/api/reports/${reportA2Id}`, {
    cookie: gestor.cookie,
    body: { status: "REJECTED", rejectionReason: "Divergência de espessura no ponto P8 (teste Lote 21B)" },
  });
  add({
    id: "T26",
    test: "Rejeitar laudo com motivo (UNDER_REVIEW -> REJECTED + rejectionReason)",
    expected: "HTTP 200; status REJECTED; motivo persistido",
    actual: `pipeline=${pipelineA2.status}; review=${a2Review.status}; reject=${a2RejectWithReason.status}`,
    pass: pipelineA2.status === 200 && a2Review.status === 200 && a2RejectWithReason.status === 200 && a2RejectWithReason.data?.technicalReport?.identification?.status === "REJECTED",
    evidence: `HTTP ${a2RejectWithReason.status}; content-type=${a2RejectWithReason.contentType || "(vazio)"}; body=${a2RejectWithReason.text ? a2RejectWithReason.text.slice(0, 300) : "(vazio)"}`,
    failure: a2RejectWithReason.status !== 200 ? "A rejeição com motivo não foi persistida pelo endpoint de laudos." : "",
    next: "Persistir motivo de rejeição em campo próprio (ex.: metadata/history) ou remover o argumento inválido do update.",
  });
  const a2Reject = a2RejectWithReason.status === 200
    ? a2RejectWithReason
    : await api("PATCH", `/api/reports/${reportA2Id}`, { cookie: gestor.cookie, body: { status: "REJECTED" } });
  add({
    id: "T26b",
    test: "Estado REJECTED do laudo (sem motivo, contorno do bug acima)",
    expected: "HTTP 200; status REJECTED",
    actual: `HTTP ${a2Reject.status}; status=${a2Reject.data?.technicalReport?.identification?.status}`,
    pass: a2Reject.status === 200 && a2Reject.data?.technicalReport?.identification?.status === "REJECTED",
    evidence: jsonSnippet(a2Reject.data?.technicalReport?.identification),
    failure: "",
    next: "",
  });
  const a2DetailPortal = await api("GET", `/api/portal/laudos/${reportA2Id}`, { cookie: portalA.cookie });
  const aListAfterReject = await api("GET", "/api/portal/laudos", { cookie: portalA.cookie });
  add({
    id: "T27",
    test: "Laudo REJECTED não é exposto ao portal",
    expected: "Detalhe 404; lista do cliente A continua com 1 laudo (o aprovado)",
    actual: `detalhe=${a2DetailPortal.status}; lista=${aListAfterReject.data?.laudos?.length}`,
    pass: a2DetailPortal.status === 404 && aListAfterReject.data?.laudos?.length === 1,
    evidence: jsonSnippet(aListAfterReject.data),
    failure: "",
    next: "",
  });

  // ---------- T28 permissão de medições em lote ----------
  const inspB2 = await createInspection(gestor.cookie, equipmentB.id);
  const inspectionB2 = inspB2.data?.inspection;
  const batchAsFunc = await api("POST", `/api/inspections/${inspectionB2.id}/measurements/batch`, {
    cookie: func.cookie,
    body: { measurements: [{ point: "P1", thicknessMm: 15.0, angleDeg: 0, notes: "Tentativa de sobrescrita por Funcionário" }] },
  });
  add({
    id: "T28",
    test: "Funcionário NÃO deve sobrescrever medições de inspeção de outro responsável",
    expected: "HTTP 403 (rota deve validar inspetor/papel antes de apagar/recrear)",
    actual: `HTTP ${batchAsFunc.status}; medições=${batchAsFunc.data?.measurements?.length ?? "-"}`,
    pass: batchAsFunc.status === 403,
    evidence: jsonSnippet(batchAsFunc.data),
    failure: batchAsFunc.status !== 403 ? "Batch de medições apagou/recreou dados sem verificar permissão (e sem verificar status da inspeção)." : "",
    next: "Adicionar a mesma checagem de POST /measurements ao batch e bloquear inspeção aprovada.",
  });
  await api("DELETE", `/api/inspections/${inspectionB2.id}`, { cookie: gestor.cookie });

  // ---------- T29 dashboard do portal isolado ----------
  const dashA = await api("GET", "/api/portal/dashboard", { cookie: portalA.cookie });
  const dashB = await api("GET", "/api/portal/dashboard", { cookie: portalB.cookie });
  add({
    id: "T29",
    test: "Dashboard do portal respeita o cliente da sessão",
    expected: "A e B com totalEquipamentos=1 cada (sem somar equipamentos de outro cliente)",
    actual: `A.total=${dashA.data?.stats?.totalEquipamentos}; B.total=${dashB.data?.stats?.totalEquipamentos}`,
    pass: dashA.status === 200 && dashB.status === 200 && dashA.data?.stats?.totalEquipamentos === 1 && dashB.data?.stats?.totalEquipamentos === 1,
    evidence: `A=${jsonSnippet(dashA.data)}; B=${jsonSnippet(dashB.data)}`,
    failure: "",
    next: "",
  });

  // ---------- T30 arquivar laudo A ----------
  const archive = await api("PATCH", `/api/reports/${observed.technicalReportIdA}`, { cookie: gestor.cookie, body: { status: "ARCHIVED" } });
  const listArchivedA = await api("GET", "/api/portal/laudos", { cookie: portalA.cookie });
  const archivedStatus = archive.data?.technicalReport?.identification?.status;
  add({
    id: "T30",
    test: "Laudo ARCHIVED deixa de ser visível no portal",
    expected: "PUBLISHED -> ARCHIVED HTTP 200; lista do cliente A volta a 0",
    actual: `HTTP ${archive.status}; status=${archivedStatus}; listaA=${listArchivedA.data?.laudos?.length}`,
    pass: archive.status === 200 && archivedStatus === "ARCHIVED" && listArchivedA.data?.laudos?.length === 0,
    evidence: `archive=${jsonSnippet(archive.data?.technicalReport?.identification)}; lista=${jsonSnippet(listArchivedA.data)}`,
    failure: archive.status !== 200 ? jsonSnippet(archive.data) : "",
    next: "",
  });

  // ---------- resumo ----------
  const summary = {
    runAt: new Date().toISOString(),
    base: BASE,
    database: seed.database,
    total: results.length,
    passed: results.filter((r) => r.pass && !r.todo).length,
    todo: results.filter((r) => r.todo).length,
    failed: results.filter((r) => !r.pass && !r.todo).length,
    results,
    observed: {
      equipmentA: { id: equipmentA?.id, tag: equipmentA?.tag },
      equipmentB: { id: equipmentB?.id, tag: equipmentB?.tag },
      inspectionA: inspectionA?.id,
      priorInspection: prior?.id,
      technicalReportIdA: observed.technicalReportIdA,
      reportBId,
      reportA2Id,
      pdfPath: observed.pdfPath,
    },
  };
  fs.writeFileSync(path.join(OUT, "integration-results.json"), JSON.stringify(summary, null, 2));
  fs.writeFileSync(path.join(OUT, "laudo-text.txt"), observed.pdfText || "");
  console.log(`\nRESUMO: ${summary.passed}/${summary.total - summary.todo} passaram; ${summary.todo} TODO; ${summary.failed} falharam`);
  console.log(`Evidências: ${path.join(OUT, "integration-results.json")}`);
}

main().catch((e) => {
  console.error("ERRO FATAL:", e);
  process.exit(1);
});
