import { Request, Response } from "express";
import { addressService } from "../service/address.service.ts";
import { logger } from "../config/logger.ts";
import { addAddressSchema, setDefaultAddressSchema } from "../validation/address.validation.ts";

// ----------------- Add Address -----------------
export const addAddress = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new Error("User not authenticated");

    // Validate body
    const { error, value } = addAddressSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ ok: false, details: error.details });
    }

    const newAddress = await addressService.addAddress(userId, value);
    return res.status(201).json({ ok: true, address: newAddress });
  } catch (err: any) {
    logger.error(`addAddressController: ${err.message}`);
    return res.status(500).json({ ok: false, message: err.message });
  }
};

// ----------------- Set Default Address -----------------
export const setDefaultAddress = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new Error("User not authenticated");

    // Validate body
    const { error, value } = setDefaultAddressSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ ok: false, details: error.details });
    }

    const updatedAddress = await addressService.setDefaultAddress(userId, value.addressId);
    return res.json({ ok: true, address: updatedAddress });
  } catch (err: any) {
    logger.error(`setDefaultAddressController: ${err.message}`);
    return res.status(500).json({ ok: false, message: err.message });
  }
};

// ----------------- Delete Address -----------------
export const deleteAddress = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { addressId } = req.params;

    if (!userId) throw new Error("User not authenticated");
    if (!addressId) throw new Error("addressId is required");

    await addressService.deleteAddress(userId, addressId);
    return res.json({ ok: true, message: "Address deleted" });
  } catch (err: any) {
    logger.error(`deleteAddressController: ${err.message}`);
    return res.status(500).json({ ok: false, message: err.message });
  }
};

// ----------------- Delete All Addresses -----------------
export const deleteAllAddresses = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new Error("User not authenticated");

    await addressService.deleteAllAddresses(userId);
    return res.json({ ok: true, message: "All addresses deleted" });
  } catch (err: any) {
    logger.error(`deleteAllAddressesController: ${err.message}`);
    return res.status(500).json({ ok: false, message: err.message });
  }
};
