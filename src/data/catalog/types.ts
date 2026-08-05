export type Fault = {
  slug: string;
  label: string;
  price: number;
  duration: string;
  warranty: string;
  part: string;
};

export type Device = {
  slug: string;
  name: string;
  brand: string;
  series: string;
  category: string;
  year: number;
  faults: Fault[];
};

export type Brand = {
  slug: string;
  name: string;
  tag: string;
  devices: string[];
};
