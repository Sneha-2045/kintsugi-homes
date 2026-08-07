const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;

export const IMAGES = {
  hero: img("photo-1528360983277-13d401cdc186", 1920),
  machiya: img("photo-1493976040374-85c8e12f0c0e"),
  village: img("photo-1478436127897-769e1b3f0f36"),
  kyoto: img("photo-1554797589-7241bb691973"),
  interiorShoji: img("photo-1503899036084-c55cdd92da26"),
  fusuma: img("photo-1580216643062-cf460548a66a"),
  farmhouse: img("photo-1570459027562-4a916cc6113f"),
  tokyo: img("photo-1540959733332-eab4deabeeaf"),
  fuji: img("photo-1522547902298-51566e4fb383"),
  hokkaido: img("photo-1548189482-6f43e8ca7c4a"),
  okinawa: img("photo-1533050487297-09b450131914"),
  mountains: img("photo-1517701550927-30cf4ba1dba5"),
  garden: img("photo-1524413840807-0c3cb6fa808d"),
  coast: img("photo-1519098901909-b1553a1190af"),
  temple: img("photo-1536098561742-ca998e48cbcc"),
  roof: img("photo-1545569341-9eb8b30979d9"),
  interior: img("photo-1502672260266-1c1ef2d93688"),
  street: img("photo-1480796927426-f609979314bd"),
};
