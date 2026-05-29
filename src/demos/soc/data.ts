/**
 * Mock data + types for the SOC (Security Operations Center) Analyst Console demo.
 *
 * All "age" / relative-time strings are hard-coded (not computed from the clock) so
 * the demo renders deterministically and never drifts during a session.
 */

import type { TagIntent } from "@/components/ui/tag";
import type { IconName } from "@/components/ui/icon";

// ── Enums / unions ───────────────────────────────────────────────────────────

export type Severity = "critical" | "high" | "medium" | "low";
export type AlertStatus = "new" | "in-progress" | "resolved";
export type Detector = "EDR" | "SIEM" | "Firewall" | "Email Gateway" | "IDS" | "Cloud";
export type IocType = "ip" | "domain" | "hash" | "url" | "email" | "user";

export interface TimelineEvent {
    /** Short label for the event. */
    label: string;
    /** Hard-coded timestamp string. */
    timestamp: string;
    /** Icon name (Blueprint icon set). */
    icon: IconName;
    /** Optional detail line. */
    detail?: string;
}

export interface Ioc {
    type: IocType;
    value: string;
}

export interface Alert {
    id: string;
    title: string;
    severity: Severity;
    status: AlertStatus;
    detector: Detector;
    /** Specific rule / signature name that fired. */
    source: string;
    /** Affected host or user (the primary entity). */
    asset: string;
    /** Whether the asset is a host or a user (drives the icon). */
    assetKind: "host" | "user";
    /** Analyst the alert is assigned to ("Unassigned" when none). */
    assignee: string;
    /** MITRE ATT&CK technique id. */
    mitre: string;
    /** Human-readable MITRE technique name. */
    mitreName: string;
    sourceIp: string;
    /** Hard-coded "first seen" timestamp. */
    firstSeen: string;
    /** Hard-coded relative age string, e.g. "4m ago". */
    age: string;
    description: string;
    timeline: TimelineEvent[];
    iocs: Ioc[];
}

// ── Constants / option lists ─────────────────────────────────────────────────

export const ANALYSTS = [
    "Unassigned",
    "Maya Okonkwo",
    "Dev Patel",
    "Lena Schmidt",
    "Tomás Rivera",
] as const;

export const STATUS_OPTIONS: { label: string; value: AlertStatus | "all" }[] = [
    { label: "All", value: "all" },
    { label: "New", value: "new" },
    { label: "In Progress", value: "in-progress" },
    { label: "Resolved", value: "resolved" },
];

export const SEVERITY_OPTIONS: (Severity | "all")[] = ["all", "critical", "high", "medium", "low"];

// ── Mapping helpers ──────────────────────────────────────────────────────────

/** Severity → Tag intent. critical=danger, high=warning, medium=primary, low=success. */
export const SEVERITY_INTENT: Record<Severity, TagIntent> = {
    critical: "danger",
    high: "warning",
    medium: "primary",
    low: "success",
};

export const SEVERITY_LABEL: Record<Severity, string> = {
    critical: "Critical",
    high: "High",
    medium: "Medium",
    low: "Low",
};

/** Status → Tag intent + label. */
export const STATUS_META: Record<AlertStatus, { label: string; intent: TagIntent }> = {
    new: { label: "New", intent: "primary" },
    "in-progress": { label: "In Progress", intent: "warning" },
    resolved: { label: "Resolved", intent: "success" },
};

export const DETECTOR_ICON: Record<Detector, IconName> = {
    EDR: "desktop",
    SIEM: "console",
    Firewall: "shield",
    "Email Gateway": "envelope",
    IDS: "antenna",
    Cloud: "cloud",
};

export const IOC_ICON: Record<IocType, IconName> = {
    ip: "ip-address",
    domain: "globe",
    hash: "key",
    url: "link",
    email: "envelope",
    user: "person",
};

export const IOC_LABEL: Record<IocType, string> = {
    ip: "IP",
    domain: "Domain",
    hash: "Hash",
    url: "URL",
    email: "Email",
    user: "User",
};

// ── Mock alerts ──────────────────────────────────────────────────────────────

export const ALERTS: Alert[] = [
    {
        id: "ALRT-4821",
        title: "Suspicious PowerShell encoded command",
        severity: "critical",
        status: "new",
        detector: "EDR",
        source: "EDR / Behavioral — Encoded command line",
        asset: "WS-FINANCE-07",
        assetKind: "host",
        assignee: "Unassigned",
        mitre: "T1059.001",
        mitreName: "Command and Scripting Interpreter: PowerShell",
        sourceIp: "10.4.22.118",
        firstSeen: "2024-06-12 14:02:41 UTC",
        age: "4m ago",
        description:
            "powershell.exe spawned by winword.exe with a base64-encoded command that downloads and executes a second-stage payload. Parent-child chain and obfuscation strongly indicate a malicious macro.",
        timeline: [
            { label: "Detection", timestamp: "14:02:41", icon: "pulse", detail: "Behavioral rule matched encoded command line" },
            { label: "Process tree captured", timestamp: "14:02:43", icon: "graph", detail: "winword.exe → powershell.exe → curl.exe" },
            { label: "Enrichment", timestamp: "14:03:10", icon: "search", detail: "Hash reputation: known dropper family" },
            { label: "Correlation", timestamp: "14:04:55", icon: "link", detail: "Linked to outbound C2 beacon ALRT-4824" },
        ],
        iocs: [
            { type: "hash", value: "5f3a9c2e7b1d44f08a6e9c1b2d3e4f50" },
            { type: "ip", value: "185.220.101.42" },
            { type: "domain", value: "cdn-update-sync.net" },
        ],
    },
    {
        id: "ALRT-4822",
        title: "Impossible travel sign-in",
        severity: "high",
        status: "in-progress",
        detector: "Cloud",
        source: "Cloud / Identity — Impossible travel",
        asset: "j.okafor@acme.io",
        assetKind: "user",
        assignee: "Maya Okonkwo",
        mitre: "T1078.004",
        mitreName: "Valid Accounts: Cloud Accounts",
        sourceIp: "45.83.91.7",
        firstSeen: "2024-06-12 13:48:09 UTC",
        age: "18m ago",
        description:
            "Successful interactive sign-in from Lagos, NG followed 22 minutes later by a sign-in from Berlin, DE — a physically impossible transit time. Both sessions used the same valid credentials with no MFA challenge on the second.",
        timeline: [
            { label: "Sign-in A", timestamp: "13:26:01", icon: "log-in", detail: "Lagos, NG — 197.210.x.x" },
            { label: "Sign-in B", timestamp: "13:48:09", icon: "log-in", detail: "Berlin, DE — 45.83.91.7" },
            { label: "Detection", timestamp: "13:48:30", icon: "pulse", detail: "Velocity exceeds 900 km/h threshold" },
            { label: "Triage", timestamp: "13:55:12", icon: "person", detail: "Assigned to Maya Okonkwo" },
        ],
        iocs: [
            { type: "user", value: "j.okafor@acme.io" },
            { type: "ip", value: "45.83.91.7" },
            { type: "ip", value: "197.210.64.12" },
        ],
    },
    {
        id: "ALRT-4823",
        title: "Malware detected: Emotet dropper",
        severity: "critical",
        status: "new",
        detector: "EDR",
        source: "EDR / Signature — Emotet.Gen.3",
        asset: "WS-HR-14",
        assetKind: "host",
        assignee: "Unassigned",
        mitre: "T1566.001",
        mitreName: "Phishing: Spearphishing Attachment",
        sourceIp: "10.7.5.91",
        firstSeen: "2024-06-12 13:31:55 UTC",
        age: "35m ago",
        description:
            "On-write scan quarantined an Emotet dropper delivered via a malicious .docm attachment. The file attempted to write to the Startup folder for persistence before being blocked.",
        timeline: [
            { label: "File written", timestamp: "13:31:50", icon: "document", detail: "invoice_06.docm in Downloads" },
            { label: "Detection", timestamp: "13:31:55", icon: "pulse", detail: "Signature Emotet.Gen.3 matched" },
            { label: "Quarantine", timestamp: "13:31:56", icon: "shield", detail: "File quarantined automatically" },
        ],
        iocs: [
            { type: "hash", value: "a1b2c3d4e5f60718293a4b5c6d7e8f90" },
            { type: "email", value: "billing@invoice-portal.co" },
        ],
    },
    {
        id: "ALRT-4824",
        title: "Data exfiltration to known C2",
        severity: "critical",
        status: "in-progress",
        detector: "Firewall",
        source: "Firewall / Threat-intel — Outbound to C2",
        asset: "WS-FINANCE-07",
        assetKind: "host",
        assignee: "Dev Patel",
        mitre: "T1041",
        mitreName: "Exfiltration Over C2 Channel",
        sourceIp: "10.4.22.118",
        firstSeen: "2024-06-12 13:18:30 UTC",
        age: "48m ago",
        description:
            "Sustained outbound HTTPS to an IP on the threat-intel C2 blocklist, transferring 412 MB over 30 minutes in regular beacon intervals. Source host matches the PowerShell detection ALRT-4821.",
        timeline: [
            { label: "First beacon", timestamp: "13:18:30", icon: "pulse", detail: "443/tcp to 185.220.101.42" },
            { label: "Volume threshold", timestamp: "13:41:02", icon: "graph", detail: "Cumulative upload 412 MB" },
            { label: "Block applied", timestamp: "13:44:17", icon: "ban-circle", detail: "Egress rule blocks destination" },
            { label: "Correlation", timestamp: "13:46:00", icon: "link", detail: "Linked to ALRT-4821 on same host" },
        ],
        iocs: [
            { type: "ip", value: "185.220.101.42" },
            { type: "domain", value: "cdn-update-sync.net" },
            { type: "url", value: "https://cdn-update-sync.net/api/v2/sync" },
        ],
    },
    {
        id: "ALRT-4825",
        title: "Privilege escalation on DC01",
        severity: "high",
        status: "new",
        detector: "SIEM",
        source: "SIEM / Correlation — Sensitive group change",
        asset: "DC01",
        assetKind: "host",
        assignee: "Unassigned",
        mitre: "T1098",
        mitreName: "Account Manipulation",
        sourceIp: "10.0.0.10",
        firstSeen: "2024-06-12 12:59:14 UTC",
        age: "1h ago",
        description:
            "A non-administrative service account was added to Domain Admins on the primary domain controller outside of a change window. No corresponding ticket found in the change-management system.",
        timeline: [
            { label: "Group change", timestamp: "12:59:14", icon: "people", detail: "svc-backup added to Domain Admins" },
            { label: "Detection", timestamp: "12:59:40", icon: "pulse", detail: "Correlation rule: sensitive group change" },
            { label: "Enrichment", timestamp: "13:01:05", icon: "search", detail: "No matching change ticket" },
        ],
        iocs: [
            { type: "user", value: "svc-backup" },
            { type: "ip", value: "10.0.0.10" },
        ],
    },
    {
        id: "ALRT-4826",
        title: "Brute-force against SSH",
        severity: "medium",
        status: "in-progress",
        detector: "IDS",
        source: "IDS / Threshold — SSH auth failures",
        asset: "APP-EDGE-02",
        assetKind: "host",
        assignee: "Tomás Rivera",
        mitre: "T1110.001",
        mitreName: "Brute Force: Password Guessing",
        sourceIp: "193.42.18.205",
        firstSeen: "2024-06-12 12:40:00 UTC",
        age: "1h ago",
        description:
            "Over 2,400 failed SSH authentication attempts in 10 minutes from a single source against the edge application server. No successful login observed; rate suggests an automated credential-stuffing tool.",
        timeline: [
            { label: "Burst start", timestamp: "12:40:00", icon: "pulse", detail: "Failure rate spike from 193.42.18.205" },
            { label: "Threshold hit", timestamp: "12:50:11", icon: "graph", detail: "2,400 failures / 10 min" },
            { label: "Mitigation", timestamp: "12:52:30", icon: "ban-circle", detail: "Source IP rate-limited at edge" },
        ],
        iocs: [
            { type: "ip", value: "193.42.18.205" },
            { type: "user", value: "root" },
        ],
    },
    {
        id: "ALRT-4827",
        title: "Phishing email reported by user",
        severity: "low",
        status: "resolved",
        detector: "Email Gateway",
        source: "Email Gateway / User-reported phish",
        asset: "k.tanaka@acme.io",
        assetKind: "user",
        assignee: "Lena Schmidt",
        mitre: "T1566.002",
        mitreName: "Phishing: Spearphishing Link",
        sourceIp: "203.0.113.55",
        firstSeen: "2024-06-12 11:22:47 UTC",
        age: "3h ago",
        description:
            "A user reported a credential-harvesting email impersonating the IT helpdesk. The embedded link pointed to a look-alike SSO page. The message and sender were blocked tenant-wide and no clicks were recorded.",
        timeline: [
            { label: "User report", timestamp: "11:22:47", icon: "flag", detail: "Reported via Report Phish button" },
            { label: "Analysis", timestamp: "11:35:00", icon: "search", detail: "Look-alike SSO landing page" },
            { label: "Containment", timestamp: "11:48:20", icon: "shield", detail: "Sender + URL blocked tenant-wide" },
            { label: "Resolved", timestamp: "12:05:00", icon: "tick-circle", detail: "No clicks recorded; closed" },
        ],
        iocs: [
            { type: "url", value: "https://acme-sso-login.help/auth" },
            { type: "email", value: "it-helpdesk@acme-support.help" },
            { type: "domain", value: "acme-sso-login.help" },
        ],
    },
    {
        id: "ALRT-4828",
        title: "Anomalous OAuth grant",
        severity: "high",
        status: "new",
        detector: "Cloud",
        source: "Cloud / Identity — Risky OAuth consent",
        asset: "f.dubois@acme.io",
        assetKind: "user",
        assignee: "Unassigned",
        mitre: "T1528",
        mitreName: "Steal Application Access Token",
        sourceIp: "104.28.7.19",
        firstSeen: "2024-06-12 12:11:33 UTC",
        age: "2h ago",
        description:
            "A user granted offline-access and full mailbox read scopes to an unverified third-party application. The publisher is unknown and the app was registered 3 days ago — consistent with consent-phishing.",
        timeline: [
            { label: "Consent granted", timestamp: "12:11:33", icon: "key", detail: "App 'DocSync Pro' granted Mail.Read" },
            { label: "Detection", timestamp: "12:12:00", icon: "pulse", detail: "Unverified publisher, broad scopes" },
        ],
        iocs: [
            { type: "user", value: "f.dubois@acme.io" },
            { type: "domain", value: "docsync-pro.app" },
        ],
    },
    {
        id: "ALRT-4829",
        title: "Ransomware canary triggered",
        severity: "critical",
        status: "new",
        detector: "EDR",
        source: "EDR / Canary — Honeyfile modified",
        asset: "FS-SHARE-01",
        assetKind: "host",
        assignee: "Unassigned",
        mitre: "T1486",
        mitreName: "Data Encrypted for Impact",
        sourceIp: "10.9.1.40",
        firstSeen: "2024-06-12 14:01:02 UTC",
        age: "5m ago",
        description:
            "A deployed canary (honeyfile) on the primary file share was renamed and modified by an unknown process, a strong early indicator of ransomware encryption activity in progress.",
        timeline: [
            { label: "Canary modified", timestamp: "14:01:02", icon: "high-priority", detail: "finance_q3.xlsx.locked" },
            { label: "Detection", timestamp: "14:01:03", icon: "pulse", detail: "Honeyfile integrity violation" },
            { label: "Host isolation", timestamp: "14:01:20", icon: "offline", detail: "FS-SHARE-01 network-isolated" },
        ],
        iocs: [
            { type: "hash", value: "deadbeef0011223344556677889900aa" },
            { type: "ip", value: "10.9.1.40" },
        ],
    },
    {
        id: "ALRT-4830",
        title: "DNS tunneling detected",
        severity: "medium",
        status: "new",
        detector: "IDS",
        source: "IDS / Analytics — High-entropy DNS",
        asset: "WS-ENG-22",
        assetKind: "host",
        assignee: "Unassigned",
        mitre: "T1071.004",
        mitreName: "Application Layer Protocol: DNS",
        sourceIp: "10.6.14.88",
        firstSeen: "2024-06-12 13:05:19 UTC",
        age: "2h ago",
        description:
            "Unusually long, high-entropy TXT-record DNS queries to a single domain at a steady cadence — a signature of data being tunneled over DNS to bypass egress filtering.",
        timeline: [
            { label: "Pattern start", timestamp: "13:05:19", icon: "pulse", detail: "High-entropy TXT queries" },
            { label: "Detection", timestamp: "13:20:44", icon: "graph", detail: "Entropy + cadence threshold met" },
        ],
        iocs: [
            { type: "domain", value: "x7f2a.tunnel-dns.io" },
            { type: "ip", value: "10.6.14.88" },
        ],
    },
    {
        id: "ALRT-4831",
        title: "New admin account created",
        severity: "high",
        status: "in-progress",
        detector: "SIEM",
        source: "SIEM / Audit — Local admin created",
        asset: "WS-IT-03",
        assetKind: "host",
        assignee: "Dev Patel",
        mitre: "T1136.001",
        mitreName: "Create Account: Local Account",
        sourceIp: "10.2.3.17",
        firstSeen: "2024-06-12 12:33:08 UTC",
        age: "1h ago",
        description:
            "A new local administrator account was created on an IT workstation by a process running under a standard user, then immediately added to the Administrators group. No service-desk record exists for this action.",
        timeline: [
            { label: "Account created", timestamp: "12:33:08", icon: "person", detail: "Local user 'helpdesk_adm'" },
            { label: "Privilege add", timestamp: "12:33:11", icon: "people", detail: "Added to Administrators" },
            { label: "Detection", timestamp: "12:33:40", icon: "pulse", detail: "Audit correlation rule fired" },
        ],
        iocs: [
            { type: "user", value: "helpdesk_adm" },
            { type: "ip", value: "10.2.3.17" },
        ],
    },
    {
        id: "ALRT-4832",
        title: "Disabled EDR agent",
        severity: "high",
        status: "new",
        detector: "EDR",
        source: "EDR / Tamper — Agent service stopped",
        asset: "WS-SALES-11",
        assetKind: "host",
        assignee: "Unassigned",
        mitre: "T1562.001",
        mitreName: "Impair Defenses: Disable or Modify Tools",
        sourceIp: "10.3.8.62",
        firstSeen: "2024-06-12 13:52:10 UTC",
        age: "14m ago",
        description:
            "The EDR sensor service on a sales workstation was stopped and its auto-start disabled via an elevated command, leaving the endpoint without real-time protection. Tamper-protection logged the action before going dark.",
        timeline: [
            { label: "Service stopped", timestamp: "13:52:10", icon: "disable", detail: "sc stop sense via cmd.exe" },
            { label: "Detection", timestamp: "13:52:12", icon: "pulse", detail: "Tamper-protection event" },
            { label: "Last heartbeat", timestamp: "13:52:15", icon: "offline", detail: "Sensor offline since" },
        ],
        iocs: [
            { type: "ip", value: "10.3.8.62" },
            { type: "user", value: "WS-SALES-11\\local_admin" },
        ],
    },
];
