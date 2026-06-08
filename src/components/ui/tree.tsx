"use client";

import { forwardRef, useCallback, useState } from "react";

import { cn } from "@/lib/utils";
import { Collapse } from "./collapse";
import { Icon, type IconName } from "./icon";
import { chevronRight } from "./icons";

/**
 * Tree — pixel-faithful reimplementation of Blueprint's `.bp6-tree`.
 *
 * Blueprint spec (`packages/core/src/components/tree/_tree.scss`, v6.15):
 *
 * $pt-spacing = 4px
 * $tree-row-height = $pt-spacing * 7.5 = 30px
 * $tree-icon-spacing = $pt-spacing * 2 = 8px
 * $tree-row-height-compact = $pt-spacing * 6 = 24px
 * $tree-icon-spacing-compact = ($tree-row-height-compact - $pt-icon-size-standard) * 0.5 = (24-16)*0.5 = 4px
 *
 * Node content row (.bp6-tree-node-content):
 *   height: 30px; display: flex; align-items: center; padding-right: 4px; width: 100%
 *   hover: rgba(143,153,168,0.15)  [gray3 @ 15%]  dark: rgba(95,107,124,0.3) [gray1 @ 30%]
 *   active: rgba(143,153,168,0.3) [gray3 @ 30%]
 *
 * Depth indentation (.bp6-tree-node-content-N):
 *   padding-left: ($tree-row-height - $tree-icon-spacing) * depth = 22 * depth px
 *
 * Caret (.bp6-tree-node-caret):
 *   min-width: 30px; padding: 8px; cursor: pointer
 *   transform: rotate(0deg) → rotate(90deg) when open
 *   transition: transform 200ms cubic-bezier(0.4,1,0.75,0.9)
 *
 * Caret-none (.bp6-tree-node-caret-none): min-width: 30px (spacer, no glyph)
 *
 * Node icon (.bp6-tree-node-icon): margin-right: 8px; position: relative
 *
 * Label (.bp6-tree-node-label): flex: 1 1 auto; overflow: hidden; text-overflow: ellipsis; white-space: nowrap
 *
 * Secondary label (.bp6-tree-node-secondary-label): padding: 0 4px
 *
 * Selected (.bp6-tree-node-selected > .bp6-tree-node-content):
 *   background-color: #2d72d2 (blue-3); color: white; icons: white
 *
 * Disabled (.bp6-tree-node.bp6-disabled):
 *   color: var(--foreground-disabled); cursor: not-allowed
 *
 * @see https://blueprintjs.com/docs/#core/components/tree
 */

// ─── Types ───────────────────────────────────────────────────────────────────

/** Unique identifier for a tree node. */
export type TreeNodeId = string | number;

/** Data model for a single tree node. */
export interface TreeNodeInfo {
    /** Unique identifier (required for keying + expansion/selection tracking). */
    id: TreeNodeId;
    /** Primary content of the node row. */
    label: React.ReactNode;
    /** Optional Blueprint icon rendered left of the label (after the caret). */
    icon?: IconName;
    /** Element rendered right-aligned in the node row. */
    secondaryLabel?: React.ReactNode;
    /** Whether this node's children are currently visible. */
    isExpanded?: boolean;
    /** Whether this node is highlighted with the primary intent background. */
    isSelected?: boolean;
    /** Whether this node is non-interactive and visually dimmed. */
    disabled?: boolean;
    /**
     * Whether to force a caret to show (even with no children) or hide it (even
     * with children). When omitted the caret shows iff `childNodes` is non-empty.
     */
    hasCaret?: boolean;
    /** Nested child nodes. */
    childNodes?: TreeNodeInfo[];
    /** Additional class applied to the `<li>` wrapper. */
    className?: string;
}

/**
 * Event handler for tree node events.
 * - `node` is the full `TreeNodeInfo` of the node that was interacted with.
 * - `nodePath` is the array of indices from the root to the node (e.g. [0, 1]).
 * - `e` is the originating mouse event.
 */
export type TreeEventHandler = (
    node: TreeNodeInfo,
    nodePath: number[],
    e: React.MouseEvent<HTMLElement>,
) => void;

export interface TreeProps extends React.HTMLAttributes<HTMLDivElement> {
    /**
     * Hierarchical node data that defines the tree's contents and state.
     * This is a controlled component: pass `isExpanded` / `isSelected` on each node
     * and update them in your `onNodeExpand` / `onNodeCollapse` / `onNodeClick` handlers.
     */
    contents: TreeNodeInfo[];

    /**
     * Called when the user clicks a node row (anywhere except the caret).
     * Use this to toggle selection or navigate.
     */
    onNodeClick?: TreeEventHandler;

    /**
     * Called when the caret of a collapsed node is clicked (node is about to expand).
     * Set `node.isExpanded = true` in your state update.
     */
    onNodeExpand?: TreeEventHandler;

    /**
     * Called when the caret of an expanded node is clicked (node is about to collapse).
     * Set `node.isExpanded = false` in your state update.
     */
    onNodeCollapse?: TreeEventHandler;

    /**
     * Whether to render the compact variant (24px row height instead of 30px).
     * @default false
     */
    compact?: boolean;

    /** Additional class applied to the outer div. */
    className?: string;
}

// ─── Tree ────────────────────────────────────────────────────────────────────

/**
 * Hierarchical tree of nodes with expand/collapse animation and selection state.
 *
 * Quick reference (controlled usage):
 * ```tsx
 * const [nodes, setNodes] = useState<TreeNodeInfo[]>(INITIAL_NODES);
 *
 * function handleExpand(node: TreeNodeInfo, path: number[]) {
 *   setNodes(produce(nodes, draft => {
 *     Tree.nodeFromPath(path, draft).isExpanded = true;
 *   }));
 * }
 *
 * <Tree
 *   contents={nodes}
 *   onNodeExpand={handleExpand}
 *   onNodeCollapse={(node, path) => setNodes(...)}
 *   onNodeClick={(node, path) => setNodes(...)}
 * />
 * ```
 */
export const Tree = forwardRef<HTMLDivElement, TreeProps>(function Tree(
    { contents, onNodeClick, onNodeExpand, onNodeCollapse, compact = false, className, ...htmlProps },
    ref,
) {
    return (
        <div
            ref={ref}
            className={cn(
                // .bp6-tree: position:relative so hover/selection can extend full width
                "relative cursor-default",
                compact && "bp6-compact",
                className,
            )}
            {...htmlProps}
        >
            <TreeNodeList
                nodes={contents}
                depth={0}
                path={[]}
                compact={compact}
                onNodeClick={onNodeClick}
                onNodeExpand={onNodeExpand}
                onNodeCollapse={onNodeCollapse}
                isRoot
            />
        </div>
    );
});

Tree.displayName = "Tree";

/**
 * Static helper — navigate to a node by its index path (same pattern as Blueprint's
 * `Tree.nodeFromPath`). Useful in controlled update handlers.
 *
 * @example
 * const node = treeNodeFromPath([0, 1], contents);
 */
export function treeNodeFromPath(
    path: readonly number[],
    nodes: TreeNodeInfo[],
): TreeNodeInfo {
    if (path.length === 1) return nodes[path[0]];
    return treeNodeFromPath(path.slice(1), nodes[path[0]].childNodes ?? []);
}

// ─── Internal: TreeNodeList ───────────────────────────────────────────────────

interface TreeNodeListProps {
    nodes: TreeNodeInfo[];
    depth: number;
    path: number[];
    compact: boolean;
    onNodeClick?: TreeEventHandler;
    onNodeExpand?: TreeEventHandler;
    onNodeCollapse?: TreeEventHandler;
    isRoot?: boolean;
}

function TreeNodeList({
    nodes,
    depth,
    path,
    compact,
    onNodeClick,
    onNodeExpand,
    onNodeCollapse,
    isRoot,
}: TreeNodeListProps) {
    return (
        <ul
            className={cn(
                // .bp6-tree-node-list: list-style:none; margin:0; padding-left:0
                "list-none m-0 p-0",
                // .bp6-tree-root: background-color:transparent; padding-left:0
                isRoot && "bg-transparent pl-0",
            )}
        >
            {nodes.map((node, index) => (
                <TreeNodeItem
                    key={node.id}
                    node={node}
                    depth={depth}
                    path={[...path, index]}
                    compact={compact}
                    onNodeClick={onNodeClick}
                    onNodeExpand={onNodeExpand}
                    onNodeCollapse={onNodeCollapse}
                />
            ))}
        </ul>
    );
}

// ─── Internal: TreeNodeItem ───────────────────────────────────────────────────

interface TreeNodeItemProps {
    node: TreeNodeInfo;
    depth: number;
    path: number[];
    compact: boolean;
    onNodeClick?: TreeEventHandler;
    onNodeExpand?: TreeEventHandler;
    onNodeCollapse?: TreeEventHandler;
}

function TreeNodeItem({
    node,
    depth,
    path,
    compact,
    onNodeClick,
    onNodeExpand,
    onNodeCollapse,
}: TreeNodeItemProps) {
    const hasChildren = (node.childNodes?.length ?? 0) > 0;
    const showCaret = node.hasCaret !== undefined ? node.hasCaret : hasChildren;
    const isExpanded = node.isExpanded ?? false;
    const isSelected = node.isSelected ?? false;
    const isDisabled = node.disabled ?? false;

    // Depth-based indentation:
    // Formula from _tree.scss: padding-left = ($tree-row-height - $tree-icon-spacing) * depth
    // Standard: (30 - 8) * depth = 22 * depth  px
    // Compact:  uses same formula with compact row height: (24 - 8) * depth = 16 * depth px
    // (The compact caret min-width changes but the content-N padding is based on the
    //  row height so we mirror the formula exactly.)
    const rowHeight = compact ? 24 : 30;
    const iconSpacing = compact ? 4 : 8;
    const depthIndent = (rowHeight - iconSpacing) * depth;

    const handleCaretClick = useCallback(
        (e: React.MouseEvent<HTMLElement>) => {
            e.stopPropagation();
            if (isDisabled) return;
            if (isExpanded) {
                onNodeCollapse?.(node, path, e);
            } else {
                onNodeExpand?.(node, path, e);
            }
        },
        [isDisabled, isExpanded, node, onNodeCollapse, onNodeExpand, path],
    );

    const handleRowClick = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (isDisabled) return;
            onNodeClick?.(node, path, e);
        },
        [isDisabled, node, onNodeClick, path],
    );

    return (
        <li
            className={cn(
                // .bp6-tree-node base
                "list-none",
                isDisabled && "cursor-not-allowed",
                isSelected && "bp6-tree-node-selected",
                node.className,
            )}
        >
            {/* .bp6-tree-node-content + .bp6-tree-node-content-{depth} */}
            <div
                className={cn(
                    // Identifiable class for DOM queries / harness tagging
                    "bp6-tree-node-content",
                    // Base layout
                    "flex items-center w-full",
                    // Height: 30px standard / 24px compact
                    compact ? "h-[24px]" : "h-[30px]",
                    // Padding-right: $pt-spacing = 4px
                    "pr-1",
                    // Hover / active backgrounds (disabled nodes keep inherit)
                    !isDisabled && [
                        // Light theme: rgba(gray-3, 0.15) = rgba(143,153,168,0.15)
                        // Dark theme: rgba(gray-1, 0.3) = rgba(95,107,124,0.3)
                        "hover:bg-[rgba(143,153,168,0.15)] dark:hover:bg-[rgba(95,107,124,0.3)]",
                        "active:bg-[rgba(143,153,168,0.3)]",
                        "cursor-pointer",
                    ],
                    // Selected: primary intent seed background + white text
                    isSelected && [
                        "bg-primary text-white",
                        // Override hover/active on selected (keep the intent bg)
                        "hover:bg-primary dark:hover:bg-primary",
                    ],
                    // Disabled: foreground-disabled color
                    isDisabled && "text-foreground-disabled",
                )}
                style={{ paddingLeft: depthIndent }}
                onClick={handleRowClick}
            >
                {/* Caret or caret-none spacer */}
                {showCaret ? (
                    <span
                        className={cn(
                            // Identifiable class for DOM queries
                            "bp6-tree-node-caret",
                            // .bp6-tree-node-caret: min-width: 30px; padding: 8px; cursor: pointer
                            // compact: min-width: 24px; padding: 4px; margin-right: 3px
                            compact ? "min-w-[24px] p-[4px]" : "min-w-[30px] p-[8px]",
                            "inline-flex items-center justify-center cursor-pointer",
                            // Rotate: 0deg closed → 90deg open
                            // transition: transform 200ms $pt-transition-ease
                            "transition-transform duration-200 ease-mithril",
                            isExpanded ? "rotate-90" : "rotate-0",
                            // Icon color: foreground-muted (Blueprint's $pt-icon-color)
                            // On selected: rgba(white, 0.7) normal, white on hover
                            isSelected
                                ? "text-[rgba(255,255,255,0.7)] hover:text-white"
                                : isDisabled
                                  ? "text-foreground-disabled"
                                  : "text-foreground-muted hover:text-foreground",
                        )}
                        onClick={handleCaretClick}
                        aria-label={isExpanded ? "Collapse node" : "Expand node"}
                        role="button"
                        tabIndex={isDisabled ? -1 : 0}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                handleCaretClick(e as unknown as React.MouseEvent<HTMLElement>);
                            }
                        }}
                    >
                        <Icon
                            icon={chevronRight}
                            size={16}
                            aria-hidden
                        />
                    </span>
                ) : (
                    <span
                        className={cn(
                            // Identifiable class for DOM queries
                            "bp6-tree-node-caret-none",
                            // .bp6-tree-node-caret-none: same min-width as caret, no glyph
                            compact ? "min-w-[24px]" : "min-w-[30px]",
                            "inline-block shrink-0",
                        )}
                    />
                )}

                {/* Node icon (optional) */}
                {node.icon && (
                    <Icon
                        icon={node.icon}
                        aria-hidden
                        tabIndex={-1}
                        className={cn(
                            // Identifiable class for DOM queries
                            "bp6-tree-node-icon",
                            // .bp6-tree-node-icon: margin-right: $tree-icon-spacing = 8px
                            "mr-2 relative shrink-0",
                            isSelected
                                ? "text-white"
                                : isDisabled
                                  ? "text-foreground-disabled"
                                  : "text-foreground-muted",
                        )}
                    />
                )}

                {/* Label */}
                <span
                    className={cn(
                        // .bp6-tree-node-label: flex:1 1 auto; overflow:hidden; text-overflow:ellipsis; white-space:nowrap
                        "flex-1 min-w-0 truncate relative select-none",
                    )}
                >
                    {node.label}
                </span>

                {/* Secondary label (optional, right-aligned) */}
                {node.secondaryLabel != null && (
                    <span
                        className={cn(
                            // .bp6-tree-node-secondary-label: padding: 0 $pt-spacing = 0 4px
                            "px-1 select-none shrink-0",
                        )}
                    >
                        {node.secondaryLabel}
                    </span>
                )}
            </div>

            {/* Child nodes (collapsed via Collapse animation) */}
            {hasChildren && (
                <Collapse isOpen={isExpanded} keepChildrenMounted>
                    <TreeNodeList
                        nodes={node.childNodes!}
                        depth={depth + 1}
                        path={path}
                        compact={compact}
                        onNodeClick={onNodeClick}
                        onNodeExpand={onNodeExpand}
                        onNodeCollapse={onNodeCollapse}
                    />
                </Collapse>
            )}
        </li>
    );
}

// ─── Controlled-state helper hook ────────────────────────────────────────────

/**
 * Convenience hook for managing controlled Tree state with immutable updates.
 *
 * Returns `[contents, { handleNodeClick, handleNodeExpand, handleNodeCollapse }]`.
 * Toggles `isSelected` on click and `isExpanded` on expand/collapse.
 *
 * @example
 * const [contents, treeHandlers] = useTreeState(INITIAL_NODES);
 * <Tree contents={contents} {...treeHandlers} />
 */
export function useTreeState(initial: TreeNodeInfo[]) {
    const [contents, setContents] = useState<TreeNodeInfo[]>(initial);

    const updateNode = useCallback(
        (path: number[], updater: (node: TreeNodeInfo) => TreeNodeInfo) => {
            setContents((prev) => applyUpdate(prev, path, updater));
        },
        [],
    );

    const handleNodeClick: TreeEventHandler = useCallback(
        (_node, path) => {
            // Toggle selection; clear all others
            setContents((prev) => clearAllSelected(prev, path));
        },
        [],
    );

    const handleNodeExpand: TreeEventHandler = useCallback(
        (_node, path) => {
            updateNode(path, (n) => ({ ...n, isExpanded: true }));
        },
        [updateNode],
    );

    const handleNodeCollapse: TreeEventHandler = useCallback(
        (_node, path) => {
            updateNode(path, (n) => ({ ...n, isExpanded: false }));
        },
        [updateNode],
    );

    return [contents, { handleNodeClick, handleNodeExpand, handleNodeCollapse }] as const;
}

/** Recursively apply an updater to the node at the given path. */
function applyUpdate(
    nodes: TreeNodeInfo[],
    path: number[],
    updater: (n: TreeNodeInfo) => TreeNodeInfo,
): TreeNodeInfo[] {
    if (path.length === 0) return nodes;
    return nodes.map((n, i) => {
        if (i !== path[0]) return n;
        if (path.length === 1) return updater(n);
        return {
            ...n,
            childNodes: applyUpdate(n.childNodes ?? [], path.slice(1), updater),
        };
    });
}

/** Toggle the node at `path` selected, clear all others. */
function clearAllSelected(nodes: TreeNodeInfo[], targetPath: number[]): TreeNodeInfo[] {
    return toggleSelectedPath(nodes, targetPath, []);
}

function toggleSelectedPath(
    nodes: TreeNodeInfo[],
    targetPath: number[],
    currentPath: number[],
): TreeNodeInfo[] {
    return nodes.map((n, i) => {
        const myPath = [...currentPath, i];
        const isTarget = pathEquals(myPath, targetPath);
        return {
            ...n,
            isSelected: isTarget ? !n.isSelected : false,
            childNodes: n.childNodes
                ? toggleSelectedPath(n.childNodes, targetPath, myPath)
                : undefined,
        };
    });
}

function pathEquals(a: number[], b: number[]): boolean {
    return a.length === b.length && a.every((v, i) => v === b[i]);
}
