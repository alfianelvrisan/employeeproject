export const scanKtp = async (imageUri: string): Promise<string[] | null> => {
  try {
    const formData = new FormData();

    formData.append("ktpImage", {
      uri: imageUri,
      name: "ktp.jpg",
      type: "image/jpeg",
    } as any);

    const response = await fetch("https://api.laskarbuah.com/api/ocrscan/scan", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (Array.isArray(data)) {
      return data;
    }

    if (data.ktpInfo) return data.ktpInfo;
    if (data.data) return data.data;
    if (data.message) return [data.message];

    return null;
  } catch (error) {
    console.error("❌ Error scanning KTP:", error);
    return null;
  }
};
