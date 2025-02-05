const fs = require('fs');
const docx = require('docx');
const { log } = require('console');
const { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType } = docx;

// Sample complex data from your function
const data = {
    "Hardware Informations": {
        "Computer Type": "Linux",
        "CPU Type": "",
        "CPU Available": 4,
        "CPU Used (%)": 10.5,
        "RAM Available (GB)": 7.69,
        "RAM Used (GB)": 2.56,
        "Disk Available (GB)": 382.49,
        "Disk Used (GB)": 362.0,
        "IP Addresses": ['127.0.0.1', '192.168.0.113', '172.17.0.1'],
        "MAC Addresses": ['00:00:00:00:00:00', 'd8:5d:e2:a0:a1:f3', '02:42:c8:0e:87:72', '3c:a8:2a:b0:c6:33', '12:44:eb:b7:56:c0']
    },
    "MAC address": "d8:5d:e2:a0:a1:f3",
    "Hostname": "localhost",
    "Device Type": "Device by Hon Hai Precision Ind. Co.,Ltd.",
    "Internet speedtest": {
        "Internet Speed": {
            "Download": "0.46 Mbps",
            "Upload": "0.32 Mbps"
        }
    },
    "External vulnerability": []
};

const ad_data={
    "timestamp": "2025-01-11 01:49:03",
    "domain_controllers": [
        "WIN-RN7CGCBGGA3",
        "computer-dc",
        "computer-44"
    ],
    "inactive_accounts": [
        "Guest",
        "krbtgt",
        "yser1",
        "user2",
        "COMPUTER-NAME-1$",
        "COMPUTER-NAME-2$",
        "COMPUTER-DC$",
        "Abeny",
        "user3",
        "abenezer",
        "COMPUTER-44$"
    ],
    "AD Users": [
        {
            "name": "Administrator",
            "last_logon": "2025-01-11"
        },
        {
            "name": "Guest",
            "last_logon": "1601-01-01"
        },
        {
            "name": "WIN-RN7CGCBGGA3$",
            "last_logon": "2025-01-11"
        },
        {
            "name": "krbtgt",
            "last_logon": "1601-01-01"
        },
        {
            "name": "yser1",
            "last_logon": "1601-01-01"
        },
        {
            "name": "user2",
            "last_logon": "1601-01-01"
        },
        {
            "name": "COMPUTER-NAME-1$",
            "last_logon": "1601-01-01"
        },
        {
            "name": "COMPUTER-NAME-2$",
            "last_logon": "1601-01-01"
        },
        {
            "name": "COMPUTER-DC$",
            "last_logon": "1601-01-01"
        },
        {
            "name": "Abeny",
            "last_logon": "1601-01-01"
        },
        {
            "name": "user3",
            "last_logon": "1601-01-01"
        },
        {
            "name": "abenezer",
            "last_logon": "1601-01-01"
        },
        {
            "name": "COMPUTER-44$",
            "last_logon": "1601-01-01"
        }
    ],
    "Computers": [
        {
            "name": "WIN-RN7CGCBGGA3",
            "Host": "WIN-RN7CGCBGGA3.abenezer.com",
            "os": "Windows Server 2022 Standard",
            "os version": "10.0 (20348)"
        },
        {
            "name": "Computer-name-1",
            "Host": null,
            "os": null,
            "os version": null
        },
        {
            "name": "computer-name-2",
            "Host": null,
            "os": null,
            "os version": null
        },
        {
            "name": "computer-dc",
            "Host": null,
            "os": null,
            "os version": null
        },
        {
            "name": "computer-44",
            "Host": null,
            "os": null,
            "os version": null
        }
    ],
    "ad_devices": {
        "WIN-RN7CGCBGGA3": {
            "dNSHostName": "WIN-RN7CGCBGGA3.abenezer.com",
            "device_ip": "192.168.0.167",
            "system_result": {
                "cpu": [
                    {
                        "Name": "Intel(R) Core(TM) i5-5200U CPU @ 2.20GHz",
                        "Cores": 2
                    }
                ],
                "ram": {
                    "Total RAM(GB)": 4
                },
                "disk": [
                    {
                        "Drive": "C:",
                        "File System": "NTFS",
                        "Total Space (GB)": 49,
                        "Free Space": 30
                    }
                ],
                "backup": "No backup event found",
                "allinone": "cpu:{'Name': 'Intel(R) Core(TM) i5-5200U CPU @ 2.20GHz', 'Cores': 2} ram:4 disk:{'Drive': 'C:', 'File System': 'NTFS', 'Total Space (GB)': 49, 'Free Space': 30} backup:No backup event found"
            },
            "dns_result": {
                "hostname": "WIN-RN7CGCBGGA3.abenezer.com",
                "a_record_status": "DNS Record Found",
                "mx_record_status": "Warning: No MX record found",
                "soa_record_status": "Warning: No SOA record found",
                "reverse_dns_status": "Warning: No reverse DNS record found",
                "dns_check_status": "DNS Audit Complete",
                "allinone": "A status:DNS Record Found MX status:Warning: No MX record found \nSOA status:Warning: No SOA record found REVERSE DNS status:Warning: No reverse DNS record found"
            },
            "rdp_result": {
                "hostname": "WIN-RN7CGCBGGA3.abenezer.com",
                "rdp_status": "Stopped",
                "firewall_status": null,
                "allinone": "RDP status:Stopped Firwall status:None"
            },
            "sensitive_files": []
        },
        "Computer-name-1": {
            "dNSHostName": null,
            "device_ip": null,
            "system_result": [],
            "dns_result": [],
            "rdp_result": [],
            "sensitive_files": []
        },
        "computer-name-2": {
            "dNSHostName": null,
            "device_ip": null,
            "system_result": [],
            "dns_result": [],
            "rdp_result": [],
            "sensitive_files": []
        },
        "computer-dc": {
            "dNSHostName": null,
            "device_ip": null,
            "system_result": [],
            "dns_result": [],
            "rdp_result": [],
            "sensitive_files": []
        },
        "computer-44": {
            "dNSHostName": null,
            "device_ip": null,
            "system_result": [],
            "dns_result": [],
            "rdp_result": [],
            "sensitive_files": []
        }
    },
    "printers": []
}
// Helper function to generate key-value formatted paragraphs for simple key-value pairs
function generateKeyValueParagraph(key, value) {
    return new Paragraph({
        children: [
            new TextRun({
                text: `${key}:`,
                bold: true,
                size: 22,
            }),
            new TextRun({
                text: ` ${value}`,
                size: 22,
            }),
        ],
        alignment: AlignmentType.LEFT,
    });
}

function headers(text, fontSize = 28, align = "center") {
    let customAlignment;
    if (align === "center") {
        customAlignment = AlignmentType.CENTER;
    } else if (align === "left") {
        customAlignment = AlignmentType.LEFT;
    } else if (align === "right") {
        customAlignment = AlignmentType.RIGHT;
    } else {
        customAlignment = AlignmentType.JUSTIFIED;
    }

    return new Paragraph({
        children: [
            new TextRun({
                text: ` ${text}`,
                bold: true,
                size: fontSize,
            }),
        ],
        alignment: customAlignment,
    });
}

function newline() {
    return new Paragraph({
        children: [
            new TextRun({
                text: "\n", 
            }),
        ],
    });
}

function loop(data, fontSize = 22) {
  log(data)
    return data.map((item,index) => {
        return new Paragraph({
            children: [
                new TextRun({
                    text: `• ${item}`,
                    size: fontSize,
                }),
            ],
        });
    });
}

// Function to generate a table with given headers and row data
function generateTable(headers, rowData, minWidth = 2000) {
    const columnWidths = new Array(headers.length).fill(minWidth);
    // Generate header row
    console.log(headers[0])
    const headerRow = new TableRow({
        children: headers.map((header, index) =>
            new TableCell({
                children: [new Paragraph({
                    children: [new TextRun({ text: `${header}`, bold: true, size: 12 })],
                })],
                width: { size: columnWidths[index], type: WidthType.DXA },
            })
        ),
    });

    // Generate data rows
    const dataRows = rowData.map(row =>
        new TableRow({
            children: row.map(cell =>
                new TableCell({
                    children: [new Paragraph({
                        children: [new TextRun({ text: `${cell}`, size: 22 })],
                    })],
                    width: { size: minWidth, type: WidthType.AUTO },
                })
            ),
        })
    );

    // Return the table with the header and data rows
    return new Table({
        rows: [headerRow, ...dataRows],
    });
}

function LocalhostWriter(data) {
return {
        sections: [
            {
                properties: {},
                children: [
                    // Document Title
                    headers("Localhost Scan Result", 28, 'center'),
                    newline(),

                    // Generate key-value formatted paragraphs for general sections
                    generateKeyValueParagraph('MAC address', data['MAC address']),
                    generateKeyValueParagraph('Hostname', data['Hostname']),
                    generateKeyValueParagraph('Device Type', data['Device Type']),

                    // Hardware Informations Section
                    headers("Hardware Information", 24, "center"),

                    // Add hardware information
                    generateTable(
                        ['Computer Type', 'CPU Type', 'CPU Available', 'CPU Used (%)', 'RAM Available (GB)', 'RAM Used (GB)', 'Disk Available (GB)', 'Disk Used (GB)'],
                        [
                            [
                                data['Hardware Informations']['Computer Type'],
                                data['Hardware Informations']['CPU Type'],
                                data['Hardware Informations']['CPU Available'],
                                data['Hardware Informations']['CPU Used (%)'],
                                data['Hardware Informations']['RAM Available (GB)'],
                                data['Hardware Informations']['RAM Used (GB)'],
                                data['Hardware Informations']['Disk Available (GB)'],
                                data['Hardware Informations']['Disk Used (GB)']
                            ]
                        ]
                    ),

                    // IP Addresses - formatted as bullet points
                    headers("IP Addresses", 24, "center"),
                    ...loop(data['Hardware Informations']['IP Addresses']),

                    // MAC Addresses - formatted as bullet points
                    headers("MAC Addresses:", 24, "center"),
                    ...loop(data['Hardware Informations']['MAC Addresses']),

                    // Internet Speed Section
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "Internet Speedtest",
                                bold: true,
                                size: 24,
                            }),
                        ],
                        alignment: AlignmentType.CENTER,
                    }),
                    generateKeyValueParagraph('Download Speed', data['Internet speedtest']['Internet Speed']['Download']),
                    generateKeyValueParagraph('Upload Speed', data['Internet speedtest']['Internet Speed']['Upload']),

                    // External vulnerability section (if there are any)
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "External Vulnerability:",
                                bold: true,
                                size: 24,
                            }),
                        ],
                        alignment: AlignmentType.LEFT,
                    }),
                    data['External vulnerability'].length > 0
                        ? new Paragraph({
                            children: [
                                new TextRun({
                                    text: "Vulnerabilities detected...",
                                    size: 22,
                                }),
                            ],
                            alignment: AlignmentType.LEFT,
                        })
                        : new Paragraph({
                            children: [
                                new TextRun({
                                    text: "No external vulnerabilities detected.",
                                    size: 22,
                                }),
                            ],
                            alignment: AlignmentType.LEFT,
                        }),

                    // Add some space at the end of the document
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "\n\n", // Extra space at the bottom
                            }),
                        ],
                    }),
                ],
            },
        ],
    };
}

function ADWriter(data) {
    if (data.length==0) return
    return {
        sections: [
            {
                properties: {},
                children: [
                    // Document Title
                    headers("Acitive Directory Audit", 28, 'center'),
                    newline(),

                    // Generate key-value formatted paragraphs for general sections
                    generateKeyValueParagraph('timestamp', data['timestamp']),
                    headers('Domain Controllers',28,'center'),
                    loop(data['domain_controllers'],fontSize=24),
                    newline(),
                    headers('All Users',28),
                    loop(data["AD Users"],24),
                    newline(),
                    headers('Inactive Accounts',28),
                    loop(data['inactive_accounts']),
                    newline(),
                    headers('All Computers',28),
                    loop(data['Computers'],24),
                    newline(),

                ],
            },
        ],
    };

    
}


