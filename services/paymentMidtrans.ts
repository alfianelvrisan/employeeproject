export const paymentMidtrans = async (
  id: number,
  userToken: string,
  total: number,
  customerName: string,
  phone: string,
  products: {
    id_produk: string;
    nama_produk: string;
    harga: number;
    qty: number;
  }[],
  description: string
) => {
  const sanitizedProducts = products.map((item) => ({
    id_produk: String(item.id_produk),
    nama_produk: item.nama_produk,
    harga: Number(item.harga) || 0,
    qty: Number(item.qty) || 0,
  }));
  const derivedTotal = sanitizedProducts.reduce(
    (sum, item) => sum + item.harga * item.qty,
    0
  );
  const amount = derivedTotal > 0 ? derivedTotal : total;

  try {
    const response = await fetch(`https://api.laskarbuah.com/api/SnapApi`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${userToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: id,
        Amount: amount,
        CustomerName: customerName,
        Phone: phone,
        Products: sanitizedProducts,
        Address: description || "-",
      }),
    });

    if (!response.ok) {
      const errorResponse = await response.text();
      throw new Error(errorResponse || "Gagal membuat transaksi Midtrans");
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error creating Midtrans transaction:", error);
    throw error;
  }
};
