
interface UserSnapshot {
  id: number;
  photoThumb: string;
}

export interface PlayerSnapshot {
  id: number;
  comeWith: number;
  type: number;
  user: UserSnapshot;
}
