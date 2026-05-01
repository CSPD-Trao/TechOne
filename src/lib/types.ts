export type Device = {
  id: string;
  assetNumber: string;
  sightedDate: string;
  buildingName: string;
  roomNumber: string;
  personResponsible: string;
  additionalNotes: string;
};

export type StickyLocation = {
  buildingName: string;
  roomNumber: string;
  personResponsible: string;
  additionalNotes: string;
};

export type StoreState = {
  stickyLocation: StickyLocation;
  devices: Device[];
};
