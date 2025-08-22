// escalationService.js
const supabase = require("./supabase");

class EscalationService {
  static async checkAndEscalate() {
    try {
      console.log("🔍 Checking for grievances needing escalation...");

      // Get pending grievances that can be escalated (levels 1-2)
      const { data: grievances, error } = await supabase
        .from("grievances")
        .select("*")
        .eq("status", "pending")
        .lt("assigned_level", 3) // Only levels 1-2 can escalate
        .order("created_at", { ascending: true });

      if (error) throw error;

      let escalatedCount = 0;

      for (const grievance of grievances) {
        if (await this.shouldEscalate(grievance)) {
          await this.escalateGrievance(grievance);
          escalatedCount++;
        }
      }

      console.log(`✅ Escalation check complete. ${escalatedCount} grievances escalated.`);
    } catch (error) {
      console.error("❌ Escalation check failed:", error);
    }
  }

  static async shouldEscalate(grievance) {
    const now = new Date();
    const created = new Date(grievance.created_at);
    const hoursPending = (now - created) / (1000 * 60 * 60);

    // Escalation rules by level
    const escalationRules = {
      1: 1, // Level 1 -> escalate after 1 hour
      2: 1, // Level 2 -> escalate after 1 hour
    };

    return hoursPending >= escalationRules[grievance.assigned_level];
  }

  static async escalateGrievance(grievance) {
    const newLevel = grievance.assigned_level + 1;

    console.log(`⬆️ Escalating grievance #${grievance.id} from level ${grievance.assigned_level} to ${newLevel}`);

    const { error } = await supabase
      .from("grievances")
      .update({
        assigned_level: newLevel,
        last_escalated_at: new Date().toISOString(),
        escalation_count: (grievance.escalation_count || 0) + 1,
      })
      .eq("id", grievance.id);

    if (error) {
      console.error("❌ Failed to escalate grievance:", error);
      throw error;
    }

    console.log(`✅ Successfully escalated grievance #${grievance.id}`);
  }
}

// ✅ Export correctly for require()
module.exports = EscalationService;