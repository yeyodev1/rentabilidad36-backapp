import { Response } from "express";
import { Tienda } from "../models/Tienda.model";
import { AuthRequest } from "../types/AuthRequest";

function userOr401(req: AuthRequest, res: Response): string | null {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return null;
  }
  return userId;
}

export async function listTiendas(req: AuthRequest, res: Response) {
  const userId = userOr401(req, res);
  if (!userId) return;
  const tiendas = await Tienda.find({ userId }).sort({ isMain: -1, createdAt: 1 });
  res.json(tiendas);
}

export async function createTienda(req: AuthRequest, res: Response) {
  const userId = userOr401(req, res);
  if (!userId) return;

  const { name, businessType, address, city, manager, phone, status, staff, monthlyClients, notes, isMain, workspaceName } = req.body;

  if (!name || typeof name !== "string") {
    res.status(400).json({ message: "Tienda name is required" });
    return;
  }

  const existing = await Tienda.countDocuments({ userId });
  const shouldBeMain = !!isMain || existing === 0;

  if (shouldBeMain) {
    await Tienda.updateMany({ userId, isMain: true }, { $set: { isMain: false } });
  }

  const tienda = new Tienda({
    userId,
    workspaceName: workspaceName || "",
    name,
    businessType: businessType ?? null,
    address: address ?? "",
    city: city ?? "",
    manager: manager ?? "",
    phone: phone ?? "",
    status: status ?? "opening",
    staff: typeof staff === "number" ? staff : 0,
    monthlyClients: typeof monthlyClients === "number" ? monthlyClients : 0,
    notes: notes ?? "",
    isMain: shouldBeMain,
  });

  await tienda.save();
  res.status(201).json(tienda);
}

export async function updateTienda(req: AuthRequest, res: Response) {
  const userId = userOr401(req, res);
  if (!userId) return;
  const { id } = req.params;

  const tienda = await Tienda.findOne({ _id: id, userId });
  if (!tienda) {
    res.status(404).json({ message: "Tienda not found" });
    return;
  }

  const editable = ["name", "businessType", "address", "city", "manager", "phone", "status", "staff", "monthlyClients", "notes", "workspaceName"] as const;
  for (const key of editable) {
    if (req.body[key] !== undefined) {
      (tienda as any)[key] = req.body[key];
    }
  }

  if (req.body.isMain === true) {
    await Tienda.updateMany({ userId, _id: { $ne: tienda._id } }, { $set: { isMain: false } });
    tienda.isMain = true;
  }

  await tienda.save();
  res.json(tienda);
}

export async function deleteTienda(req: AuthRequest, res: Response) {
  const userId = userOr401(req, res);
  if (!userId) return;
  const { id } = req.params;

  const count = await Tienda.countDocuments({ userId });
  if (count <= 1) {
    res.status(400).json({ message: "Debe quedar al menos una tienda en el workspace" });
    return;
  }

  const tienda = await Tienda.findOneAndDelete({ _id: id, userId });
  if (!tienda) {
    res.status(404).json({ message: "Tienda not found" });
    return;
  }

  if (tienda.isMain) {
    const next = await Tienda.findOne({ userId }).sort({ createdAt: 1 });
    if (next) {
      next.isMain = true;
      await next.save();
    }
  }

  res.json({ message: "Tienda eliminada", id });
}

export async function setMainTienda(req: AuthRequest, res: Response) {
  const userId = userOr401(req, res);
  if (!userId) return;
  const { id } = req.params;

  const tienda = await Tienda.findOne({ _id: id, userId });
  if (!tienda) {
    res.status(404).json({ message: "Tienda not found" });
    return;
  }

  await Tienda.updateMany({ userId }, { $set: { isMain: false } });
  tienda.isMain = true;
  await tienda.save();

  res.json(tienda);
}
