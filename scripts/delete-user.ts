import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const DB_URI = process.env.DB_URI;
if (!DB_URI) {
  console.error("❌ DB_URI not set in .env");
  process.exit(1);
}

async function run() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    console.error("❌ Usage: pnpm delete-user <email>");
    process.exit(1);
  }

  await mongoose.connect(DB_URI!);
  console.log(`🔍 Looking up user: ${email}`);

  // Dynamic import — models must be loaded after connection
  const User = (await import("../src/models/User.model")).User;
  const Company = (await import("../src/models/Company.model")).Company;
  const Branch = (await import("../src/models/Branch.model")).Branch;
  const BranchHours = (await import("../src/models/BranchHours.model")).BranchHours;
  const Equipment = (await import("../src/models/Equipment.model")).Equipment;
  const MaintenanceTicket = (await import("../src/models/MaintenanceTicket.model")).MaintenanceTicket;
  const SalesRecord = (await import("../src/models/SalesRecord.model")).SalesRecord;
  const SanitaryLog = (await import("../src/models/SanitaryLog.model")).SanitaryLog;
  const StaffShift = (await import("../src/models/StaffShift.model")).StaffShift;
  const AlertConfig = (await import("../src/models/AlertConfig.model")).AlertConfig;
  const ChecklistTemplate = (await import("../src/models/ChecklistTemplate.model")).ChecklistTemplate;
  const ChecklistInstance = (await import("../src/models/ChecklistInstance.model")).ChecklistInstance;
  const FixedCost = (await import("../src/models/FixedCost.model")).FixedCost;
  const Ingredient = (await import("../src/models/Ingredient.model")).Ingredient;
  const Recipe = (await import("../src/models/Recipe.model")).Recipe;
  const POSConnection = (await import("../src/models/POSConnection.model")).POSConnection;
  const OnboardingProgress = (await import("../src/models/OnboardingProgress.model")).OnboardingProgress;
  const Tienda = (await import("../src/models/Tienda.model")).Tienda;
  const Analysis = (await import("../src/models/Analysis.model")).Analysis;

  const user = await User.findOne({ email });
  if (!user) {
    console.log(`❌ No user found with email: ${email}`);
    await mongoose.disconnect();
    process.exit(1);
  }

  const userId = user._id.toString();
  const workspaceIds = (user as any).workspaceIds || [];
  console.log(`✅ Found user: ${user.name || email} (${userId})`);
  console.log(`   Companies: ${workspaceIds.length}\n`);

  const deleted: string[] = [];
  let companyId: string | null = null;

  // 1. Find Company
  const company = await Company.findOne({ userId });
  if (company) {
    companyId = company._id.toString();
    console.log(`🏢 Company found: ${company.name || companyId}`);

    const branches = await Branch.find({ companyId });
    const branchIds = branches.map((b: any) => b._id.toString());

    // 2. Delete Branch-level data
    if (branchIds.length > 0) {
      const bh = await BranchHours.deleteMany({ branchId: { $in: branchIds } });
      if (bh.deletedCount) { deleted.push(`BranchHours (${bh.deletedCount})`); console.log(`   🗑 BranchHours: ${bh.deletedCount}`); }

      const eq = await Equipment.deleteMany({ branchId: { $in: branchIds } });
      if (eq.deletedCount) { deleted.push(`Equipment (${eq.deletedCount})`); console.log(`   🗑 Equipment: ${eq.deletedCount}`); }

      const sr = await SalesRecord.deleteMany({ branchId: { $in: branchIds } });
      if (sr.deletedCount) { deleted.push(`SalesRecord (${sr.deletedCount})`); console.log(`   🗑 SalesRecord: ${sr.deletedCount}`); }

      const sl = await SanitaryLog.deleteMany({ branchId: { $in: branchIds } });
      if (sl.deletedCount) { deleted.push(`SanitaryLog (${sl.deletedCount})`); console.log(`   🗑 SanitaryLog: ${sl.deletedCount}`); }

      const ss = await StaffShift.deleteMany({ branchId: { $in: branchIds } });
      if (ss.deletedCount) { deleted.push(`StaffShift (${ss.deletedCount})`); console.log(`   🗑 StaffShift: ${ss.deletedCount}`); }
    }

    // 3. Delete Equipment-level data (MaintenanceTickets)
    const eqList = await Equipment.find({ branchId: { $in: branchIds } });
    const eqIds = eqList.map((e: any) => e._id.toString());
    if (eqIds.length > 0) {
      const mt = await MaintenanceTicket.deleteMany({ equipmentId: { $in: eqIds } });
      if (mt.deletedCount) { deleted.push(`MaintenanceTicket (${mt.deletedCount})`); console.log(`   🗑 MaintenanceTicket: ${mt.deletedCount}`); }
    }

    // Also delete MaintenanceTickets reported by this user
    const mtUser = await MaintenanceTicket.deleteMany({ reportedBy: userId });
    if (mtUser.deletedCount) {
      deleted.push(`MaintenanceTicket.reportedBy (${mtUser.deletedCount})`);
      console.log(`   🗑 MaintenanceTicket (reportedBy): ${mtUser.deletedCount}`);
    }

    // 4. Delete Company-level data
    const ac = await AlertConfig.deleteMany({ companyId });
    if (ac.deletedCount) { deleted.push(`AlertConfig (${ac.deletedCount})`); console.log(`   🗑 AlertConfig: ${ac.deletedCount}`); }

    const ct = await ChecklistTemplate.deleteMany({ companyId });
    if (ct.deletedCount) { deleted.push(`ChecklistTemplate (${ct.deletedCount})`); console.log(`   🗑 ChecklistTemplate: ${ct.deletedCount}`); }

    const fc = await FixedCost.deleteMany({ companyId });
    if (fc.deletedCount) { deleted.push(`FixedCost (${fc.deletedCount})`); console.log(`   🗑 FixedCost: ${fc.deletedCount}`); }

    const ig = await Ingredient.deleteMany({ companyId });
    if (ig.deletedCount) { deleted.push(`Ingredient (${ig.deletedCount})`); console.log(`   🗑 Ingredient: ${ig.deletedCount}`); }

    const rc = await Recipe.deleteMany({ companyId });
    if (rc.deletedCount) { deleted.push(`Recipe (${rc.deletedCount})`); console.log(`   🗑 Recipe: ${rc.deletedCount}`); }

    const pc = await POSConnection.deleteMany({ companyId });
    if (pc.deletedCount) { deleted.push(`POSConnection (${pc.deletedCount})`); console.log(`   🗑 POSConnection: ${pc.deletedCount}`); }

    const ci = await ChecklistInstance.deleteMany({ companyId });
    if (ci.deletedCount) { deleted.push(`ChecklistInstance (${ci.deletedCount})`); console.log(`   🗑 ChecklistInstance: ${ci.deletedCount}`); }

    // 5. Delete ChecklistInstances referencing this user
    const ciOp = await ChecklistInstance.deleteMany({ operatorId: userId });
    if (ciOp.deletedCount) { deleted.push(`ChecklistInstance.operator (${ciOp.deletedCount})`); console.log(`   🗑 ChecklistInstance (operator): ${ciOp.deletedCount}`); }
    const ciRv = await ChecklistInstance.deleteMany({ reviewerId: userId });
    if (ciRv.deletedCount) { deleted.push(`ChecklistInstance.reviewer (${ciRv.deletedCount})`); console.log(`   🗑 ChecklistInstance (reviewer): ${ciRv.deletedCount}`); }

    // 6. Delete branches
    const br = await Branch.deleteMany({ companyId });
    if (br.deletedCount) { deleted.push(`Branch (${br.deletedCount})`); console.log(`   🗑 Branch: ${br.deletedCount}`); }

    // 7. Delete Company
    await Company.findByIdAndDelete(companyId);
    deleted.push("Company");
    console.log("   🗑 Company: 1");
  }

  // 8. Delete User-level data (string-referenced)
  const op = await OnboardingProgress.deleteMany({ userId });
  if (op.deletedCount) { deleted.push(`OnboardingProgress (${op.deletedCount})`); console.log(`   🗑 OnboardingProgress: ${op.deletedCount}`); }

  const td = await Tienda.deleteMany({ userId });
  if (td.deletedCount) { deleted.push(`Tienda (${td.deletedCount})`); console.log(`   🗑 Tienda: ${td.deletedCount}`); }

  const an = await Analysis.deleteMany({ userId });
  if (an.deletedCount) { deleted.push(`Analysis (${an.deletedCount})`); console.log(`   🗑 Analysis: ${an.deletedCount}`); }

  // 9. Finally delete User
  await User.findByIdAndDelete(userId);
  deleted.push("User");
  console.log("   🗑 User: 1\n");
  console.log("✅ Done! Deleted:");
  deleted.forEach((d) => console.log(`   • ${d}`));
  console.log(`\n📧 ${email} and all related data have been removed.`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Error:", err);
  mongoose.disconnect().catch(() => {});
  process.exit(1);
});
