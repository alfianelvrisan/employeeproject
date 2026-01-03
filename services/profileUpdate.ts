export const updateProfile = async (
  userToken: string,
  payload: { nama: string; email: string; alamat: string }
) => {
  const response = await fetch(`https://api.laskarbuah.com/api/Profil`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${userToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to update profile");
  }

  const data = await response.json();
  if (!data?.success) {
    throw new Error(data?.message || "Failed to update profile");
  }
  return data.data ?? null;
};
