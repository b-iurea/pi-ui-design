#include "scene_graph.h"
#include <algorithm>
#include <cstring>

namespace uidesign {

SceneGraph::SceneGraph() {
  // Root node at index 0
  Node root;
  root.id = 0;
  root.type = NodeType::ROOT;
  root.w = 1200;
  root.h = 800;
  root.parent = -1;
  nodes_.push_back(root);
}

/* ─── Find index by id ─── */
int32_t SceneGraph::findNodeIndex(uint32_t id) const {
  for (size_t i = 0; i < nodes_.size(); ++i) {
    if (nodes_[i].id == id) return static_cast<int32_t>(i);
  }
  return -1;
}

int32_t SceneGraph::findParentIndex(uint32_t id) const {
  for (size_t i = 0; i < nodes_.size(); ++i) {
    if (nodes_[i].id == id) return nodes_[i].parent;
  }
  return -1;
}

const Node* SceneGraph::getNode(uint32_t id) const {
  int32_t idx = findNodeIndex(id);
  return idx >= 0 ? &nodes_[idx] : nullptr;
}

Node* SceneGraph::getNode(uint32_t id) {
  int32_t idx = findNodeIndex(id);
  return idx >= 0 ? &nodes_[idx] : nullptr;
}

/* ─── Add node ─── */
uint32_t SceneGraph::addNode(NodeType type, int32_t parentIdx) {
  if (nodes_.size() >= MAX_NODES) return 0;
  Node n;
  n.id = allocId();
  n.type = type;
  if (parentIdx < 0 || parentIdx >= static_cast<int32_t>(nodes_.size())) {
    parentIdx = 0; // attach to root
  }
  n.parent = parentIdx;
  nodes_.push_back(n);
  nodes_[parentIdx].children.push_back(static_cast<int32_t>(nodes_.size() - 1));
  return n.id;
}

/* ─── Remove node ─── */
void SceneGraph::removeChildren(int32_t idx) {
  if (idx < 0 || idx >= static_cast<int32_t>(nodes_.size())) return;
  auto& node = nodes_[idx];
  // Recursively remove children
  for (int32_t childIdx : node.children) {
    removeChildren(childIdx);
  }
  node.children.clear();
  node.parent = -2; // mark for removal
}

void SceneGraph::removeNode(uint32_t id) {
  int32_t idx = findNodeIndex(id);
  if (idx <= 0) return; // can't remove root
  // Remove from parent's children list
  int32_t parentIdx = nodes_[idx].parent;
  if (parentIdx >= 0) {
    auto& siblings = nodes_[parentIdx].children;
    siblings.erase(std::remove(siblings.begin(), siblings.end(), idx), siblings.end());
  }
  removeChildren(idx);
  nodes_[idx].parent = -2; // mark
  compact();
}

void SceneGraph::compact() {
  std::vector<Node> alive;
  std::unordered_map<int32_t, int32_t> remap; // old idx → new idx
  for (size_t i = 0; i < nodes_.size(); ++i) {
    if (nodes_[i].parent != -2) {
      remap[static_cast<int32_t>(i)] = static_cast<int32_t>(alive.size());
      alive.push_back(nodes_[i]);
    }
  }
  // Remap parent and children indices
  for (auto& node : alive) {
    if (node.parent >= 0) {
      auto it = remap.find(node.parent);
      node.parent = it != remap.end() ? it->second : 0;
    }
    for (auto& child : node.children) {
      auto it = remap.find(child);
      child = it != remap.end() ? it->second : 0;
    }
  }
  nodes_ = std::move(alive);
}

/* ─── Move node ─── */
void SceneGraph::moveNode(uint32_t id, int32_t newParentIdx, int32_t index) {
  int32_t idx = findNodeIndex(id);
  if (idx <= 0) return;
  // Remove from old parent
  int32_t oldParent = nodes_[idx].parent;
  if (oldParent >= 0) {
    auto& oldSiblings = nodes_[oldParent].children;
    oldSiblings.erase(std::remove(oldSiblings.begin(), oldSiblings.end(), idx), oldSiblings.end());
  }
  // Attach to new parent
  if (newParentIdx < 0 || newParentIdx >= static_cast<int32_t>(nodes_.size())) {
    newParentIdx = 0;
  }
  nodes_[idx].parent = newParentIdx;
  auto& newSiblings = nodes_[newParentIdx].children;
  if (index < 0 || index >= static_cast<int32_t>(newSiblings.size())) {
    newSiblings.push_back(idx);
  } else {
    newSiblings.insert(newSiblings.begin() + index, idx);
  }
}

/* ─── Update prop ─── */
void SceneGraph::updateProp(uint32_t id, const std::string& key, const std::string& value) {
  Node* node = getNode(id);
  if (!node) return;
  if (value.empty()) {
    node->props.erase(key);
  } else {
    node->props[key] = value;
  }
}

void SceneGraph::setBounds(uint32_t id, float x, float y, float w, float h) {
  Node* node = getNode(id);
  if (!node) return;
  node->x = x;
  node->y = y;
  node->w = w > 0 ? w : 10;
  node->h = h > 0 ? h : 10;
}

/* ─── Total count (excludes root) ─── */
size_t SceneGraph::totalNodes() const {
  size_t count = 0;
  for (const auto& n : nodes_) {
    if (n.parent >= 0 || n.id == 0) count++;
  }
  return count > 0 ? count - 1 : 0;
}

/* ─── Depth-first traversal ─── */
void SceneGraph::traverse(uint32_t rootIdx, std::function<void(const Node&, int)> fn) const {
  if (rootIdx >= nodes_.size()) return;
  const Node& root = nodes_[rootIdx];
  if (!root.visible) return;
  fn(root, 0);
  for (int32_t childIdx : root.children) {
    if (childIdx >= 0 && childIdx < static_cast<int32_t>(nodes_.size())) {
      traverse(static_cast<uint32_t>(childIdx), [&](const Node& n, int d) {
        fn(n, d + 1);
      });
    }
  }
}

/* ─── Binary serialization ───
   Format: [node_count:u32] [node_data...]
   Each node: [id:u32, type:u8, x:f32, y:f32, w:f32, h:f32,
               rotation:f32, opacity:u8, visible:u8, locked:u8,
               parent:i32, child_count:u32, child_ids:i32...,
               prop_count:u32, key_len:u32, key:char..., val_len:u32, val:char...]
*/
std::vector<uint8_t> SceneGraph::serialize() const {
  std::vector<uint8_t> buf;
  auto put32 = [&](uint32_t v) { auto p = (uint8_t*)&v; buf.insert(buf.end(), p, p+4); };
  auto putf = [&](float v) { auto p = (uint8_t*)&v; buf.insert(buf.end(), p, p+4); };
  auto put8 = [&](uint8_t v) { buf.push_back(v); };
  auto putstr = [&](const std::string& s) {
    put32(static_cast<uint32_t>(s.size()));
    buf.insert(buf.end(), s.begin(), s.end());
  };

  // Count alive nodes
  std::vector<const Node*> alive;
  for (const auto& n : nodes_) {
    if (n.parent != -2) alive.push_back(&n);
  }
  put32(static_cast<uint32_t>(alive.size()));

  for (const Node* n : alive) {
    put32(n->id);
    put8(static_cast<uint8_t>(n->type));
    putf(n->x); putf(n->y); putf(n->w); putf(n->h);
    putf(n->rotation); put8(n->opacity);
    put8(n->visible ? 1 : 0); put8(n->locked ? 1 : 0);
    put32(static_cast<uint32_t>(n->parent));
    put32(static_cast<uint32_t>(n->children.size()));
    for (int32_t c : n->children) put32(static_cast<uint32_t>(c));
    put32(static_cast<uint32_t>(n->props.size()));
    for (const auto& [k, v] : n->props) {
      putstr(k); putstr(v);
    }
  }
  return buf;
}

void SceneGraph::deserialize(const std::vector<uint8_t>& data) {
  nodes_.clear();
  nextId_ = 1;
  if (data.size() < 4) return;

  size_t pos = 0;
  auto get32 = [&]() -> uint32_t {
    if (pos + 4 > data.size()) return 0;
    uint32_t v; memcpy(&v, &data[pos], 4); pos += 4; return v;
  };
  auto getf = [&]() -> float {
    if (pos + 4 > data.size()) return 0;
    float v; memcpy(&v, &data[pos], 4); pos += 4; return v;
  };
  auto get8 = [&]() -> uint8_t {
    if (pos >= data.size()) return 0;
    return data[pos++];
  };
  auto getstr = [&]() -> std::string {
    uint32_t len = get32();
    if (pos + len > data.size()) return "";
    std::string s(data.begin() + pos, data.begin() + pos + len);
    pos += len;
    return s;
  };

  uint32_t count = get32();
  nodes_.reserve(count);

  for (uint32_t i = 0; i < count; ++i) {
    Node n;
    n.id = get32();
    n.type = static_cast<NodeType>(get8());
    n.x = getf(); n.y = getf(); n.w = getf(); n.h = getf();
    n.rotation = getf(); n.opacity = get8();
    n.visible = get8() != 0; n.locked = get8() != 0;
    n.parent = static_cast<int32_t>(get32());
    uint32_t childCount = get32();
    for (uint32_t j = 0; j < childCount; ++j) {
      n.children.push_back(static_cast<int32_t>(get32()));
    }
    uint32_t propCount = get32();
    for (uint32_t j = 0; j < propCount; ++j) {
      std::string k = getstr();
      std::string v = getstr();
      n.props[k] = v;
    }
    if (n.id >= nextId_) nextId_ = n.id + 1;
    nodes_.push_back(n);
  }
}

} // namespace uidesign
