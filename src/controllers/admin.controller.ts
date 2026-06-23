import { Response } from "express";
import { AuthRequest } from "../types/AuthRequest";
import { User } from "../models/User.model";
import { Company } from "../models/Company.model";
import { Analysis } from "../models/Analysis.model";
import { ChecklistInstance } from "../models/ChecklistInstance.model";
import { MaintenanceTicket } from "../models/MaintenanceTicket.model";
import { Ingredient } from "../models/Ingredient.model";
import { sendAlertEmail, sendReminderEmail } from "../services/email.service";

export async function getDashboardHistory(req: AuthRequest, res: Response) {
  try {
    const users = await User.countDocuments();
    const companies = await Company.countDocuments();
    const analyses = await Analysis.countDocuments();
    const checklists = await ChecklistInstance.countDocuments();
    const maintenanceTickets = await MaintenanceTicket.countDocuments();
    const ingredients = await Ingredient.countDocuments();

    const recentAnalyses = await Analysis.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("userId", "name email")
      .lean();

    res.json({
      stats: {
        users,
        companies,
        analyses,
        checklists,
        maintenanceTickets,
        ingredients,
      },
      recentAnalyses,
    });
  } catch (err: any) {
    res.status(500).json({ message: "Error fetching admin data", error: err.message });
  }
}

export async function getAllUsers(req: AuthRequest, res: Response) {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ message: "Error fetching users", error: err.message });
  }
}

export async function triggerAlert(req: AuthRequest, res: Response) {
  const { userId, subject, message } = req.body;

  if (!userId || !subject || !message) {
    res.status(400).json({ message: "userId, subject, and message are required" });
    return;
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    await sendAlertEmail(user.email, subject, message);
    res.json({ message: "Alert sent successfully" });
  } catch (err: any) {
    res.status(500).json({ message: "Error sending alert", error: err.message });
  }
}

export async function sendReminder(req: AuthRequest, res: Response) {
  const { userId, subject, message, ctaLabel, ctaLink } = req.body;

  if (!userId || !subject || !message) {
    res.status(400).json({ message: "userId, subject, and message are required" });
    return;
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    await sendReminderEmail(user.email, subject, message, ctaLabel, ctaLink);
    res.json({ message: "Reminder sent successfully" });
  } catch (err: any) {
    res.status(500).json({ message: "Error sending reminder", error: err.message });
  }
}
