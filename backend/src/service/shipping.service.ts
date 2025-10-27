// services/shipping.service.ts
import axios from "axios";

interface Point {
  lat: number;
  lng: number;
}

interface SnappPriceResponse {
  data: {
    data: {
      prices: {
        final: number;
        type: string;
        is_enabled: boolean;
      }[];
    };
  };
}

// گرفتن هزینه ارسال از Snapp
export async function calculateShippingPrice(
  from: Point,
  to: Point
): Promise<number> {
  const token = process.env.SNAPP_TOKEN;
  if (!token) throw new Error("SNAPP_TOKEN is not defined");

  const payload = {
    points: [from, to],
    service_types: [5, 6], // Delivery, Eat
  };

  const res = await axios.post<SnappPriceResponse>(
    "https://corporate.snapp.site/api/v3/ride/price",
    payload,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
    }
  );

  const price = res.data.data.data.prices.find((p) => p.is_enabled)?.final;
  if (!price) throw new Error("No active delivery service found");

  return price;
}
