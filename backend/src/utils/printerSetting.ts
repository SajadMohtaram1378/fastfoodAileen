const escpos = require("escpos");
const Network = require("escpos-network");

// اتصال Network به escpos
escpos.Network = Network;

interface ReceiptOptions {
  type: "kitchen" | "delivery";
  receiptNumber: number;
  items: { name: string; price: number; quantity: number }[];
  totalPrice: number;
  shippingPrice?: number;
  address?: string;
  userName?: string;
  printerIp: string; 
}

export const printReceipt = async (options: ReceiptOptions) => {
  const { type, receiptNumber, items, totalPrice, shippingPrice, address, userName, printerIp } = options;

  const lines: string[] = [];
  lines.push(`--- ${type.toUpperCase()} RECEIPT ---`);
  lines.push(`Receipt #: ${receiptNumber}`);
  if (userName) lines.push(`Customer: ${userName}`);
  if (address) lines.push(`Address: ${address}`);
  lines.push(`Items:`);
  items.forEach((item) => {
    lines.push(`${item.name} x${item.quantity} - ${item.price} T`);
  });
  if (shippingPrice) lines.push(`Shipping: ${shippingPrice} T`);
  lines.push(`Total: ${totalPrice} T`);
  lines.push(`-------------------------\n`);

  // ذخیره در آرشیو
  const fs = require("fs");
  const path = require("path");
  const dir = path.join(process.cwd(), "receipts", type);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${type}_${receiptNumber}.txt`);
  fs.writeFileSync(filePath, lines.join("\n"));
  console.log(`${type} receipt saved: ${filePath}`);

  // چاپ مستقیم از طریق شبکه
  try {
    const device = new Network(printerIp);
    const printer = new escpos.Printer(device);
    device.open(() => {
      printer
        .align("ct")
        .text(`${type.toUpperCase()} RECEIPT`)
        .text(`Receipt #: ${receiptNumber}`)
        .text(userName ? `Customer: ${userName}` : "")
        .text(address ? `Address: ${address}` : "")
        .text("------------------------")
        .table(items.map((i) => [i.name, `${i.quantity}`, `${i.price} T`]))
        .text(shippingPrice ? `Shipping: ${shippingPrice} T` : "")
        .text(`Total: ${totalPrice} T`)
        .text("------------------------")
        .cut()
        .close();
    });
  } catch (err) {
    console.error("Error printing receipt:", err);
  }
};
