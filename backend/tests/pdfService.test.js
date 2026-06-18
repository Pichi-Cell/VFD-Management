import { describe, expect, it } from 'vitest';

describe('PDF service HTML escaping', () => {
    it('should render dynamic values as escaped text, not markup', async () => {
        const pdfServiceModule = await import('../services/pdfService.js');
        const { buildRepairPDFHtml } = pdfServiceModule.default || pdfServiceModule;
        const payload = '<img src=x onerror=alert(1)>';
        const html = buildRepairPDFHtml({
            id: 9,
            type: 'Quote',
            technician_name: payload,
            client_name: payload,
            brand: payload,
            model: payload,
            serial_number: payload,
            internal_number: payload,
            reported_fault: payload,
            disassembly_obs: payload,
            final_conclusion: payload,
            component_states: [{ component_name: payload, state: 'Good', observations: payload }]
        }, {
            companyName: payload,
            departmentName: payload,
            reportTitle: payload,
            reportFooterText: payload
        }, [{ base64: 'data:image/png;base64,abcd', step_name: payload }]);

        expect(html).not.toContain(payload);
        expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
        expect(html).toContain('data:image/png;base64,abcd');
        expect(html).not.toContain('fonts.googleapis.com');
    });
});
