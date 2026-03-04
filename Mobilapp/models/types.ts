export type Station = {
  lsname: string;
  settlement_id: number;
  ls_id: number;
  site_code?: number;
};

export type JourneySegment = {
  RunId: number;
  DepartureStation: number;
  ArrivalStation: number;
  DepStationName?: string;
  ArrStationName?: string;
  DepartureTime?: number;
  ArrivalTime?: number;
  OwnerName?: string;
  Number?: string | number;
  Fare?: number;
  DomainCode?: string;
  LocalDomainCode?: string;
  JourneyName?: string;
  TransportMode?: string;
  Mode?: string;
};

export type Journey = {
  nativeData: JourneySegment[];
  osszido?: string;
  duration?: string;
  indulasi_hely?: string;
  erkezesi_hely?: string;
};