export const getPendingQris = async (memberId: number, userToken: string) => {
  const response = await fetch(
    `https://api.laskarbuah.com/api/PendingQris?id_member=${memberId}`,
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
    throw new Error(errorText || "Gagal mengambil pending QRIS");
  }

  return response.json();
};
