export const campuses = [
  { name: "Mahikeng Campus", code: "MAH", online: 3, offline: 0, readiness: 92 },
  { name: "Lichtenburg Campus", code: "LIC", online: 3, offline: 0, readiness: 84 },
  { name: "Lehurutshe Campus", code: "LEH", online: 2, offline: 1, readiness: 71 },
  { name: "Central Offices", code: "CTR", online: 2, offline: 1, readiness: 88 },
];
export const dashboardStats = [
  ["Total screens", "12", "Across four locations"], ["Online", "10", "83.3% availability"],
  ["Offline", "2", "Requires attention"], ["Pending approval", "5", "2 due today"],
  ["Scheduled campaigns", "8", "Next 30 days"],
];
export const moduleData: Record<string, { title: string; description: string; columns: string[]; rows: string[][] }> = {
  screens: { title: "Screen Management", description: "Monitor displays, ownership and connectivity across all campuses.", columns: ["Screen", "Campus", "Status", "Last contact"], rows: [["MAH-FOYER-01", "Mahikeng", "Online", "2 min ago"], ["LIC-LIBRARY-02", "Lichtenburg", "Online", "5 min ago"], ["LEH-ADMIN-01", "Lehurutshe", "Offline", "43 min ago"], ["CTR-RECEPTION-03", "Central Offices", "Offline", "1 hr ago"]] },
  content: { title: "Content Library", description: "Manage approved assets through the complete publication lifecycle.", columns: ["Asset", "Type", "Owner", "Workflow"], rows: [["Registration Week", "Video", "Communications", "Pending approval"], ["NSFAS Reminder", "Image", "Mahikeng Campus", "Approved"], ["Exam Timetable", "Document", "Academic Office", "Scheduled"]] },
  playlists: { title: "Playlists", description: "Sequence reusable content for targeted display groups.", columns: ["Playlist", "Items", "Duration", "Updated"], rows: [["Campus Welcome", "7", "04:30", "Today"], ["Student Services", "12", "08:10", "Yesterday"], ["Emergency Loop", "3", "01:00", "12 Jul"]] },
  scheduling: { title: "Scheduling", description: "Plan campaigns by playlist, campus and display group.", columns: ["Campaign", "Audience", "Window", "Status"], rows: [["Registration 2026", "All campuses", "24 Jul – 8 Aug", "Active"], ["Open Day", "Mahikeng", "2 Aug", "Scheduled"], ["Staff Briefing", "Central Offices", "25 Jul", "Scheduled"]] },
  approvals: { title: "Approval Workflow", description: "Review submissions with separation of contributor and approver duties.", columns: ["Submission", "Submitted by", "Campus", "Age"], rows: [["Registration Week", "N. Molefe", "Mahikeng", "2 hours"], ["Bursary Notice", "K. Dube", "Lichtenburg", "1 day"], ["Graduation Photos", "P. Mosiane", "Central Offices", "2 days"]] },
  users: { title: "User Management", description: "Assign enterprise roles and campus-level access boundaries.", columns: ["User", "Role", "Campus", "Status"], rows: [["Cyrus Technical", "Cyrus Technical Administrator", "All", "Active"], ["Taletso Admin", "Taletso Super Administrator", "All", "Active"], ["Campus Manager", "Campus Content Manager", "Mahikeng", "Active"]] },
  audit: { title: "Audit Logs", description: "Immutable operational history for security and governance review.", columns: ["Event", "Actor", "Target", "Time"], rows: [["Content approved", "T. Approver", "NSFAS Reminder", "10:42"], ["Schedule created", "Comms Admin", "Open Day", "09:18"], ["Screen status changed", "Xibo sync", "LEH-ADMIN-01", "08:55"]] },
  readiness: { title: "Site Readiness Register", description: "Track power, network, mounting and player readiness at every site.", columns: ["Campus", "Power", "Network", "Mounting"], rows: [["Mahikeng", "Ready", "Ready", "Ready"], ["Lichtenburg", "Ready", "In progress", "Ready"], ["Lehurutshe", "Ready", "Blocked", "In progress"], ["Central Offices", "Ready", "Ready", "Ready"]] },
  settings: { title: "Settings", description: "Configure organisation, integration and workflow defaults.", columns: ["Configuration", "Value", "Scope", "State"], rows: [["Organisation", "Taletso TVET College", "Global", "Configured"], ["Xibo integration", "Mock adapter", "Server", "Ready"], ["Approval policy", "Four-eye control", "Global", "Enabled"]] },
};
