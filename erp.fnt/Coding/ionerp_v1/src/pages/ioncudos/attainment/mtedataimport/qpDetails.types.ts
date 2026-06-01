export interface QPQuestion {
  questionNo: number;
  text: string;
  cos: string; // e.g., "CO1,CO2"
  level: string; // e.g., "L1" or "L2"
  piCode: string;
  marks: number;
}

export interface QPDetailsData {
  duration: number;
  maxMarks: number;
  course: {
    title: string;
    code: string;
  };
  questions: QPQuestion[];
}

export interface ChartData {
  name: string;
  value: number;       // raw marks distribution (X)
  percentage: number;
}
