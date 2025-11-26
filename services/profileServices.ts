export const fetchProfile = async (userToken: string) => {
  try {
    const response = await fetch(`https://api.laskarbuah.com/api/profil?v_token=${userToken}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${userToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
    }

    const json = await response.json();
    if (Array.isArray(json) && json.length > 0) {
      return json[0];
    } else {
    }
  } catch (error) {
    if (error instanceof Error) {
    } else {
    }
  }
};
export const ListInvoices = async (userToken: string) => {
  try {
    const response = await fetch(`https://api.laskarbuah.com/api/profil?v_token=${userToken}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${userToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
    }

    const json = await response.json();
    console.log(json)
    if (Array.isArray(json) && json.length > 0) {
      return json[0];
    } else {
    }
  } catch (error) {
    if (error instanceof Error) {
    } else {
    }
  }
};


export const updateProfileWithOCR = async (userToken: string, imageUri: string) => {
  const formData = new FormData();
  formData.append('file', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'photo.jpg',
  } as any);

  try {
    const response = await fetch(`https://api.laskarbuah.com/api/ocr`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${userToken}`,
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
    }

    const json = await response.json();
    return json;
  } catch (error) {
    if (error instanceof Error) {
    } else {
    }
  }
}