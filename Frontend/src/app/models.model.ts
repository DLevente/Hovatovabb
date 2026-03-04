// egyszerű típusok a kereséshez és terveidhez
export type Station = {
  name: string;
  ls_id?: number;
  settlementId?: number;
  siteCode?: number;
  // az API-tól jöhet több mező is; tartsd meg ami kell
  [k: string]: any;
};

export type JourneyResult = {
  id?: number;
  ind_allomas?: string;
  erk_allomas?: string;
  ind_ido?: string;
  erk_ido?: string;
  jegyar?: number;
  jarmu_id?: number;
  ido?: string;
  km?: number;
  sorrend?: number;
  // plusz mezők
  [k: string]: any;
};
