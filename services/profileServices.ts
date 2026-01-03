export const fetchProfile = async (userToken: string) => {
  const response = await fetch(`https://api.laskarbuah.com/api/Profil`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${userToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("unauthorized");
    }
    throw new Error("Profile request failed.");
  }

  const json = await response.json();
  if (json?.success && json?.data) {
    const dataRoot = json.data;
    const data =
      Array.isArray(dataRoot.Table) && dataRoot.Table.length > 0
        ? dataRoot.Table[0]
        : dataRoot;
    const totalPoin = Number(String(data.total_poin ?? data.poin ?? "0").replace(",", "."));
    const totalSavings = Number(
      String(data.total_savings ?? data.saving ?? "0").replace(",", ".")
    );
    return {
      ...data,
      poin: Number.isFinite(totalPoin) ? totalPoin : 0,
      saving: Number.isFinite(totalSavings) ? totalSavings : 0,
      ranking: data.ranking ?? data.rankd,
      target: data.target,
      pencapaian: data.pencapaian,
      greeting: data.greeting,
    };
  }
  return null;
};
export const ListInvoices = async (userToken: string) => {
  const response = await fetch(`https://api.laskarbuah.com/api/Profil`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${userToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    throw new Error("List invoices request failed.");
  }

  const json = await response.json();
  console.log(json);
  if (json?.success && json?.data) {
    return json.data;
  }
  return null;
};


export const updateProfileWithOCR = async (
  userToken: string,
  imageUri: string
) => {
  const formData = new FormData();
  formData.append('file', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'photo.jpg',
  } as any);

  const response = await fetch(`https://api.laskarbuah.com/api/ocr`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${userToken}`,
      "Content-Type": "multipart/form-data",
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error("OCR request failed.");
  }

  const json = await response.json();
  return json;
};
