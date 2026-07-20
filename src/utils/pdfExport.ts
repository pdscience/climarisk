import type { RiskApiResponse } from '../types'

const levelColors: Record<string, string> = {
  Crítico: '#ef4444',
  Alto: '#f97316',
  Médio: '#eab308',
  Baixo: '#10b981',
}

const riskLabels: Record<string, string> = {
  chuvaExtrema: 'Chuva Extrema',
  seca: 'Seca',
  ondaCalor: 'Onda de Calor',
  frio: 'Frio Extremo',
  ventoForte: 'Ventos Fortes',
  deslizamento: 'Deslizamento',
}

export async function generateRiskPdf(data: RiskApiResponse) {
  const pdfMake = (await import('pdfmake/build/pdfmake')).default
  const pdfFonts = await import('pdfmake/build/fonts/Roboto')
  pdfMake.vfs = (pdfFonts as any).vfs

  const city = data.city
  const w = data.weather
  const risks = data.risks
  const report = data.report

  const now = new Date().toLocaleString('pt-BR')

  const docDefinition: any = {
    pageSize: 'A4',
    pageMargins: [40, 40, 40, 60],
    content: [
      { text: 'Relatório de Risco Climático', style: 'title' },
      { text: `${city.name} - ${city.state} | Região ${city.region}`, style: 'subtitle' },
      { text: `Gerado em: ${now}`, style: 'date' },
      { text: `ENSO: ${w.ensoScenario.replace(/_/g, ' ').toUpperCase()}`, style: 'tag' },
      '\n',

      { text: 'Resumo dos Riscos', style: 'sectionTitle' },
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto'],
          body: [
            [
              { text: 'Risco', style: 'tableHeader' },
              { text: 'Score', style: 'tableHeader', alignment: 'center' },
              { text: 'Nível', style: 'tableHeader', alignment: 'center' },
            ],
            ...Object.entries(riskLabels).map(([key, label]) => {
              const r = (risks as any)[key]
              return [
                { text: label, style: 'cellText' },
                { text: `${r.score}%`, alignment: 'center', style: 'cellText' },
                { text: r.level, alignment: 'center', color: levelColors[r.level] || '#94a3b8', bold: true },
              ]
            }),
            [
              { text: 'RISCO GERAL', bold: true, fontSize: 11 },
              { text: '', alignment: 'center' },
              { text: risks.overall, alignment: 'center', bold: true, fontSize: 11, color: levelColors[risks.overall] || '#94a3b8' },
            ],
          ],
        },
        layout: 'lightHorizontalLines',
      },
      '\n',

      { text: 'Dados Meteorológicos', style: 'sectionTitle' },
      {
        table: {
          headerRows: 1,
          widths: ['*', '*', '*', '*', '*'],
          body: [
            [
              { text: 'Chuva 72h', style: 'tableHeader', alignment: 'center' },
              { text: 'Temp Máx', style: 'tableHeader', alignment: 'center' },
              { text: 'Temp Mín', style: 'tableHeader', alignment: 'center' },
              { text: 'Rajada Máx', style: 'tableHeader', alignment: 'center' },
              { text: 'Solo', style: 'tableHeader', alignment: 'center' },
            ],
            [
              { text: `${w.precipitation72h} mm`, alignment: 'center', style: 'cellText' },
              { text: `${w.maxTemp}°C`, alignment: 'center', style: 'cellText' },
              { text: `${w.minTemp}°C`, alignment: 'center', style: 'cellText' },
              { text: `${w.maxWindGust} km/h`, alignment: 'center', style: 'cellText' },
              { text: `${w.soilMoisture}%`, alignment: 'center', style: 'cellText' },
            ],
          ],
        },
        layout: 'lightHorizontalLines',
      },
      '\n',

      { text: 'Análise Técnica', style: 'sectionTitle' },
      { text: report.explicabilidade, style: 'bodyText', margin: [0, 0, 0, 10] },
      '\n',

      { text: 'Impactos Operacionais', style: 'sectionTitle' },
      {
        table: {
          headerRows: 1,
          widths: ['auto', '*', 'auto'],
          body: [
            [
              { text: 'Setor', style: 'tableHeader' },
              { text: 'Descrição', style: 'tableHeader' },
              { text: 'Gravidade', style: 'tableHeader', alignment: 'center' },
            ],
            ...report.impactos.map((imp: any) => [
              { text: imp.setor, style: 'cellText', bold: true },
              { text: imp.descricao, style: 'cellText' },
              { text: imp.gravidade, alignment: 'center', style: 'cellText', color: levelColors[imp.gravidade] || '#94a3b8', bold: true },
            ]),
          ],
        },
        layout: 'lightHorizontalLines',
      },
      '\n',

      { text: 'Ações de Prevenção', style: 'sectionTitle' },
      ...report.acoes.map((act: any, i: number) => ({
        columns: [
          { text: `${i + 1}.`, width: 20, style: 'cellText', bold: true },
          [
            { text: `${act.destinatario} — `, bold: true, fontSize: 9, color: '#334155' },
            { text: act.acao, fontSize: 9, color: '#475569' },
          ],
          { text: act.prioridade, width: 60, alignment: 'right', fontSize: 8, bold: true, color: levelColors[act.prioridade] || '#94a3b8' },
        ],
        margin: [0, 0, 0, 4],
      })),
      '\n',

      {
        text: 'ClimaRisk — Previsão de Risco Climático Regional | Brasil 2026',
        style: 'footer',
      },
    ],
    styles: {
      title: { fontSize: 18, bold: true, color: '#0f172a', margin: [0, 0, 0, 4] },
      subtitle: { fontSize: 13, color: '#334155', margin: [0, 0, 0, 2] },
      date: { fontSize: 8, color: '#94a3b8', margin: [0, 0, 0, 2] },
      tag: { fontSize: 9, color: '#d97706', bold: true, margin: [0, 0, 0, 8] },
      sectionTitle: { fontSize: 12, bold: true, color: '#0f172a', margin: [0, 8, 0, 4] },
      tableHeader: { fontSize: 8, bold: true, color: '#475569', fillColor: '#f1f5f9' },
      cellText: { fontSize: 9, color: '#334155' },
      bodyText: { fontSize: 9, color: '#334155', lineHeight: 1.4 },
      footer: { fontSize: 7, color: '#94a3b8', alignment: 'center', margin: [0, 20, 0, 0] },
    },
    defaultStyle: { font: 'Roboto' },
  }

  pdfMake.createPdf(docDefinition).download(`relatorio_risco_${city.id}_${new Date().toISOString().slice(0, 10)}.pdf`)
}
