const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const brandingService = require('./brandingService');
const { escapeHtml } = require('../utils/htmlEscape');

const dash = '&mdash;';

const text = (value, fallback = dash) => {
    if (value === undefined || value === null || value === '') return fallback;
    return escapeHtml(value);
};

const formatDate = (value, fallback = dash) => {
    if (!value) return fallback;
    return escapeHtml(new Date(value).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    }));
};

const reportNumber = (id) => escapeHtml(String(id ?? '').padStart(5, '0'));

const formatHours = (value) => escapeHtml(Number(value).toLocaleString('es-AR'));

const badgeClass = (state) => {
    if (state === 'Good') return 'badge-ok';
    if (state === 'Faulty') return 'badge-fault';
    return 'badge-warn';
};

const badgeText = (state) => {
    if (state === 'Good') return 'OK';
    if (state === 'Faulty') return 'ERROR';
    return 'ADVERT.';
};

const buildRepairPDFHtml = (repair, branding, validImages = []) => {
    const issueDate = formatDate(new Date());
    const entryDate = formatDate(repair.entry_date);
    const currentReportNumber = reportNumber(repair.id);

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            @page { size: A4; margin: 0 !important; }
            body {
                font-family: 'Segoe UI', system-ui, sans-serif;
                margin: 0;
                padding: 16mm 20mm;
                color: #1e293b;
                line-height: 1.6;
                font-size: 13px;
                -webkit-print-color-adjust: exact;
            }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 4px solid #1e293b; padding-bottom: 28px; margin-bottom: 0; }
            .header-info p { font-size: 9px; font-weight: 900; color: #64748b; text-transform: uppercase; letter-spacing: 0.2em; margin: 0 0 6px 0; }
            .header-info h1 { font-size: 36px; font-weight: 900; color: #0f172a; text-transform: uppercase; margin: 0; }
            .header-right { text-align: right; }
            .type-badge { display: inline-block; background: ${repair.type === 'Approval' ? '#d1fae5' : '#fef3c7'}; color: ${repair.type === 'Approval' ? '#065f46' : '#92400e'}; border-radius: 6px; padding: 3px 12px; margin-bottom: 12px; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15em; }
            .report-num-label, .issue-date-label { font-size: 9px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 3px 0; }
            .report-num { font-size: 22px; font-weight: 900; color: #0f172a; font-family: monospace; margin: 0 0 12px 0; }
            .issue-date { font-size: 14px; font-weight: 800; color: #0f172a; margin: 0; }
            .meta-strip { display: grid; grid-template-columns: 1fr 1fr 1fr; background: #1e293b; color: #fff; margin-bottom: 0; border-radius: 0 0 8px 8px; overflow: hidden; }
            .meta-cell { padding: 12px 20px; border-right: 1px solid #334155; }
            .meta-cell:last-child { border-right: none; }
            .meta-label { font-size: 8px; font-weight: 900; color: #64748b; text-transform: uppercase; letter-spacing: 0.12em; margin: 0 0 3px 0; }
            .meta-value { font-size: 13px; font-weight: 800; color: #f8fafc; margin: 0; }
            .section-heading { display: flex; align-items: center; gap: 10px; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.25em; color: #94a3b8; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin: 36px 0 18px; }
            .section-num { color: #1e293b; font-size: 11px; }
            .sub-heading { font-size: 11px; font-weight: 800; color: #334155; text-transform: uppercase; letter-spacing: 0.08em; margin: 20px 0 8px; display: flex; align-items: center; gap: 6px; }
            .sub-heading::before { content: ''; display: inline-block; width: 3px; height: 12px; background: #3b82f6; border-radius: 2px; }
            .data-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
            .data-table th { background: #1e293b; color: #fff; text-align: left; padding: 9px 14px; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.12em; }
            .data-table td { padding: 9px 14px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
            .data-table tr:nth-child(even) td { background: #f8fafc; }
            .report-label { color: #64748b; font-size: 12px; font-weight: 500; }
            .stat-boxes { display: flex; gap: 12px; margin-bottom: 15px; }
            .stat-box { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; text-align: center; }
            .stat-label { font-size: 8px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px; }
            .stat-value { font-size: 16px; font-weight: 900; color: #0f172a; }
            .obs-text { font-size: 13px; color: #334155; line-height: 1.75; white-space: pre-wrap; background: #f8fafc; border-left: 3px solid #e2e8f0; border-radius: 0 8px 8px 0; padding: 14px 18px; margin: 0 0 16px; font-style: italic; }
            .fault-reported-box { background: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 16px 20px; margin-bottom: 16px; }
            .fault-reported-text { font-size: 13px; color: #78350f; font-style: italic; margin: 0; line-height: 1.7; }
            .state-badge { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.06em; }
            .badge-ok { background: #d1fae5; color: #065f46; }
            .badge-warn { background: #fef3c7; color: #92400e; }
            .badge-fault { background: #fee2e2; color: #991b1b; }
            .photo-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 10px; }
            .photo-cell { border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; break-inside: avoid; }
            .photo-img { width: 100%; height: 160px; object-fit: cover; display: block; }
            .photo-cap { text-align: center; font-size: 8px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; padding: 6px 0 8px; }
            .conclusion-box { border: 3px solid #1e293b; border-radius: 4px; padding: 28px 32px; background: #f8fafc; font-size: 14px; font-weight: 700; color: #0f172a; line-height: 1.75; font-style: italic; }
            .sig-row { display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid #e2e8f0; padding-top: 32px; margin-top: 40px; }
            .sig-block { text-align: center; }
            .sig-line { width: 180px; border-bottom: 2px solid #1e293b; margin: 0 auto 8px; }
            .sig-role { font-size: 9px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 4px; }
            .sig-name { font-size: 13px; font-weight: 800; color: #0f172a; }
            .footer { margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 14px; display: flex; justify-content: space-between; align-items: center; }
            .footer p { font-size: 8px; color: #cbd5e1; font-weight: 600; margin: 0; }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="header-info">
                <p>${text(branding.companyName)} &middot; ${text(branding.departmentName)}</p>
                <h1>${text(branding.reportTitle)}</h1>
            </div>
            <div class="header-right">
                <div class="type-badge">${text(repair.type, 'Servicio')}</div>
                <p class="report-num-label">Nro. de Informe</p>
                <p class="report-num">#${currentReportNumber}</p>
                <p class="issue-date-label">Fecha de Emision</p>
                <p class="issue-date">${issueDate}</p>
            </div>
        </div>

        <div class="meta-strip">
            <div class="meta-cell"><p class="meta-label">Responsable</p><p class="meta-value">${text(repair.technician_name)}</p></div>
            <div class="meta-cell"><p class="meta-label">Cliente</p><p class="meta-value">${text(repair.client_name)}</p></div>
            <div class="meta-cell"><p class="meta-label">Fecha de Ingreso</p><p class="meta-value">${entryDate}</p></div>
        </div>

        <div class="section-heading"><span class="section-num">1.</span> Estado del Dispositivo</div>
        <div class="sub-heading">1.1 Caracteristicas Electricas</div>
        <table class="data-table">
            <tr><td class="report-label">Marca</td><td style="font-weight: 700;">${text(repair.brand)}</td></tr>
            <tr><td class="report-label">Modelo</td><td style="font-weight: 700;">${text(repair.model)}</td></tr>
            <tr><td class="report-label">Potencia</td><td style="font-weight: 700;">${text(repair.power)}</td></tr>
            <tr><td class="report-label">Tension</td><td style="font-weight: 700;">${text(repair.input_voltage)}</td></tr>
            <tr><td class="report-label">Nro. de Serie</td><td style="font-weight: 700;">${text(repair.serial_number)}</td></tr>
            <tr><td class="report-label">Nro. Interno</td><td style="font-weight: 700;">${text(repair.internal_number)}</td></tr>
        </table>

        ${(repair.age || repair.run_hours || repair.connection_hours) ? `
        <div class="sub-heading">1.2 Estado de Ingreso</div>
        <div class="stat-boxes">
            ${repair.age ? `<div class="stat-box"><div class="stat-label">Antiguedad</div><div class="stat-value">${text(repair.age)}</div></div>` : ''}
            ${repair.run_hours ? `<div class="stat-box"><div class="stat-label">Hs. Marcha</div><div class="stat-value">${formatHours(repair.run_hours)}</div></div>` : ''}
            ${repair.connection_hours ? `<div class="stat-box"><div class="stat-label">Hs. Conexion</div><div class="stat-value">${formatHours(repair.connection_hours)}</div></div>` : ''}
        </div>
        ` : ''}

        ${repair.reported_fault ? `
        <div class="sub-heading">1.3 Falla Reportada</div>
        <div class="fault-reported-box">
            <p class="fault-reported-text">"${text(repair.reported_fault, '')}"</p>
        </div>
        ` : ''}

        <div class="section-heading"><span class="section-num">2.</span> Procedimiento Tecnico</div>
        ${repair.disassembly_obs ? `<div class="sub-heading">2.1 Desarmado</div><div class="obs-text">${text(repair.disassembly_obs, '')}</div>` : ''}
        ${repair.measurement_obs ? `<div class="sub-heading">2.2 Mediciones</div><div class="obs-text">${text(repair.measurement_obs, '')}</div>` : ''}
        ${repair.testing_obs ? `<div class="sub-heading">2.3 Pruebas</div><div class="obs-text">${text(repair.testing_obs, '')}</div>` : ''}

        ${repair.component_states && repair.component_states.length > 0 ? `
        <div class="section-heading"><span class="section-num">3.</span> Estado de Componentes</div>
        <table class="data-table">
            <thead>
                <tr><th>Componente</th><th style="text-align: center;">Estado</th><th>Observaciones</th></tr>
            </thead>
            <tbody>
                ${repair.component_states.map(c => `
                    <tr>
                        <td style="font-weight: 700;">${text(c.component_name)}</td>
                        <td style="text-align: center;"><span class="state-badge ${badgeClass(c.state)}">${badgeText(c.state)}</span></td>
                        <td>${text(c.observations)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        ` : ''}

        ${validImages.length > 0 ? `
        <div class="section-heading"><span class="section-num">4.</span> Evidencia Fotografica</div>
        <div class="photo-grid">
            ${validImages.map(img => `
                <div class="photo-cell">
                    <img src="${img.base64}" class="photo-img" />
                    <div class="photo-cap">${text(img.step_name)}</div>
                </div>
            `).join('')}
        </div>
        ` : ''}

        <div class="section-heading"><span class="section-num">5.</span> Conclusion Final</div>
        <div class="conclusion-box">
            ${text(repair.final_conclusion, 'El equipo fue revisado siguiendo los procedimientos estandar del departamento de Desarrollo de DMD Compresores.')}
        </div>

        <div class="sig-row">
            <div class="sig-block">
                <div class="sig-line"></div>
                <div class="sig-role">Responsable Tecnico</div>
                <div class="sig-name">${text(repair.technician_name)}</div>
            </div>
            <div class="sig-block">
                <div class="sig-line"></div>
                <div class="sig-role">Firma - ${text(branding.companyName)}</div>
                <div class="sig-name" style="color: #94a3b8;">${text(branding.departmentName)}</div>
            </div>
        </div>

        <div class="footer">
            <p>${text(branding.reportFooterText)}</p>
            <p>Informe #${currentReportNumber}</p>
        </div>
    </body>
    </html>
    `;
};

/**
 * Generates a PDF buffer from a repair object.
 * This mimics the layout of the frontend ReportView.jsx.
 */
const generateRepairPDF = async (repair) => {
    const branding = await brandingService.getBranding();
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    const imagesWithBase64 = await Promise.all((repair.images || []).map(async (img) => {
        try {
            const absolutePath = path.isAbsolute(img.file_path)
                ? img.file_path
                : path.join(__dirname, '..', img.file_path);

            if (fs.existsSync(absolutePath)) {
                const bitmap = fs.readFileSync(absolutePath);
                const base64 = Buffer.from(bitmap).toString('base64');
                const ext = path.extname(absolutePath).slice(1) || 'png';
                return { ...img, base64: `data:image/${ext};base64,${base64}` };
            }
        } catch (err) {
            console.error('Error processing image for PDF:', err);
        }
        return null;
    }));

    const htmlContent = buildRepairPDFHtml(repair, branding, imagesWithBase64.filter(Boolean));

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    await page.setViewport({ width: 794, height: 1122 });

    const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        displayHeaderFooter: false,
        margin: { top: '0px', bottom: '0px', left: '0px', right: '0px' },
        preferCSSPageSize: false
    });

    await browser.close();
    return pdfBuffer;
};

module.exports = {
    buildRepairPDFHtml,
    generateRepairPDF
};
