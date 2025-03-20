import { useCallback, useState, useEffect, useRef } from 'react';
import { Handle, Position, useReactFlow, Node, Edge, NodeProps } from 'reactflow';

interface Section {
  id: number;
  title: string;
  description: string;
}

export interface CustomNodeData {
  label: string;
  sections: Section[];
  addChildNodeWithEdge?: (parentId: string, parentPosition: { x: number; y: number }) => string;
  onHeaderClick?: (nodeId: string, label: string) => void;
  getNextPageNumber?: () => number;
  level?: number;
  subtreeWidth?: number;
}

const NODE_WIDTH = 180;
// const NODE_HEIGHT = 100;
const HORIZONTAL_SPACING = 400;
const VERTICAL_SPACING = 300;

function CustomNode({ id, data }: NodeProps<CustomNodeData>) {
  const reactFlowInstance = useReactFlow();
  const { setNodes, deleteElements, getNode, setEdges } = reactFlowInstance;
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [hasChild, setHasChild] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editLabel, setEditLabel] = useState<string>(data.label);
  const inputRef = useRef<HTMLInputElement>(null);
  const currentNode = getNode(id);
  const allEdges = reactFlowInstance.getEdges();
  // const allNodes = reactFlowInstance.getNodes();

  useEffect(() => {
    const childEdges = allEdges.filter(edge => edge.source === id);
    setHasChild(childEdges.length > 0);
  }, [id, allEdges]);

  // Returns the edge where this node is the target.
  const findParentEdge = useCallback((): Edge | undefined => {
    return allEdges.find(edge => edge.target === id);
  }, [allEdges, id]);

  // A node is considered "root" if it has no incoming (parent) edge.
  const isRootNode = useCallback(() => !findParentEdge(), [findParentEdge]);

  const generateContent = useCallback(() => {
    console.log('Generated content for node', id);
  }, [id]);

  const findParentEdgeForNode = useCallback((nodeId: string): Edge | undefined => {
    return allEdges.find(edge => edge.target === nodeId);
  }, [allEdges]);

  // Only allow adding a child node if this node is a root node.
  const addChildNode = useCallback(() => {
    if (!currentNode || hasChild || !isRootNode()) return;
 
    const newNodeId = `node-${Date.now()}`;
    const nextPageNumber = data.getNextPageNumber ? data.getNextPageNumber() : 0;

    const newNode: Node<CustomNodeData> = {
      id: newNodeId,
      type: 'custom',
      data: {
        label: `Page ${nextPageNumber}`,
        sections: [],
        onHeaderClick: data.onHeaderClick,
        getNextPageNumber: data.getNextPageNumber,
        level: (data.level || 0) + 1,
        subtreeWidth: NODE_WIDTH,
      },
      position: {
        x: currentNode.position.x,
        y: currentNode.position.y + VERTICAL_SPACING,
      },
    };

    const newEdge: Edge = {
      id: `edge-${id}-${newNodeId}`,
      source: id,
      target: newNodeId,
      type: 'smoothstep',
    };

    console.log("New child Node Created:", newNode.data.label, newNode.position);
    setNodes(nds => [...nds, newNode]);
    setEdges(eds => [...eds, newEdge]);
    setHasChild(true);
  }, [currentNode, id, data, setNodes, setEdges, hasChild, isRootNode]);

  // Get all sibling nodes (children of the same parent) and sort them by x position.
  const sortSiblingNodes = useCallback((parentId: string): Node<CustomNodeData>[] => {
    const siblingEdges = allEdges.filter(edge => edge.source === parentId);
    const siblingNodes = siblingEdges
      .map(edge => getNode(edge.target))
      .filter((node): node is Node<CustomNodeData> => !!node);
    return siblingNodes.sort((a, b) => a.position.x - b.position.x);
  }, [allEdges, getNode]);

  const findAllChildren = useCallback((nodeId: string): string[] => {
    const childEdges = allEdges.filter(edge => edge.source === nodeId);
    const childIds = childEdges.map(edge => edge.target);
    return [
      ...childIds,
      ...childIds.flatMap(childId => findAllChildren(childId))
    ];
  }, [allEdges]);

  const deleteNode = useCallback(() => {
    const childrenIds = findAllChildren(id);
    const nodesToDelete = [{ id }, ...childrenIds.map(nodeId => ({ id: nodeId }))];
    deleteElements({ nodes: nodesToDelete });
    setShowMenu(false);
  }, [id, findAllChildren, deleteElements]);

  // Modify sibling logic so that the new sibling node is always added at the extreme.
  const addSiblingNode = useCallback((direction: Position) => {
    if (!currentNode || isRootNode()) return;

    const parentEdge = findParentEdgeForNode(id);
    if (!parentEdge) return;

    const parentId = parentEdge.source;
    const parentNode = getNode(parentId);
    if (!parentNode) return;

    const newNodeId = `node-${Date.now()}`;
    const nextPageNumber = data.getNextPageNumber ? data.getNextPageNumber() : 0;

    // Get all siblings for the parent node.
    const siblingNodes = sortSiblingNodes(parentId);
    let newX = parentNode.position.x; // default fallback

    if (direction === Position.Left) {
      // New node will be to the left of the leftmost sibling.
      newX = siblingNodes[0].position.x - HORIZONTAL_SPACING;
    } else if (direction === Position.Right) {
      // New node will be to the right of the rightmost sibling.
      newX = siblingNodes[siblingNodes.length - 1].position.x + HORIZONTAL_SPACING;
    }

    const newPosition = {
      x: newX,
      y: parentNode.position.y + VERTICAL_SPACING,
    };

    const newNode: Node<CustomNodeData> = {
      id: newNodeId,
      type: 'custom',
      data: {
        label: `Page ${nextPageNumber}`,
        sections: [],
        onHeaderClick: data.onHeaderClick,
        getNextPageNumber: data.getNextPageNumber,
        level: data.level,
        subtreeWidth: NODE_WIDTH,
      },
      position: newPosition,
    };

    console.log("Sibling node created:", newNode.data.label, newNode.position);
    const newEdge: Edge = {
      id: `edge-${parentId}-${newNodeId}`,
      source: parentId,
      target: newNodeId,
      type: 'smoothstep',
    };

    // Append the new node to the list of nodes.
    const updatedNodes = [...reactFlowInstance.getNodes(), newNode];
    setNodes(updatedNodes);
    setEdges(eds => [...eds, newEdge]);
  }, [currentNode, id, data, getNode, setNodes, setEdges, isRootNode, findParentEdgeForNode, sortSiblingNodes, reactFlowInstance]);

  const handleHeaderClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.onHeaderClick) {
      data.onHeaderClick(id, data.label);
    }
    setIsEditing(true);
  }, [data.onHeaderClick, id, data.label]);

  const handleSaveLabel = useCallback(() => {
    if (editLabel.trim() && editLabel !== data.label) {
      setNodes(nds =>
        nds.map(node =>
          node.id === id ? { ...node, data: { ...node.data, label: editLabel } } : node
        )
      );
    }
    setIsEditing(false);
  }, [editLabel, data.label, id, setNodes]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSaveLabel();
  }, [handleSaveLabel]);

  useEffect(() => {
    if (isEditing && inputRef.current) inputRef.current.focus();
  }, [isEditing]);

  return (
    <div className="w-64 bg-white border border-gray-200 rounded-md shadow-sm relative">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-cyan-600" />

      <div className="relative">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editLabel}
            onChange={(e) => setEditLabel(e.target.value)}
            onBlur={handleSaveLabel}
            onKeyPress={handleKeyPress}
            className="w-full p-2 border border-gray-300 rounded-t-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        ) : (
          <div
            className="flex items-center p-2 border-b border-gray-100 cursor-pointer"
            onClick={handleHeaderClick}
          >
            <span className="text-gray-600 mr-2">📄</span>
            <span className="font-medium text-gray-800">{data.label}</span>
            <button
              className="ml-auto text-gray-400 hover:text-gray-600 focus:outline-none"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
            >
              ⋯
            </button>
            {showMenu && (
              <div className="absolute top-8 right-2 bg-white border border-gray-200 rounded shadow-sm z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNode();
                  }}
                  className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  Delete Node
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {id === "root" && data.sections?.length > 0 && (
        <div className="mt-2 p-2 space-y-2">
          {data.sections.map((section) => (
            <div 
              key={section.id} 
              className="border border-gray-300 rounded-md p-3 shadow-sm"
            >
              <h3 className="font-medium text-gray-800">{section.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{section.description}</p>
            </div>
          ))}
        </div>
      )}

      <div className="p-3">
        <div className="flex mt-3 space-x-2">
          <button
            onClick={generateContent}
            className="mb-3 px-2 py-1 text-sm border border-gray-300 rounded bg-white hover:bg-gray-50 text-gray-700"
          >
            <span className="flex items-center justify-center">
              <span className="mr-1">✨</span> Generate
            </span>
          </button>
        </div>
      </div>

      {/* Render sibling buttons for non-root nodes */}
      {!isRootNode() && (
        <>
          <div className="absolute -left-3 top-1/2 transform -translate-y-1/2 flex flex-col space-y-2">
            <button
              onClick={() => addSiblingNode(Position.Left)}
              className="w-6 h-6 text-gray-700 text-2xl flex items-center justify-center bg-white rounded-full border border-gray-200 hover:bg-gray-50"
              title="Add sibling to left"
            >
              +
            </button>
          </div>
          <div className="absolute -right-3 top-1/2 transform -translate-y-1/2 flex flex-col space-y-2">
            <button
              onClick={() => addSiblingNode(Position.Right)}
              className="w-6 h-6 text-gray-700 text-2xl flex items-center justify-center bg-white rounded-full border border-gray-200 hover:bg-gray-50"
              title="Add sibling to right"
            >
              +
            </button>
          </div>
        </>
      )}

      {/* Only render the add-child button for root nodes */}
      {isRootNode() && (
        <div className="absolute -bottom-7 left-1/2 transform -translate-x-1/2">
          <button
            onClick={() => addChildNode()}
            className={`w-6 h-6 text-gray-700 text-xl flex items-center justify-center bg-white rounded-full border border-gray-200 ${
              hasChild ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
            }`}
            title="Add child node"
            disabled={hasChild}
          >
            +
          </button>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-cyan-600" />
    </div>
  );
}

export default CustomNode;
