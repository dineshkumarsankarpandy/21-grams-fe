import { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  Connection,
  NodeTypes,
  ReactFlowInstance,
  XYPosition,
} from 'reactflow';
import 'reactflow/dist/style.css';

import CustomNode from './customNode';
import { PageDialog } from './utils/customComponents/pageDialogForm';
import { Sidebar } from './sidebar';
import { PrimarySetupForm } from './utils/customComponents/primarySetupForm';
import { PrimaryNavbar } from './primarySitemapBar';

interface NodeData {
  label: string;
  sections: any[];
  addChildNodeWithEdge?: (parentId: string, parentPosition: XYPosition) => string;
  onHeaderClick?: (nodeId: string) => void;
  getNextPageNumber?: () => number;
}

type CustomNodeType = Node<NodeData>;

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

// Initial root node (no extra child)
const initialNodes: CustomNodeType[] = [
  {
    id: 'root',
    type: 'custom',
    data: { label: 'Home', sections: [] },
    position: { x: 100, y: 100 },
  },
];

const initialEdges: Edge[] = [];

// Key used for storing in localStorage
const SITEMAP_STORAGE_KEY = 'sitemap_data';

// Load any saved sitemap from localStorage
const loadInitialState = () => {
  try {
    const savedData = localStorage.getItem(SITEMAP_STORAGE_KEY);
    if (savedData) {
      const { savedNodes, savedEdges, savedPageCount,businessName,businessDescription } = JSON.parse(savedData);
      if (savedNodes?.length > 0 && savedEdges) {
        return {
          nodes: savedNodes,
          edges: savedEdges,
          pageCount: savedPageCount || 1,
          businessName:businessName || '',
          businessDescription: businessDescription || '',
        };
      }
    }
  } catch (error) {
    console.error('Error loading sitemap from localStorage:', error);
  }
  return {
    nodes: initialNodes,
    edges: initialEdges,
    pageCount: 1,
  };
};

function SitemapFlow() {
  const savedState = loadInitialState();

  const [nodes, setNodes, onNodesChange] = useNodesState<NodeData>(savedState.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(savedState.edges);

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  // Use a ref to store the React Flow instance for easy access
  const reactFlowInstanceRef = useRef<ReactFlowInstance | null>(null);

  const [dialogNodeId, setDialogNodeId] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState<number>(savedState.pageCount);


  const[businessName, setBusinessName] = useState(savedState.businessName)
  const[businessDescription,setBusinessDescription]= useState(savedState.businessDescription)

  // Controls whether the "Primary Setup" form is open
  const [primarySetupOpen, setPrimarySetupOpen] = useState<boolean>(false);
  // Toggles the entire sitemap area
  const [showSitemap, setShowSitemap] = useState<boolean>(true);

  // Save to localStorage whenever nodes/edges/pageCount change
  useEffect(() => {
    try {
      const dataToSave = {
        savedNodes: nodes.map(node => ({
          ...node,
          data: {
            // only store essential node data
            label: node.data.label,
            sections: node.data.sections,
          },
        })),
        savedEdges: edges,
        savedPageCount: pageCount,
        businessName,
        businessDescription,
      };
      localStorage.setItem(SITEMAP_STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Error saving sitemap to localStorage:', error);
    }
  }, [nodes, edges, pageCount]);

  // Delete entire sitemap
  const handleDeleteSitemap = useCallback(() => {
    if (confirm('Are you sure you want to delete this sitemap?')) {
      setNodes([]);
      setEdges([]);
      setShowSitemap(false);
      setDialogNodeId(null);
      setPrimarySetupOpen(false);
      setPageCount(1);
      localStorage.removeItem(SITEMAP_STORAGE_KEY);
    }
  }, [setNodes, setEdges]);

  // Generate the next page number
  const getNextPageNumber = useCallback(() => {
    const currentCount = pageCount;
    setPageCount(currentCount + 1);
    return currentCount;
  }, [pageCount]);

  // Opens the PageDialog for editing/regenerating a node
  const onHeaderClick = useCallback((nodeId: string) => {
    setDialogNodeId(nodeId);
  }, []);

  // Manually open the "Primary Setup" form
  const handleOpenDialog = useCallback(() => {
    setPrimarySetupOpen(true);
  }, []);

  // This function can be used by child nodes if they want to programmatically create new nodes
  const addChildNodeWithEdge = useCallback(
    (parentId: string, parentPosition: XYPosition): string => {
      const newNodeId = `node-${Date.now()}`;
      const nextPageNumber = getNextPageNumber();

      // Retrieve parent's measured height from its data (fallback if not available)
      const parentNode = reactFlowInstanceRef.current?.getNode(parentId);
      const parentHeight = parentNode?.data?.nodeHeight || 200;

      const newNodePosition: XYPosition = {
        x: parentPosition.x,
        y: parentPosition.y + parentHeight + 50,
      };

      const newNode: CustomNodeType = {
        id: newNodeId,
        type: 'custom',
        data: {
          label: `Page ${nextPageNumber}`,
          sections: [],
          addChildNodeWithEdge,
          onHeaderClick,
          getNextPageNumber,
        },
        position: newNodePosition,
      };

      const newEdge: Edge = {
        id: `edge-${parentId}-${newNodeId}`,
        source: parentId,
        target: newNodeId,
        type: 'smoothstep',
      };

      setNodes((nds) => [...nds, newNode]);
      setEdges((eds) => [...eds, newEdge]);

      return newNodeId;
    },
    [setNodes, setEdges, onHeaderClick, getNextPageNumber]
  );

  // We won't actually do anything on a raw "Connect" in this example
  const onConnect = useCallback((_: Connection) => {}, []);

  // Called by PageDialog after user changes page name or regenerates content
  const handleRegenerate = useCallback(
    (pageName: string, pagePrompt: string) => {
      if (dialogNodeId && pageName.trim()) {
        setNodes((nds) =>
          nds.map((node) => {
            if (node.id === dialogNodeId) {
              return {
                ...node,
                data: {
                  ...node.data,
                  label: pageName,
                  sections: pagePrompt
                    ? [{ id: Date.now(), content: pagePrompt }]
                    : node.data.sections,
                },
              };
            }
            return node;
          })
        );
        setDialogNodeId(null);
      }
    },
    [dialogNodeId, setNodes]
  );

  // Called by the "Primary Setup" form to do an initial generation
  const handlePrimarySetupRegenerate = useCallback(
    (businessName:string, businessDescription:string  ,siteMapPrompt: string, noOfPage: number, language: string) => {
      console.log('Generating sitemap with:', { businessName,businessDescription,siteMapPrompt, noOfPage, language });
      setPrimarySetupOpen(false);
    },
    []
  );

  // Updates the label of a node (used by PageDialog)
  const handleUpdateLabel = useCallback(
    (nodeId: string, newLabel: string) => {
      if (newLabel.trim()) {
        setNodes((nds) =>
          nds.map((node) => {
            if (node.id === nodeId) {
              return {
                ...node,
                data: {
                  ...node.data,
                  label: newLabel,
                },
              };
            }
            return node;
          })
        );
      }
    },
    [setNodes]
  );
  const handleSitemapGenerated = useCallback(
    (data: any) => {
      console.log('handleSitemapGenerated received data:', data);
  
      // Validate that the "pages" array exists.
      if (!data || !data.pages || !Array.isArray(data.pages)) {
        console.error('Invalid sitemap data received', data);
        return;
      }

      setBusinessName(data.businessName||'');
      setBusinessDescription(data.businessDescription || '');
  
      // Find the homepage data (match title "Home" or use the first page)
      const homepage =
        data.pages.find((page: any) => page.pageTitle.toLowerCase() === 'home') ||
        data.pages[0];
  
      // Update the root node with the homepage details and remove all other nodes.
      setNodes((nds) => {
        const rootNode = nds.find((node) => node.id === 'root');
        if (!rootNode) {
          return nds;
        }
        const updatedRoot: Node<NodeData, string> = {
          ...rootNode,
          data: {
            ...rootNode.data,
            label: homepage.pageTitle,
            sections: homepage.sections.map((section: any, index: number) => ({
              id: `${Date.now()}-${index}`,
              title: section.sectionTitle,
              description: section.sectionDescription,
            })),
          },
        };
        return [updatedRoot];
      });
  
      // Clear all edges.
      setEdges([]);
      // Remove the forEach loop that adds child nodes
    },
    [setNodes, setEdges]
  );
  
  useEffect(() => {
    setNodes((currentNodes) =>
      currentNodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          addChildNodeWithEdge,
          onHeaderClick,
          getNextPageNumber,
        },
      }))
    );
  }, [addChildNodeWithEdge, onHeaderClick, getNextPageNumber, setNodes]);

  return (
    <div className="flex w-screen h-full bg-gray-100">
      {/* Left Sidebar */}
      <Sidebar onOpenDialog={handleOpenDialog} />

      {/* Main ReactFlow Canvas */}
      <div ref={reactFlowWrapper} className="flex-1">
        {showSitemap && (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            onInit={(instance) => {
              reactFlowInstanceRef.current = instance;
            }}
            nodesDraggable={false}
            fitView
            snapToGrid
            preventScrolling
          >
            <PrimaryNavbar
              title="Primary Sitemap"
              onDelete={showSitemap ? handleDeleteSitemap : undefined}
              onSetupOpen={handleOpenDialog}
            />
            <MiniMap />
            <Controls />
          </ReactFlow>
        )}
      </div>

      {/* Dialog to edit/regenerate a specific page node */}
      <PageDialog
        open={!!dialogNodeId}
        onOpenChange={(open) => setDialogNodeId(open ? dialogNodeId : null)}
        onRegenerate={handleRegenerate}
        nodeId={dialogNodeId || ''}
        onUpdateLabel={handleUpdateLabel}
      />

      {/* Primary setup form (initial sitemap generation) */}
      <PrimarySetupForm
        open={primarySetupOpen}
        onOpenChange={setPrimarySetupOpen}
        onRegenerate={handlePrimarySetupRegenerate}
        nodeId="root"
        onSitemapGenerated={handleSitemapGenerated}
      />
    </div>
  );
}

export default SitemapFlow;
  
