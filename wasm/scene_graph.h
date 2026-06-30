#ifndef UI_DESIGN_SCENE_GRAPH_H
#define UI_DESIGN_SCENE_GRAPH_H

#include <string>
#include <vector>
#include <unordered_map>
#include <functional>
#include <cstdint>

namespace uidesign {

/* ─── Node type enum ─── */
enum class NodeType : uint8_t {
  ROOT = 0,
  CONTAINER,
  WRAPPER,
  SECTION,
  ARTICLE,
  HEADER,
  FOOTER,
  MAIN,
  SIDEBAR,
  FLEX_ROW,
  FLEX_COL,
  GRID,
  STACK,
  FRAME,
  PANEL,
  CARD,
  DIVIDER,
  SPACER,
  NAVBAR,
  DROPDOWN,
  TABS,
  BREADCRUMB,
  PAGINATION,
  HERO,
  HEADING,
  PARAGRAPH,
  LINK,
  BUTTON,
  INPUT,
  TEXTAREA,
  SELECT,
  CHECKBOX,
  TOGGLE,
  IMAGE,
  AVATAR,
  ICON,
  VIDEO,
  SPINNER,
  SKELETON,
  TOAST,
  ALERT,
  BADGE,
  PROGRESS,
  MODAL,
  TOOLTIP,
  LIST,
  TABLE,
  STATS,
  ACCORDION,
  CAROUSEL,
  EMPTY_STATE,
  TIMELINE,
  TREE_VIEW,
  CODE_BLOCK,
  LABEL,
  CUSTOM
};

/* ─── Key-value property map ─── */
using PropMap = std::unordered_map<std::string, std::string>;

/* ─── A single node in the scene graph ─── */
struct Node {
  uint32_t id;
  NodeType type;
  float x = 0, y = 0, w = 200, h = 100;
  float rotation = 0;
  uint8_t opacity = 255;
  bool visible = true;
  bool locked = false;
  int32_t parent = -1;           // index into node pool, -1 = no parent
  std::vector<int32_t> children; // indices into node pool
  PropMap props;
  uint32_t instanceMasterId = 0; // 0 = not an instance
};

/* ─── Scene graph ─── */
class SceneGraph {
public:
  SceneGraph();
  ~SceneGraph() = default;

  /* Node operations */
  uint32_t addNode(NodeType type, int32_t parentIdx = -1);
  void removeNode(uint32_t id);
  void moveNode(uint32_t id, int32_t newParentIdx, int32_t index = -1);
  void updateProp(uint32_t id, const std::string& key, const std::string& value);
  void setBounds(uint32_t id, float x, float y, float w, float h);

  /* Query */
  const Node* getNode(uint32_t id) const;
  Node* getNode(uint32_t id);
  int32_t findNodeIndex(uint32_t id) const;
  int32_t findParentIndex(uint32_t id) const;
  size_t nodeCount() const { return nodes_.size(); }
  size_t totalNodes() const;

  /* Traversal — depth-first, skips hidden */
  void traverse(uint32_t rootIdx, std::function<void(const Node&, int depth)> fn) const;

  /* Serialization */
  std::vector<uint8_t> serialize() const;
  void deserialize(const std::vector<uint8_t>& data);

private:
  std::vector<Node> nodes_;
  uint32_t nextId_ = 1;
  static constexpr size_t MAX_NODES = 100000;

  uint32_t allocId() { return nextId_++; }
  void removeChildren(int32_t idx);
  void compact();
};

} // namespace uidesign

#endif
