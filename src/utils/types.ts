export interface Section {
    id: number;
    content: string;
  }
  
  export interface NodeData {
    label: string;
    sections: Section[];
    addChildNodeWithEdge?: (parentId: string, parentPosition: { x: number; y: number }) => string;
  }