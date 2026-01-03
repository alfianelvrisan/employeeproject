export const createQris = async (
  salesId: number,
  amount: number,
  productIds: number[],
  description: string,
  expiresInMinutes: number,
  userToken: string
) => {
  const response = await fetch(`https://api.laskarbuah.com/api/Qris/create`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${userToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sales_id: salesId,
      amount,
      id_produk: productIds.map((id) => String(id)),
      desk: description || "-",
      expiry_minutes: expiresInMinutes,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Gagal membuat transaksi QRIS");
  }

  return response.json();
};

export const getQrisStatusByOrderId = async (
  orderId: string,
  userToken: string
) => {
  const response = await fetch(
    `https://api.laskarbuah.com/api/Qris/status/${orderId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${userToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Gagal mengambil status QRIS");
  }

  return response.json();
};
