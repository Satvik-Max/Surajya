# Intelligent Grievance Redressal System

An AI-inspired, rule-driven grievance management platform that integrates blockchain transparency, Supabase as a backend, and intelligent priority-based escalation.  
The system ensures that citizen issues are processed fairly, efficiently, and with real-time responsiveness.

---

## Features

### 1) Citizen Dashboard
- File new grievances with category, description, location, and optional image evidence.
- Track grievance status, assigned level, escalation history, and blockchain ID.
- View recent activity with grievance priority and escalation flags.

### 2) Priority-Based Escalation
The system uses a **Priority Rules** table (`priority_rules`) to classify grievances:

| Priority Range | Escalation Path                              | Example Issues                                 |
|----------------|----------------------------------------------|------------------------------------------------|
| 9–10           | Direct escalation to **Level 3** (top authorities) | Healthcare emergencies, fire, women safety     |
| 7–8            | Routed to **Level 2** (mid-level officers)       | Flooding, sanitation hazards, water supply     |
| 1–6            | Assigned to **Level 1** (local support staff)    | Housing, education, digital services           |

### 3) Knowledge Base: `priority_rules`
A structured table storing predefined categories, base priority, and related keywords.

**Example entry**
```sql
category: 'Healthcare'
base_priority: 10
keywords: {"hospital","doctor","emergency","accident"}
```

<img width="1307" height="978" alt="Screenshot 2025-08-24 151900" src="https://github.com/user-attachments/assets/35d7fc58-adb5-48eb-b698-56cebaa8aaa8" />



<img width="1919" height="979" alt="Screenshot 2025-08-24 151639" src="https://github.com/user-attachments/assets/843b05b4-66f9-4cbb-96b4-7ad0902fd4fc" />



<img width="1919" height="1032" alt="Screenshot 2025-08-24 151546" src="https://github.com/user-attachments/assets/ccdf7a8d-7019-48f4-89ee-824768732a1a" />



<img width="1740" height="521" alt="Screenshot 2025-08-24 151959" src="https://github.com/user-attachments/assets/415a9113-9dcb-4276-92c5-1ab3ff1014f8" />
