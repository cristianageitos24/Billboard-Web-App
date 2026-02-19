export type BillboardListItem = {
  id: string;
  name: string | null;
  vendor: string | null;
  address: string | null;
  lat: number;
  lng: number;
  board_type: string;
  traffic_tier: string;
  price_tier: string;
  image_url: string | null;
};
