export const createTopupSavings = async (
  memberId: number,
  amount: number,
  expiryMinutes: number,
  userToken: string
) => {
  const response = await fetch(
    "https://api.laskarbuah.com/api/topup-savings/create",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${userToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        member_id: memberId,
        amount,
        expiry_minutes: expiryMinutes,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Gagal membuat top up savings");
  }

  return response.json();
};

export const getTopupSavingsStatus = async (
  orderId: string,
  userToken: string
) => {
  const response = await fetch(
    `https://api.laskarbuah.com/api/topup-savings/status/${orderId}`,
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
    console.error("[topup] status http error", {
      status: response.status,
      body: errorText,
    });
    throw new Error(errorText || "Gagal mengambil status top up");
  }

  return response.json();
};

export const getTopupSavingsByMember = async (
  memberId: number,
  userToken: string
) => {
  const response = await fetch(
    `https://api.laskarbuah.com/api/topup-savings/by-member/${memberId}`,
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
    throw new Error(errorText || "Gagal mengambil riwayat top up");
  }

  return response.json();
};
