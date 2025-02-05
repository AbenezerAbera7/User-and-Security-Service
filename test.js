const { Document, Paragraph, TextRun, HeadingLevel } = require('docx');
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
function exportdoc(data) {
    // Helper functions to create paragraphs
    const createHeading = (text, level) =>
        new Paragraph({ text, heading: level, spacing: { after: 200 } });

    const createTextParagraph = (text) =>
        new Paragraph({ children: [new TextRun({ text })] });

    // Create the document
    const doc = new Document({
        sections: [
            {
                children: [
                    // Network Devices Section
                    ...(data.network_devices?.length
                        ? [
                            createHeading("Network Devices", HeadingLevel.HEADING_1),
                            ...data.network_devices.map((device, index) => [
                                createHeading(`Device ${index + 1}`, HeadingLevel.HEADING_2),
                                createTextParagraph(`IP Address: ${device.ip ?? "(Not specified)"}`),
                                createTextParagraph(`Hostname: ${device.hostname ?? "(Not specified)"}`),
                                createTextParagraph(`Status: ${device.status ?? "(Not specified)"}`),
                                createTextParagraph(`Device Type: ${device.device_type ?? "(Not specified)"}`),
                                createTextParagraph(`Firmware Version: ${device.firmware_version ?? "(Not specified)"}`),
                                createTextParagraph(
                                    `Open Ports: ${device.open_ports
                                        ? Object.entries(device.open_ports)
                                            .map(([port, desc]) => `Port ${port}: ${desc}`)
                                            .join(", ")
                                        : "(None)"
                                    }`
                                )
                            ]).flat()
                        ]
                        : []),

                    // Active Directory Scan Section
                    ...(data["Ad Scan"]
                        ? [
                            createHeading("Active Directory Scan", HeadingLevel.HEADING_1),
                            createTextParagraph(`Timestamp: ${data["Ad Scan"]?.timestamp ?? "(Not specified)"}`),
                            ...(data["Ad Scan"].domain_controllers?.length
                                ? [
                                    createHeading("Domain Controllers", HeadingLevel.HEADING_2),
                                    ...data["Ad Scan"].domain_controllers.map((dc) => createTextParagraph(dc))
                                ]
                                : []),
                            ...(data["Ad Scan"].inactive_accounts?.length
                                ? [
                                    createHeading("Inactive Accounts", HeadingLevel.HEADING_2),
                                    ...data["Ad Scan"].inactive_accounts.map((acc) => createTextParagraph(acc))
                                ]
                                : []),
                            ...(data["Ad Scan"]["AD Users"]?.length
                                ? [
                                    createHeading("AD Users", HeadingLevel.HEADING_2),
                                    ...data["Ad Scan"]["AD Users"].map((user) =>
                                        createTextParagraph(
                                            `Name: ${user.name ?? "(Unknown)"}, Last Logon: ${user.last_logon ?? "(Not specified)"
                                            }`
                                        )
                                    )
                                ]
                                : []),
                            ...(data["Ad Scan"].Computers?.length
                                ? [
                                    createHeading("Computers", HeadingLevel.HEADING_1),
                                    ...data["Ad Scan"].Computers.map((comp, index) => [
                                        createHeading(`Computer ${index + 1}`, HeadingLevel.HEADING_2),
                                        createTextParagraph(`Name: ${comp.name ?? "(Not specified)"}`),
                                        createTextParagraph(`Host: ${comp.Host ?? "(Not specified)"}`),
                                        createTextParagraph(`OS: ${comp.os ?? "(Not specified)"}`),
                                        createTextParagraph(
                                            `OS Version: ${comp["os version"] ?? "(Not specified)"}`
                                        )
                                    ]).flat()
                                ]
                                : [])
                        ]
                        : []),

                    //Ms365


                    //On-Prem

                ]
            }
        ]
    });

    return doc


}

async function generatePDF(data) {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();

    // Set font and initial y-position
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    let y = height - 50; // Start from the top of the page
    const lineHeight = 20;

    // Helper function to add text
    function addText(text, options = {}) {
        if (y < 50) {
            page = pdfDoc.addPage(); // Add a new page if space is running out
            y = height - 50;
        }
        page.drawText(text, {
            x: options.x || 50,
            y: y,
            size: options.size || 12,
            font: options.font || font,
            color: options.color || rgb(0, 0, 0),
        });
        y -= lineHeight;
    }

    // Network Devices Section
    if (data.network_devices?.length) {
        addText("Network Devices", { size: 16 });
        data.network_devices.forEach((device, index) => {
            addText(`Device ${index + 1}`, { size: 14 });
            addText(`IP Address: ${device.ip ?? "(Not specified)"}`);
            addText(`Hostname: ${device.hostname ?? "(Not specified)"}`);
            addText(`Status: ${device.status ?? "(Not specified)"}`);
            addText(`Device Type: ${device.device_type ?? "(Not specified)"}`);
            addText(`Firmware Version: ${device.firmware_version ?? "(Not specified)"}`);
            addText(
                `Open Ports: ${device.open_ports
                    ? Object.entries(device.open_ports)
                        .map(([port, desc]) => `Port ${port}: ${desc}`)
                        .join(", ")
                    : "(None)"
                }`
            );
        });
    }

    // Active Directory Scan Section
    if (data["Ad Scan"]) {
        addText("Active Directory Scan", { size: 16 });
        addText(`Timestamp: ${data["Ad Scan"].timestamp ?? "(Not specified)"}`);

        if (data["Ad Scan"].domain_controllers?.length) {
            addText("Domain Controllers", { size: 14 });
            data["Ad Scan"].domain_controllers.forEach((dc) => addText(dc));
        }

        if (data["Ad Scan"].inactive_accounts?.length) {
            addText("Inactive Accounts", { size: 14 });
            data["Ad Scan"].inactive_accounts.forEach((acc) => addText(acc));
        }

        if (data["Ad Scan"]["AD Users"]?.length) {
            addText("AD Users", { size: 14 });
            data["Ad Scan"]["AD Users"].forEach((user) => {
                addText(`Name: ${user.name ?? "(Unknown)"}`);
                addText(`Last Logon: ${user.last_logon ?? "(Not specified)"}`);
            });
        }

        if (data["Ad Scan"].Computers?.length) {
            addText("Computers", { size: 16 });
            data["Ad Scan"].Computers.forEach((comp, index) => {
                addText(`Computer ${index + 1}`, { size: 14 });
                addText(`Name: ${comp.name ?? "(Not specified)"}`);
                addText(`Host: ${comp.Host ?? "(Not specified)"}`);
                addText(`OS: ${comp.os ?? "(Not specified)"}`);
                addText(`OS Version: ${comp["os version"] ?? "(Not specified)"}`);
            });
        }
    }

    // Additional sections (On-Prem Servers, MS365, etc.)
    // Add them similarly, using the above patterns.

    // Save the PDF
    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
}

// Example Usage
(async () => {
    const data = {
        network_devices: [
            {
                ip: "192.168.0.1",
                hostname: "Router",
                status: "Active",
                device_type: "Router",
                firmware_version: "1.0.0",
                open_ports: { 80: "HTTP", 22: "SSH" },
            },
        ],
        "Ad Scan": {
            timestamp: "2025-01-11T10:00:00Z",
            domain_controllers: ["DC1.example.com", "DC2.example.com"],
            inactive_accounts: ["user1", "user2"],
            "AD Users": [
                { name: "John Doe", last_logon: "2025-01-01" },
                { name: "Jane Smith", last_logon: "2024-12-30" },
            ],
            Computers: [
                { name: "PC1", Host: "PC1Host", os: "Windows 10", "os version": "20H2" },
                { name: "PC2", os: "Linux", "os version": "Ubuntu 22.04" },
            ],
        },
    };

    const pdfBytes = await generatePDF(data);

    // Save or serve the PDF (e.g., download in browser)
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    window.open(url); // Opens the PDF in a new browser tab
})();
