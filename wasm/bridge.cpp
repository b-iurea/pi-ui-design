#include <emscripten/bind.h>
#include "scene_graph.h"
#include "render_commands.h"

using namespace emscripten;
using namespace uidesign;

/* ─── Singleton engine references ─── */
static SceneGraph g_sceneGraph;
static CommandList g_commandList;

/* ─── Build render commands from scene graph ─── */
void rebuildCommands() {
  g_commandList.clear();
  g_sceneGraph.traverse(0, [](const Node& node, int /*depth*/) {
    if (node.id == 0) return; // skip root
    const auto& p = node.props;

    // Derive fill color from props or default
    auto getColor = [&](const std::string& key, uint8_t def) -> uint8_t {
      auto it = p.find(key);
      if (it == p.end()) return def;
      // Simple hex parse: #RRGGBB
      if (it->second.size() >= 7 && it->second[0] == '#') {
        return static_cast<uint8_t>(std::stoul(it->second.substr(1, 2), nullptr, 16));
      }
      return def;
    };

    uint8_t r = node.type == NodeType::BUTTON ? 13 : getColor("r", 200);
    uint8_t g = node.type == NodeType::BUTTON ? 153 : getColor("g", 200);
    uint8_t b = node.type == NodeType::BUTTON ? 255 : getColor("b", 200);
    uint8_t a = node.type == NodeType::BUTTON ? 255 : getColor("a", 50);

    float radius = 0;
    auto radIt = p.find("radius");
    if (radIt != p.end()) radius = std::stof(radIt->second);

    // Text content
    auto textIt = p.find("text");
    bool hasText = textIt != p.end() && !textIt->second.empty();
    auto labelIt = p.find("label");
    bool hasLabel = labelIt != p.end() && !labelIt->second.empty();

    if (hasText || hasLabel) {
      const std::string& txt = hasText ? textIt->second : labelIt->second;
      g_commandList.addText(node.x, node.y, txt.c_str(), r, g, b, 255, 14.0f);
    } else {
      g_commandList.addRect(node.x, node.y, node.w, node.h, r, g, b, a, radius, node.opacity / 255.0f);
    }
  });
}

/* ─── Embound API ─── */

uint32_t jsAddNode(int type, int parentIdx) {
  return g_sceneGraph.addNode(static_cast<NodeType>(type), parentIdx);
}

void jsRemoveNode(uint32_t id) {
  g_sceneGraph.removeNode(id);
}

void jsMoveNode(uint32_t id, int newParentIdx, int index) {
  g_sceneGraph.moveNode(id, newParentIdx, index);
}

void jsUpdateProp(uint32_t id, const std::string& key, const std::string& value) {
  g_sceneGraph.updateProp(id, key, value);
}

void jsSetBounds(uint32_t id, float x, float y, float w, float h) {
  g_sceneGraph.setBounds(id, x, y, w, h);
}

uint32_t jsNodeCount() {
  return static_cast<uint32_t>(g_sceneGraph.totalNodes());
}

/* ─── Export the draw command buffer to JS ───
   Returns a pointer + size so JS can read via HEAPU8 */
struct CommandBufferInfo {
  uintptr_t ptr;
  size_t size;
};

CommandBufferInfo jsGetCommandBuffer() {
  rebuildCommands();
  const auto& cmds = g_commandList.commands();
  size_t bytes = cmds.size() * sizeof(DrawCommand);
  return { reinterpret_cast<uintptr_t>(cmds.data()), bytes };
}

uint32_t jsCommandCount() {
  return static_cast<uint32_t>(g_commandList.size());
}

/* ─── Serialization ─── */
val jsSerialize() {
  auto data = g_sceneGraph.serialize();
  return val(typed_memory_view(data.size(), data.data()));
}

void jsDeserialize(val buffer) {
  size_t len = buffer["byteLength"].as<size_t>();
  if (len == 0) return;
  std::vector<uint8_t> data(len);
  val view = val::module_property("HEAPU8").call<val>("slice",
    buffer["ptr"].as<uintptr_t>(),
    buffer["ptr"].as<uintptr_t>() + len);
  for (size_t i = 0; i < len; ++i) {
    data[i] = view[i].as<uint8_t>();
  }
  g_sceneGraph.deserialize(data);
}

void jsReset() {
  g_sceneGraph = SceneGraph();
  g_commandList.clear();
}

/* ─── Register bindings ─── */
EMSCRIPTEN_BINDINGS(ui_design_engine) {
  value_object<CommandBufferInfo>("CommandBufferInfo")
    .field("ptr", &CommandBufferInfo::ptr)
    .field("size", &CommandBufferInfo::size);

  function("addNode", &jsAddNode);
  function("removeNode", &jsRemoveNode);
  function("moveNode", &jsMoveNode);
  function("updateProp", &jsUpdateProp);
  function("setBounds", &jsSetBounds);
  function("nodeCount", &jsNodeCount);
  function("getCommandBuffer", &jsGetCommandBuffer, allow_raw_pointers());
  function("commandCount", &jsCommandCount);
  function("serialize", &jsSerialize);
  function("deserialize", &jsDeserialize);
  function("reset", &jsReset);
}
