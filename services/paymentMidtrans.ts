export const paymentMidtrans = async (
  id: number,
  userToken: string,
  total: number,
  idMember: string,
  phone: string,
  products: {
    id_produk: string;
    nama_produk: string;
    harga: number;
    qty: number;
  }[],
  description: string,
) => {
  console.log(id, userToken, total, idMember, phone, products, description);
  try {
    const response = await fetch(`https://api.laskarbuah.com/api/SnapApi`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${userToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: id,
        Amount: total,
        CustomerName: idMember,
        Phone: phone,
        Products: products,
        Address:description
      }),
    });

    if (!response.ok) {
      const errorResponse = await response.text();
      throw new Error(errorResponse || "Gagal membuat transaksi Midtrans");
    }

    const result = await response.json();
    return result;
  } catch (error) {
    throw error;
    console.error("Error creating Midtrans transaction:", error);
  }
};
